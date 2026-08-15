# ビジュアルチェック手順（Playwright スクリーンショット）

レイアウト崩れ・テキストのはみ出し・CTA の視認性は、原稿と描画結果を突き合わせる
同語反復テストでは検知しにくい。`rules/testing.md`「静的コンテンツにテストを
作り込まない」方針のとおりである（このテンプレートの `CLAUDE.md` 参照）。代わりに
この手順で sm / md / lg 3 ブレークポイントのページ全体スクリーンショットを撮り、
目視で確認する。

対象は本リポジトリの依存に加えていない（`package.json` は変更しない）。すべて
`npx` 経由のアドホック実行で完結させる。

## 1. dev サーバを起動する

```bash
make run
```

- 既定ポートは `5173`（`Makefile` の `PORT ?= 5173`、Vite の既定値）。
- 起動状態の確認は `make status`（`static-lp: running (:5173)` と出れば OK）。
- ポートが競合して別ポートに Vite が上がった場合は、`make run` 実行時の標準出力
  （`Local: http://localhost:XXXX/`）に出る実際のポート番号を使う。
- 停止は `make stop`。

## 2. Playwright ブラウザを用意する（初回のみ）

```bash
npx playwright install chromium
```

プロジェクトの依存としては入れず、`npx` のキャッシュにのみブラウザバイナリを取得する。

## 3. sm / md / lg でフルページスクリーンショットを撮る

対象は本テンプレートに含まれる各ページ（既定では `/` = HomePage、`/privacy` =
PrivacyPage）。実際にページを追加した場合は、そのページも同様に撮ること。

```bash
mkdir -p /tmp/static-lp-visual-check

# sm: 375px（スマートフォン想定）
npx playwright screenshot \
  --viewport-size="375,812" \
  --full-page \
  http://localhost:5173/ \
  /tmp/static-lp-visual-check/home-sm-375.png

# md: 768px（タブレット想定）
npx playwright screenshot \
  --viewport-size="768,1024" \
  --full-page \
  http://localhost:5173/ \
  /tmp/static-lp-visual-check/home-md-768.png

# lg: 1280px（デスクトップ想定）
npx playwright screenshot \
  --viewport-size="1280,900" \
  --full-page \
  http://localhost:5173/ \
  /tmp/static-lp-visual-check/home-lg-1280.png
```

`http://localhost:5173/` の部分は、手順1で実際に起動したポート番号へ置き換える。
`/privacy` など他のページも URL 末尾を変えて同様に撮る。

## 4. 確認観点

各サイズのスクリーンショットについて、以下を目視で確認する。

| 観点 | チェック内容 |
|---|---|
| レイアウト崩れ | セクション同士が重なっていないか。グリッド・カラムが意図した段組みで表示されているか |
| テキストのはみ出し | 見出し・本文・箇条書きがコンテナ幅からはみ出していないか。長い日本語文言が折り返さずに切れていないか |
| リンク・CTA の可視性 | ボタン・リンクが画面幅に対して十分な余白・タップ領域を保っているか。`sm` で隠れたり画面外に出たりしていないか |
| ナビゲーション（Header） | 各ブレークポイントでナビリンクが折り返さず表示されているか。ハンバーガーメニュー等のレスポンシブ対応を追加した場合はその開閉も確認する |

本テンプレートの初期構成（Header + 本文）はセクション数が少ないため、上記で十分である。
実際のセクション（Hero・料金表・FAQ 等）を追加した場合は、そのセクション固有の
崩れ（画像のアスペクト比・表のスクロール可否等）も確認観点に追加すること。

異常があれば、対象コンポーネントの Tailwind クラス（`sm:` `md:` 等のブレークポイント
指定）を調整し、再度スクリーンショットを撮り直して解消を確認する。

## 5. 後片付け

```bash
make stop
```

スクリーンショットは `/tmp` 配下（本リポジトリには含めない）。恒久的に残したい場合は
別途、確認結果を issue コメント等に添付する。
