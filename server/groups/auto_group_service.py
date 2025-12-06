import asyncio
import logging
from datetime import datetime
from typing import Optional
from bson import ObjectId

from .db_collections import groups_collection, group_members_collection
from .models import GroupType, MemberRole, MemberStatus, GroupSettings

logger = logging.getLogger(__name__)

class AutoGroupService:
    """Service for automatic group creation and membership management"""
    
    @staticmethod
    async def create_organization_group(org_id: str, org_name: str, admin_id: str) -> Optional[str]:
        """
        Create organization-wide group when organization is created.
        Returns group_id if successful.
        """
        try:
            group_doc = {
                "name": f"{org_name} - Community",
                "description": f"Organization-wide community for {org_name}",
                "type": GroupType.ORGANIZATION.value,
                "organization_id": org_id,
                "therapist_id": None,
                "avatar_url": None,
                "created_by": admin_id,
                "created_at": datetime.utcnow(),
                "settings": {
                    "allow_media": True,
                    "allow_patient_invite": False,
                    "moderation_mode": "AUTO"
                }
            }
            
            result = await asyncio.to_thread(groups_collection.insert_one, group_doc)
            group_id = str(result.inserted_id)
            
            # Add admin as ADMIN member
            await AutoGroupService.add_member_to_group(
                group_id=group_id,
                user_id=admin_id,
                role=MemberRole.ADMIN
            )
            
            logger.info(f"✅ Created organization group {group_id} for org {org_id}")
            return group_id
            
        except Exception as e:
            logger.error(f"❌ Failed to create organization group: {e}")
            return None
    
    @staticmethod
    async def create_therapist_group(doctor_id: str, doctor_name: str) -> Optional[str]:
        """
        Create therapist-specific group when doctor is verified.
        Returns group_id if successful.
        """
        try:
            group_doc = {
                "name": f"Dr. {doctor_name}'s Patient Group",
                "description": f"Support group for Dr. {doctor_name}'s patients",
                "type": GroupType.THERAPIST.value,
                "organization_id": None,
                "therapist_id": doctor_id,
                "avatar_url": None,
                "created_by": doctor_id,
                "created_at": datetime.utcnow(),
                "settings": {
                    "allow_media": True,
                    "allow_patient_invite": False,
                    "moderation_mode": "AUTO"
                }
            }
            
            result = await asyncio.to_thread(groups_collection.insert_one, group_doc)
            group_id = str(result.inserted_id)
            
            # Add doctor as ADMIN
            await AutoGroupService.add_member_to_group(
                group_id=group_id,
                user_id=doctor_id,
                role=MemberRole.ADMIN
            )
            
            logger.info(f"✅ Created therapist group {group_id} for doctor {doctor_id}")
            return group_id
            
        except Exception as e:
            logger.error(f"❌ Failed to create therapist group: {e}")
            return None
    
    @staticmethod
    async def add_member_to_group(
        group_id: str, 
        user_id: str, 
        role: MemberRole = MemberRole.MEMBER
    ) -> bool:
        """
        Add a member to a group. Returns True if successful.
        """
        try:
            # Check if already a member
            existing = await asyncio.to_thread(
                group_members_collection.find_one,
                {"group_id": group_id, "user_id": user_id}
            )
            
            if existing:
                logger.info(f"User {user_id} already in group {group_id}")
                return True
            
            member_doc = {
                "group_id": group_id,
                "user_id": user_id,
                "role": role.value,
                "status": MemberStatus.ACTIVE.value,
                "ban_expires_at": None,
                "joined_at": datetime.utcnow(),
                "last_read_message_id": None,
                "muted": False
            }
            
            await asyncio.to_thread(group_members_collection.insert_one, member_doc)
            logger.info(f"✅ Added user {user_id} to group {group_id} as {role.value}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to add member to group: {e}")
            return False
    
    @staticmethod
    async def remove_member_from_group(group_id: str, user_id: str) -> bool:
        """
        Remove a member from a group. Returns True if successful.
        """
        try:
            result = await asyncio.to_thread(
                group_members_collection.delete_one,
                {"group_id": group_id, "user_id": user_id}
            )
            
            if result.deleted_count > 0:
                logger.info(f"✅ Removed user {user_id} from group {group_id}")
                return True
            else:
                logger.warning(f"User {user_id} not found in group {group_id}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to remove member from group: {e}")
            return False
    
    @staticmethod
    async def add_patient_to_organization_group(patient_id: str, org_id: str) -> bool:
        """
        Add patient to organization group when they join the organization.
        """
        try:
            # Find organization group
            org_group = await asyncio.to_thread(
                groups_collection.find_one,
                {"organization_id": org_id, "type": GroupType.ORGANIZATION.value}
            )
            
            if not org_group:
                logger.warning(f"No organization group found for org {org_id}")
                return False
            
            group_id = str(org_group["_id"])
            return await AutoGroupService.add_member_to_group(group_id, patient_id)
            
        except Exception as e:
            logger.error(f"❌ Failed to add patient to org group: {e}")
            return False
    
    @staticmethod
    async def add_patient_to_therapist_group(patient_id: str, doctor_id: str) -> bool:
        """
        Add patient to therapist's group when doctor-patient link is created.
        """
        try:
            # Find therapist group
            therapist_group = await asyncio.to_thread(
                groups_collection.find_one,
                {"therapist_id": doctor_id, "type": GroupType.THERAPIST.value}
            )
            
            if not therapist_group:
                logger.warning(f"No therapist group found for doctor {doctor_id}")
                return False
            
            group_id = str(therapist_group["_id"])
            return await AutoGroupService.add_member_to_group(group_id, patient_id)
            
        except Exception as e:
            logger.error(f"❌ Failed to add patient to therapist group: {e}")
            return False
