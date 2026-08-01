# AGENTS.md

このファイルは、このリポジトリで作業する Codex 向けの永続的なプロジェクト指示です。

このリポジトリは Backstage ベースの Internal Developer Platform、Bara Developer Platform の本体です。Backstage の生成アプリを土台にしつつ、IDP 独自機能はできるだけ plugin / module / extension として追加し、将来の Backstage 更新や OSS plugin 追加との互換性を壊さないことを重視します。

## 製品ゴール

Backstage を土台に、アップデート追従性と OSS plugin 互換性を保ち、運用負荷を下げつつ、Internal Developer Platform として最善の UX を実現する。UX と運用負荷が衝突する場合は、IDP 利用者の UX を優先する。

## 最重要方針

- Backstage 本体を直接作り替えるのではなく、原則として Backstage の plugin / module / extension / configuration として拡張する。詳細は `docs/how-to-develop.md` と `docs/backstage-extension-policy.md`。
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

製品判断、ロードマップ検討、今回の運営サイクルの対象選定、Issue 化を行う前に、必ず次のファイルを確認する。

- `README.md`: プロジェクト最上位の製品概要、North Star、現在の開発段階、非目標、参照先。
- `docs/product/ai-native-control-plane-charter.md`: 製品方針、MVP、control-plane object、製品原則、非目標。
- `docs/adr/0001-idp-management-source-of-truth.md`: Project / Environment / Template / runtime record の source of truth 境界。
- `docs/adr/0002-ai-action-approval-boundary.md`: AI action、approval、permission、audit の境界。
- `docs/backstage-extension-policy.md`: Backstage 拡張時の plugin / module / extension 方針。
- `docs/reviews/`: 直近の製品レビュー、未解決事項、次サイクルへの学習。
- `docs/ai/output/`: 既存の cycle、Implementer、Quality Reviewer、Product Reviewer の最新成果物。

上記を読んでも判断に必要な証跡が不足する場合は、停止せず、利用可能な証跡から次に検証可能な小さな一歩を選び、未確認事項とリスクを成果物に明記する。

## 開発サイクルのトリガーと責務

ユーザーが「開発して」「定期実行して」「開発サイクルを実行して」「開発を進めて」、または同等の意図を示した場合、メイン agent は `$run-idp-development-cycle` に従い、次の自律製品運営サイクルを開始する。追加の確認は不要とする。運営サイクルは単一機能や単一 Issue に固定せず、対象をゼロ件、1 件、または複数件とし、各対象を独立して検証・公開可能な配達単位に分ける。

1. メイン agent は `$discover-idp-opportunities` を使い、実行中の app の UI / API 導線、リポジトリ、既存の成果物・レビュー、GitHub Issue、公開されたユーザーニーズを調査する。根拠のある UI / UX・機能・外部連携・ライブラリ導入候補を重複確認後に backlog Issue として作成または更新する。Issue 化は実装決定ではない。
2. メイン agent は `$select-product-outcome` を使い、候補 Issue と既存 backlog を比較し、今回の成果群、優先順位、受入条件、非対象、成果仮説を決定する。各受入条件には、前提データ、操作または request、期待結果、自動検証、独立 reviewer の観測方法を対応付ける。
3. メイン agent は配達単位を直接実施するか `implementer` に委譲するかを決める。小さな docs / configuration / 調査は直接実施してよい。実装、テスト、または独立した実装コンテキストが有益な配達単位は `implementer` に委譲する。並行実装は、変更範囲の所有権または worktree を分離できる場合に限る。
4. 変更がある配達単位では、実施担当が実装、検証、意図的な commit、push、通常の GitHub Pull Request 作成を行う。Draft PR は用いない。PR には変更内容、利用者・開発者への影響、実行した検証、残余リスク、受入条件ごとの再現手順と期待結果を含む Review guide、PR head SHA を残す。実装者の self-review は独立レビューではなく、approve / merge をしない。
5. メイン agent は PR の current head を対象に `quality-reviewer` を実行する。利用者の挙動、UI / UX、API contract、または成果仮説を変える PR は、同じ head に対して `product-reviewer` も実行する。両者は並行してよく、互いの verdict を前提にしない。docs / internal configuration のみで利用者挙動を変えない場合は Product Reviewer を省略できるが、その理由を cycle record に残す。
6. reviewer が Fail、重要な未検証、または blocking finding を報告した場合、メイン agent は修正、再検証、PR head 更新を行わせ、変更された head に対して必要な reviewer を再実行する。旧 head の Pass を新しい head に流用しない。
7. 必要な review が全て current head SHA を Pass とし、必須 CI が成功し、PR が merge 可能で、未解決の blocking finding がない場合だけ、メイン agent は `$merge-reviewed-pr` に従って merge または merge queue への投入を行う。GitHub の `Approve` 操作は必須ではない。条件を満たさない場合は merge せず、保留または差し戻し理由と次の作業を記録する。

ここでの「定期」は、ユーザーの依頼ごとにこのサイクルを実行する意味であり、時刻に基づく自動起動を意味しない。実時間で自動実行する場合は、別途 Codex を起動するスケジューラを構成する。

## レビューと動作確認の契約

変更を伴う delivery unit は、reviewer が PR head から再現可能な動作確認計画を持たなければならない。詳細な形式、環境準備、証跡の扱いは `docs/how-to-review-and-verify.md` を参照する。

- 各受入条件を ID で管理し、前提データ、操作または API request、期待結果、自動検証、手動レビュー方法を対応付ける。
- UI を変更する場合は、対象利用者が行う主要導線を少なくとも一つ定義し、可能な限り Playwright E2E test で自動化する。自動化できない場合は、理由と手動再現手順を PR に残す。
- backend API または domain logic を変更する場合は、正常系と主要な拒否・境界条件を対象 test または integration test で確認する。
- 起動確認はプロセスが port を開いたことだけでは足りない。対象の UI 操作または API request が期待結果を返すことまで確認する。
- Quality Reviewer と Product Reviewer は Implementer の結果を転載せず、PR の commit を対象に必要な確認を独立して行う。成果物には PR URL、base branch、reviewed head SHA、受入条件の Pass / Fail / 未検証、verdict を残す。
- Secret、token、個人情報、または副作用を伴う本番操作をレビュー手順・fixture・証跡に使わない。外部環境が必要で再現できない場合は、必要な環境と未検証理由を明示する。

## 変更後の品質確認・起動確認

コードを変更した場合は、作業完了前に必ず品質確認と起動確認を行う。以下のコマンドは、必ずプロジェクトルートで実行する。

```bash
yarn install --immutable
yarn prettier:check
yarn lint:all
yarn tsc:full
yarn test --watch=false
yarn start
```

UI 導線を変更した場合は、Playwright browser を準備して `yarn test:e2e` も実行する。E2E の browser が未導入なら `yarn exec playwright install chrome --no-shell` を一度実行する。常駐する `yarn start` は readiness と対象導線を確認した後に終了してよい。実行不能または失敗した必須確認は、成功扱いにせず PR と成果物に理由・影響・再現手順を記録する。

## 成果物

- メイン agent は各運営サイクルの最終記録を `docs/ai/output/cycle/` に保存する。記録には Project goal、探索・選定の根拠、受入条件、Issue / PR URL、PR ごとの current head SHA、委譲判断、reviewer の成果物と verdict、merge または保留判断、未解決事項、次サイクルへの学びを含める。
- `.codex/agents/` の custom agent を使った場合、担当 agent は最終成果物を Markdown として `docs/ai/output/<agent-name>/` に保存する。
- ファイル名は `NNN-<内容を表すkebab-case名>.md` とし、`NNN` は保存先ごとに `001` から始まる 3 桁の連番とする。保存前に対象ディレクトリを確認し、既存の最大番号に 1 を加える。既存ファイルを上書きしない。
- 成果物の先頭には、タイトル、作成日、実施者または agent 名、依頼内容または対象範囲を記載する。見出し、本文、メタデータは日本語で記述する。コード、コマンド、ファイルパス、API 名などの固有表記は原文のままでよい。
- 一時的な調査ログや生のコマンド出力は保存せず、意思決定やレビューに必要な最終成果物だけを保存する。Secret、token、個人情報の値は成果物、レビュー、検証証跡に記録しない。
