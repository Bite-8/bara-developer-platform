# Codex Project-local Agent System

このディレクトリは、Bara Developer Platform の開発サイクルで使う条件付き custom agent と再利用可能な skill を定義します。メイン agent が製品ゴール、機会探索、成果選定、配達の進行、review 統合、merge 判断を一貫して担い、custom agent は独立した実装・技術レビュー・製品レビューの視点が価値を持つ場合だけ使います。

## 役割と責務

| 担当               | 主な責務                                                                                                      | 使う場面                                       | 主な出力                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| メイン agent       | 製品ゴールの解釈、resume-first 判断、機会探索、backlog / 成果選定、委譲、レビュー結果の統合、merge / 保留判断 | すべての開発サイクル                           | Issue / PR 更新、review 統合、merge 判断             |
| `product-explorer` | 指定された architecture / integration / safety 判断の根拠を独立調査し、候補と根拠を返す                       | 調査結果が戻しにくい実装方針を変え得るとき     | read-only observation、候補、trade-off、未確認事項   |
| `implementer`      | 選択済み配達単位の実装、検証、commit / push、通常 PR の作成                                                   | 実装または独立した実装コンテキストが必要なとき | PR body / Issue 上の実装・検証 evidence、PR          |
| `quality-reviewer` | 同一 PR head の技術品質、安全性、回帰、Backstage 互換性を独立検証                                             | 変更 PR の merge 評価前                        | 固定 SHA への `PASS` / `FAIL` / `UNVERIFIED` verdict |
| `product-reviewer` | 同一 PR head の UI / UX、視覚的品質、機能の可能性について独立した助言を返す                                   | main agent が助言を必要とするとき              | 観測、懸念、次の experiment                          |

旧 `opportunity-proposer` と `product-owner` の意思決定責務は `$discover-idp-opportunities` と `$select-product-outcome` に置き、メイン agent が統合判断を行います。`product-explorer` は Product Owner の代わりではなく、指定された異なる lens で独立した根拠と案を返す read-only subagent です。

ユーザーの一般的な「開発して」「開発を進めて」依頼から暗黙起動する skill は `$run-idp-development-cycle` だけです。`$discover-idp-opportunities`、`$select-product-outcome`、`$merge-reviewed-pr` は run skill が明示的に使う内部手順、またはユーザーが個別 skill を明示した場合の手順として扱います。

## 開発サイクル

メイン agent は `$run-idp-development-cycle` に従い、未完了 PR / Issue の再開を最初に確認してから、粗いゴールを initiative、decision-ready backlog、coherent delivery wave、個別 delivery unit に分解し、実施、レビュー、merge 評価を行います。1 delivery unit は 1 Issue、原則 1 PR、独立した fixed-SHA gate を持ちますが、1 回の開発依頼は 1 PR で終了しません。依存が解けた ready unit は ownership または worktree を分け、利用可能な subagent 枠で原則並行実施します。各 PR の review / merge も全体を待たず並行し、枠が空いたら次の ready unit を補充します。実依存のある unit だけを predecessor merge 後に順次進め、wave 全体の収束まで継続します。詳細は `docs/how-to-plan-delivery-waves.md` を参照します。

Quality Reviewer は実装者の自己検証を転載せず、同じ immutable head SHA を確認して `PASS` / `FAIL` / `UNVERIFIED` の品質・安全 verdict を返します。PR head が変わった場合、その head への Quality review が完了するまで merge しません。Product Reviewer は通常の UI / UX・新機能の merge gate ではなく、必要時の助言です。メイン agent だけが `$merge-reviewed-pr` を使って最終的な merge または保留を判断します。GitHub の `Approve` 操作はこの運用の必須条件ではありません。

## evidence の置き場所

PR 固有の implementation evidence、AC matrix、validation、review verdict、merge / hold 判断は、対象 PR への追加 commit ではなく、PR body、関連 Issue、または reviewed SHA を明記した GitHub comment / check を正本とします。

`docs/ai/output/**` は過去サイクルの historical evidence として残します。新しい対象 PR に PR 固有成果物を追加 commit しません。repo に保存する文書は、製品方針、ADR、設計、運用ルールなど長寿命で PR head に依存しないものに限ります。

Agent 定義を追加・変更した後は、新しい Codex session で project-scoped configuration を読み込む。
