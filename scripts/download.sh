#!/bin/sh
# download.sh - Download a my-boilerplate template to a target directory.
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
#     | sh -s -- <template> <dest> [options]

set -eu

REPO="${MY_BOILERPLATE_REPO:-rengotaku/my-boilerplate}"
REF="${MY_BOILERPLATE_REF:-main}"
TARBALL_URL="https://github.com/${REPO}/archive/refs/heads/${REF}.tar.gz"

VALID_TEMPLATES="go-cli go-rest-api go-graphql-api go-grpc-api go-ssr-web python-cli python-web react-spa react-spa-graphql react-spa-cloudflare rust-cli"

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
  cat <<EOF
Usage: download.sh <template> <dest> [options]

Templates:
$(for t in $VALID_TEMPLATES; do echo "  - $t"; done)

Arguments:
  <template>   Template name from the list above
  <dest>       Destination directory (must not exist; parent must exist)

Options:
  --name=NAME       Project name (enables placeholder substitution).
                    Defaults to basename of <dest> when --module is given.
  --module=MODULE   Go module path (e.g., github.com/user/repo).
                    Required for go-* templates when scaffolding is enabled.
  -h, --help        Show this help.

Environment:
  MY_BOILERPLATE_REPO  Override repo (default: rengotaku/my-boilerplate)
  MY_BOILERPLATE_REF   Override ref / branch / tag (default: main)

Examples:
  # Plain copy (template name remains embedded in source files):
  sh download.sh go-ssr-web ~/projects/my-app

  # Full scaffolding (Go template):
  sh download.sh go-ssr-web ~/projects/my-app \\
    --name=my-app --module=github.com/me/my-app

  # Via curl:
  curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \\
    | sh -s -- go-ssr-web ~/projects/my-app
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
    --*) die "Unknown option: $1 (use --help)" ;;
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

valid=0
for t in $VALID_TEMPLATES; do
  if [ "$t" = "$template" ]; then
    valid=1
    break
  fi
done
[ "$valid" -eq 1 ] || die "Invalid template: $template (use --help to list)"

[ -e "$dest" ] && die "Destination already exists: $dest"
parent=$(dirname "$dest")
[ -d "$parent" ] || die "Parent directory does not exist: $parent"

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

if ! command -v bash >/dev/null 2>&1 && [ "$do_scaffold" = "yes" ]; then
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
[ -d "$src" ] || die "Template directory not found in tarball: $template"

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
