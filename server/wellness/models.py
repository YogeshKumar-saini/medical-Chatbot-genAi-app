from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MoodType(str, Enum):
    HAPPY = "HAPPY"
    SAD = "SAD"
    ANXIOUS = "ANXIOUS"
    ANGRY = "ANGRY"
    NEUTRAL = "NEUTRAL"
    EXCITED = "EXCITED"
    TIRED = "TIRED"

class MoodEntryCreate(BaseModel):
    mood: MoodType
    note: Optional[str] = None
    intensity: int = 5 # 1-10

class MoodEntryResponse(BaseModel):
    id: str
    user_id: str
    mood: MoodType
    note: Optional[str]
    intensity: int
    created_at: datetime

class JournalEntryCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []
    mood: Optional[MoodType] = None

class JournalEntryResponse(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    tags: List[str]
    mood: Optional[MoodType]
    created_at: datetime
    updated_at: datetime
