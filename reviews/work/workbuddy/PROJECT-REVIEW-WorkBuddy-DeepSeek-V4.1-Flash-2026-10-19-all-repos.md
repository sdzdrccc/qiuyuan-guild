# PROJECT-REVIEW-WorkBuddy-DeepSeek-V4.1-Flash-2026-10-19

- 来源：**本仓派出**（大人发起，WorkBuddy 会话执行）
- Agent 名称 / 大模型：`review` / **DeepSeek-V4.1-Flash**
- 审查时间：2026-10-18 23:55 → 2026-10-19 01:03（GMT+8）
- 审查对象：`qiuyuan-guild` · `qiuyuan-dalu` · `gbe-studio` · `gbe-assets` · `虬渊大陆`（只读）· `ue-ai-ops`（仅核指针）
- 审查范围：
  - **覆盖**：§10 六对象的机械判据（guild 10 门禁 ＋ 8 套自测；dalu 编译 / vet / test / 生成幂等 / `check-gates`；GBE 双仓测试 / 版本 / 端口；灵根数值独立复算）· 文档与声明一致性 · 世界观库三份台账增量与 A/B/C 分类 · 三条必产出
  - **未覆盖**：`T4` / `T8` 实机（编辑器未开）· `go test -race`（本机无 cgo）· 像素比对 · 世界观库全库通读 · GBE 几何内核 · GitHub 侧 CI 实跑 · 逐卡审阅 106 张 `T-*`
- 硬约束确认：只读 ✓ 未改被审对象 ✓ 删除类只出清单 ✓
- 审阅快照：guild `34db3e9`（工作区：`REVIEW-PROCESS.md` v1.7 未提交 ＋ `version-pins.md`）／ dalu `a60b73e` ／ gbe-studio `7007ec5`（v0.6.5）／ gbe-assets `6275231`（v0.7.0）／ 虬渊大陆 `ea0d4fd` ／ ue-ai-ops `da78413`
- 判定正本：`reviews/X-0053.md`（汇编；本文件是它的**内部源材料**之一，按 `ADR-0032` 落 `work/`）

---

## 一、判定（二值）

| # | 对象 | 机械判据 | 文档 / 声明一致性 | 判定 |
|---|---|---|---|---|
| 1 | `qiuyuan-guild` | **通过**（10/10 · 8 套自测全绿） | **不通过**（README / AGENTS 五类事实漂移；`C1` 真缺陷 1 条） | **不通过** |
| 2 | `qiuyuan-dalu` | **通过**（编译 / vet / test 净 · 生成幂等 · T1~T3、T5~T7、T9~T13 绿）；**T4 / T8 SKIPPED ≠ 通过** | **不通过**（M1 状态三份互斥 · PITFALLS 计数漂移 · 登录 layout 陈旧） | **不通过** |
| 3 | `gbe-studio` | **通过**（26/0 · 端口交叉一致 · 版本一致） | **不通过**（CI `path` 越界 · 端口副本 8080 · 自检项不可达） | **不通过** |
| 4 | `gbe-assets` | **通过**（49/0 · 30/0 · kit 通过 · intake 0/0） | **不通过**（无 CI 却四处承诺 · 分类三处不一致） | **不通过** |
| 5 | `虬渊大陆`（只读） | 不适用 | **不通过**（A 类 8 · B 类 12 · C 类 3） | **不通过** |
| 6 | `ue-ai-ops`（参考） | **通过**（指针与 §4·21/§4·22 在位） | 通过 | **通过** |

**总判：不通过。**

---

## 二、机械判据（命令 ＋ 实际输出）

### 1. `qiuyuan-guild`

```text
$ node scripts/run-all-checks.js
  通过 10 / 10 个脚本        RESULT: all checks green
$ for s in check-data check-contract-gate check-identifiers check-records \
           check-doc-anchors check-asset-ref check-version-pins check-docs-index; do
    node scripts/$s.js --self-test; done
  67/67 · 14/14 · 35/35 · 102/102 · 37/37 · 13/13 · 13/13 · 9/9   EXIT 全 0
```

`check-asset-ref :: A5` 报「暂无场景清单 → 跳过」—— **不是通过**。

### 2. `qiuyuan-dalu`

```text
$ cd server && go build ./... > /tmp/b 2>&1; echo $?   # 0，无输出
$ go vet ./... > /tmp/v 2>&1; echo $?                  # 0，无输出
$ go test ./internal/game/ ./internal/login/ ./internal/gateway/   # 三包 ok
$ cd .. && bash data/gen.sh && bash data/gen.sh
$ git status --porcelain data/gen server/internal/platform/config/gen | wc -l   # 0（幂等）
$ CI=1 cmd //c check-gates.bat ; echo $?               # EXIT=2，RESULT: NOT green
#   T4 SKIPPED（6 屏 430 个绑定声明，读不到 WBP）
#   T8 SKIPPED（3 屏 layout↔WBP 未比）
```

### 3/4. GBE 双仓

```text
$ cd gbe-studio && node core/policy/test/router.smoke.js   # 26 通过 / 0 失败
$ node bridges/sync-ports.js --check                       # 视图一致 + 三副本交叉一致
$ node scripts/version.js check                            # v0.6.5 一致
$ cd gbe-assets && node packages/schema/test/smoke.js      # 49 / 0
$ node packages/schema/test/assembly.js                    # 30 / 0
$ node packages/schema/index.js kit kits/cn-ancient/kit.json   # ✓ 0 警告
$ node tools/intake.js --dry-run                           # 入库 0 · 拒收 0
$ node scripts/version.js check                            # v0.7.0 一致
```

### 5. 数值独立复算（按真源另写一遍）

`G = (anchor/C)^p × (n_eff/C)^p`，`anchor=2.0 · v=2.0 · p=0.30`，构成取 `(min+max)/2`：

```text
q0 C=8.00 neff=11.00 calc=725893  cfg=725893  diff=+0
q1 C=4.50 neff= 4.50 calc=784053  cfg=784053  diff=+0
q2 C=3.00 neff= 3.00 calc=885467  cfg=885467  diff=+0
q3 C=2.00 neff= 2.00 calc=1000000 cfg=1000000 diff=+0
q4 C=2.50 neff= 3.50 calc=1034583 cfg=1034583 diff=+0
q5 C=1.00 neff= 1.00 calc=1231144 cfg=1231144 diff=+0
q6 C=1.00 neff= 2.00 calc=1515717 cfg=1515717 diff=+0
prob_ppm sum = 1000000 OK
体质四档 900000 / 90000 / 9000 / 1000 = 1000000
```

`cultivation_mult_ppm` 与 `damage_mult_ppm` 逐行完全相等。**判定：通过**。

---

## 三、缺陷清单

### A. `qiuyuan-guild`

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| G-1 | 中等 | **README / AGENTS 五类事实漂移**：`README:51` 写 `X-0001…X-0040`（实 50 篇到 X-0052）· `README:138` M1 `⏭ 下一步`（ROADMAP 已收口）· `AGENTS:261`「本仓没有 CI」（`ci.yml` 存在）· `AGENTS:269`「8 个脚本」（实 10）· `README:161-162` 写 `C1~C8`/`D1~D4`（同文件 `:61-62` 写 C1~C9/D1~D5） | 各 `sed`/`grep` 直读 |
| G-2 | 中等 | **`PENDING_RULES` 两条被注释掉**：`check-docs-index.js:44`（E4）· `check-version-pins.js:50`（P2）⇒ 承诺未落且不可见 | `grep -rn "^[[:space:]]*//.*{ id: '" scripts/` |
| G-3 | 中等 | **契约回执只写不读**：覆盖率 88/106（机制后 100%），但「哪一处读不通」无脚本 / 台账消费 | `grep -rn "契约回执" scripts/` |
| G-4 | 中等 | `X-0049` **缺「审核」节**（真缺陷）；缺「验证证据」节是 `C1` **误报**（该卡「四、门禁与提交号」有 4 条命令+输出，名单不含它） | `grep -n "^## " reviews/X-0049.md` |
| G-5 | 中等 | **L2 会审无载体**：`CONVENTIONS §7.4` 人工检查点只有 2 条 | 节内直读 |
| G-6 | 轻微 | `run-all-checks.js:10` 注释仍说「零 `process.env` 覆盖点」（实测 4 个脚本都有） | `grep -rn process.env scripts/` |
| G-7 | 轻微 | `version-pins.md` 的 dalu 读数靠人抄，`P2` 被注释（本轮已由另一会话改为 `a60b73e`） | `check-version-pins.js:50` |

### B. `qiuyuan-dalu`

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| D-1 | **严重** | **M1 状态三份互斥**：`README:33` `⏭ 下一步` · `M1-IMPLEMENTATION:14` 「v0.5 待审核」（尾部已 v0.14）· `ARCHITECTURE:311` 波次 4 `🟡` | 三处直读 |
| D-2 | 中等 | **登录 layout 停在 2026-10-08**（spec 已 10-18）：spec-only 35 / layout-only 33；同名 4 锚点 + 22 尺寸不一致；且被有意排除在 `T8` 外，**无卡号、无销号去向** | `stat -c '%y'` 两文件；`node` 读 JSON |
| D-3 | 中等 | **PITFALLS 计数四处旧值**：`docs/README:39`（A64/66）· `PITFALLS:18`（63）· `AGENTS:150`（63）· `ARCHITECTURE:334`（**18**）；实测条目 85、唯一编号 83 | `grep -cE '^### A[0-9]+'` → 85 |
| D-4 | 中等 | `M1-IMPLEMENTATION` 三条【M1】待办未勾销：`:1278` `exp_max`（代码已有）· `:1271` 契约版本链（v0.3 → 实 v0.7）· `:792/:1201` 清单含不存在的 `QYDAttributePanelData.h` | `find` → 0 |
| D-5 | 中等 | 属性面板控件总数 **481 vs 564**（`DESIGN-ARTIFACTS:75` vs 实测 205+168、`UMG-STRUCTURE:37`） | `node` 读 `ui-spec.*.json` |
| D-6 | 中等 | `ARCHITECTURE:300`「最新 ADR-0023」—— guild 已到 **ADR-0032** | `grep -n ADR-` |
| D-7 | 轻微 | `records/shots/` **18 个文件无卡号** | `ls \| grep -vcE '^T-[0-9]{4}'` → 18 |
| D-8 | 轻微 | `UI-LAYOUTS/README` 写 `WBP_MainHUD` **103 控件**，实测 **201**；目录实有 6 个 layout | `node` 递归计数 |
| D-9 | 轻微 | `T1` 6 处行尾空单元格（存量，不阻断） | `check-tables` 输出 |

### C. `gbe-studio`

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| S-1 | **严重** | **CI 的第二个 checkout `path: ../gbe-assets` 越出 `$GITHUB_WORKSPACE`** ⇒ 该步失败，三 gate 一个都跑不到 | `.github/workflows/ci.yml:31`；`actions/checkout` 对 `path` 的定义 |
| S-2 | 中等 | **端口副本 8080 未随真源改 8090**：`mcp.json:163/165` · `engines.json:60` · `README:229` · `PLAN:487`；`sync-ports.js:151-153` 不扫 `candidates_for_future` ⇒ `--check` 仍绿 | `grep -n 8080` |
| S-3 | 中等 | `engines/base.js validate` 默认恒 `exit 1`（`--impl` 不被解析）⇒ `AGENTS:93` 自检项不可达 | `node engines/base.js validate unreal` → EXIT=1 |
| S-4 | 中等 | 测试面窄：全仓仅 1 个测试文件；`build/procedural/*` / `core/schema-ref.js` 零测试 | `git ls-files \| grep -i test` |
| S-5 | 轻微 | README 测试计数 **25 vs 26**；`qa/` 空但列横切三项 | `README:62/205` |
| S-6 | 轻微 | 版本校验不核 README 与嵌套 `package.json` | `scripts/version.js:284-356` |

### D. `gbe-assets`

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| A-1 | **严重** | **全仓没有 CI**，但四份活文档把 CI 当既有门禁：`CONTRIBUTING:100` · `CONVENTIONS:467`（DoD 8/9）· `PLAN:473,517` · `AGENTS:35` | `ls .github` → 不存在 |
| A-2 | 中等 | **分类三处不一致**：`CONVENTIONS:513` 镜像 28 类 · `asset.v2.schema` enum 26 类 · `kit.json:30` 声明 `assemblies/building`；`grep categories` 在三个脚本 0 命中 | `node` 读 schema；`grep` |
| A-3 | 中等 | `CONTRIBUTING.md` 与 README / AGENTS 重复（引用仅 2、无脚本引用、含假 CI 承诺）⇒ **建议合并** | `grep -rl` |
| A-4 | 轻微 | README 的 ADR 范围停在 `ADR-0007`（实有 0008） | `README:99/201` |
| A-5 | 轻微 | `package.json:test` 仍只跑 `smoke.js`（装配 30 项无 npm 入口） | `package.json:12` |

### E. `虬渊大陆`（只读 · 冲突台账）

**A 类（设定自身矛盾 · 上游自改）**

| # | 冲突点 | 出处 |
|---|---|---|
| W-02 | §10.1 仍写「筑基以上 1–9，第 9 层＝圆满」 | `境界基础属性.md:339` vs `:15-17/:36` |
| W-03 | 百分比速查表 8 行整表标「第 9 层」 | `:211-225` vs `:90` |
| W-04 | §9.1 仍写「后期段 7→9 层 ×1.118」 | `:314` vs `:264-266` |
| W-05 | 「旧称圆满」 | `:18` vs `:15`（应作「巅峰」） |
| W-06 | 生克 ±20% vs +25%/−20% | `灵根生克对战.md:14` vs `战斗系统.md:59-60` |
| W-07 | 暴击上限 100%/500% vs 75%/300% | `境界基础属性.md:50,54` vs `战斗系统.md:81` |
| W-08 | 装备部位 12 vs 5 大类（同页两套） | `法器与装备.md:49-55` vs `:57` |
| W-09 | `realm+stage+layer` vs `stage` 不落库 | `境界与等级.md:17` vs `境界基础属性.md:358` |

**B 类（设定 vs 实现 · 需 ADR）**

| # | 冲突点 | 我方 | 设定方 |
|---|---|---|---|
| W-01 | **层数 90 vs 82** | `data-contract:269-286`；`ADR-0004` | `境界基础属性:15-17`；`境界体系:13-20` |
| W-10 | **属性 15 vs 面板 18**（神识/攻速/施法速度无源） | `data-contract:403`；`CHARACTER:44` | `境界基础属性:40-58` |
| W-11 | 纯度→修炼六档 vs 连续式 ±20% | `SPIRIT-ROOT-FORMULA:15` | `修为体系:98-108` |
| W-12 | 「废体/极品」纯度词描述品级 | `data-contract:232-234` | `灵根体系总纲:21-22` |
| W-13 | 纯度 roll 规则上游无 | `CREATION-DATA:82-83` | `灵根体系总纲:18-22` |
| W-14 | 品级数值 50–160% vs 0.837–1.514 | `SPIRIT-ROOT-FORMULA:39-48` | `灵根资质品级:14-22` |
| W-15 | 体质 13 vs 8；「适配」升为「准入」 | `CREATION-DATA:157-163` | `体质体系:20-31` |
| W-17 | 槽名「法器/法袍/发冠/戒指/玉佩」零出处 | `protocol-contract:101` | 全库 `法袍` 0 命中 |
| W-18 | 主/副加成 +20/+5 vs +25/+10（契约同行两套） | `data-contract:425-426` | `角色创建:27` |
| W-19 | 主菜单硬封顶 8 vs 实现 15 | `MAIN-MENU-FEATURES:22-29` | `UI与界面设计:144-157` |
| W-20 | 键位 `M`/`Alt`/`Tab` 三处冲突 | `MAIN-MENU-FEATURES:143-149` | `UI与界面设计:195` |
| W-21 | 角色页「左立绘右属性」vs「中央立绘左柱」 | `CHARACTER:178` | `UI与界面设计:163` |

**C 类（并列请裁）**

| # | 冲突点 | 口径 A | 口径 B |
|---|---|---|---|
| W-16 | 「装备槽」盖三套 | 契约 5 槽 | 上游 12 部位 ＋ 法宝 5 小类 |
| W-22 | 修为口径 | 上游区间累计 | 实现每层 `exp_max` |
| W-23 | `expMax` 粒度 | `data-contract:339` 每层 | `protocol-contract:367` 当前境界 |

**★ 六条动作清单（B4 硬前置）—— 库里 0 条**

`grep -rn "动作清单\|动画清单" 10-MMO化/` → 0 命中。走/跑只有 `UI:199`「一套动作定义」（输入抽象）；攻 `战斗系统:27`；受击 `:165`（表现要求）；死亡 `:136-147`（规则）；打坐 `修为体系:116`（玩法倍率）。
`技术架构与技术选型:349-351`（骨骼 ≤75、15–20 fps）只是**资产规格**，不是动作表 ⇒ `U-*` 必须开。

---

## 四、三条必产出

### 4.1 文档去留

- **dalu 顶层 19 份**：全部保留（引用数 8~62、全部被索引点名）；需改的是 3 处计数/指针（D-3/D-5/D-6）。
- **dalu `features/` 18 份**：全部保留（一格一份，格式统一）。
- **guild 16 份**：全部保留；`PROJECT-STRUCTURE.md` §9 严重过期（仍写 `ue-client/` 只有 `.gitkeep`，实测 101 文件）。
- **GBE 13 份**：12 保留，**`gbe-assets/CONTRIBUTING.md` 合并**进 README（唯一一条合并建议）。
- **删除 0 · 归档 0**（GBE 无文档 archive 落点；guild 按 `AGENTS:236` 不提前建空壳）。

### 4.2 机制缺口

| 机制 | 缺口 | 建议落点 |
|---|---|---|
| ① `G1` | 只核「ROADMAP 声明要展开的实体」，对「已裁但契约没跟」零覆盖 | `CONVENTIONS §7.1` 纪律 4 ＋ G2 |
| ② `C1~C5` | 证据节认死名单（误报 `X-0049`）· 审核节只全文命中 | 证据节改形态匹配；审核节要求 `##` 级 |
| ③ `PENDING_RULES` | 2 条被注释掉（E4/P2） | 纪律 7 补 `wontfix` ＋ 到期告警 |
| ⑥ `C4` | L2 会审无载体 | §7.4 加第 3 号 |
| ⑦ `C6` | 回执只写不读 | `REVIEW-PROCESS §3` 第 5 步 |
| 跨切面 CI | guild 可跑 / studio 越界 / assets 没有，文档统一写「有 CI」 | 见 G-1 / S-1 / A-1 |
| 跨切面锚定 | `D5` 只锚版本号，区间/状态/目录/CI 无锚 | `D5` 扩面 |

### 4.3 UI 还原差异

| 屏 | spec | layout | 断点 |
|---|---|---|---|
| splash | 48 | 49 | 多 1 包裹层；同名固定锚点 29 个差异 0 |
| **login** | **72**（10-18） | **70（10-08）** | ★ spec-only 35 / layout-only 33；4 锚点 + 22 尺寸不一致；不在 T8 循环 |
| create-character | 30 | 31 | 多包裹层；同名 19 个差异 0；WBP 停 10-09 ⇒ 未验证 |
| select-character | 27 | 29 | 多 2 包裹层；同名 19 个差异 0 |
| main-hud | 168 | 201 | 多 33 生成件；同名 144 个差异 0 |
| attribute-panel | 205 | 216 | 多 11 生成件；同名 197 个差异 0；**Icons 目录无 attribute-panel** |
| **logout-confirm** | 14 | **无** | ★ 完全缺失（无 WBP、无 layout） |
| design-system | 豁免 | 豁免 | 不算断点 |

**未验证**：layout↔实际 WBP、实机像素（T8 SKIPPED）。
**素材层**：九宫格卡片底图未做；`attribute-panel` 零图标。按 `ROADMAP §0`「UI 质感」口径属**已知欠账**，不在出口判据。

---

## 五、与另两份源材料的差异（不改其正文）

| 事项 | MiMo 报告（10-19） | 本报告 | 依据 |
|---|---|---|---|
| `gbe-studio` | 通过 | **不通过** | S-1 / S-2 / S-3 / S-4 |
| `虬渊大陆` | 通过 | **不通过** | A 类 8 / B 类 12 / C 类 3 |
| M1 收口 | 不成立 | **成立** | `ROADMAP §2` 六条不含 T4/T8；`T-0107/0108` 有历史 `216/216`、`201/201` 实跑 |
| 属性面板零素材 | P1 | **P2 已知欠账** | `ROADMAP §0`「UI 质感不在出口判据」 |
| `ueskill1002-VERDICT` | 引用 0 | **4 处** | `grep -rl` |
| `PITFALLS` | 83 条 | 条目 85 / 唯一编号 83 | `grep -cE '^### A[0-9]+'` |

---

## 六、待裁与遗留

| # | 事 | 去向 |
|---|---|---|
| 1 | 境界 82→90（W-01） | guild 契约 ＋ 上游 · **须 ADR** |
| 2 | 属性 18 vs 15（W-10） | guild 契约 ＋ 上游 · **须 ADR** |
| 3 | 装备三套槽位（W-16/W-17） | **大人先裁「做不做」** · **须 ADR** |
| 4 | 主菜单 8 vs 15（W-19/W-20/W-21） | 大人（`X-0035`） |
| 5 | 修为口径（W-22/W-23） | guild 契约 · **须 ADR** |
| 6 | 六条动作清单 | 上游 `U-*`（建议本轮就开） |
| 7 | `equip_*` 三行 `deferred` | guild 契约（待大人点头） |
| 8 | D-1~D-9 · G-1~G-7 · S-1~S-6 · A-1~A-5 | 各仓自修 |

---

## 本次未覆盖

1. `T4` / `T8` 实机（编辑器未开）· PIE · 像素比对。
2. `go test -race`（本机无 cgo）。
3. dalu 106 张 `T-*` 只精读 `T-0100~T-0108`；guild 51 篇 `X-*` 只精读 7 篇。
4. 世界观库 214 篇只精读 20 篇。
5. GBE `build/procedural/*` / `build/convergence/*` 算法与 18 件资产二进制。
6. GitHub 侧 CI 实跑；远端分支保护 / tag 策略。
7. 数值只复算灵根品级 7 行 ＋ 两组概率合计。
