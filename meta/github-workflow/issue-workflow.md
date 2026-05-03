# GitHub Issue 運用ガイド

## 目次

1. [導入](#1-導入)
2. [親 issue を起票する](#2-親-issue-を起票する)
3. [議論を進める](#3-議論を進める)
4. [sub-issue に分解する](#4-sub-issue-に分解する)
5. [実装フェーズ](#5-実装フェーズ)
6. [アンチパターン集](#6-アンチパターン集)
7. [既存リポへの展開](#7-既存リポへの展開)

---

## 1. 導入

このガイドは、以下の問題を解消するために作成した:

- issue の状態が感覚的で、誰でも判断できない
- 「決定したはずの仕様」がコメントに埋もれて消える
- 親 issue と sub-issue の関係が曖昧になる

**原則**: 読み手が判断しなくてよいように書く。「お好みで」「必要に応じて」は禁止。

### 用語

| 用語 | 意味 |
|------|------|
| 親 issue | 大きな機能・改善提案。議論の起点となる issue |
| sub-issue | 親 issue の議論で分解された実装単位の issue |
| 議論用 sub-issue | 特定の論点を解決するための sub-issue。決定が出たら close |
| Decision Log | 親 issue 内の確定事項テーブル |
| ハイブリッド方式 | description に要約 + first comment に元要望全文を置く形式 |

### Status 凡例

| テキスト | 意味 |
|---------|------|
| `✅ closed` | 完了（close済み） |
| `⏳ in-progress` | 実装中 |
| `🔴 blocked` | 別 issue・PR の完了待ち |
| `⏸ on-hold` | 意図的に止めている |
| `実装待ち` | 未着手 |
| `⏳ 議論中` | 議論用 sub-issue の初期状態 |

---

## 2. 親 issue を起票する

### ステップ

**2-1. issue を作成する**

```bash
gh issue create --template parent-issue.md
```

GitHub UI の場合: "New issue" → "親 issue" テンプレートを選択。

**2-2. description に要約を書く**

1〜2 行で目的・背景を書く。詳細はこの後の first comment に移す。

**2-3. 元要望全文を first comment として投稿する**

issue を作成後、すぐに first comment を投稿する:

```bash
# issue 番号を確認
gh issue list --limit 5

# first comment を投稿
gh issue comment <NUMBER> --body "$(cat <<'EOF'
## 元要望全文

（ここに要望の全文を貼り付ける）
EOF
)"
```

**2-4. first comment の URL を description に貼る**

```bash
# first comment の URL を取得
gh issue view <NUMBER> --json comments --jq '.comments[0].url'
```

取得した URL を description の「元要望全文:」リンクに貼る:

```
元要望全文: [このコメント](https://github.com/owner/repo/issues/N#issuecomment-XXXXXXX)
```

**2-5. Goal セクションを埋める**

1〜2 行で達成したいことを書く。Decision Log は最初は空でよい。

### チェックリスト

- [ ] description が 1〜2 行の要約になっている
- [ ] 元要望全文が first comment に投稿されている
- [ ] description の「元要望全文:」リンクが first comment を指している
- [ ] Status が `実装待ち` になっている
- [ ] Goal セクションが記入されている

---

## 3. 議論を進める

### 基本ルール

- 決定事項は必ず Decision Log に転記する。コメントだけで終わらせない
- 論点が大きくなったら議論用 sub-issue に分解する
- 決定が出た議論用 sub-issue はすぐに close する

### Decision Log を更新する

コメントで合意が取れたら、親 issue の Decision Log を更新する:

```bash
# 現在の issue 本文を確認
gh issue view <NUMBER>

# 本文を編集（ブラウザが開く）
gh issue edit <NUMBER>
```

Decision Log の形式:

```markdown
| # | 論点 | 決定 | 日付 |
|---|------|------|------|
| 1 | 〇〇をどうするか | 案 A を採用。理由: XXX | 2026-01-15 |
```

### 議論用 sub-issue を作る

論点が複雑で独立した議論が必要な場合は、議論用 sub-issue を作成する:

```bash
gh issue create --template discussion-issue.md --title "議論: 〇〇をどうするか"
```

議論用 sub-issue の close:

```bash
# 決定が出たら close する（親の Decision Log 転記後）
gh issue close <NUMBER> --reason completed --comment "決定: 案 A を採用。理由: XXX。親 #N Decision Log #M に転記済み。"
```

---

## 4. sub-issue に分解する

### 分解の判断基準

以下の条件を**すべて満たす**場合に sub-issue に分解する:

1. 実装に 4 時間以上かかる見込みがある
2. 独立した PR が作れる（他の sub-issue と並行実装できる）
3. DoD（完了条件）を具体的に書ける

1 つでも満たさない場合は、親 issue の Sub-issues テーブルに TODO として追記するだけでよい。

### sub-issue を作成する

```bash
gh issue create --template sub-issue.md --title "タイトル"
```

sub-issue 作成後、親 issue の Sub-issues テーブルを更新する:

```bash
gh issue edit <親issue番号>
```

```markdown
## Sub-issues

| # | タイトル | Status |
|---|---------|--------|
| [#N](URL) | タイトル | ⏳ in-progress |
```

### Depends on の記載

依存関係がある場合は `Depends on` セクションに明記する:

```markdown
## Depends on

- #N が完了してから着手する（理由: 共通インターフェースが確定していないと実装できない）
```

依存なしの場合は「依存 sub-issue なし」と明示する。

---

## 5. 実装フェーズ

### sub-issue 着手時

**5-1. ブランチを作成する**

```bash
git switch main
git pull origin main
git switch -c issue<NUMBER>
```

**5-2. sub-issue の Status を更新する**

```bash
gh issue edit <NUMBER> --body "$(gh issue view <NUMBER> --json body --jq '.body' | sed 's/\*\*Status:\*\* 実装待ち/**Status:** ⏳ in-progress/')"
```

または GitHub UI で手動更新する。

**5-3. 実装する**

`スコープ` セクションのチェックボックスを埋めながら進める。

**5-4. PR を作成する**

```bash
gh pr create --template PR-template.md
```

PR には必ず以下を含める:
- `Refs: #親issue番号`（親をcloseさせない）
- `Closes: #sub-issue番号`（sub-issue は PR マージ時に close）

**5-5. sub-issue の DoD を確認する**

マージ前に DoD の全チェックボックスが埋まっていることを確認する。

### sub-issue 完了後

sub-issue は PR マージ時に自動で close される（`Closes:` を使った場合）。

親 issue の Sub-issues テーブルを更新する:

```bash
gh issue edit <親issue番号>
```

```markdown
| [#N](URL) | タイトル | ✅ closed |
```

### 親 issue を close する

全 sub-issue が完了したら、親 issue を手動で close する:

```bash
gh issue close <親issue番号> --reason completed --comment "全 sub-issue (#N, #M) が完了したため close します。"
```

---

## 6. アンチパターン集

### ❌ issue を削除する

**禁止**。issue の削除は絶対に行わない。誤って作成した場合は `not planned` で close する:

```bash
gh issue close <NUMBER> --reason "not planned" --comment "誤作成のため close します。"
```

### ❌ 状態管理にラベルを使う

`status:in-progress` 等のラベルは使わない。Status はテキストで description 先頭に管理する。

理由: ラベルはフィルタリング用途に限定し、状態はテキストで読める形にする。

### ❌ コメントだけで決定を残す

決定事項をコメントに書いて終わりにしない。必ず親 issue の Decision Log に転記する。

理由: コメントは埋もれる。Decision Log が唯一の真実の源になる。

### ❌ PR に `Fixes: #親issue番号` を書く

親 issue は全 sub-issue 完了後に手動で close するため、PR には `Refs:` を使う。

```markdown
# 正しい
Refs: #親issue番号
Closes: #sub-issue番号

# 誤り
Fixes: #親issue番号  ← 親が自動 close される
```

### ❌ `--no-verify` でコミット・プッシュする

テスト・lint をスキップして CI を通過したように見せる行為は禁止。フックが失敗する場合は根本原因を修正する。

### ❌ sub-issue を self-contained にしない

sub-issue は単独で読んで実装できる状態にする。「詳細は親 issue を参照」だけでは不十分。前提仕様・スコープ・DoD を必ず inline で書く。

### ❌ 「お好みで」「必要に応じて」等の曖昧表現を使う

issue 内（特に DoD・やってはいけないこと）では判断を読み手に委ねる表現を使わない。

```markdown
# 誤り
- お好みでテストを追加してください

# 正しい
- [ ] 〇〇関数のユニットテストを追加する（テストファイル: tests/test_xxx.py）
```

### ❌ 親 issue の description に実装詳細を全部書く

詳細は sub-issue に分解して self-contained にする。親 issue は要約 + Decision Log + Sub-issues テーブルだけにする。

### ❌ 議論用 sub-issue を決定後も open のままにする

決定が出たら即座に close する。Decision Log に転記 → close の順を守る。

---

## 7. 既存リポへの展開

### テンプレートのインストール

```bash
cd /path/to/your-repo
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/meta/github-workflow/install.sh | sh
```

`./github/ISSUE_TEMPLATE/` に以下のファイルが展開される:
- `parent-issue.md`
- `sub-issue.md`
- `discussion-issue.md`

PR テンプレートは `meta/github-workflow/PR-template.md` を参考に `.github/PULL_REQUEST_TEMPLATE.md` を手動で作成する。

### 既存 issue の扱い

既存の issue は変更しない。新しく起票する issue からこのワークフローを適用する。

### チェックリスト

- [ ] `install.sh` を実行して `.github/ISSUE_TEMPLATE/` にテンプレートが展開された
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` を `PR-template.md` を参考に作成した（任意）
- [ ] チームに「Decision Log への転記」ルールを共有した
- [ ] issue 削除の代わりに close with reason を使うことを合意した
