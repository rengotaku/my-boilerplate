#!/bin/sh
# Build Tailwind CSS then start the Go server.
#
# Used by Playwright webServer (which spawns /bin/sh and may not have `make` on
# PATH inside the Playwright Docker image). Mirrors the `make run` target in
# the Makefile.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

TAILWIND_VERSION="${TAILWIND_VERSION:-v4.1.5}"
TAILWIND_BIN="bin/tailwindcss"

# The e2e suite starts two servers (VRT and CRUD, see e2e/playwright.config.ts)
# from this script at the same time, and both write web/static/css/output.css
# before the Go build embeds it. Serialize the download/build through a lock
# directory so neither server can embed a half-written file (#342).
LOCK_DIR="bin/.tailwind-build.lock"
mkdir -p bin
waited=0
while ! mkdir "$LOCK_DIR" 2>/dev/null; do
  waited=$((waited + 1))
  if [ "$waited" -gt 300 ]; then
    # A previous run died without cleaning up. Take the lock over rather than
    # hanging forever.
    echo "run-with-tailwind: removing stale build lock $LOCK_DIR" >&2
    rmdir "$LOCK_DIR" 2>/dev/null || true
    waited=0
  fi
  sleep 0.1
done
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [ ! -f "$TAILWIND_BIN" ]; then
  # OS/arch detection: linux-x64 / linux-arm64 / macos-x64 / macos-arm64
  TAILWIND_OS="$(uname -s | tr '[:upper:]' '[:lower:]' | sed 's/darwin/macos/')"
  TAILWIND_ARCH="$(uname -m | sed -e 's/x86_64/x64/' -e 's/aarch64/arm64/')"
  TAILWIND_TARGET="${TAILWIND_TARGET:-${TAILWIND_OS}-${TAILWIND_ARCH}}"
  echo "Downloading Tailwind CSS CLI $TAILWIND_VERSION for $TAILWIND_TARGET..."
  curl -fsSL "https://github.com/tailwindlabs/tailwindcss/releases/download/${TAILWIND_VERSION}/tailwindcss-${TAILWIND_TARGET}" \
    -o "$TAILWIND_BIN"
  chmod +x "$TAILWIND_BIN"
fi

"$TAILWIND_BIN" -i web/static/css/input.css -o web/static/css/output.css --minify

rmdir "$LOCK_DIR" 2>/dev/null || true
trap - EXIT INT TERM

exec go run ./cmd/server
