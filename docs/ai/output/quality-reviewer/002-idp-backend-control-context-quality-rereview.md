# IDP backend control context API 品質再レビュー

- 作成日: 2026-07-30
- Agent: quality-reviewer
- 対象範囲: `docs/ai/output/quality-reviewer/001-idp-backend-control-context-quality-review.md`、`docs/ai/output/implementer/002-idp-backend-control-context-remediation.md`、`plugins/idp-backend/src/runtimeStore.ts`、`plugins/idp-backend/src/controlContextService.ts`、`plugins/idp-backend/src/controlContextService.test.ts`、関連する backend / frontend API 境界差分

## Verdict

Product Reviewer へ進めてよい。

初回品質レビューで指摘した blocking findings 2 件と medium finding 1 件は、実装とテスト証跡上いずれも解消されている。受入条件 1-7 についても、今回の小さな delivery scope では満たしていると判断する。blocking findings はない。

## Findings

### Blocking

なし。

### High

なし。

### Medium

なし。

### Low / Non-blocking observations

- runtime store は引き続き in-memory 実装であり、durable append-only 制約、DB migration、event correction 方針は後続成果の対象である。今回の Product Owner decision では初回 contract 検証が対象であり、blocking とはしない。
- `templateRefs` は Project annotation と `hasPart` / `partOf` relation に限定されたが、Scaffolder template の適用可能性を metadata / policy で判定する contract はまだない。これは後続の template governance / policy 成果で扱うのが妥当である。
- `allowedActions` は Catalog ownership の有無を使う summary に留まり、Backstage permission policy や ADR 0002 の実承認処理にはまだ接続されていない。今回の acceptance は summary の返却場所と Plan before action の境界作成であるため、残余リスクとして記録する。

## 初回 Findings の再確認

### latest Plan / ActionRun summary の store 経路

解消済み。

- `RuntimeAuditStore` に `appendPlan` / `appendActionRun` が追加され、`getLatestPlan` / `getLatestActionRun` で `targetEntityRef` が Project ref と一致する最新 `createdAt` の record を返す実装になっている。証跡: `plugins/idp-backend/src/runtimeStore.ts:17`、`plugins/idp-backend/src/runtimeStore.ts:56`、`plugins/idp-backend/src/runtimeStore.ts:62`、`plugins/idp-backend/src/runtimeStore.ts:68`、`plugins/idp-backend/src/runtimeStore.ts:76`
- `ControlContextService` は runtime store の latest getter を呼び、`ProjectControlContext.latestPlan` / `latestActionRun` に返している。証跡: `plugins/idp-backend/src/controlContextService.ts:108`
- テストは複数 Plan / ActionRun を append し、最新 summary が context に返ることを確認している。証跡: `plugins/idp-backend/src/controlContextService.test.ts:122`、`plugins/idp-backend/src/controlContextService.test.ts:151`

### `templateRefs` の Project 関連 Template 限定

解消済み。

- `ControlContextService` は Project の `bara.dev/template-ref` annotation と、Catalog relation `hasPart` / `partOf` で明示された関連 entity から Template refs を作っている。Catalog 全 Template を取得して混入する経路はない。証跡: `plugins/idp-backend/src/controlContextService.ts:59`、`plugins/idp-backend/src/controlContextService.ts:68`、`plugins/idp-backend/src/controlContextService.ts:98`
- regression test は unrelated Template entity を catalog response に含めたうえで、`template:default/unrelated-service` が返らないことを確認している。証跡: `plugins/idp-backend/src/controlContextService.test.ts:41`、`plugins/idp-backend/src/controlContextService.test.ts:157`

### OperationLog append-only contract の mutation 防御

解消済み。

- `appendOperationLog` と `listOperationLogs` は clone した record を扱い、返却 object mutation が store 内 record に反映されない実装になっている。証跡: `plugins/idp-backend/src/runtimeStore.ts:30`、`plugins/idp-backend/src/runtimeStore.ts:37`、`plugins/idp-backend/src/runtimeStore.ts:48`
- test は返却された OperationLog を mutation したあと、store から再取得した record が変更されていないことを確認している。証跡: `plugins/idp-backend/src/controlContextService.test.ts:224`

## 受入条件の確認

1. 満たす。`plugins/idp-backend` は Backstage backend plugin として追加され、`packages/backend` 側は `backend.add(import('@internal/plugin-idp-backend'))` の登録と依存追加に留まる。証跡: `plugins/idp-backend/src/plugin.ts:11`、`packages/backend/src/index.ts:69`
2. 満たす。Project ref、関連 Environment refs、関連 Template refs、allowed action summary、recent OperationLog、latest Plan / ActionRun summary を返す contract と実装がある。証跡: `plugins/idp-backend/src/contracts.ts:107`、`plugins/idp-backend/src/controlContextService.ts:118`
3. 満たす。Intent / Plan / ActionRun / OperationLog の最小 runtime / audit record contract は actor、target entity ref、event type、createdAt、status、risk summary、policy decision の格納場所を持つ。証跡: `plugins/idp-backend/src/contracts.ts:44`
4. 満たす。`desiredStateContract` は `catalog-and-git` を authoritative source とし、IDP backend runtime store が Project / Environment / Template desired state を authoritative data として保存しないことを明示している。test でも runtime store に `projects` / `environments` / `templates` key がないことを確認している。証跡: `plugins/idp-backend/src/runtimeStore.ts:8`、`plugins/idp-backend/src/controlContextService.test.ts:171`
5. 満たす。frontend 側に `BackendIdpApi` が追加され、Project control context read path が local mock data なしで検証されている。証跡: `plugins/idp/src/api/backendIdpApi.ts:16`、`plugins/idp/src/api/backendIdpApi.test.ts`
6. 満たす。OperationLog は append API のみで扱われ、update / delete API は追加されていない。返却 object mutation からの防御も test 済み。
7. 満たす。対象テスト、format、lint、型チェック、install、短時間起動確認はいずれも今回の再レビューで確認した。

## 検証証跡

- `node .yarn/releases/yarn-4.4.1.cjs install --immutable`: 成功。既存 React / testing-library 系 peer warning と `jest` peer warning は表示された。
- `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp-backend test --watch=false --runInBand`: 成功。2 suites / 4 tests。
- `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp test --watch=false`: 成功。1 suite / 1 test。
- `node .yarn/releases/yarn-4.4.1.cjs prettier:check`: 成功。
- `node .yarn/releases/yarn-4.4.1.cjs lint:all`: 成功。`NO_COLOR` と `FORCE_COLOR` の warning は表示されたが lint は成功。
- `node .yarn/releases/yarn-4.4.1.cjs tsc:full`: 成功。
- `timeout 90s node .yarn/releases/yarn-4.4.1.cjs start`: app / backend が起動し、backend log で `Plugin initialization started` に `idp` が含まれ、その後 `idp` が initialized list に入ることを確認した。確認後に手動終了したため最終 exit code は 130。

## 残余リスク

- in-memory runtime store は process restart で消えるため、実運用の監査証跡には永続 DB と migration、append-only 制約、correction event 方針が必要である。
- `createdAt` は ISO 8601 文字列比較で最新判定している。今回の test fixture と想定形式では成立するが、将来外部入力を受ける場合は timestamp validation / normalization を追加する必要がある。
- Catalog relation / annotation による related Template 判定は最小 contract として妥当だが、Template の適用可能性、owner routing、environment criticality との接続は未実装である。
- frontend には既存 `LocalIdpApi` が残っており、画面全体の backend client wiring は今回の非対象である。今回確認したのは backend-owned control context への read path 境界である。

## 結論

blocking findings はない。今回の outcome は corrective work の再レビューを通過し、Product Reviewer へ進めてよい。
