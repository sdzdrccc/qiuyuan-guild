# PROJECT-REVIEW-ZCode-GLM-5.3-Flash-2026-10-27（gbe-studio 源材料审阅报告）

- 来源：ZCode · 大人在 ZCode 会话派出（项目群全量复审的分对象审阅，非 guild 侧执行者，不占 `X-` 号）
- Agent 名称 / 大模型：ZCode-gbe-studio-reviewer / GLM-5.3-Flash
- 审查时间：2026-10-27
- 审查对象：`gbe-studio` @ `13de06a`（tag `v0.9.1`，HEAD 提交时间 2026-10-24 18:43 +08:00；交叉引用的 `gbe-assets` 快照 @ `5656dcf`）
- 与前作的关系：**复审** —— 上次未通过项复跑（`X-0053` §三·3 S-1~S-6，`X-0056` 判已销）＋ 2026-10-19 以来的增量（7 笔提交，v0.6.6 → v0.9.1）。未变部分沿 `X-0053` / `X-0056` 结论加指针，不重抄。
- 判据入口（不自造）：被审仓 `AGENTS.md`（七条纪律 · §4 自检清单 · §6 文档地图）＋ `docs/PLAN.md`；流程按 `qiuyuan-guild/docs/REVIEW-PROCESS.md` §2 / §3 / §10.2。
- 审查范围：
  - **覆盖**：① 机械判据 9 项实跑（含上次未跑过的 procedural / schema-ref / ports 三套新增测试与 reconcile 三方对账）；② CI 配置回归核查（`X-0053` S-1 的缺陷面）；③ 上次未通过项 S-2 / S-3 / S-4 现状复跑；④ 2026-10-19 以来 7 笔提交逐笔（CHANGELOG ＋ diff 范围），判对输入输出契约（与 gbe-assets 的桥、资产投递通道）有无破坏性变化；⑤ `docs/PLAN.md` 状态声明 vs 实际（版本引用、端口表、目录/脚本清单）。
  - **没覆盖**：见文末「本次未覆盖」节。
- 硬约束确认：只读 ✓ 未改被审对象任何字节（审查后 `git status` 两仓均干净）✓ 未 commit / push / checkout ✓ 删除类只出清单 ✓ 唯一写入物为本报告 ✓

---

## 一、判定（二值 · 禁评分）

| # | 审查项 | 判定 | 依据（详见后节） |
|---|---|---|---|
| 1 | 机械判据 9 项实跑 | **通过** | 全绿；router 26/0 与上次一致，版本 v0.9.1 符合预期 |
| 2 | CI 路径越界回归验证 | **通过** | checkout 已在工作区内，无 `on.push.paths` 触发过滤，无回归 |
| 3 | 上次未通过项（S-1~S-6）复跑 | **通过** | 无回归；S-4 剩余面仅一处**有据保留**的字面量（详见 §四） |
| 4 | 增量 7 笔提交（v0.6.6→v0.9.1）契约面 | **通过** | `core/contracts/` 零改动；桥与投递通道无破坏性变化 |
| 5 | `docs/PLAN.md` 状态声明 vs 实际 | **通过** | 端口表与真源 11 条全一致；发现 2 条**轻微**文档漂移（D-1 / D-2），不计未通过项，去向见 §六 |

**对象总判定：通过（未通过项：无）。**

判定口径说明（供主 agent 复核时裁）：两条缺陷 D-1 / D-2 均为轻微文档漂移，不触及任何机械门禁与交付契约。按先例（`X-0053` 对 gbe-studio 的未通过项只计严重/中等 4 条，轻微的 S-5 / S-6 未进判定行），轻微项列缺陷清单＋给去向，不翻转判定。若主 agent 认为应从严，改判所需动作也只是 2 处文档同步。

## 二、机械判据（命令 ＋ 实际输出）

| # | 命令 | 实际输出 |
|---|---|---|
| 1 | `node core/policy/test/router.smoke.js` | `结果：26 通过 / 0 失败`（与上次一致） |
| 2 | `node bridges/sync-ports.js --check` | `✓ bridges/registry.json 与 gbe-assets/catalog/ports.json 一致` ＋ `✓ mcp.json / engines.json 的端口声明与 ports.json 真源交叉一致` |
| 3 | `node scripts/version.js check` | `GBE 版本校验 · v0.9.1` → `✓ 全部通过：版本号、更新日志、镜像、变更记录一致`（符合预期的 v0.9.1） |
| 4 | `node bridges/test/ports.smoke.js` | `结果：通过（6 / 6）`（含反向用例：「旧漂移（candidate 8080 属他仓）→ 必报」「真源无此号 → 必报」） |
| 5 | `node build/convergence/reconcile.js` | `✓ 全绿：50 类构件，三方逐类别吻合，路线标注与来源裁决一致。`（planned 加总 50 · 形制数 8 · 城邑栋数 28，与上次 50 类口径一致） |
| 6 | `node build/procedural/test/procedural.smoke.js` | `构件 40 件 · 通过自检 40 件` → `结果：通过（0 项失败）` |
| 7 | `node core/test/schema-ref.smoke.js` | `结果：通过（0 项失败）`（含 v1 包必拒的反例） |
| 8 | `npm test` | 4 套串联（router → procedural → schema-ref → ports）全绿，退出 0 |
| 9 | `node engines/base.js validate godot --impl yanhuifair-godot-mcp` | `映射状态：unmapped`，`语义动作覆盖：0/8`（诚实结果，与 AGENTS.md §4 声明的行为一致）；不带 `--impl` 跑 `validate unreal` → `✗ unreal: MCP 实现尚未选择（active=null）。可用候选：…` 并明确标注 `gbe-engine` 子命令仍是留位未实现 |
| 10 | `git tag --sort=-creatordate` ＋ `git rev-parse "v0.9.1^{}" HEAD` | v0.6.6 / v0.6.7 / v0.6.8 / v0.7.0 / v0.8.0 / v0.9.0 / v0.9.1 七个 tag 齐全；`v0.9.1^{}` = `13de06a` = HEAD；`VERSION` = `0.9.1` |

## 三、缺陷清单

### D-1【轻微】`docs/PLAN.md` 把共享约定钉在 CONVENTIONS v1.5，真源已是 v1.6

```text
命令：grep -n "v1\.5" docs/PLAN.md
输出：
  6:> **共享约定见 `gbe-assets/docs/CONVENTIONS.md`（v1.5，权威）**：…
  741:详见 `gbe-assets/docs/PLAN.md`。契约细节以 `gbe-assets/docs/CONVENTIONS.md`（v1.5）为准；…
命令：grep -m2 -n "v1\.[0-9]" ../gbe-assets/docs/CONVENTIONS.md
输出：
  10:> **当前版本：v1.6（2026-10-19）** — v1.5 + `X-0053` A-1/A-2：…
命令：git log -3 --format="%h %ad %s" --date=short -- docs/PLAN.md
输出：
  c40bf52 2026-10-19 fix(X-0053 S 系列): …（该笔只改了 8080→8090 行，未动版本指针）
  ee8adce 2026-10-12 chore(release): v0.6.2 —— 连带同步 gbe-assets ADR-0008 … CONVENTIONS v1.5 指针
```

时间线：v1.5 指针在 v0.6.2（2026-10-12）同步进来时是正确的；gbe-assets 侧 2026-10-19 升 v1.6（分类真源拆两份），同日 studio 的 v0.6.6 修了 PLAN 的端口行但没同步这处版本钉值。依 studio `AGENTS.md` §4「涉及契约变更 → gbe-assets 侧 schema、CONVENTIONS、两份 PLAN 同提交同步」，此为同步漏项。v1.6 的实质变更（分类真源拆分）与 studio 方案文本不冲突，故仅轻微。

### D-2【轻微】`docs/PLAN.md` §10 目录蓝图与实际漂移，且未指向 v0.9.0 新增的 `docs/REPO-LAYOUT.md`

```text
命令：ls SKILL.md ; ls build/validate.js ; ls bridges/ ; ls scripts/
输出：
  ls: cannot access 'SKILL.md': No such file or directory        （§10 首行列它）
  ls: cannot access 'build/validate.js': No such file or directory（§10 列它；装配校验实际在 build/procedural/assemble.js）
  bridges/：profiles · registry.json · router-server · sync-ports.js · test
    （§10 列的 install-mcp.js / health.js 不存在；实际有的 sync-ports.js §10 未列）
  scripts/：hooks · install-hooks.js · version.js
    （§10 注释写「install / verify / pack / classify / fix-scale」，与实际全部不符）
```

另：`qa/` 为空目录（`ls qa/` 无输出）——README（`README.md:23`）已诚实标注「本仓 `qa/` 仅留位，无实现」，不算缺陷；但 PLAN §10 把它画成已建成形态，且 §10 与 REPO-LAYOUT.md（v0.9.0 新增的目录规范）之间没有主从指针，属双真源风险。README 与 AGENTS.md §6.1 的落点表与实际一致，漂移仅限 PLAN §10。

## 四、上次未通过项复跑（`X-0053` S-1~S-6 · `X-0056` 判已销 → 只验证无回归）

| # | 原判据 | 本次复跑（命令 ＋ 输出） | 结论 |
|---|---|---|---|
| **S-1** | CI 第二个 checkout `path: ../gbe-assets` 越出 workspace ⇒ 三门禁全不跑 | `cat .github/workflows/ci.yml`：checkout 为 `path: gbe-assets`（工作区内），`GBE_ASSETS_REPO: ${{ github.workspace }}/gbe-assets` 挂在 **job 级** env（v0.6.8 修复，procedural / schema-ref 两套新测试也可见）；`git log -p --follow .github/workflows/ci.yml \| grep "paths:"` → **无命中**（从未有过 `on.push.paths` 触发过滤，触发面 = 本仓 push/PR 全量，不存在越界到他仓的触发） | ✅ 无回归（GitHub 线上实跑仍无法在本环境验证，同 `X-0056` 声明的限制 → 见「本次未覆盖」） |
| **S-2** | 端口副本 8080 未随真源改 8090 | `grep -n "8080" bridges/registry.json core/registry/mcp.json core/registry/engines.json ../gbe-assets/catalog/ports.json`：`mcp.json` **0 命中**；`engines.json:60` 仅注释文字（「8080 自 2026-10-18 起属 qiuyuan-game-ws」）；`registry.json:74` 与 `ports.json:77` 的 8080 = **`qiuyuan-game-ws` 条目本体**（dalu 游戏服务端，归属登记正确）；unity 预留位 = **8090**（真源 `unity-mcp: 8090`，副本一致）。`sync-ports.js --check` 绿 ＋ `ports.smoke.js` 6/6（含「8080 属他仓必报」反向用例与 `candidates_for_future` 扫描） | ✅ 无回归 |
| **S-3** | `engines/base.js validate` 恒 exit 1（`--impl` 不被解析） | `node engines/base.js validate godot --impl yanhuifair-godot-mcp` → 跑通，如实报 `0/8`（status:unmapped）；不带 `--impl` → 明确报错并列出 4 个候选，且提示里诚实标注 `gbe-engine` 子命令留位未实现 | ✅ 无回归 |
| **S-4** | 测试面窄：全仓 1 个测试文件；downgrade_chain 与 semantic_actions 写死期望值 | `npm test` → 4 套全绿 EXIT 0；`grep -n "fallback\|SEMANTIC" core/policy/test/router.smoke.js`：降级链断言为 `const expected = REG.fallback.chain.filter((id) => providerIds().includes(id))`（行 145，**从 fallback.json 派生**，非写死）；语义动作数 `8` 是**唯一故意保留的字面量**（行 237-240，注释明示「AGENTS.md 的契约数字，故意不从注册表派生」——有据保留，剩余面仅此一处，改动须先动 AGENTS.md，属文档锚而非缺陷） | ✅ 无回归；剩余面 = 契约字面量 `8`，**有据、非缺陷** |
| **S-5** | README 测试计数 25 vs 26；`qa/` 空但列横切三项 | `grep -n "以输出为准\|实现未做\|留位" README.md` → 行 21-23 横切三项按现状标注（CostLedger 实现未做 / QA Gate 由共享 `@gbe/schema` 承担、`qa/` 仅留位）；行 67「条数以输出为准，勿抄」 | ✅ 无回归 |
| **S-6** | 版本校验不核 README 与嵌套 `package.json` | `node scripts/version.js check` → 全部通过（该 check 含 README 禁硬编码版本号＋嵌套 package.json 对齐，v0.6.6/v0.6.7 两笔补齐，CHANGELOG 有反向复现记录）；顺带 `grep -n "v0\.[0-9]" README.md` → 仅行 140 示例代码块内出现版本号（属豁免类） | ✅ 无回归 |

## 五、增量（v0.6.5 → v0.9.1 · 7 笔提交 · 2026-10-19 → 2026-10-24）

```text
命令：git log --oneline --since=2026-10-19
输出：
  13de06a chore(release): v0.9.1
  fdb2f80 chore(release): v0.9.0
  fb285f4 chore(release): v0.8.0
  04e5c2c chore(release): v0.7.0
  27f9ffc fix(ci): GBE_ASSETS_REPO 提到 job 级 —— npm test 的两套新测试也要读 gbe-assets (v0.6.8)
  1546413 fix(ci): 嵌套 package.json 扫描跳过别的仓库 (v0.6.7)
  c40bf52 fix(X-0053 S 系列): CI 路径越界 / 端口副本 8080 / validate 不可达 / 补三套测试 (v0.6.6)
命令：git diff --stat v0.6.5..HEAD（尾部）
输出：52 files changed, 7932 insertions(+), 329 deletions(-)
```

逐版内容（CHANGELOG 条目与 diff stat 互相印证）：

| 版本 | 提交 | 改了什么 | 性质 |
|---|---|---|---|
| v0.6.6 | c40bf52 | `X-0053` S 系列修复：CI checkout 进工作区、四处 8080→8090、`validate --impl` 接通、测试 1 套→4 套、`sync-ports` 加归属校验＋扫 `candidates_for_future`、`version.js` 扩面、README 诚实化 | 自检/门禁面修复 |
| v0.6.7 | 1546413 | `version.js` 嵌套 package.json 扫描跳过带 `.git` 的他仓（CI 误红修复，含本地正反复现） | 自检工具修复 |
| v0.6.8 | 27f9ffc | `GBE_ASSETS_REPO` 提到 CI job 级（npm test 里两套新测试也要读 gbe-assets） | CI 修复 |
| v0.7.0 | 04e5c2c | 程序化构件：硬山屋面＋民居五件灰模（民居形制 18 类全部在库）、`assemble.js --recipe`、首栋完整民居 `minju-hard-mountain-a`（24 实例/8 构件/1324 面）、`BUILDING-DECOMPOSITION` 路线计数 24P/21A/5B | 仓内产线扩展 |
| v0.8.0 | fb285f4 | 村落皮肤与道具 16 件（0 credit）、`plant` 材质组、catalog 分组扩到 9 类、procedural.smoke 期望 24→40 | 仓内产线扩展 |
| v0.9.0 | fdb2f80 | LOD 三轨落地（P1 檐柱 384 tris / P2 屋面 29k 保边界 / P3 屋面 9k 重拓扑＋烘焙）、`docs/LOD-PIPELINE.md`、`docs/REPO-LAYOUT.md`、`pipeline/` 批次产线（提示词＋报告＋tools）、`.obsidian/workspace.json` 退出版本库、package-lock 入库 | 新工具＋文档＋仓库卫生 |
| v0.9.1 | 13de06a | PILOT 04–08 村落提示词与 4 份批次报告、文档同步 | 批次产线文档 |

**契约面结论（与 gbe-assets 的桥 · 资产投递通道）——无破坏性变化**，判据：

```text
命令：git diff v0.6.5..HEAD -- core/contracts/
输出：（空 —— 内部契约零改动）
命令：git diff --name-only v0.6.5..HEAD | grep -iE "contract|schema|catalog|kit.json|ports.json|registry.json|inbox|package.json"
输出：
  build/procedural/catalog.js        （读 gbe-assets 已入库实体生成预览 HTML，输出到 build/out/ —— gitignore 域）
  core/test/schema-ref.smoke.js      （测试）
  package.json                       （devDependencies ＋ 版本镜像，dependencies 仍为空 {}）
```

- **@gbe/schema 单源未动**：`core/schema-ref.js` 仍走三级解析（node_modules → `GBE_ASSETS_REPO` → `../gbe-assets`），无拷贝副本；schema-ref.smoke 用 gbe-assets 真实 asset.json 正反例全绿。
- **端口桥**：7 笔提交里端口值唯一的变化是 v0.6.6 把四处副本**向真源对齐**（8080→8090），真源（gbe-assets `ports.json`）11 条与 PLAN §7.3 逐条一致（9876/9877/6776/30010/8000/8091/55557/8090/8080/8788/8789）；`sync-ports.js` 只是校验工具加强（归属校验），未改任何端口语义。
- **投递通道**：`build/procedural/generate.js` 默认投递 `../gbe-assets/inbox/<asset.id>@<version>/`（`generate.js:15,372`，CONVENTIONS §2.3 既有约定）——本次未新增也未改通道；dalu 不直接消费 studio 产物（经 gbe-assets 中转），`qiuyuan-game-ws:8080` 的归属登记两侧一致。
- **版本纪律**：7 笔提交 7 个 tag 一一对应（v0.6.6…v0.9.1），VERSION / CHANGELOG / package.json 三镜像由 `version.js check` 兜底全绿 —— 符合 AGENTS.md §2.7「推送即发布」。

## 六、遗留（逐条给去向，不就地扩审）

| # | 事项 | 去向 |
|---|---|---|
| 1 | **D-1**：PLAN.md 行 6 / 741 的「CONVENTIONS（v1.5，权威）」钉值过时（真源 v1.6） | gbe-studio 侧修：两处指针同步 v1.6，或改为「版本号看该文件头部」的指针式引用免再漂移；同步纪律见 studio AGENTS.md §4（与 gbe-assets 同提交） |
| 2 | **D-2**：PLAN §10 蓝图与实际漂移（SKILL.md / build/validate.js / bridges/install-mcp.js / bridges/health.js / scripts 注释），且未指向 `docs/REPO-LAYOUT.md` | gbe-studio 侧修：§10 加「目录现状以 docs/REPO-LAYOUT.md 为准」主从指针，或按 REPO-LAYOUT 同步蓝图；避免两份目录文档并存 |
| 3 | GitHub Actions 线上实跑未验证（本机无 `gh` CLI：`gh run list` → `command not found`） | 主 agent 或大人在 GitHub 仓库页看 run 历史；本地侧三门禁已全绿（§二） |
| 4 | （观察，不立案）`engines/*/semantic_map.json` 仍全 unmapped 0/8 | 属 Phase 2/4 排期事实，注册表与 validate 输出均诚实标注，无需动作 |

## 本次未覆盖

- **GitHub Actions 线上实跑**：只有配置文本与本地三门禁验证（gh CLI 不可用）——同 `X-0056` 声明的限制。
- **引擎/MCP 真机链路**：Godot / UE / Blender 桥的连通性未实测（本机无对应编辑器环境）。
- **Providers 真实调用**：tripo / meshy / hunyuan3d / fal 四平台适配器未触网验证（涉及凭证与计费，只读审查不触网）。
- **pipeline/ 批次产物的像素级验收**：`PILOT-2026-10-2x.md` 批次报告与 GLB/贴图产物未逐份复跑复核（属批次质量，非本审对象判定面）。
- **三份新文档全文精读**：`BUILDING-DECOMPOSITION.md` / `LOD-PIPELINE.md` / `REPO-LAYOUT.md` 只核了与本审相关的落点与清单行，未做全文审阅。
- **`.mimocode/`、`.obsidian/` 编辑器状态目录内容**：未审（非工程产物）。

## 执行环境（可选 · 仅供回溯，不参与判定）

- OS：Windows 10.0.26300 x64 · Git Bash；Node v22.23.2；git 2.55.0.windows.5
- 模型：GLM-5.3-Flash；Agent：ZCode-gbe-studio-reviewer；日期：2026-10-27
- 审阅快照：gbe-studio `13de06a`（tag v0.9.1）；gbe-assets `5656dcf`（2026-10-22，交叉引用时点）
- 审查动作零污染确认：审查结束后 `git status --short` 于 gbe-studio 与 gbe-assets 均无输出
