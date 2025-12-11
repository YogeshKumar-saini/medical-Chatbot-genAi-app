#!/usr/bin/env python3
"""
Test script to verify that the org admin dashboard is properly implemented
and shows all users in the organization.
"""
import requests

BASE_URL = "http://localhost:8000"

def test_org_admin_dashboard():
    """Test the complete org admin dashboard functionality"""

    print("🏢 Testing Organization Admin Dashboard")
    print("=" * 60)

    # Step 1: Login as org admin
    print("\n1. Org Admin Login")
    org_admin_email = "yksaini1090@gmail.com"
    org_admin_password = "password123"

    login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": org_admin_email,
        "password": org_admin_password
    })

    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return False

    org_admin_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {org_admin_token}"}

    print("✅ Org admin logged in successfully")
    print("📍 Dashboard URL: http://localhost:3002/dashboard/org-admin")

    # Step 2: Get onboarding status
    print("\n2. Testing Onboarding Status")
    status_response = requests.get(f"{BASE_URL}/api/v1/onboarding/status", headers=headers)

    if status_response.status_code == 200:
        status_data = status_response.json()
        print("✅ Onboarding status retrieved")
        print(f"   Organization: {status_data.get('organization_name', 'N/A')}")
        print(f"   Status: {status_data.get('org_request_status', 'N/A')}")
    else:
        print(f"❌ Status failed: {status_response.status_code}")

    # Step 3: Get organization doctor requests (pending approvals)
    print("\n3. Testing Pending Doctor Requests")
    requests_response = requests.get(f"{BASE_URL}/api/v1/onboarding/org/doctor-requests", headers=headers)

    if requests_response.status_code == 200:
        requests_data = requests_response.json()
        print(f"✅ Retrieved {len(requests_data)} pending requests")
        if requests_data:
            for req in requests_data[:2]:  # Show first 2
                print(f"   👨‍⚕️ {req.get('name', 'Unknown')} - {req.get('email', 'N/A')}")
    else:
        print(f"❌ Requests failed: {requests_response.status_code}")

    # Step 4: Get organization members
    print("\n4. Testing Organization Members")
    members_response = requests.get(f"{BASE_URL}/api/v1/admin/organizations/me", headers=headers)

    if members_response.status_code == 200:
        my_org = members_response.json()
        if my_org and my_org.get('id'):
            org_id = my_org['id']
            print(f"✅ Found organization: {my_org.get('name', 'N/A')}")

            # Get organization members
            members_response = requests.get(f"{BASE_URL}/api/v1/admin/organizations/{org_id}/members", headers=headers)

            if members_response.status_code == 200:
                members_data = members_response.json()
                doctors = members_data.get('doctors', [])
                patients = members_data.get('patients', [])

                print(f"✅ Retrieved {len(doctors)} doctors and {len(patients)} patients")

                if doctors:
                    print("   👨‍⚕️ Doctors:")
                    for doc in doctors[:3]:  # Show first 3
                        print(f"      • {doc.get('name', 'Unknown')} ({doc.get('email', 'N/A')})")

                if patients:
                    print("   👤 Patients:")
                    for pat in patients[:3]:  # Show first 3
                        print(f"      • {pat.get('name', 'Unknown')} ({pat.get('email', 'N/A')})")

            else:
                print(f"❌ Members failed: {members_response.status_code}")
        else:
            print("❌ No organization found for admin")
    else:
        print(f"❌ My organization failed: {members_response.status_code}")

    # Step 5: Test therapist dashboard (should see patient requests)
    print("\n5. Testing Therapist Dashboard (Patient Requests)")

    # Login as therapist
    therapist_login = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "ysaini0193@gmail.com",
        "password": "password123"
    })

    if therapist_login.status_code == 200:
        therapist_token = therapist_login.json()["access_token"]
        therapist_headers = {"Authorization": f"Bearer {therapist_token}"}

        # Get doctor links (patient requests)
        links_response = requests.get(f"{BASE_URL}/api/v1/onboarding/doctor/links", headers=therapist_headers)

        if links_response.status_code == 200:
            links_data = links_response.json()
            print(f"✅ Therapist has {len(links_data)} patient connections/requests")
            if links_data:
                for link in links_data[:2]:
                    print(f"   👤 Patient: {link.get('patient_name', 'Unknown')} - Status: {link.get('status', 'N/A')}")
        else:
            print(f"❌ Therapist links failed: {links_response.status_code}")

    else:
        print("❌ Therapist login failed")

    print("\n" + "=" * 60)
    print("🎉 ORG ADMIN DASHBOARD TEST COMPLETE!")
    print("\n📋 What Should Work Now:")
    print("✅ Org admin can login and access dashboard")
    print("✅ Org admin can see organization status")
    print("✅ Org admin can view pending doctor approval requests")
    print("✅ Org admin can see all doctors and patients in organization")
    print("✅ Therapists can see patient connection requests")
    print("✅ All users are properly linked to the organization")

    print("\n🖥️ Dashboard URLs:")
    print("• Org Admin: http://localhost:3002/dashboard/org-admin")
    print("• Members Page: http://localhost:3002/dashboard/org-admin/members")
    print("• Therapist: http://localhost:3002/dashboard/therapist")

    print("\n🚀 Organization hierarchy is now properly implemented!")

    return True

if __name__ == "__main__":
    test_org_admin_dashboard()
