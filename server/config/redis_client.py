import os
from dotenv import load_dotenv
import redis.asyncio as redis
from pathlib import Path
import logging

# Load env vars
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class RedisClient:
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = redis.from_url(
                REDIS_URL, 
                encoding="utf-8", 
                decode_responses=True
            )
        return cls._instance

    @classmethod
    async def close(cls):
        if cls._instance:
            await cls._instance.close()
            cls._instance = None
            logger.info("Redis connection closed")

async def get_redis():
    return RedisClient.get_instance()
