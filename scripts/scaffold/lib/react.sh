#!/usr/bin/env bash
# React template replacements

apply_react_replacements() {
  local dest="$1"
  local template="$2"
  local name="$3"

  # Replace package.json name field
  if [[ -f "$dest/package.json" ]]; then
    sed_inplace "s|\"name\": \"${template}\"|\"name\": \"${name}\"|" "$dest/package.json"
    info "Updated package.json name"
  fi

  # Replace package-lock.json name field (will be regenerated on npm install, but keep consistent)
  if [[ -f "$dest/package-lock.json" ]]; then
    sed_inplace "s|\"name\": \"${template}\"|\"name\": \"${name}\"|" "$dest/package-lock.json"
  fi

  # Replace wrangler.toml name (react-spa-cloudflare)
  if [[ -f "$dest/wrangler.toml" ]]; then
    sed_inplace "s|^name = \"${template}\"|name = \"${name}\"|" "$dest/wrangler.toml"
    info "Updated wrangler.toml name"
  fi

  resolve_node_version_files "$dest"
}
