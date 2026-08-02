# Backstage 拡張方針

このドキュメントは、Bara Developer Platform が Backstage の能力を活用しながら、Bara 固有のプロダクト体験をアプリ全体に実装するための設計方針をまとめる。実装時にどの package / plugin / module を選ぶかは、`docs/how-to-develop.md` を参照する。

## 前提

このリポジトリは、Backstage 生成アプリを土台にした Internal Developer Platform (IDP) である。Backstage は Catalog、Scaffolder、Permission、Search、TechDocs、plugin ecosystem を提供する基盤であり、Bara はその上に独自の developer control plane を構築する。生成直後の app shell や標準 journey を維持することは目的ではない。

設計上の判断は、次の優先順で行う。

1. Bara の代表 journey と利用者価値に最も合う UX / domain boundary を選ぶ。
2. 責務の凝集性、共有範囲、テスト容易性、将来の変更コストで `packages/app`、`packages/backend`、plugin / module、library を選ぶ。
3. Backstage の公開 API、extension point、標準 component、config を適切に活用する。
4. 公式 plugin や Backstage dependency の内部実装の copy / fork は最後の手段にする。

## Bara 固有機能の置き場所

Bara 固有機能を `plugins/` に閉じることは必須ではない。次のように責務に応じて配置する。

- `packages/app`: Bara の app shell、home、navigation、theme、代表 journey、共有 UI、画面ロジック。
- `packages/backend`: Bara の API、domain service、外部 integration、control-plane の実装。
- `plugins/`: 独立して再利用・配布・合成する Backstage plugin / module。
- library package: 複数の領域で共有する型、schema、pure function、client。

この選択で重要なのは、plugin 配置そのものではなく、責務が追跡可能で、対象テストと利用者 journey が明確であることです。Catalog / Scaffolder / Search / TechDocs などの既存 capability は継続して導入・更新できるようにします。

Backstage の標準 UI と component は一貫性、accessibility、OSS plugin 互換性の baseline として活用するが、Bara の対象利用者にとって最適な UX であるとは仮定しない。代表 journey の摩擦と成果を観測し、`docs/product/ai-native-ux-principles.md` に従って、Bara の app shell を含む情報階層や interaction の仮説を検証する。標準 UI からの逸脱を避けることと、標準 journey を無検証で固定することを混同しない。

## `packages/app` の扱い

`packages/app` は Bara frontend app の所有境界である。Bara の app shell、root route、navigation / sidebar、theme、shared layout、代表 journey、画面ロジックと、Backstage frontend integration を実装してよい。

Backstage plugin の公開 API と extension point を優先して利用するが、Bara の app shell を独自の developer control plane として設計・置換してよい。特定の機能が他の Backstage app でも再利用される、独立して配布される、または明確な extension boundary を持つ場合は plugin / module を選ぶ。

## `packages/backend` の扱い

`packages/backend` は Bara backend の所有境界である。Bara 固有の API、domain service、外部システム連携、control-plane の実装と、Backstage backend integration を実装してよい。

複数の Backstage deployment で再利用する機能、独立した lifecycle を持つ機能、または既存 plugin の明確な拡張は backend plugin / module に分離する。identity、server-side permission enforcement、Secret、外部副作用の境界は、配置先によらず明示してテストする。

## Configuration first

`app-config.yaml` / `app-config.production.yaml` で設定できるものは、コード改造ではなく設定に寄せる。環境差分、URL、認証・連携先、feature flag、plugin の標準設定で表現できる項目は config として管理する。

本番向けの `app-config.production.yaml` を変更する場合は、本番影響が分かるように変更理由を明確にする。

## 避ける変更

互換性とアップデート追従性を保つため、次の変更は原則として避ける。

- 公式 plugin や Backstage 生成コードの内部実装をコピーして改造する。
- OSS plugin の追加・更新を難しくする hard fork 的な変更を行う。

大きな変更を行う場合は、Backstage の公開 integration contract への影響、既存 data / auth / permission 境界、アップデート時の追従方法を、関連ドキュメントまたは PR 説明に残す。

## 2026-08-02 の方針更新

従来の plugin-first と app/backend を薄い配線層に限定する規則を撤廃した。実アプリを起動した結果、生成直後の Welcome → Catalog が標準入口のまま残り、Bara の control-plane UI が `/idp` に孤立した。配置規則が Backstage compatibility の手段から、Bara の代表 journey を阻害する目的外の制約へ変わっていたためである。

この更新は、Backstage capability の内部実装を copy / fork すること、source of truth、permission、approval、audit の境界を緩めることを意味しない。実装の結果から再び不適切と分かれば、同様に理由を残して見直す。

## Backstage アップデート時の運用

Backstage をアップデートする前に、Backstage Upgrade Helper、release notes、公式ドキュメントを確認する。アップデート作業では、`packages/app` / `packages/backend` の差分が何のための変更なのかを追えるようにする。

特に、生成アプリ由来の変更と Bara Developer Platform 独自の配線変更が混ざる場合は、PR 説明や関連ドキュメントで理由を明確にする。これにより、将来の Backstage 更新時に残すべき差分と取り込むべき upstream 差分を判断しやすくする。
