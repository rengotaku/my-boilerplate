.PHONY: install build run stop status lint test test-cov check ci clean tailwind-install tailwind-build migrate migrate-diff migrate-apply migrate-hash help

# Default target
.DEFAULT_GOAL := help

# Variables
BIN_DIR := bin
COVERAGE_FILE := coverage.out
PORT ?= 8082
TAILWIND_VERSION ?= v4.1.5
TAILWIND_BIN := $(BIN_DIR)/tailwindcss

# Auto-discover entry points under cmd/<name>/. Adding cmd/foo/main.go is
# sufficient — `make build` will produce bin/foo without further edits.
CMDS := $(notdir $(wildcard cmd/*))
BINARIES := $(addprefix $(BIN_DIR)/,$(CMDS))
.PHONY: $(BINARIES)

## install: Download dependencies
install:
	go mod download

## tailwind-install: Download Tailwind CSS v4 standalone CLI (idempotent)
tailwind-install:
	@if [ -f $(TAILWIND_BIN) ]; then \
		echo "tailwindcss already installed at $(TAILWIND_BIN)"; \
	else \
		mkdir -p $(BIN_DIR); \
		echo "Downloading Tailwind CSS CLI $(TAILWIND_VERSION)..."; \
		curl -sL "https://github.com/tailwindlabs/tailwindcss/releases/download/$(TAILWIND_VERSION)/tailwindcss-linux-x64" \
			-o $(TAILWIND_BIN); \
		chmod +x $(TAILWIND_BIN); \
		echo "tailwindcss installed at $(TAILWIND_BIN)"; \
	fi

## tailwind-build: Build Tailwind CSS output (requires tailwind-install)
tailwind-build: tailwind-install
	$(TAILWIND_BIN) -i web/static/css/input.css -o web/static/css/output.css --minify

## build: Build all cmd/* binaries and Tailwind CSS
build: tailwind-build $(BINARIES)

# Static pattern rule restricted to $(BINARIES) so it can't accidentally match
# other files under bin/ (e.g. bin/tailwindcss, which is fetched by curl).
$(BINARIES): $(BIN_DIR)/%:
	@mkdir -p $(BIN_DIR)
	go build -o $@ ./cmd/$*

## run: Run the server (Tailwind CSS をビルドしてから起動)
run: tailwind-build
	go run ./cmd/server

## stop: Stop the server
stop:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true

## status: Check if server is running
status:
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "go-ssr-web: running (:$(PORT))" || echo "go-ssr-web: stopped"

## lint: Run golangci-lint
lint:
	golangci-lint run

## test: Run tests
test:
	go test ./...

## test-cov: Run tests with coverage
test-cov:
	go test -coverprofile=$(COVERAGE_FILE) ./...
	go tool cover -func=$(COVERAGE_FILE)

## check: Run lint + test
check: lint test

## ci: Run lint + test with coverage
ci: lint test-cov

## migrate: Apply migrations via GORM AutoMigrate (no atlas required)
migrate:
	go run ./cmd/migrate

## migrate-diff: Generate a new migration (requires atlas CLI)
migrate-diff:
	atlas migrate diff --env local

## migrate-apply: Apply pending migrations (requires atlas CLI)
migrate-apply:
	atlas migrate apply --env local

## migrate-hash: Rehash the migration directory (requires atlas CLI)
migrate-hash:
	atlas migrate hash --env local

## clean: Remove build artifacts
clean:
	rm -rf $(BIN_DIR)/ $(COVERAGE_FILE) app.db

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
