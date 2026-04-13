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
    transform_workflow "$ci_src" "$dest/.github/workflows/ci.yml" "$template" "$name"
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
    defaults_depth = 0
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
    # Check if previous context is golangci-lint (we just remove all step-level working-directory under "with:")
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

  # Replace template name with project name in command strings
  /--project-name=/ {
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
