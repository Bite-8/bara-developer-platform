# Bara Developer Platform

Bara Developer Platform は、Spotify で生まれたオープンソースの [Backstage](https://backstage.io) を土台に開発する Internal Developer Platform (IDP) です。

開発者、Platform Engineer、AI agent が同じ Project / Environment / Template のコンテキストを参照し、変更を安全に計画、承認、実行、監査できる AI-native developer control plane を目指します。

## なぜ Backstage を土台にするのか

IDP の基盤機能を独自に再実装するのではなく、Backstage の Catalog、Scaffolder、Permission、Search、TechDocs、plugin ecosystem を利用します。これにより、Platform team は開発者ポータルそのものの維持や upstream 追従に費やす管理コストを抑え、Bara 固有の価値である安全な自動化、承認、監査、agent 向け control surface に集中できます。

## North Star

開発者が Project と Environment を選ぶと、Bara が Catalog、Template、runtime signal をもとに次の action plan を提示する。必要な承認の後に Scaffolder または Git PR へ接続し、実行結果と audit trail を Project のコンテキストへ戻せる状態を実現する。

AI は Backstage を置き換える実行主体ではありません。AI の提案・計画・実行は、ownership、permission、policy、human approval、audit の境界の内側で扱います。

## 現在の開発段階

AI-native developer control plane の MVP を定義し、その最小の実装を進める段階です。現在は、以下の制御対象と境界を固めています。

- Project / Environment / Template は Git YAML と Backstage Catalog を中心に、レビュー可能な desired state として扱う。
- `plugins/idp-backend` は Intent / Plan / ActionRun / OperationLog の最小 contract と Project control context read API を持つ。現在の runtime store は in-memory であり、durable な監査保存と write/approval flow は後続成果とする。
- AI は evidence、expected change、risk、required approval を伴う plan を提示する。
- 副作用のある変更は Scaffolder または Git PR を優先して実行し、結果を audit trail として残す。

## 非目標

- Backstage の app shell、Catalog、Scaffolder を fork または全面的に置き換えること。
- Scaffolder や Git を重複して実装する独自 executor を最初から作ること。
- 初期 MVP で、任意コマンドの実行や人間の承認なしの本番自律実行を提供すること。
- `packages/app` や `packages/backend` に IDP 固有の業務ロジックを蓄積すること。

## 製品判断の参照先

製品の方向性、次の成果、Issue、実装方針を検討する前に、以下を確認します。

- [製品方針: AI-native control plane charter](docs/product/ai-native-control-plane-charter.md)
- [ADR 0001: IDP 管理モデルの source of truth](docs/adr/0001-idp-management-source-of-truth.md)
- [ADR 0002: AI action approval boundary](docs/adr/0002-ai-action-approval-boundary.md)
- [Backstage 拡張方針](docs/backstage-extension-policy.md)
- [過去の製品レビュー](docs/reviews/2026-06-16-product-review-v2-ai-native-control-plane.md)
- [Historical agent outputs の位置づけ](docs/ai/output/README.md)

詳細な開発方法は [開発ガイド](docs/how-to-develop.md)、変更のレビューと動作確認は [レビュー・動作確認ガイド](docs/how-to-review-and-verify.md) を参照してください。

## ローカル開発

Node.js 22 または 24 と Yarn 4 を用意してから起動します。

```sh
yarn install --immutable
yarn start
```
