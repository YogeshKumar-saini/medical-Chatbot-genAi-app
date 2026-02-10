from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sources: Optional[List[str]] = []

class ChatSession(BaseModel):
    user_id: str
    title: str = "New Chat"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    messages: List[Message] = []

class CreateChatRequest(BaseModel):
    message: str
