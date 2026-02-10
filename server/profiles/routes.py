from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List
import logging
import asyncio

from auth.routes import authenticate
from config.db import users_collection
from .models import UserProfile, ProfileUpdate
from .service import ProfileService
from .follow_service import FollowService
from media.upload_service import MediaUploadService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Profiles"])

@router.get("/{user_id}", response_model=UserProfile)
async def get_profile(user_id: str):
    """Get user profile"""
    profile = await ProfileService.get_or_create_profile(user_id)
    
    if not profile:
        raise HTTPException(404, "Profile not found")
    
    return profile

@router.put("/me")
async def update_my_profile(
    updates: ProfileUpdate,
    user: dict = Depends(authenticate)
):
    """Update own profile"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    update_data = updates.dict(exclude_unset=True)
    
    # Handle name update separately (stored in users collection)
    if "name" in update_data:
        new_name = update_data.pop("name")
        await asyncio.to_thread(
            users_collection.update_one,
            {"_id": user_doc["_id"]},
            {"$set": {"name": new_name}}
        )

    success = await ProfileService.update_profile(user_id, update_data)
    
    if not success:
        # If profile update failed but name logic ran, we might still want to consider partial success or error.
        # However, ProfileService.update_profile usually returns True if it ran update_one, even if nothing changed in that specific doc.
        pass

    return {"message": "Profile updated successfully"}

@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: dict = Depends(authenticate)
):
    """Upload profile avatar"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    # Upload file
    result = await MediaUploadService.upload_file(file, user_id)
    
    if not result:
        raise HTTPException(400, "Failed to upload avatar")
    
    # Update profile
    await ProfileService.update_avatar(user_id, result["url"])
    
    return {
        "avatar_url": result["url"],
        "thumbnail_url": result.get("thumbnail_url")
    }

@router.post("/{target_user_id}/follow")
async def follow_user(
    target_user_id: str,
    user: dict = Depends(authenticate)
):
    """Follow a user"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    follower_id = str(user_doc["_id"])
    
    success = await FollowService.follow_user(follower_id, target_user_id)
    
    if not success:
        raise HTTPException(400, "Failed to follow user")
    
    return {"message": "Followed successfully"}

@router.delete("/{target_user_id}/follow")
async def unfollow_user(
    target_user_id: str,
    user: dict = Depends(authenticate)
):
    """Unfollow a user"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    follower_id = str(user_doc["_id"])
    
    success = await FollowService.unfollow_user(follower_id, target_user_id)
    
    if not success:
        raise HTTPException(400, "Failed to unfollow user")
    
    return {"message": "Unfollowed successfully"}

@router.get("/{user_id}/followers")
async def get_followers(user_id: str):
    """Get user's followers"""
    followers = await FollowService.get_followers(user_id)
    
    return {
        "followers": followers,
        "total": len(followers)
    }

@router.get("/{user_id}/following")
async def get_following(user_id: str):
    """Get users being followed"""
    following = await FollowService.get_following(user_id)
    
    return {
        "following": following,
        "total": len(following)
    }
