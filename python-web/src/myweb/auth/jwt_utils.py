"""PyJWT を使った JWT トークン発行・検証."""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from myweb.config import get_settings


class InvalidTokenError(Exception):
    """JWT が無効な場合に発生する例外."""


def create_access_token(
    subject: str,
    extra_claims: dict[str, Any] | None = None,
    expires_minutes: int | None = None,
) -> str:
    """subject を含む JWT を発行する."""
    settings = get_settings()
    expires = (
        expires_minutes
        if expires_minutes is not None
        else settings.jwt_expire_minutes
    )
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires)).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    """JWT を検証してペイロードを返す。無効なら InvalidTokenError."""
    settings = get_settings()
    try:
        decoded: dict[str, Any] = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc
    return decoded
