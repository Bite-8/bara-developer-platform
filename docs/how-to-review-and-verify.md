# レビュー・動作確認ガイド

このガイドは、Bara Developer Platform の変更を、実装者だけでなく Quality Reviewer、Product Reviewer、人間の PR reviewer も再現して確認できるようにするための共通手順です。詳細な役割の強制ルールは `AGENTS.md` を正とします。

## 配達単位をレビュー可能にする

Product Owner は実装前に、受入条件を次の表で定義します。条件には `AC-N` の ID を付け、実装・PR・各 reviewer の成果物で同じ ID を使います。

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

スクリーンショット、Playwright trace、CI artifact は補助証跡として有用ですが、再現手順の代わりにはなりません。成果物には結論を要約し、生のログや Secret を保存しません。

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

## 独立レビュー

Quality Reviewer は PR diff と Implementer の結果を確認したうえで、PR head を対象に Review guide を独立実行します。証跡の転載ではなく、自身で得た Pass / Fail / 未検証と根拠を記録します。重要な条件が未検証なら、理由と再現に必要な環境を finding にします。

Product Reviewer は同じ受入条件を利用者の観点で確認します。UI なら導線を実際に操作し、API なら consumer が期待する request / response を確認します。品質上成功していても、利用者価値の観測ができない条件は Pass にしません。

## CI

Pull Request では format、lint、type check、unit / integration test、E2E を自動実行します。CI が失敗した場合は、失敗理由を調査して修正するか、外部依存による明確な制約として Product Owner に判断を戻します。失敗を根拠なく無視して merge-ready としません。
