from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MediaType(str, Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"

class StoryCreate(BaseModel):
    media_url: str
    media_type: MediaType
    caption: Optional[str] = None

class Story(BaseModel):
    id: str
    user_id: str
    media_url: str
    media_type: MediaType
    caption: Optional[str] = None
    views: List[str] = []
    view_count: int = 0
    created_at: datetime
    expires_at: datetime

class StoryWithUser(Story):
    user_name: str
    user_avatar: Optional[str] = None
