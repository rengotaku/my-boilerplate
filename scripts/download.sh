#!/bin/sh
# download.sh - Fetch a my-boilerplate template and scaffold it as a usable
# standalone project at a target directory.
#
# This script does NOT require my-boilerplate to be cloned locally. It
# downloads the tarball at the requested ref, extracts the requested template
# directory, and **always** delegates to the bundled scripts/scaffold/scaffold.sh
# which rewrites template-name placeholders (Makefile, HTML, Go module path,
# package.json name, etc.) so the result is immediately usable.
#
# Scaffolding is mandatory; there is no plain-copy mode. The premise of this
# tool is "create a new project from a boilerplate", not "fetch raw files".
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
#     | sh -s -- <template> <dest> [--name=NAME]
#
# Required:
#   <template>   Template directory name (e.g., go-ssr-web, react-spa).
#                Validated against the actual contents of the downloaded
#                tarball; an unknown name prints the available list.
#   <dest>       Destination directory (must not exist; parent must exist).
#
# Optional:
#   --name=NAME  Project name written into Makefile / package.json / etc.
#                Defaults to basename(<dest>).
#
# Go templates: the `module` line in go.mod is auto-set to basename(<dest>),
# producing a local-only module suitable for prototyping. If you plan to
# publish the project, edit go.mod after scaffolding:
#   go mod edit -module github.com/<user>/<repo>
# The Next steps message printed by scaffold.sh repeats this hint.
#
# Environment:
#   MY_BOILERPLATE_REPO  Override repo (default: rengotaku/my-boilerplate).
#   MY_BOILERPLATE_REF   Override ref / branch / tag (default: main).
#
# Example:
#   curl -sSL .../download.sh | sh -s -- go-ssr-web ~/projects/my-app

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
Usage: download.sh <template> <dest> [--name=NAME]

See https://github.com/rengotaku/my-boilerplate#usage for full documentation.
Run with an unknown <template> to see the currently available list.
EOF
}

template=""
dest=""
name=""

while [ $# -gt 0 ]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --name=*) name="${1#--name=}" ;;
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

# Scaffolding is mandatory. Auto-derive name from <dest> so a single positional
# argument is enough for the common case. For go-* templates we also derive a
# local-only module name; users who plan to publish should run
# `go mod edit -module github.com/<user>/<repo>` after scaffolding.
[ -z "$name" ] && name=$(basename "$dest")

module=""
case "$template" in
  go-*) module=$(basename "$dest") ;;
esac

if ! command -v bash >/dev/null 2>&1; then
  die "bash is required to run the bundled scripts/scaffold/scaffold.sh"
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

if [ ! -d "$extracted/$template" ]; then
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

# Always invoke scaffold.sh. It rewrites template-name placeholders (Makefile /
# HTML / Go module path / package.json name etc.) so the resulting directory
# is a usable standalone project.
info "Scaffolding $template -> $dest (name=$name${module:+ go-module-name=$module})"
if [ -n "$module" ]; then
  bash "$extracted/scripts/scaffold/scaffold.sh" \
    "template=$template" "dest=$dest" "name=$name" "go-module-name=$module"
else
  bash "$extracted/scripts/scaffold/scaffold.sh" \
    "template=$template" "dest=$dest" "name=$name"
fi

info "Done: $dest"
