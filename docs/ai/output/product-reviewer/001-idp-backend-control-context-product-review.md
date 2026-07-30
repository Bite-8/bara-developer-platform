# IDP backend control context API 製品レビュー

- 作成日: 2026-07-30
- Agent: product-reviewer
- 対象範囲: Product Owner 決定記録 `docs/ai/output/product-owner/001-idp-backend-control-context-outcome.md`、GitHub Issue #23、実装成果物 `docs/ai/output/implementer/001-idp-backend-control-context-implementation.md`、remediation 成果物 `docs/ai/output/implementer/002-idp-backend-control-context-remediation.md`、品質レビュー `docs/ai/output/quality-reviewer/001-idp-backend-control-context-quality-review.md`、品質再レビュー `docs/ai/output/quality-reviewer/002-idp-backend-control-context-quality-rereview.md`、`plugins/idp-backend`、`packages/backend` registration、`plugins/idp` backend API client / 型境界

## Verdict

採択。今回の小さな製品成果は Product Owner の受入条件 1-7 を満たしており、Bara Developer Platform が AI-native control plane として後続の Plan before action、Human-approvable by default、Auditable automation を検証するための backend-owned read surface を作れた。

ただし、これは実運用の監査基盤や承認ワークフローの完成ではない。今回確認できたのは、Catalog/Git の desired state と IDP runtime/audit record の責務境界、mock data なしの Project control context read path、薄い Backstage backend registration、append-only 前提の contract である。

## 受入条件確認

| 受入条件                                                                                                                                                                             | 判定   | 製品レビューでの確認                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. `plugins/idp-backend` が Backstage backend plugin として追加され、`packages/backend` は最小配線に留まる                                                                           | 満たす | `plugins/idp-backend/src/plugin.ts` は `createBackendPlugin` で `idp` plugin を定義し、`packages/backend/src/index.ts:69-70` は `backend.add(import('@internal/plugin-idp-backend'))` の登録のみを追加している。                   |
| 2. Project control context read API が Project ref、関連 Environment refs、関連 Template refs、allowed action summary、recent OperationLog、latest Plan / ActionRun summary を返せる | 満たす | `ProjectControlContext` は必要フィールドを持つ。`ControlContextService` は Catalog relation / annotation から Environment / Template refs を作り、runtime store から recent logs / latest Plan / latest ActionRun を合成して返す。 |
| 3. Intent / Plan / ActionRun / OperationLog の最小 runtime / audit record contract が定義される                                                                                      | 満たす | `contracts.ts:44-89` に actor、target entity ref、event type、createdAt、status、risk summary、policy decision を置ける runtime record が定義されている。                                                                          |
| 4. Project / Environment / Template desired state を IDP DB に authoritative data として保存しないことが確認できる                                                                   | 満たす | `runtimeStore.ts:8-15` は authoritative source を `catalog-and-git` とし、IDP backend は runtime/audit record のみを所有すると明記する。テストも runtime store に desired state 用 key がないことを確認している。                  |
| 5. frontend mock adapter を backend API client に差し替える境界と、少なくとも 1 つの mock data なし read path がある                                                                 | 満たす | `BackendIdpApi` は `/api/idp/control-context/project` を読む境界を追加し、`backendIdpApi.test.ts` が local mock data なしの fetch read path を検証している。既存 UI 全体の差し替えは今回の非対象として妥当。                       |
| 6. OperationLog は append-only 前提で、後続 event を audit trail に接続できる形式である                                                                                              | 満たす | `RuntimeAuditStore` は append/list API を持ち、update/delete API は追加されていない。clone による mutation 防御と append-only 前提は remediation 後のテストで確認されている。                                                      |
| 7. 必須品質確認が通るか、通せない理由が残る                                                                                                                                          | 満たす | 品質再レビューで install / prettier / lint / typecheck / 起動確認が記録済み。Product review でも対象テストを再実行し、backend plugin 2 suites / 4 tests、frontend backend client 1 suite / 1 test が成功した。                     |

## ユーザー価値評価

開発者、Platform Engineer、AI agent / automation client が同じ Project control context を参照するための最初の backend surface ができた。特に価値があるのは、Project / Environment / Template の desired state を Catalog/Git から読む前提を保ちながら、Plan、ActionRun、OperationLog の runtime/audit record を IDP backend plugin 側に置く境界がコードとテストで観測できる点である。

これにより、次の UI や agent-facing API は local mock の Project detail ではなく、Backstage Catalog credential を通した `/api/idp/control-context/project` を起点にできる。Plan before action の表示、承認要求、dry-run 結果、external execution reference を Project context に戻す導線の前提が成立した。

一方で、利用者が画面上で価値を体験できる状態にはまだ達していない。`plugins/idp` の local adapter は残っており、Project detail UI は backend client に全面接続されていない。今回の価値はユーザー体験そのものではなく、後続体験を mock から外すための product foundation である。

## 成果仮説に対する観測

Product Owner の成果仮説は「薄い control context と runtime / audit record の置き場を作れば、開発者・Platform Engineer・AI agent が同じ文脈を参照でき、Plan before action、Human-approvable by default、Auditable automation を後続成果で検証できる」というものだった。

結果は支持された。ただし支持範囲は「後続成果で検証する土台ができた」までであり、承認・実行・監査の運用品質はまだ検証されていない。

- Plan before action: `PlanSummary`、`expectedChangeSummary`、`riskSummary`、`policyDecision`、`requiredApproval` の置き場所ができ、latest Plan を Project context で読める。
- Human-approvable by default: side-effecting action は `needs-approval` / `denied` を返せる summary と理由を持つ。ただし Backstage permission policy、Environment criticality、approval record の実処理とは未接続。
- Auditable automation: `OperationLogRecord` と `ActionRunSummary` に actor、event type、status、external execution reference を置ける。ただし永続 DB、append-only 制約、retention、correction event 方針は未実装。

## 証跡

確認した主な証跡は次の通り。

- `README.md` と `docs/product/ai-native-control-plane-charter.md` は、Backstage を土台に Project / Environment / Template / runtime record を共有する AI-native control plane を North Star としている。
- `docs/adr/0001-idp-management-source-of-truth.md` は desired state と runtime/audit record の source of truth 分離を定義している。
- `docs/adr/0002-ai-action-approval-boundary.md` は Observe、Plan、Dry-run、Propose change、Execute の承認境界を定義している。
- `docs/backstage-extension-policy.md` は IDP 固有ロジックを `plugins/` に閉じ、`packages/backend` を薄い配線層にすることを求めている。
- `plugins/idp-backend/src/contracts.ts:44-120` に runtime / audit record と Project control context contract がある。
- `plugins/idp-backend/src/controlContextService.ts:88-131` は Catalog 由来 refs と runtime store 由来 records を合成して返す。
- `plugins/idp-backend/src/runtimeStore.ts:8-15` は desired state を Catalog/Git に置き、IDP backend runtime store は Intent / Plan / ActionRun / OperationLog のみを所有すると明記している。
- `packages/backend/src/index.ts:69-70` は backend plugin registration のみを追加している。
- 実行確認: `node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp-backend test --watch=false --runInBand` は成功。`node .yarn/releases/yarn-4.4.1.cjs workspace @internal/plugin-idp test --watch=false --runInBand` も成功。

## Findings

### Blocking

なし。

### Product Learning / Non-blocking

1. `allowedActions` は製品上の承認判断ではなく、承認判断の入力 summary として扱う必要がある。現在は Catalog ownership の有無による保守的な summary であり、Backstage permission policy、Environment criticality、Template governance metadata、実 approval record とは未接続である。
2. `InMemoryRuntimeAuditStore` は contract 検証には十分だが、Auditable automation の価値検証には永続 DB、migration、append-only 制約、event correction、retention の設計が必要である。
3. `createdAt` の最新判定は ISO 8601 文字列比較に依存している。外部 write API を開く前に timestamp validation / normalization を追加する必要がある。
4. frontend の `IdpProjectControlContext` 型は backend contract の一部を summary 表示向けに圧縮している。次に Plan / ActionRun 詳細や audit trail UI を作る場合、backend/frontend 間の contract 生成または共有方法を再検討すると手戻りを減らせる。
5. mock-free read path は API client と test で確認できるが、実 UI はまだ local adapter 中心である。次サイクルでユーザー価値を観測するには、Project detail の一部を backend control context へ接続することが自然な次候補になる。

## 未解決リスク

- 実運用監査: process restart で runtime record が消えるため、OperationLog / Plan / ActionRun の永続化なしでは監査証跡として利用できない。
- 承認境界: production / critical environment の人間承認は contract 上の summary に留まり、approval workflow と permission enforcement はまだない。
- Template 適用可能性: 関連 Template refs は relation / annotation に限定されたが、Scaffolder template governance metadata や allowed roles による適用可否判定は未実装である。
- agent-facing surface: AI agent がこの read context を使って plan を作成し、dry-run / approval / execution へ進む API はまだない。
- UI 価値観測: 開発者が Project detail で next action plan、risk、approval requirement を見る体験は未実装である。

## 非対象境界の確認

今回の実装は、次を意図的に完了扱いしていない。この境界は Product Owner の非対象と一致している。

- 独自 executor の実装。
- production / critical environment への副作用あり実行。
- GitHub PR 作成や Scaffolder task 実行の完全自動化。
- Catalog entity の fork / copy / runtime state 埋め込み。
- Project / Environment custom kind の最終決定。
- MCP action gateway の拡張。

## Product Owner への Handoff

### 次サイクルで優先度が高い候補

1. Project detail UI の backend control context 接続

   - 目的: 今回作った mock-free read path を利用者が見える体験に接続する。
   - 受入条件案: Project detail の control context section が `BackendIdpApi` から Project ref、related Environment / Template refs、allowedActions、recent OperationLog を取得し、local mock に依存しないことをテストで確認する。
   - 学習価値: backend foundation が実 UI の Plan before action 体験に足りるかを検証できる。

2. Plan preview / policy result の最小 write-read contract

   - 目的: `PlanSummary` と `PolicyDecision` を実際に作成し、Project control context に戻す。
   - 受入条件案: side-effecting execution は行わず、Plan 作成、policy result、required approval、OperationLog 追記だけを backend plugin 内で扱う。
   - 学習価値: Plan before action と Human-approvable by default の価値を mock なしで検証できる。

3. Runtime audit store の DB migration spike
   - 目的: OperationLog / Plan / ActionRun を durable record として保存する最小 schema と append-only 方針を固める。
   - 受入条件案: Project / Environment / Template desired state を保存しない migration と、OperationLog append / list / latest Plan / latest ActionRun の永続テストを追加する。
   - 学習価値: Auditable automation を実運用に近づけるための source-of-truth 境界を検証できる。

### 次サイクルで避けるべき誤った学習

- 「allowedActions があるので承認処理は完成した」と扱わない。現状は approval routing の summary であり、permission enforcement ではない。
- 「OperationLog があるので監査基盤は完成した」と扱わない。現状は in-memory contract であり、durable audit trail ではない。
- 「backend API client があるので frontend mock は置き換わった」と扱わない。現状は差し替え境界と単一 read path の検証であり、UI wiring は未完了である。

## 結論

Issue #23 の製品成果は、Backstage-compatible extension 方針を守りながら、AI-native control plane の最初の backend control context API と runtime/audit contract を成立させた。次の Product Owner は、この成果を「承認・監査・Plan UI の完成」ではなく、「mock から外れた Project control context read surface」として扱い、最短でユーザーに見える Plan before action 体験または durable audit record に進めるのがよい。
