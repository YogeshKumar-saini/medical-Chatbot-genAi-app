from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://student:student123@cluster0.w2m1t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
DB_NAME = os.getenv("DB_NAME", "medical-chatbot")

def force_verify():
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        users = db.users
        
        email = "superadmin@example.com"
        print(f"Verifying {email}...")
        result = users.update_one(
            {"email": email},
            {"$set": {"is_verified": True}}
        )
        
        if result.matched_count:
            print("User verified.")
        else:
            print("User not found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    force_verify()
