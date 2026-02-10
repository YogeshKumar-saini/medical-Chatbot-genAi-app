from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class ContentType(str, Enum):
    VIDEO = "VIDEO"
    ARTICLE = "ARTICLE"

class QuizOption(BaseModel):
    text: str
    is_correct: bool

class QuizQuestion(BaseModel):
    question_text: str
    options: List[QuizOption]

class EducationalContent(BaseModel):
    pk: Optional[str] = None # Helper for id
    title: str
    type: ContentType
    url: str
    condition_tags: List[str] # e.g. ["diabetes", "hypertension"]
    thumbnail_url: Optional[str] = None
    quiz: Optional[List[QuizQuestion]] = None

class LibraryRecommendation(BaseModel):
    patient_id: str
    doctor_id: str
    content_id: str
    notes: Optional[str] = None
    created_at: datetime
