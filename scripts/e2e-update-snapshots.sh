#!/usr/bin/env bash
# Regenerate VRT baselines for e2e/ inside the Playwright container.
#
# Runs the same container image CI uses (mcr.microsoft.com/playwright), so
# pixel output matches CI. Requires Docker. Invoke via `make e2e-update-snapshots`.

set -euo pipefail

IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.58.2-noble}"
GO_VERSION="${GO_VERSION:-1.25.0}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

docker run --rm --ipc=host --network=host \
  -v "${REPO_ROOT}:/work" -w /work \
  -e CI=true \
  -e GO_VERSION="${GO_VERSION}" \
  "${IMAGE}" \
  bash -eu -c '
    echo "--> Installing Go ${GO_VERSION}"
    curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" \
      | tar -xz -C /usr/local
    export PATH="/usr/local/go/bin:${PATH}"
    go version

    echo "--> Installing frontend dependencies"
    (cd react-spa && npm ci)
    (cd react-spa-graphql && npm ci)
    (cd react-spa-cloudflare && npm ci)
    (cd e2e && npm ci)

    echo "--> Regenerating VRT baselines"
    cd e2e
    npx playwright test --update-snapshots --grep @visual
  '
