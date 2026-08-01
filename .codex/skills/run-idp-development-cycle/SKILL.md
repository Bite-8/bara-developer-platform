---
name: run-idp-development-cycle
description: Run Bara Developer Platform's main-agent-led, resume-first development cycle through selection, implementation, fixed-SHA review, merge evaluation, and Issue reconciliation. Use when the user asks to develop, advance development, or run a development cycle.
---

# IDP 開発サイクルを実行する

この skill は、ユーザーの一般的な「開発して」「開発を進めて」依頼から暗黙起動する唯一の entry である。メイン agent が Bara Developer Platform の Project goal を、根拠のある delivery / discovery / maintenance に変換し、必要な実装・独立レビュー・merge 評価・Issue 収束まで進める。custom subagent は常駐の階層ではなく、独立した実装または検証コンテキストが価値を持つときにだけ使う。

## 開始条件と不変条件

ユーザーが「開発して」「開発を進めて」「開発サイクルを実行して」、または同等の意図を示したときに使う。`AGENTS.md` の製品判断時の必読コンテキストを読み、次を不変条件として扱う。

- Backstage の更新追従性と OSS plugin 互換性を保ち、独自機能は plugin / module / extension / configuration として設計する。
- IDP 利用者の UX を運用負荷より優先する。
- Issue 化は実装決定ではなく、Pull Request はレビュー・merge の代替ではない。
- PR 固有の implementation / review / cycle evidence は、対象 PR への追加 commit ではなく、PR body、Issue、または reviewed SHA を明記した GitHub comment / check に残す。
- Secret、個人情報、本番副作用、account 作成、購入、権限変更は根拠収集や検証で行わない。

「定期実行して」は scheduler intent として分離する。ユーザーがこの場で開発サイクル実行を求めていることが明らかな場合は本 skill を進めてよいが、時刻に基づく自動起動、外部 scheduler、GitHub Actions schedule、cron 設定は明示依頼なしに作らない。

## resume-first

新規探索や新規 Issue 選定より先に、未完了の開発サイクルを再開できるか確認する。

1. open Pull Request を確認し、Bara 開発サイクルの delivery unit に対応する PR がある場合は、current head SHA、review 状態、CI、mergeability、関連 Issue を確認する。
2. open Issue を確認し、直近のサイクルで選定済みまたはレビュー差し戻し中の delivery unit がある場合は、その Issue を優先候補にする。
3. 未完了 PR が merge gate 待ちなら `$merge-reviewed-pr` を使う。review 不足、CI failure、head mismatch、blocking finding がある場合は、新規探索ではなくその不足を解消する。
4. 未完了 Issue が実装待ちなら、選定を更新せず、その Issue の受入条件と最新コメントを cycle scope として扱う。不足する受入条件だけ `$select-product-outcome` で補足する。
5. 再開対象がない、または関連 Issue が明示的に defer / close されている場合だけ、新規探索・選定へ進む。

## delivery unit の既定範囲

既定では 1 delivery unit だけを選ぶ。複数 delivery unit を同じサイクルに含められるのは、次を全て満たす場合に限る。

- 各 delivery unit の利用者価値が独立し、一方の hold や failure が他方の merge 判断を妨げない。
- 変更ファイルの所有権または worktree を分離でき、実装担当同士が互いの変更を revert せず統合できる。
- 各 delivery unit に独立した Issue、受入条件、PR、validation、fixed-SHA review、merge / hold 判断を持たせられる。
- 並行化が cycle time を短縮し、複数化の理由と順序を Issue または PR body に残せる。

0 件も有効な結果である。選ぶべき delivery unit がない場合、または根拠が不足して実装が危険な場合は、作成・更新した Issue、根拠、次に必要な観測条件、実装しなかった理由を記録して終了する。

## サイクルを進める

1. resume-first の確認で再開対象を決める。再開対象があれば新規探索を省略し、関連 Issue / PR の不足を埋める。
2. 新規候補が必要な場合だけ `$discover-idp-opportunities` をメイン agent が実行し、実行中の製品、リポジトリ、backlog、直近のレビュー、必要な公開情報から read-only の候補レポートを作る。discovery は Issue を作成・更新しない。
3. `$select-product-outcome` をメイン agent が実行し、今回扱う 0 件または既定 1 件の成果、受入条件、非対象、リスク、成果仮説を決定する。selection だけが GitHub Issue の作成・更新を行う。
4. delivery unit ごとに実施形態を決める。小さな docs / configuration / 調査の変更はメイン agent が直接行ってよい。実装、テスト、複数ファイルの変更、または独立した実装コンテキストが有益なものは `implementer` に委譲する。並行実装は、複数化条件と ownership 分離を満たす場合に限る。
5. 変更がある delivery unit は、実施担当が focused validation、意図的な commit、push、通常の GitHub Pull Request 作成を行う。PR body には変更内容、影響、検証、残余リスク、受入条件ごとの Review guide、関連 Issue、immutable head commit SHA を残す。実装者の self-review は独立レビューではなく、approve / merge をしない。
6. PR head を固定して `quality-reviewer` を実行する。利用者の挙動、UI / UX、API contract、agent workflow、または成果仮説を変える PR では、同じ head に対して `product-reviewer` も並行して実行する。docs / internal configuration のみで利用者・runtime・agent の挙動を変えない場合は product review を省略できるが、理由を Issue または PR comment に残す。
7. reviewer は `PASS` / `FAIL` / `UNVERIFIED` の verdict と、AC ごとの `PASS` / `FAIL` / `UNVERIFIED` を reviewed SHA 付きで返す。`FAIL`、重要な `UNVERIFIED`、blocking finding、または head mismatch があれば、メイン agent は修正・再検証・PR head 更新を依頼または実施し、新しい head に対して必要な reviewer を再実行する。過去の head に対する `PASS` を新しい head に流用しない。
8. 全ての必要な review が同一の current head SHA を `PASS` とし、必須 CI が成功し、PR が merge 可能で、未解決の blocking finding がない場合だけ、メイン agent は `$merge-reviewed-pr` で merge を実行または merge queue に入れる。条件を満たさない場合は merge せず、次の作業を Issue または PR comment に記録する。

## evidence と終了条件

PR 固有 evidence の正本は GitHub に置く。Issue、PR body、または reviewed SHA 付き GitHub comment / check に、Project goal、確認した製品根拠、候補比較、選択結果、受入条件、PR URL、current head SHA、委譲判断、review verdict、merge / 保留の判断、未解決事項、次サイクルへの学びを記録する。

repo 内 docs は長寿命の製品判断、ADR、設計、運用ルールだけに使う。対象 PR に implementer / reviewer / cycle の PR 固有成果物を追加 commit しない。delivery unit は PR 作成で止めず、merge 後の Issue close / update、または明示的な保留・差し戻しまで判断を記録して終了する。
