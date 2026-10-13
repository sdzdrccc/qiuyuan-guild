# schema-layers —— 三处 schema 层次登记（索引）

> **性质**：**索引**，不是 schema 副本 —— 每层一行：位置 / 版本真源 / 负责方 / 变更纪律。
> ★ **本表不抄版本号** —— 手抄必腐（README 的 7 份版本号实测腐了 4 份，X-0032 G-7）；
>   版本**只指真源位置**，当前值去那些文件里看。
>
> ★ 本文件 2026-10-13 由 **X-0041** 补建 —— 此前 `CONVENTIONS.md` §3 与 `AGENTS.md` §1
> 已把它当现存文件引用（「跨层变更须在此登记」），而它一直不存在（X-0032 G-8 的「没有锚的接口」）。

## 一、三层总表

| 层 | 位置 | 内容 | 版本真源（去那里看当前值） | 负责方 | 变更纪律 |
|---|---|---|---|---|---|
| **L1 管线内部** | `gbe-studio/core/contracts/` | 生成管线内部结构（6 个 schema：decomposition-plan / engine-import-plan / generation-artifact / generation-job / ledger-entry / refine-recipe） | `gbe-studio/VERSION`（随流水线版本走） | **gbe-studio** | 本仓家事，**不外溢** |
| **L2 资产包交付** | `gbe-assets/packages/schema/` | 资产**交付包**契约（asset / source / assembly / kit / collection / ports） | `packages/schema/package.json` 的 `version`（★ 与 `schema_version === "2"` 闸门是两码事，后者见 ADR-0001） | **gbe-assets** | **改需 ADR** |
| **L3 游戏侧** | `qiuyuan-guild/contracts/`（**本仓**） | **游戏消费面**：数据模型 / 资产引用 / 协议 / 资源清单 | 各契约**文件头部**的「状态」行 | **guild**（`arch`） | **改需 ADR** |

## 二、两条铁律（`CONVENTIONS.md` §3 原文口径）

1. **不跨层引用。** L3 **不直接引用 L1** 的 schema —— L3 只认 L2（资产包交付面）。L1 怎么变是 gbe-studio 的家事，不外溢。
2. **跨层变更必须显式。** 某层改动若影响下层（例：L2 字段改名 → 影响 L3 资产引用契约），**须开跨库台账条目**（`registry/cross-repo-ledger.md` 一行 + `reviews/X-*.md` 正文）**＋ 在本文件第三节对应行登记**。

## 三、跨层可见变更（追加式 · 新的加在顶部）

| 日期 | 层 | 变更 | 记录 |
|---|---|---|---|
| 2026-10-13 | L2 | 新增 `ports.schema.json`（端口真源入 schema）；`catalog.config.json` 的重复端口登记已删；assembly 语义校验补 `params.instance_count === instances.length` | gbe-assets 发布批次（X-0041） |

> ★ 本表**只记跨层可见的变更**；层内的日常修订（不影响下层的）不进表 —— 否则它就成了第二个 CHANGELOG。
> ★ 「影响下层」的判定拿不准时，**先登记再观察**（登记过剩的成本是一条行，漏登的成本是静默不一致）。
