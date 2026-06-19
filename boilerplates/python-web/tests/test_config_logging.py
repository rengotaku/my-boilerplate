"""config / logging_config モジュールのテスト."""

import logging

from _pytest.logging import LogCaptureFixture
from _pytest.monkeypatch import MonkeyPatch

from myweb.config import Settings, get_settings, reset_settings
from myweb.logging_config import configure_logging, get_logger


class TestSettings:
    def test_defaults(self) -> None:
        s = Settings()
        assert s.app_env == "development"
        assert s.log_level == "INFO"
        assert s.jwt_algorithm == "HS256"
        assert "sqlite" in s.database_url

    def test_env_override(self, monkeypatch: MonkeyPatch) -> None:
        monkeypatch.setenv("APP_ENV", "production")
        monkeypatch.setenv("JWT_SECRET", "from-env")
        s = Settings()
        assert s.app_env == "production"
        assert s.jwt_secret == "from-env"

    def test_get_settings_singleton(self) -> None:
        reset_settings()
        a = get_settings()
        b = get_settings()
        assert a is b
        reset_settings()


class TestLogging:
    def test_configure_logging_does_not_raise(self) -> None:
        configure_logging()
        logger = get_logger("test")
        bound = logger.bind()
        assert hasattr(bound, "info")
        assert callable(bound.info)

    def test_logger_can_log(self, caplog: LogCaptureFixture) -> None:
        configure_logging()
        with caplog.at_level(logging.INFO):
            get_logger("myweb.test").info("hello", key="value")
