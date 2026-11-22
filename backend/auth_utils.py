"""
PlanzyPop - Authentication Utilities
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Provides cryptographically secure PBKDF2 password hashing, secure token generation,
and FastAPI dependencies for user authentication and authorization.
"""

import hashlib
import secrets
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models


def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with a unique random salt.
    """
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}:{key.hex()}"


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a stored salt:hash string.
    """
    try:
        salt, key_hex = hashed_password.split(":")
        check = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return secrets.compare_digest(check.hex(), key_hex)
    except Exception:
        return False


def generate_token() -> str:
    """
    Generates a cryptographically secure random session token.
    """
    return secrets.token_urlsafe(32)


def get_token_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Extracts the bearer token from the Authorization header.
    """
    if not authorization:
        return None
    parts = authorization.strip().split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    if len(parts) == 1 and not parts[0].lower().startswith("bearer"):
        return parts[0]
    return None


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> models.User:
    """
    FastAPI dependency requiring a valid authenticated user.
    Raises HTTP 401 Unauthorized if the token is missing or invalid.
    """
    token_str = get_token_from_header(authorization)
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required"
        )

    token_record = db.query(models.UserToken).filter(models.UserToken.token == token_str).first()
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )

    user = db.query(models.User).filter(models.User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found"
        )
    return user


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """
    FastAPI dependency that returns the authenticated user if a valid token is provided,
    or None if no authentication header is supplied.
    """
    token_str = get_token_from_header(authorization)
    if not token_str:
        return None

    token_record = db.query(models.UserToken).filter(models.UserToken.token == token_str).first()
    if not token_record:
        return None

    return db.query(models.User).filter(models.User.id == token_record.user_id).first()


def verify_event_owner(event: models.Event, current_user: Optional[models.User]):
    """
    Validates that the given event belongs to the requesting user session.
    - If user is authenticated, event.user_id must match str(current_user.id).
    - If unauthenticated (test/default mode), event.user_id must be None.
    Raises 404 Not Found to prevent leaking the existence of other users' records.
    """
    if current_user and event.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event.id} not found."
        )
    if current_user is None and event.user_id is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event.id} not found."
        )
