# IDP backend control context API 実行サイクル記録

- 作成日: 2026-07-30
- Agent: project-manager
- 対象範囲: Product Owner 決定記録 `docs/ai/output/product-owner/001-idp-backend-control-context-outcome.md` と GitHub Issue #23

## Source Product Owner Decision

- 決定記録: `docs/ai/output/product-owner/001-idp-backend-control-context-outcome.md`
- GitHub Issue: https://github.com/Bite-8/bara-developer-platform/issues/23
- 選択成果: `plugins/idp-backend` に最小の Project control context API と runtime / audit record contract を追加し、frontend mock adapter を将来置き換えられる backend-owned control-plane surface を作る。
- 非対象: 独自 executor、production / critical environment の副作用あり実行、GitHub PR / Scaffolder task の完全自動化、Catalog entity fork、Project / Environment custom kind の最終決定、MCP action gateway 拡張。

## 実行計画

1. Product Owner 決定記録、Issue #23、AGENTS.md、README、charter、ADR、Backstage 拡張方針、既存 IDP frontend mock adapter を確認する。
2. implementer に `plugins/idp-backend` の backend plugin、runtime / audit contract、Project control context read API、frontend backend client 境界を実装させる。
3. Project Manager が未完了だった型・lint・test 修正と成果物保存を remediation として補完する。
4. quality-reviewer に独立品質レビューを依頼し、blocking findings を受けて implementer に corrective work を戻す。
5. corrective work 後に品質再レビューを行い、blocking findings がないことを確認する。
6. product-reviewer に製品レビューを依頼し、受入条件、成果仮説、次サイクル入力を記録する。
7. 必須品質確認と起動確認を実行し、最終サイクル記録を保存する。

## Linked Artifacts

- improvement-proposer: `docs/ai/output/improvement-proposer/001-idp-control-plane-opportunities.md`
- product-owner: `docs/ai/output/product-owner/001-idp-backend-control-context-outcome.md`
- implementer 初回実装: `docs/ai/output/implementer/001-idp-backend-control-context-implementation.md`
- quality-reviewer 初回レビュー: `docs/ai/output/quality-reviewer/001-idp-backend-control-context-quality-review.md`
- implementer corrective work: `docs/ai/output/implementer/002-idp-backend-control-context-remediation.md`
- quality-reviewer 再レビュー: `docs/ai/output/quality-reviewer/002-idp-backend-control-context-quality-rereview.md`
- product-reviewer: `docs/ai/output/product-reviewer/001-idp-backend-control-context-product-review.md`

## 実装サマリー

- `plugins/idp-backend/` を新規追加し、Backstage backend plugin、Project control context contract、Catalog と runtime store を合成する service、Express router、in-memory runtime audit store、単体テストを実装した。
- `packages/backend` は `@internal/plugin-idp-backend` の workspace 依存と `backend.add(import('@internal/plugin-idp-backend'))` の registration のみに留めた。
- `plugins/idp` に `IdpProjectControlContext` 型、`BackendIdpApi`、mock-free read path test を追加し、frontend mock adapter から backend API client へ差し替える境界を示した。
- corrective work で `appendPlan` / `appendActionRun`、latest Plan / ActionRun 返却、Project 関連 Template refs への限定、OperationLog 返却 clone と mutation 防御 test を追加した。

## Acceptance-condition Evidence

| 条件                                                                                                                                                                                 | 結果   | 証跡                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. `plugins/idp-backend` を Backstage backend plugin として追加し、`packages/backend` は最小配線に留める                                                                             | 満たす | `plugins/idp-backend/src/plugin.ts`、`packages/backend/src/index.ts`、`packages/backend/package.json`                                               |
| 2. Project control context read API が Project ref、関連 Environment refs、関連 Template refs、allowed action summary、recent OperationLog、latest Plan / ActionRun summary を返せる | 満たす | `plugins/idp-backend/src/contracts.ts`、`plugins/idp-backend/src/controlContextService.ts`、`plugins/idp-backend/src/controlContextService.test.ts` |
| 3. Intent / Plan / ActionRun / OperationLog の最小 runtime / audit record contract がある                                                                                            | 満たす | `plugins/idp-backend/src/contracts.ts`                                                                                                              |
| 4. Project / Environment / Template desired state を IDP DB に authoritative data として保存しない                                                                                   | 満たす | `plugins/idp-backend/src/runtimeStore.ts` の `desiredStateContract` と test                                                                         |
| 5. frontend mock adapter から backend API client へ差し替える境界と mock-free read path がある                                                                                       | 満たす | `plugins/idp/src/api/backendIdpApi.ts`、`plugins/idp/src/api/backendIdpApi.test.ts`                                                                 |
| 6. OperationLog は append-only 前提で後続 event を audit trail に接続できる                                                                                                          | 満たす | `appendOperationLog`、update/delete API なし、返却 object mutation 防御 test                                                                        |
| 7. 必須品質確認が通る                                                                                                                                                                | 満たす | install、prettier、lint、tsc、package tests、`start` 起動確認が成功                                                                                 |

## Validation Summary

Project Manager と quality-reviewer / product-reviewer が確認した主な検証は次の通り。

- `node .yarn/releases/yarn-4.4.1.cjs install --immutable`: 成功。既存 peer dependency warning と `jest` peer warning あり。
- `node .yarn/releases/yarn-4.4.1.cjs prettier:check`: 成功。
- `node .yarn/releases/yarn-4.4.1.cjs lint:all`: 成功。`NO_COLOR` / `FORCE_COLOR` warning あり。
- `node .yarn/releases/yarn-4.4.1.cjs tsc:full`: 成功。
- `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp-backend test --watch=false --runInBand`: 成功。2 suites / 4 tests。
- `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp test --watch=false`: 成功。1 suite / 1 test。
- `node .yarn/releases/yarn-4.4.1.cjs start`: app は `http://localhost:3000/`、backend は `:7007` で起動し、backend log で `idp` plugin initialization を確認した。確認後に終了した。

この環境では `yarn` が PATH に存在しなかったため、repo 内 Yarn 実体 `node .yarn/releases/yarn-4.4.1.cjs` を用いて同等コマンドを実行した。

## Quality Review Summary

初回 quality review は blocking findings 2 件を報告した。

- `latestPlan` / `latestActionRun` を runtime store に格納して control context に返す経路がない。
- `templateRefs` が Project 関連 Template ではなく Catalog 上の全 Template を含む。

Medium finding として OperationLog 返却 object mutation への防御不足も報告された。

corrective work により、`appendPlan` / `appendActionRun`、latest summary test、Project 関連 Template 限定、OperationLog clone と mutation 防御 test を追加した。品質再レビューでは blocking findings なし、Product Reviewer へ進めてよいと判定された。

## Product Review Summary

Product Reviewer の verdict は採択。今回の成果は、AI-native control plane の後続 Plan before action、Human-approvable by default、Auditable automation を検証するための backend-owned read surface として有効と判断された。

確認された学習は次の通り。

- Catalog/Git の desired state と IDP runtime/audit record の責務境界がコードと test で観測できる。
- mock data なしの `/api/idp/control-context/project` read path ができた。
- `packages/backend` は薄い registration に留まった。
- OperationLog / Plan / ActionRun の contract はできたが、実運用の durable audit trail や承認処理はまだ完成していない。

## Unresolved Risks

- runtime store は in-memory 実装であり、process restart で runtime record は消える。永続 DB、migration、append-only 制約、correction event、retention は後続設計が必要。
- `allowedActions` は承認判断の summary であり、Backstage permission policy、Environment criticality、approval workflow、permission enforcement とは未接続。
- Template 適用可能性は relation / annotation による関連 refs に限定しており、Scaffolder template governance metadata や allowed roles による判定は未実装。
- `createdAt` の latest 判定は ISO 8601 文字列比較に依存している。外部 write API を開く前に timestamp validation / normalization が必要。
- frontend には `LocalIdpApi` が残っており、実 UI 全体はまだ backend control context に接続されていない。

## Product Owner Handoff

次サイクルの Product Owner 入力として、product-reviewer の提案を引き継ぐ。

1. Project detail UI の backend control context 接続

   - 今回作った mock-free read path を利用者が見える体験へ接続する。
   - 受入条件候補: Project detail の control context section が `BackendIdpApi` から Project ref、related Environment / Template refs、allowedActions、recent OperationLog を取得し、local mock に依存しないことをテストする。

2. Plan preview / policy result の最小 write-read contract

   - side-effecting execution は行わず、Plan 作成、policy result、required approval、OperationLog 追記を backend plugin 内で扱う。
   - Plan before action と Human-approvable by default の価値を mock なしで検証できる。

3. Runtime audit store の DB migration spike
   - Project / Environment / Template desired state を保存しない migration と、OperationLog append / list / latest Plan / latest ActionRun の永続テストを追加する。
   - Auditable automation を実運用に近づける source-of-truth 境界を検証する。

誤学習防止として、`allowedActions` は承認処理完成ではなく summary、`OperationLog` は durable audit trail ではなく in-memory contract、backend API client は frontend mock 全面置換ではなく単一 read path 境界であることを明記して引き継ぐ。

## Cycle Result

Issue #23 の実行サイクルは完了。品質再レビューで blocking findings はなく、製品レビューは採択。未解決リスクは次サイクル入力として Product Owner に引き渡す。
