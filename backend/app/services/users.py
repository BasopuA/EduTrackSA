from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
 
from app.models.users import User, UserRole
from app.core.security import get_password_hash
from app.schemas.users import UserCreate, UserUpdate, ApprovalStatus


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_username(self, username: str):
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()
 
    async def get_user_by_email(self, email: str):
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
 
    async def get_user_by_id(self, user_id: int):
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_users(self):
        result = await self.db.execute(select(User))
        return result.scalars().all()

    async def get_pending_users(self):
        result = await self.db.execute(
            select(User).where(User.approval_status == "pending")
        )
        return result.scalars().all()

    # app/services/users.py - create_user:
    async def create_user(self, user_in: UserCreate):
        consent_accepted_at = datetime.now(timezone.utc) if user_in.consent_accepted else None
        user = User(
            full_name=user_in.full_name,
            username=user_in.username,
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            role=user_in.role or UserRole.USER,
            consent_accepted=user_in.consent_accepted,
            consent_accepted_at=consent_accepted_at,
            approval_status="pending",
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
  
    async def update_user(self, user_id: int, user_in: UserUpdate):
        user = await self.get_user_by_id(user_id)
        if not user:
            return None
 
        if user_in.full_name is not None:
            user.full_name = user_in.full_name
        if user_in.username:
            user.username = user_in.username
        if user_in.email:
            user.email = user_in.email
        if user_in.is_active is not None:
            user.is_active = user_in.is_active
        if user_in.role is not None:
            user.role = user_in.role
        if user_in.consent_accepted is not None:
            user.consent_accepted = user_in.consent_accepted
            if user_in.consent_accepted:
                user.consent_accepted_at = datetime.now(timezone.utc)
        if user_in.approval_status is not None:
            user.approval_status = user_in.approval_status.value
            if user_in.approval_status == ApprovalStatus.APPROVED:
                user.approved_at = datetime.now(timezone.utc)
            else:
                user.approved_at = None
  
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete_user(self, user_id: int):
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        await self.db.delete(user)
        await self.db.commit()
        return True
    