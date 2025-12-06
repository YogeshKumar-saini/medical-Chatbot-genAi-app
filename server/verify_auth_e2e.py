import requests
import time
import sys

BASE_URL = "http://localhost:8080/api/v1/auth"
EMAIL = "test_patient@example.com"
PASSWORD = "Password123!"

def test_auth_flow():
    print("🚀 Starting E2E Auth Flow Verification")
    
    # 1. Signup
    print(f"\n1️⃣ Registering User ({EMAIL})...")
    signup_payload = {
        "email": EMAIL,
        "password": PASSWORD,
        "role": "PATIENT",
        "name": "Test Patient",
        "phone": "1234567890"
    }
    try:
        res = requests.post(f"{BASE_URL}/signup", json=signup_payload)
        if res.status_code == 201:
            print("✅ Signup successful")
        elif res.status_code == 400 and "already exists" in res.text:
             print("⚠️ User already exists, proceeding...")
        else:
            print(f"❌ Signup Failed: {res.status_code} {res.text}")
            return
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    # 2. Get OTP (Hack: we need to peek into DB or logs, but here we can't easily. 
    # However, since I am the agent, I can read the logs file or use a special testing endpoint?
    # Or just Assume I can't verify fully without reading DB.
    # But wait! I implemented 'send_otp_email' which PRINTS to stdout.
    # I can capture the stdout of the server process? 
    # Or I can connect to MongoDB directly in this script to fetch OTP!)
    
    print(f"\n2️⃣ Fetching OTP from DB...")
    # We need pymongo to fetch OTP
    try:
        from pymongo import MongoClient
        import os
        from dotenv import load_dotenv
        load_dotenv()
        
        # Assume env vars are loaded or use defaults from db.py inspection if needed
        # But this script runs in same env?
        # Let's try to connect using same URI logic if possible, or just look at logs?
        # Connecting to DB is better.
        client = MongoClient(os.getenv("MONGO_URI"))
        db = client[os.getenv("DB_NAME")]
        otp_doc = db.otps.find_one({"identifier": EMAIL, "type": "EMAIL_VERIFICATION"}, sort=[("created_at", -1)])
        
        if not otp_doc:
            print("❌ OTP not found in DB")
            return
            
        print("✅ OTP Found in DB")
        # Problem: DB stores HASH of OTP. I don't know the plain OTP code!
        # Ah! I hashed it in routes.py using SHA256.
        # So I CANNOT reverse it.
        # This means I cannot verify the account unless I know the OTP generated.
        # But 'utils.py' generates it randomly.
        
        # SOLUTION: For testing, I can MANUALLY update the user to be verified in DB?
        # OR, I can temporarily patch utils.py to return a fixed OTP?
        # OR, I can read the server STDOUT logs?
        
        # Since I can read 'server.log' or 'medical_ai.log' if logged there?
        # Utils uses 'logging.info', creating 'medical_ai.log' (from main.py config).
        # Let's read 'medical_ai.log' to find the OTP!
        pass
        
    except Exception as e:
        print(f"❌ DB Check Failed: {e}")

    # Read Log for OTP
    print(f"\n2a. Reading Log for OTP...")
    otp_code = None
    try:
        with open("medical_ai.log", "r") as f:
            lines = f.readlines()
            for line in reversed(lines):
                 if f"OTP for {EMAIL}" in line: # Utils print format: [MOCK EMAIL] OTP for ...
                      # "2025-.. INFO ... Code: 123456" from logger?
                      # utils.py: logger.info(f"Code: {otp_code}")
                      pass
                 if "Code: " in line:
                      # This might match other OTPs, but let's assume it's the last one
                      parts = line.split("Code: ")
                      if len(parts) > 1:
                           otp_code = parts[1].strip()
                           break
    except FileNotFoundError:
        print("❌ Log file not found")
        
    if not otp_code:
        print("❌ Could not find OTP in logs")
        # Fallback: Can't verify
        return

    print(f"✅ OTP extracted: {otp_code}")

    # 3. Verify
    print(f"\n3️⃣ Verifying Email...")
    verify_payload = {
        "email": EMAIL,
        "otp": otp_code
    }
    res = requests.post(f"{BASE_URL}/verify-email", json=verify_payload)
    if res.status_code == 200:
        print("✅ Verification successful")
    else:
        print(f"❌ Verification Failed: {res.status_code} {res.text}")
        return

    # 4. Login
    print(f"\n4️⃣ Testing Login...")
    login_payload = {
        "email": EMAIL,
        "password": PASSWORD
    }
    res = requests.post(f"{BASE_URL}/login", json=login_payload)
    if res.status_code == 200:
        token = res.json().get("access_token")
        print(f"✅ Login successful. Token: {token[:10]}...")
    else:
        print(f"❌ Login Failed: {res.status_code} {res.text}")

if __name__ == "__main__":
    test_auth_flow()
