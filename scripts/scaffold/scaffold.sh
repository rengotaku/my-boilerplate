#!/usr/bin/env bash
# Scaffold a standalone project from a monorepo template
#
# Usage:
#   bash scripts/scaffold/scaffold.sh template=<name> dest=<path> name=<project-name> [go-module-name=<go-module>]
#
# go-module-name は Go テンプレートのみで必須。`go.mod` の `module` 行に書かれる
# モジュールパス（例: github.com/user/repo）を指定する。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

# --- Argument parsing ---
template=""
dest=""
name=""
module=""

for arg in "$@"; do
  case "$arg" in
    template=*) template="${arg#template=}" ;;
    dest=*) dest="${arg#dest=}" ;;
    name=*) name="${arg#name=}" ;;
    go-module-name=*) module="${arg#go-module-name=}" ;;
    *) die "Unknown argument: $arg" ;;
  esac
done

# --- Validation ---
[[ -z "$template" ]] && die "Missing required argument: template="
[[ -z "$dest" ]] && die "Missing required argument: dest="
[[ -z "$name" ]] && die "Missing required argument: name="

validate_template "$template"
validate_name "$name"
validate_dest "$dest"

family="$(detect_family "$template")"

# Go templates require go-module-name= (the value written into go.mod's `module` line)
if [[ "$family" == "go" ]]; then
  [[ -z "$module" ]] && die "Go templates require go-module-name= argument (e.g., go-module-name=github.com/user/repo)"
  validate_module "$module"
fi

# Non-Go templates: warn if go-module-name is provided
if [[ "$family" != "go" && -n "$module" ]]; then
  warn "go-module-name= is ignored for $family templates"
  module=""
fi

# --- Copy template ---
info "Copying template '$template' to '$dest'..."
copy_template "$REPO_ROOT/$template" "$dest"

# --- Composite-template merge (runs before family replacements so the
#     materialized base tree is visible to subsequent steps). ---
if [[ -f "$dest/.compose.toml" ]]; then
  info "Composing template '$template' (manifest: .compose.toml)..."
  # shellcheck source=lib/compose.sh
  source "$SCRIPT_DIR/lib/compose.sh"
  compose_template "$dest" "$REPO_ROOT" "$name"
fi

# --- CI workflow transformation (before family replacements so they can process CI files too) ---
info "Transforming CI workflows..."
source "$SCRIPT_DIR/lib/ci.sh"
transform_ci_workflows "$dest" "$REPO_ROOT" "$template" "$name"

# --- Generic template name replacement (before family-specific to avoid double-replacement) ---
# Replace template name with project name in Makefiles, HTML, graphql comments, etc.
generic_files="$(grep -rl "${template}" "$dest" --include='*.html' --include='Makefile' --include='*.graphql' 2>/dev/null || true)"
if [[ -n "$generic_files" ]]; then
  while IFS= read -r f; do
    sed -i "s|${template}|${name}|g" "$f"
  done <<< "$generic_files"
fi

# --- Family-specific replacements ---
info "Applying $family replacements..."

case "$family" in
  go)
    source "$SCRIPT_DIR/lib/go.sh"
    apply_go_replacements "$dest" "$template" "$name" "$module"
    ;;
  react)
    source "$SCRIPT_DIR/lib/react.sh"
    apply_react_replacements "$dest" "$template" "$name"
    ;;
  python)
    source "$SCRIPT_DIR/lib/python.sh"
    apply_python_replacements "$dest" "$template" "$name"
    ;;
  rust)
    source "$SCRIPT_DIR/lib/rust.sh"
    apply_rust_replacements "$dest" "$template" "$name"
    ;;
esac

# --- README replacement ---
info "Generating README..."
readme_template="$SCRIPT_DIR/templates/README.md.tmpl"
if [[ -f "$readme_template" ]]; then
  sed \
    -e "s|{{NAME}}|$name|g" \
    -e "s|{{TEMPLATE}}|$template|g" \
    -e "s|{{FAMILY}}|$family|g" \
    "$readme_template" > "$dest/README.md"
fi

# --- Completion message ---
echo ""
info "Project '$name' scaffolded successfully at: $dest"
echo ""
echo "Next steps:"

case "$family" in
  go)
    echo "  cd $dest"
    if [[ "$template" == "go-react-spa" ]]; then
      # Composite template: `make install` runs `go mod download` + `npm ci`
      # against the pre-composed frontend/, then `make build` produces a
      # single Go binary embedding the SPA bundle.
      echo "  make install"
      echo "  make build"
      echo "  ./bin/server"
    else
      echo "  go mod tidy"
      echo "  make ci"
    fi
    echo ""
    echo "Publishing this module? Update go.mod's module line to a canonical path:"
    echo "  go mod edit -module github.com/<user>/<repo>"
    ;;
  react)
    echo "  cd $dest"
    echo "  npm install"
    echo "  make ci"
    if [[ "$template" == "react-spa-cloudflare" ]]; then
      echo ""
      echo "Required secrets for deployment:"
      echo "  - CLOUDFLARE_API_TOKEN"
      echo "  - CLOUDFLARE_ACCOUNT_ID"
    fi
    ;;
  python)
    echo "  cd $dest"
    echo "  uv sync --all-extras"
    echo "  make ci"
    ;;
  rust)
    echo "  cd $dest"
    echo "  cargo build"
    echo "  make ci"
    ;;
esac

echo ""
echo "CI workflow generated at: $dest/.github/workflows/ci.yml"
