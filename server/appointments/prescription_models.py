from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime
from bson import ObjectId

class PrescriptionStatus(str, Enum):
    PENDING = "PENDING"
    SENT_TO_PHARMACY = "SENT_TO_PHARMACY"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"

class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class PrescriptionCreate(BaseModel):
    appointment_id: str
    patient_id: str
    medications: List[Medication]
    pharmacy_id: Optional[str] = None # If forwarding to specific pharmacy
    notes: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    appointment_id: str
    medications: List[Medication]
    status: PrescriptionStatus
    pharmacy_id: Optional[str] = None
    created_at: datetime
