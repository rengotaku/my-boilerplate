.PHONY: install build build-frontend compose-ui run run-binary run-server run-frontend stop status \
  lint lint-frontend lint-fix format format-check \
  test test-frontend test-cov test-watch coverage \
  check ci clean help

.DEFAULT_GOAL := help

BINARY_NAME := server
BIN_DIR := bin
COVERAGE_FILE := coverage.out
PORT ?= 8084
FRONTEND_PORT ?= 5175
FRONTEND_DIR := frontend

# shared-react-ui: composed in-place from the sibling repo dir during local dev.
# Outside the monorepo (after scaffold) the source dir is absent and the
# compose-ui target becomes a no-op, so the scaffolded project keeps working.
SHARED_UI_SRC := ../shared-react-ui/src/ui
SHARED_UI_DEST := $(FRONTEND_DIR)/src/components/ui
SHARED_ADMIN_SRC := ../shared-react-ui/src/admin
SHARED_ADMIN_DEST := $(FRONTEND_DIR)/src/components/admin

## compose-ui: Materialize frontend/src/components/{ui,admin}/ from ../shared-react-ui/ (no-op outside monorepo)
compose-ui:
	@if [ -d "$(SHARED_UI_SRC)" ]; then \
	  echo "[compose-ui] $(SHARED_UI_SRC) -> $(SHARED_UI_DEST) (excl. *.stories.tsx)"; \
	  mkdir -p $(SHARED_UI_DEST); \
	  rsync -a --exclude='*.stories.tsx' $(SHARED_UI_SRC)/ $(SHARED_UI_DEST)/; \
	fi
	@if [ -d "$(SHARED_ADMIN_SRC)" ]; then \
	  echo "[compose-ui] $(SHARED_ADMIN_SRC) -> $(SHARED_ADMIN_DEST) (excl. *.stories.tsx)"; \
	  mkdir -p $(SHARED_ADMIN_DEST); \
	  rsync -a --exclude='*.stories.tsx' $(SHARED_ADMIN_SRC)/ $(SHARED_ADMIN_DEST)/; \
	fi

## install: Install Go modules and frontend deps
install: compose-ui
	go mod download
	@if [ -d $(FRONTEND_DIR) ]; then cd $(FRONTEND_DIR) && npm ci; fi

## build-frontend: Build the React admin console into internal/static/dist
build-frontend: compose-ui
	@if [ -d $(FRONTEND_DIR) ]; then \
	  cd $(FRONTEND_DIR) && npm run build; \
	else \
	  echo "[build-frontend] no frontend/ yet; skipping"; \
	fi
	@touch internal/static/dist/.gitkeep

## build: Build the single binary (worker + web, SPA embedded)
build: build-frontend
	go build -o $(BIN_DIR)/$(BINARY_NAME) ./cmd/server

## run: Run Go (hot reload via air, -tags dev) + Vite in parallel
run:
	$(MAKE) -j2 run-server run-frontend

## run-server: Run the Go process with hot reload (-tags dev bypasses embed)
run-server:
	air

## run-frontend: Run the Vite dev server (proxies /api to Go)
run-frontend:
	@if [ -d $(FRONTEND_DIR) ]; then cd $(FRONTEND_DIR) && npm run dev; else echo "no frontend/ yet"; fi

## run-binary: Run the built single binary (no hot reload)
run-binary:
	./$(BIN_DIR)/$(BINARY_NAME)

## stop: Stop both the Go and Vite dev servers
stop:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true
	@lsof -ti :$(FRONTEND_PORT) | xargs kill 2>/dev/null || true

## status: Check whether the dev servers are running
status:
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "go-react-admin (Go): running (:$(PORT))" || echo "go-react-admin (Go): stopped"
	@lsof -i :$(FRONTEND_PORT) >/dev/null 2>&1 && echo "go-react-admin (Vite): running (:$(FRONTEND_PORT))" || echo "go-react-admin (Vite): stopped"

## lint: Run golangci-lint
lint:
	golangci-lint run

## lint-frontend: Run the frontend linter
lint-frontend: compose-ui
	@if [ -d $(FRONTEND_DIR) ]; then cd $(FRONTEND_DIR) && npm run lint; else echo "no frontend/ yet"; fi

## lint-fix: Auto-fix frontend lint issues
lint-fix:
	@if [ -d $(FRONTEND_DIR) ]; then cd $(FRONTEND_DIR) && npm run lint:fix; else echo "no frontend/ yet"; fi

## format: Format frontend code
format:
	@if [ -d $(FRONTEND_DIR) ]; then cd $(FRONTEND_DIR) && npm run format; else echo "no frontend/ yet"; fi

## format-check: Check frontend formatting
format-check: compose-ui
	@if [ -d $(FRONTEND_DIR) ]; then cd $(FRONTEND_DIR) && npm run format:check; else echo "no frontend/ yet"; fi

## test: Run Go tests
test:
	go test ./...

## test-frontend: Run frontend tests
test-frontend: compose-ui
	@if [ -d $(FRONTEND_DIR) ]; then cd $(FRONTEND_DIR) && npm run test; else echo "no frontend/ yet"; fi

## test-cov: Run Go tests with coverage
test-cov:
	go test -coverprofile=$(COVERAGE_FILE) ./...
	go tool cover -func=$(COVERAGE_FILE) | tail -1

## test-watch: Run frontend tests in watch mode
test-watch:
	@if [ -d $(FRONTEND_DIR) ]; then cd $(FRONTEND_DIR) && npm run test:watch; else echo "no frontend/ yet"; fi

## coverage: Run frontend tests with coverage
coverage:
	@if [ -d $(FRONTEND_DIR) ]; then cd $(FRONTEND_DIR) && npm run test:coverage; else echo "no frontend/ yet"; fi

## check: Run all linters and tests (Go + frontend)
check: lint test lint-frontend test-frontend

## ci: Run lint + test (Go uses coverage; frontend uses normal test)
ci: lint test-cov lint-frontend test-frontend

## clean: Remove build artifacts and caches
clean:
	rm -rf $(BIN_DIR)/ $(COVERAGE_FILE) *.db data/
	@if [ -d $(FRONTEND_DIR) ]; then rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/coverage; fi
	find internal/static/dist -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
