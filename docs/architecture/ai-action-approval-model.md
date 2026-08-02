# AI action approval model

- Status: Draft
- Date: 2026-06-17
- Related ADR: `docs/adr/0002-ai-action-approval-boundary.md`

## 背景

AI-native control plane では、AI が Project / Environment の context から action plan を提案する。ただし、提案、dry-run、実行、rollback は同じリスクではないため、操作段階ごとに承認境界を分ける。

このモデルは、Bara の backend、permission policy、frontend の設計入力である。実装の配置先は利用者 journey と責務境界で選ぶが、server-side enforcement を保つ。

## Action level

| Level                             | 説明                                 | 例                                                          | 初期承認方針                                        |
| --------------------------------- | ------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------- |
| L0: Observe                       | 読み取り、要約、recommendation       | Catalog context の要約、operation log の説明                | Project viewer 相当で許可                           |
| L1: Plan                          | 実行前 plan と差分の生成             | Template parameter の提案、Git diff preview                 | Project contributor 相当で許可                      |
| L2: Dry-run                       | 外部副作用のない検証                 | Scaffolder dry-run、policy check、rendered manifest preview | Project contributor 相当で許可し、記録する          |
| L3: Propose change                | Git PR や承認待ち task の作成        | config PR、Template task の承認待ち作成                     | Project owner または allowed role の承認を要求      |
| L4: Execute non-production        | 非本番への副作用あり実行             | dev environment deploy、restart                             | Project owner または Environment owner の承認を要求 |
| L5: Execute production / critical | 本番・高重要度環境への副作用あり実行 | production deploy、database migration                       | 明示的な人間承認と audit reason を必須にする        |

## Approval decision inputs

承認可否は最低限、次を入力にする。

- Actor: human user、agent、service account。
- Project ownership: Catalog ownership と group membership。
- Environment criticality: production / staging / development などの重要度。
- Template governance: allowed roles、required approvals、parameter risk。
- Plan risk: destructive change、data migration、permission change、external dependency impact。
- Execution mode: plan、dry-run、propose、execute。

## Approval record

承認済み action には、将来の IDP backend plugin が次の record を残す。

- `planRef`: 承認対象 plan。
- `approverRef`: 承認者の Backstage identity。
- `approvedAt`: 承認時刻。
- `scope`: 承認された action level と environment。
- `policyDecision`: allow / deny / needs-approval と理由。
- `riskSummary`: 人間が読める risk summary。
- `expiresAt`: 承認の有効期限。

## 実装境界

- Permission evaluation は Backstage permission framework と Catalog ownership を利用する。
- AI 固有の approval workflow、risk summary、operation log、UI は、利用者 journey、責務の凝集性、共有範囲、テスト容易性、将来の変更コストで配置先を選ぶ。
- UI の配置先によらず、permission evaluation と approval enforcement は server-side で行う。
