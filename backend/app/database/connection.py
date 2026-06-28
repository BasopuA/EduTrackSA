import os
from dotenv import load_dotenv
from sqlalchemy import inspect as sa_inspect, text
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy.orm import declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
)

# Async session factory
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


# Create tables
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_ensure_user_registration_columns)


def _ensure_user_registration_columns(connection):
    """Keep existing databases compatible with registration and approval fields."""
    try:
        inspector = sa_inspect(connection)
        if "users" not in inspector.get_table_names():
            return

        columns = {column["name"] for column in inspector.get_columns("users")}
        if "full_name" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)"))
        if "consent_accepted" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN consent_accepted BOOLEAN NOT NULL DEFAULT FALSE"))
        if "consent_accepted_at" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN consent_accepted_at TIMESTAMP"))
        if "approval_status" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'"))
            connection.execute(text("UPDATE users SET approval_status = 'PENDING' WHERE approval_status IS NULL OR approval_status = 'pending'"))
        if "approved_at" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN approved_at TIMESTAMP"))
    except Exception:
        # Some test databases may not support inspection; SQLAlchemy metadata handles fresh installs.
        pass


# FastAPI dependency
async def get_db():
    async with SessionLocal() as session:
        yield session