.PHONY: stop-all status e2e e2e-install e2e-update-snapshots scaffold help

# Keep in sync with @playwright/test version in e2e/package-lock.json
# and the container image tag in .github/workflows/e2e.yml.
PLAYWRIGHT_IMAGE := mcr.microsoft.com/playwright:v1.58.2-noble

# Server projects (excludes CLI tools)
SERVERS := go-rest-api go-graphql-api go-grpc-api go-ssr-web react-spa

## stop-all: Stop all dev servers
stop-all:
	@for svc in $(SERVERS); do $(MAKE) -s -C $$svc stop 2>/dev/null || true; done
	@echo "All servers stopped"

## status: Check all dev servers
status:
	@for svc in $(SERVERS); do $(MAKE) -s -C $$svc status 2>/dev/null || true; done

## e2e-install: Install E2E test dependencies and browsers
e2e-install:
	cd e2e && npm install && npx playwright install chromium

## e2e: Run E2E integration tests (starts servers automatically)
e2e:
	cd e2e && npx playwright test

## e2e-update-snapshots: Regenerate VRT baselines inside the Playwright container (matches CI pixels)
e2e-update-snapshots:
	PLAYWRIGHT_IMAGE=$(PLAYWRIGHT_IMAGE) ./scripts/e2e-update-snapshots.sh

## scaffold: Generate standalone project from template (template= dest= name= [module=])
scaffold:
	@bash scripts/scaffold/scaffold.sh \
		template='$(template)' dest='$(dest)' name='$(name)' module='$(module)'

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
