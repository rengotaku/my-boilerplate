#!/usr/bin/env bash
# Python template replacements

apply_python_replacements() {
  local dest="$1"
  local template="$2"
  local name="$3"

  # Convert project name to valid Python package name (hyphens -> underscores)
  local pkg_name="${name//-/_}"

  info "Python package name: $pkg_name"

  # Replace pyproject.toml fields
  if [[ -f "$dest/pyproject.toml" ]]; then
    # Replace project name
    sed -i "s|^name = \"mycli\"|name = \"${name}\"|" "$dest/pyproject.toml"

    # Replace scripts entry
    sed -i "s|^mycli = \"mycli\.|${pkg_name} = \"${pkg_name}.|" "$dest/pyproject.toml"

    # Replace hatch build packages
    sed -i "s|\"src/mycli\"|\"src/${pkg_name}\"|" "$dest/pyproject.toml"

    # Replace coverage source
    sed -i "s|\"src/mycli\"|\"src/${pkg_name}\"|" "$dest/pyproject.toml"

    info "Updated pyproject.toml"
  fi

  # Rename src/mycli/ directory
  if [[ -d "$dest/src/mycli" ]]; then
    mv "$dest/src/mycli" "$dest/src/${pkg_name}"
    info "Renamed src/mycli -> src/${pkg_name}"
  fi

  # Replace import references in .py files
  find "$dest" -name '*.py' -exec sed -i "s|from mycli|from ${pkg_name}|g; s|import mycli|import ${pkg_name}|g" {} +

  # Replace references in Makefile
  if [[ -f "$dest/Makefile" ]]; then
    sed -i "s|mycli|${pkg_name}|g" "$dest/Makefile"
    info "Updated Makefile references"
  fi

  # Replace pytest coverage source in CI workflow references
  find "$dest" -name '*.yml' -exec sed -i "s|--cov=src/mycli|--cov=src/${pkg_name}|g" {} + 2>/dev/null || true
}
