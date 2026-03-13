.PHONY: install lint typecheck format test test-cov cov-html cov-open run clean clean-all help

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

## install: Create venv and install dependencies
install:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

## run: Run CLI (usage: make run ARGS="hello World")
run:
	PYTHONPATH=src $(PYTHON) -m mycli.cli $(ARGS)

## lint: Run ruff and pylint
lint:
	$(VENV)/bin/ruff check .
	$(VENV)/bin/pylint src/ --fail-under=8.0 || true

## typecheck: Run mypy type checking
typecheck:
	$(VENV)/bin/mypy src/

## format: Format code with ruff
format:
	$(VENV)/bin/ruff format .
	$(VENV)/bin/ruff check --fix .

## test: Run tests
test:
	PYTHONPATH=src $(VENV)/bin/pytest

## test-cov: Run tests with coverage (terminal output)
test-cov:
	PYTHONPATH=src $(VENV)/bin/pytest --cov=src/mycli --cov-report=term-missing --cov-fail-under=80

## cov-html: Generate HTML coverage report
cov-html:
	PYTHONPATH=src $(VENV)/bin/pytest --cov=src/mycli --cov-report=html --cov-report=term
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
	rm -rf $(VENV)

## help: Show this help
help:
	@grep -E '^##' Makefile | sed 's/## //'
