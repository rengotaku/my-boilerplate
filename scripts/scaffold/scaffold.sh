#!/usr/bin/env bash
# Scaffold a standalone project from a monorepo template
#
# Usage:
#   bash scripts/scaffold/scaffold.sh template=<name> dest=<path> name=<project-name> \
#     [go-module-name=<go-module>] [no-auth=1] [no-sample=1]
#
# go-module-name は Go テンプレートのみで必須。`go.mod` の `module` 行に書かれる
# モジュールパス（例: github.com/user/repo）を指定する。
#
# no-auth=1:
#   - python-web: 認証 (login / register / JWT / users) を除く
#   - react / go: React SPA の JWT 認証を除く（従来の挙動）
# no-sample=1:
#   - python-web のみ: items の CRUD サンプルを除く
# 両方のフラグは互いに独立しており、同時に指定できる。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# Templates live under boilerplates/ (#229). compose_template / merge_shared_ui
# resolve sibling templates and shared-react-ui relative to this root, and the
# manifests (.compose.toml / .shared-ui.toml) store template-root-relative paths.
TEMPLATES_ROOT="$REPO_ROOT/boilerplates"

# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

# --- Argument parsing ---
template=""
dest=""
name=""
module=""
no_github_templates=""
no_auth=""
no_sample=""

for arg in "$@"; do
  case "$arg" in
    template=*) template="${arg#template=}" ;;
    dest=*) dest="${arg#dest=}" ;;
    name=*) name="${arg#name=}" ;;
    go-module-name=*) module="${arg#go-module-name=}" ;;
    no-github-templates=*) no_github_templates="${arg#no-github-templates=}" ;;
    no-auth=*) no_auth="${arg#no-auth=}" ;;
    no-sample=*) no_sample="${arg#no-sample=}" ;;
    *) die "Unknown argument: $arg" ;;
  esac
done

# --- Template aliases ---
# go-react-spa-noauth is a virtual template: same as go-react-spa with no-auth applied.
if [[ "$template" == "go-react-spa-noauth" ]]; then
  template="go-react-spa"
  no_auth="1"
fi

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

# --- Feature-flag validation ---
# --no-sample is python-web only. --no-auth exists for python-web and for the
# React/Go templates (apply_noauth); the two implementations must stay apart.
if [[ -n "$no_sample" && "$no_sample" != "0" && "$family" != "python" ]]; then
  die "no-sample= is supported only for python-web (template: $template)"
fi
if [[ -n "$no_auth" && "$no_auth" != "0" && "$family" == "python" && "$template" != "python-web" ]]; then
  die "no-auth= is supported only for python-web and the React/Go templates (template: $template)"
fi

# --- Copy template ---
info "Copying template '$template' to '$dest'..."
copy_template "$TEMPLATES_ROOT/$template" "$dest"

# --- Composite-template merge (runs before family replacements so the
#     materialized base tree is visible to subsequent steps). ---
# shellcheck source=lib/compose.sh
source "$SCRIPT_DIR/lib/compose.sh"

if [[ -f "$dest/.compose.toml" ]]; then
  info "Composing template '$template' (manifest: .compose.toml)..."
  compose_template "$dest" "$TEMPLATES_ROOT" "$name"
fi

# template.toml is metadata consumed by `download.sh --list` / `--tree`; the
# scaffolded project does not need it. Composite templates may also drag in
# the base template's template.toml under frontend/ — drop that too.
rm -f "$dest/template.toml" "$dest/frontend/template.toml"

# --- shared-react-ui merge (runs after compose_template so composed sub-trees
#     can also opt-in via their own .shared-ui.toml). ---
if [[ -f "$dest/.shared-ui.toml" ]]; then
  info "Merging shared-react-ui (manifest: .shared-ui.toml)..."
  merge_shared_ui "$dest" "$TEMPLATES_ROOT"
fi
# go-react-spa scaffolds frontend/ from the react-spa base; pick up the
# manifest that landed inside the composed sub-tree, too.
if [[ -f "$dest/frontend/.shared-ui.toml" ]]; then
  info "Merging shared-react-ui into frontend/..."
  merge_shared_ui "$dest/frontend" "$TEMPLATES_ROOT"
fi

# --- Node version resolution (go-react-spa: frontend/ was materialized above) ---
if [[ -d "$dest/frontend" ]]; then
  resolve_node_version_files "$dest/frontend"
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
    sed_inplace "s|${template}|${name}|g" "$f"
  done <<< "$generic_files"
fi

# --- Python feature flags (--no-auth / --no-sample) ---
# Runs before the family replacements because the python-web manifests list
# original src/myweb/... paths and python.sh renames that directory. Marker
# removal happens here too, so scaffolding without any flag reproduces the
# template byte-for-byte (the markers themselves never ship).
if [[ "$template" == "python-web" ]]; then
  info "Applying python-web feature flags..."
  # shellcheck source=lib/python_features.sh
  source "$SCRIPT_DIR/lib/python_features.sh"
  apply_python_feature_flags "$dest" "$template" "$no_auth" "$no_sample"
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

# --- No-auth transformation (React / Go templates) ---
# python-web is handled by apply_python_feature_flags above: reusing
# apply_noauth here would write the React SPA files into a Python project.
if [[ -n "$no_auth" && "$no_auth" != "0" && "$family" != "python" ]]; then
  # shellcheck source=lib/noauth.sh
  source "$SCRIPT_DIR/lib/noauth.sh"
  if [[ -d "$dest/frontend" ]]; then
    apply_noauth "$dest/frontend" "$dest"
  else
    apply_noauth "$dest"
  fi
fi

# --- GitHub workflow templates injection ---
# Skip if: caller passed no-github-templates=1, OR the source template already ships .github/
if [[ -z "$no_github_templates" && ! -d "$TEMPLATES_ROOT/$template/.github" ]]; then
  github_workflow_src="$REPO_ROOT/meta/github-workflow"
  if [[ -d "$github_workflow_src" ]]; then
    info "Injecting GitHub workflow templates..."
    mkdir -p "$dest/.github/ISSUE_TEMPLATE"
    cp "$github_workflow_src/PR-template.md" "$dest/.github/PULL_REQUEST_TEMPLATE.md"
    for f in business-kickoff.md parent-issue.md sub-issue.md discussion-issue.md; do
      cp "$github_workflow_src/$f" "$dest/.github/ISSUE_TEMPLATE/$f"
    done
  fi
fi

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
      if [[ -z "$no_auth" || "$no_auth" == "0" ]]; then
        echo ""
        echo "Auth not needed? Remove it at scaffold time:"
        echo "  Use template go-react-spa-noauth, or add --no-auth to the download command."
        echo "  Manual removal: delete src/api/auth.ts users.ts, src/hooks/useAuthStore.ts,"
        echo "  src/pages/LoginPage.tsx, src/schemas/auth.ts user.ts, src/types/auth.ts user.ts"
        echo "  then clean up the re-exports in the corresponding index.ts files."
      fi
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
    if [[ "$template" == "react-spa-cloudflare" || "$template" == "static-lp" ]]; then
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
    if [[ -n "$no_auth" && "$no_auth" != "0" ]] || [[ -n "$no_sample" && "$no_sample" != "0" ]]; then
      echo ""
      echo "Optional parts removed at scaffold time:"
      if [[ -n "$no_auth" && "$no_auth" != "0" ]]; then
        echo "  - auth (login / register / JWT / users)"
      fi
      if [[ -n "$no_sample" && "$no_sample" != "0" ]]; then
        echo "  - items CRUD sample"
      fi
    fi
    ;;
  rust)
    echo "  cd $dest"
    echo "  cargo build"
    echo "  make ci"
    ;;
esac

echo ""
echo "CI workflow generated at: $dest/.github/workflows/ci.yml"
