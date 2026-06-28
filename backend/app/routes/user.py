from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connection import get_db
from app.schemas.users import UserResponse, UserRole, UserUpdate, ApprovalStatus
from app.models.users import User
from app.core.security import decode_token
from app.services.users import UserService

router = APIRouter(prefix="/users", tags=["Users"])


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency to authenticate user and return User object."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_token(token, token_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    if user.approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval"
        )
        
    return user


def require_role(required_role: UserRole):
    """Dependency factory to enforce role-based access."""
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role.value}"
            )
        return current_user
    return role_checker


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return UserResponse.model_validate(current_user)


@router.get("/admin/dashboard")
async def admin_dashboard(admin: User = Depends(require_role(UserRole.ADMIN))):
    """Admin-only endpoint. Automatically rejects non-admins."""
    return {
        "message": f"Welcome to admin dashboard, {admin.username}!",
        "role": admin.role.value
    }


@router.get("/user/settings")
async def user_settings(current_user: User = Depends(get_current_user)):
    """Regular user endpoint (works for both USER and ADMIN)."""
    return {"message": "User settings endpoint", "username": current_user.username}


# Admin user management endpoints

@router.get("/admin/pending", response_model=list[UserResponse])
async def get_pending_users(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get all users pending approval."""
    service = UserService(db)
    users = await service.get_pending_users()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/admin/all", response_model=list[UserResponse])
async def get_all_users(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get all users (admin only)."""
    service = UserService(db)
    users = await service.get_users()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/admin/{user_id}/approve", response_model=UserResponse)
async def approve_user(
    user_id: int,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Approve a pending user."""
    service = UserService(db)
    user = await service.update_user(user_id, UserUpdate(approval_status=ApprovalStatus.APPROVED))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)


@router.post("/admin/{user_id}/reject", response_model=UserResponse)
async def reject_user(
    user_id: int,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Reject a pending user."""
    service = UserService(db)
    user = await service.update_user(user_id, UserUpdate(approval_status=ApprovalStatus.REJECTED))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)


@router.put("/admin/{user_id}", response_model=UserResponse)
async def update_user_as_admin(
    user_id: int,
    user_in: UserUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Update any user (admin only)."""
    service = UserService(db)
    user = await service.update_user(user_id, user_in)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)


@router.delete("/admin/{user_id}")
async def delete_user_as_admin(
    user_id: int,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Delete any user (admin only)."""
    service = UserService(db)
    success = await service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User deleted successfully"}
