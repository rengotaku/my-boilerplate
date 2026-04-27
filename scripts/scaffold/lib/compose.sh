#!/usr/bin/env bash
# Composite-template support.
#
# Some templates ship a `.compose.toml` manifest that declares another
# template as a base plus an overlay directory of monolith-specific
# diffs. `compose_template` reads that manifest and materializes the
# merged tree at scaffold time so the resulting project does not depend
# on the parent monorepo siblings.

# Output globals from parse_compose_toml
COMPOSE_BASE_TEMPLATE=""
COMPOSE_BASE_DEST=""
COMPOSE_OVERLAY_SRC=""
COMPOSE_OVERLAY_DEST=""
COMPOSE_PACKAGE_NAME=""

# parse_compose_toml <manifest>
#
# Minimal TOML reader sufficient for go-react-spa/.compose.toml.
# Recognises: `[section]` headers and `key = "value"` string assignments.
parse_compose_toml() {
  local manifest="$1"
  COMPOSE_BASE_TEMPLATE=""
  COMPOSE_BASE_DEST=""
  COMPOSE_OVERLAY_SRC=""
  COMPOSE_OVERLAY_DEST=""
  COMPOSE_PACKAGE_NAME=""

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
        base.template) COMPOSE_BASE_TEMPLATE="$value" ;;
        base.dest) COMPOSE_BASE_DEST="$value" ;;
        overlay.src) COMPOSE_OVERLAY_SRC="$value" ;;
        overlay.dest) COMPOSE_OVERLAY_DEST="$value" ;;
        post.package_name) COMPOSE_PACKAGE_NAME="$value" ;;
      esac
    fi
  done < "$manifest"
}

# compose_template <dest> <repo_root> [package_name_override]
#
# If <dest>/.compose.toml exists, materializes <dest>/<base.dest>/ from
# <repo_root>/<base.template>/ + <dest>/<overlay.src>/. After merging,
# the manifest and overlay directory are removed and the in-tree
# Makefile is stripped of compose-only machinery so the scaffold result
# is a self-contained project.
compose_template() {
  local dest="$1"
  local repo_root="$2"
  local override="${3:-}"

  local manifest="$dest/.compose.toml"
  [[ -f "$manifest" ]] || return 0

  parse_compose_toml "$manifest"

  [[ -z "$COMPOSE_BASE_TEMPLATE" ]] && die "[compose] $manifest: missing [base].template"
  [[ -z "$COMPOSE_BASE_DEST" ]] && die "[compose] $manifest: missing [base].dest"
  [[ -z "$COMPOSE_OVERLAY_SRC" ]] && die "[compose] $manifest: missing [overlay].src"
  [[ -z "$COMPOSE_OVERLAY_DEST" ]] && die "[compose] $manifest: missing [overlay].dest"

  local base_src="$repo_root/$COMPOSE_BASE_TEMPLATE"
  local base_dest="$dest/$COMPOSE_BASE_DEST"
  local overlay_src="$dest/$COMPOSE_OVERLAY_SRC"
  local overlay_dest="$dest/$COMPOSE_OVERLAY_DEST"

  [[ -d "$base_src" ]] || die "[compose] base template not found: $base_src"
  [[ -d "$overlay_src" ]] || die "[compose] overlay source not found: $overlay_src"

  if ! command -v rsync >/dev/null 2>&1; then
    die "[compose] rsync is required"
  fi

  info "[compose] base: $COMPOSE_BASE_TEMPLATE -> $COMPOSE_BASE_DEST"
  rm -rf "$base_dest"
  mkdir -p "$base_dest"
  rsync -a \
    --exclude='node_modules' --exclude='dist' --exclude='coverage' \
    --exclude='.claude' --exclude='.git' \
    "$base_src/" "$base_dest/"

  info "[compose] overlay: $COMPOSE_OVERLAY_SRC -> $COMPOSE_OVERLAY_DEST"
  rsync -a "$overlay_src/" "$overlay_dest/"

  local pkg_name="${override:-$COMPOSE_PACKAGE_NAME}"
  if [[ -n "$pkg_name" ]]; then
    if [[ -f "$base_dest/package.json" ]]; then
      info "[compose] post: package.json name -> $pkg_name"
      if command -v node >/dev/null 2>&1; then
        node -e 'const fs=require("fs");const f=process.argv[1];const p=JSON.parse(fs.readFileSync(f,"utf8"));p.name=process.argv[2];fs.writeFileSync(f,JSON.stringify(p,null,2)+"\n");' \
          "$base_dest/package.json" "$pkg_name"
      else
        # Fallback: sed-edit the "name" field. Keeps formatting roughly intact.
        sed -i "s|\"name\": *\"[^\"]*\"|\"name\": \"$pkg_name\"|" "$base_dest/package.json"
      fi
    fi
    if [[ -f "$base_dest/package-lock.json" ]]; then
      sed -i "s|\"name\": *\"[^\"]*\"|\"name\": \"$pkg_name\"|" "$base_dest/package-lock.json"
    fi
  fi

  # Idempotency marker so an in-tree `make compose` after scaffolding is a no-op.
  touch "$base_dest/.composed"

  rm -f "$manifest"
  rm -rf "$overlay_src"

  if [[ -f "$dest/Makefile" ]]; then
    strip_compose_makefile "$dest/Makefile"
  fi
}

# strip_compose_makefile <Makefile path>
#
# Removes BASE_TEMPLATE_DIR / overlay / verify machinery so the
# scaffolded Makefile stands alone (no `../<base-template>` siblings,
# no `frontend.overlay/` source).
strip_compose_makefile() {
  local makefile="$1"
  local tmp
  tmp="$(mktemp)"

  awk '
    BEGIN { skip_block = 0 }

    # End any in-progress block when we see a non-tab top-level line
    # (recipes are indented with TAB; everything else terminates a rule).
    skip_block && /^[^\t]/ { skip_block = 0 }
    skip_block { next }

    # Drop entire blocks: $(COMPOSED_MARKER), compose-clean, verify
    /^\$\(COMPOSED_MARKER\):/ { skip_block = 1; next }
    /^## compose-clean:/ { skip_block = 1; next }
    /^compose-clean:/ { skip_block = 1; next }
    /^## verify:/ { skip_block = 1; next }
    /^verify:/ { skip_block = 1; next }

    # Drop composite-only variables and the section comment
    /^# Composite-template config/ { next }
    /^BASE_TEMPLATE_DIR / { next }
    /^OVERLAY_DIR / { next }
    /^COMPOSED_MARKER / { next }
    /^PACKAGE_NAME / { next }

    # Drop the .PHONY continuation line that lists compose / compose-clean / verify
    /^\tcompose compose-clean verify \\$/ { next }

    # Strip `compose` dep from any rule (e.g. `install: compose` -> `install:`)
    /^[a-zA-Z][a-zA-Z0-9_-]*: compose([[:space:]]|$)/ {
      sub(/: compose([[:space:]]+|$)/, ": ")
      sub(/[ \t]+$/, "")
      print
      next
    }

    # Update install docstring (compose preamble no longer applies)
    /^## install: Compose frontend, then install Go modules/ {
      print "## install: Install Go modules and frontend deps"
      next
    }

    # Replace compose docstring + rule with a no-op (frontend/ is pre-composed)
    /^## compose:/ {
      print "## compose: No-op (frontend/ pre-composed during scaffold)"
      next
    }
    /^compose: \$\(COMPOSED_MARKER\)/ {
      print "compose: ;"
      next
    }

    { print }
  ' "$makefile" > "$tmp"

  mv "$tmp" "$makefile"
}
