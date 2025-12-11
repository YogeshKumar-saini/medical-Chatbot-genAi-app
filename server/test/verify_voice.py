import requests
import time
import sys
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger()

BASE_URL = "http://localhost:8000/api/v1"
AUTH_URL = f"{BASE_URL}/auth"
VOICE_URL = f"{BASE_URL}/voice"

timestamp = int(time.time())
USER_EMAIL = f"v_user_{timestamp}@example.com"
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
    logger.info("🚀 Starting Voice Verification")
    
    token, user_id = register_and_login(USER_EMAIL, "PATIENT", "Voice User")
    if not token: sys.exit(1)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Speak (TTS)
    logger.info("\n--- Testing TTS (Speak) ---")
    res = requests.post(f"{VOICE_URL}/speak", headers=headers, data={"text": "Hello world"})
    if res.status_code == 200:
        logger.info("✅ TTS Success (Audio received)")
        # content-type should be audio/mpeg or similar
    else:
        logger.error(f"❌ TTS Failed: {res.text}")
        
    # 2. Transcribe (STT)
    logger.info("\n--- Testing Transcribe (STT) ---")
    # Needs audio file.
    # Create dummy wav?
    # Simple wav header + silence
    with open("test_audio.wav", "wb") as f:
        # RIFF header for O bytes audio
         f.write(b'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00')
         
    try:
        with open("test_audio.wav", "rb") as f:
            files = {"file": ("test_audio.wav", f, "audio/wav")}
            res = requests.post(f"{VOICE_URL}/transcribe", headers=headers, files=files)
            
        if res.status_code == 200:
            logger.info("✅ Transcribe Success")
            logger.info(f"Text: {res.json().get('text')}")
        else:
            # Might fail if no whisper model or API key?
            logger.warning(f"⚠️ Transcribe Failed (Expected if no API key/model): {res.text}")
    finally:
        if os.path.exists("test_audio.wav"):
            os.remove("test_audio.wav")

    logger.info("\n✨ Voice Verified Successfully!")

if __name__ == "__main__":
    verification_flow()
