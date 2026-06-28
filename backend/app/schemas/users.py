from typing import Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserRole(str, Enum):
    USER = "user"
    TEACHER = "teacher"
    ADMIN = "admin"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
 
class UserBase(BaseModel):
    """Base schema for User."""
    full_name: Optional[str] = Field(None, max_length=255)
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    role: UserRole = Field(default=UserRole.USER)
    consent_accepted: bool = False

    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    """Schema for creating a new User."""
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str
    password: str


class UserUpdate(BaseModel):
    """Schema for updating a User."""
    full_name: Optional[str] = Field(None, max_length=255)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    consent_accepted: Optional[bool] = None
    approval_status: Optional[ApprovalStatus] = None
 
 
class UserResponse(UserBase):
    """Schema for returning User data in API responses."""
    id: int
    is_active: bool
    approval_status: ApprovalStatus
    created_at: datetime
    consent_accepted: bool
    approved_at: Optional[datetime] = None
  
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class TokenPayload(BaseModel):
    """Decoded token payload schema."""
    sub: str  # user ID
    type: str  # "access" or "refresh"
    exp: int
    iat: int
