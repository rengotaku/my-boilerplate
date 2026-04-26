.PHONY: install build run stop status lint test test-cov check ci clean tailwind-install tailwind-build help

# Default target
.DEFAULT_GOAL := help

# Variables
BINARY_NAME := server
BIN_DIR := bin
COVERAGE_FILE := coverage.out
PORT ?= 8082
TAILWIND_VERSION ?= v4.1.5
TAILWIND_BIN := $(BIN_DIR)/tailwindcss

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

## build: Build the binary and Tailwind CSS
build: tailwind-build
	go build -o $(BIN_DIR)/$(BINARY_NAME) ./cmd/server

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

## clean: Remove build artifacts
clean:
	rm -rf $(BIN_DIR)/ $(COVERAGE_FILE)

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
