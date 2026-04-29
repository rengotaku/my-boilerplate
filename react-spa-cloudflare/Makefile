.PHONY: install build run dev preview stop status \
	lint lint-fix format format-check \
	test test-watch test-cov test-coverage coverage \
	check ci clean \
	pages-create pages-login deploy deploy-preview \
	help

# Default target
.DEFAULT_GOAL := help

# Variables
PORT ?= 5173
PROJECT_NAME := react-spa-cloudflare

## install: Install dependencies
install:
	npm install

## build: Build for production
build:
	npm run build

## run: Start development server (Vite)
run:
	npm run dev

## dev: Alias for `run` (kept for backward compatibility)
dev: run

## preview: Preview production build
preview:
	npm run preview

## stop: Stop the dev server
stop:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true

## status: Check if dev server is running
status:
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "react-spa: running (:$(PORT))" || echo "react-spa: stopped"

## lint: Run ESLint
lint:
	npm run lint

## lint-fix: Auto-fix lint issues
lint-fix:
	npm run lint:fix

## format: Format with Prettier
format:
	npm run format

## format-check: Check formatting
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

## test-coverage: Alias for `test-cov` (kept for backward compatibility)
test-coverage: test-cov

## coverage: Alias for `test-cov`
coverage: test-cov

## check: Run lint + format-check + test
check: lint format-check test

## ci: Run lint + format-check + test-cov
ci: lint format-check test-cov

## clean: Remove build artifacts
clean:
	rm -rf dist node_modules coverage

## pages-login: Login to Cloudflare via wrangler (run once)
pages-login:
	npx wrangler login

## pages-create: Create the Cloudflare Pages project (run once)
pages-create:
	npx wrangler pages project create $(PROJECT_NAME) --production-branch=main

## deploy: Build and deploy to Cloudflare Pages production
deploy:
	npm run build
	npx wrangler pages deploy dist --project-name=$(PROJECT_NAME)

## deploy-preview: Build and deploy to Cloudflare Pages preview branch
deploy-preview:
	npm run build
	npx wrangler pages deploy dist --project-name=$(PROJECT_NAME) --branch=preview

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
