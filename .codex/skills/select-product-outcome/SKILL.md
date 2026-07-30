---
name: select-product-outcome
description: Select, issue, and record the next small product outcome from evidence-backed candidates. Use when a Product Owner must compare IDP opportunity candidates, create or reuse a decision-ready GitHub Issue, define acceptance conditions and a learning hypothesis, or turn product-review findings into the next delivery decision.
---

# 次の製品成果を選定する

`$discover-idp-opportunities` または `improvement-proposer` が整理した根拠付き候補を、Project Manager が実行でき、Product Reviewer が観測できる小さな製品成果へ変換する。候補を比較して一つを選び、実行可能な仮説は GitHub Issue として backlog に残す。

## 根拠を集める

次を必要な範囲で確認する。

- Project goal と `AGENTS.md`
- `docs/product/`、`docs/architecture/`、ADR、`docs/reviews/`
- 現在の実装、Git 履歴、未解決事項、最近の `docs/ai/output/` 成果物
- 最新の `improvement-proposer` の候補レポート
- 実装・品質・製品レビューの証跡、および必要なら実際に動かした製品の観測

事実、推論、未確認事項を分ける。証跡が不足していても停止せず、判断を変え得る不確実性だけを記録する。

## 候補を比較する

2〜4 個の、互いに独立して評価できる小さな成果候補を作る。各候補について、次を一貫した粒度で記す。

- 対象利用者と利用者価値
- 解く課題と成果仮説
- 受入条件と観測方法
- 非対象、依存関係、主なリスク
- 学習価値、緊急性、確信度、可逆性、実装規模

価値と学習価値を優先する。重要なトレードオフが残っても、次に検証可能な一歩を一つ選ぶ。

## GitHub Issue を管理する

候補ごとに既存の open / closed GitHub Issue を検索し、同じ利用者課題と期待成果を扱うものがないかを確認する。重複する場合は既存 Issue を再利用し、必要なら根拠と受入条件を補足する。

新規かつ decision-ready な候補は、GitHub Issue を作成する。Issue には少なくとも次を記載する。

- 対象利用者と解く課題または機会
- 期待する製品成果と利用者価値
- 根拠と関連する repository evidence
- 受入条件と観測方法
- 非対象、依存関係、リスク

価値は見込めるが重要な不確実性が残る候補は discovery Issue にする。調査すべき問い、集める証跡、調査後に下す判断を明記する。確認できた既存 label のみを使い、label を推測して作らない。

## 決定記録を作る

以下を含む完成版 Markdown を `docs/ai/output/product-owner/` の次の連番で保存し、Project Manager に渡す。

```markdown
# 次の製品成果の決定

- 作成日: YYYY-MM-DD
- Agent: product-owner
- Project goal: <粗いゴール>

## 根拠

<確認した事実、推論、重要な未確認事項>

## 候補比較

| 候補 | 利用者価値 | 学習価値 | リスク | 選択判断 |
| ---- | ---------- | -------- | ------ | -------- |

## 選択した製品成果

<一文で表した成果>

### 選択理由と対象利用者価値

<理由>

### 受入条件

1. <利用者から観測できる条件>
2. <検証可能な条件>

### 非対象

- <今回含めない範囲>

### リスクと軽減策

- <リスク>: <軽減策または観測方法>

### 成果仮説

<成果が利用者価値を生む理由と、Product Reviewer が確認する証跡>

## GitHub Issue

- Issue: <作成または再利用した Issue URL>
- 種別: <delivery または discovery>
- 重複確認: <確認した Issue と再利用または新規作成の判断>

## Project Manager への引き継ぎ

<Issue URL、実行時に守る受入条件、関連証跡、未解決事項>
```

決定後は実装方法を詳細化しない。実行可能な単位への分解と Agent の順序は Project Manager が決める。
