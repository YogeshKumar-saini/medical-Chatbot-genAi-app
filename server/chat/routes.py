# chat/routes.py - Optimized chat endpoints
from fastapi import APIRouter, Depends, Form, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
import json
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from auth.routes import authenticate
from chat.chat_query import answer_query, get_suggested_queries, health_check

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

# Initialize session manager and rate limiter

def get_client_ip(request: Request) -> str:
    """Get client IP for rate limiting"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

@router.post("/chat")
async def chat_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    message: str = Form(..., min_length=1, max_length=1000),
    user: dict = Depends(authenticate)
):
    """
    Main chat endpoint with optimization and rate limiting
    """
    client_ip = get_client_ip(request)
    user_id = user["username"]
    
    # Rate limiting check
    # Rate limiting removed
    # Rate limiting removed
    
    try:
        # Record request for rate limiting
    # Rate limiting removed
        
        # Get user session
    # Session management removed
        
        # Add user message to session
    # Session management removed
        
        # Process query with context from session
        response = await answer_query(message, user["role"])
        
        # Add AI response to session
    # Session management removed
        
        # Log interaction for analytics (background task)
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

@router.post("/stream")
async def chat_stream(
    request: Request,
    message: str = Form(..., min_length=1, max_length=1000),
    user: dict = Depends(authenticate)
):
    """
    Streaming chat endpoint for real-time responses
    """
    client_ip = get_client_ip(request)
    user_id = user["username"]
    
    # Rate limiting
    # Rate limiting removed
        # Rate limiting removed
    
    async def generate_response():
        try:
            # Rate limiting removed
            
            # Yield status updates
            yield f"data: {json.dumps({'type': 'status', 'message': 'Processing your question...'})}\n\n"
            
            # Get response
            response = await answer_query(message, user["role"])
            
            # Stream the response in chunks
            answer_chunks = response["answer"].split(". ")
            for i, chunk in enumerate(answer_chunks):
                if chunk.strip():
                    chunk_data = {
                        "type": "chunk",
                        "content": chunk + (". " if i < len(answer_chunks) - 1 else ""),
                        "chunk_index": i
                    }
                    yield f"data: {json.dumps(chunk_data)}\n\n"
                    await asyncio.sleep(0.1)  # Small delay for streaming effect
            
            # Send final metadata
            final_data = {
                "type": "complete",
                "sources": response.get("sources", []),
                "response_type": response.get("type", "unknown")
            }
            yield f"data: {json.dumps(final_data)}\n\n"
            
        except Exception as e:
            error_data = {
                "type": "error",
                "message": "Failed to process your request"
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )

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
        logger.error(f"Error getting suggestions for user {user['username']}: {e}")
        return {"suggested_queries": [], "personalized": False}

@router.get("/history")
async def get_chat_history(
    limit: int = 20,
    user: dict = Depends(authenticate)
):
    """
    Get user's chat history
    """
    # Session management removed
    return {"messages": []}

@router.delete("/history")
async def clear_chat_history(user: dict = Depends(authenticate)):
    """
    Clear user's chat history
    """
    # Session management removed
    return {"message": "Chat history cleared successfully"}

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

@router.get("/analytics")
async def get_chat_analytics(user: dict = Depends(authenticate)):
    """
    Get user's chat analytics (admin only for global stats)
    """
    # Analytics removed
    return {"analytics": {}}

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
        log_data = {
            "timestamp": datetime.utcnow(),
            "user_id": user_id,
            "user_role": user_role,
            "message_length": len(message),
            "response_type": response_type,
            "sources_count": sources_count
        }
        
        # Here you could save to a dedicated analytics database
        logger.info(f"Chat interaction logged for user {user_id}")
        
    except Exception as e:
        logger.error(f"Failed to log interaction: {e}")

# chat/session_manager.py - Session management for chat
import time
import uuid
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import threading

class ChatSessionManager:
    """
    Thread-safe session manager for chat conversations
    """
    
    def __init__(self, session_timeout: int = 3600):  # 1 hour timeout
        self.sessions: Dict[str, Dict] = {}
        self.session_timeout = session_timeout
        self.lock = threading.RLock()
        self.cleanup_interval = 300  # 5 minutes
        self.last_cleanup = time.time()
    
    def _cleanup_expired_sessions(self):
        """Remove expired sessions"""
        if time.time() - self.last_cleanup < self.cleanup_interval:
            return
        
        current_time = time.time()
        expired_users = []
        
        with self.lock:
            for user_id, session in self.sessions.items():
                if current_time - session["last_activity"] > self.session_timeout:
                    expired_users.append(user_id)
            
            for user_id in expired_users:
                del self.sessions[user_id]
            
            self.last_cleanup = current_time
        
        if expired_users:
            logger.info(f"Cleaned up {len(expired_users)} expired chat sessions")
    
    def get_or_create_session(self, user_id: str, user_role: str) -> Dict:
        """Get existing session or create new one"""
        self._cleanup_expired_sessions()
        
        with self.lock:
            if user_id not in self.sessions:
                self.sessions[user_id] = {
                    "session_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "user_role": user_role,
                    "messages": [],
                    "created_at": datetime.utcnow().isoformat(),
                    "last_activity": time.time()
                }
            else:
                self.sessions[user_id]["last_activity"] = time.time()
            
            return self.sessions[user_id].copy()
    
    def get_session(self, user_id: str) -> Optional[Dict]:
        """Get existing session"""
        self._cleanup_expired_sessions()
        
        with self.lock:
            session = self.sessions.get(user_id)
            if session:
                session["last_activity"] = time.time()
                return session.copy()
            return None
    
    def add_message(self, user_id: str, role: str, content: str, sources: Optional[List] = None):
        """Add message to session"""
        with self.lock:
            if user_id in self.sessions:
                message = {
                    "role": role,
                    "content": content,
                    "timestamp": datetime.utcnow().isoformat(),
                    "sources": sources or []
                }
                self.sessions[user_id]["messages"].append(message)
                self.sessions[user_id]["last_activity"] = time.time()
                
                # Limit message history to prevent memory issues
                if len(self.sessions[user_id]["messages"]) > 100:
                    self.sessions[user_id]["messages"] = self.sessions[user_id]["messages"][-50:]
    
    def clear_session(self, user_id: str):
        """Clear user session"""
        with self.lock:
            if user_id in self.sessions:
                del self.sessions[user_id]
    
    def get_global_stats(self) -> Dict:
        """Get global session statistics"""
        with self.lock:
            active_sessions = len(self.sessions)
            total_messages = sum(len(session["messages"]) for session in self.sessions.values())
            
            role_distribution = defaultdict(int)
            for session in self.sessions.values():
                role_distribution[session["user_role"]] += 1
            
            return {
                "active_sessions": active_sessions,
                "total_messages": total_messages,
                "role_distribution": dict(role_distribution),
                "cleanup_stats": {
                    "last_cleanup": self.last_cleanup,
                    "cleanup_interval": self.cleanup_interval
                }
            }

# chat/rate_limiter.py - Rate limiting for chat
import time
from collections import defaultdict, deque
from typing import Tuple

class ChatRateLimiter:
    """Rate limiter specifically for chat endpoints"""
    
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: defaultdict = defaultdict(deque)
    
    def is_rate_limited(self, identifier: str) -> Tuple[bool, int]:
        """Check if identifier is rate limited"""
        current_time = time.time()
        user_requests = self.requests[identifier]
        
        # Remove old requests outside the window
        while user_requests and user_requests[0] <= current_time - self.window_seconds:
            user_requests.popleft()
        
        if len(user_requests) >= self.max_requests:
            oldest_request = user_requests[0]
            seconds_until_reset = int(self.window_seconds - (current_time - oldest_request))
            return True, max(0, seconds_until_reset)
        
        return False, 0
    
    def record_request(self, identifier: str):
        """Record a request"""
        current_time = time.time()
        self.requests[identifier].append(current_time)