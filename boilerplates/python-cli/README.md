# Python CLI Boilerplate

uv + Typer + ruff + mypy + pytest のPython CLIボイラープレート。

## Features

- **Package Manager**: [uv](https://docs.astral.sh/uv/) (10-100x faster than pip)
- **CLI**: [Typer](https://typer.tiangolo.com/)
- **Config**: [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) (env / `.env` 自動ロード)
- **Logging**: [structlog](https://www.structlog.org/) (console / JSON 切替）
- **Linter**: [ruff](https://docs.astral.sh/ruff/)
- **Type Checker**: [mypy](https://mypy-lang.org/) (strict mode)
- **Testing**: [pytest](https://pytest.org/) + coverage

## Prerequisites

- [uv](https://docs.astral.sh/uv/getting-started/installation/)

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
make install     # Install dependencies with uv
make run         # Run CLI
make lint        # Run ruff
make typecheck   # Run mypy
make format      # Format code
make test        # Run tests
make test-cov    # Run tests with coverage
make check       # Run lint + typecheck
make ci          # Run all checks (lint + typecheck + test-cov)
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
└── README.md
```

## Configuration

環境変数（`.env` も可）で挙動を切り替えられます。プレフィックスは `MYCLI_`。

| 変数 | 既定値 | 値 |
|---|---|---|
| `MYCLI_LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` / `CRITICAL` |
| `MYCLI_LOG_FORMAT` | `console` | `console` / `json` |

```bash
MYCLI_LOG_LEVEL=DEBUG MYCLI_LOG_FORMAT=json uv run mycli hello World
```

## Customization

1. Rename `mycli` to your project name
2. Update `pyproject.toml` (name, description)
3. Update `Makefile` paths
4. Add your commands in `cli.py`

## License

MIT
