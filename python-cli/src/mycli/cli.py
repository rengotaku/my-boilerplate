"""CLI entry point."""

import typer

from mycli import __version__

app = typer.Typer(help="My CLI tool.")


@app.command()
def hello(name: str = typer.Argument(..., help="Name to greet")) -> None:
    """Say hello."""
    typer.echo(f"Hello {name}")


@app.command()
def version() -> None:
    """Show version."""
    typer.echo(f"mycli {__version__}")


if __name__ == "__main__":
    app()
