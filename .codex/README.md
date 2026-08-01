# Codex Project-local Agent System

このディレクトリは、Bara Developer Platform の開発サイクルで使う条件付き custom agent と再利用可能な skill を定義します。メイン agent が製品ゴール、機会探索、成果選定、配達の進行、merge 判断を一貫して担い、custom agent は独立した実装・技術レビュー・製品レビューの視点が価値を持つ場合だけ使います。

## 役割と責務

| 担当               | 主な責務                                                                                   | 使う場面                                            | 主な出力                             |
| ------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------ |
| メイン agent       | 製品ゴールの解釈、機会探索、backlog / 成果選定、委譲、レビュー結果の統合、merge / 保留判断 | すべての開発サイクル                                | cycle record、Issue 更新、merge 判断 |
| `implementer`      | 選択済み配達単位の実装、検証、commit / push、通常 PR の作成                                | 実装または独立した実装コンテキストが必要なとき      | 実装・検証記録、PR                   |
| `quality-reviewer` | 同一 PR head の技術品質、安全性、回帰、Backstage 互換性を独立検証                          | 変更 PR の merge 評価前                             | 品質レビュー                         |
| `product-reviewer` | 同一 PR head の利用者価値、UI / UX、API contract、受入条件を独立検証                       | 利用者挙動または成果仮説を変える PR の merge 評価前 | 製品レビューと学び                   |

`opportunity-proposer` と `product-owner` は custom agent としては廃止し、役割の方法を `$discover-idp-opportunities` と `$select-product-outcome` に移しました。これによりメイン agent も同じ手順を実行でき、常に subagent を起動する必要がありません。

## 開発サイクル

メイン agent は `$run-idp-development-cycle` に従い、探索、選定、実施、レビュー、merge 評価を行います。小さな docs / configuration / 調査は直接行えます。実装は `implementer` に委譲でき、review は PR head が固定された後に `quality-reviewer` と、必要な場合の `product-reviewer` を並行して実施します。

両 reviewer は実装者の自己検証を転載せず、同じ immutable head SHA を確認して verdict を記録します。PR head が変わった場合、その head への必要な再レビューが完了するまで merge しません。メイン agent だけが `$merge-reviewed-pr` を使って最終的な merge または保留を判断します。GitHub の `Approve` 操作はこの運用の必須条件ではありません。

## 成果物

```text
docs/ai/output/cycle/NNN-<descriptive-kebab-case-name>.md
docs/ai/output/<agent-name>/NNN-<descriptive-kebab-case-name>.md
```

- メイン agent は cycle record を `cycle/` に、custom agent は自身の `name` のディレクトリに保存する。
- 保存先ごとに `001` から連番にし、既存ファイルを上書きしない。
- タイトル、作成日、実施者または agent 名、対象範囲を先頭に置き、見出し・本文・メタデータは日本語で記述する。
- 生のコマンド出力、一時ログ、Secret、token、個人情報は保存しない。

Agent 定義を追加・変更した後は、新しい Codex session で project-scoped configuration を読み込む。
