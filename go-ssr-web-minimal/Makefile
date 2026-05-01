.PHONY: install build run stop status lint test test-cov check ci clean help

# Default target
.DEFAULT_GOAL := help

# Variables
BIN_DIR := bin
COVERAGE_FILE := coverage.out
PORT ?= 8083

# Auto-discover entry points under cmd/<name>/. Adding cmd/foo/main.go is
# sufficient — `make build` will produce bin/foo without further edits.
CMDS := $(notdir $(wildcard cmd/*))
BINARIES := $(addprefix $(BIN_DIR)/,$(CMDS))
.PHONY: $(BINARIES)

## install: Download dependencies
install:
	go mod download

## build: Build all cmd/* binaries
build: $(BINARIES)

# Static pattern rule restricted to $(BINARIES) so it only matches discovered
# cmd/* entry points, not any other file that may live under bin/.
$(BINARIES): $(BIN_DIR)/%:
	@mkdir -p $(BIN_DIR)
	go build -o $@ ./cmd/$*

## run: Run the server
run:
	go run ./cmd/server

## stop: Stop the server
stop:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true

## status: Check if server is running
status:
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "go-ssr-web-minimal: running (:$(PORT))" || echo "go-ssr-web-minimal: stopped"

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
