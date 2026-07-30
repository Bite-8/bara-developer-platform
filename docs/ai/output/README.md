# Subagent Outputs

Codex custom agents の最終成果物を agent ごとに保存します。Project-local の自律製品運営サイクルでは、Product Owner の discovery・backlog・優先順位・完了判断、Implementer の PR、品質レビュー、製品レビューを後から追跡できる完成版だけを保存します。

```text
docs/ai/output/<agent-name>/NNN-<descriptive-kebab-case-name>.md
```

- `<agent-name>` は `.codex/agents/*.toml` の `name` を使います。
- `NNN` は agent ごとの 3 桁連番です。既存の最大番号に 1 を加え、上書きしません。
- 一時ログではなく、意思決定・実装・品質レビュー・プロダクトレビューに必要な完成版だけを保存します。
- 担当 agent または Product Owner が成果物を保存します。保存者の違いで内容や採番規則を変えません。
- 成果物の見出し、本文、メタデータは日本語で記述します。コード、コマンド、ファイルパス、API 名などの固有表記は原文のままで構いません。
- Secret、token、個人情報の値は保存しません。
