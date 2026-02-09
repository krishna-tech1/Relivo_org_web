from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Text, Index, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(String(50), default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Grant(Base):
    __tablename__ = "grants"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), index=True, nullable=False)
    organizer = Column(String(200), nullable=False)
    deadline = Column(DateTime, nullable=True, index=True)
    description = Column(Text, nullable=True)
    eligibility = Column(Text, nullable=True)
    apply_url = Column(String(500), nullable=False)

    source = Column(String(50), default="manual", index=True)
    external_id = Column(String(100), unique=True, nullable=True, index=True)

    refugee_country = Column(String(100), nullable=True, index=True)
    is_verified = Column(Boolean, default=False, index=True)
    is_active = Column(Boolean, default=True, index=True)
    rejection_reason = Column(Text, nullable=True)

    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)

    amount = Column(String(100), nullable=True)
    location = Column(String(200), nullable=True)
    eligibility_criteria = Column(JSON, nullable=True)
    required_documents = Column(JSON, nullable=True)

    created_by_type = Column(String(50), nullable=True)
    created_by_id = Column(Integer, nullable=True)
    status = Column(String(50), nullable=True)
    category = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", foreign_keys=[creator_id])
    organization = relationship("Organization", foreign_keys=[organization_id])

    __table_args__ = (
        Index('ix_grants_verified_active', 'is_verified', 'is_active'),
        Index('ix_grants_country_verified', 'refugee_country', 'is_verified'),
        Index('ix_grants_deadline_verified', 'deadline', 'is_verified'),
    )

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    name = Column(String(200), index=True, nullable=False)
    description = Column(Text, nullable=True)
    verification_documents = Column(JSON, nullable=True)
    status = Column(String(50), default="pending", index=True)

    website = Column(String(200), nullable=True)
    contact_email = Column(String(200), nullable=True, unique=True)
    country = Column(String(100), nullable=True)
    type = Column(String(50), nullable=True)
    password = Column(String(255), nullable=True)
    otp = Column(String(10), nullable=True)
    otp_expires = Column(DateTime(timezone=True), nullable=True)
    must_change_password = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
