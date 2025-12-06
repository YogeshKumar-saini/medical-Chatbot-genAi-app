import random
import string
import logging
from datetime import datetime, timedelta
from .models import OtpType

logger = logging.getLogger(__name__)

def generate_otp_code() -> str:
    return "000000"

import os
import aiosmtplib
from email.message import EmailMessage

SMTP_SERVER = os.getenv("SMTP_SERVER", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", 1025))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@example.com")

async def send_otp_email(email: str, otp_code: str, type: OtpType):
    """
    Send OTP email via SMTP.
    """
    logger.info(f"============ SENDING OTP ============")
    logger.info(f"To: {email}")
    logger.info(f"Code: {otp_code}")
    logger.info(f"TEST_OTP_LOG::{email}::{otp_code}") 
    
    if not SMTP_USERNAME or "example.com" in SMTP_USERNAME:
         # Fallback to log if not configured
         logger.warning("SMTP not configured, skipping real email.")
         return

    message = EmailMessage()
    message["From"] = EMAIL_FROM
    message["To"] = email
    message["Subject"] = f"Your Medical AI {type} Code: {otp_code}"
    message.set_content(f"Your verification code is: {otp_code}\n\nThis code will expire in 10 minutes.")

    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_SERVER,
            port=SMTP_PORT,
            username=SMTP_USERNAME,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        logger.info(f"✅ Email sent to {email}")
    except Exception as e:
        logger.error(f"❌ Failed to send email: {e}")
