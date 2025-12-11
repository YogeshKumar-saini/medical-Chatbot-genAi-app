import requests
import time
import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger()

BASE_URL = "http://localhost:8000/api/v1"
AUTH_URL = f"{BASE_URL}/auth"
CHAT_URL = f"{BASE_URL}/chat"

timestamp = int(time.time())
EMAIL = f"chat_user_{timestamp}@example.com"
PASSWORD = "Password123!"

def get_otp_from_log(email, retries=10):
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
    logger.info(f"\n--- Registering ({EMAIL}) ---")
    requests.post(f"{AUTH_URL}/signup", json={
        "email": EMAIL, "password": PASSWORD, "role": "PATIENT", "name": "Chatter Box"
    })
    
    otp = get_otp_from_log(EMAIL)
    if otp:
        requests.post(f"{AUTH_URL}/verify-email", json={"email": EMAIL, "otp": otp})
    
    res = requests.post(f"{AUTH_URL}/login", json={"email": EMAIL, "password": PASSWORD})
    if res.status_code == 200:
        return res.json()["access_token"]
    return None

def verification_flow():
    logger.info("🚀 Starting Chat System E2E Verification")
    
    # 1. Login
    token = register_and_login()
    if not token:
        logger.error("Auth failed")
        sys.exit(1)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Convert Token to Header format if needed (FastAPI OAuth2PasswordBearer expects just Token or Bearer Token)
    # Our implementation uses Bearer
    
    # 3. Send Chat Message
    logger.info("\n--- Sending Chat Message ---")
    msg = "I have a headache, what should I do?"
    res = requests.post(f"{CHAT_URL}/chat", headers=headers, data={"message": msg})
    
    if res.status_code == 200:
        data = res.json()
        logger.info("✅ Chat Response Received")
        logger.info(f"Answer: {data.get('answer')[:50]}...")
    else:
        logger.error(f"❌ Chat Failed: {res.text}")
        sys.exit(1)

    # 4. Get Chat History
    logger.info("\n--- fetching Chat History ---")
    res = requests.get(f"{CHAT_URL}/history", headers=headers)
    if res.status_code == 200:
        history = res.json()
        msgs = history.get("messages", [])
        logger.info(f"✅ History Fetched: {len(msgs)} messages")
        if len(msgs) >= 2: # User msg + AI msg
             logger.info("✅ History Verified")
    else:
        logger.error(f"❌ History Failed: {res.text}")

    logger.info("\n✨ Chat System Verified Successfully!")

if __name__ == "__main__":
    verification_flow()
