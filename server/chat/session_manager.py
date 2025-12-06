import time
import uuid
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import threading
import logging

logger = logging.getLogger(__name__)

class ChatSessionManager:
    """
    Thread-safe session manager for chat conversations
    """
    
    def __init__(self, session_timeout: int = 3600):  # 1 hour timeout
        self.sessions: Dict[str, Dict] = {}
        self.session_timeout = session_timeout
        self.lock = threading.RLock()
        self.cleanup_interval = 300  # 5 minutes
        self.last_cleanup = time.time()
    
    def _cleanup_expired_sessions(self):
        """Remove expired sessions"""
        if time.time() - self.last_cleanup < self.cleanup_interval:
            return
        
        current_time = time.time()
        expired_users = []
        
        with self.lock:
            for user_id, session in self.sessions.items():
                if current_time - session["last_activity"] > self.session_timeout:
                    expired_users.append(user_id)
            
            for user_id in expired_users:
                del self.sessions[user_id]
            
            self.last_cleanup = current_time
        
        if expired_users:
            logger.info(f"Cleaned up {len(expired_users)} expired chat sessions")
    
    def get_or_create_session(self, user_id: str, user_role: str) -> Dict:
        """Get existing session or create new one"""
        self._cleanup_expired_sessions()
        
        with self.lock:
            if user_id not in self.sessions:
                self.sessions[user_id] = {
                    "session_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "user_role": user_role,
                    "messages": [],
                    "created_at": datetime.utcnow().isoformat(),
                    "last_activity": time.time()
                }
            else:
                self.sessions[user_id]["last_activity"] = time.time()
            
            return self.sessions[user_id].copy()
    
    def get_session(self, user_id: str) -> Optional[Dict]:
        """Get existing session"""
        self._cleanup_expired_sessions()
        
        with self.lock:
            session = self.sessions.get(user_id)
            if session:
                session["last_activity"] = time.time()
                return session.copy()
            return None
    
    def add_message(self, user_id: str, role: str, content: str, sources: Optional[List] = None):
        """Add message to session"""
        with self.lock:
            if user_id in self.sessions:
                message = {
                    "role": role,
                    "content": content,
                    "timestamp": datetime.utcnow().isoformat(),
                    "sources": sources or []
                }
                self.sessions[user_id]["messages"].append(message)
                self.sessions[user_id]["last_activity"] = time.time()
                
                # Limit message history to prevent memory issues
                if len(self.sessions[user_id]["messages"]) > 100:
                    self.sessions[user_id]["messages"] = self.sessions[user_id]["messages"][-50:]
    
    def clear_session(self, user_id: str):
        """Clear user session"""
        with self.lock:
            if user_id in self.sessions:
                del self.sessions[user_id]
    
    def get_global_stats(self) -> Dict:
        """Get global session statistics"""
        with self.lock:
            active_sessions = len(self.sessions)
            total_messages = sum(len(session["messages"]) for session in self.sessions.values())
            
            role_distribution = defaultdict(int)
            for session in self.sessions.values():
                role_distribution[session["user_role"]] += 1
            
            return {
                "active_sessions": active_sessions,
                "total_messages": total_messages,
                "role_distribution": dict(role_distribution),
                "cleanup_stats": {
                    "last_cleanup": self.last_cleanup,
                    "cleanup_interval": self.cleanup_interval
                }
            }
