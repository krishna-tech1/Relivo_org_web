from datetime import datetime, timedelta, timezone
import random
import string
from fastapi import APIRouter, Depends, Form, HTTPException, Request, BackgroundTasks
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session

from app.db import models
from app.core import security
from app.core.email_utils import send_otp_email, send_password_changed_email
from app.api.deps import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

#code
def _generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


def _random_password(length: int = 8) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(random.choice(alphabet) for _ in range(length))


@router.post("/register")
def register(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    contact_email: str = Form(...),
    password: str = Form(...),
    country: str = Form(...),
    org_type: str = Form(...),
    website: str | None = Form(None),
    db: Session = Depends(get_db)
):
    contact_email = contact_email.lower().strip()
    # Check if organization already exists
    existing_org = db.query(models.Organization).filter(models.Organization.contact_email == contact_email).first()
    existing_user = db.query(models.User).filter(models.User.email == contact_email).first()

    if existing_org:
        # If it's already verified or active, we don't allow re-registration
        if existing_org.status and existing_org.status.lower() in ("active", "approved"):
            raise HTTPException(status_code=400, detail="Organization already registered and approved.")
        
        # If it's unverified (pending), UPDATE the existing records instead of deleting
        # This avoids unique constraint violations
        if existing_user:
            existing_user.hashed_password = security.get_password_hash(password)
            existing_user.full_name = name
            existing_user.is_verified = False
        else:
            existing_user = models.User(
                email=contact_email,
                hashed_password=security.get_password_hash(password),
                full_name=name,
                role="organization",
                is_verified=False
            )
            db.add(existing_user)
            db.flush()
        
        # Update organization
        existing_org.password = security.get_password_hash(password)
        
        # Update organization with new data
        otp = _generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        existing_org.name = name
        existing_org.country = country
        existing_org.type = org_type
        existing_org.website = website
        existing_org.status = "pending"
        existing_org.otp = otp
        existing_org.otp_expires = expires_at
        existing_org.must_change_password = False
        
        # Commit first
        db.commit()
        
        # Then send email in background
        background_tasks.add_task(send_otp_email, contact_email, otp)
        
        return {"message": "OTP sent successfully", "email": contact_email}

    # No existing org - but check if user exists
    if existing_user:
        # Update existing user
        existing_user.hashed_password = security.get_password_hash(password)
        existing_user.full_name = name
        existing_user.is_verified = False
        user_id = existing_user.id
    else:
        # Create new user
        user = models.User(
            email=contact_email,
            hashed_password=security.get_password_hash(password),
            full_name=name,
            role="organization",
            is_verified=False
        )
        db.add(user)
        db.flush()
        user_id = user.id

    # Create organization entry
    otp = _generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    org = models.Organization(
        user_id=user_id,
        name=name,
        contact_email=contact_email,
        password=security.get_password_hash(password),
        country=country,
        type=org_type,
        website=website,
        status="pending",
        otp=otp,
        otp_expires=expires_at,
        must_change_password=False # User set it themselves
    )
    db.add(org)

    db.commit() # Save everything first
    
    # Send email in background
    background_tasks.add_task(send_otp_email, contact_email, otp)

    return {"message": "OTP sent successfully", "email": contact_email}


@router.post("/resend-otp")
def resend_otp(background_tasks: BackgroundTasks, email: str = Form(...), db: Session = Depends(get_db)):
    email = email.lower().strip()
    org = db.query(models.Organization).filter(models.Organization.contact_email == email).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if org.otp is None and org.otp_expires is None:
        # already verified
        raise HTTPException(status_code=400, detail="Email already verified")

    otp = _generate_otp()
    org.otp = otp
    org.otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    background_tasks.add_task(send_otp_email, email, otp)
    return {"message": "OTP resent successfully"}


@router.post("/verify")
def verify_otp(
    email: str = Form(...),
    code: str = Form(...),
    db: Session = Depends(get_db)
):
    email = email.lower().strip()
    org = db.query(models.Organization).filter(models.Organization.contact_email == email).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if not org.otp or not org.otp_expires:
        raise HTTPException(status_code=400, detail="OTP not found. Please re-register.")

    if org.otp != code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now(timezone.utc) > org.otp_expires:
        raise HTTPException(status_code=400, detail="OTP expired")

    org.otp = None
    org.otp_expires = None

    user = db.query(models.User).filter(models.User.id == org.user_id).first()
    if user:
        user.is_verified = True

    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    email = email.lower().strip()
    org = db.query(models.Organization).filter(models.Organization.contact_email == email).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if not security.verify_password(password, org.password or ""):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = security.create_access_token(subject=org.contact_email, org_id=org.id, role="organization")
    
    # Return different status depending on approval
    redirect_target = "dashboard"
    if org.status and org.status.lower() == "suspended":
        redirect_target = "suspended"
    elif org.status and org.status.lower() == "rejected":
        redirect_target = "rejected"
    elif org.status and org.status.lower() not in ("active", "approved"):
        redirect_target = "pending"

    resp = JSONResponse(content={
        "message": "Login successful", 
        "redirect": redirect_target,
        "access_token": token
    })
    return resp


@router.post("/change-password")
def change_password(
    background_tasks: BackgroundTasks,
    request: Request,
    old_password: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    if request is None:
        raise HTTPException(status_code=400, detail="Missing request context")

    token = request.cookies.get("org_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    from jose import jwt, JWTError
    from app.core.config import settings

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    org_id = payload.get("org_id")
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if not security.verify_password(old_password, org.password or ""):
        raise HTTPException(status_code=400, detail="Old password incorrect")

    org.password = security.get_password_hash(new_password)
    org.must_change_password = False

    user = db.query(models.User).filter(models.User.id == org.user_id).first()
    if user:
        user.hashed_password = security.get_password_hash(new_password)

    db.commit()

    background_tasks.add_task(send_password_changed_email, org.contact_email)

    return {"message": "Password changed successfully"}


@router.get("/logout")
def logout():
    resp = JSONResponse(content={"message": "Logged out"})
    resp.delete_cookie(
        "org_token",
        samesite="none",
        secure=True
    )
    return resp


@router.post("/forgot-password/request")
def forgot_password_request(background_tasks: BackgroundTasks, email: str = Form(...), db: Session = Depends(get_db)):
    email = email.lower().strip()
    org = db.query(models.Organization).filter(models.Organization.contact_email == email).first()
    if not org:
        # For security, don't reveal if org exists
        return {"message": "If this email is registered, an OTP has been sent."}

    otp = _generate_otp()
    org.otp = otp
    org.otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    background_tasks.add_task(send_otp_email, email, otp)

    return {"message": "If this email is registered, an OTP has been sent."}


@router.post("/forgot-password/reset")
def forgot_password_reset(
    email: str = Form(...),
    otp: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    email = email.lower().strip()
    org = db.query(models.Organization).filter(models.Organization.contact_email == email).first()
    if not org or org.otp != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP or email")

    if not org.otp_expires or datetime.now(timezone.utc) > org.otp_expires:
        raise HTTPException(status_code=400, detail="OTP expired")

    org.password = security.get_password_hash(new_password)
    org.otp = None
    org.otp_expires = None
    
    user = db.query(models.User).filter(models.User.id == org.user_id).first()
    if user:
        user.hashed_password = security.get_password_hash(new_password)

    db.commit()
    return {"message": "Password reset successfully"}
