from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from bson import ObjectId
from enum import Enum
import asyncio
from datetime import datetime

from auth.routes import authenticate
from config.db import users_collection, orgs_collection
from pydantic import BaseModel

router = APIRouter()

# --- Models ---

class UserAdminResponse(BaseModel):
    id: str
    email: str
    role: str
    name: Optional[str] = None
    is_verified: bool = False
    created_at: Optional[datetime] = None

class UserRoleUpdate(BaseModel):
    role: str

class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class DeleteRequestResponse(BaseModel):
    id: str
    target_user_id: str
    target_user_name: Optional[str] = None
    target_user_email: str
    target_user_role: str
    org_id: str
    org_name: Optional[str] = None
    requested_by: str
    status: RequestStatus
    created_at: datetime


# --- Routes ---

@router.get("/users", response_model=List[UserAdminResponse])
async def list_users(
    skip: int = 0, 
    limit: int = 50, 
    role: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(authenticate)
):
    """
    List all users with pagination and filtering. 
    Only SUPER_ADMIN can access.
    """
    if user["role"] != "SUPER_ADMIN":
        raise HTTPException(403, "Only Super Admins can list users")

    query = {}
    if role and role != "ALL":
        query["role"] = role
    
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]

    cursor = users_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    users = await asyncio.to_thread(lambda: list(cursor))

    return [
        {
            "id": str(doc["_id"]),
            "email": doc["email"],
            "role": doc["role"],
            "name": doc.get("name"),
            "is_verified": doc.get("is_verified", False),
            "created_at": doc.get("created_at")
        }
        for doc in users
    ]

class UserUpdate(BaseModel):
    name: Optional[str] = None
    is_verified: Optional[bool] = None

@router.put("/users/{user_id}", response_model=UserAdminResponse)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    user: dict = Depends(authenticate)
):
    """
    Update detailed user info (Super Admin only).
    """
    if user["role"] != "SUPER_ADMIN":
         raise HTTPException(403, "Only Super Admins can update users")

    target_user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(404, "User not found")

    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.is_verified is not None:
        update_data["is_verified"] = payload.is_verified
        
    if not update_data:
        raise HTTPException(400, "No changes provided")

    await asyncio.to_thread(
        users_collection.update_one,
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    # Fetch updated
    updated_user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(user_id)})
    
    return {
        "id": str(updated_user["_id"]),
        "email": updated_user["email"],
        "role": updated_user["role"],
        "name": updated_user.get("name"),
        "is_verified": updated_user.get("is_verified", False),
        "created_at": updated_user.get("created_at")
    }
@router.get("/users/{user_id}")
async def get_user_details(user_id: str, user: dict = Depends(authenticate)):
    """
    Get detailed user info for Super Admin.
    """
    if user["role"] not in ["SUPER_ADMIN", "GEN_ADMIN"]:
         raise HTTPException(403, "Insufficient permissions")
    
    target_user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(404, "User not found")
    
    details = {
        "id": str(target_user["_id"]),
        "name": target_user.get("name"),
        "email": target_user["email"],
        "role": target_user["role"],
        "is_verified": target_user.get("is_verified", False),
        "created_at": target_user.get("created_at"),
        "extra_info": {}
    }

    # Fetch role-specific details
    if target_user["role"] == "ORG_ADMIN":
        # Find which org they manage
        org = await asyncio.to_thread(orgs_collection.find_one, {"admin_id": str(target_user["_id"])})
        if org:
            details["extra_info"]["organization"] = {
                "id": str(org["_id"]),
                "name": org["name"],
                "slug": org["slug"]
            }
            
    elif target_user["role"] in ["DOCTOR", "THERAPIST"]:
        from config.db import doctor_profiles_collection
        profile = await asyncio.to_thread(doctor_profiles_collection.find_one, {"user_id": str(target_user["_id"])})
        if profile:
            details["extra_info"]["profile"] = {
                "specialization": profile.get("specialization"),
                "verification_status": profile.get("verification_status")
            }
            
    elif target_user["role"] == "PATIENT":
        from config.db import patient_profiles_collection
        profile = await asyncio.to_thread(patient_profiles_collection.find_one, {"user_id": str(target_user["_id"])})
        if profile:
            details["extra_info"]["profile"] = {
                "date_of_birth": profile.get("date_of_birth")
            }

    return details

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "PATIENT"
    is_verified: bool = True

@router.post("/users", response_model=UserAdminResponse)
async def create_user(
    payload: UserCreate,
    user: dict = Depends(authenticate)
):
    """
    Create a new user directly (Super Admin only).
    Skips email verification if is_verified=True.
    """
    if user["role"] != "SUPER_ADMIN":
        raise HTTPException(403, "Only Super Admins can create users")

    # Check if user exists
    existing = await asyncio.to_thread(users_collection.find_one, {"email": payload.email})
    if existing:
        raise HTTPException(400, "User with this email already exists")

    from auth.routes import get_password_hash
    hashed_pw = get_password_hash(payload.password)
    
    new_user = {
        "email": payload.email,
        "password": hashed_pw,
        "name": payload.name,
        "role": payload.role,
        "is_verified": payload.is_verified,
        "created_at": datetime.utcnow()
    }
    
    result = await asyncio.to_thread(users_collection.insert_one, new_user)
    new_user["_id"] = result.inserted_id
    
    # Create profile if needed (Doctor/Patient)
    # For now we just create the User account. 
    # Profile creation usually happens on first login or via similar flows.
    # We can add empty profile placeholders if we want strict consistency.
    
    if payload.role in ["DOCTOR", "THERAPIST"]:
        from config.db import doctor_profiles_collection
        await asyncio.to_thread(doctor_profiles_collection.insert_one, {
            "user_id": str(new_user["_id"]),
            "status": "PENDING", # even if user is verified, professional profile might need check
            "created_at": datetime.utcnow()
        })
    elif payload.role == "PATIENT":
        from config.db import patient_profiles_collection
        await asyncio.to_thread(patient_profiles_collection.insert_one, {
            "user_id": str(new_user["_id"]),
            "created_at": datetime.utcnow()
        })
    
    return {
        "id": str(new_user["_id"]),
        "email": new_user["email"],
        "role": new_user["role"],
        "name": new_user["name"],
        "is_verified": new_user["is_verified"],
        "created_at": new_user["created_at"]
    }

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str, 
    role_data: UserRoleUpdate, 
    user: dict = Depends(authenticate)
):
    """
    Update a user's role.
    Only SUPER_ADMIN can access.
    """
    # User requested that roles should be permanent.
    raise HTTPException(400, "User roles are permanent and cannot be changed after creation.")

    # Original logic disabled
    # if user["role"] != "SUPER_ADMIN":
    #     raise HTTPException(403, "Only Super Admins can update roles")
    # ...

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(authenticate)):
    """
    Delete a user permanently.
    Only SUPER_ADMIN can access.
    """
    if user["role"] != "SUPER_ADMIN":
         raise HTTPException(403, "Only Super Admins can delete users")
    
    # Prevent deleting self
    admin_user = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    if str(admin_user["_id"]) == user_id:
        raise HTTPException(400, "Cannot delete yourself")
    
    target_user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(404, "User not found")

    # Check relationships
    from config.db import doctor_profiles_collection, patient_profiles_collection
    from config.db import delete_requests_collection
    
    org_id = None
    
    if target_user["role"] == "ORG_ADMIN":
         # Check if they manage an org
         managed_org = await asyncio.to_thread(orgs_collection.find_one, {"admin_id": user_id})
         if managed_org:
             raise HTTPException(400, f"Cannot delete Org Admin. They are managing organization '{managed_org['name']}'. Please transfer ownership to another admin first.")

    if target_user["role"] == "DOCTOR":
        profile = await asyncio.to_thread(doctor_profiles_collection.find_one, {"user_id": user_id})
        if profile and profile.get("organization_id"):
             org_id = profile["organization_id"]
             
    elif target_user["role"] == "THERAPIST":
         profile = await asyncio.to_thread(doctor_profiles_collection.find_one, {"user_id": user_id})
         if profile and profile.get("organization_id"):
             org_id = profile["organization_id"]

    elif target_user["role"] == "PATIENT":
        # Check if patient is approved/linked to an org (profile check)
        profile = await asyncio.to_thread(patient_profiles_collection.find_one, {"user_id": user_id})
        if profile and profile.get("organization_id") and profile.get("org_approval_status") == "APPROVED":
             org_id = profile["organization_id"]

    # If linked to an Org, create a Delete Request
    if org_id:
        # Check if request already exists
        existing = await asyncio.to_thread(delete_requests_collection.find_one, {
            "target_user_id": user_id,
            "status": "PENDING"
        })
        if existing:
            raise HTTPException(400, "Deletion request already pending for this user.")

        new_request = {
            "target_user_id": user_id,
            "target_user_email": target_user["email"], # Snapshot email
            "target_user_role": target_user["role"],
            "org_id": org_id,
            "requested_by": str(admin_user["_id"]),
            "status": "PENDING",
            "created_at": datetime.utcnow()
        }
        await asyncio.to_thread(delete_requests_collection.insert_one, new_request)
        return {"message": "Delete Request sent to Organization Admin.", "status": "PENDING"}

    # If NOT linked, delete immediately
    result = await asyncio.to_thread(users_collection.delete_one, {"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(404, "User not found")
        
    return {"message": "User deleted successfully", "status": "DELETED"}

@router.get("/users/lookup")
async def lookup_user(email: str, user: dict = Depends(authenticate)):
    """
    Lookup a user by email.
    Allowed for ORG_ADMIN (for ownership transfer) and SUPER_ADMIN.
    """
    if user["role"] not in ["SUPER_ADMIN", "ORG_ADMIN"]:
         raise HTTPException(403, "Insufficient permissions")

    target_user = await asyncio.to_thread(users_collection.find_one, {"email": email})
    if not target_user:
        raise HTTPException(404, "User not found")
        
    return {
        "id": str(target_user["_id"]),
        "email": target_user["email"],
        "name": target_user.get("name"),
        "role": target_user["role"]
    }

@router.delete("/organizations/{org_id}")
async def delete_organization(org_id: str, user: dict = Depends(authenticate)):
    """
    Delete an organization permanently.
    Only SUPER_ADMIN can access.
    """
    if user["role"] != "SUPER_ADMIN":
         raise HTTPException(403, "Only Super Admins can delete organizations")
    
    result = await asyncio.to_thread(orgs_collection.delete_one, {"_id": ObjectId(org_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(404, "Organization not found")
        
    return {"message": "Organization deleted successfully"}

@router.put("/organizations/{org_id}/transfer-ownership")
async def transfer_organization_ownership(
    org_id: str, 
    payload: dict, # {"new_admin_id": "..."}
    user_context: dict = Depends(authenticate)
):
    """
    Transfer organization ownership to a new Org Admin.
    Access: SUPER_ADMIN or the ORG_ADMIN who owns the organization.
    """
    try:
        # Fetch full user to get _id
        user = await asyncio.to_thread(users_collection.find_one, {"email": user_context["email"]})
        if not user:
             raise HTTPException(401, "User not found")
             
        new_admin_id = payload.get("new_admin_id")
        if not new_admin_id:
            raise HTTPException(400, "New Admin ID is required")

        # 1. Fetch Org
        org = await asyncio.to_thread(orgs_collection.find_one, {"_id": ObjectId(org_id)})
        if not org:
            raise HTTPException(404, "Organization not found")

        # 2. Check Permissions
        if user["role"] == "SUPER_ADMIN":
            pass # OK
        elif user["role"] == "ORG_ADMIN":
            # Must be the current admin
            if str(org.get("admin_id")) != str(user["_id"]):
                 raise HTTPException(403, f"You can only transfer ownership of your own organization.")
        else:
            raise HTTPException(403, "Insufficient permissions")
            
        # 3. Verify New Admin exists and is ORG_ADMIN
        new_admin = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(new_admin_id)})
        if not new_admin:
            raise HTTPException(404, "New admin user not found")
            
        if new_admin["role"] != "ORG_ADMIN":
            raise HTTPException(400, "User must have ORG_ADMIN role")
            
        # 4. Update Org
        await asyncio.to_thread(
            orgs_collection.update_one,
            {"_id": ObjectId(org_id)},
            {"$set": {"admin_id": str(new_admin["_id"])}}
        )
        
        return {"message": f"Ownership transferred to {new_admin.get('name', new_admin['email'])}"}
    except Exception as e:
        print(f"Error in transfer_organization_ownership: {e}")
        raise e

@router.get("/logs/system")
async def get_system_logs(user: dict = Depends(authenticate), limit: int = 20):
    """
    Get recent system logs/activities.
    Only SUPER_ADMIN.
    """
    if user["role"] != "SUPER_ADMIN":
         raise HTTPException(403, "Insufficient permissions")
         
    # Return mock/real data
    # In a real app we would query a logs collection.
    # Here let's return some recent user signups or static data for the dashboard.
    
    # Let's get actual recent users
    cursor = users_collection.find().sort("created_at", -1).limit(limit)
    users = await asyncio.to_thread(lambda: list(cursor))
    
    logs = []
    for u in users:
        ts = u.get("created_at", datetime.utcnow())
        logs.append({
            "timestamp": ts,
            "level": "INFO",
            "message": f"New user registered: {u['email']} ({u['role']})"
        })
        
    return logs

@router.get("/organizations/{org_id}/details")
async def get_organization_details(org_id: str, user: dict = Depends(authenticate)):
    """
    Get detailed organization info including admin, doctor count, patient count.
    """
    if user["role"] not in ["SUPER_ADMIN", "GEN_ADMIN"]:
         raise HTTPException(403, "Insufficient permissions")
    
    # 1. Get Org
    org = await asyncio.to_thread(orgs_collection.find_one, {"_id": ObjectId(org_id)})
    if not org:
        raise HTTPException(404, "Organization not found")
    
    # 2. Get Admin Info
    admin_info = None
    if "admin_id" in org:
        admin_user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(org["admin_id"])})
        if admin_user:
            admin_info = {
                "id": str(admin_user["_id"]),
                "name": admin_user.get("name"),
                "email": admin_user["email"],
                "role": admin_user["role"]
            }

    # 3. Get Doctors (Count & List briefly)
    from config.db import doctor_profiles_collection, patient_profiles_collection, links_collection
    
    doctors_cursor = doctor_profiles_collection.find({"org_id": org_id})
    doctors = await asyncio.to_thread(lambda: list(doctors_cursor))
    
    # 4. Get Unique Patients linked to these doctors
    doctor_ids = [str(d["user_id"]) for d in doctors]
    links_cursor = links_collection.find({"doctor_id": {"$in": doctor_ids}})
    links = await asyncio.to_thread(lambda: list(links_cursor))
    patient_ids = list(set([l["patient_id"] for l in links]))
    
    patients_count = len(patient_ids)
    
    return {
        "org": {
            "id": str(org["_id"]),
            "name": org["name"],
            "slug": org["slug"],
            "description": org.get("description"),
            "is_verified": org.get("is_verified", False),
            "created_at": org.get("created_at")
        },
        "admin": admin_info,
        "stats": {
            "doctors_count": len(doctors),
            "patients_count": patients_count
        }
    }

@router.get("/organizations/{org_id}/members")
async def get_organization_members(org_id: str, user: dict = Depends(authenticate)):
    """
    Get full list of doctors and patients for an organization.
    """
    if user["role"] not in ["SUPER_ADMIN", "GEN_ADMIN", "ORG_ADMIN"]:
         raise HTTPException(403, "Insufficient permissions")
    
    if user["role"] == "ORG_ADMIN":
         # Verify they own this org
         user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
         admin_id = str(user_doc["_id"])
         org = await asyncio.to_thread(orgs_collection.find_one, {"_id": ObjectId(org_id)})
         if not org or org.get("admin_id") != admin_id:
              raise HTTPException(403, "You can only view members of your own organization")

    from config.db import doctor_profiles_collection, links_collection
    
    # 1. Get Doctors
    doctors_cursor = doctor_profiles_collection.find({"org_id": org_id})
    doctors_profiles = await asyncio.to_thread(lambda: list(doctors_cursor))
    
    doctor_users = []
    if doctors_profiles:
        doc_user_ids = [ObjectId(d["user_id"]) for d in doctors_profiles]
        users_cursor = users_collection.find({"_id": {"$in": doc_user_ids}})
        users_list = await asyncio.to_thread(lambda: list(users_cursor))
        users_map = {str(u["_id"]): u for u in users_list}
        
        for profile in doctors_profiles:
            uid = str(profile["user_id"])
            if uid in users_map:
                u = users_map[uid]
                doctor_users.append({
                    "id": uid,
                    "name": u.get("name"),
                    "email": u["email"],
                    "specialization": profile.get("specialization", "N/A"),
                    "verification_status": profile.get("verification_status", "PENDING")
                })

    # 2. Get Patients (Derived from links)
    doctor_ids = [str(d["user_id"]) for d in doctors_profiles]
    links_cursor = links_collection.find({"doctor_id": {"$in": doctor_ids}})
    links = await asyncio.to_thread(lambda: list(links_cursor))
    
    patient_users = []
    if links:
        patient_ids = list(set([ObjectId(l["patient_id"]) for l in links]))
        p_users_cursor = users_collection.find({"_id": {"$in": patient_ids}})
        p_users_list = await asyncio.to_thread(lambda: list(p_users_cursor))
        
        # We might also want patient profile info, but let's stick to User info for now
        for u in p_users_list:
            patient_users.append({
                "id": str(u["_id"]),
                "name": u.get("name"),
                "email": u["email"],
                "role": "PATIENT"
            })
            
    return {
        "doctors": doctor_users,
        "patients": patient_users
    }

@router.get("/doctors/{doctor_id}")
async def get_doctor_details(doctor_id: str, user: dict = Depends(authenticate)):
    """
    Get detailed doctor info for Super Admin.
    """
    if user["role"] not in ["SUPER_ADMIN", "GEN_ADMIN"]:
         raise HTTPException(403, "Insufficient permissions")

    from config.db import doctor_profiles_collection, users_collection
    
    # Get User Info
    doctor_user = await asyncio.to_thread(users_collection.find_one, {"_id": ObjectId(doctor_id)})
    if not doctor_user:
        raise HTTPException(404, "Doctor user not found")
        
    # Get Profile Info
    profile = await asyncio.to_thread(doctor_profiles_collection.find_one, {"user_id": doctor_id})
    
    return {
        "id": str(doctor_user["_id"]),
        "name": doctor_user.get("name"),
        "email": doctor_user["email"],
        "specialization": profile.get("specialization") if profile else None,
        "education": profile.get("education") if profile else None,
        "experience_years": profile.get("experience_years") if profile else None,
        "bio": profile.get("bio") if profile else None,
        "verification_status": profile.get("verification_status") if profile else "N/A",
        "created_at": doctor_user.get("created_at")
    }

@router.get("/requests/delete", response_model=List[DeleteRequestResponse])
async def get_delete_requests(user: dict = Depends(authenticate)):
    """
    List pending delete requests for the Organization Admin.
    """
    if user["role"] not in ["ORG_ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(403, "Insufficient permissions")

    from config.db import delete_requests_collection, orgs_collection

    query = {"status": "PENDING"}
    
    # If Org Admin, restrict to their Org
    if user["role"] == "ORG_ADMIN":
         org = await asyncio.to_thread(orgs_collection.find_one, {"admin_id": str(user["user_id"] if "user_id" in user else user["_id"])}) 
         
         if not org:
             # Fallback
             org = await asyncio.to_thread(orgs_collection.find_one, {"admin_id": str(user["_id"])})
             
         if not org:
             return [] # No org managed
         
         query["org_id"] = str(org["_id"])

    cursor = delete_requests_collection.find(query).sort("created_at", -1)
    requests = await asyncio.to_thread(lambda: list(cursor))
    
    return [
        {
            "id": str(r["_id"]),
            "target_user_id": r["target_user_id"],
            "target_user_name": r.get("target_user_email"), # Fallback to email as name if missing
            "target_user_email": r["target_user_email"],
            "target_user_role": r["target_user_role"],
            "org_id": r["org_id"],
            "requested_by": r["requested_by"],
            "status": r["status"],
            "created_at": r["created_at"]
        }
        for r in requests
    ]

@router.post("/requests/delete/{request_id}/approve")
async def approve_delete_request(request_id: str, user: dict = Depends(authenticate)):
    """
    Approve value: Permanently delete the user.
    """
    if user["role"] != "ORG_ADMIN":
        raise HTTPException(403, "Only Org Admins can approve requests")

    from config.db import delete_requests_collection, users_collection, orgs_collection

    # 1. Fetch Request
    req = await asyncio.to_thread(delete_requests_collection.find_one, {"_id": ObjectId(request_id)})
    if not req:
        raise HTTPException(404, "Request not found")
        
    if req["status"] != "PENDING":
        raise HTTPException(400, "Request already processed")

    # 2. Verify Ownership
    # The Org Admin approving must own the org in the request
    org = await asyncio.to_thread(orgs_collection.find_one, {"_id": ObjectId(req["org_id"])})
    if not org or org.get("admin_id") != str(user["_id"]):
         raise HTTPException(403, "You do not manage this organization")

    # 3. Execute Deletion
    # Delete User
    del_result = await asyncio.to_thread(users_collection.delete_one, {"_id": ObjectId(req["target_user_id"])})
    
    # 4. Update Request Status
    await asyncio.to_thread(
        delete_requests_collection.update_one,
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "APPROVED", "processed_at": datetime.utcnow()}}
    )
    
    return {"message": "Request approved. User deleted permanently."}

@router.post("/requests/delete/{request_id}/reject")
async def reject_delete_request(request_id: str, user: dict = Depends(authenticate)):
    """
    Reject value: Mark request as rejected. User is NOT deleted.
    """
    if user["role"] != "ORG_ADMIN":
        raise HTTPException(403, "Only Org Admins can reject requests")

    from config.db import delete_requests_collection, orgs_collection

    # 1. Fetch Request
    req = await asyncio.to_thread(delete_requests_collection.find_one, {"_id": ObjectId(request_id)})
    if not req:
        raise HTTPException(404, "Request not found")

    if req["status"] != "PENDING":
         raise HTTPException(400, "Request already processed")

    # 2. Verify Ownership
    org = await asyncio.to_thread(orgs_collection.find_one, {"_id": ObjectId(req["org_id"])})
    if not org or org.get("admin_id") != str(user["_id"]):
         raise HTTPException(403, "You do not manage this organization")

    # 3. Update Status (No Deletion)
    await asyncio.to_thread(
        delete_requests_collection.update_one,
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "REJECTED", "processed_at": datetime.utcnow()}}
    )

    return {"message": "Request rejected. User was NOT deleted."}
