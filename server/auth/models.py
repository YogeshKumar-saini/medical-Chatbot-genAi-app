from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Literal
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ORG_ADMIN = "ORG_ADMIN"
    GEN_ADMIN = "GEN_ADMIN"
    PATIENT = "PATIENT"
    THERAPIST = "THERAPIST"

class OtpType(str, Enum):
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
    PASSWORD_RESET = "PASSWORD_RESET"

class Otp(BaseModel):
    identifier: EmailStr
    type: OtpType
    otp_hash: str
    expires_at: datetime
    attempts: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    role: UserRole
    name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    
    @validator('role')
    def validate_role(cls, v):
        if v not in UserRole.__members__.values():
            raise ValueError('Invalid role')
        return v

class VerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    name: Optional[str] = None
    phone: Optional[str] = None
    is_verified: bool
    created_at: Optional[datetime] = None