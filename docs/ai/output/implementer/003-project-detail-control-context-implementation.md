# Project detail control context 接続の実装成果

- 作成日: 2026-07-31
- Agent 名: implementer
- 対象範囲: GitHub Issue #25「Project detail UI を backend control context に接続する」
- Product Owner cycle decision artifact: `docs/ai/output/product-owner/002-project-detail-control-context-cycle-decision.md`
- Pull Request: https://github.com/Bite-8/bara-developer-platform/pull/29

## 実装範囲

Project detail に backend control context section を追加し、`BackendIdpApi.getProjectControlContext(projectRef)` から取得した Project ref、desired state source、related Environment refs、related Template refs、latest Plan、latest ActionRun、recent runtime logs、allowed actions の approval summary を表示するようにした。

IDP 固有の UI と control context 表示ロジックは `plugins/idp` に閉じた。`packages/app` の変更は Playwright E2E の主要導線追加に限定した。`examples/entities.yaml` は E2E と reviewer が安全に再現できる Catalog fixture として、`system:default/examples` に Environment / Template refs の annotation を追加した。

## 変更ファイル

- `plugins/idp/src/components/IdpPages.tsx`
- `plugins/idp/src/components/IdpPages.test.tsx`
- `plugins/idp/src/api/backendIdpApi.test.ts`
- `plugins/idp/src/plugin.tsx`
- `plugins/idp/src/data/mockData.ts`
- `plugins/idp/package.json`
- `packages/app/e2e-tests/app.test.ts`
- `examples/entities.yaml`
- `yarn.lock`
- `docs/ai/output/opportunity-proposer/001-idp-control-plane-next-opportunities.md`
- `docs/ai/output/product-owner/002-project-detail-control-context-cycle-decision.md`
- `docs/ai/output/implementer/003-project-detail-control-context-implementation.md`

## 受入条件の検証 matrix

| ID   | 前提データ・fixture                                                      | 操作または request               | 期待結果                                                                                                           | 自動検証                                                                                    | 手動 reviewer 手順                                                                         | 結果 |
| ---- | ------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| AC-1 | `system:default/examples` または component test fixture                  | Project detail を表示            | Backend control context section に Project ref、desired state source、Environment refs、Template refs が表示される | `plugins/idp/src/components/IdpPages.test.tsx`                                              | PR head で component test を実行し、表示文字列を確認する                                   | Pass |
| AC-2 | component test の mock `controlContextApi`                               | Project detail を mount          | `getProjectControlContext('system:default/examples')` が呼ばれ、backend response 由来の値が表示される              | `plugins/idp/src/components/IdpPages.test.tsx`、`plugins/idp/src/api/backendIdpApi.test.ts` | diff で `ProjectControlContextSection` が `BackendIdpApi` 経由で取得していることを確認する | Pass |
| AC-3 | pending promise、reject、empty runtime fixture                           | Project detail を各 state で表示 | loading、取得失敗、empty recent logs / latest plan / latest action run が破綻なく表示される                        | `plugins/idp/src/components/IdpPages.test.tsx`                                              | component test の state 別 assertion を確認する                                            | Pass |
| AC-4 | `allowedActions` に `allowed`、`needs-approval`、`denied` を含む fixture | control context section を確認   | approval summary として result / reason が表示され、permission enforcement や承認済み記録と誤解させない文言になる  | `plugins/idp/src/components/IdpPages.test.tsx`                                              | UI 文言と Product Owner decision の非対象境界を照合する                                    | Pass |
| AC-5 | local app/backend、guest auth、safe Catalog fixture                      | `/idp/projects/examples` を表示  | Backend control context section と主要値が表示される                                                               | `packages/app/e2e-tests/app.test.ts`                                                        | `PATH="/tmp/corepack-bin:$PATH" yarn test:e2e` を実行する                                  | Pass |
| AC-6 | repository diff                                                          | PR diff を確認                   | IDP 固有 UI / logic は `plugins/idp` に閉じ、`packages/app` は E2E 追加のみ                                        | lint / typecheck / test                                                                     | diff で app shell への業務ロジック追加がないことを確認する                                 | Pass |

## 検証結果

- `corepack yarn install --immutable`: Pass。既存の peer dependency warning は出たが install は成功。
- `corepack yarn prettier:check`: Pass。Playwright が生成した ignored report を削除後に成功。
- `corepack yarn lint:all`: Pass。
- `corepack yarn tsc:full`: Pass。
- `corepack yarn test --watch=false`: Pass。5 suites / 10 tests。
- `corepack yarn workspace @internal/plugin-idp test --watch=false`: Pass。2 suites / 5 tests。
- `PATH="/tmp/corepack-bin:$PATH" yarn exec playwright install chrome --no-shell`: Chrome は既に導入済み。
- `PATH="/tmp/corepack-bin:$PATH" yarn test:e2e`: Pass。2 tests。
- `PATH="/tmp/corepack-bin:$PATH" yarn start`: app/backend が起動し、backend plugin initialization complete を確認。`/idp/projects/examples` は app HTML を返した。認証なしの direct curl は 401 で、backend auth 境界として期待どおり。

## 残余リスク

- backend control context API の success response は Backstage auth credentials が必要なため、認証なし curl では確認できない。成功 path は guest auth を通る Playwright E2E と component/API test で確認した。
- component test では Material UI の `findDOMNode` warning と React Router future flag warning が出る。既存 dependency 由来の warning であり、test failure ではない。
- E2E 実行後に `e2e-test-report/` が残ると、git ignored であっても `prettier:check` の対象になる場合がある。format check 前に report を削除する必要がある。
- branch history には中断復旧中の forward-fix commit が含まれるが、PR の最終 diff は受入条件の範囲に収まっている。

## Quality Reviewer と Product Owner への handoff

Quality Reviewer は PR #29 の head を対象に、AC-1 から AC-6 を独立確認すること。特に `plugins/idp` と `packages/app` の境界、`allowedActions` の表示が permission enforcement と誤解されないこと、`/idp/projects/examples` deep link が E2E で再現できることを確認してほしい。

Product Owner は、Project detail に backend control context が利用者に意味のある summary として表示されているか、#26 Plan preview / #27 durable audit に進む前の表示境界として十分かを判断してほしい。
