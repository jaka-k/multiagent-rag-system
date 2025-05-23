from datetime import timedelta, datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.core.config import settings
from server.core.logger import app_logger
from server.core.security import (
    RefreshTokenSchema,
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_current_active_user,
    get_password_hash,
    get_user_by_id,
)
from server.db.database import get_session
from server.models.area import Area
from server.models.user import User, Token


class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str


class LogoutResponse(BaseModel):
    ok: bool


class UserCreationRequest(BaseModel):
    mail: str
    user: str
    password: str


router = APIRouter()


@router.post("/token", response_model=TokenSchema)
async def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        session: AsyncSession = Depends(get_session),
):
    user = await authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    refresh_token = await create_refresh_token(session, user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token.token,
    }


@router.post("/refresh", response_model=TokenSchema)
async def refresh_access_token(
        refresh_data: RefreshTokenSchema,
        session: AsyncSession = Depends(get_session),
):
    print("refresh_data Y21", refresh_data)
    stmt = select(Token).where(
        Token.token == refresh_data.refresh_token,
        Token.revoked == False,
        Token.expires_at > datetime.now(timezone.utc))

    result = await session.execute(stmt)
    token = result.scalar_one_or_none()

    if not token:
        print("Token Y22", token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_id(session, token.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_data.refresh_token,
    }


@router.post("/logout", response_model=LogoutResponse)
async def logout_user(
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    ## TODO: FIX
    stmt = select(Token).where(Token.user_id == current_user.id)
    result = await session.execute(stmt)

    if not result.scalars().all():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No active session found."
        )
    for token in result:
        await session.delete(token)

    await session.commit()

    return LogoutResponse(ok=True)


@router.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users/me/areas/", response_model=List[Area])
async def read_own_areas(
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    stmt = select(Area).where(Area.user_id == current_user.id)
    result = await session.execute(stmt)

    return result.scalars().all()


@router.get("/status/")
async def read_system_status(current_user: User = Depends(get_current_user)):
    return {"status": "ok"}


@router.post("/test-user/", tags=["dev-test"])
async def create_test_user(
        request: UserCreationRequest,
        session: AsyncSession = Depends(get_session),
):
    body = request.model_dump()

    test_user = User(
        email=body["mail"],
        username=body["user"],
        hashed_password=get_password_hash(body["password"]),
        disabled=False,
    )

    session.add(test_user)

    await session.commit()
    app_logger.info(
        f"Test user created with username: {test_user.username} and password: 'admin'"
    )

    return {"status": "ok"}
