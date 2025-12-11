from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from auth.routes import authenticate
from config.db import users_collection
import asyncio
from .models import (
    MoodEntryCreate, MoodEntryResponse,
    JournalEntryCreate, JournalEntryResponse
)
from .service import WellnessService

router = APIRouter(tags=["Wellness"])

@router.post("/mood", response_model=MoodEntryResponse)
async def log_mood(entry: MoodEntryCreate, user: dict = Depends(authenticate)):
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    return await WellnessService.log_mood(user_id, entry)

@router.get("/mood/history", response_model=List[MoodEntryResponse])
async def get_mood_history(limit: int = 30, user: dict = Depends(authenticate)):
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    return await WellnessService.get_mood_history(user_id, limit)

@router.post("/journal", response_model=JournalEntryResponse)
async def create_journal(entry: JournalEntryCreate, user: dict = Depends(authenticate)):
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    return await WellnessService.create_journal_entry(user_id, entry)

@router.get("/journal", response_model=List[JournalEntryResponse])
async def list_journal_entries(limit: int = 20, skip: int = 0, user: dict = Depends(authenticate)):
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    return await WellnessService.get_journal_entries(user_id, limit, skip)

@router.delete("/journal/{entry_id}")
async def delete_journal_entry(entry_id: str, user: dict = Depends(authenticate)):
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    success = await WellnessService.delete_journal_entry(user_id, entry_id)
    if not success:
        raise HTTPException(404, "Entry not found")
    return {"message": "Entry deleted"}
