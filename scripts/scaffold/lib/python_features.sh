#!/usr/bin/env bash
# python-web feature flags (--no-auth / --no-sample).
#
# Decision (parent issue #306, Decision Log #3): auth/users and the items CRUD
# sample do not depend on each other, so each gets its own flag.
#
#   --no-auth    removes login / register / JWT / users
#   --no-sample  removes the items CRUD sample
#
# Whole files are listed in the template's .noauth-remove / .nosample-remove
# manifests. Everything that cannot be fixed by deleting a file (imports,
# router registration, models, the initial migration, templates) carries
# @scaffold markers that this module strips.
#
# This MUST run before apply_python_replacements(): the manifests use the
# original src/myweb/... paths and python.sh renames that directory.

# shellcheck source=markers.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/markers.sh"

# _python_feature_enabled <value>
_python_feature_enabled() {
  [[ -n "$1" && "$1" != "0" ]]
}

# _remove_paths_from_manifest <root> <manifest-name> <label>
#
# Deletes every path listed in <root>/<manifest-name>. Aborts when a listed
# path is missing so a stale manifest cannot silently leave code behind.
_remove_paths_from_manifest() {
  local root="$1"
  local manifest_name="$2"
  local label="$3"
  local manifest="$root/$manifest_name"
  local line path

  if [[ ! -f "$manifest" ]]; then
    warn "[$label] $manifest_name not found; no files removed"
    return 0
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line//[[:space:]]/}" ]] && continue
    path="$root/$line"
    if [[ ! -e "$path" ]]; then
      die "[$label] $manifest_name lists a missing path: $line"
    fi
    rm -f "$path"
  done <"$manifest"

  rm -f "$manifest"
}

# _prune_empty_dirs <root>
_prune_empty_dirs() {
  local root="$1"
  local dir
  for dir in "$root/src" "$root/templates"; do
    [[ -d "$dir" ]] || continue
    find "$dir" -type d -empty -delete
  done
}

# apply_python_feature_flags <dest> <template> <no_auth> <no_sample>
apply_python_feature_flags() {
  local dest="$1"
  local template="$2"
  local no_auth="$3"
  local no_sample="$4"
  local na=0 ns=0

  [[ "$template" == "python-web" ]] || return 0

  if _python_feature_enabled "$no_auth"; then
    na=1
  fi
  if _python_feature_enabled "$no_sample"; then
    ns=1
  fi

  if [[ "$na" == "1" ]]; then
    info "[python-web] Removing auth (--no-auth)..."
    _remove_paths_from_manifest "$dest" ".noauth-remove" "no-auth"
  fi
  if [[ "$ns" == "1" ]]; then
    info "[python-web] Removing items sample (--no-sample)..."
    _remove_paths_from_manifest "$dest" ".nosample-remove" "no-sample"
  fi

  # Manifests are scaffold metadata, never part of the generated project.
  rm -f "$dest/.noauth-remove" "$dest/.nosample-remove"

  info "[python-web] Stripping @scaffold markers..."
  strip_scaffold_markers "$dest" "$na" "$ns"

  _prune_empty_dirs "$dest"

  info "[python-web] Feature flags applied (no-auth=$na, no-sample=$ns)"
}
