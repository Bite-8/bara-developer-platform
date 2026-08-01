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
- `docs/product/ai-native-ux-principles.md`: Backstage UI を baseline として、Bara 固有 UX を仮説検証する原則、観測指標、AI interaction の評価境界。
- `docs/adr/0001-idp-management-source-of-truth.md`: Project / Environment / Template / runtime record の source of truth 境界。
- `docs/adr/0002-ai-action-approval-boundary.md`: AI action、approval、permission、audit の境界。
- `docs/backstage-extension-policy.md`: Backstage 拡張時の plugin / module / extension 方針。
- `docs/reviews/`: 直近の製品レビュー、未解決事項、次サイクルへの学習。
- `docs/ai/output/README.md`: 過去の AI 成果物の位置づけ。個別の `docs/ai/output/**` は historical evidence であり、通常の必読対象ではない。未完了 PR / Issue の再開、過去判断の確認、または reviewer から明示された証跡確認に必要な範囲だけ読む。

上記を読んでも判断に必要な証跡が不足する場合は、停止せず、利用可能な証跡から次に検証可能な小さな一歩を選び、未確認事項とリスクを Issue または PR evidence に明記する。

## 開発サイクルのトリガーと責務

ユーザーが「開発して」「開発を進めて」「開発サイクルを実行して」、または同等の意図を示した場合、メイン agent は `$run-idp-development-cycle` を唯一の暗黙起動 entry として使い、未完了 PR / Issue の再開を最初に確認してから次の一歩を進める。追加の確認は不要とする。

粗いゴールは、そのまま 1 PR に押し込まず、initiative、decision-ready backlog、今回の coherent delivery wave、個別 delivery unit へ分解する。1 delivery unit は 1 Issue、原則 1 PR、独立した validation、fixed-SHA review、merge / hold 判断を持つ。1 回の開発サイクルは 1 PR の作成で終了せず、選択した delivery wave の unit が merge、明示的 hold、または blocked に収束するまで進める。

delivery wave に複数 unit を含める場合、利用者価値、依存関係、順序、ファイル所有権、終了条件を記録する。依存が解け、所有ファイルまたは worktree を分けられる ready unit は、利用可能な subagent 枠で原則並行実施する。枠が空いたら dependency graph の次の ready unit を補充する。依存する unit だけを predecessor の merge 後に順次実施する。各 PR の CI、Quality / Product review、merge / hold 判断も他の ready PR を待たずに並行して進める。PR を巨大化したり、別 unit の failure を理由に各 PR の review / merge gate を省略したりしない。選ぶべき unit がない場合も有効な結果として、根拠、更新した Issue、次の観測条件を記録する。

decision-ready だが今回の wave に含めない候補は捨てず、GitHub Issue として価値、優先順位、依存関係、選外理由を残す。変化する backlog 状態は GitHub を正本とし、repo 内 docs に二重管理しない。分解と delivery wave の詳細は `docs/how-to-plan-delivery-waves.md` を正とする。

意味のある UI / UX、機能、architecture、外部 integration の不確実性がある場合は、最初の思いつきをそのまま実装しない。異なる evidence source と analysis lens を持つ複数 subagent で独立に調査・案出しし、メイン agent が候補、根拠、trade-off、未確認事項を比較して暫定推奨を選ぶ。subagent は初期案出しでは互いの結論を参照せず、anchoring と重複を避ける。暫定推奨と選ばなかった有力案は Issue に残し、owner と Product Reviewer が比較できるようにする。軽微な bug、機械的変更、既に受入条件で解法が決まっている変更に、形式的な複数案を要求しない。

「定期実行して」はスケジューラ設定の intent として扱う。ユーザーがこの場で開発サイクル実行を求めていることが明らかな場合だけ `$run-idp-development-cycle` を実行し、時刻に基づく自動起動を暗黙に構成しない。

詳細フローと内部 skill の使い分けは `.codex/skills/run-idp-development-cycle/SKILL.md` を正とする。`$discover-idp-opportunities`、`$select-product-outcome`、`$merge-reviewed-pr` は run skill から明示的に呼ぶ内部手順であり、ユーザーの一般的な「開発して」依頼から個別に暗黙起動しない。

## レビューと動作確認の契約

変更を伴う delivery unit は、reviewer が PR head から再現可能な動作確認計画を持たなければならない。詳細な形式、環境準備、証跡の扱いは `docs/how-to-review-and-verify.md` を参照する。

- 各受入条件を ID で管理し、前提データ、操作または API request、期待結果、自動検証、手動レビュー方法を対応付ける。
- 利用者向け変更には、製品所有者が preview または安全なローカル fixture で短時間に再現できる owner acceptance journey を定義する。
- UI を変更する場合は、対象利用者が行う主要導線を少なくとも一つ定義し、可能な限り Playwright E2E test で自動化する。自動化できない場合は、理由と手動再現手順を PR に残す。
- backend API または domain logic を変更する場合は、正常系と主要な拒否・境界条件を対象 test または integration test で確認する。
- production、永続データ、認証、権限、外部連携、migration、deployment に影響する変更は、relevant な rollout、rollback、backup / restore、observability、Secret 境界を受入条件または非対象・残余リスクに明記する。本番実行は開発サイクルに含めず、ユーザーの明示依頼と承認を必要とする。
- 起動確認はプロセスが port を開いたことだけでは足りない。対象の UI 操作または API request が期待結果を返すことまで確認する。
- PR 固有の実装・review evidence は、対象 PR への追加 commit ではなく、PR body、Issue、または reviewed SHA を明記した GitHub comment / check に残す。repo 内 docs は長寿命の製品判断、方針、設計記録に限る。
- Quality Reviewer と Product Reviewer は Implementer の結果を転載せず、PR の固定 commit を対象に必要な確認を独立して行う。結果は `PASS` / `FAIL` / `UNVERIFIED` に統一し、PR URL、base branch、reviewed head SHA、AC ごとの結果、verdict を GitHub comment / check またはメイン agent への返答に残す。PR head が変わった場合、旧 SHA の verdict を新 SHA に流用しない。
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

UI 導線を変更した場合は、Playwright browser を準備して `yarn test:e2e` も実行する。E2E の browser が未導入なら `yarn exec playwright install chrome --no-shell` を一度実行する。常駐する `yarn start` は readiness と対象導線を確認した後に終了してよい。実行不能または失敗した必須確認は、成功扱いにせず PR body、Issue、または reviewed SHA 付き GitHub comment / check に理由・影響・再現手順を記録する。

## 成果物

- repo に保存する成果物は、製品方針、ADR、設計、運用ルールなど長寿命の判断に限る。
- delivery unit 固有の実装 evidence、AC matrix、validation、review verdict、merge / hold 判断は、PR body、Issue、または reviewed SHA 付き GitHub comment / check を正本とする。
- historical evidence として残っている `docs/ai/output/**` は削除しないが、新しい PR 固有成果物を対象 PR に追加 commit しない。
- Secret、token、個人情報の値は成果物、レビュー、検証証跡に記録しない。
