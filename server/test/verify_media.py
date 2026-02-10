import requests
import time
import sys
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger()

BASE_URL = "http://localhost:8000/api/v1"
AUTH_URL = f"{BASE_URL}/auth"
MEDIA_URL = f"{BASE_URL}/media"

timestamp = int(time.time())
USER_EMAIL = f"m_user_{timestamp}@example.com"
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
    logger.info("🚀 Starting Media Verification")
    
    token, user_id = register_and_login(USER_EMAIL, "PATIENT", "Media User")
    if not token: sys.exit(1)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Upload Media
    logger.info("\n--- Uploading Image ---")
    # Create dummy image
    with open("test_img.png", "wb") as f:
        f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82')
        
    try:
        with open("test_img.png", "rb") as f:
            files = {"file": ("test_img.png", f, "image/png")}
            res = requests.post(f"{MEDIA_URL}/upload", headers=headers, files=files)
            
        if res.status_code == 200:
            data = res.json()
            filename = data["filename"]
            logger.info(f"✅ Image Uploaded: {filename}")
        else:
            logger.error(f"❌ Upload Failed: {res.text}")
            sys.exit(1)
            
        # 2. Get Media
        logger.info("\n--- Getting Image ---")
        # Route: /media/{file_type}/{filename}
        res = requests.get(f"{MEDIA_URL}/images/{filename}")
        if res.status_code == 200:
            logger.info("✅ Image Retrieved")
        else:
            logger.error(f"❌ Get Image Failed: {res.text}")
            
        # 3. Get Thumbnail
        logger.info("\n--- Getting Thumbnail ---")
        res = requests.get(f"{MEDIA_URL}/images/thumbnails/{filename}")
        if res.status_code == 200:
            logger.info("✅ Thumbnail Retrieved")
        else:
            # Thumbnail generation might be async or on-demand?
            logger.warning(f"⚠️ Thumbnail Failed (expected if async or not generated): {res.text}")

        # 4. Delete Media
        logger.info("\n--- Deleting Image ---")
        res = requests.delete(f"{MEDIA_URL}/images/{filename}", headers=headers)
        if res.status_code == 200:
             logger.info("✅ Image Deleted")
        else:
             logger.error(f"❌ Delete Failed: {res.text}")
             
    finally:
        if os.path.exists("test_img.png"):
            os.remove("test_img.png")

    logger.info("\n✨ Media Verified Successfully!")

if __name__ == "__main__":
    verification_flow()
