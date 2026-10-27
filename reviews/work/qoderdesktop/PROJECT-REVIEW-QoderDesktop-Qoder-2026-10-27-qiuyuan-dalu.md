# PROJECT-REVIEW-QoderDesktop-Qoder-2026-10-27 —— 对象 `qiuyuan-dalu`

- 来源：**Qoder Desktop 主 agent 派出的 sub-agent**（内部源材料 · 本仓派出 · 只审一个对象）
- Agent 名称 / 大模型：Qoder Desktop agent ／ 底层模型不披露（依 `ADR-0007` 指纹非评价）
- 审查时间：2026-10-27
- 审查对象：`qiuyuan-dalu`（F:/zxc/Project/qiuyuan-dalu，UE 客户端 ＋ 服务端 ＋ 设计流水线）
- 审阅快照：guild `8b44ca1` ／ dalu `1378f09`（★ 门禁基线 `GATE_EPOCH` 未触碰、未推进）
- 与前作关系（`REVIEW-PROCESS.md` §10.1）：**复审** —— 复跑 `X-0053` §三-2 的 D 系列，只登记 `4ecfd70..1378f09` 之后的新增变化；未变部分沿用旧结论＋指针，不重抄
- 覆盖：D 系列复跑 ＋ 25 笔新增提交（T-0109~T-0139）＋ 境界数值链独立复算 ＋ 机械判据实跑
- **未覆盖**：见 §五（★ UE 编辑器不在场 ⇒ T4/T8 未实跑；未连活库；未审 C++ 编译与 PIE；未审 GM 前端实现）
- 硬约束确认：只读 ✓ 未改被审对象 ✓ 删除类只出清单 ✓
- ★ **主 agent 订正两处**（订正处标 `【订正】`，原句保留）：I1 实跑读数、以及本报告 §四 的 T4/T8 口径。

---

## 一、D 系列逐条复跑（三态）

| # | 复跑命令（可粘） | 实测 | 三态 |
|---|---|---|---|
| D-1 | `grep -n "下一步 M1\|待审核" README.md` | **:24**「M0 契约层地基已完成 → **下一步 M1**」、**:106**「`docs/M1-IMPLEMENTATION.md`（实施详案 · **待审核**）」—— 与 :33「✅ 已收口」互斥；`git show 4ecfd70:README.md` 证明这两行**当时就在** | ❌ **销号主张不成立**（判据过宽 → 假绿）→ 见 **N-9** |
| D-2 | `node tools/check-db-naming` / T8 段 ＋ 递归数 layout 节点 | login 已进 `gen-umg-layout.py` 链、layout = **81**、T8 列表含 `WBP_LoginScreen`（`check-gates.bat:206`）⇒ 结构分叉已合；`X-0057` 追加的三方不等（72/70/82）已消 | ✅ **已销**（★ 本会话编辑器未开，layout↔WBP 无法实跑复证，采信 `T-0110` §105/113/131 与 `X-0057` §100 的实跑留档：**预期 81 / 实际 81 / 几何 81/81 PASS**） |
| D-3 | `grep -nE '63 条\|18 条\|85 条' docs/README.md docs/PITFALLS.md AGENTS.md docs/ARCHITECTURE.md` | 仅命中 PITFALLS:1818 的**历史叙述**；四处真源全改为「以 `grep -cE '^### A[0-9]+'` 现算」；`T12` = **108/108 双向一致** | ✅ **已销**（未复发） |
| D-4 | `grep -n "TODO M3\|QYDAttributePanelData" docs/M1-IMPLEMENTATION.md` | `exp_max` 两处已改「已补」并追加 T-0134 派生说明；契约版本链无 v0.3 残留；`QYDAttributePanelData` 仅 2 处且**均带「从未存在」限定** | ✅ **已销** |
| D-5 | 自写 `node` 数 `design/specs/ui-spec.*.json` 的 `widgets.length` | **11 份 / 合计 861**（splash 48 · login 72 · select 27 · create 30 · attribute-panel 205 · logout-confirm 14 · main-hud **164** · spell 104 · friend 58 · settings 11 · bag 128）；`DESIGN-ARTIFACTS.md:78-79` 仍写「**七份** … **合计 564**」「主界面 **168**」 | ⚠ **复发** → 见 **N-8** |
| D-6 | `grep -n "最新 \*\*ADR-" docs/ARCHITECTURE.md` vs guild `grep -oE 'ADR-[0-9]{4}' docs/DECISIONS.md \| sort -u \| tail -1` | dalu 写 **ADR-0032**，guild 实到 **ADR-0037** ⇒ 又落后 5 条 | ⚠ **复发**（处置口径本身留了手抄位） |
| D-7 | `ls records/shots/*.png \| xargs -n1 basename \| grep -vcE '^T-'` | **18** 个无卡号，与 `records/shots/INDEX.md` 的 18 行**逐条对上**；本批新截图全部带卡号 ⇒ 规则对新增生效 | ✅ **已销**（附小瑕：INDEX 自带复算命令实测 **19**，把 `INDEX.md` 自己算进 ⇒ 命令与读数不自证） |
| D-8 | `ls ue-client/UI-LAYOUTS/*.json \| wc -l` ＋ README 给的读数命令 | 实际 **10 份**；README 写「现为 **6 份**」、MainHUD 写 **201**（实测递归 **197**），缺 bag/spell/friend/settings 四行 | ⚠ **复发** → 见 **N-8** |
| D-9 | `node tools/check-tables.js` | **0 错 / 0 警告**（1349 张表 · 207 个 `.md` · docs 65 / records 138 覆盖自证在绿字里） | ✅ **已销** |

**X-0055 / X-0057 主张复核结论**：D-3/4/7/9 与 D-2（经 T-0110）成立；**D-1 的销号不成立**（证据 grep 太窄）；D-5/D-6/D-8 属**同类复发**，根因是 X-0055 遗留 #4（「A84 的执法：可派生读数没有门禁拦 → 下一轮」）**没做**。

---

## 二、新增变化（`4ecfd70..1378f09` · 25 笔）缺陷清单

**N-1【中等 · 不通过】境界数值重构改了 CSV，没改本仓的口径真源**
`docs/CREATION-DATA.md:341-344` 仍是 **V1.72** 三句：「炼气每层 **×1.18**」「跨境界：筑基 = 炼气 **×5**」「越级压制比…**唯炼气→筑基仅 1.13 倍**」。上游 `10-MMO化/境界基础属性.md` V1.73 原文：「每层倍率由 ×1.18 压到 **×1.0772**」「**K1 由 ×5.0 改 ×3.0**」「V1.73 起炼气→筑基并入同一口径，**不再有 1.13 的例外**」。本仓 CSV 已按 V1.73 落（独立复算：六项数值属性第 1 层逐境比 = **3.0000 ×8**，越级比 **1.536~1.5385**，十层累计 **1.953**）。⇒ **同一仓两套相反口径**（B 类：设定已改、搬运只搬了一半）。`git log -- docs/CREATION-DATA.md` 最后一次改动是 `c691938`，T-0134/135/136/137 **均未碰它**。附带：`docs/proposals/GUILD-PROPOSAL-X0066.md:41` 也仍写「炼气→筑基 ×5.0」。去向：**dalu 改**。

**N-2【中等 · 不通过】修为区间的空洞数量与台账不符（独立复算抓到）**
T-0134「先读三行」称「**两处**取整写法造成**一个**数值空洞」，`GUILD-PROPOSAL-X0067:72-73` 只登记 ① 写法混用 ＋ ②「**一处**空洞：化神 9,990,000 与炼虚 10,000,000 之间 1 万点」。按 `02-修行体系/修为体系.md:37-45` 逐境重算，实为 **4 处不可达区间**：

```
化神→炼虚   9,999 点          炼虚→合体   9,999,999 点
合体→大乘  99,999,999 点      大乘→渡劫  999,999,999 点   （合计 1,110,009,996）
```

`server/internal/game/config.go:322` 明写「**允许空隙**」⇒ 没有任何机械判据会红。M3 突破判定会踩。去向：**上游改写法**（A 类，铁律一不代写）＋ **dalu 把提案补成 4 处**。
★ **交叉印证**：世界观库审查（同批派出）独立复算得**同样 4 处**，两处口径一致。

**N-3【中等 · 不通过】「按真口径给」的演示值与画稿停在旧行值**
`QYDPlayerController.cpp:1337-1341` 注释「境界表**炼气三层那一行：hp_max 139 · mp_max 70**」并写死 `MaxHp=139.f / MaxMp=70.f`（:1383 同）；`design/screens/main-hud.html:557/567` 同写「炼气三层：气血上限 139 · 灵力上限 70」与 `128 / 139`。V1.73 后该行 = **116 / 58**（`qydl_realm_level_config.csv:4`）。T-0134 §7 只同步了生成物与 `TestCharacterAttributesMatchRealmRow`（→116/58/12/6），C++/画稿漏网。⇒ 注释自称「真口径」却指着表里已不存在的数（比缺注释更坏，它看起来自证）。去向：**dalu 改**。

**N-4【中等 · 不通过 · 跨仓】dalu 的列名改名把 guild 的 I1 门禁打红**
`git show 1378f09^:data/datas/qydl_game_config.csv` 头 = `##var,key,value,...`，1378f09 后 = `param_key,param_value,...`。而 guild `scripts/check-identifiers.js:154` 取键逻辑是 `const ki = header.indexOf('key');` ⇒ 现返回 **-1**，整张参数键表从受管集合里消失。
【订正】实跑读数（主 agent 直连跑，非经汇总视图）：
```bash
cd F:/zxc/Project/qiuyuan-guild && node scripts/check-identifiers.js
# 结果：不通过（42 错 / 0 警告）· exit=1 · 受管集合 216 个
```
（原报告写 41 条，与并行会话写的 41 一致；主 agent 复跑为 **42**。经 `run-all-checks.js` 汇总时**只显示前 8 行**（该文件 `:121` 对失败行 `slice(0, 8)`）⇒ 只看汇总会少数。**修 I1 时必须同时补「改名列」反向用例**，否则下次改名照旧静默。）
其中 5 个键确在 CSV 里（`spirit_root_p_damage_ppm` / `spirit_root_p_cultivation_ppm` / `purity_damage_influence_ppm` / `purity_cultivation_influence_ppm` / `shenshi_pool_regen_ppm`）⇒ **绝大多数是假报警**；另有 `qydl_role_name`（I1 判据 2 的**反例**被误判）与 `qydl_realm_life_config`（T-0134 删的表未进 `RETIRED` 花名册）属**真缺口**。T-0139 §3 只声明「契约里不出现这些列名 ⇒ 契约无需动」，**没跑过消费它的 guild 门禁**。去向：**guild 判据修正**（兼容 `key`/`param_key`，首选路，非留证豁免）＋ `RETIRED` 补一条；dalu 侧补契约回执一行。

**N-5【中等 · 不通过】迁移执行状态表漏 0009**
`docs/DATA-LAYOUT.md:359-363` 的「脚本 / 作用 / 状态」表止于 **0008**；`db/migrations/0009_naming_roots.sql` **存在**、T-0139 称已对本机库执行并回读，但 0009 **没有登记行**。⇒ 换机/重建照该表重放会漏跑 0009（9 个带代码引用的列 ＋ 1 索引），Go 侧读写新列名、库里是旧列名。去向：**dalu 补一行**。

**N-6【中等 · 不通过】待裁建议书自相矛盾**
`docs/proposals/GUILD-PROPOSAL-X0068.md:101`：「★ **不写拼音** —— 早先的 `lei_count` / `dao_interval_sec` / `trib_dao_per_lei` 已全部改掉」，紧接的字段表（:105-108）与 §2.4（:167）§2.5（:175）**用的正是这三个拼音名**，落表 CSV 也用拼音（T-0139 按 `DATA-LAYOUT.md:217`「`wave_count`/`bolt_interval` 错（把专名英译）」改回）。⇒ 上游照那句裁定契约就会与已落表冲突。去向：**dalu 改**（只追加式订正该条 bullet）。

**N-7【轻微 · 不通过】注释仍指退役名**
`data/datas/qydl_game_config.csv:20` 注释「总雷数 = 档位表 **wave_count** 乘本值」（该列现名 `lei_count`）；`server/internal/game/tribulation_config_test.go:6`「总雷数 = **wave_count** * 全局 **trib_bolts_per_wave**」（两个名字都已退役）。T-0139 的「旧名残留 **0**」取证只查了 `information_schema.COLUMNS`，**没覆盖注释/文档** ⇒ 正踩 `§6 坑 2`（人工清点引用面会漏）。去向：**dalu 改**。

**N-8【轻微 · 不通过】可派生读数仍无门禁 ⇒ D-5 / D-8 复发**
读数见 §一。两处文档自己都附了「复算命令」，但没有任何东西去跑它；`check-gates` 里 **T14/T15/T16 都有覆盖自证，这一类没有**。去向：**dalu 立项**（把 ui-spec/layout 读数物化成生成物，或加一条 `check-*` 判 docs 里的数与实测一致）—— 这就是 X-0055 遗留 #4 那一笔账。

**N-9【轻微 · 不通过】D-1 复跑不成立**（同 §一 D-1 行）。去向：**dalu 同笔对齐 README 两行**。

**观察（不判缺陷）**：① T10 报 ⚠「白名单里有 `design/art`，但磁盘上没有」（T-0116 按大人话删了 art）⇒ 白名单未同步，轻微。② 本批新增 1 处 `data/scenes/huaiyin_gbe/terrain/terrain.json:2` 写死构建脚本路径，属可移植性、非凭证泄露。

---

## 三、数值线独立复算（正面结论）

按 `§3 第 4 步`「独立复算」另写脚本（不复跑对方脚本）跑世界观 `境界基础属性.md` §5.1~5.9/§6/§8.1~8.3 与 dalu 两张表：

```
90 行 × 10 列 vs 世界观 §5.x 表                     0 差异（realm 1~9 × layer 1~10 齐全，无缺行）
hp  vs §8.1 公式 round(100·1.25^((l-1)/3)·3^(r-1))   0 差异
mp/物攻/法攻/物防/法防 = 取整后 hp ÷2 ÷10 ÷10 ÷20 ÷20  0 差异
百分比 8 列（含 T-0135 自称线性插值的 crit_dmg/crit_resist/def_break/block_rate/block_reduce）
   vs §6 第 1/10 层锚点线性插值                      0 差异
炼气百分比 vs §8.2 公式                              0 差异
跨境 ×3.0：六项数值属性第 1 层逐境比                 3.0000 ×8（严格单调）
越级压制比（上一境圆满→下一境初期）                  1.536~1.5385（= 设定 §7 的 1.54）
十层累计                                             1.95 / 1.9533 ×8
speed 第 1 层 vs 100·1.2^(r-1)                       floor 后 9/9 吻合（§8.3 未写取整法）
speed_mult 逐境比 1.5000 ×8（= 修为体系「每升一大境界 ×1.5」）；寿元/衰老 = 寿元系统 A 案逐格一致
exp 区间：单调 ✓ 无重叠 ✓；派生每层上限（ceil 步长 + 末层吸收）9 境全部单调且落在区间内
   炼气派生 = 100/200/…/900/999 与 `git show e543c96^` 的旧 exp_max 列逐格相同 ⇒「对外值不变」成立
类型：defines 声明 long → gen int64、JSON 保留 9e10 不截断（> int32 2.1e9，渡劫上限 9e10 靠 long 兜住 ✓）
data/defines/*.xml 的 bean 列 ↔ data/datas/*.csv 的 ##var 列   20 张表 0 差异
data/gen/json ↔ CSV（行数、列名）                             20 张表 0 差异（生成链未过期）
```

**设定侧一条（A 类，只登记不改，去向 `虬渊大陆`）**：§8.3 炼气速度公式 `100×(1+(l-1)×0.0125)` 在第 10 层给 **111**，而 §5.1 表（与 dalu CSV）写 **112**；公式与表在这一点不自洽 —— dalu 照抄表是正确处置，但任何人按公式重算会静默差 1。（★ 世界观库审查同批独立复算，结论相同。）

**天劫口径**：T-0137 记录 ↔ `qydl_tribulation_config.csv`（9 行 · 一九~九九 · 总雷数 = `lei_count × trib_dao_per_lei` 封顶 81）**一致**；与设定「凡界八道、飞升不计」的 8 vs 9 差异已在 `docs/features/CULTIVATION.md:81/157` 明写「属待裁、**界面仍按 8 点别顺手改**」；`变异劫`删除、`心魔劫`不入两张表各自有出处与去向 ⇒ **不判缺陷**。

---

## 四、机械判据实跑读数

```bash
# dalu 本仓
CI=1 cmd //c check-gates.bat        → T1~T3/T5~T7/T9~T16 全 PASS；终行 NOT green（仅 T4/T8 SKIPPED）
node tools/check-db-naming.js --self-test → 38 / 38 反向用例全绿（含「真库全序列红必须为 0」覆盖自证）
cd server && go build ./...         → rc=0
go vet ./...                        → rc=0
go test -count=1 ./...              → 9 个有测试的包全 ok
# guild 侧对 dalu 的校验
node scripts/check-records.js       → 通过（30 项 / 3 警告，警告全在 guild 自己的 X-0059，非 dalu）
```

【订正 · 主 agent 亲跑口径】`check-gates.bat` 终行为 **`NOT green - some gates SKIPPED (skipped is NOT a pass)`**（exit≠0），红项仅 **T4 / T8 SKIPPED**：本会话**无 UE 编辑器 / 无 MCP**，9 屏 569 绑定 ↔ WBP 类型对照、10 份 layout ↔ WBP 几何**未实跑**。★ 按 `X-0053` 口径：**SKIPPED ≠ 通过，也不写成不通过** ⇒ 记「未验证」，各卡当时有实跑（T-0110「T8 PASS 201/49/216/81」、T-0119「T4 PASS 7 屏 515」、T-0121「8 屏 563」）。

★ **T16 的一条结构性缺口（不判本批缺陷，登记为待办）**：`check-db-naming.js` 只解析 `db/migrations/*.sql`，**20 张配置表的列名完全不在它覆盖内**，而「四·补」词根裁定表明确管辖配置表列（举的正是 `effect_kind`/`desc`/`key`/`skill_category`）。按八条判据自写扫描跑全部 CSV 头：命中 **1 处漏网** —— `qydl_game_config` 的裸 **`category`**（「类别」已由大人裁为 `*_type`，该列既不在词根表的"别的写法"里，也没有任何门禁会判）。这是 `§6 坑 9` 第三类「**未覆盖 → 静默**」。去向：**dalu**（把配置表列名接进 T16，或建同判据的 `check-csv-naming`；`category` 改名须连 `config.go`/`admin` 一起动）。

---

## 五、本次未覆盖

1. **未开 UE 编辑器** ⇒ T4（9 屏 569 绑定 ↔ WBP 类型）与 T8（10 份 layout ↔ WBP 几何）本会话**未实跑**；D-2/T-0110 的终态采信其留档；像素级目检仍不存在。
2. **未连活库** ⇒ 迁移 0008/0009「已执行」只复核了仓内文档与取证命令，没有对 `information_schema` 独立回读（N-5 判的是文档漏登记，不是库里没改）。
3. **未审 `ue-client/` 的 C++ 编译**与 PIE 行为（本批含 HUD/背包/功法页 C++ 改动，卡片自称 `Result: Succeeded`）。
4. **未审 `admin/` GM 前端实现**（T-0125/0126/0132/0136 只核到「筛选不抄对照表」这一条设计纪律）。
5. 只看 `4ecfd70..1378f09`，**未重审** M1 波次 1~5 的历史交付；其余五仓**未审**（N-4 里 guild 侧那半属「发现即登记，不就地扩审」）。
6. 世界观库只读、未逐篇比对设定自洽性（只跑了与数值搬运链直接相关的 4 页）。

---

## 六、遗留问题与建议去向

| # | 事 | 类 | 去向 |
|---|---|---|---|
| 1 | N-1 CREATION-DATA 旧口径（×1.18 / ×5 / 1.13 例外） | B | dalu（改 §4.3 ＋ X0066:41） |
| 2 | N-2 修为区间 4 处空洞（台账只记 1 处） | A/C | 上游改写法规格；dalu 补提案 X0067 |
| 3 | N-3 演示值/画稿 139-70 | B | dalu |
| 4 | N-4 I1 被改名打红（42 错 · 多为假报） | 跨仓 | **guild 判据修正** ＋ `RETIRED` 补 `qydl_realm_life_config`；dalu 补回执 |
| 5 | N-5 0009 未进迁移状态表 | — | dalu |
| 6 | N-6 建议书 X0068「不写拼音」那句自相矛盾 | — | dalu（订正 bullet） |
| 7 | N-7 两处注释指退役名 | — | dalu |
| 8 | N-8 可派生读数无门禁（D-5/D-8 复发根因） | — | dalu 立项（= X-0055 遗留 #4） |
| 9 | D-6「最新 ADR-0032」手抄 | — | dalu 改为「指针 ＋ 不写号」或加门禁 |
| 10 | T16 不覆盖配置表列名 ＋ `category` 漏网 | — | dalu |
| 11 | §8.3 炼气速度 111 vs 表 112；取整法未写 | A | 虬渊大陆（只登记，**不代写**） |
| 12 | 8 道 vs 九场 / 界面点数 | C | 待大人裁（已挂 X0068，界面未动 ✓） |
| 13 | T4/T8 本会话未实跑（编辑器不在） | — | dalu 下次编辑器在场时跑一次 |

---

## 七、判定（二值 · 不评分）

- D 系列复跑：**6 已销 / 1 销号主张不成立（D-1）/ 3 复发（D-5、D-6、D-8）**
- 新增变化：**9 条不通过（N-1~N-9）**
- 数值搬运链本身：**独立复算全绿**（正面结论）
- 机械判据：本仓 T1~T16 除 T4/T8 **未验证**外全绿；服务端 build/vet/test 净
- **对象总判：不通过**（文档/口径一致性 ＋ 跨仓门禁被打红两项成立）

---

## 执行环境（可选 · 仅供回溯 · `ADR-0007` 指纹非评价）

- 工具：Qoder Desktop agent（sub-agent · general-purpose）＋ Git Bash ＋ Node 24.18.0
- 大模型：底层模型不披露
- 日期：2026-10-27
- 取证方式：全程只读命令 ＋ 自写复算脚本（未落仓，用完即删）
