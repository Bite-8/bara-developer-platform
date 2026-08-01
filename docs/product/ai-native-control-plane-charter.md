# AI-native control plane charter

- Status: Accepted
- Date: 2026-06-17
- Last reviewed: 2026-08-01
- Related review: `docs/reviews/2026-06-16-product-review-v2-ai-native-control-plane.md`
- Related ADRs: `docs/adr/0001-idp-management-source-of-truth.md`, `docs/adr/0002-ai-action-approval-boundary.md`

## 目的

Bara Developer Platform は、Backstage を土台にした AI-native developer control plane として、開発者と agent が同じ Project / Environment / Template / runtime record を参照しながら安全に変更を進める場を提供する。

AI は Backstage を置き換える実行主体ではなく、Catalog、Template、runtime signal、policy result を読み取り、次に取るべき action plan を提案・説明・記録する補助主体として扱う。

## MVP の 1 文

開発者が Project / Environment の context を選ぶと、Bara が Catalog、Template、runtime signal をもとに安全な next action plan を提示し、必要な承認を得たうえで Scaffolder または Git PR に接続し、実行結果と audit trail を Project に戻す。

## 共有する control-plane object

人間の UI 操作と agent の提案・実行は、次の object を共有する。

| Object       | Source / owner                 | 役割                                                    |
| ------------ | ------------------------------ | ------------------------------------------------------- |
| Project      | Git YAML / Backstage Catalog   | ownership、関連 resource、開発者が選ぶ作業 context      |
| Environment  | Git YAML / Backstage Catalog   | criticality、runtime target、Project との関連           |
| Template     | Git YAML / Scaffolder template | 承認済み作業の入口、parameter、governance metadata      |
| Intent       | IDP backend plugin             | 人間または agent が表明した目的                         |
| Plan         | IDP backend plugin             | 実行前の差分、risk、policy result、approval requirement |
| ActionRun    | IDP backend plugin             | dry-run / execute の結果、external execution reference  |
| OperationLog | IDP backend plugin             | append-only audit trail                                 |

Project / Environment / Template の desired state は ADR 0001 に従って Git / Catalog に寄せる。Intent / Plan / ActionRun / OperationLog は runtime / audit record として IDP backend plugin が所有する。現在の `plugins/idp-backend` は最小 contract と in-memory store を実装しており、durable persistence、write API、approval enforcement は未完成である。

## 製品原則

1. **Plan before action**: AI は実行前に plan、expected change、risk、approval requirement を提示する。
2. **Human-approvable by default**: production や high criticality environment への変更は、人間が理解できる承認境界を持つ。
3. **Backstage-compatible extension**: AI 固有の画面・API・業務ルールは `plugins/` 配下の plugin / module / extension として追加し、`packages/app` / `packages/backend` には直接蓄積しない。
4. **Catalog as context index**: Catalog は ownership、relation、stable reference の公開面として使い、runtime log を Catalog entity に埋め込まない。
5. **Scaffolder and Git first**: 変更実行は、可能な限り Scaffolder task または Git PR に接続し、独自 executor の重複実装を避ける。
6. **Auditable automation**: AI action と human action の区別、承認者、policy decision、external execution ID を audit trail に残す。

## 非目標

- Backstage app shell を独自 AI UI で全面置換しない。
- Catalog / Scaffolder の内部実装を copy / fork して改造しない。
- 初期 MVP で完全自律実行や任意コマンド実行を提供しない。
- `packages/backend` を IDP runtime database や agent gateway の所有者にしない。
