#!/bin/sh
# download.sh - Fetch a my-boilerplate template into a target directory.
#
# This script does NOT require my-boilerplate to be cloned locally. It
# downloads the tarball at the requested ref, extracts only the requested
# template directory, and either:
#
#   1. (default) copies the template as-is. Strings like "go-ssr-web" remain
#      embedded in Makefile / go.mod / etc. Useful for "I just want to look
#      at the files".
#
#   2. (with --name and/or --module) delegates to the bundled
#      scripts/scaffold/scaffold.sh which rewrites template-name placeholders
#      (Makefile, HTML, Go module path, package.json name, etc.) so the
#      extracted directory is immediately usable as a standalone project.
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
#     | sh -s -- <template> <dest> [--name=NAME] [--module=MODULE]
#
# Required:
#   <template>   Template directory name (e.g., go-ssr-web, react-spa).
#                Validated against the actual contents of the downloaded
#                tarball; an unknown name prints the available list.
#   <dest>       Destination directory (must not exist; parent must exist).
#
# Optional:
#   --name=NAME       Enables scaffolding. Replaces template-name placeholders
#                     with NAME. Defaults to basename(<dest>) when --module
#                     is given without --name.
#   --module=MODULE   Go module path (e.g., github.com/user/repo). Required
#                     for go-* templates whenever scaffolding is enabled.
#
# Environment:
#   MY_BOILERPLATE_REPO  Override repo (default: rengotaku/my-boilerplate).
#   MY_BOILERPLATE_REF   Override ref / branch / tag (default: main).
#
# Examples:
#   # Plain copy:
#   curl -sSL .../download.sh | sh -s -- go-ssr-web ~/projects/my-app
#
#   # Full scaffolding (Go template):
#   curl -sSL .../download.sh | sh -s -- go-ssr-web ~/projects/my-app \
#     --name=my-app --module=github.com/me/my-app

set -eu

REPO="${MY_BOILERPLATE_REPO:-rengotaku/my-boilerplate}"
REF="${MY_BOILERPLATE_REF:-main}"
TARBALL_URL="https://github.com/${REPO}/archive/refs/heads/${REF}.tar.gz"

if [ -t 2 ]; then
  RED=$(printf '\033[0;31m')
  GREEN=$(printf '\033[0;32m')
  YELLOW=$(printf '\033[1;33m')
  NC=$(printf '\033[0m')
else
  RED=""
  GREEN=""
  YELLOW=""
  NC=""
fi

info() { printf "%s[INFO]%s %s\n" "$GREEN" "$NC" "$*" >&2; }
warn() { printf "%s[WARN]%s %s\n" "$YELLOW" "$NC" "$*" >&2; }
die() {
  printf "%s[ERROR]%s %s\n" "$RED" "$NC" "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: download.sh <template> <dest> [--name=NAME] [--module=MODULE]

See https://github.com/rengotaku/my-boilerplate#usage for full documentation.
Run with an unknown <template> to see the currently available list.
EOF
}

template=""
dest=""
name=""
module=""

while [ $# -gt 0 ]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --name=*) name="${1#--name=}" ;;
    --module=*) module="${1#--module=}" ;;
    --*) die "Unknown option: $1 (see --help)" ;;
    *)
      if [ -z "$template" ]; then
        template="$1"
      elif [ -z "$dest" ]; then
        dest="$1"
      else
        die "Unexpected argument: $1"
      fi
      ;;
  esac
  shift
done

if [ -z "$template" ] || [ -z "$dest" ]; then
  usage
  exit 1
fi

# Sanity-check the template token before hitting the network. The authoritative
# validation happens after extraction (against the actual tarball contents) so
# that template additions / renames / removals do not require editing this file.
case "$template" in
  *[!a-zA-Z0-9_-]* | "" | -*)
    die "Invalid template name: $template"
    ;;
esac

[ -e "$dest" ] && die "Destination already exists: $dest"
parent=$(dirname "$dest")
[ -d "$parent" ] || die "Parent directory does not exist: $parent"

# Scaffold mode is enabled by --name and/or --module. In that mode the bundled
# scripts/scaffold/scaffold.sh is invoked to rewrite placeholders (Makefile /
# HTML / Go module path / package.json name etc.) so the result is a usable
# standalone project. Without those flags we just copy the directory as-is.
do_scaffold="no"
if [ -n "$name" ] || [ -n "$module" ]; then
  do_scaffold="yes"
  [ -z "$name" ] && name=$(basename "$dest")
fi

case "$template" in
  go-*)
    if [ "$do_scaffold" = "yes" ] && [ -z "$module" ]; then
      die "Go template '$template' requires --module=<path> when scaffolding"
    fi
    ;;
esac

if [ "$do_scaffold" = "yes" ] && ! command -v bash >/dev/null 2>&1; then
  die "bash is required for scaffolding (re-run without --name/--module for plain copy)"
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT TERM

info "Downloading ${REPO}@${REF}..."
if command -v curl >/dev/null 2>&1; then
  curl -sSLf "$TARBALL_URL" -o "$tmpdir/repo.tar.gz" || die "Download failed: $TARBALL_URL"
elif command -v wget >/dev/null 2>&1; then
  wget -q "$TARBALL_URL" -O "$tmpdir/repo.tar.gz" || die "Download failed: $TARBALL_URL"
else
  die "curl or wget is required"
fi

info "Extracting..."
tar -xzf "$tmpdir/repo.tar.gz" -C "$tmpdir"

extracted=$(find "$tmpdir" -maxdepth 1 -type d -name 'my-boilerplate-*' | head -n1)
[ -d "$extracted" ] || die "Extraction failed: tarball did not contain expected top-level directory"

src="$extracted/$template"
if [ ! -d "$src" ]; then
  # Build the available-template list dynamically from the extracted tarball
  # so it stays accurate as templates are added / renamed / removed. Filter
  # by the documented naming convention "<language>-<type>".
  available=$(
    cd "$extracted" && \
      find . -mindepth 1 -maxdepth 1 -type d \
        \( -name 'go-*' -o -name 'python-*' -o -name 'react-*' -o -name 'rust-*' \) \
        -exec basename {} \; | sort | tr '\n' ' '
  )
  die "Template '$template' not found at ${REPO}@${REF}. Available: $available"
fi

if [ "$do_scaffold" = "yes" ]; then
  info "Scaffolding $template -> $dest (name=$name${module:+ module=$module})"
  if [ -n "$module" ]; then
    bash "$extracted/scripts/scaffold/scaffold.sh" \
      "template=$template" "dest=$dest" "name=$name" "module=$module"
  else
    bash "$extracted/scripts/scaffold/scaffold.sh" \
      "template=$template" "dest=$dest" "name=$name"
  fi
else
  info "Copying $template -> $dest (plain copy, no placeholder substitution)"
  cp -R "$src" "$dest"
  rm -f "$dest/docs/SYNC_FILES.md"
  rmdir "$dest/docs" 2>/dev/null || true
  warn "Project name '$template' is still embedded in source files."
  warn "Re-run with --name (and --module for Go) to substitute placeholders."
fi

info "Done: $dest"
