from fastapi import APIRouter, HTTPException, Depends, status, Query, WebSocket
from typing import List, Optional
import logging

from auth.routes import authenticate
from config.db import users_collection
import asyncio

from .models import (
    GroupCreate, Group, GroupListResponse, MessageCreate, 
    MessageListResponse, BanRequest, MemberListResponse
)
from .group_service import GroupService
from .message_service import MessageService
from .moderation_service import ModerationService
from .permissions import is_group_admin

# Import WebSocket routes
from . import websocket_routes

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Groups"])

# Include WebSocket route
router.add_websocket_route("/ws/{group_id}", websocket_routes.websocket_endpoint)

# ===== Group Management =====

@router.get("/", response_model=GroupListResponse)
async def list_user_groups(user: dict = Depends(authenticate)):
    """Get all groups the user is a member of"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    groups = await GroupService.get_user_groups(user_id)
    
    return GroupListResponse(
        groups=groups,
        total=len(groups)
    )

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_group(group_data: GroupCreate, user: dict = Depends(authenticate)):
    """Create a custom group"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    creator_id = str(user_doc["_id"])
    
    group_id = await GroupService.create_custom_group(
        name=group_data.name,
        creator_id=creator_id,
        member_ids=group_data.member_ids or [],
        description=group_data.description
    )
    
    if not group_id:
        raise HTTPException(500, "Failed to create group")
    
    return {"id": group_id, "message": "Group created successfully"}

@router.get("/{group_id}")
async def get_group(group_id: str, user: dict = Depends(authenticate)):
    """Get group details"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    group = await GroupService.get_group_details(group_id, user_id)
    
    if not group:
        raise HTTPException(404, "Group not found or access denied")
    
    return group

@router.put("/{group_id}/settings")
async def update_group_settings(
    group_id: str,
    settings: dict,
    user: dict = Depends(authenticate)
):
    """Update group settings (admin only)"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    success = await GroupService.update_group_settings(group_id, user_id, settings)
    
    if not success:
        raise HTTPException(403, "Not authorized or group not found")
    
    return {"message": "Settings updated successfully"}

@router.delete("/{group_id}")
async def delete_group(group_id: str, user: dict = Depends(authenticate)):
    """Delete a custom group (admin only)"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    success = await GroupService.delete_group(group_id, user_id)
    
    if not success:
        raise HTTPException(403, "Not authorized or cannot delete this group type")
    
    return {"message": "Group deleted successfully"}

# ===== Members =====

@router.get("/{group_id}/members")
async def get_group_members(group_id: str, user: dict = Depends(authenticate)):
    """Get list of group members"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    members = await GroupService.get_group_members(group_id, user_id)
    
    return MemberListResponse(
        members=members,
        total=len(members)
    )

@router.post("/{group_id}/members/{target_user_id}")
async def add_member(
    group_id: str,
    target_user_id: str,
    user: dict = Depends(authenticate)
):
    """Add a member to the group (admin only)"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    if not await is_group_admin(user_id, group_id):
        raise HTTPException(403, "Admin access required")
    
    from .auto_group_service import AutoGroupService
    success = await AutoGroupService.add_member_to_group(group_id, target_user_id)
    
    if not success:
        raise HTTPException(500, "Failed to add member")
    
    return {"message": "Member added successfully"}

@router.delete("/{group_id}/members/{target_user_id}")
async def remove_member(
    group_id: str,
    target_user_id: str,
    reason: str = Query(...),
    user: dict = Depends(authenticate)
):
    """Remove a member from the group"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    moderator_id = str(user_doc["_id"])
    
    result = await ModerationService.remove_member(
        group_id=group_id,
        user_id=target_user_id,
        moderator_id=moderator_id,
        reason=reason
    )
    
    if not result["success"]:
        raise HTTPException(403, result.get("error", "Failed to remove member"))
    
    return result

# ===== Moderation =====

@router.put("/{group_id}/members/{target_user_id}/ban")
async def ban_member(
    group_id: str,
    target_user_id: str,
    ban_request: BanRequest,
    user: dict = Depends(authenticate)
):
    """Ban a member from the group"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    moderator_id = str(user_doc["_id"])
    
    result = await ModerationService.ban_member(
        group_id=group_id,
        user_id=target_user_id,
        moderator_id=moderator_id,
        ban_request=ban_request
    )
    
    if not result["success"]:
        raise HTTPException(403, result.get("error", "Failed to ban member"))
    
    return result

@router.put("/{group_id}/members/{target_user_id}/unban")
async def unban_member(
    group_id: str,
    target_user_id: str,
    user: dict = Depends(authenticate)
):
    """Unban a member"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    moderator_id = str(user_doc["_id"])
    
    result = await ModerationService.unban_member(
        group_id=group_id,
        user_id=target_user_id,
        moderator_id=moderator_id
    )
    
    if not result["success"]:
        raise HTTPException(403, result.get("error", "Failed to unban member"))
    
    return result

@router.put("/{group_id}/members/{target_user_id}/deactivate")
async def deactivate_member(
    group_id: str,
    target_user_id: str,
    reason: str = Query(...),
    user: dict = Depends(authenticate)
):
    """Deactivate a member"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    moderator_id = str(user_doc["_id"])
    
    result = await ModerationService.deactivate_member(
        group_id=group_id,
        user_id=target_user_id,
        moderator_id=moderator_id,
        reason=reason
    )
    
    if not result["success"]:
        raise HTTPException(403, result.get("error", "Failed to deactivate member"))
    
    return result

@router.get("/{group_id}/moderation-logs")
async def get_moderation_logs(
    group_id: str,
    limit: int = Query(50, le=100),
    user: dict = Depends(authenticate)
):
    """Get moderation logs for a group (admin only)"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    if not await is_group_admin(user_id, group_id):
        raise HTTPException(403, "Admin access required")
    
    logs = await ModerationService.get_moderation_logs(group_id, limit)
    
    return {"logs": logs, "total": len(logs)}

# ===== Messages =====

@router.get("/{group_id}/messages", response_model=MessageListResponse)
async def get_messages(
    group_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=100),
    user: dict = Depends(authenticate)
):
    """Get messages from a group (paginated)"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    result = await MessageService.get_messages(group_id, user_id, page, limit)
    
    return MessageListResponse(**result)

@router.post("/{group_id}/messages")
async def send_message(
    group_id: str,
    message_data: MessageCreate,
    user: dict = Depends(authenticate)
):
    """Send a message to a group"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    sender_id = str(user_doc["_id"])
    
    message = await MessageService.send_message(group_id, sender_id, message_data)
    
    if not message:
        raise HTTPException(403, "Cannot send message (banned, rate limited, or not a member)")
    
    return message

@router.delete("/{group_id}/messages/{message_id}")
async def delete_message(
    group_id: str,
    message_id: str,
    user: dict = Depends(authenticate)
):
    """Delete a message"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    success = await MessageService.delete_message(message_id, user_id)
    
    if not success:
        raise HTTPException(403, "Cannot delete message")
    
    return {"message": "Message deleted successfully"}

@router.put("/{group_id}/messages/{message_id}")
async def edit_message(
    group_id: str,
    message_id: str,
    content: str = Query(...),
    user: dict = Depends(authenticate)
):
    """Edit a message"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    success = await MessageService.edit_message(message_id, user_id, content)
    
    if not success:
        raise HTTPException(403, "Cannot edit message")
    
    return {"message": "Message edited successfully"}

@router.post("/{group_id}/messages/{message_id}/react")
async def add_reaction(
    group_id: str,
    message_id: str,
    emoji: str = Query(...),
    user: dict = Depends(authenticate)
):
    """Add a reaction to a message"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    success = await MessageService.add_reaction(message_id, user_id, emoji)
    
    if not success:
        raise HTTPException(500, "Failed to add reaction")
    
    return {"message": "Reaction added"}

@router.delete("/{group_id}/messages/{message_id}/react")
async def remove_reaction(
    group_id: str,
    message_id: str,
    emoji: str = Query(...),
    user: dict = Depends(authenticate)
):
    """Remove a reaction from a message"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    success = await MessageService.remove_reaction(message_id, user_id, emoji)
    
    if not success:
        raise HTTPException(500, "Failed to remove reaction")
    
    return {"message": "Reaction removed"}
