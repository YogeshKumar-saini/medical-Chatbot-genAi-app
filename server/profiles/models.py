from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PrivacyLevel(str, Enum):
    EVERYONE = "EVERYONE"
    CONTACTS = "CONTACTS"
    NOBODY = "NOBODY"

class PrivacySettings(BaseModel):
    show_last_seen: PrivacyLevel = PrivacyLevel.EVERYONE
    allow_stories: bool = True
    show_online_status: bool = True

class UserProfile(BaseModel):
    id: str
    user_id: str
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    bio: Optional[str] = None
    status_text: Optional[str] = None
    verified: bool = False
    followers_count: int = 0
    following_count: int = 0
    privacy: PrivacySettings = PrivacySettings()
    last_seen: Optional[datetime] = None
    online: bool = False
    created_at: datetime

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    status_text: Optional[str] = None
    privacy: Optional[PrivacySettings] = None

class FollowerInfo(BaseModel):
    user_id: str
    name: str
    avatar_url: Optional[str] = None
    verified: bool = False
    followed_at: datetime
