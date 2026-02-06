from fastapi import FastAPI, Request, Depends, HTTPException
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
    ensure_schema()

# Configure CORS
origins = [
    "http://localhost:5500",  # Common Live Server port
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
    ],
    allow_credentials=True,
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
            "organizer": g.organizer,
            "is_active": g.is_active
        } for g in grants_list],
        "total_grants": total_grants,
        "active_grants": active_grants,
        "inactive_grants": inactive_grants,
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

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        return {"status": "degraded", "database": "unreachable", "error": str(exc)}

