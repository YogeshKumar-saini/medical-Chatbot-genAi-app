from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
import asyncio
from bson import ObjectId

from auth.routes import authenticate
from config.db import (
    clinical_notes_collection, prescriptions_collection, vitals_collection,
    users_collection, links_collection
)
from .models import (
    ClinicalNoteCreate, ClinicalNoteResponse,
    PrescriptionCreate, PrescriptionResponse,
    VitalsCreate, VitalsResponse,
    PatientDetailsResponse
)
from config.db import (
    clinical_notes_collection, prescriptions_collection, vitals_collection,
    users_collection, links_collection, patient_profiles_collection
)

router = APIRouter()

async def verify_doctor_patient_link(doctor_id: str, patient_id: str):
    """
    Ensures that a doctor is linked to a patient.
    """
    link = await asyncio.to_thread(
        links_collection.find_one,
        {
            "doctor_id": doctor_id,
            "patient_id": patient_id,
            "status": {"$in": ["APPROVED", "ACTIVE"]} 
        }
    )
    if not link:
        raise HTTPException(status_code=403, detail="You are not linked to this patient")
    return link

@router.get("/patients/{patient_id}", response_model=PatientDetailsResponse)
async def get_patient_details(patient_id: str, user: dict = Depends(authenticate)):
    if user["role"] in ["SUPER_ADMIN", "GEN_ADMIN"]:
        # Admin bypass
        pass
    elif user["role"] in ["DOCTOR", "THERAPIST"]:
        user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
        doctor_id = str(user_doc["_id"])
        # Verify Link
        await verify_doctor_patient_link(doctor_id, patient_id)
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Fetch Patient User Data
    patient_user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(patient_id)})
    if not patient_user:
        raise HTTPException(404, "Patient not found")
        
    # Fetch Patient Profile
    patient_profile = await asyncio.to_thread(patient_profiles_collection.find_one, {"user_id": patient_id})
    
    return {
        "id": str(patient_user["_id"]),
        "name": patient_user.get("name"),
        "email": patient_user.get("email"),
        "role": patient_user.get("role"),
        "date_of_birth": patient_profile.get("date_of_birth") if patient_profile else None,
        "medical_history": patient_profile.get("medical_history") if patient_profile else None,
        "allergies": patient_profile.get("allergies") if patient_profile else None
    }

# --- Clinical Notes ---

@router.post("/notes", response_model=ClinicalNoteResponse)
async def create_clinical_note(note: ClinicalNoteCreate, user: dict = Depends(authenticate)):
    if user["role"] not in ["DOCTOR", "THERAPIST"]:
        raise HTTPException(status_code=403, detail="Only doctors can create clinical notes")
    
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    doctor_id = str(user_doc["_id"])
    
    # Verify Link
    await verify_doctor_patient_link(doctor_id, note.patient_id)
    
    note_doc = note.dict()
    note_doc["doctor_id"] = doctor_id
    note_doc["doctor_name"] = user_doc.get("name")
    note_doc["created_at"] = datetime.utcnow()
    note_doc["updated_at"] = datetime.utcnow()
    
    result = await asyncio.to_thread(clinical_notes_collection.insert_one, note_doc)
    
    return {
        "id": str(result.inserted_id),
        **note_doc
    }

@router.get("/notes/{patient_id}", response_model=List[ClinicalNoteResponse])
async def get_clinical_notes(patient_id: str, user: dict = Depends(authenticate)):
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    role = user["role"]
    
    if role == "PATIENT":
        # Patient can see their own notes unless private?
        if user_id != patient_id:
             raise HTTPException(status_code=403, detail="You can only view your own records")
        query = {"patient_id": patient_id, "is_private": False}
    elif role in ["DOCTOR", "THERAPIST"]:
        # Verify Link
        await verify_doctor_patient_link(user_id, patient_id)
        query = {"patient_id": patient_id}
    elif role in ["SUPER_ADMIN", "GEN_ADMIN"]:
        query = {"patient_id": patient_id}
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    cursor = clinical_notes_collection.find(query).sort("created_at", -1)
    notes = await asyncio.to_thread(lambda: list(cursor))
    
    return [{"id": str(doc["_id"]), **doc} for doc in notes]

# --- Prescriptions ---

@router.post("/prescriptions", response_model=PrescriptionResponse)
async def create_prescription(rx: PrescriptionCreate, user: dict = Depends(authenticate)):
    if user["role"] not in ["DOCTOR", "THERAPIST"]:
        raise HTTPException(status_code=403, detail="Only doctors can create prescriptions")
        
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    doctor_id = str(user_doc["_id"])
    
    await verify_doctor_patient_link(doctor_id, rx.patient_id)
    
    rx_doc = rx.dict()
    rx_doc["doctor_id"] = doctor_id
    rx_doc["doctor_name"] = user_doc.get("name")
    rx_doc["issued_at"] = datetime.utcnow()
    
    result = await asyncio.to_thread(prescriptions_collection.insert_one, rx_doc)
    
    return {
        "id": str(result.inserted_id),
        **rx_doc
    }

@router.get("/prescriptions/{patient_id}", response_model=List[PrescriptionResponse])
async def get_prescriptions(patient_id: str, user: dict = Depends(authenticate)):
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    role = user["role"]
    
    if role == "PATIENT":
        if user_id != patient_id:
             raise HTTPException(status_code=403, detail="You can only view your own records")
    elif role in ["DOCTOR", "THERAPIST"]:
        await verify_doctor_patient_link(user_id, patient_id)
    elif role in ["SUPER_ADMIN", "GEN_ADMIN"]:
        pass # Admin bypass
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    cursor = prescriptions_collection.find({"patient_id": patient_id}).sort("issued_at", -1)
    rxs = await asyncio.to_thread(lambda: list(cursor))
    
    return [{"id": str(doc["_id"]), **doc} for doc in rxs]
