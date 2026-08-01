---
name: run-idp-development-cycle
description: Run Bara Developer Platform's main-agent-led development cycle from product discovery through independent review and merge evaluation. Use when the user asks to develop, advance development, or run a development cycle.
---

# IDP 開発サイクルを実行する

この skill はメイン agent が Bara Developer Platform の Project goal を、根拠のある delivery / discovery / maintenance に変換し、必要な実装・独立レビュー・merge 評価まで完結させるための運用方法である。custom subagent は常駐の階層ではなく、独立した実装または検証コンテキストが価値を持つときにだけ使う。

## 開始条件と不変条件

ユーザーが「開発して」「開発を進めて」「開発サイクルを実行して」「定期実行して」、または同等の意図を示したときに使う。`AGENTS.md` の製品判断時の必読コンテキストを読み、次を不変条件として扱う。

- Backstage の更新追従性と OSS plugin 互換性を保ち、独自機能は plugin / module / extension / configuration として設計する。
- IDP 利用者の UX を運用負荷より優先する。
- Issue 化は実装決定ではなく、Pull Request はレビュー・merge の代替ではない。
- Secret、個人情報、本番副作用、account 作成、購入、権限変更は根拠収集や検証で行わない。

## サイクルを進める

1. `$discover-idp-opportunities` をメイン agent が実行し、実行中の製品、リポジトリ、backlog、直近のレビュー、必要な公開情報から候補を探索する。候補は重複確認後に Issue として作成または更新する。候補がない判断も記録する。
2. `$select-product-outcome` をメイン agent が実行し、今回扱う成果群、順序、受入条件、非対象、リスク、成果仮説を決定する。受入条件は reviewer が PR head から再現できる形にする。
3. 各 delivery unit ごとに実施形態を決める。小さな docs / configuration / 調査の変更はメイン agent が直接行ってよい。実装、テスト、複数ファイルの変更、または独立した実装コンテキストが有益なものは `implementer` に委譲する。並行実装はファイル所有権または worktree を分けられる場合に限る。
4. 変更がある delivery unit は、実施担当が focused validation、意図的な commit、push、通常の GitHub Pull Request 作成を行う。PR 本文と実装成果物には Review guide、PR URL、head commit SHA、残余リスクを残す。PR を作成した担当者は approve / merge しない。
5. PR head を固定して `quality-reviewer` を実行する。利用者の挙動、UI / UX、API contract、または成果仮説を変える PR では、同じ head に対して `product-reviewer` も並行して実行する。docs / internal configuration のみで利用者挙動を変えない場合は、product review を省略できるが、理由を cycle record に残す。
6. reviewer が Fail、重要な未検証、または blocking finding を報告した場合、メイン agent は修正・再検証・PR head 更新を依頼または実施し、変更された head に対して必要な reviewer を再実行する。過去の head に対する Pass を新しい head に流用しない。
7. 全ての必要な review が同一の current head SHA を Pass とし、必須 CI が成功し、PR が merge 可能で、未解決の blocking finding がない場合だけ、メイン agent は `$merge-reviewed-pr` で merge を実行または merge queue に入れる。GitHub の `Approve` 操作は必須ではない。条件を満たさない場合は merge せず、次の作業を記録する。

## 成果物と終了条件

メイン agent は `docs/ai/output/cycle/` に運営サイクル記録を保存する。少なくとも、Project goal、確認した製品根拠、候補比較、選択結果、受入条件、Issue / PR URL、各 PR の current head SHA、委譲判断、レビュー成果物と verdict、merge / 保留の判断、未解決事項、次サイクルへの学びを記載する。

custom agent を使った場合は、各 agent も `docs/ai/output/<agent-name>/` に成果物を保存する。delivery unit は PR 作成で止めず、merge または明示的な保留・差し戻しまで判断を記録して終了する。
