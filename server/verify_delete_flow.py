import requests
import sys
import time

BASE_URL = "http://localhost:8000/api/v1"

# Credentials
SUPER_ADMIN_EMAIL = "superadmin@example.com"
SUPER_ADMIN_PASSWORD = "password123"

import time

# Data for test
timestamp = int(time.time())
TEST_ORG_SLUG = f"del-req-org-{timestamp}"
TEST_ORG_EMAIL = f"orgadmin-del-{timestamp}@example.com"
TEST_PASS = "password123"
TEST_DOC_EMAIL = f"doctor-del-{timestamp}@example.com"

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

def force_verify_user(email):
    try:
        from pymongo import MongoClient
        import os
        # Use env var loaded from .env
        MONGO_URI = os.getenv("MONGO_URI")
        if not MONGO_URI:
             print("MONGO_URI not found in env")
             return
        
        client = MongoClient(MONGO_URI)
        db = client[os.getenv("DB_NAME", "medical-chatbot")]  # strict match to DB name
        users = db.users
        result = users.update_one(
            {"email": email},
            {"$set": {"is_verified": True}}
        )
        if result.modified_count > 0:
            print(f"Force verified {email}")
        else:
            print(f"User {email} already verified or not found")
    except Exception as e:
        print(f"Failed to force verify: {e}")

def login(email, password):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code == 200:
        return resp.json()["access_token"], resp.json()["user"]["id"]
    return None, None

def run_verification():
    print("--- Starting Delete Request Workflow Verification ---")
    
    # 1. Login Super Admin
    sa_token, sa_id = login(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
    if not sa_token:
        print("Failed to login Super Admin")
        sys.exit(1)
    sa_headers = {"Authorization": f"Bearer {sa_token}"}
    print("Super Admin logged in.")

    # 3. Get Org Admin Token (Assumption: Org creation makes user or we assume one exists)
    # Actually, onboarding/organizations usually requires an existing user to verify or such. 
    # Let's clean up: Creating org usually assigns current user as admin inside routes?
    # No, usually need to signup Org Admin first.
    
    # Quick Signup for Org Admin
    print("Registering Org Admin...")
    requests.post(f"{BASE_URL}/auth/signup", json={
        "email": TEST_ORG_EMAIL, 
        "password": TEST_PASS, 
        "name": "Org Admin Del", 
        "role": "ORG_ADMIN"
    })
    force_verify_user(TEST_ORG_EMAIL) # FORCE VERIFY
    
    # Force verify
    oa_token, oa_id = login(TEST_ORG_EMAIL, TEST_PASS)
    if not oa_token:
        # Maybe needs verification.
        print("Org Admin login failed (might need verification). Skipping full flow or failing.")
        # Try to continue if possible using SuperAdmin only? No, need OA to approve.
        sys.exit(1)
    oa_headers = {"Authorization": f"Bearer {oa_token}"}

    # Create Org as OA
    print("Org Admin creating Org...")
    org_resp = requests.post(f"{BASE_URL}/onboarding/organizations", json={
        "name": "Delete Req Org",
        "slug": TEST_ORG_SLUG
    }, headers=oa_headers)
    
    if org_resp.status_code in [200, 201]:
        org_id = org_resp.json()["id"]
        # Approve Org as SA
        requests.put(f"{BASE_URL}/onboarding/admin/organizations/{org_id}/verify?verified=true", headers=sa_headers)
    else:
        print(f"Org creation failed: {org_resp.text}")
        sys.exit(1)

    # 4. Create Doctor and Link to Org
    print("Registering Doctor...")
    requests.post(f"{BASE_URL}/auth/signup", json={
        "email": TEST_DOC_EMAIL, "password": TEST_PASS, "name": "Doc Del", "role": "DOCTOR"
    })
    force_verify_user(TEST_DOC_EMAIL) # FORCE VERIFY
    doc_token, doc_id = login(TEST_DOC_EMAIL, TEST_PASS)
    doc_headers = {"Authorization": f"Bearer {doc_token}"}
    
    # Create Profile linked to Org
    print("Doctor creating profile linked to Org...")
    requests.post(f"{BASE_URL}/onboarding/doctor/profile", json={
        "specialization": "General", 
        "organization_id": org_id
    }, headers=doc_headers)

    # 5. TEST: Super Admin Deletes Doctor
    print("Super Admin initiating delete of Doctor...")
    del_resp = requests.delete(f"{BASE_URL}/admin/users/{doc_id}", headers=sa_headers)
    print(f"Delete Response: {del_resp.status_code} - {del_resp.json()}")
    
    if del_resp.json().get("status") == "PENDING":
        print("SUCCESS: Deletion request created (Pending).")
    else:
        print("FAILURE: User was deleted immediately or error occurred.")
        sys.exit(1)

    # 6. TEST: Org Admin Lists Request
    print("Org Admin checking requests...")
    req_resp = requests.get(f"{BASE_URL}/admin/requests/delete", headers=oa_headers)
    requests_list = req_resp.json()
    if len(requests_list) > 0 and requests_list[0]["target_user_id"] == doc_id:
        print("SUCCESS: Request visible to Org Admin.")
        req_id = requests_list[0]["id"]
    else:
        print("FAILURE: Request not found by Org Admin.")
        sys.exit(1)

    # 7. TEST: Org Admin Rejects (User should persist)
    print("Org Admin rejecting request...")
    requests.post(f"{BASE_URL}/admin/requests/delete/{req_id}/reject", headers=oa_headers)
    
    # Verify User still exists
    user_check = requests.get(f"{BASE_URL}/admin/users/{doc_id}", headers=sa_headers)
    if user_check.status_code == 200:
        print("SUCCESS: User persists after rejection.")
    else:
        print("FAILURE: User missing after rejection.")

    # 8. TEST: Super Admin Deletes Again -> Org Admin Approves
    # We need to trigger a NEW request.
    print("Super Admin initiating delete again...")
    del_resp_2 = requests.delete(f"{BASE_URL}/admin/users/{doc_id}", headers=sa_headers)
    if del_resp_2.json().get("status") == "PENDING":
        # Get new request ID
        req_resp_2 = requests.get(f"{BASE_URL}/admin/requests/delete", headers=oa_headers)
        new_req_id = req_resp_2.json()[0]["id"]
        
        print("Org Admin approving request...")
        app_resp = requests.post(f"{BASE_URL}/admin/requests/delete/{new_req_id}/approve", headers=oa_headers)
        
        # Verify User Deleted
        user_check_2 = requests.get(f"{BASE_URL}/admin/users/{doc_id}", headers=sa_headers)
        if user_check_2.status_code == 404:
            print("SUCCESS: User deleted after approval.")
        else:
            print("FAILURE: User still exists after approval.")
            
    # Cleanup Org
    requests.delete(f"{BASE_URL}/admin/organizations/{org_id}", headers=sa_headers)
    requests.delete(f"{BASE_URL}/admin/users/{oa_id}", headers=sa_headers)
    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"Error: {e}")
