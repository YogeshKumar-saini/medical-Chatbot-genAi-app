import time
from collections import defaultdict, deque
from typing import Tuple

class ChatRateLimiter:
    """Rate limiter specifically for chat endpoints"""
    
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: defaultdict = defaultdict(deque)
    
    def is_rate_limited(self, identifier: str) -> Tuple[bool, int]:
        """Check if identifier is rate limited"""
        current_time = time.time()
        user_requests = self.requests[identifier]
        
        # Remove old requests outside the window
        while user_requests and user_requests[0] <= current_time - self.window_seconds:
            user_requests.popleft()
        
        if len(user_requests) >= self.max_requests:
            oldest_request = user_requests[0]
            seconds_until_reset = int(self.window_seconds - (current_time - oldest_request))
            return True, max(0, seconds_until_reset)
        
        return False, 0
    
    def record_request(self, identifier: str):
        """Record a request"""
        current_time = time.time()
        self.requests[identifier].append(current_time)
