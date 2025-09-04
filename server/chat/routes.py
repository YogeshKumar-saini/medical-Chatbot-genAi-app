from fastapi import APIRouter,Depends,Form
from auth.routes import authenticate
from chat.chat_query import answer_query, get_suggested_queries


router=APIRouter(prefix="/chat")

@router.post("/chat")
async def chat(user=Depends(authenticate),message:str=Form(...)):
    return await answer_query(message,user["role"])

# New endpoint to get 5 suggested queries
@router.get("/suggestions")
async def chat_suggestions():
    return {"suggested_queries": get_suggested_queries()}