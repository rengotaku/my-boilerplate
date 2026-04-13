#!/usr/bin/env bash
# Go template replacements

apply_go_replacements() {
  local dest="$1"
  local template="$2"
  local name="$3"
  local module="$4"

  # Get old module path from go.mod first line
  local old_module
  old_module="$(head -1 "$dest/go.mod" | awk '{print $2}')"

  info "Replacing Go module: $old_module -> $module"

  # Replace module path in go.mod
  sed -i "s|^module ${old_module}$|module ${module}|" "$dest/go.mod"

  # Replace import paths in all .go files
  find "$dest" -name '*.go' -exec sed -i "s|\"${old_module}/|\"${module}/|g" {} +

  # Handle gqlgen.yml autobind (go-graphql-api)
  if [[ -f "$dest/gqlgen.yml" ]]; then
    sed -i "s|\"${old_module}/|\"${module}/|g" "$dest/gqlgen.yml"
  fi

  # Handle .golangci.yml local-prefixes
  if [[ -f "$dest/.golangci.yml" ]]; then
    sed -i "s|${old_module}|${module}|g" "$dest/.golangci.yml"
  fi

  # For CLI templates: replace binary name references (Cobra Use field, version strings, Makefile BINARY_NAME)
  if [[ "$template" == "go-cli" ]]; then
    local bin_name
    bin_name="$(basename "$module")"
    # Replace mycli as CLI name in .go files (Cobra Use, version strings, descriptions)
    find "$dest" -name '*.go' -exec sed -i "s|mycli|${bin_name}|g" {} +
    # Replace BINARY_NAME in Makefile
    sed -i "s|^BINARY_NAME := mycli|BINARY_NAME := ${bin_name}|" "$dest/Makefile"
  fi
}
