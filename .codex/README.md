# Codex Project-local Agent System

このディレクトリは、Bara Developer Platform の Project-local な自律製品開発サイクルを定義します。最終判断者は Project goal を与え、Project 内の Agent が次の製品成果の選択から実装、検証、レビュー、次サイクルへの学習までを完結させます。

## 役割と責務

| 役割                   | 主な責務                                                                 | 入力                                               | 主な出力                                         |
| ---------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------ |
| `product-owner`        | 次の小さな製品成果を選び、価値・受入条件・非対象・リスク・仮説を決定する | Project goal、設計原則、実装、レビュー、既存成果物 | `docs/ai/output/product-owner/` の決定記録       |
| `project-manager`      | 決定済み成果を実行可能な単位へ分解し、配達サイクルを完結させる           | Product Owner の決定記録                           | `docs/ai/output/project-manager/` のサイクル記録 |
| `improvement-proposer` | Product Owner 向けに根拠と候補を整理する                                 | リポジトリ、レビュー、未解決事項                   | 候補・比較レポート                               |
| `implementer`          | Project Manager の work item を実装し、検証する                          | 実行計画、受入条件                                 | 実装・検証記録                                   |
| `quality-reviewer`     | 独立して品質・安全性・回帰リスクを検証する                               | 決定、実装、検証証跡                               | 品質レビュー                                     |
| `product-reviewer`     | 成果と受入条件を製品観点で検証し、次サイクルの学習を返す                 | 決定、実装、品質証跡、動作観測                     | 製品レビュー                                     |

`product-review-packager` は廃止し、`product-reviewer` に置き換えました。人間向けの資料作成ではなく、Agent 自身が成果を検証し、Product Owner へのフィードバックを作ります。

## 開発サイクル

1. `product-owner` は `$select-product-outcome` を使い、Project goal と証跡から次の製品成果を決定して保存する。
2. `project-manager` は決定記録だけを起点に work item と検証計画を作る。
3. `implementer` が work item を実装して証跡を保存する。
4. `quality-reviewer` が独立してレビューする。必要な修正と再レビューは `project-manager` が調整する。
5. `product-reviewer` が受入条件、実装、品質証跡、動作をレビューする。
6. `project-manager` はサイクル記録を保存し、`product-reviewer` の発見を次の `product-owner` の入力としてリンクする。

center への逐次報告は行いません。center と最終判断者は Git 履歴、検証証跡、`docs/ai/output/`、未解決事項を後から観測します。最終判断者と center はこのサイクルの製品レビュー担当ではありません。

## 自律性

すべての Project-local Subagent は sandbox 内でゴール達成に必要な操作を自律的に行います。役割は、操作権限の制限ではなく、判断・実装・検証の観点を分けるものです。不確実性、複数の妥当な戦略、通常の依存関係、役割名、権限確認は停止理由にしません。利用可能な証跡から最善の判断を行い、次の検証可能な一歩を選びます。

Secret、token、個人情報の値は成果物・レビュー・検証証跡に残しません。

## 成果物

各 agent は、最終的に必要な完成版だけを次の規約で保存します。

```text
docs/ai/output/<agent-name>/NNN-<descriptive-kebab-case-name>.md
```

- agent ごとに `001` から連番にし、既存ファイルを上書きしない。
- タイトル、作成日、agent 名、対象範囲を先頭に置く。
- 見出し、本文、メタデータは日本語で記述する。
- 生のコマンド出力、一時ログ、Secret、token、個人情報は保存しない。

Agent 定義を追加・変更した後は、新しい Codex session で project-scoped configuration を読み込む。
