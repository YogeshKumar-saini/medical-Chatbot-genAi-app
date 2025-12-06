import asyncio
import logging
from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from config.db import db

logger = logging.getLogger(__name__)

# Collections
profiles_collection = db["user_profiles"]
follows_collection = db["user_follows"]

class ProfileService:
    """Service for user profile operations"""
    
    @staticmethod
    async def get_or_create_profile(user_id: str) -> dict:
        """Get user profile or create if doesn't exist"""
        try:
            profile = await asyncio.to_thread(
                profiles_collection.find_one,
                {"user_id": user_id}
            )
            
            if not profile:
                # Create default profile
                profile_doc = {
                    "user_id": user_id,
                    "avatar_url": None,
                    "cover_url": None,
                    "bio": None,
                    "status_text": None,
                    "verified": False,
                    "followers_count": 0,
                    "following_count": 0,
                    "privacy": {
                        "show_last_seen": "EVERYONE",
                        "allow_stories": True,
                        "show_online_status": True
                    },
                    "last_seen": datetime.utcnow(),
                    "online": False,
                    "created_at": datetime.utcnow()
                }
                
                result = await asyncio.to_thread(
                    profiles_collection.insert_one,
                    profile_doc
                )
                
                profile = profile_doc
                profile["_id"] = result.inserted_id
                
                logger.info(f"✅ Created profile for user {user_id}")
            
            return {
                "id": str(profile["_id"]),
                "user_id": profile["user_id"],
                "avatar_url": profile.get("avatar_url"),
                "cover_url": profile.get("cover_url"),
                "bio": profile.get("bio"),
                "status_text": profile.get("status_text"),
                "verified": profile.get("verified", False),
                "followers_count": profile.get("followers_count", 0),
                "following_count": profile.get("following_count", 0),
                "privacy": profile.get("privacy", {}),
                "last_seen": profile.get("last_seen"),
                "online": profile.get("online", False),
                "created_at": profile.get("created_at")
            }
        
        except Exception as e:
            logger.error(f"Failed to get profile: {e}")
            return None
    
    @staticmethod
    async def update_profile(user_id: str, updates: dict) -> bool:
        """Update user profile"""
        try:
            # Ensure profile exists
            await ProfileService.get_or_create_profile(user_id)
            
            result = await asyncio.to_thread(
                profiles_collection.update_one,
                {"user_id": user_id},
                {"$set": updates}
            )
            
            return result.modified_count > 0
        
        except Exception as e:
            logger.error(f"Failed to update profile: {e}")
            return False
    
    @staticmethod
    async def update_avatar(user_id: str, avatar_url: str) -> bool:
        """Update user avatar"""
        return await ProfileService.update_profile(user_id, {"avatar_url": avatar_url})
    
    @staticmethod
    async def set_online_status(user_id: str, online: bool):
        """Update user online status"""
        updates = {
            "online": online,
            "last_seen": datetime.utcnow()
        }
        await ProfileService.update_profile(user_id, updates)
