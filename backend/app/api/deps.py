from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import SessionLocal
from app.db import models


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_org(request: Request, db: Session = Depends(get_db)) -> models.Organization:
    token = request.cookies.get("org_token")
    
    # Check Authorization header if cookie is missing
    auth_header = request.headers.get("Authorization")
    if not token and auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    org_id = payload.get("org_id")
    if not org_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # We allow the object to be returned even if pending/rejected so the frontend can show the status
    return org
