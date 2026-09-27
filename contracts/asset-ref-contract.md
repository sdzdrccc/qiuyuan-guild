# 资产引用契约（Asset Reference Contract）

> **层**：L3 游戏侧（本仓 `contracts/`）　|　**状态**：v0.1 首版（Phase 0）
> **真源**：本文件负责**「游戏侧怎么引用资产」**。
> **它定义引用，不定义资产本体。** 资产本体的契约在 **L2**：`gbe-assets/packages/schema/`（`@gbe/schema`）+ `catalog/schema/*.json`。

---

## 0. 边界：本契约**不**重造校验（硬性）

方案 §4.4 三条层次规则中的第 1 条 —— **不跨层引用**。资产引用层面的落实：

| 是谁的事 | 归谁管 | 本契约的态度 |
|---|---|---|
| 资产**本体**是否合法（字段、几何、材质、许可） | **L2** `@gbe/schema.validateAsset()` | **不重实现**，调用即可 |
| 资产**包**能否投递（交付包完整性） | **L2** `@gbe/schema.checkPackage()` | **不重实现** |
| **装配**是否成立（8 条判据） | **L2** `@gbe/schema`（`assembly.js`） | **不重实现** |
| **游戏侧怎么引用**（引用格式、清单、加载约定） | **L3**（本文件） | ✅ 本契约独有 |

> **判据**：若本契约里出现「校验资产本体是否合法」的内容，就是**跨层重复实现** —— 立刻删掉，改为调用 `@gbe/schema`。
>
> **理由**：GBE 侧已明确「语法校验只有这一份实现」（`packages/schema/index.js` 头注）、且刻意不用 ajv（离线可用 + 无供应链面）。**L3 再造第二套，就是那种「同名不同义」的分叉。**

---

## 1. 引用格式

### 1.1 资产引用（Asset Ref）

```
<kit>.<category-leaf>.<name>@<version>
```

| 段 | 规则 | 例 |
|---|---|---|
| `kit` | 套件 ID | `cn-ancient` |
| `category-leaf` | 分类**叶名**（非全路径） | `roof` |
| `name` | 资产名，**全小写 kebab-case** | `xuanshan-roof-01` |
| `version` | 语义化版本，**首次入库 `1.0.0`** | `1.0.0` |

**完整示例**：`cn-ancient.roof.xuanshan-roof-01@1.0.0`

> **`id` 的权威定义在 L2**：`asset.v2.schema.json` 规定 `<kit>.<category-leaf>.<name>`，且 **`name` 段必须严格等于资产目录名**。
> 本契约**引用**该规则（含 `@version` 的完整形式），**不重定义**。

### 1.2 为什么必须带 `version`

**不带版本 = 引用会漂移。** 上游重生成同一资产（如重跑 Tripo）后，游戏侧静默拿到不同几何，是**最难查的一类 bug**。

- 引用**必须**带 `@version`（唯一例外：`resource-manifest.yaml` 中标注为 `@latest` 的**临时勘察项**，且**禁止进入发布版本**）。
- 资产 `status=deprecated` 时，引用方**必须换版本**（`deprecated_by` 给出替代）。

---

## 2. 交付基准（**权威 · 不得各自转换**）

> 来源：`gbe-studio/AGENTS.md` §2.5。**这是 GBE 与游戏侧之间唯一的空间约定。**

| 项 | 值 |
|---|---|
| **up 轴** | **`+Y up`** |
| **朝向** | **`-Z forward`** |
| **单位** | **米（m）** |

**集成层只做三件事**：① 单位缩放 ② 水平朝向 ③ 材质重映射。

> ### ⚠️ **`up` 轴的 `Y→Z` 转换由「引擎导入器」负责。**
>
> **游戏侧（UE5 / Godot）不得在业务代码里做轴转换。**
> 违反此条的典型症状：**模型躺着** —— 而**只有截图能发现**（`gbe-studio/AGENTS.md` §2.5 明写）。

**这条为什么在 L3 而非 L2**：L2 定的是「交付时是什么姿态」，L3 定的是「消费时谁负责转」。
**分界点 = 引擎导入器** —— 它是唯一允许做轴转换的位置。

---

## 3. 分类与层级（引用 L2 枚举，**不重定义**）

### 3.1 `category`（26 项，L2 权威）

| 组 | 取值 |
|---|---|
| `components/*` | roof · wall · pillar · beam · bracket · base · door-window · railing · ornament |
| `buildings/*` | residential · commercial · palace · garden · religious · infrastructure |
| `props/*` | lighting · street · ritual · furniture · cultivation |
| `nature/*` | tree · rock · plant |
| `terrain/*` | ground-tile · cliff · water |

### 3.2 `tier`（L2 权威）

`primitive` | `component` | `mass` | `hero`

> **游戏侧关心的唯一一条**：`tier: primitive`（柱础 / 直墙段 / 阶条石 / 踏跺 / 栏杆转角…）**走程序化生成，成本 0** —— **不要**把这类丢给 AI 生成（`gbe-studio/AGENTS.md` §3）。

### 3.3 `granularity`（L2 权威）

`L0` | `L1` | `L2` | `L3`

**L3 附加约定**：**L1–L3 构件必须至少 1 个插槽**，插槽位置**必须落 `snap_m` 网格**
（例外：`grid_exempt: true` 仅限 L3 装饰件或 `attach` 类构件）。

### 3.4 现役套件

| kit | 分类目录 | 状态 |
|---|---|---|
| `cn-ancient` | `components/{base, beam, ornament, pillar, railing, roof, wall}` | 唯一在库套件 |

---

## 4. 装配引用（Assembly）

**装配只写「引用 + 变换」，几何一律在构件资产里**（`gbe-studio/AGENTS.md` §3）。

```yaml
# 装配实例（示意 · 字段权威见 L2 assembly.v2.schema.json）
- asset: cn-ancient.roof.xuanshan-roof-01@1.0.0
  position_m: [0, 3.6, 0]
  rotation: [0, 0, 0]        # 单位 = 弧度，XYZ 顺次旋转
  socket: socket_main        # 对接插槽
```

**两条易错点（L2 已定死，此处提醒）**：

1. **`rotation` 单位 = 弧度**，XYZ 顺次旋转。
   - 若三个分量恰为 `90 / 180 / 270` 的整数，L2 校验器会提示「**疑似写了角度**」。
   - **契约沉默处的歧义不靠猜，靠报警。**
2. **`mate_types` 缺省 = 通配**（选而不填 = 不作限制）；
   **`attach` 是单向挂接例外** —— 一端为 `attach` 时**跳过** direction 反向检查。

> **装配的 8 条判据（插槽存在 / direction 反向 / 位置重合 / 网格对齐 / 无穿插 / 承重闭合 / 面数预算）** 由 **L2 `assembly.js` 实现**，游戏侧**调用，不重写**。

---

## 5. `resource-manifest.yaml`（本契约的独有产物）

**作用**：场景 → 资产引用清单。**它是场景布局的唯一真源**，引擎文件（`.umap` / `.tscn`）只是它的**渲染产物**。

> 依据：`CONVENTIONS.md` §4.3 —— **判据：删掉所有场景文件能从 manifest 重新生成 → 合格。**
> 原型现状**不合格**：布局知识埋在 `ProtoSpawnCity.tscn` 与 `Main.cs` 里，须在 Phase 1 抽出。

### 5.1 结构

```yaml
schema_version: "1"
scene: main_city                 # 场景 ID
description: 主城（万安城）

# 环境设定
env:
  up_axis: "+Y"
  forward_axis: "-Z"
  unit: m

# 引用清单
references:
  - ref: cn-ancient.roof.xuanshan-roof-01@1.0.0
    kind: assembly              # assembly | asset
    instances:
      - id: inst_0001
        position_m: [0, 0, 0]
        rotation: [0, 0, 0]     # 弧度
  - ref: cn-ancient.wall.wall-straight-01@1.0.0
    kind: asset
    instances: []

# 预算（可选 · 与 L2 kit.json budgets 对齐）
budget:
  polycount_max: null           # 待 Phase 1 从 kit.json 取
```

### 5.2 规约

| 字段 | 必填 | 规则 |
|---|---|---|
| `schema_version` | ✅ | 首版 `"1"` |
| `scene` | ✅ | 场景 ID（**须与协议 `sceneId` 一致**，见 `protocol-contract.md`） |
| `env.up_axis` / `forward_axis` / `unit` | ✅ | **必须**与 §2 交付基准一致；不一致即报错 |
| `references[].ref` | ✅ | 必须是 §1.1 的完整形式（**含 `@version`**） |
| `references[].instances[].rotation` | ✅ | **弧度** |
| `references[].instances[].id` | ✅ | 场景内唯一 |

**校验**：`scripts/check-asset-ref.js`（Phase 0 建）。

---

## 6. 消费规则（游戏侧必须遵守）

| # | 规则 | 理由 |
|---|---|---|
| 1 | **只读消费 L2 资产，不落引擎特有格式** | 迁移 UE5 时才带得走（`CONVENTIONS.md` §4.2） |
| 2 | **保留无损源 + 原始高精度贴图** | BC 与 ASTC 压缩格式不同，转移动端要重生成整套 |
| 3 | **轴转换只在引擎导入器做** | 见 §2；业务代码做轴转换 = 躺着模型 |
| 4 | **不在场景文件里埋布局知识** | 见 §5；布局只在 manifest |
| 5 | **`tier: primitive` 走程序化，不调 AI 生成** | 成本 0 |
| 6 | **引用必须带 `@version`** | 见 §1.2 |

### ⚠️ 已登记违规（原型侧 · 待处置）

原型的 `.gitignore` 把 **`mszl_world.glb`(42MB)、`male.glb`/`female.glb` 排除在版本控制外**，且这些源文件**只有一份本地副本** —— 直接违反规则 2，且**不可再生**（从 428MB 原始文件瘦身而来）。
已登记为风险（方案 §0 修正四 · 风险 1），**待大人处置**。

---

## 7. 待办（Phase 1 提炼时补全）

- [ ] 从 `gbe-assets/catalog/schema/asset.v2.schema.json` **抄录** `geometry` / `files` / `sockets` / `engines` 四个子对象的**字段清单**（本轮只取了顶层键，未展开子对象）
- [ ] 补 `resource-manifest.yaml` 的**完整 JSON Schema**（当前仅 yaml 示意 + 规约表）
- [ ] 与 L2 的 `kit.json` `budgets` 对齐，填 `budget.polycount_max` 等默认值
- [ ] 确认 `sceneId` 命名规范（与协议契约联动）
- [ ] 确认「储物法宝 / 道具」这类**非建筑资产**是否也走本契约（当前只覆盖建筑与场景）

---

## 附：引用关系

```
L1 gbe-studio/core/contracts/      生成管线内部（不问）
        │  产出交付包
        ▼
L2 gbe-assets/packages/schema/     资产本体 + 包 + 装配  ← 校验唯一实现
        │  交付面（asset id / version / socket / 尺寸 / 锚点）
        ▼
L3 本文件                           游戏侧怎么引用（格式 / 清单 / 消费规则）
```
