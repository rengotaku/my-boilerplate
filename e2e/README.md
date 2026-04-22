# E2E Integration Tests

Cross-project E2E tests using Playwright. Covers three layers:

| Layer | File pattern | What it checks |
|-------|--------------|----------------|
| Integration | `<template>/users.spec.ts` | Real API ↔ UI round trips |
| Visual Regression | `<template>/visual.spec.ts` (tagged `@visual`) | Pixel-level diffs per page × viewport |
| Accessibility | `<template>/a11y.spec.ts` (tagged `@a11y`) | WCAG 2.1 AA violations via axe-core |

## Setup

```bash
# From repository root
make e2e-install
```

## Run Tests

```bash
# Starts servers automatically via Playwright webServer config
make e2e

# Subsets
cd e2e && npm run test:visual    # VRT only
cd e2e && npm run test:a11y      # a11y only
```

## Test Suites

| Directory | Description |
|-----------|-------------|
| `react-spa-graphql/` | react-spa-graphql ↔ go-graphql-api |
| `react-spa/` | react-spa ↔ go-rest-api |
| `react-spa-cloudflare/` | react-spa-cloudflare (standalone, no backend) |

## Visual Regression (VRT)

VRT runs each `visual.spec.ts` across three viewports: **mobile (375×667)**, **tablet (768×1024)**, **desktop (1280×800)**. Baselines live under `e2e/<template>/visual.spec.ts-snapshots/` and are committed.

Pixel output depends on the browser + OS + font stack. Both CI and local baseline regeneration run inside the Playwright official container (`mcr.microsoft.com/playwright:v1.58.2-noble`) so snapshots stay reproducible.

### Update baselines after an intentional UI change

```bash
# From repository root. Requires Docker.
make e2e-update-snapshots
```

The script launches the same container CI uses, builds all three SPAs, and regenerates VRT baselines. Commit the resulting `*-snapshots/*.png` files.

The container runs with `--user $(id -u):$(id -g)`, so generated files (snapshots, `node_modules`, `package-lock.json`) are owned by the host user — no `sudo` needed afterwards. If you have leftover root-owned files from before this change, remove them once with `sudo rm -rf` and rerun.

### Inspecting a failure

```bash
make e2e                              # fails with a diff
cd e2e && npx playwright show-report  # opens HTML report with before/after/diff
```

Failed runs in CI upload `e2e/test-results/` and `e2e/playwright-report/` as artifacts.

## Accessibility (a11y)

`a11y.spec.ts` runs `AxeBuilder().withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()` against each page. A violation fails the test; extend ignored rules via `AxeBuilder().disableRules([...])` only after documenting why in the spec.

## Local Development

Tests start backend APIs and Vite preview servers automatically. If servers are already running, they are reused (`reuseExistingServer: true` outside CI).

```bash
cd e2e && npx playwright test --headed          # Run with browser visible
cd e2e && npx playwright test --ui              # Run with Playwright UI
cd e2e && npx playwright test react-spa         # Run a single template
```

## Bumping the Playwright version

Keep these three in sync when upgrading:

1. `e2e/package.json` → `@playwright/test`
2. `.github/workflows/e2e.yml` → `container.image` tag
3. `Makefile` → `PLAYWRIGHT_IMAGE`

Then regenerate VRT baselines with `make e2e-update-snapshots`.
