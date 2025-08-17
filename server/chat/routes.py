from fastapi import APIRouter,Depends, FastAPI,Form
from auth.routes import authenticate
from chat.chat_query import answer_query


router=APIRouter()

#  response = await answer_query(
#         query=request.message, 
#         user_role=user_role, 
#         user_id=user_id
#     )
@router.post("/chat")
async def chat(user=Depends(authenticate),message:str=Form(...)):
    response = await answer_query(
        query=message, 
        user_role=user["role"], 
        user_id=user["id"]
    )