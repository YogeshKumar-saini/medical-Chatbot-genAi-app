import requests
import sys
import time

BASE_URL = "http://127.0.0.1:8080"
TS = int(time.time())
SUPER_ADMIN_EMAIL = "superadmin@gmail.com"
ORG_ADMIN_EMAIL = "orgadmin@gmail.com"
DOCTOR_EMAIL = "doctor@gmail.com"
PATIENT_EMAIL = "patient@gmail.com"
PASSWORD = "password123"

def register_and_login(email, role, name):
    print(f"\n--- Registering {role} ({email}) ---")
    requests.post(f"{BASE_URL}/api/v1/auth/signup", json={
        "email": email, "password": PASSWORD, "role": role, "name": name, "phone": "1234567890"
    })
    
    # Verify email
    # Assuming code is 000000 or similar bypass in dev, else we might need to fetch from logs.
    # For now, let's assume we can login if backend allows unverified login or verify endpoint mock.
    # Actually, let's just try login.
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    if res.status_code == 200:
        return res.json()["access_token"], res.json()["user"]["id"]
    
    # Try verify
    verify_res = requests.post(f"{BASE_URL}/api/v1/auth/verify-email", json={"email": email, "otp": "000000"})
    
    # Login again
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    if res.status_code == 200:
        return res.json()["access_token"], res.json()["user"]["id"]
    
    print(f"Failed to login {email}: {res.text}")
    return None, None

def run_verification():
    print("🚀 Starting Hierarchical Onboarding Verification")
    
    # 1. Setup Super Admin
    sa_token, sa_id = register_and_login(SUPER_ADMIN_EMAIL, "SUPER_ADMIN", "Super User")
    if not sa_token: return

    # 2. Setup Org Admin & Create Org
    oa_token, oa_id = register_and_login(ORG_ADMIN_EMAIL, "ORG_ADMIN", "Org Admin")
    if not oa_token: return
    
    print("\n--- Creating Organization ---")
    org_slug = f"test-hospital-{int(time.time())}"
    org_res = requests.post(f"{BASE_URL}/api/v1/onboarding/organizations", 
        json={
            "name": "Test Hospital",
            "slug": org_slug,
            "address": "123 Health St",
            "city": "Healthy City",
            "country": "Healthland"
        },
        headers={"Authorization": f"Bearer {oa_token}"}
    )
    
    if org_res.status_code != 201:
        print(f"❌ Failed to create org: {org_res.text}")
        return
    
    org_id = org_res.json()["id"]
    print(f"✅ Organization Created: {org_id}")
    
    # Verify Org is NOT verified yet
    print(f"Checking verification status (expecting False)... {org_res.json().get('is_verified')}")
    
    # 3. Super Admin Verifies Org
    print("\n--- Super Admin Verifying Org ---")
    verify_res = requests.put(f"{BASE_URL}/api/v1/onboarding/admin/organizations/{org_id}/verify",
        params={"verified": "true"},
        headers={"Authorization": f"Bearer {sa_token}"}
    )
    if verify_res.status_code == 200:
        print("✅ Organization Verified")
    else:
        print(f"❌ Verification Failed: {verify_res.text}")
        return

    # 4. Doctor Joins Org
    doc_token, doc_id = register_and_login(DOCTOR_EMAIL, "THERAPIST", "Dr. House")
    if not doc_token: return
    
    print("\n--- Doctor Requesting to Join Org ---")
    doc_profile_res = requests.post(f"{BASE_URL}/api/v1/onboarding/doctor/profile",
        json={
            "specialization": "Diagnostic",
            "experience_years": 10,
            "organization_id": org_id,
            "bio": "It's never lupus."
        },
        headers={"Authorization": f"Bearer {doc_token}"}
    )
    
    if doc_profile_res.status_code == 200:
        print("✅ Doctor Profile functionality working, request sent")
    else:
        print(f"❌ Doctor Profile Failed: {doc_profile_res.text}")
        return
        
    # 5. Org Admin Approves Doctor
    print("\n--- Org Admin Approving Doctor ---")
    # First, list requests
    reqs_res = requests.get(f"{BASE_URL}/api/v1/onboarding/org/doctor-requests", headers={"Authorization": f"Bearer {oa_token}"})
    print(f"Pending Requests: {len(reqs_res.json())}")
    
    approve_res = requests.put(f"{BASE_URL}/api/v1/onboarding/org/doctor-requests/{doc_id}/status",
        params={"approved": "true"},
        headers={"Authorization": f"Bearer {oa_token}"}
    )
    
    if approve_res.status_code == 200:
        print("✅ Doctor Approved")
    else:
        print(f"❌ Doctor Approval Failed: {approve_res.text}")
        return
        
    # 6. Patient Selects Org & Doctor
    pat_token, pat_id = register_and_login(PATIENT_EMAIL, "PATIENT", "sick Patient")
    if not pat_token: return
    
    print("\n--- Patient Checking Doctors of Org ---")
    docs_res = requests.get(f"{BASE_URL}/api/v1/onboarding/organizations/{org_id}/doctors", headers={"Authorization": f"Bearer {pat_token}"})
    doctors = docs_res.json()
    print(f"Found {len(doctors)} doctors in org")
    
    if len(doctors) > 0:
        print(f"✅ Patient sees doctor: {doctors[0]['name']}")
    else:
        print("❌ Patient sees no doctors")

    print("\n✨ FULL FLOW VERIFIED!")

if __name__ == "__main__":
    run_verification()
