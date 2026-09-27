# qiuyuan-guild · 虬渊大陆协作规范中枢

> 「虬渊大陆」多 Agent 协作开发体系的**规范方**：定契约、立纪律、管审核流程与 skill 供给。

本仓库**不装游戏代码，也不装原型代码**——它只装**契约与纪律**。
原型在 `xiuxian-mmo`，UE5 正式工程在 `qiuyuan-dalu`。

## 仓库内容（Phase 0 已落盘）

```
docs/
  MULTI-AGENT-DEV-PLAN.md   多 Agent 协作开发方案（总纲）
  AGENTS.md                 ★ 跨库 AI 硬纪律（给 AI 看的，优先级高于临时指令）
  CONVENTIONS.md            ★ 工程约定（铁律级，升版需 ADR）
  SKILL-ROUTING.md          角色 → skill 路由表
contracts/                  ★ 唯一真源（三方只读消费，禁止本地副本）
  data-contract.md            世界数据模型（21 表 / 境界 / 灵根 / 属性 / 战斗公式）
  asset-ref-contract.md       资产引用契约（格式 / 交付基准 / 装配 / 场景清单）
  protocol-contract.md        协议契约（WS + REST，Go 重写的接口基线）
scripts/                    ★ 校验脚本（没有校验脚本的契约 = 装饰品）
  check-data.js               契约一致性（6 规则）
  check-asset-ref.js          资产引用 + 跨层一致性（5 规则）
```

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

- [`docs/MULTI-AGENT-DEV-PLAN.md`](docs/MULTI-AGENT-DEV-PLAN.md) — 多 Agent 协作开发方案（**v0.13 · Phase 0 已完成**）
- [`docs/AGENTS.md`](docs/AGENTS.md) — **动手前先读这份**
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — 工程约定

## 三条铁律

1. **上游只读** —— 对虬渊大陆 / gbe-studio / gbe-assets 一律只读。缺口开任务卡，走各自流程（`qiuyuan-vault-iterate` / `gbe-procedural-pipeline`）。
2. **原型只回契约层** —— Godot 原型只做验证，结论先沉淀成契约，再由 UE5 侧依契约实现。**禁止原型直连正式工程。** 判据：若 dalu 侧干活需读原型任何文件，说明契约漏了东西。
3. **guild 只装无处可归的东西** —— 判据：**这件事的产生方是谁，产生方在哪它就归哪**（此处「产生方」= **发起方**，不是执行位置）。各库内部规范归各自；guild 只持跨库契约 / 跨库台账 / 术语 / 准入规范。

另有两项机制级纪律：**契约先于实现**（契约是唯一真源，代码与数据服从它）、**交付即产记录**（完成即产出结构化记录，**且记录须与改动同仓**）。

## 已定技术形态（2026-09-27 裁决）

| 项 | 结论 |
|---|---|
| 引擎路线 | **Godot 原型验证 → UE5 交付**。投入只往「迁移时零成本保留」的层放：数据 / 契约 / 资产源 |
| 服务端 | **Go**（重写）；原型 Java 侧降为验证器，只作协议与数据表来源 |
| 配置表 | 正式工程 **Luban**；原型继续开发用 **JSON**（契约定义**数据模型**，不定义文件格式） |
| 客户端 | `ue-client/`；UE 工程名 **`QiuyuanDalu`**；移动端是**构建配置**，不是新目录 |
| 资产线 | **只走 GBE 五层流水线**（gbe-studio → gbe-assets）；原型侧 `docs/17` 的 Tripo 链降为「Codex 侧一句话调用壳」 |

## 当前状态

**规划已冻结**（判据：`§14 待决清空`）→ **Phase 0 已完成**（2026-09-27）。

| 阶段 | 状态 |
|---|---|
| Phase 0 · 契约层地基（guild） | ✅ **已完成** |
| Phase 1 · 原型盘点 → 契约提炼 | ⏭ 下一步 |
| Phase 2 · 双端骨架 + 首个契约落地 | 未开始 |

**校验脚本本地跑法**：

```bash
node scripts/check-data.js        # 数据契约一致性
node scripts/check-asset-ref.js   # 资产引用 + 跨层一致性
```

