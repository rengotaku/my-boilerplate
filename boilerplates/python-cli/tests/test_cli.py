"""CLI tests."""

from typer.testing import CliRunner

from mycli.cli import app

runner = CliRunner()


def test_hello() -> None:
    """Test hello command."""
    result = runner.invoke(app, ["hello", "World"])
    assert result.exit_code == 0
    assert "Hello World" in result.stdout


def test_version() -> None:
    """Test version command."""
    result = runner.invoke(app, ["version"])
    assert result.exit_code == 0
    assert "mycli" in result.stdout
