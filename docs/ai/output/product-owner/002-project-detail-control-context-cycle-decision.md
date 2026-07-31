# 今回の運営サイクルの成果群の決定

- 作成日: 2026-07-31
- Agent: product-owner
- Project goal: Bara Developer Platform の次の自律製品運営サイクルとして、Opportunity Proposer の候補と既存 backlog を比較し、選定した delivery unit を PR・独立レビュー・最終判断まで完結させる。

## 根拠

### 確認した事実

- `README.md` は、開発者が Project / Environment context を選ぶと、Bara が Catalog、Template、runtime signal をもとに next action plan を提示し、承認後に Scaffolder または Git PR へ接続し、実行結果と audit trail を Project に戻すことを North Star としている。
- `docs/product/ai-native-control-plane-charter.md` は、Bara を Backstage を土台にした AI-native developer control plane とし、Project / Environment / Template の desired state と Intent / Plan / ActionRun / OperationLog の runtime record を分けている。
- `docs/adr/0001-idp-management-source-of-truth.md` は、Project / Environment / Template desired state は Git YAML / Catalog を source of truth とし、OperationLog / audit event は IDP DB が扱う方針を定義している。
- `docs/adr/0002-ai-action-approval-boundary.md` は、AI action を Observe / Plan / Dry-run / Propose change / Execute に分け、production / critical への副作用は人間承認を必須にする方針を定義している。
- `docs/backstage-extension-policy.md` は、IDP 固有の UI / API / domain logic を `plugins/` に閉じ、`packages/app` / `packages/backend` は登録・配線に留めることを求めている。
- 前サイクルの Product Reviewer 成果物 `docs/ai/output/product-reviewer/001-idp-backend-control-context-product-review.md` は、#23 / PR #24 を採択し、次候補として Project detail UI の backend control context 接続、Plan preview write-read、durable audit store を挙げている。
- 最新 Opportunity Proposer 成果物 `docs/ai/output/opportunity-proposer/001-idp-control-plane-next-opportunities.md` は、#25 を最優先 delivery、#26 と #27 を次点 delivery、#28 を discovery として整理している。
- GitHub Issue #23 は前提成果であり、PR #24 は merge 済みである。#25、#26、#27、#28 は open で、いずれも `enhancement` / `codex` label が付与されている。
- `plugins/idp/src/components/IdpPages.tsx` はまだ `localIdpApi` を直接 import し、Project detail UI は mock data 中心である。
- `plugins/idp/src/api/backendIdpApi.ts` と `plugins/idp-backend` の `/api/idp/control-context/project` は存在するが、Project detail UI の利用者導線には未接続である。

### 推論

- #25 は #23 の backend foundation を、開発者と reviewer が画面上で観測できる価値に変える最短の delivery である。
- #26 は `Plan before action` の価値に直結するが、write API、idempotency、policy branch、UI preview を同時に扱うため、#25 で read context の表示境界を固めた後の方が受入条件を明確にしやすい。
- #27 は `Auditable automation` の実運用価値に近いが、DB migration と schema 固定リスクがあり、今サイクルの UI 接続と同時に進めると review surface が広がりすぎる。
- #28 は approval input の重要な discovery だが、実装決定の前に metadata shape の比較が必要であり、今回の delivery 完了条件にはしない。

### 重要な未確認事項

- guest sign-in 後の `/idp` E2E は Opportunity Proposer の観測時に安定しなかった。今回の delivery では component test を必須とし、可能なら Playwright E2E で主要導線を確認する。E2E が環境制約で未完了の場合は、PR と reviewer 成果物に理由を残す。
- `allowedActions` は permission enforcement ではなく、approval requirement を利用者に説明する summary である。UI 表示はこの境界を誤解させない必要がある。
- Project detail 全体を local mock から全面置換するかは未決である。今回の対象は backend control context section の追加とし、Template run や Environment detail の mock 置換は含めない。

## 候補比較

| 候補                                                                               | 利用者価値                                                                                                  | 学習価値                                                              | リスク                                                                         | 選択判断                                                                 |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| #25 Project detail UI を backend control context に接続する                        | 高。開発者が Project detail で backend-owned context、allowed actions、runtime/audit summary を確認できる。 | 高。#23 の backend API が実 UI に足りるかを、利用者導線で検証できる。 | auth gate と UI state の扱い、allowedActions を enforcement と誤解させる表示。 | 選択。1 delivery unit として今サイクルで実装・PR・レビューまで完了する。 |
| #26 Template 実行前 Plan preview と policy result の最小 write-read contract       | 高。実行前に expected change / risk / approval を見せる North Star へ進む。                                 | 高。Plan before action の write-read contract を検証できる。          | write API、idempotency、policy validation、UI preview が絡み scope が広い。    | defer。#25 で read context の UI 境界を固めた後に扱う。                  |
| #27 Runtime audit store を durable な OperationLog / Plan / ActionRun 保存に進める | 中高。監査証跡の信頼性を process restart 越しに上げる。                                                     | 高。ADR 0001 の runtime/audit source of truth を実装で検証できる。    | schema を早く固定しすぎる可能性、DB migration の review surface。              | defer。#26 と並行せず、summary schema の合意後に扱う。                   |
| #28 Environment criticality と ownership metadata の Catalog-backed PoC            | 中高。production / critical approval input の不確実性を減らす。                                             | 高。Resource / custom kind / annotation の比較判断につながる。        | Catalog desired metadata と runtime state を混ぜる設計リスク。                 | discovery として defer。今回の delivery からは独立させる。               |

## 選択した運営サイクルの成果群

今回の運営サイクルは、#25「Project detail UI を backend control context に接続する」を唯一の delivery unit として扱う。#26、#27、#28 は次サイクル候補として defer し、#25 のレビュー学習を次回判断に使う。

### 選択理由と対象利用者価値

対象利用者は、Project / Environment の状態を見ながら次の操作を判断するアプリケーション開発者、Catalog と runtime record の整合を運用する Platform Engineer、backend control context を consumer として評価する Product Reviewer である。

#23 では backend-owned read surface と runtime/audit contract ができたが、利用者は Project detail UI でその価値をまだ見られない。#25 により、Project detail が mock-only dashboard から backend control context を含む control plane UI へ進み、後続の Plan preview、approval、durable audit の表示先を安全に確保できる。

### 受入条件

| ID   | 受入条件                                                                                                   | 前提データ・fixture                                                      | 操作または request                                      | 期待結果                                                                                                               | 自動検証                                            | Reviewer の観測方法                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| AC-1 | Project detail に backend control context section が追加される                                             | `system:default/examples` または component test の safe Project fixture  | Project detail を表示する                               | section に Project ref、desired state owner/source、related Environment refs、related Template refs が表示される       | `plugins/idp` の component test                     | PR head で該当 test を実行し、UI rendering と表示文字列を確認する                            |
| AC-2 | control context は local mock ではなく `BackendIdpApi.getProjectControlContext(projectRef)` から取得される | component test の mock `IdpApi` または Backstage API provider            | Project detail が mount される                          | API client が選択 Project ref で呼ばれ、success state に backend response 由来の値が表示される                         | API mock assertion を含む component test            | test と PR diff で `localIdpApi` 直結を増やしていないことを確認する                          |
| AC-3 | loading / error / empty runtime state が利用者に観測できる                                                 | loading promise、reject / not found、empty arrays の fixture             | Project detail を各 state で表示する                    | loading state、取得失敗 state、recent logs / latest plan / latest action run が空の state が破綻なく表示される         | component test                                      | reviewer が fixture ごとの表示を test で再現する                                             |
| AC-4 | allowed actions は permission enforcement ではなく approval summary として表示される                       | `allowedActions` に `allowed`、`needs-approval`、`denied` を含む fixture | Project detail の control context section を確認する    | result と reason が表示され、完了済み承認や実行許可と誤解させない見出し・文言になっている                              | component test                                      | UI text と issue/product decision の非対象境界を照合する                                     |
| AC-5 | UI 変更の主要導線が E2E または代替証跡で確認される                                                         | local app/backend、guest auth、safe Catalog fixture                      | `/idp/projects/<project>` へ移動して section を確認する | backend control context section が表示される。E2E が認証制約で未完了なら理由と代替 component/API 証跡が PR に残る      | 可能なら `yarn test:e2e`。最低限 component/API test | Product Reviewer が自動または手動で主要導線の Pass / Fail / 未検証を AC と対応付けて判断する |
| AC-6 | Backstage 拡張方針を守り、app shell への変更は配線に留まる                                                 | repository diff                                                          | PR diff を確認する                                      | IDP 固有 UI / logic は `plugins/idp` に閉じ、`packages/app` の変更がある場合は API registration など最小配線のみである | lint / typecheck / test                             | Quality Reviewer が diff で境界逸脱がないことを確認する                                      |

### 非対象

- Plan 作成 write API の実装。
- Scaffolder dry-run / execute の接続。
- production / critical environment への副作用あり実行。
- permission policy enforcement の完成。
- durable audit DB migration。
- Environment criticality / ownership metadata shape の最終決定。
- local mock adapter の全面削除。
- Template run / Environment detail の backend API 全面接続。

### リスクと軽減策

- guest auth E2E が安定しない: component test と `BackendIdpApi` test を必須にし、E2E 未完了なら理由・影響・再現に必要な次作業を PR と成果物に残す。
- UI が debug dump になる: section は利用者が読む summary に限定し、raw JSON dump は置かない。
- `allowedActions` を承認完了と誤解する: approval summary として表示し、permission enforcement 完成は非対象に明記する。
- frontend と backend contract が乖離する: 既存 `IdpProjectControlContext` 型を使い、component test で主要 fields の表示を固定する。

### 成果仮説

Project detail に backend control context を表示できれば、開発者と Platform Engineer は Project / Environment / Template の desired context と runtime/audit summary を同じ画面で確認できる。Product Reviewer は、#23 の backend API が利用者価値の表示に足りるか、Plan preview / durable audit へ進む前に UI 表示境界が適切かを確認できる。

## GitHub Issue と配達単位

- Issue: https://github.com/Bite-8/bara-developer-platform/issues/25
- 種別: delivery
- 優先順位・依存関係: 今回の唯一の delivery unit。#23 / PR #24 を前提とし、#26 / #27 / #28 は defer。
- 重複確認: #23 は backend foundation であり #25 の前提成果。#26 は Plan write-read、#27 は durable audit、#28 は Environment metadata discovery で利用者課題と成果が異なるため重複ではない。
- PR 境界: `plugins/idp` の Project detail UI と必要な API registration / tests に限定する。`packages/app` は API registration が必要な場合のみ変更する。

## Implementer・Reviewer への引き継ぎ

Implementer は #25 と本決定記録を authoritative scope として扱う。受入条件 AC-1 から AC-6 を PR の Review guide に転記し、各 AC について前提 fixture、操作、期待結果、自動検証、手動確認方法を記載すること。変更は `plugins/idp` を主対象とし、`packages/app` を変更する場合は Backstage API registration など最小配線に留める。UI は Project detail の backend control context section に絞り、Template run、Plan write API、durable audit DB migration、permission enforcement は実装しない。

Quality Reviewer は PR head を対象に、Implementer の結果を転載せず AC-1 から AC-6 を独立確認する。Product Reviewer は利用者の観点で、Project detail に backend control context が意味のある summary として表示されるか、未検証の E2E が残る場合に product acceptance に影響するかを判断する。
