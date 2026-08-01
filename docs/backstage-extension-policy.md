# Backstage 拡張方針

このドキュメントは、Bara Developer Platform を Backstage と OSS plugin の更新に追従しやすい状態に保つための設計方針をまとめる。実装時にどの package / plugin / module を選ぶかは、`docs/how-to-develop.md` を参照する。

## 前提

このリポジトリは、Backstage 生成アプリを土台にした Internal Developer Platform (IDP) である。Backstage 本体を独自プロダクトのように作り替えるのではなく、Backstage が提供する plugin / module / extension / configuration の境界を活用して拡張する。

そのため、設計上の判断基準は次の順序を基本とする。

1. `plugins/` に閉じる。
2. `packages/app` と `packages/backend` は薄くする。
3. `config` で済むものは `app-config.yaml` / `app-config.production.yaml` に寄せる。
4. Backstage 本体や生成コードの改造は最後の手段にする。

## 独自機能の置き場所

IDP 独自機能は、原則として `plugins/` 配下の plugin / module / extension に閉じ込める。画面、API、業務ルール、ドメイン固有の処理は、Backstage アプリ本体ではなく独立した拡張単位として実装する。

この方針により、次の状態を維持する。

- Catalog / Scaffolder / Search / TechDocs などの既存 OSS plugin を後から導入・更新できる。
- Backstage アップデート時に、生成アプリとの差分を追いやすくする。
- 独自機能の影響範囲を plugin / module / extension の境界内に限定する。

Backstage の標準 UI と component は一貫性、accessibility、OSS plugin 互換性の baseline として活用するが、Bara の対象利用者にとって最適な UX であるとは仮定しない。代表 journey の摩擦と成果を観測し、`docs/product/ai-native-ux-principles.md` に従って plugin / module / extension / configuration 内で情報階層や interaction の仮説を検証する。標準 UI からの逸脱を避けることと、標準 journey を無検証で固定することを混同しない。

## `packages/app` の扱い

`packages/app` は frontend app の配線層として扱う。変更は、plugin 登録、route、navigation / sidebar、theme、app-level extension、設定接続など、Backstage アプリとして必要な合成に限定する。

`packages/app` には、独自の画面ロジックや業務ロジックを直接増やさない。Backstage の app shell を独自 SPA のように全面置換する変更も避ける。必要な UI や振る舞いは、まず frontend plugin / plugin module / app-level extension として表現できないか検討する。

## `packages/backend` の扱い

`packages/backend` は backend plugin / module の登録・配線層として扱う。独自業務ロジック、外部システム連携、ドメイン処理を backend 本体に直接増やさない。

backend 側で新しい API や処理が必要な場合は、まず backend plugin または既存 plugin 向けの backend module として分離する。`packages/backend` の変更は、その plugin / module を Backstage backend に登録するための最小限の差分にする。

## Configuration first

`app-config.yaml` / `app-config.production.yaml` で設定できるものは、コード改造ではなく設定に寄せる。環境差分、URL、認証・連携先、feature flag、plugin の標準設定で表現できる項目は config として管理する。

本番向けの `app-config.production.yaml` を変更する場合は、本番影響が分かるように変更理由を明確にする。

## 避ける変更

互換性とアップデート追従性を保つため、次の変更は原則として避ける。

- 公式 plugin や Backstage 生成コードの内部実装をコピーして改造する。
- Backstage の app shell を独自 SPA のように全面置換する。
- `packages/app` / `packages/backend` に独自業務ロジックを直接蓄積する。
- OSS plugin の追加・更新を難しくする hard fork 的な変更を行う。

大きな変更を行う場合は、なぜ plugin / module / configuration では不十分なのかを、関連ドキュメントまたは PR 説明に残す。

## Backstage アップデート時の運用

Backstage をアップデートする前に、Backstage Upgrade Helper、release notes、公式ドキュメントを確認する。アップデート作業では、`packages/app` / `packages/backend` の差分が何のための変更なのかを追えるようにする。

特に、生成アプリ由来の変更と Bara Developer Platform 独自の配線変更が混ざる場合は、PR 説明や関連ドキュメントで理由を明確にする。これにより、将来の Backstage 更新時に残すべき差分と取り込むべき upstream 差分を判断しやすくする。
