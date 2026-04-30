"""Application settings loaded from environment variables."""

from __future__ import annotations

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
LogFormat = Literal["console", "json"]


class Settings(BaseSettings):
    """CLI runtime settings.

    Environment variables are prefixed with `MYCLI_`. A `.env` file in the
    current working directory is also loaded when present.
    """

    model_config = SettingsConfigDict(
        env_prefix="MYCLI_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    log_level: LogLevel = "INFO"
    log_format: LogFormat = "console"


def get_settings() -> Settings:
    """Return a fresh `Settings` instance reading the current environment."""
    return Settings()
