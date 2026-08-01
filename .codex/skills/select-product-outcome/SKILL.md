---
name: select-product-outcome
description: Internal run-idp-development-cycle step. Select and issue the evidence-backed delivery, discovery, or maintenance outcome after read-only opportunity discovery.
---

# 今回の運営サイクルの成果群を選定する

`$discover-idp-opportunities` の read-only 候補と既存 backlog を、実装者が PR として配達でき、独立 reviewer が観測できる成果へ変換する。この skill だけが候補の GitHub Issue を作成・更新する。

この skill は `$run-idp-development-cycle` から明示的に呼ばれる内部手順である。ユーザーの一般的な「開発して」依頼から単独で暗黙起動しない。既定では対象を 1 delivery unit に限定する。0 件は有効な結果とし、複数件は run skill の複数化条件を全て満たす場合だけ選ぶ。

## 根拠を集める

次を必要な範囲で確認する。

- Project goal と `AGENTS.md`
- `docs/product/`、`docs/architecture/`、ADR、`docs/reviews/`
- 現在の実装、Git 履歴、未解決事項、open Issue / Pull Request
- 最新の機会探索レポート、backlog、GitHub 上の実装・品質・製品レビュー evidence
- 必要なら実際に動かした製品の観測

事実、推論、未確認事項を分ける。証跡が不足していても停止せず、判断を変え得る不確実性だけを記録する。

## 候補を比較する

利用可能な候補または backlog item を、互いに独立して評価できる粒度で比較する。各候補について、次を一貫した粒度で記す。

- 対象利用者と利用者価値
- 解く課題と成果仮説
- 受入条件と観測方法。各条件には、安全な fixture / 前提、利用者操作または API request、期待結果、自動検証、独立 reviewer の手動確認方法を持たせる。
- 非対象、依存関係、主なリスク
- 学習価値、緊急性、確信度、可逆性、実装規模

IDP 利用者の UX と観測可能な利用者価値を、運用負荷の削減より優先する。運用改善は、それ自体が UX、安全性、または継続提供能力をどのように支えるかを示せるときに選ぶ。重要なトレードオフが残っても、今回の運営サイクルで検証する成果群を選び、順序と依存関係を明示する。実装しない discovery、maintenance、または対象なしの判断も有効な結果とする。

## GitHub Issue を管理する

候補ごとに既存の open / closed GitHub Issue を検索し、同じ利用者課題と期待成果を扱うものがないかを確認する。重複する場合は既存 Issue を再利用し、必要なら根拠と受入条件を補足する。

新規かつ decision-ready な候補に Issue がない場合は、GitHub Issue を作成する。Issue には少なくとも次を記載する。

- 対象利用者と解く課題または機会
- 期待する製品成果と利用者価値
- 根拠と関連する repository evidence
- 受入条件と観測方法
- 非対象、依存関係、リスク

価値は見込めるが重要な不確実性が残る候補は discovery Issue にする。調査すべき問い、集める証跡、調査後に下す判断を明記する。確認できた既存 label のみを使い、label を推測して作らない。

## 決定を GitHub Issue に記録する

選定した成果は GitHub Issue の body または comment に次の内容で記録する。対象 PR に選定記録を追加 commit しない。repo に保存するのは ADR など長寿命の製品判断が必要な場合だけに限る。

```markdown
# 今回の運営サイクルの成果群の決定

- 作成日: YYYY-MM-DD
- 実施者: <main-agent または agent-name>
- Project goal: <粗いゴール>

## 根拠

<確認した事実、推論、重要な未確認事項>

## 候補比較

| 候補 | 利用者価値 | 学習価値 | リスク | 選択判断 |
| ---- | ---------- | -------- | ------ | -------- |

## 選択した運営サイクルの成果群

### 受入条件

| ID   | 受入条件                   | 前提データ・fixture         | 操作または request          | 期待結果         | 自動検証          | Reviewer の観測方法 |
| ---- | -------------------------- | --------------------------- | --------------------------- | ---------------- | ----------------- | ------------------- |
| AC-1 | <利用者から観測できる条件> | <安全な sample data / 設定> | <UI 操作または API request> | <観測可能な結果> | <test 種別・対象> | <再現手順>          |

### 非対象・リスク・成果仮説

<今回含めない範囲、軽減策、利用者価値を確認する証跡>

## GitHub Issue と delivery unit

- Issue:
- 種別: delivery / discovery / maintenance
- 優先順位・依存関係:
- 実施形態: main agent が直接実施 / implementer に委譲
```

決定後は、各配達単位の技術的な分解を実施担当に委ねる。受入条件、優先順位、または非対象を変える場合だけ、選定を更新する。
