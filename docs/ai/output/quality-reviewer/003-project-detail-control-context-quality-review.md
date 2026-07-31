# PR #29 Project detail control context 品質レビュー

- 作成日: 2026-07-31
- Agent 名: quality-reviewer
- レビュー対象: PR #29 `Connect Project detail to backend control context`
- 対象 Issue: #25 `Project detail UI を backend control context に接続する`
- 対象 commit: `a50950bd217d3f029539631dda0fb33283f17e24`
- Product Owner 判断: `docs/ai/output/product-owner/002-project-detail-control-context-cycle-decision.md`
- Implementer 成果物: `docs/ai/output/implementer/003-project-detail-control-context-implementation.md`

## Verdict

Proceed to Product Reviewer。

PR head の diff、対象 source、PR 本文、Issue、Backstage route assembler 実装、component/API test を独立に確認した。AC-1 から AC-6 に対して blocking finding はない。E2E は前 reviewer 停滞を踏まえ再実行しなかったため、利用者視点の実ブラウザ journey は Product Reviewer 側で最終観測する余地がある。

## 受入条件結果

| ID   | 結果 | 独立確認                                                                                                                                                                                                                  |
| ---- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | Pass | `ProjectControlContextSection` が Project ref、desired state source、Environment refs、Template refs を表示する実装を確認し、`plugins/idp` component test で表示 assertion が通った。                                     |
| AC-2 | Pass | `ProjectDetailPage` は `useBackendControlContextApi` 経由で `BackendIdpApi.getProjectControlContext(projectRef)` を呼ぶ。component test は `getProjectControlContext('system:default/examples')` 呼び出しを検証している。 |
| AC-3 | Pass | loading、error、empty recent logs / latest plan / latest action run の component test が通った。                                                                                                                          |
| AC-4 | Pass | UI 見出しは `Approval summary` で、本文に `not permission enforcement or completed approval records` と明示されている。allowedActions を permission enforcement と誤解させる blocking risk は見つからなかった。           |
| AC-5 | Pass | E2E は未再実行。代替証跡として component/API test、PR の E2E test 追加、`@backstage/plugin-app` の route assembly を確認した。`/idp/projects/examples` は deep link route として登録されている。                          |
| AC-6 | Pass | 業務 UI / control context logic は `plugins/idp` 配下。`packages/app` の変更は `packages/app/e2e-tests/app.test.ts` のテスト追加のみで、app shell に業務ロジックは入っていない。                                          |

## Findings

### Blocking

なし。

### Non-blocking

なし。

### 確認依頼事項

- `plugins/idp/src/plugin.tsx` は `/idp` と `/idp/projects/:projectId` の 2 page に分かれている。`@backstage/plugin-app/dist/extensions/AppRoutes.esm.js` は page path を `${routePath.replace(/\/$/, '')}/*` として登録するため、`/idp` は runtime では `/idp/*` になり、既存の `IdpRoot` 内 nested routes `/idp/projects`、`/idp/environments`、`/idp/templates` は引き続き到達可能と判断した。`/idp/projects/:projectId` はより具体的な route として detail deep link を受けるため、今回の変更は blocking regression ではない。
- Project detail 全体はまだ `localIdpApi` の Project fixture を入口にしており、任意の Catalog Project ref を UI だけで解決する実装ではない。これは PO の非対象「local mock adapter の全面削除」に沿うため blocking ではないが、後続 cycle で Catalog-backed Project selection に進む際の残余リスクである。

## 独立検証証跡

- `git status --short --branch`: `implement/project-detail-control-context-25` が `origin/implement/project-detail-control-context-25` と一致。未コミット変更なしの状態でレビュー開始。
- `gh pr view 29 --json ...`: PR #29 は open、draft ではなく、base は `main`、head は `implement/project-detail-control-context-25`、merge state は `CLEAN`。
- `git fetch origin main pull/29/head:refs/remotes/origin/pr/29`: PR head `a50950bd217d3f029539631dda0fb33283f17e24` を確認。
- `git diff --name-status origin/main...HEAD`: 主な変更は `plugins/idp`、`packages/app/e2e-tests/app.test.ts`、`examples/entities.yaml`、agent 成果物、`yarn.lock`。
- `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp test --watch=false --runInBand`: Pass。2 suites / 5 tests。Material UI `findDOMNode` warning と React Router future flag warning は出たが test failure なし。
- Source inspection: `plugins/idp/src/components/IdpPages.tsx`、`plugins/idp/src/components/IdpPages.test.tsx`、`plugins/idp/src/api/backendIdpApi.ts`、`plugins/idp/src/api/backendIdpApi.test.ts`、`plugins/idp/src/plugin.tsx`、`packages/app/e2e-tests/app.test.ts`、`examples/entities.yaml`、`@backstage/plugin-app/dist/extensions/AppRoutes.esm.js` を確認。

## 未実施検証

- `yarn test:e2e` は再実行していない。今回の依頼で E2E 再実行は必須ではないとされており、前 reviewer 停滞を避けるため component/API test と source-level route 確認に限定した。
- `yarn install --immutable`、`yarn prettier:check`、`yarn lint:all`、`yarn tsc:full`、全体 `yarn test --watch=false`、`yarn start` は今回の Quality Reviewer では再実行していない。Implementer 証跡は PR 本文にあるが、本レビューの独立 pass 根拠にはしていない。

## 残余リスク

- 実ブラウザでの guest sign-in 後 journey は未再実行であり、Product Reviewer が `/idp/projects/examples` の利用者価値観測を行う必要がある。
- backend control context API の success path は Backstage auth credentials を伴うため、無認証 curl では確認できない。今回の品質判断では `BackendIdpApi` の URL construction test と component fixture による表示確認を根拠にした。
- `localIdpApi` は dashboard / list / template run など既存 mock UI に残っている。今回 scope では許容されるが、backend-owned control plane への移行を進めるほど mock と backend の情報差が利用者に見えやすくなる。

## 結論

PR #29 は Quality Reviewer 観点では Product Reviewer に進めてよい。差し戻しと再レビューが必要な blocking finding はない。
