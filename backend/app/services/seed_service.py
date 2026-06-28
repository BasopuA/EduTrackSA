from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User, UserRole  # ← Import UserRole
from app.core.security import get_password_hash
from app.core.config import settings


class SeedService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def seed_first_user(self):
        """Seed default users if none exist"""
        try:
            # Check if any user already exists
            result = await self.db.execute(select(User))
            user_exists = result.first() is not None

            if user_exists:
                return

            # Create default admin user with hashed password from settings
            hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            
            admin_user = User(
                full_name="EduTrack Administrator",
                username="admin",
                email="admin@edutrackersa.com",
                password_hash=hashed_password,
                is_active=True,
                role=UserRole.ADMIN,
                consent_accepted=True,
                consent_accepted_at=datetime.now(timezone.utc),
                approval_status="approved",
                approved_at=datetime.now(timezone.utc)
            )
            
            # Create default teacher user with password 1234
            teacher_password = get_password_hash("1234")
            teacher_user = User(
                full_name="Demo Teacher",
                username="teacher",
                email="teacher@edutrackersa.com",
                password_hash=teacher_password,
                is_active=True,
                role=UserRole.TEACHER,
                consent_accepted=True,
                consent_accepted_at=datetime.now(timezone.utc),
                approval_status="approved",
                approved_at=datetime.now(timezone.utc)
            )
            
            # Create default learner user with password 1234
            learner_password = get_password_hash("1234")
            learner_user = User(
                full_name="Demo Learner",
                username="learner",
                email="learner@edutrackersa.com",
                password_hash=learner_password,
                is_active=True,
                role=UserRole.USER,
                consent_accepted=True,
                consent_accepted_at=datetime.now(timezone.utc),
                approval_status="approved",
                approved_at=datetime.now(timezone.utc)
            )
            
            self.db.add(admin_user)
            self.db.add(teacher_user)
            self.db.add(learner_user)
            await self.db.commit()
            

        except Exception as e:
            await self.db.rollback()
            raise

