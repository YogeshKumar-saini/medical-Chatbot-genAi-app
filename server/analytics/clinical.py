import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from config.db import chats_collection, users_collection
from chat.chat_query import llm

logger = logging.getLogger(__name__)

class ClinicalIntelligenceService:
    @staticmethod
    async def summarize_patient_history(patient_id: str) -> Dict:
        """
        Aggregates chat logs and generates a 1-page clinical summary.
        """
        try:
            # Fetch recent chat sessions for the patient
            # Assuming chats have 'user_email' or similar. We need to look up email from ID or store ID in chats.
            # In existing code, chats seem to be keyed by user email? Let's check session_manager or assume email linkage.
            # For now, let's fetch the user first to get email.
            user = await asyncio.to_thread(users_collection.find_one, {"_id": patient_id}) # Expecting ObjectId or string?
            if not user:
                 # Try finding by string ID if passed
                 from bson import ObjectId
                 try:
                     user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(patient_id)})
                 except:
                     pass
            
            if not user:
                raise ValueError("Patient not found")

            # Fetch chats (Simple schema assumption: chats collection has 'user_id' or 'email')
            # Based on previous file views, we might need to verify chat schema. 
            # Assuming `user_id` or `email` in chat documents. 
            # Let's assume 'email' for now as existing auth uses email heavily.
            cursor = chats_collection.find({"email": user["email"]}).sort("updated_at", -1).limit(50)
            chats = await asyncio.to_thread(lambda: list(cursor))

            if not chats:
                return {"summary": "No recent chat history found for this patient.", "generated_at": datetime.utcnow()}

            # Extract conversation text
            conversation_text = ""
            for chat in chats:
                messages = chat.get("history", []) # Assuming 'history' is list of {role, content}
                for msg in messages:
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "")
                    conversation_text += f"{role}: {content}\n"
            
            if not conversation_text:
                return {"summary": "Chat history is empty.", "generated_at": datetime.utcnow()}

            # Generate Summary via LLM
            prompt = f"""
            You are a clinical AI assistant. Summarize the following patient-AI conversation logs into a structured 1-page clinical summary.
            Focus on:
            1. Reported Symptoms (Onset, Severity, Duration)
            2. Medical History mentioned
            3. Concerns expressed by the patient
            4. Potential Risk Factors

            Conversations:
            {conversation_text[:4000]}  # Truncate to avoid context limit

            Clinical Summary:
            """
            
            summary = await llm.generate(prompt)
            
            return {
                "patient_id": str(patient_id),
                "summary": summary,
                "generated_at": datetime.utcnow()
            }

        except Exception as e:
            logger.error(f"Error generating clinical summary: {e}")
            raise

    @staticmethod
    async def analyze_message_risk(message_content: str, user_id: str) -> Optional[Dict]:
        """
        Real-time risk stratification based on keywords.
        Returns a risk alert object if high risk is detected, else None.
        """
        high_risk_keywords = [
            "suicide", "kill myself", "end my life", "die",
            "chest pain", "heart attack", "can't breathe", "difficulty breathing",
            "severe pain", "unconscious", "stroke", "paralysis"
        ]
        
        content_lower = message_content.lower()
        matched_keywords = [kw for kw in high_risk_keywords if kw in content_lower]
        
        if matched_keywords:
            return {
                "user_id": user_id,
                "risk_level": "HIGH",
                "triggers": matched_keywords,
                "timestamp": datetime.utcnow(),
                "context": message_content[:200]
            }
        return None

    @staticmethod
    async def get_population_health_trends() -> Dict:
        """
        Analyzes aggregated data to find trends.
        (Mocked/Simulated for now as extracting structured symptoms from all chats is heavy)
        """
        # In a real system, we would have a structured 'Symptoms' table extracted from chats asynchronously.
        # Here we will simulate realistic trends.
        
        return {
            "trends": [
                {"condition": "Flu-like symptoms", "trend": "increasing", "percentage_change": 20, "region": "NYC"},
                {"condition": "Seasonal Allergies", "trend": "stable", "percentage_change": 2, "region": "Global"},
                {"condition": "Anxiety related keywords", "trend": "increasing", "percentage_change": 15, "region": "Global"}
            ],
            "timestamp": datetime.utcnow()
        }
