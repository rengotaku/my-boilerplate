#!/usr/bin/env bash
# Scaffold marker processing.
#
# Templates can annotate regions that only belong to some scaffold variants:
#
#   # @scaffold:remove-if no-auth     (Python / shell / TOML / Makefile)
#   {# @scaffold:remove-if no-auth #} (HTML / Jinja)
#   ...lines...
#   # @scaffold:end
#
#   from fastapi.responses import HTMLResponse  # @scaffold:keep-if no-sample
#
# The markers always disappear from the generated project, so scaffolding
# without any feature flag reproduces the template byte-for-byte.
#
# See strip_markers.awk for the condition names and the fail-closed rules.

_SCAFFOLD_MARKERS_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# strip_scaffold_markers <root> <no_auth 0|1> <no_sample 0|1>
#
# Rewrites every text file under <root> that contains an @scaffold marker.
# Aborts (exit 1) when a marker is malformed or unbalanced.
strip_scaffold_markers() {
  local root="$1"
  local no_auth="$2"
  local no_sample="$3"
  local listing="" rc=0 f tmp

  listing="$(grep -rIl -F '@scaffold:' "$root")" || rc=$?
  case "$rc" in
    0) ;;
    1) return 0 ;; # no markers anywhere
    *) die "failed to scan for scaffold markers under $root (grep rc=$rc)" ;;
  esac
  [[ -z "$listing" ]] && return 0

  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    tmp="$(mktemp "${TMPDIR:-/tmp}/scaffold-markers.XXXXXX")"
    if ! awk -v no_auth="$no_auth" -v no_sample="$no_sample" \
      -f "$_SCAFFOLD_MARKERS_LIB_DIR/strip_markers.awk" "$f" >"$tmp"; then
      rm -f "$tmp"
      die "failed to process scaffold markers: $f"
    fi
    # Rewrite in place so the file keeps its permissions.
    cat "$tmp" >"$f"
    rm -f "$tmp"
  done <<<"$listing"
}
