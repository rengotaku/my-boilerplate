#!/usr/bin/env bash
# Common utilities for scaffold script

set -euo pipefail

# Valid template names
VALID_TEMPLATES=(
  go-rest-api
  go-graphql-api
  go-grpc-api
  go-ssr-web
  go-ssr-web-minimal
  go-react-spa
  go-react-spa-noauth
  go-cli
  react-spa
  react-spa-graphql
  react-spa-cloudflare
  python-cli
  python-web
  rust-cli
)

# Artifacts to remove after copy.
# NOTE: every entry is matched by `find -name <entry>` against the dest tree
# (depth ≤ 2). Avoid generic words that collide with source paths — e.g.
# `server` would also match Go templates' `cmd/server/` source directory.
ARTIFACTS=(
  node_modules
  .venv
  target
  dist
  .vite
  bin
  __pycache__
  .pytest_cache
  .mypy_cache
  .ruff_cache
  coverage
  .coverage
  coverage.out
  tmp
)

# Portable sed -i (GNU/BSD compatible).
#
# GNU sed (Linux): `sed -i 's|x|y|' file`
# BSD sed (macOS): `sed -i '' 's|x|y|' file` — `-i` requires an extension
# argument, so without `''` BSD sed parses the substitution expression as the
# extension and the file path as the script, silently mangling absolute paths
# that contain spaces (#182).
#
# Use `sed_inplace ARGS...` for direct calls, and `sed "${SED_INPLACE_ARGS[@]}"`
# for `find -exec` so the array expands before find sees it.
if sed --version 2>/dev/null | grep -q GNU; then
  SED_INPLACE_ARGS=(-i)
else
  SED_INPLACE_ARGS=(-i '')
fi

sed_inplace() {
  sed "${SED_INPLACE_ARGS[@]}" "$@"
}

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

# Validate Go module path format. Accepts both:
#   - canonical path form (e.g., github.com/user/repo) for publishable modules
#   - single-token form (e.g., my-app) for local-only modules
# Both are valid `module` declarations in go.mod.
validate_module() {
  local module="$1"
  if [[ ! "$module" =~ ^[a-zA-Z0-9._-]+(/[a-zA-Z0-9._-]+)*$ ]]; then
    die "Invalid module path: $module"
  fi
}

# Resolve a bare major Node.js version in .node-version / .nvmrc to a full
# patch version (e.g. "22" -> "22.15.0"). Tries nodenv first, then falls back
# to the currently active `node` binary if the major matches. Leaves the file
# unchanged and emits a warning when neither source is available.
resolve_node_version_files() {
  local dir="$1"
  local f ver resolved cur_ver
  for f in "$dir/.node-version" "$dir/.nvmrc"; do
    [[ -f "$f" ]] || continue
    ver=$(tr -d '[:space:]' < "$f")
    # Only process bare major versions like "22"
    [[ "$ver" =~ ^[0-9]+$ ]] || continue
    resolved=""
    if command -v nodenv >/dev/null 2>&1; then
      resolved=$(nodenv install --list 2>/dev/null \
        | grep -E "^[[:space:]]+${ver}\.[0-9]+\.[0-9]+$" \
        | tail -1 \
        | tr -d '[:space:]' || true)
    fi
    if [[ -z "$resolved" ]] && command -v node >/dev/null 2>&1; then
      cur_ver=$(node --version 2>/dev/null | tr -d 'v' || true)
      if [[ "$cur_ver" =~ ^${ver}\. ]]; then
        resolved="$cur_ver"
      fi
    fi
    if [[ -n "$resolved" ]]; then
      info "[node-version] $(basename "$f"): $ver -> $resolved"
      printf '%s\n' "$resolved" > "$f"
    else
      warn "[node-version] cannot resolve Node.js $ver to a full version in $(basename "$f"); leaving as-is"
    fi
  done
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
