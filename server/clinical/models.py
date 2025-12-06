from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class VitalsBase(BaseModel):
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate_bpm: Optional[int] = None
    temperature_celsius: Optional[float] = None
    note: Optional[str] = None

class VitalsCreate(VitalsBase):
    patient_id: str

class VitalsResponse(VitalsBase):
    id: str
    patient_id: str
    recorded_by: str # Doctor ID
    recorded_at: datetime

class NoteType(str, Enum):
    GENERAL = "GENERAL"
    SOAP = "SOAP"
    PRESCRIPTION = "PRESCRIPTION"

class ClinicalNoteBase(BaseModel):
    content: str
    note_type: NoteType = NoteType.GENERAL
    is_private: bool = False # If true, only visible to doctors, not patient

class ClinicalNoteCreate(ClinicalNoteBase):
    patient_id: str

class ClinicalNoteResponse(ClinicalNoteBase):
    id: str
    patient_id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class PrescriptionItem(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class PrescriptionBase(BaseModel):
    items: List[PrescriptionItem]
    notes: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    patient_id: str

class PrescriptionResponse(PrescriptionBase):
    id: str
    patient_id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    issued_at: datetime

class PatientDetailsResponse(BaseModel):
    id: str
    name: str
    email: str
    date_of_birth: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[List[str]] = None
    role: str = "PATIENT"
