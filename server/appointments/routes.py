from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
import asyncio
from bson import ObjectId

from auth.routes import authenticate
from config.db import appointments_collection, users_collection
from .models import (
    AppointmentCreate, AppointmentResponse, AppointmentUpdate, AppointmentStatus,
    CreateSlotRequest, AppointmentSlot
)
from .prescription_models import PrescriptionCreate, PrescriptionResponse
from .prescription_service import PrescriptionService

router = APIRouter()

# Collection for Slots (using appointments collection for now or separate?)
# Let's use a separate collection or just mix them? 
# Mix is complex. Separate 'appointment_slots' collection is better.
from config.db import db
slots_collection = db["appointment_slots"]

@router.post("/slots", status_code=status.HTTP_201_CREATED)
async def create_slots(slot_req: CreateSlotRequest, user: dict = Depends(authenticate)):
    if user["role"] not in ["THERAPIST", "DOCTOR"]:
         raise HTTPException(status_code=403, detail="Only doctors can create slots")

    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    doctor_id = str(user_doc["_id"])

    slot = {
        "doctor_id": doctor_id,
        "start_time": slot_req.start_time,
        "end_time": slot_req.end_time,
        "is_booked": False,
        "created_at": datetime.utcnow()
    }
    
    # Check overlap? (omitted for brevity)
    
    result = await asyncio.to_thread(slots_collection.insert_one, slot)
    return {"id": str(result.inserted_id), "message": "Slot created"}

@router.get("/slots", response_model=List[dict])
async def get_available_slots(doctor_id: Optional[str] = None):
    query = {"is_booked": False, "start_time": {"$gte": datetime.utcnow()}}
    if doctor_id:
        query["doctor_id"] = doctor_id
        
    cursor = slots_collection.find(query).sort("start_time", 1).limit(50)
    slots = await asyncio.to_thread(lambda: list(cursor))
    return [{"id": str(s["_id"]), **{k: v for k, v in s.items() if k != "_id"}} for s in slots]


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def book_appointment(appt: AppointmentCreate, user: dict = Depends(authenticate)):
    if user["role"] != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can book appointments")
        
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    patient_id = str(user_doc["_id"])
    
    # Basic Validation: Check if doctor exists? (Skipping for simplicity, or we can check)
    
    # Create Appointment
    doc = appt.dict()
    doc["patient_id"] = patient_id
    doc["status"] = AppointmentStatus.PENDING.value
    doc["created_at"] = datetime.utcnow()
    # Ensure datetimes are stored logically or converted
    
    result = await asyncio.to_thread(appointments_collection.insert_one, doc)
    
    return {
        "id": str(result.inserted_id),
        **doc
    }

@router.get("/", response_model=List[AppointmentResponse])
async def list_appointments(user: dict = Depends(authenticate)):
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    role = user["role"]
    
    query = {}
    if role == "PATIENT":
        query["patient_id"] = user_id
    elif role == "THERAPIST" or role == "DOCTOR":
        query["doctor_id"] = user_id
    elif role == "ORG_ADMIN":
        # Org Admin sees all appointments for their doctors
        from config.db import orgs_collection, doctor_profiles_collection
        
        # 1. Find Org
        org = await asyncio.to_thread(orgs_collection.find_one, {"admin_id": user_id})
        if not org:
             return [] # No org, no appointments
        
        # 2. Find Doctors in Org
        # We need their user_ids, which are stored in doctor_profiles as 'user_id'
        # Filter by org_id and approved status (optional but cleaner)
        doctors_cursor = doctor_profiles_collection.find({"organization_id": str(org["_id"])})
        doctors = await asyncio.to_thread(lambda: list(doctors_cursor))
        doctor_ids = [d["user_id"] for d in doctors]
        
        if not doctor_ids:
            return []
            
        query["doctor_id"] = {"$in": doctor_ids}
        
    else:
        # SUPER/GEN ADMIN see all
        pass
        
    cursor = appointments_collection.find(query).sort("start_time", 1)
    appts = await asyncio.to_thread(lambda: list(cursor))
    
    return [
        {"id": str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"}} for doc in appts
    ]

@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str, 
    update: AppointmentUpdate, 
    user: dict = Depends(authenticate)
):
    # Fetch appointment
    appt = await asyncio.to_thread(appointments_collection.find_one, {"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    # Permission Logic
    # Doctor can update everything (Status, Link, Notes)
    # Patient can only Cancel?
    
    is_doctor = (user["role"] == "THERAPIST" or user["role"] == "DOCTOR") and appt["doctor_id"] == user_id
    is_patient = user["role"] == "PATIENT" and appt["patient_id"] == user_id
    
    if not (is_doctor or is_patient):
         raise HTTPException(status_code=403, detail="Not authorized")
         
    update_data = update.dict(exclude_unset=True)
    
    # Specific rules
    if is_patient:
        # Patient can only cancel
        if "status" in update_data and update_data["status"] != AppointmentStatus.CANCELLED.value:
             if appt["status"] != update_data["status"]: # Trying to change status to something else
                 raise HTTPException(status_code=403, detail="Patients can only cancel appointments")
        # Prevent patient from changing link or notes (unless we want them to add notes?)
        if "meeting_link" in update_data:
             del update_data["meeting_link"]
             
    await asyncio.to_thread(
        appointments_collection.update_one,
        {"_id": ObjectId(appointment_id)},
        {"$set": update_data}
    )
    
    updated_appt = await asyncio.to_thread(appointments_collection.find_one, {"_id": ObjectId(appointment_id)})
    
    return {
        "id": str(updated_appt["_id"]),
        **{k: v for k, v in updated_appt.items() if k != "_id"}
    }

@router.get("/{appointment_id}/join")
async def join_appointment(appointment_id: str, user: dict = Depends(authenticate)):
    appt = await asyncio.to_thread(appointments_collection.find_one, {"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    # Permission Check
    if appt["doctor_id"] != user_id and appt["patient_id"] != user_id:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    # Generate LiveKit Token
    from services.livekit_service import get_livekit_token
    token = get_livekit_token(
        room_name=appointment_id,
        participant_identity=user_id,
        participant_name=user_doc.get("name", "Unknown User")
    )
    
    if not token:
        raise HTTPException(status_code=500, detail="Failed to generate video token")
        
    return {"token": token}

@router.post("/{appointment_id}/prescribe", response_model=PrescriptionResponse)
async def create_prescription_route(
    appointment_id: str, 
    prescription: PrescriptionCreate, 
    user: dict = Depends(authenticate)
):
    if user["role"] not in ["THERAPIST", "DOCTOR"]:
         raise HTTPException(status_code=403, detail="Only doctors can prescribe")
         
    # Optional: Verify appointment belongs to doctor
    appt = await asyncio.to_thread(appointments_collection.find_one, {"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(404, "Appointment not found")
        
    # Verify doctor owns appointment
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    if appt["doctor_id"] != str(user_doc["_id"]):
         raise HTTPException(403, "Not authorized for this appointment")
         
    result = await PrescriptionService.create_prescription(prescription, str(user_doc["_id"]))
    return result

@router.get("/{appointment_id}/prescriptions", response_model=List[PrescriptionResponse])
async def get_appointment_prescriptions(
    appointment_id: str,
    user: dict = Depends(authenticate)
):
    # Verify access
    appt = await asyncio.to_thread(appointments_collection.find_one, {"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(404, "Appointment not found")
        
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    user_id = str(user_doc["_id"])
    
    is_doctor = (user["role"] in ["THERAPIST", "DOCTOR"]) and appt["doctor_id"] == user_id
    is_patient = user["role"] == "PATIENT" and appt["patient_id"] == user_id
    
    if not (is_doctor or is_patient):
        raise HTTPException(403, "Not authorized")
        
    results = await PrescriptionService.get_prescriptions_by_appointment(appointment_id)
    
    # Convert _id to id
    return [{"id": str(r["_id"]), **r} for r in results]
