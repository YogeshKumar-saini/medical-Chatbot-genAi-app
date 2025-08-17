import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
appName = os.getenv("appName")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_collection = db["users"]  

print(f"Connected to MongoDB database: {DB_NAME} with appName: {appName}")