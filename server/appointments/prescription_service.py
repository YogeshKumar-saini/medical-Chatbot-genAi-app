import asyncio
from datetime import datetime
from config.db import get_orgs_collection # Using orgs as generic collection provider if needed, or define new one
from config.db import db
from .prescription_models import PrescriptionCreate, PrescriptionStatus

# Lazy load collection
_prescriptions_collection = None
def get_prescriptions_collection():
    global _prescriptions_collection
    if _prescriptions_collection is None:
        _prescriptions_collection = db["prescriptions"]
    return _prescriptions_collection

class PrescriptionService:
    @staticmethod
    async def create_prescription(data: PrescriptionCreate, doctor_id: str):
        collection = get_prescriptions_collection()
        
        doc = data.dict()
        doc["doctor_id"] = doctor_id
        doc["status"] = PrescriptionStatus.PENDING.value
        doc["created_at"] = datetime.utcnow()
        
        # If pharmacy_id is present, we could simulate "forwarding" here
        if doc.get("pharmacy_id"):
            doc["status"] = PrescriptionStatus.SENT_TO_PHARMACY.value
            # In real world: Call Pharmacy API here
            
        result = await asyncio.to_thread(collection.insert_one, doc)
        doc["id"] = str(result.inserted_id)
        if "_id" in doc: del doc["_id"]
        
        return doc
    
    @staticmethod
    async def get_prescriptions_by_appointment(appointment_id: str):
        collection = get_prescriptions_collection()
        cursor = collection.find({"appointment_id": appointment_id})
        return await asyncio.to_thread(lambda: list(cursor))
