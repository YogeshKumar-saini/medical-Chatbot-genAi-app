import os
from fastapi import FastAPI
import uvicorn
from auth.routes import router as auth_router
from docs.routes import router as docs_router
from chat.routes import router as chat_router


app=FastAPI()

app.include_router(auth_router)
app.include_router(docs_router)
app.include_router(chat_router)


@app.get("/health")
def health_check():
    return {"message":"OK"}


def main():
    port = int(os.environ.get("PORT", 8000))  # Use Render's PORT or default to 8000 locally
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    main()