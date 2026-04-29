<!--
  go-rest-api 用 PR テンプレート。

  各セクション見出しの [AI] / [人] は記入・実行の担当者を示す:
    [AI] = Claude Code / 自動化が埋める
    [人] = レビュアーまたは PR 作成者本人が実施
-->

## 概要 [AI]
<!-- 1〜3 行で「なぜ」「何を変えたか」。 -->


## 関連 Issue [AI]
Closes #

## 変更タイプ [AI]
- [ ] feat: 新機能
- [ ] fix: バグ修正
- [ ] refactor: 挙動変更なしのリファクタ
- [ ] perf: パフォーマンス改善
- [ ] chore / docs / test
- [ ] schema: DB スキーマ変更あり（migration ファイルを含む）

## 動作確認手順（ローカル起動） [人]
<!-- このセクションはコピペでローカル起動できるよう固定。削らないこと。 -->

```bash
# 1. go-rest-api ディレクトリへ移動
cd go-rest-api

# 2. 初回のみ依存取得 + air インストール
make install

# 3. サーバ起動 (デフォルト: http://localhost:10080)
make dev
# または通常起動:
#   make run
```

DB をリセットしたい場合: `rm app.db`

### 動作確認シナリオ [人]
- [ ] `make dev` で起動し `http://localhost:10080/health` が `{"status":"ok"}` を返す
- [ ] ユーザー登録 `POST /api/v1/users` が成功する
- [ ] ログイン `POST /api/v1/auth/login` で JWT トークンを取得できる
- [ ] Bearer トークン付きで `GET /api/v1/users` が成功する
- [ ] トークンなしで保護エンドポイントにアクセスすると 401 が返る
- [ ]

## テスト [AI]
- [ ] `make ci`（lint + test-cov）PASS
- [ ] 新規/変更コードに対するユニットテストを追加した
- [ ] `internal/handler` の挙動変更ならハンドラテストを追加した

## DB / マイグレーション（該当時のみ） [AI]
- [ ] `migrations/` に SQL ファイルを追加した
- [ ] `make migrate-hash` で `atlas.sum` を更新した
- [ ] スキーマ変更の内容と適用手順を **概要** セクションに記載した

## チェックリスト [AI]
- [ ] README / openapi.yaml の更新が必要なら反映した
- [ ] 機密情報（API キー、JWT シークレット等）を含まない
- [ ] PR タイトルが Conventional Commits 形式（`feat(...): ...`, `fix(...): ...` 等）
- [ ] base ブランチが `main`

## 補足 / レビュー観点 [AI]
<!-- 設計判断のトレードオフ、フォローアップ予定など。 -->
