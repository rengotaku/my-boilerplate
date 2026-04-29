.PHONY: install run build preview stop status \
	lint lint-fix format format-check \
	test test-watch test-cov check ci clean \
	pages-create pages-login deploy deploy-preview help

# Default target
.DEFAULT_GOAL := help

# Variables
PORT ?= 5173
PROJECT_NAME := react-spa-cloudflare

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
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "react-spa: running (:$(PORT))" || echo "react-spa: stopped"

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

## clean: Remove build artifacts and dependencies
clean:
	rm -rf dist node_modules coverage

## pages-login: Login to Cloudflare via Wrangler (one-time)
pages-login:
	npx wrangler login

## pages-create: Create the Cloudflare Pages project (one-time)
pages-create:
	npx wrangler pages project create $(PROJECT_NAME) --production-branch=main

## deploy: Build and deploy to Cloudflare Pages (production)
deploy:
	npm run build
	npx wrangler pages deploy dist --project-name=$(PROJECT_NAME)

## deploy-preview: Build and deploy a preview branch to Cloudflare Pages
deploy-preview:
	npm run build
	npx wrangler pages deploy dist --project-name=$(PROJECT_NAME) --branch=preview

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
