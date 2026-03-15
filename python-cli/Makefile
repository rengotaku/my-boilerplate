.PHONY: install lint typecheck format test test-cov cov-html cov-open run clean clean-all help

## install: Install dependencies with uv
install:
	uv sync --all-extras

## run: Run CLI (usage: make run ARGS="hello World")
run:
	uv run mycli $(ARGS)

## lint: Run ruff linter
lint:
	uv run ruff check .

## typecheck: Run mypy type checking
typecheck:
	uv run mypy src/

## format: Format code with ruff
format:
	uv run ruff format .
	uv run ruff check --fix .

## test: Run tests
test:
	uv run pytest

## test-cov: Run tests with coverage (terminal output)
test-cov:
	uv run pytest --cov=src/mycli --cov-report=term-missing --cov-fail-under=80

## cov-html: Generate HTML coverage report
cov-html:
	uv run pytest --cov=src/mycli --cov-report=html --cov-report=term
	@echo "Coverage report: htmlcov/index.html"

## cov-open: Generate and open HTML coverage report
cov-open: cov-html
	xdg-open htmlcov/index.html 2>/dev/null || open htmlcov/index.html 2>/dev/null || echo "Open htmlcov/index.html in browser"

## clean: Remove build artifacts and cache
clean:
	rm -rf __pycache__ .pytest_cache .ruff_cache .mypy_cache htmlcov .coverage coverage.xml
	rm -rf *.egg-info src/*.egg-info build dist
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

## clean-all: Remove everything including venv
clean-all: clean
	rm -rf .venv

## help: Show this help
help:
	@grep -E '^##' Makefile | sed 's/## //'
