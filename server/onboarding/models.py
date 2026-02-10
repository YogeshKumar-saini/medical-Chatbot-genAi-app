from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from enum import Enum
from datetime import datetime

class LinkStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    APPROVED = "APPROVED"  # Added for consistency
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class ApprovalStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2)
    slug: str
    contact_email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: str
    created_at: Optional[datetime] = None
    is_verified: bool = False
    verified_at: Optional[datetime] = None
    admin_id: Optional[str] = None # The Org Admin who owns this

class DoctorProfileBase(BaseModel):
    specialization: str
    education: Optional[str] = None
    experience_years: int = 0
    bio: Optional[str] = None
    is_onboarded: bool = False
    
class DoctorProfileCreate(DoctorProfileBase):
    organization_id: Optional[str] = None # Request to join this org

class DoctorProfileResponse(DoctorProfileBase):
    user_id: str
    created_at: datetime
    organization_id: Optional[str] = None
    org_request_status: ApprovalStatus = ApprovalStatus.NOT_STARTED

class PatientProfileBase(BaseModel):
    date_of_birth: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[List[str]] = None
    is_onboarded: bool = False
    org_approval_status: ApprovalStatus = ApprovalStatus.NOT_STARTED
    doctor_link_status: ApprovalStatus = ApprovalStatus.NOT_STARTED
    
class PatientProfileCreate(PatientProfileBase):
    organization_id: str  # Mandatory now


class PatientProfileResponse(PatientProfileBase):
    user_id: str
    created_at: datetime
    organization_id: Optional[str] = None

class DoctorPatientLinkResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    organization_id: str
    status: LinkStatus
    created_at: datetime
    patient_name: Optional[str] = None

class LinkRequest(BaseModel):
    doctor_id: str
    organization_id: str

class OnboardingStatusResponse(BaseModel):
    is_onboarded: bool
    org_approval_status: ApprovalStatus
    doctor_link_status: ApprovalStatus
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    message: str
