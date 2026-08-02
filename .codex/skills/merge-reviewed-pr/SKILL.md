---
name: merge-reviewed-pr
description: Verify that a Pull Request's current head has passing independent reviews and required checks, then merge it or record why it cannot merge. Use only after a Bara IDP development-cycle review wave is complete.
---

# 独立レビュー済み Pull Request を merge する

メイン agent が、review の結論と実際の Pull Request 状態が同じ commit を対象にしていることを確認してから merge を実行し、関連 Issue を収束させるための内部 skill である。ユーザーの一般的な「開発して」依頼から単独で暗黙起動しない。GitHub の `Approve` 操作は必須にせず、独立 subagent の SHA 付き verdict、PR の最新状態、CI を組み合わせて判断する。

## merge 前に確認する

1. PR URL / 番号、base branch、current head SHA、mergeability、required checks を取得する。
2. PR body と関連 Issue の implementation evidence、quality review、必要に応じた product-review advice を読む。Quality review が current head SHA を明記していることを確認する。Product-review advice は、security / correctness finding を除き merge 条件にしない。旧 SHA の verdict や「docs-only」例外を流用しない。
3. 各受入条件と Quality Reviewer の verdict が `PASS` であることを確認する。`FAIL`、重要な `UNVERIFIED`、blocking finding、CI failure、conflict、または head SHA の不一致があれば merge しない。
4. PR body に Review guide、実行した検証、残余リスク、関連 Issue があり、SHA 付き reviewer verdict が GitHub comment / check またはメイン agent の現在の review wave に残ることを確認する。
5. branch protection または merge queue がある場合は、その仕組みを使う。直接 push で base branch を更新しない。

## merge または保留を記録する

条件を満たす場合は、リポジトリの許可された merge method で PR を merge するか merge queue に投入する。条件を満たさない場合は、PR を merge-ready と表現せず、欠けている review、check、再現手順、または修正を関連 Issue または PR comment に明記する。

merge または保留の GitHub evidence には少なくとも次を残す。

- PR URL、base branch、merge 対象の head SHA
- Quality review の verdict、reviewed SHA、GitHub comment / check。Product-review advice があれば、その扱い
- required checks と mergeability の確認結果
- merge method と merge commit SHA、または保留・差し戻し理由

merge 後は PR の最終状態と merge commit SHA を確認する。関連 Issue に結果、利用者価値、残余リスク、次サイクルへの学びを短く記録し、受入条件を満たした Issue を close する。部分完了または別の未完了 scope が残る場合は close せず、残る条件と次の作業を明記する。Secret、token、個人情報は記録しない。
