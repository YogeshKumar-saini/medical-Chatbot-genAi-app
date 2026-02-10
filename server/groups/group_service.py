import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Dict
from bson import ObjectId

from .db_collections import groups_collection, group_members_collection
from .models import (
    GroupType, GroupCreate, Group, MemberRole, 
    MemberStatus, GroupSettings
)
from .permissions import is_group_admin, is_group_member
from .auto_group_service import AutoGroupService

logger = logging.getLogger(__name__)

class GroupService:
    """Service for group management operations"""
    
    @staticmethod
    async def get_user_groups(user_id: str) -> List[Group]:
        """Get all groups user is a member of"""
        try:
            # Find all group memberships
            cursor = group_members_collection.find({"user_id": user_id})
            memberships = await asyncio.to_thread(lambda: list(cursor))
            
            group_ids = [ObjectId(m["group_id"]) for m in memberships]
            
            if not group_ids:
                return []
            
            # Fetch group details
            cursor = groups_collection.find({"_id": {"$in": group_ids}})
            groups = await asyncio.to_thread(lambda: list(cursor))
            
            return [
                Group(
                    id=str(g["_id"]),
                    name=g["name"],
                    description=g.get("description"),
                    avatar_url=g.get("avatar_url"),
                    type=GroupType(g["type"]),
                    organization_id=g.get("organization_id"),
                    therapist_id=g.get("therapist_id"),
                    created_by=g["created_by"],
                    created_at=g["created_at"],
                    settings=GroupSettings(**g.get("settings", {}))
                )
                for g in groups
            ]
            
        except Exception as e:
            logger.error(f"Failed to get user groups: {e}")
            return []
    
    @staticmethod
    async def get_group_details(group_id: str, user_id: str) -> Optional[Dict]:
        """Get group details if user has access"""
        try:
            # Check if user is member
            if not await is_group_member(user_id, group_id):
                return None
            
            group = await asyncio.to_thread(
                groups_collection.find_one,
                {"_id": ObjectId(group_id)}
            )
            
            if not group:
                return None
            
            # Get member count
            member_count = await asyncio.to_thread(
                group_members_collection.count_documents,
                {"group_id": group_id, "status": MemberStatus.ACTIVE.value}
            )
            
            return {
                "id": str(group["_id"]),
                "name": group["name"],
                "description": group.get("description"),
                "avatar_url": group.get("avatar_url"),
                "type": group["type"],
                "organization_id": group.get("organization_id"),
                "therapist_id": group.get("therapist_id"),
                "created_by": group["created_by"],
                "created_at": group["created_at"],
                "settings": group.get("settings", {}),
                "member_count": member_count
            }
            
        except Exception as e:
            logger.error(f"Failed to get group details: {e}")
            return None
    
    @staticmethod
    async def create_custom_group(
        name: str,
        creator_id: str,
        member_ids: List[str],
        description: Optional[str] = None
    ) -> Optional[str]:
        """Create a custom group (not auto-created)"""
        try:
            group_doc = {
                "name": name,
                "description": description,
                "type": GroupType.CUSTOM.value,
                "organization_id": None,
                "therapist_id": None,
                "avatar_url": None,
                "created_by": creator_id,
                "created_at": datetime.utcnow(),
                "settings": {
                    "allow_media": True,
                    "allow_patient_invite": True,
                    "moderation_mode": "AUTO"
                }
            }
            
            result = await asyncio.to_thread(groups_collection.insert_one, group_doc)
            group_id = str(result.inserted_id)
            
            # Add creator as admin
            await AutoGroupService.add_member_to_group(
                group_id=group_id,
                user_id=creator_id,
                role=MemberRole.ADMIN
            )
            
            # Add other members
            for member_id in member_ids:
                if member_id != creator_id:
                    await AutoGroupService.add_member_to_group(
                        group_id=group_id,
                        user_id=member_id,
                        role=MemberRole.MEMBER
                    )
            
            logger.info(f"✅ Created custom group {group_id}")
            return group_id
            
        except Exception as e:
            logger.error(f"Failed to create custom group: {e}")
            return None
    
    @staticmethod
    async def update_group_settings(
        group_id: str,
        user_id: str,
        settings: Dict
    ) -> bool:
        """Update group settings (admin only)"""
        try:
            if not await is_group_admin(user_id, group_id):
                logger.warning(f"User {user_id} not authorized to update group {group_id}")
                return False
            
            result = await asyncio.to_thread(
                groups_collection.update_one,
                {"_id": ObjectId(group_id)},
                {"$set": {"settings": settings}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Failed to update group settings: {e}")
            return False
    
    @staticmethod
    async def delete_group(group_id: str, user_id: str) -> bool:
        """Delete a group (admin only, custom groups only)"""
        try:
            if not await is_group_admin(user_id, group_id):
                return False
            
            # Get group to check type
            group = await asyncio.to_thread(
                groups_collection.find_one,
                {"_id": ObjectId(group_id)}
            )
            
            if not group:
                return False
            
            # Only allow deleting custom groups
            if group["type"] != GroupType.CUSTOM.value:
                logger.warning(f"Cannot delete non-custom group {group_id}")
                return False
            
            # Delete group
            await asyncio.to_thread(
                groups_collection.delete_one,
                {"_id": ObjectId(group_id)}
            )
            
            # Delete all members
            await asyncio.to_thread(
                group_members_collection.delete_many,
                {"group_id": group_id}
            )
            
            # Note: Messages are kept for audit purposes
            
            logger.info(f"✅ Deleted group {group_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete group: {e}")
            return False
    
    @staticmethod
    async def get_group_members(group_id: str, user_id: str) -> List[Dict]:
        """Get list of group members"""
        try:
            if not await is_group_member(user_id, group_id):
                return []
            
            cursor = group_members_collection.find({"group_id": group_id})
            members = await asyncio.to_thread(lambda: list(cursor))
            
            return [
                {
                    "id": str(m["_id"]),
                    "group_id": m["group_id"],
                    "user_id": m["user_id"],
                    "role": m["role"],
                    "status": m["status"],
                    "joined_at": m["joined_at"],
                    "muted": m.get("muted", False)
                }
                for m in members
            ]
            
        except Exception as e:
            logger.error(f"Failed to get group members: {e}")
            return []
