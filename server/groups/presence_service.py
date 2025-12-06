import asyncio
import logging
from datetime import datetime, timedelta
from typing import Set, Optional

logger = logging.getLogger(__name__)

# In-memory presence tracking (use Redis in production)
_online_users: dict[str, datetime] = {}  # {user_id: last_heartbeat}
_user_groups: dict[str, Set[str]] = {}  # {user_id: {group_ids}}

class PresenceService:
    """Service for tracking user online status"""
    
    @staticmethod
    async def set_online(user_id: str, group_id: Optional[str] = None):
        """Mark user as online"""
        _online_users[user_id] = datetime.utcnow()
        
        if group_id:
            if user_id not in _user_groups:
                _user_groups[user_id] = set()
            _user_groups[user_id].add(group_id)
        
        logger.info(f"✅ User {user_id} is online")
    
    @staticmethod
    async def set_offline(user_id: str, group_id: Optional[str] = None):
        """Mark user as offline"""
        if user_id in _online_users:
            del _online_users[user_id]
        
        if group_id and user_id in _user_groups:
            _user_groups[user_id].discard(group_id)
            if not _user_groups[user_id]:
                del _user_groups[user_id]
        
        logger.info(f"❌ User {user_id} is offline")
    
    @staticmethod
    async def heartbeat(user_id: str):
        """Update user's last heartbeat"""
        if user_id in _online_users:
            _online_users[user_id] = datetime.utcnow()
    
    @staticmethod
    async def is_online(user_id: str) -> bool:
        """Check if user is online (within last 5 minutes)"""
        if user_id not in _online_users:
            return False
        
        last_seen = _online_users[user_id]
        grace_period = timedelta(minutes=5)
        
        return (datetime.utcnow() - last_seen) < grace_period
    
    @staticmethod
    async def get_online_users(group_id: str) -> Set[str]:
        """Get set of online users in a group"""
        from .websocket_manager import manager
        return manager.get_online_users(group_id)
    
    @staticmethod
    async def cleanup_stale_connections():
        """
        Background task to clean up stale connections.
        Run this periodically (e.g., every 5 minutes).
        """
        now = datetime.utcnow()
        grace_period = timedelta(minutes=5)
        
        stale_users = [
            user_id for user_id, last_seen in _online_users.items()
            if (now - last_seen) > grace_period
        ]
        
        for user_id in stale_users:
            await PresenceService.set_offline(user_id)
        
        if stale_users:
            logger.info(f"🧹 Cleaned up {len(stale_users)} stale connections")
        
        return len(stale_users)
    
    @staticmethod
    async def get_last_seen(user_id: str) -> Optional[datetime]:
        """Get user's last seen timestamp"""
        return _online_users.get(user_id)
