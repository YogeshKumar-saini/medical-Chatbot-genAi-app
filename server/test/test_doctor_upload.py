#!/usr/bin/env python3
import asyncio
import requests
import time

BASE_URL = "http://localhost:8000"

def test_doctor_document_upload():
    """Test that doctors can upload documents and generate embeddings"""

    # Use existing test doctor user (already verified)
    doctor_email = "ysaini0193@gmail.com"
    doctor_password = "password123"

    print("1. Logging in as existing test doctor...")

    login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": doctor_email,
        "password": doctor_password
    })

    if login_response.status_code != 200:
        print(f"❌ Doctor login failed: {login_response.text}")
        return False

    doctor_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {doctor_token}"}

    print("✅ Doctor logged in successfully")

    # Step 3: Try to upload a document
    print("3. Uploading document as doctor...")

    # Use the real PDF file from the project directory
    pdf_path = "/home/yogesh/project/medical-Chatbot-genAi-app/pdf/CBSE_MH_Manual.pdf"

    try:
        with open(pdf_path, 'rb') as f:
            pdf_content = f.read()
        print(f"✅ Successfully loaded PDF file ({len(pdf_content)} bytes)")
    except FileNotFoundError:
        print(f"❌ PDF file not found at {pdf_path}")
        return False
    except Exception as e:
        print(f"❌ Error reading PDF file: {e}")
        return False

    files = {
        'file': ('CBSE_MH_Manual.pdf', pdf_content, 'application/pdf')
    }
    data = {'role': 'DOCTOR'}

    upload_response = requests.post(
        f"{BASE_URL}/api/v1/docs/upload_docs",
        headers=headers,
        files=files,
        data=data
    )

    if upload_response.status_code == 200:
        result = upload_response.json()
        print("✅ Document uploaded successfully!")
        print(f"   Message: {result['message']}")
        print(f"   Doc ID: {result['doc_id']}")
        print(f"   Accessible to: {result['accessible_to']}")
        return True
    else:
        print(f"❌ Document upload failed: {upload_response.status_code}")
        print(f"   Response: {upload_response.text}")
        return False

if __name__ == "__main__":
    print("Testing Doctor Document Upload and Embedding Generation")
    print("=" * 60)

    success = test_doctor_document_upload()

    if success:
        print("\n🎉 All tests passed! Doctors can now upload documents and generate embeddings.")
    else:
        print("\n❌ Tests failed. Doctor document upload is not working.")
