# ADR 索引

<!-- generate-adr-index.zsh による自動生成。手で編集しない -->

| ADR | タイトル | status | date | 要旨 |
|---|---|---|---|---|
| [0001](0001-extract-templates-from-recent-repos.md) | 直近リポジトリからのテンプレ抽出は「推奨度・高」のみ採用し static-lp / python-llm-pipeline を新設する | accepted | 2026-08-05 | 直近 2 ヶ月のリポジトリ横断調査から再利用資産を抽出し、二重発明・作り込みが実証された 2 件のみ新テンプレ化。他候補は再評価条件付きでバックログ化した |
| [0002](0002-scaffold-flags-and-template-list-source.md) | scaffold のあとに毎回消されるサンプルはフラグで外せるようにし、テンプレート一覧は template.toml を正本にする | accepted | 2026-11-23 | 利用実態の調査で分かった、scaffold 後に毎回消されるサンプルと古い一覧に対し、--no-auth の文書化、python-web の --no-auth / --no-sample、vite-ts の新設、README 一覧の生成を採った。Python + React は調査のみで見送り |
