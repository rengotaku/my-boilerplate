#!/bin/sh
# Install GitHub issue templates from my-boilerplate
# Usage: curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/meta/github-workflow/install.sh | sh

set -e

BASE_URL="https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/meta/github-workflow"
DEST=".github/ISSUE_TEMPLATE"
TEMPLATES="parent-issue.md sub-issue.md discussion-issue.md"

# Check for existing files before doing anything
EXISTING=""
for f in $TEMPLATES; do
  if [ -f "$DEST/$f" ]; then
    EXISTING="$EXISTING $DEST/$f"
  fi
done

if [ -n "$EXISTING" ]; then
  echo ""
  echo "⚠️  既存ファイルが検出されました。上書きを避けるため停止します。"
  echo ""
  echo "   該当ファイル:"
  for f in $EXISTING; do
    echo "     $f"
  done
  echo ""
  echo "   該当ファイルを削除または移動してから再実行してください。"
  echo "   例: mv $DEST/parent-issue.md $DEST/parent-issue.md.bak"
  exit 1
fi

# Download to a temp dir first to avoid partial installs on curl failure
TMP=$(mktemp -d)

echo ""
echo "Downloading issue templates ..."
echo ""

for f in $TEMPLATES; do
  curl -fsSL "$BASE_URL/$f" -o "$TMP/$f"
  echo "  ✓ $f"
done

# Move atomically after all downloads succeed
mkdir -p "$DEST"
for f in $TEMPLATES; do
  mv "$TMP/$f" "$DEST/$f"
done
rmdir "$TMP"

echo ""
echo "✅ インストール完了"
echo ""
echo "展開されたファイル:"
for f in $TEMPLATES; do
  echo "  $DEST/$f"
done
echo ""
echo "PR テンプレートは以下を参考に手動で作成してください:"
echo "  https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/meta/github-workflow/PR-template.md"
echo "  → .github/PULL_REQUEST_TEMPLATE.md"
echo ""
echo "運用ガイド: https://github.com/rengotaku/my-boilerplate/blob/main/meta/github-workflow/issue-workflow.md"
