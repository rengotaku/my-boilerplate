#!/usr/bin/env bash
# Rust template replacements

apply_rust_replacements() {
  local dest="$1"
  local template="$2"
  local name="$3"

  # Convert project name for Rust crate (hyphens -> underscores for lib name)
  local crate_name="${name//-/_}"

  # Replace Cargo.toml package name
  if [[ -f "$dest/Cargo.toml" ]]; then
    sed_inplace "s|^name = \"rust-cli\"|name = \"${name}\"|" "$dest/Cargo.toml"
    # Replace bin name
    sed_inplace "s|^name = \"mycli\"|name = \"${name}\"|" "$dest/Cargo.toml"
    info "Updated Cargo.toml"
  fi

  # Replace command name in src/cli.rs
  if [[ -f "$dest/src/cli.rs" ]]; then
    sed_inplace "s|command(name = \"mycli\")|command(name = \"${name}\")|" "$dest/src/cli.rs"
    # Replace crate import (rust_cli -> new crate name)
    sed_inplace "s|use rust_cli::|use ${crate_name}::|g" "$dest/src/cli.rs"
    info "Updated src/cli.rs"
  fi

  # Replace crate import in src/main.rs (rust_cli -> new crate name)
  if [[ -f "$dest/src/main.rs" ]]; then
    sed_inplace "s|use rust_cli::|use ${crate_name}::|g" "$dest/src/main.rs"
    info "Updated src/main.rs"
  fi

  # Replace BINARY_NAME in Makefile
  if [[ -f "$dest/Makefile" ]]; then
    sed_inplace "s|^BINARY_NAME := mycli|BINARY_NAME := ${name}|" "$dest/Makefile"
    info "Updated Makefile BINARY_NAME"
  fi

  # Replace binary name in test files (assert_cmd's cargo_bin("mycli"))
  find "$dest/tests" -name '*.rs' -exec sed "${SED_INPLACE_ARGS[@]}" "s|\"mycli\"|\"${name}\"|g" {} + 2>/dev/null || true
}
