.PHONY: install run build preview lint lint-fix format format-check \
	test test-watch test-cov typecheck check ci package clean help

# Default target
.DEFAULT_GOAL := help

PROJECT_NAME := chrome-extension

## install: Install dependencies
install:
	npm install

## run: Start the Vite dev server (HMR for the extension)
run:
	npm run dev

## build: Build the unpacked extension into dist/
build:
	npm run build

## preview: Preview the production build locally
preview:
	npm run preview

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

## package: Zip the built extension in dist/ for upload to the Web Store
package: build
	cd dist && zip -r -FS ../$(PROJECT_NAME).zip . -x '*.map'

## clean: Remove build artifacts
clean:
	rm -rf dist node_modules coverage $(PROJECT_NAME).zip

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
