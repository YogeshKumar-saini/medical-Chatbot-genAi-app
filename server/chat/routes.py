# chat/routes.py - Optimized chat endpoints
from fastapi import APIRouter, Depends, Form, HTTPException, Request, BackgroundTasks, status
from fastapi.responses import StreamingResponse
import json
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime

from auth.routes import authenticate
from chat.chat_query import answer_query, answer_query_stream_with_memory, get_suggested_queries, health_check, get_conversation_memory
from chat.models import CreateChatRequest, Message, ChatSession
from config.db import chats_collection
from .rate_limiter import ChatRateLimiter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chat"])

# Initialize rate limiter
rate_limiter = ChatRateLimiter(max_requests=30, window_seconds=60)

def get_client_ip(request: Request) -> str:
    """Get client IP for rate limiting"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

async def save_message_to_db(user_id: str, message: Message):
    """Save message to user's chat session"""
    if chats_collection is None:
        logger.warning("Chat collection not available")
        return

    try:
        # Update existing session or create new one
        result = await asyncio.to_thread(
            chats_collection.update_one,
            {"user_id": user_id},
            {
                "$push": {"messages": message.dict()},
                "$set": {"updated_at": datetime.utcnow()},
                "$setOnInsert": {
                    "created_at": datetime.utcnow(),
                    "title": "New Chat"
                }
            },
            upsert=True
        )
    except Exception as e:
        logger.error(f"Failed to save message: {e}")

@router.post("/chat")
async def chat_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    message: str = Form(..., min_length=1, max_length=1000),
    user: dict = Depends(authenticate)
):
    """
    Main chat endpoint with persistent storage
    """
    client_ip = get_client_ip(request)
    user_id = user["email"]
    
    # Rate limiting check
    is_limited, reset_time = await rate_limiter.is_rate_limited(user_id)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {reset_time} seconds"
        )
    
    await rate_limiter.record_request(user_id)
    
    try:
        # Save User Message
        user_msg = Message(role="user", content=message)
        await save_message_to_db(user_id, user_msg)
        
        # Process Query
        response = await answer_query(message, user["role"])
        
        # Save AI Response
        ai_msg = Message(
            role="assistant", 
            content=response["answer"],
            sources=response.get("sources", [])
        )
        await save_message_to_db(user_id, ai_msg)
        
        # Log interaction (Background)
        background_tasks.add_task(
            log_chat_interaction,
            user_id=user_id,
            user_role=user["role"],
            message=message,
            response_type=response.get("type"),
            sources_count=len(response.get("sources", []))
        )
        
        return {
            "answer": response["answer"],
            "sources": response.get("sources", []),
            "type": response.get("type", "unknown")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Chat service temporarily unavailable"
        )

@router.post("/chat/stream")
async def chat_stream_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    message: str = Form(..., min_length=1, max_length=1000),
    user: dict = Depends(authenticate)
):
    """
    Streaming chat endpoint that returns responses in real-time chunks
    """
    client_ip = get_client_ip(request)
    user_id = user["email"]

    # Rate limiting check
    is_limited, reset_time = await rate_limiter.is_rate_limited(user_id)
    if is_limited:
        async def rate_limit_generator():
            yield f"Rate limit exceeded. Try again in {reset_time} seconds"
        return StreamingResponse(
            rate_limit_generator(),
            media_type="text/plain",
            headers={"X-Accel-Buffering": "no"}
        )

    await rate_limiter.record_request(user_id)

    try:
        # Save User Message
        user_msg = Message(role="user", content=message)
        await save_message_to_db(user_id, user_msg)

        # Start streaming response
        async def generate_response():
            full_response = ""
            try:
                async for chunk in answer_query_stream_with_memory(message, user["role"], user_id):
                    full_response += chunk
                    yield chunk

                # Save complete AI Response after streaming
                ai_msg = Message(
                    role="assistant",
                    content=full_response,
                    sources=["Streaming Response"]  # Could be enhanced to extract sources
                )
                await save_message_to_db(user_id, ai_msg)

                # Log interaction (Background)
                background_tasks.add_task(
                    log_chat_interaction,
                    user_id=user_id,
                    user_role=user["role"],
                    message=message,
                    response_type="streaming",
                    sources_count=1
                )

            except Exception as e:
                logger.error(f"Streaming error for user {user_id}: {str(e)}")
                yield f"\n\nError: {str(e)}"

        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={"X-Accel-Buffering": "no"}  # Disable nginx buffering
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stream setup error for user {user_id}: {str(e)}")
        async def error_generator():
            yield "Chat service temporarily unavailable"
        return StreamingResponse(
            error_generator(),
            media_type="text/plain",
            headers={"X-Accel-Buffering": "no"}
        )

@router.get("/history")
async def get_chat_history(
    limit: int = 50,
    user: dict = Depends(authenticate)
):
    """
    Get user's persistent chat history
    """
    try:
        if chats_collection is None:
             return {"messages": []}

        session = await asyncio.to_thread(
            chats_collection.find_one,
            {"user_id": user["email"]},
            {"messages": {"$slice": -limit}} # Get last N messages
        )
        
        if session:
            return {"messages": session.get("messages", [])}
        return {"messages": []}
        
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}")
        return {"messages": []}

@router.delete("/history")
async def clear_chat_history(user: dict = Depends(authenticate)):
    """
    Clear user's persistent chat history
    """
    try:
        if chats_collection is not None:
            await asyncio.to_thread(
                chats_collection.update_one,
                {"user_id": user["email"]},
                {"$set": {"messages": [], "updated_at": datetime.utcnow()}}
            )
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear history: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear history")

@router.delete("/memory")
async def clear_conversation_memory(user: dict = Depends(authenticate)):
    """
    Clear user's conversation memory (for contextual chat)
    """
    try:
        memory = get_conversation_memory(user["email"])
        memory.clear()
        return {"message": "Conversation memory cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear memory: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear conversation memory")

@router.get("/followup")
async def get_followup_suggestions(user: dict = Depends(authenticate)):
    """
    Get contextual follow-up question suggestions based on conversation history
    """
    try:
        memory = get_conversation_memory(user["email"])
        suggestions = getattr(memory, 'followup_suggestions', [])

        # Fallback to general suggestions if no contextual ones
        if not suggestions:
            base_suggestions = get_suggested_queries()
            suggestions = base_suggestions[:3]

        return {
            "suggestions": suggestions,
            "contextual": len(getattr(memory, 'followup_suggestions', [])) > 0
        }
    except Exception as e:
        logger.error(f"Failed to get follow-up suggestions: {e}")
        return {"suggestions": [], "contextual": False}

# ... Remaining endpoints (suggestions, analytics, health, stream) kept largely same but without session manager dependency ...

# Background task for logging
async def log_chat_interaction(
    user_id: str,
    user_role: str,
    message: str,
    response_type: str,
    sources_count: int
):
    """
    Log chat interaction for analytics (background task)
    """
    try:
        # Here you could save to a dedicated analytics collection if needed
        # For now, we just log to console
        logger.info(f"Chat interaction logged for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to log interaction: {e}")

@router.get("/suggestions")
async def get_chat_suggestions(user: dict = Depends(authenticate)):
    """
    Get personalized suggested queries based on user role
    """
    try:
        base_suggestions = get_suggested_queries()
        
        # Personalize suggestions based on user role
        role_specific = {
            "patient": [
                "What symptoms should I watch for with my condition?",
                "How do I manage side effects from my medication?",
                "When should I contact my doctor?",
            ],
            "doctor": [
                "Latest treatment guidelines for diabetes management",
                "Drug interactions to check for elderly patients",
                "Evidence-based approaches for chronic pain management",
            ],
            "nurse": [
                "Patient monitoring protocols for post-surgery care",
                "Infection control best practices",
                "Documentation requirements for medication administration",
            ]
        }
        
        user_role = user["role"]
        suggestions = base_suggestions.copy()
        
        if user_role in role_specific:
            suggestions.extend(role_specific[user_role])
        
        return {
            "suggested_queries": suggestions[:10],  # Limit to 10 suggestions
            "personalized": user_role in role_specific
        }
        
    except Exception as e:
        logger.error(f"Error getting suggestions for user {user['email']}: {e}")
        return {"suggested_queries": [], "personalized": False}

@router.get("/health")
async def chat_health_check():
    """
    Health check endpoint for chat service
    """
    try:
        health_status = await health_check()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": health_status
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="Chat service unhealthy"
        )

from fastapi import UploadFile, File

from chat.multimodal import analyze_medical_image

@router.post("/analyze")
async def analyze_image_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    prompt: Optional[str] = Form("Analyze this medical image and describe findings."),
    user: dict = Depends(authenticate)
):
    """
    Analyze uploaded medical image using Gemini Vision
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(400, "Invalid file type. Please upload an image.")
        
        # Read file
        content = await file.read()
        
        # Analyze
        analysis = await analyze_medical_image(content, file.content_type, prompt)
        
        # Save interaction
        user_msg = Message(role="user", content=f"[Image Analysis] {prompt}")
        await save_message_to_db(user["email"], user_msg)
        
        ai_msg = Message(
            role="assistant", 
            content=analysis,
            sources=["Gemini Vision Analysis"]
        )
        await save_message_to_db(user["email"], ai_msg)
        
        return {
            "analysis": analysis,
            "type": "image_analysis"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(500, f"Image analysis failed: {str(e)}")
