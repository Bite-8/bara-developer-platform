# レビュー・動作確認ガイド

このガイドは、Bara Developer Platform の変更を、実装者と Quality Reviewer が再現して確認できるようにするための共通手順です。Product Reviewer と人間のフィードバックは、必要に応じて次の iteration を良くする助言として扱います。開発サイクルは `.codex/skills/run-idp-development-cycle/SKILL.md`、merge gate は `.codex/skills/merge-reviewed-pr/SKILL.md` を正とします。

## 配達単位をレビュー可能にする

メイン agent は実装前に、受入条件を関連 GitHub Issue へ次の表で定義します。条件には `AC-N` の ID を付け、Issue、PR body、各 reviewer の結果で同じ ID を使います。

| ID   | 前提データ・fixture                     | 操作または request                 | 期待結果                                         | 自動検証             | 手動確認                   |
| ---- | --------------------------------------- | ---------------------------------- | ------------------------------------------------ | -------------------- | -------------------------- |
| AC-N | ローカルで再現できる sample data / 設定 | 利用者の UI 操作または API request | 表示、状態、response、拒否理由などの具体的な結果 | test file と command | URL / command と確認する値 |

次を満たさない条件はレビュー可能ではありません。

- 「起動する」「問題ない」のように結果を判定できない。
- Secret、個人情報、本番リソース、手作業でしか作れない状態に依存する。
- 何を変更前と比較するか、または何を返却・表示するかが不明である。

UI / UX または安全な新機能では、確認 route または safe fixture、基本操作、短い変更意図、revert 方法を定義します。主要導線を置き換える UI、または approval、risk、permission、execute の意味を扱う UI / feature は代表 journey も定義します。API / backend の変更では、正常系に加えて不正入力、対象外データ、権限・副作用の拒否のうち変更に関係する境界を定義します。

## Implementer が PR に残す Review guide

PR 本文の Review guide には、受入条件ごとに次を記載します。

1. 実行する command と前提環境。
2. 使用する fixture、route、request body、または UI 操作。
3. 期待結果と、それを確認する画面上の文言、HTTP status、response field、または副作用なしの状態。
4. 対応する automated test と実行結果。
5. 外部依存で実行できない場合の理由、影響、代替証跡。

PR 本文には PR head commit SHA も残します。スクリーンショット、Playwright trace、CI artifact は補助証跡として有用ですが、再現手順の代わりにはなりません。PR 固有 evidence は対象 PR への追加 commit にせず、PR body、Issue、または reviewed SHA 付き GitHub comment / check に残します。

利用者向け変更では、確認 route または safe fixture を Review guide に含めます。人間のフィードバックを得られる場合は短い確認手順を添えるが、常時の owner acceptance は merge 条件にしません。

production、永続データ、認証、権限、外部連携、migration、deployment に影響する変更では、relevant な configuration / Secret 境界、rollout、rollback または forward recovery、backup / restore、health / observability、staging smoke test を Review guide または残余リスクへ記載します。非該当項目は理由を明示します。本番操作は review 手順に含めません。

## ローカル確認

Node.js 22 または 24 と Corepack を使います。グローバルの `yarn` がない環境では、以下のように Corepack 経由で実行します。変更対象の format、lint、type check、focused test を最低限とし、広い suite は影響範囲または CI に応じて実行します。

```bash
corepack yarn install --immutable
corepack yarn prettier:check
corepack yarn lint:all
corepack yarn tsc:full
# focused test がない場合、または広い回帰確認が必要な場合
corepack yarn test --watch=false
```

主要導線を置き換える変更、または approval、risk、permission、execute の意味を扱う UI / feature では、初回だけ browser を導入して E2E を実行します。可逆な visual / interaction exploration は対象 test または route smoke と手動確認でよい。

```bash
corepack yarn exec playwright install chrome --no-shell
corepack yarn test:e2e
```

`test:e2e` は通常、frontend を `http://localhost:3000`、backend を `http://localhost:7007` で起動します。個別の手動確認では別の terminal で `corepack yarn start` を起動し、Review guide にある route または API request を実行します。確認後は開発サーバーを停止します。

## 独立レビューと merge gate

Quality Reviewer は同じ current PR head を独立してレビューし、merge の hard gate とする。Product Reviewer は main agent が独立した利用者体験の助言を必要とする場合にだけ実行し、通常の UI / UX・新機能の merge gate にはしない。

Quality Reviewer は、レビューを始める前に PR URL、base branch、head SHA を取得する。Review guide を PR head から実行し、各 AC と全体 verdict を `PASS` / `FAIL` / `UNVERIFIED` で評価する。実装者の結果は参考にできるが、観測の代わりにしない。結果は delivery branch を変更せず、メイン agent へ返し、reviewed SHA 付き GitHub comment / check として記録する。Product-review advice を求める場合も、対象 head を明記する。

PR head が review 中または review 後に変わった場合、旧 Quality verdict は merge gate に使えない。新しい head を Quality Reviewer が再評価する。Product-review advice は、security / correctness finding を除き、新しい head の merge を止めない。

メイン agent は次を満たす場合にのみ merge または merge queue への投入を行う。

- Quality Reviewer の `PASS` verdict と reviewed SHA が current PR head SHA に一致する。
- 全受入条件が `PASS` であり、blocking finding と重要な `UNVERIFIED` がない。
- required CI が成功し、PR が conflict なく merge 可能である。
- PR body、関連 Issue、SHA 付き GitHub comment / check に Review guide、検証、残余リスク、reviewer verdict がある。

GitHub の `Approve` 操作は必須ではない。同一 GitHub identity からの独立 agent verdict は自己 `APPROVE` と同一視せず、reviewed SHA 付き comment / check として扱う。branch protection や merge queue がある場合はそれに従い、base branch への直接 push で代替しない。条件を満たさない場合は merge せず、不足した確認または修正を関連 Issue または PR comment に残す。

Quality Reviewer は correctness、security、regression、maintainability、Backstage compatibility、negative / boundary case を主に観測する。Product Reviewer は代表的な利用者導線、情報の理解しやすさ、視覚的印象、機能の可能性について助言できるが、好みや唯一解の不在を `FAIL` と扱わない。同じ test report の二重追認を独立レビューとしない。

merge 後は関連 Issue に merge commit、利用者価値、残余リスク、次サイクルへの学びを記録する。受入条件が完了した Issue は close し、部分完了なら残る条件を明記して open のままにする。

## workflow 変更の forward test

`AGENTS.md`、project-local skill、custom agent、review / merge contract を実質的に変えた場合は、fresh session または最小コンテキストの subagent で次を確認する。本番副作用、追加購入、権限変更は行わない。

1. 未完了 PR がある状態で「開発して」と依頼し、新規 discovery より先に、その PR の current SHA、review、CI、merge gate の不足を再開する。収束後は同じ delivery wave の ready unit へ継続する。
2. 未完了 PR がなく、独立 unit と依存 unit を含む decision-ready backlog がある状態で依頼し、initiative と coherent delivery wave を作り、独立 unit は ownership を分けて並行、依存 unit は predecessor merge 後に順次実施する。
3. decision-ready backlog がない粗いゴールで依頼し、read-only discovery の後に selection だけが initiative、delivery wave、選外を含む decision-ready backlog の Issue を作成・更新する。
4. 最初の PR が merge / hold になった状態で、ready な次 unit があれば 1 PR 完了を終了条件にせず継続し、全 unit の収束または明示的 block で終了する。
5. 可逆な UI / feature 候補が過剰な discovery、owner acceptance、Product Reviewer の gate を待たずに確認 route と revert 方法を持って進み、production 影響のある候補では relevant な rollout / rollback / operability evidence が受入条件と PR Review guide に現れる。

全ケースで、各 delivery unit が独立した Issue / PR / gate を持つこと、reviewer が対象 PR head を変更しないこと、SHA が変われば旧 verdict を流用しないこと、unit の merge / hold 後に dependency graph と関連 Issue が収束することを確認する。forward test が外部状態を変更する場合は、専用 fixture repository または dry-run を使い、実環境で安全に再現できない項目を `UNVERIFIED` として残す。

## CI

Pull Request CI は format、lint、type check、unit / integration test を品質 gate とします。repository の workflow が E2E も実行する場合は、その結果も無視しません。CI が失敗した場合は、失敗理由を調査して修正するか、外部依存による明確な制約としてメイン agent の merge 判断に戻します。失敗を根拠なく無視して merge-ready としません。
