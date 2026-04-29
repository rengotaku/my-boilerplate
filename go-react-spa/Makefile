.PHONY: install build build-frontend run dev run-server run-frontend start stop status \
	compose compose-clean verify \
	lint lint-frontend lint-fix format format-check \
	test test-frontend test-cov test-watch coverage \
	check ci clean help

.DEFAULT_GOAL := help

BINARY_NAME := server
BIN_DIR := bin
COVERAGE_FILE := coverage.out
PORT ?= 8080
FRONTEND_PORT ?= 5174

# Composite-template config. See .compose.toml for the manifest.
BASE_TEMPLATE_DIR ?= ../react-spa
OVERLAY_DIR := frontend.overlay
FRONTEND_DIR := frontend
COMPOSED_MARKER := $(FRONTEND_DIR)/.composed
PACKAGE_NAME := go-react-spa-frontend

## install: Compose frontend, then install Go modules and frontend deps
install: compose
	go mod download
	cd $(FRONTEND_DIR) && npm ci

## compose: Materialize frontend/ from base template + overlay
compose: $(COMPOSED_MARKER)

$(COMPOSED_MARKER): $(OVERLAY_DIR) $(BASE_TEMPLATE_DIR)
	@if [ ! -d "$(BASE_TEMPLATE_DIR)" ]; then \
		echo "ERROR: base template not found at $(BASE_TEMPLATE_DIR)"; exit 1; \
	fi
	@echo "[compose] base: $(BASE_TEMPLATE_DIR) -> $(FRONTEND_DIR)"
	@rm -rf $(FRONTEND_DIR)
	@mkdir -p $(FRONTEND_DIR)
	@rsync -a \
		--exclude 'node_modules' --exclude 'dist' --exclude 'coverage' \
		--exclude '.claude' --exclude '.git' \
		$(BASE_TEMPLATE_DIR)/ $(FRONTEND_DIR)/
	@echo "[compose] overlay: $(OVERLAY_DIR) -> $(FRONTEND_DIR)"
	@rsync -a $(OVERLAY_DIR)/ $(FRONTEND_DIR)/
	@echo "[compose] post: package.json name -> $(PACKAGE_NAME)"
	@node -e "const f='$(FRONTEND_DIR)/package.json';const fs=require('fs');const p=JSON.parse(fs.readFileSync(f,'utf8'));p.name='$(PACKAGE_NAME)';fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');"
	@touch $(COMPOSED_MARKER)

## compose-clean: Remove composed frontend/ tree
compose-clean:
	rm -rf $(FRONTEND_DIR)

## build-frontend: Build the React SPA into internal/static/dist
build-frontend: compose
	cd $(FRONTEND_DIR) && npm run build
	@touch internal/static/dist/.gitkeep

## build: Build the monolithic binary (frontend + Go embed)
build: build-frontend
	go build -o $(BIN_DIR)/$(BINARY_NAME) ./cmd/server

## run: Run Go (with hot reload via air, -tags dev) + Vite in parallel
run: compose
	$(MAKE) -j2 run-server run-frontend

## dev: Alias for `run` (kept for backward compatibility)
dev: run

## run-server: Run Go server with hot reload (uses -tags dev so embed is bypassed)
run-server:
	air

## run-frontend: Run Vite dev server (proxies /api to Go)
run-frontend:
	cd $(FRONTEND_DIR) && npm run dev

## start: Run the built monolithic binary
start:
	./$(BIN_DIR)/$(BINARY_NAME)

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
lint-frontend: compose
	cd $(FRONTEND_DIR) && npm run lint

## lint-fix: Auto-fix frontend lint issues
lint-fix: compose
	cd $(FRONTEND_DIR) && npm run lint:fix

## format: Format frontend code
format: compose
	cd $(FRONTEND_DIR) && npm run format

## format-check: Check frontend formatting
format-check: compose
	cd $(FRONTEND_DIR) && npm run format:check

## test: Run Go tests
test:
	go test ./...

## test-frontend: Run frontend tests
test-frontend: compose
	cd $(FRONTEND_DIR) && npm run test

## test-cov: Run Go tests with coverage
test-cov:
	go test -coverprofile=$(COVERAGE_FILE) ./...
	go tool cover -func=$(COVERAGE_FILE)

## test-watch: Run frontend tests in watch mode
test-watch: compose
	cd $(FRONTEND_DIR) && npm run test:watch

## coverage: Run frontend tests with coverage
coverage: compose
	cd $(FRONTEND_DIR) && npm run test:coverage

## check: Run all linters and tests (Go + frontend)
check: lint test lint-frontend test-frontend

## ci: Run lint + test (Go uses coverage; frontend uses normal test)
ci: lint test-cov lint-frontend test-frontend

## verify: Smoke-test the scaffold pathway by composing into a temp dir + running ci
verify:
	@tmp=$$(mktemp -d) && \
		echo "[verify] staging into $$tmp" && \
		rsync -a --exclude 'bin' --exclude 'tmp' --exclude '$(FRONTEND_DIR)' \
			--exclude 'internal/static/dist/[!.]*' \
			./ "$$tmp/go-react-spa/" && \
		mkdir -p "$$tmp/react-spa" && \
		rsync -a --exclude 'node_modules' --exclude 'dist' --exclude 'coverage' \
			$(BASE_TEMPLATE_DIR)/ "$$tmp/react-spa/" && \
		$(MAKE) -C "$$tmp/go-react-spa" BASE_TEMPLATE_DIR=../react-spa compose && \
		$(MAKE) -C "$$tmp/go-react-spa" BASE_TEMPLATE_DIR=../react-spa install && \
		$(MAKE) -C "$$tmp/go-react-spa" BASE_TEMPLATE_DIR=../react-spa ci && \
		echo "[verify] ok" && rm -rf "$$tmp"

## clean: Remove all build artifacts and caches (keeps composed frontend)
clean:
	rm -rf $(BIN_DIR)/ $(COVERAGE_FILE)
	@if [ -d $(FRONTEND_DIR) ]; then rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/coverage; fi
	find internal/static/dist -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
