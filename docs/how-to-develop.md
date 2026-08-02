## Backstage 開発方針

新しい IDP 独自機能を追加する場合は、利用者 journey と変更の凝集性に合わせて、`packages/app`、`packages/backend`、plugin / module、library のいずれに置くかを選択する。`yarn new` で生成できる Backstage の package / plugin / module / library は有力な選択肢だが、Bara のアプリ全体の体験を構築することを妨げる制約ではない。

機能本体は、責務を最も分かりやすく保てる package に実装する。app shell、navigation、theme、共有 UI、Bara 固有の画面ロジックは `packages/app` に置いてよい。Bara 固有の API、domain service、外部 integration は `packages/backend` に置いてよい。独立して再利用・配布・合成したい機能には plugin / module を選ぶ。

Backstage の公開 API、extension point、標準 component は優先的に活用する。ただし、Bara の標準 journey を生成アプリの app shell や画面構成に合わせる必要はない。公式 plugin や Backstage dependency の内部実装を copy / fork して改造する場合だけは、更新性への影響を明示し、原則避ける。

実装を PR として配達する際の受入条件、動作確認、独立レビューの手順は [レビュー・動作確認ガイド](how-to-review-and-verify.md) を参照する。

## `yarn new` の選択ルール

`yarn new` を使う場合は、作りたいものに応じて生成対象を選ぶ。

- フロントエンド画面・ページ・UI を作る  
  → frontend plugin

- 既存 frontend plugin に拡張を追加する  
  → frontend plugin module

- 独自の backend API や backend 処理を作る  
  → backend plugin

- 既存 backend plugin に機能を追加する  
  → backend module

- Scaffolder の custom action を作る  
  → scaffolder module / backend module

- 複数 plugin で共有する型・関数・schema を置く  
  → library package

- frontend/backend で共有する Entity 型や API 型を置く  
  → common/shared library

選択肢名は Backstage のバージョンによって変わる可能性があるため、実行時に表示される `yarn new` の選択肢を確認し、目的に最も近いものを選ぶ。
