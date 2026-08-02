# ADR 0001: IDP 管理モデルの source of truth

- Status: Accepted
- Date: 2026-06-16
- Accepted: 2026-08-01
- Revised: 2026-08-02

## 背景

Bara Developer Platform は Backstage の上に、Project、Environment、Template、TemplateExecution、DeploymentRun、OperationLog といった IDP レベルの概念を追加します。

Backstage にはすでに Catalog と Scaffolder という基本機能があります。Bara が同じ概念を Git YAML、Backstage Catalog、plugin の database table に明確な所有責任なしで保存すると、source of truth が競合し、OSS plugin 連携も難しくなります。

このリポジトリには、Git YAML、Backstage Catalog、DB の責務を分離する management-model design note がすでに存在します。この ADR は、その原則を明示的な意思決定候補として記録します。

## 決定

次の source-of-truth モデルを採用します。

| 概念                       | Source of truth                                     | Backstage Catalog の役割                                         | IDP DB の役割                                                             |
| -------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Project                    | Git YAML。Catalog を通じて公開する                  | 発見、所有、関連、安定参照の公開面                               | 任意の派生キャッシュまたは利用統計のみ                                    |
| Environment                | Git YAML。可能な限り Catalog を通じて公開する       | 発見、Project との関連、environment metadata、link の公開面      | runtime / observed status の cache、operation history、external reference |
| Template                   | Git YAML / 可能な限り Backstage Scaffolder template | 承認済み template の発見と選択                                   | execution history、usage metrics、runtime state                           |
| TemplateExecution          | IDP DB                                              | 必要に応じて関連 Project / Environment / Template から link する | authoritative な execution record                                         |
| DeploymentRun              | IDP DB                                              | 原則として Catalog entity 化しない                               | authoritative な deployment / run history                                 |
| OperationLog / audit event | IDP DB                                              | Catalog entity には埋め込まない                                  | authoritative な append-only operational history                          |

実装上の含意は次の通りです。

- Project / Environment / Template が desired state を表す場合、その定義は宣言的かつレビュー可能に保つ。
- Backstage Catalog は ownership、search、relation、cross-plugin reference の公開 index として使う。
- IDP backend plugin の database は runtime record、高頻度の状態変更、履歴、retry、lock、external execution ID、audit log を扱う。
- IDP runtime / audit の実装は、責務の凝集性、共有範囲、運用境界に応じて `packages/backend`、plugin / module、library のいずれにも置ける。配置先は source of truth を変えない。
- Backstage Catalog や Scaffolder の内部実装を fork または copy しない。configuration、extension point、backend module、Scaffolder integration を優先する。

## 2026-08-02 の決定更新

`packages/backend` を IDP business logic の所有者にしない、または永続化・外部連携を plugin に限定する実装規則を撤廃する。実アプリの起動により、配置規則が Bara の標準 journey を作るより、Bara の体験を `/idp` に孤立させる方向へ働くことが分かったためである。

この更新は Project / Environment / Template の desired state、runtime / audit record、Catalog の公開 index としての役割という本 ADR の source-of-truth 決定を変更しない。Backstage capability の内部実装を fork / copy しない制約も維持する。

## 結果

### 良い影響

- Backstage Catalog を共有 discovery / ownership surface として活用し続けられます。
- desired state について Git review、history、rollback を維持できます。
- 高頻度 runtime data を Catalog entity から切り離せます。
- Backstage の hard fork 化や将来の OSS plugin adoption を阻害するリスクを下げられます。
- IDP backend plugin に明確な責務境界を与えられます。

### 悪い影響 / trade-off

- UI screen は単一 table ではなく、Catalog と IDP DB の data を合成して表示する必要があります。
- entity rename / delete 時の historical runtime record の扱いを慎重に設計する必要があります。
- Environment status では、declared desired state と observed runtime state の区別を明示する必要があります。
- Template metadata は Scaffolder の上に curated layer を持つ可能性がありますが、execution engine の重複実装を避ける必要があります。

## 未決事項

- Environment は Backstage `Resource` のままにするべきか、custom Catalog kind にするべきか、それとも hybrid approach にするべきか。
- Project は Backstage `System` として表現するべきか、custom Catalog kind にするべきか、それとも成熟度に応じて併用するべきか。
- Template metadata のうち、どれを Scaffolder template YAML に置き、どれを IDP-specific metadata layer に置くべきか。
- permission check は Catalog ownership、environment criticality、template allowed roles をどう組み合わせるべきか。
- Catalog entity が rename / delete された場合、DB はどの historical snapshot を保持すべきか。

## 参考

- `docs/idp-management-model.md`
- `docs/backstage-extension-policy.md`
- `docs/backstage-architecture-notes.md`
- `docs/reviews/2026-06-16-product-review-v1.md`
