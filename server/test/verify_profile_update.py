import requests
import time
import uuid
import sys

BASE_URL = "http://localhost:8080/api/v1"
AUTH_URL = f"{BASE_URL}/auth"
PROFILES_URL = f"{BASE_URL}/profiles"

# Unique email to avoid conflicts
EMAIL = f"test_name_update_{uuid.uuid4().hex[:6]}@example.com"
PASSWORD = "Password123!"
INITIAL_NAME = "Original Name"
UPDATED_NAME = "Updated Name Verified"

def verify_name_update():
    print(f"🚀 Starting Profile Name Update Verification for {EMAIL}")

    # 1. Signup
    print(f"\n1️⃣ Registering User...")
    signup_payload = {
        "email": EMAIL,
        "password": PASSWORD,
        "role": "PATIENT",
        "name": INITIAL_NAME,
        "phone": "1234567890"
    }
    
    res = requests.post(f"{AUTH_URL}/signup", json=signup_payload)
    if res.status_code != 201:
        print(f"❌ Signup Failed: {res.status_code} {res.text}")
        return

    print("✅ Signup successful")

    # 2. Get OTP from logs
    print(f"\n2️⃣ Fetching OTP from logs...")
    time.sleep(1) # Wait for log write
    otp_code = None
    try:
        log_path = "medical_ai.log"
        with open(log_path, "r") as f:
            lines = f.readlines()
            for line in reversed(lines):
                 if "Code: " in line:
                      parts = line.split("Code: ")
                      if len(parts) > 1:
                           otp_code = parts[1].strip()
                           break
    except FileNotFoundError:
        print("❌ Log file not found")
        return

    if not otp_code:
        print("❌ Could not find OTP in logs")
        return

    print(f"✅ OTP extracted: {otp_code}")

    # 3. Verify Email
    print(f"\n3️⃣ Verifying Email...")
    verify_payload = {
        "email": EMAIL,
        "otp": otp_code
    }
    res = requests.post(f"{AUTH_URL}/verify-email", json=verify_payload)
    if res.status_code != 200:
        print(f"❌ Verification Failed: {res.status_code} {res.text}")
        return
    print("✅ Verification successful")

    # 4. Login
    print(f"\n4️⃣ Logging in...")
    login_payload = {
        "email": EMAIL,
        "password": PASSWORD
    }
    res = requests.post(f"{AUTH_URL}/login", json=login_payload)
    if res.status_code != 200:
        print(f"❌ Login Failed: {res.status_code} {res.text}")
        return
    
    token = res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful")

    # 5. Update Name
    print(f"\n5️⃣ Updating Profile Name to '{UPDATED_NAME}'...")
    update_payload = {
        "name": UPDATED_NAME,
        "bio": "Updated bio via test"
    }
    res = requests.put(f"{PROFILES_URL}/me", json=update_payload, headers=headers)
    if res.status_code != 200:
        print(f"❌ Update Failed: {res.status_code} {res.text}")
        return
    
    print("✅ Update request successful")

    # 6. Verify Update via Auth/Me endpoint (which returns User info including name)
    print(f"\n6️⃣ Verifying Name Persistence...")
    # Assuming there's an endpoint to get current user details, usually /auth/me or verify /profiles/me logic
    # Looking at auth/routes.py, is there a /me? Or usually /users/me? 
    # Let's check profile first, but profile might fetch from user doc
    
    # Check Profile
    res_profile = requests.get(f"{PROFILES_URL}/me", headers=headers) # Only if this endpoint exists?
    # Actually routes.py has get_profile(user_id) but maybe not /me GET?
    # Wait, routes.py has @router.put("/me") but NOT @router.get("/me").
    # It has @router.get("/{user_id}").
    
    # Let's get the user ID first.
    # We can probably get it from the login token if decoded, but easier to verify via side channel or if there is a get-me.
    
    # Let's try /auth/test-token or similar if exists, or just use the user_id if returned in login?
    # Login response usually has user info.
    
    # Let's see if update actually updated the user in DB by logging in AGAIN?
    # Or assuming /auth/me exists?
    # Let's assume we can fetch profile by the ID we might have?
    # Wait, the ProfileService.get_or_create_profile returns a dict that DOES NOT include 'name' usually (it's in Users collection).
    # The Frontend fetches USER info separately?
    
    # Ah, the frontend relies on `useAuthStore` which gets user info from `apiClient.getMe()` likely?
    # Let's check `auth/routes.py` for `me` endpoint.
    res_me = requests.get(f"{AUTH_URL}/me", headers=headers)
    
    if res_me.status_code == 200:
        user_data = res_me.json()
        current_name = user_data.get("name")
        print(f"   Fetched Name: {current_name}")
        
        if current_name == UPDATED_NAME:
            print("✅ Name Successfully Updated in Users Collection!")
        else:
            print(f"❌ Name Mismatch! Expected '{UPDATED_NAME}', got '{current_name}'")
    else:
        print(f"⚠️ Could not fetch /auth/me: {res_me.status_code}. Checking login response instead.")
        # Try relogin
        res_login_2 = requests.post(f"{AUTH_URL}/login", json=login_payload)
        user_data_2 = res_login_2.json().get("user", {})
        current_name_2 = user_data_2.get("name")
        print(f"   Relogin Name: {current_name_2}")
        if current_name_2 == UPDATED_NAME:
             print("✅ Name Successfully Updated (verified via relogin)!")
        else:
             print(f"❌ Name Mismatch on Relogin! Expected '{UPDATED_NAME}', got '{current_name_2}'")

if __name__ == "__main__":
    verify_name_update()
