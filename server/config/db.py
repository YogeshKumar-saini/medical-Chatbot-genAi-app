import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
appName = os.getenv("appName")

# Lazy database connection
_client = None
_db = None
_users_collection = None

def get_client():
    global _client
    if _client is None:
        try:
            _client = MongoClient(MONGO_URI)
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise
    return _client

def get_db():
    global _db
    if _db is None:
        _db = get_client()[DB_NAME]
    return _db

def get_users_collection():
    global _users_collection
    if _users_collection is None:
        _users_collection = get_db()["users"]
    return _users_collection

# For backward compatibility
try:
    client = get_client()
    db = get_db()
    users_collection = get_users_collection()
except Exception as e:
    print(f"Database connection failed at startup: {e}")
    # Set dummy values to prevent import errors
    client = None
    db = None
    users_collection = None

async def test_connection():
    """Test MongoDB connection"""
    try:
        # Ping the database (synchronous call)
        result = client.admin.command('ping')
        print(f"✅ Successfully connected to MongoDB database: {DB_NAME}")
        return True
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return False

print(f"Connected to MongoDB database: {DB_NAME} with appName: {appName}")