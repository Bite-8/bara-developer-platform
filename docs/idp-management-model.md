# IDP Management Model

## 位置づけ

このドキュメントは、Bara Developer Platform で `Project` / `Environment` / `Template` / `DeploymentRun` のような IDP 管理モデルを追加する前に、**Backstage Catalog / Git YAML / DB の責務境界**を整理するための設計メモです。

今回の方針は実装方法の詳細ではなく、将来の実装で判断がぶれないようにするための責務分担を定義します。

## 基本方針

- Backstage Catalog は、IDP 上で発見・参照・関連付けされるリソースの公開された台帳として扱う。
- Git YAML は、宣言的でレビュー可能な望ましい状態、所有者、ライフサイクル、関連リソースの定義を置く場所として扱う。
- DB は、実行結果、進捗、イベント、監査ログ、UI の一時状態など、Git YAML に戻すべきではない運用時データを置く場所として扱う。
- `Project` / `Environment` / `Template` のような長寿命の管理対象は、まず Catalog entity または Catalog entity から辿れる Git YAML として表現できるかを検討する。
- `DeploymentRun` のような短寿命・履歴型・高頻度更新のデータは、Catalog entity ではなく IDP runtime DB に置く。
- DB を authoritative source にしすぎない。再作成可能な宣言的状態は Git YAML、検索・所有・関係性の公開面は Catalog に寄せる。
- IDP 固有の管理モデルの配置先は、利用者 journey、責務の凝集性、共有範囲、運用境界で選ぶ。配置先は Catalog / Git YAML / DB の責務分担を変えない。

## 三層の役割

### Backstage Catalog

Backstage Catalog は、IDP における発見、所有、検索、関係性、権限判定の起点です。

Catalog に置くべきものは次の通りです。

- 開発者が IDP 上で検索・参照する長寿命リソース。
- `owner`、`system`、`domain`、`lifecycle` など、Backstage の既存概念で扱えるメタデータ。
- Component / System / Resource / API / Group / User など既存 kind で自然に表現できる対象。
- IDP 独自 kind として公開する価値がある `Project` や `Environment` などの管理対象。
- 他 plugin から参照される安定 ID、関連、リンク、アノテーション。

Catalog に置くべきではないものは次の通りです。

- 実行ごとに増える `DeploymentRun` の詳細履歴。
- 秒単位・分単位で頻繁に変わる進捗やジョブ状態。
- 大量のログ、外部 CI/CD の生イベント、監査イベント本文。
- UI のフィルタ条件、ウィザード途中状態、非公開の内部計算結果。
- runtime 実装の内部に閉じるべき正規化テーブル。

Catalog は「すべてのデータの保存場所」ではありません。Catalog entity は、IDP の他機能が安全に参照できる公開されたモデルに限定します。

### Git YAML

Git YAML は、レビュー可能で履歴が残る宣言的な望ましい状態を表します。

Git YAML に置くべきものは次の通りです。

- `catalog-info.yaml` などの Catalog entity 定義。
- `Project` / `Environment` / `Template` の desired state。
- 所有者、ライフサイクル、依存関係、リンク、アノテーションなど、人間がレビューすべき設定。
- テンプレート入力の schema、標準値、利用条件など、変更にレビューが必要な定義。
- 環境ごとの構成差分、ポリシー参照、デプロイ先識別子など、宣言的に管理したい情報。

Git YAML に置くべきではないものは次の通りです。

- 実行中ジョブの進捗。
- `DeploymentRun` のステータス更新履歴。
- 外部システムから取得したキャッシュ。
- 機密値そのもの。
- 大量・高頻度・機械生成のみのイベントログ。

Git YAML は DB の代替ではありません。Git に置く価値があるのは、レビュー・差分・ロールバック・再適用の対象になる宣言的状態です。

### DB

DB は、IDP plugin の runtime state と履歴を保存します。

DB に置くべきものは次の通りです。

- `DeploymentRun` の実行レコード、ステータス、開始・終了時刻、結果、参照 ID。
- Scaffolder / CI/CD / deployer / external API との連携で発生する非同期処理の状態。
- 冪等性キー、ロック、リトライ回数、エラー概要など、実行制御に必要な内部状態。
- 監査ログ、操作履歴、外部イベントの受信記録。
- UI 表示のための派生キャッシュ。ただし再生成可能であることを前提にする。

DB に置くべきではないものは次の通りです。

- Git YAML が authoritative source である desired state の唯一のコピー。
- Catalog entity として公開すべき所有・関係・分類情報の唯一のコピー。
- 変更レビューが必要なポリシーやテンプレート定義の唯一のコピー。
- Backstage Catalog と二重管理になる entity メタデータ。

DB は runtime の事実を保持する場所です。長寿命リソースの定義を DB に閉じ込めると、GitOps、レビュー、Backstage Catalog との連携が弱くなるため避けます。

## モデル別の配置方針

| モデル          | 主な責務                                | Authoritative source | Catalog での扱い                                                                          | Git YAML での扱い                                                        | DB での扱い                                            |
| --------------- | --------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `Project`       | チームやプロダクト単位の IDP 管理対象   | Git YAML             | entity として公開し、owner / system / domain / lifecycle / relations を持つ               | desired state を定義する                                                 | 派生キャッシュや利用統計のみ                           |
| `Environment`   | dev / staging / production などの稼働面 | Git YAML             | entity または `Project` から辿れる resource として公開する                                | 環境名、種別、関連 cluster / account / namespace / policy 参照を定義する | 現在状態のキャッシュ、検出結果、運用イベントを保持する |
| `Template`      | 標準的な作成・変更手順の定義            | Git YAML             | Backstage Scaffolder template または独自 template entity として公開する                   | 入力 schema、steps、ポリシー、公開範囲を定義する                         | 実行履歴や利用統計のみ                                 |
| `DeploymentRun` | デプロイ実行の履歴・進捗・結果          | DB                   | 原則 entity 化しない。必要なら対象 `Project` / `Environment` から link や card で表示する | 定義しない                                                               | authoritative source として実行状態・履歴を保持する    |

## 代表的な判断基準

### Catalog entity にするか

次の条件を多く満たす場合は Catalog entity として扱います。

- 人間が IDP 上で検索したい。
- 所有者やライフサイクルを持つ。
- 他の entity と関係を持つ。
- plugin をまたいで参照される安定 ID が必要。
- 変更頻度が比較的低く、宣言的に管理できる。

逆に、実行履歴・ログ・一時状態・高頻度更新のデータは Catalog entity にしません。

### Git YAML にするか

次の条件を多く満たす場合は Git YAML に置きます。

- 変更を pull request でレビューしたい。
- 差分、履歴、ロールバックが重要。
- 再適用可能な desired state である。
- 環境や所有チームごとに宣言的に管理したい。
- Backstage Catalog provider / processor で取り込める。

逆に、実行のたびに増えるデータや外部システムの観測結果は Git YAML に置きません。

### DB にするか

次の条件を多く満たす場合は DB に置きます。

- runtime に生成される。
- 高頻度に更新される。
- append-only の履歴や監査ログである。
- 非同期処理、リトライ、ロック、状態遷移に必要。
- UI 表示のために集計・キャッシュしたいが、再生成可能である。

逆に、レビュー対象の desired state や公開された entity metadata は DB のみで管理しません。

## データフローの考え方

標準的なデータフローは次のように考えます。

1. 開発者または platform team が Git YAML を変更する。
2. Backstage Catalog provider / processor が Git YAML を読み込み、Catalog entity として公開する。
3. IDP plugin が Catalog entity を参照し、`Project` / `Environment` / `Template` の画面や操作を提供する。
4. デプロイやテンプレート実行などの操作が発生したら、IDP plugin が DB に `DeploymentRun` などの runtime record を作成する。
5. 外部 CI/CD や deployer の進捗は DB に反映し、Catalog entity には必要最小限の link / annotation / relation だけを持たせる。
6. UI は Catalog の公開メタデータと DB の runtime state を組み合わせて表示する。

重要なのは、Git YAML、Catalog、DB を同期対象として同列に扱わないことです。Git YAML は宣言、Catalog は公開台帳、DB は runtime の事実です。

## 整合性と重複管理

同じ概念を複数層に持つ場合は、必ず authoritative source を 1 つに決めます。

- `owner`、`lifecycle`、`system` などの entity metadata は Git YAML / Catalog を正とする。
- `DeploymentRun.status`、開始時刻、終了時刻、エラー概要は DB を正とする。
- 外部システムの URL や識別子は、宣言的に必要なら Git YAML、実行ごとに変わるなら DB に置く。
- DB に Catalog metadata をコピーする場合は、表示・検索性能のためのキャッシュに限定し、再生成可能にする。
- Catalog entity の削除や rename に備えて、DB 側は entity ref と実行時点の snapshot label の両方を持つことを検討する。

## 権限と監査

- 権限判定の入口は Backstage の permission framework と Catalog の owner / relation を優先する。
- 実行操作、承認、失敗、再実行などの監査対象イベントは DB に保存する。
- 監査ログは Catalog entity に埋め込まない。
- Git YAML の変更監査は Git の履歴を正とし、IDP 側では必要に応じて commit / PR への link を持つ。
- 機密値は Git YAML、Catalog、DB のいずれにも平文で置かず、secret manager への参照として扱う。

## 実装時の境界

将来実装するときは、次の境界を守ります。

- Catalog 取り込みや entity 変換は Catalog backend module または provider / processor として実装する。
- `Project` / `Environment` / `Template` の UI と業務 API、`DeploymentRun` の DB schema、状態遷移、外部連携は、利用者 journey と domain boundary に応じて Bara app/backend、plugin / module、library に実装する。
- Backstage 公式 plugin の内部実装をコピーして改造しない。

## 初期設計の推奨

最初の実装単位では、次のように分けるのが安全です。

- `Project`: Git YAML を正とする Catalog entity。
- `Environment`: Git YAML を正とする Catalog entity、または `Project` entity から relation で辿れる resource。
- `Template`: Backstage Scaffolder template を優先し、足りない場合のみ独自 template entity を検討する。
- `DeploymentRun`: IDP runtime DB の table。Catalog entity にはしない。

この分け方により、Backstage の既存機能である Catalog / Scaffolder / Permission / Search との互換性を保ちながら、IDP 固有の実行履歴や状態管理を Catalog と desired state から分離できます。

## 未決事項

今後の具体設計で決めるべき事項は次の通りです。

- `Project` / `Environment` を Backstage の既存 kind で表すか、独自 kind として定義するか。
- `Environment` を独立 entity にするか、`Project` entity の spec 配下に含めるか。
- `Template` を Scaffolder template に統一するか、IDP 固有 template model を併用するか。
- `DeploymentRun` と外部 CI/CD 実行 ID の対応関係。
- entity rename / delete 時の `DeploymentRun` 履歴の表示方針。
- 権限モデルを owner ベースにするか、環境ごとの追加 policy を持つか。

## Project / Environment Catalog YAML PoC

このリポジトリでは、まず `Project` / `Environment` を Git YAML / Backstage Catalog で扱えるかを確認するため、最小 PoC として `examples/idp-projects/` を追加しています。

### 追加した YAML

- `examples/idp-projects/location.yaml`
  - `examples/idp-projects/payment-platform.yaml` を参照する Backstage `Location` entity です。
  - `app-config.yaml` からはこの Location だけを登録し、PoC 用 entity の追加・分割を `examples/idp-projects/` 配下に閉じ込めます。
- `examples/idp-projects/payment-platform.yaml`
  - `payment-platform` を Backstage 既存 kind の `System` として定義しています。
  - `payment-platform-dev` / `payment-platform-stg` / `payment-platform-prod` を Backstage 既存 kind の `Resource` として定義しています。
  - 各 Environment は `spec.system: payment-platform` で Project に紐づけています。
  - `bara.dev/template-ref: template:default/web-app-ecs-rds` annotation で、将来利用する `web-app-ecs-rds` template への参照を表しています。今回の PoC では template entity 自体は追加せず、Project / Environment YAML が Catalog に読み込めることを優先します。

### 既存 kind での表現方針

今回の PoC では、Catalog が追加実装なしで読み込めることを優先し、次の対応にしています。

| IDP モデル    | PoC での Backstage kind | 理由                                                                                     |
| ------------- | ----------------------- | ---------------------------------------------------------------------------------------- |
| `Project`     | `System`                | 複数 component / resource を束ねる長寿命の単位として扱えるため。                         |
| `Environment` | `Resource`              | dev / stg / prod のようなデプロイ先・実行先を Project に紐づくリソースとして扱えるため。 |

ただし、`System` / `Resource` で表現すると IDP の意味が歪む場合は、将来的に Catalog backend module / processor を `plugins/` 配下に追加し、`Project` / `Environment` を独自 kind として扱う案を検討します。今回の PoC では独自 kind、frontend plugin、backend plugin、DB migration は追加しません。

### app-config.yaml の登録

`app-config.yaml` の `catalog.locations` に、PoC 用 Location を最小追加しています。

```yaml
- type: file
  target: ../../examples/idp-projects/location.yaml
  rules:
    - allow: [Location]
```

この Location から `payment-platform.yaml` が読み込まれ、既存の catalog rule で許可済みの `System` / `Resource` entity として登録されます。

### 確認方法

1. 依存関係をインストール済みの状態で Backstage を起動します。

   ```bash
   yarn start
   ```

2. Catalog 画面で次の entity を検索します。

   - `system:default/payment-platform`
   - `resource:default/payment-platform-dev`
   - `resource:default/payment-platform-stg`
   - `resource:default/payment-platform-prod`

3. 各 Environment entity の `system` relation が `payment-platform` を指していることを確認します。

4. 必要に応じて Catalog API でも確認できます。

   ```bash
   curl 'http://localhost:7007/api/catalog/entities/by-name/system/default/payment-platform'
   curl 'http://localhost:7007/api/catalog/entities/by-name/resource/default/payment-platform-dev'
   ```

この確認で扱うのは長寿命の Project / Environment 定義だけです。`DeploymentRun` のような実行履歴・状態管理は、この PoC では Catalog / Git YAML に追加せず、将来の IDP backend plugin の DB 管理対象として扱います。
