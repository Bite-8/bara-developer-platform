# レビュー・動作確認ガイド

このガイドは、Bara Developer Platform の変更を、実装者だけでなく Quality Reviewer、Product Reviewer、人間の PR reviewer も再現して確認できるようにするための共通手順です。役割と merge の強制ルールは `AGENTS.md` を正とします。

## 配達単位をレビュー可能にする

メイン agent は実装前に、受入条件を次の表で定義します。条件には `AC-N` の ID を付け、実装・PR・各 reviewer の成果物で同じ ID を使います。

| ID   | 前提データ・fixture                     | 操作または request                 | 期待結果                                         | 自動検証             | 手動確認                   |
| ---- | --------------------------------------- | ---------------------------------- | ------------------------------------------------ | -------------------- | -------------------------- |
| AC-N | ローカルで再現できる sample data / 設定 | 利用者の UI 操作または API request | 表示、状態、response、拒否理由などの具体的な結果 | test file と command | URL / command と確認する値 |

次を満たさない条件はレビュー可能ではありません。

- 「起動する」「問題ない」のように結果を判定できない。
- Secret、個人情報、本番リソース、手作業でしか作れない状態に依存する。
- 何を変更前と比較するか、または何を返却・表示するかが不明である。

UI の変更では、対象利用者が価値を得る主要導線を一つ以上定義します。API / backend の変更では、正常系に加えて不正入力、対象外データ、権限・副作用の拒否のうち変更に関係する境界を定義します。

## Implementer が PR に残す Review guide

PR 本文の Review guide には、受入条件ごとに次を記載します。

1. 実行する command と前提環境。
2. 使用する fixture、route、request body、または UI 操作。
3. 期待結果と、それを確認する画面上の文言、HTTP status、response field、または副作用なしの状態。
4. 対応する automated test と実行結果。
5. 外部依存で実行できない場合の理由、影響、代替証跡。

PR 本文には PR head commit SHA も残します。スクリーンショット、Playwright trace、CI artifact は補助証跡として有用ですが、再現手順の代わりにはなりません。成果物には結論を要約し、生のログや Secret を保存しません。

## ローカル確認

Node.js 22 または 24 と Corepack を使います。グローバルの `yarn` がない環境では、以下のように Corepack 経由で実行します。

```bash
corepack yarn install --immutable
corepack yarn prettier:check
corepack yarn lint:all
corepack yarn tsc:full
corepack yarn test --watch=false
```

UI 導線を変更した場合は、初回だけ browser を導入して E2E を実行します。

```bash
corepack yarn exec playwright install chrome --no-shell
corepack yarn test:e2e
```

`test:e2e` は通常、frontend を `http://localhost:3000`、backend を `http://localhost:7007` で起動します。個別の手動確認では別の terminal で `corepack yarn start` を起動し、Review guide にある route または API request を実行します。確認後は開発サーバーを停止します。

## 独立レビューと merge gate

Quality Reviewer と、利用者挙動・UI / UX・API contract・成果仮説を変える場合の Product Reviewer は、同じ current PR head を独立してレビューできる。順番に待つ必要はない。

各 reviewer は、レビューを始める前に PR URL、base branch、head SHA を取得し、成果物に記録する。Review guide を PR head から実行し、各 AC を Pass / Fail / 未検証で評価する。実装者の結果や別 reviewer の verdict は参考にできるが、観測の代わりにしない。

PR head が review 中または review 後に変わった場合、旧 SHA の verdict は merge gate に使えない。変更の影響に応じて必要な reviewer が新しい head を再評価する。docs / internal configuration のみで利用者挙動を変えない PR は、メイン agent が理由を記録して Product Reviewer を省略できる。

メイン agent は次を満たす場合にのみ merge または merge queue への投入を行う。

- 必要な reviewer の Pass verdict と reviewed SHA が current PR head SHA に一致する。
- 全受入条件が Pass であり、blocking finding と重要な未検証がない。
- required CI が成功し、PR が conflict なく merge 可能である。
- PR 本文、実装成果物、cycle record に Review guide、検証、残余リスク、reviewer 成果物への参照がある。

GitHub の `Approve` 操作は必須ではない。branch protection や merge queue がある場合はそれに従い、base branch への直接 push で代替しない。条件を満たさない場合は merge せず、不足した確認または修正を cycle record に残す。

## CI

Pull Request では format、lint、type check、unit / integration test、E2E を自動実行します。CI が失敗した場合は、失敗理由を調査して修正するか、外部依存による明確な制約としてメイン agent の merge 判断に戻します。失敗を根拠なく無視して merge-ready としません。
