from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import Optional
import os
import base64
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# Configure logger
logger = logging.getLogger(__name__)

# Initialize Gemini Pro Vision
def get_vision_model():
    """Get initialized Gemini Vision model"""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise ValueError("GOOGLE_API_KEY not found")
        
    return ChatGoogleGenerativeAI(
        model="gemini-3-pro-preview",
        google_api_key=google_api_key,
        temperature=0.4
    )

async def analyze_medical_image(
    image_bytes: bytes, 
    mime_type: str, 
    prompt: str = "Analyze this medical image and describe any visible findings. Be professional but clear."
) -> str:
    """
    Analyze a medical image using Gemini Vision
    """
    try:
        model = get_vision_model()
        
        # Convert bytes to base64
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        
        message = HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": prompt
                },
                {
                    "type": "image_url",
                    "image_url": f"data:{mime_type};base64,{image_b64}"
                }
            ]
        )
        
        response = await model.ainvoke([message])
        return response.content
        
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        return f"Failed to analyze image: {str(e)}"
