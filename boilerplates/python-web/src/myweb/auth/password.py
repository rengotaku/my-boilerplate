"""argon2 ベースのパスワードハッシュ (pwdlib)."""

from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

_password_hash = PasswordHash((Argon2Hasher(),))


def hash_password(password: str) -> str:
    """パスワードを argon2 でハッシュ化する."""
    if not password:
        raise ValueError("password は必須です")
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """パスワードがハッシュと一致するか検証する."""
    if not password or not password_hash:
        return False
    return _password_hash.verify(password, password_hash)
