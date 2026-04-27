.PHONY: install build build-frontend run dev dev-server dev-frontend stop status \
	lint lint-frontend lint-fix format format-check \
	test test-frontend test-cov test-watch coverage \
	check ci clean help

.DEFAULT_GOAL := help

BINARY_NAME := server
BIN_DIR := bin
COVERAGE_FILE := coverage.out
PORT ?= 8080
FRONTEND_PORT ?= 5174

## install: Install Go modules and frontend deps
install:
	go mod download
	cd frontend && npm ci

## build-frontend: Build the React SPA into internal/static/dist
build-frontend:
	cd frontend && npm run build

## build: Build the monolithic binary (frontend + Go embed)
build: build-frontend
	go build -o $(BIN_DIR)/$(BINARY_NAME) ./cmd/server

## run: Run the built monolithic binary
run:
	./$(BIN_DIR)/$(BINARY_NAME)

## dev: Run Go (with hot reload via air, -tags dev) + Vite in parallel
dev:
	$(MAKE) -j2 dev-server dev-frontend

## dev-server: Run Go server with hot reload (uses -tags dev so embed is bypassed)
dev-server:
	air

## dev-frontend: Run Vite dev server (proxies /api to Go)
dev-frontend:
	cd frontend && npm run dev

## stop: Stop both Go and Vite dev servers
stop:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true
	@lsof -ti :$(FRONTEND_PORT) | xargs kill 2>/dev/null || true

## status: Check whether dev servers are running
status:
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "go-react-spa (Go): running (:$(PORT))" || echo "go-react-spa (Go): stopped"
	@lsof -i :$(FRONTEND_PORT) >/dev/null 2>&1 && echo "go-react-spa (Vite): running (:$(FRONTEND_PORT))" || echo "go-react-spa (Vite): stopped"

## lint: Run golangci-lint
lint:
	golangci-lint run

## lint-frontend: Run frontend linter
lint-frontend:
	cd frontend && npm run lint

## lint-fix: Auto-fix frontend lint issues
lint-fix:
	cd frontend && npm run lint:fix

## format: Format frontend code
format:
	cd frontend && npm run format

## format-check: Check frontend formatting
format-check:
	cd frontend && npm run format:check

## test: Run Go tests
test:
	go test ./...

## test-frontend: Run frontend tests
test-frontend:
	cd frontend && npm run test

## test-cov: Run Go tests with coverage
test-cov:
	go test -coverprofile=$(COVERAGE_FILE) ./...
	go tool cover -func=$(COVERAGE_FILE)

## test-watch: Run frontend tests in watch mode
test-watch:
	cd frontend && npm run test:watch

## coverage: Run frontend tests with coverage
coverage:
	cd frontend && npm run test:coverage

## check: Run all linters and tests (Go + frontend)
check: lint test lint-frontend test-frontend

## ci: Run lint + test (Go uses coverage; frontend uses normal test)
ci: lint test-cov lint-frontend test-frontend

## clean: Remove all build artifacts and caches
clean:
	rm -rf $(BIN_DIR)/ $(COVERAGE_FILE) frontend/node_modules frontend/coverage
	find internal/static/dist -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
