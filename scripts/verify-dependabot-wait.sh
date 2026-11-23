#!/usr/bin/env bash
# verify-dependabot-wait.sh - scripts/dependabot-wait-checks.sh の動きを、偽の gh で確かめる。
#
# 実在のリポジトリやトークンは使わない。GH_TOKEN も要らない。
# CI（.github/workflows/verify-dependabot-wait.yml）とローカルの両方で実行する。
#
#   bash scripts/verify-dependabot-wait.sh
#
# 終了コード: 0 = すべて PASS / 1 = FAIL あり

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WAIT_SH="$REPO_ROOT/scripts/dependabot-wait-checks.sh"

pass=0
fail=0

ok() {
  pass=$((pass + 1))
  printf 'PASS  %s\n' "$1"
}

ng() {
  fail=$((fail + 1))
  printf 'FAIL  %s\n' "$1"
  if [ -n "${2:-}" ]; then
    printf '      %s\n' "$2"
  fi
}

assert_rc() {
  label="$1"
  expected="$2"
  actual="$3"
  if [ "$actual" = "$expected" ]; then
    ok "$label"
  else
    ng "$label" "rc: expected $expected, actual $actual"
  fi
}

assert_contains() {
  label="$1"
  needle="$2"
  file="$3"
  if [ ! -f "$file" ]; then
    ng "$label" "file not found: $file"
    return
  fi
  if grep -qF -- "$needle" "$file"; then
    ok "$label"
  else
    ng "$label" "expected to contain: $needle"$'\n'"$(sed 's/^/      /' "$file")"
  fi
}

assert_not_contains() {
  label="$1"
  needle="$2"
  file="$3"
  if [ ! -f "$file" ]; then
    ng "$label" "file not found: $file"
    return
  fi
  if grep -qF -- "$needle" "$file"; then
    ng "$label" "expected NOT to contain: $needle"$'\n'"$(sed 's/^/      /' "$file")"
  else
    ok "$label"
  fi
}

assert_count() {
  label="$1"
  expected="$2"
  file="$3"
  actual="$(grep -cF -- "${4:-}" "$file" 2>/dev/null || true)"
  if [ "$actual" = "$expected" ]; then
    ok "$label"
  else
    ng "$label" "count of '${4:-}': expected $expected, actual $actual"
  fi
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ---- 偽の gh ---------------------------------------------------------------
# 呼ばれるたびに state/calls を増やし、FAKE_GH_SCENARIO に応じた TSV を返す。
# 実物と同じく「check run の一覧を出す」以外のことはしない（マージはしない）。
FAKE_BIN="$TMP/bin"
mkdir -p "$FAKE_BIN"
cat >"$FAKE_BIN/gh" <<'FAKE'
#!/bin/sh
# 偽の gh。check run の一覧だけを返す。
set -u
state="${FAKE_GH_STATE:?}"
scenario="${FAKE_GH_SCENARIO:?}"
mkdir -p "$state"
printf '%s\n' "$*" >>"$state/argv.log"

n=0
if [ -f "$state/calls" ]; then
  n=$(cat "$state/calls")
fi
n=$((n + 1))
printf '%s' "$n" >"$state/calls"

case "$scenario" in
  wait-then-success)
    # 最初の 2 回は実行中、3 回目に成功する
    if [ "$n" -le 2 ]; then
      printf 'a\tin_progress\t\nb\tqueued\t\n'
    else
      printf 'a\tcompleted\tsuccess\nb\tcompleted\tsuccess\n'
    fi
    ;;
  late-registration)
    # 1 回目は 1 件だけ、2 回目以降は 2 件（登録が遅れて増える）
    if [ "$n" -le 1 ]; then
      printf 'a\tcompleted\tsuccess\n'
    else
      printf 'a\tcompleted\tsuccess\nb\tcompleted\tsuccess\n'
    fi
    ;;
  no-checks)
    # 何も返さない
    ;;
  self-in-progress)
    # 自分（auto-merge）だけが実行中のまま
    printf 'auto-merge\tin_progress\t\na\tcompleted\tsuccess\nb\tcompleted\tsuccess\n'
    ;;
  failure)
    # 完了した失敗を含む
    printf 'a\tcompleted\tsuccess\nci / test\tcompleted\tfailure\n'
    ;;
  *)
    printf 'unknown scenario: %s\n' "$scenario" >&2
    exit 2
    ;;
esac
FAKE
chmod +x "$FAKE_BIN/gh"

FAKE_SHA="e447642180032a6f4274e5dbbe8ebade928f9e07a"

# run_wait <scenario>
# 結果は $CASE_DIR/out.txt と $CASE_DIR/err.txt、終了コードは $RC に入る。
run_wait() {
  scenario="$1"
  CASE_DIR="$TMP/$scenario"
  mkdir -p "$CASE_DIR"
  env -i \
    PATH="$FAKE_BIN:/usr/local/bin:/usr/bin:/bin" \
    FAKE_GH_STATE="$CASE_DIR" \
    FAKE_GH_SCENARIO="$scenario" \
    GITHUB_REPOSITORY="rengotaku/my-boilerplate" \
    COMMIT_SHA="$FAKE_SHA" \
    SELF_NAME="auto-merge" \
    INITIAL_WAIT="${CASE_INITIAL_WAIT:-0}" \
    INTERVAL="${CASE_INTERVAL:-1}" \
    STABLE_ROUNDS="${CASE_STABLE_ROUNDS:-2}" \
    TIMEOUT="${CASE_TIMEOUT:-60}" \
    bash "$WAIT_SH" >"$CASE_DIR/out.txt" 2>"$CASE_DIR/err.txt"
  RC=$?
}

# ---- 1. 完了を待つ（条件 5） ----------------------------------------------
CASE_TIMEOUT=30
run_wait wait-then-success
assert_rc "待ってから成功する: rc=0" 0 "$RC"
assert_contains "待ったことが出力に出る" "完了していません" "$CASE_DIR/out.txt"
assert_contains "最後に成功を報告する" "すべて成功しました" "$CASE_DIR/out.txt"
calls="$(cat "$CASE_DIR/calls")"
if [ "$calls" -ge 3 ]; then
  ok "完了するまで確認を繰り返した（$calls 回）"
else
  ng "完了するまで確認を繰り返した" "expected >= 3 calls, actual $calls"
fi

# ---- 2. 検証なしではマージしない（条件 6） --------------------------------
CASE_TIMEOUT=2
run_wait no-checks
assert_rc "check run が 0 件のまま上限: rc=1" 1 "$RC"
assert_contains "検証なしではマージしないと報告する" "検証なしではマージしません" "$CASE_DIR/err.txt"

# ---- 3. 自分自身は待たない（条件 7） --------------------------------------
CASE_TIMEOUT=30
run_wait self-in-progress
assert_rc "自分だけ実行中でも成功する: rc=0" 0 "$RC"
assert_contains "自分以外の成功を報告する" "すべて成功しました" "$CASE_DIR/out.txt"
self_calls="$(cat "$CASE_DIR/calls")"
if [ "$self_calls" = "2" ]; then
  ok "自分を無視して 2 回の確認で終わる（$self_calls 回）"
else
  ng "自分を無視して 2 回の確認で終わる" "expected 2 calls, actual $self_calls"
fi

# ---- 4. 失敗があればマージしない ------------------------------------------
CASE_TIMEOUT=30
run_wait failure
assert_rc "失敗した check があれば rc=1" 1 "$RC"
assert_contains "失敗した check の名前を標準エラーに出す" "ci / test" "$CASE_DIR/err.txt"
assert_not_contains "失敗時に成功を報告しない" "すべて成功しました" "$CASE_DIR/out.txt"
failure_calls="$(cat "$CASE_DIR/calls")"
if [ "$failure_calls" = "1" ]; then
  ok "失敗は 1 回目で判定して待ち続けない（$failure_calls 回）"
else
  ng "失敗は 1 回目で判定して待ち続けない" "expected 1 call, actual $failure_calls"
fi

# ---- 5. 件数が変わったら数え直す ------------------------------------------
CASE_TIMEOUT=30
run_wait late-registration
assert_rc "登録が遅れて件数が増えても成功する: rc=0" 0 "$RC"
assert_count "件数の確認をやり直した" 2 "$CASE_DIR/out.txt" "件数が変わらないか"
late_calls="$(cat "$CASE_DIR/calls")"
if [ "$late_calls" = "3" ]; then
  ok "件数が揃うまで 3 回確認する（$late_calls 回）"
else
  ng "件数が揃うまで 3 回確認する" "expected 3 calls, actual $late_calls"
fi

# ---- 6. 脚本はマージしない（待つだけ） ------------------------------------
if grep -qF -- "pr merge" "$TMP/wait-then-success/argv.log"; then
  ng "スクリプトは gh pr merge を呼ばない" "argv.log: $(cat "$TMP/wait-then-success/argv.log")"
else
  ok "スクリプトは gh pr merge を呼ばない"
fi
if grep -qF -- "check-runs" "$TMP/wait-then-success/argv.log"; then
  ok "check run の一覧を gh api で見る"
else
  ng "check run の一覧を gh api で見る" "argv.log: $(cat "$TMP/wait-then-success/argv.log")"
fi

# ---- まとめ ---------------------------------------------------------------
printf '\n%s passed, %s failed\n' "$pass" "$fail"
if [ "$fail" -ne 0 ]; then
  exit 1
fi
