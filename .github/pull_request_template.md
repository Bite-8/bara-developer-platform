## 変更内容

<!-- 利用者・開発者への影響と、今回の非対象を簡潔に記載する。 -->

## 受入条件と Review guide

| AC   | 前提データ・fixture         | 操作または request         | 期待結果                | 自動検証                 | 手動確認結果                  |
| ---- | --------------------------- | -------------------------- | ----------------------- | ------------------------ | ----------------------------- |
| AC-1 | <!-- safe local fixture --> | <!-- UI 操作 / request --> | <!-- 観測可能な結果 --> | <!-- test と command --> | <!-- Pass / Fail / 未検証 --> |

<!-- UI / safe feature は確認 route・基本操作・revert 方法を含める。主要導線または安全意味を扱う UI、backend/API は正常系と主要な拒否・境界条件を含める。 -->

## 実行した検証

- [ ] `yarn install --immutable`
- [ ] `yarn prettier:check`
- [ ] `yarn lint:all`
- [ ] `yarn tsc:full`
- [ ] `yarn test --watch=false`
- [ ] `yarn test:e2e`（主要導線または approval / risk / permission / execute の意味を扱う場合）
- [ ] 対象 test または route smoke と Review guide の基本操作を確認

## 確認 route / 任意の人間フィードバック

- Preview / safe local URL: <!-- 利用できない場合は理由 -->
- 基本操作と期待結果: <!-- 画面上の文言、response、状態 -->
- Revert 方法: <!-- 通常は PR revert。feature flag がある場合はその操作 -->
- 人間のフィードバック: <!-- 任意。常時の merge 条件ではない -->

## UI / UX / feature の意図（該当する場合）

- 意図: <!-- 視覚的魅力、洗練、Bara らしさ、interaction、または試したい機能 -->
- 確認方法: <!-- route / fixture / targeted test。主要導線なら E2E -->
- 次の学び: <!-- 任意。人間の反応や後続 iteration で確認したいこと -->

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
- Product review advice: <!-- 任意。merge verdict ではない -->
- Merge decision: <!-- main agent が同一 SHA の review と CI を確認後に記載 -->

## 残余リスク・未検証事項

<!-- なければ「なし」。実行不能な確認は理由、影響、再現に必要な環境を記載する。Secret や個人情報は書かない。 -->
