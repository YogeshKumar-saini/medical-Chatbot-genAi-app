import os
import asyncio
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('medical_ai.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Import routers
try:
    from auth.routes import router as auth_router
    from docs.routes import router as docs_router
    from chat.routes import router as chat_router
except ImportError:
    # Fallback for deployment environments
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from auth.routes import router as auth_router
    from docs.routes import router as docs_router
    from chat.routes import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting Medical AI Assistant Server")
    try:
    # Database connection test removed (test_connection does not exist)
        try:
            from chat.chat_query import health_check, embed_model
        except ImportError:
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            from chat.chat_query import health_check, embed_model
        health_status = await health_check()
        if health_status.get("status") == "healthy":
            logger.info("✅ Vector store and AI services ready")
        else:
            logger.warning("⚠️ Some AI services may not be fully operational")
        # Optional model warmup
        logger.info("🔥 Warming up AI models...")
        await embed_model.embed_query("test query for warmup")
        logger.info("✅ Models warmed up successfully")
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
    yield
    # Shutdown/Cleanup
    logger.info("🛑 Shutting down Medical AI Assistant Server")
    # Add cleanup logic here

app = FastAPI(
    title="Medical AI Assistant API",
    description="Advanced AI-Powered Medical Information System",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

try:
    instrumentator = Instrumentator()
    instrumentator.instrument(app).expose(app)
    logger.info("📊 Metrics collection enabled")
except ImportError:
    logger.info("📊 Prometheus metrics not available (install prometheus-fastapi-instrumentator)")

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        if process_time > 5.0:
            logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request error: {request.method} {request.url.path} failed after {process_time:.2f}s - {str(e)}")
        raise

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {request.method} {request.url.path} - {str(exc)}")
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "timestamp": time.time()
        }
    )

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(docs_router, prefix="/api/v1/docs")
app.include_router(chat_router, prefix="/api/v1/chat")

@app.get("/health")
async def health_check_endpoint():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "2.0.0"
    }

@app.get("/health/detailed")
async def detailed_health_check():
    try:
        try:
            from config.db import test_connection
        except ImportError:
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            from config.db import test_connection
        db_status = "healthy" if await test_connection() else "unhealthy"
        try:
            from chat.chat_query import health_check
        except ImportError:
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            from chat.chat_query import health_check
        ai_status = await health_check()
        return {
            "status": "healthy" if db_status == "healthy" and ai_status.get("status") == "healthy" else "degraded",
            "services": {
                "database": db_status,
                "ai_services": ai_status
            },
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }

@app.get("/")
async def root():
    return {
        "message": "🏥 Medical AI Assistant API",
        "version": "2.0.0",
        "description": "Advanced AI-Powered Medical Information System",
        "docs": "/docs",
        "health": "/health",
        "timestamp": time.time()
    }

@app.get("/api/v1/info")
async def api_info():
    return {
        "api_version": "v1",
        "endpoints": {
            "authentication": "/api/v1/auth/",
            "chat": "/api/v1/chat/",
            "documents": "/api/v1/",
            "health": "/health"
        },
        "features": [
            "Role-based authentication",
            "Document upload and processing",
            "AI-powered medical Q&A",
            "Rate limiting",
            "Session management",
            "Real-time streaming responses"
        ]
    }

def main():
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8080))
    workers = int(os.getenv("WORKERS", 1))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    config = {
        "host": host,
        "port": port,
        "reload": reload,
        "access_log": True,
        "use_colors": True,
        "loop": "uvloop" if not reload else "auto",
        "http": "httptools" if not reload else "auto",
        "ws_ping_interval": 20,
        "ws_ping_timeout": 10,
        "timeout_keep_alive": 5,
    }
    if not reload and workers > 1:
        config["workers"] = workers
        logger.info(f"🚀 Starting server with {workers} workers")
    logger.info(f"🚀 Starting server at http://{host}:{port} (reload={reload})")
    import uvicorn
    uvicorn.run("main:app", **config)

if __name__ == "__main__":
    main()
