#!/usr/bin/env bash
# Verify a scaffolded python-web project for one feature-flag variant.
#
# Usage:
#   bash scripts/scaffold/verify-python-web-flags.sh <project-dir> <variant>
#
# <variant> is one of:
#   default             no flags (auth + items sample present)
#   no-auth             --no-auth
#   no-sample           --no-sample
#   no-auth-no-sample   --no-auth --no-sample
#
# File-level checks only (no dependencies needed). The workflow runs
# `alembic upgrade head`, a GET / smoke test and `make ci` after this.
#
# Exit status: 0 when every check passes, 1 otherwise.

set -euo pipefail

dir="${1:?usage: verify-python-web-flags.sh <project-dir> <variant>}"
variant="${2:?usage: verify-python-web-flags.sh <project-dir> <variant>}"

fail=0
ok() { printf 'OK   %s\n' "$*"; }
ng() {
  printf 'FAIL %s\n' "$*"
  fail=1
}

# _grep <pattern> <path...> — prints matches, aborts on a grep error (so a
# missing path is never mistaken for "no matches").
_grep() {
  local pattern="$1"
  shift
  local out="" rc=0
  out="$(grep -rnIE "$pattern" "$@")" || rc=$?
  case "$rc" in
    0) printf '%s' "$out" ;;
    1) ;;
    *)
      printf 'ERROR grep failed (rc=%s): %s\n' "$rc" "$pattern" >&2
      exit 2
      ;;
  esac
}

expect_absent() {
  local path="$1"
  if [[ -e "$dir/$path" ]]; then
    ng "should be absent: $path"
  else
    ok "absent: $path"
  fi
}

expect_present() {
  local path="$1"
  if [[ -e "$dir/$path" ]]; then
    ok "present: $path"
  else
    ng "should exist: $path"
  fi
}

expect_no_match() {
  local pattern="$1"
  shift
  local hits
  hits="$(_grep "$pattern" "$@")"
  if [[ -z "$hits" ]]; then
    ok "no /$pattern/ in $*"
  else
    printf '%s\n' "$hits"
    ng "unexpected /$pattern/ in $*"
  fi
}

# The scaffolded package directory (src/<project-name>, renamed by python.sh).
pkg_dir="$(find "$dir/src" -mindepth 1 -maxdepth 1 -type d | sed -n '1p')"
if [[ -z "$pkg_dir" ]]; then
  printf 'ERROR no package directory under %s/src\n' "$dir" >&2
  exit 2
fi
pkg_dir="${pkg_dir#"$dir"/}"

case "$variant" in
  default | no-auth | no-sample | no-auth-no-sample) ;;
  *)
    printf 'ERROR unknown variant: %s\n' "$variant" >&2
    exit 2
    ;;
esac

needs_auth=1
needs_sample=1
case "$variant" in
  no-auth) needs_auth=0 ;;
  no-sample) needs_sample=0 ;;
  no-auth-no-sample)
    needs_auth=0
    needs_sample=0
    ;;
esac

# --- Auth (--no-auth) --------------------------------------------------------
if [[ "$needs_auth" == "1" ]]; then
  expect_present "$pkg_dir/routes/auth.py"
  expect_present "$pkg_dir/auth/__init__.py"
  expect_present "$pkg_dir/repositories/user_repo.py"
  expect_present "$pkg_dir/services/user_service.py"
  expect_present "templates/auth/login.html"
  expect_present "tests/test_auth.py"
else
  expect_absent "$pkg_dir/routes/auth.py"
  expect_absent "$pkg_dir/auth"
  expect_absent "$pkg_dir/repositories/user_repo.py"
  expect_absent "$pkg_dir/services/user_service.py"
  expect_absent "templates/auth"
  expect_absent "tests/test_auth.py"
  expect_absent "tests/test_auth_routes.py"
  expect_absent "tests/test_user_service.py"

  # Acceptance criterion 2: no auth/login/register references anywhere in the
  # generated source or templates.
  expect_no_match 'auth|login|register' "$dir/src" "$dir/templates"
  expect_no_match 'jwt|JWT' "$dir/$pkg_dir/config.py"
  expect_no_match 'users' "$dir/$pkg_dir/alembic/versions"
fi

# --- Items sample (--no-sample) ---------------------------------------------
if [[ "$needs_sample" == "1" ]]; then
  expect_present "$pkg_dir/routes/items.py"
  expect_present "$pkg_dir/repositories/item_repo.py"
  expect_present "$pkg_dir/services/item_service.py"
  expect_present "templates/items/new.html"
  expect_present "tests/test_repositories.py"
  if grep -q 'for item in items' "$dir/templates/index.html"; then
    ok 'index.html renders the items listing'
  else
    ng 'index.html should render the items listing'
  fi
else
  expect_absent "$pkg_dir/routes/items.py"
  expect_absent "$pkg_dir/repositories/item_repo.py"
  expect_absent "$pkg_dir/services/item_service.py"
  expect_absent "templates/items"
  expect_absent "tests/test_repositories.py"
  expect_absent "tests/test_services.py"

  # Acceptance criterion 3 (+ test case 3): the sample leaves no routes, no
  # model and no items listing behind. `items-center` (a Tailwind utility) is
  # a legitimate occurrence, so the route path and the template loop are
  # checked directly instead of a bare "items" grep.
  expect_no_match '/items|items_routes|item_service|item_repo' "$dir/src"
  expect_no_match '^class Item\(' "$dir/$pkg_dir/models.py"
  expect_no_match 'items' "$dir/templates/index.html"
  expect_no_match 'Item' "$dir/templates/index.html"
  expect_no_match 'items' "$dir/$pkg_dir/alembic/versions"
fi

# --- Markers / manifests never ship -----------------------------------------
expect_absent ".noauth-remove"
expect_absent ".nosample-remove"
expect_no_match '@scaffold' "$dir"

# --- Shared invariants -------------------------------------------------------
# The app and the "GET / returns 200" test must exist in every variant.
expect_present "$pkg_dir/app.py"
expect_present "tests/test_routes.py"
if grep -q 'def test_index_returns_200' "$dir/tests/test_routes.py"; then
  ok 'test_routes.py keeps test_index_returns_200'
else
  ng 'test_routes.py must keep test_index_returns_200 (GET / smoke test)'
fi

printf '\n'
if [[ "$fail" == "0" ]]; then
  printf '=== %s: all checks passed ===\n' "$variant"
else
  printf '=== %s: FAILED ===\n' "$variant"
fi
exit "$fail"
