from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
import logging
from datetime import datetime, timedelta

from auth.routes import authenticate
from config.db import chats_collection, users_collection
from chat.session_manager import ChatSessionManager
from .clinical import ClinicalIntelligenceService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analytics"])

import asyncio

@router.get("/stats")
async def get_system_stats(user: dict = Depends(authenticate)) -> Dict:
    """
    Get aggregated system statistics (Admin only)
    """
    if user["role"] not in ["SUPER_ADMIN", "GEN_ADMIN", "ORG_ADMIN", "THERAPIST", "doctor"]: # Allow doctors and admins
        raise HTTPException(403, "Insufficient permissions")
        
    try:
        # User Stats
        total_users = await asyncio.to_thread(users_collection.count_documents, {})
        
        # Chat Stats
        total_chats = await asyncio.to_thread(chats_collection.count_documents, {})
        
        # Calculate messages in last 24h
        yesterday = datetime.utcnow() - timedelta(days=1)
        active_chats_24h = await asyncio.to_thread(
            chats_collection.count_documents,
            {"updated_at": {"$gte": yesterday}}
        )
        
        return {
            "total_users": total_users,
            "total_chat_sessions": total_chats,
            "active_chats_24h": active_chats_24h,
            "system_health": "healthy", # Placeholder, could be dynamic
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(500, "Failed to fetch stats")

@router.get("/logs")
async def get_system_logs(
    limit: int = 50,
    user: dict = Depends(authenticate)
):
    """
    Get recent system logs (Simulated for now, normally would query a logs DB)
    """
    if user["role"] not in ["SUPER_ADMIN", "GEN_ADMIN", "ORG_ADMIN"]:
        raise HTTPException(403, "Admin access required")

    return {
        "logs": [
            {"timestamp": datetime.utcnow().isoformat(), "level": "INFO", "message": "System check passed"},
            {"timestamp": (datetime.utcnow() - timedelta(minutes=5)).isoformat(), "level": "INFO", "message": "New user registered"},
            {"timestamp": (datetime.utcnow() - timedelta(minutes=15)).isoformat(), "level": "INFO", "message": "Backup completed"},
        ]
    }


@router.get("/clinical/success")
async def clinical_success_mock():
    # Simple endpoint for testing
    return {"status": "success"}

@router.get("/clinical/summary/{patient_id}")
async def get_clinical_summary(patient_id: str, user: dict = Depends(authenticate)):
    """
    Get AI-generated clinical summary for a patient (Doctor/Admin only)
    """
    if user["role"] not in ["SUPER_ADMIN", "GEN_ADMIN", "ORG_ADMIN", "THERAPIST", "DOCTOR"]:
        raise HTTPException(403, "Insufficient permissions")
        
    try:
        summary = await ClinicalIntelligenceService.summarize_patient_history(patient_id)
        return summary
    except ValueError as ve:
        raise HTTPException(404, str(ve))
    except Exception as e:
        logger.error(f"Error in clinical summary route: {e}")
        raise HTTPException(500, "Failed to generate summary")

@router.get("/clinical/trends")
async def get_health_trends(user: dict = Depends(authenticate)):
    """
    Get population health trends (Doctor/Admin)
    """
    if user["role"] not in ["SUPER_ADMIN", "GEN_ADMIN", "ORG_ADMIN", "THERAPIST", "DOCTOR"]:
         raise HTTPException(403, "Insufficient permissions")
         
    return await ClinicalIntelligenceService.get_population_health_trends()

# Note: Risk stratification is typically triggered during chat processing, 
# but we can expose an endpoint to fetch recent high-risk flags if we stored them.
# For now, we will assume risk logic is integrated into chat flow or we can add a test endpoint.
@router.post("/clinical/analyze-risk")
async def analyze_risk_manual(
    content: dict, # {"text": "..."}
    user: dict = Depends(authenticate)
):
    """
    Test endpoint to analyze text for risk (Doctor/Admin testing)
    """
    if user["role"] not in ["SUPER_ADMIN", "GEN_ADMIN", "ORG_ADMIN", "THERAPIST", "DOCTOR"]:
         raise HTTPException(403, "Insufficient permissions")
    
    text = content.get("text", "")
    risk = await ClinicalIntelligenceService.analyze_message_risk(text, str(user["id"])) # passing requestor ID just for testing
    return {"risk_analysis": risk if risk else "No high risk detected"}
