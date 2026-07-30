---
name: select-product-outcome
description: Select, issue, and record the delivery, discovery, or maintenance outcomes for a product operations cycle from evidence-backed candidates. Use when a Product Owner must compare IDP opportunity candidates and backlog Issues, define cycle priorities, acceptance conditions, and learning hypotheses, or turn product-review findings into the next cycle decision.
---

# 今回の運営サイクルの成果群を選定する

`$discover-idp-opportunities` により Opportunity Proposer が整理・Issue 化した候補と既存 backlog を、Implementer が PR として配達でき、Product Reviewer が観測できる成果群へ変換する。候補を比較し、今回の運営サイクルに含める delivery / discovery / maintenance の対象をゼロ件、1 件、または複数件選ぶ。運営サイクルを単一機能や単一 Issue に固定しない。

## 根拠を集める

次を必要な範囲で確認する。

- Project goal と `AGENTS.md`
- `docs/product/`、`docs/architecture/`、ADR、`docs/reviews/`
- 現在の実装、Git 履歴、未解決事項、最近の `docs/ai/output/` 成果物
- 最新の Opportunity Proposer の候補・backlog 探索レポート
- 実装・品質・製品レビューの証跡、既存 Pull Request、および必要なら実際に動かした製品の観測

事実、推論、未確認事項を分ける。証跡が不足していても停止せず、判断を変え得る不確実性だけを記録する。

## 候補を比較する

2〜4 個の、互いに独立して評価できる候補または backlog item を作る。各候補について、次を一貫した粒度で記す。

- 対象利用者と利用者価値
- 解く課題と成果仮説
- 受入条件と観測方法。各条件には、安全な fixture / 前提、利用者操作または API request、期待結果、自動検証、独立 reviewer の手動確認方法を持たせる。
- 非対象、依存関係、主なリスク
- 学習価値、緊急性、確信度、可逆性、実装規模

価値と学習価値を優先する。重要なトレードオフが残っても、今回の運営サイクルで検証する成果群を選び、順序と依存関係を明示する。実装しない discovery、maintenance、または対象なしの判断も有効な結果とする。

## GitHub Issue を管理する

候補ごとに既存の open / closed GitHub Issue を検索し、同じ利用者課題と期待成果を扱うものがないかを確認する。重複する場合は既存 Issue を再利用し、必要なら根拠と受入条件を補足する。

新規かつ decision-ready な候補に Issue がない場合は、Product Owner が GitHub Issue を作成する。通常は Opportunity Proposer により Issue が作成済みなので、その Issue を再利用・更新する。Issue には少なくとも次を記載する。

- 対象利用者と解く課題または機会
- 期待する製品成果と利用者価値
- 根拠と関連する repository evidence
- 受入条件と観測方法
- 非対象、依存関係、リスク

価値は見込めるが重要な不確実性が残る候補は discovery Issue にする。調査すべき問い、集める証跡、調査後に下す判断を明記する。確認できた既存 label のみを使い、label を推測して作らない。

## 決定記録を作る

以下を含む完成版 Markdown を `docs/ai/output/product-owner/` の次の連番で保存し、Implementer と Reviewer に渡す。

```markdown
# 今回の運営サイクルの成果群の決定

- 作成日: YYYY-MM-DD
- Agent: product-owner
- Project goal: <粗いゴール>

## 根拠

<確認した事実、推論、重要な未確認事項>

## 候補比較

| 候補 | 利用者価値 | 学習価値 | リスク | 選択判断 |
| ---- | ---------- | -------- | ------ | -------- |

## 選択した運営サイクルの成果群

<今回扱う delivery / discovery / maintenance の対象、順序、対象外を一文で表す>

### 選択理由と対象利用者価値

<理由>

### 受入条件

| ID   | 受入条件                   | 前提データ・fixture         | 操作または request          | 期待結果         | 自動検証          | Reviewer の観測方法 |
| ---- | -------------------------- | --------------------------- | --------------------------- | ---------------- | ----------------- | ------------------- |
| AC-1 | <利用者から観測できる条件> | <安全な sample data / 設定> | <UI 操作または API request> | <観測可能な結果> | <test 種別・対象> | <再現手順>          |

UI を変更する delivery では主要な利用者導線を少なくとも一つ含め、Playwright E2E test を原則とする。backend API / domain logic の delivery では正常系と主要な拒否・境界条件を含める。外部環境が必要で自動化できない場合は、その理由と reviewer が確認可能な代替証跡を明記する。単に「起動する」「test が通る」だけを受入条件にしない。

### 非対象

- <今回含めない範囲>

### リスクと軽減策

- <リスク>: <軽減策または観測方法>

### 成果仮説

<成果が利用者価値を生む理由と、Product Reviewer が確認する証跡>

## GitHub Issue と配達単位

- Issue: <作成または再利用した Issue URL を成果ごとに記載>
- 種別: <delivery / discovery / maintenance>
- 優先順位・依存関係: <今回の順序と、PR に分ける必要がある場合の境界>
- 重複確認: <確認した Issue と再利用または新規作成の判断>

## Implementer・Reviewer への引き継ぎ

<各 delivery unit の Issue、受入条件表、safe fixture、関連証跡、PR Review guide 作成要件、未解決事項>
```

決定後は実装方法を詳細化しない。各配達単位の技術的な分解は Implementer が行い、Product Owner は受入条件と優先順位の変更が必要なときだけ判断する。
