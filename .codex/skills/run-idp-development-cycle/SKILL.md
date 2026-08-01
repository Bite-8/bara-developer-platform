---
name: run-idp-development-cycle
description: Run Bara Developer Platform's main-agent-led, resume-first development cycle through selection, implementation, fixed-SHA review, merge evaluation, and Issue reconciliation. Use when the user asks to develop, advance development, or run a development cycle.
---

# IDP 開発サイクルを実行する

この skill は、ユーザーの一般的な「開発して」「開発を進めて」依頼から暗黙起動する唯一の entry である。メイン agent が Bara Developer Platform の粗い Project goal を、initiative、decision-ready backlog、coherent delivery wave、個別 delivery unit に分解し、必要な実装・独立レビュー・merge 評価・Issue 収束まで進める。custom subagent は常駐の階層ではなく、独立した実装または検証コンテキストが価値を持つときにだけ使う。

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

resume-first は既存 wave を新規 discovery より優先する規則であり、一つの PR だけへ全 subagent を直列化する規則ではない。既存 wave の dependency graph を復元し、未完了 PR の修正・再 review と依存しない ready unit を、ownership または worktree を分けて並行再開する。未完了 PR を持つ unit の downstream だけは、その PR が current head で gate を通るまで開始しない。

## delivery wave と delivery unit

既定の実施範囲は 1 PR ではなく、共通の成果仮説へ収束する coherent delivery wave とする。分解規則は `docs/how-to-plan-delivery-waves.md` に従う。

- initiative は粗いゴールと成果指標を表し、それ自体を巨大 PR にしない。
- delivery wave は今回連続して前進させる unit 群であり、価値、依存グラフ、順序、終了条件を持つ。
- delivery unit は 1 Issue、原則 1 PR、独立した受入条件、validation、fixed-SHA review、merge / hold 判断を持つ。
- dependency graph 上で依存が解け、所有ファイルまたは worktree を分離できる ready unit は、利用可能な subagent 枠で原則並行実施する。枠が空いたら次の ready unit を補充する。依存する unit だけを predecessor の merge 後に順次実施する。
- 一つの unit の hold / failure は、その unit と downstream dependency を止めるが、依存しない unit の review / merge を妨げない。
- 各 PR の実装完了を全 unit で待ち合わせない。PR ごとに Quality / Product review と merge 評価を開始し、他の ready unit の実装・review と並行して進める。ここでいう独立 gate は全体を直列化する関所ではなく、各 PR の failure を局所化する境界である。
- decision-ready だが今回選外の候補は GitHub backlog に残し、選外理由、優先順位、依存関係を記録する。

wave は無制限に広げない。利用者価値が一文で説明でき、unit 間の依存関係と終了条件が明確で、各 unit を個別に検証・merge できる最小の成果群を選ぶ。0 件も有効な結果である。選ぶべき unit がない場合、または根拠が不足して実装が危険な場合は、作成・更新した Issue、根拠、次に必要な観測条件、実装しなかった理由を記録する。

## サイクルを進める

1. resume-first の確認で再開対象を決める。再開対象があれば新規探索を省略し、関連 Issue / PR の不足を埋める。
2. 新規候補が必要な場合だけ `$discover-idp-opportunities` をメイン agent が実行し、実行中の製品、リポジトリ、backlog、直近のレビュー、必要な公開情報から read-only の候補レポートを作る。解法に意味のある不確実性がある場合は、異なる journey / source / analysis lens を持つ `product-explorer` を利用可能な枠で並行起動し、独立調査を発散させる。メイン agent が 2〜4 案、trade-off、暫定推奨へ統合する。discovery は Issue を作成・更新しない。
3. `$select-product-outcome` をメイン agent が実行し、initiative、decision-ready backlog、今回扱う 0 件以上の coherent delivery wave、各 unit の受入条件、依存関係、非対象、リスク、成果仮説、終了条件を決定する。selection だけが GitHub Issue の作成・更新を行う。decision-ready な選外候補も Issue に残す。
4. delivery unit ごとに実施形態を決める。小さな docs / configuration / 調査の変更はメイン agent が直接行ってよい。実装、テスト、複数ファイルの変更、または独立した実装コンテキストが有益なものは unit ごとに `implementer` に委譲する。ready unit は ownership または worktree を分け、利用可能な subagent 枠まで同時に起動する。メイン agent も競合しない unit または統合を進め、枠が空いたら次の ready unit を補充する。依存 unit は predecessor の merge 後に順次実装する。
5. 変更がある delivery unit は、実施担当が focused validation、意図的な commit、push、通常の GitHub Pull Request 作成を行う。PR body には変更内容、影響、検証、残余リスク、受入条件ごとの Review guide、関連 Issue、immutable head commit SHA を残す。実装者の self-review は独立レビューではなく、approve / merge をしない。
6. 各 PR は他 unit の実装完了を待たず、head を固定できた時点で `quality-reviewer` を実行する。利用者の挙動、UI / UX、API contract、agent workflow、または成果仮説を変える PR では、同じ head に対して `product-reviewer` も並行して実行する。複数 PR の reviewer wave も利用可能な枠で並行する。docs / internal configuration のみで利用者・runtime・agent の挙動を変えない場合は product review を省略できるが、理由を Issue または PR comment に残す。
7. reviewer は `PASS` / `FAIL` / `UNVERIFIED` の verdict と、AC ごとの `PASS` / `FAIL` / `UNVERIFIED` を reviewed SHA 付きで返す。`FAIL`、重要な `UNVERIFIED`、blocking finding、または head mismatch があれば、メイン agent は修正・再検証・PR head 更新を依頼または実施し、新しい head に対して必要な reviewer を再実行する。過去の head に対する `PASS` を新しい head に流用しない。
8. 全ての必要な review が同一の current head SHA を `PASS` とし、必須 CI が成功し、PR が merge 可能で、未解決の blocking finding がない場合だけ、メイン agent は `$merge-reviewed-pr` で merge を実行または merge queue に入れる。条件を満たさない場合は merge せず、次の作業を Issue または PR comment に記録する。
9. unit が merge または明示的 hold に収束したら dependency graph を更新する。ready になった次の unit があれば同じ開発依頼の中で手順 4 へ戻る。1 PR の作成・merge だけをサイクル終了条件にしない。

## subagent の委譲と監視

メイン agent は orchestration context を抱え、subagent には unit を完了するための最小契約だけを渡す。委譲 prompt には、Issue / AC、exact task、読む入力、所有ファイルまたは worktree、期待する artifact、validation、停止条件を含める。initiative 全体の優先順位付け、他 unit の merge 判断、下流の orchestration を subagent に推測させない。

write-heavy な並行 unit は同じ working tree で実施せず、worktree または明確に分離された所有ファイルを使う。探索、test、review、log 分析など read-heavy な作業は、context pollution を避けるため積極的に subagent へ分ける。同じ prompt の agent 数を増やすより、implementer、Quality Reviewer、Product Reviewer のように異なる観測目的を持たせる。

各委譲について、unit または research lens、role、branch / worktree、所有範囲または source scope、初期 prompt で sibling 結論を除外したか、期待 artifact、開始状態、最終 status、停止理由の receipt をメイン agent が追跡する。一定時間、tool activity、編集、status 応答のいずれも観測できない場合は status を要求し、応答しなければ interrupt して再委譲またはメイン agent が引き継ぐ。沈黙を成功または failure と推測しない。

## evidence と終了条件

PR 固有 evidence の正本は GitHub に置く。Issue、PR body、または reviewed SHA 付き GitHub comment / check に、Project goal、initiative、delivery wave、依存関係、確認した製品根拠、候補比較、選択結果、受入条件、PR URL、current head SHA、委譲判断、review verdict、merge / 保留の判断、未解決事項、次サイクルへの学びを記録する。

repo 内 docs は長寿命の製品判断、ADR、設計、運用ルールだけに使う。対象 PR に implementer / reviewer / cycle の PR 固有成果物を追加 commit しない。delivery wave は、全 unit が次のいずれかへ個別に収束した場合に終了する: 受入条件を満たして merge / close、理由と再開条件を記録した hold / defer、または外部権限・ユーザー判断・安全境界などの block と影響する downstream / 再開条件を GitHub に記録した状態。未実装の close を完了扱いにしない。ready な unit、未記録の候補、未収束の Issue / PR が残る状態で「1 PR 完了」を理由に終了しない。本番 deploy、外部購入、account / permission 変更は wave の暗黙の終了操作に含めない。
