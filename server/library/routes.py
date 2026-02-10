from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
import asyncio
from datetime import datetime
from bson import ObjectId

from auth.routes import authenticate
from config.db import db, users_collection
from .models import EducationalContent, LibraryRecommendation, ContentType

router = APIRouter()

# Collections
content_collection = db["library_content"] if db is not None else None
recommendations_collection = db["library_rec"] if db is not None else None

@router.get("/content", response_model=List[dict])
async def get_library_content(
    tag: Optional[str] = None, 
    type: Optional[ContentType] = None,
    user: dict = Depends(authenticate)
):
    query = {}
    if tag:
        query["condition_tags"] = tag # partial match or exact?
    if type:
        query["type"] = type.value
        
    cursor = content_collection.find(query).limit(50)
    docs = await asyncio.to_thread(lambda: list(cursor))
    results = []
    for d in docs:
        d["id"] = str(d.pop("_id"))
        results.append(d)
    return results

@router.post("/content", status_code=status.HTTP_201_CREATED)
async def add_content(content: EducationalContent, user: dict = Depends(authenticate)):
    if user["role"] not in ["SUPER_ADMIN", "GEN_ADMIN", "ORG_ADMIN"]: # Only admins add content? Or doctors too?
        raise HTTPException(403, "Admins only")
        
    doc = content.dict(exclude={"pk"})
    doc["created_at"] = datetime.utcnow()
    
    result = await asyncio.to_thread(content_collection.insert_one, doc)
    return {"id": str(result.inserted_id), "message": "Content added"}

@router.post("/recommend")
async def recommend_content(rec: LibraryRecommendation, user: dict = Depends(authenticate)):
    if user["role"] not in ["THERAPIST", "DOCTOR"]:
         raise HTTPException(403, "Doctors only")
    
    doc = rec.dict()
    doc["created_at"] = datetime.utcnow()
    # Verify patient exists (omitted)
    
    await asyncio.to_thread(recommendations_collection.insert_one, doc)
    return {"status": "Recommended"}

@router.get("/my-recommendations")
async def get_my_valid_recommendations(user: dict = Depends(authenticate)):
    # Get recommendations for the logged-in patient
    if user["role"] != "PATIENT":
        raise HTTPException(403, "Patients only")
        
    user_doc = await asyncio.to_thread(users_collection.find_one, {"email": user["email"]})
    patient_id = str(user_doc["_id"])
    
    cursor = recommendations_collection.find({"patient_id": patient_id}).sort("created_at", -1)
    recs = await asyncio.to_thread(lambda: list(cursor))
    
    # Enrich with content details
    results = []
    for r in recs:
        content = await asyncio.to_thread(content_collection.find_one, {"_id": ObjectId(r["content_id"])})
        if content:
            results.append({
                "recommendation_id": str(r["_id"]),
                "content": {"id": str(content["_id"]), **content},
                "notes": r.get("notes"),
                "date": r.get("created_at")
            })
            
    return results

@router.get("/quiz/{content_id}")
async def get_quiz(content_id: str, user: dict = Depends(authenticate)):
    content = await asyncio.to_thread(content_collection.find_one, {"_id": ObjectId(content_id)})
    if not content:
        raise HTTPException(404, "Content not found")
        
    if not content.get("quiz"):
        return {"has_quiz": False}
        
    # Hide correct answers? Yes.
    quiz_public = []
    for q in content["quiz"]:
        # "is_correct" stripped ideally
        options = [{"text": o["text"]} for o in q["options"]] 
        quiz_public.append({
            "question": q["question_text"],
            "options": options
        })
        
    return {"has_quiz": True, "questions": quiz_public}

@router.post("/quiz/{content_id}/submit")
async def submit_quiz(content_id: str, answers: List[int], user: dict = Depends(authenticate)):
    # Simple scoring
    content = await asyncio.to_thread(content_collection.find_one, {"_id": ObjectId(content_id)})
    if not content or not content.get("quiz"):
        raise HTTPException(404, "Quiz not found")
        
    score = 0
    total = len(content["quiz"])
    
    # Assuming answers is list of indices of selected options for each question
    if len(answers) != total:
        raise HTTPException(400, "Incomplete answers")
        
    for i, q in enumerate(content["quiz"]):
        selected_idx = answers[i]
        if 0 <= selected_idx < len(q["options"]):
            if q["options"][selected_idx]["is_correct"]:
                score += 1
                
    percentage = (score / total) * 100
    passed = percentage >= 70
    
    return {
        "score": score,
        "total": total,
        "percentage": percentage,
        "passed": passed,
        "message": "Great job!" if passed else "Try again to ensure you understand your plan."
    }
