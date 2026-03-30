# E2E Integration Tests

Cross-project E2E tests using Playwright.

## Setup

```bash
# From repository root
make e2e-install
```

## Run Tests

```bash
# Starts servers automatically via Playwright webServer config
make e2e
```

## Test Suites

| Directory | Description |
|-----------|-------------|
| `react-spa-graphql/` | react-spa-graphql ↔ go-graphql-api integration |
| `react-spa/` | react-spa ↔ go-rest-api integration |

## Local Development

Tests start Go API (port 8080) and React SPA preview (port 4173) automatically.
If servers are already running, they will be reused (`reuseExistingServer: true` in non-CI).

```bash
# Run with browser visible
cd e2e && npx playwright test --headed

# Run with Playwright UI
cd e2e && npx playwright test --ui
```
