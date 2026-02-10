from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Optional
import logging
import json
import asyncio

from auth.routes import authenticate
from config.db import users_collection
from .websocket_manager import manager
from .message_service import MessageService
from .models import MessageCreate, MessageType
from .permissions import is_group_member

logger = logging.getLogger(__name__)

router = APIRouter()

async def get_current_user_ws(websocket: WebSocket, token: str = Query(...)):
    """Authenticate WebSocket connection via query parameter"""
    from auth.jwt import verify_token
    
    payload = verify_token(token)
    if not payload:
        await websocket.close(code=1008, reason="Invalid token")
        return None
    
    email = payload.get("sub")
    user = await asyncio.to_thread(users_collection.find_one, {"email": email})
    
    if not user:
        await websocket.close(code=1008, reason="User not found")
        return None
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "name": user.get("name", "Unknown")
    }

@router.websocket("/ws/{group_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    group_id: str,
    token: str = Query(...)
):
    """
    WebSocket endpoint for real-time group chat.
    
    Connect: ws://localhost:8080/api/v1/groups/ws/{group_id}?token=<jwt_token>
    """
    # Authenticate
    user = await get_current_user_ws(websocket, token)
    if not user:
        return
    
    user_id = user["id"]
    
    # Check if user is member of group
    if not await is_group_member(user_id, group_id):
        await websocket.close(code=1008, reason="Not a member of this group")
        return
    
    # Connect to group
    await manager.connect(websocket, user_id, group_id)
    
    # Send online users list
    online_users = list(manager.get_online_users(group_id))
    await websocket.send_json({
        "event": "online_users",
        "data": {
            "users": online_users,
            "count": len(online_users)
        }
    })
    
    # Broadcast online status
    await manager.broadcast_online_status(group_id, user_id, True)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                event = message.get("event")
                event_data = message.get("data", {})
                
                # Handle different event types
                if event == "send_message":
                    await handle_send_message(group_id, user_id, event_data)
                
                elif event == "typing":
                    is_typing = event_data.get("is_typing", False)
                    await manager.broadcast_typing(group_id, user_id, is_typing)
                
                elif event == "read_receipt":
                    message_id = event_data.get("message_id")
                    if message_id:
                        # Update last_read_message_id in group_members
                        from .db_collections import group_members_collection
                        await asyncio.to_thread(
                            group_members_collection.update_one,
                            {"group_id": group_id, "user_id": user_id},
                            {"$set": {"last_read_message_id": message_id}}
                        )
                
                elif event == "react":
                    message_id = event_data.get("message_id")
                    emoji = event_data.get("emoji")
                    if message_id and emoji:
                        success = await MessageService.add_reaction(message_id, user_id, emoji)
                        if success:
                            # Broadcast reaction
                            await manager.broadcast_to_group(group_id, {
                                "event": "reaction_added",
                                "data": {
                                    "message_id": message_id,
                                    "user_id": user_id,
                                    "emoji": emoji
                                }
                            })
                
                elif event == "ping":
                    # Heartbeat
                    await websocket.send_json({"event": "pong"})
                
                else:
                    logger.warning(f"Unknown event type: {event}")
            
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON from {user_id}")
            except Exception as e:
                logger.error(f"Error handling message: {e}")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast_online_status(group_id, user_id, False)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
        await manager.broadcast_online_status(group_id, user_id, False)

async def handle_send_message(group_id: str, sender_id: str, data: dict):
    """Handle real-time message sending"""
    try:
        # Create message
        message_data = MessageCreate(
            content=data.get("content", ""),
            type=MessageType(data.get("type", "TEXT")),
            media_urls=data.get("media_urls", []),
            reply_to=data.get("reply_to")
        )
        
        # Save to database
        message = await MessageService.send_message(group_id, sender_id, message_data)
        
        if message:
            # Broadcast to all group members
            await manager.broadcast_to_group(group_id, {
                "event": "new_message",
                "data": {
                    "id": message["id"],
                    "group_id": message["group_id"],
                    "sender_id": message["sender_id"],
                    "content": message["content"],
                    "type": message["type"],
                    "media_urls": message.get("media_urls", []),
                    "reply_to": message.get("reply_to"),
                    "created_at": message["created_at"].isoformat()
                }
            })
        else:
            # Send error to sender
            await manager.send_personal(sender_id, group_id, {
                "event": "error",
                "data": {
                    "message": "Failed to send message (rate limited or banned)"
                }
            })
    
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        await manager.send_personal(sender_id, group_id, {
            "event": "error",
            "data": {
                "message": str(e)
            }
        })
