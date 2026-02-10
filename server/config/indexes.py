import logging
from pymongo import ASCENDING, DESCENDING
from config.db import (
    users_collection,
    orgs_collection,
    doctor_profiles_collection,
    patient_profiles_collection,
    links_collection
)

logger = logging.getLogger(__name__)

async def ensure_indexes():
    """
    Ensures that all necessary indexes exist in the database.
    This should be called on application startup.
    """
    logger.info("Checking and creating database indexes...")

    try:
        # Users: Email must be unique
        users_collection.create_index([("email", ASCENDING)], unique=True, partialFilterExpression={"email": {"$exists": True, "$type": "string"}})
        logger.info("✅ Index: users.email (unique)")

        # Organizations: Slug must be unique
        orgs_collection.create_index([("slug", ASCENDING)], unique=True)
        # Search organizations by Admin ID
        orgs_collection.create_index([("admin_id", ASCENDING)])
        # Search by verification status
        orgs_collection.create_index([("is_verified", ASCENDING)])
        logger.info("✅ Indexes: organizations (slug, admin_id, is_verified)")

        # Doctor Profiles: Search by user_id (unique wrapper) and Organization
        doctor_profiles_collection.create_index([("user_id", ASCENDING)], unique=True)
        doctor_profiles_collection.create_index([("organization_id", ASCENDING)])
        doctor_profiles_collection.create_index([("org_request_status", ASCENDING)])
        logger.info("✅ Indexes: doctor_profiles (user_id, organization_id, status)")

        # Patient Profiles: Search by user_id
        patient_profiles_collection.create_index([("user_id", ASCENDING)], unique=True)
        patient_profiles_collection.create_index([("organization_id", ASCENDING)])
        logger.info("✅ Indexes: patient_profiles (user_id, organization_id)")

        # Links: Doctor + Patient combination must be unique
        links_collection.create_index(
            [("doctor_id", ASCENDING), ("patient_id", ASCENDING)], 
            unique=True
        )
        # Search links by doctor or patient
        links_collection.create_index([("doctor_id", ASCENDING)])
        links_collection.create_index([("patient_id", ASCENDING)])
        logger.info("✅ Indexes: links (doctor_id+patient_id, doctor_id, patient_id)")

        logger.info("🚀 All indexes ensured successfully.")

    except Exception as e:
        logger.error(f"❌ Failed to create indexes: {e}")
