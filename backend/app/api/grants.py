from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db import models
from app.api.deps import get_db, get_current_org

router = APIRouter(prefix="/org/grants", tags=["org-grants"])


def _parse_deadline(value: str | None):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


@router.post("/create")
def create_grant(
    title: str = Form(...),
    organizer: str | None = Form(None),
    apply_url: str = Form(...),
    deadline: str | None = Form(None),
    description: str | None = Form(None),
    eligibility: str | None = Form(None),
    refugee_country: str | None = Form(None),
    amount: str | None = Form(None),
    category: str | None = Form(None),
    db: Session = Depends(get_db),
    org: models.Organization = Depends(get_current_org)
):
    if org.status and org.status.lower() == "suspended":
        raise HTTPException(status_code=403, detail="Organization suspended")

    grant = models.Grant(
        title=title,
        organizer=organizer if organizer else org.name,
        apply_url=apply_url,
        deadline=_parse_deadline(deadline),
        description=description,
        eligibility=eligibility,
        refugee_country=refugee_country,
        amount=amount,
        category=category,
        source="manual",
        is_verified=True,
        is_active=True,
        organization_id=org.id,
        creator_id=org.user_id,
        created_by_type="ORGANIZATION",
        created_by_id=org.id,
        status="LIVE"
    )
    db.add(grant)
    db.commit()

    return {"message": "Grant created successfully", "id": grant.id}


@router.post("/{grant_id}/edit")
def edit_grant(
    grant_id: int,
    title: str = Form(...),
    organizer: str | None = Form(None),
    apply_url: str = Form(...),
    deadline: str | None = Form(None),
    description: str | None = Form(None),
    eligibility: str | None = Form(None),
    refugee_country: str | None = Form(None),
    amount: str | None = Form(None),
    category: str | None = Form(None),
    db: Session = Depends(get_db),
    org: models.Organization = Depends(get_current_org)
):
    grant = db.query(models.Grant).filter(models.Grant.id == grant_id, models.Grant.organization_id == org.id).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")

    grant.title = title
    if organizer:
        grant.organizer = organizer
    grant.apply_url = apply_url
    grant.deadline = _parse_deadline(deadline)
    grant.description = description
    grant.eligibility = eligibility
    grant.refugee_country = refugee_country
    grant.amount = amount
    grant.category = category

    db.commit()

    return {"message": "Grant updated successfully"}


@router.post("/{grant_id}/delete")
def delete_grant(
    grant_id: int,
    db: Session = Depends(get_db),
    org: models.Organization = Depends(get_current_org)
):
    grant = db.query(models.Grant).filter(models.Grant.id == grant_id, models.Grant.organization_id == org.id).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")

    # Move to trash (Pending Deletion) instead of deleting
    grant.status = "DELETION_PENDING"
    db.commit()

    return {"message": "Grant moved to pending deletion"}


@router.post("/{grant_id}/permanent-delete")
def permanent_delete_grant(
    grant_id: int,
    db: Session = Depends(get_db),
    org: models.Organization = Depends(get_current_org)
):
    grant = db.query(models.Grant).filter(
        models.Grant.id == grant_id, 
        models.Grant.organization_id == org.id,
        models.Grant.status == "DELETION_PENDING"
    ).first()
    
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found in pending deletion")

    db.delete(grant)
    db.commit()

    return {"message": "Grant permanently deleted"}


@router.post("/{grant_id}/restore")
def restore_grant(
    grant_id: int,
    db: Session = Depends(get_db),
    org: models.Organization = Depends(get_current_org)
):
    grant = db.query(models.Grant).filter(
        models.Grant.id == grant_id, 
        models.Grant.organization_id == org.id,
        models.Grant.status == "DELETION_PENDING"
    ).first()
    
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found in pending deletion")

    grant.status = "LIVE"
    db.commit()

    return {"message": "Grant restored to workspace"}

