import asyncio
import logging
from typing import Optional
from bson import ObjectId

from .db_collections import groups_collection, group_members_collection
from .models import MemberRole, MemberStatus, GroupType
from config.db import users_collection

logger = logging.getLogger(__name__)

async def can_moderate(user_id: str, group_id: str) -> bool:
    """
    Check if user has moderation permissions in a group.
    Returns True if user can moderate (is admin/moderator or org admin).
    """
    try:
        # Get group info
        group = await asyncio.to_thread(
            groups_collection.find_one,
            {"_id": ObjectId(group_id)}
        )
        
        if not group:
            return False
        
        # Get user info
        user = await asyncio.to_thread(
            users_collection.find_one,
            {"_id": ObjectId(user_id)}
        )
        
        if not user:
            return False
        
        user_role = user.get("role")
        
        # Super admins can moderate any group
        if user_role in ["SUPER_ADMIN", "GEN_ADMIN"]:
            return True
        
        # Org admins can moderate their organization's groups
        if user_role == "ORG_ADMIN" and group.get("type") == GroupType.ORGANIZATION.value:
            # Check if user belongs to this organization
            from config.db import get_orgs_collection
            orgs_collection = get_orgs_collection()
            org = await asyncio.to_thread(
                orgs_collection.find_one,
                {"_id": ObjectId(group.get("organization_id")), "admin_id": user_id}
            )
            if org:
                return True
        
        # Check if user is admin/moderator of the group
        member = await asyncio.to_thread(
            group_members_collection.find_one,
            {"group_id": group_id, "user_id": user_id}
        )
        
        if member and member.get("role") in [MemberRole.ADMIN.value, MemberRole.MODERATOR.value]:
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"Error checking moderation permissions: {e}")
        return False

async def can_send_message(user_id: str, group_id: str) -> bool:
    """
    Check if user can send messages in a group.
    Returns True if user is an active member.
    """
    try:
        member = await asyncio.to_thread(
            group_members_collection.find_one,
            {"group_id": group_id, "user_id": user_id}
        )
        
        if not member:
            return False
        
        # Check if member is active (not banned or deactivated)
        return member.get("status") == MemberStatus.ACTIVE.value
        
    except Exception as e:
        logger.error(f"Error checking send message permission: {e}")
        return False

async def can_delete_message(user_id: str, message: dict) -> bool:
    """
    Check if user can delete a message.
    Returns True if user is the sender or a moderator.
    """
    try:
        # User can delete their own messages
        if message.get("sender_id") == user_id:
            return True
        
        # Moderators can delete any message
        group_id = message.get("group_id")
        if await can_moderate(user_id, group_id):
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"Error checking delete message permission: {e}")
        return False

async def is_group_admin(user_id: str, group_id: str) -> bool:
    """
    Check if user is an admin of the group.
    """
    try:
        member = await asyncio.to_thread(
            group_members_collection.find_one,
            {"group_id": group_id, "user_id": user_id}
        )
        
        return member and member.get("role") == MemberRole.ADMIN.value
        
    except Exception as e:
        logger.error(f"Error checking admin status: {e}")
        return False

async def is_group_member(user_id: str, group_id: str) -> bool:
    """
    Check if user is a member of the group (any role, any status).
    """
    try:
        member = await asyncio.to_thread(
            group_members_collection.find_one,
            {"group_id": group_id, "user_id": user_id}
        )
        
        return member is not None
        
    except Exception as e:
        logger.error(f"Error checking membership: {e}")
        return False
