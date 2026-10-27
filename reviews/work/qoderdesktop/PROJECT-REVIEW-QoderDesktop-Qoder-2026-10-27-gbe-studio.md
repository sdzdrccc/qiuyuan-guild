# gbe-studio 复审报告 —— X-0053 S 系列销号复核 ＋ v0.7.0..v0.9.1 新增变化登记

- **来源**：Qoder Desktop 主 agent 派出的 sub-agent（本仓生态六对象分工之一）
- **Agent 名称**：Qoder Desktop 审阅 sub-agent（gbe-studio 对象）
- **大模型**：Qoder Desktop · 底层模型不披露
- **审查时间**：2026-10-27
- **审查对象**：`F:/zxc/Project/gbe-studio`（GBE 资产生成端）
- **与前作关系**：**复审**（`REVIEW-PROCESS.md` §10.1）—— 正本 `reviews/X-0053.md`（2026-10-19）§三-3 之 S-1~S-6 逐条复跑；销号主张由 `X-0056` 给出，本报告**独立复核其主张本身**。
- **范围**：提交 `c40bf52..13de06a`（v0.6.6 → v0.9.1，含 v0.6.7/v0.6.8 两个修错版 ＋ v0.7.0/v0.8.0/v0.9.0 三个 minor ＋ v0.9.1）。
- **审阅快照**：gbe-studio `13de06a`（工作区干净：`git status --porcelain` 空输出）／ qiuyuan-guild `8b44ca1` ／ gbe-assets（只读取材，v0.9.0，不在本对象范围）
- **硬约束确认**：只读 ✓ 未改被审对象 ✓ 删除类只出清单 ✓ 判定二值（无分数） ✓

---

## 一、对象与判定（二值表）

| # | 审阅项 | 判定 | 依据（详见第三、四节） |
|---|---|---|---|
| 1 | 发版三件套一致（VERSION/CHANGELOG/package.json）＋ 已发布 tag 未移动 | **通过** | §四-1、§四-2 |
| 2 | 三个 minor 的 CHANGELOG 摘要是否人话、与产物对得上 | **通过** | §四-3 |
| 3 | 注册表驱动纪律（AGENTS §2-1：流程代码不写死平台名/模数/预算/枚举） | **通过**（存量观察 1 条，N-3） | §四-4 |
| 4 | 端口真源单向同步（`sync-ports --check` ＋ 独立交叉核对） | **通过** | §四-5 |
| 5 | 语义映射诚实性（`n/8` 与 `status` 相称，不粉饰） | **通过** | §四-6 |
| 6 | 门禁与测试实跑（router 26 / procedural 40 / schema-ref / ports 6＋reconcile＋version check） | **通过** | §四-7 |
| 7 | CI 与承诺对得上（工作流真实存在且各 release 实跑成功） | **通过**（读取方式为网页摘要，见未覆盖 1） | §四-2、§四-8 |
| 8 | 不该入库的东西（config/runs/raw/out/source-images/凭证） | **通过**（新登记轻微 2 条：N-1 日期矛盾、N-2 空壳残留） | §四-9、§三 |
| 9 | 2026-10-19 后新增变化的账实相符 | **不通过**（N-1【轻微】：v0.9.1 于 10-24 提交，内含命名为 10-25/10-26 的批次报告） | §三 |

**总判定：通过（带缺陷登记）** —— 不通过子项 **1** 条（N-1，轻微），另有轻微 N-2 归入第 8 项观察，遗留/观察项 6 条。

---

## 二、X-0053 S 系列复跑（三态 ＋ 证据）

> 判据：`X-0053` §三-3（行 246-276，实际含 S-1~S-6）；销号正本 `X-0056` 自称 11/11 已销（studio 6 ＋ assets 5）。以下只复跑 **studio 侧 6 条**，每条 = 独立复核命令 ＋ 实际输出。**六条全部「已销」，无「未销」、无「复发」**；X-0056 的销号主张经复核**成立**。

### S-1（原【严重】CI 第二 checkout `path: ../gbe-assets` 越界）→ **已销，且比销号时更强**

```bash
grep -n "path:" .github/workflows/ci.yml
# →           path: gbe-assets
grep -n "GBE_ASSETS_REPO" .github/workflows/ci.yml
# → 22:      GBE_ASSETS_REPO: ${{ github.workspace }}/gbe-assets   （job 级，2026-10-19 v0.6.8 再修一轮）
```
X-0056 追加节记载的三轮 CI 实跑（v0.6.6 红 → v0.6.7 红 → v0.6.8 绿）与仓库史一致（`1546413`、`27f9ffc` 两笔修错提交在 `c40bf52..13de06a` 范围内可见）。**本次新增证据**：GitHub Actions 页面读取显示 v0.7.0 / v0.8.0 / v0.9.0 / v0.9.1 各 release 的 CI 均 success（见 §四-8，读取方式限制见未覆盖 1）。

### S-2（原【中等】端口副本 8080 未随真源改 8090；candidates 不查致假绿）→ **已销，无复发**

```bash
grep -rn "8080" core/registry/ bridges/registry.json README.md docs/PLAN.md
# → 仅 3 处命中，全部是「8080 归 qiuyuan-game-ws」的说明文字与 reserved_by_others 条目本体；
#   bridges/registry.json:74 "port": 8080 = qiuyuan-game-ws（owner=qiuyuan-dalu），与真源一致，属合法占有方而非漂移副本
grep -rn "8090" core/registry/mcp.json core/registry/engines.json README.md docs/PLAN.md
# → mcp.json:163/165 两候选均 8090；engines.json:60、README:240、PLAN:487 均 8090
node bridges/sync-ports.js --check   # → 两行 ✓，EXIT=0
node bridges/test/ports.smoke.js     # → 结果：通过（6 / 6），含「旧漂移（candidate 8080 属他仓）→ 必报」反向用例
```
**独立复算**（不跑对方脚本，自己对照真源重核一遍）：
```bash
node -e "…逐 id 比对 bridges/registry.json 的 studio_ports/reserved_ports/deferred_ports 与 gbe-assets/catalog/ports.json…"
# → INDEPENDENT CROSS-CHECK ports: 0 diffs；mcp.json 各实现端口在真源 ports.json 全部存在且同号
```
`sync-ports.js:118` 注释确认 S-2 的扩面（candidates_for_future ＋ 归属校验）已落在 `--check` 专用路径；真源缺失时 `readSource()` 以 **exit 2** 退出（跳过不冒充绿）。

### S-3（原【中等】`engines/base.js validate` 恒 exit 1、`--impl` 不解析）→ **已销**

```bash
node engines/base.js validate godot --impl yanhuifair-godot-mcp
# → 实现：yanhuifair-godot-mcp  映射状态：unmapped
#   语义动作覆盖：0/8 … EXIT=1
node engines/base.js validate unreal
# → ✗ unreal: MCP 实现尚未选择（active=null）… 验证某个实现（不改注册表）：node engines/base.js validate unreal --impl <impl-id>
#   （错误提示已不指向未实现的 gbe-engine 子命令，改为「★ 仍是留位，未实现」注记）EXIT=1
```
读 `engines/base.js:169-215`：`--impl` 已被 CLI 解析；退出码语义为 `missing.length ? 1 : 0` —— **8/8 映射填完后可达 exit 0**，当前恒 1 是「映射未填」的诚实结果而非命令不可达。X-0056 的销号口径（「修的是命令能跑到，不是映射填完」）成立。

### S-4（原【中等】全仓仅 1 个测试文件）→ **已销，无复发**

```bash
git ls-files | grep -iE "test|smoke"
# → bridges/test/ports.smoke.js · build/procedural/test/procedural.smoke.js ·
#   core/policy/test/router.smoke.js · core/test/schema-ref.smoke.js   （4 套）
npm test   # → 26 通过/0 失败 ＋ 40 件全过 ＋ schema-ref 正反例全过 ＋ ports 6/6，EXIT=0
```
**独立复算件数**：`node -e "require('./build/procedural/components').components.length"` → **40**，与 smoke 与 v0.8.0 日志（24→40）一致。

### S-5（原【轻微】README 测试计数 25 vs 26；qa/ 空却列横切三项）→ **已销，无复发**

```bash
grep -n "以输出为准" README.md   # → 67、216 两处（计数不再抄数）
sed -n '21,24p' README.md        # → 横切三项按现状标注：CostLedger 实现未做 / QA Gate 由 @gbe/schema 承担、qa/ 仅留位 / MCP 桥已落
ls qa/                            # → 仅 .gitkeep（与「留位」声明一致，README:141 树中亦标「留位」）
```

### S-6（原【轻微】版本校验不核 README 与嵌套 package.json）→ **已销，无复发（且修过自身回归）**

`scripts/version.js` 实读：3b「README 禁硬编码版本号（代码块豁免）」（:349-365）、3c「嵌套 package.json 对齐」（:369-378）、v0.6.7 补丁「有 `.git` 的目录 = 别的仓库，不扫」（:297-302）。
```bash
node scripts/version.js check   # → ✓ 全部通过：版本号、更新日志、镜像、变更记录一致   EXIT=0
grep -n "shields.io/github/v/tag" README.md   # → 徽章为动态取 tag，无写死版本号
```

---

## 三、新增变化缺陷清单（仅 2026-10-19 之后，`c40bf52..13de06a`）

### N-1【轻微 · 不通过】v0.9.1 批次报告的日期命名晚于其自身提交/发布时间

```bash
git log -1 --format="%ci %s" 13de06a
# → 2026-10-24 18:43:48 +0800 chore(release): v0.9.1
git show --stat 13de06a | grep PILOT
# → 含 pipeline/reports/PILOT-2026-10-25.md（284 行 · 新增）与 PILOT-2026-10-26.md（164 行 · 新增）
```
CHANGELOG `[0.9.1] - 2026-10-24` 自述「10-23..26 批次报告」——**10-24 的提交里装着自称 10-25/10-26 的批次报告**，三者（文件名日期 / CHANGELOG 日期 / commit 时间戳）至少一处不真。报告正文（如「本批 13 张」「实测优化后写回」）是已完成口径而非计划口径，故不是「预填计划」。处置：向作者核实批次实际执行日，改报告文件名或改 CHANGELOG 日期使其与 git 事实一致（**移动即改引用**：`pilot-05/06/07` 与 pipeline/README 共 4-9 处引用点名这些报告）。

### N-2【轻微】`scripts/.gitkeep` 空壳残留

```bash
ls scripts/          # → hooks · install-hooks.js · version.js · .gitkeep
git ls-files scripts | grep gitkeep
```
`scripts/` 早已非空，违反本仓 `AGENTS.md` §6.2-5「目录有内容后删 `.gitkeep`」。对照：v0.9.0 已正确移除 `pipeline/.gitkeep`（`fdb2f80` stat 可见），说明规则被认可，此条属漏删。去向：studio 下轮顺手删（只出清单，本次未执行）。

### N-3【观察 · 存量模式在范围内扩大】装配脚本写死网格与场景预算（AGENTS §3 陷阱表同族）

```bash
grep -n "grid_snap_m: 0.5" build/procedural/assemble.js      # → 425（成稿 manifest 写字面量）
git blame -L 425,425 build/procedural/assemble.js            # → cd08f596（2026-09-15，存量）
grep -n "scene_budget: { lod0: 350000" build/procedural/assemble.js
# → 132 · 198 · 258 三处；其中 :258（yingshan-roof-test-a）与民居配方为 v0.7.0（04e5c2c）范围内新增
git log --oneline -S "scene_budget: { lod0: 350000" -- build/procedural/assemble.js
# → 04e5c2c（v0.7.0 扩大）· cd08f59（引入）
```
同文件 :464 校验路径**已经**读 `board.grid.snap_m`（kit 真源），唯独成稿输出 `grid_snap_m: 0.5` 走字面量；`generate.js:31` 的 `GRID` 常量同（亦存量）。不构成新违纪（引入早于纪元、X-0053 未列），但 v0.7.0 在范围内**复制了该模式 2 处**。建议：成稿 manifest 的 `grid_snap_m` 改读 kit.grid，配方 `scene_budget` 声明进 kit/参数。去向：studio 排期，非本卡执行。

### N-4【观察】`reconcile` 三方对账未进 CI，而范围内动了 coverage 真源

v0.7.0/v0.8.0 均改 `BUILDING-DECOMPOSITION §9.2` 路线标注与 kit coverage 相关口径，但 CI 三门禁（version check / sync-ports / npm test）不含 `build/convergence/reconcile.js` —— 漂移只能靠本地自检纪律（AGENTS §4 条件项）。本次实跑为绿（§四-7），但属「无执法的绿灯」。去向：建议 CI 加一步（代价：CI 需 checkout gbe-assets 读 kit.json——该 checkout 已存在，边际成本≈0）；由 studio 与 guild 裁。

### N-5【登记缺口 · 判 guild 侧】guild 版本配套表滞后（studio 行）

```bash
cd F:/zxc/Project/qiuyuan-guild && node scripts/check-version-pins.js
# → ⚠ P6  gbe-studio: 表=v0.6.5 真源=v0.9.1 —— 软判据：不阻断 · 但不许当没看见（改 registry/version-pins.md 或对方真源）
# → ⚠ P6  gbe-assets: 表=v0.7.0 真源=v0.9.0 ——（assets 行超出本对象，转遗留）
```
**归属判定**：studio 真源侧（VERSION/CHANGELOG/tag/远端）全部齐步前进（§四-1/2），无违反本仓任何纪律；滞后的 `registry/version-pins.md` 是 **guild 自己的派生台账**（`registry/` 全是视图，AGENTS guild §8）。⇒ **这是 guild 侧登记缺口，不是 studio 缺陷**。去向：guild 主 agent 更新该表（一行改动），或由 `gen-*` 脚本自动刷新。

### N-6【轻微 · 观察】范围内新入仓文件含本机绝对路径

```bash
git grep -nE "F:[/\\\\]zxc|C:[/\\\\]Users" -- '*.md' '*.js' '*.json' | grep -v docs/
# → pipeline/prompts/cn-ancient/pilot-08-village-hunyuan-text.md:113 "命名与落点：F:\zxc\db\models\huaiyin\…"（v0.9.1 新增）
# → gbe.config.example.json:41 为示例注释（"如 F:/zxc/Project/WananCity"），非违纪
```
本仓 `AGENTS.md` §4 只禁「凭证、gbe.config.json、runs/、raw/」，未明禁文档内本机路径（该禁令在同族 `gbe-assets` AGENTS §4）。换机复跑时该行是死指引。去向：请大人裁是否把「文档禁本机绝对路径」统一写进 studio AGENTS；裁定前只登记。

### N-7【观察 · 存量】`scripts/hooks/pre-push` 两处旧账

- 头注「纪律见 AGENTS.md §2.6」—— 现 AGENTS §2 已扩为七条，该纪律在 **§2.7**（§2.6 是破坏性操作条）；指针 stale 自 `03286bd`（v0.2.0，存量）。
- 无 node 时 `exit 0` 放行（fail-open 逃生口）—— 与 guild 侧「跳过不是绿」的精神相悖；同为存量（v0.2.0 引入）。
去向：studio 顺手改注释；fail-open 是否收紧属机制取舍，交大人裁。

### N-8【观察 · 存量-镜像】`docs/PLAN.md` 对 `pipeline/` 的描述停在「提示词库」

```bash
sed -n '622p' docs/PLAN.md
# → ├── pipeline/  # 提示词库（多平台变体 + 构件专用）、材质映射、生成计划、轴心规范
```
v0.9.0 起 `pipeline/` 是五段产线（prompts/source-images/tools/out/reports），真源已由 `docs/REPO-LAYOUT.md` ＋ `pipeline/README.md` 接管，PLAN 未回填。因布局规范另有单一真源、PLAN 只是概览，判**观察**不判不通过。去向：studio 下轮在 PLAN 加一行指针即可，不必展开。

> 边界纪律（§6 坑 6）：审中发现 `gbe.config.example.json` 的 `note`、`.obsidian/app.json` 等仍入库（编辑器配置入库、workspace.json 已于 v0.9.0 取消跟踪）——「不留空壳/入库矩阵」判据归 `REPO-LAYOUT.md` §入 Git 矩阵，`.obsidian` 三份在矩阵内的定性**未在本次逐条核**，转未覆盖 5。

---

## 四、机械判据实跑读数（全部 2026-10-27 本机实跑）

1. **发版三件套**：`cat VERSION`=0.9.1；`package.json.version`=0.9.1；`CHANGELOG.md` 首条 `[0.9.1] - 2026-10-24`；`node scripts/version.js check` → **✓ 全部通过 EXIT=0**。
2. **tag 未移动**：本地 21 个 tag 逐一与远端 **peeled** 引用比对（首遍比对误用未 peel 的 tag 对象 SHA 得出「全 MOVED」假象，先怀疑仪器后改用 `refs/tags/X^{}` 重比 → **零差异**）；范围内各 tag 均 annotated（`git cat-file -t` = tag）且 `git show <tag>:VERSION` 与 tag 号一致（v0.7.0→0.7.0 … v0.9.1→0.9.1）。`git config core.hooksPath` = `scripts/hooks`（pre-push 已装）。
3. **三个 minor 改了什么（CHANGELOG 摘要质量）**：v0.7.0＝民居六件灰模＋首栋民居装配＋配方实例数修错；v0.8.0＝村落皮肤/道具 16 件＋plant 材质组；v0.9.0＝混元批次试产、LOD 三轨工具链、仓库布局规范；v0.9.1＝PILOT 04-08 提示词＋10-23..26 批次报告。摘要均为**具体产物＋数字**（如 49,958→8,996 tris），非「更新代码」式空话。
4. **注册表驱动**：`grep -rn --include=*.js -E "provider===|'(tripo|meshy|hunyuan3d|fal|rodin)'" providers/ decompose/ refine/ engines/ build/ cmd/ bridges/ core/`（排除 test/registry）→ **0 命中**；`grep 20000` → 0 命中；`generate.js:345-360` 实读 kit.json `budgets` 回退 `catalog.config.json` ✓。
5. **端口**：`sync-ports.js --check` 绿 ＋ 独立交叉 0 diffs（见 S-2）。
6. **语义映射诚实性**：`core/registry/mcp.json` 四引擎 `active` 全 null（ADR-0005 留位）；`engines/{godot,unreal}/semantic_map.json` `status=unmapped`、8 键 tool 全空 ⇒ `validate` 如实报 **0/8**；`engines/unity` 无 map（deferred，engines.json 有 `deferred_reason`）；README/PLAN grep「8/8/已映射」→ 0 处粉饰。**状态与读数相称：诚实。**
7. **门禁/测试实跑**：`router.smoke` **26/26**；`procedural.smoke` **40 件全过**；`schema-ref.smoke` 正反例＋v1 闸门全过；`ports.smoke` **6/6**（含反向用例）；`npm test` **EXIT=0**；`reconcile` 50 表行 = 24P+21A+5B、planned 50、形制 8、已入库 24、待生成 26 → **✓ 全绿 EXIT=0**。
   **独立复算 reconcile**：自 parse `§9.2` 表 → A21/P24/B5（=reconcile 报数）；自 parse `gbe-assets/kits/cn-ancient/kit.json` `coverage.components/*` → planned 加总 **50**、done 加总 **24**；`forms.length` = **8**。三方逐数吻合，非复跑对方脚本。
8. **CI 与承诺**：`.github/workflows/ci.yml` 实读 = 三门禁 ＋ Node 20/22 矩阵 ＋ 工作区内 checkout gbe-assets ＋ job 级 env；`npm test` 四套仅依赖 stdlib 与本地 require，无 `npm install` 也能跑（依赖只被 `pipeline/tools/lod/*` 用，CI 不跑它们）—— 承诺与文件内容对得上。GitHub Actions 页面（WebFetch）读数：**v0.6.8/0.7.0/0.8.0/0.9.0/0.9.1 各 main 与 tag 事件均 success**，v0.6.6/v0.6.7 两笔红与 X-0056 追加节记载吻合。隔壁 gbe-assets 的 A-1 病（无 CI 却四处承诺）在 studio **不存在**。
9. **不该入库**：`git ls-files | grep -iE "gbe.config.json|^runs/|^raw/|/out/|source-images/|\.env|node_modules"` → **0 命中**；`pipeline/out|source-images` 跟踪数 = **0**；`.gitignore` 覆盖面完整（含 v0.9.0 新加的 out/source-images/workspace.json）；仅 `gbe.config.example.json`（模板）入库 ✓。

---

## 五、gbe-studio 文档去留总表（§10.4 · 排序只依据客观量；删除/搬家**只出清单，未执行任何一项**）

客观量口径：A=四仓（studio/assets/guild/dalu）含该文件名的**引用文件数**（同名泛计，README/AGENTS/CHANGELOG 行的数值含其它仓自己同名文件，作上限读）；B=是否被门禁/脚本读取；C=是否被本仓 AGENTS.md §6 点名。判「过没过时」以内容日期 vs HEAD 为准。

| 文档 | 它是什么 / 谁该读 | A（上限） | B 门禁引用 | C AGENTS §6 点名 | 过时判定 | 去留建议 |
|---|---|---|---|---|---|---|
| `README.md` | 门面＋五层现状 / 所有人 | 120 | ✓ version.js 3b 校它 | ✓ | 2026-10-19 诚实化后再更新，未过时 | **保留** |
| `AGENTS.md` | 开工纪律 / 每个 agent | 36 | ✓（version.js check 联动） | ✓ | v0.9.0 刚同步过文档地图，未过时 | **保留** |
| `CHANGELOG.md` | 变更内容真源 / 查版本的人 | 7 | ✓ version.js | ✓ | 与 HEAD 同步（0.9.1），未过时 | **保留** |
| `docs/BUILDING-DECOMPOSITION.md` | 拆分与构件路线台账 / 拆分层、装配、M4 排期的人 | 23（跨仓经 `gbe-studio/docs/` 路径引用亦最密） | ✓ reconcile/forms 直读 §9.2 | ✓ | v0.8.0 有补记，未过时 | **保留** |
| `docs/PLAN.md` | 本仓总方案 / 新人、guild 对账 | 17 | ✗ | ✓ | **部分过时**：§目录树对 pipeline 描述停在旧口径（N-8） | **保留＋就地补一行指针**（不新建替代品） |
| `docs/LOD-PIPELINE.md` | LOD 三轨设计 / 简化器使用者 | 6 | ✗ | ✓ | v0.9.0 新建，现行 | **保留** |
| `docs/REPO-LAYOUT.md` | 目录/入库矩阵真源 / 新文件落点决策的人 | 5 | ✗（无脚本核它，入库靠 .gitignore） | ✓ | v0.9.0 新建、v0.9.1 刚更新，现行 | **保留** |
| `pipeline/README.md` | 产线五段说明 / 跑批次的人 | （经 reports/prompts 多处点名） | ✗ | ✓ | v0.9.1 更新，现行 | **保留** |
| `pipeline/prompts/cn-ancient/README.md` | 提示词索引 / 出批的人 | 高（本目录 8 份的父页） | ✗ | ✗（经 pipeline/README 间接） | v0.9.1 更新，现行 | **保留** |
| `pipeline/prompts/cn-ancient/pilot-01..08.md`（8 份） | 每批提示词真源，报告「写回」的对象 / 复跑该批的人 | 引用数 1–9（pilot-05 最多=9，pilot-08 最少=1） | ✗ | 按 §6.1「prompts 段」整类点名 | **均现行**（pilot-05/06/07 被 10-25/26 报告点名；pilot-08 仅 1 处引用但属最新批） | **保留**（无「没人读且不会再有」者；pilot-08 若下轮换口径需同步 N-6 本机路径行） |
| `pipeline/reports/PILOT-2026-10-22..26.md`（5 份） | 批次报告，AGENTS §6.1 规定「每批一份、别搬进 docs/」 / 查该批产物的人 | 各 3–5 | ✗ | ✓（命名模式被 §6.1 点名） | 4 份现行；**10-25/10-26 两份存在日期矛盾（N-1），先修日期再定** | **保留**；「过时即移 archive」判据暂不适用——它们是台账不是死文档 |

**结论**：22 份文档 **0 份达到删除判据**（「这个文件还有没有人读？」——全部有人读或为真源）；唯一需动作的是 PLAN.md 补指针（就地改）与 N-1 的日期更正。

---

## 本次未覆盖（必填）

1. **GitHub Actions 读数取自网页摘要（WebFetch 两次交叉，结果一致），本机无 gh CLI** —— 未留存 API 原始 JSON；「各 release CI success」的证据等级低于落盘截图。
2. **LOD/减面数值未独立复算**（8,996 / 28,944 / 384 tris、UV 45.2%、复跑逐字节一致）—— 产物在 `pipeline/out/`，按纪律不入 Git，本机无 Blender 5.2/混元环境，只能核「工具与报告齐备、口径自洽」。
3. **`pipeline/tools/*.py|*.js` 未实跑**（retopo-bake/simplify-attr/normalize-hunyuan-glb 等 9 个工具）。
4. **`version.js check` 与 `reconcile` 的反向用例未实测**（只读约束，不能故意制造未记录改动/coverage 漂移看它红；依赖 ports.smoke/schema-ref 等自带反向用例的实跑输出）。
5. **`.obsidian/` 三份入库配置是否符合 REPO-LAYOUT 入库矩阵**、`sync-ports --probe` 真机端口探测、providers/decompose/refine 层的生成实调（Phase 1，全部留位）。
6. **v0.6.6 之前的存量历史**（如 N-3/N-7 的引入轮）只追到「首次出现」为止，未全量重审。
7. **gbe-assets 侧 P6 行（表 0.7.0 vs 真源 0.9.0）**——属另一审阅对象，只登记不扩审。

## 遗留问题（逐条给去向）

| # | 事 | 去向 |
|---|---|---|
| 1 | N-1 报告日期 vs 提交时间矛盾（10-25/10-26 报告在 10-24 提交内） | **studio**：核实实际批次日后修正文件名或 CHANGELOG 日期（移动即改引用，约 4-9 处） |
| 2 | N-2 `scripts/.gitkeep` 空壳 | **studio**：下轮顺手删（本审阅未执行删除） |
| 3 | N-3 manifest `grid_snap_m` / 配方 `scene_budget` 字面量（范围内复制 2 处） | **studio**：改读 kit 真源；判据缺口同 N-4 一并处理 |
| 4 | N-4 `reconcile` 未进 CI（coverage 在范围内被改而无执法） | **studio 提议 ＋ guild 裁**：CI 第四步加 `node build/convergence/reconcile.js`（gbe-assets checkout 已具备） |
| 5 | N-5 guild 版本配套表 studio=v0.6.5（assets 行 v0.7.0 vs 真源 v0.9.0 一并） | **guild**：更新 `registry/version-pins.md`（判定：guild 侧登记缺口，非 studio 违纪）；assets 行转 gbe-assets 对象/主 agent |
| 6 | N-6 文档内本机绝对路径（pilot-08:113） | **待大人裁**：是否把「文档禁本机路径」写进 studio AGENTS §4（与 gbe-assets 对齐）；裁前只登记 |
| 7 | N-7 pre-push 旧指针（§2.6→§2.7）与 fail-open | **studio** 顺手改注释；fail-open 收紧与否**待裁** |
| 8 | N-8 PLAN.md pipeline 段旧口径 | **studio**：加一行指向 `REPO-LAYOUT.md`/`pipeline/README.md` 即可 |
| 9 | CI success 的网页摘要证据 | **主 agent**：若有 gh/token，落一次 `gh run list` 原始输出进正本附证 |

## 执行环境（仅供回溯，不作评价）

- 工具/版本：Qoder Desktop sub-agent · Git Bash（win32）· node v22.23.2 · git（origin SSH 可达，`git ls-remote` 实跑成功）
- 模型：Qoder Desktop · 底层模型不披露
- 日期：2026-10-27 · 快照：studio `13de06a` / guild `8b44ca1`（工作区全程只读，未产生任何对被审仓的写入）
