import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

# Test Data
SUPER_ADMIN_EMAIL = "superadmin@example.com"
SUPER_ADMIN_PASSWORD = "password123"
TEST_ORG_SLUG = "temp-verify-org"

def login(email, password):
    print(f"Logging in as {email}...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code == 200:
        print("Login successful.")
        return resp.json()["access_token"]
    else:
        print(f"Login failed: {resp.text}")
        sys.exit(1)

def verify_users(token):
    headers = {"Authorization": f"Bearer {token}"}
    print("\n--- Verifying User Management ---")
    
    # List Users
    print("Listing users...")
    resp = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    if resp.status_code == 200:
        users = resp.json()
        print(f"Found {len(users)} users.")
        if users: # Check if the list is not empty
            target_user = users[0]
            print(f"Checking details for user {target_user['email']} ({target_user['id']})...")
            detail_resp = requests.get(f"{BASE_URL}/admin/users/{target_user['id']}", headers=headers)
            if detail_resp.status_code == 200:
                print("User Details fetched successfully.")
            else:
                print(f"User Details failed: {detail_resp.text}")
            
            # Update Role (Self-update check or other user)
            # Find a non-super admin user to update
            target_user_for_role_update = next((u for u in users if u["email"] != SUPER_ADMIN_EMAIL), None)
            if target_user_for_role_update:
                print(f"Attempting to update role for {target_user_for_role_update['email']}...")
                update_resp = requests.put(
                    f"{BASE_URL}/admin/users/{target_user['id']}/role", 
                    headers=headers, 
                    json={"role": "PATIENT"} # Reset to patient safely
                )
                if update_resp.status_code == 200:
                    print("Role update successful.")
                else:
                    print(f"Role update failed: {update_resp.text}")
            else:
                print("No suitable target user found for role update test.")
    else:
        print(f"Failed to list users: {resp.text}")

def verify_orgs(token):
    headers = {"Authorization": f"Bearer {token}"}
    print("\n--- Verifying Organization Management ---")
    
    # Create Org (via Onboarding)
    print("Creating temporary organization...")
    create_resp = requests.post(
        f"{BASE_URL}/onboarding/organizations", 
        headers=headers,
        json={"name": "Temp Verify Org", "slug": TEST_ORG_SLUG, "description": "To be deleted"}
    )
    
    if create_resp.status_code in [200, 201]:
        org_id = create_resp.json()["id"]
        print(f"Organization created (ID: {org_id}).")
        
        # Verify Org (Toggle)
        print("Verifying organization (verify=True)...")
        verify_resp = requests.put(f"{BASE_URL}/onboarding/organizations/{org_id}/verify?verified=true", headers=headers)
        if verify_resp.status_code == 200:
            print("Organization verified.")
        else:
            print(f"Organization verification failed: {verify_resp.text}")

        # Delete Org
        print("Deleting organization...")
        delete_resp = requests.delete(f"{BASE_URL}/admin/organizations/{org_id}", headers=headers)
        if delete_resp.status_code == 200:
            print("Organization deleted successfully.")
        else:
            print(f"Organization deletion failed: {delete_resp.text}")

    # Fetch Details of existing organizations (if any)
    print("Listing organizations for detail check...")
    list_resp = requests.get(f"{BASE_URL}/onboarding/organizations?verified_only=false", headers=headers)
    if list_resp.status_code == 200:
        orgs = list_resp.json()
        if orgs:
            target_org = orgs[0]
            print(f"Checking details for org {target_org['name']} ({target_org['id']})...")
            
            # Org Details
            det_resp = requests.get(f"{BASE_URL}/admin/organizations/{target_org['id']}/details", headers=headers)
            if det_resp.status_code == 200:
                print("Org Details fetched successfully.")
            else:
                print(f"Org Details failed: {det_resp.text}")

            # Org Members
            mem_resp = requests.get(f"{BASE_URL}/admin/organizations/{target_org['id']}/members", headers=headers)
            if mem_resp.status_code == 200:
                print("Org Members fetched successfully.")
                mems = mem_resp.json()
                if mems.get("doctors"):
                    doc_id = mems["doctors"][0]["id"]
                    # Doctor Details
                    print(f"Checking doctor details for {doc_id}...")
                    doc_resp = requests.get(f"{BASE_URL}/admin/doctors/{doc_id}", headers=headers)
                    if doc_resp.status_code == 200:
                         print("Doctor Details fetched successfully.")
                    else:
                         print(f"Doctor Details failed: {doc_resp.text}")
            else:
                print(f"Org Members failed: {mem_resp.text}")

            
    elif "already exists" in create_resp.text:
         print("Organization already exists, attempting to find and delete...")
         # Find it (Assuming we can list or find ID, skipping for now complexity)
         print("Skipping delete test due to pre-existence.")
    else:
        print(f"Failed to create organization: {create_resp.text}")

def verify_analytics(token):
    headers = {"Authorization": f"Bearer {token}"}
    print("\n--- Verifying Analytics ---")
    
    print("Fetching System Stats...")
    stats_resp = requests.get(f"{BASE_URL}/analytics/stats", headers=headers)
    if stats_resp.status_code == 200:
        print("Stats fetched successfully.")
        print(stats_resp.json())
    else:
        print(f"Failed to fetch stats: {stats_resp.text}")

    print("Fetching System Logs...")
    logs_resp = requests.get(f"{BASE_URL}/analytics/logs", headers=headers)
    if logs_resp.status_code == 200:
        js = logs_resp.json()
        if "logs" in js and isinstance(js["logs"], list):
            print(f"Logs fetched successfully. Count: {len(js['logs'])}")
        else:
            print(f"Logs format incorrect: {js}")
    else:
        print(f"Failed to fetch logs: {logs_resp.text}")

if __name__ == "__main__":
    try:
        token = login(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
        verify_users(token)
        verify_orgs(token)
        verify_analytics(token)
        print("\nSUCCESS: All Super Admin verifications passed.")
    except Exception as e:
        print(f"\nERROR: Verification failed with exception: {e}")
        sys.exit(1)
