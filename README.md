# qiuyuan-guild · 虬渊大陆协作规范中枢

> 「虬渊大陆」多 Agent 协作开发体系的**规范方**：定契约、立纪律、管审核流程与 skill 供给。

本仓库**不装游戏代码，也不装原型代码**——它只装契约与纪律。
原型在 `xiuxian-mmo`，UE5 正式工程在 `qiuyuan-dalu`。

## 生态定位（6 库）

| 库 | 路径 | 角色 |
|---|---|---|
| 虬渊大陆 | `F:/zxc/db/虬渊大陆` | 设定真源（上游 · **只读**） |
| gbe-studio | `F:/zxc/Project/gbe-studio` | 资产生成端（上游 · **只读**） |
| gbe-assets | `F:/zxc/Project/gbe-assets` | 资产仓储端（上游 · **只读**） |
| **qiuyuan-guild** | `F:/zxc/Project/qiuyuan-guild` | **协作规范中枢（本仓库）· 契约真源** |
| Godot 原型 | `…/Documents/Codex/2026-08-04/a/outputs/xiuxian-mmo` | 已验证原型（**验证方** · 留在原地） |
| qiuyuan-dalu | `F:/zxc/Project/qiuyuan-dalu` | **UE5 正式工程**（交付方） |

## 核心文档

- [`docs/MULTI-AGENT-DEV-PLAN.md`](docs/MULTI-AGENT-DEV-PLAN.md) — 多 Agent 协作开发方案（v0.7）

## 铁律

1. **上游只读**：对虬渊大陆 / gbe-studio / gbe-assets 一律只读。缺口开任务卡，走各自流程（`qiuyuan-vault-iterate` / `gbe-procedural-pipeline`）。
2. **原型只回契约层**：Godot 原型只做验证，结论先沉淀成契约，再由 UE5 侧依契约实现。**禁止原型直连正式工程。**
3. **契约先于实现**：先写契约，后写代码与资产；契约是唯一真源。
4. **交付即产记录**：完成即产出结构化记录，不事后补日志。

## 引擎路线

**先 Godot 原型、后转 UE5**——已落定物理形态。
由此推出核心纪律：**投入只往「迁移时零成本保留」的层放**——数据、契约、资产源；引擎特性一律浅投（见方案 §8）。

## 资产线

资产**只走 GBE 五层流水线**（gbe-studio → gbe-assets）。原型侧 `docs/17` 的 Tripo 链降级为「Codex 侧一句话调用壳」，底层能力调 GBE。
