# qiuyuan-guild 项目群复审源材料 —— 机械判据 · 上次缺陷复验 · 增量与一致性（2026-10-27）

## 头部元信息

| 项 | 值 |
|---|---|
| **来源** | ZCode · 大人在 ZCode 会话派出（项目群全量复审，按对象分工 · `REVIEW-PROCESS.md` §10.2） |
| **Agent 名称** | ZCode-guild-reviewer |
| **大模型** | GLM-5.3-Flash |
| **审查时间** | 2026-10-27（GMT+8） |
| **审查对象** | `qiuyuan-guild` @ `8b44ca1`（全 hash `8b44ca12ac0f20f0f6d2473a8fbcb50e766c7610` · 2026-10-25 18:41 +0800「feat(contract): 神识改名 ＋ 余量池 ＋ 强度拆两段」）；**工作区不干净**（见下） |
| **与前作的关系** | 本报告是**源材料**（非 `X-*` 判定正本）。前作链：`X-0053`（10-18 全量）→ `X-0054`（10-19 修复）→ `X-0055/0056/0057`（分仓销号）→ `X-0058~0061`（契约增量）→ **`X-0062`（同日 2026-10-27 00:19 周期复审，guild 判不通过）**。本次为独立复审，与 `X-0062` **互为印证**：其 guild 侧四项发现（I1 误报群 / R10 假绿 / CONVENTIONS 脚本数 / X-0059 缺节）本轮全部独立复现仍在（见 §三）。 |
| **硬约束确认** | guild 仓**零字节改动** ✓（未改 scripts/ docs/ contracts/ registry/ reviews/ 任何既有文件；唯一写入 = 本报告自身）；未执行 git commit / push / checkout / stash ✓；临时脚本只写系统临时目录（`/tmp/extract-c6.js`，只读复捞 C6 清单）✓；对上游三库一律只读 ✓ |

**工作区状态（如实登记，未做任何处置）**：

```text
$ git status --porcelain
 M registry/agent-log.md
 M registry/cross-repo-ledger.md
 M reviews/INDEX.md
 D reviews/work/mimo-qiuyuan-dalu/PROJECT-REVIEW-MiMoDesktop-MiMo-2026-10-01.md
 M scripts/gen-review-index.js
```

⇒ 有**未提交的进行中改动**（mimo 报告搬移/去重 ＋ 索引重生成中途）。**本次 `gen-review-index` 的红由此产生**（§二·注 2），不是 HEAD 的缺陷；`X-0062` 在其快照（今日 00:19）实测该项是通过的（9/10 仅 identifiers 红）。

**审查范围（★ 必填）**

- **覆盖**：① 8 个判据脚本全量机械跑 ＋ 8 套反向自测 ＋ C6 回执要点全量复捞；② `X-0054` 声称修复的 7 缺陷 ＋ 7 机制洞逐条抽验；③ `X-0053` 遗留 #7（契约回执消费端）；④ 2026-10-19 以来 17 笔提交的增量（契约版本 / §4 角色列表 / M5 物品域九表与 63 上界 / 神识拆两段 / ADR-0033~0037）；⑤ W 类遗留去向逐条核销（W-01/10/16/17/19/20/21/22/23、C-3、S-12）；⑥ 台账待验收行数与 U-0001~U-0006；⑦ README / AGENTS / CONVENTIONS 声明 vs 实际 ＋ REVIEW-PROCESS 版本锚。
- **未覆盖**：`X-0062` 全部遗留项的销号复核（其正本自带，避免重复劳动）；`X-0055/0056/0057` 销号记录的逐条复跑（属 dalu / gbe 双仓对象，本轮有对应专职 agent）；数值独立复算（本对象无新数值产物；神识数值口径改动由 `X-0061` 记录在案且 dalu 侧已实测）；GitHub 侧 CI 实跑；世界观库（`虬渊大陆`）三台账增量标注（§10.3 专项，有专职 agent）。

---

## 一、判定（二值 · 禁评分）

| # | 审阅项 | 判定 | 依据（证据见 §二/§三/§四/§五） |
|---|---|---|---|
| 1 | 机械门禁（8 判据脚本全量） | **不通过** | `check-identifiers` **42 错**（40 误报 ＋ 1 真缺陷 ×2 处）；`gen-review-index` 红（工作区未提交改动所致，非 HEAD） |
| 2 | 反向自测 8 套 | **通过** | 75/14/35/107/48/13/20/12 全绿，全部 ≥ 上次基线 |
| 3 | `X-0054` 修复抽验（7 缺陷 ＋ 7 机制洞） | **通过** | 7 条缺陷全部在当前 HEAD 闭合；机制洞 ①❌ / ③半 为**如实登记**，非虚报（§四·表 1） |
| 4 | `X-0053` 遗留 #7 契约回执消费端 | **不通过** | C6 捞 67 条在跑，但台账「三、验收结论区」**仍为空** —— 机制上半截落地（§四·表 2） |
| 5 | 增量（17 笔提交 / 契约 / ADR-0033~0037） | **通过** | 两契约升版自洽、配套表同步、ADR 连续追加合规（§五） |
| 6 | W 类遗留去向 | **不通过** | W-01 / W-20 / W-21 / W-22 / W-23 / S-12 悬空；台账待验收 27 → **31~32 行不减反增**（§六） |
| 7 | 文档一致性（说的和真源一致） | **不通过** | CONVENTIONS「全部 8 个」vs 实跑 10 步；R10 假 ✓ 行；X-0059 缺三节（§三·缺 3~5） |

**总判：不通过。**（机械红未清 ＋ 回执消费端空转 ＋ 文档漂移三处 ＋ W 类悬空 6 条）

---

## 二、机械判据（命令 ＋ 实际输出）

### 1. 全量门禁

```text
$ node scripts/run-all-checks.js        # guild 仓根
[PASS] check-data.js          通过（9 项通过 / 7 警告）
[PASS] check-contract-gate.js 通过（1 项通过 / 0 警告）
[FAIL] check-identifiers.js   ✗ I1 × 8 行（★ 汇总入口对失败脚本只打印前 8 行，实为 42 错 —— 见缺 2）
[PASS] check-doc-anchors.js   通过（23 项通过 / 0 警告）★ D2：审阅 skill 与流程文档版本一致（v1.9）
[PASS] check-asset-ref.js     通过（5 项通过 / 0 警告）
[PASS] check-version-pins.js  PASS（⚠ P6 × 2：gbe-studio 表 v0.6.5 vs 真源 v0.9.1；gbe-assets 表 v0.7.0 vs 真源 v0.9.0 —— 软判据，可见不掩盖）
[PASS] check-docs-index.js    覆盖 10/10（100%），无幽灵
[PASS] check-records.js       通过（30 项通过 / 3 警告：X-0059 缺「改动清单/验证证据/审核」三节）
[PASS] gen-agent-log.js       逐字节一致（60 篇记录 → 73 行）
[FAIL] gen-review-index.js    ✗ 与仓库内文件不一致 —— 视图已滞后于 reviews/
通过 8 / 10 个脚本   FAILED: check-identifiers.js, gen-review-index.js   EXIT=1
```

> **注 1**：`check-data` 的 7 条警告 ＝ R8 行尾空单元格（protocol-contract.md:209/210/216/217）＋ R10 公式参数缺失跳过 ＋ 其余存量，可见不掩盖。
> **注 2**：`gen-review-index` 的红与头部登记的 5 处未提交改动对应（mimo 报告 `D` ＋ `INDEX.md`/生成器 `M` 中途）；归因**工作区**，非 HEAD。

### 2. 反向自测 8 套（逐套实跑）

```text
$ for s in check-data check-contract-gate check-identifiers check-records check-doc-anchors check-asset-ref check-version-pins check-docs-index; do node scripts/$s.js --self-test; done
check-data           75 / 75   EXIT=0   （上次基线 67）
check-contract-gate  14 / 14   EXIT=0   （14）
check-identifiers    35 / 35   EXIT=0   （35）
check-records       107 / 107  EXIT=0   （102 → 107）
check-doc-anchors    48 / 48   EXIT=0   （36 → 48）
check-asset-ref      13 / 13   EXIT=0   （13）
check-version-pins   20 / 20   EXIT=0   （12 → 20）
check-docs-index     12 / 12   EXIT=0   （ 9 → 12）
```

全部 ≥ 派单给的基线（67/14/35/102/37/13/13/9）。★ 但 `check-identifiers` **自测 35/35 全绿与实跑 42 错并存** —— 自测绿 ≠ 判据有效（`X-0062` 的核心教训，本轮再次成立，见缺 1）。

### 3. C6「契约回执要点」单跑捞条（v1.9 新消费端）

```text
$ node scripts/check-records.js
  ✓ C6  已豁免（留证）17 项：T-0001 ~ T-0017（存量，机制 X-0016 才落）
  ✓ C6  回执要点 67 条（★ 内容已被消费，非只判非空）：T-0018·… ｜ T-0022·…（余 59 条见各卡）
```

**捞到 67 条**（`X-0054` 时点为 52 条存量，现随新增卡增长）。已用临时脚本复用门禁自己的 `receiptHighlights()` 全量复捞核对，**67 条逐条与门禁同源**（抽样见 §四·表 2）。有信息量的缺口类要点包括（未穷举）：`list_characters_fail`（T-0055/0078/0093，契约 §3.1 已于 v0.5 补行）、`resume` 动作（T-0079/0080）、`delete_character`（T-0059/0060/0081）、REST 错误码表（T-0025）、限流未定义（T-0057）、佩戴/卸下储物法宝动作与 `is_currency` 余额挂点（T-0116）、`GUILD-PROPOSAL-X0065` 字段形状待收编（T-0133）等 —— **这些要点没有任何一处被汇总**（见缺 6）。

---

## 三、缺陷清单（每条 = 命令/文件：行 ＋ 实际输出）

### 缺 1【严重】`check-identifiers` 42 错 ＝ 40 误报 ＋ 1 真缺陷 ×2 处 —— guild 门禁写死 CSV 列 `key`，dalu T-0139 已改名 `param_key`（`X-0062` 缺陷 #1 在当前 HEAD **未闭合**）

```text
$ node scripts/check-identifiers.js          # 实测 42 错，按标识符分布：
  13 purity_damage_influence_ppm ｜ 9 purity_cultivation_influence_ppm
   6 spirit_root_p_damage_ppm     ｜ 6 spirit_root_p_cultivation_ppm
   5 shenshi_pool_regen_ppm       ｜ 1 qydl_role_name   ｜ 2 qydl_realm_life_config

$ head -2 F:/zxc/Project/qiuyuan-dalu/data/datas/qydl_game_config.csv
  ##var,param_key,param_value,category,comment          ← 表头已是 param_key（dalu 1378f09 · 2026-10-27 00:03「T-0137+T-0139 命名排查与改名」）

$ scripts/check-identifiers.js:154
  const ki = header.indexOf('key');                      ← 仍找 'key' ⇒ ki = -1 ⇒ 键集合取空
```

**分类证据**：五个 `*_ppm` 键在 dalu 当前 CSV **逐键都在**（`grep -c "^,$k," = 1/1/1/1/1`）⇒ 40 条全是**误报**；`qydl_role_name` 出现在 dalu `DATA-LAYOUT.md:179` 的「错误示例」列 ⇒ 误报。**真缺陷 1 个 ×2 处**：`qydl_realm_life_config`（已退役表名）在 `registry/cross-repo-ledger.md:89`（X-0062 自己那行）与 dalu `PITFALLS.md:2098` 被引用，而 `scripts/check-identifiers.js` 的 `RETIRED` 花名册里**没有登记**（`grep realm_life scripts/check-identifiers.js` 零命中）⇒ I1 长红。与 `X-0062` 的 41 锚差 1 ＝ 台账 X-0062 行本身新增了一处引用，自洽。

### 缺 2【轻 · 可见性】汇总入口对失败脚本只打印前 8 行，42 错被遮成 8 错

```text
$ scripts/run-all-checks.js:121
  r.out.trim().split(/\r?\n/).filter(l => /✗|FAIL|不通过/.test(l)).slice(0, 8)
```

FAIL 状态与退出码正确（不会被误判通过），但**报错条数失真**（8/42），读汇总的人会低估缺口面。登记为观察项，处置 guild 自裁。

### 缺 3【中】R10 假 ✓ 行仍在（`X-0062` G-2 未闭合）

```text
$ node scripts/check-data.js
  14:  ✓ R10  配置表内容断言通过（20 张表：字段数 / 概率合计 / 倍率单调 / 公式复现 / 物品域档位与两轴与强化）
  21:  ⚠ R10  公式参数缺失（`spirit_root_variant_value` / `spirit_root_anchor` / `spirit_root_p_damage_ppm`）→ 手算复现跳过
```

同一轮输出里，✓ 行**宣称「公式复现」已过**，⚠ 行**承认公式复现已跳过** —— 正是「虚假的安心」。

### 缺 4【中】`CONVENTIONS.md:432` 写「依次跑上面**全部 8 个**」，实跑 10 步（`X-0062` G-4 未闭合）

```text
$ sed -n '432p' docs/CONVENTIONS.md
  node scripts/run-all-checks.js  # ★★ 汇总入口 —— 依次跑上面**全部 8 个**，任一红即退出码 1
$ grep -c "{ file:" scripts/run-all-checks.js
  10                                           ← 8 个判据 ＋ 2 个视图生成器，实跑 10 步
```

`D5` 恰不扫 CONVENTIONS（只锚 README/AGENTS/REVIEW-PROCESS/skill），所以这条漂移无门禁可拦。

### 缺 5【中】`X-0059` 仍缺「改动清单 / 验证证据 / 审核」三节（`X-0062` G-5 未闭合）

```text
$ node scripts/check-records.js
  ⚠ C1  1 篇记录缺「改动清单」节：X-0059
  ⚠ C1  1 篇记录缺「验证证据（或门禁）」节：X-0059
  ⚠ C1  1 篇记录缺「审核」节：X-0059
```

三节全缺却已作为「采纳记录」发布并登记台账（C2 双向核对通过）—— 存量 warn 不构成不通过，但该卡是 ADR-0035 的凭证记录，缺审核节意味着触发级别无载体。

### 缺 6【中】契约回执**只捞不读**：台账「三、验收结论区」仍为空，67 条要点零汇总（`X-0053` 遗留 #7 只落地了上半截）

```text
$ sed -n "$(grep -n '验收结论区' registry/cross-repo-ledger.md | head -1 | cut -d: -f1),+8p" registry/cross-repo-ledger.md
  ## 三、验收结论区
  | 编号 | 上游接单人 / 记录位置 | 验收结论 | 验收人 | 日期 |
  | — | （暂无） | — | — | — |          ← 空
```

`REVIEW-PROCESS.md` §3 第 5 步（v1.9）规定「`arch` 每周把该清单汇总进台账验收结论区」—— C6 捞条机制在跑（67 条），**汇总一次都没发生过**。回执里挂着的真缺口（如 `resume` / `delete_character` / REST 错误码表 / 储物法宝佩戴动作）因此**收上来无人看**。

### 缺 7【中】台账「待验收」不减反增：27 → 31~32 行，已关闭仅 4 行（`X-0053` 遗留 #23 未办）

```text
$ node（UTF-8 解析 registry/cross-repo-ledger.md 的 X/U/W 行状态列）
  行总数 = 66   状态分布：`已关闭` ×4 ｜ `待验收` ×31（另有 1 行不带反引号同态）｜ `待复核` ×16 ｜ `进行中` ×5 ｜ `待开卡` ×5 ｜ 其余带注记
```

`X-0053` 遗留 #23 要求「逐行核对转已关闭」—— 8 天过去**待验收行还在变多**（新增 X-0058~0062 五行全进待验收/进行中），销号速度跟不上新增速度。

### 缺 8【严重】W-01 境界 82 台阶 vs 实现 90 行 vs 上游十层 —— 契约/ADR-0004 落后，guild 侧无 ADR 无台账行

```text
$ grep -n "82" contracts/data-contract.md（节选）
  48: | 境**内**粒度 | **`1~9`**，第 9 层 = **圆满**；炼气恒 `1~10` | **ADR-0004** |
  49: | 总台阶 | **82**（炼气 10 + 8 境 × 9） | 由上两项导出 |
  293: **合计 82 台阶**（炼气 10 + 8 境 × 9）。
$ grep -c "^" F:/zxc/Project/qiuyuan-dalu/data/datas/qydl_realm_level_config.csv
  91                                            ← 表头 ＋ 90 行（T-0135 已补满九境十层）
```

上游世界观 V1.66 已裁十层（V1.73/V1.74 已自修九层残留，`X-0062` §一·5）；dalu 实现已 90 行且备好提案 `GUILD-PROPOSAL-X0067`；guild 侧 `DECISIONS.md` 无对应 ADR、`DECISIONS.md:2296` 的 M5 待裁行仍挂着 82 台阶口径 ⇒ **悬空**。

---

## 四、上次缺陷复验结果

### 表 1 · `X-0054` 声称的 7 条缺陷（逐条在当前 HEAD 抽验）

| # | X-0054 声称 | 本轮实证 | 结论 |
|---|---|---|---|
| G-1 | README/AGENTS 五类事实漂移：删记录号区间与里程碑状态列、§10 订正 | `grep 记录号区间\|里程碑状态 README.md` 零命中；`AGENTS.md:261`「门禁怎么跑（CI 已有）」、`:265` 订正注、`:286`「CI 的诚实边界」均在 | **已闭合** |
| G-2 | PENDING_RULES 两条被注释 → E4 转 wontfix 可见条目、P2 真做成 P6 | `check-docs-index.js:45-47` E4 `status:'wontfix'` 带理由与条件触发；`check-version-pins.js:115` P6 落地，实跑有 P6 warn 输出 | **已闭合** |
| G-3 | 契约回执只写不读 → C6 增要点提取 | 本轮实跑捞到 **67 条**，门禁自称「内容已被消费，非只判非空」 | **捞条侧已闭合**（消费侧未落地 → 缺 6） |
| G-4 | X-0049 补审核节；证据节判据改并集 | `reviews/X-0049.md:72`「## 六、审核（2026-10-19 只追加）」在；`check-records.js:252-260` 双模板证据节形态并集在 | **已闭合** |
| G-5 | L2 会审无载体 → §7.4 加第 3 号 | `CONVENTIONS.md:527` 第 3 号「L2 会审是否触发」行在（二值＋一行理由） | **已闭合** |
| G-6 | run-all-checks 头注释过期 ＋ STEPS 标签硬错 | `run-all-checks.js:16`「CI 已有」现状追加；`e963930` diff：`C1~C8` → `C1~C9`，D 段标签改写 | **已闭合** |
| G-7 | 版本钉靠人抄 → P6 兄弟仓软判 | `check-version-pins.js:211-217` 实现完整；实跑输出「读到 2/2 项」＋两仓不一致 warn | **已闭合** |

### 表 2 · `X-0054` 的 7 个机制洞

| 洞 | X-0054 自报 | 本轮实证 | 结论 |
|---|---|---|---|
| ① G1 扩「已裁但契约没跟」 | ❌ 未做（登记遗留 1） | 现状仍只有 G1 一条；W-01（82 vs 90）正属此类缺口且**真实发生了** | 如实登记 ✓，缺口实际存在 |
| ② C1~C5 证据节并集＋审核节真有节 | ✅ 已做 | 代码与 C1/C3/C4 输出吻合（X-0059 由 C1 warn 抓到，未误杀） | 已闭合 |
| ③ PENDING_RULES wontfix ＋ 到期告警 | ⚠️ 半做 | wontfix 在跑（E4 可见输出）；`due` 告警未做（`check-docs-index.js:45` E4 仍只有条件触发文案） | 如实登记 ✓ |
| ⑥ C4 → §7.4 第 3 号 | ✅ 已做 | 同 G-5 | 已闭合 |
| ⑦ C6 捞条 ＋ arch 每周汇总 | ✅ 已做 | 捞条在跑；**每周汇总零次**（缺 6） | 半截（与 X-0054 自报口径一致，但「已做」实为「捞条已做」） |
| 跨切面 CI（三仓统一） | ⚠️ 仅 guild | 未复跑别仓（范围外，各有专职 agent） | 不判 |
| D5 扩四类易腐事实 | ✅ 已做 | D5 实跑通过（23 项）；反向用例在 `check-doc-anchors` 48 条内 | 已闭合 |

### 表 3 · `X-0053` 遗留 #7（契约回执消费端）—— 不通过

| 验什么 | 命令/位置 | 实测 |
|---|---|---|
| 台账验收结论区是否仍空 | `registry/cross-repo-ledger.md` §三 | **仍空**（「（暂无）」） |
| C6 捞出的要点有没有被汇总过 | 全台账检索 | **零条**进验收结论区 |
| 结论 | 机制⑦的「读」半截落地：捞条 ✓（67 条），消费 ✗（0 汇总） | **不通过** |

---

## 五、增量与契约现状（2026-10-19 以来 17 笔提交）

### 1. 提交清单（实跑 `git log --oneline --since=2026-10-19` ＝ 17 笔）

`e963930`(X-0054 修复) → `612107a`(10-01 报告去重) → `f864c0c`/`a70506d`(X-0054 回填/计数订正) → `0857dd3`(X-0055 dalu 销号) → `99b4dfe`/`7c6295e`/`d1f6e94`/`2b253b5`(X-0056/0057 双仓销号) → `38061af`(X-0048 回写) → `2d8b628`(§4 角色列表·ADR-0035) → `44f951c`/`8dd3efa`/`f2f3cf0`(X-0059 补记) → `030a70e`(豁免登记) → `2205648`(M5 物品域·ADR-0033/0034) → `8b44ca1`(神识拆两段·ADR-0036/0037)。与派单预期（X-0054~X-0061、ADR-0033~0037、契约升版）一致。

### 2. 契约现状（三处增量各自在所在章节存在且自洽）

| 项 | 命令/位置 | 实测 |
|---|---|---|
| 版本号 | `contracts/data-contract.md:3` / `protocol-contract.md:3` | **v0.11** / **v0.10**（2026-10-25，ADR-0037） |
| 版本配套表 | `registry/version-pins.md:20-21` | `protocol-contract v0.10` / `data-contract v0.11` —— **与契约一致**（P 系门禁 PASS 输出在 §二） |
| §4 角色列表（X-0059·ADR-0035） | `protocol-contract.md:289` | `GET /api/characters?keyword=&limit=&offset=` 行在（GM 只读、limit 上限 200、带 ADR-0035 标注）—— ★ 表格式写法，按 `GET | /api/characters` 分列 |
| M5 物品域九表（X-0058·ADR-0033） | `data-contract.md:584-599` §7.0 | 「需求层九表 ＋ 本仓既有 WorldDrop」；`:599`「九张表一张不漏」 |
| 品质 63 上界 | `data-contract.md:642,652,673` §7.3 | 轨道 1 七品九阶，`quality` 上界 = **档数 × 阶数 = 63**（算式给，明文不许写死 54/63） |
| 神识拆两段（X-0060/61·ADR-0036/0037） | `data-contract.md:188,347-348` / `protocol-contract.md:211-212,373-374` | `shenshi_cultivation`（修炼段）＋ `shenshi_start`/`shenshi_step`（境界段两列）＋ `shenshiFromRealm`/`shenshiCultivation` 两段都下发 ＋ 上限改挂境界段；两份契约变更记录（v0.11/v0.10）互指同笔 |

### 3. DECISIONS.md：ADR-0033~0037

```text
$ grep -n "^## ADR-003" docs/DECISIONS.md
  2178 ADR-0033（M5 物品域展开）  2237 ADR-0034（两条拒绝回包）  2306 ADR-0035（GET /api/characters）
  2342 ADR-0036（神识改名＋余量池） 2382 ADR-0037（神识拆两段，supersedes 部分推翻 ADR-0036 裁决 2）
```

五条全部存在、编号连续、汇总表与正文双份齐备；ADR-0037 的推翻以**追加新条目**表达（`:2386` 写明 ADR-0036 哪些保留），历史条目未改写 —— 格式合规。

---

## 六、W 类遗留去向核销（X-0053 §三·5 → 现状）

| 项 | 内容 | 现状（命令/位置 → 实测） | 判定 |
|---|---|---|---|
| **W-01** | 境界 82→90 | 契约仍 82（`data-contract.md:48,49,279,293`）；dalu 实现 91 行文件 = 90 行数据（T-0135）；上游 V1.73 已定十层；dalu 提案 X0067 待 guild 接 —— guild **无 ADR、无台账行** | **悬空** |
| **W-10** | 属性 15 vs 面板 18 | 契约侧已收：ADR-0030（`DECISIONS.md:2000`）落 §3.3.1 一级 18 项清单，「无源就明说无源」；上游对齐侧仍标无源 | **部分收口**（契约侧已裁，上游侧按无源显式登记） |
| **W-16/17** | 装备三套槽位 | 契约三处 `deferred` 一字不删（`data-contract.md:104,595,602,768`，ADR-0031 ⑤）；`DECISIONS.md:2298` 口径澄清（待裁的是「做不做」与「要不要 12 部位」） | **仍待裁**（有意挂起，非遗忘） |
| **W-19** | 主菜单硬封顶 8 vs 实现 15 | ADR-0028（`DECISIONS.md:1936`）把 15 格收进 M2 出口判据，越界既成事实追认 | **已裁** |
| **W-20** | 键位 M/Alt/Tab 三处冲突 | `grep 键位 docs/DECISIONS.md` 无裁决痕迹；去向标「大人裁（X-0035）」，X-0035 提案在 dalu 侧 | **悬空** |
| **W-21** | 角色页立绘布局两说 | 同上，无裁决痕迹 | **悬空** |
| **W-22** | 修为口径（上游区间累计 vs 实现每层） | dalu 实现已改「大境界区间按层派生」并删 `exp_max` 列（X-0062 #4）；契约 §4.1/§6 未收编该变化 | **悬空**（实现单方面走了，契约未跟） |
| **W-23** | `expMax` 粒度（每层 vs 当前境界） | 无 ADR 痕迹 | **悬空** |
| **C-3** | `equip_*` 三行 deferred | 同 W-16/17，契约原文保留（ADR-0033 ⑤「一字不删」） | **仍待大人点头**（有意挂起） |
| **S-12** | 寿元上限表分叉（上游 A 案 vs 契约公式） | `data-contract.md:310-317` 仍是等比公式口径（「精确倍率待数值标定」）；`grep 寿元 docs/DECISIONS.md` 只有「进不进面板」条目，**无上限表 ADR** | **悬空**（X-0053 §十二建议开 ADR，未开） |

**小结**：已裁 2（W-19 ＋ W-10 契约侧）· 有意挂起 2（W-16/17·C-3）· **悬空 6**（W-01、W-20、W-21、W-22、W-23、S-12）。

---

## 七、文档一致性（guild 是规范中枢，重点查「说的和真源一致」）

| 声明处 | 声明 | 实测 | 结论 |
|---|---|---|---|
| `README.md:58-65` 脚本清单 | 8 个 check-* 带 `C1~C9`/`D1~D5`/`P1~P6` 标签 | 与 `scripts/` 实有脚本逐一对应 | ✓ |
| `AGENTS.md:261-292` §10 | CI 已有 / 10 条口径 / 覆盖点 5 处 / 诚实边界 | 与 `run-all-checks.js`（10 步）及 `.github/workflows/ci.yml` 存在相符 | ✓（X-0054 G-1 修复在位） |
| `docs/REVIEW-PROCESS.md:8` 版本 v1.9 | skill 锚 | 门禁输出「✓ D2 审阅 skill 与流程文档版本一致（v1.9）」 | ✓ |
| `docs/CONVENTIONS.md:432` 「全部 8 个」 | 实跑 10 步 | 见缺 4 | ✗ 漂移 |
| `check-data.js` R10 ✓ 行 | 宣称公式复现 | 实际跳过（缺 3） | ✗ 自相矛盾 |

---

## 八、遗留（逐条给去向，不就地扩审）

| # | 事 | 去向 |
|---|---|---|
| 1 | 缺 1：`check-identifiers.js:154` 适配 `param_key` ＋ `qydl_realm_life_config` 进 RETIRED 花名册 | guild 修复卡（可沿用 `X-0062` §五的建议；本报告补了逐键分类证据） |
| 2 | 缺 3：R10 跳过时不得打「公式复现」✓ 行 | guild 修复卡（一行文案判据修正） |
| 3 | 缺 4：CONVENTIONS「8 个」→ 以 `STEPS.length` 口径表述（「8 判据 ＋ 2 视图」），或把 CONVENTIONS 纳入 D5 扫描面 | guild（后者需扩域评估，先改数） |
| 4 | 缺 5：X-0059 补三节（只追加，不改已发布正文的其他部分） | guild 修复卡 |
| 5 | 缺 6：`arch` 立即补一次「回执要点 67 条」汇总进台账验收结论区，并把每周例会化 | guild（`REVIEW-PROCESS` §3 第 5 步的欠账） |
| 6 | 缺 7：台账 31~32 行待验收逐行销号（`X-0053` 遗留 #23 的欠账，且新增快于销号） | guild 例行销号轮 |
| 7 | 缺 8：W-01 境界 82→90 开 ADR（收 dalu 提案 X0067；连带 W-22/W-23 修为派生口径与 `exp_max` 删除的收编、§4.1 RealmLevelConfig 90 行化） | guild ＋ 上游（须 ADR） |
| 8 | W-20/W-21（键位、角色页布局）摆选项请大人裁 | 大人裁 → 落 ADR |
| 9 | S-12 寿元上限表分叉开 ADR（X-0053 §十二已建议，至今未开） | guild ＋ 上游（须 ADR） |
| 10 | 缺 2：run-all-checks 失败输出截断 8 行的可观察性 | guild 自裁（低优先） |
| 11 | X-0062 其余 guild 侧发现（`shenshi_*` 无机械断言等） | 其正本 §遗留 已给去向，本轮不重复登记 |

---

## 本次未覆盖

1. **`X-0062` 遗留项的销号复核**（其 2026-10-27 正本自带，重复劳动违反 §10.1）——只对其中 guild 四项做了**独立复现印证**（均仍在）。
2. **`X-0055/0056/0057` 销号记录的逐条复跑** —— 属 dalu / gbe 双仓对象，本轮按对象分工有专职 agent。
3. **数值独立复算** —— 本对象本轮无新数值产物；神识数值口径变化已在 `X-0061` 记录并由 dalu `T-0130` 实测。
4. **GitHub 侧 CI 实跑**（本地快照审查，未触发 push）。
5. **世界观库（虬渊大陆）三台账增量标注**（§10.3 专项）—— 有专职 agent；本轮只消费了「V1.73/V1.74 已自修九层残留」这一结论（引自 `X-0062`，未独立核验原文）。
6. **工作区 5 处未提交改动的意图判断** —— 只登记事实（mimo 报告删除＋索引/生成器修改中途），不推断动机、不代为处置。

---

## 执行环境（可选 · 仅供回溯 · 不作质量判据）

- 工具：ZCode CLI · Git Bash on Windows · Node（guild 受管）· 临时脚本 `/tmp/extract-c6.js`（只读）
- 模型：GLM-5.3-Flash（account:zai-start-plan/GLM-5.3-Flash）
- 日期：2026-10-27（GMT+8）；快照 guild `8b44ca1`（工作区脏，见头部）；dalu `1378f09`（审查期间确认未再移动）
