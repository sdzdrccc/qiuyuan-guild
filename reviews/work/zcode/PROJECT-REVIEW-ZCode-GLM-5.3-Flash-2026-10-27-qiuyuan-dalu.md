# qiuyuan-dalu 项目群全量复审 · 单对象审阅报告（源材料）

- **来源**：ZCode · 大人在 ZCode 会话派出
- **Agent 名称**：ZCode-dalu-reviewer
- **大模型**：GLM-5.3-Flash
- **审查时间**：2026-10-27
- **审查对象**：qiuyuan-dalu @ `1378f09`（HEAD 全 hash `1378f09923a7211c74f833c277088429cc5d468c`，工作区干净）
- **依据流程**：`qiuyuan-guild/docs/REVIEW-PROCESS.md` §2（判据不自造）／§3（六步）／§10.2（单对象内部三段：①机械判据 ②文档与声明一致性 ③数值独立复算）
- **审查范围（覆盖了什么）**：
  - ① 机械判据：`go build` / `go vet` / `go test ./internal/...`（非缓存重跑）；`data/gen.sh` 两遍幂等；`check-gates.bat` T1~T16 全套实跑（CI=1）
  - ② 增量审查：2026-10-19 以来全部 28 笔提交清单；最近 7 张卡（T-0132 / T-0134 / T-0135 / T-0136 / T-0137 / T-0138 / T-0139）逐笔核「台账存在 · 坑登记 · 契约回执」；文档索引覆盖引用门禁输出
  - ③ 数值独立复算（全部自己另写实现，未跑对方脚本）：境界层次 90 行×10 列逐值、大境界总表 9 行×4 列三方（CSV / 设定库 V1.73+V1.74 / guild 契约）、凡人基准值、天劫两张配置表口径、灵根七行公式与概率和
  - ④ 上次未通过项复跑：X-0053 D-1~D-6 抽验六条 ＋ X-0055 D-2 ＋ X-0057 遗留 #2（只复跑不重审全量）
- **审查范围（没覆盖什么）**：见文末「本次未覆盖」
- **硬约束确认**：只读 ✓（审查结束时 `git status --porcelain` 为空、HEAD 未动）· 未改被审对象 ✓ · 删除类只出清单 ✓（本轮无删除类发现）· 临时脚本只写在 `C:\Users\Administrator\AppData\Local\Temp\dalu-review\` ✓

---

## 一、判定（二值表）

| 审阅项 | 判定 | 依据（详见后文） |
|---|---|---|
| ① 机械判据（编译 / vet / 单测 / 生成幂等） | **通过** | go build/vet 双零 exit 0；单测 10 包 ok；gen.sh 两遍后 git status 空 |
| ① 门禁 T1~T16（编辑器在场项除外） | **通过** | 14 门禁实跑全过；T4/T8 SKIPPED=本轮未覆盖（未启动编辑器，遵硬约束） |
| ② 增量（28 笔提交的台账纪律） | **通过** | 28 笔全部有台账（门禁 C5 机械判）；抽最近 7 卡：坑登记 / 契约回执节全在且非空 |
| ③ 数值独立复算（境界 / 总表 / 天劫 / 灵根） | **通过** | 90×10 逐值 0 错；总表三方中 dalu=设定库；灵根 7 行逐位一致、概率和恰 1000000 |
| ④ 上次未通过项（X-0053/X-0055/X-0057） | **通过（全部仍闭合）** | 六条抽验逐条复跑输出见第四节 |

**总判定：通过**（附带声明：T4/T8 的 WBP 实机对照本轮未跑，属「未覆盖」，不算通过项）。

---

## 二、机械判据（命令 + 实际输出）

### 2.1 编译与单测

```text
$ cd server && go build ./...    → （零输出）BUILD_EXIT=0
$ cd server && go vet ./...      → （零输出）VET_EXIT=0
$ cd server && go test -count=1 ./internal/...
ok   qiuyuan-dalu/server/internal/admin      1.375s
ok   qiuyuan-dalu/server/internal/combat     0.516s
ok   qiuyuan-dalu/server/internal/game       1.735s
?   .../game/presence                        [no test files]
ok   qiuyuan-dalu/server/internal/gateway    1.277s
ok   qiuyuan-dalu/server/internal/gmauth     3.838s
ok   qiuyuan-dalu/server/internal/item       2.508s
ok   qiuyuan-dalu/server/internal/login      4.134s
ok   qiuyuan-dalu/server/internal/platform/config  1.918s
?   .../config/gen · .../platform/db · .../platform/envfile  [no test files]
ok   qiuyuan-dalu/server/internal/world      0.905s
TEST_EXIT=0
```

> 环境备注（非被审对象缺陷）：审查开始时（本地 00:21–00:22）本机恰有一次 `gen.sh` 重生成在跑，头两次 `go build` 撞上其「先删后写」窗口报了假错（`cannot find ... StorageTreasureDef.go` / `undefined: QydlRealmLevelConfig`）；目录稳定后重跑即双零。该次重生成产物与 HEAD 逐字节一致（`git diff HEAD` 空）。

### 2.2 生成幂等

```text
$ bash data/gen.sh   → EXIT=0（两遍）
$ git status --porcelain data/gen server/internal/platform/config/gen
（两遍之后输出均为空 → 生成与已提交产物逐字节一致，幂等成立）
```

### 2.3 门禁全套（CI=1 cmd //c check-gates.bat，RESULT 行与各门禁原样摘录）

`RESULT: NOT green - some gates SKIPPED (skipped is NOT a pass)`，GATES_EXIT=2 —— 红的原因**只有 T4/T8 SKIPPED**（编辑器未在场；遵硬约束未启动 UE 编辑器）。

| 门禁 | 内容（读 check-gates.bat 归纳） | 结果 |
|---|---|---|
| T1 | Markdown 表格结构（列数/尾格） | **PASS** · 0 错 0 警告 · 1349 张表 / 207 个 .md |
| T2 | 契约字段交叉核对（角色 23 字段 + 面板 28 键） | **PASS** · 契约 23=客户端 23；§3.3.1 键 28 全在 |
| T3 | 记忆容量 + 关键判据存活 | **PASS** · 判据③ 17 条全落；项目级 3981/3000(132%) 仅提示不阻断 |
| T4 | BindWidget ↔ WBP 类型对照（需编辑器） | **SKIPPED=本轮未覆盖** · 头文件自检通过：9 屏 569 个绑定声明（登录 73 / 主界面 155 / 角色页 140…）；WBP 读不到（fetch failed ×9） |
| T5 | 画稿必须有前置提示词 | **PASS** · 12 屏 12/12 |
| T6 | ui-spec 几何真源（存在/自洽/不过期） | **PASS** · 11 屏 OK + design-system 不落地跳过 |
| T7 | WS 限流接线证明（R1~R12） | **PASS** · 12 条全过（阈值 20/突发 40） |
| T8 | 投递意图 layout ↔ WBP 实际（需编辑器） | **SKIPPED=本轮未覆盖** · 清单 8 屏：MainHUD / Splash / AttributePanel / Login / Bag / Spell / Friend / Settings |
| T9 | docs/README 索引覆盖率（黑户/幽灵/快照位置） | **PASS** · docs/ 顶层 25 份 · 覆盖 100% |
| T10 | design/ 落点白名单 + _compare 不入库 | **PASS**（带 1 条提示：白名单有 `design/art` 但磁盘上没有，见三·O1） |
| T11 | 台账与记录（跑 guild check-records.js） | **PASS** · 30 项通过 / 3 警告（警告全在 guild 侧 X-0059 缺三节，登记遗留 L6） |
| T12 | PITFALLS 按任务索引完整性 | **PASS** · 108/108 双向一致 |
| T13 | bat 码页/注释符/行尾卫生 | **PASS** · 3 个 .bat 全过（gm-start/gm-stop 各 1 条 W1 提醒，属已知设计取舍） |
| T14 | 文档开头「先读这三行」人话栏 | **PASS** · 39 份合格 + 4 份豁免（各有理由） |
| T15 | 文档目录由生成器出、不得过期 | **PASS** · 一致 35 · 过期 0 · 暂无目录 2 · 跳过 6 |
| T16 | 数据库命名八判据（db/migrations） | **PASS** · 21 表 165 列 53 索引 · 报出 0 条 · 存量豁免 0 条 |

---

## 三、缺陷清单

**err 级：无。**

观察项（均不构成本轮不通过）：

- **O1** `design/` 白名单 11 项里 `design/art` 在磁盘上不存在。
  命令：`ls design/` → `AI-PROMPTS.md DESIGN-ARTIFACTS.md MCP-UI-FIDELITY.md README.md _compare icons prompts reference screens specs`（10 项，无 art）。
  门禁原话：「⚠ 白名单里有 design/art，但磁盘上没有 —— ★ 是删了没同步白名单，还是还没建？」→ 去向 L5。
- **O2** guild 契约 `data-contract.md` §4.1 仍是旧口径：`炼气 n 层 = 基准 × 1.18^(n-1)`、`筑基 1 层 = 基准 × 5`、「行数 = 台阶数 = 82（炼气 10 + 8 境 × 9）」——与世界观 V1.73（×1.0772 / K1=×3 / 九境一律十层 90 行）冲突。**dalu 侧数据按世界观落（复算全对），契约滞后属上游**，dalu 已用提案登记（X0065 / X0067），去向 L2。
- **O3** guild 侧记录 X-0059 缺「改动清单 / 验证证据 / 审核」三节（T11 的 3 条警告，非本仓文件）。去向 L6。

---

## 四、上次未通过项复跑结果（X-0053 → X-0055 销号 → X-0057 追加）

按「只复跑原未通过项」执行，逐条命令 + 实际输出：

| 原项 | 复跑命令 | 实际输出 | 结论 |
|---|---|---|---|
| D-1 契约回执缺（C6） | T11 输出（guild check-records.js） | `✓ C6 已豁免（留证）17 项：T-0001…T-0017` ＋ `✓ C6 回执要点 67 条（内容已被消费）` | **仍闭合**（豁免恰 17 项，与销号口径一致） |
| D-2 提交无同批记录（C5） | T11 输出 | dalu 侧豁免 **18 条逐笔列出**（原 9 笔 + 后续按大人授权新增的补记/工具类，每条带依据·裁定人·日期；新增如 `9b7021f` 由 T-0120 补记 · 大人 2026-10-21「红给解决掉」） | **仍闭合**（数量增长均有留证，无裸红） |
| D-3 解码失败回 `*_fail` | `grep -rn "ctx.Err" server/internal --include="*.go" \| grep -vc _test` | **30 处**（原 5 处基础上随新 handler 扩到 30，全部是 `return ctx.Err(...)` 模式，无回 `*_fail` 字面量的解码失败路径回归） | **仍闭合** |
| D-4 realmCaps 缺行回 0 | 读 `server/internal/game/service.go:472-481` | `func (s *Service) realmCaps(...) (*float64, *float64) { r := s.cfg.RealmLevel(...); if r == nil { return nil, nil } ... }` ＋ realmExpMax 同口径 `!ok → nil`（:487 注释「绝不回 0 冒充查到了」） | **仍闭合** |
| D-5 `list_characters_fail` 缺契约行 | `grep -n "list_characters_fail" contracts/protocol-contract.md`（guild） | `protocol-contract.md:170: \| list_characters_fail \| {message} \| 角色列表查询失败（v0.5 补记 · ADR-0027 ②…）\|` | **仍闭合** |
| D-6 孤儿按钮 | `grep -rn "RemoveChild\|RemoveDynamic" ue-client --include=*.cpp --include=*.h` | `RemoveChild`：QYDLoginScreen.cpp:605、QYDBagScreen.cpp:476、UmgSetSubsystem.cpp:1133；`RemoveDynamic`：仅 QYDLoginScreen.cpp:601 注释与 :604 事件退订（合法用法）——无「RemoveDynamic 摘控件」回归 | **仍闭合** |
| X-0055 D-2 登录屏结构分叉（转 T-0110） | ① `sed -n "/^SCREENS/,/^]/p" tools/gen-umg-layout.py` ② T8 门禁清单 ③ T4 头文件自检 | ① `SCREENS` 首行即 `("login", "WBP_LoginScreen")`（T-0110 注释在位）；② T8 覆盖 **8 屏**，login 在列（layout 预期 81 控件）；③ 头文件自检「登录 73 个生效 BindWidget 控件」＝73/73（编辑器在场时的 73/73 匹配见 X-0057 追加，本轮 WBP 侧 SKIPPED） | **已销**（分叉三处证据全部闭合） |
| X-0057 遗留 #2「T8 扩到其余屏」 | 读 check-gates.bat T8 for 循环 ＋ ls ue-client/UI-LAYOUTS | 现状：T8 覆盖 **8 屏**（MainHUD/Splash/AttributePanel/Login/Bag/Spell/Friend/Settings，T-0110 之后 T-0117/119/121/122 相继纳入）；**仍未纳入**：create-character / select-character（layout JSON 在，bat 注释写明原因「重投会丢 Is Variable」）；logout-confirm 无 layout JSON（未进投递链） | 进展属实，余量去向 L7 |

---

## 五、数值独立复算（自写实现，不跑对方脚本）

复算脚本（自写，存系统临时目录 `C:\Users\Administrator\AppData\Local\Temp\dalu-review\`）：
`verify_realm.py`（境界 90×10 + 大境界总表 + 凡人基准）· `verify_spiritroot.py`（灵根公式）。
解析两侧原始文件（dalu `data/datas/*.csv` ＋ 设定库 Markdown 表），不经过 dalu 的生成脚本与文档转写。

### 5.1 炼气十层 · 九境九十层逐值（含本次 444→195）

```text
设定表解析: 90 格（期望 90）· 锚点行: 9 境
逐值硬比对 错误 0 条
VERDICT: PASS
```

- dalu `qydl_realm_level_config.csv` 90 行 × 10 列（气血/灵力/物攻/法攻/物防/法防/暴击率/命中率/闪避率/速度）与设定库 `10-MMO化/境界基础属性.md` §5.1~5.9（V1.73 全量重算版）**逐格 0 差异**。
- 炼气十层气血 = **195**（旧 ×1.18 口径为 444）——本次改动已落；生成链端到端抽查：`data/gen/json/qydl_realm_level_config.json` 90 行，炼气十层 hp 序列 `100,108,116,125,135,145,156,168,181,195`，九境圆满层气血 `195/586/1758/5273/15820/47461/142383/427148/1281445` 全对。
- 公式独立复算（按 §8.1 `基准×1.0772^(n-1)` / 筑基以上 `基准×3^(r-1)` 锚点 + 段内 ×1.25^(1/3) 几何插值 + 「灵力=气血÷2、攻=÷10、防=÷20」派生取整）：**90 行全部在取整容差内复现**，灵力/攻/防确系「按已取整气血再派生」。
- 百分比八项（暴击伤害/抗性/破防/格挡率/格挡减伤等）按 §6 锚点速查表线性插值复算：90 行全对。
- 唯一的公式↔表张力在**设定库自身**：炼气第 10 层速度，表值 112 vs §8.3 公式 `100×(1+9×0.0125)=111.25`（差 0.75，取整后 111）。dalu 按表落 112（与表一致是正确行为）。属上游 A-类小口径张力，去向 L4。

### 5.2 大境界总表（寿元 / 衰老 / 修为区间 / 速度倍率）三方比对

```text
realm_config 行数 9 ✓；寿元/衰老/exp_min/exp_max/速度倍率 全部无 ERR（脚本输出 0 错）
```

| 境界 | dalu CSV 寿元 | 设定库 A 案（定稿主表） | guild 契约寿元列 | 哪一方对 |
|---|---|---|---|---|
| 炼气~金丹 | 120/250/500 | 120/250/500 | 120/250/500 | 三方一致 |
| 元婴~渡劫 | 800/1200/2000/3000/4200/6000 | 同左（`02-修行体系/寿元系统.md` A 案） | **1200/3000/5000/10000/20000/100000** | **dalu 与设定库对，契约错**（形似已废止 B 案混抄） |
| 衰老（年/现实日） | 1/2/2.5/4/6/10/20/50/100 | 同左 | 同左 | 三方一致 |
| 修为区间 | 0–999 … 100亿–900亿 | 同左（`修为体系.md` 凡界段表；化神 999 万=9,990,000 等取整写法照抄，提案已登记该两义性） | 契约 §4 层次表 exp_max 列已被 dalu 提案请求删除改派生 | dalu=设定库 |
| 速度倍率 | 1/1.5/2.25/3.375/5.0625/7.59375/11.390625/17.0859375/25.62890625 | 「境界倍率每提升一个大境界 ×1.5」⇒ 1.5^(r-1) 逐位复算一致 | 契约未单列 | dalu=设定库 |

- 三方结论：**dalu = 设定库定稿口径；契约寿元上限列自元婴起与设定库不符**——此差距 dalu 已在提案 `GUILD-PROPOSAL-X0065`（T-0133 发现）与 X0067 中登记，台账 T-0134 契约回执明写「本仓以世界观为准」。契约订正是 guild/上游动作，去向 L2。
- 契约「82 台阶 / layer 1~9 / ×1.0873」旧口径与 V1.74「九境一律十层（90 行）」的冲突：dalu 实际 90 行（复算证实），已在提案 X0067 §6 ①请求订正。去向 L2。

### 5.3 天劫两张配置表（T-0137/39）vs 设定库

比对对象：`qydl_tribulation_config.csv`（9 行档位）＋ `qydl_tribulation_type_config.csv`（3 行类型）vs 设定库 `07-其他体系/天道规则与天劫.md`、`10-MMO化/境界与等级.md`、`02-修行体系/修为体系.md`。

| 项 | 设定库现行文本 | dalu 两表 | 判读 |
|---|---|---|---|
| 劫的序列 | 自筑基起八道（筑基劫…渡劫劫）＋ 渡劫圆满另渡飞升劫（九九八十一道），炼气无劫 | 9 行档位＝八道＋飞升劫，炼气无劫 | **一致** |
| 飞升劫道数 | 九九八十一道 | 九九（81 道，lei_count=9 档 × 每雷劫 9 道） | **一致** |
| 普通雷劫道数 | 「九道天雷逐步增强」（固定九道） | 档位按境递增 一九~九九（9~81 道） | **偏差**＝大人本轮裁定「雷劫数量按一九到九九」，待上游订正，已登记提案 X0068 §四② |
| 变异劫 | 设定类型表**有**变异劫 | **已删**（变异灵根改判普通，高危由威力公式资质项承担） | **偏差**＝大人裁定删除，已登记 X0068 §四② |
| 灭绝雷劫 | 设定**无**此类型 | 新增（八系全杂专属，八属性同压；先天 0.5% 档） | **偏差**＝大人裁定新增，已登记 X0068 §四② |
| 五行劫门控 | 「五行灵根」 | 五行俱全＋学过无属性功法（`required_no_element_technique=1`） | 门控收紧＝大人裁定；并登记「本仓无属性功法 0 部 ⇒ 此条今天永不命中」（T-0137 回执明写） |
| 数值五列（间隔/威力/感悟/成功率/掉境） | 上游未给数 | 全 0 占位，**每行 note 明写「上游未给数」** | 非静默占位（可见不掩盖）；0 占位与「不能派生的计数不填 0」纪律的适用性差异已在表内声明，接受 |
| 灭绝借档越界 | 未定义 | 整套借下一场档、第九场取末档（九九） | 已在 X0068 §四④声明按此落、上游若改只动一处 |

结论：两表与**大人本轮裁定口径**一致；与设定库现行文本的 3 处偏差（删变异劫 / 九道改档位 / 新增灭绝）全部有提案登记（X0068，草稿态、等大人决定是否发 guild），无静默改设定。去向 L3。

### 5.4 灵根分级公式复算（7 行概率 + prob_ppm 总和）

```text
$ python verify_spiritroot.py
prob_ppm 总和 = 1000000 （须 1000000）
q0 八系全杂（前期） C=8.0  n_eff=11.0 G=0.725893 复算=725893  表=725893/725893 OK
q1 普通五行杂伪     C=4.5  n_eff=4.5  G=0.784053 复算=784053  表=784053/784053 OK
q2 三灵根          C=3.0  n_eff=3.0  G=0.885467 复算=885467  表=885467/885467 OK
q3 双灵根          C=2.0  n_eff=2.0  G=1.000000 复算=1000000 表=1000000/1000000 OK
q4 变异杂灵根      C=2.5  n_eff=3.5  G=1.034583 复算=1034583 表=1034583/1034583 OK
q5 五行天灵根      C=1.0  n_eff=1.0  G=1.231144 复算=1231144 表=1231144/1231144 OK
q6 变异天灵根      C=1.0  n_eff=2.0  G=1.515717 复算=1515717 表=1515717/1515717 OK
单调递增: True   VERDICT: PASS
```

- 用自己的实现（构成区间取期望根数 → `G=(2/C)^0.30 ×(n_eff/C)^0.30`）复算 7 行倍率，与表值**逐位一致**；prob_ppm 总和恰 1,000,000。
- 七行概率（0.5%/25%/39%/22%/5%/7%/1.5%）与世界观 `02-修行体系/灵根资质品级.md` 概率列逐一相符（脚本同步抓取比对）。X-0053 时「全对」的结论**未被后续改动破坏**。
- 附加核对：凡人基准值 CSV vs 设定库 §4.1 十五项全对（并入 verify_realm.py 的第 6 段，0 错）。

---

## 六、遗留（逐条给去向，不就地扩审）

| # | 事 | 去向 |
|---|---|---|
| L1 | T4（9 屏 WBP 类型对照）/ T8（8 屏 layout↔WBP）实机验证、像素级目检 | dalu —— 编辑器在场时一次跑（本轮遵硬约束未启动编辑器） |
| L2 | 契约订正：寿元上限列按世界观 A 案、82 台阶→90 层、层次倍率口径、层次表 exp_max 删列改总表派生 | guild/上游 —— 已有提案 `GUILD-PROPOSAL-X0065` / `X0067` 在册，等 guild 受理（dalu 侧不动上游真源，正确） |
| L3 | 天劫设定订正：删变异劫、普通雷劫九道改一九~九九档位、新增灭绝雷劫、五行门控补两条件 | 上游设定库 —— 提案 `GUILD-PROPOSAL-X0068`（草稿，等大人决定是否发 guild） |
| L4 | 设定库自身：炼气第 10 层速度表值 112 vs §8.3 公式 111.25（≤1 点张力） | 设定库 A-类 —— 微小，随 L3 一并请上游顺手核 |
| L5 | design/ 白名单含 `design/art` 但磁盘不存在 | dalu 下轮顺手：删白名单行或建目录（T10 门禁自己已提示） |
| L6 | guild 侧记录 X-0059 缺「改动清单/验证证据/审核」三节（T11 三条警告） | guild —— 非 dalu 文件，登记给 guild 侧复审 |
| L7 | T8 尚未覆盖 create-character / select-character（layout 在、bat 注明「重投会丢 Is Variable」）；logout-confirm 未进投递链 | dalu —— 随下一次相关屏施工一并处理 |
| L8 | 五行雷劫门控因「无属性功法 0 部」今天永不命中 | 已在 T-0137 回执登记 —— 待上游《功法数据库设计》补「10=无属性」数据行 |
| L9 | 五行劫失败掉灵根、灭绝/五行奖励等数值口径的上游确认 | 已在 X0068 §四，与 L3 同路 |

---

## 本次未覆盖

1. **UE 编辑器不在场**：T4 的 WBP 类型对照（9 屏 569 绑定只做了头文件自检）、T8 的 8 屏 layout↔WBP 逐项比对、像素级比对、PIE 真点击交互 —— 全部未跑（遵硬约束未启动编辑器；SKIPPED 不算通过）。
2. **未做数据库落库实测**（mysql 字段/索引/注释/编码逐项比对不在本轮判据清单内；命名层面由 T16 门禁覆盖并实跑全过）。
3. **ue-client C++ 逻辑面未逐文件审**（仅按复跑清单抽了登录屏孤儿按钮、绑定声明计数、BagScreen RemoveChild）。
4. **28 笔提交未逐笔重审实现内容** —— 按任务口径只核台账纪律（C5/C9 门禁机械判全过）＋ 最近 7 卡细读；更早卡片沿用既有门禁结论。
5. **契约回执 67 条要点的全量消费核查**（arch 每周汇总进台账）属 guild 流程，本轮只抽读了最近 7 卡的回执。
6. **guild / 设定库本体不审** —— 两库只作真源读取；发现的问题全部登记为遗留，未就地扩审（审阅坑 6）。
7. go test 只跑了 `./internal/...`（任务口径）；`cmd/` 等包未跑测试。

## 执行环境

- 机器：Windows（win32 10.0.26300）· Git Bash · 非沙箱方式执行（沙箱下对该仓目录的文件读取不稳定，已换非沙箱复核）
- 工具：Go（server 构建/测试）· Node（门禁）· Python 3.13.12（复算脚本 ×2，自写）· git
- 关键时点：审查开始时本机有并发 gen.sh 重生成（00:21–00:22），头两次 go build 撞其删写窗口报假错，目录稳定后重跑全绿；该重生成产物与 HEAD 一致
- 被审对象终态：`git status --porcelain` 0 行 · HEAD `1378f09` 未动 —— 只读约束遵守
- 复算脚本留在系统临时目录（`%TEMP%\dalu-review\verify_realm.py`、`verify_spiritroot.py`），未进任何仓
