import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId

from config.db import db

logger = logging.getLogger(__name__)

stories_collection = db["stories"] if db is not None else None

# Create TTL index for auto-deletion
try:
    stories_collection.create_index("expires_at", expireAfterSeconds=0)
    logger.info("✅ Stories TTL index created")
except Exception as e:
    logger.warning(f"Stories TTL index may already exist: {e}")

class StoryService:
    """Service for stories (24h expiring posts)"""
    
    @staticmethod
    async def create_story(
        user_id: str,
        media_url: str,
        media_type: str,
        caption: Optional[str] = None
    ) -> Optional[str]:
        """Create a story (expires in 24 hours)"""
        try:
            now = datetime.utcnow()
            expires_at = now + timedelta(hours=24)
            
            story_doc = {
                "user_id": user_id,
                "media_url": media_url,
                "media_type": media_type,
                "caption": caption,
                "views": [],
                "created_at": now,
                "expires_at": expires_at
            }
            
            result = await asyncio.to_thread(stories_collection.insert_one, story_doc)
            story_id = str(result.inserted_id)
            
            logger.info(f"✅ Created story {story_id} for user {user_id}")
            return story_id
        
        except Exception as e:
            logger.error(f"Failed to create story: {e}")
            return None
    
    @staticmethod
    async def get_user_stories(user_id: str) -> List[dict]:
        """Get active stories from a user"""
        try:
            now = datetime.utcnow()
            
            cursor = stories_collection.find({
                "user_id": user_id,
                "expires_at": {"$gt": now}
            }).sort("created_at", -1)
            
            stories = await asyncio.to_thread(lambda: list(cursor))
            
            return [
                {
                    "id": str(s["_id"]),
                    "user_id": s["user_id"],
                    "media_url": s["media_url"],
                    "media_type": s["media_type"],
                    "caption": s.get("caption"),
                    "view_count": len(s.get("views", [])),
                    "created_at": s["created_at"],
                    "expires_at": s["expires_at"]
                }
                for s in stories
            ]
        
        except Exception as e:
            logger.error(f"Failed to get user stories: {e}")
            return []
    
    @staticmethod
    async def get_feed_stories(user_id: str) -> List[dict]:
        """Get stories from users being followed"""
        try:
            # Get following list
            from profiles.follow_service import FollowService
            following = await FollowService.get_following(user_id)
            following_ids = [f["user_id"] for f in following]
            
            if not following_ids:
                return []
            
            now = datetime.utcnow()
            
            # Get stories from following
            cursor = stories_collection.find({
                "user_id": {"$in": following_ids},
                "expires_at": {"$gt": now}
            }).sort("created_at", -1)
            
            stories = await asyncio.to_thread(lambda: list(cursor))
            
            # Get user details
            from config.db import users_collection
            from profiles.service import profiles_collection
            
            user_ids = list(set(s["user_id"] for s in stories))
            cursor = users_collection.find({"_id": {"$in": [ObjectId(uid) for uid in user_ids]}})
            users = await asyncio.to_thread(lambda: list(cursor))
            user_map = {str(u["_id"]): u for u in users}
            
            cursor = profiles_collection.find({"user_id": {"$in": user_ids}})
            profiles = await asyncio.to_thread(lambda: list(cursor))
            profile_map = {p["user_id"]: p for p in profiles}
            
            result = []
            for s in stories:
                user = user_map.get(s["user_id"], {})
                profile = profile_map.get(s["user_id"], {})
                
                result.append({
                    "id": str(s["_id"]),
                    "user_id": s["user_id"],
                    "user_name": user.get("name", "Unknown"),
                    "user_avatar": profile.get("avatar_url"),
                    "media_url": s["media_url"],
                    "media_type": s["media_type"],
                    "caption": s.get("caption"),
                    "view_count": len(s.get("views", [])),
                    "viewed_by_me": user_id in s.get("views", []),
                    "created_at": s["created_at"],
                    "expires_at": s["expires_at"]
                })
            
            return result
        
        except Exception as e:
            logger.error(f"Failed to get feed stories: {e}")
            return []
    
    @staticmethod
    async def view_story(story_id: str, viewer_id: str) -> bool:
        """Mark story as viewed"""
        try:
            result = await asyncio.to_thread(
                stories_collection.update_one,
                {"_id": ObjectId(story_id)},
                {"$addToSet": {"views": viewer_id}}
            )
            
            return result.modified_count > 0
        
        except Exception as e:
            logger.error(f"Failed to view story: {e}")
            return False
    
    @staticmethod
    async def delete_story(story_id: str, user_id: str) -> bool:
        """Delete own story"""
        try:
            result = await asyncio.to_thread(
                stories_collection.delete_one,
                {"_id": ObjectId(story_id), "user_id": user_id}
            )
            
            return result.deleted_count > 0
        
        except Exception as e:
            logger.error(f"Failed to delete story: {e}")
            return False
