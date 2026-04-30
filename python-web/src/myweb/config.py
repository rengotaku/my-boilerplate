"""アプリケーション設定: pydantic-settings で env を解決する."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    """環境変数から読み込まれるアプリ設定."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = Field(default="development")
    log_level: str = Field(default="INFO")
    log_json: bool = Field(default=False)

    database_url: str = Field(
        default=f"sqlite:///{_BASE_DIR / 'myweb.db'}",
    )

    jwt_secret: str = Field(default="dev-secret-change-me-in-production-32+")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expire_minutes: int = Field(default=60 * 24)
    session_cookie_name: str = Field(default="session")


_settings: Settings | None = None


def get_settings() -> Settings:
    """設定インスタンスをシングルトンで返す."""
    global _settings  # noqa: PLW0603
    if _settings is None:
        _settings = Settings()
    return _settings


def reset_settings() -> None:
    """テスト用: 設定キャッシュをリセットする."""
    global _settings  # noqa: PLW0603
    _settings = None
