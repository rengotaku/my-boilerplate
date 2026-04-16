.PHONY: install dev lint typecheck format test test-cov check ci build run clean clean-all help

# Default target
.DEFAULT_GOAL := help

# Variables
PORT ?= 8000

## install: Install Python and Node.js dependencies
install:
	uv sync --all-extras
	npm install

## dev: Start development server (uvicorn reload + Tailwind watch)
dev: _build-assets
	@echo "Starting Tailwind CSS watch + uvicorn dev server..."
	npx @tailwindcss/cli -i static/css/input.css -o static/css/style.css --watch &
	uv run uvicorn myweb.app:app --reload --host 0.0.0.0 --port $(PORT)

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
test: _build-assets
	uv run pytest

## test-cov: Run tests with coverage
test-cov: _build-assets
	uv run pytest --cov=src/myweb --cov-report=term-missing

## check: Run lint + typecheck
check: lint typecheck

## ci: Run all checks (lint + typecheck + test-cov)
ci: lint typecheck test-cov

## build: Build production assets (Tailwind CSS minify)
build: _copy-alpine
	npx @tailwindcss/cli -i static/css/input.css -o static/css/style.css --minify

## run: Run production server
run: build
	uv run uvicorn myweb.app:app --host 0.0.0.0 --port $(PORT) --no-reload

## clean: Remove build artifacts and cache
clean:
	rm -rf __pycache__ .pytest_cache .ruff_cache .mypy_cache .coverage coverage.xml
	rm -rf *.egg-info src/*.egg-info build dist
	rm -f static/css/style.css static/js/alpine.js
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

## clean-all: Remove everything including venv and node_modules
clean-all: clean
	rm -rf .venv node_modules

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'

# Internal targets
_copy-alpine:
	@mkdir -p static/js
	@if [ -f node_modules/alpinejs/dist/cdn.min.js ]; then \
		cp node_modules/alpinejs/dist/cdn.min.js static/js/alpine.js; \
	else \
		echo "Warning: node_modules not found, skipping Alpine.js copy (run 'npm install' first)"; \
	fi

_build-assets: _copy-alpine
	@if command -v npx >/dev/null 2>&1 && [ -d node_modules ]; then \
		npx @tailwindcss/cli -i static/css/input.css -o static/css/style.css; \
	else \
		echo "Warning: npx/node_modules not found, skipping Tailwind CSS build (run 'npm install' first)"; \
	fi
