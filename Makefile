.PHONY: stop-all status help

# Server projects (excludes CLI tools)
SERVERS := go-rest-api go-graphql-api go-grpc-api go-ssr-web react-spa

## stop-all: Stop all dev servers
stop-all:
	@for svc in $(SERVERS); do $(MAKE) -s -C $$svc stop 2>/dev/null || true; done
	@echo "All servers stopped"

## status: Check all dev servers
status:
	@for svc in $(SERVERS); do $(MAKE) -s -C $$svc status 2>/dev/null || true; done

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
