from fastapi import FastAPI
import uvicorn
import os

from auth.routes import router as auth_router
from docs.routes import router as docs_router

app = FastAPI(
    title="My Medical Chatbot",
    description="API for authentication and more",
    version="1.0.0",
)

app.include_router(auth_router)
app.include_router(docs_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "OK",
        "service": "FastAPI Server",
        "version": "1.0.0"
    }




def main():
    port = int(os.environ.get("PORT", 8000))  # Use Render's PORT or default to 8000 locally
    uvicorn.run(app, host="0.0.0.0", port=port)
