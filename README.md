# qiuyuan-guild · 虬渊大陆协作规范中枢

> 「虬渊大陆」多 Agent 协作开发体系的**规范方**：定契约、立纪律、管审核流程与 skill 供给。

本仓库**不装游戏代码，也不装原型代码**——它只装**契约与纪律**。
原型在 `xiuxian-mmo`，UE5 正式工程在 `qiuyuan-dalu`。

## 第一设计原则 —— 世界真实性优先

> **尽量还原真实修真的世界，力求身临其境 —— 不是单纯为了做游戏而实现功能。**
>
> 效力**高于本仓其余全部约定**，也高于方案**全部章节**。详见 [`docs/DECISIONS.md`](docs/DECISIONS.md) **ADR-0009** 与方案 **§0.0**。

**开工前三问**（新系统 / 新玩法 / 新功能 · **缺一则任务卡不合格**）：

| # | 问题 | 不合格的判据 |
|---|---|---|
| **1 世界依据** | 这件事在世界观里**如何存在**？出处在哪一页？ | 答不出 → **先开上游任务卡，或砍掉**。不得凭「别的游戏都这么做」立项 |
| **2 感知路径** | 玩家怎么**感觉到**它？ | 只能通过**面板数字**感知 → 不合格 |
| **3 删除测试** | 删掉它，玩家失去的是**一段体验**还是一个**功能**？ | 答「一个功能」→ 它是**为做功能而做**的 |

**冲突裁定**：世界逻辑 **>** 玩法便利。但 **可玩性不可牺牲** —— 可牺牲的只有**便利性**（一键传送 / 自动寻路 / 数值直给 → 换成世界内的手段）。

> 「真实」**≠ 物理拟真**，而是 **内部一致 + 因果闭环 + 规则不迁就玩家**。
> **判据**：玩家感到「这是一个**会自己运转的世界**，我只是恰好在这里」，而不是「这是一台**为我服务的机器**」。

## 仓库内容

```
docs/
  MULTI-AGENT-DEV-PLAN.md   多 Agent 协作开发方案（总纲 · v0.27）
  AGENTS.md                 ★ 跨库 AI 硬纪律（给 AI 看的，优先级高于临时指令）
  CONVENTIONS.md            ★ 工程约定（铁律级，升版需 ADR · v0.6）
  REVIEW-PROCESS.md         ★ 审阅流程 —— 「审阅怎么审」的唯一真源（六步 / 判据来源 / 输出模板 / 五条纪律 · v1.2）
  DECISIONS.md              ★ ADR 台账 —— 「为什么这么定」的唯一真源
  ROADMAP.md                ★ 里程碑路线图 —— 84 项功能 → 17 个里程碑
  PROJECT-STRUCTURE.md      ★ 工程结构详案 —— UE 创建规格 / 目录全貌 / 手机端判据（M1 施工图 · v1.6）
  ENVIRONMENT.md            ★ 环境与工具链台账 —— **应用 / 锁定版本 / 实测现状的唯一真源**
  MOBILE-PLAN.md            ★ 手机端专案书 —— 方案 / 出包链路 / 归置表 / 启停判据
  SERVER-ARCH.md            ★ 服务端架构与拆分时机 —— 九类进程 / 起步 8 合 1 / 四条拆分前提 / 何时拆 / **`server/` 内部结构（技术模块切）**
  SKILL-ROUTING.md          角色 → skill 路由表
contracts/                  ★ 唯一真源（三方只读消费，禁止本地副本）
  data-contract.md            数据模型（**逻辑层**：实体 / 境界 / 灵根 / 属性 / 战斗公式 · v0.5）
  asset-ref-contract.md       资产引用契约（格式 / 交付基准 / 装配 / 场景清单）
  protocol-contract.md        协议契约（**客户端 ↔ 服务端 = WS + JSON**；**REST 属 GM 后台的那条线** —— §1 / §4 · v0.2）
records/                    ★ 完成记录（guild 侧编号 **`X-*`**；dalu 侧用 `T-*`）
  X-0001.md                    v0.14 契约去物理化（**补记**，依据 `e77661f`）
  X-0002.md                    v0.15 境界口径裁定 + 审核机制补完
  X-0003.md                    v0.16 ROADMAP 表格列位复位 + 门禁补 R8
  X-0004.md                    v0.17 第一设计原则（世界真实性优先）
  X-0005.md                    v0.18 UE 工程规格 + 手机端预留（ADR-0010）
  X-0006.md                    v0.19 手机端专案化：归置 + 出包 + iOS 硬约束（ADR-0011）
  X-0007.md                    v0.21 环境台账 + dalu 开工（ADR-0012 / 0013）
  X-0008.md                    v0.22 protoc 归位 M4（ADR-0014）
  X-0009.md                    v0.23 服务端架构专章化 + 补录 Go 裁决（ADR-0015）
  X-0010.md                    v0.24 server/ 结构定案：技术模块切（ADR-0016）
  X-0011.md                    v1.2 M1 工具链装机：Go 1.27.1 + Luban v5.1.0
  X-0012.md                    v0.25 UE 工程创建规格按 5.8 实测更正（ADR-0017）
  X-0013.md                    v1.9 路线 B 实测：**非向导等价物**（ADR-0017 §七）
  X-0014.md                    v0.26 M1 出身收敛「北桢 · 槐阴村」+ 账号协议口径勘误（ADR-0018）
  X-0015.md                    ★ M1 波次 1 审阅（缺陷 6 条 + 契约变更包 7 节 + 门禁 4 脚本 + 提案 8 条）
  X-0016.md                    ★ 审阅流程化 + 落 X-0015 §五 三条机制（REVIEW-PROCESS + skill `qiuyuan-review-pipeline`）
  X-0017.md                    审阅模板补「执行环境」节（REVIEW-PROCESS v1.1）
  X-0018.md                    ★ 审阅流程 v1.2 —— 补八条（复审销号 / 纪元所有权 / 独立复算 / 反事实复验 / 未覆盖声明 / 文档锚 / `--strict` / `C4` 误报源）+ 门禁 `C7`·`C8`·`D1`~`D4`
  X-0019.md                    ★ 落 ADR-0019（7 节契约变更包 + 连带勘误）+ **销号 `X-0018` 遗留 7 项**（存量 35 项：判据修正 4 + 留证豁免 31）+ 建 `gen-agent-log.js`
registry/                   ★ 跨库登记（第三条铁律的落点）—— **全部是视图，非真源**
  cross-repo-ledger.md         跨库需求 / 交付台账（**索引视图**）
  agent-log.md                 按 agent 的完成记录视图（**派生视图 · 由 `scripts/gen-agent-log.js` 生成，禁止手改**）
  schema-layers.md             三处 schema 层次登记（待建）
scripts/                    ★ 校验脚本（没有校验脚本的契约 = 装饰品）
  check-data.js               契约↔配置表内容 + 文档表格结构 + 原则锚点（R1~R10）
  check-contract-gate.js      契约完备性闸门（G1：ROADMAP 声明「新增展开」的实体须真有展开节）
  check-identifiers.js        跨文档标识符一致性（I1：引用的表名 / 键名须存在；退役名须标明）
  check-records.js            记录与台账齐备（C1~C8：必备节 / 双向核对 / 二值 / 分级 / 同批记录 / 契约回执 / 纪元自洽 / 未覆盖声明）
  check-doc-anchors.js        文档↔门禁锚定（D1~D4：脚本清单 / 规则 ID / skill 版本 三处同步）
  check-asset-ref.js          资产引用 + 跨层一致性（A1~A5）
  gen-agent-log.js            `agent-log` 视图**生成器**（默认只校验：与仓库内文件逐字节比对；`--write` 重生成）
  # ★ 每个脚本都带两条：--self-test（反向测试）与 PENDING_RULES（待实现规则登记位）
  # ★ `check-*.js` 清单由 `check-doc-anchors.js` 的 `D1` **双向核对**（三份真源：本节 / CONVENTIONS §7.1 / REVIEW-PROCESS §3）
```

> **契约不含物理映射**（表名 / 前缀 / 主键命名 / 存储引擎 / 分片键）—— 归下游 `qiuyuan-dalu` 自决。详见 `docs/DECISIONS.md` ADR-0001。
> **`registry/` 里全部是视图，不是真源** —— 索引视图的正文在 `records/`，视图可重生成。详见 `docs/CONVENTIONS.md` §5.6。

## 生态定位（6 库）

| 库 | 路径 | 角色 |
|---|---|---|
| 虬渊大陆 | `F:/zxc/db/虬渊大陆` | 设定真源（上游 · **只读**） |
| gbe-studio | `F:/zxc/Project/gbe-studio` | 资产生成端 · **现行**（上游 · **只读**） |
| gbe-assets | `F:/zxc/Project/gbe-assets` | 资产仓储端（上游 · **只读**） |
| **qiuyuan-guild** | `F:/zxc/Project/qiuyuan-guild` | **协作规范中枢（本仓库）· 契约真源** |
| Godot 原型 | `…/Documents/Codex/2026-08-04/a/outputs/xiuxian-mmo` | 已验证原型（**验证方** · 留在原地） |
| qiuyuan-dalu | `F:/zxc/Project/qiuyuan-dalu` | **UE5 正式工程**（交付方） |

> ~~tbg-3d / tbg-assets~~ 已弃用——仅支持 Godot，已被多引擎（godot / unity / unreal）的 GBE 取代。

## 核心文档

- [`docs/MULTI-AGENT-DEV-PLAN.md`](docs/MULTI-AGENT-DEV-PLAN.md) — 多 Agent 协作开发方案（**v0.27**）
- [`docs/AGENTS.md`](docs/AGENTS.md) — **动手前先读这份**
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — **裁决台账**（改契约前必读）
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — **里程碑路线图**（不知道下一步做什么就读它）
- [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) — **环境与工具链台账**（**要装工具 / 查版本 / 问缺什么就读它**）
- [`docs/PROJECT-STRUCTURE.md`](docs/PROJECT-STRUCTURE.md) — **工程结构详案**（**要建 UE 工程就读它**）
- [`docs/MOBILE-PLAN.md`](docs/MOBILE-PLAN.md) — **手机端专案书**（**手机端的东西放哪 / 怎么出安装包就读它**）
- [`docs/SERVER-ARCH.md`](docs/SERVER-ARCH.md) — **服务端架构与拆分时机**（**问「服务端现在几个进程 / 什么时候拆」就读它**）
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — 工程约定（**v0.5**）
- [`docs/REVIEW-PROCESS.md`](docs/REVIEW-PROCESS.md) — **审阅流程**（**要审阅某个波次 / 里程碑 / 跨仓交付就读它**）
- [`registry/cross-repo-ledger.md`](registry/cross-repo-ledger.md) — 跨库登记台账

## 三条铁律

1. **上游只读** —— 对虬渊大陆 / gbe-studio / gbe-assets 一律只读。缺口开任务卡，走各自流程（`qiuyuan-vault-iterate` / `gbe-procedural-pipeline`）。
2. **原型只回契约层** —— Godot 原型只做验证，结论先沉淀成契约，再由 UE5 侧依契约实现。**禁止原型直连正式工程。** 判据：若 dalu 侧干活需读原型任何文件，说明契约漏了东西。
3. **guild 只装无处可归的东西** —— 判据：**这件事的产生方是谁，产生方在哪它就归哪**（此处「产生方」= **发起方**，不是执行位置）。各库内部规范归各自；guild 只持跨库契约 / 跨库台账 / 术语 / 准入规范。

另有三项机制级纪律：**契约先于实现**（契约是唯一真源，代码与数据服从它）、**交付即产记录**（完成即产出结构化记录，**且记录须与改动同仓**）、**契约不含物理映射**（逻辑进契约，物理归下游）。
**v0.15 再加两条**：**审核判据一律二值**（只有 `通过 / 不通过`，**禁主观评分**；量化只用四个客观计数 —— ADR-0008）、**环境指纹不是评价**（记录可写「用了什么工具 / 模型」，但**不作质量判据、不进统计** —— ADR-0007）。
**v0.17 再立一条**（效力**高于以上全部**）：见上文 **第一设计原则**（ADR-0009）。

**真源优先级（v0.14 新增）**：`10-MMO化`（需求） **>** `contracts/`（契约） **>** 原型（参考实作）。

## 已定技术形态（2026-09-27 裁决）

| 项 | 结论 |
|---|---|
| 引擎路线 | **Godot 原型验证 → UE5 交付**。投入只往「迁移时零成本保留」的层放：数据 / 契约 / 资产源 |
| 服务端 | **Go**（重写）；原型 Java 侧降为验证器，只作协议与数据表来源 |
| 配置表 | 正式工程 **Luban**；原型继续开发用 **JSON**（契约定义**数据模型**，不定义文件格式） |
| 客户端 | `ue-client/`（**单工程多平台**）；UE 工程名 **`QiuyuanDalu`**；移动端是**构建配置**，不是新目录；工程外平台产出物归 **`platforms/mobile/`** |
| 资产线 | **只走 GBE 五层流水线**（gbe-studio → gbe-assets）；原型侧 `docs/17` 的 Tripo 链降为「Codex 侧一句话调用壳」 |

## 当前状态

**规划已冻结** → **M0 契约层地基已完成**（2026-09-27）→ **下一步 M1「建号」**。

| 里程碑 | 内容 | 状态 |
|---|---|---|
| **M0** | 契约层地基（规则 / 契约 / 校验脚本） | ✅ **已完成** |
| **M1** | **建号** —— 注册登录 → 建角（灵根 / 体质 / **固定出身：北桢 · 槐阴村**）→ 属性面板 | ⏭ **下一步** |
| M2 | 首战 —— 移动 / 伤害结算 / 死亡复活 | 未开始 |
| M3+ | 见 [`docs/ROADMAP.md`](docs/ROADMAP.md) | 未开始 |

> ✅ **M1 契约侧硬前置已解除（2026-09-28 · v0.15）**：**ADR-0004 / 0005 / 0006** 已全部裁定 —— 境内 **9 层（82 台阶）** / 属性**上限不落库** / `realm_id` **`1~9`**。契约升 **v0.3**，`Role` / `RealmLevelConfig` 的字段定义已落笔。
> 余下待裁项为**里程碑级**（M5 装备槽位 / M7 队伍人数），**不阻塞 M1**。
>
> 🔧 **M1 环境侧前置** → **真源已移至 [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md)**（v0.21 起，本文件不再复写版本号）：
>
> - ✅ **已就绪**：UE `5.8.1` ／ VS BuildTools `17.14.39` ／ **MSVC 合规**（判据是 `cl.exe` 的 **`ProductVersion` = `14.44.35228`**，**不是目录名** —— v0.20 撤回 v0.18/v0.19 的「须先升级」**误报**）／ Windows SDK `10.0.26100.0` ／ .NET 10 ／ **Go `1.27.1`** ／ **Luban `v5.1.0`** ／ MySQL `8.0.46` ／ Node 22 ／ Python 3.13 ／ Git `2.55` + LFS `3.7`；
> - ✅ `qiuyuan-dalu` **已 `git init` + LFS + 目录骨架 + 首次推送**（2026-09-28）；
> - ✅ **M1 环境侧阻塞已全部解除**（2026-09-28 装机）—— **Go 1.27.1**（`F:\zxc\go`）+ **Luban v5.1.0**（`F:\zxc\Luban`）已装且**端到端验证**（Luban 导表 → 生成的 Go 代码编译通过）。**环境侧无阻塞项**（[`ENVIRONMENT.md`](docs/ENVIRONMENT.md) §3 / §4.1）；
>   *（**protoc 不在其列** —— ADR-0014 归位 **M4**：它服务于内部跨进程 gRPC，而 M1 阶段八类 Go 进程合并为单进程，用不上。见台账 §4.2）*
> - ⚠️ **不阻塞 M1 的两项**：Redis 本机 `3.0.504`（过旧，M2+ 前升级）；移动端出包链路未就绪（Android 缺 SDK/NDK、iOS 须 Mac —— [`MOBILE-PLAN.md`](docs/MOBILE-PLAN.md) §2）。
>
> 创建规格见 **ADR-0010 + ADR-0017**（**v0.25 起按 UE 5.8 实测更正**）；手机端归置与出包见 **ADR-0011**；**环境台账与版本锁定见 ADR-0012 / 0013**；**工具链归位（protoc → M4）见 ADR-0014**。

**校验脚本本地跑法**：

```bash
node scripts/check-data.js             # 契约↔配置表内容 + 文档表格结构 + 原则锚点（R1~R10）
node scripts/check-contract-gate.js    # 契约完备性闸门（G1）
node scripts/check-identifiers.js      # 跨文档标识符一致性（I1）
node scripts/check-records.js          # 记录与台账齐备闸门（C1~C8）
node scripts/check-doc-anchors.js      # 文档↔门禁锚定（D1~D4）
node scripts/check-asset-ref.js        # 资产引用 + 跨层一致性（A1~A5）
node scripts/gen-agent-log.js          # `agent-log` 视图一致性（逐字节比对；`--write` 重生成）
# 任一脚本加 --self-test = ★ 反向测试（注入坏样本，断言必失败）
# 清单唯一真源 = docs/CONVENTIONS.md §7.1（本处为副本，由 D1 双向核对）
```

