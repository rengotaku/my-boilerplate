"""Settings tests."""

import pytest

from mypipeline.config import Settings, get_settings


def test_defaults(monkeypatch: pytest.MonkeyPatch, tmp_path) -> None:
    """Defaults apply when no env vars or .env are present."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("MYPIPELINE_LOG_LEVEL", raising=False)
    monkeypatch.delenv("MYPIPELINE_LOG_FORMAT", raising=False)

    settings = get_settings()

    assert settings.log_level == "INFO"
    assert settings.log_format == "console"


def test_env_overrides(monkeypatch: pytest.MonkeyPatch, tmp_path) -> None:
    """Environment variables override defaults via the MYPIPELINE_ prefix."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("MYPIPELINE_LOG_LEVEL", "DEBUG")
    monkeypatch.setenv("MYPIPELINE_LOG_FORMAT", "json")

    settings = Settings()

    assert settings.log_level == "DEBUG"
    assert settings.log_format == "json"


def test_invalid_level_rejected(
    monkeypatch: pytest.MonkeyPatch, tmp_path
) -> None:
    """Unknown log levels raise a validation error."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("MYPIPELINE_LOG_LEVEL", "TRACE")

    with pytest.raises(ValueError):
        Settings()
