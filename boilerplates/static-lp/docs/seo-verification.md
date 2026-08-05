# SEO / インデックス確認手順

サイトが実際に検索エンジンへインデックスされることを確認するための手順。
ドメイン取得・Cloudflare Pages への接続（`docs/deploy.md`）が完了してから実施する。

## 前提条件

- [ ] 独自ドメイン（または `*.pages.dev`）へのデプロイが完了している
- [ ] `https://<your-domain>/` にアクセスしてページが表示される
- [ ] `curl -s https://<your-domain>/ | grep <トップページの見出し文言>` で、JS実行
      なしに本文が取得できる（ビルド時プリレンダリングが効いていることの確認）

## Google Search Console 登録手順

1. https://search.google.com/search-console/welcome にアクセスし、Google アカウントで
   ログインする
2. 「URL プレフィックス」欄に `https://<your-domain>/` を入力し、「続行」を押す
3. 所有権の確認方法は「HTML タグ」を選択する（Cloudflare Pages はファイルアップロード
   不要で DNS 設定不可な場合があるため、`<meta>` タグ挿入が最も簡単）
   - 表示された `<meta name="google-site-verification" content="...">` タグをコピーする
   - `index.html` の `<head>` 内（他の `<meta>` タグの近く）に追記し、デプロイする
   - Search Console 側で「確認」ボタンを押す
4. 確認が完了したら、左メニューの「サイトマップ」を開く
5. 「新しいサイトマップの追加」に `sitemap.xml` と入力して送信する（`public/sitemap.xml`）
6. 「URL 検査」ツールで `https://<your-domain>/` を検査し、「インデックス登録を
   リクエスト」を押す（即時ではなく数日〜数週間かかる場合がある）

## インデックス状況の確認方法

- **`site:` 検索**: Google 検索で `site:<your-domain>` と入力し、ページが表示されるか
  確認する（インデックスまでにタイムラグがあるため、登録直後は0件でも異常ではない）
- **Search Console のカバレッジレポート**: 「インデックス作成」→「ページ」で、登録した
  ページが「インデックス登録済み」になっているか確認する
- **SNS シェアのプレビュー確認**: X（Twitter）や Slack 等に URL を貼り、OGP 画像・
  タイトル・説明文が正しく表示されるか確認する（`index.html` の OGP/Twitter Card
  タグの動作確認を兼ねる）

## 既知の制約

- `src/routes.ts` の `KNOWN_PATHS` に含まれないパスはプリレンダされていない。将来
  ページを追加する場合は `KNOWN_PATHS` への追記が必要（`scripts/verify-prerender.mjs`
  は `KNOWN_PATHS` からの取得漏れ自体は検知できないため、新規ページ追加時は
  `src/router.tsx` の Route 定義と `KNOWN_PATHS` の両方を更新し、手動でプリレンダ
  結果を確認すること）
- アクセス解析（Cloudflare Web Analytics 等）を導入する場合はページビュー計測が
  主目的になる。検索流入元・検索クエリの詳細分析が必要な場合は Search Console の
  「検索パフォーマンス」レポートを使う
- アクセス解析ツールを追加する場合は `public/_headers` の Content-Security-Policy
  （`script-src` / `connect-src`）に追加先のドメインを追記する必要がある
