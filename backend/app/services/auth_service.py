from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.user import User
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    generate_verification_token,
)
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.services.email_service import send_verification_email, send_password_reset_email
from app.config import get_settings

_settings = get_settings()


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    result = await db.execute(
        select(User).where(or_(User.email == data.email, User.username == data.username))
    )
    existing = result.scalar_one_or_none()
    if existing:
        if existing.email == data.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Username already taken")

    # Auto-verify in dev (console email backend) so you can log in immediately
    auto_verify = _settings.email_backend == "console"
    token = generate_verification_token()
    user = User(
        email=data.email,
        username=data.username,
        password_hash=hash_password(data.password),
        email_verify_token=None if auto_verify else token,
        is_verified=auto_verify,
    )
    db.add(user)
    await db.flush()
    if not auto_verify:
        await send_verification_email(data.email, token, data.username)
    return user


async def login_user(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    result = await db.execute(
        select(User).where(
            or_(User.email == data.identifier, User.username == data.identifier)
        )
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


async def verify_email(db: AsyncSession, token: str) -> None:
    result = await db.execute(select(User).where(User.email_verify_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    user.is_verified = True
    user.email_verify_token = None


async def initiate_password_reset(db: AsyncSession, email: str) -> None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return  # silently succeed to prevent email enumeration

    token = generate_verification_token()
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await send_password_reset_email(email, token)


async def complete_password_reset(db: AsyncSession, token: str, new_password: str) -> None:
    result = await db.execute(select(User).where(User.reset_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token expired")

    user.password_hash = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
