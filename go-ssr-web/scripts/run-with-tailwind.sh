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
  mkdir -p bin
  echo "Downloading Tailwind CSS CLI $TAILWIND_VERSION..."
  curl -sL "https://github.com/tailwindlabs/tailwindcss/releases/download/${TAILWIND_VERSION}/tailwindcss-linux-x64" \
    -o "$TAILWIND_BIN"
  chmod +x "$TAILWIND_BIN"
fi

"$TAILWIND_BIN" -i web/static/css/input.css -o web/static/css/output.css --minify

exec go run ./cmd/server
