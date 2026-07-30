# IDP backend control context API の実装

- 作成日: 2026-07-30
- Agent: implementer
- 対象範囲: Product Owner 決定記録 `docs/ai/output/product-owner/001-idp-backend-control-context-outcome.md` と GitHub Issue #23

## 実装概要

`plugins/idp-backend` を新規 Backstage backend plugin として追加し、Project control context を返す read API と、Intent / Plan / ActionRun / OperationLog の最小 runtime / audit contract を実装した。

実装担当 agent は初回実装を作成したが、型・lint・test 修正と成果物保存前に中断した。Project Manager が remediation として test fixture、ESLint 設定、frontend client の戻り型、整形、検証を補完した。

## 変更内容

- `plugins/idp-backend/`: backend plugin、contract 型、Catalog と runtime store を合成する `ControlContextService`、Express router、append-only 前提の in-memory runtime audit store、単体テストを追加した。
- `packages/backend/src/index.ts`: `@internal/plugin-idp-backend` の登録を追加した。`packages/backend` 側の変更は plugin registration に限定した。
- `packages/backend/package.json`: `@internal/plugin-idp-backend` workspace 依存を追加した。
- `plugins/idp/src/types/index.ts`: frontend から backend control context contract を参照できる最小型を追加した。
- `plugins/idp/src/api/backendIdpApi.ts`: `/api/idp/control-context/project` を読む mock-free backend API client 境界を追加した。
- `plugins/idp/src/api/backendIdpApi.test.ts`: backend API client が local mock data なしで Project control context read path を呼び出すことを確認した。
- `plugins/idp/src/api/idpApi.ts` / `plugins/idp/src/api/localIdpApi.ts`: 既存 local adapter を残しつつ、backend contract と同形の `getProjectControlContext` を追加した。

## 受入条件ごとの証跡

1. `plugins/idp-backend` を追加し、`packages/backend` は `backend.add(import('@internal/plugin-idp-backend'))` と依存追加のみ。
2. `ProjectControlContext` は `projectRef`、`environmentRefs`、`templateRefs`、`allowedActions`、`recentOperationLogs`、`latestPlan`、`latestActionRun` を返す。
3. `contracts.ts` に `IntentRecord`、`PlanSummary`、`ActionRunSummary`、`OperationLogRecord` を定義し、`actor`、`targetEntityRef`、`eventType`、`createdAt`、`status`、`riskSummary`、`policyDecision` の格納場所を持たせた。
4. `desiredStateContract` は `authoritativeSource: 'catalog-and-git'` と `idpBackendStoresAuthoritativeDesiredState: false` を明示し、test で runtime store に `projects` / `environments` / `templates` を持たないことを確認した。
5. `BackendIdpApi` とその test により、少なくとも Project control context の read path を backend API 経由で検証した。
6. `RuntimeAuditStore.appendOperationLog` と append-only test により、後続の plan / dry-run / execution event を OperationLog として追加できる形式にした。
7. 必須品質確認と起動確認を Project Manager remediation 後に実行した。

## 検証結果

- `node .yarn/releases/yarn-4.4.1.cjs install --immutable`: 成功。既存 peer dependency warning と新規 plugin の `jest` peer warning は表示された。
- `node .yarn/releases/yarn-4.4.1.cjs prettier:check`: 成功。
- `node .yarn/releases/yarn-4.4.1.cjs lint:all`: 成功。
- `node .yarn/releases/yarn-4.4.1.cjs tsc:full`: 成功。
- `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp-backend test --watch=false`: 成功。2 suites / 4 tests。
- `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp test --watch=false`: 成功。1 suite / 1 test。
- `node .yarn/releases/yarn-4.4.1.cjs start`: app は `http://localhost:3000/`、backend は `:7007` で起動し、`idp` plugin が initialization complete まで到達。確認後に終了した。

## 未解決事項

- runtime store は初期 contract 検証用の in-memory 実装であり、永続 DB migration は今回の非対象。
- Environment criticality、owner routing、policy details は最小 summary に留めた。詳細 permission policy は後続成果で扱う。
- Scaffolder task、Git PR、CI/CD への実行接続は今回の非対象。
