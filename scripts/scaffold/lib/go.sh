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
  sed_inplace "s|^module ${old_module}$|module ${module}|" "$dest/go.mod"

  # Replace import paths in all .go files
  find "$dest" -name '*.go' -exec sed "${SED_INPLACE_ARGS[@]}" "s|\"${old_module}/|\"${module}/|g" {} +

  # Handle gqlgen.yml autobind (go-graphql-api)
  if [[ -f "$dest/gqlgen.yml" ]]; then
    sed_inplace "s|\"${old_module}/|\"${module}/|g" "$dest/gqlgen.yml"
  fi

  # Handle .golangci.yml local-prefixes
  if [[ -f "$dest/.golangci.yml" ]]; then
    sed_inplace "s|${old_module}|${module}|g" "$dest/.golangci.yml"
  fi

  # For CLI templates: replace binary name references (Cobra Use field, version strings, Makefile BINARY_NAME)
  case "$template" in
    go-cli|go-cli-wrapper)
      local bin_name
      bin_name="$(basename "$module")"
      # Replace mycli as CLI display name in .go files (Cobra Use, version
      # strings, doc/example text) — but never inside an import path.
      # By this point every `"mycli/...` import has already been rewritten
      # to `"${module}/...` above. If `module` itself contains "mycli" as a
      # path segment (e.g. go-module-name=github.com/mycli/foo), a blind
      # `s|mycli|...|g` would also match that segment inside the
      # already-rewritten import path and desync it from go.mod's module
      # line. CLI display-name occurrences are never followed by "/", so
      # excluding matches followed by "/" targets the display name only.
      find "$dest" -name '*.go' -exec sed "${SED_INPLACE_ARGS[@]}" \
        -e "s|mycli\([^/]\)|${bin_name}\1|g" \
        -e "s|mycli\$|${bin_name}|g" \
        {} +
      # Replace BINARY_NAME in Makefile
      sed_inplace "s|^BINARY_NAME := mycli|BINARY_NAME := ${bin_name}|" "$dest/Makefile"
      ;;
  esac
}
