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

## 残余リスク・未検証事項

<!-- なければ「なし」。実行不能な確認は理由、影響、再現に必要な環境を記載する。Secret や個人情報は書かない。 -->
