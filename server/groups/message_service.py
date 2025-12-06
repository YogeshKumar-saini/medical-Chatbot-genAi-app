import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Dict
from bson import ObjectId

from .db_collections import group_messages_collection, group_members_collection
from .models import MessageType, MessageCreate, MessageEdit, Reaction
from .permissions import can_send_message, can_delete_message

logger = logging.getLogger(__name__)

# Simple in-memory rate limiting (in production, use Redis)
_message_counts = {}  # {user_id: [(timestamp, count), ...]}

class MessageService:
    """Service for group messaging operations"""
    
    @staticmethod
    async def send_message(
        group_id: str,
        sender_id: str,
        message_data: MessageCreate
    ) -> Optional[Dict]:
        """Send a message to a group"""
        try:
            # Check permissions
            if not await can_send_message(sender_id, group_id):
                logger.warning(f"User {sender_id} cannot send message to group {group_id}")
                return None
            
            # Rate limiting check
            if not MessageService._check_rate_limit(sender_id):
                logger.warning(f"Rate limit exceeded for user {sender_id}")
                return None
            
            # Create message document
            message_doc = {
                "group_id": group_id,
                "sender_id": sender_id,
                "content": message_data.content,
                "type": message_data.type.value,
                "media_urls": message_data.media_urls or [],
                "reply_to": message_data.reply_to,
                "reactions": [],
                "edited": False,
                "deleted": False,
                "created_at": datetime.utcnow()
            }
            
            result = await asyncio.to_thread(
                group_messages_collection.insert_one,
                message_doc
            )
            
            message_id = str(result.inserted_id)
            
            logger.info(f"✅ Message {message_id} sent to group {group_id}")
            
            return {
                "id": message_id,
                **message_doc
            }
            
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            return None
    
    @staticmethod
    async def get_messages(
        group_id: str,
        user_id: str,
        page: int = 1,
        limit: int = 50
    ) -> Dict:
        """Get paginated messages from a group"""
        try:
            # Check if user is member
            from .permissions import is_group_member
            if not await is_group_member(user_id, group_id):
                return {"messages": [], "total": 0, "page": page, "has_more": False}
            
            # Calculate skip
            skip = (page - 1) * limit
            
            # Get total count
            total = await asyncio.to_thread(
                group_messages_collection.count_documents,
                {"group_id": group_id, "deleted": False}
            )
            
            # Get messages (newest first)
            cursor = group_messages_collection.find(
                {"group_id": group_id, "deleted": False}
            ).sort("created_at", -1).skip(skip).limit(limit)
            
            messages = await asyncio.to_thread(lambda: list(cursor))
            
            # Reverse to show oldest first in the page
            messages.reverse()
            
            return {
                "messages": [
                    {
                        "id": str(m["_id"]),
                        "group_id": m["group_id"],
                        "sender_id": m["sender_id"],
                        "content": m["content"],
                        "type": m["type"],
                        "media_urls": m.get("media_urls", []),
                        "reply_to": m.get("reply_to"),
                        "reactions": m.get("reactions", []),
                        "edited": m.get("edited", False),
                        "created_at": m["created_at"]
                    }
                    for m in messages
                ],
                "total": total,
                "page": page,
                "has_more": (skip + limit) < total
            }
            
        except Exception as e:
            logger.error(f"Failed to get messages: {e}")
            return {"messages": [], "total": 0, "page": page, "has_more": False}
    
    @staticmethod
    async def delete_message(message_id: str, user_id: str) -> bool:
        """Delete a message (soft delete)"""
        try:
            # Get message
            message = await asyncio.to_thread(
                group_messages_collection.find_one,
                {"_id": ObjectId(message_id)}
            )
            
            if not message:
                return False
            
            # Check permissions
            if not await can_delete_message(user_id, message):
                logger.warning(f"User {user_id} cannot delete message {message_id}")
                return False
            
            # Soft delete
            result = await asyncio.to_thread(
                group_messages_collection.update_one,
                {"_id": ObjectId(message_id)},
                {"$set": {"deleted": True, "content": "[Message deleted]"}}
            )
            
            logger.info(f"✅ Deleted message {message_id}")
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Failed to delete message: {e}")
            return False
    
    @staticmethod
    async def edit_message(
        message_id: str,
        user_id: str,
        new_content: str
    ) -> bool:
        """Edit a message (own messages only)"""
        try:
            # Get message
            message = await asyncio.to_thread(
                group_messages_collection.find_one,
                {"_id": ObjectId(message_id)}
            )
            
            if not message:
                return False
            
            # Only sender can edit
            if message["sender_id"] != user_id:
                return False
            
            # Update message
            result = await asyncio.to_thread(
                group_messages_collection.update_one,
                {"_id": ObjectId(message_id)},
                {"$set": {"content": new_content, "edited": True}}
            )
            
            logger.info(f"✅ Edited message {message_id}")
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Failed to edit message: {e}")
            return False
    
    @staticmethod
    async def add_reaction(
        message_id: str,
        user_id: str,
        emoji: str
    ) -> bool:
        """Add a reaction to a message"""
        try:
            # Check if reaction already exists
            message = await asyncio.to_thread(
                group_messages_collection.find_one,
                {"_id": ObjectId(message_id)}
            )
            
            if not message:
                return False
            
            reactions = message.get("reactions", [])
            
            # Remove existing reaction from this user with same emoji
            reactions = [
                r for r in reactions 
                if not (r["user_id"] == user_id and r["emoji"] == emoji)
            ]
            
            # Add new reaction
            reactions.append({"user_id": user_id, "emoji": emoji})
            
            result = await asyncio.to_thread(
                group_messages_collection.update_one,
                {"_id": ObjectId(message_id)},
                {"$set": {"reactions": reactions}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Failed to add reaction: {e}")
            return False
    
    @staticmethod
    async def remove_reaction(
        message_id: str,
        user_id: str,
        emoji: str
    ) -> bool:
        """Remove a reaction from a message"""
        try:
            message = await asyncio.to_thread(
                group_messages_collection.find_one,
                {"_id": ObjectId(message_id)}
            )
            
            if not message:
                return False
            
            reactions = message.get("reactions", [])
            
            # Remove reaction
            reactions = [
                r for r in reactions 
                if not (r["user_id"] == user_id and r["emoji"] == emoji)
            ]
            
            result = await asyncio.to_thread(
                group_messages_collection.update_one,
                {"_id": ObjectId(message_id)},
                {"$set": {"reactions": reactions}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Failed to remove reaction: {e}")
            return False
    
    @staticmethod
    def _check_rate_limit(user_id: str, max_messages: int = 10, window_seconds: int = 60) -> bool:
        """
        Simple rate limiting: max 10 messages per minute.
        In production, use Redis for distributed rate limiting.
        """
        now = datetime.utcnow()
        
        if user_id not in _message_counts:
            _message_counts[user_id] = []
        
        # Clean old entries
        _message_counts[user_id] = [
            ts for ts in _message_counts[user_id]
            if (now - ts).total_seconds() < window_seconds
        ]
        
        # Check limit
        if len(_message_counts[user_id]) >= max_messages:
            return False
        
        # Add current timestamp
        _message_counts[user_id].append(now)
        return True
