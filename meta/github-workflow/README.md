# meta/github-workflow

GitHub issue / PR の運用テンプレートと運用ガイド一式。

## ファイル構成

| ファイル | 用途 |
|---------|------|
| `parent-issue.md` | 親 issue テンプレ（ハイブリッド方式） |
| `sub-issue.md` | sub-issue テンプレ（self-contained 必須） |
| `discussion-issue.md` | 議論用 sub-issue テンプレ（決定後 close） |
| `PR-template.md` | PR テンプレ（`Refs:` / `Closes:` 使い分け） |
| `issue-workflow.md` | 運用ガイド（7 セクション） |
| `install.sh` | `.github/ISSUE_TEMPLATE/` へ展開するインストールスクリプト |

## クイックスタート

```bash
cd /path/to/your-repo
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/meta/github-workflow/install.sh | sh
```

カレントディレクトリの `.github/ISSUE_TEMPLATE/` に issue テンプレートが展開される。

PR テンプレートは `PR-template.md` を参考に `.github/PULL_REQUEST_TEMPLATE.md` を手動で作成する。

## 詳細

運用ルール・コマンド・アンチパターン集は [issue-workflow.md](issue-workflow.md) を参照。
