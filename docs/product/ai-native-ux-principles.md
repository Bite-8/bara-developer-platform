# AI-native UX principles

- Status: Accepted
- Date: 2026-08-01
- Related charter: `docs/product/ai-native-control-plane-charter.md`
- Delivery method: `docs/how-to-plan-delivery-waves.md`

## 前提

Backstage は Catalog、Scaffolder、Permission、Search、TechDocs、共通 component、plugin ecosystem を持つ強い土台です。その標準 UI は、一貫性、accessibility、OSS plugin 互換性を守る baseline として利用します。一方、Backstage 標準または現在の Bara UI が、Bara の対象利用者にとって最適な情報設計、navigation、interaction であるとは仮定しません。

Bara は Backstage の見た目を変えること自体も、正当な成果になり得ると考えます。application developer と Platform Engineer が Project / Environment context から安全に次の行動へ進める体験に加え、視覚的魅力、洗練、信頼感、Bara らしさ、楽しさを試します。デザインや安全な新機能に唯一解があるとは仮定せず、可逆な変更は先に出して学びます。改善は `packages/app` を含む Bara の app shell と、必要に応じた plugin / module / extension / configuration に実装します。公式 plugin の内部実装や Backstage dependency の hard fork は避けます。

## UX の成果

代表 journey ごとに、次の一つ以上を改善対象として選びます。

- Task success: 利用者が目的の状態へ到達できるか。
- Time to next action: Project / Environment を開いてから次の安全な action を判断するまでの時間。
- Navigation cost: 不要な画面遷移、backtrack、検索、別 tool への移動。
- Context comprehension: owner、current / desired state、signal、evidence、risk、approval requirement を正しく説明できるか。
- Error recovery: empty、loading、failure、permission deny、stale data から次に何をすべきか分かるか。
- Confidence and cognitive load: なぜその提案なのか、何が変わるか、戻せるかを過剰な情報探索なしに判断できるか。
- Accessibility: keyboard、focus、label、contrast、screen-reader semantics が主要導線を妨げないか。
- Visual quality: 魅力、情報の豊かさ、洗練、一貫性、Bara らしさ、触ってみたくなる印象があるか。

page view、click 数、滞在時間だけを成功とみなしません。速く離脱したのが成功か失敗かは journey の task result と合わせて判断します。

## Ship-and-learn の契約

可逆で、identity、server-side permission enforcement、Secret・機微情報、データ破壊、外部副作用を変えない UI / UX と安全な新機能は、Bara の app shell を含めて exploration として直接実装・merge してよい。価値や見た目の正解を事前に証明する必要はない。短い変更意図、確認 route または safe fixture、revert 方法だけを残す。

主要導線を置き換える UI、または approval、risk、permission、execute の意味を扱う UI / feature は、既存 journey、対象利用者、期待する挙動、revert 方法を Issue と PR に残す。実際の security / side-effect 境界を変える場合は ADR と品質・セキュリティ契約に従う。

初期段階では、必要に応じて safe fixture、targeted test、route smoke、Playwright E2E、まれに得られる人間の定性フィードバックを使います。E2E は主要導線の置換または安全意味を持つ変更に使い、visual exploration の都度要求しません。十分な traffic がない段階で A/B test の統計的有意性を装いません。

### 複数の方法と案を使う

architecture、外部 integration、永続化、permission、外部副作用、または戻しにくい interaction を選ぶときは、一つの screenshot、サイト、analysis method だけで結論を出しません。課題に relevant な方法を複数組み合わせます。可逆な visual / interaction exploration や安全な新機能では、この発散は既定にしません。

- 複数の developer portal、control plane、運用 tool、類似した一般 product の公開 journey benchmark
- task analysis、cognitive walkthrough、journey mapping
- usability heuristic、information architecture、error-recovery review
- accessibility review
- safe fixture を使った owner / reviewer の task-based observation
- prototype、feature flag、preview route による interaction 比較

複数 product を見る目的は見た目を模倣することではなく、同じ task をどう構造化し、何を省略し、どこで feedback / risk / recovery を示すかを比較することです。調査 subagent には異なるサイト群または analysis lens を割り当て、初期案を独立に作らせます。

メイン agent は、上記の高リスク判断で必要な場合だけ 2〜4 案を比較し、暫定推奨、trade-off、選外理由、判断を変える追加証拠を Issue に残します。Product Reviewer は求められたときに利用者体験への助言を返せるが、通常の visual / interaction exploration や新機能の merge veto を持たない。

## AI interaction を解法より先に固定しない

AI chat は候補となる interaction の一つであり、AI-native の同義語ではありません。Project / Environment context で次の判断を支援する場合、少なくとも次を比較します。

- Recommended next actions card
- Contextual explanation / question input
- Guided workflow または command palette
- Plan preview と diff / risk / approval panel
- 通知または signal から始まる proactive suggestion

chat を採用する場合も、汎用会話欄ではなく、選択中 context、参照 evidence、target、expected change、risk、required approval、rollback path、OperationLog との関係を表示します。副作用は conversation から直接実行せず、Intent → Plan → approval → ActionRun の境界へ接続します。

## Backstage との関係

可能な限り Backstage UI component、design token、route ref、extension blueprint、analytics API を利用します。標準 plugin が目的 journey に合わない場合は、次の順序で検討します。

1. configuration または feature flag。
2. plugin extension / module / addon。
3. Bara frontend plugin 内の独自 page / component。
4. app-level extension / override。
5. hard fork は原則採用しない。

視覚的一貫性を守ることと、情報階層や interaction を標準画面のままにすることは同じではありません。共通 component を使いながら、Bara 固有 journey に最適化できます。

## 参照した外部根拠

2026-08-01 時点で次を参照しています。

- Backstage の新 frontend system は、plugin、extension、override を通じて機能と画面を差し替え・追加できるため、hard fork せず UX 仮説を検証できます。
  - https://backstage.io/docs/frontend-system/architecture/plugins/
  - https://backstage.io/docs/frontend-system/building-plugins/index/
- Backstage UI は consistent、accessible、extensible な baseline と、個別 brand への customization の両立を目的にしています。
  - https://ui.backstage.io/
- AI coding assistant の longitudinal study は、知覚生産性が高くても flow と cognitive load が悪化し得ると報告しています。AI 機能は生成量だけでなく developer experience を観測します。
  - https://arxiv.org/abs/2605.23135
- professional developer の mixed-methods study は、AI output quality と interaction 中の cognitive load を分けて観測する必要を示しています。
  - https://arxiv.org/abs/2607.02337
