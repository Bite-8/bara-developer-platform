# Agent Outputs

Codex の開発サイクルで、意思決定・実装・独立レビュー・merge 判断に必要な完成版だけを保存します。メイン agent の記録は `cycle/`、custom agent の記録は `.codex/agents/*.toml` の `name` ごとのディレクトリに置きます。

```text
docs/ai/output/cycle/NNN-<descriptive-kebab-case-name>.md
docs/ai/output/<agent-name>/NNN-<descriptive-kebab-case-name>.md
```

- `NNN` は保存先ごとの 3 桁連番です。既存の最大番号に 1 を加え、上書きしません。
- cycle record には Project goal、探索・選定の根拠、受入条件、Issue / PR URL、current PR head SHA、reviewer 成果物と verdict、merge / 保留判断、未解決事項を残します。
- reviewer 成果物には、PR URL、base branch、reviewed head SHA、AC ごとの Pass / Fail / 未検証、verdict を残します。
- 一時ログではなく、意思決定・実装・品質レビュー・プロダクトレビューに必要な完成版だけを保存します。
- 見出し、本文、メタデータは日本語で記述します。コード、コマンド、ファイルパス、API 名などの固有表記は原文のままで構いません。
- Secret、token、個人情報の値は保存しません。
