import asyncio
import httpx
import uuid

BASE_URL = "http://localhost:8080"
USERNAME = f"jwt_user_{uuid.uuid4().hex[:8]}"
PASSWORD = "Test_password1" # Strong password required
ROLE = "doctor"

async def test_jwt_flow():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print(f"🚀 Testing JWT Auth Flow at {BASE_URL}...")

        # 1. Signup
        print(f"\n👤 Creating user {USERNAME}...")
        resp = await client.post(
            f"{BASE_URL}/api/v1/auth/signup",
            json={"username": USERNAME, "password": PASSWORD, "role": ROLE}
        )
        if resp.status_code == 201:
            print("✅ Signup: OK")
        else:
            print(f"❌ Signup: Failed ({resp.status_code}) - {resp.text}")
            return

        # 2. Login (Expect JWT)
        print("\n🔑 Logging in to get Token...")
        resp = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            data={"username": USERNAME, "password": PASSWORD} # OAuth2 expects form data
        )
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("access_token")
            if token:
                print(f"✅ Login: OK (Token received: {token[:10]}...)")
            else:
                print(f"❌ Login: No token in response - {data}")
                return
        else:
            print(f"❌ Login: Failed ({resp.status_code}) - {resp.text}")
            return

        # 3. Access Protected Route
        print("\n🛡️ Accessing Protected Route (Docs Upload - requires auth)...")
        # Just checking if we get passed the auth check (403 forbidden role check is fine, 401 is bad)
        # Actually proper protected route: Let's use /api/v1/auth/login again or a dummy check
        # But wait, routes.py has authenticate dependency. Let's try to hit chat suggestions which uses authenticate
        
        headers = {"Authorization": f"Bearer {token}"}
        resp = await client.get(
            f"{BASE_URL}/api/v1/chat/suggestions",
            headers=headers
        )
        
        if resp.status_code == 200:
             print("✅ Protected Route: OK (Authorized)")
        elif resp.status_code == 401:
             print("❌ Protected Route: Failed (Unauthorized)")
        else:
             print(f"⚠️ Protected Route: Status {resp.status_code} (Auth likely working if not 401) - {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_jwt_flow())
