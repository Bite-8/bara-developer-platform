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

製品判断、ロードマップ検討、今回の運営サイクルの対象選定、Issue 化、または Product Owner としての判断を行う前に、必ず次のファイルを確認する。

- `README.md`: プロジェクト最上位の製品概要、North Star、現在の開発段階、非目標、参照先を確認する。
- `docs/product/ai-native-control-plane-charter.md`: Bara Developer Platform の製品方針、MVP、control-plane object、製品原則、非目標を確認する。
- `docs/adr/0001-idp-management-source-of-truth.md`: Project / Environment / Template / runtime record の source of truth 境界を確認する。
- `docs/adr/0002-ai-action-approval-boundary.md`: AI action、approval、permission、audit の境界を確認する。
- `docs/backstage-extension-policy.md`: Backstage 拡張時の plugin / module / extension 方針を確認する。
- `docs/reviews/`: 直近の製品レビュー、未解決事項、次サイクルへの学習を確認する。
- `docs/ai/output/`: 既存の agent 成果物がある場合、Product Owner / Implementer / Quality Reviewer / Product Reviewer の最新成果物を優先して確認する。

上記を読んでも判断に必要な証跡が不足する場合は、停止せず、利用可能な証跡から次に検証可能な小さな一歩を選び、未確認事項とリスクを成果物に明記する。

## 定期実行トリガー

ユーザーが「定期実行して」「開発サイクルを実行して」、または同等の意図を示した場合、これは Bara Developer Platform の次の自律製品運営サイクルを開始する Project goal として扱う。追加の確認は不要とし、Product Owner は利用可能な証跡から今回の対象成果群を選び、必要な delivery / discovery / maintenance を完結まで進める。運営サイクルは単一機能や単一 Issue に固定しない。対象はゼロ件、1 件、または複数件とし、各対象は独立して検証・公開可能な配達単位に分ける。

1. `product-owner` を用い、`$discover-idp-opportunities` に従って、リポジトリの現状、既存の成果物・レビュー、GitHub Issue、公開されたユーザーニーズを調査し、根拠付き候補を backlog Issue として作成または更新する。
2. `product-owner` を用い、`$select-product-outcome` に従って候補と既存 backlog を比較し、今回の運営サイクルで扱う成果群、優先順位、受入条件、非対象、成果仮説を決定する。Product Owner は製品・UI・技術上のトレードオフを決定する唯一の役割とする。
3. `product-owner` が `implementer`、`quality-reviewer`、`product-reviewer` を直接用いて、各配達単位を完結させる。Implementer は実装、検証、通常 PR の作成、レビュー指摘への修正を担い、Quality Reviewer と Product Reviewer は同じ PR を独立したレビュー対象として扱う。Product Owner はレビュー結果を受けて、継続、差し戻し、分割、保留を判断する。
4. 各 agent は、最終成果物を `docs/ai/output/<agent-name>/` に保存する。
5. 開発対象は Backstage の plugin / module / extension 方針を守り、`packages/app` と `packages/backend` の変更は必要最小限の配線に留める。
6. 変更がある配達単位では、Implementer は成果物と実装を意図的に commit して remote へ push し、base branch に対する通常の GitHub Pull Request を作成する。Draft PR は用いない。PR には変更内容、利用者・開発者への影響、実行した検証、残余リスクを記載し、PR URL を Implementer の成果物と Product Owner の運営サイクル成果物に残す。PR 作成までを配達単位の完了条件とする。

ここでの「定期」は、ユーザーの依頼ごとにこのサイクルを実行する意味であり、時刻に基づく自動起動を意味しない。実時間で自動実行する場合は、別途 Codex を起動するスケジューラを構成する。

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

- Project-local Agent system は、最終判断者から与えられた Project goal に対して、Product Owner がリポジトリと公開ニーズから根拠付きの IDP 機会を発見し、backlog Issue を整備し、今回の運営サイクルで扱う成果群を決定する。Implementer はその判断を起点に実装・検証・PR 公開を行い、Quality Reviewer と Product Reviewer は PR を独立してレビューする。Product Owner はレビュー結果を受けて配達の完了または差し戻しを決定する。Product Reviewer の発見は次サイクルの Product Owner の入力とする。center への逐次報告や、人間による製品採否・製品レビューはこのサイクルに含めない。
- Product Owner、Implementer、Quality Reviewer、Product Reviewer を含むすべての Project-local Subagent は、sandbox 内でゴール達成に必要な調査、ファイル変更、検証、設定、連携を自律的に行う。役割の境界は操作権限ではなく、判断・実装・検証の責務を表す。
- `.codex/agents/` の custom agent を使った場合、担当 agent または Product Owner は各最終成果物を Markdown として `docs/ai/output/<agent-name>/` に保存する。
- ファイル名は `NNN-<内容を表すkebab-case名>.md` とし、`NNN` は agent ごとに `001` から始まる 3 桁の連番とする。
- 保存前に対象ディレクトリを確認し、既存の最大番号に 1 を加える。既存ファイルを上書きしない。
- `<agent-name>` には nickname ではなく custom agent の `name` を使う。
- 成果物の先頭には、タイトル、作成日、agent 名、依頼内容または対象範囲を記載する。
- 成果物の見出し、本文、メタデータは日本語で記述する。コード、コマンド、ファイルパス、API 名などの固有表記は原文のままでよい。
- subagent の一時的な調査ログや生のコマンド出力は保存せず、意思決定やレビューに必要な最終成果物だけを保存する。
- Secret、token、個人情報の値は、成果物、レビュー、検証証跡に記録しない。
