import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_otp_email(email: str, code: str) -> None:
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": settings.MAIL_PASSWORD,
        "content-type": "application/json"
    }
    
    body_html = f'''
    <h3>Your Relivo verification code</h3>
    <p>Use the OTP below to verify your organization email:</p>
    <div style="background:#f4f4f4;padding:12px;border-radius:6px;">
        <b style="font-size:18px;letter-spacing:1px;">{code}</b>
    </div>
    <p>This code expires in 10 minutes.</p>
    '''
    
    payload = {
        "sender": {"email": settings.MAIL_FROM, "name": "Relivo Org"},
        "to": [{"email": email}],
        "subject": "Relivo Organization Verification Code",
        "htmlContent": body_html
    }

    try:
        logger.info(f"Sending OTP email via Brevo API to {email}...")
        response = httpx.post(url, headers=headers, json=payload, timeout=10.0)
        
        if response.status_code in (201, 202, 200):
            logger.info(f"OTP email sent successfully via API to {email}")
        else:
            logger.error(f"Brevo API error: {response.status_code} - {response.text}")
            raise Exception(f"Brevo API failed with status {response.status_code}")
            
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email} via API: {str(e)}")
        raise e


def send_password_changed_email(email: str) -> None:
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": settings.MAIL_PASSWORD,
        "content-type": "application/json"
    }

    body_html = '''
    <h3>Your password has been updated</h3>
    <p>If you did not change this password, contact support immediately.</p>
    '''

    payload = {
        "sender": {"email": settings.MAIL_FROM, "name": "Relivo Org"},
        "to": [{"email": email}],
        "subject": "Relivo Password Updated",
        "htmlContent": body_html
    }

    try:
        logger.info(f"Sending password change email via Brevo API to {email}...")
        response = httpx.post(url, headers=headers, json=payload, timeout=10.0)
        
        if response.status_code in (201, 202, 200):
            logger.info(f"Password update email sent successfully via API to {email}")
        else:
            logger.error(f"Brevo API error: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"Failed to send password change email to {email} via API: {str(e)}")
