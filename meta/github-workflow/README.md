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

## クイックスタート

`scripts/download.sh` で scaffold すると、これらのテンプレートは `.github/` に**自動注入**される。

```bash
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- go-ssr-web ~/projects/my-app
```

注入をスキップしたい場合は `--no-github-templates` を指定する:

```bash
curl -sSL .../download.sh | sh -s -- go-ssr-web ~/projects/my-app --no-github-templates
```

## 詳細

運用ルール・コマンド・アンチパターン集は [issue-workflow.md](issue-workflow.md) を参照。
