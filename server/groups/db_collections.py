from config.db import db

# Initialize collections
groups_collection = db["groups"] if db is not None else None
group_members_collection = db["group_members"] if db is not None else None
group_messages_collection = db["group_messages"] if db is not None else None
moderation_logs_collection = db["moderation_logs"] if db is not None else None

def create_indexes():
    """Create database indexes for optimal performance"""
    
    # Groups indexes
    groups_collection.create_index([("organization_id", 1)])
    groups_collection.create_index([("therapist_id", 1)])
    groups_collection.create_index([("type", 1)])
    
    # Group members indexes
    group_members_collection.create_index([("group_id", 1), ("user_id", 1)], unique=True)
    group_members_collection.create_index([("user_id", 1)])
    group_members_collection.create_index([("status", 1)])
    group_members_collection.create_index([("ban_expires_at", 1)])
    
    # Group messages indexes
    group_messages_collection.create_index([("group_id", 1), ("created_at", -1)])
    group_messages_collection.create_index([("sender_id", 1)])
    group_messages_collection.create_index([("deleted", 1)])
    
    # Moderation logs indexes
    moderation_logs_collection.create_index([("group_id", 1), ("timestamp", -1)])
    moderation_logs_collection.create_index([("target_user_id", 1)])
    
    print("✅ Group chat indexes created successfully")

# Auto-create indexes on import (optional, can be called manually)
try:
    create_indexes()
except Exception as e:
    print(f"⚠️ Index creation skipped or failed: {e}")
