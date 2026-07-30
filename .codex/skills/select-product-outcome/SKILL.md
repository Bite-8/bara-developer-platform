---
name: select-product-outcome
description: Select and record the next small product outcome from an abstract Project goal using repository, product, review, and validation evidence. Use when a Product Owner must compare outcome candidates, define acceptance conditions and a learning hypothesis, or turn product-review findings into the next delivery decision.
---

# 次の製品成果を選定する

抽象的な Project goal を、Project Manager が実行でき、結果を Product Reviewer が観測できる小さな製品成果へ変換する。候補を比較して一つを選び、選択理由と検証可能な仮説を決定記録に残す。

## 根拠を集める

次を必要な範囲で確認する。

- Project goal と `AGENTS.md`
- `docs/product/`、`docs/architecture/`、ADR、`docs/reviews/`
- 現在の実装、Git 履歴、未解決事項、最近の `docs/ai/output/` 成果物
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

## Project Manager への引き継ぎ

<実行時に守る受入条件、関連証跡、未解決事項>
```

決定後は実装方法を詳細化しない。実行可能な単位への分解と Agent の順序は Project Manager が決める。
