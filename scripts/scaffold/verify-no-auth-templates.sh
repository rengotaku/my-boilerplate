#!/usr/bin/env bash
# Verify which templates accept --no-auth (#333).
#
# `--no-auth` is implemented only for `react-spa` (apply_noauth) and
# `python-web` (python_features). Every other template must be rejected by
# scaffold.sh *before* the copy, so that no destination is left behind:
# `react-spa-cloudflare` used to produce a broken project, and `go-ssr-web`
# a half-rewritten one.
#
# The template list is read from lib/common.sh's VALID_TEMPLATES, the same list
# scaffold.sh validates against. A template added there is therefore covered
# here without editing this script.
#
# Checks:
#   1. react-spa + no-auth=1                     -> rc=0
#   2. python-web + no-auth=1                    -> rc=0
#   3. every other template + no-auth=1          -> rc!=0, no destination,
#                                                   message names the two
#                                                   supported templates
#   4. every template without no-auth            -> rc=0
#   5. react-spa-cloudflare + no-auth=0          -> rc=0
#   6. python-cli / python-llm-pipeline + no-auth=1 -> rc!=0, no destination
#      (they are rejected by the python-family rule, so only the exit status
#      and the missing destination are checked)
#
# The scaffolds only copy and rewrite files; no dependency install runs.
#
# Usage:
#   bash scripts/scaffold/verify-no-auth-templates.sh
#
# Exit status: 0 when every check passes, 1 otherwise, 2 on a harness error.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCAFFOLD="$SCRIPT_DIR/scaffold.sh"

# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

fail=0
ok() { printf 'OK   %s\n' "$*"; }
ng() {
  printf 'FAIL %s\n' "$*"
  fail=1
}

work="$(mktemp -d "${TMPDIR:-/tmp}/verify-no-auth-XXXXXX")"
trap 'rm -rf "$work"' EXIT

# Results of the last run_scaffold call.
LAST_LABEL=""
LAST_DEST=""
LAST_LOG=""
LAST_RC=0

# run_scaffold <label> <template> [flag...]
run_scaffold() {
  LAST_LABEL="$1"
  local template="$2"
  shift 2
  LAST_DEST="$work/dest-$LAST_LABEL"
  LAST_LOG="$work/$LAST_LABEL.log"
  local -a args=(template="$template" dest="$LAST_DEST" name="probe-$LAST_LABEL")
  # Go templates refuse to scaffold without a module name.
  if [[ "$template" == go-* ]]; then
    args+=(go-module-name="example.com/probe-$LAST_LABEL")
  fi
  LAST_RC=0
  bash "$SCAFFOLD" "${args[@]}" "$@" >"$LAST_LOG" 2>&1 || LAST_RC=$?
}

# expect_log_words <log> <word...> — sets MISSING_WORDS to the words that do
# not occur in <log>. A grep error aborts (it must not look like "not found").
MISSING_WORDS=""
expect_log_words() {
  local log="$1"
  shift
  local word rc=0
  MISSING_WORDS=""
  for word in "$@"; do
    rc=0
    grep -qF -- "$word" "$log" || rc=$?
    case "$rc" in
      0) ;;
      1) MISSING_WORDS+=" $word" ;;
      *)
        printf 'ERROR grep failed (rc=%s) on %s\n' "$rc" "$log" >&2
        exit 2
        ;;
    esac
  done
}

expect_accepted() {
  run_scaffold "$@"
  if [[ "$LAST_RC" -ne 0 ]]; then
    ng "$LAST_LABEL: expected rc=0, got rc=$LAST_RC"
    sed -n '1,20p' "$LAST_LOG"
  elif [[ ! -d "$LAST_DEST" ]]; then
    ng "$LAST_LABEL: rc=0 but no destination was created"
  else
    ok "$LAST_LABEL: scaffolded"
  fi
}

# The rejection itself: a non-zero exit and no destination left behind.
expect_rejected_basic() {
  run_scaffold "$@"
  if [[ "$LAST_RC" -eq 0 ]]; then
    ng "$LAST_LABEL: expected a non-zero exit, got rc=0"
  elif [[ -e "$LAST_DEST" ]]; then
    ng "$LAST_LABEL: rejected but created $LAST_DEST"
  else
    ok "$LAST_LABEL: rejected before the copy"
  fi
}

# expect_rejected <label> <template> — plus the message must name the two
# supported templates, so the fix is discoverable from the error alone.
expect_rejected() {
  expect_rejected_basic "$@"
  expect_log_words "$LAST_LOG" react-spa python-web
  if [[ -n "$MISSING_WORDS" ]]; then
    ng "$LAST_LABEL: the message does not name:$MISSING_WORDS"
    sed -n '1,20p' "$LAST_LOG"
  else
    ok "$LAST_LABEL: the message names the supported templates"
  fi
}

# --- 1 / 2 / 3 / 6: reject everything except the two supported templates -----
accepted_noauth=0
rejected_noauth=0
for template in "${VALID_TEMPLATES[@]}"; do
  case "$template" in
    react-spa | python-web)
      expect_accepted "noauth-$template" "$template" no-auth=1
      accepted_noauth=$((accepted_noauth + 1))
      ;;
    python-*)
      # python-cli / python-llm-pipeline: rejected by the python-family rule.
      expect_rejected_basic "reject-$template" "$template" no-auth=1
      rejected_noauth=$((rejected_noauth + 1))
      ;;
    *)
      expect_rejected "reject-$template" "$template" no-auth=1
      rejected_noauth=$((rejected_noauth + 1))
      ;;
  esac
done

# --- 5: no-auth=0 means "not requested", so it stays allowed ----------------
expect_accepted react-spa-cloudflare-noauth0 react-spa-cloudflare no-auth=0

# --- 4: every template scaffolds unchanged without the flag -----------------
plain=0
for template in "${VALID_TEMPLATES[@]}"; do
  expect_accepted "plain-$template" "$template"
  plain=$((plain + 1))
done

# --- Coverage: every entry must be exercised exactly once -------------------
total="${#VALID_TEMPLATES[@]}"
printf '\n'
printf 'VALID_TEMPLATES: %d\n' "$total"
printf '  accepted with no-auth=1:     %d\n' "$accepted_noauth"
printf '  rejected with no-auth=1:     %d\n' "$rejected_noauth"
printf '  scaffolded without no-auth:  %d\n' "$plain"
if [[ $((accepted_noauth + rejected_noauth)) -ne "$total" || "$plain" -ne "$total" ]]; then
  ng "the loops did not cover every VALID_TEMPLATES entry exactly once"
fi

printf '\n'
if [[ "$fail" == "0" ]]; then
  printf '=== no-auth template support: all checks passed ===\n'
else
  printf '=== no-auth template support: FAILED ===\n'
fi
exit "$fail"
