import asyncio
import aiohttp
import sys
import random
from config.db import users_collection, orgs_collection, doctor_profiles_collection, links_collection

BASE_URL = "http://localhost:8080/api/v1"

async def main():
    print("🚀 Starting Robustness Verification")
    
    # 1. Setup Test Data
    print("\n--- Setting up Test Data ---")
    
    # Create Org
    async with aiohttp.ClientSession() as session:
        # Create unique Org Admin
        org_admin_email = f"robust_admin_{random.randint(1000,9999)}@test.com"
        print(f"Registering Org Admin: {org_admin_email}")
        
        # Signup
        async with session.post(f"{BASE_URL}/auth/signup", json={
            "email": org_admin_email, "password": "password123", "name": "Robust Admin", "role": "ORG_ADMIN",
            "phone": "1234567890" 
        }) as resp:
            assert resp.status == 201, f"Signup failed: {resp.status}"

        # Manually Verify Org Admin
        await asyncio.to_thread(users_collection.update_one, {"email": org_admin_email}, {"$set": {"is_verified": True}})

        # Login
        async with session.post(f"{BASE_URL}/auth/login", json={
            "email": org_admin_email, "password": "password123"
        }) as resp:
            data = await resp.json()
            token = data["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
        # Create Org
        org_slug = f"robust-org-{random.randint(1000, 9999)}"
        print(f"Creating Org: {org_slug}")
        async with session.post(f"{BASE_URL}/onboarding/organizations", json={
            "name": "Robust Org", "slug": org_slug
        }, headers=headers) as resp:
            org_data = await resp.json()
            org_id = org_data["id"]
            
        # Manually Verify Org
        from bson import ObjectId
        await asyncio.to_thread(orgs_collection.update_one, {"_id": ObjectId(org_id)}, {"$set": {"is_verified": True}})
        
        # Create 5 Doctors and approve them
        print("Creating 5 Doctors...")
        for i in range(5):
            doc_email = f"robust_doc_{i}_{random.randint(1000,9999)}@test.com"
            
            # Signup
            async with session.post(f"{BASE_URL}/auth/signup", json={
                "email": doc_email, "password": "password123", "name": f"Dr. {i}", "role": "THERAPIST",
                 "phone": "1234567890"
            }) as resp:
                pass
                
            # Verify
            await asyncio.to_thread(users_collection.update_one, {"email": doc_email}, {"$set": {"is_verified": True}})

            # Login
            async with session.post(f"{BASE_URL}/auth/login", json={
                "email": doc_email, "password": "password123"
            }) as resp:
                d_data = await resp.json()
                d_token = d_data["access_token"]
                
            async with session.post(f"{BASE_URL}/onboarding/doctor/profile", json={
                "specialization": "General", "organization_id": org_id
            }, headers={"Authorization": f"Bearer {d_token}"}) as resp:
                await resp.json()
                
            # Approve
            doc_id = d_data["user"]["id"]
            await asyncio.to_thread(doctor_profiles_collection.update_one, 
                {"user_id": doc_id}, {"$set": {"org_request_status": "APPROVED"}})
                
        # 2. Verify Pagination
        print("\n--- Testing Pagination ---")
        async with session.get(f"{BASE_URL}/onboarding/organizations/{org_id}/doctors?limit=2", headers=headers) as resp:
            page1 = await resp.json()
            print(f"Page 1 (Limit 2): Got {len(page1)} doctors")
            assert len(page1) == 2, f"Expected 2, got {len(page1)}"
            
        async with session.get(f"{BASE_URL}/onboarding/organizations/{org_id}/doctors?limit=2&skip=2", headers=headers) as resp:
            page2 = await resp.json()
            print(f"Page 2 (Limit 2, Skip 2): Got {len(page2)} doctors")
            assert len(page2) == 2, f"Expected 2, got {len(page2)}"
            
        print("✅ Pagination verified")
        
        # 3. Verify Duplicate Link Prevention
        print("\n--- Testing Duplicate Link Prevention ---")
        # Register Patient
        pat_email = f"robust_pat_{random.randint(1000,9999)}@test.com"
        
        async with session.post(f"{BASE_URL}/auth/signup", json={
            "email": pat_email, "password": "password123", "name": "Robust Patient", "role": "PATIENT",
            "phone": "9876543210"
        }) as resp:
             pass

        # Verify
        await asyncio.to_thread(users_collection.update_one, {"email": pat_email}, {"$set": {"is_verified": True}})

        # Login
        async with session.post(f"{BASE_URL}/auth/login", json={
            "email": pat_email, "password": "password123"
        }) as resp:
            p_data = await resp.json()
            p_token = p_data["access_token"]
            
        target_doc_id = page1[0]["id"]
        
        # Request 1
        print("Requesting Link 1...")
        async with session.post(f"{BASE_URL}/onboarding/links/request", json={
            "doctor_id": target_doc_id, "organization_id": org_id
        }, headers={"Authorization": f"Bearer {p_token}"}) as resp:
            assert resp.status == 200, f"Req 1 failed: {resp.status}"
            
        # Request 2 (Duplicate)
        print("Requesting Link 2 (Duplicate)...")
        async with session.post(f"{BASE_URL}/onboarding/links/request", json={
            "doctor_id": target_doc_id, "organization_id": org_id
        }, headers={"Authorization": f"Bearer {p_token}"}) as resp:
            print(f"Duplicate Response Status: {resp.status}")
            assert resp.status == 400, f"Expected 400 for duplicate, got {resp.status}"
            
        print("✅ Duplicate Prevention verified")
        print("\n✨ ROBUSTNESS CHECK PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
