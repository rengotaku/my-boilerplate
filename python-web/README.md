# myweb

Python Web application with FastAPI + Jinja2 + Alpine.js + Tailwind CSS + SQLite.

## Prerequisites

- Python 3.12+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

## Setup

```bash
make install
```

## Development

```bash
make run
# Open http://localhost:8000
```

`make run` starts uvicorn with `--reload` and a parallel Tailwind CSS watcher.

## Testing

```bash
make test        # Run tests
make test-cov    # Run tests with coverage
make ci          # Run lint + typecheck + test-cov
```

## Production

```bash
make build       # Build production assets (Tailwind CSS minified)
make start       # Start the production server (no reload)
```

## Project Structure

```
src/myweb/
├── app.py               # FastAPI application
├── database.py           # SQLite connection
├── routes/
│   └── items.py          # Item CRUD routes
├── services/
│   └── item_service.py   # Business logic
└── repositories/
    └── item_repo.py      # Data access
templates/                # Jinja2 templates
static/                   # Static assets (CSS, JS)
tests/                    # Test suite
```

## Available Commands

Run `make help` to see all available targets.
