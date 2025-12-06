from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging
import asyncio

from auth.routes import authenticate
from config.db import users_collection
from .models import StoryCreate, Story, StoryWithUser
from .service import StoryService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Stories"])

@router.post("/", status_code=201)
async def create_story(
    story_data: StoryCreate,
    user: dict = Depends(authenticate)
):
    """Create a story (expires in 24h)"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    story_id = await StoryService.create_story(
        user_id=user_id,
        media_url=story_data.media_url,
        media_type=story_data.media_type.value,
        caption=story_data.caption
    )
    
    if not story_id:
        raise HTTPException(500, "Failed to create story")
    
    return {"id": story_id, "message": "Story created successfully"}

@router.get("/", response_model=List[StoryWithUser])
async def get_feed_stories(user: dict = Depends(authenticate)):
    """Get stories from users you follow"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    stories = await StoryService.get_feed_stories(user_id)
    
    return stories

@router.get("/{user_id}", response_model=List[Story])
async def get_user_stories(user_id: str):
    """Get stories from a specific user"""
    stories = await StoryService.get_user_stories(user_id)
    
    return stories

@router.post("/{story_id}/view")
async def view_story(
    story_id: str,
    user: dict = Depends(authenticate)
):
    """Mark story as viewed"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    viewer_id = str(user_doc["_id"])
    
    success = await StoryService.view_story(story_id, viewer_id)
    
    if not success:
        raise HTTPException(404, "Story not found")
    
    return {"message": "Story viewed"}

@router.delete("/{story_id}")
async def delete_story(
    story_id: str,
    user: dict = Depends(authenticate)
):
    """Delete own story"""
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    success = await StoryService.delete_story(story_id, user_id)
    
    if not success:
        raise HTTPException(403, "Not authorized or story not found")
    
    return {"message": "Story deleted successfully"}
