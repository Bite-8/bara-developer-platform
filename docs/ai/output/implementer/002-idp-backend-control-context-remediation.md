# IDP backend control context API の品質指摘対応

- 作成日: 2026-07-30
- Agent: implementer
- 対象範囲: `docs/ai/output/quality-reviewer/001-idp-backend-control-context-quality-review.md` の blocking findings と medium finding

## 修正概要

品質レビューで指摘された `latestPlan` / `latestActionRun` の格納経路不足、Project に関連しない Template 混入、OperationLog append-only contract の不変性不足に対応した。

実装担当 agent が修正差分を作成したが、成果物保存前に完了通知がなかったため、Project Manager が検証と成果物保存を補完した。

## Findings への対応

### latest Plan / ActionRun summary の格納・返却経路

- `RuntimeAuditStore` に `appendPlan` と `appendActionRun` を追加した。
- `InMemoryRuntimeAuditStore` は Plan / ActionRun を clone して格納し、`getLatestPlan` / `getLatestActionRun` は `createdAt` が最新の summary を clone して返す。
- `ControlContextService` のテストで複数 Plan / ActionRun を格納し、最新 summary が `ProjectControlContext.latestPlan` / `latestActionRun` に返ることを確認した。

### Project 関連 Template refs への限定

- `ControlContextService` は Project の `bara.dev/template-ref` annotation と、`hasPart` / `partOf` の明示的な関連から Template refs を集めるようにした。
- Catalog 上の全 Template を `templateRefs` に混ぜる処理を削除した。
- 関連なし Template が `templateRefs` に含まれない regression test を追加した。

### OperationLog append-only 不変性

- `appendOperationLog` と `listOperationLogs` は clone した record を扱うようにした。
- `listOperationLogs` の返却 object を mutation しても store 内 record が変わらないことを test で確認した。
- update/delete API は追加していない。

## 検証結果

- `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp-backend test --watch=false`: 成功。2 suites / 4 tests。Jest worker の graceful exit warning は表示されたが exit code は 0。
- `node .yarn/releases/yarn-4.4.1.cjs prettier:check`: 成功。
- `node .yarn/releases/yarn-4.4.1.cjs tsc:full`: 成功。
- `node .yarn/releases/yarn-4.4.1.cjs lint:all`: 成功。`NO_COLOR` と `FORCE_COLOR` の warning は表示されたが lint は成功。
- `node .yarn/releases/yarn-4.4.1.cjs install --immutable`: 成功。既存 peer dependency warning と新規 plugin の `jest` peer warning は表示された。

## 未解決事項

- runtime store は in-memory contract 実装のままであり、durable append-only 制約や DB migration は後続成果。
- Project と Template の関連定義は `hasPart` / `partOf` と annotation に限定している。Scaffolder template governance metadata による適用可能 Template 判定は後続成果。
- Jest worker の graceful exit warning は test 成功を阻害していないが、必要なら router test の teardown を後続で精査する。
