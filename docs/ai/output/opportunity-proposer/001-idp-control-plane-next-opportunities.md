# Opportunity Proposer の IDP 機会探索・backlog 提案

- 作成日: 2026-07-31
- Agent: opportunity-proposer
- 対象範囲: Bara Developer Platform の Project detail、Template run、IDP backend runtime / audit contract、Environment metadata / approval input

## 探索した導線

| 利用者・導線                                | 前提 fixture                            | 実行した操作                                                          | 観測した事実                                                                                                                                                           | UI / UX の摩擦または良い点                                                                                                |
| ------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| アプリケーション開発者 / IDP dashboard      | local app/backend、guest auth           | `node .yarn/releases/yarn-4.4.1.cjs start` で起動し `/idp` へアクセス | app は `http://localhost:3000`、backend は `http://localhost:7007` で起動した。未認証では guest sign-in 画面に止まり、IDP 画面へ到達できなかった                       | auth gate は正しい境界だが、Opportunity 観測では guest sign-in の Playwright 操作が安定せず、認証後 UI の現物確認は未完了 |
| アプリケーション開発者 / Project detail     | `plugins/idp/src/data/mockData.ts`      | `ProjectDetailPage` の実装を確認                                      | `IdpPages.tsx` は `../api/localIdpApi` を直接 import し、Project / Environment / OperationLog を mock data で表示している                                              | #23 / PR #24 の backend control context が、まだ利用者に見える Project detail へ接続されていない                          |
| Platform Engineer / backend control context | `plugins/idp-backend`                   | router / service / store を確認                                       | `/api/idp/control-context/project` は read-only。`ProjectControlContext` は refs、allowed actions、recent logs、latest Plan / ActionRun、desired state contract を返す | Backend-owned surface はできたが、write-read Plan と durable audit は未実装                                               |
| 開発者 / Template run                       | `TemplateRunPage` mock flow             | input -> confirm -> result の実装を確認                               | `TemplateRunPage` は `Mock template execution flow` で、Plan preview、policy result、risk、required approval、dry-run result がない                                    | `Plan before action` と `Human-approvable by default` が画面で体験できない                                                |
| Product Owner / approval input              | `examples/entities.yaml`、`mockData.ts` | Catalog fixture と IDP mock data を比較                               | Catalog fixture は generated sample の `system:default/examples` 中心。mock Project / Environment と Catalog-backed Environment criticality / owner は接続されていない | approval requirement の入力となる criticality / ownership metadata が未決                                                 |

## 根拠

| 種別         | 根拠                                                                                                      | 観測した事実                                                                                                                                                     | 信頼度 |
| ------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 内部方針     | `README.md`、`docs/product/ai-native-control-plane-charter.md`                                            | North Star は Project / Environment context から next action plan を提示し、承認後に Scaffolder または Git PR へ接続し、結果と audit trail を Project に戻すこと | 強     |
| ADR          | `docs/adr/0001-idp-management-source-of-truth.md`                                                         | Project / Environment / Template desired state は Git YAML / Catalog、runtime / audit record は IDP backend plugin が owner                                      | 強     |
| ADR          | `docs/adr/0002-ai-action-approval-boundary.md`                                                            | AI action は Observe / Plan / Dry-run / Propose change / Execute に分かれ、本番・critical 実行は明示的な人間承認が必要                                           | 強     |
| 拡張方針     | `docs/backstage-extension-policy.md`                                                                      | IDP 固有 API / 業務ロジックは `plugins/` に閉じ、`packages/app` / `packages/backend` は配線層に留める                                                            | 強     |
| 既存レビュー | `docs/ai/output/product-reviewer/001-idp-backend-control-context-product-review.md`                       | #23 の成果は採択済み。ただし UI 接続、Plan write-read、durable audit store、Environment metadata は次候補                                                        | 強     |
| 実装         | `plugins/idp/src/components/IdpPages.tsx`                                                                 | frontend はまだ `localIdpApi` 直結。Project detail に backend control context section はない                                                                     | 強     |
| 実装         | `plugins/idp-backend/src/runtimeStore.ts`                                                                 | runtime store は in-memory。process restart 後の audit trail は保持されない                                                                                      | 強     |
| 実装         | `examples/entities.yaml`                                                                                  | local Catalog fixture は generated sample で、Bara-specific Project / Environment criticality を代表していない                                                   | 強     |
| GitHub Issue | `gh issue list`、関連語句検索                                                                             | 既存 Issue は #23 のみ。今回の #25-#28 に対応する重複 Issue はなかった                                                                                           | 強     |
| 外部根拠     | Backstage Catalog descriptor docs: https://backstage.io/docs/features/software-catalog/descriptor-format/ | Catalog owner / relation は責任主体と関連資産の発見 surface になる                                                                                               | 中     |
| 外部根拠     | Backstage Permission docs: https://backstage.io/docs/permissions/writing-a-policy/                        | catalog ownership などの条件付き判断は permission policy に接続できる                                                                                            | 中     |
| 外部根拠     | Backstage Scaffolder dry-run docs: https://backstage.io/docs/features/software-templates/dry-run-testing/ | Template / action の副作用なし検証は Scaffolder 能力として存在する                                                                                               | 中     |
| 外部根拠     | DORA research questions: https://dora.dev/research/2025/questions/                                        | platform が task outcome に明確な feedback を返すかは developer-facing platform の観測項目になる                                                                 | 中     |

外部根拠の確認日はいずれも 2026-07-31。外部情報は Bara 内部需要の証明ではなく、候補仮説の補助根拠として扱う。

## 機会候補

### 1. Project detail UI を backend control context に接続する

- 対象利用者: アプリケーション開発者、Platform Engineer、Product Reviewer。
- 課題または機会: #23 / PR #24 で backend control context はできたが、Project detail は mock data のままで、allowed actions、recent runtime record、latest Plan / ActionRun が利用者に見えない。
- 現物観測: `IdpPages.tsx` は `localIdpApi` 直結。`BackendIdpApi` は存在するが UI に未接続。
- 内部根拠: Product Reviewer が次候補として Project detail UI 接続を明記。
- 外部根拠: Backstage Catalog / Permission docs、DORA task outcome feedback。
- 期待する製品成果: Project detail に backend control context section を追加し、Project ref、Environment / Template refs、allowed actions、recent logs、latest Plan / ActionRun、desired state contract を表示する。
- 最小の UI / API / integration 案: `discoveryApi` / `fetchApi` 経由で `BackendIdpApi` を app に登録し、success / loading / 401 / 404 / empty runtime record を扱う。
- Backstage / control-plane との接続点: Catalog entity ref、ProjectControlContext、AllowedActionSummary、OperationLog、Plan、ActionRun。
- 成功の観測方法: guest auth 後に safe Catalog fixture の Project detail を開き、backend API 由来の refs と allowed action reasons が表示されることを component test または Playwright で確認する。
- 不確実性・リスク: guest auth を E2E で安定化する必要がある。`allowedActions` を enforcement 完了と誤解させない UI が必要。
- 既存 Issue: なし。#23 は前提成果であり重複ではない。
- Issue 化: 作成。https://github.com/Bite-8/bara-developer-platform/issues/25
- 推奨: delivery candidate。

### 2. Template 実行前 Plan preview と policy result の最小 write-read contract

- 対象利用者: Template 利用者、Platform Engineer、Project owner。
- 課題または機会: Template run が mock TemplateExecution を即時作成し、expected change、risk、policy result、required approval を実行前に確認できない。
- 現物観測: backend router は read-only。runtime store に `appendPlan` / `appendActionRun` はあるが API route / validation はない。
- 内部根拠: ADR 0002 と lifecycle docs は Plan と実行の分離、dry-run 記録を求めている。
- 外部根拠: Backstage Scaffolder dry-run / template docs、Scaffolder authorization docs。
- 期待する製品成果: Template run 入力から副作用なしの Plan preview を作成し、policy result、risk summary、required approval、OperationLog を Project context に戻す。
- 最小の UI / API / integration 案: `POST /api/idp/plans` または `POST /api/idp/intents/:id/plans` を追加し、Project ref、Environment ref、Template ref、parameters、actor、idempotency key を受ける。
- Backstage / control-plane との接続点: Intent、Plan、PolicyDecision、RiskSummary、OperationLog、Template ref、Scaffolder dry-run。
- 成功の観測方法: Template run form で `Create plan preview` を実行し、Execute なしで Plan と policy result が表示され、Project control context の latest Plan に戻ることを確認する。
- 不確実性・リスク: Scaffolder real dry-run へ深く接続すると scope が膨らむ。初回は no-side-effect plan record と conservative policy を優先する。
- 既存 Issue: なし。
- Issue 化: 作成。https://github.com/Bite-8/bara-developer-platform/issues/26
- 推奨: delivery candidate。

### 3. Runtime audit store を durable な OperationLog / Plan / ActionRun 保存に進める

- 対象利用者: Platform Engineer、監査証跡を確認する reviewer、Project / Environment 操作履歴を読む開発者。
- 課題または機会: in-memory runtime store では process restart 後に audit trail が消え、`Auditable automation` の価値検証ができない。
- 現物観測: `InMemoryRuntimeAuditStore` は配列保持。`desiredStateContract` は desired state を Catalog/Git に置く境界を明記。
- 内部根拠: ADR 0001 は OperationLog / audit event を IDP DB が authoritative に扱うとする。Product Reviewer も durable audit を次候補に挙げた。
- 外部根拠: Backstage backend plugin は plugin 境界内に database-backed service を置ける。
- 期待する製品成果: OperationLog / Plan / ActionRun の最小 migration と repository を追加し、Project control context から durable record を読める。
- 最小の UI / API / integration 案: `idp_operation_log`、`idp_plan_summary`、`idp_action_run_summary` 相当の table を追加し、append-only list/latest を実装する。
- Backstage / control-plane との接続点: OperationLog、Plan、ActionRun、Backstage backend database service、ProjectControlContext。
- 成功の観測方法: store instance 再作成後も append 済み record が list/latest で戻ること、desired state 用 authoritative table を作らないことを test で確認する。
- 不確実性・リスク: schema を早く広げすぎると Plan detail UI で手戻りが出る。初回は summary record に絞る。
- 既存 Issue: なし。
- Issue 化: 作成。https://github.com/Bite-8/bara-developer-platform/issues/27
- 推奨: delivery candidate。

### 4. Environment criticality と ownership metadata の Catalog-backed PoC

- 対象利用者: Project owner、Environment owner、Platform Engineer、Product Owner。
- 課題または機会: production / critical 承認境界の入力となる Environment criticality、owner、Template governance metadata の置き場所が未決で、`allowedActions` が形式的な summary に留まる。
- 現物観測: `examples/entities.yaml` は generated sample のみ。mock data の prod/stg/dev と Catalog-backed Environment refs は未接続。
- 内部根拠: ADR 0001 は Environment の `Resource` / custom kind / hybrid を未決にしている。ADR 0002 は Environment criticality を approval input にする。
- 外部根拠: Backstage Catalog descriptor docs、Permission docs。
- 期待する製品成果: 1 つの Project と dev / prod Environment を Catalog-backed fixture として表現し、metadata shape と permission input への写像を比較する。
- 最小の UI / API / integration 案: Project = `System`、Environment = `Resource` with `spec.type: environment`、criticality annotation 案を第一候補にし、custom kind 案と比較する。
- Backstage / control-plane との接続点: Catalog System / Resource relation、Project、Environment、AllowedActionSummary、approval requirement。
- 成功の観測方法: safe Catalog fixture で Project control context を取得し、Environment refs / owner refs / criticality metadata を Product Owner が判断できる状態にする。
- 不確実性・リスク: Catalog entity に runtime state を入れると ADR 0001 に反する。annotation は可逆だが schema validation が弱い。
- 既存 Issue: なし。
- Issue 化: 作成。https://github.com/Bite-8/bara-developer-platform/issues/28
- 推奨: discovery candidate。

## 重複・defer した候補

| 候補                                              | 判断                  | 理由                                                                                                                                                                  |
| ------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #23 IDP backend plugin の最小 control context API | 既存 Issue / 前提成果 | PR #24 と Product Reviewer 成果物で採択済み。今回の新規候補は #23 の直接重複ではなく後続の利用者価値・永続化・metadata 整理                                           |
| MCP action gateway の承認境界化                   | defer                 | agent-facing surface として重要だが、Plan write-read、approval input、durable audit が未整備な段階で action exposure を広げると ADR 0002 の境界を迂回するリスクが高い |
| Local guest auth / API auth gate の改善           | defer                 | Opportunity 観測では摩擦があったが、製品価値候補としては #25 の E2E / loading / 401 state に含めるのが妥当。単独 Issue 化するほど根拠は強くない                       |

## 信頼度

- #25 Project detail UI 接続: 高。既存実装と Product Reviewer handoff が一致している。
- #26 Plan write-read: 中高。Bara 方針と実装 gap は明確だが、Scaffolder dry-run 接続の深さは Product Owner 判断が必要。
- #27 durable audit: 中高。監査価値と ADR は強いが、schema 固定リスクがある。
- #28 Environment metadata PoC: 中。承認境界には必要だが、実装より discovery として扱うべき不確実性が残る。

## リスク

- UI 観測は auth gate で止まり、認証後の画面操作は未確認。Issue #25 の受入条件に E2E の auth / error state 観測を含める。
- #25 と #26 を同時に大きく進めると UI mock 置換と write API が混ざる。Product Owner は配達単位を分けるべき。
- #27 の durable schema は後戻りコストがあるため、summary record と append-only event envelope から始める。
- #28 で Catalog desired metadata と runtime state を混同しない。

## 今回の運営サイクルへの入力

作成した Issue は次の 4 件。

| Issue                                                       | 区分      | 推奨順序       | Product Owner の判断ポイント                                            |
| ----------------------------------------------------------- | --------- | -------------- | ----------------------------------------------------------------------- |
| https://github.com/Bite-8/bara-developer-platform/issues/25 | delivery  | 1              | #23 の backend foundation を最短で利用者に見える体験へ接続するか        |
| https://github.com/Bite-8/bara-developer-platform/issues/26 | delivery  | 2              | Plan before action を no-side-effect write-read contract として始めるか |
| https://github.com/Bite-8/bara-developer-platform/issues/27 | delivery  | 2 または 3     | Auditable automation を durable record として先に固めるか               |
| https://github.com/Bite-8/bara-developer-platform/issues/28 | discovery | 並行または後続 | production / critical approval input の metadata shape を先に学習するか |

Product Owner への推奨は、最初に #25 を選び、#23 の backend control context を Project detail で観測できるようにすること。次に、利用者価値を前に進めるなら #26、監査基盤を先に固めるなら #27 を選ぶ。#28 は delivery の前提を急いで固定しすぎないための discovery として扱う。
