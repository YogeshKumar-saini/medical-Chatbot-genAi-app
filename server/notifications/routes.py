from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from auth.routes import authenticate
from config.db import db, users_collection
from bson import ObjectId
import asyncio
from datetime import datetime

router = APIRouter(tags=["Notifications"])
notifications_collection = db["notifications"]

@router.get("/", response_description="List user notifications")
async def list_notifications(limit: int = 20, unread_only: bool = False, user: dict = Depends(authenticate)):
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
        
    cursor = notifications_collection.find(query).sort("created_at", -1).limit(limit)
    notifs = await asyncio.to_thread(lambda: list(cursor))
    
    return [{"id": str(n["_id"]), **{k:v for k,v in n.items() if k != "_id"}} for n in notifs]

@router.put("/{notification_id}/read")
async def mark_as_read(notification_id: str, user: dict = Depends(authenticate)):
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    result = await asyncio.to_thread(
        notifications_collection.update_one,
        {"_id": ObjectId(notification_id), "user_id": user_id},
        {"$set": {"read": True, "read_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, "Notification not found")
        
    return {"message": "Marked as read"}

# Helper to create notification (internal use)
async def create_notification(user_id: str, title: str, message: str, type: str = "INFO"):
    doc = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "read": False,
        "created_at": datetime.utcnow()
    }
    await asyncio.to_thread(notifications_collection.insert_one, doc)
