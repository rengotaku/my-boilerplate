"""User サービス層: 認証ロジック."""

from myweb.auth import create_access_token, hash_password, verify_password
from myweb.models import User
from myweb.repositories.user_repo import UserRepository


class UserAlreadyExistsError(Exception):
    """同じ email でユーザーが既に存在する場合."""


class InvalidCredentialsError(Exception):
    """email / password が一致しない場合."""


class UserService:
    """ユーザー登録・ログインのビジネスロジック."""

    def __init__(self, repo: UserRepository) -> None:
        self._repo = repo

    def _validate(self, email: str, password: str) -> tuple[str, str]:
        email = email.strip().lower()
        if not email or "@" not in email:
            raise ValueError("有効な email を入力してください")
        if len(email) > 255:
            raise ValueError("email は 255 文字以内で入力してください")
        if len(password) < 8:
            raise ValueError("password は 8 文字以上で入力してください")
        if len(password) > 128:
            raise ValueError("password は 128 文字以内で入力してください")
        return email, password

    def register(self, email: str, password: str) -> User:
        """新規ユーザーを登録する."""
        email, password = self._validate(email, password)
        if self._repo.find_by_email(email) is not None:
            raise UserAlreadyExistsError(f"email '{email}' は既に登録されています")
        return self._repo.create(email=email, password_hash=hash_password(password))

    def authenticate(self, email: str, password: str) -> User:
        """email / password を検証してユーザーを返す."""
        email = email.strip().lower()
        user = self._repo.find_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("email または password が不正です")
        if not user.is_active:
            raise InvalidCredentialsError("ユーザーが無効化されています")
        return user

    def issue_token(self, user: User) -> str:
        """ユーザーに対する JWT を発行する."""
        assert user.id is not None
        return create_access_token(
            subject=str(user.id),
            extra_claims={"email": user.email},
        )

    def get_by_id(self, user_id: int) -> User | None:
        """ID でユーザーを取得する."""
        return self._repo.find_by_id(user_id)
