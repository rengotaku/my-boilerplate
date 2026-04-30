"""Logger configuration tests."""

import json
import logging

import pytest
import structlog

from mycli.logger import configure_logging, get_logger


@pytest.fixture(autouse=True)
def _reset_structlog() -> None:
    """Restore structlog defaults after each test."""
    yield
    structlog.reset_defaults()


def test_configure_sets_root_level() -> None:
    """`configure_logging` updates the stdlib root logger level."""
    configure_logging(level="DEBUG", fmt="console")
    assert logging.getLogger().level == logging.DEBUG


def test_json_renderer_emits_valid_json(
    capsys: pytest.CaptureFixture[str],
) -> None:
    """JSON format produces machine-parseable output with bound fields."""
    configure_logging(level="INFO", fmt="json")

    get_logger("test").info("event.fired", item="x")

    line = capsys.readouterr().err.strip().splitlines()[-1]
    payload = json.loads(line)

    assert payload["event"] == "event.fired"
    assert payload["item"] == "x"
    assert payload["level"] == "info"


def test_console_renderer_writes_human_output(
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Console format writes the event message in plain text."""
    configure_logging(level="INFO", fmt="console")

    get_logger().info("event.fired", item="x")

    err = capsys.readouterr().err
    assert "event.fired" in err


def test_get_logger_named_vs_default() -> None:
    """`get_logger` accepts an optional name."""
    configure_logging(level="INFO", fmt="console")
    assert get_logger("named") is not None
    assert get_logger() is not None
