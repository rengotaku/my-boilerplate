.PHONY: install build lint lint-fix format format-check \
	typecheck test test-watch test-cov check ci clean help

# Default target
.DEFAULT_GOAL := help

PROJECT_NAME := mcp-server

## install: Install dependencies
install:
	npm install

## build: Build TypeScript source files into dist/
build:
	npm run build

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

## typecheck: Type-check without emitting
typecheck:
	npm run typecheck

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

## ci: Run lint + format-check + type-check + test with coverage + build
ci: lint format-check typecheck test-cov build

## clean: Remove build artifacts
clean:
	rm -rf dist node_modules coverage

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
