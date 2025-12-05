import asyncio
import httpx
import uuid
import time

BASE_URL = "http://localhost:8080"
USERNAME = f"persist_user_{uuid.uuid4().hex[:8]}"
PASSWORD = "Test_password1"
ROLE = "doctor"

async def test_persistence():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print(f"💾 Testing Persistence at {BASE_URL}...")

        # 1. Signup & Login
        print(f"\n👤 Creating user {USERNAME}...")
        await client.post(
            f"{BASE_URL}/api/v1/auth/signup",
            json={"username": USERNAME, "password": PASSWORD, "role": ROLE}
        )
        
        resp = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            data={"username": USERNAME, "password": PASSWORD}
        )
        token = resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Send Message
        MESSAGE = f"Hello Persistence {uuid.uuid4().hex[:4]}"
        print(f"\n💬 Sending Message: '{MESSAGE}'")
        resp = await client.post(
            f"{BASE_URL}/api/v1/chat/chat",
            data={"message": MESSAGE}, # Form data
            headers=headers
        )
        
        if resp.status_code == 200:
             print("✅ Chat: OK")
        elif resp.status_code == 500:
             print("⚠️ Chat: 500 (Quota exceeded?) - continuing to check if user message saved")
        else:
             print(f"❌ Chat: Failed ({resp.status_code}) - {resp.text}")

        # 3. Check History
        print("\n📜 Checking History...")
        resp = await client.get(
            f"{BASE_URL}/api/v1/chat/history",
            headers=headers
        )
        
        messages = resp.json().get("messages", [])
        print(f"Found {len(messages)} messages")
        
        found = any(m["content"] == MESSAGE for m in messages if m["role"] == "user")
        if found:
            print("✅ Persistence Confirmed: Message found in history!")
        else:
            print(f"❌ Persistence Failed: Message '{MESSAGE}' not found in {messages}")

if __name__ == "__main__":
    asyncio.run(test_persistence())
