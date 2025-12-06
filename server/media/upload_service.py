import os
import uuid
import logging
from datetime import datetime
from typing import Optional, Tuple
from pathlib import Path
from fastapi import UploadFile
from PIL import Image

logger = logging.getLogger(__name__)

# Base upload directory
UPLOAD_DIR = Path(__file__).parent.parent / "media_uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# File type configurations
ALLOWED_IMAGES = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_VIDEOS = {".mp4", ".webm", ".mov"}
ALLOWED_AUDIO = {".mp3", ".wav", ".ogg", ".m4a"}
ALLOWED_FILES = {".pdf", ".doc", ".docx", ".txt"}

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB
MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10MB
MAX_FILE_SIZE = 20 * 1024 * 1024   # 20MB

class MediaUploadService:
    """Service for handling media file uploads"""
    
    @staticmethod
    async def upload_file(
        file: UploadFile,
        user_id: str,
        file_type: Optional[str] = None
    ) -> Optional[dict]:
        """
        Upload a file and return file info.
        Returns: {"url": str, "filename": str, "type": str, "size": int}
        """
        try:
            # Read file content
            content = await file.read()
            file_size = len(content)
            
            # Get file extension
            ext = Path(file.filename).suffix.lower()
            
            # Determine file type and validate
            detected_type, max_size = MediaUploadService._detect_file_type(ext)
            
            if not detected_type:
                logger.error(f"Unsupported file type: {ext}")
                return None
            
            # Validate size
            if file_size > max_size:
                logger.error(f"File too large: {file_size} > {max_size}")
                return None
            
            # Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            safe_filename = f"{user_id}_{timestamp}_{unique_id}{ext}"
            
            # Determine subdirectory
            subdir = UPLOAD_DIR / detected_type
            subdir.mkdir(exist_ok=True)
            
            # Save file
            file_path = subdir / safe_filename
            with open(file_path, "wb") as f:
                f.write(content)
            
            logger.info(f"✅ Uploaded file: {safe_filename} ({file_size} bytes)")
            
            # Generate thumbnail for images
            thumbnail_url = None
            if detected_type == "images":
                thumbnail_url = await MediaUploadService._generate_thumbnail(file_path)
            
            # Generate public URL
            url = f"/api/v1/media/{detected_type}/{safe_filename}"
            
            return {
                "url": url,
                "filename": safe_filename,
                "type": detected_type,
                "size": file_size,
                "thumbnail_url": thumbnail_url,
                "uploaded_at": datetime.utcnow()
            }
        
        except Exception as e:
            logger.error(f"Failed to upload file: {e}")
            return None
    
    @staticmethod
    def _detect_file_type(ext: str) -> Tuple[Optional[str], int]:
        """Detect file type and return (type, max_size)"""
        if ext in ALLOWED_IMAGES:
            return "images", MAX_IMAGE_SIZE
        elif ext in ALLOWED_VIDEOS:
            return "videos", MAX_VIDEO_SIZE
        elif ext in ALLOWED_AUDIO:
            return "audio", MAX_AUDIO_SIZE
        elif ext in ALLOWED_FILES:
            return "files", MAX_FILE_SIZE
        return None, 0
    
    @staticmethod
    async def _generate_thumbnail(image_path: Path) -> Optional[str]:
        """Generate thumbnail for image"""
        try:
            # Create thumbnails directory
            thumb_dir = UPLOAD_DIR / "images" / "thumbnails"
            thumb_dir.mkdir(exist_ok=True)
            
            # Open and resize image
            img = Image.open(image_path)
            img.thumbnail((300, 300), Image.Resampling.LANCZOS)
            
            # Save thumbnail
            thumb_filename = f"thumb_{image_path.name}"
            thumb_path = thumb_dir / thumb_filename
            img.save(thumb_path, optimize=True, quality=85)
            
            logger.info(f"✅ Generated thumbnail: {thumb_filename}")
            
            return f"/api/v1/media/images/thumbnails/{thumb_filename}"
        
        except Exception as e:
            logger.error(f"Failed to generate thumbnail: {e}")
            return None
    
    @staticmethod
    async def delete_file(filename: str, file_type: str, user_id: str) -> bool:
        """Delete a file (owner only)"""
        try:
            # Check if user owns the file (filename starts with user_id)
            if not filename.startswith(user_id):
                logger.warning(f"User {user_id} attempted to delete file they don't own")
                return False
            
            file_path = UPLOAD_DIR / file_type / filename
            
            if file_path.exists():
                file_path.unlink()
                logger.info(f"✅ Deleted file: {filename}")
                
                # Delete thumbnail if exists
                if file_type == "images":
                    thumb_path = UPLOAD_DIR / "images" / "thumbnails" / f"thumb_{filename}"
                    if thumb_path.exists():
                        thumb_path.unlink()
                
                return True
            
            return False
        
        except Exception as e:
            logger.error(f"Failed to delete file: {e}")
            return False
    
    @staticmethod
    async def get_group_media(group_id: str, media_type: Optional[str] = None) -> list:
        """Get all media files from a group's messages"""
        try:
            from groups.db_collections import group_messages_collection
            import asyncio
            
            # Build query
            query = {
                "group_id": group_id,
                "deleted": False,
                "media_urls": {"$exists": True, "$ne": []}
            }
            
            if media_type:
                query["type"] = media_type.upper()
            
            # Fetch messages with media
            cursor = group_messages_collection.find(query).sort("created_at", -1).limit(100)
            messages = await asyncio.to_thread(lambda: list(cursor))
            
            # Extract media URLs
            media_list = []
            for msg in messages:
                for url in msg.get("media_urls", []):
                    media_list.append({
                        "url": url,
                        "message_id": str(msg["_id"]),
                        "sender_id": msg["sender_id"],
                        "type": msg["type"],
                        "created_at": msg["created_at"]
                    })
            
            return media_list
        
        except Exception as e:
            logger.error(f"Failed to get group media: {e}")
            return []
