from fastapi import FastAPI, Request, Depends, HTTPException
import logging
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api import auth, grants
from app.api.deps import get_db, get_current_org
from app.db import models
from app.db.init_db import ensure_schema

app = FastAPI(title="Relivo Organization Portal API")

@app.on_event("startup")
def on_startup():
    try:
        ensure_schema()
    except Exception as e:
        print(f"Startup error ignored: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(grants.router)


@app.get("/api/dashboard_data")
def dashboard_data(
    db: Session = Depends(get_db),
    org: models.Organization = Depends(get_current_org)
):
    grants_query = db.query(models.Grant).filter(models.Grant.organization_id == org.id)
    grants_list = grants_query.order_by(models.Grant.created_at.desc()).all()
    total_grants = grants_query.count()
    active_grants = grants_query.filter(models.Grant.is_active.is_(True)).count()
    inactive_grants = total_grants - active_grants
    
    trash_count = grants_query.filter(models.Grant.status == "DELETION_PENDING").count()
    total_visible = total_grants - trash_count

    return {
        "org": {
            "name": org.name,
            "contact_email": org.contact_email,
            "country": org.country,
            "status": org.status,
        },
        "must_change_password": org.must_change_password,
        "grants": [{
            "id": g.id,
            "title": g.title,
            "description": g.description,
            "eligibility": g.eligibility,
            "organizer": g.organizer,
            "is_active": g.is_active,
            "status": g.status or "LIVE"
        } for g in grants_list],
        "total_grants": total_visible,
        "active_grants": active_grants,
        "inactive_grants": total_visible - active_grants,
        "trash_count": trash_count
    }

@app.get("/api/grants/{grant_id}")
def get_grant(
    grant_id: int,
    db: Session = Depends(get_db),
    org: models.Organization = Depends(get_current_org)
):
    grant = db.query(models.Grant).filter(models.Grant.id == grant_id, models.Grant.organization_id == org.id).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")
    return grant

@app.get("/health/email")
def test_email(email: str, db: Session = Depends(get_db)):
    from app.core.email_utils import send_otp_email
    try:
        send_otp_email(email, "123456")
        return {"status": "success", "message": f"Test email sent to {email}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        return {"status": "degraded", "database": "unreachable", "error": str(exc)}

