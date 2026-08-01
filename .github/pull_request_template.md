## 変更内容

<!-- 利用者・開発者への影響と、今回の非対象を簡潔に記載する。 -->

## 受入条件と Review guide

| AC   | 前提データ・fixture         | 操作または request         | 期待結果                | 自動検証                 | 手動確認結果                  |
| ---- | --------------------------- | -------------------------- | ----------------------- | ------------------------ | ----------------------------- |
| AC-1 | <!-- safe local fixture --> | <!-- UI 操作 / request --> | <!-- 観測可能な結果 --> | <!-- test と command --> | <!-- Pass / Fail / 未検証 --> |

<!-- UI 変更は主要導線、backend/API 変更は正常系と主要な拒否・境界条件を含める。 -->

## 実行した検証

- [ ] `yarn install --immutable`
- [ ] `yarn prettier:check`
- [ ] `yarn lint:all`
- [ ] `yarn tsc:full`
- [ ] `yarn test --watch=false`
- [ ] `yarn test:e2e`（UI 導線を変更した場合）
- [ ] 起動した app / backend に対して Review guide の対象操作を確認

## Owner acceptance

- Preview / safe local URL: <!-- 利用できない場合は理由 -->
- 所有者が行う主要操作: <!-- 短時間で再現できる journey -->
- 期待結果: <!-- 画面上の文言、response、状態 -->

## UI / UX 仮説（該当する場合）

- Baseline observation: <!-- 現在の journey で観測した事実 -->
- 変更仮説と比較した interaction: <!-- 見た目の好みではなく改善理由 -->
- 成功 / 失敗 / UNVERIFIED の観測: <!-- task success、time、迷い、理解、recoveryなど -->
- 比較した有力案と暫定推奨の理由: <!-- Issueのoption comparisonを参照 -->

## Rollout / operability

- Production / persistent data / auth / permission / external dependency への影響: <!-- なしの場合は理由 -->
- Configuration / Secret 境界: <!-- relevant な場合。値は書かない -->
- Rollout / migration / smoke test: <!-- relevant な場合 -->
- Rollback / forward recovery: <!-- relevant な場合 -->
- Backup / restore: <!-- relevant な場合 -->
- Health / logging / metrics / alert: <!-- relevant な場合 -->

<!-- 本番 deploy、account作成、購入、permission変更は、ユーザーの明示依頼と承認なしに実行しない。 -->

## Review handoff

- PR head commit SHA: <!-- reviewer が確認する immutable SHA -->
- Quality review comment / check / verdict: <!-- reviewed SHA付き PASS / FAIL / UNVERIFIED -->
- Product review comment / check / verdict: <!-- 必要な場合。省略時は利用者挙動を変えない理由 -->
- Merge decision: <!-- main agent が同一 SHA の review と CI を確認後に記載 -->

## 残余リスク・未検証事項

<!-- なければ「なし」。実行不能な確認は理由、影響、再現に必要な環境を記載する。Secret や個人情報は書かない。 -->
