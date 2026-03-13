# Python CLI Boilerplate

Typer + ruff + mypy + pytest のPython CLIボイラープレート。

## Features

- **CLI**: [Typer](https://typer.tiangolo.com/)
- **Linter**: [ruff](https://docs.astral.sh/ruff/) + pylint
- **Type Checker**: [mypy](https://mypy-lang.org/) (strict mode)
- **Testing**: [pytest](https://pytest.org/) + coverage

## Quick Start

```bash
# Install dependencies
make install

# Run CLI
make run ARGS="hello World"

# Run tests
make test
```

## Commands

```bash
make help        # Show all commands
make install     # Create venv and install dependencies
make run         # Run CLI
make lint        # Run ruff and pylint
make typecheck   # Run mypy
make format      # Format code
make test        # Run tests
make test-cov    # Run tests with coverage
```

## Project Structure

```
python-cli/
├── src/
│   └── mycli/
│       ├── __init__.py
│       └── cli.py
├── tests/
│   └── test_cli.py
├── Makefile
├── pyproject.toml
├── requirements.txt
└── README.md
```

## Customization

1. Rename `mycli` to your project name
2. Update `pyproject.toml` (name, description)
3. Update `Makefile` paths
4. Add your commands in `cli.py`

## License

MIT
