import asyncio
from datetime import datetime
from config.db import db
from bson import ObjectId
from .models import MoodEntryCreate, JournalEntryCreate

moods_collection = db["wellness_moods"]
journal_collection = db["wellness_journal"]

class WellnessService:
    @staticmethod
    async def log_mood(user_id: str, entry: MoodEntryCreate):
        doc = entry.dict()
        doc["user_id"] = user_id
        doc["created_at"] = datetime.utcnow()
        
        result = await asyncio.to_thread(moods_collection.insert_one, doc)
        doc["id"] = str(result.inserted_id)
        return doc

    @staticmethod
    async def get_mood_history(user_id: str, limit: int = 30):
        cursor = moods_collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        moods = await asyncio.to_thread(lambda: list(cursor))
        return [{"id": str(m["_id"]), **{k:v for k,v in m.items() if k != "_id"}} for m in moods]

    @staticmethod
    async def create_journal_entry(user_id: str, entry: JournalEntryCreate):
        doc = entry.dict()
        doc["user_id"] = user_id
        doc["created_at"] = datetime.utcnow()
        doc["updated_at"] = datetime.utcnow()
        
        result = await asyncio.to_thread(journal_collection.insert_one, doc)
        doc["id"] = str(result.inserted_id)
        return doc

    @staticmethod
    async def get_journal_entries(user_id: str, limit: int = 20, skip: int = 0):
        cursor = journal_collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        entries = await asyncio.to_thread(lambda: list(cursor))
        return [{"id": str(e["_id"]), **{k:v for k,v in e.items() if k != "_id"}} for e in entries]

    @staticmethod
    async def delete_journal_entry(user_id: str, entry_id: str):
        result = await asyncio.to_thread(
            journal_collection.delete_one, 
            {"_id": ObjectId(entry_id), "user_id": user_id}
        )
        return result.deleted_count > 0
