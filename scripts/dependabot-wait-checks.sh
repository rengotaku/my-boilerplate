#!/usr/bin/env bash
# dependabot-wait-checks.sh - コミットに付く check run が、完了して成功するまで待つ。
#
# Dependabot の PR を「ほかのチェックが緑になってから」マージするために使う。
# このスクリプトは待つだけで、マージはしない（呼び出し側が行う）。
#
# 使い方:
#   GITHUB_REPOSITORY=owner/repo COMMIT_SHA=<sha> SELF_NAME=auto-merge \
#     bash scripts/dependabot-wait-checks.sh [<sha>]
#
# 終了コード:
#   0: 自分以外の check run がすべて完了し、失敗が無い
#   1: 失敗した check run がある / 上限を超えた / check run が 1 件も無い /
#      check run を取得できないまま上限を超えた
#
# 環境変数:
#   COMMIT_SHA        調べるコミット。未指定なら第 1 引数、それも無ければ GITHUB_SHA
#   GITHUB_REPOSITORY owner/repo（必須）
#   SELF_NAME         待たない自分の job 名（既定: auto-merge）
#   INITIAL_WAIT      最初の待ち秒数。ほかのワークフローの登録が遅れることがある（既定: 90）
#   INTERVAL          確認の間隔秒数（既定: 30）
#   STABLE_ROUNDS     件数が変わらず完了していることを続けて確かめる回数（既定: 2）
#   TIMEOUT           全体の上限秒数（既定: 3600 = 60 分）
#
# 待つ時間と間隔はテストのために短くできる。gh は PATH 上のものを使う。

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-}"
SHA="${COMMIT_SHA:-${1:-${GITHUB_SHA:-}}}"
SELF_NAME="${SELF_NAME:-auto-merge}"
INITIAL_WAIT="${INITIAL_WAIT:-90}"
INTERVAL="${INTERVAL:-30}"
STABLE_ROUNDS="${STABLE_ROUNDS:-2}"
TIMEOUT="${TIMEOUT:-3600}"

fail() {
  printf 'dependabot-wait-checks: %s\n' "$*" >&2
  exit 1
}

log() {
  printf 'dependabot-wait-checks: %s\n' "$*"
}

for name in INITIAL_WAIT INTERVAL STABLE_ROUNDS TIMEOUT; do
  value="${!name}"
  case "$value" in
    '' | *[!0-9]*) fail "$name は 0 以上の整数で指定してください: '$value'" ;;
  esac
done
[ "$INTERVAL" -ge 1 ] || fail "INTERVAL は 1 以上にしてください: $INTERVAL"
[ "$STABLE_ROUNDS" -ge 1 ] || fail "STABLE_ROUNDS は 1 以上にしてください: $STABLE_ROUNDS"
[ -n "$REPO" ] || fail "GITHUB_REPOSITORY が空です（owner/repo を指定してください）"
[ -n "$SHA" ] || fail "調べるコミットが分かりません（COMMIT_SHA / 第 1 引数 / GITHUB_SHA のどれも空）"

START=$(date +%s)

elapsed() {
  echo $(($(date +%s) - START))
}

# check run を name / status / conclusion の TSV で返す。
# ページをまたいでも 1 行 1 件になるよう、--jq を各ページに当てる。
fetch_checks() {
  gh api "repos/${REPO}/commits/${SHA}/check-runs?per_page=100" --paginate \
    --jq '.check_runs[] | [.name, .status, (.conclusion // "")] | @tsv'
}

if [ "$INITIAL_WAIT" -gt 0 ]; then
  log "ほかのワークフローの登録を待ちます（${INITIAL_WAIT} 秒）"
  sleep "$INITIAL_WAIT"
else
  log "最初の待ちは 0 秒なので、すぐ確認します"
fi

saw_any=0
stable=0
last_count=-1

while :; do
  if [ "$(elapsed)" -ge "$TIMEOUT" ]; then
    if [ "$saw_any" -eq 0 ]; then
      fail "check run が 1 件も無いまま上限（${TIMEOUT} 秒）に達しました。検証なしではマージしません"
    fi
    fail "上限（${TIMEOUT} 秒）を超えました。完了していない check run があります。マージしません"
  fi

  if ! raw=$(fetch_checks); then
    printf 'dependabot-wait-checks: check run を取得できませんでした（gh api が失敗）。%s 秒後に再試行します\n' "$INTERVAL" >&2
    stable=0
    last_count=-1
    sleep "$INTERVAL"
    continue
  fi

  # 自分自身の job（呼び出し元）は、いま実行中なので待たない
  others=$(printf '%s\n' "$raw" | awk -F'\t' -v self="$SELF_NAME" 'NF && $1 != self')

  count=$(printf '%s\n' "$others" | awk -F'\t' 'NF' | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    saw_any=1
  fi

  # 失敗: 明示の 4 つに加え、success / neutral / skipped 以外の完了も失敗として扱う
  # （未知の conclusion を成功と読み替えない）
  failed=$(printf '%s\n' "$others" | awk -F'\t' '
    NF && $2 == "completed" && $3 != "success" && $3 != "neutral" && $3 != "skipped" {
      printf "%s (%s)\n", $1, ($3 == "" ? "conclusion なし" : $3)
    }')
  if [ -n "$failed" ]; then
    printf 'dependabot-wait-checks: 失敗した check run があります。マージしません:\n' >&2
    printf '%s\n' "$failed" | sed 's/^/  - /' >&2
    exit 1
  fi

  pending=$(printf '%s\n' "$others" | awk -F'\t' '
    NF && $2 != "completed" { printf "%s (%s)\n", $1, $2 }')
  if [ -n "$pending" ]; then
    pending_count=$(printf '%s\n' "$pending" | wc -l | tr -d ' ')
    log "${pending_count} 件がまだ完了していません。${INTERVAL} 秒後に確認します:"
    printf '%s\n' "$pending" | sed 's/^/  - /'
    stable=0
    last_count=-1
    sleep "$INTERVAL"
    continue
  fi

  if [ "$count" -eq 0 ]; then
    log "check run が 0 件です（登録待ち）。${INTERVAL} 秒後に確認します"
    stable=0
    last_count=-1
    sleep "$INTERVAL"
    continue
  fi

  # ここに来たら、自分以外はすべて完了していて失敗が無い。
  # 登録が遅れて件数が増えることがあるので、件数が変わらないことを続けて確かめる。
  if [ "$count" -ne "$last_count" ]; then
    stable=1
    last_count="$count"
    log "${count} 件すべて完了しました。件数が変わらないか ${INTERVAL} 秒後に確かめます（${stable}/${STABLE_ROUNDS}）"
  else
    stable=$((stable + 1))
    log "件数は ${count} 件のままです（${stable}/${STABLE_ROUNDS}）"
  fi

  if [ "$stable" -ge "$STABLE_ROUNDS" ]; then
    log "自分以外の check run はすべて成功しました（${count} 件、${SHA}）"
    exit 0
  fi

  sleep "$INTERVAL"
done
