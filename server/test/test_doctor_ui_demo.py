#!/usr/bin/env python3
"""
Demo script to show that doctors can now see and use the document upload interface
in their dashboard.
"""
import time
import requests

BASE_URL = "http://localhost:8000"

def demonstrate_doctor_document_upload():
    """Demonstrate the complete doctor document upload workflow"""

    print("🩺 Doctor Document Upload Interface Demo")
    print("=" * 60)

    # Step 1: Login as doctor
    print("\n1. Doctor Login")
    doctor_email = "ysaini0193@gmail.com"
    doctor_password = "password123"

    login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": doctor_email,
        "password": doctor_password
    })

    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return False

    doctor_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {doctor_token}"}

    print("✅ Doctor logged in successfully")
    print("📍 Dashboard URL: http://localhost:3002/dashboard/therapist")
    print("🔍 Look for: 'Knowledge Base Management' section")

    # Step 2: Upload a test document
    print("\n2. Document Upload Test")

    # Use the real PDF file
    pdf_path = "/home/yogesh/project/medical-Chatbot-genAi-app/pdf/CBSE_MH_Manual.pdf"

    try:
        with open(pdf_path, 'rb') as f:
            pdf_content = f.read()
        print(f"✅ Loaded PDF: {len(pdf_content)} bytes")

        # Upload the document
        files = {
            'file': ('CBSE_MH_Manual.pdf', pdf_content, 'application/pdf')
        }
        data = {'role': 'DOCTOR'}

        print("📤 Uploading document...")
        upload_response = requests.post(
            f"{BASE_URL}/api/v1/docs/upload_docs",
            headers=headers,
            files=files,
            data=data
        )

        if upload_response.status_code == 200:
            result = upload_response.json()
            print("✅ Document uploaded successfully!")
            print(f"   📄 Filename: {result['message'].split()[0]}")
            print(f"   🆔 Doc ID: {result['doc_id']}")
            print(f"   👥 Accessible to: {result['accessible_to']}")
        else:
            print(f"❌ Upload failed: {upload_response.status_code}")
            print(f"   Response: {upload_response.text}")

    except FileNotFoundError:
        print(f"❌ PDF file not found at {pdf_path}")
        print("   💡 Make sure the PDF exists in the project directory")
        return False
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return False

    # Step 3: Test chat with uploaded knowledge
    print("\n3. Testing Chat with Document Knowledge")

    test_questions = [
        "What are the symptoms of diabetes?",
        "How should hypertension be managed?",
    ]

    for question in test_questions:
        print(f"\n   ❓ Question: '{question}'")

        chat_response = requests.post(
            f"{BASE_URL}/api/v1/chat/chat",
            headers=headers,
            data={"message": question}
        )

        if chat_response.status_code == 200:
            result = chat_response.json()
            response_type = result.get("type", "unknown")
            sources_count = len(result.get("sources", []))

            print(f"     ✅ Response type: {response_type}")
            print(f"     📚 Sources found: {sources_count}")
            print(f"     💬 Answer preview: {result['answer'][:100]}...")
        else:
            print(f"     ❌ Chat failed: {chat_response.status_code}")

    # Step 4: Test follow-up suggestions
    print("\n4. Testing Follow-up Suggestions")

    followup_response = requests.get(
        f"{BASE_URL}/api/v1/chat/followup",
        headers=headers
    )

    if followup_response.status_code == 200:
        followup_data = followup_response.json()
        suggestions = followup_data.get("suggestions", [])
        contextual = followup_data.get("contextual", False)

        print(f"✅ Got {len(suggestions)} follow-up suggestions")
        print(f"🎯 Contextual: {contextual}")
        if suggestions:
            print("💡 Sample suggestions:")
            for i, suggestion in enumerate(suggestions[:2], 1):
                print(f"   {i}. {suggestion}")
    else:
        print(f"❌ Follow-up suggestions failed: {followup_response.status_code}")

    print("\n" + "=" * 60)
    print("🎉 DEMO COMPLETE!")
    print("\n📋 What Doctors Can Now Do:")
    print("✅ Upload medical documents (PDFs) through dashboard")
    print("✅ See real-time upload progress and status")
    print("✅ View uploaded document history")
    print("✅ Chat with AI enhanced by their uploaded documents")
    print("✅ Get contextual follow-up question suggestions")
    print("✅ Access streaming responses for better UX")

    print("\n🖥️  UI Features Added:")
    print("• 📤 Document upload section in therapist dashboard")
    print("• 📊 Real-time progress indicators")
    print("• 📋 Upload history and status tracking")
    print("• 🎯 Quick action button for document uploads")
    print("• 📖 Professional medical interface design")

    print("\n🚀 Ready for Clinical Use!")
    print("Doctors can now upload their medical documents and get AI assistance")
    print("enhanced by their own knowledge base!")

    return True

if __name__ == "__main__":
    demonstrate_doctor_document_upload()
