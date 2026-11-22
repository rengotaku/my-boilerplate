---
adr: 0002
title: scaffold のあとに毎回消されるサンプルはフラグで外せるようにし、テンプレート一覧は template.toml を正本にする
status: accepted
superseded_by: null
date: 2026-11-23
issues: [304, 305, 306, 307, 308, 309, 310, 311, 312, 313]
tags: [scaffold, no-auth, no-sample, python-web, react-spa, vite-ts, template-list, template.toml]
description: 利用実態の調査で分かった、scaffold 後に毎回消されるサンプルと古い一覧に対し、--no-auth の文書化、python-web の --no-auth / --no-sample、vite-ts の新設、README 一覧の生成を採った。Python + React は調査のみで見送り
---

# ADR 0002: scaffold のあとに毎回消されるサンプルはフラグで外せるようにし、テンプレート一覧は template.toml を正本にする

## 背景

#304 で、3 月以降に作った 83 repo を調べた。コード系でテンプレートがあった 58 件の内訳は、scaffold 済み 40、使えたのに未使用 10、合うテンプレート無し 8。使用率は 80% だった。テンプレート側の問題は次の 3 つだった。

- README の一覧が 21 件中 14 件しか載っておらず、最もよく使われる react-spa 系・python-web・go-react-spa が欠けていた。AI 向けの手順書とガードのメッセージも同じ 4 件の固定一覧だった
- python-web は scaffold した 3 件すべてが 52 ファイル中 20 ファイル（認証と items の CRUD サンプル）を削除していた。react-spa は 11 件中 7 件以上が 63 ファイル中 15 ファイル（ログイン・ユーザー系）を削除していた
- 素の Vite + TypeScript、Python + React などは、合うテンプレートが無かった

## 決定

- **一覧の正本は各テンプレートの `template.toml`**（#305）。README の一覧表は `scripts/gen-readme-list.sh` で生成し、docs CI の `make check-readme-list` でずれを検出する。並び順は `LC_ALL=C` で固定する。AI 向けの手順書とガードのメッセージは固定の一覧をやめ、`download.sh --list` の取得コマンドを案内する
- **react-spa の `--no-auth`**（#311）は仕組みを変えず、文書だけ直す。`download.sh` のヘッダの「go-react-spa only」が誤りで、README のオプション表にも無かった。`--no-auth` で scaffold した結果が `make ci` を通ることを、専用のワークフローで検証する
- **python-web に `--no-auth` と `--no-sample` を足す**（#308、#313）。認証（auth / users）と items の CRUD サンプルは、モデルとルートは互いに依存しない。そこで別々のフラグにした。両方付ければ両方除く
  - 消すファイルは、テンプレート直下の `.noauth-remove` / `.nosample-remove` に書く
  - ファイルを消すだけでは直らない箇所には、テンプレート側で `@scaffold:remove-if` / `@scaffold:keep-if` の目印コメントを置く。対象は、`app.py` のルーター読み込み、`base.html` のリンク、`models.py`、初期マイグレーション、テストの一部。scaffold はこの範囲を消す。閉じ忘れや未知の条件があれば中断する
  - `--no-sample` は python-web だけ。python-cli など他のテンプレートでは、コピーを始める前にエラーで止める
  - フラグなしの scaffold 結果は、変更前と 1 ファイルも変えない
- **`vite-ts` を新設する**（#309、#312）。React・Tailwind・状態管理を持たない、素の Vite + TypeScript + Vitest + ESLint の最小構成。dev サーバは `strictPort` を付け、`make run` / `make stop` / `make status` が同じ `PORT` を見る
- **Python + React は調査まで**（#310）。2 件の構成を読み、共通部分は FastAPI のバックエンドと react-spa とほぼ同じフロントだった。案は「FastAPI の API だけの土台（`python-api`）」と「それと react-spa の合成（`python-react-spa`）」の 2 段階だが、まだ決めていない

## 捨てた案

- **python-web の最小版を別テンプレートにする**: 認証とサンプルを外した python-web は、`python-api` を別に作る案と重なる。まずフラグで外せるようにして、効果を見てから判断する
- **react-spa に「React なし」のオプションを足す**: react-spa の構成が根本から変わる。素の Vite + TS は `vite-ts` として別にした
- **認証と items を 1 つのフラグにまとめる**: 互いに依存しないので、別々に外せるほうが使い分けられる
- **共有の README テンプレートの来歴行（テンプレート名を含む出典リンク）を変える**: 全テンプレートの scaffold 出力が変わり、範囲を超える。置換漏れの判定からこの行を除いた
- **調査用 repo がコードを持ち始めた時点でテンプレートを選び直す仕組み**（#304 の OPT-4）: 根拠が 1 件で、scaffold 由来かを見分ける目印も無い。見送った

## 守らせ方

| 欄 | 内容 |
|---|---|
| あるべき状態 | README の一覧が `template.toml` と一致する。python-web の 4 通り（フラグなし、`--no-auth`、`--no-sample`、両方）と react-spa の `--no-auth` の scaffold が、`make ci` を通る |
| 誰が見るか | docs CI の `check-readme-list`、`scaffold-verify-python-web-flags`、`scaffold-verify-react-spa-noauth` が、PR のたびに見る |
| 状態の置き場 | PR の CI の結果。見送った項目は enhancement issue に置く |
| 戻り道 | CI が赤の PR はマージされない。見送った項目は、issue の再評価条件に当たったときに再検討する |

## 変えてよい前提 / 壊すと危ない前提

- **変えてよい**: 目印コメントの書式、manifest のファイル名、`vite-ts` のポート番号とサンプルの中身、README の一覧の並び順の規則（固定さえすればよい）
- **壊すと危ない**:
  - フラグなしの scaffold 結果が変わらないこと。変えると、既存の利用者の scaffold が静かに変わる
  - 目印コメントの除去が、閉じ忘れや未知の条件で止まること。黙って通すと、サンプルが半分だけ残った生成物ができる
  - `--no-sample` が python-web だけで受け付けられること。他のテンプレートで黙って通ると、「除去した」と表示してサンプルが残る
  - 一覧の生成が `LC_ALL=C` で固定されていること。外すと、CI とローカルで並びが変わり、docs CI が赤になる
  - 見送った manifest のパス検査（`../` で生成先の外を消せる）は、react / go の削除処理にも無い。manifest を編集するときは、書き間違いに注意する
