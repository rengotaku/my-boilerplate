.PHONY: install build run start stop status lint test test-cov check ci clean generate help

# Default target
.DEFAULT_GOAL := help

# Variables
BINARY_NAME := server
BIN_DIR := bin
COVERAGE_FILE := coverage.out
PORT ?= 50051

## install: Download dependencies and dev tools (air for hot reload)
install:
	go mod download
	go install github.com/air-verse/air@latest

## generate: Generate protobuf code using buf
generate:
	buf generate

## build: Build the binary
build:
	go build -o $(BIN_DIR)/$(BINARY_NAME) ./cmd/server

## run: Start the local dev server with hot reload (requires air; installed by `make install`)
run:
	air

## start: Run the server once without hot reload (no air)
start:
	go run ./cmd/server

## stop: Stop the server
stop:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true

## status: Check if server is running
status:
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "go-grpc-api: running (:$(PORT))" || echo "go-grpc-api: stopped"

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
