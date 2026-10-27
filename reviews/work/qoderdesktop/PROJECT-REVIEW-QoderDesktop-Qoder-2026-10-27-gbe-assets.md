# gbe-assets 复审报告 —— X-0053 A 系列销号复核 ＋ bd8da4b..5656dcf 新增变化

- **来源**：Qoder Desktop 主 agent 派出的 sub-agent（按 `REVIEW-PROCESS.md` §10 派活，非 guild 侧 review）
- **Agent 名称**：Qoder Desktop sub-agent（gbe-assets 对象审阅）
- **大模型**：Qoder Desktop · 底层模型不披露
- **审查时间**：2026-10-27
- **审查对象**：`gbe-assets` = `F:/zxc/Project/gbe-assets`（GBE 资产仓储端）
- **与前作关系**：**复审**（§10.1）—— 正本 `reviews/X-0053.md` §三-4（A-1~A-5，277~297 行）逐条复跑；GBE 双仓收口卡 `X-0056` 的主张**逐条复核不盲信**（assets 侧 5 项全部独立复跑）；新增变化只登记 `bd8da4b..5656dcf`（v0.7.1 → v0.8.0 → v0.9.0）。
- **审阅快照**：gbe-assets `5656dcf`（= `origin/main`，工作区干净）／ guild `8b44ca1` ／ gbe-studio `13de06a`（v0.9.1，仅作旁证）
- **硬约束确认**：只读 ✓ ／ 未改被审对象任何文件 ✓ ／ 未 `git add`/`commit` ✓ ／ 删除类**只出清单、零执行** ✓ ／ 判定二值、无分数无等级 ✓
- **覆盖**：X-0053 A-1~A-5 复跑 · X-0056 assets 侧主张复核 · 分类三方集合独立复算 · 端口/校验器真源唯一性 · v1 拒收实测 · 发版三件套与 tag · 入库排除项 · 冒烟测试全量实跑 · 新增两批 40 件资产与 2 份装配清单质量抽全查 · 文档去留总表 · guild 版本钉软警归因
- **未覆盖**：见文末「本次未覆盖」节（必填）

---

## 一、对象与判定（二值表）

| # | 审阅项 | 判定 | 依据（详见下文节） |
|---|---|---|---|
| 1 | A-1「无 CI 却四处承诺」复跑 | **通过**（已销） | §二；CI 存在且 GitHub 实跑 5/5 success |
| 2 | A-2「分类三处不一致」复跑 | **通过**（已销，主体） | §二；三方集合独立复算差集全空 |
| 3 | A-3「CONTRIBUTING 合并」复跑 | **通过**（已销） | §二 |
| 4 | A-4「README ADR 区间」复跑 | **通过**（已销） | §二；残留指针式写法 2 处另记 N-R1 |
| 5 | A-5「npm test 只跑 smoke」复跑 | **通过**（已销） | §二；实跑 49+30+10 全绿 |
| 6 | X-0056 主张复核（assets 侧 5 项） | **通过**（主张属实） | §二末；含其「CI 首跑绿」追加节，API 证实 |
| 7 | 新增批次数据质量（v0.8.0 / v0.9.0 共 40 件＋2 装配） | **通过** | §三 N 表正面项＋§四 |
| 8 | 新增/存量文档一致性 | **不通过** | §三：N-1（4 处死链）· N-2（`_archive` 命名未落契约）· N-4（submodule 承诺未兑现） |
| 9 | 真源唯一性（ports ＋ 校验器） | **通过** | §三 N-4 之外的副本排查全绿 |
| 10 | 不迁移不兼容 v1（ADR-0001）实测 | **通过** | §三 |
| 11 | 发版三件套 / tag / version.js check | **通过** | §四 |
| 12 | 不该入库 · 新增范围 | **通过** | §四 |
| 13 | 不该入库 · 存量 | **不通过** | §三 N-5（LFS 声明 vs 实态）· N-6（`.obsidian` 入库） |
| 14 | 冒烟测试与门禁实跑 | **通过** | §四（逐命令输出） |
| 15 | guild P6 版本钉软警归因 | 判定：**guild 侧登记缺口**（gbe-assets 合规） | §三 N-8 |

**总判定：不通过 3 项（8 / 13，另 15 归 guild 侧），不通过条均为文档镜像与存量入库项，无一涉及契约真源或数据正确性。**

---

## 二、X-0053 A 系列复跑（三态：已销 / 未销 / 复发）

### A-1【严重】无 CI 却把 CI 当既有门禁 —— 判定：**已销**

原缺陷：`ls .github` → 不存在，而 `CONTRIBUTING:100` / `CONVENTIONS:467` / `PLAN:473,517` / `AGENTS:35` 四处承诺 CI。

复跑证据（全部实测，非读文档自称）：

```bash
ls .github/workflows/            # ci.yml 存在
```

`ci.yml` 实有 6 步：schema tests（npm test 三套）/ 真源 kit 校验 / `check-doc-enums` / 装配清单逐个 `assembly-check`（空目录时打印「跳过（NOT a pass）」）/ `intake --dry-run` / `version.js check`；matrix node 20+22，`fetch-depth: 0`。

**GitHub 侧真跑过没有**（X-0056 追加节自称「assets 首跑即绿」，本次用公开 API 独立复核）：

```bash
curl -s https://api.github.com/repos/sdzdrccc/gbe-assets/actions/runs?per_page=6
total runs: 5
5 push v0.9.0 5656dcf completed success 2026-10-22T12:02:11Z
4 push main   5656dcf completed success 2026-10-22T12:02:11Z
3 push v0.8.0 d73fd8c completed success 2026-10-22T07:02:39Z
2 push main   d73fd8c completed success 2026-10-22T07:02:39Z
1 push main   bd8da4b completed success 2026-10-19T07:04:56Z
```

⇒ **5/5 success，覆盖复审范围内全部三笔提交**（含 tag 推送），「文档承诺 CI、实际没有」不成立，反向（有 CI 但文档没登记）也不成立：`CONVENTIONS §18.1`「CI 覆盖边界」表逐条标注 已校验 / 未校验，与 `ci.yml` 步骤对得上。

**批注（不构成未销）**：`CONVENTIONS.md:39/:57/:129/:493` 仍有四句裸写「由 CI 校验」而该判定实为 ⏳ 未校验——靠 §18.1 前言「其余的『由 CI 校验』属待补」**一句兜底**覆盖。兜底句若在将来被删，这四句立刻回到假承诺状态。去向见遗留 4。

### A-2【中等】分类真源三处不一致、无门禁 —— 判定：**已销（主体判据）**；同族残留 4 处另列 N-1

原判据：`CONVENTIONS:513` 镜像 28 类 ↔ `asset.v2` enum 26 类 ↔ `kit.json:30` 声明 `assemblies/building`，且 `grep categories` 在 `index.js`/`smoke.js`/`intake.js` **0 命中**；另 §4 指向不存在的 `asset.schema.json`。

**独立复算**（不复跑对方脚本，自写差集比对，§3 第 4 步纪律）：

```
schema union size: 28        # asset.v2 enum 26 ∪ assembly.v2 enum {assemblies/building, assemblies/district} 2
mirror size: 28              # 按 CONVENTIONS §4 代码块 dir/{a,b,c} 自行展开
union - mirror: []           # 双向差集全空
mirror - union: []
kit not in union: []         # kit.categories 24 项全部 ∈ 并集
coverage keys not in kit.categories: []
```

执法机制在场且有反向用例：`packages/schema/index.js` 的 `checkKitCategories()` **现读两份 schema 求并集**（不在 kit.schema 写第三份 enum）；`node packages/schema/test/kit-categories.js` → **10/10**，含「越界 `assemblies/castle` 必红」「拼错 `components/rooves` 必红」「空串必红」。`scripts/check-doc-enums.js` → 镜像 28 = 真源 28 ✓（进 CI）。`grep categories` 三脚本 0 命中的问题不复存在。

### A-3【中等】CONTRIBUTING.md 重复且含假 CI 承诺 —— 判定：**已销**

```bash
git ls-files CONTRIBUTING.md | wc -l   # 0（已删）
grep -rn CONTRIBUTING --include=*.md --include=*.js .
# 仅 2 处：CHANGELOG.md:65（合并史叙述）与 README.md:196「贡献指南（X-0053 A-3：原 CONTRIBUTING.md 合并至此）」
```

按 §9.2-4「作废留指针」处置为**合并**（X-0053 原建议即「合并进 README 一节」），README 留了指针，合规。

### A-4【轻微】README 的 ADR 范围停在 0007 —— 判定：**已销**

`README.md:99/:267` 均改为「条数与最大号以文件尾为准 / 最新号看文件尾」，不再抄区间。实测 `docs/DECISIONS.md` 最大号仍为 **ADR-0008**（`grep '^## ADR-'` 尾部三行 = 0006/0007/0008），只追加纪律未被破坏（`bd8da4b..5656dcf` 区间 `docs/` 零改动）。

### A-5【轻微】package.json:test 只跑 smoke.js —— 判定：**已销**

```bash
grep '"test"' packages/schema/package.json
# "node test/smoke.js && node test/assembly.js && node test/kit-categories.js"
npm --prefix packages/schema test   # EXIT=0：smoke 49/0 · assembly 30/0 · kit-categories 10/10
```

### X-0056 主张本身复核（不盲信）

- **通过**：assets 侧 A-1~A-5 五条主张全部经上述独立复跑证实；其「§4 真源拆两份」「check-doc-enums 进 CI」「npm test 三套」与仓内实况一致；「未改枚举值 / 未改 ADR / 未改 ports.json」与 `git log -- catalog/schema catalog/ports.json docs/DECISIONS.md`（bd8da4b 后零提交）吻合。
- **其追加节（10-19 推送后 CI 实跑）由 GitHub API 直接证实**（run #1 = bd8da4b success），本次进一步覆盖到 v0.8.0/v0.9.0。
- studio 侧 S-1~S-6 不属本对象，**未逐条复跑**（旁证见「本次未覆盖」#1）。

---

## 三、新增变化与缺陷清单（范围：bd8da4b..5656dcf；存量新发现单列）

**两笔新增提交的内容**：v0.8.0 `d73fd8c`（屋面 1 ＋ 民居构件 5 ＋ 装配清单 2 ＋ coverage 刷新）· v0.9.0 `5656dcf`（村落皮肤/道具 16 件 ＋ `materials.plant` 组 ＋ coverage 补 8 类）。区间内 `catalog/` `docs/` `scripts/` `packages/` `tools/` `.github/` **零改动**（`git diff --stat` 实测为空）⇒ 无契约变更 ⇒ 「四处同提交」(AGENTS §2.2-2) 在本区间**无适用对象**，不构成违规。

### 不通过项

**N-1【中等】`docs/CONVENTIONS.md` 仍有 4 处指向不存在的 `catalog/schema/asset.schema.json`**（存量 · A-2 同族 · 本次新发现）

```bash
grep -rn "asset\.schema\.json" --include=*.md --include=*.js --include=*.json . | grep -v CONVENTIONS-REVIEW
# docs/CONVENTIONS.md:21（§0 原则1「分类枚举 →」）
# docs/CONVENTIONS.md:22（§0 原则2「分类 ←」）
# docs/CONVENTIONS.md:318（§9.1 插槽类型表「真源为 …」）
# docs/CONVENTIONS.md:542（§19 granularity「真源：asset.schema.json 的 enum」）
```

`catalog/schema/` 实际只有 `asset.v2.schema.json`。A-2 只把 §4 一处改成真名，其余 4 处同病未治——四处宣称的「真源文件」按名去读会读不到（socket type / granularity enum 实际都在 `asset.v2.schema.json` 里，值本身无错，**错在指针文件名**）。去向：assets 下轮改 4 处文件名（纯镜像订正，不动枚举）。

**N-2【轻微→中等】`_archive/` 归档命名与契约声明不符，且 `+N` 冲突后缀从未落任何文档**（新增物证；根因代码是旧的）

AGENTS §6.1 登记 `_archive/<asset-id>/<version>/`，§1 表又写 `inbox/<id>@<version>/ → _archive/inbox/<id>@<version>/`；实际 v0.8.0/v0.9.0 落盘的是**扁平** `_archive/<id 第三段>@<version>[+N]/`：

```bash
ls _archive/
# old-locust-a@1.0.0  @1.0.0+2 … +6   yingshan-single-a@1.0.0  +2
# 即：既无 <asset-id> 全称（缺 kit/category 段），也无 inbox/ 子层，+N 去重后缀只存在于 tools/intake.js:238-241 的代码里
```

move 归档、禁 `rm` 的纪律本身执行到位（8 个归档目录均为整包 move）；违的是**AGENTS §6.1 自称的落点格式**。两处声明彼此也不同义（`<id>/<version>/` vs `inbox/<id>@<version>/`）。去向：assets —— 要么订正 AGENTS §6.1 两处为 intake 实况格式并给 `+N` 立文档，要么改 intake；属镜像/真源订正，建议下轮卡处理。

**N-4【轻微】「CI 期用 git submodule 锁 commit」承诺未兑现**（表述存量，实态分叉由 10-19 同日修复引入）

`AGENTS.md §2.3` 与 `docs/CONVENTIONS.md:488` 写「开发期 `file:` 引用；CI 期 **submodule 锁 commit**」。实测 studio CI：

```bash
grep -n "repository\|submodule" F:/zxc/Project/gbe-studio/.github/workflows/ci.yml
# - uses: actions/checkout@v4
#     repository: sdzdrccc/gbe-assets   path: gbe-assets（无 ref 锁定，非 submodule）
```

⇒ 无第二份**副本**（真源唯一性不违，见下项），但「锁 commit」那句是把**打算**写成**已有**——与 A-1 同型（程度轻：东西确实存在，只是没按声明的机制）。去向：两仓文档口径统一（改成「CI 期整仓 checkout 最新 main」或真做 submodule），随 guild 侧下一轮 GBE 卡。

### 正面复核（新增批次质量，独立复算）

| 判据 | 实测 | 结果 |
|---|---|---|
| 目录名 = id 第三段（§2.2 / AGENTS §3 陷阱） | 自写脚本遍历 40 件 kit 资产逐一比对 `id.split('.')[2]` 与目录名 | **40/40 无失配**，全部 `license=CC0-1.0` |
| coverage「done = planned」宣称（v0.9.0 CHANGELOG 八类补齐） | 文件系统实际计数 vs `kit.json.coverage` 声明 | 17 键中 16 键逐项相等；`assemblies/building` declared=3 = `assemblies/cn-ancient/` 实有 3 份清单 ✓（**独立复算非复跑 intake**） |
| 材质引用 ⊆ `kit.json.materials`（含新增 `plant` 组） | 遍历全部 asset.json 的 `materials.slots[].ref` 与真源组表求差 | 差集空；槽名全部 ⊆ §5.1 十二词标准词表（零越界） |
| 新装配清单 §19.5 八条语义判据 | `node packages/schema/index.js assembly-check <三份清单>` | minju-hard-mountain-a / yingshan-roof-test-a / wanan-wall-corner-a 均「✓ 通过（0 条警告）」 |
| 新资产包全量校验 | TEMP 复制 `cn-ancient.tree.old-locust-a@1.0.0` 跑 `index.js package` | ✓ 通过 0 警告（inbox 命名不变式、预览 512px、glb 存在性、source.v2 全过） |
| source.json「程序化 0 credit」宣称 | 抽 `props/ritual/spirit-plate-a/source.json` | `provider=procedural, cost=0` ✓ 与 CHANGELOG 叙述一致 |

### 真源唯一性 · v1 闸门 · 版本三件套

- **端口**：`find` 六仓，`ports.json` 仅 `gbe-assets/catalog/` 一份；studio `bridges/registry.json` 带 `generated_from/authority` 头（派生视图）；`node bridges/sync-ports.js --check` → 「✓ registry 与真源一致 ✓ mcp/engines 端口交叉一致」EXIT=0。`catalog.config.json` 的 `$comment` 明确记载曾重复登记的 `api_port/web_port` 已删（X-0032 A-8 未复发）。
- **校验器**：六仓 `find` 无第二份 `asset.v2.schema.json`；studio `package.json` 为 `file:../gbe-assets/packages/schema`、`core/schema-ref.js` 三序解析不拷贝；`node packages/schema/index.js ports catalog/ports.json` ✓；`node -e "require('ajv')"` 侧无第二实现。validate.js 自declare 零依赖子集（23 关键字白名单实装，`patternProperties` 在实现内——真源 `kit.json` 的 3 处 `$comment` 实测通过、未知非 `$` 键被 smoke 护栏拦下）。
- **v1 拒收实测（ADR-0001，构造非法包）**：TEMP 内取合法包改 `schema_version:"1"` / 删字段，跑 `index.js asset` 与 `index.js package` 四路：

  ```
  ✗ schema_version 必须为 "2"，实际为 "1"（不静默兼容）        EXIT=1
  ✗ 缺少 schema_version —— v1 契约已废弃…（ADR-0001）          EXIT=1（asset 与 package 两入口都拒）
  ```

  ⇒ 真报错、非零退出，无静默通过路径（CLI 守卫按 schema `required` 决定是否套闸门，`kit` 不误伤——`index.js kit` 真源仍 ✓）。
- **发版三件套**：`VERSION`=0.9.0 ↔ `CHANGELOG.md [0.9.0] - 2026-10-22` ↔ 无顶层 `package.json`（version.js 明打印「本仓没有顶层 package.json，无需同步镜像」，`packages/schema/package.json` 0.1.0 是库自身版本，非镜像）；`node scripts/version.js check` → ✓ 全部通过 VER_EXIT=0；tag：v0.7.1→`bd8da4b` · v0.8.0→`d73fd8c` · v0.9.0→`5656dcf`，均附注 tag（`cat-file -t` = tag）且 peel 到各自 release 提交 ⇒ **已推送 tag 未移动**；`git status -sb`：`main...origin/main` 同步、工作区净；`core.hooksPath=scripts/hooks` 已装，pre-push 含版本校验＋guild `check-asset-ref.js` 跨仓校验（找不到 guild 时**明打印「这是跳过，不是通过」**）。
- **guild 联动旁证**：`node scripts/check-asset-ref.js`（读 assets 真源）→ A1~A5 **5 通过 / 0 警告**（A3「契约分类 26/26 命中 L2 枚举」与本次复算一致）。
- **N-8 guild P6 版本钉软警归因**：`node scripts/check-version-pins.js` → `⚠ P6 gbe-assets: 表=v0.7.0 真源=v0.9.0`（`registry/version-pins.md:24`；同警还有 studio 表 0.6.5 vs 真源 0.9.1）。判定：**guild 侧登记缺口**——配套表是 guild 自持的台账视图，本应由 guild 随 GBE 发版刷新；gbe-assets 自身三件套全绿、无可指摘。去向：guild（更新 `registry/version-pins.md` 两行，或建立「GBE bump 时 guild 跟钉」的动作）。

### 存量新发现（10-19 前即存在，本次体检抓到）

- **N-5【轻微】** `CONVENTIONS §11` 声明 `model.glb / preview.png` 走 **LFS**；实测 48 个 `.glb`＋48 个 `.png` 全在普通 Git（`.gitattributes` 无 `filter=lfs`）。当前件小（程序化灰模）无实害，但声明与实态相反。去向：待裁——改 §11 表述或真上 LFS（属镜像/真源裁定，不自动办）。
- **N-6【轻微】** `.obsidian/`（`app.json`/`appearance.json`/`core-plugins.json`/`workspace.json` 4 件，含编辑器本机状态）被 Git 追踪（v0.3.1 入库）——与生态兄弟仓纪律相悖（gbe-studio §6.2-6 明写 workspace.json 不入 Git；dalu 自检清单「没有提交 .obsidian」）。**只出清单，不执行**：移出建议 = `git rm --cached .obsidian/*` ＋ `.gitignore` 补两行，随下一张 assets 卡。
- **N-7【轻微】** README 目录树（60~61 行）只列 `test/smoke.js`＋`test/assembly.js`，**漏 `test/kit-categories.js`**（A-5 修复当天加的第 3 套，bd8da4b 自身疏漏）。README:182 的 `npm test` 命令本身正确（跑三套）。
- **N-R1【备注】** `docs/PLAN.md:7` 与 `CONVENTIONS.md:9` 仍手抄「ADR-0001 ~ ADR-0008」——当前与实况相符（最大号确为 0008），但正是 A-4 在 README 上刚消灭的「手抄必腐」形态。去向：与 README 同改成指针。

---

## 四、机械判据实跑读数（命令 → 实际输出，全部本会话亲跑）

| 命令（`cd F:/zxc/Project/gbe-assets`） | 读数 | EXIT |
|---|---|---|
| `npm --prefix packages/schema test` | smoke **49 通过/0 失败** · assembly **30/0** · kit-categories **10/10** | 0 |
| `node packages/schema/index.js kit kits/cn-ancient/kit.json` | ✓ 通过（0 条警告） | 0 |
| `node scripts/check-doc-enums.js` | 镜像 28 = 真源 28（asset 26 ∪ assembly 2）✓ 逐字一致 | 0 |
| `node scripts/version.js check` | ✓ 全部通过（版本号/日志/镜像/tag 锚点） | 0 |
| `node tools/intake.js --dry-run` | 入库 0 · 拒收 0 · dry-run（inbox 空，仅 `.gitkeep`） | 0 |
| `node packages/schema/index.js assembly-check`（三份清单） | 各「✓ 0 条警告」 | 0 |
| `node packages/schema/index.js ports catalog/ports.json` | ✓ 0 警告 | 0 |
| v1 拒收四路（asset/package × 缺失/为"1"） | 全部 ✗ 拒收 | 1 |
| guild：`node scripts/check-asset-ref.js` | A1~A5 通过（26/26） | 0 |
| guild：`node scripts/check-version-pins.js` | P6 软警 ×2（表落后），RESULT PASS | 0 |
| studio 旁证：`node bridges/sync-ports.js --check` | ✓ 真源交叉一致 | 0 |
| `git status` / tag / remote | 净；`main`=`origin/main`=`5656dcf`；tag 全附注未移动 | — |
| GitHub API runs | 5/5 success（含 v0.8.0/v0.9.0 与 tag 推送） | — |
| 不该入库实查 | `git ls-files`：`engines/` 0 件（目录不存在）· `index.db` 0（盘上无）· `blobs/` 仅 `.gitkeep` 未追踪 · `inbox/` 仅 `.gitkeep`；新增入库件全部为契约 JSON＋程序化灰模（应在库） | — |
| 凭证/本机路径扫描 | 追踪文件无 `C:\Users`；`F:/zxc/Project` 命中 2 处（AGENTS.md 的 grep 命令示例 · `packages/schema/index.js:12` 用法注释）——后者属环境相关示例路径，备注级 | — |

---

## 五、gbe-assets 文档去留总表

**排序只依据客观量**（在站引用数 = 引用该文件的**其它文件数**，本仓按基名实查、跨仓按显式路径 `gbe-assets/...` 实查；「被门禁/脚本引用」与「AGENTS §6.1 点名」为在场性事实）。**禁主观分级**（ADR-0008），故只列数不评等。**删除/搬家只出清单：本表结论为零删除、零搬家。**

| 文档（git 追踪 7 份 `.md`） | 它是什么 / 谁该读 | 过没过时 | 本仓引用文件数 | 显式跨仓引用（studio/guild/dalu 等） | 被门禁/脚本读 | AGENTS §6.1 点名 |
|---|---|---|---|---|---|---|
| `docs/CONVENTIONS.md` | 工程约定真源镜像 · 双库开工必读 | **活**（有 N-1 四处死文件名指针待订正） | 9 | 4（含 guild `CONVENTIONS.md:712` 等）＋ guild 台账多处 | **是**：`scripts/check-doc-enums.js` 逐字读它（CI 步骤） | 是（工程约定） |
| `docs/DECISIONS.md` | ADR 台账（只追加）· 查裁决来由的人 | **活**（最新 ADR-0008，区间内零改动，合规） | 5 | 9（`gbe-assets/docs/DECISIONS.md` 显式路径） | 间接（§0 原则 0 的流程锚） | 是（裁决台账） |
| `README.md` | 仓入口：目录地图、命令、贡献指南 · 新人第一个读 | **活**（N-7 一处目录树漏列） | 4 | 0（跨仓无显式路径引用） | **是**：version.js「本仓无顶层 package.json」逻辑围绕它维护 | 是（间接，§6.1 CONTRIBUTING 合并去处） |
| `AGENTS.md` | 开工纪律 · 每个动手的 agent | **活** | 5 | studio/guild/dalu 三份 AGENTS 互引（基名计数 studio 7/guild 60/dalu 63 含各自同名文件，不单独归本仓） | **是**：§2.6 是 pre-push 的说理真源 | 自身（§6） |
| `docs/PLAN.md` | 仓储端完整方案 · 架构/目录/阶段读者 | **活**（N-R1 手抄 ADR 区间） | 6 | 1（显式路径）＋ studio PLAN 对偶引用 | 间接（AGENTS §2.2 四处同提交之一） | 是（本仓方案） |
| `CHANGELOG.md` | 变更内容真源 · 查「哪版改了什么」的人 | **活**（顶部段位表在用） | 3 | 5 | **是**：`scripts/version.js` bump/check/tag 三处读写（CI 步骤） | 是（版本真源之一） |
| `docs/CONVENTIONS-REVIEW.md` | 2026-09-15 对齐前审查存档 + 31 项处置记录 · 查「当初为什么改」的人 | **历史，非待办**（README 已如此标注） | 6（AGENTS/README/CHANGELOG/CONVENTIONS/DECISIONS/PLAN 各 1） | 2 | 否 | **是 · 且明写「刻意留在原位」**——被 ADR 正文与 CONVENTIONS 变更史引用，移动即改动历史叙述（AGENTS §7-3） |

- **结论**：七份全部**保留原位**；无「没人读且不会再有」的候选（§7-4 判据），删除清单为空，搬家清单为空。
- 非文档类边界件：`.obsidian/`（N-6 移出清单）、`_archive/`（契约登记归档位，空/满皆合规，不动）。

---

## 本次未覆盖（必填）

1. **gbe-studio 侧 S-1~S-6 未逐条复跑**（属 studio 对象）；本报告只跑了与 assets 真源直接相关的旁证（`sync-ports --check`、六仓副本 find、schema 包消费链），studio 其余以对象审阅 agent 的结论为准。
2. **glb 几何质量未逐件复验**——CHANGELOG「16 三角 / 1324 面」等数值声明、`source.json.recipe_hash` 的「同码同 hash 必同几何」复现性，需要 studio 侧程序化内核重跑，本机未做。
3. **未用第三方 ajv 复核** 零依赖子集校验器与六份 schema 的判定一致性（§0.2 说「换 ajv 复核会给出不同结论」是反向声明，未实测正反）。
4. **GitHub 分支保护 / required checks 未查**（API 只见 runs 结论，未见 merge 门禁配置）。
5. `apps/ clients/ services/ tools/`（仅 `.gitkeep`）等**契约预留位**未对照「不留空壳」裁定——gbe-assets 自己的 AGENTS 无该禁令（studio 有），是否算空壳属口径问题，未擅自判。
6. v0.8/v0.9 CHANGELOG 的「### 变更」行为 bump 摘要句（非缺陷清单级核对）。

## 遗留问题（逐条给去向）

| # | 事 | 去向 |
|---|---|---|
| 1 | N-1：CONVENTIONS 4 处 `asset.schema.json` 死文件名指针（:21/:22/:318/:542） | **assets 下轮卡**（镜像订正，不动枚举） |
| 2 | N-2：`_archive` 实际格式 vs AGENTS §6.1 两处声明互不同义，`+N` 后缀无文档 | **assets**（订正镜像或改 intake，二选一） |
| 3 | N-4：「CI 期 submodule 锁 commit」未兑现（studio CI 为不锁 ref 的 checkout） | **GBE 双仓**，随下一张 GBE 跨仓卡（铁律一：本审阅只登记） |
| 4 | §18.1 裸「由 CI 校验」四句（CONVENTIONS:39/:57/:129/:493）依赖兜底句 | **assets**（与 N-1 并卡处理：就地标 ⏳） |
| 5 | N-5：§11 声明 LFS vs 实际普通 Git（48+48 件） | **待裁**：改 §11 或上 LFS（改契约需 ADR 流程） |
| 6 | N-6：`.obsidian` 4 件在库 | **assets**（`git rm --cached` + gitignore；只出清单未执行） |
| 7 | N-7 / N-R1：README 树漏列 kit-categories.js；PLAN/CONVENTIONS 手抄 ADR 区间 | **assets**（文档微修，随手卡） |
| 8 | guild P6 版本钉落后（表 0.7.0/0.6.5 vs 真源 0.9.0/0.9.1） | **guild**：更新 `registry/version-pins.md`，或立「GBE bump → guild 跟钉」动作（X-0056 遗留 1 的同类） |
| 9 | X-0056 遗留 3/4（§0.1 其余镜像↔真源、四文档同提交 diff 判据）仍标 ⏳ | **assets 下一轮**（原去向不变，未复发新增） |
| 10 | ajv 第三方复核（本次未覆盖 #3） | 建议并入 assets 下一轮校验器加固 |

## 执行环境（可选 · 仅供回溯，不参与评价与统计）

- 工具：Qoder Desktop sub-agent（Windows 10 + Git Bash），node v22.23.2 · git 2.47 · curl（GitHub 公开 API）
- 大模型：Qoder Desktop · 底层模型不披露
- 日期：2026-10-27
- 全程只读；一次性夹具文件均在 `%TEMP%/qy-gbe-assets-review/`，未写入任何被审仓。
