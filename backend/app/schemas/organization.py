from pydantic import BaseModel, EmailStr
from typing import Optional

class OrganizationRegister(BaseModel):
    name: str
    contact_email: EmailStr
    country: str
    type: str
    website: Optional[str] = None

class OrganizationLogin(BaseModel):
    email: EmailStr
    password: str

class OrganizationPasswordChange(BaseModel):
    old_password: str
    new_password: str
