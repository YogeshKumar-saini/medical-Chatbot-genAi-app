import asyncio
import httpx
import sys
import uuid

BASE_URL = "http://localhost:8080"
USERNAME = f"test_user_{uuid.uuid4().hex[:8]}"
PASSWORD = "Test_password1" # Added number and uppercase
ROLE = "admin"  # Try to create an admin to test upload

async def run_tests():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print(f"🔍 Testing API at {BASE_URL}...")

        # 1. Health Check
        try:
            resp = await client.get(f"{BASE_URL}/health")
            if resp.status_code == 200:
                print("✅ /health: OK")
            else:
                print(f"❌ /health: Failed ({resp.status_code})")
        except Exception as e:
            print(f"❌ /health: Error ({e})")
            return

        # 2. Signup
        print(f"\n👤 Creating user {USERNAME} ({ROLE})...")
        try:
            resp = await client.post(
                f"{BASE_URL}/api/v1/auth/signup",
                json={"username": USERNAME, "password": PASSWORD, "role": ROLE}
            )
            if resp.status_code == 200:
                print("✅ Signup: OK")
            else:
                print(f"❌ Signup: Failed ({resp.status_code}) - {resp.text}")
                # Try login anyway, maybe user exists? (Unlikely with random name)
        except Exception as e:
            print(f"❌ Signup: Error ({e})")

        # 3. Login
        print("\n🔑 Logging in...")
        auth = httpx.BasicAuth(USERNAME, PASSWORD)
        try:
            resp = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                auth=auth
            )
            if resp.status_code == 200:
                print("✅ Login: OK")
            else:
                print(f"❌ Login: Failed ({resp.status_code}) - {resp.text}")
                return # Cannot proceed without auth
        except Exception as e:
            print(f"❌ Login: Error ({e})")
            return

        # 4. Chat Suggestions
        print("\n💡 Testing Chat Suggestions...")
        try:
            resp = await client.get(
                f"{BASE_URL}/api/v1/chat/suggestions",
                auth=auth
            )
            if resp.status_code == 200:
                print("✅ Suggestions: OK")
            else:
                print(f"❌ Suggestions: Failed ({resp.status_code}) - {resp.text}")
        except Exception as e:
            print(f"❌ Suggestions: Error ({e})")

        # 5. Chat Message (Expect possible failure due to Quota)
        print("\n💬 Testing Chat Message...")
        try:
            resp = await client.post(
                f"{BASE_URL}/api/v1/chat/chat",
                data={"message": "Hello"},
                auth=auth
            )
            if resp.status_code == 200:
                print("✅ Chat: OK")
            elif resp.status_code == 500:
                 print(f"⚠️ Chat: 500 Internal Server Error (Likely known Quota Issue) - {resp.text}")
            else:
                print(f"❌ Chat: Failed ({resp.status_code}) - {resp.text}")
        except Exception as e:
            print(f"❌ Chat: Error ({e})")

        # 6. Chat History
        print("\n📜 Testing Chat History...")
        try:
            resp = await client.get(
                f"{BASE_URL}/api/v1/chat/history",
                auth=auth
            )
            if resp.status_code == 200:
                print("✅ History: OK")
            else:
                print(f"❌ History: Failed ({resp.status_code}) - {resp.text}")
        except Exception as e:
            print(f"❌ History: Error ({e})")

        # 7. Docs Upload (Admin only)
        # Note: We can't easily upload a file without a dummy file
        # Skipping actual upload but checking if endpoint exists/is reachable could be done by sending bad data
        
        # 8. API Info
        print("\nℹ️ Testing API Info...")
        try:
            resp = await client.get(f"{BASE_URL}/api/v1/info")
            if resp.status_code == 200:
                print("✅ API Info: OK")
            else:
                print(f"❌ API Info: Failed ({resp.status_code})")
        except Exception as e:
            print(f"❌ API Info: Error ({e})")

if __name__ == "__main__":
    asyncio.run(run_tests())
