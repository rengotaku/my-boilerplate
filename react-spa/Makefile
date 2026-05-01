.PHONY: install run build preview stop status lint lint-fix format format-check \
	test test-watch test-cov check ci clean help

# Default target
.DEFAULT_GOAL := help

# Variables
PORT ?= 5173

## install: Install dependencies
install:
	npm install

## run: Start the Vite dev server
run:
	npm run dev

## build: Build the production bundle
build:
	npm run build

## preview: Preview the production build locally
preview:
	npm run preview

## stop: Stop the dev server
stop:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true

## status: Check if the dev server is running
status:
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "react-spa: running (:$(PORT))" || echo "react-spa: stopped"

## lint: Run linter
lint:
	npm run lint

## lint-fix: Auto-fix lint issues
lint-fix:
	npm run lint:fix

## format: Format source files
format:
	npm run format

## format-check: Check formatting without modifying files
format-check:
	npm run format:check

## test: Run tests
test:
	npm run test

## test-watch: Run tests in watch mode
test-watch:
	npm run test:watch

## test-cov: Run tests with coverage
test-cov:
	npm run test:coverage

## check: Run lint + test
check: lint test

## ci: Run lint + format-check + test with coverage + build
ci: lint format-check test-cov build

## clean: Remove build artifacts
clean:
	rm -rf dist node_modules coverage

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
