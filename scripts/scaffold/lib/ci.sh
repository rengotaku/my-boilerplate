#!/usr/bin/env bash
# CI workflow transformation - strips monorepo-specific configuration

transform_ci_workflows() {
  local dest="$1"
  local repo_root="$2"
  local template="$3"
  local name="$4"

  mkdir -p "$dest/.github/workflows"

  # Transform CI workflow
  local ci_src="$repo_root/.github/workflows/${template}.yml"
  if [[ -f "$ci_src" ]]; then
    # Check if this is a reusable workflow caller (contains "uses: ./.github/workflows/")
    if grep -q 'uses: \./.github/workflows/go-ci\.yml' "$ci_src" 2>/dev/null; then
      expand_go_reusable_workflow "$ci_src" "$repo_root" "$dest/.github/workflows/ci.yml" "$template" "$name"
    else
      transform_workflow "$ci_src" "$dest/.github/workflows/ci.yml" "$template" "$name"
    fi
    info "Created CI workflow: .github/workflows/ci.yml"
  else
    warn "No CI workflow found: $ci_src"
  fi

  # Transform deploy workflow if it exists
  local deploy_src="$repo_root/.github/workflows/${template}-deploy.yml"
  if [[ -f "$deploy_src" ]]; then
    transform_workflow "$deploy_src" "$dest/.github/workflows/deploy.yml" "$template" "$name"
    info "Created deploy workflow: .github/workflows/deploy.yml"
  fi
}

# Expand a Go reusable workflow caller into a standalone CI workflow
expand_go_reusable_workflow() {
  local caller_src="$1"
  local repo_root="$2"
  local dest_file="$3"
  local template="$4"
  local name="$5"

  local reusable_src="$repo_root/.github/workflows/go-ci.yml"
  if [[ ! -f "$reusable_src" ]]; then
    warn "Reusable workflow not found: $reusable_src, falling back to direct transform"
    transform_workflow "$caller_src" "$dest_file" "$template" "$name"
    return
  fi

  # Extract inputs from caller workflow
  local go_versions test_paths
  go_versions="$(grep "go-versions:" "$caller_src" | sed "s/.*go-versions: *'//" | sed "s/'$//")"
  test_paths="$(grep "test-paths:" "$caller_src" | sed 's/.*test-paths: *"//' | sed 's/"$//')"
  [[ -z "$test_paths" ]] && test_paths="./internal/..."

  # Generate standalone workflow from reusable template
  # Replace workflow_call inputs with extracted values and strip monorepo config
  awk -v name="$name" -v go_versions="$go_versions" -v test_paths="$test_paths" '
  BEGIN {
    in_workflow_call = 0
    in_inputs = 0
    skip_input = 0
  }

  # Replace workflow name
  /^name:/ {
    print "name: " name " CI"
    next
  }

  # Replace workflow_call trigger with push/pull_request
  /^on:/ {
    print "on:"
    print "  push:"
    print "    branches: [main]"
    print "  pull_request:"
    in_workflow_call = 1
    next
  }
  in_workflow_call && /^[^ ]/ && !/^on:/ {
    in_workflow_call = 0
  }
  in_workflow_call {
    next
  }

  # Replace input references with actual values
  {
    gsub(/\$\{\{ fromJSON\(inputs\.go-versions\) \}\}/, go_versions)
    gsub(/\$\{\{ inputs\.working-directory \}\}/, ".")
    gsub(/\$\{\{ inputs\.test-paths \}\}/, test_paths)
  }

  # Remove defaults block (working-directory: ".")
  /^    defaults:/ {
    in_defaults = 1
    next
  }
  in_defaults && /^      run:/ { next }
  in_defaults && /^        working-directory:/ {
    in_defaults = 0
    next
  }
  in_defaults && /^    [^ ]/ {
    in_defaults = 0
  }
  in_defaults { next }

  # Strip "." prefix from cache-dependency-path
  /cache-dependency-path:/ {
    gsub(/\.\// , "")
    gsub(": \./", ": ")
    print
    next
  }

  # Remove golangci-lint working-directory when value is "."
  /working-directory:/ && /: \.$/ {
    next
  }
  /working-directory:/ && /: "\."$/ {
    next
  }

  { print }
  ' "$reusable_src" > "$dest_file"
}

transform_workflow() {
  local src="$1"
  local dest_file="$2"
  local template="$3"
  local name="$4"

  awk -v template="$template" -v name="$name" '
  BEGIN {
    in_paths = 0
    in_defaults = 0
  }

  # Replace workflow name
  /^name:/ {
    gsub(template, name)
    print
    next
  }

  # Remove paths: block and its items
  /^    paths:/ {
    in_paths = 1
    next
  }
  in_paths && /^      - / {
    next
  }
  in_paths && !/^      - / {
    in_paths = 0
  }

  # Remove defaults: run: working-directory: block (3-line block)
  /^defaults:/ {
    in_defaults = 1
    next
  }
  in_defaults && /^  run:/ {
    next
  }
  in_defaults && /^    working-directory:/ {
    in_defaults = 0
    next
  }
  in_defaults && /^[^ ]/ {
    # defaults block ended without expected content, print current line
    in_defaults = 0
  }
  in_defaults {
    next
  }

  # Strip template prefix from cache-dependency-path
  /cache-dependency-path:/ {
    gsub(template "/", "")
    print
    next
  }

  # Remove golangci-lint-action working-directory
  /^          working-directory:/ {
    next
  }

  # Remove workingDirectory for wrangler-action
  /^          workingDirectory:/ {
    next
  }

  # Strip template prefix from target/ path in cargo cache
  /            '"$template"'\/target\// {
    gsub(template "/", "")
    print
    next
  }

  # Strip template prefix from hashFiles paths
  /hashFiles\(/ {
    gsub("'"'"'" template "/", "'"'"'")
    print
    next
  }

  # Replace template name with project name in command strings and env variables
  /--project-name=/ || /PROJECT_NAME:/ {
    gsub(template, name)
    print
    next
  }

  # Replace working-directory at step level (for coverage jobs etc.)
  /^        working-directory:/ {
    gsub(template, ".")
    # Only keep if the value is not just "."
    if ($0 ~ /working-directory: \.$/) {
      next
    }
    print
    next
  }

  { print }
  ' "$src" > "$dest_file"
}
