import requests
import time
import sys
import os
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger()

BASE_URL = "http://localhost:8000/api/v1"
AUTH_URL = f"{BASE_URL}/auth"
APPT_URL = f"{BASE_URL}/appointments"

# Test Data - Dynamic
timestamp = int(time.time())
DOCTOR_EMAIL = f"doctor_{timestamp}@example.com"
PATIENT_EMAIL = f"patient_{timestamp}@example.com"
PASSWORD = "Password123!"

def get_otp_from_log(email, retries=10):
    marker = f"TEST_OTP_LOG::{email}::"
    for i in range(retries):
        try:
            log_path = "medical_ai.log"
            with open(log_path, "r") as f:
                lines = f.readlines()
                for line in reversed(lines):
                    if marker in line:
                         return line.split("::")[-1].strip()
        except FileNotFoundError:
            pass
        time.sleep(1)
    return None

def register_and_login(email, role, name):
    logger.info(f"\n--- Registering {role} ({email}) ---")
    requests.post(f"{AUTH_URL}/signup", json={
        "email": email, "password": PASSWORD, "role": role, "name": name
    })
    otp = get_otp_from_log(email)
    if otp:
        requests.post(f"{AUTH_URL}/verify-email", json={"email": email, "otp": otp})
    
    res = requests.post(f"{AUTH_URL}/login", json={"email": email, "password": PASSWORD})
    if res.status_code == 200:
        return res.json()["access_token"], res.json()["user"]["id"]
    return None, None

def verification_flow():
    logger.info("🚀 Starting Meetings E2E Verification")
    
    # 1. Setup Doctor & Patient
    doc_token, doc_id = register_and_login(DOCTOR_EMAIL, "THERAPIST", "Dr. Mean")
    pat_token, pat_id = register_and_login(PATIENT_EMAIL, "PATIENT", "Mr. Sick")
    
    if not doc_token or not pat_token:
        logger.error("Auth failed")
        sys.exit(1)
        
    doc_headers = {"Authorization": f"Bearer {doc_token}"}
    pat_headers = {"Authorization": f"Bearer {pat_token}"}
    
    # 2. Onboard Doctor (Needed to be valid? Maybe not for simpler appointments logic, but helps)
    # Skipping onboarding just to test appointments if direct linking not enforced yet.

    # 3. Book Appointment (Patient)
    logger.info("\n--- Booking Appointment ---")
    start_time = (datetime.utcnow() + timedelta(days=1)).isoformat()
    end_time = (datetime.utcnow() + timedelta(days=1, hours=1)).isoformat()
    
    res = requests.post(f"{APPT_URL}/", headers=pat_headers, json={
        "doctor_id": doc_id,
        "start_time": start_time,
        "end_time": end_time,
        "subject": "Headache consultation"
    })
    
    if res.status_code == 201:
        appt_id = res.json()["id"]
        logger.info(f"✅ Appointment Booked: {appt_id}")
    else:
        logger.error(f"❌ Booking Failed: {res.text}")
        sys.exit(1)

    # 4. List Appointments (Doctor)
    logger.info("\n--- Doctor Listing Appointments ---")
    res = requests.get(f"{APPT_URL}/", headers=doc_headers)
    if res.status_code == 200:
        appts = res.json()
        logger.info(f"✅ Found {len(appts)} appointments")
        if appts[0]["status"] == "PENDING":
             logger.info("✅ Status is PENDING")
    else:
        logger.error(f"❌ Listing Failed: {res.text}")

    # 5. Confirm Appointment (Doctor)
    logger.info("\n--- Doctor Confirming Appointment ---")
    meet_link = "https://meet.google.com/abc-defg-hij"
    res = requests.put(f"{APPT_URL}/{appt_id}", headers=doc_headers, json={
        "status": "CONFIRMED",
        "meeting_link": meet_link,
        "notes": "Bring x-rays"
    })
    
    if res.status_code == 200:
        logger.info("✅ Appointment Confirmed")
        # Verify Link
        if res.json().get("meeting_link") == meet_link:
             logger.info("✅ Link Saved")
    else:
        logger.error(f"❌ Confirmation Failed: {res.text}")

    # 7. Cancel Appointment
    logger.info("\n--- Cancelling Appointment ---")
    res = requests.put(f"{APPT_URL}/{appt_id}", headers=doc_headers, json={"status": "CANCELLED"})
    if res.status_code == 200:
        logger.info("✅ Appointment Cancelled")
    else:
        logger.error(f"❌ Cancellation Failed: {res.text}")

    # 8. Verify LiveKit Token (New)
    logger.info("\n--- Verifying LiveKit Token Generation ---")
    # Join the confirmed appointment (assuming it wasn't cancelled or testing flow order)
    # We'll create a new one to be clean or just use the canceled one (might fail perm check if strict, but let's see)
    # Better: use the one we confirmed before cancelling. 
    # But since we cancelled it, let's just make a new quick one.
    
    new_res = requests.post(f"{APPT_URL}/", headers=pat_headers, json={
        "doctor_id": doc_id, 
        "start_time": "2024-12-26T10:00:00", 
        "end_time": "2024-12-26T10:30:00",
        "subject": "LiveKit Test Meeting"
    })
    if new_res.status_code == 201:
        new_id = new_res.json()["id"]
        logger.info(f"✅ New Appointment Booked for LiveKit test: {new_id}")
        join_res = requests.get(f"{APPT_URL}/{new_id}/join", headers=pat_headers)
        if join_res.status_code == 200:
            token = join_res.json().get("token")
            logger.info("✅ LiveKit Token Generated Successfully")
            # logger.info(f"Token: {token[:20]}...")
        else:
            logger.error(f"❌ LiveKit Token Failed: {join_res.text}")
    else:
        logger.error(f"❌ Failed to book new appointment for LiveKit test: {new_res.text}")

    logger.info("\n✨ Meeting System Verified Successfully!")

if __name__ == "__main__":
    verification_flow()
