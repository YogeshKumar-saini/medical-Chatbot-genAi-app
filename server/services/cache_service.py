import json
import logging
from typing import Optional, Any
from config.redis_client import get_redis

logger = logging.getLogger(__name__)

class CacheService:
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        try:
            redis = await get_redis()
            val = await redis.get(key)
            return json.loads(val) if val else None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    @staticmethod
    async def set(key: str, value: Any, expire: int = 3600) -> bool:
        try:
            redis = await get_redis()
            await redis.set(key, json.dumps(value), ex=expire)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False

    @staticmethod
    async def delete(key: str) -> bool:
        try:
            redis = await get_redis()
            await redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    @staticmethod
    async def exists(key: str) -> bool:
        try:
            redis = await get_redis()
            return await redis.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False
            
    @staticmethod
    async def incr(key: str) -> int:
        try:
            redis = await get_redis()
            return await redis.incr(key)
        except Exception as e:
            logger.error(f"Cache incr error: {e}")
            return 0
            
    @staticmethod
    async def expire(key: str, seconds: int) -> bool:
        try:
            redis = await get_redis()
            return await redis.expire(key, seconds)
        except Exception as e:
            logger.error(f"Cache expire error: {e}")
            return False
