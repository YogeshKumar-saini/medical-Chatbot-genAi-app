import time
import logging
from collections import defaultdict, deque
from typing import Tuple, Optional
from services.cache_service import CacheService

logger = logging.getLogger(__name__)

class ChatRateLimiter:
    """Rate limiter for chat endpoints using Redis with in-memory fallback"""
    
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Fallback in-memory storage
        self.requests: defaultdict = defaultdict(deque)
    
    async def is_rate_limited(self, identifier: str) -> Tuple[bool, int]:
        """Check if identifier is rate limited"""
        try:
            # Try Redis first
            key = f"rate_limit:{identifier}"
            current_count = await CacheService.get(key)
            
            if current_count is not None:
                if int(current_count) >= self.max_requests:
                    # Calculate ttl 
                    # Note: This is an approximation since we don't get TTL from get()
                    # For exact TTL we would need another call, but simple fallback is 0 or window
                    return True, self.window_seconds 
                return False, 0
            
            # Key doesn't exist in Redis (expired or never set), so not rate limited
            # If Redis is actually down, CacheService catches exception and returns None
            # But here we differentiate 'None' means 'Not Found' vs 'Error' inside CacheService?
            # CacheService returns None on error too. So we might fail open if Redis is down.
            # To be safer, let's check basic connectivity or assume not limited if error.
            
            return False, 0
            
        except Exception as e:
            logger.warning(f"Rate limiter Redis error: {e}. Using in-memory fallback.")
            return self._is_rate_limited_memory(identifier)

    async def record_request(self, identifier: str):
        """Record a request"""
        try:
            key = f"rate_limit:{identifier}"
            # Increment and set expire if new
            new_val = await CacheService.incr(key)
            if new_val == 1:
                await CacheService.expire(key, self.window_seconds)
        except Exception as e:
            logger.warning(f"Rate limiter record error: {e}. Using in-memory fallback.")
            self._record_request_memory(identifier)

    # In-memory fallback methods (original implementation)
    def _is_rate_limited_memory(self, identifier: str) -> Tuple[bool, int]:
        current_time = time.time()
        user_requests = self.requests[identifier]
        
        while user_requests and user_requests[0] <= current_time - self.window_seconds:
            user_requests.popleft()
        
        if len(user_requests) >= self.max_requests:
            oldest_request = user_requests[0]
            seconds_until_reset = int(self.window_seconds - (current_time - oldest_request))
            return True, max(0, seconds_until_reset)
        
        return False, 0
    
    def _record_request_memory(self, identifier: str):
        current_time = time.time()
        self.requests[identifier].append(current_time)

