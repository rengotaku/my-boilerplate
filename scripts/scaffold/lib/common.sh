#!/usr/bin/env bash
# Common utilities for scaffold script

set -euo pipefail

# Valid template names
VALID_TEMPLATES=(
  go-rest-api
  go-graphql-api
  go-grpc-api
  go-ssr-web
  go-cli
  react-spa
  react-spa-graphql
  react-spa-cloudflare
  python-cli
  python-web
  rust-cli
)

# Artifacts to remove after copy
ARTIFACTS=(
  node_modules
  .venv
  target
  server
  dist
  .vite
  bin
  __pycache__
  .pytest_cache
  .mypy_cache
  .ruff_cache
  coverage
  .coverage
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
  echo -e "${GREEN}[INFO]${NC} $*"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $*"
}

error() {
  echo -e "${RED}[ERROR]${NC} $*" >&2
}

die() {
  error "$@"
  exit 1
}

# Detect template family: go, react, python, rust
detect_family() {
  local template="$1"
  case "$template" in
    go-*) echo "go" ;;
    react-*) echo "react" ;;
    python-*) echo "python" ;;
    rust-*) echo "rust" ;;
    *) die "Unknown template family for: $template" ;;
  esac
}

# Validate template name
validate_template() {
  local template="$1"
  for t in "${VALID_TEMPLATES[@]}"; do
    if [[ "$t" == "$template" ]]; then
      return 0
    fi
  done
  error "Invalid template: $template"
  echo "Available templates:"
  for t in "${VALID_TEMPLATES[@]}"; do
    echo "  - $t"
  done
  exit 1
}

# Validate destination directory
validate_dest() {
  local dest="$1"
  if [[ -e "$dest" ]]; then
    die "Destination already exists: $dest"
  fi
  local parent
  parent="$(dirname "$dest")"
  if [[ ! -d "$parent" ]]; then
    die "Parent directory does not exist: $parent"
  fi
}

# Validate project name (alphanumeric, hyphens, underscores only)
validate_name() {
  local name="$1"
  if [[ ! "$name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    die "Invalid project name: $name (only alphanumeric, hyphens, and underscores allowed)"
  fi
}

# Validate Go module path format
validate_module() {
  local module="$1"
  if [[ ! "$module" =~ ^[a-zA-Z0-9._-]+(/[a-zA-Z0-9._-]+)+$ ]]; then
    die "Invalid module path: $module (expected format: github.com/<user>/<repo>)"
  fi
}

# Copy template and remove build artifacts
copy_template() {
  local src="$1"
  local dest="$2"

  cp -R "$src" "$dest"

  for artifact in "${ARTIFACTS[@]}"; do
    find "$dest" -maxdepth 2 -name "$artifact" -exec rm -rf {} + 2>/dev/null || true
  done

  # Remove .git and .claude if copied (symlinks to monorepo parent)
  rm -rf "$dest/.git"
  rm -rf "$dest/.claude"

  # Remove monorepo-specific documentation
  rm -f "$dest/docs/SYNC_FILES.md"
  # Remove empty docs dir if nothing left
  rmdir "$dest/docs" 2>/dev/null || true
}
