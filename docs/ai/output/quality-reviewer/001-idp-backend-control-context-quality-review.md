# IDP backend control context API 品質レビュー

- 作成日: 2026-07-30
- Agent: quality-reviewer
- 対象範囲: `docs/ai/output/product-owner/001-idp-backend-control-context-outcome.md`、GitHub Issue #23、`docs/ai/output/implementer/001-idp-backend-control-context-implementation.md`、新規 `plugins/idp-backend`、`packages/backend` の registration、`plugins/idp` の backend API client / 型境界、`yarn.lock`

## Verdict

修正作業と再レビューが必要。

`plugins/idp-backend` の追加、`packages/backend` の薄い registration、Project / Environment / Template desired state を IDP DB の authoritative data として保存しない contract、frontend backend client 境界、mock-free read path の対象テストは確認できた。一方で、受入条件 2 の `latest Plan / ActionRun summary` が実際の store 経由では返せない状態であり、`templateRefs` が Project に関連付いた Template ではなく Catalog 上の全 Template を含む実装になっているため、blocking finding として扱う。

## Findings

### Blocking: latest Plan / ActionRun summary を実際に返せる store 経路がない

- 重大度: High / Blocking
- 関連受入条件: 2、3
- 証跡:
  - `ProjectControlContext` contract には `latestPlan?: PlanSummary` と `latestActionRun?: ActionRunSummary` がある。
  - `ControlContextService` は `runtimeStore.getLatestPlan()` と `runtimeStore.getLatestActionRun()` の結果をそのまま返す。
  - しかし `RuntimeAuditStore` interface は `PlanSummary` / `ActionRunSummary` について getter しか持たず、`InMemoryRuntimeAuditStore` の `plans` / `actionRuns` は private 配列で、追加・記録する公開経路がない。
  - 既存テストは `OperationLog` だけを seed しており、`latestPlan` / `latestActionRun` が非空で control context に返ることを検証していない。
- 影響:
  - API contract 上は latest summary を返せるように見えるが、現実の runtime store では常に `undefined` になり、Plan before action / ActionRun summary の後続 UI や AI client が検証できない。
  - Intent / Plan / ActionRun / OperationLog contract のうち、Plan / ActionRun の格納場所は型として存在するが、store operation とテスト証跡が不足している。
- 推奨 remediation:
  - `RuntimeAuditStore` に `appendPlan` / `appendActionRun`、または初期実装で必要な記録 API を追加する。
  - `ControlContextService` のテストで複数 Plan / ActionRun を格納し、最新の `createdAt` を持つ summary が `ProjectControlContext.latestPlan` / `latestActionRun` に返ることを確認する。
  - まだ write API を外部公開しない方針であっても、backend-owned runtime store の内部 contract として格納・取得が成立することをテストで示す。

### Blocking: `templateRefs` が関連 Template ではなく Catalog 上の全 Template を返す

- 重大度: High / Blocking
- 関連受入条件: 2
- 証跡:
  - `ControlContextService` は annotation と relation から Template refs を集めた後、追加で `{ filter: { kind: 'Template' } }` による Catalog 全 Template を `templateRefs` に含めている。
  - `controlContextService.test.ts` の `templateEntity` は Project への relation や annotation を持たないが、期待値として `templateRefs: ['template:default/node-service']` を許容している。
- 影響:
  - 受入条件の「関連 Template refs」と異なり、Project に関係しない Template が control context に混入する。
  - Catalog が大きくなると Project detail read のたびに全 Template を読むため、不要な payload 増加と遅延につながる。
  - AI agent / automation client が Project に適用可能だと誤認する Template を候補に含める可能性がある。
- 推奨 remediation:
  - 初回 contract では `templateRefs` を Project annotation `bara.dev/template-ref` と `hasPart` / `partOf` などの明示的関係に限定する。
  - 全 Template を返したい場合は `availableTemplateRefs` など別フィールドに分け、受入条件と Product Owner decision に追加確認を残す。
  - 関連なし Template が返らない regression test を追加する。

### Medium: OperationLog append-only の検証が「追記できる」確認に留まっている

- 重大度: Medium
- 関連受入条件: 6
- 証跡:
  - `appendOperationLog` は `{ ...record }` を配列に push しているため、入力 object の後続変更は内部 store に反映されにくい。
  - 一方で `listOperationLogs` は store 内の object を clone せずに返す。内部 caller が返却 object を変更すると、同じ in-memory record を変更できる余地がある。
  - 既存テストは 2 件追記後の件数だけを確認しており、既存 log が変更・削除されないことまでは検証していない。
- 影響:
  - 現在の HTTP response は JSON serialize されるため外部 client が直接 mutate するリスクは限定的。ただし audit store contract としては append-only 前提の防御が弱く、後続の backend 内部利用で監査記録の不変性が崩れる可能性がある。
- 推奨 remediation:
  - `listOperationLogs` も clone した record を返す。
  - 返却後の object 変更が store 内 record に反映されないことをテストする。
  - 将来 DB 化する際は update/delete API を設けないこと、または event correction を別 event として追記する方針を contract に明記する。

## 受入条件の確認

1. 概ね満たす。`plugins/idp-backend` は Backstage backend plugin として追加され、`packages/backend/src/index.ts` は `backend.add(import('@internal/plugin-idp-backend'))` の登録に留まる。
2. 一部未達。Project ref、Environment refs、allowed action summary、recent OperationLog は返せる。`latestPlan` / `latestActionRun` は contract 上 optional だが実際に格納して返す経路がない。`templateRefs` は関連 Template ではなく全 Template を含む。
3. 一部未達。Intent / Plan / ActionRun / OperationLog の型には actor、target entity ref、event type、createdAt、status、risk summary / policy decision の格納場所がある。ただし Plan / ActionRun の store operation と非空 read 証跡がない。
4. 満たす。`desiredStateContract` は `authoritativeSource: 'catalog-and-git'` と `idpBackendStoresAuthoritativeDesiredState: false` を明示し、runtime store に `projects` / `environments` / `templates` を持たないテストがある。
5. 満たす。`BackendIdpApi` と `backendIdpApi.test.ts` により、frontend mock adapter から backend API client へ差し替える境界と mock-free Project control context read path が示されている。
6. 一部未達。OperationLog を追記する形式はあるが、append-only の不変性検証が不足している。
7. 満たす。レビュー時点で必須品質確認のうち install / prettier / lint / typecheck と対象 test は成功した。`yarn start` は Project Manager の実装成果物に成功証跡があり、レビューでは再実行しなかった。

## 検証証跡

- `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp-backend test --watch=false`: 成功。2 suites / 4 tests。
- `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp test --watch=false`: 成功。1 suite / 1 test。
- `node .yarn/releases/yarn-4.4.1.cjs prettier:check`: 成功。
- `node .yarn/releases/yarn-4.4.1.cjs lint:all`: 成功。`NO_COLOR` と `FORCE_COLOR` の warning は表示されたが lint は成功。
- `node .yarn/releases/yarn-4.4.1.cjs tsc:full`: 成功。
- `node .yarn/releases/yarn-4.4.1.cjs install --immutable`: 成功。既存 React / testing-library 系 peer warning と、新規 `@internal/plugin-idp-backend` の `jest` peer warning は表示された。
- `yarn start`: レビューでは再実行していない。Project Manager の成果物では `idp` plugin initialization complete まで到達したと記録されている。

## 残余リスク

- runtime store は in-memory 実装であり、永続 DB migration、監査ログの durable append-only 制約、event correction 方針は後続成果で設計が必要。
- `allowedActions` は Catalog ownership を見た summary であり、Backstage permission policy や ADR 0002 の実承認境界とはまだ接続されていない。
- `templateRefs` の定義は今回の blocking finding の通り、Project 固有の関連 Template と全体の利用可能 Template を分ける product contract の確認が必要。
- frontend の既存 `LocalIdpApi` は残っているため、画面全体が backend client に切り替わったわけではない。今回の受入条件上は read path 境界までで足りるが、次サイクルでは実 UI wiring の検証が必要。

## 結論

blocking findings が 2 件あるため、この outcome は Product Reviewer へ進めず、Project Manager による corrective work と再レビューが必要。
