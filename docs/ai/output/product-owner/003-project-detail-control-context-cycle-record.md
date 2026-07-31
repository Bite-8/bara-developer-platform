# Project detail control context 接続サイクル記録

- 作成日: 2026-07-31
- Agent: product-owner
- Project goal: Opportunity Proposer の候補と既存 backlog から今回の成果群を選び、選定 delivery unit を実装、通常 PR、独立品質レビュー、製品レビュー、最終判断まで完結させる。
- 対象サイクル決定: `docs/ai/output/product-owner/002-project-detail-control-context-cycle-decision.md`

## サイクル入力

- Opportunity Proposer 成果物: `docs/ai/output/opportunity-proposer/001-idp-control-plane-next-opportunities.md`
- 前提成果: Issue #23 / PR #24 `IDP backend plugin の最小 control context API`
- 今回選定 Issue: https://github.com/Bite-8/bara-developer-platform/issues/25
- defer Issue:
  - #26 `Template 実行前 Plan preview と policy result の最小 write-read contract`
  - #27 `Runtime audit store を durable な OperationLog / Plan / ActionRun 保存に進める`
  - #28 `Environment criticality と ownership metadata の Catalog-backed PoC`

## 選定判断

今回の成果群は #25 の 1 delivery unit に限定した。#25 は #23 の backend-owned control context を Project detail UI で利用者が観測できる状態に進めるもので、Bara の North Star に必要な Plan preview / audit 表示の受け皿を最小 scope で作れるため最優先とした。

#26 は write API と policy/idempotency が絡むため defer、#27 は DB migration と schema 固定リスクがあるため defer、#28 は discovery として metadata shape の学習が必要なため defer とした。

## 配達単位

- Delivery unit: Project detail UI を backend control context に接続する
- Issue: https://github.com/Bite-8/bara-developer-platform/issues/25
- Pull Request: https://github.com/Bite-8/bara-developer-platform/pull/29
- PR head: `a50950bd217d3f029539631dda0fb33283f17e24`
- PR status: open、通常 PR、draft ではない
- CI:
  - `Format, lint, type check, and tests`: pass
  - `End-to-end user journey`: pass

## 実装結果

Implementer は Project detail に `Backend control context` section を追加し、`BackendIdpApi.getProjectControlContext(projectRef)` から Project ref、desired state source、Environment refs、Template refs、latest Plan、latest ActionRun、recent runtime logs、allowed actions の approval summary を表示するようにした。

主な変更範囲は `plugins/idp`、`packages/app/e2e-tests/app.test.ts`、`examples/entities.yaml`、agent 成果物である。`packages/app` の変更は E2E 追加のみで、IDP 固有 UI / logic は `plugins/idp` に閉じている。

- Implementer 成果物: `docs/ai/output/implementer/003-project-detail-control-context-implementation.md`

## 検証

Implementer / Product Owner / Reviewer の証跡を総合し、次を確認した。

- `install --immutable`: pass。既存 peer dependency warning あり。
- `prettier:check`: pass。E2E 生成 report を削除後に成功。
- `lint:all`: pass。
- `tsc:full`: pass。
- `test --watch=false`: pass。5 suites / 10 tests。
- `workspace @internal/plugin-idp test --watch=false --runInBand`: pass。2 suites / 5 tests。
- `playwright install chrome --no-shell`: Chrome 既存導入済み。
- `test:e2e`: pass。2 tests。
- `yarn start` 相当: app/backend 起動、backend initialization complete、frontend route `/idp/projects/examples` は 200。unauthenticated direct API curl は 401 で、Backstage auth 境界として期待どおり。
- GitHub Actions checks: PR #29 の format/lint/type/test と E2E が pass。

## Quality Reviewer 結果

- 成果物: `docs/ai/output/quality-reviewer/003-project-detail-control-context-quality-review.md`
- Verdict: Proceed to Product Reviewer
- Blocking findings: なし
- Non-blocking findings: なし

Quality Reviewer は PR head の diff、対象 source、component/API test を独立確認した。E2E と全体検証は再実行していないが、`workspace @internal/plugin-idp test --watch=false --runInBand` は pass。`/idp` と `/idp/projects/:projectId` の route 分割は Backstage route assembly 上 blocking regression ではないと判断した。

## Product Reviewer 結果

- 成果物: `docs/ai/output/product-reviewer/002-project-detail-control-context-product-review.md`
- Verdict: 採択可
- AC-1 から AC-6: すべて Pass
- Blocking / High / Medium findings: なし

Product Reviewer は Project detail に backend control context が meaningful summary として表示され、`allowedActions` が permission enforcement ではなく approval summary として読めることを確認した。並行タイミングのため Product Reviewer 成果物内では PR #29 専用 Quality Reviewer artifact を未確認としているが、Product Owner はその後 `docs/ai/output/quality-reviewer/003-project-detail-control-context-quality-review.md` を確認済みである。

## 受入条件の最終判断

| ID   | 最終判断 | 根拠                                                                                                                                     |
| ---- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | Pass     | Project detail に backend control context section が追加され、Project ref、desired state、Environment refs、Template refs が表示される。 |
| AC-2 | Pass     | `BackendIdpApi.getProjectControlContext(projectRef)` 経由の取得と component/API test がある。                                            |
| AC-3 | Pass     | loading / error / empty runtime state を component test で確認済み。                                                                     |
| AC-4 | Pass     | allowed actions は `Approval summary` として表示され、permission enforcement ではない旨の文言がある。                                    |
| AC-5 | Pass     | PR #29 の E2E と GitHub Actions `End-to-end user journey` が pass。                                                                      |
| AC-6 | Pass     | IDP 固有 UI / logic は `plugins/idp` に閉じ、`packages/app` は E2E 追加のみ。                                                            |

## 完了判断

PR #29 は今回サイクルの delivery unit として完了扱いにする。AGENTS.md 上の delivery 完了条件である通常 PR 作成、Review guide、検証、独立 Quality Review、独立 Product Review、成果物保存を満たした。

Issue #25 は PR #29 の review / merge に進める状態であり、Product Owner としては採択可と判断する。ただし、Issue の最終 close は PR merge 後に行うのが妥当である。

## 残余リスクと次サイクル学習

- route design: `/idp` と `/idp/projects/:projectId` の PageBlueprint が併存している。Quality Reviewer は blocking regression ではないと判断したが、将来 IDP route が増える場合は frontend plugin route 設計を整理する。
- mock/backend 混在: Project detail の入口データはまだ local mock Project fixture に依存している。今回の非対象として妥当だが、Catalog-backed Project selection へ進むときに再整理が必要。
- backend API auth: unauthenticated curl では control context API success を確認できない。guest auth UI/E2E または authenticated client 経由で観測する必要がある。
- next candidate: #26 Plan preview write-read が自然な次候補。今回の section は latest Plan / ActionRun の表示先として使える。
- audit foundation: #27 durable audit は引き続き重要だが、Plan write-read の summary schema と合わせて判断する。
- approval input: #28 Environment metadata discovery は production / critical approval を進める前に扱う。
