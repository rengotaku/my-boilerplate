#!/bin/sh
# download.sh - Fetch a my-boilerplate template.
#
# This script does NOT require my-boilerplate to be cloned locally. It
# downloads the tarball at the requested ref and operates on the extracted
# contents in one of four modes:
#
#   <template> <dest>           Scaffold a new project (default).
#   --list                      Print the available templates list.
#   <template> --tree           Print the template's file tree.
#   <template> <dest> --pick=…  Copy specific files into an existing project.
#
# Scaffold mode (the original behavior) is unchanged. It always delegates to
# scripts/scaffold/scaffold.sh so template-name placeholders are rewritten and
# the produced directory is immediately usable. The other modes are read-only
# (--list / --tree) or strictly file-copy (--pick) and never run scaffold.sh.
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
#     | sh -s -- <template> <dest> [--name=NAME] [--no-github-templates] [--no-auth]
#   curl -sSL .../download.sh | sh -s -- --list [--format=json]
#   curl -sSL .../download.sh | sh -s -- <template> --tree
#   curl -sSL .../download.sh | sh -s -- <template> <dest> --pick=PATH[,PATH...] [--apply] [--overwrite]
#
# Required (scaffold / pick):
#   <template>   Template directory name (e.g., go-cli, go-react-spa, react-spa).
#                Validated against the actual contents of the downloaded
#                tarball; an unknown name prints the available list.
#   <dest>       Destination directory. In scaffold mode it must not exist
#                (parent must); in --pick mode it must already exist.
#
# Optional (scaffold):
#   --name=NAME               Project name written into Makefile / package.json / etc.
#                             Defaults to basename(<dest>).
#   --no-github-templates     Skip injecting .github/PULL_REQUEST_TEMPLATE.md and
#                             .github/ISSUE_TEMPLATE/*.md into the scaffolded project.
#   --no-auth                 (go-react-spa only) strip JWT auth at scaffold time.
#
# --list:
#   --format=text  (default) human-readable columns: name / language / description
#   --format=json  machine-readable JSON array (each entry has name / language /
#                  description / tags). Recommended when an AI assistant invokes
#                  this script — easier to parse, fewer tokens.
#
# --tree:
#   Prints a flat sorted list of files under the template directory (relative to
#   the template root). Composite templates (those that ship a `.compose.toml`)
#   include a trailing note explaining that frontend/ is materialized at
#   scaffold time from a sibling template.
#
# --pick:
#   --pick=PATH[,PATH...]   Files / directories under the template to copy.
#                           Directories are walked recursively.
#   --apply                 Without this flag the run is a dry-run and only
#                           prints would-add / would-overwrite / would-skip
#                           lines. The default is dry-run on purpose so that
#                           accidental overwrites cannot happen.
#   --overwrite             When --apply is set, replace existing files at the
#                           destination. Without --overwrite the default is to
#                           skip existing files.
#   Composite templates (those with a .compose.toml) are supported, but
#   `frontend/`, `frontend.overlay/`, and `.compose.toml` itself are skipped
#   with a [WARN]: those entries only make sense after scaffold-time compose
#   and copying them into an existing project would do the wrong thing.
#
# Go templates (scaffold mode): the `module` line in go.mod is auto-set to
# basename(<dest>), producing a local-only module suitable for prototyping. If
# you plan to publish the project, edit go.mod after scaffolding:
#   go mod edit -module github.com/<user>/<repo>
# The Next steps message printed by scaffold.sh repeats this hint.
#
# Environment:
#   MY_BOILERPLATE_REPO  Override repo (default: rengotaku/my-boilerplate).
#   MY_BOILERPLATE_REF   Override ref / branch / tag (default: main).
#
# Examples:
#   curl -sSL .../download.sh | sh -s -- go-ssr-web ~/projects/my-app
#   curl -sSL .../download.sh | sh -s -- --list
#   curl -sSL .../download.sh | sh -s -- --list --format=json
#   curl -sSL .../download.sh | sh -s -- go-cli --tree
#   curl -sSL .../download.sh | sh -s -- go-cli ./existing --pick=Makefile,.golangci.yml
#   curl -sSL .../download.sh | sh -s -- go-cli ./existing --pick=Makefile --apply --overwrite

set -eu

REPO="${MY_BOILERPLATE_REPO:-rengotaku/my-boilerplate}"
REF="${MY_BOILERPLATE_REF:-main}"
# MY_BOILERPLATE_TARBALL_URL lets tests / CI / forks point at a local file://
# URL or a non-GitHub mirror without monkey-patching $REPO / $REF.
TARBALL_URL="${MY_BOILERPLATE_TARBALL_URL:-https://github.com/${REPO}/archive/refs/heads/${REF}.tar.gz}"

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
Usage:
  download.sh <template> <dest> [--name=NAME] [--no-github-templates] [--no-auth]
  download.sh --list [--format=text|json]
  download.sh <template> --tree
  download.sh <template> <dest> --pick=PATH[,PATH...] [--apply] [--overwrite]

See https://github.com/rengotaku/my-boilerplate#usage for full documentation.
EOF
}

template=""
dest=""
name=""
no_github_templates=""
no_auth=""
mode="scaffold"
format="text"
pick=""
apply=""
overwrite=""

while [ $# -gt 0 ]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --name=*) name="${1#--name=}" ;;
    --no-github-templates) no_github_templates="1" ;;
    --no-auth) no_auth="1" ;;
    --list) mode="list" ;;
    --tree) mode="tree" ;;
    --pick=*)
      pick="${1#--pick=}"
      mode="pick"
      ;;
    --apply) apply="1" ;;
    --overwrite) overwrite="1" ;;
    --format=*) format="${1#--format=}" ;;
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

# Mode-specific argument validation. The default is scaffold mode, but the
# other modes intentionally relax the <template> / <dest> requirements:
#   --list           neither
#   --tree           template only
#   --pick           both (dest must already exist)
case "$mode" in
  list)
    [ -n "$template" ] && die "--list takes no positional arguments"
    [ -n "$dest" ] && die "--list takes no positional arguments"
    case "$format" in
      text | json) ;;
      *) die "Unknown --format: $format (expected text or json)" ;;
    esac
    ;;
  tree)
    [ -z "$template" ] && die "--tree requires <template>"
    [ -n "$dest" ] && die "--tree does not take <dest>"
    ;;
  pick)
    [ -z "$template" ] && die "--pick requires <template>"
    [ -z "$dest" ] && die "--pick requires <dest>"
    [ -z "$pick" ] && die "--pick requires at least one path"
    ;;
  scaffold)
    if [ -z "$template" ] || [ -z "$dest" ]; then
      usage
      exit 1
    fi
    ;;
esac

# Sanity-check the template token before hitting the network. The authoritative
# validation happens after extraction (against the actual tarball contents) so
# that template additions / renames / removals do not require editing this file.
if [ -n "$template" ]; then
  case "$template" in
    *[!a-zA-Z0-9_-]* | -*)
      die "Invalid template name: $template"
      ;;
  esac
fi

if [ "$mode" = "scaffold" ]; then
  [ -e "$dest" ] && die "Destination already exists: $dest"
  parent=$(dirname "$dest")
  [ -d "$parent" ] || die "Parent directory does not exist: $parent"

  # Auto-derive name from <dest> so a single positional argument is enough.
  [ -z "$name" ] && name=$(basename "$dest")

  module=""
  case "$template" in
    go-*) module=$(basename "$dest") ;;
  esac

  if ! command -v bash >/dev/null 2>&1; then
    die "bash is required to run the bundled scripts/scaffold/scaffold.sh"
  fi
elif [ "$mode" = "pick" ]; then
  [ -d "$dest" ] || die "Destination directory does not exist: $dest (--pick requires an existing project)"
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

# Parse a single string-valued TOML field from template.toml. The template.toml
# files we ship are intentionally simple `key = "value"` lines, so a plain
# grep+sed is sufficient and avoids requiring a TOML parser at runtime.
toml_string_field() {
  toml_file="$1"
  key="$2"
  [ -f "$toml_file" ] || { printf '%s' ""; return; }
  grep -E "^${key}[[:space:]]*=" "$toml_file" \
    | head -n1 \
    | sed -E 's/^[^=]+=[[:space:]]*"([^"]*)".*/\1/'
}

# Parse a TOML array of strings (e.g. tags = ["a", "b"]) into a comma-separated
# list. Single-line arrays only — multi-line arrays are not used in our toml.
toml_array_field() {
  toml_file="$1"
  key="$2"
  [ -f "$toml_file" ] || { printf '%s' ""; return; }
  grep -E "^${key}[[:space:]]*=" "$toml_file" \
    | head -n1 \
    | sed -E 's/^[^=]+=[[:space:]]*\[(.*)\].*/\1/' \
    | tr ',' '\n' \
    | sed -E 's/^[[:space:]]*"([^"]*)".*$/\1/' \
    | paste -sd ',' -
}

# Escape a string for safe inclusion inside a JSON double-quoted string.
# Only the two characters that *must* be escaped — backslash and quote — are
# touched. Our descriptions don't contain control characters; if that changes
# this needs to grow.
json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

# Discover the templates we know about by looking for template.toml files. This
# is the single source of truth for --list output — adding a new template
# requires dropping template.toml into the template directory, nothing else.
discover_templates() {
  ( cd "$extracted" && \
    find . -mindepth 2 -maxdepth 2 -type f -name 'template.toml' \
      | sed -E 's|^\./([^/]+)/template\.toml$|\1|' \
      | sort )
}

emit_list_text() {
  # Render an aligned 3-column table: name / language / description.
  # The widths are computed from the actual entries so adding a long template
  # name doesn't break alignment.
  templates=$(discover_templates)
  [ -z "$templates" ] && die "No templates with template.toml found in tarball"

  name_w=0
  lang_w=0
  for t in $templates; do
    nlen=${#t}
    [ "$nlen" -gt "$name_w" ] && name_w=$nlen
    lang=$(toml_string_field "$extracted/$t/template.toml" language)
    llen=${#lang}
    [ "$llen" -gt "$lang_w" ] && lang_w=$llen
  done
  name_w=$((name_w + 2))
  lang_w=$((lang_w + 2))

  for t in $templates; do
    lang=$(toml_string_field "$extracted/$t/template.toml" language)
    desc=$(toml_string_field "$extracted/$t/template.toml" description)
    printf "%-${name_w}s%-${lang_w}s%s\n" "$t" "$lang" "$desc"
  done
}

emit_list_json() {
  templates=$(discover_templates)
  printf '['
  first=1
  for t in $templates; do
    lang=$(toml_string_field "$extracted/$t/template.toml" language)
    desc=$(toml_string_field "$extracted/$t/template.toml" description)
    tags=$(toml_array_field "$extracted/$t/template.toml" tags)
    if [ "$first" = 1 ]; then
      first=0
    else
      printf ','
    fi
    printf '{"name":"%s","language":"%s","description":"%s","tags":[' \
      "$(json_escape "$t")" \
      "$(json_escape "$lang")" \
      "$(json_escape "$desc")"
    tfirst=1
    OLDIFS=$IFS
    IFS=','
    for tag in $tags; do
      [ -z "$tag" ] && continue
      if [ "$tfirst" = 1 ]; then
        tfirst=0
      else
        printf ','
      fi
      printf '"%s"' "$(json_escape "$tag")"
    done
    IFS=$OLDIFS
    printf ']}'
  done
  printf ']\n'
}

run_list() {
  case "$format" in
    text) emit_list_text ;;
    json) emit_list_json ;;
  esac
}

run_tree() {
  [ -d "$extracted/$template" ] || die "Template '$template' not found at ${REPO}@${REF}"
  printf '%s/\n' "$template"
  ( cd "$extracted/$template" && find . -mindepth 1 -type f \
      | sed -E 's|^\./|  |' \
      | sort )
  if [ -f "$extracted/$template/.compose.toml" ]; then
    printf '\n'
    printf 'Note: composite template — frontend/ is materialized from a sibling\n'
    printf '      template at scaffold time (see .compose.toml). The tree above\n'
    printf '      shows only the overlay diff, not the final scaffolded layout.\n'
  fi
}

run_pick() {
  [ -d "$extracted/$template" ] || die "Template '$template' not found at ${REPO}@${REF}"

  is_composite=""
  [ -f "$extracted/$template/.compose.toml" ] && is_composite="1"

  prefix="[DRY-RUN] "
  [ -n "$apply" ] && prefix=""

  src_root="$extracted/$template"

  # Split pick on comma into a newline-separated list, then iterate. Using a
  # while/read loop (instead of word-splitting the comma list) keeps paths with
  # spaces working — though we expect none of our templates to ship such files.
  # The inner loop emits only candidate file paths on stdout; not-found
  # warnings go to stderr so they don't get re-processed by the outer loop.
  #
  # For composite templates, frontend/ and frontend.overlay/ only make sense
  # after scaffold-time compose, and .compose.toml itself is a scaffold-only
  # manifest. Skip those three with a [WARN] so callers see why their path was
  # dropped instead of getting a silent partial result.
  printf '%s\n' "$pick" | tr ',' '\n' | while IFS= read -r path || [ -n "$path" ]; do
    [ -z "$path" ] && continue
    if [ -n "$is_composite" ]; then
      case "$path" in
        frontend | frontend/* | frontend.overlay | frontend.overlay/* | .compose.toml)
          warn "skip overlay path: $path (composite template '$template' — only meaningful after scaffold-time compose)"
          continue
          ;;
      esac
    fi
    src="$src_root/$path"
    if [ ! -e "$src" ]; then
      warn "not found in template: $path"
      continue
    fi
    if [ -d "$src" ]; then
      find "$src" -type f
    else
      printf '%s\n' "$src"
    fi
  done | while IFS= read -r f; do
    [ -z "$f" ] && continue
    rel="${f#$src_root/}"
    target="$dest/$rel"
    if [ -e "$target" ]; then
      if [ -n "$overwrite" ]; then
        action="overwrite"
      else
        action="skip"
      fi
    else
      action="add"
    fi
    printf '%swould %s: %s\n' "$prefix" "$action" "$rel"
    if [ -n "$apply" ] && [ "$action" != "skip" ]; then
      mkdir -p "$(dirname "$target")"
      cp "$f" "$target"
    fi
  done

  if [ -z "$apply" ]; then
    printf '\n'
    printf 'Run with --apply to execute. Add --overwrite to replace existing files.\n'
  fi
}

run_scaffold() {
  if [ ! -d "$extracted/$template" ]; then
    available=$(discover_templates | tr '\n' ' ')
    die "Template '$template' not found at ${REPO}@${REF}. Available: $available"
  fi

  # Always invoke scaffold.sh. It rewrites template-name placeholders
  # (Makefile / HTML / Go module path / package.json name etc.) so the
  # resulting directory is a usable standalone project. Composite templates
  # (those that ship a `.compose.toml`, e.g. go-react-spa) read sibling
  # templates from $extracted during scaffolding, so the full tarball must
  # remain available — do not pre-trim it down to $extracted/$template here.
  info "Scaffolding $template -> $dest (name=$name${module:+ go-module-name=$module}${no_auth:+ no-auth})"
  scaffold_args="template=$template dest=$dest name=$name"
  [ -n "$module" ] && scaffold_args="$scaffold_args go-module-name=$module"
  [ -n "$no_github_templates" ] && scaffold_args="$scaffold_args no-github-templates=1"
  [ -n "$no_auth" ] && scaffold_args="$scaffold_args no-auth=1"
  # shellcheck disable=SC2086
  bash "$extracted/scripts/scaffold/scaffold.sh" $scaffold_args

  info "Done: $dest"
}

case "$mode" in
  list) run_list ;;
  tree) run_tree ;;
  pick) run_pick ;;
  scaffold) run_scaffold ;;
esac
