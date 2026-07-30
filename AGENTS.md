# AGENTS.md

このファイルは、このリポジトリで作業する Codex 向けの永続的なプロジェクト指示です。

このリポジトリは Backstage ベースの Internal Developer Platform、Bara Developer Platform の本体です。
Backstage の生成アプリを土台にしつつ、IDP 独自機能はできるだけ plugin / module / extension として追加し、将来の Backstage 更新や OSS plugin 追加との互換性を壊さないことを重視します。

## 最重要方針

- Backstage 本体を直接作り替えるのではなく、原則として Backstage の plugin / module / extension / configuration として拡張する。詳細は`docs/how-to-develop.md` と `docs/backstage-extension-policy.md`
- 新しい IDP 独自機能は、まず `plugins/` 配下に閉じ込めることを検討する。
- `packages/app` と `packages/backend` は、基本的に Backstage アプリ本体の配線、登録、合成場所として扱う。
- `packages/app` や `packages/backend` を変更する場合は、plugin / module の登録、app-level extension、設定接続など、必要最小限の変更にする。
- 独自の業務ロジック、画面ロジック、ドメイン処理を `packages/app` や `packages/backend` に直接増やさない。
- OSS plugin 追加、Backstage バージョンアップ、将来の移行を妨げる hard fork 的変更を避ける。
- 公式 plugin や生成コードの内部実装をコピーして改造しない。
- 判断に迷う場合は、変更範囲を広げる前に、なぜその変更が必要かを説明する。

## ディレクトリ構成

- `packages/app/`: Backstage frontend app。frontend plugin / module の登録、app-level extension、navigation、theme などの配線を扱う。
- `packages/backend/`: Backstage backend。backend plugin / module の登録を扱う。
- `plugins/`: IDP 独自の Backstage plugin / module を置く場所。新機能や独自業務ロジックは原則ここに置く。
- `examples/`: catalog entity や software template のサンプル。
- `docs/`: セットアップ、運用、設計メモ、AI コーディングルール、Backstage カスタマイズ方針などのドキュメント。
- `app-config.yaml`: ローカル開発・共通設定。
- `app-config.production.yaml`: 本番向け設定。変更時は本番影響を明示する。

## 製品判断時の必読コンテキスト

製品判断、ロードマップ検討、次の製品成果の選定、issue 化、または Product Owner / Project Manager / improvement-proposer としての判断を行う前に、必ず次のファイルを確認する。

- `README.md`: プロジェクト最上位の製品概要、North Star、現在の開発段階、非目標、参照先を確認する。
- `docs/product/ai-native-control-plane-charter.md`: Bara Developer Platform の製品方針、MVP、control-plane object、製品原則、非目標を確認する。
- `docs/adr/0001-idp-management-source-of-truth.md`: Project / Environment / Template / runtime record の source of truth 境界を確認する。
- `docs/adr/0002-ai-action-approval-boundary.md`: AI action、approval、permission、audit の境界を確認する。
- `docs/backstage-extension-policy.md`: Backstage 拡張時の plugin / module / extension 方針を確認する。
- `docs/reviews/`: 直近の製品レビュー、未解決事項、次サイクルへの学習を確認する。
- `docs/ai/output/`: 既存の agent 成果物がある場合、Product Owner / Project Manager / Product Reviewer の最新成果物を優先して確認する。

上記を読んでも判断に必要な証跡が不足する場合は、停止せず、利用可能な証跡から次に検証可能な小さな一歩を選び、未確認事項とリスクを成果物に明記する。

## 変更後の品質確認・起動確認

コードを変更した場合は、作業完了前に必ず品質確認と起動確認を行う。

以下のコマンドは、必ずプロジェクトルートで実行する。

```bash
# 依存関係の整合性確認
yarn install --immutable

# フォーマット確認
yarn prettier:check

# lint確認
yarn lint:all

# 型チェック
yarn tsc:full

# app / backend の起動確認
yarn start
```

## Subagent の成果物

- Project-local Agent system は、最終判断者から与えられた Project goal に対して、improvement-proposer がリポジトリと公開ニーズから根拠付きの IDP 機会候補を調査し、Product Owner が候補を小さな製品成果へ決定して GitHub Issue 化する。Project Manager はその Issue を起点に実装・品質レビュー・製品レビューまでを完結させる。Product Reviewer の発見は次サイクルの improvement-proposer と Product Owner の入力とする。center への逐次報告や、人間による製品採否・製品レビューはこのサイクルに含めない。
- Product Owner、Project Manager、Product Reviewer を含むすべての Project-local Subagent は、sandbox 内でゴール達成に必要な調査、ファイル変更、検証、設定、連携を自律的に行う。役割の境界は操作権限ではなく、判断・実装・検証の責務を表す。
- `.codex/agents/` の custom agent を使った場合、担当 agent または Project Manager は各最終成果物を Markdown として `docs/ai/output/<agent-name>/` に保存する。
- ファイル名は `NNN-<内容を表すkebab-case名>.md` とし、`NNN` は agent ごとに `001` から始まる 3 桁の連番とする。
- 保存前に対象ディレクトリを確認し、既存の最大番号に 1 を加える。既存ファイルを上書きしない。
- `<agent-name>` には nickname ではなく custom agent の `name` を使う。
- 成果物の先頭には、タイトル、作成日、agent 名、依頼内容または対象範囲を記載する。
- 成果物の見出し、本文、メタデータは日本語で記述する。コード、コマンド、ファイルパス、API 名などの固有表記は原文のままでよい。
- subagent の一時的な調査ログや生のコマンド出力は保存せず、意思決定やレビューに必要な最終成果物だけを保存する。
- Secret、token、個人情報の値は、成果物、レビュー、検証証跡に記録しない。
