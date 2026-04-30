#!/usr/bin/env bash
# Python template replacements

apply_python_replacements() {
  local dest="$1"
  local template="$2"
  local name="$3"

  # Convert project name to valid Python package name (hyphens -> underscores)
  local pkg_name="${name//-/_}"

  info "Python package name: $pkg_name"

  # Determine the original package name based on the template
  local orig_pkg
  case "$template" in
    python-cli) orig_pkg="mycli" ;;
    python-web) orig_pkg="myweb" ;;
    *) orig_pkg="mycli" ;;
  esac

  # Replace pyproject.toml fields
  if [[ -f "$dest/pyproject.toml" ]]; then
    # Replace project name
    sed -i "s|^name = \"${orig_pkg}\"|name = \"${name}\"|" "$dest/pyproject.toml"

    # Replace scripts entry (python-cli only)
    sed -i "s|^${orig_pkg} = \"${orig_pkg}\.|${pkg_name} = \"${pkg_name}.|" "$dest/pyproject.toml"

    # Replace hatch build packages
    sed -i "s|\"src/${orig_pkg}\"|\"src/${pkg_name}\"|g" "$dest/pyproject.toml"

    # Replace coverage source
    sed -i "s|source = \[\"src/${orig_pkg}\"\]|source = [\"src/${pkg_name}\"]|g" "$dest/pyproject.toml"

    info "Updated pyproject.toml"
  fi

  # Rename src/<orig_pkg>/ directory
  if [[ -d "$dest/src/${orig_pkg}" ]]; then
    mv "$dest/src/${orig_pkg}" "$dest/src/${pkg_name}"
    info "Renamed src/${orig_pkg} -> src/${pkg_name}"
  fi

  # Replace import references, string literals, and comments in .py files
  find "$dest" -name '*.py' -exec sed -i \
    "s|from ${orig_pkg}|from ${pkg_name}|g; \
     s|import ${orig_pkg}|import ${pkg_name}|g; \
     s|\"${orig_pkg}\"|\"${name}\"|g; \
     s|'${orig_pkg}'|'${name}'|g; \
     s|/${orig_pkg}/|/${pkg_name}/|g; \
     s|${orig_pkg}\\.db|${pkg_name}.db|g; \
     s|^\"\"\"${orig_pkg}|\"\"\"${name}|g; \
     s|f\"${orig_pkg} |f\"${name} |g" {} +

  # Replace references in Makefile
  if [[ -f "$dest/Makefile" ]]; then
    sed -i "s|${orig_pkg}|${pkg_name}|g" "$dest/Makefile"
    info "Updated Makefile references"
  fi

  # Replace references in alembic.ini (python-web batteries-included template)
  if [[ -f "$dest/alembic.ini" ]]; then
    sed -i "s|src/${orig_pkg}|src/${pkg_name}|g" "$dest/alembic.ini"
    info "Updated alembic.ini references"
  fi

  # Replace pytest coverage source in CI workflow references
  find "$dest" -name '*.yml' -exec sed -i "s|--cov=src/${orig_pkg}|--cov=src/${pkg_name}|g" {} + 2>/dev/null || true

  # python-web specific: replace package.json name field
  if [[ "$template" == "python-web" && -f "$dest/package.json" ]]; then
    sed -i "s|\"name\": \"${orig_pkg}\"|\"name\": \"${name}\"|" "$dest/package.json"
    info "Updated package.json name"
  fi
}
