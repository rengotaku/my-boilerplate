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
#
# Only the process that created the lock removes it. A waiter never deletes it,
# because the owner may be in the middle of a slow download; it waits instead
# and fails with an explicit error if the lock is still held after
# LOCK_TIMEOUT seconds.
LOCK_DIR="bin/.tailwind-build.lock"
LOCK_OWNER="$LOCK_DIR/owner"
LOCK_TIMEOUT="${LOCK_TIMEOUT:-180}"
TMP_BIN=""

mkdir -p bin

cleanup() {
  if [ -n "$TMP_BIN" ]; then
    rm -f "$TMP_BIN"
  fi
  # Release only a lock this process still owns: a successor may have created
  # a new lock at the same path after ours was gone.
  if [ -f "$LOCK_OWNER" ] && [ "$(cat "$LOCK_OWNER" 2>/dev/null)" = "$$" ]; then
    rm -f "$LOCK_OWNER"
    rmdir "$LOCK_DIR" 2>/dev/null || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

waited=0
limit=$((LOCK_TIMEOUT * 10))
while ! mkdir "$LOCK_DIR" 2>/dev/null; do
  waited=$((waited + 1))
  if [ "$waited" -ge "$limit" ]; then
    echo "run-with-tailwind: $LOCK_DIR is still held after ${LOCK_TIMEOUT}s; giving up." >&2
    echo "run-with-tailwind: the lock is left in place because its owner may be downloading Tailwind." >&2
    echo "run-with-tailwind: if no build is running, remove $LOCK_DIR and retry." >&2
    exit 1
  fi
  sleep 0.1
done
echo "$$" > "$LOCK_OWNER"

if [ ! -f "$TAILWIND_BIN" ]; then
  # OS/arch detection: linux-x64 / linux-arm64 / macos-x64 / macos-arm64
  TAILWIND_OS="$(uname -s | tr '[:upper:]' '[:lower:]' | sed 's/darwin/macos/')"
  TAILWIND_ARCH="$(uname -m | sed -e 's/x86_64/x64/' -e 's/aarch64/arm64/')"
  TAILWIND_TARGET="${TAILWIND_TARGET:-${TAILWIND_OS}-${TAILWIND_ARCH}}"
  echo "Downloading Tailwind CSS CLI $TAILWIND_VERSION for $TAILWIND_TARGET..."
  # Download next to the final path and publish it with a rename: a concurrent
  # run must never find a half-written file at $TAILWIND_BIN.
  TMP_BIN="${TAILWIND_BIN}.tmp.$$"
  if ! curl -fsSL "https://github.com/tailwindlabs/tailwindcss/releases/download/${TAILWIND_VERSION}/tailwindcss-${TAILWIND_TARGET}" \
    -o "$TMP_BIN"; then
    echo "run-with-tailwind: failed to download Tailwind CSS CLI" >&2
    exit 1
  fi
  chmod +x "$TMP_BIN"
  mv "$TMP_BIN" "$TAILWIND_BIN"
  TMP_BIN=""
fi

"$TAILWIND_BIN" -i web/static/css/input.css -o web/static/css/output.css --minify

# Release the lock before exec; the EXIT trap does not survive exec.
cleanup
trap - EXIT INT TERM

exec go run ./cmd/server
