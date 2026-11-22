# vite-ts

素の Vite + TypeScript で、**React を使わない**小さなブラウザ向けツールを作るための
テンプレートです。

## このテンプレートの性格

画面部品を組み立てるのではなく、少しのロジックと DOM 操作で足りるツールを想定して
います。React・Tailwind CSS・状態管理・ルーターは入っていません。

| 作りたいもの | 使うテンプレート |
|--------------|------------------|
| 素の DOM 操作で足りる小さなツール（計算・整形・変換など） | `vite-ts`（このテンプレート） |
| 画面部品を組み立てる SPA、状態管理やルーティングが要る | [`react-spa`](../react-spa) |

**React が要るなら `react-spa` を使ってください。** このテンプレートへ React を後から
足す構成は、`react-spa` の部分集合になるため用意していません。

## Tech Stack

| Category | Technology |
|----------|------------|
| Build | Vite |
| Language | TypeScript |
| Linter | ESLint |
| Formatter | Prettier |
| Testing | Vitest |

## Project Structure

```text
vite-ts/
├── src/
│   ├── lib/
│   │   ├── text.ts        # 純粋関数のサンプル（空白の畳み込み・語数）
│   │   └── text.test.ts   # サンプルのテスト（正常・空入力の 2 ケース）
│   └── main.ts            # DOM の配線（サンプル画面のエントリ）
├── index.html             # サンプル画面
├── Makefile               # install / run / lint / test / ci
├── eslint.config.js
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

`src/lib/text.ts` と `index.html`・`src/main.ts` は、使い始めるときに消す前提の
サンプルです。消したあとは、自分のツールのロジックを `src/lib/` に、DOM の配線を
`src/main.ts` に書いてください。

## Getting Started

```bash
# 依存をインストールする
make install

# 開発サーバを起動する（http://localhost:5176）
make run

# 検査・テスト・ビルドをまとめて通す
make ci
```

開発サーバのポートは `5176` です。`make run` / `make stop` / `make status` は同じ `PORT` を見ます。`make run PORT=5180` のように変えると、起動・停止・状態確認がそろって 5180 を使います。5176 が別のプロセスに使われているときは、`make run` は別のポートへ移らずに失敗します。

## Commands

| Command | Description |
|---------|-------------|
| `make install` | 依存をインストールします |
| `make run` | 開発サーバを起動します |
| `make build` | 本番ビルドを `dist/` に出力します |
| `make preview` | 本番ビルドを手元で確認します |
| `make stop` | 開発サーバを停止します |
| `make status` | 開発サーバの起動状態を表示します |
| `make lint` | ESLint を実行します |
| `make lint-fix` | ESLint の指摘を自動修正します |
| `make format` | Prettier で整形します |
| `make format-check` | 整形のずれを検査します |
| `make typecheck` | 型検査だけを実行します |
| `make test` | テストを 1 回実行します |
| `make test-watch` | テストを監視モードで実行します |
| `make test-cov` | カバレッジ付きでテストを実行します |
| `make check` | lint とテストを実行します |
| `make ci` | lint・整形検査・型検査・カバレッジ付きテスト・ビルドを順に実行します |
| `make clean` | ビルド生成物と依存を削除します |

カバレッジの下限は 80% です（`vitest.config.ts` の `thresholds`）。`src/main.ts` は
DOM の配線だけで、画面を見て確かめる層なので計測対象から外しています。
