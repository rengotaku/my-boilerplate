#!/usr/bin/env bash
# shared-react-ui merge support.
#
# Templates ship a `.shared-ui.toml` manifest that points at
# `boilerplates/shared-react-ui/` so the shadcn/ui primitives have a single
# source of truth. `merge_shared_ui` copies the manifest's source directory
# into the scaffolded project at scaffold time.

# Output globals from parse_shared_ui_toml
SHARED_UI_SRC=""
SHARED_UI_DEST=""
SHARED_ADMIN_SRC=""
SHARED_ADMIN_DEST=""

# parse_shared_ui_toml <manifest>
#
# Minimal TOML reader sufficient for `.shared-ui.toml`: `[section]` headers and
# `key = "value"` string assignments. Recognises a required [ui] section and an
# optional [admin] section, each with `src` and `dest` keys. The [admin] section
# carries the domain-agnostic admin pattern layer (DataTable, timelines,
# charts, ...) consumed by go-react-admin; older templates omit it and are
# unaffected.
parse_shared_ui_toml() {
  local manifest="$1"
  SHARED_UI_SRC=""
  SHARED_UI_DEST=""
  SHARED_ADMIN_SRC=""
  SHARED_ADMIN_DEST=""

  local section="" line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" ]] && continue
    [[ "${line:0:1}" == "#" ]] && continue
    if [[ "$line" =~ ^\[([a-zA-Z_]+)\]$ ]]; then
      section="${BASH_REMATCH[1]}"
      continue
    fi
    if [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_]*)[[:space:]]*=[[:space:]]*\"([^\"]*)\"$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      case "${section}.${key}" in
        ui.src) SHARED_UI_SRC="$value" ;;
        ui.dest) SHARED_UI_DEST="$value" ;;
        admin.src) SHARED_ADMIN_SRC="$value" ;;
        admin.dest) SHARED_ADMIN_DEST="$value" ;;
      esac
    fi
  done < "$manifest"
}

# merge_shared_ui <dest> <repo_root>
#
# If <dest>/.shared-ui.toml exists, copies <repo_root>/<ui.src>/*.tsx (excluding
# `*.stories.tsx`) into <dest>/<ui.dest>/. Existing files in the destination
# are overwritten, so this is the single source of truth for the listed
# components. Other files already present in <dest>/<ui.dest>/ (e.g. card,
# alert) are left untouched. After merging, the manifest is removed.
merge_shared_ui() {
  local dest="$1"
  local repo_root="$2"

  local manifest="$dest/.shared-ui.toml"
  [[ -f "$manifest" ]] || return 0

  parse_shared_ui_toml "$manifest"

  [[ -z "$SHARED_UI_SRC" ]] && die "[shared-ui] $manifest: missing [ui].src"
  [[ -z "$SHARED_UI_DEST" ]] && die "[shared-ui] $manifest: missing [ui].dest"

  local ui_src="$repo_root/$SHARED_UI_SRC"
  local ui_dest="$dest/$SHARED_UI_DEST"

  [[ -d "$ui_src" ]] || die "[shared-ui] source dir not found: $ui_src"

  if ! command -v rsync >/dev/null 2>&1; then
    die "[shared-ui] rsync is required"
  fi

  info "[shared-ui] $SHARED_UI_SRC -> $SHARED_UI_DEST (excl. *.stories.tsx)"
  mkdir -p "$ui_dest"
  rsync -a --exclude='*.stories.tsx' "$ui_src/" "$ui_dest/"

  # Optional [admin] section: the domain-agnostic admin pattern layer.
  if [[ -n "$SHARED_ADMIN_SRC" ]]; then
    [[ -z "$SHARED_ADMIN_DEST" ]] && die "[shared-ui] $manifest: [admin].src set but [admin].dest missing"
    local admin_src="$repo_root/$SHARED_ADMIN_SRC"
    local admin_dest="$dest/$SHARED_ADMIN_DEST"
    [[ -d "$admin_src" ]] || die "[shared-ui] admin source dir not found: $admin_src"
    info "[shared-ui] $SHARED_ADMIN_SRC -> $SHARED_ADMIN_DEST (excl. *.stories.tsx)"
    mkdir -p "$admin_dest"
    rsync -a --exclude='*.stories.tsx' "$admin_src/" "$admin_dest/"
  fi

  # Strip the shared-react-ui-managed:begin/end block from .gitignore so the
  # scaffolded project tracks the materialized UI files normally. The block
  # exists in the monorepo to keep the duplicated source files out of VCS.
  if [[ -f "$dest/.gitignore" ]]; then
    local tmp
    tmp="$(mktemp)"
    awk '
      /^# shared-react-ui-managed:begin/ { skip = 1; next }
      /^# shared-react-ui-managed:end/   { skip = 0; next }
      !skip { print }
    ' "$dest/.gitignore" > "$tmp"
    mv "$tmp" "$dest/.gitignore"
  fi

  rm -f "$manifest"
}
