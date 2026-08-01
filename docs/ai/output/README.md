# Historical Agent Outputs

このディレクトリには、旧 Codex 開発サイクルが repo へ保存した意思決定、実装、独立レビュー、merge 判断の historical evidence が残っています。過去の判断や PR を調査するときに参照できますが、現在の実装状態、未完了作業、review gate の正本ではありません。

現在の PR 固有 evidence は次を正本にします。

- GitHub Issue: 対象利用者、課題、根拠、受入条件、非対象、選定、merge 後の学び
- PR body: 変更、影響、validation、Review guide、残余リスク、head SHA
- SHA 付き GitHub comment / check: Quality/Product verdict、AC 結果、finding、merge / hold 判断

新しい implementer/reviewer/cycle log を delivery PR へ追加 commit しません。repo には charter、ADR、設計、運用ルールなど、PR head から独立した長寿命の判断だけを保存します。過去ファイルは履歴として削除せず、通常の開発サイクルでは必要なものだけを明示的に読みます。Secret、token、個人情報の値は保存しません。
