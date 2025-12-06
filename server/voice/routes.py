import os
import shutil
import tempfile
import whisper
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from fastapi.responses import FileResponse
from gtts import gTTS
from typing import Optional

from auth.routes import authenticate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Voice"])

# Lazy load model to save startup time
whisper_model = None

def get_whisper_model():
    """Load Whisper model singleton"""
    global whisper_model
    if whisper_model is None:
        logger.info("Loading Whisper model (tiny)...")
        whisper_model = whisper.load_model("tiny")
    return whisper_model

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    user: dict = Depends(authenticate)
):
    """
    Transcribe uploaded audio file to text using OpenAI Whisper
    """
    if not file.content_type.startswith("audio/"):
        raise HTTPException(400, "Invalid file type. Please upload audio.")

    try:
        # Check if ffmpeg is available
        if shutil.which("ffmpeg") is None:
            raise HTTPException(500, "FFmpeg is not installed on the server. Please install it to use voice features.")

        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            shutil.copyfileobj(file.file, temp_audio)
            temp_path = temp_audio.name
        
        # Transcribe
        model = get_whisper_model()
        result = model.transcribe(temp_path)
        text = result["text"].strip()
        
        # Cleanup
        os.remove(temp_path)
        
        return {"text": text}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        # Cleanup if validation failed
        if 'temp_path' in locals() and os.path.exists(temp_path):
             os.remove(temp_path)
        raise HTTPException(500, f"Transcription failed: {str(e)}")

@router.post("/speak")
async def text_to_speech(
    text: str = Form(...),
    user: dict = Depends(authenticate)
):
    """
    Convert text to speech using gTTS
    """
    try:
        # Generate speech
        tts = gTTS(text=text, lang='en')
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            tts.save(temp_audio.name)
            temp_path = temp_audio.name
            
        return FileResponse(
            temp_path, 
            media_type="audio/mpeg",
            filename="response.mp3",
            background=None # Should use a background task to delete file after response
        )
        
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        raise HTTPException(500, f"Text-to-speech failed: {str(e)}")
