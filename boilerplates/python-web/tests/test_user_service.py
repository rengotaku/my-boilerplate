"""user_service / user_repo の統合テスト."""

import pytest
from sqlmodel import Session

from myweb.auth import decode_token
from myweb.repositories.user_repo import UserRepository
from myweb.services.user_service import (
    InvalidCredentialsError,
    UserAlreadyExistsError,
    UserService,
)


@pytest.fixture
def service(session: Session) -> UserService:
    return UserService(UserRepository(session))


class TestUserRegister:
    def test_register_creates_user(self, service: UserService) -> None:
        user = service.register(email="alice@example.com", password="strongpass1")
        assert user.id is not None
        assert user.email == "alice@example.com"
        assert user.password_hash != "strongpass1"

    def test_register_duplicate_raises(self, service: UserService) -> None:
        service.register(email="dup@example.com", password="strongpass1")
        with pytest.raises(UserAlreadyExistsError):
            service.register(email="dup@example.com", password="strongpass2")

    def test_register_invalid_email_raises(self, service: UserService) -> None:
        with pytest.raises(ValueError, match="email"):
            service.register(email="invalid", password="strongpass1")

    def test_register_short_password_raises(self, service: UserService) -> None:
        with pytest.raises(ValueError, match="password"):
            service.register(email="ok@example.com", password="short")

    def test_register_normalizes_email(self, service: UserService) -> None:
        user = service.register(email="  Mixed@Example.com ", password="strongpass1")
        assert user.email == "mixed@example.com"


class TestUserAuthenticate:
    def test_authenticate_success(self, service: UserService) -> None:
        service.register(email="bob@example.com", password="strongpass1")
        user = service.authenticate(email="bob@example.com", password="strongpass1")
        assert user.email == "bob@example.com"

    def test_authenticate_wrong_password(self, service: UserService) -> None:
        service.register(email="bob@example.com", password="strongpass1")
        with pytest.raises(InvalidCredentialsError):
            service.authenticate(email="bob@example.com", password="wrong")

    def test_authenticate_unknown_user(self, service: UserService) -> None:
        with pytest.raises(InvalidCredentialsError):
            service.authenticate(email="ghost@example.com", password="anything1")

    def test_issue_token_round_trip(self, service: UserService) -> None:
        user = service.register(email="carol@example.com", password="strongpass1")
        token = service.issue_token(user)
        payload = decode_token(token)
        assert payload["sub"] == str(user.id)
        assert payload["email"] == "carol@example.com"

    def test_get_by_id(self, service: UserService) -> None:
        user = service.register(email="dan@example.com", password="strongpass1")
        assert user.id is not None
        fetched = service.get_by_id(user.id)
        assert fetched is not None
        assert fetched.email == "dan@example.com"
