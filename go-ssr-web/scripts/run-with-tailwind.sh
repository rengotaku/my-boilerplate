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

if [ ! -f "$TAILWIND_BIN" ]; then
  # OS/arch detection: linux-x64 / linux-arm64 / macos-x64 / macos-arm64
  TAILWIND_OS="$(uname -s | tr '[:upper:]' '[:lower:]' | sed 's/darwin/macos/')"
  TAILWIND_ARCH="$(uname -m | sed -e 's/x86_64/x64/' -e 's/aarch64/arm64/')"
  TAILWIND_TARGET="${TAILWIND_TARGET:-${TAILWIND_OS}-${TAILWIND_ARCH}}"
  mkdir -p bin
  echo "Downloading Tailwind CSS CLI $TAILWIND_VERSION for $TAILWIND_TARGET..."
  curl -fsSL "https://github.com/tailwindlabs/tailwindcss/releases/download/${TAILWIND_VERSION}/tailwindcss-${TAILWIND_TARGET}" \
    -o "$TAILWIND_BIN"
  chmod +x "$TAILWIND_BIN"
fi

"$TAILWIND_BIN" -i web/static/css/input.css -o web/static/css/output.css --minify

exec go run ./cmd/server
