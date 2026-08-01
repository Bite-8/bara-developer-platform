---
name: merge-reviewed-pr
description: Verify that a Pull Request's current head has passing independent reviews and required checks, then merge it or record why it cannot merge. Use only after a Bara IDP development-cycle review wave is complete.
---

# 独立レビュー済み Pull Request を merge する

メイン agent が、review の結論と実際の Pull Request 状態が同じ commit を対象にしていることを確認してから merge を実行するための skill である。GitHub の `Approve` 操作は必須にしない。独立した subagent の観測と成果物、PR の最新状態、CI を組み合わせて判断する。

## merge 前に確認する

1. PR URL / 番号、base branch、current head SHA、mergeability、required checks を取得する。
2. implementation artifact、quality review、必要な場合の product review を読む。全てが同じ current head SHA、またはその SHA を明示的に再確認した review を対象にしていることを確認する。
3. 各受入条件が Pass であることを確認する。Fail、重要な未検証、blocking finding、CI failure、conflict、または head SHA の不一致があれば merge しない。
4. PR 本文に Review guide、実行した検証、残余リスクがあり、reviewer 成果物への参照が cycle record に残ることを確認する。
5. branch protection または merge queue がある場合は、その仕組みを使う。直接 push で base branch を更新しない。

## merge または保留を記録する

条件を満たす場合は、リポジトリの許可された merge method で PR を merge するか merge queue に投入する。条件を満たさない場合は、PR を merge-ready と表現せず、欠けている review、check、再現手順、または修正を cycle record に明記する。

cycle record には少なくとも次を残す。

- PR URL、base branch、merge 対象の head SHA
- Quality review と Product review の成果物パス、verdict、reviewed SHA
- required checks と mergeability の確認結果
- merge method と merge commit SHA、または保留・差し戻し理由

merge 後は PR の最終状態を確認し、次サイクルに引き継ぐ未解決事項だけを記録する。Secret、token、個人情報は記録しない。
