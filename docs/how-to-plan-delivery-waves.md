# ゴール分解と delivery wave

このガイドは、Bara Developer Platform の粗い製品ゴールを、継続的に配達・検証できる複数の delivery unit へ変換するための共通契約です。開発サイクルの実行は `.codex/skills/run-idp-development-cycle/SKILL.md`、各 PR の確認は `docs/how-to-review-and-verify.md` を正とします。

## 用語と正本

| 単位                   | 役割                                                    | 正本                                           |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| Initiative             | 対象利用者、解く課題、成果指標を共有する粗い製品成果    | 長寿命の方針は docs、進行状態は GitHub Issue   |
| Decision-ready backlog | 価値、受入条件、依存関係、リスクが実施判断に足りる候補  | GitHub Issue                                   |
| Delivery wave          | 一つの成果仮説へ連続して前進させる最小の unit 群        | Initiative / unit Issue の comment または body |
| Delivery unit          | 独立して実装・検証・review・merge / hold 判断できる変更 | 1 Issue、原則 1 PR                             |

backlog の状態、担当、優先順位、PR 固有 evidence を repo 内 docs に複製しません。docs は分解原則、製品方針、ADR、運用契約など長寿命の判断に使います。

## 粗いゴールを分解する

「UI を良くする」「AI 機能を作る」「本番で使えるようにする」のようなゴールを、最初から一つの実装へ結び付けません。次の順序で分解します。

1. 誰のどの判断または作業を改善するかを一文にする。
2. 現在の製品を代表的な利用者 journey で観測し、事実、仮説、未確認事項を分ける。
3. UI / UX、frontend、backend / domain、data、integration、permission、安全性、validation、owner acceptance、operability の relevant な面を列挙する。
4. 独立して価値を観測できる最小の delivery unit、または実装判断を下す discovery unit に分ける。
5. predecessor、successor、並行可能性、所有ファイルまたは worktree を dependency graph にする。
6. 今回連続して完了させる最小の delivery wave と、backlog に残す候補を決める。

候補数を増やすこと自体は目的ではありません。同じ利用者課題を細かく切っただけの Issue は統合し、reviewer が別々に価値を判定できない変更は同じ unit に含めます。一方、UI、API、migration、運用準備を一つの巨大 PR にまとめないようにします。

## 調査を発散してから収束する

解法に意味のある不確実性がある場合、メイン agent は異なる lens の product-explorer を並行起動します。各 explorer は最初は他の案を見ず、指定された利用者 journey、外部 benchmark、analysis method、Backstage feasibility などを独立に調べます。これにより、最初の案への anchoring と、一人の文脈に全ての観測が混ざることを避けます。

メイン agent は結果を統合し、重複を除いた原則 2〜4 案について次を比較します。

- 観測した利用者課題と根拠
- 期待する task outcome
- interaction または technical approach
- trade-off、risk、Backstage compatibility
- 最小の検証方法と revert 可能性

そのうえで「現時点の暫定推奨」を選びます。多数決や agent 数ではなく、根拠の質、成果仮説、検証コストで判断します。選ばなかった有力案と、追加証拠によって判断が変わる条件も Issue に残し、owner と Product Reviewer が比較できるようにします。

不確実性が大きく UI の差を文章だけで比較できない場合、複数の完成機能を同時に作らず、prototype、feature flag、Storybook、preview route などの安い比較 unit を先に選びます。軽微な bug、機械的変更、決定済み仕様では発散を省略し、その理由を記録します。

## 並行と順次を選ぶ

dependency graph 上で predecessor が完了した unit を ready unit と呼びます。次を全て満たす ready unit は、subagent の強みを活かして原則並行実施します。

- 一方の失敗や hold が他方の利用者価値を無効にしない。
- 変更ファイルの所有権または worktree を分離できる。
- 個別の Issue、PR、受入条件、validation、fixed-SHA review、merge 判断を持てる。
- 統合順序と競合時の owner が明確である。

メイン agent は利用可能な subagent 枠まで ready unit を起動し、枠が空いたら次の ready unit を補充します。実装完了の全体待ち合わせはせず、head を固定できた PR から Quality / Product review と merge 評価を開始します。したがって、一つの wave の中で実装、review、修正、merge が異なる unit について同時に進行できます。

schema → API → UI のような実依存がある場合だけ順次実施します。同じ delivery wave に含めてよいですが、predecessor が current base に merge され、その結果を確認してから successor を開始します。stacked branch の暗黙差分や未レビュー commit を後続 PR の前提にしません。

各 PR の独立 gate は、wave を直列化する全体承認ではありません。各変更の failure をその unit と downstream dependency に局所化し、依存しない PR を安全に review・merge し続けるための境界です。

resume-first では、未完了 PR の current head、review、CI、mergeability を新規 discovery より先に回収します。同時に既存 wave の dependency graph を復元し、その PR と依存しない ready unit は並行して再開します。未完了 PR の修正だけを理由に wave 全体を直列化しません。

## Subagent の最小契約

メイン agent は initiative、dependency graph、優先順位、統合判断を所有します。subagent には、担当 unit に必要な次の情報だけを渡します。

- authoritative Issue と受入条件
- exact task と読むべき入力
- 所有ファイルまたは隔離 worktree
- 作る artifact と期待する出力形式
- 実行する validation
- 完了・hold・block の停止条件

親の会話履歴や workflow 全体を無条件に複製しません。subagent が orchestration role を誤認したり、他 unit の scope を吸収したりするためです。メイン agent は role、unit、branch / worktree、開始・終了 status、停止理由の receipt を持ち、沈黙した agent を放置せず status 確認、interrupt、再委譲を行います。

## Delivery wave の選定契約

wave には次を記録します。

- 対象利用者と成果仮説
- 含める delivery unit と各 Issue
- dependency graph と parallel group / sequential order
- unit ごとの ownership または worktree
- owner acceptance journey
- production / operability 影響と relevant な rollout / rollback
- wave の終了条件
- 今回選外にした decision-ready 候補と理由

既定件数は固定しません。各 unit を個別に検証でき、共通成果へ収束し、依存関係を説明できる最小の成果群を選びます。wave の途中で新しい候補が見つかった場合、blocking な安全性・correctness gap は wave に追加できます。それ以外は backlog に残し、無制限に scope を広げません。

## Owner acceptance と operability

利用者向け変更には、製品所有者が preview URL または安全なローカル fixture で短時間に実行できる journey を一つ以上定義します。操作、期待する画面または response、失敗時に確認する値を PR の Review guide に記載します。自動 test や reviewer verdict は owner acceptance の代わりではなく、owner が全 test suite を再実行する必要もありません。

production、永続データ、認証、権限、外部連携、migration、deployment に関係する unit は、変更に relevant な次の項目を受入条件または残余リスクに含めます。

- configuration と Secret の注入境界
- rollout、schema migration、互換期間
- rollback または forward recovery
- backup / restore とデータ保持
- health check、logging、metrics、alert
- staging / preview での smoke test

該当しない項目は無理に実装せず、なぜ非該当かを短く示します。開発サイクルは deployable artifact と再現手順を作れますが、本番 deploy、account 作成、購入、permission 変更はユーザーの明示依頼と承認なしに行いません。

## 継続と終了

各 PR は従来どおり独立した fixed-SHA gate を通します。一つの PR が merge または hold になったら dependency graph を更新し、ready になった次の unit を同じ開発依頼の中で開始します。

delivery wave を終了できるのは次の場合です。

- 全 unit が受入条件を満たして merge / close した。
- unit を明示的に hold / defer し、理由と再開条件を Issue に記録した。
- 外部権限、ユーザー判断、安全境界などで進行不能となり、影響を受ける downstream unit と再開条件を記録した。
- 根拠から選択すべき unit が 0 件で、次に必要な観測条件を記録した。

一つの PR を作成または merge しただけでは wave 完了としません。依存しない ready unit が残る場合は継続します。

## 設計根拠

この契約は、2026-08-01 時点で次の公式情報、研究、community practice を参照しています。community 記事は公式仕様ではなく運用仮説として扱い、fresh-session forward test でこの repository の実挙動を確認します。

- OpenAI の Codex subagent guidance は、main thread を意思決定へ集中させ、bounded な探索・test・triage を subagent へ移し、独立作業を並行化することを勧めています。write-heavy な並行作業は競合リスクがあるため、worktree を使います。
  - https://learn.chatgpt.com/docs/agent-configuration/subagents
  - https://learn.chatgpt.com/docs/environments/git-worktrees
- OpenAI の Codex app 発表は、複数 agent が同じ repository を競合なく進めるため、agent ごとの worktree を並行実行の基盤として説明しています。
  - https://openai.com/index/introducing-the-codex-app/
- CAID は、centralized delegation、dependency-aware plan、asynchronous execution、isolated workspace、branch-and-merge、executable test を組み合わせた software-engineering multi-agent coordination を評価しています。
  - https://arxiv.org/abs/2603.21489
- Agent scaling の研究は、同質 agent の追加には収穫逓減があり、異なる prompt、tool、役割による多様性が有効だと報告しています。Bara では agent 数の最大化より、実装・品質・製品価値の異なる観測目的を優先します。
  - https://arxiv.org/abs/2602.03794
- Cooperation 研究は、model capability だけでは協調を保証せず、明示 protocol が必要だと報告しています。そのため dependency graph、ownership、receipt、停止条件を暗黙にしません。
  - https://arxiv.org/abs/2604.07821
- OpenAI Developer Community では、subagent へ exact task / input / artifact / output shape を渡す最小契約と、spawn 後の lifecycle receipt を持つ運用が共有されています。
  - https://community.openai.com/t/a-minimal-contract-for-writing-effective-sub-agent-instructions/1378063
  - https://community.openai.com/t/how-are-you-managing-the-use-of-explicitly-spawned-subagents/1381187
