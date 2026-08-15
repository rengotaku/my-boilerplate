# デプロイ手順（Cloudflare Registrar / Pages / Email Routing）

Cloudflare アカウントの操作・課金を伴う手順のため、**プロジェクトの担当者本人が実施**する
ことを想定した手順書。実装エージェント（AI アシスタント等）が代行実施する場合も、
Cloudflare アカウントの資格情報を渡す前提では作業しないこと。

> 以下の手順はダッシュボードの一般的な構成に基づいて記述している。Cloudflare 側の UI
> 変更により、画面のラベル名や導線が実際と異なる可能性がある。

## 前提: このテンプレートのデプロイ方式

CI 側で `npm run build` を実行し、
`wrangler pages deploy dist --project-name=<wrangler.toml の name>` でデプロイする
構成を前提にしている。`npm run build` は `tsc -b` → クライアントビルド → SSR ビルド
→ プリレンダ → `dist-ssr` 削除 → プリレンダ結果検証までを単一コマンドに統合済みである。

つまり **ビルドと配信は CI（例: GitHub Actions）+ Wrangler CLI が担う**。Cloudflare
Pages ダッシュボードの「Connect to Git」（Cloudflare 側が push を検知して自動ビルド
する方式）は**使わない**。理由:

- Cloudflare 側の自動ビルドは、Node のバージョンやビルドコマンドを Cloudflare の
  ビルド環境向けに個別設定する必要がある。その結果、本テンプレートの
  `npm run build`（複数ステップの合成コマンド）と CI 側の設定が二重管理になる
- 同じ push に対して Cloudflare 側の自動ビルドと CI 側の `wrangler pages deploy`
  が両方走ると、デプロイが二重に発生し、どちらが最終的に反映されたか分かりにくくなる

そのため Pages プロジェクトは **Direct Upload**（Git 連携なし、`wrangler` CLI /
API から成果物をアップロードする方式）で作成する。`Makefile` の `pages-login` /
`pages-create` ターゲットもこの前提で作られている。

## 1. （任意）独自ドメインを Cloudflare Registrar で取得する

すでに他社レジストラでドメインを取得済みなら、この手順は不要（ネームサーバーを
Cloudflare へ向ける手順に読み替える）。

1. https://dash.cloudflare.com/ にアクセスし、Cloudflare アカウントでログインする
2. 左サイドメニューから「Domain Registration」（ドメイン登録）を選択する
3. 「Register a Domain」ボタンをクリックする
4. 検索ボックスに取得したいドメイン名を入力して検索する
5. 検索結果でドメインが「利用可能」と表示されたら「Add to Cart」を選択する
6. カート画面で登録年数を確認し「Checkout」を選択、支払い情報を入力して購入を確定する
7. 購入完了後、ドメインは自動的に同じ Cloudflare アカウントの「Websites」一覧に
   ゾーンとして追加され、DNS は Cloudflare が管理する状態になる
8. （実際の画面で確認）購入直後、ゾーンが「Active」になるまで数分〜数十分かかる場合がある

## 2. Cloudflare Pages プロジェクトを作成する

Direct Upload 方式のプロジェクトを、以下いずれかの方法で作成する。

### 方法 A（推奨）: `make` ターゲット経由で CLI から作成

ローカル環境（Cloudflare アカウントにログイン可能な端末）で実行する。

```bash
make pages-login   # ブラウザが開き、Cloudflare アカウントで OAuth 認可する（初回のみ）
make pages-create  # wrangler pages project create <name> --production-branch=main
```

`pages-create` は `wrangler.toml` の `name` と一致するプロジェクト名で Direct Upload
プロジェクトを作成する（`PROJECT_NAME` は `Makefile` を参照）。

### 方法 B: ダッシュボードから作成

1. https://dash.cloudflare.com/ の左サイドメニューから「Workers & Pages」を選択する
2. 「Create」ボタン → 「Pages」タブを選択する
3. 「Upload assets」（Direct Upload）を選択する（**「Connect to Git」は選ばない**。
   上記「前提」節の理由により CI 側と二重管理になるため）
4. プロジェクト名は `wrangler.toml` の `name` と一致させる
5. 初回アップロードでは、ローカルでビルドした `dist/` かプレースホルダーの
   フォルダをドラッグ&ドロップしてプロジェクトを作成する
   （作成後は CI の `wrangler pages deploy` が実体を上書きする）
6. 「Deploy site」を押してプロジェクトを確定する

### カスタムドメインを接続する

1. 作成したプロジェクトを開き「Custom domains」タブを選択する
2. 「Set up a custom domain」ボタンを押す
3. 取得済みドメインを入力して「Continue」を押す
4. 同一 Cloudflare アカウント内のゾーンであれば、必要な DNS レコード（`CNAME` 等）は
   自動的に追加される。「Activate domain」を押して完了する
5. （実際の画面で確認）反映まで数分かかる場合がある。`www.` サブドメインへの
   リダイレクトが必要な場合は同じ画面でルートドメインに加えて設定する

## 3. CI の Secrets に `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` を登録する

### `CLOUDFLARE_ACCOUNT_ID` の確認

1. https://dash.cloudflare.com/ にログインする
2. 「Workers & Pages」概要ページ、または任意のドメインの「Overview」ページを開く
3. 右サイドバーの「Account ID」欄に表示されている値をコピーする

### `CLOUDFLARE_API_TOKEN` の発行

1. ダッシュボード右上のアカウントアイコンをクリックし、「My Profile」を選択する
2. 左メニューの「API Tokens」タブを選択する
3. 「Create Token」ボタンを押す
4. 「Create Custom Token」の「Get started」を選択する（テンプレートは使わず、
   最小権限のカスタムトークンにする）
5. 以下を設定する:
   - **Token name**: プロジェクトを識別できる名前（例: `<project>-deploy`）
   - **Permissions**: `Account` / `Cloudflare Pages` / `Edit` を追加する
   - **Account Resources**: `Include` / 対象の Cloudflare アカウントを選択する
   - **Client IP Address Filtering**: 未設定でよい（必要なら CI の IP レンジ制限を検討）
6. 「Continue to summary」→ 内容を確認して「Create Token」を押す
7. 表示されたトークン文字列をその場でコピーする（**再表示されないため、この画面を
   離れる前に必ず控える**）

### CI（例: GitHub Actions）の Secrets へ登録

1. リポジトリの「Settings」タブを開く
2. 「Secrets and variables」→「Actions」を選択する
3. 「New repository secret」ボタンで `CLOUDFLARE_API_TOKEN` と
   `CLOUDFLARE_ACCOUNT_ID` をそれぞれ登録する

**注意**: トークン・Account ID の実値をコード・issue・PR・コミットメッセージに
書かない。`.env.example` にはキー名のみを記載し、実値は書かないこと。

## 4. （任意）問い合わせメールの転送を設定する

`src/config/links.ts` の `contactEmail` に自ドメインのメールアドレスを設定する場合、
Cloudflare Email Routing で既存のメールアドレスへ転送できる。

1. https://dash.cloudflare.com/ で対象ドメインのゾーンを選択する
2. 左メニューの「Email」→「Email Routing」を選択する
3. 初回は「Get started」ボタンを押す。Cloudflare が自動的に MX / TXT レコードを
   ゾーンの DNS に追加する
4. 「Destination addresses」タブで「Add destination address」を押し、実際に
   受信したい既存のメールアドレスを入力する
5. 入力したアドレス宛てに確認メールが届くので、メール内のリンクを開いて検証する
   （検証完了までルーティングルールで使用できない）
6. 「Routing rules」タブ →「Custom addresses」で「Create address」を押す
7. **Custom address** 欄に `contact` 等を入力する（ドメイン部分は自動的に付与される）
8. **Action** は「Send to an email」を選択し、**Destination** に検証済みの
   宛先アドレスを選択して「Save」を押す

## デプロイ後の疎通確認手順

以下は独自ドメインの接続完了後（項目1・2完了後）に実施する。`*.pages.dev` の
プレビュー URL のみで確認する場合は、ドメイン取得前でも実施できる。

### プレビュー URL（`*.pages.dev`）での確認

Cloudflare Pages の Direct Upload プロジェクトは、デプロイ成功時にプレビュー URL を
発行する。

- production ブランチ: `https://<project>.pages.dev`
- ブランチ名を指定した場合: `https://<branch>.<project>.pages.dev`

`Makefile` の `deploy-preview` ターゲットは `--branch=preview` で実行するため、
後者の形になる。デプロイ完了後の CI ログ、または Cloudflare Pages ダッシュボードの
「Deployments」タブから実際の URL を確認できる。

### HTTP ステータス / セキュリティヘッダの確認

```bash
# トップページが 200 で返る & セキュリティヘッダ（CSP含む）が付与されている
curl -sI https://<your-domain-or-project>.pages.dev/ \
  | grep -Ei '^(HTTP|content-security-policy|x-frame-options|x-content-type-options|referrer-policy|permissions-policy):'
```

### 未知パスの SPA フォールバック確認

```bash
# 存在しないパスでも 200 が返り、body に NotFoundPage の文言が含まれること（白画面にならない）
curl -sI https://<your-domain-or-project>.pages.dev/no-such-page
curl -s https://<your-domain-or-project>.pages.dev/no-such-page | grep -i "404\|Not Found"
```

### OGP の反映確認

```bash
curl -s https://<your-domain-or-project>.pages.dev/ \
  | grep -Ei '<meta property="og:(title|description|image|url)"'
```

X（Twitter）や Slack に公開 URL を貼り、タイトル・説明文・OG 画像のプレビューが
正しく表示されることも目視確認する。`og:image` に指定した画像ファイルを
`public/` 配下に配置していることが前提である。

### CTA 到達確認

`src/config/links.ts` で `mailto:` を使っている導線がある場合は、ブラウザで
ページを開いて CTA ボタンをクリックする。OS のメールクライアントが期待どおりの
宛先で新規メール作成画面を起動することを目視確認する。問い合わせ先メールへの
実際の到達確認は、項目4（Email Routing）の設定完了後に実施する。
