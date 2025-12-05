from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta

from .models import SignupRequest
from .hash_utils import hash_password, verify_password
from .jwt import create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
from config.db import users_collection

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
    return {"username": payload.get("sub"), "role": payload.get("role")}

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest):
    # Convert username to lowercase for consistency
    username_lower = req.username.lower()

    if users_collection.find_one({"username": username_lower}):
        raise HTTPException(status_code=400, detail="User already exists")
    
    users_collection.insert_one({
        "username": username_lower,
        "password": hash_password(req.password),
        "role": req.role
    })
    return {"message": "User created successfully"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint compatible with OAuth2PasswordRequestForm
    """
    user = users_collection.find_one({"username": form_data.username.lower()})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"]
    }
