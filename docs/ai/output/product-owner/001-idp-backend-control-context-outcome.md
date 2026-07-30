# 次の製品成果の決定

- 作成日: 2026-07-30
- Agent: product-owner
- Project goal: Bara Developer Platform の次の自律製品開発サイクルに向けて、根拠付き IDP 機会候補から次の小さな製品成果を選定し、GitHub Issue として実行可能な backlog にする。

## 根拠

### 確認した事実

- `README.md` は、開発者が Project / Environment を選ぶと、Bara が Catalog、Template、runtime signal をもとに next action plan を提示し、承認後に Scaffolder または Git PR へ接続し、実行結果と audit trail を Project に戻すことを North Star としている。
- `docs/product/ai-native-control-plane-charter.md` は、Project / Environment / Template の desired state を Git YAML / Backstage Catalog に寄せ、Intent / Plan / ActionRun / OperationLog を将来の IDP backend plugin が扱う runtime / audit record として定義している。
- `docs/adr/0001-idp-management-source-of-truth.md` は、Project / Environment / Template の source of truth と、runtime record / audit record の source of truth を分離する方針を提案している。
- `docs/adr/0002-ai-action-approval-boundary.md` は、AI action を Observe、Plan、Dry-run、Propose change、Execute non-production、Execute production / critical に分け、Plan と実行を分離する方針を定義している。
- `docs/backstage-extension-policy.md` は、IDP 固有 API / 業務ロジックを `plugins/` 配下に閉じ、`packages/app` と `packages/backend` を薄い配線層に保つことを求めている。
- `docs/reviews/2026-06-16-product-review-v2-ai-native-control-plane.md` は、次の実装候補として IDP backend plugin の最小 control-plane API と frontend plugin の AI-native 化を挙げている。
- `docs/architecture/intent-plan-run-lifecycle.md` は、初期実装では Plan と Dry-run を重視し、Execute は Scaffolder task または Git PR への接続を優先するとしている。
- `plugins/idp/src/api/localIdpApi.ts` は、現在の IDP API が browser verification 用の local in-memory adapter であり、IDP DB、Scaffolder、GitHub、AWS 連携を追加する段階で Backstage backend plugin/API に置き換える前提であることを明記している。
- `plugins/idp/src/types/index.ts` には Project、Environment、Template、TemplateExecution、Deployment、OperationLog はあるが、Intent、Plan、Approval、ActionRun、policy decision、risk summary、external execution reference はまだない。
- `packages/backend/src/index.ts` は Backstage backend plugin の登録に留まっており、現時点では IDP backend plugin が存在しない。
- `app-config.yaml` は Catalog、Scaffolder、Permission、MCP actions を登録しているが、permission policy は allow-all であり、Bara 固有の runtime / audit API はまだない。
- `docs/ai/output/improvement-proposer/001-idp-control-plane-opportunities.md` は、候補 1「Project control context を返す IDP backend plugin の最小化」を最優先 delivery として推奨している。
- GitHub Issue は `gh issue list --repo Bite-8/bara-developer-platform --state all --limit 100` と関連語句検索で 0 件だった。既存 Issue との重複は観測されなかった。
- 確認済み label は `enhancement`、`codex`、`documentation`、`question` などであり、選定した delivery Issue には `enhancement` と `codex` を付与した。

### 推論

- Template 実行前の Plan / Dry-run 表示は利用者価値が高いが、その前提として Plan、ActionRun、OperationLog の置き場と Project control context の contract が必要である。
- Environment criticality と ownership metadata の PoC は承認判定を実用化するうえで重要だが、今回の最初の delivery は schema を薄く保ち、policy decision を最小表現に留めれば並行前提にしなくても検証可能である。
- MCP action gateway は agent-facing surface として価値がある一方、runtime / audit record と approval boundary が未整備な段階で action surface を広げると ADR 0002 の方針を迂回するリスクが高い。

### 重要な未確認事項

- 実運用で最初に接続したい外部実行先が Scaffolder task、Git PR、CI/CD、cloud provider のどれかは未確認である。
- Project / Environment を Backstage `System` / `Resource` として進めるか、custom kind を採用するかは ADR 0001 の未決事項として残っている。
- Environment criticality / ownership metadata の最終的な置き場所は未決であるため、初回 delivery では policy decision を最小 contract として扱う。

## 候補比較

| 候補                                                                | 利用者価値                                                                          | 学習価値                                                                         | リスク                                                                               | 選択判断                                                                                           |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Project control context を返す IDP backend plugin の最小化          | 高。frontend mock から、人間と AI agent が共有する control-plane context へ進める。 | 高。ADR 0001 / 0002 の source-of-truth と approval boundary を実装で検証できる。 | API schema を広げすぎると MVP が重くなり、将来変更しづらい。                         | 選択。後続候補の前提になるため、最小 contract に絞って delivery Issue 化する。                     |
| Template 実行前 Plan / Dry-run / policy result の表示               | 高。開発者が実行前に expected change、risk、approval requirement を理解できる。     | 高。Plan before action の体験価値を早く観測できる。                              | Plan / ActionRun / OperationLog API と Environment metadata がないと mock 的になる。 | 後続候補。今回の Issue の受入条件には差し替え境界まで含め、Scaffolder dry-run の深い接続は分ける。 |
| Environment criticality と ownership metadata の Catalog-backed PoC | 中高。承認境界の入力が明確になり、critical environment 判断に近づく。               | 高。ADR 0001 の未決事項を減らせる。                                              | Catalog entity に runtime state を混ぜる設計ミスのリスクがある。                     | discovery 候補として有効。ただし最初の delivery は backend runtime / audit surface を優先する。    |
| Agent-facing MCP action gateway の承認境界化                        | 中高。AI agent 向け control surface に直結する。                                    | 中。前提 record がないと学習が抽象的になる。                                     | 承認・監査 gateway より先に action surface を広げると安全性リスクが高い。            | defer。IDP backend plugin と approval input が整ってから扱う。                                     |

## 選択した製品成果

`plugins/idp-backend` に最小の Project control context API と runtime / audit record contract を追加し、frontend mock adapter を将来置き換えられる backend-owned control-plane surface を作る。

### 選択理由と対象利用者価値

対象利用者は、Project / Environment の状態を見ながら変更を計画するアプリケーション開発者、Template / governance / runtime record を運用する Platform Engineer、同じ context を安全に参照する AI agent / automation client である。

この成果は、画面を増やす前に Bara の North Star に必要な共有 context と audit の置き場を作る。現在の `plugins/idp` は Project / Environment / Template の語彙を持っているが、local mock に閉じており、Plan / ActionRun / OperationLog を永続的に扱う backend owner がない。まず backend plugin 境界を薄く置けば、後続の Plan preview、Dry-run、approval、OperationLog 表示を Backstage 互換の拡張方針内で積み上げられる。

### 受入条件

1. `plugins/idp-backend` が Backstage backend plugin として追加され、`packages/backend` 側の変更は plugin registration の最小配線に留まる。
2. Project control context を取得する read API contract があり、少なくとも Project ref、関連 Environment refs、関連 Template refs、allowed action summary、recent OperationLog、latest Plan / ActionRun summary を返せる。
3. Intent / Plan / ActionRun / OperationLog の最小 runtime / audit record contract が定義され、actor、target entity ref、event type、createdAt、status、risk summary または policy decision の格納場所が分かる。
4. Project / Environment / Template の desired state を IDP DB に authoritative data として保存しないことが、テストまたは明示的な contract で確認できる。
5. frontend mock adapter を backend API client に差し替えるための境界が示され、少なくとも 1 つの Project detail / control context の read path が mock data なしで検証できる。
6. OperationLog は append-only 前提で扱われ、dry-run / plan / execution など後続イベントを audit trail に接続できる形式になっている。
7. 変更後に repo の必須品質確認が通るか、通せない場合は Project Manager の成果物に具体的な未完了理由と再現手順が残る。

### 非対象

- 独自 executor の実装。
- production / critical environment への副作用あり実行。
- GitHub PR 作成や Scaffolder task 実行の完全自動化。
- Catalog entity の fork / copy / runtime state 埋め込み。
- Project / Environment custom kind の最終決定。
- MCP action gateway の拡張。

### リスクと軽減策

- API schema が大きくなりすぎる: 初回は Project control context と Intent / Plan / ActionRun / OperationLog の最小 contract に限定し、Template dry-run の深い接続は後続 Issue に分ける。
- desired state と runtime record が混ざる: Project / Environment / Template は Git YAML / Catalog が source of truth であることを contract とテストで確認し、IDP DB は runtime / audit record のみにする。
- Environment criticality / ownership metadata が未決で policy result が形式的になる: 初回は `allow` / `deny` / `needs-approval` と理由の格納場所に絞り、詳細な permission policy は後続に残す。
- Catalog entity rename / delete の履歴問題が膨らむ: 初回は stable entity ref と observed snapshot の扱いを記録し、完全な historical reconciliation は非対象にする。
- Backstage backend への業務ロジック流入: `packages/backend` は plugin registration のみとし、API / domain contract は `plugins/idp-backend` に閉じる。

### 成果仮説

IDP backend plugin に薄い control context と runtime / audit record の置き場を作れば、開発者・Platform Engineer・AI agent が同じ Project / Environment / Template 文脈を参照できるようになり、Bara の Plan before action、Human-approvable by default、Auditable automation を後続成果で検証できる。Product Reviewer は、mock data なしの read path、runtime record の所有境界、`packages/backend` の薄さ、desired state を DB に保存していないことを主な証跡として確認する。

## GitHub Issue

- Issue: https://github.com/Bite-8/bara-developer-platform/issues/23
- Status: OPEN
- 種別: delivery
- Labels: `enhancement`, `codex`
- 重複確認: `gh issue list --repo Bite-8/bara-developer-platform --state all --limit 100` は空。`IDP backend control context OR Plan Dry-run OR Environment criticality OR MCP action gateway` の検索も空だったため、新規 Issue を作成した。
- 作成方法: GitHub connector の `_create_issue` は 403 `Resource not accessible by integration` で失敗したため、同じ内容を `gh issue create` で作成した。

## Project Manager への引き継ぎ

Project Manager は https://github.com/Bite-8/bara-developer-platform/issues/23 を authoritative delivery item として扱うこと。

実行時は、`plugins/idp-backend` に成果を閉じ、`packages/backend` は登録だけに留める。Project / Environment / Template desired state を IDP DB に authoritative data として保存しないことを必ず検証し、runtime / audit record の contract を最小に保つ。Scaffolder task 実行、GitHub PR 作成、production 実行、MCP action gateway 拡張は今回の非対象である。

関連証跡は `README.md`、`docs/product/ai-native-control-plane-charter.md`、`docs/adr/0001-idp-management-source-of-truth.md`、`docs/adr/0002-ai-action-approval-boundary.md`、`docs/architecture/intent-plan-run-lifecycle.md`、`docs/backstage-extension-policy.md`、`plugins/idp/src/api/localIdpApi.ts`、`plugins/idp/src/types/index.ts`、`docs/ai/output/improvement-proposer/001-idp-control-plane-opportunities.md` を参照すること。
