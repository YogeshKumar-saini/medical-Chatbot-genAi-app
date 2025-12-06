from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from auth.routes import authenticate
from docs.vectorstore import load_vectorstore
import uuid

router = APIRouter()

@router.post("/upload_docs")
async def upload_docs(
    user=Depends(authenticate),
    file: UploadFile = File(...),
    role: str = Form(...)
):
    allowed_roles = ["SUPER_ADMIN", "GEN_ADMIN", "THERAPIST"]
    if user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized to upload documents")

    doc_id = str(uuid.uuid4())
    await load_vectorstore([file], role, doc_id)  # ✅ AWAIT here
    return {
        "message": f"{file.filename} uploaded successfully",
        "doc_id": doc_id,
        "accessible_to": role
    }
