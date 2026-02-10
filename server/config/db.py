import os
from dotenv import load_dotenv
from pymongo import MongoClient

from pathlib import Path
load_dotenv(Path(__file__).parent.parent / ".env", override=True)

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

# New Collection Accessor
_chats_collection = None

def get_chats_collection():
    global _chats_collection
    if _chats_collection is None:
        _chats_collection = get_db()["chats"]
    return _chats_collection

chats_collection = get_chats_collection() if db is not None else None

# OTP Collection Accessor
_otps_collection = None

def get_otps_collection():
    global _otps_collection
    if _otps_collection is None:
        _otps_collection = get_db()["otps"]
    return _otps_collection

otps_collection = get_otps_collection() if db is not None else None

# Onboarding & Linking Collections
_orgs_collection = None
_doctor_profiles_collection = None
_patient_profiles_collection = None
_links_collection = None

def get_orgs_collection():
    global _orgs_collection
    if _orgs_collection is None:
        _orgs_collection = get_db()["organizations"]
    return _orgs_collection

def get_doctor_profiles_collection():
    global _doctor_profiles_collection
    if _doctor_profiles_collection is None:
        _doctor_profiles_collection = get_db()["doctor_profiles"]
    return _doctor_profiles_collection

def get_patient_profiles_collection():
    global _patient_profiles_collection
    if _patient_profiles_collection is None:
        _patient_profiles_collection = get_db()["patient_profiles"]
    return _patient_profiles_collection

def get_links_collection():
    global _links_collection
    if _links_collection is None:
        _links_collection = get_db()["doctor_patient_links"]
    return _links_collection

orgs_collection = get_orgs_collection() if db is not None else None
doctor_profiles_collection = get_doctor_profiles_collection() if db is not None else None
patient_profiles_collection = get_patient_profiles_collection() if db is not None else None
links_collection = get_links_collection() if db is not None else None

# Appointments Collection
_appointments_collection = None

def get_appointments_collection():
    global _appointments_collection
    if _appointments_collection is None:
        _appointments_collection = get_db()["appointments"]
    return _appointments_collection

appointments_collection = get_appointments_collection() if db is not None else None

# Clinical Collections
_clinical_notes_collection = None
_prescriptions_collection = None
_vitals_collection = None
_delete_requests_collection = None # Added for delete requests

def get_clinical_notes_collection():
    global _clinical_notes_collection
    if _clinical_notes_collection is None:
        _clinical_notes_collection = get_db()["clinical_notes"]
    return _clinical_notes_collection

def get_prescriptions_collection():
    global _prescriptions_collection
    if _prescriptions_collection is None:
        _prescriptions_collection = get_db()["prescriptions"]
    return _prescriptions_collection

def get_vitals_collection():
    global _vitals_collection
    if _vitals_collection is None:
        _vitals_collection = get_db()["vitals"]
    return _vitals_collection

clinical_notes_collection = get_clinical_notes_collection() if db is not None else None
prescriptions_collection = get_prescriptions_collection() if db is not None else None
vitals_collection = get_vitals_collection() if db is not None else None

def get_delete_requests_collection():
    global _delete_requests_collection
    if _delete_requests_collection is None:
        _delete_requests_collection = get_db()["delete_requests"]
    return _delete_requests_collection

delete_requests_collection = get_delete_requests_collection() if db is not None else None


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