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
GROUPS_URL = f"{BASE_URL}/groups"

timestamp = int(time.time())
ADMIN_EMAIL = f"g_admin_{timestamp}@example.com"
USER_EMAIL = f"g_user_{timestamp}@example.com"
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

def register_and_login(email, role, name):
    logger.info(f"\n--- Registering {role} ({email}) ---")
    requests.post(f"{AUTH_URL}/signup", json={
        "email": email, "password": PASSWORD, "role": role, "name": name
    })
    otp = get_otp_from_log(email)
    if otp:
        requests.post(f"{AUTH_URL}/verify-email", json={"email": email, "otp": otp})
    
    res = requests.post(f"{AUTH_URL}/login", json={"email": email, "password": PASSWORD})
    if res.status_code == 200:
        logger.info(f"Login success for {role}")
        return res.json()["access_token"], res.json()["user"]["id"]
    else:
        logger.error(f"Login failed: {res.text}")
        return None, None

def verification_flow():
    logger.info("🚀 Starting Groups Verification")
    
    admin_token, admin_id = register_and_login(ADMIN_EMAIL, "ORG_ADMIN", "Group Admin")
    user_token, user_id = register_and_login(USER_EMAIL, "PATIENT", "Group User")
    
    if not admin_token or not user_token:
        sys.exit(1)
        
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # 1. Create Group
    logger.info("\n--- Creating Group ---")
    res = requests.post(f"{GROUPS_URL}/", headers=admin_headers, json={
        "name": "Test Group", "description": "A test group"
    })
    if res.status_code == 201:
        group = res.json()
        group_id = group["id"]
        logger.info(f"✅ Group Created: {group_id}")
    else:
        logger.error(f"❌ Create Group Failed: {res.text}")
        sys.exit(1)

    # 2. Add Member
    logger.info("\n--- Adding Member ---")
    res = requests.post(f"{GROUPS_URL}/{group_id}/members/{user_id}", headers=admin_headers)
    if res.status_code == 200:
        logger.info("✅ Member Added")
        
        # 2b. Check Members
        logger.info("\n--- Listing Members ---")
        res = requests.get(f"{GROUPS_URL}/{group_id}/members", headers=admin_headers)
        if res.status_code == 200:
            members_data = res.json()["members"]
            member_ids = [m["user_id"] for m in members_data]
            logger.info(f"Current Members: {member_ids}")
            if user_id in member_ids:
                logger.info("✅ User is correctly in member list")
            else:
                 logger.error(f"❌ User {user_id} NOT found in member list")
        else:
            logger.error(f"❌ List Members Failed: {res.text}")
    else:
        logger.error(f"❌ Add Member Failed: {res.text}")

    # 3. Send Message
    logger.info("\n--- Sending Message ---")
    res = requests.post(f"{GROUPS_URL}/{group_id}/messages", headers=user_headers, json={
        "content": "Hello Group!"
    })
    if res.status_code in [200, 201]:
        msg_id = res.json()["id"]
        logger.info(f"✅ Message Sent: {msg_id}")
    else:
        logger.error(f"❌ Send Message Failed: {res.text}")
        
    # 4. List Messages
    logger.info("\n--- Listing Messages ---")
    res = requests.get(f"{GROUPS_URL}/{group_id}/messages", headers=admin_headers)
    if res.status_code == 200:
        data = res.json()
        msgs = data.get("messages", [])
        logger.info(f"Messages found: {len(msgs)}")
        if len(msgs) > 0:
             logger.info(f"First message: {msgs[0]}")
             if msgs[0]["content"] == "Hello Group!":
                logger.info("✅ Messages Listed and Content Verified")
             else:
                logger.error(f"❌ Content mismatch: {msgs[0]['content']}")
        else:
            logger.error(f"❌ Messages List Empty: {data}")
    else:
        logger.error(f"❌ List Messages Failed: {res.text}")

    # 5. React to Message
    logger.info("\n--- Reacting to Message ---")
    res = requests.post(f"{GROUPS_URL}/{group_id}/messages/{msg_id}/react", headers=admin_headers, params={
        "emoji": "👍"
    })
    if res.status_code == 200:
        logger.info("✅ Reaction Added")
    else:
        logger.error(f"❌ React Failed: {res.text}")

    logger.info("\n✨ Groups Verified Successfully!")

if __name__ == "__main__":
    verification_flow()
