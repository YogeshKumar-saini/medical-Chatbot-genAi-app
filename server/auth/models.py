# auth/models.py - Enhanced data models
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Literal
from datetime import datetime
import re

class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username must be 3-50 characters")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    role: Literal["admin", "doctor", "nurse", "patient", "other"] = Field(..., description="User role")
    email: Optional[EmailStr] = Field(None, description="Optional email for password recovery")
    full_name: Optional[str] = Field(None, min_length=2, max_length=100, description="Full name")
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    role: str
    full_name: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

# auth/hash_utils.py - Optimized password hashing
import bcrypt
import logging
from functools import lru_cache
from typing import Tuple

logger = logging.getLogger(__name__)

# Cache salt rounds for consistency
SALT_ROUNDS = 12

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt with optimized salt rounds
    """
    try:
        salt = bcrypt.gensalt(rounds=SALT_ROUNDS)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Password hashing failed: {e}")
        raise ValueError("Password hashing failed")

def verify_password(password: str, hashed: str) -> bool:
    """
    Verify a password against its hash with error handling
    """
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        logger.error(f"Password verification failed: {e}")
        return False

def check_password_strength(password: str) -> Tuple[bool, str]:
    """
    Check password strength and return feedback
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password is too long (max 128 characters)"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    strength_score = sum([has_upper, has_lower, has_digit, has_special])
    
    if strength_score < 3:
        return False, "Password must contain uppercase, lowercase, numbers, and special characters"
    
    return True, "Strong password"

# auth/rate_limiter.py - Rate limiting for security
import time
import asyncio
from collections import defaultdict, deque
from typing import Dict, Tuple

class RateLimiter:
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300):  # 5 attempts per 5 minutes
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.attempts: Dict[str, deque] = defaultdict(deque)
    
    def is_rate_limited(self, identifier: str) -> Tuple[bool, int]:
        """
        Check if identifier is rate limited
        Returns (is_limited, seconds_until_reset)
        """
        current_time = time.time()
        user_attempts = self.attempts[identifier]
        
        # Remove old attempts outside the window
        while user_attempts and user_attempts[0] <= current_time - self.window_seconds:
            user_attempts.popleft()
        
        if len(user_attempts) >= self.max_attempts:
            oldest_attempt = user_attempts[0]
            seconds_until_reset = int(self.window_seconds - (current_time - oldest_attempt))
            return True, max(0, seconds_until_reset)
        
        return False, 0
    
    def record_attempt(self, identifier: str):
        """Record a failed attempt"""
        current_time = time.time()
        self.attempts[identifier].append(current_time)
    
    def reset_attempts(self, identifier: str):
        """Reset attempts for successful login"""
        if identifier in self.attempts:
            del self.attempts[identifier]

# auth/routes.py - Optimized authentication routes
from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from datetime import datetime, timedelta
import logging
import asyncio
from typing import Optional

from .models import SignupRequest, LoginRequest, UserResponse
from .hash_utils import hash_password, verify_password
from config.db import users_collection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBasic()

# Rate limiter instances
login_rate_limiter = RateLimiter(max_attempts=5, window_seconds=300)  # 5 attempts per 5 minutes
signup_rate_limiter = RateLimiter(max_attempts=3, window_seconds=3600)  # 3 signups per hour

def get_client_ip(request: Request) -> str:
    """Get client IP address for rate limiting"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

async def authenticate_user(credentials: HTTPBasicCredentials = Depends(security)) -> dict:
    """
    Optimized user authentication with rate limiting
    """
    identifier = credentials.username
    
    # Check rate limiting
    is_limited, reset_time = login_rate_limiter.is_rate_limited(identifier)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Try again in {reset_time} seconds."
        )
    
    try:
        # Find user in database
        user = await asyncio.to_thread(
            users_collection.find_one, 
            {"username": credentials.username}
        )
        
        if not user:
            login_rate_limiter.record_attempt(identifier)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Verify password
        if not verify_password(credentials.password, user["password"]):
            login_rate_limiter.record_attempt(identifier)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Update last login
        await asyncio.to_thread(
            users_collection.update_one,
            {"username": credentials.username},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Reset rate limiting on successful login
        login_rate_limiter.reset_attempts(identifier)
        
        return {
            "username": user["username"],
            "role": user["role"],
            "full_name": user.get("full_name"),
            "last_login": user.get("last_login")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error for user {credentials.username}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable"
        )

@router.post("/signup", response_model=dict)
async def signup(request: Request, signup_data: SignupRequest):
    """
    Optimized user registration with validation and rate limiting
    """
    client_ip = get_client_ip(request)
    
    # Check rate limiting
    is_limited, reset_time = signup_rate_limiter.is_rate_limited(client_ip)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many signup attempts. Try again in {reset_time//60} minutes."
        )
    
    try:
        # Check password strength
        is_strong, message = check_password_strength(signup_data.password)
        if not is_strong:
            signup_rate_limiter.record_attempt(client_ip)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        # Check if user already exists
        existing_user = await asyncio.to_thread(
            users_collection.find_one,
            {"username": signup_data.username}
        )
        
        if existing_user:
            signup_rate_limiter.record_attempt(client_ip)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Hash password and create user
        hashed_password = hash_password(signup_data.password)
        
        user_doc = {
            "username": signup_data.username,
            "password": hashed_password,
            "role": signup_data.role,
            "created_at": datetime.utcnow(),
            "last_login": None,
            "is_active": True
        }
        
        result = await asyncio.to_thread(
            users_collection.insert_one,
            user_doc
        )
        
        logger.info(f"New user registered: {signup_data.username} with role {signup_data.role}")
        
        return {
            "message": "User created successfully",
            "username": signup_data.username,
            "role": signup_data.role
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error for user {signup_data.username}: {e}")
        signup_rate_limiter.record_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User registration failed"
        )

@router.post("/login", response_model=UserResponse)
async def login(user: dict = Depends(authenticate_user)):
    """
    User login endpoint
    """
    return UserResponse(
        username=user["username"],
        role=user["role"],
        full_name=user.get("full_name"),
        last_login=user.get("last_login")
    )

@router.post("/logout")
async def logout(user: dict = Depends(authenticate_user)):
    """
    User logout endpoint
    """
    return {"message": f"Successfully logged out {user['username']}"}

@router.get("/profile", response_model=UserResponse)
async def get_profile(user: dict = Depends(authenticate_user)):
    """
    Get user profile information
    """
    return UserResponse(
        username=user["username"],
        role=user["role"],
        full_name=user.get("full_name"),
        last_login=user.get("last_login")
    )

@router.put("/profile")
async def update_profile(
    profile_data: dict,
    user: dict = Depends(authenticate_user)
):
    """
    Update user profile
    """
    allowed_fields = ["full_name", "email"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    try:
        await asyncio.to_thread(
            users_collection.update_one,
            {"username": user["username"]},
            {"$set": update_data}
        )
        
        return {"message": "Profile updated successfully"}
        
    except Exception as e:
        logger.error(f"Profile update error for user {user['username']}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed"
        )