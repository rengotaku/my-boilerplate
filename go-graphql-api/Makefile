.PHONY: install build run run-bare stop status lint test test-cov check ci generate migrate migrate-diff migrate-apply migrate-hash clean help

# Default target
.DEFAULT_GOAL := help

# Variables
BINARY_NAME := server
BIN_DIR := bin
COVERAGE_FILE := coverage.out
PORT ?= 8080

## install: Download dependencies and dev tools
install:
	go mod download
	go install github.com/air-verse/air@latest

## build: Build the binary
build:
	go build -o $(BIN_DIR)/$(BINARY_NAME) ./cmd/server

## run: Run the server with hot reload (requires air; installed by `make install`)
run:
	air

## run-bare: Run the server without hot reload
run-bare:
	go run ./cmd/server

## stop: Stop the server
stop:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true

## status: Check if server is running
status:
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "go-graphql-api: running (:$(PORT))" || echo "go-graphql-api: stopped"

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

## generate: Generate GraphQL code (requires gqlgen)
generate:
	go run github.com/99designs/gqlgen generate

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
