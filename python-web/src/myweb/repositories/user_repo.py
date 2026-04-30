"""User リポジトリ: SQLModel を使った認証用ユーザー操作."""

from sqlmodel import Session, select

from myweb.models import User


class UserRepository:
    """User エンティティの SQLModel リポジトリ."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def find_by_email(self, email: str) -> User | None:
        """email でユーザーを取得する."""
        statement = select(User).where(User.email == email)
        return self._session.exec(statement).first()

    def find_by_id(self, user_id: int) -> User | None:
        """ID でユーザーを取得する."""
        return self._session.get(User, user_id)

    def create(self, email: str, password_hash: str) -> User:
        """ユーザーを作成する."""
        user = User(email=email, password_hash=password_hash)
        self._session.add(user)
        self._session.commit()
        self._session.refresh(user)
        return user
