import asyncio
import logging
from datetime import datetime
from typing import List
from bson import ObjectId

from .service import profiles_collection, follows_collection

logger = logging.getLogger(__name__)

class FollowService:
    """Service for follow/unfollow operations"""
    
    @staticmethod
    async def follow_user(follower_id: str, target_id: str) -> bool:
        """Follow a user"""
        try:
            if follower_id == target_id:
                return False  # Can't follow yourself
            
            # Check if already following
            existing = await asyncio.to_thread(
                follows_collection.find_one,
                {"follower_id": follower_id, "following_id": target_id}
            )
            
            if existing:
                return True  # Already following
            
            # Create follow relationship
            follow_doc = {
                "follower_id": follower_id,
                "following_id": target_id,
                "created_at": datetime.utcnow()
            }
            
            await asyncio.to_thread(follows_collection.insert_one, follow_doc)
            
            # Update counts
            await asyncio.to_thread(
                profiles_collection.update_one,
                {"user_id": follower_id},
                {"$inc": {"following_count": 1}}
            )
            
            await asyncio.to_thread(
                profiles_collection.update_one,
                {"user_id": target_id},
                {"$inc": {"followers_count": 1}}
            )
            
            logger.info(f"✅ {follower_id} followed {target_id}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to follow user: {e}")
            return False
    
    @staticmethod
    async def unfollow_user(follower_id: str, target_id: str) -> bool:
        """Unfollow a user"""
        try:
            result = await asyncio.to_thread(
                follows_collection.delete_one,
                {"follower_id": follower_id, "following_id": target_id}
            )
            
            if result.deleted_count > 0:
                # Update counts
                await asyncio.to_thread(
                    profiles_collection.update_one,
                    {"user_id": follower_id},
                    {"$inc": {"following_count": -1}}
                )
                
                await asyncio.to_thread(
                    profiles_collection.update_one,
                    {"user_id": target_id},
                    {"$inc": {"followers_count": -1}}
                )
                
                logger.info(f"✅ {follower_id} unfollowed {target_id}")
                return True
            
            return False
        
        except Exception as e:
            logger.error(f"Failed to unfollow user: {e}")
            return False
    
    @staticmethod
    async def get_followers(user_id: str) -> List[dict]:
        """Get list of followers"""
        try:
            cursor = follows_collection.find({"following_id": user_id})
            follows = await asyncio.to_thread(lambda: list(cursor))
            
            follower_ids = [f["follower_id"] for f in follows]
            
            if not follower_ids:
                return []
            
            # Get user details
            from config.db import users_collection
            cursor = users_collection.find({"_id": {"$in": [ObjectId(uid) for uid in follower_ids]}})
            users = await asyncio.to_thread(lambda: list(cursor))
            
            # Get profiles
            cursor = profiles_collection.find({"user_id": {"$in": follower_ids}})
            profiles = await asyncio.to_thread(lambda: list(cursor))
            profile_map = {p["user_id"]: p for p in profiles}
            
            result = []
            for user in users:
                user_id = str(user["_id"])
                profile = profile_map.get(user_id, {})
                result.append({
                    "user_id": user_id,
                    "name": user.get("name", "Unknown"),
                    "avatar_url": profile.get("avatar_url"),
                    "verified": profile.get("verified", False)
                })
            
            return result
        
        except Exception as e:
            logger.error(f"Failed to get followers: {e}")
            return []
    
    @staticmethod
    async def get_following(user_id: str) -> List[dict]:
        """Get list of users being followed"""
        try:
            cursor = follows_collection.find({"follower_id": user_id})
            follows = await asyncio.to_thread(lambda: list(cursor))
            
            following_ids = [f["following_id"] for f in follows]
            
            if not following_ids:
                return []
            
            # Get user details
            from config.db import users_collection
            cursor = users_collection.find({"_id": {"$in": [ObjectId(uid) for uid in following_ids]}})
            users = await asyncio.to_thread(lambda: list(cursor))
            
            # Get profiles
            cursor = profiles_collection.find({"user_id": {"$in": following_ids}})
            profiles = await asyncio.to_thread(lambda: list(cursor))
            profile_map = {p["user_id"]: p for p in profiles}
            
            result = []
            for user in users:
                user_id = str(user["_id"])
                profile = profile_map.get(user_id, {})
                result.append({
                    "user_id": user_id,
                    "name": user.get("name", "Unknown"),
                    "avatar_url": profile.get("avatar_url"),
                    "verified": profile.get("verified", False)
                })
            
            return result
        
        except Exception as e:
            logger.error(f"Failed to get following: {e}")
            return []
    
    @staticmethod
    async def is_following(follower_id: str, target_id: str) -> bool:
        """Check if user is following another user"""
        try:
            follow = await asyncio.to_thread(
                follows_collection.find_one,
                {"follower_id": follower_id, "following_id": target_id}
            )
            return follow is not None
        
        except Exception as e:
            logger.error(f"Failed to check following status: {e}")
            return False
