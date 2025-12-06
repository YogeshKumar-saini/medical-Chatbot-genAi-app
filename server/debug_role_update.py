import requests
import os
from dotenv import load_dotenv

# Load env vars
load_dotenv()

BASE_URL = "http://localhost:8000/api/v1"
SUPER_ADMIN_EMAIL = "superadmin@example.com"
PASSWORD = "superpassword" # Assuming this is the password, or we verify email login

def debug_role_update():
    # 1. Login as Super Admin
    print("Logging in...")
    login_payload = {"email": SUPER_ADMIN_EMAIL, "password": PASSWORD}
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
        if resp.status_code != 200:
             # Try verify email flow if password login fails or assumes OTP? 
             # Usually standard login works for dev.
             print(f"Login failed: {resp.text}")
             return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")

        # 2. List Users to find a target
        print("Listing users...")
        list_resp = requests.get(f"{BASE_URL}/admin/users", headers=headers)
        if list_resp.status_code != 200:
            print(f"List users failed: {list_resp.text}")
            return
            
        users = list_resp.json()
        target_user = next((u for u in users if u["email"] != SUPER_ADMIN_EMAIL), None)
        
        if not target_user:
            print("No target user found to update.")
            return
            
        print(f"Target User: {target_user['email']} (Current Role: {target_user['role']})")
        
        # 3. Update Role
        new_role = "ORG_ADMIN" if target_user["role"] != "ORG_ADMIN" else "THERAPIST"
        print(f"Attempting to change role to {new_role}...")
        
        update_resp = requests.put(
            f"{BASE_URL}/admin/users/{target_user['id']}/role",
            headers=headers,
            json={"role": new_role}
        )
        
        print(f"Update Status: {update_resp.status_code}")
        print(f"Update Response: {update_resp.text}")
        
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug_role_update()
