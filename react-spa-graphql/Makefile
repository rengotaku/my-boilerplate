.PHONY: install run build preview stop status \
	lint lint-fix format format-check \
	test test-watch test-cov check ci clean \
	codegen codegen-watch help

# Default target
.DEFAULT_GOAL := help

# Variables
PORT ?= 5174

## install: Install npm dependencies
install:
	npm install

## run: Start the local dev server (Vite)
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
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "react-spa-graphql: running (:$(PORT))" || echo "react-spa-graphql: stopped"

## lint: Run ESLint
lint:
	npm run lint

## lint-fix: Auto-fix ESLint issues
lint-fix:
	npm run lint:fix

## format: Format code with Prettier
format:
	npm run format

## format-check: Check formatting with Prettier
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

## ci: Run lint + format-check + test-cov
ci: lint format-check test-cov

## codegen: Generate GraphQL types (requires running backend)
codegen:
	npm run codegen

## codegen-watch: Watch GraphQL operations and regenerate types on change
codegen-watch:
	npm run codegen:watch

## clean: Remove build artifacts, dependencies, and generated GraphQL files
clean:
	rm -rf dist node_modules coverage src/graphql/generated

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
