from pydantic import BaseModel, Field, validator
from typing import Optional, List
from enum import Enum
from datetime import datetime

class AppointmentStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class AppointmentSlot(BaseModel):
    doctor_id: str
    start_time: datetime
    end_time: datetime
    is_booked: bool = False

class CreateSlotRequest(BaseModel):
    start_time: datetime
    end_time: datetime

class AppointmentBase(BaseModel):
    doctor_id: str
    start_time: datetime
    end_time: datetime
    subject: str = Field(..., min_length=1)
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: str
    patient_id: str
    status: AppointmentStatus
    meeting_link: Optional[str] = None
    created_at: datetime
