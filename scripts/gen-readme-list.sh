#!/usr/bin/env bash
# README.md の「Available Boilerplates」表を boilerplates/*/template.toml から生成する。
#
# 一覧の正本は各テンプレートの template.toml（download.sh --list と同じ元）。
# README の表は手で編集せず、このスクリプトで更新する。
#
# Usage:
#   bash scripts/gen-readme-list.sh          # README.md の表を書き換える
#   bash scripts/gen-readme-list.sh --check  # README.md が最新か確かめる（ずれていれば exit 1）
#
# README.md の次の 2 行の間だけを書き換える:
#   <!-- BEGIN: template-list -->
#   <!-- END: template-list -->

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
README="$ROOT/README.md"
BEGIN='<!-- BEGIN: template-list -->'
END='<!-- END: template-list -->'

mode="write"
case "${1:-}" in
  "") ;;
  --check) mode="check" ;;
  *) echo "Usage: $0 [--check]" >&2; exit 2 ;;
esac

# template.toml の 1 行 `key = "value"` から value を取り出す
toml_value() {
  local key="$1" file="$2" line
  line=$(grep -E "^${key}[[:space:]]*=" "$file") || return 1
  line=${line#*=}
  line=${line# }
  line=${line#\"}
  line=${line%\"}
  printf '%s' "$line"
}

table=$'| Name | Description |\n|------|-------------|'
count=0
for toml in "$ROOT"/boilerplates/*/template.toml; do
  [ -f "$toml" ] || { echo "template.toml が見つかりません" >&2; exit 1; }
  dir=$(basename "$(dirname "$toml")")
  name=$(toml_value name "$toml") || { echo "name が無い: $toml" >&2; exit 1; }
  desc=$(toml_value description "$toml") || { echo "description が無い: $toml" >&2; exit 1; }
  [ "$name" = "$dir" ] || { echo "name がディレクトリ名と違う: $toml ($name)" >&2; exit 1; }
  table+=$'\n'"| [$name](./boilerplates/$name) | $desc |"
  count=$((count + 1))
done
[ "$count" -gt 0 ] || { echo "テンプレートが 0 件" >&2; exit 1; }

grep -qF "$BEGIN" "$README" && grep -qF "$END" "$README" \
  || { echo "README.md に $BEGIN / $END が無い" >&2; exit 1; }

tmp=$(mktemp -t gen-readme-list-XXXXXX)
trap 'rm -f "$tmp"' EXIT

awk -v begin="$BEGIN" -v end="$END" -v table="$table" '
  $0 == begin { print; print table; skip = 1; next }
  $0 == end   { skip = 0 }
  !skip       { print }
' "$README" > "$tmp"

if [ "$mode" = "check" ]; then
  if diff -u "$README" "$tmp" >&2; then
    echo "README.md の一覧は最新です（${count} 件）"
  else
    echo "README.md の一覧が template.toml とずれています。bash scripts/gen-readme-list.sh で更新してください" >&2
    exit 1
  fi
else
  cat "$tmp" > "$README"
  echo "README.md の一覧を更新しました（${count} 件）"
fi
