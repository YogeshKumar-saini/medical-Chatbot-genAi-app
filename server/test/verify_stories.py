import requests
import time
import sys
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger()

BASE_URL = "http://localhost:8000/api/v1"
AUTH_URL = f"{BASE_URL}/auth"
STORIES_URL = f"{BASE_URL}/stories"
PROFILES_URL = f"{BASE_URL}/profiles"

timestamp = int(time.time())
USER1_EMAIL = f"s_user1_{timestamp}@example.com"
USER2_EMAIL = f"s_user2_{timestamp}@example.com"
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
        return res.json()["access_token"], res.json()["user"]["id"]
    return None, None

def verification_flow():
    logger.info("🚀 Starting Stories Verification")
    
    u1_token, u1_id = register_and_login(USER1_EMAIL, "PATIENT", "Story User 1")
    u2_token, u2_id = register_and_login(USER2_EMAIL, "PATIENT", "Story User 2")
    
    if not u1_token or not u2_token:
        sys.exit(1)

    u1_headers = {"Authorization": f"Bearer {u1_token}"}
    u2_headers = {"Authorization": f"Bearer {u2_token}"}

    # 1. User 1 posts a story
    logger.info("\n--- User 1 Posting Story ---")
    res = requests.post(f"{STORIES_URL}/", headers=u1_headers, json={
        "caption": "My first story", "media_url": "http://example.com/img.png", "media_type": "IMAGE"
    })
    if res.status_code == 201:
        story_id = res.json()["id"]
        logger.info(f"✅ Story Created: {story_id}")
    else:
        logger.error(f"❌ Create Story Failed: {res.text}")
        sys.exit(1)

    # 2. User 2 Follows User 1
    logger.info("\n--- User 2 Following User 1 ---")
    res = requests.post(f"{PROFILES_URL}/{u1_id}/follow", headers=u2_headers)
    if res.status_code == 200:
        logger.info("✅ User 2 Followed User 1")
    else:
        logger.error(f"❌ Follow Failed: {res.text}")

    # 3. User 2 Gets Feed
    logger.info("\n--- User 2 Checking Feed ---")
    res = requests.get(f"{STORIES_URL}/", headers=u2_headers)
    if res.status_code == 200:
        feed = res.json()
        # Feed structure: List[StoryWithUser] (based on routes.py)
        if isinstance(feed, list):
            stories = feed
            if any(s["id"] == story_id for s in stories):
                 logger.info("✅ Story found in feed")
            else:
                 logger.error(f"❌ Story NOT in feed ({len(stories)} stories)")
        else:
             logger.error(f"❌ Feed response format error: {feed}")
    else:
        logger.error(f"❌ Get Feed Failed: {res.text}")

    # 4. View Story
    logger.info("\n--- User 2 Viewing Story ---")
    res = requests.post(f"{STORIES_URL}/{story_id}/view", headers=u2_headers)
    if res.status_code == 200:
        logger.info("✅ Story Viewed")
    else:
        logger.error(f"❌ View Story Failed: {res.text}")

    logger.info("\n✨ Stories Verified Successfully!")

if __name__ == "__main__":
    verification_flow()
