# gbe-assets 资产仓储端复审 —— 项目群全量审查源材料（2026-10-27）

## 头部元信息

| 项 | 值 |
|---|---|
| 来源 | ZCode · 大人在 ZCode 会话派出 |
| Agent 名称 | ZCode-gbe-assets-reviewer |
| 大模型 | GLM-5.3-Flash |
| 审查时间 | 2026-10-27 |
| 审查对象 | `gbe-assets` @ `5656dcf`（`5656dcfde547ac879076db610fa69ea51b77c4f6`，tag `v0.9.0`，本地 main 与 origin/main 同步、工作区干净） |
| 审查范围 | ★ 见下节 |
| 硬约束确认 | 被审仓**只读**：未改动 gbe-assets 任何字节，未 commit / push / checkout；核对全部用只读命令与内联 `node -e`（临时逻辑未落盘）；本次唯一写入 = 本报告 |
| 与前作关系 | **复审**（`REVIEW-PROCESS.md` §10.1 周期复审形态）：`X-0053` §三·4 的 A-1~A-5 已由 `X-0056` 在 `bd8da4b`（v0.7.1）判全销，本次**只复跑原未通过项** ＋ 只登记 2026-10-19 以来的增量，未变部分沿用 `X-0056` 结论 ＋ 指针 |

### 审查范围（覆盖 · 不覆盖）

**覆盖**：
1. 机械判据 6 项实跑（smoke / assembly / kit / intake dry-run / version / CI 在库性）；
2. `X-0053` 未通过项复跑（A-1 CI · A-2 分类口径 · A-3 CONTRIBUTING · A-6 余子项 test 脚本）；
3. 2026-10-19 以来 3 笔提交（`bd8da4b` v0.7.1 → `d73fd8c` v0.8.0 → `5656dcf` v0.9.0）的增量内容与下游破坏性排查；
4. `docs/CONVENTIONS.md` 声明 vs 实际（版本 / 分类 / 门禁）。

**不覆盖**（防误读为「全审了」）：
- `.glb` 网格的几何质量（本机无 Blender / UE 校验环境，只核元数据、装配拓扑与文件哈希）；
- GitHub Actions 本次是否仍绿（沿用 `X-0056` 追加记录的「assets 首跑即绿」，本次未登 GitHub 复核；`ci.yml` 自 v0.7.1 起 `git diff` 为零改动）；
- `gbe-studio`、`虬渊大陆`、`qiuyuan-dalu` 仓内部（各自另派对象；dalu 仅做了「引用面未受破坏」的最小排查）；
- `_archive/` 历史件逐件全量校验（只抽版本字段与 lod0.glb 哈希）。

---

## 一、判定（二值表）

| # | 审阅项 | 判定 | 依据 |
|---|---|---|---|
| 1 | 机械判据 6 项 | **通过** | 全部实跑绿，见 §二 |
| 2 | `X-0053` A-1（CI 缺失却四处承诺）复跑 | **通过** | `.github/workflows/ci.yml` 在库且被 git 跟踪，6 步与 §18.1 表 ✅ 行一一对应 |
| 3 | `X-0053` A-2（分类三处不一致且无门禁）复跑 | **通过** | 两份真源 26+2、kit 24 ⊆ 并集 28，镜像 28 逐字一致，两道执法全绿（残留死链另记 B-2） |
| 4 | `X-0053` A-3（CONTRIBUTING 重复）复跑 | **通过** | 文件已删，内容并入 README「贡献指南」节 |
| 5 | `X-0053` A-6 余子项（test 脚本只跑 smoke.js）复跑 | **通过** | test = smoke ＋ assembly ＋ kit-categories，`npm test` EXIT=0 |
| 6 | 增量内容合规（v0.8.0 / v0.9.0 的资产与装配） | **通过** | 22 件新资产有校验链、装配清单 3/3 零警告、CHANGELOG 件数与实物一致 |
| 7 | 增量对下游破坏性 | **通过** | 零删除零改名（唯一 D = CONTRIBUTING.md）、schema 枚举未动、kit.categories 24→24 逐一相等、ports.json 未动 |
| 8 | 契约 §2.3 重投规则执法 | **不通过** | 「同 id 异内容且未改 version 拒绝入库」「覆盖需显式 --force」两条在 `tools/intake.js` 均无实现，且增量期间有 **8 次同版本重投被静默换代**的实证（缺陷 B-1） |
| 9 | CONVENTIONS 声明 vs 实际 | **通过** | 版本 / 分类 / 门禁三口径核得上（附 B-2 / B-3 轻微文档缺陷） |

**对象级结论：不通过** —— 机械判据全绿、上次项全销、增量内容合规，但第 8 行那一条中等缺陷构成不通过（与 `X-0053` 当年 A-2「描述宣称的约束没有执法」同族同量级）。修复面小：给 `intake.js` 补 version 比对 ＋ `--force`，或由大人裁定该规则改写并落 ADR。

---

## 二、机械判据（命令 ＋ 实际输出）

| # | 命令（cwd `F:/zxc/Project/gbe-assets`） | 实际输出 | 判读 |
|---|---|---|---|
| 1 | `node packages/schema/test/smoke.js` | `结果：49 通过 / 0 失败`，EXIT=0 | 与基线 49/0 一致 |
| 2 | `node packages/schema/test/assembly.js` | `装配校验冒烟：通过 30 · 失败 0`，EXIT=0 | 与基线 30/0 一致 |
| 3 | `node packages/schema/index.js kit kits/cn-ancient/kit.json` | `✓ 通过（0 条警告）`，EXIT=0 | 0 警告，符合预期 |
| 4 | `node tools/intake.js --dry-run` | `入库 0 件（新建 0 / 换代 0）· 拒收 0 件 · dry-run`，EXIT=0 | 与基线 0/0 一致 |
| 5 | `node scripts/version.js check` | `GBE 版本校验 · v0.9.0 … ✓ 全部通过：版本号、更新日志、镜像、变更记录一致`；`VERSION` = `0.9.0`；`git describe --tags --exact-match` = `v0.9.0` | 版本已从 v0.7.0 推进到 v0.9.0，tag 在 HEAD 上 |
| 6 | `ls .github/workflows/` ＋ `git ls-files .github/` | `ci.yml` 存在且被 git 跟踪（`X-0032` A-1 状态翻转） | 见下 |

CI 内容核对（`ci.yml` 共 6 步）：`npm test`（packages/schema 三套）→ 真源 kit 校验 → `check-doc-enums.js` → 装配清单 `assembly-check`（若存在）→ `intake --dry-run` → `version.js check`。与 `CONVENTIONS.md` §18.1 表的 5 行「✅ 已校验」一一对应；3 行「⏳ 未校验」如实标待补 —— **声明与实跑一致，无假承诺**。

---

## 三、缺陷清单

每条 = 判据（指回真源）＋ 可复现证据。编号 B-* 为本次自编，只在本报告内有效。

### B-1【中等】契约 §2.3 的重投规则无执法，增量期间 8 次同版本重投被静默换代

**判据**：`docs/CONVENTIONS.md` §2.3 表（:98-99）——「同 id 重投 视为新 version」「**同 id 异内容且未改 version → 拒绝入库**」「覆盖当前版需**显式 `--force`** 且写 intake diff」。

**证据一（规则未实现）**——`tools/intake.js:237-248`：目标目录已存在时**无条件**把旧目录 move 进 `_archive/` 再落新包，全程无 version 比对；`grep -n "force" tools/intake.js` → **0 命中**（连 `--force` 旗标都不存在）。

**证据二（实际发生了）**——`find _archive -maxdepth 1 -type d` → 两个 id 共 8 份归档，且归档件 `asset.json` 的 `version` 字段全部是 `1.0.0`（目录名的 `+N` 是 intake 撞名后缀，不是包内版本）：

```text
_archive/old-locust-a@1.0.0        version=1.0.0   lod0.glb md5 2a9962c2…
_archive/old-locust-a@1.0.0+2      version=1.0.0   md5 34e19e5d…
_archive/old-locust-a@1.0.0+3      version=1.0.0   md5 997b8ba3…
_archive/old-locust-a@1.0.0+4      version=1.0.0   md5 fe750da4…
_archive/old-locust-a@1.0.0+5      version=1.0.0   md5 65f74ae3…
_archive/old-locust-a@1.0.0+6      version=1.0.0   md5 b5a3e506…
kits/cn-ancient/nature/tree/old-locust-a（在库）version=1.0.0  md5 21aa21b2…
```

7 份哈希互不相同 ⇒ `old-locust-a` 以同一 version=1.0.0 交付 7 次（6 次重投换代），**没有一次触发「拒绝入库」**；`yingshan-single-a` 同理交付 3 次（2 次重投换代，其中 1 次重投与被换者内容相同）。合计 **8 次重投全部被接受**。`CHANGELOG.md` v0.9.0 只记最终「16 件（均 1.0.0）」，换代过程与 intake diff 无处可查。

**同族性**：这正是 `X-0053` A-2 的病根「描述宣称的约束没有执法」在新条款上的复现；`X-0056` 修的是分类并集，没覆盖 §2.3 这两条。

### B-2【轻微】CONVENTIONS 活文档 4 处指向不存在的 `asset.schema.json`

`ls catalog/schema/` 实有：`assembly.v2 / asset.v2 / collection / kit / ports / source.v2`（**无 `asset.schema.json`**）。活文档残留引用（`grep -rn "asset\.schema\.json" --include="*.md" docs/`）：

- `docs/CONVENTIONS.md:21`（§0.1 原则 1「分类枚举 → catalog/schema/asset.schema.json」）
- `docs/CONVENTIONS.md:22`（§0.1 原则 2「分类 ← asset.schema.json」）
- `docs/CONVENTIONS.md:318`（§9.1 socket type enum 真源指针）
- `docs/CONVENTIONS.md:542`（§19.1 granularity enum 真源指针）

真源实际都在 `asset.v2.schema.json`（node 复算证实 type 9 值 / granularity 4 值两个 enum 均在 v2 文件内）。`X-0053` A-2 只点名了 §4 那一处（已修），这 4 处是同族残留；`check-doc-enums.js` 只执法 §4 镜像，管不到指针死链。`docs/CONVENTIONS-REVIEW.md:131` 的 1 处属历史档，不算。

### B-3【轻微】CONVENTIONS 变更记录表缺 v1.6 行

头部（:10）已声明「当前版本：v1.6（2026-10-19）」，正文 §4 / §18.1 改动也在；但文尾变更记录表最后一行是 `2026-10-12 v1.5`，`grep -n "v1.6" docs/CONVENTIONS.md` → 仅命中第 10 行。该文件自己的惯例是每个版本一行记录（v1.1~v1.5 皆有），v1.6 断了。

### B-4【轻微】历史版本归档路径：文档口径与实现、实物两不符

文档口径：`CONVENTIONS.md` §2.3 与 `AGENTS.md` §6.1 都写历史版本归档到 **`_archive/<asset-id>/<version>/`**（两级）；`CONVENTIONS.md` §2.3 / `AGENTS.md` §6.1 另写 inbox 处理完进 **`_archive/inbox/<id>@<version>/`**。实际：`intake.js:239-243` 归档旧 kit 目录到 **`_archive/<名第三段>@<旧version>+N/`**（一级、@ 连接、用名不用全 id），且 `_archive/inbox/` **从未存在**（`find _archive -maxdepth 1 -type d` 仅两个 id 目录）。B-1 的 8 份归档实物全部长在未记载的形状上。

### B-5【轻微 · 存量】`.obsidian/` 4 个文件被 git 跟踪

`git ls-files .obsidian/` → `app.json / appearance.json / core-plugins.json / workspace.json`（共 18K，`git log --follow` 显示 ≤ v0.3.1 即在库，非增量引入）。文件内未检出本机绝对路径或凭证（`grep -rl "F:\\\\\|F:/"` → 0 命中）。判据援引 `CONVENTIONS.md` §15.3「禁止配置文件…进 Git」属可辩驳的字面解释（该条本意是 gbe.config / 凭证类，仓内未点名 `.obsidian`），是否清退（gitignore ＋ `git rm --cached`）请大人裁 —— 故列轻微并给去向，不升格。

### B-6【轻微】CI 装配步的休眠跳过分支以 exit 0 放行

`.github/workflows/ci.yml:38-48`：`assemblies/` 下无清单时打印「跳过（NOT a pass）」但**不退出非零**。当前 `assemblies/` 恒有 3 份清单（实跑 3/3 绿），该分支休眠；可一旦目录被清空/改名，该步会静默变绿 —— 与 `X-0056` 追加自己记录的判据 #3（「跳过必须以非零退出，否则是假绿」）同族。

---

## 四、上次未通过项复跑（X-0053 → X-0056 判全销，本次只复跑）

| 原编号 | 原判据 | 本次复跑（命令 → 输出） | 结论 |
|---|---|---|---|
| **A-1** | 全仓没有 CI，四份活文档把 CI 当既有门禁 | `ls .github/workflows/` → `ci.yml` 存在；`git diff v0.7.1..HEAD -- .github/` → 零改动（即与 `X-0056` 销号时的形态相同）；6 步与 §18.1 ✅ 行一致；本地等价步骤本次全实跑绿 | **维持已销**（GitHub 侧沿用 `X-0056` 追加的「首跑即绿」，本次未登 Actions 复核，见「本次未覆盖」） |
| **A-2** | 分类真源三处不一致，且无门禁 | `node scripts/check-doc-enums.js` → `镜像 28 类 · 真源 28 类（asset 26 ∪ assembly 2）✓ 逐字一致`；独立复算（node 重读三文件）：`asset.v2 = 26 / assembly.v2 = 2（assemblies/building, assemblies/district）/ kit.categories = 24，越界 = []，并集 = 28`；`cd packages/schema && npm test` → 末段 `kit-categories 结果：通过（10/10）`（含 `assemblies/castle` 必红反例） | **维持已销** —— 原问「现在几处、是否一致」：现为**两份真源 ＋ 一个子集 ＋ 一面镜像**共四处，全部一致，且有两道执法（`checkKitCategories` ＋ `check-doc-enums`）。残留：`X-0053` 只点名的 §4 死链已修，但同族死链还有 4 处（本次 B-2，不回退 A-2 销号） |
| **A-3** | CONTRIBUTING.md 与 README/AGENTS 重复、含假 CI 承诺 | `git ls-files CONTRIBUTING.md` → 空；`README.md:196` 有「贡献指南（`X-0053` A-3：原 CONTRIBUTING.md 合并至此）」节；全仓 `grep -rn CONTRIBUTING --include="*.md"` → 仅 CHANGELOG 变更记录与 README 合并说明 2 处 | **维持已销** |
| **A-6 余子项** | `package.json:test` 仍只跑 smoke.js（X-0053 §十二-4） | 根目录无 `package.json`（ls 报 No such file）；`packages/schema/package.json` → `"test": "node test/smoke.js && node test/assembly.js && node test/kit-categories.js"`；`npm test` EXIT=0（smoke 49/0 ＋ assembly 30/0 ＋ kit-categories 10/10）；CI 首步即 `npm test` | **维持已销** —— 装配与分类反向用例都有了 npm 入口 |

---

## 五、增量（2026-10-19 以来 3 笔提交，v0.7.0 → v0.9.0）

### 5.1 提交清单

```text
bd8da4b  fix(X-0053 A 系列): 补 CI / 分类并集执法 / 合并 CONTRIBUTING (v0.7.1)
d73fd8c  chore(release): v0.8.0        （2026-10-22 15:02）
5656dcf  chore(release): v0.9.0        （2026-10-22 20:02）
```

### 5.2 各版本改了什么（git show --stat ＋ CHANGELOG 对照）

**v0.7.1（bd8da4b）**：`X-0056` 的修复交付 —— 新增 `.github/workflows/ci.yml`（6 步）、`packages/schema/index.js` +42 行（`checkKitCategories()`）、`test/kit-categories.js`（10 反向用例）、`scripts/check-doc-enums.js`；`kit.schema.json` 仅描述行改动（不写 enum，防第三副本）；删除 `CONTRIBUTING.md`。已由 `X-0056` 逐条销号，本次复跑维持（§四）。

**v0.8.0（d73fd8c）**：入库 6 件民居灰模（`door-window` ×2、`pillar/yanzhu-round-a`、`roof/ridge-main-a`、`roof/yingshan-single-a`、`wall/shanqiang-a`，均 1.0.0）；新增装配清单 2 份（`yingshan-roof-test-a` 7 实例、`minju-hard-mountain-a` 24 实例，CHANGELOG 自述 `assembly-check` 0 警告）；`kit.json` 仅 coverage 计数刷新（roof 6→8、wall 2→3、pillar 1→2、door-window 0→2）；归档 2 份。**核实**：新增 kits asset.json 恰 6 件，与 CHANGELOG 一致；`coverage` 计数与 git 实物吻合。

**v0.9.0（5656dcf）**：入库 16 件村落皮肤与道具（terrain 3 / nature 6 / props 7，均 1.0.0）；`kit.json.materials` 新增 `plant` 组（3 名）；coverage 八类全部 `done = planned`；归档 6 份。**核实**：新增 kits asset.json 恰 16 件，与 CHANGELOG「16 件」一致。归档 6 份即 B-1 的实证物。

### 5.3 对下游有没有破坏性变化 → **没有**

```text
git diff --diff-filter=DR --name-status v0.7.0..HEAD
  → 仅 D  CONTRIBUTING.md（A-3 合并，非资产）
git diff --stat v0.7.0..HEAD -- catalog/ packages/schema/{index,validate,assembly}.js
  → 仅 kit.schema.json 描述行 ＋ index.js +42（均 v0.7.1 销号卡内容，枚举零改动）
kit.categories 逐一比对（node 读 v0.7.0 与 HEAD 两份 kit.json）：24 → 24，移除 [] 新增 []
```

dalu / guild 只读消费的 `catalog/schema/`、`catalog/ports.json` 未动；分类枚举未动；既有资产零删除零改名。v0.8/v0.9 全部是**纯增量**（新资产 ＋ 新装配清单 ＋ materials 新组）。装配清单 3/3 `assembly-check` 通过（0 警告），引用的构件 id 均在库且 published。

### 5.4 CONVENTIONS 声明 vs 实际

| 声明 | 实际 | 判读 |
|---|---|---|
| 版本（§头部 ＋ VERSION ＋ CHANGELOG ＋ tag） | `version.js check` 全绿，v0.9.0 三处一致 | ✓（但 B-3：变更记录表缺 v1.6 行） |
| 分类（§4 两份真源 ＋ 并集执法 ＋ 镜像） | check-doc-enums 绿 ＋ 独立复算一致 ＋ 10 反向用例 | ✓（但 B-2：4 处死链指针） |
| 门禁（§18.1 CI 覆盖边界表） | ci.yml 6 步与 ✅ 行一一对应，⏳ 3 行如实标待补 | ✓ 诚实，无假承诺（但 B-6：休眠跳过分支） |
| §2.3 重投规则 | intake 无 version 比对、无 --force，8 次实证换代 | ✗ → B-1（中等） |

---

## 六、遗留（逐条给去向）

| # | 事 | 去向 |
|---|---|---|
| 1 | **B-1**：intake 补「同 id 同 version 异内容拒收 ＋ 显式 `--force` ＋ intake diff 留痕」，或裁掉/改写 §2.3 该两条并落 ADR | gbe-assets 下一轮；涉契约条文改动走 ADR（`docs/DECISIONS.md` 只追加） |
| 2 | **B-4**：归档路径口径二选一 —— 改 `CONVENTIONS §2.3`／`AGENTS §6.1` 对齐实际形状，或改 `intake.js` 对齐文档 | gbe-assets 下一轮（建议改文档：实现与 8 份实物已成事实） |
| 3 | **B-2 / B-3 / B-6**：4 处死链指针、v1.6 变更记录行、CI 跳过分支改非零退出 | gbe-assets 文档与 CI 微修（可并入上两条的同一轮） |
| 4 | **B-5**：`.obsidian/` 4 文件是否清退 | 请大人裁（裁完 gitignore ＋ `git rm --cached`） |
| 5 | §0.1 其余镜像（预算 / 模数 / 材质）↔ 真源仍无校验 | `X-0056` 遗留 3 原样 → gbe-assets 下一轮（`check-doc-enums` 扩面） |
| 6 | §18 四份文档「同一提交内同步」仍无 diff 级判据 | `X-0056` 遗留 4 原样 → gbe-assets 下一轮 |
| 7 | GitHub Actions 当前是否仍绿 | 推送后看 Actions（`X-0056` 追加判据：本地绿 ≠ CI 绿） |

---

## 本次未覆盖

1. **glb 几何质量**：22 件新资产的网格内容只核了「有校验链 ＋ 文件哈希互异」，面数是否落预算、网格是否对齐 `snap_m` 未实测（本机无 Blender 校验链）；
2. **GitHub Actions 实跑状态**：未登 GitHub 复核 v0.8.0 / v0.9.0 两笔推送的 Actions 结果（`ci.yml` 自 v0.7.1 零改动 ＋ 本地等价全绿，仅是旁证）；
3. **dalu / guild 引用面的运行时验证**：只证明「被引用的真源未变」，未跑 guild 侧 `check-asset-ref.js` 等下游门禁（属其他对象）；
4. **`_archive/` 之外的历史件**：`kits/` 里 v0.7.0 之前入库的存量资产未逐件重验（沿用其入库时已过校验的前提）；
5. **gbe-studio 侧对 §2.3 出包规则的对应实现**（是否同样缺 version 比对）—— 属另一对象，未查。

---

## 执行环境（可选 · 仅供回溯）

- 工具：Windows 10.0.26300（Git Bash）· git 2.55.0.windows.5 · node v22.23.2
- 仓库：`git@github.com:sdzdrccc/gbe-assets.git`（本地 main = origin/main，工作区干净）
- 模型：GLM-5.3-Flash（ZCode 会话派出）
- 日期：2026-10-27
- 本节仅供回溯，不作质量判据、不参与排名
