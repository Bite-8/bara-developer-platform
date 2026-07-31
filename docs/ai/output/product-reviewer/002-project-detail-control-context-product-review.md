# PR #29 Project detail control context 製品レビュー

- 作成日: 2026-07-31
- Agent 名: product-reviewer
- 対象範囲: PR #29「Connect Project detail to backend control context」、Issue #25、Product Owner decision `docs/ai/output/product-owner/002-project-detail-control-context-cycle-decision.md`、Implementer artifact `docs/ai/output/implementer/003-project-detail-control-context-implementation.md`
- Pull Request: https://github.com/Bite-8/bara-developer-platform/pull/29

## Verdict

Product Reviewer 観点では採択可。

Project detail は backend-owned control context を、Project ref、desired-state source、Environment / Template refs、latest Plan / ActionRun、runtime logs、Approval summary として読める形で表示している。`allowedActions` は permission enforcement や承認済み記録ではないと画面文言で明示されており、#25 の非対象境界は守られている。

ただし、PR #29 専用の Quality Reviewer 成果物は `docs/ai/output/quality-reviewer/` では確認できなかった。GitHub PR review も 2026-07-31 時点で未登録だったため、今回の製品レビューは、PR head の差分、CI 成功、実装者 Review guide、既存 backend quality clearance、短時間の局所検証を根拠にした。

## 受入条件の判定

| ID   | 判定 | 根拠                                                                                                                                                                                                                                                                                                                               |
| ---- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | Pass | `ProjectControlContextSection` が `Backend control context` section を追加し、Project ref、owner、desired-state source、Environment refs、Template refs を表示する。component test でも `system:default/examples`、`catalog-and-git`、`resource:default/examples-dev`、`template:default/example-nodejs-template` を確認している。 |
| AC-2 | Pass | Project detail は `BackendIdpApi` を `discoveryApi` / `fetchApi` 経由で生成し、`getProjectControlContext(projectRef)` を呼ぶ。component test は `getProjectControlContext('system:default/examples')` の呼び出しを検証し、API test は `/control-context/project?projectRef=...` への request を確認している。                      |
| AC-3 | Pass | loading、error、empty recent runtime logs、empty latest plan、empty latest action run が UI 文言として実装され、component test で再現されている。                                                                                                                                                                                  |
| AC-4 | Pass | 見出しは `Approval summary` で、説明文に permission enforcement や completed approval records ではないことが明記されている。`allowed`、`needs-approval`、`denied` と reason の表示も component test で確認されている。                                                                                                             |
| AC-5 | Pass | `/idp/projects/examples` の E2E test が追加され、GitHub CI の `End-to-end user journey` check は成功している。ローカル E2E は前 reviewer 停滞を踏まえて再実行していないが、PR head の component/API test と CI E2E 成功を代替証跡として確認した。                                                                                  |
| AC-6 | Pass | 差分上、IDP 固有 UI / logic は `plugins/idp` に閉じている。`packages/app` の変更は E2E 追加のみ、`examples/entities.yaml` は安全な Catalog fixture annotation 追加のみで、app shell や backend 本体への業務ロジック追加はない。                                                                                                    |

## 利用者価値の評価

開発者と Platform Engineer は、Project detail で Catalog/Git desired state と backend runtime/control summary を同じ画面で確認できるようになった。特に `system:default/examples`、authoritative source、関連 Environment / Template refs、latest Plan / ActionRun、recent runtime logs がまとまっており、後続の Plan preview や durable audit に進む前の表示面として意味がある。

UI は raw JSON dump ではなく、カード、チップ、短い empty/error text で summary として読める。表示情報はまだ mock Project detail の中に追加された backend section だが、PO decision の「全面置換しない」境界と一致している。

## 確認した証跡

- `gh pr view 29`: PR は open、draft ではなく、merge state は `CLEAN`。CI は `Format, lint, type check, and tests` と `End-to-end user journey` が成功。
- `corepack yarn workspace @internal/plugin-idp test --watch=false`: 成功。2 suites / 5 tests。既存 dependency 由来の `findDOMNode` と React Router future flag warning は出たが test failure ではない。
- `git diff --check origin/main...HEAD`: 成功。
- 差分確認: `plugins/idp/src/components/IdpPages.tsx`、`plugins/idp/src/plugin.tsx`、`packages/app/e2e-tests/app.test.ts`、`examples/entities.yaml`。
- PR #29 専用の GitHub review / comment はなし。`docs/ai/output/quality-reviewer/` の最新成果物は PR #24 系の backend quality re-review で、PR #29 固有 artifact は未確認。

## Findings

### Blocking

なし。

### High

なし。

### Medium

なし。

### Low / Product Risk

- `/idp/projects/:projectId` が IDP plugin の独立 `PageBlueprint` route として追加され、既存 `IdpRoot` 内の nested route `projects/:projectId` も残っている。利用者導線として direct deep link を保証する判断は妥当だが、将来 app-level routing の仕様変更時に二重 route の責務が分かれないよう、IDP route 設計を整理する余地がある。
- Project list/detail の多くは引き続き `localIdpApi` 由来の mock data を使う。今回の非対象として妥当だが、利用者には backend-owned section と mock section が混在する状態が残る。
- PR #29 専用の Quality Reviewer 成果物が見当たらない。今回の製品判断は可能だが、Product Owner の cycle record では、品質レビュー artifact の有無を最終判断時に補足した方がよい。

## 成果仮説の結果

仮説は支持された。

Project detail に backend control context を表示することで、#23 の backend API が利用者価値の表示に足りることを確認できた。次サイクルでは Plan preview write-read または durable audit へ進む前に、今回追加された summary section を表示先として使える。

## 非対象境界の確認

- Plan write API: PR #29 では追加されていない。
- durable audit DB migration: PR #29 では追加されていない。
- permission enforcement 完成: PR #29 では追加されていない。`allowedActions` は approval summary として表示されている。
- Scaffolder dry-run / execute 接続: PR #29 では追加されていない。既存 mock template execution flow は残っているが、今回の変更範囲ではない。
- local mock adapter 全面削除: 実施されていない。PO decision の非対象と一致する。

## 未解決事項

- ローカル手動ブラウザで `/idp/projects/examples` を再操作する確認と `yarn test:e2e` の再実行は未実施。代替として GitHub CI の E2E 成功と局所 test 成功を採用した。
- backend control context API の unauthenticated direct curl success path は確認していない。Backstage auth 境界があるため、UI/E2E または authenticated client 経由で見る必要がある。
- backend section と mock section が同居する UI の利用者理解は、次サイクルで Plan preview / audit 表示を増やす前に観測するとよい。

## Product Owner への handoff

- 採択判断: Product Reviewer としては PR #29 を製品観点で採択可。
- 次に扱う候補: #26 Plan preview write-read が自然な次候補。今回の section に latest Plan / ActionRun が既に表示されるため、write-read contract の受け皿になる。
- 併せて追跡するリスク: route の二重定義、mock/backend section 混在、PR #29 専用 Quality Reviewer artifact の欠落。
- 最終判断時の注意: E2E は CI 成功を確認済みだが、ローカル再実行はしていないため、必要なら Product Owner が追加確認として `corepack yarn test:e2e` を指定する。
