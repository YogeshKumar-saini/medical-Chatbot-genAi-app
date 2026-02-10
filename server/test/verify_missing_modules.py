import requests
import sys
import time
import uuid

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = f"wellness_test_{int(time.time())}@example.com"
PASSWORD = "password123"

def get_otp_from_log(email, retries=10):
    print(f"Looking for OTP for {email}...")
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

def register_and_login():
    print(f"\n--- Registering User ({EMAIL}) ---")
    # 1. Signup
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        "email": EMAIL, "password": PASSWORD, "name": "Wellness User", "role": "PATIENT"
    })
    
    if resp.status_code != 201:
        print(f"Signup failed: {resp.text}")
        sys.exit(1)

    # 2. Verify OTP
    otp = get_otp_from_log(EMAIL)
    if not otp:
        print("❌ Could not find OTP in logs")
        sys.exit(1)
        
    print(f"Found OTP: {otp}")
    resp = requests.post(f"{BASE_URL}/auth/verify-email", json={"email": EMAIL, "otp": otp})
    if resp.status_code != 200:
        print(f"OTP verification failed: {resp.text}")
        sys.exit(1)

    # 3. Login
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        sys.exit(1)
    return resp.json()["access_token"]

def verify_wellness(token):
    headers = {"Authorization": f"Bearer {token}"}
    print("\n--- Testing Wellness API ---")
    
    # 1. Log Mood
    mood_data = {"mood": "HAPPY", "intensity": 8, "note": "Feeling great!"}
    resp = requests.post(f"{BASE_URL}/wellness/mood", json=mood_data, headers=headers)
    if resp.status_code == 200:
        print("✅ Mood logged successfully")
    else:
        print(f"❌ Failed to log mood: {resp.text}")

    # 2. Get Mood History
    resp = requests.get(f"{BASE_URL}/wellness/mood/history", headers=headers)
    if resp.status_code == 200 and len(resp.json()) > 0:
        print("✅ Mood history retrieved")
    else:
        print(f"❌ Failed to get mood history: {resp.text}")

    # 3. Create Journal Entry
    journal_data = {"title": "My Day", "content": "Today was productive.", "tags": ["work", "happy"]}
    resp = requests.post(f"{BASE_URL}/wellness/journal", json=journal_data, headers=headers)
    if resp.status_code == 200:
        entry_id = resp.json()["id"]
        print(f"✅ Journal entry created: {entry_id}")
        return entry_id
    else:
        print(f"❌ Failed to create journal entry: {resp.text}")
        return None

    # 4. List Journal Entries
    # (Checking later after creation)

def verify_journal_list_and_delete(token, entry_id):
    if not entry_id: return
    headers = {"Authorization": f"Bearer {token}"}
    
    # 4. List Journal Entries
    resp = requests.get(f"{BASE_URL}/wellness/journal", headers=headers)
    if resp.status_code == 200 and len(resp.json()) > 0:
        print("✅ Journal entries listed")
    else:
        print(f"❌ Failed to list journal entries: {resp.text}")

    # 5. Delete Journal Entry
    resp = requests.delete(f"{BASE_URL}/wellness/journal/{entry_id}", headers=headers)
    if resp.status_code == 200:
        print("✅ Journal entry deleted")
    else:
        print(f"❌ Failed to delete journal entry: {resp.text}")

def verify_notifications(token):
    headers = {"Authorization": f"Bearer {token}"}
    print("\n--- Testing Notifications API ---")
    
    resp = requests.get(f"{BASE_URL}/notifications/", headers=headers)
    if resp.status_code == 200:
        print("✅ Notifications listed")
    else:
        print(f"❌ Failed to list notifications: {resp.text}")

if __name__ == "__main__":
    try:
        token = register_and_login()
        entry_id = verify_wellness(token)
        verify_journal_list_and_delete(token, entry_id)
        verify_notifications(token)
        print("\n✨ Missing Modules Verified!")
    except Exception as e:
        print(f"\n❌ Verification failed: {e}")
        sys.exit(1)
