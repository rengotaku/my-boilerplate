"""auth モジュールのテスト: パスワードハッシュ + JWT."""

import time

import pytest

from myweb.auth import (
    InvalidTokenError,
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


class TestPasswordHash:
    def test_hash_returns_non_plaintext(self) -> None:
        h = hash_password("s3cret-pass")
        assert h != "s3cret-pass"
        assert len(h) > 20

    def test_verify_succeeds_for_correct_password(self) -> None:
        h = hash_password("s3cret-pass")
        assert verify_password("s3cret-pass", h) is True

    def test_verify_fails_for_wrong_password(self) -> None:
        h = hash_password("s3cret-pass")
        assert verify_password("wrong", h) is False

    def test_verify_fails_for_empty(self) -> None:
        assert verify_password("", "anything") is False
        assert verify_password("password", "") is False

    def test_hash_empty_password_raises(self) -> None:
        with pytest.raises(ValueError):
            hash_password("")

    def test_hashes_are_unique_per_call(self) -> None:
        a = hash_password("samepass1")
        b = hash_password("samepass1")
        assert a != b


class TestJWT:
    def test_create_and_decode_token(self) -> None:
        token = create_access_token(subject="42", extra_claims={"role": "admin"})
        payload = decode_token(token)
        assert payload["sub"] == "42"
        assert payload["role"] == "admin"
        assert "exp" in payload
        assert "iat" in payload

    def test_decode_invalid_token_raises(self) -> None:
        with pytest.raises(InvalidTokenError):
            decode_token("not.a.jwt")

    def test_decode_tampered_token_raises(self) -> None:
        token = create_access_token(subject="1")
        tampered = token + "abc"
        with pytest.raises(InvalidTokenError):
            decode_token(tampered)

    def test_expired_token_raises(self) -> None:
        token = create_access_token(subject="1", expires_minutes=-1)
        # 既に exp が過去であるため無効
        time.sleep(0.01)
        with pytest.raises(InvalidTokenError):
            decode_token(token)
