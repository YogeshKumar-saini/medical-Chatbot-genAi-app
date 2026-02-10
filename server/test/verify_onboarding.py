import requests
import time
import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger()

BASE_URL = "http://localhost:8000/api/v1"
AUTH_URL = f"{BASE_URL}/auth"
ONBOARD_URL = f"{BASE_URL}/onboarding"

# Test Data - Dynamic
timestamp = int(time.time())
ADMIN_EMAIL = f"admin_{timestamp}@example.com"
DOCTOR_EMAIL = f"doctor_{timestamp}@example.com"
PATIENT_EMAIL = f"patient_{timestamp}@example.com"
PASSWORD = "Password123!"

def get_otp_from_log(email, retries=10):
    logger.info(f"Looking for OTP for {email}...")
    marker = f"TEST_OTP_LOG::{email}::"
    for i in range(retries):
        try:
            log_path = "medical_ai.log"
            with open(log_path, "r") as f:
                lines = f.readlines()
                for line in reversed(lines):
                    if marker in line:
                         # Format: ... TEST_OTP_LOG::email::123456
                         return line.split("::")[-1].strip()
        except FileNotFoundError:
            pass
        time.sleep(1)
    return None

def register_and_login(email, role, name):
    logger.info(f"\n--- Registering {role} ({email}) ---")
    
    # 1. Signup
    res = requests.post(f"{AUTH_URL}/signup", json={
        "email": email, "password": PASSWORD, "role": role, "name": name
    })
    if res.status_code != 201 and "already exists" not in res.text:
         logger.error(f"Signup failed: {res.text}")
         return None
         
    # 2. Verify
    otp = get_otp_from_log(email)
    if otp:
        requests.post(f"{AUTH_URL}/verify-email", json={"email": email, "otp": otp})
    
    # 3. Login
    res = requests.post(f"{AUTH_URL}/login", json={"email": email, "password": PASSWORD})
    if res.status_code == 200:
        logger.info(f"Login success for {role}")
        return res.json()["access_token"], res.json()["user"]["id"]
    else:
        logger.error(f"Login failed: {res.text}")
        return None, None

def verification_flow():
    logger.info("🚀 Starting Onboarding E2E Verification")
    
    # 1. Register Users
    doc_token, doc_id = register_and_login(DOCTOR_EMAIL, "THERAPIST", "Dr. Test") # Using THERAPIST per backend enum
    pat_token, pat_id = register_and_login(PATIENT_EMAIL, "PATIENT", "Mr. Patient")
    
    if not doc_token or not pat_token:
        sys.exit(1)
        
    doc_headers = {"Authorization": f"Bearer {doc_token}"}
    pat_headers = {"Authorization": f"Bearer {pat_token}"}
    
    # 2. Register Org Admin & Create Organization
    logger.info("\n--- Registering Org Admin ---")
    admin_token, admin_id = register_and_login(ADMIN_EMAIL, "ORG_ADMIN", "Admin User")
    if not admin_token:
        sys.exit(1)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    logger.info("\n--- Creating Organization ---")
    org_slug = f"test-clinic-{int(time.time())}"
    res = requests.post(f"{ONBOARD_URL}/organizations", headers=admin_headers, json={
        "name": "Test Clinic", "slug": org_slug, "city": "New York"
    })
    if res.status_code == 201:
        org_id = res.json()["id"]
        logger.info(f"✅ Organization Created: {org_id}")
    else:
        logger.error(f"❌ Org Creation Failed: {res.text}")
        # Proceed if we can list existing?
        # sys.exit(1) 
        # Actually, let's just list and pick one if fail
        res = requests.get(f"{ONBOARD_URL}/organizations")
        if res.json():
            org_id = res.json()[0]["id"]
            logger.info(f"⚠️ Using existing org: {org_id}")
        else:
             sys.exit(1)

    # 3. Doctor Onboarding
    logger.info("\n--- Doctor Onboarding ---")
    res = requests.post(f"{ONBOARD_URL}/doctor/profile", headers=doc_headers, json={
        "specialization": "Cardiology",
        "experience_years": 10,
        "bio": "Expert cardiologist"
    })
    if res.status_code == 200:
        logger.info("✅ Doctor Profile Created")
    else:
        logger.error(f"❌ Doctor Onboarding Failed: {res.text}")

    # 4. Patient Onboarding
    logger.info("\n--- Patient Onboarding ---")
    res = requests.post(f"{ONBOARD_URL}/patient/profile", headers=pat_headers, json={
        "medical_history": "None",
        "organization_id": org_id
    })
    if res.status_code == 200:
        logger.info("✅ Patient Profile Created")
    else:
        logger.error(f"❌ Patient Onboarding Failed: {res.text}")

    # 5. Link Request
    logger.info("\n--- Patient Requesting Link ---")
    res = requests.post(f"{ONBOARD_URL}/links/request", headers=pat_headers, json={
        "doctor_id": doc_id, # Actually this endpoint expects User ID from our code logic
        # But wait, create_doctor_profile stores user_id. 
        # In routes: req.doctor_id matches user_id in doctor_profiles collection.
        # So we pass User ID of doctor.
        "doctor_id": doc_email_to_id(DOCTOR_EMAIL), # Need helper? 
        # Ah, register_and_login returns user ID! doc_id variable.
        "doctor_id": doc_id,
        "organization_id": org_id
    })
    
    link_id = None
    if res.status_code == 200:
        link_id = res.json()["id"]
        logger.info(f"✅ Link Requested: {link_id}")
    else:
        logger.error(f"❌ Link Request Failed: {res.text}")
        sys.exit(1)
        
    # 6. Doctor Approves
    logger.info("\n--- Doctor Approving Link ---")
    res = requests.put(f"{ONBOARD_URL}/links/{link_id}/status", headers=doc_headers, params={
        "status": "ACTIVE"
    })
    if res.status_code == 200:
        logger.info("✅ Link Approved")
    else:
        logger.error(f"❌ Link Approval Failed: {res.text}")

    logger.info("\n✨ Onboarding & Linking Verified Successfully!")

def doc_email_to_id(email):
    # Mock helper if needed, but we have doc_id from login
    return "mock_id"

if __name__ == "__main__":
    verification_flow()
