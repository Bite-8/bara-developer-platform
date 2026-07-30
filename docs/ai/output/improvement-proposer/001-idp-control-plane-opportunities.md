# IDP 機会候補の調査

- 作成日: 2026-07-30
- Agent: improvement-proposer
- 対象範囲: Bara Developer Platform の AI-native control plane MVP、`plugins/idp`、将来の `plugins/idp-backend`、Backstage Catalog / Scaffolder / Permission / MCP actions 連携

## 根拠と現在の文脈

| 種別         | 根拠                                                                                                                         | 観測した事実                                                                                                                                                                                                     | 信頼度 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 内部方針     | `README.md`、`docs/product/ai-native-control-plane-charter.md`                                                               | North Star は、開発者が Project / Environment を選び、Catalog、Template、runtime signal から next action plan を得て、承認後に Scaffolder または Git PR へ接続し、実行結果と audit trail を Project に戻すこと。 | 強     |
| 内部方針     | `docs/adr/0001-idp-management-source-of-truth.md`                                                                            | Project / Environment / Template の desired state は Git YAML / Catalog、runtime record と audit は将来の IDP backend plugin が所有する境界が提案済み。                                                          | 強     |
| 内部方針     | `docs/adr/0002-ai-action-approval-boundary.md`、`docs/architecture/ai-action-approval-model.md`                              | AI action は Observe、Plan、Dry-run、Propose change、Execute non-production、Execute production / critical に分け、production / critical は明示的な人間承認と audit reason が必要。                              | 強     |
| 内部方針     | `docs/backstage-extension-policy.md`                                                                                         | IDP 固有画面、API、業務ルールは `plugins/` 配下に閉じ、`packages/app` と `packages/backend` は配線層に留める方針。                                                                                               | 強     |
| 内部レビュー | `docs/reviews/2026-06-16-product-review-v2-ai-native-control-plane.md`                                                       | 次の実装候補として、IDP backend plugin の最小 control-plane API、frontend plugin の AI-native 化、Backstage integration hardening が挙げられている。                                                             | 強     |
| 実装         | `plugins/idp/src/api/localIdpApi.ts`                                                                                         | 現在の IDP API はブラウザ検証用のローカルインメモリアダプタで、コメント上も将来 Backstage backend plugin/API に置き換える前提。Template execution は即時に succeeded / failed を作る mock。                      | 強     |
| 実装         | `plugins/idp/src/types/index.ts`                                                                                             | Project、Environment、Template、TemplateExecution、Deployment、OperationLog はあるが、Intent、Plan、Approval、ActionRun、policy decision、risk summary、external execution reference はまだ型としてない。        | 強     |
| 実装         | `packages/backend/src/index.ts`、`app-config.yaml`                                                                           | Scaffolder、Catalog、Permission、MCP actions は登録済み。Permission は有効だが allow-all policy。MCP actions は auth / catalog / scaffolder を plugin source にしている。                                        | 強     |
| 実装         | `app-config.yaml`、`examples/entities.yaml`、`examples/template/template.yaml`                                               | Catalog location は生成サンプルの System / Component / API と example template のみ。Bara の mock Project / Environment と Catalog example はまだ整合していない。                                                | 強     |
| GitHub Issue | `gh issue list --limit 100 --state all`                                                                                      | 2026-07-30 時点で既存 Issue は 0 件。候補との Issue 重複は観測されなかった。                                                                                                                                     | 強     |
| 外部根拠     | Backstage 公式 docs: https://backstage.io/docs/features/software-catalog/descriptor-format                                   | Catalog entity の owner は、問題発生時や機能要求時の責任主体を示す。Bara の Project / Environment context と ownership 判断に接続しやすい。                                                                      | 強     |
| 外部根拠     | Backstage 公式 docs: https://backstage.io/docs/permissions/writing-a-policy/                                                 | Backstage Permission は catalog ownership のような条件付き判断を扱える。Bara の Project owner / Environment criticality / Template governance を permission decision に接続する根拠になる。                      | 強     |
| 外部根拠     | Backstage 公式 docs: https://backstage.io/docs/features/software-templates/writing-templates/                                | Scaffolder template editor は dry-run で action 結果を確認できる。Bara の Plan / Dry-run 境界を既存 Scaffolder 能力に寄せられる。                                                                                | 強     |
| 外部根拠     | Backstage API docs: https://backstage.io/api/next/modules/_backstage_plugin-mcp-actions-backend.html                         | MCP actions backend は Backstage actions を MCP tool として公開する。Bara の agent-facing control surface に使えるが、承認境界なしに広げるとリスクが高い。                                                       | 中     |
| 外部根拠     | Backstage GitHub Issue #31564: https://github.com/backstage/backstage/issues/31564                                           | 既存 template を UI から dry-run したいという提案があり、template 実行前検証への需要を示す単発シグナル。                                                                                                         | 中     |
| 外部根拠     | DORA capability: https://dora.dev/capabilities/platform-engineering/                                                         | Platform capability として、task の outcome に対する明確なフィードバックが user experience と強く関連するとされている。Bara の execution / operation feedback を優先する根拠。                                   | 中     |
| 外部根拠     | State of Platform Engineering Vol.4: https://platformengineering.org/blog/announcing-the-state-of-platform-engineering-vol-4 | 500 名超の調査として、2026 年に向けた AI-native と platform foundations の両立が論点化されている。Bara の AI-native 方向性とは整合するが、一般調査なので内部優先度の直接根拠ではない。                           | 中     |

### 観測した事実

- Bara の製品方針は、AI が直接実行主体になるのではなく、evidence、expected change、risk、required approval を伴う plan を提示し、承認後に Scaffolder または Git PR に接続することを重視している。
- 現在の `plugins/idp` は Project / Environment / Template / operations の画面と mock data を持つが、control-plane record の永続化 owner は存在しない。
- `packages/backend` は Backstage backend plugin の登録に留まっており、拡張方針と整合している。一方で IDP runtime / audit API はまだない。
- Backstage の Catalog、Scaffolder、Permission、MCP actions は既に依存または登録されており、Bara 独自実装を始める前に再利用できる接続点がある。
- 既存 GitHub Issue は空であり、Product Owner が候補を選定する際は新規 Issue 化が必要になる可能性が高い。

### 推論

- 次の小さな価値は、新しい AI UI を広げるより先に、Project / Environment / Template をまたぐ control context と runtime / audit record の最小 API を置き、frontend mock を置き換えられる状態にすること。
- Template 実行前に Plan / Dry-run / policy result / expected Catalog change を表示できると、Bara の North Star と DORA が示す outcome feedback の両方に近づく。
- Environment criticality と ownership metadata が曖昧なまま実行系を進めると、ADR 0002 の approval boundary が保守的な deny または allow-all に寄り、AI-native control plane の差別化が弱くなる。

### 未確認事項

- 実運用で最初に接続したい外部 system が GitHub PR、Scaffolder task、CI/CD、cloud provider のどれかは未確認。
- Project / Environment を Backstage `System` / `Resource` として表現するか、custom kind を使うかは ADR 0001 の未決事項として残っている。
- 現在の mock data に含まれる AWS account ID、repository URL、owner ref はデモ値として扱い、実組織のデータ契約とはみなさない。

## 機会候補

### 1. Project control context を返す IDP backend plugin の最小化

- 対象利用者: アプリケーション開発者、Platform Engineer、AI agent / automation client。
- 課題または機会: 現在は Project / Environment / Template / operations が frontend mock に閉じており、AI が参照する context、実行前 plan、audit の保存先がない。North Star の「同じ Project / Environment context を参照する」状態に進めない。
- 根拠: `localIdpApi.ts` は browser verification 用 mock と明記。ADR 0001 は runtime / audit record を IDP backend plugin が所有すると定義。v2 review は `plugins/idp-backend` の最小 control-plane API を Priority 2 としている。
- 期待する製品成果: `plugins/idp-backend` が `GET /projects/:ref/control-context` 相当の read API と、Intent / Plan / ActionRun / OperationLog の最小 read/write contract を持つ。Project / Environment / Template desired state は Catalog / Git に残し、runtime / audit のみを backend plugin に寄せる。
- Backstage / control-plane との接続点: Catalog entity ref、Scaffolder template ref、Permission identity、Intent、Plan、ActionRun、OperationLog。
- 成功の観測方法: frontend mock adapter を backend API client に差し替えられる。Project detail で Catalog refs、allowed actions、recent operations、latest plan/run summary が同じ API response から表示できる。unit test で desired state を DB に保存しないことを確認できる。
- 受入シグナル: mock data なしで read-only control context が返る。operation log に actor、target entity、event type、createdAt が保存される。`packages/backend` の変更は plugin registration に限定される。
- 非目標: 独自 executor、production 実行、任意コマンド実行、Catalog entity の hard fork、Scaffolder 再実装。
- 依存関係: Backstage backend plugin scaffold、Catalog client、database migration、frontend API adapter、ADR 0001 / 0002 の schema 反映。
- リスク: API schema を広げすぎると MVP が重くなる。Catalog entity ref の rename / delete 履歴を初期から完全解決しようとするとスコープが膨らむ。
- 既存 Issue: なし。
- 推奨: delivery。

### 2. Template 実行前 Plan / Dry-run / policy result の表示

- 対象利用者: テンプレートから service / infra を作る開発者、テンプレートを運用する Platform Engineer。
- 課題または機会: 現在の Template execution は mock API が即時に succeeded / failed を作るだけで、expected change、risk、required approval、dry-run result がない。Bara の Plan before action と Human-approvable by default を体験できない。
- 根拠: ADR 0002 は Plan と実行を分離し、dry-run を記録対象にすると定義。Backstage Scaffolder 公式 docs は template editor / dry-run を提供している。Backstage GitHub Issue #31564 でも既存 template の dry-run UI 拡張需要が示されている。DORA は platform task outcome の明確な feedback を user experience と関連づけている。
- 期待する製品成果: Template run 画面で Project / Environment / parameters を入力すると、Plan preview、expected Catalog changes、policy decision、approval requirement、dry-run status を実行前に確認できる。
- Backstage / control-plane との接続点: Scaffolder template ref、Template governance metadata、Plan、Dry-run ActionRun、policy result、OperationLog。
- 成功の観測方法: 開発者が「何が変わるか」「誰の承認が必要か」「dry-run がなぜ失敗したか」を実行前に読める。dry-run failure は Execute に進めない。
- 受入シグナル: 1 つの existing template に対して Plan preview が生成される。dry-run result と policy result が OperationLog に残る。production / critical environment では approval requirement が表示される。
- 非目標: 本番実行、GitHub PR 作成の完全自動化、複数 cloud provider の一括対応。
- 依存関係: 候補 1 の Plan / ActionRun / OperationLog API、Scaffolder dry-run 接続、Environment criticality の最小 metadata。
- リスク: Scaffolder dry-run の接続が Backstage version と API surface に依存する。Template governance metadata が不足すると policy result が形式的になる。
- 既存 Issue: なし。
- 推奨: delivery。ただし候補 1 と同時に進める場合は、read/write contract を先に薄く固定する。

### 3. Environment criticality と ownership metadata の Catalog-backed PoC

- 対象利用者: production / staging / development の操作を承認する Project owner、Environment owner、Platform Engineer。
- 課題または機会: ADR 0002 は production / critical environment の承認境界を定義しているが、現在の `IdpEnvironment` には `type` はあるものの `criticality`、owner、allowed action、governance metadata はない。Catalog example も Bara の Project / Environment と未接続。
- 根拠: ADR 0001 は Environment の Resource / custom kind / hybrid を未決事項にしている。Backstage Catalog 公式 docs は owner field に責任主体を持たせる。Backstage Permission docs は catalog ownership を条件付き判断に使える。
- 期待する製品成果: 1 つの Project と dev / prod Environment を Catalog-backed example として表現し、owner、criticality、related component/resource、Bara annotation または spec field の候補を比較できる。
- Backstage / control-plane との接続点: Catalog System / Resource / Component relation、Project、Environment、Permission conditional decision、approval requirement。
- 成功の観測方法: Product Owner が Environment を `Resource`、custom kind、hybrid のどれで進めるか判断できる。Project detail で mock ではなく Catalog entity refs から owner / relation / criticality を説明できる。
- 受入シグナル: `examples/` に Bara-specific Project / Environment PoC があり、`app-config.yaml` で登録される。docs に metadata choice、採用しない選択肢、permission input への写像が残る。
- 非目標: 全 environment lifecycle の実装、cloud runtime status の自動同期、RBAC UI の導入。
- 依存関係: ADR 0001 の未決事項整理、Catalog descriptor design、permission policy の最小 proposal。
- リスク: Catalog entity に runtime state を埋め込む誘惑がある。criticality を annotation に置くか spec に置くかの判断を間違えると移行コストが出る。
- 既存 Issue: なし。
- 推奨: discovery。候補 1 / 2 の承認判定を実用化する前に、小さな PoC で責務境界を確認する価値が高い。

### 4. Agent-facing MCP action gateway の承認境界化

- 対象利用者: AI agent / automation client、Platform Engineer、セキュリティ・監査担当。
- 課題または機会: `@backstage/plugin-mcp-actions-backend` は登録済みで、`auth`、`catalog`、`scaffolder` を tool source にできる。これは agent-facing surface として有望だが、Bara の Intent / Plan / Approval / OperationLog を経由しないまま action を広げると、ADR 0002 の承認境界を迂回する可能性がある。
- 根拠: app config は MCP actions の pluginSources を有効化している。Backstage API docs は Backstage actions を MCP tool として公開することを示す。v2 review は agent-facing API / MCP design を不足文書として挙げている。
- 期待する製品成果: MCP 経由の side-effect action は Bara IDP backend の Plan / approval / audit gateway を通る、という API 方針と小さな allowlist を定義する。
- Backstage / control-plane との接続点: MCP actions、Intent、Plan、Approval、ActionRun、OperationLog、Permission decision snapshot。
- 成功の観測方法: agent が read-only context を取得できる一方、propose / execute は approval requirement と idempotency key を必須にする契約が文書化される。
- 受入シグナル: MCP action exposure の allowlist、action level、approval requirement、audit fields が docs に残る。`app-config.yaml` の generic `My Company Backstage` 表記を Bara 方針に合わせる判断材料が揃う。
- 非目標: agent による production 自律実行、任意 tool 実行、外部 SaaS 全般の連携。
- 依存関係: 候補 1 の control-plane API、ADR 0003 相当の agent-facing API surface、permission policy。
- リスク: 早すぎる実装は安全性レビューなしの tool surface 拡大になる。MCP actions 自体の Backstage API surface は変化しうるため、実装より方針固定を先にすべき。
- 既存 Issue: なし。
- 推奨: defer。価値は高いが、候補 1〜3 の control-plane record と approval input がない段階で実装するとリスクが勝る。まず design discovery と allowlist 方針に留める。

## 比較

| 候補                               | 利用者価値                                         | 学習価値                                       | 緊急度 | 信頼度 | 可逆性                                               | 労力   |
| ---------------------------------- | -------------------------------------------------- | ---------------------------------------------- | ------ | ------ | ---------------------------------------------------- | ------ |
| 1. Project control context backend | 高。mock から実 product surface に進む基盤になる。 | 高。source-of-truth 境界を実装で検証できる。   | 高     | 高     | 中。schema は後で変えづらいが API を薄くすれば可逆。 | 中     |
| 2. Plan / Dry-run 表示             | 高。Bara の North Star をユーザーが体験しやすい。  | 高。承認・policy・dry-run の欠落を早く学べる。 | 高     | 中高   | 中。Scaffolder 接続方法に依存。                      | 中     |
| 3. Environment metadata PoC        | 中高。承認境界の入力が明確になる。                 | 高。ADR 0001 の未決事項を減らせる。            | 中     | 中     | 高。examples / docs 中心なら戻しやすい。             | 小〜中 |
| 4. MCP action gateway              | 中高。agent-facing control surface に直結する。    | 中。前提 record がないと学習が抽象的。         | 低〜中 | 中     | 中。tool exposure は誤ると戻しにくい。               | 中〜大 |

## 既存 Issue 重複観察

- `gh issue list --limit 100 --state all --json ...` の結果、2026-07-30 時点で既存 Issue は観測されなかった。
- PR 履歴には `agent/idp-opportunity-discovery`、`autonomous-project-local-agent-cycle`、`docs/periodic-development-cycle-trigger` があり、調査・自律サイクル運用の整備は進んでいる。一方で、Product Owner が選べる実装 Issue はまだない。

## Product Owner への引き継ぎ

- 最優先で Issue 化するなら、候補 1「Project control context を返す IDP backend plugin の最小化」を推奨する。理由は、候補 2〜4 の Plan、Dry-run、approval、MCP gateway がすべて runtime / audit record の置き場を必要とするため。
- 体験価値を早く見せたい場合は、候補 1 の API surface を薄く切ったうえで候補 2 の Plan preview を同じ Issue の acceptance signal に 1 枚だけ含める。ただし Scaffolder dry-run の深い接続は後続に分ける。
- 候補 3 は discovery Issue として有効。Environment criticality / owner の置き場所が決まらないと、候補 2 の approval requirement が product demo に留まる。
- 候補 4 は今回は defer。MCP actions は既に登録されているため魅力的だが、Bara の承認・監査 gateway より先に action surface を広げると製品方針に反する。
- Product Owner が持ち越すべき質問は次の 3 点。
  1. 初回 delivery は backend contract を優先するか、Template run 画面の user-visible plan preview を優先するか。
  2. Environment criticality は `type: prod` から推論してよいか、明示 metadata として扱うか。
  3. 最初の外部実行先は Scaffolder task、Git PR、または read-only dry-run のどれに限定するか。
