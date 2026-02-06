from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GrantCreate(BaseModel):
    title: str
    organizer: Optional[str] = None
    apply_url: str
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    eligibility: Optional[str] = None
    refugee_country: Optional[str] = None
    amount: Optional[str] = None

class GrantUpdate(BaseModel):
    title: Optional[str] = None
    organizer: Optional[str] = None
    apply_url: Optional[str] = None
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    eligibility: Optional[str] = None
    refugee_country: Optional[str] = None
    amount: Optional[str] = None
