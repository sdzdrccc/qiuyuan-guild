# SKILL-ROUTING.md —— 角色 → skill 路由表

> **作用**：规定**每个角色开工前必须加载哪些 skill**，以及 skill 从哪来、怎么准入。
> **状态**：v0.1 首版（Phase 0）· 路由已定，**安装待启动**。
> **依据**：方案 §7（供给与路由）+ §12（多源准入）+ §14 裁决 6 / 8。

---

## 0. 当前状态：**路由已定，尚未安装**

| 阶段 | 状态 |
|---|---|
| 规划冻结（§14 待决清空） | ✅ 2026-09-27 |
| **本路由表建立** | ✅ Phase 0 |
| **实际安装 skill** | ⏸ **未执行** —— 待 Phase 1 开工前由大人确认 |

> **为什么建表与安装分开**：裁决 6 是「**完全规划好项目再装**」。规划现已冻结，但**装什么应由路由表倒推**——先有清单再装，避免「装了才发现用不上 / 漏了关键的」。
> **本表就是那份清单。**

---

## 1. 三层供给

| 层 | 内容 | 来源 | 获取 |
|---|---|---|---|
| **L0 已有资产** | 大人已实战打磨过的 skill | `~/.workbuddy/skills/` | **直接可用，零成本** |
| **L1 通用能力** | 记忆、搜索、浏览器、沙箱、文档、安全扫描 | hub 市场 | 安装 + **安全审计** |
| **L2 领域能力** | UE5 / 战斗 / 场景 / 3D / 游戏资产 | **hub 为主 + 项目自建补缺** | 安装 + **安全审计** / 手写 |
| **L3 契约工具** | 校验脚本 | **项目自建** | 手写（Phase 0 已建 2 个） |

### 1.1 L0：大人已有的 skill（**直接用，不必重造**）

| skill | 用途 | 谁该载 |
|---|---|---|
| `qiuyuan-vault-iterate` | 虬渊大陆知识库迭代（含大量防坑规则） | **设定侧任何改动** |
| `gbe-procedural-pipeline` | GBE 程序化构件：生成投递包 / 入库 / 装配清单 / 形制收敛 | **资产侧任何改动** |
| `gbe-decision-and-registry` | GBE 双库 ADR + 三张注册表 + 端口登记 + 发版 | `arch` |
| `git-version-gate` | 版本号 + 更新日志 + 附注 tag + 推送前强制校验 | `ledger` |
| `qiuyuan-guild-plan-iterate` | 本方案自身的迭代流程 | `arch`（改动本方案时） |
| `grill-me` | 对方案/设计做穷尽式质询，逼到共识 | `arch`（重大设计评审） |
| `git-proxy-push-retry` | 本环境 git 推送受限时的绕行 | `ledger`（按需） |

> **这七个是资产，不是待办。** 它们经过真实项目打磨，**优先于 hub 上的同类**。

---

## 2. 路由表（**正式工程 · UE5 + Go**）

> 角色定义见方案 §2（4 个纵向 owner + 横向职能）。

### 2.1 纵向 owner

| 角色 | 必载 skill | 来源 | 状态 |
|---|---|---|---|
| **`world`** | `luban-table-gen`（配置表生成 + 契约校验） | **自建** | ⏳ Phase 1 落 |
| | `gbe-decision-and-registry` | L0 | ✅ 已有 |
| **`combat`** | UE5 战斗 / GAS 类 —— **待检索 hub** | hub | ⏳ 待检 |
| | `luban-table-gen`（读数值配置） | 自建 | ⏳ Phase 1 |
| **`scene`** | UE5 场景 / 关卡类 —— **待检索 hub** | hub | ⏳ 待检 |
| | `gbe-procedural-pipeline`（资产消费与装配） | L0 | ✅ 已有 |
| **`ui`** | UE5 UI 类 —— **待检索 hub** | hub | ⏳ 待检 |
| | `Game Cog`（全栈游戏资产，可复用） | hub | ⏳ 待装 |

### 2.2 横向职能

| 角色 | 必载 skill | 来源 | 状态 |
|---|---|---|---|
| **`arch`** | `gbe-decision-and-registry` + `qiuyuan-guild-plan-iterate` | L0 | ✅ 已有 |
| | `grill-me`（重大设计评审时） | L0 | ✅ 已有 |
| **`qa`** | 质量 / 测试类 —— **待检索 hub** | hub | ⏳ 待检 |
| | `Godot Project Checklist`（思路可借鉴，非直接可用） | hub | ⏳ 待检 |
| **`ledger`** | `git-version-gate` | L0 | ✅ 已有 |
| **`review`** | `Self-Improving Agent`（结构化错误/修正日志） | hub | ⏳ 待装 |
| | `ontology`（结构化知识图谱，可验证记忆） | hub | ⏳ 待装 |

### 2.3 跨库职能（**只读上游，走各自流程**）

| 场景 | 必载 skill | 来源 |
|---|---|---|
| 发现世界观缺口 → 需改 `虬渊大陆` | `qiuyuan-vault-iterate` | L0 |
| 需新资产 → 需改 `gbe-*` | `gbe-procedural-pipeline` | L0 |

> **判据**：凡要动上游，**先载对应 skill**，而不是「在本仓想办法绕过去」（铁律一）。

### 2.4 全体必载

| skill | 用途 | 来源 |
|---|---|---|
| 安全扫描（`SkillScan` 或 Cisco Skill Scanner / Snyk Agent Scan） | **每次装 skill 前过一遍** | hub / 外部 |

---

## 3. 路由表（Godot 原型侧 · 继续开发时）

> 原型是**验证器**，不占正式路由。若继续推进原型，另挂这套。

| 角色 | skill | 等级/推荐 | 链接 |
|---|---|---|---|
| scene / 全体 | `Godot Dev Guide` | A / 10% | `/skills/27999` |
| 联调 | `Godot MCP Integration` | B / 0% | `/skills/47393` |
| 脚手架 | `Godot Game Claw Bridge` | B / 10% | `/skills/38910` |
| 若走 C# | `Godot 4.6 C# Development` | — | `/skills/66799` |
| 特效材质 | `Godot Shader Development` | — | `/skills/65377` |

> ⚠️ **原型语言是 C#**（Godot 4.7.1 .NET），**不是 GDScript** —— 选 skill 时注意。

---

## 4. hub 候选池（**按角色归档**）

> 来源：`https://hub.cocoloop.cn/search?keyword=<词>`，采集 2026-09-27。
> ⚠️ **等级 B 或推荐度 0% 的，装前必须审计。**

### 4.1 通用能力（L1）

| skill | 等级 / 推荐 | 用途 | 链接 |
|---|---|---|---|
| `SkillScan` | A / — | **skill 安全准入网关** | `/skills/7590` |
| `Self-Improving Agent` | A / — | 结构化错误 / 修正 / 最佳实践日志 | `/skills/12277` |
| `ontology` | S / — | 结构化知识图谱，可验证记忆 | `/skills/7585` |
| `agent-overflow` | A / — | Agent 集体记忆与协作网络 | `/skills/1430` |

### 4.2 游戏与内容（L2）

| skill | 等级 / 推荐 | 用途 | 链接 |
|---|---|---|---|
| **`3d-cog`** | **S / 100%** | 批量产出生产级 GLB（**828 条评价**） | `/skills/1327` |
| **`story-cog`** | **S / 100%** | 世界观构建与结构化叙事 | `/skills/347` |
| **`primitives-dsl`** | **S / 100%** | 跨平台游戏架构原语 | `/skills/6602` |
| `Game Cog` | S+ / 40% | 全栈游戏资产（UI / 精灵图 / 音乐 / GDD） | `/skills/12076` |
| `Audio Cog` | A / 40% | TTS、声音克隆、音乐与音效 | `/skills/9156` |
| `Game Development` | A / 0% | 性能预算、持续测试循环 | `/skills/31300` |
| `Godot Project Checklist` | — | 项目验收清单（思路可借鉴） | `/skills/126076` |

### 4.3 UE5 迁移期预留（**现在不装，记号**）

| skill | 等级 / 推荐 | 链接 |
|---|---|---|
| `openclaw-unreal-skill` | **S / 100%** | `/skills/6959` |
| `Unity`（避坑指南，供参考） | S / 30% | `/skills/19425` |

---

## 5. 待办：需重新检索 hub（UE5 类）

裁决 3 已定正式工程用 **UE5**，但**当前候选池采集时面向 Godot 原型侧**。以下三个角色的 skill **必须重新检索**：

| 角色 | 检索词（建议） | 状态 |
|---|---|---|
| `combat` | `unreal` / `UE5` / `GAS` / `gameplay ability` | ⏳ 未检索 |
| `scene` | `unreal scene` / `level design` / `landscape` | ⏳ 未检索 |
| `ui` | `unreal ui` / `UMG` | ⏳ 未检索 |
| `qa` | `test` / `game test` / `automation` | ⏳ 未检索 |

> **检索纪律（硬性）**：**必须用 hub 站内搜索**（`https://hub.cocoloop.cn/search?keyword=<词>`），
> **不得**用 `site:` 外网检索或首页热门榜代替 —— 两者都不成立。
> **结论性判断必须附检索记录留证**（实际 URL + 结果）。
>
> **教训来源**：曾用 `site:hub.cocoloop.cn` 断言「hub 无游戏开发类 skill」并写入方案正文，实际站内检索为 Godot 8 个 / Blender 12 个 / 3D 生成 7 个 —— **错误且已留痕**。

---

## 6. skill 准入四步（**任何来源一律照办**）

> skill 是**可执行的指令 + 脚本**，能碰文件系统与密钥 —— **它不是文档，它是依赖**。

```
① 隔离   → 先在干净目录落地，不直接进正式环境
② 审计   → 读 SKILL.md 与全部附带文件（scripts/ references/ assets/）
③ vendor → 复制进仓库，改外部路径为仓内相对路径
④ 启用   → 通过后进路由表
```

### 6.1 为什么必须 vendor 进仓库

**不引外部路径。** 上游一删就**断供**，云电脑也拉不到。
`git` 是唯一真源（§11.3 纪律 2）——**skill 也不例外**。

### 6.2 审计分级

| 级别 | 处置 |
|---|---|
| **P0** | **不装** —— 强烈警告，建议放弃 |
| **P1** | **须明确确认**后才装 |
| **P2** | 可装 |

### 6.3 为什么这么严

**Snyk 2026-02 审计（抽样 3984 个 skill）**：

> **36% 至少有一个安全缺陷，13.4% 存在严重问题，76 个已确认恶意** —— 凭证窃取、后门、数据外泄。

**多渠道不是「多几个地方下载」，是供应链问题。** 渠道越开放，准入关口越要单一且严。

---

## 7. skill 缺口申报（**找不到怎么办**）

**不许硬开工，也不许静默降级。** 必须走显式申报：

```markdown
## skill 缺口申报
- 角色：scene
- 需要能力：<具体能力>
- 检索记录：<站内搜索 URL + 实际结果>（**必填，无记录则申报无效**）
- 处置：以通用能力完成，标记 `degraded: true`
- 转办：新建任务 <X-xxxx>（<拟建 skill 名>）
```

**好处**：缺口会**自动浮出来**，长成一份不断增长的「待建 skill 清单」。跑一段时间，L2 层自然补齐。

---

## 8. 变更记录

| 日期 | 变更 |
|---|---|
| 2026-09-27 | 首版建立（Phase 0）。路由已定；**UE5 类 skill 待检索**；**安装待 Phase 1 启动前确认**。 |
