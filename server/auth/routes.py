from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import hashlib
import asyncio

from .models import (
    SignupRequest, LoginRequest, VerifyRequest, 
    UserResponse, UserRole, OtpType, Otp,
    ForgotPasswordRequest, ResetPasswordRequest
)
from .hash_utils import hash_password, verify_password
from .jwt import create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
from .utils import generate_otp_code, send_otp_email
from config.db import users_collection, otps_collection

router = APIRouter()

# OAuth2 scheme for Swagger UI compatibility
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def authenticate(token: str = Depends(oauth2_scheme)):
    """
    Verify JWT token and return user context
    """
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"email": payload.get("sub"), "role": payload.get("role")}

def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest, background_tasks: BackgroundTasks):
    # Check database connection
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    # Check if user exists
    existing_user = await asyncio.to_thread(users_collection.find_one, {"email": req.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create user (unverified)
    user_doc = {
        "email": req.email,
        "password": hash_password(req.password),
        "role": req.role.value,
        "name": req.name,
        "phone": req.phone,
        "is_verified": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await asyncio.to_thread(users_collection.insert_one, user_doc)
    
    # Generate and Send OTP
    otp_code = generate_otp_code()
    otp_hash = hash_otp(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    otp_doc = {
        "identifier": req.email,
        "type": OtpType.EMAIL_VERIFICATION.value,
        "otp_hash": otp_hash,
        "expires_at": expires_at,
        "attempts": 0,
        "created_at": datetime.utcnow()
    }
    
    await asyncio.to_thread(otps_collection.insert_one, otp_doc)
    
    # Send email in background
    background_tasks.add_task(send_otp_email, req.email, otp_code, OtpType.EMAIL_VERIFICATION)
    
    return {"message": "User registered successfully. Please verify your email.", "email": req.email}

@router.post("/verify-email")
async def verify_email(req: VerifyRequest):
    # Find OTP
    otp_hash = hash_otp(req.otp)
    otp_record = await asyncio.to_thread(
        otps_collection.find_one,
        {
            "identifier": req.email, 
            "type": OtpType.EMAIL_VERIFICATION.value,
            "otp_hash": otp_hash
        }
    )
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if otp_record["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
        
    # Mark user as verified
    result = await asyncio.to_thread(
        users_collection.update_one,
        {"email": req.email},
        {"$set": {"is_verified": True}}
    )
    
    if result.modified_count == 0:
         # Maybe user already verified or not found?
         user = await asyncio.to_thread(users_collection.find_one, {"email": req.email})
         if not user:
             raise HTTPException(status_code=404, detail="User not found")
    
    # Delete OTP (or mark used)
    await asyncio.to_thread(otps_collection.delete_one, {"_id": otp_record["_id"]})
    
    return {"message": "Email verified successfully"}

@router.post("/login")
async def login(req: LoginRequest): 
    # Note: Using custom LoginRequest instead of OAuth2PasswordRequestForm for JSON body support
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    user = await asyncio.to_thread(users_collection.find_one, {"email": req.email})
    
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    if not user.get("is_verified", False):
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified. Please verify your account.",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_payload = {"sub": user["email"], "role": user["role"]}
    # Add extra fields if needed
    
    access_token = create_access_token(
        data=token_payload,
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "role": user["role"],
            "name": user.get("name"),
            "id": str(user.get("_id"))
        }
    }

# Also support OAuth2 form login for Swagger UI
@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
        
    user = await asyncio.to_thread(users_collection.find_one, {"email": form_data.username}) # username field in form is email
    
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Allow login even if not verified ONLY for swagger? No, better consistency.
    # But OAuth form doesn't support easy error msg handling sometimes.
    if not user.get("is_verified", False):
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(authenticate)):
    user = await asyncio.to_thread(users_collection.find_one, {"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "name": user.get("name"),
        "phone": user.get("phone"),
        "is_verified": user.get("is_verified", False),
        "created_at": user.get("created_at")
    }

@router.get("/debug-token")
async def debug_token(current_user: dict = Depends(authenticate)):
    """
    Debug endpoint to help users verify their JWT token information.
    Returns the decoded token payload.
    """
    user = await asyncio.to_thread(users_collection.find_one, {"email": current_user["email"]})
    
    return {
        "token_payload": current_user,
        "database_role": user.get("role") if user else None,
        "roles_match": current_user.get("role") == user.get("role") if user else False,
        "message": "This endpoint shows your JWT token claims and database role for debugging purposes."
    }

# Forgot/Reset Password Routes
@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user = await asyncio.to_thread(users_collection.find_one, {"email": req.email})
    if not user:
         # silently fail to prevent enumeration? Or return success anyway.
         # For this project, let's be explicit or return generic msg.
         return {"message": "If account exists, OTP sent."}
         
    # Generate OTP
    otp_code = generate_otp_code()
    otp_hash = hash_otp(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    otp_doc = {
        "identifier": req.email,
        "type": OtpType.PASSWORD_RESET.value,
        "otp_hash": otp_hash,
        "expires_at": expires_at,
        "attempts": 0,
        "created_at": datetime.utcnow()
    }
    
    await asyncio.to_thread(otps_collection.insert_one, otp_doc)
    background_tasks.add_task(send_otp_email, req.email, otp_code, OtpType.PASSWORD_RESET)
    
    return {"message": "If account exists, OTP sent."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    # Verify OTP
    otp_hash = hash_otp(req.otp)
    otp_record = await asyncio.to_thread(
        otps_collection.find_one,
        {
            "identifier": req.email, 
            "type": OtpType.PASSWORD_RESET.value,
            "otp_hash": otp_hash
        }
    )
    
    if not otp_record or otp_record["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    # Update Password
    new_hash = hash_password(req.new_password)
    result = await asyncio.to_thread(
        users_collection.update_one,
        {"email": req.email},
        {"$set": {"password": new_hash}}
    )
    
    # Invalidate tokens? (Optional)
    # Delete OTP
    await asyncio.to_thread(otps_collection.delete_one, {"_id": otp_record["_id"]})
    
    return {"message": "Password reset successfully"}
