## Backstage 開発方針

新しい IDP 独自機能を追加する場合は、まず `yarn new` で生成できる Backstage の package / plugin / module / library の中から、目的に合うものを選択する。

機能本体は、原則として `plugins/` または `packages/` 配下の生成済みパッケージに実装する。

`packages/app` と `packages/backend` は変更禁止ではないが、機能実装の場所ではなく、Backstage アプリへ組み込むための合成・登録・配線の場所として扱う。

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
