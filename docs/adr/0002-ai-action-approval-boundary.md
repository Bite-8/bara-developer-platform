# ADR 0002: AI action approval boundary

- Status: Accepted
- Date: 2026-06-17
- Accepted: 2026-08-01
- Revised: 2026-08-02

## 背景

Bara Developer Platform は AI-native developer control plane として、AI が Project / Environment の context から next action plan を提示する方向に進む。

しかし、AI が提案、dry-run、Git PR 作成、非本番実行、本番実行を同じ権限で扱うと、Catalog ownership、Backstage permission、Git review、runtime audit の境界が曖昧になる。

ADR 0001 は desired state と runtime record の source of truth を分けた。この ADR では、AI action をどの承認境界で扱うかを提案する。

## 決定

AI action は段階別の approval boundary を持つ。

1. 読み取り・要約・recommendation は Observe として扱う。
2. 実行前 plan と差分生成は Plan として扱い、実行とは分離する。
3. 副作用のない dry-run は記録対象にするが、production 実行承認とは別にする。
4. Git PR 作成や承認待ち task 作成は Propose change として扱い、Project owner または allowed role の承認対象にする。
5. 非本番への副作用あり実行は Execute non-production として扱い、Project / Environment owner の承認対象にする。
6. 本番または高重要度 Environment への副作用あり実行は Execute production / critical として扱い、明示的な人間承認、risk summary、audit reason を必須にする。

承認判断は、Backstage permission framework、Catalog ownership、Environment criticality、Template governance metadata、Plan risk を組み合わせて行う。

## 結果

### 良い影響

- AI が plan を提示する価値を保ちながら、実行権限を段階的に制御できる。
- Git review、Scaffolder task、Backstage permission と整合しやすい。
- 本番・高重要度環境に対して、人間が理解可能な承認と audit trail を残せる。
- IDP backend plugin に、Intent / Plan / Approval / ActionRun / OperationLog の責務を与えやすい。

### 悪い影響 / trade-off

- 初期実装でも approval record と policy result の設計が必要になる。
- 完全自律実行よりも、ユーザー確認の step が増える。
- Environment criticality や Template governance metadata が未整備な間は、保守的な deny / needs-approval が増える。

## 実装上の含意

- AI action gateway、approval workflow、operation log、AI action UI の配置先は、利用者 journey、責務の凝集性、共有範囲、テスト容易性、将来の変更コストで選ぶ。`packages/app`、`packages/backend`、plugin / module のいずれにも実装できる。
- Scaffolder や Git PR を実行 backend として優先し、独自 executor の重複実装を避ける。

## 2026-08-02 の決定更新

AI action の実装を plugin に限定し、`packages/app` と `packages/backend` を登録・配線だけに制限する規則を撤廃する。これは安全境界ではなく、Backstage compatibility を得るための当初の実装仮説だった。実アプリの起動では、その仮説が Bara の control-plane journey を標準入口へ統合することを妨げた。

Observe / Plan / Propose change / Execute の approval boundary、server-side permission enforcement、Catalog ownership、Environment criticality、audit requirement は本 ADR のまま維持する。配置規則の変更は、これらの enforcement を UI の非表示や任意の client-side logic に移すことを許容しない。

## 未決事項

- Environment criticality を Catalog annotation、spec field、別 metadata layer のどこで表現するか。
- Template governance metadata を Scaffolder template に同居させるか、IDP curated layer に分けるか。
- Approval expiration、再承認条件、break-glass operation の扱い。
- Policy deny / needs-approval の UI 表示と API schema。

## 参考

- `docs/product/ai-native-control-plane-charter.md`
- `docs/architecture/ai-action-approval-model.md`
- `docs/architecture/intent-plan-run-lifecycle.md`
- `docs/adr/0001-idp-management-source-of-truth.md`
- `docs/reviews/2026-06-16-product-review-v2-ai-native-control-plane.md`
