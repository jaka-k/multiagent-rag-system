from datetime import datetime, timedelta, timezone
import secrets
from typing import Optional
import uuid

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.core.config import settings
from server.core.logger import logger
from server.db.database import get_session
from server.models.user import User, Token

# Initialize OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class RefreshTokenSchema(BaseModel):
    refresh_token: str


def verify_password(plain_password: str, hashed_password: bytes) -> bool:
    """Verify a plain password against its hashed version."""
    password_byte_enc = plain_password.encode("utf-8")
    return bcrypt.checkpw(password_byte_enc, hashed_password)


def get_password_hash(password: str) -> bytes:
    """Hash a plain password."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password


async def get_user(session: AsyncSession, username: str) -> Optional[User]:
    """Retrieve a user by username."""
    statement = select(User).where(User.username == username)
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    """Retrieve a user by UUID."""
    statement = select(User).where(User.id == user_id)
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def authenticate_user(
    session: AsyncSession, username: str, password: str
) -> Optional[User]:
    """Authenticate user credentials."""
    user = await get_user(session, username)
    if not user or not verify_password(password, user.hashed_password):
        logger.info("User password could not be verified.")
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=30))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.hashing_secret_key, algorithm=settings.hashing_algorithm
    )
    return encoded_jwt


async def create_refresh_token(session: AsyncSession, user: User) -> Token:
    """Create and store a refresh token."""
    refresh_token = str(secrets.token_urlsafe(64))
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.refresh_token_expire_minutes
    )
    token = Token(token=refresh_token, user_id=user.id, expires_at=expires_at)
    session.add(token)
    await session.commit()
    await session.refresh(token)
    return token


async def get_current_user(
    token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)
) -> User:
    """Retrieve the current user based on the JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.hashing_secret_key, algorithms=[settings.hashing_algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warn("Invalid user credentials.")
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception

    user = await get_user_by_id(session, user_uuid)
    if user is None:
        logger.warn("Invalid user credentials.")
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the current user is active."""
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user
