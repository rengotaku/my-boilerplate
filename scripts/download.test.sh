#!/bin/sh
# Test suite for scripts/download.sh
#
# Uses MY_BOILERPLATE_TARBALL_URL=file://... to test against the local repo
# without hitting GitHub. Run via: make download-test
#
# Exit code: 0 if all tests pass, 1 if any fail.

set -eu

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOWNLOAD_SH="$REPO_ROOT/scripts/download.sh"

pass=0
fail=0

# ---- helpers ----------------------------------------------------------------

assert_contains() {
  label="$1"
  expected="$2"
  actual="$3"
  if printf '%s' "$actual" | grep -qF "$expected"; then
    pass=$((pass + 1))
    printf 'PASS  %s\n' "$label"
  else
    fail=$((fail + 1))
    printf 'FAIL  %s\n' "$label"
    printf '      expected to contain: %s\n' "$expected"
    printf '      actual output:\n'
    printf '%s\n' "$actual" | sed 's/^/        /'
  fi
}

assert_not_contains() {
  label="$1"
  unexpected="$2"
  actual="$3"
  if printf '%s' "$actual" | grep -qF "$unexpected"; then
    fail=$((fail + 1))
    printf 'FAIL  %s\n' "$label"
    printf '      expected NOT to contain: %s\n' "$unexpected"
  else
    pass=$((pass + 1))
    printf 'PASS  %s\n' "$label"
  fi
}

assert_file_exists() {
  label="$1"
  path="$2"
  if [ -f "$path" ]; then
    pass=$((pass + 1))
    printf 'PASS  %s\n' "$label"
  else
    fail=$((fail + 1))
    printf 'FAIL  %s\n' "$label"
    printf '      file not found: %s\n' "$path"
  fi
}

assert_file_not_changed() {
  label="$1"
  path="$2"
  expected_content="$3"
  actual_content=$(cat "$path" 2>/dev/null || true)
  if [ "$actual_content" = "$expected_content" ]; then
    pass=$((pass + 1))
    printf 'PASS  %s\n' "$label"
  else
    fail=$((fail + 1))
    printf 'FAIL  %s\n' "$label"
    printf '      file content changed unexpectedly: %s\n' "$path"
  fi
}

run_download() {
  MY_BOILERPLATE_TARBALL_URL="file://$tarball" sh "$DOWNLOAD_SH" "$@" 2>/dev/null
}

run_download_stderr() {
  MY_BOILERPLATE_TARBALL_URL="file://$tarball" sh "$DOWNLOAD_SH" "$@" 2>&1 >/dev/null || true
}

# ---- tarball setup ----------------------------------------------------------

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT TERM

tarball="$tmpdir/repo.tar.gz"
tar_src="$tmpdir/my-boilerplate-main"

printf '[setup] Building local tarball from %s...\n' "$REPO_ROOT"
# Create a copy of the repo with the expected top-level directory name.
# Exclude build artifacts that bloat the tarball and are irrelevant to tests.
cp -r "$REPO_ROOT" "$tar_src"
# Remove heavy directories that are irrelevant to download.sh tests
rm -rf \
  "$tar_src/.git" \
  "$tar_src/e2e/node_modules" \
  "$tar_src/react-spa/node_modules" \
  "$tar_src/react-spa-cloudflare/node_modules" \
  "$tar_src/react-spa-graphql/node_modules" \
  2>/dev/null || true
tar -czf "$tarball" -C "$tmpdir" my-boilerplate-main
printf '[setup] Tarball ready: %s\n\n' "$tarball"

# ---- test: --list (text) includes github-workflow ---------------------------

echo '--- --list (text) ---'

list_text=$(run_download --list)
assert_contains "--list text: github-workflow appears" "github-workflow" "$list_text"
assert_contains "--list text: go-cli appears (regression)" "go-cli" "$list_text"
assert_contains "--list text: language column shows docs for github-workflow" "docs" "$list_text"

# ---- test: --list --format=json includes github-workflow --------------------

echo '--- --list --format=json ---'

list_json=$(run_download --list --format=json)
assert_contains "--list json: github-workflow name" '"name":"github-workflow"' "$list_json"
assert_contains "--list json: language docs" '"language":"docs"' "$list_json"
assert_contains "--list json: github-workflow tag" '"github-workflow"' "$list_json"
assert_contains "--list json: go-cli appears (regression)" '"name":"go-cli"' "$list_json"

# ---- test: github-workflow --tree -------------------------------------------

echo '--- github-workflow --tree ---'

tree_out=$(run_download github-workflow --tree)
assert_contains "--tree: header line" "github-workflow/" "$tree_out"
assert_contains "--tree: PR-template.md" "PR-template.md" "$tree_out"
assert_contains "--tree: README.md" "README.md" "$tree_out"
assert_contains "--tree: completion-comment.md" "completion-comment.md" "$tree_out"
assert_contains "--tree: discussion-issue.md" "discussion-issue.md" "$tree_out"
assert_contains "--tree: issue-workflow.md" "issue-workflow.md" "$tree_out"
assert_contains "--tree: parent-issue.md" "parent-issue.md" "$tree_out"
assert_contains "--tree: sub-issue.md" "sub-issue.md" "$tree_out"

# ---- test: go-cli --tree regression -----------------------------------------

echo '--- go-cli --tree (regression) ---'

go_cli_tree=$(run_download go-cli --tree)
assert_contains "go-cli --tree: header" "go-cli/" "$go_cli_tree"
assert_contains "go-cli --tree: Makefile" "Makefile" "$go_cli_tree"

# ---- test: github-workflow --pick dry-run -----------------------------------

echo '--- github-workflow --pick dry-run ---'

dest=$(mktemp -d)
dry_out=$(run_download github-workflow "$dest" --pick=PR-template.md)
assert_contains "--pick dry-run: would add" "would add: PR-template.md" "$dry_out"
assert_contains "--pick dry-run: dry-run prefix" "[DRY-RUN]" "$dry_out"
# File must NOT have been created in dry-run mode
if [ -f "$dest/PR-template.md" ]; then
  fail=$((fail + 1))
  printf 'FAIL  --pick dry-run: PR-template.md must not exist without --apply\n'
else
  pass=$((pass + 1))
  printf 'PASS  --pick dry-run: PR-template.md not created without --apply\n'
fi
rm -rf "$dest"

# ---- test: github-workflow --pick --apply -----------------------------------

echo '--- github-workflow --pick --apply ---'

dest=$(mktemp -d)
apply_out=$(run_download github-workflow "$dest" --pick=PR-template.md --apply)
assert_contains "--pick apply: would add output" "would add: PR-template.md" "$apply_out"
assert_file_exists "--pick apply: PR-template.md created" "$dest/PR-template.md"

# Verify content matches the source
expected_content=$(cat "$REPO_ROOT/meta/github-workflow/PR-template.md")
actual_content=$(cat "$dest/PR-template.md")
if [ "$expected_content" = "$actual_content" ]; then
  pass=$((pass + 1))
  printf 'PASS  --pick apply: content matches source\n'
else
  fail=$((fail + 1))
  printf 'FAIL  --pick apply: content does not match source\n'
fi
rm -rf "$dest"

# ---- test: --pick --apply existing file → skip (no overwrite) ---------------

echo '--- github-workflow --pick existing file skip ---'

dest=$(mktemp -d)
printf 'original content\n' > "$dest/PR-template.md"
original="original content"
skip_out=$(run_download github-workflow "$dest" --pick=PR-template.md --apply)
assert_contains "--pick skip: would skip" "would skip: PR-template.md" "$skip_out"
assert_file_not_changed "--pick skip: file not overwritten" "$dest/PR-template.md" "original content"
rm -rf "$dest"

# ---- test: --pick --apply --overwrite existing file -------------------------

echo '--- github-workflow --pick --overwrite ---'

dest=$(mktemp -d)
printf 'old content\n' > "$dest/PR-template.md"
over_out=$(run_download github-workflow "$dest" --pick=PR-template.md --apply --overwrite)
assert_contains "--pick overwrite: would overwrite" "would overwrite: PR-template.md" "$over_out"
assert_file_exists "--pick overwrite: file still exists" "$dest/PR-template.md"
new_content=$(cat "$dest/PR-template.md")
if [ "$new_content" != "old content" ]; then
  pass=$((pass + 1))
  printf 'PASS  --pick overwrite: content replaced\n'
else
  fail=$((fail + 1))
  printf 'FAIL  --pick overwrite: content was not replaced\n'
fi
rm -rf "$dest"

# ---- test: --pick non-existent path warns -----------------------------------

echo '--- github-workflow --pick non-existent path ---'

dest=$(mktemp -d)
warn_out=$(run_download_stderr github-workflow "$dest" --pick=no-such-file.md)
assert_contains "--pick warn: not found in template" "not found in template: no-such-file.md" "$warn_out"
rm -rf "$dest"

# ---- test: --pick multiple files --------------------------------------------

echo '--- github-workflow --pick multiple files ---'

dest=$(mktemp -d)
multi_out=$(run_download github-workflow "$dest" \
  --pick=PR-template.md,parent-issue.md,sub-issue.md,discussion-issue.md --apply)
assert_contains "--pick multi: PR-template.md" "would add: PR-template.md" "$multi_out"
assert_contains "--pick multi: parent-issue.md" "would add: parent-issue.md" "$multi_out"
assert_contains "--pick multi: sub-issue.md" "would add: sub-issue.md" "$multi_out"
assert_contains "--pick multi: discussion-issue.md" "would add: discussion-issue.md" "$multi_out"
assert_file_exists "--pick multi: PR-template.md created" "$dest/PR-template.md"
assert_file_exists "--pick multi: parent-issue.md created" "$dest/parent-issue.md"
assert_file_exists "--pick multi: sub-issue.md created" "$dest/sub-issue.md"
assert_file_exists "--pick multi: discussion-issue.md created" "$dest/discussion-issue.md"
rm -rf "$dest"

# ---- test: go-cli --pick regression -----------------------------------------

echo '--- go-cli --pick regression ---'

dest=$(mktemp -d)
gc_out=$(run_download go-cli "$dest" --pick=Makefile --apply)
assert_contains "go-cli --pick: Makefile added" "would add: Makefile" "$gc_out"
assert_file_exists "go-cli --pick: Makefile created" "$dest/Makefile"
rm -rf "$dest"

# ---- summary ----------------------------------------------------------------

printf '\n'
printf '=== Results: %d passed, %d failed ===\n' "$pass" "$fail"

[ "$fail" -eq 0 ] || exit 1
