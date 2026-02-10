from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
import asyncio
import logging
from bson import ObjectId

from auth.routes import authenticate
from config.db import (
    orgs_collection, doctor_profiles_collection, 
    patient_profiles_collection, links_collection, 
    users_collection
)
from .models import (
    OrganizationCreate, OrganizationResponse,
    DoctorProfileCreate, DoctorProfileResponse,
    PatientProfileCreate, PatientProfileResponse,
    LinkRequest, DoctorPatientLinkResponse, LinkStatus,
    OnboardingStatusResponse, ApprovalStatus
)

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Organization Endpoints ---

@router.post("/organizations", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(org: OrganizationCreate, user: dict = Depends(authenticate)):
    # Only Org Admins (or Super Admins) should create organizations
    if user["role"] not in ["ORG_ADMIN", "SUPER_ADMIN", "GEN_ADMIN"]:
         raise HTTPException(status_code=403, detail="Only Org Admins can create organizations")

    existing = await asyncio.to_thread(orgs_collection.find_one, {"slug": org.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Organization slug already exists")
    
    # Get user ID
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    admin_id = str(user_doc["_id"])

    org_doc = org.dict()
    org_doc["created_at"] = datetime.utcnow()
    org_doc["admin_id"] = admin_id
    
    # Super Admins are auto-verified, others need verification
    is_verified = True if user["role"] == "SUPER_ADMIN" else False
    org_doc["is_verified"] = is_verified
    if is_verified:
        org_doc["verified_at"] = datetime.utcnow()
        org_doc["verified_by"] = admin_id
    
    result = await asyncio.to_thread(orgs_collection.insert_one, org_doc)
    org_id = str(result.inserted_id)
    
    # Auto-create organization group
    try:
        from groups.auto_group_service import AutoGroupService
        await AutoGroupService.create_organization_group(
            org_id=org_id,
            org_name=org.name,
            admin_id=admin_id
        )
    except Exception as e:
        logger.error(f"Failed to create organization group: {e}")
    
    return {
        "id": org_id,
        **org_doc
    }

@router.put("/admin/organizations/{org_id}/verify")
async def verify_organization(org_id: str, verified: bool, user: dict = Depends(authenticate)):
    """
    Super Admin verifies an organization.
    """
    if user["role"] != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only Super Admins can verify organizations")
        
    update_data = {
        "is_verified": verified,
        "verified_at": datetime.utcnow() if verified else None,
        "verified_by": user["email"] if verified else None
    }
    
    result = await asyncio.to_thread(
        orgs_collection.update_one,
        {"_id": ObjectId(org_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    return {"message": f"Organization {'verified' if verified else 'unverified'}"}

@router.get("/organizations", response_model=List[OrganizationResponse])
async def list_organizations(user: dict = Depends(authenticate), verified_only: bool = True):
    try:
        query = {}
        
        # Admins can see all, others only see verified
        if user["role"] in ["SUPER_ADMIN", "GEN_ADMIN"]:
            if verified_only:
                 query["is_verified"] = True
        elif user["role"] == "ORG_ADMIN":
            # Org Admins see their own + verified (to minimize leak, maybe just their own?)
            # For now let's show verified + their own
            user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
            admin_id = str(user_doc["_id"])
            query = {
                "$or": [
                    {"is_verified": True},
                    {"admin_id": admin_id}
                ]
            }
        else:
            # Patients / Doctors only see verified
            query["is_verified"] = True

        cursor = orgs_collection.find(query)
        orgs = await asyncio.to_thread(lambda: list(cursor))
        return [
            {"id": str(doc["_id"]), **doc} for doc in orgs
        ]
    except Exception as e:
        print(f"Error in list_organizations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/organizations/me", response_model=OrganizationResponse)
async def get_my_organization(user: dict = Depends(authenticate)):
    """
    Get the organization managed by the current Org Admin.
    """
    if user["role"] != "ORG_ADMIN":
         raise HTTPException(403, "Only Org Admins can access their organization details")
         
    # Find org by admin_id
    # user["_id"] is available from authenticate dependency usually as string or we fetch user
    # authenticate usually returns a dict with _id as string if I recall correctly?
    # No, authenticate (in auth/routes.py) returns dict with _id as string? Let's check auth routes if needed- 
    # Actually most endpoints fetch user doc to get _id.
    
    # Let's rely on retrieving the user doc to be safe, or if 'user' has the ID string.
    # Looking at other endpoints: user_doc = ... find_one ... admin_id = str(user_doc["_id"])
    
    try:
        user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
        if not user_doc:
            raise HTTPException(404, "User not found")
            
        admin_id = str(user_doc["_id"])
        
        org = await asyncio.to_thread(orgs_collection.find_one, {"admin_id": admin_id})
        if not org:
            raise HTTPException(404, "You do not manage any organization")
            
        return {"id": str(org["_id"]), **org}
    except Exception as e:
        print(f"Error in get_my_organization: {e}")
        raise e

@router.put("/organizations/me", response_model=OrganizationResponse)
async def update_my_organization(
    payload: dict, # allow partial updates: name, description, website, etc.
    user: dict = Depends(authenticate)
):
    """
    Update the organization managed by the current Org Admin.
    """
    if user["role"] != "ORG_ADMIN":
         raise HTTPException(403, "Only Org Admins can update their organization details")
         
    # Find org by admin_id
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    if not user_doc:
        raise HTTPException(404, "User not found")
        
    admin_id = str(user_doc["_id"])
    
    org = await asyncio.to_thread(orgs_collection.find_one, {"admin_id": admin_id})
    if not org:
        raise HTTPException(404, "You do not manage any organization")
        
    # Allowed fields
    allowed_fields = ["name", "description", "website", "phone", "email"]
    update_data = {k: v for k, v in payload.items() if k in allowed_fields and v is not None}
    
    if not update_data:
        # If no valid fields, just return current org
        return {"id": str(org["_id"]), **org}
        
    await asyncio.to_thread(
        orgs_collection.update_one,
        {"_id": org["_id"]},
        {"$set": update_data}
    )
    
    updated_org = await asyncio.to_thread(orgs_collection.find_one, {"_id": org["_id"]})
    return {"id": str(updated_org["_id"]), **updated_org}

# --- Doctor Onboarding ---

@router.post("/doctor/profile", response_model=DoctorProfileResponse)
async def create_doctor_profile(profile: DoctorProfileCreate, user: dict = Depends(authenticate)):
    logger.info(f"User {user['email']} with role {user['role']} attempting to create doctor profile")
    
    if user["role"] != "THERAPIST" and user["role"] != "DOCTOR":
         if user["role"] != "THERAPIST":
             raise HTTPException(
                 status_code=403, 
                 detail=f"Only doctors/therapists can create doctor profiles. Your current role is: {user['role']}"
             )

    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = str(user_doc["_id"])

    profile_doc = profile.dict()
    profile_doc["user_id"] = user_id
    profile_doc["created_at"] = datetime.utcnow()
    profile_doc["is_onboarded"] = True 
    
    # Handle Organization Link Request
    if profile.organization_id:
        profile_doc["org_request_status"] = "PENDING"
        # Verify org exists and is verified
        org = await asyncio.to_thread(orgs_collection.find_one, {"_id": ObjectId(profile.organization_id)})
        if not org:
             raise HTTPException(404, "Organization not found")
        if not org.get("is_verified", False):
             raise HTTPException(400, "Cannot join an unverified organization")
    else:
        profile_doc["org_request_status"] = "NOT_STARTED"

    await asyncio.to_thread(
        doctor_profiles_collection.update_one,
        {"user_id": user_id},
        {"$set": profile_doc},
        upsert=True
    )
    
    # Auto-create therapist group (Always create generic group, assume org linkage is separate permission)
    try:
        from groups.auto_group_service import AutoGroupService
        user_name = user_doc.get("name", "Doctor")
        await AutoGroupService.create_therapist_group(
            doctor_id=user_id,
            doctor_name=user_name
        )
    except Exception as e:
        logger.error(f"Failed to create therapist group: {e}")
    
    return {
        "user_id": user_id,
        "created_at": profile_doc["created_at"],
        **profile_doc
    }

@router.get("/org/doctor-requests")
async def get_org_doctor_requests(user: dict = Depends(authenticate)):
    """
    Org Admin gets pending doctor requests for their organization.
    """
    if user["role"] != "ORG_ADMIN":
        raise HTTPException(403, "Only Org Admins can view doctor requests")
        
    # Find Orgs owned by this admin
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    admin_id = str(user_doc["_id"])
    
    cursor = orgs_collection.find({"admin_id": admin_id})
    orgs = await asyncio.to_thread(lambda: list(cursor))
    
    if not orgs:
        raise HTTPException(404, "You do not have a registered organization")
        
    org_ids = [str(o["_id"]) for o in orgs]
    
    # Find doctors requesting any of these orgs
    cursor = doctor_profiles_collection.find({
        "organization_id": {"$in": org_ids},
        "org_request_status": "PENDING"
    })
    profiles = await asyncio.to_thread(lambda: list(cursor))
    
    results = []
    for p in profiles:
        doc_user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(p["user_id"])})
        if doc_user:
            # Find which org this is for
            org_name = next((o["name"] for o in orgs if str(o["_id"]) == p["organization_id"]), "Unknown")
            
            results.append({
                "user_id": p["user_id"],
                "name": doc_user.get("name"),
                "email": doc_user.get("email"),
                "specialization": p.get("specialization"),
                "created_at": p.get("created_at"),
                "organization_name": org_name # Helpful context
            })
            
    return results

@router.put("/org/doctor-requests/{doctor_id}/status")
async def update_doctor_request_status(doctor_id: str, approved: bool, user: dict = Depends(authenticate)):
    if user["role"] != "ORG_ADMIN":
        raise HTTPException(403, "Only Org Admins can manage doctor requests")
        
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    admin_id = str(user_doc["_id"])
    
    cursor = orgs_collection.find({"admin_id": admin_id})
    orgs = await asyncio.to_thread(lambda: list(cursor))
    
    if not orgs:
        raise HTTPException(404, "Organization not found")
        
    org_ids = [str(o["_id"]) for o in orgs]
    
    # Verify the doctor actually requested ONE OF these orgs
    profile = await asyncio.to_thread(doctor_profiles_collection.find_one, {"user_id": doctor_id})
    
    if not profile or profile.get("organization_id") not in org_ids:
         raise HTTPException(4404, "Doctor request not found for your organizations")

    status_val = "APPROVED" if approved else "REJECTED"
    
    await asyncio.to_thread(
        doctor_profiles_collection.update_one,
        {"user_id": doctor_id},
        {"$set": {"org_request_status": status_val}}
    )
    
    return {"message": f"Doctor request {status_val}"}

@router.get("/organizations/{org_id}/doctors")
async def list_org_doctors(org_id: str, skip: int = 0, limit: int = 20, user: dict = Depends(authenticate)):
    """
    List APPROVED doctors for a specific organization with pagination.
    """
    # Verify org exists
    org = await asyncio.to_thread(orgs_collection.find_one, {"_id": ObjectId(org_id)})
    if not org:
        raise HTTPException(404, "Organization not found")
        
    cursor = doctor_profiles_collection.find({
        "organization_id": org_id,
        "org_request_status": "APPROVED" # ONLY APPROVED DOCTORS
    }).skip(skip).limit(limit)
    
    profiles = await asyncio.to_thread(lambda: list(cursor))
    
    results = []
    for p in profiles:
        doc_user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(p["user_id"])})
        if doc_user:
            results.append({
                "id": p["user_id"], # Use user_id as ID
                "name": doc_user.get("name"),
                "specialization": p.get("specialization")
            })
            
    return results

# --- Patient Onboarding ---

@router.post("/patient/profile", response_model=PatientProfileResponse)
async def create_patient_profile(profile: PatientProfileCreate, user: dict = Depends(authenticate)):
    logger.info(f"User {user['email']} with role {user['role']} attempting to create patient profile")
    
    if user["role"] != "PATIENT":
        raise HTTPException(
            status_code=403, 
            detail=f"Only patients can create patient profiles. Your current role is: {user['role']}. Please register a new account with the PATIENT role or contact support."
        )
        
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    if not user_doc:
         raise HTTPException(status_code=404, detail="User not found")
    user_id = str(user_doc["_id"])
    
    profile_doc = profile.dict()
    profile_doc["user_id"] = user_id
    profile_doc["created_at"] = datetime.utcnow()
    profile_doc["is_onboarded"] = True
    
    # Set approval statuses based on organization selection
    if profile.organization_id:
        profile_doc["org_approval_status"] = "PENDING"
        profile_doc["doctor_link_status"] = "NOT_STARTED"
    else:
        profile_doc["org_approval_status"] = "NOT_STARTED"
        profile_doc["doctor_link_status"] = "NOT_STARTED"
    
    await asyncio.to_thread(
        patient_profiles_collection.update_one,
        {"user_id": user_id},
        {"$set": profile_doc},
        upsert=True
    )
    
    # Auto-add patient to organization group
    if profile.organization_id:
        try:
            from groups.auto_group_service import AutoGroupService
            await AutoGroupService.add_patient_to_organization_group(
                patient_id=user_id,
                org_id=profile.organization_id
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to add patient to org group: {e}")
    
    return {
        "user_id": user_id,
        "created_at": profile_doc["created_at"],
        **profile.dict()
    }

# --- Linking ---

@router.post("/links/request", response_model=DoctorPatientLinkResponse)
async def request_link(req: LinkRequest, user: dict = Depends(authenticate)):
    logger.info(f"User {user['email']} with role {user['role']} attempting to request doctor link")
    
    if user["role"] != "PATIENT":
        raise HTTPException(
            status_code=403, 
            detail=f"Only patients can request links. Your current role is: {user['role']}"
        )

    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    patient_id = str(user_doc["_id"])
    
    # Check if doctor exists
    # Assuming req.doctor_id is the User ID of the doctor
    # Verify doctor profile exists
    doc_profile = await asyncio.to_thread(doctor_profiles_collection.find_one, {"user_id": req.doctor_id})
    if not doc_profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    # Create Link
    link_doc = {
        "patient_id": patient_id,
        "doctor_id": req.doctor_id,
        "organization_id": req.organization_id, # Should probably verify org exists too
        "status": LinkStatus.PENDING.value,
        "created_at": datetime.utcnow()
    }
    
    # Check for existing link (exclude cancelled)
    existing_link = await asyncio.to_thread(
        links_collection.find_one, 
        {
            "patient_id": patient_id, 
            "doctor_id": req.doctor_id,
            "status": {"$ne": "CANCELLED"}
        }
    )
    if existing_link:
        raise HTTPException(status_code=400, detail="Link request already exists")
    
    result = await asyncio.to_thread(links_collection.insert_one, link_doc)
    
    # Update patient profile to set doctor_link_status to PENDING
    await asyncio.to_thread(
        patient_profiles_collection.update_one,
        {"user_id": patient_id},
        {"$set": {"doctor_link_status": "PENDING"}}
    )
    
    return {
        "id": str(result.inserted_id),
        **link_doc
    }

@router.get("/doctor/links", response_model=List[DoctorPatientLinkResponse])
async def list_doctor_links(user: dict = Depends(authenticate)):
    if user["role"] != "THERAPIST":
        raise HTTPException(
            status_code=403, 
            detail=f"Only doctors/therapists can view links. Your current role is: {user['role']}"
        )
        
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    doctor_id = str(user_doc["_id"])
    
    cursor = links_collection.find({"doctor_id": doctor_id})
    links = await asyncio.to_thread(lambda: list(cursor))
    
    results = []
    for link in links:
        patient_user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(link["patient_id"])})
        results.append({
            "id": str(link["_id"]),
            "doctor_id": link["doctor_id"],
            "patient_id": link["patient_id"],
            "organization_id": link["organization_id"],
            "status": link["status"],
            "created_at": link["created_at"],
            "patient_name": patient_user.get("name") if patient_user else "Unknown"
        })
    
    return results

@router.put("/links/{link_id}/status")
async def update_link_status(link_id: str, status: LinkStatus, user: dict = Depends(authenticate)):
    if user["role"] != "THERAPIST":
        raise HTTPException(
            status_code=403, 
            detail=f"Only doctors/therapists can update link status. Your current role is: {user['role']}"
        )
        
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    doctor_id = str(user_doc["_id"])
    
    # Verify ownership
    link = await asyncio.to_thread(links_collection.find_one, {"_id": ObjectId(link_id), "doctor_id": doctor_id})
    if not link:
        raise HTTPException(status_code=404, detail="Link request not found")
        
    await asyncio.to_thread(
        links_collection.update_one,
        {"_id": ObjectId(link_id)},
        {"$set": {"status": status.value}}
    )
    
    # Update patient's doctor_link_status
    patient_status = "APPROVED" if status == LinkStatus.APPROVED else "REJECTED" if status == LinkStatus.REJECTED else "PENDING"
    await asyncio.to_thread(
        patient_profiles_collection.update_one,
        {"user_id": link["patient_id"]},
        {"$set": {"doctor_link_status": patient_status}}
    )
    
    # Auto-add patient to therapist group when link is approved
    if status == LinkStatus.APPROVED:
        try:
            from groups.auto_group_service import AutoGroupService
            await AutoGroupService.add_patient_to_therapist_group(
                patient_id=link["patient_id"],
                doctor_id=doctor_id
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to add patient to therapist group: {e}")
    
    return {"message": "Status updated"}

# --- Organization Approval ---

@router.get("/org/pending-patients")
async def get_pending_patients(user: dict = Depends(authenticate)):
    """
    Get list of patients pending approval for the organization.
    Only ORG_ADMIN can access this.
    """
    if user["role"] != "ORG_ADMIN":
        raise HTTPException(
            status_code=403,
            detail=f"Only organization admins can view pending patients. Your role is: {user['role']}"
        )
    
    # Get org admin's organization
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    # Assuming org admins have an organization_id field - this may need adjustment
    # For now, we'll return all pending patients
    
    cursor = patient_profiles_collection.find({"org_approval_status": "PENDING"})
    patients = await asyncio.to_thread(lambda: list(cursor))
    
    result = []
    for patient in patients:
        user_info = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(patient["user_id"])})
        if user_info:
            result.append({
                "patient_id": patient["user_id"],
                "name": user_info.get("name"),
                "email": user_info.get("email"),
                "organization_id": patient.get("organization_id"),
                "created_at": patient.get("created_at")
            })
    
    return result

@router.put("/org/approve-patient/{patient_id}")
async def approve_patient(patient_id: str, approved: bool, user: dict = Depends(authenticate)):
    """
    Approve or reject a patient's organization request.
    Only ORG_ADMIN can access this.
    """
    if user["role"] != "ORG_ADMIN":
        raise HTTPException(
            status_code=403,
            detail=f"Only organization admins can approve patients. Your role is: {user['role']}"
        )
    
    # Update patient's org_approval_status
    new_status = "APPROVED" if approved else "REJECTED"
    
    result = await asyncio.to_thread(
        patient_profiles_collection.update_one,
        {"user_id": patient_id},
        {"$set": {"org_approval_status": new_status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {"message": f"Patient {'approved' if approved else 'rejected'} successfully"}

# --- Onboarding Status Check ---
 
@router.post("/org/invite")
async def invite_member(
    payload: dict, # {"email": "...", "role": "..."} 
    user: dict = Depends(authenticate)
):
    """
    Invite a member to the organization.
    """
    if user["role"] != "ORG_ADMIN":
         raise HTTPException(403, "Only Org Admins can invite members")
         
    email = payload.get("email")
    role = payload.get("role")
    
    if not email or not role:
        raise HTTPException(400, "Email and role are required")

    # In a real app, we would send an email with a unique link.
    # Here we will just verify the user isn't already in the system or just return success.
    
    # Check if user exists
    existing_user = await asyncio.to_thread(users_collection.find_one, {"email": email})
    
    if existing_user:
        # If user exists, maybe we just want to link them?
        # For now, let's just simulate sending an invite email.
        return {"message": f"Invitation sent to {email}"}
    else:
        return {"message": f"Invitation sent to {email} (User will need to register)"}

@router.get("/status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(user: dict = Depends(authenticate)):
    """
    Get the current onboarding and approval status for the authenticated user.
    This helps determine which page to show in the frontend.
    """
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = str(user_doc["_id"])
    role = user["role"]
    
    # For patients, check profile and approval status
    if role == "PATIENT":
        profile = await asyncio.to_thread(patient_profiles_collection.find_one, {"user_id": user_id})
        
        if not profile or not profile.get("is_onboarded", False):
            return OnboardingStatusResponse(
                is_onboarded=False,
                org_approval_status=ApprovalStatus.NOT_STARTED,
                doctor_link_status=ApprovalStatus.NOT_STARTED,
                message="Please complete your onboarding profile"
            )
        
        org_approval = ApprovalStatus(profile.get("org_approval_status", "NOT_STARTED"))
        doctor_link = ApprovalStatus(profile.get("doctor_link_status", "NOT_STARTED"))
        org_id = profile.get("organization_id")
        org_name = None
        
        # Get organization name if exists
        if org_id:
            org = await asyncio.to_thread(orgs_collection.find_one, {"_id": ObjectId(org_id)})
            org_name = org.get("name") if org else None
        
        # Determine message based on status
        if org_approval == ApprovalStatus.PENDING:
            message = f"Waiting for {org_name or 'organization'} approval"
        elif org_approval == ApprovalStatus.REJECTED:
            message = "Your organization request was rejected. Please contact support or request a different organization."
        elif doctor_link == ApprovalStatus.PENDING:
            message = "Waiting for doctor approval"
        elif doctor_link == ApprovalStatus.REJECTED:
            message = "Your doctor link request was rejected. You can request a different doctor."
        elif doctor_link == ApprovalStatus.APPROVED:
            message = "All approvals complete! You can access the dashboard."
        else:
            message = "Please request a doctor link to continue"
        
        return OnboardingStatusResponse(
            is_onboarded=True,
            org_approval_status=org_approval,
            doctor_link_status=doctor_link,
            organization_id=org_id,
            organization_name=org_name,
            message=message
        )
    
    # For therapists/doctors
    elif role == "THERAPIST" or role == "DOCTOR":
        profile = await asyncio.to_thread(doctor_profiles_collection.find_one, {"user_id": user_id})
        
        if not profile or not profile.get("is_onboarded", False):
            return OnboardingStatusResponse(
                is_onboarded=False,
                org_approval_status=ApprovalStatus.NOT_STARTED,
                doctor_link_status=ApprovalStatus.NOT_STARTED,
                message="Please complete your professional profile"
            )
        
        # Check Org Status
        org_req_status = ApprovalStatus(profile.get("org_request_status", "NOT_STARTED"))
        
        if org_req_status == ApprovalStatus.PENDING:
             return OnboardingStatusResponse(
                is_onboarded=True,
                org_approval_status=ApprovalStatus.PENDING,
                doctor_link_status=ApprovalStatus.APPROVED,
                message="Waiting for Organization Approval"
            )
        elif org_req_status == ApprovalStatus.REJECTED:
             return OnboardingStatusResponse(
                is_onboarded=True,
                org_approval_status=ApprovalStatus.REJECTED,
                doctor_link_status=ApprovalStatus.APPROVED,
                message="Your organization request was rejected. Please update your profile to join a different one."
            )
            
        return OnboardingStatusResponse(
            is_onboarded=True,
            org_approval_status=ApprovalStatus.APPROVED,
            doctor_link_status=ApprovalStatus.APPROVED,
            message="Profile complete! You can access the dashboard."
        )
    
    # For admins
    else:
        return OnboardingStatusResponse(
            is_onboarded=True,
            org_approval_status=ApprovalStatus.APPROVED,
            doctor_link_status=ApprovalStatus.APPROVED,
            message="Admin access granted"
        )

