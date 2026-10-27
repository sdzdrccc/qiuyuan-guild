# qiuyuan-guild 复审报告 —— X-0053 G 系列销号 × e963930..8b44ca1 新增变化

- **来源**：Qoder Desktop 主 agent 派出的 sub-agent（单对象审阅，非全量六仓）
- **Agent 名称**：qiuyuan-guild 复审执行者
- **大模型**：Qoder Desktop · 底层模型不披露
- **审查时间**：2026-10-27
- **审查对象**：`qiuyuan-guild`（F:/zxc/Project/qiuyuan-guild，跨库规范中枢）单仓
- **流程真源**：`docs/REVIEW-PROCESS.md` v1.9 §0/§3/§5/§6/§10 ＋ `AGENTS.md` §2/§3/§8/§10
- **复审关系**（§10.1）：**复审（销号）＋ 增量登记**。正本 = `reviews/X-0053.md` §三·1（G-1~G-7）；guild 侧缺陷处理卡 = `reviews/X-0054.md`。逐条复跑其未通过项（三态），并**只登记 2026-10-19 之后新增变化**（提交范围 `e963930..8b44ca1`，17 笔）；未变部分沿用旧结论＋指针，不重抄。
- **审阅快照**（§3 第 1 步 · 仅标识时点，≠ 门禁基线）：

| 对象 | HEAD | 工作区 |
|---|---|---|
| `qiuyuan-guild` | `8b44ca1` | ⚠️ **脏**（并行审阅 agent 在 `reviews/work/` 落了多份源材料 + `X-0062.md` 未跟踪 + 派生视图已改）|
| `qiuyuan-dalu` | `1378f09` | （只读；★ 正是打断 I1 的那笔改名提交）|
| `gbe-studio` | `13de06a` | 只读 |
| `gbe-assets` | `5656dcf` | 只读 |

- **本次覆盖**：G-1~G-7 逐条复跑 ＋ X-0054「7 缺陷＋7 机制洞」自证复核 ＋ e963930..8b44ca1 新增面（ADR 只追加 / 契约↔文档一致性 / 台账 / v1.9 读机制）＋ 机械判据实跑 ＋ I1 根因独立判定 ＋ 门禁自测计数独立复算。
- **本次未覆盖**：见末节「本次未覆盖」（必填）。
- **硬约束确认**：只读 ✓ ／ 未改被审对象任何文件 ✓（未 `git add`/`commit`、未写 `reviews/` `registry/` `docs/` 正本）✓ ／ 删除类只出清单、执行 0 ✓ ／ 判定二值、无分数无等级 ✓。

---

## 一、审阅对象与判定（二值 · 禁评分）

**总判：不通过。**（存在可复现的 guild 侧判据缺陷与台账机制未落地项；门禁红为**假报警**，须判据修正）

| # | 审阅项 | 机械判据 | 文档/机制一致性 | 判定 |
|---|---|---|---|---|
| 1 | `qiuyuan-guild` 机械门禁 | **不通过**（`run-all-checks` 9/10，FAILED=`check-identifiers.js`·I1；软警 R10/P6） | I1 红根因＝**判据失效（假报警）**，非文档缺陷（见 §四） | **不通过** |
| 2 | X-0053 G 系列销号 | — | G-1/2/4/5/6/7 **已销**；**G-3 未销**（读半边未落地） | **不通过**（1 条未销） |
| 3 | ADR 只追加铁律（纪律 3） | — | `git log -p` 区间内 DECISIONS.md **0 处历史删除**；新 ADR supersedes 用法正确 | **通过** |
| 4 | 契约↔文档一致性（神识改名 / 品质 6→7 / `GET /api/characters`） | — | 三处契约内部＋ROADMAP 一致，分叉已登记 | **通过** |
| 5 | 台账（C2 双向 / U 待开卡 / 待验收存量） | C2 绿（check-records 过） | U-0001~U-0005 待开卡超一里程碑未重议；待验收 34 行（不降反升）；验收结论区**空** | **不通过**（3 条） |
| 6 | v1.9 新机制「回执也读」 | C6 提取 67 条绿 | 提取侧落地；**汇总进台账侧未执行**（验收结论区「暂无」） | **不通过** |
| 7 | 门禁自测计数（独立复算） | 实跑 324/324 | 与 X-0054 宣称 316 一致（差 8＝check-data 后续增长），无虚报 | **通过** |
| 8 | GATE_EPOCH 是否被移动（C7） | 绿 | `git log -S GATE_EPOCH since 2026-10-19` = 空 ⇒ **未移动，无洗白** | **通过** |

> ★ 判定依据 REVIEW-PROCESS §3 第 4 步：门禁红通常是「真问题未修」；**但本例 I1 的红经独立取证证实为假报警**（判据取键逻辑被打断），故「不通过」落在**判据本身**，处置＝**判据修正**，不是要求下游改文档。

---

## 二、X-0053 G 系列复跑（三态 ＋ 可复现证据）

正本位置：`reviews/X-0053.md` 第 144~189 行（G-1~G-7）。X-0054 自称处置：7 条缺陷＋7 个机制洞。

| # | X-0053 原问题 | 三态 | 复跑证据 |
|---|---|---|---|
| **G-1** | README/AGENTS 五类事实漂移 | ✅ **已销** | `README.md:52` 现写「连区间一起废除」并给指针；`:133`「M1 状态只住 ROADMAP §2」；`:61-62` 与 `:161-162` 均 `C1~C9`/`D1~D5` 一致；`AGENTS.md` §10.3 标题订正为「CI 的诚实边界」（原「为什么没有 CI」标过期）|
| **G-2** | `PENDING_RULES` 两条被注释（E4/P2） | ✅ **已销** | `check-docs-index.js:43-52` E4 → `status:'wontfix'` 可见条目；`check-version-pins.js:115/211-215` P2 → 真做成 `P6` 软判据；`grep '^[[:space:]]*//.*{ id:'` 余下全是各脚本 PENDING 模板示例行（非被注释的真规则）|
| **G-3** | 契约回执只写不读 | ❌ **未销（半落地）** | 写＋提取侧已做：`check-records.js:843 receiptHighlights()` 现捞 **67 条**（见 §四）；读侧**未做**：`registry/cross-repo-ledger.md` §三「验收结论区」仍为 `—（暂无）—`（见命令输出）。REVIEW-PROCESS v1.9 §3-第5步要求「arch 每周把该清单汇总进台账验收结论区」——**从未执行** |
| **G-4** | X-0049 缺审核节＋证据节误报 | ✅ **已销** | `grep -n '^## ' reviews/X-0049.md` → §六「审核（只追加·补 X-0054 G-4 缺节）」在位；证据节判据改并集（`check-records.js` 收编「门禁与提交号」形态），X-0049 现过 C1 |
| **G-5** | L2 会审无载体 | ✅ **已销** | `docs/CONVENTIONS.md` v0.7 §7.4 加第 3 号「L2 会审是否触发」；X-0054 §五 即该判据首个用例 |
| **G-6** | run-all 头注释说「无 CI/零 process.env」 | ✅ **已销**（残留轻微） | `run-all-checks.js:16-19` 追加现状（CI 已有/覆盖点 5 处/10 条口径）；★ 但 `:107` 横幅仍打印「本仓 8 个校验脚本」，与「10 条」口径并存易误读（不计入销号失败，登遗留）|
| **G-7** | 版本钉靠人抄、P2 注释 | ✅ **已销** | `check-version-pins.js` `P6`：读 `../gbe-studio/VERSION`/`../gbe-assets/VERSION`，不一致只 warn、读不到显式「跳过·NOT a pass」（见 §四 P6 实跑读数）|

**X-0054 自证复核（不盲信）**：
- 7 条缺陷：6 已落地，G-3 仅落地「提取」半边、漏「汇总进台账」半边 → X-0054 §一「实测捞到 52 条（此前 0 人看见）」的表述**只覆盖提取**，对「读之后要进台账」的闭环**过度声明**。
- 7 机制洞：② C1/审核改「真有节」= 已做；⑥ §7.4 第 3 号 = 已做；⑦ C6 = 半做（同上）；③ wontfix 已做、**`due` 到期告警未做**（`grep 'Date\|逾期\|expire' check-docs-index.js` = 空）；① G1 扩面（已裁 ADR↔契约没跟）**未做**（check-contract-gate 现仍只核 ROADMAP 声明的 5 实体，见 §四）；D5 扩面 = 已做；跨切面 CI = 仅 guild。
- ★ X-0054 对 ①/③ 未做部分**已诚实标注为遗留**，唯 G-3 的闭环声明与实际不符（判为「声称已修、实际部分未落地」）。

---

## 三、新增变化缺陷清单（e963930..8b44ca1 · 命令＋输出 或 文件:行）

> 只登记 2026-10-19 之后新增。17 笔：`X-0055`~`X-0061`、`ADR-0033`~`ADR-0037`、契约神识改名＋余量池＋强度拆两段、M5 物品域 v0.9 展开、§4 增补只读角色列表。

**N-1【中等 · 判据缺陷 · I1 根因】`check-identifiers.js` 取键逻辑被 dalu 改名打断**
```
$ git show a60b73e:data/datas/qydl_game_config.csv | head -1
##var,key,value,category,comment            ← X-0053 快照：键列叫 key
$ git log -1 --format='%h %ad' 1378f09       ← dalu 当前 HEAD（打断点）
1378f09 Tue Oct 27 2026
$ git show 1378f09 -- data/datas/qydl_game_config.csv | grep -E '^[+-]##var'
-##var,key,value,category,comment
+##var,param_key,param_value,category,comment   ← 键列改名 param_key
```
`configKeysFromCsv` 硬取 `header.indexOf('key')`（check-identifiers.js:153-154），列名改 `param_key` 后返回 `[]` ⇒ 全 19 个 game_config 键**掉出受管集合** ⇒ I1 对 8 处反引号引用报「该标识符不存在」，其中 **7 处标识符实际存在**（见 §四）。**判据失效（假报警）**。

**N-2【中等 · 判据缺陷 · 同源】`check-data.js` R10 手算复现被同一改名打断**
```
scripts/check-data.js:882  gc.rows.forEach(r => { key[r.key] = r.value; });
```
读 `r.key`/`r.value`，列改名后皆 `undefined` ⇒ `params` 为 NaN ⇒ `computeGradeFormula` 返回假 ⇒
```
⚠ R10 公式参数缺失（spirit_root_variant_value / spirit_root_anchor / spirit_root_p_damage_ppm）→ 手算复现跳过
```
★ 三参数实存于 `qydl_game_config.csv:10/11/12`（已核）。R10 是**软警**不阻断，但危害更隐蔽：**真回归发生时它也「跳过」＝假绿**（纪律 2/坑 9「未覆盖→静默」）。

**N-3【中等 · 机制洞】I1/R10 反向用例只测旧表形态，无「键列改名后仍能取键」的覆盖用例**
```
scripts/check-identifiers.js:367  ['I1','键值表键名解析', configKeysFromCsv('##var,key,value\n...')...]
```
反向用例把列名写死成 `key`，故生产判据被打断时 `--self-test` 仍报 **35/35 全绿**。违 REVIEW-PROCESS §5 纪律 4 ＋ 坑 9「新增/改判据后必须补覆盖用例（断言目标确实被扫到）」。

**N-4【中等 · 复发风险】`qydl_role_name`（DATA-LAYOUT.md:179）为反例引用，I1 无法区分**
```
../qiuyuan-dalu/docs/DATA-LAYOUT.md:179 | 2 | 表名带 qydl_ 前缀；列名一律不带前缀 | 反例 `qydl_role.qydl_role_name` | 正例 `qydl_role.name` |
```
该行「反例」列故意写 `qydl_role_name` 作**反面示范**（真实对象是索引 `uk_qydl_role_name`），非声称该标识符存在。I1 的 `PLACEHOLDER`（:113）只认 `xxx|foo|示例`，认不出表格「反例」列 ⇒ 假报警第二类（判据局限，同样指向判据修正而非改文档）。

**N-5【中等 · 未落地】v1.9「回执也读」闭环缺失**
```
$ sed -n '136,140p' registry/cross-repo-ledger.md
| 编号 | 上游接单人 / 记录位置 | 验收结论 | 验收人 | 日期 |
| — | （暂无） | — | — | — |
```
C6 已把 67 条回执要点捞到（门禁可见），但**没有任何一条被汇总进验收结论区** ⇒ G-3「读」的后半未执行（同 §二 G-3）。

**N-6【中等 · 台账维护纪律 2】U-0001~U-0005 待开卡超一个里程碑未见重议**
```
registry/cross-repo-ledger.md:119-123  U-0001~U-0005 状态 = `待开卡`
```
U-0001~U-0004 由 `ADR-0005/0004`（M1 期）引出、U-0005 由 `ADR-0028`（2026-10-13）引出，现生态已在 M5（2026-10-27）。附:维护纪律 2 明文「卡在 `待开卡` 超过一个里程碑，下次开工时必须重议（要么提，要么撤，不许挂着）」——**区间 17 笔提交内无任一条 U 的重议/撤销记录**。

**N-7【轻微 · 台账】待验收存量不降反升**
```
$ grep -c 待验收 registry/cross-repo-ledger.md   # 34
```
X-0053 遗留#23 记 27 行待验收待清；现独立复算 = **34 行**（＋7），另 `待复核=16`、`待开卡=9`、`进行中=7`、`已关闭=5`。新增 X 卡按规登记合理，但**无验收推进**（与 N-5 同因：验收结论区空）。

**N-8【轻微 · 记录齐备】X-0059 缺「审核」「验证证据」两节，C1 报 2 warn 未消**
```
⚠ C1 1 篇记录缺「验证证据（或门禁）」节：X-0059
⚠ C1 1 篇记录缺「审核」节：X-0059
```
X-0059:47 却自称「C1（状态/执行者节）与 C2 本轮补齐」——补齐的是状态/执行者，**审核节与验证证据节仍缺**（节标题为 `## 4. 验证`，不匹配 C1 的节名口径）。warn 不阻断，但与卡内自述不符，须订正卡或补节。

**新增面一致性核对（未见缺陷，记通过）**：
- **ADR 只追加**：`git log -p e963930^..8b44ca1 -- docs/DECISIONS.md | grep -E '^-\s*[^[:space:]]' | grep -v '^---'` = **空**（区间内 0 处历史正文删除/改写）。新增 ADR-0033~0037；`ADR-0037` 正确以 `supersedes：部分推翻 ADR-0036 裁决 2`（DECISIONS.md:2386），其余标 `supersedes：无` 并说明是「兑现/补登/订正」非推翻——用法合规。
- **神识改名**：`contracts/data-contract.md` v0.11 §3.1 `shenshi_intensity`/`shenshi_cultivation`/`shenshi_pool`、§4.1 `shenshi_start`+`shenshi_step`、`protocol-contract.md` v0.10 §3.3.1 键 `shenshiIntensity`/`shenshiPool` 全套内部一致；裸 `shenshi` 仅出现在变更史「`shenshi`→`shenshi_intensity`」叙述行（历史事实，正确保留）。
- **品质 6→7 档**：`docs/ROADMAP.md` v0.26 与 `data-contract.md` §7.3（档数=7、上界=档×阶=63）一致；四表留六档的分叉已登记 `U-0006`（进行中）。
- **`GET /api/characters`**：`protocol-contract.md:289`（ADR-0035，只读、分页、limit 上限 200）登记在位，与 §4 增补叙述一致。

---

## 四、机械判据实跑读数（命令＋实际输出）

```
$ node scripts/run-all-checks.js
  通过 9 / 10 个脚本
  FAILED: check-identifiers.js
  ⚠（非通过单列）R10 公式参数缺失 → 手算复现跳过   P6 两条（见下）

$ node scripts/check-identifiers.js        # 8 处 I1 假红（独立取证证实 7 处标识符实存）
✗ docs/DECISIONS.md:2361 shenshi_pool_regen_ppm
✗ ../qiuyuan-dalu/docs/CREATION-DATA.md:128/129 purity_damage_influence_ppm / purity_cultivation_influence_ppm
✗ ../qiuyuan-dalu/docs/DATA-LAYOUT.md:179 qydl_role_name
✗ ../qiuyuan-dalu/docs/M1-IMPLEMENTATION.md:239/240/281/291 （purity_*×3 / spirit_root_p_damage_ppm）
  —— 前 7 个均命中 qydl_game_config.csv 的 param_key 值（已 grep 证实：:14/15/19/12 行）⇒ 假报警

$ 独立复算受管集合（不跑对方脚本，另写取键逻辑）
configKeys collected: 0        ← 复算复现：按 header.indexOf('key') 取，得 0 键（列已名 param_key）
shenshi_pool_regen_ppm | in keys? false | in fields? false
purity_damage_influence_ppm | in keys? false ...（全部 false，但 CSV 里真实存在）

$ node scripts/check-version-pins.js        # P6 软判据（G-7 落地实证）
⚠ P6 gbe-studio: 表=v0.6.5 真源=v0.9.1 —— 软判据：不阻断·但不许当没看见
⚠ P6 gbe-assets: 表=v0.7.0 真源=v0.9.0 —— 同上
  RESULT: PASS

$ node scripts/check-records.js | grep C6
✓ C6 回执要点 67 条（★ 内容已被消费，非只判非空）：T-0018…T-0055…（余 59 条见各卡）

$ node scripts/check-contract-gate.js
✓ G1 ROADMAP 声明的契约增量已全部展开（5 个实体：Account/Role/RoleRoot/RealmLevelConfig/GameConfig）
  —— 机制洞①（已裁 ADR↔契约没跟）仍无覆盖

$ for s in <8 个 check-*.js>; do node scripts/$s.js --self-test; done
check-data 75/75 · check-contract-gate 14/14 · check-identifiers 35/35 · check-records 107/107
check-doc-anchors 48/48 · check-asset-ref 13/13 · check-version-pins 20/20 · check-docs-index 12/12
  合计 324/324（独立实跑）

$ git log --oneline --since=2026-10-19 -S GATE_EPOCH -- scripts/check-records.js   # 空 ⇒ GATE_EPOCH 未移动，无洗白
```

**自测计数对账（X-0054 宣称 vs 独立实跑）**：X-0054 §四记 data67/contract14/ident35/records107/doc-anchors48/asset13/pins20/index12＝316。本次实跑除 **check-data 67→75（后续提交增 8 条规则，合理增长）** 外全部逐字吻合 ⇒ **X-0054 的反向用例计数非虚报**。
> 附注（不计缺陷）：X-0053 §1 曾读 doc-anchors=37/version-pins=13，而 X-0054 §四称其基线为 36/12（差 1）。两值差 1 不影响「现值 48/20 与 X-0054 后置声明一致」，判为 X-0053 逐条列举的口径笔误，留档。

**I1 根因结论（独立判定）**：**判据失效（假报警）**，非「文档真引用不存在的标识符」。
- 证据链：① dalem HEAD `1378f09`（2026-10-27）把 game_config 键列 `key`→`param_key`；② guild `configKeysFromCsv`/`check-data.js:882` 硬编码旧列名 → 受管键集塌成 0；③ 被报 8 处中 7 处在 CSV 里实存。
- ★ **处置路＝判据修正**（guild 侧）：取键改为「按位置取第一非 `##var` 列」或「认 `key`∪`param_key`」，并补「键列改名后仍能取键」的正/反覆盖用例（治 N-3）；`qydl_role_name`（N-4）另需让 I1 认得「反例列」引用或索引名，避免逼下游改文档。
- ★ 唯一例外是 `qydl_role_name`——非列名 bug，而是「判据认不出反例」，仍属判据修正，同样**不要求 dalu 改文档**。

---

## 五、机制缺口 ＋ 文档去留总表

### 5.1 机制缺口清单（每条给「该写进哪份既有文档」，不复述规则）

| 痛项 | 缺口 | 规则真源落点（去哪补，不另开文件） |
|---|---|---|
| **判据脆于下游改名** | I1/R10 取键硬编码 `key` 列名；反向用例只测旧形态 ⇒ 列名一改，生产判据静默失效（I1 假红／R10 假绿），`--self-test` 仍全绿 | `docs/CONVENTIONS.md` §7.1 纪律 2（脚本别假装能判形态）＋ §7.4 增「跨仓数据契约的列名取用须容错」人工检查点；代码修正归 `scripts/check-identifiers.js` `configKeysFromCsv` 与 `scripts/check-data.js:882` |
| **回执「读」闭环无落点** | v1.9 只规定「C6 捞 + arch 汇总进台账」，无脚本/门禁校验「验收结论区是否真被写过」⇒「只写不读」可退化为「只捞不落」 | `docs/REVIEW-PROCESS.md` §3 第 5 步（把「汇总」从口头改为有落点判据）＋ `scripts/check-records.js` C6 增「捞条数 vs 验收结论区行数」对照告警 |
| **U 待开卡超里程碑不自动显形** | 维护纪律 2 要求「超一个里程碑必重议」，但无任何脚本比对 U 行日期 vs 当前里程碑 ⇒ 全靠人眼 | `docs/CONVENTIONS.md` §7.1（或 `check-*` 清单）登记一条「U 老化」判据；正文规则已在台账「附:维护纪律 2」，缺的是执行机制 |
| **机制洞①（已裁 ADR↔契约没跟）仍空** | check-contract-gate G1 只核 ROADMAP 声明实体；已裁但契约未落的裁决面无覆盖（X-0054 遗留 1 未起） | 下轮开卡在 `contracts/` 完备性判据面；规则意图见 `docs/MULTI-AGENT-DEV-PLAN.md` §5 ＋ ADR-0031 类「已裁未落」条目 |
| **wontfix/due 到期告警未起** | 机制洞③ 只落 wontfix 可见，未做 `due` 日期比较 ⇒ 「另议」可永久挂账 | `docs/CONVENTIONS.md` §7.1 纪律 3（存量/新增分算）延伸；实现归 `scripts/check-docs-index.js` splitPending |

### 5.2 guild 文档去留总表（★ 排序只依客观量：站内引用数〔独立 grep -rl〕／是否被门禁 D1 点名／是否被 README·AGENTS 点名。禁主观分级。删除/搬家只出清单，执行 0）

| 文档（docs/ · registry/ · reviews/） | 它是什么 / 谁该读 | 站内引用数（`grep -rl basename`） | 门禁点名 | 被 README/AGENTS 点名 | 过没过时 | 结论 |
|---|---|---|---|---|---|---|
| `docs/CONVENTIONS.md` | 工程约定真源 / 改契约·门禁者 | 67 | D1/D5 | 是 | 现行（v0.7） | **保留** |
| `docs/DECISIONS.md` | ADR 台账（只追加） | 62 | A1 引用 | 是 | 现行（至 ADR-0037） | **保留** |
| `registry/cross-repo-ledger.md` | 跨库台账索引 | 62 | C2 | 是 | 现行（34 待验收待清，见 N-7） | **保留** |
| `docs/ROADMAP.md` | 里程碑路线 | 44 | G1 | 是 | 现行（v0.26） | **保留** |
| `docs/REVIEW-PROCESS.md` | 审阅流程 | 42 | D2 | 是 | 现行（v1.9，已提交） | **保留** |
| `docs/MULTI-AGENT-DEV-PLAN.md` | 生态总纲 | 33 | — | 是 | 现行 | **保留** |
| `docs/PROJECT-STRUCTURE.md` | UE 施工图 | 31 | **D1 点名**（check-doc-anchors:323） | 是 | 现行（§9 已改指针·X-0054） | **保留** |
| `registry/agent-log.md` | 派生视图（源=reviews/） | 31 | gen-agent-log | 是 | 视图，可重生成 | **保留** |
| `reviews/INDEX.md` | 审阅总索引（派生） | 26 | gen-review-index | 是 | 视图 | **保留** |
| `registry/version-pins.md` | 版本配套锚点表 | 17 | **P1/P6**（check-version-pins） | 是 | 现行（表落后真源，见 §四 P6） | **保留**（须刷新 studio 0.6.5→0.9.1 / assets 0.7.0→0.9.0） |
| `docs/ENVIRONMENT.md` | 环境/工具链台账 | 15 | — | 是 | 现行 | **保留** |
| `docs/MOBILE-PLAN.md` | 手机端专案 | 13 | — | 是 | 现行 | **保留** |
| `docs/SERVER-ARCH.md` | 服务端架构 | 13 | — | 是 | 现行 | **保留** |
| `docs/SKILL-ROUTING.md` | 角色→skill | 11 | — | 是 | 现行 | **保留** |
| `registry/schema-layers.md` | 三层 schema 索引 | 10 | — | 是 | 现行 | **保留** |
| `reviews/X-*.md`（60 篇） | 审阅判定正本 | 派生 | C1~C9 | INDEX 收录 | 只追加 | **保留** |

★ **删除 0 · 合并 0 · 归档 0 · 搬家 0**（本仓 `docs/` 无子目录、无写完即定稿的死文档；`check-docs-index` 实测「覆盖 10/10、无幽灵」，无黑户）。
★ 唯一「须动但不删」项：`registry/version-pins.md` 的 gbe-studio/gbe-assets 读数落后真源——P6 已软警提示，属刷新非删除。

---

## 本次未覆盖（必填）

1. **未审其余 5 仓对象**（dalu/gbe-studio/gbe-assets/虬渊大陆/ue-ai-ops）——本报告按派活口径**只审 guild**；跨仓一致性仅核到 guild 侧契约↔dalu 数据列名这一交点。
2. **未逐卡精读** X-0055~X-0061 正文与 X-0062（后者未跟踪，属并行 agent 在制品，不计入范围）。
3. **未跑 GitHub 侧 CI**（本地未推，只读审阅）。
4. **未改判据/未验证修复方案**：§四给出的「取键容错」为处置建议，未落码、未实跑修复后读数（只读纪律）。
5. **数值未复算**：契约公式、灵根/品质数值本次未独立复算（只核文档一致性）。
6. **工作区脏**：HEAD `8b44ca1` 之上有多名并行审阅 agent 的未提交产物（`reviews/work/qoderdesktop-lore/`、`zcode-*/`、`workbuddy-all-repos/`、`X-0062.md`、派生视图已改）——按「审阅快照」原则不入本次判定，仅声明其存在。

---

## 遗留问题（逐条给去向）

| # | 事 | 去向 | 须 ADR |
|---|---|---|---|
| 1 | N-1/N-2/N-3 I1·R10 取键硬编码 + 反向用例无覆盖（**根因＝判据失效/假报警**） | **guild**：改 `check-identifiers.js` configKeysFromCsv 与 `check-data.js:882` 容错 + 补覆盖用例 | 否（判据修正） |
| 2 | N-4 `qydl_role_name` 反例引用被误报 | **guild**：I1 认「反例列/索引名」或加豁免；★ 不要求 dalu 改文档 | 否 |
| 3 | N-5 回执「读」闭环未落地（验收结论区空） | **guild `arch` 例行**：把 C6 67 条汇总进 §三；或补告警判据 | 否 |
| 4 | N-6 U-0001~U-0005 待开卡超一里程碑未重议 | **guild**：下次开工逐条「提/撤」；可加老化判据 | 否 |
| 5 | N-7 待验收 34 行不降反升 | **guild**：随 #3 验收推进逐行转「已关闭」 | 否 |
| 6 | N-8 X-0059 缺审核/验证证据节，卡内自述与门禁不符 | **guild**：补两节或订正卡内 C1 声明 | 否 |
| 7 | G-6 残留：run-all 横幅「8 个校验脚本」与「10 条口径」并存 | **guild**：统一措辞 | 否 |
| 8 | 机制洞① G1 扩面（已裁↔未落） | **guild**：下轮开卡（先定解析口径） | 否 |
| 9 | 机制洞③ `due` 到期告警 | **guild**：下轮（机制③ 收尾） | 否 |
| 10 | `registry/version-pins.md` 落后兄弟仓真源（0.6.5↔0.9.1 / 0.7.0↔0.9.0） | **guild**：刷新配套表（软判，非阻断） | 否 |
| 11 | ADR 只追加 / supersedes 用法 / 契约三处一致性 | **无遗留**（本次核为通过） | — |

---

## 执行环境（可选 · 仅供回溯 · 不作质量判据）

- 工具：Qoder Desktop · Node（受管）· Git Bash on Windows
- 模型：Qoder Desktop · 底层模型不披露
- 日期：2026-10-27（GMT+8）
- 取证基线：`/tmp/guild-checks-20261027.txt`（主 agent 预跑读数，本报告全部独立复跑复核，未直接采信转述）
