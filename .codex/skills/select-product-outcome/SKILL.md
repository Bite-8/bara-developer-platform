---
name: select-product-outcome
description: Internal run-idp-development-cycle step. Select and issue the evidence-backed delivery, discovery, or maintenance outcome after read-only opportunity discovery.
---

# 今回の運営サイクルの成果群を選定する

`$discover-idp-opportunities` の read-only 候補と既存 backlog を、initiative、decision-ready backlog、coherent delivery wave、実装者が PR として配達できる delivery unit へ変換する。この skill だけが候補の GitHub Issue を作成・更新する。

この skill は `$run-idp-development-cycle` から明示的に呼ばれる内部手順である。ユーザーの一般的な「開発して」依頼から単独で暗黙起動しない。既定では 1 PR ではなく、共通の成果仮説へ収束する最小の coherent delivery wave を選ぶ。0 件は有効な結果とする。分解と選定は `docs/how-to-plan-delivery-waves.md` に従う。

## 根拠を集める

次を必要な範囲で確認する。

- Project goal と `AGENTS.md`
- `docs/product/`、`docs/architecture/`、ADR、`docs/reviews/`
- 現在の実装、Git 履歴、未解決事項、open Issue / Pull Request
- 最新の機会探索レポート、backlog、GitHub 上の実装・品質・製品レビュー evidence
- 必要なら実際に動かした製品の観測

事実、推論、未確認事項を分ける。証跡が不足していても停止せず、判断を変え得る不確実性だけを記録する。

## ゴールを分解して候補を比較する

粗い Project goal を一つの実装案へ直結させず、次の順序で分解する。

1. 対象利用者、解く課題、成果指標を持つ initiative を定義する。
2. UI / UX、frontend、backend / domain、integration、data / migration、security / permission、validation、operability の relevant な観点を調べる。
3. 独立して価値を観測できる delivery unit または判断を下す discovery unit に分ける。
4. predecessor / successor、並行可能性、所有ファイルまたは worktree、rollout 順序を dependency graph として記す。
5. 今回連続して進める最小の coherent delivery wave と、backlog に残す候補を分ける。

可逆な UI / UX unit と安全な新機能は `docs/product/ai-native-ux-principles.md` に従い、視覚的意図または試したい機能、確認 route または safe fixture、revert 方法だけを Issue に持たせればよい。baseline observation、変更仮説、比較 interaction、成功指標は任意である。AI chat、recommended-action card、guided workflow など特定 UI pattern は、唯一解を主張せず試してよい。

discovery が複数の solution option を返し、戻しにくい判断がある場合は、候補を根拠、利用者価値、trade-off、Backstage / architecture 適合性、検証可能性、可逆性で比較する。メイン agent は現時点の暫定推奨を明示して delivery wave を選ぶ。可逆な UI / feature は、prototype や feature flag を強制せず標準導線へ直接出してよい。

利用可能な候補または backlog item を、互いに独立して評価できる粒度で比較する。各候補について、次を一貫した粒度で記す。

- 対象利用者と利用者価値
- 解く課題と成果仮説
- 受入条件と観測方法。各条件には、安全な fixture / 前提、利用者操作または API request、期待結果、自動検証、独立 reviewer の手動確認方法を持たせる。
- 非対象、依存関係、主なリスク
- 学習価値、緊急性、確信度、可逆性、実装規模
- 確認 route または safe fixture、短い変更意図、revert 方法
- production / operability 影響。永続化、migration、認証、権限、Secret、外部依存、rollout、rollback、backup / restore、observability のうち relevant な項目

IDP 利用者の UX と観測可能な利用者価値を、運用負荷の削減より優先する。運用改善は、それ自体が UX、安全性、または継続提供能力をどのように支えるかを示せるときに選ぶ。重要なトレードオフが残っても、今回の delivery wave と backlog を選び、順序と依存関係を明示する。実装しない discovery、maintenance、または対象なしの判断も有効な結果とする。

## GitHub Issue を管理する

候補ごとに既存の open / closed GitHub Issue を検索し、同じ利用者課題と期待成果を扱うものがないかを確認する。重複する場合は既存 Issue を再利用し、必要なら根拠と受入条件を補足する。

新規かつ decision-ready な候補に Issue がない場合は、今回の wave の選外であっても GitHub Issue を作成する。重複 Issue を量産しないよう候補を同じ利用者課題で統合し、Issue には少なくとも次を記載する。

- 対象利用者と解く課題または機会
- 期待する製品成果と利用者価値
- 根拠と関連する repository evidence
- 受入条件と観測方法
- 非対象、依存関係、リスク
- initiative / delivery wave との関係、優先順位、選択または選外理由
- 確認 route と relevant な production / operability 影響

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

## Initiative と dependency graph

- Initiative:
- 対象利用者・成果指標:
- Dependency graph:
- 今回の delivery wave 終了条件:

## Solution options と暫定推奨

| Option | 根拠 | 利用者価値 | Trade-off | 検証方法 | 選択判断 |
| ------ | ---- | ---------- | --------- | -------- | -------- |

- 暫定推奨と確信度:
- 選ばなかった有力案:
- 判断を変える追加証拠:
- 複数案を省略した場合の理由:

## 今回の delivery wave

### <delivery unit 名>

- Issue:
- 種別: delivery / discovery / maintenance
- predecessor / successor:
- 実施順序: parallel group / sequential position
- 所有ファイルまたは worktree:

#### 受入条件

| ID   | 受入条件                   | 前提データ・fixture         | 操作または request          | 期待結果         | 自動検証          | Reviewer の観測方法 |
| ---- | -------------------------- | --------------------------- | --------------------------- | ---------------- | ----------------- | ------------------- |
| AC-1 | <利用者から観測できる条件> | <安全な sample data / 設定> | <UI 操作または API request> | <観測可能な結果> | <test 種別・対象> | <再現手順>          |

#### 確認 route / operability

- 確認 route または safe fixture:
- 変更意図と revert 方法:
- Production / operability 影響:
- Rollout / rollback:

#### 非対象・リスク・成果仮説

<今回含めない範囲、軽減策、利用者価値を確認する証跡>

## Backlog に残す decision-ready 候補

| Issue | 種別 | 優先順位 | 依存関係 | 今回の選外理由 | 次の観測条件 |
| ----- | ---- | -------- | -------- | -------------- | ------------ |
```

決定後は、各 delivery unit の技術的な分解を実施担当に委ねる。unit 間の成果境界、受入条件、優先順位、依存関係、wave 終了条件、または非対象を変える場合だけ、選定を更新する。
