# qiuyuan-guild · 虬渊大陆协作规范中枢

> 「虬渊大陆」多 Agent 协作开发体系的**规范方**：定契约、立纪律、管审核流程与 skill 供给。

本仓库**不装游戏代码，也不装原型代码**——它只装契约与纪律。
原型在 `xiuxian-mmo`，UE5 正式工程在 `qiuyuan-dalu`。

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

- [`docs/MULTI-AGENT-DEV-PLAN.md`](docs/MULTI-AGENT-DEV-PLAN.md) — 多 Agent 协作开发方案（**v0.11 · 规划已冻结**）

## 三条铁律

1. **上游只读** —— 对虬渊大陆 / gbe-studio / gbe-assets 一律只读。缺口开任务卡，走各自流程（`qiuyuan-vault-iterate` / `gbe-procedural-pipeline`）。
2. **原型只回契约层** —— Godot 原型只做验证，结论先沉淀成契约，再由 UE5 侧依契约实现。**禁止原型直连正式工程。**
3. **guild 只装无处可归的东西** —— 判据：**这件事的产生方是谁，产生方在哪它就归哪**。各库内部规范归各自；guild 只持跨库契约 / 跨库台账 / 术语 / 准入规范。

另有两项机制级纪律：**契约先于实现**（契约是唯一真源，代码与数据服从它）、**交付即产记录**（完成即产出结构化记录，不事后补日志）。

## 已定技术形态（2026-09-27 裁决）

| 项 | 结论 |
|---|---|
| 引擎路线 | **Godot 原型验证 → UE5 交付**。投入只往「迁移时零成本保留」的层放：数据 / 契约 / 资产源 |
| 服务端 | **Go**（重写）；原型 Java 侧降为验证器，只作协议与数据表来源 |
| 配置表 | 正式工程 **Luban**；原型继续开发用 **JSON**（契约定义**数据模型**，不定义文件格式） |
| 客户端 | `ue-client/`；UE 工程名 **`QiuyuanDalu`**；移动端是**构建配置**，不是新目录 |
| 资产线 | **只走 GBE 五层流水线**（gbe-studio → gbe-assets）；原型侧 `docs/17` 的 Tripo 链降为「Codex 侧一句话调用壳」 |

## 当前状态

**规划已冻结**（判据：`§14 待决清空`）。

冻结期内不建目录、不装 skill、不写契约、不写一行代码——**等发令开工**（方案 §9 Phase 0）。
