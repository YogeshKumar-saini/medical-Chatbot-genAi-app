from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum
from datetime import datetime

class GroupType(str, Enum):
    ORGANIZATION = "ORGANIZATION"
    THERAPIST = "THERAPIST"
    CUSTOM = "CUSTOM"

class MemberRole(str, Enum):
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"
    MEMBER = "MEMBER"

class MemberStatus(str, Enum):
    ACTIVE = "ACTIVE"
    BANNED = "BANNED"
    DEACTIVATED = "DEACTIVATED"

class MessageType(str, Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    VOICE = "VOICE"
    FILE = "FILE"

class ModerationAction(str, Enum):
    BAN = "BAN"
    UNBAN = "UNBAN"
    REMOVE = "REMOVE"
    DEACTIVATE = "DEACTIVATE"
    ACTIVATE = "ACTIVATE"

# Group Models
class GroupSettings(BaseModel):
    allow_media: bool = True
    allow_patient_invite: bool = False
    moderation_mode: str = "AUTO"  # AUTO or MANUAL

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: Optional[GroupSettings] = GroupSettings()

class GroupCreate(GroupBase):
    member_ids: Optional[List[str]] = []

class Group(GroupBase):
    id: str
    type: GroupType
    organization_id: Optional[str] = None
    therapist_id: Optional[str] = None
    created_by: str
    created_at: datetime

# Member Models
class GroupMemberBase(BaseModel):
    group_id: str
    user_id: str
    role: MemberRole = MemberRole.MEMBER

class GroupMember(GroupMemberBase):
    id: str
    status: MemberStatus = MemberStatus.ACTIVE
    ban_expires_at: Optional[datetime] = None
    joined_at: datetime
    last_read_message_id: Optional[str] = None
    muted: bool = False

class BanRequest(BaseModel):
    reason: str
    duration_hours: Optional[int] = None  # None = permanent

# Message Models
class Reaction(BaseModel):
    user_id: str
    emoji: str

class MessageCreate(BaseModel):
    content: str
    type: MessageType = MessageType.TEXT
    media_urls: Optional[List[str]] = []
    reply_to: Optional[str] = None

class MessageEdit(BaseModel):
    content: str

class GroupMessage(BaseModel):
    id: str
    group_id: str
    sender_id: str
    content: str
    type: MessageType
    media_urls: List[str] = []
    reply_to: Optional[str] = None
    reactions: List[Reaction] = []
    edited: bool = False
    deleted: bool = False
    created_at: datetime

# Moderation Models
class ModerationLog(BaseModel):
    id: str
    group_id: str
    moderator_id: str
    target_user_id: str
    action: ModerationAction
    reason: Optional[str] = None
    duration: Optional[int] = None
    timestamp: datetime

# Response Models
class GroupListResponse(BaseModel):
    groups: List[Group]
    total: int

class MessageListResponse(BaseModel):
    messages: List[GroupMessage]
    total: int
    page: int
    has_more: bool

class MemberListResponse(BaseModel):
    members: List[GroupMember]
    total: int
