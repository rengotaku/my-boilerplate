"""CLI entry point."""

import typer

from mypipeline import __version__
from mypipeline.config import get_settings
from mypipeline.logger import configure_logging, get_logger

app = typer.Typer(help="My LLM pipeline tool.")


@app.callback()
def _bootstrap() -> None:
    """Initialize logging from environment-driven settings."""
    settings = get_settings()
    configure_logging(level=settings.log_level, fmt=settings.log_format)


@app.command()
def hello(name: str = typer.Argument(..., help="Name to greet")) -> None:
    """Say hello."""
    get_logger(__name__).info("hello.invoked", name=name)
    typer.echo(f"Hello {name}")


@app.command()
def version() -> None:
    """Show version."""
    typer.echo(f"mypipeline {__version__}")


if __name__ == "__main__":
    app()
