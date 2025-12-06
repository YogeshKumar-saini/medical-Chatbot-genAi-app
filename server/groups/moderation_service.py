import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Dict
from bson import ObjectId

from .db_collections import (
    groups_collection, 
    group_members_collection,
    moderation_logs_collection
)
from .models import (
    MemberRole, MemberStatus, ModerationAction, BanRequest
)
from .permissions import can_moderate

logger = logging.getLogger(__name__)

class ModerationService:
    """Service for group moderation operations"""
    
    @staticmethod
    async def ban_member(
        group_id: str,
        user_id: str,
        moderator_id: str,
        ban_request: BanRequest
    ) -> Dict:
        """
        Ban a member from a group.
        Returns status dict with success/error info.
        """
        try:
            # Check moderator permissions
            if not await can_moderate(moderator_id, group_id):
                return {"success": False, "error": "Insufficient permissions"}
            
            # Calculate ban expiry
            ban_expires_at = None
            if ban_request.duration_hours:
                from datetime import timedelta
                ban_expires_at = datetime.utcnow() + timedelta(hours=ban_request.duration_hours)
            
            # Update member status
            result = await asyncio.to_thread(
                group_members_collection.update_one,
                {"group_id": group_id, "user_id": user_id},
                {
                    "$set": {
                        "status": MemberStatus.BANNED.value,
                        "ban_expires_at": ban_expires_at
                    }
                }
            )
            
            if result.modified_count == 0:
                return {"success": False, "error": "Member not found in group"}
            
            # Log moderation action
            await ModerationService._log_action(
                group_id=group_id,
                moderator_id=moderator_id,
                target_user_id=user_id,
                action=ModerationAction.BAN,
                reason=ban_request.reason,
                duration=ban_request.duration_hours
            )
            
            logger.info(f"✅ Banned user {user_id} from group {group_id}")
            return {
                "success": True,
                "message": "User banned successfully",
                "ban_expires_at": ban_expires_at
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to ban member: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def unban_member(
        group_id: str,
        user_id: str,
        moderator_id: str
    ) -> Dict:
        """Unban a member from a group"""
        try:
            if not await can_moderate(moderator_id, group_id):
                return {"success": False, "error": "Insufficient permissions"}
            
            result = await asyncio.to_thread(
                group_members_collection.update_one,
                {"group_id": group_id, "user_id": user_id},
                {
                    "$set": {
                        "status": MemberStatus.ACTIVE.value,
                        "ban_expires_at": None
                    }
                }
            )
            
            if result.modified_count == 0:
                return {"success": False, "error": "Member not found"}
            
            await ModerationService._log_action(
                group_id=group_id,
                moderator_id=moderator_id,
                target_user_id=user_id,
                action=ModerationAction.UNBAN
            )
            
            logger.info(f"✅ Unbanned user {user_id} from group {group_id}")
            return {"success": True, "message": "User unbanned successfully"}
            
        except Exception as e:
            logger.error(f"❌ Failed to unban member: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def remove_member(
        group_id: str,
        user_id: str,
        moderator_id: str,
        reason: str
    ) -> Dict:
        """Remove a member from a group permanently"""
        try:
            if not await can_moderate(moderator_id, group_id):
                return {"success": False, "error": "Insufficient permissions"}
            
            # Don't allow removing admins (safety check)
            member = await asyncio.to_thread(
                group_members_collection.find_one,
                {"group_id": group_id, "user_id": user_id}
            )
            
            if member and member.get("role") == MemberRole.ADMIN.value:
                return {"success": False, "error": "Cannot remove admin"}
            
            result = await asyncio.to_thread(
                group_members_collection.delete_one,
                {"group_id": group_id, "user_id": user_id}
            )
            
            if result.deleted_count == 0:
                return {"success": False, "error": "Member not found"}
            
            await ModerationService._log_action(
                group_id=group_id,
                moderator_id=moderator_id,
                target_user_id=user_id,
                action=ModerationAction.REMOVE,
                reason=reason
            )
            
            logger.info(f"✅ Removed user {user_id} from group {group_id}")
            return {"success": True, "message": "User removed successfully"}
            
        except Exception as e:
            logger.error(f"❌ Failed to remove member: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def deactivate_member(
        group_id: str,
        user_id: str,
        moderator_id: str,
        reason: str
    ) -> Dict:
        """Temporarily deactivate a member (can be reactivated)"""
        try:
            if not await can_moderate(moderator_id, group_id):
                return {"success": False, "error": "Insufficient permissions"}
            
            result = await asyncio.to_thread(
                group_members_collection.update_one,
                {"group_id": group_id, "user_id": user_id},
                {"$set": {"status": MemberStatus.DEACTIVATED.value}}
            )
            
            if result.modified_count == 0:
                return {"success": False, "error": "Member not found"}
            
            await ModerationService._log_action(
                group_id=group_id,
                moderator_id=moderator_id,
                target_user_id=user_id,
                action=ModerationAction.DEACTIVATE,
                reason=reason
            )
            
            logger.info(f"✅ Deactivated user {user_id} in group {group_id}")
            return {"success": True, "message": "User deactivated successfully"}
            
        except Exception as e:
            logger.error(f"❌ Failed to deactivate member: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def activate_member(
        group_id: str,
        user_id: str,
        moderator_id: str
    ) -> Dict:
        """Reactivate a deactivated member"""
        try:
            if not await can_moderate(moderator_id, group_id):
                return {"success": False, "error": "Insufficient permissions"}
            
            result = await asyncio.to_thread(
                group_members_collection.update_one,
                {"group_id": group_id, "user_id": user_id},
                {"$set": {"status": MemberStatus.ACTIVE.value}}
            )
            
            if result.modified_count == 0:
                return {"success": False, "error": "Member not found"}
            
            await ModerationService._log_action(
                group_id=group_id,
                moderator_id=moderator_id,
                target_user_id=user_id,
                action=ModerationAction.ACTIVATE
            )
            
            logger.info(f"✅ Activated user {user_id} in group {group_id}")
            return {"success": True, "message": "User activated successfully"}
            
        except Exception as e:
            logger.error(f"❌ Failed to activate member: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def get_moderation_logs(group_id: str, limit: int = 50) -> List[Dict]:
        """Get moderation logs for a group"""
        try:
            cursor = moderation_logs_collection.find(
                {"group_id": group_id}
            ).sort("timestamp", -1).limit(limit)
            
            logs = await asyncio.to_thread(lambda: list(cursor))
            
            return [
                {
                    "id": str(log["_id"]),
                    "group_id": log["group_id"],
                    "moderator_id": log["moderator_id"],
                    "target_user_id": log["target_user_id"],
                    "action": log["action"],
                    "reason": log.get("reason"),
                    "duration": log.get("duration"),
                    "timestamp": log["timestamp"]
                }
                for log in logs
            ]
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch moderation logs: {e}")
            return []
    
    @staticmethod
    async def check_ban_expiry():
        """
        Background task to check and unban users whose ban has expired.
        Should be run periodically (e.g., every hour).
        """
        try:
            # Find all members with expired bans
            expired_bans = await asyncio.to_thread(
                lambda: list(group_members_collection.find({
                    "status": MemberStatus.BANNED.value,
                    "ban_expires_at": {"$lte": datetime.utcnow(), "$ne": None}
                }))
            )
            
            count = 0
            for member in expired_bans:
                await asyncio.to_thread(
                    group_members_collection.update_one,
                    {"_id": member["_id"]},
                    {
                        "$set": {
                            "status": MemberStatus.ACTIVE.value,
                            "ban_expires_at": None
                        }
                    }
                )
                
                # Log auto-unban
                await ModerationService._log_action(
                    group_id=member["group_id"],
                    moderator_id="SYSTEM",
                    target_user_id=member["user_id"],
                    action=ModerationAction.UNBAN,
                    reason="Ban expired automatically"
                )
                count += 1
            
            if count > 0:
                logger.info(f"✅ Auto-unbanned {count} users with expired bans")
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Failed to check ban expiry: {e}")
            return 0
    
    @staticmethod
    async def _log_action(
        group_id: str,
        moderator_id: str,
        target_user_id: str,
        action: ModerationAction,
        reason: Optional[str] = None,
        duration: Optional[int] = None
    ):
        """Internal method to log moderation actions"""
        try:
            log_doc = {
                "group_id": group_id,
                "moderator_id": moderator_id,
                "target_user_id": target_user_id,
                "action": action.value,
                "reason": reason,
                "duration": duration,
                "timestamp": datetime.utcnow()
            }
            
            await asyncio.to_thread(moderation_logs_collection.insert_one, log_doc)
            
        except Exception as e:
            logger.error(f"❌ Failed to log moderation action: {e}")
