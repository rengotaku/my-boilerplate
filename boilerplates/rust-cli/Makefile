.PHONY: install build run lint test test-cov check ci clean help

# Default target
.DEFAULT_GOAL := help

# Variables
BINARY_NAME := mycli
BIN_DIR := target/release

## install: Install dependencies (build in debug mode)
install:
	cargo build

## build: Build the release binary
build:
	cargo build --release

## run: Run the CLI (use ARGS="..." to pass arguments)
run:
	cargo run -- $(ARGS)

## lint: Run clippy and check formatting
lint:
	cargo clippy -- -D warnings
	cargo fmt --check

## test: Run tests
test:
	cargo test

## test-cov: Run tests with coverage (requires cargo-tarpaulin)
test-cov:
	cargo tarpaulin --out Stdout --skip-clean

## check: Run lint + test
check: lint test

## ci: Run lint + test with coverage
ci: lint test-cov

## clean: Remove build artifacts
clean:
	cargo clean

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
