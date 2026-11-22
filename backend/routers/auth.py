"""
PlanzyPop - Authentication Router
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Provides user registration, login, profile inspection, and session logout.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth_utils import (
    hash_password,
    verify_password,
    generate_token,
    get_current_user,
    get_token_from_header,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=schemas.TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account"
)
def register(data: schemas.UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new user with name, email, and password.
    Returns an access token and user information.
    New accounts start with completely empty data (no sample events/plans).
    Does NOT require email to exist in database before registration.
    Rejects duplicate emails with a clear error message.
    """
    clean_email = data.email.strip().lower()
    existing = db.query(models.User).filter(models.User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account already exists. Please log in."
        )

    new_user = models.User(
        name=data.name.strip(),
        email=clean_email,
        hashed_password=hash_password(data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_val = generate_token()
    token_rec = models.UserToken(token=token_val, user_id=new_user.id)
    db.add(token_rec)
    db.commit()

    return {
        "access_token": token_val,
        "token_type": "bearer",
        "user": new_user
    }


@router.post(
    "/login",
    response_model=schemas.TokenResponse,
    summary="Log into an existing user account"
)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user via email and password.
    Returns an access token and user information.
    """
    clean_email = data.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == clean_email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token_val = generate_token()
    token_rec = models.UserToken(token=token_val, user_id=user.id)
    db.add(token_rec)
    db.commit()

    return {
        "access_token": token_val,
        "token_type": "bearer",
        "user": user
    }


@router.get(
    "/me",
    response_model=schemas.UserResponse,
    summary="Get current authenticated user profile"
)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Returns the profile of the currently authenticated user.
    """
    return current_user


@router.post(
    "/logout",
    summary="Log out of the current session"
)
def logout(
    current_user: models.User = Depends(get_current_user),
    authorization: str = Depends(get_token_from_header),
    db: Session = Depends(get_db)
):
    """
    Invalidates the active session token for the authenticated user.
    """
    if authorization:
        db.query(models.UserToken).filter(models.UserToken.token == authorization).delete()
        db.commit()
    return {"message": "Logged out successfully"}
