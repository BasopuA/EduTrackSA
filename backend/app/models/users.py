# app/models/user.py
import enum
from sqlalchemy import Column, DateTime, Integer, String, Boolean,Enum as SAEnum
from sqlalchemy.sql import func
from app.database.connection import Base

class UserRole(str, enum.Enum):
    USER = "user"
    TEACHER = "teacher"
    ADMIN = "admin"

class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(255), nullable=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)  # Store hashed password
    is_active = Column(Boolean, default=True)
    role = Column(SAEnum(UserRole), default=UserRole.USER, nullable=False)
    consent_accepted = Column(Boolean, default=False, nullable=False)
    consent_accepted_at = Column(DateTime(timezone=True), nullable=True)
    approval_status = Column(String(20), default=ApprovalStatus.PENDING.value, nullable=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"