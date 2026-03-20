.PHONY: install build run lint test test-cov check ci clean generate help

# Default target
.DEFAULT_GOAL := help

# Variables
BINARY_NAME := server
BIN_DIR := bin
COVERAGE_FILE := coverage.out

## install: Download dependencies
install:
	go mod download

## generate: Generate protobuf code using buf
generate:
	buf generate

## build: Build the binary
build:
	go build -o $(BIN_DIR)/$(BINARY_NAME) ./cmd/server

## run: Run the server
run:
	go run ./cmd/server

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
