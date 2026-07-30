# Codex Project-local Agent System

このディレクトリは、Bara Developer Platform の Project-local な自律製品運営サイクルを定義します。最終判断者は Project goal を与え、Product Owner が機会発見、backlog、今回の対象成果群の決定、実装、検証、レビュー、次サイクルへの学習を完結させます。運営サイクルは単一機能や単一 Issue に固定しません。

## 役割と責務

| 役割               | 主な責務                                                                                               | 入力                                                     | 主な出力                          |
| ------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------- |
| `product-owner`    | 機会発見、backlog Issue 化、今回の対象成果群の優先順位とトレードオフの決定、レビュー結果による完了判断 | Project goal、リポジトリ、レビュー、既存 Issue、公開情報 | Issue、運営サイクル決定・完了記録 |
| `implementer`      | Product Owner が選んだ配達単位を実装・検証し、commit、push、通常 PR の作成まで行う                     | Product Owner の運営サイクル決定、受入条件               | 実装・検証記録、PR                |
| `quality-reviewer` | Implementer が作成した PR を独立して技術品質・安全性・回帰リスクの観点から検証する                     | Product Owner の決定、PR、実装・検証証跡                 | 品質レビュー                      |
| `product-reviewer` | Quality Reviewer が通した PR を利用者価値・成果仮説・受入条件の観点から検証する                        | Product Owner の決定、PR、品質証跡、動作観測             | 製品レビューと次サイクルの学び    |

`improvement-proposer` と `project-manager` は廃止しました。前者の discovery / Issue 化 / 優先順位判断は `product-owner` に統合し、後者の配達進行は Product Owner が直接担います。`product-review-packager` も廃止し、`product-reviewer` に置き換えました。

## 開発サイクル

1. `product-owner` は `$discover-idp-opportunities` を使い、リポジトリと公開ニーズから根拠付きの IDP 機会候補を調査し、delivery / discovery 候補を backlog Issue として作成または更新する。
2. `product-owner` は `$select-product-outcome` を使い、候補と既存 backlog を比較し、今回の運営サイクルの対象成果群、優先順位、受入条件、非対象、リスク、成果仮説を決定する。
3. `implementer` が各配達単位を実装・検証し、commit、push、通常 PR の作成と実装成果物の保存を行う。
4. `quality-reviewer` が同じ PR を独立レビューする。blocking finding は Product Owner が Implementer へ差し戻し、再レビューする。
5. `product-reviewer` が品質を通過した PR を製品観点でレビューする。
6. `product-owner` はレビュー結果をもとに、各配達単位の完了、修正、分割、保留を決め、運営サイクル記録と backlog を更新する。Product Reviewer の発見は次サイクルの Product Owner の入力になる。

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
