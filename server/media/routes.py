from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from typing import Optional
import logging
import asyncio
from pathlib import Path

from auth.routes import authenticate
from config.db import users_collection
from .upload_service import MediaUploadService, UPLOAD_DIR
from groups.permissions import is_group_member

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Media"])

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    user: dict = Depends(authenticate)
):
    """Upload a media file"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    result = await MediaUploadService.upload_file(file, user_id)
    
    if not result:
        raise HTTPException(400, "Failed to upload file (invalid type or too large)")
    
    return result

@router.get("/{file_type}/{filename}")
async def get_media(file_type: str, filename: str):
    """Serve a media file"""
    file_path = UPLOAD_DIR / file_type / filename
    
    if not file_path.exists():
        raise HTTPException(404, "File not found")
    
    return FileResponse(file_path)

@router.get("/images/thumbnails/{filename}")
async def get_thumbnail(filename: str):
    """Serve a thumbnail"""
    thumb_path = UPLOAD_DIR / "images" / "thumbnails" / filename
    
    if not thumb_path.exists():
        raise HTTPException(404, "Thumbnail not found")
    
    return FileResponse(thumb_path)

@router.delete("/{file_type}/{filename}")
async def delete_media(
    file_type: str,
    filename: str,
    user: dict = Depends(authenticate)
):
    """Delete a media file (owner only)"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    success = await MediaUploadService.delete_file(filename, file_type, user_id)
    
    if not success:
        raise HTTPException(403, "Not authorized or file not found")
    
    return {"message": "File deleted successfully"}

@router.get("/groups/{group_id}/gallery")
async def get_group_media_gallery(
    group_id: str,
    media_type: Optional[str] = Query(None),
    user: dict = Depends(authenticate)
):
    """Get media gallery for a group"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    # Check if user is member
    if not await is_group_member(user_id, group_id):
        raise HTTPException(403, "Not a member of this group")
    
    media = await MediaUploadService.get_group_media(group_id, media_type)
    
    return {
        "media": media,
        "total": len(media)
    }
