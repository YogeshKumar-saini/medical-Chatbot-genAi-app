import os
import logging
import time
from jose import jwt

logger = logging.getLogger(__name__)

LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

def get_livekit_token(room_name: str, participant_identity: str, participant_name: str) -> str:
    """
    Generate a LiveKit access token manually using JWT.
    """
    if not all([LIVEKIT_API_KEY, LIVEKIT_API_SECRET]):
        logger.error("LiveKit credentials not configured")
        return None

    try:
        # Define claims
        claims = {
            "iss": LIVEKIT_API_KEY,
            "sub": participant_identity,
            "name": participant_name,
            "video": {
                "room": room_name,
                "roomJoin": True,
            },
            "exp": int(time.time()) + 60 * 60, # 1 hour expiration
            "nbf": int(time.time()) - 5 # 5 seconds leeway
        }

        # Encode JWT
        token = jwt.encode(claims, LIVEKIT_API_SECRET, algorithm="HS256")
        
        return token
    except Exception as e:
        logger.error(f"Failed to generate LiveKit token: {e}")
        return None
