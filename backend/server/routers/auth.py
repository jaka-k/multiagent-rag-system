import uuid
from datetime import timedelta, datetime, timezone
from typing import List

import firebase_admin.auth
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.core.config import settings
from server.core.exceptions import ConflictError, InviteCodeError
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
from server.models.invite import InviteCode
from server.models.user import User, Token


class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str


class LogoutResponse(BaseModel):
    ok: bool


class FirebaseTokenResponse(BaseModel):
    firebase_token: str


class UserCreationRequest(BaseModel):
    mail: str
    user: str
    password: str
    invite_code: str


class InviteValidationRequest(BaseModel):
    invite_code: str


class InviteValidationResponse(BaseModel):
    valid: bool


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    created_at: datetime


router = APIRouter()


# --- Auth lifecycle ---

async def _usable_invite(
        session: AsyncSession, code: str, for_update: bool = False
) -> InviteCode:
    statement = select(InviteCode).where(InviteCode.code == code.strip())
    if for_update:
        # Redemption must lock the row: two concurrent registrations may not
        # both spend the last remaining use.
        statement = statement.with_for_update()
    result = await session.exec(statement)
    invite = result.one_or_none()
    if not invite or invite.use_count >= invite.max_uses:
        raise InviteCodeError("Invite code is unknown or already used up.")
    return invite


@router.post("/invite/validate", response_model=InviteValidationResponse)
async def validate_invite_code(
        request: InviteValidationRequest,
        session: AsyncSession = Depends(get_session),
):
    """Pre-registration check so the register form only unlocks on a real code."""
    await _usable_invite(session, request.invite_code)
    return InviteValidationResponse(valid=True)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
        request: UserCreationRequest,
        session: AsyncSession = Depends(get_session),
):
    invite = await _usable_invite(session, request.invite_code, for_update=True)

    existing = await session.exec(
        select(User).where(
            (User.email == request.mail) | (User.username == request.user)
        )
    )
    if existing.one_or_none():
        raise ConflictError("A user with that email or username already exists.")

    new_user = User(
        id=uuid.uuid4(),
        email=request.mail,
        username=request.user,
        hashed_password=get_password_hash(request.password),
        disabled=False,
    )
    session.add(new_user)
    # Flush so the user row exists before the redeemed_by FK update; the
    # invite row stays locked until the single commit below.
    await session.flush()

    invite.use_count += 1
    invite.redeemed_by = new_user.id
    invite.redeemed_at = datetime.now(timezone.utc)
    session.add(invite)
    await session.commit()
    await session.refresh(new_user)

    app_logger.info(f"New user registered: {new_user.username}")
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        username=new_user.username,
        created_at=new_user.created_at,
    )


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
    result = await session.exec(
        select(Token).where(
            Token.token == refresh_data.refresh_token,
            Token.revoked == False,
            Token.expires_at > datetime.now(timezone.utc),
        )
    )
    token = result.one_or_none()

    if not token:
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
    result = await session.exec(select(Token).where(Token.user_id == current_user.id))
    tokens = result.all()

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No active session found."
        )
    for token in tokens:
        await session.delete(token)

    await session.commit()
    return LogoutResponse(ok=True)


# --- User resources ---

@router.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users/me/areas/", response_model=List[Area])
async def read_own_areas(
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Area).where(Area.user_id == current_user.id))
    return result.all()


# --- Utility ---

@router.get("/firebase-token", response_model=FirebaseTokenResponse)
async def get_firebase_token(
        current_user: User = Depends(get_current_active_user),
):
    """
    Exchange a valid FastAPI JWT for a Firebase Custom Token.
    The frontend can then call signInWithCustomToken(auth, firebaseToken)
    to obtain a Firebase Auth session, which satisfies Storage Security Rules.
    """
    try:
        token_bytes: bytes = firebase_admin.auth.create_custom_token(str(current_user.id))
        return FirebaseTokenResponse(firebase_token=token_bytes.decode())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not create Firebase token: {e}",
        )


@router.get("/status/")
async def read_system_status(current_user: User = Depends(get_current_user)):
    return {"status": "ok"}
