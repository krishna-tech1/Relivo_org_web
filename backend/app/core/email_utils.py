import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def send_otp_email(email: str, code: str) -> None:
    msg = MIMEMultipart()
    msg["From"] = settings.MAIL_FROM
    msg["To"] = email
    msg["Subject"] = "Relivo Organization Verification Code"

    body = f'''
    <h3>Your Relivo verification code</h3>
    <p>Use the OTP below to verify your organization email:</p>
    <div style="background:#f4f4f4;padding:12px;border-radius:6px;">
        <b style="font-size:18px;letter-spacing:1px;">{code}</b>
    </div>
    <p>This code expires in 10 minutes.</p>
    '''
    msg.attach(MIMEText(body, "html"))

    # Add timeout to prevent hanging
    with smtplib.SMTP(settings.MAIL_SERVER, int(settings.MAIL_PORT), timeout=30) as server:
        server.starttls()
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.send_message(msg)


def send_password_changed_email(email: str) -> None:
    msg = MIMEMultipart()
    msg["From"] = settings.MAIL_FROM
    msg["To"] = email
    msg["Subject"] = "Relivo Password Updated"

    body = '''
    <h3>Your password has been updated</h3>
    <p>If you did not change this password, contact support immediately.</p>
    '''
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP(settings.MAIL_SERVER, int(settings.MAIL_PORT), timeout=30) as server:
        server.starttls()
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.send_message(msg)
