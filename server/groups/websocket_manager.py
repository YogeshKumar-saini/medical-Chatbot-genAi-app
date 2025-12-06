import asyncio
import logging
import json
from typing import Dict, Set, Optional
from fastapi import WebSocket
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for group chats"""
    
    def __init__(self):
        # {group_id: {user_id: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # {websocket: (user_id, group_id)}
        self.connection_map: Dict[WebSocket, tuple] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str, group_id: str):
        """Register a new WebSocket connection"""
        await websocket.accept()
        
        if group_id not in self.active_connections:
            self.active_connections[group_id] = {}
        
        self.active_connections[group_id][user_id] = websocket
        self.connection_map[websocket] = (user_id, group_id)
        
        logger.info(f"✅ User {user_id} connected to group {group_id}")
        
        # Notify others that user joined
        await self.broadcast_to_group(
            group_id,
            {
                "event": "user_joined",
                "data": {
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            },
            exclude_user=user_id
        )
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket not in self.connection_map:
            return
        
        user_id, group_id = self.connection_map[websocket]
        
        # Remove from active connections
        if group_id in self.active_connections:
            if user_id in self.active_connections[group_id]:
                del self.active_connections[group_id][user_id]
            
            # Clean up empty groups
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]
        
        del self.connection_map[websocket]
        
        logger.info(f"❌ User {user_id} disconnected from group {group_id}")
        
        # Notify others that user left
        asyncio.create_task(
            self.broadcast_to_group(
                group_id,
                {
                    "event": "user_left",
                    "data": {
                        "user_id": user_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        )
    
    async def send_personal(self, user_id: str, group_id: str, message: dict):
        """Send message to a specific user in a group"""
        if group_id in self.active_connections:
            if user_id in self.active_connections[group_id]:
                websocket = self.active_connections[group_id][user_id]
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send to {user_id}: {e}")
                    self.disconnect(websocket)
    
    async def broadcast_to_group(
        self, 
        group_id: str, 
        message: dict, 
        exclude_user: Optional[str] = None
    ):
        """Broadcast message to all users in a group"""
        if group_id not in self.active_connections:
            return
        
        disconnected = []
        
        for user_id, websocket in self.active_connections[group_id].items():
            if exclude_user and user_id == exclude_user:
                continue
            
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to {user_id}: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected websockets
        for ws in disconnected:
            self.disconnect(ws)
    
    async def broadcast_typing(self, group_id: str, user_id: str, is_typing: bool):
        """Broadcast typing indicator"""
        await self.broadcast_to_group(
            group_id,
            {
                "event": "user_typing",
                "data": {
                    "user_id": user_id,
                    "is_typing": is_typing,
                    "timestamp": datetime.utcnow().isoformat()
                }
            },
            exclude_user=user_id
        )
    
    async def broadcast_online_status(self, group_id: str, user_id: str, online: bool):
        """Broadcast online status change"""
        await self.broadcast_to_group(
            group_id,
            {
                "event": "online_status",
                "data": {
                    "user_id": user_id,
                    "online": online,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
    
    def get_online_users(self, group_id: str) -> Set[str]:
        """Get set of online user IDs in a group"""
        if group_id not in self.active_connections:
            return set()
        return set(self.active_connections[group_id].keys())
    
    def is_user_online(self, user_id: str, group_id: str) -> bool:
        """Check if user is online in a group"""
        if group_id not in self.active_connections:
            return False
        return user_id in self.active_connections[group_id]

# Global connection manager instance
manager = ConnectionManager()
