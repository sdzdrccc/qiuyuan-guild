# PROJECT-STRUCTURE.md —— 工程结构详案

> **层**：L4 规范层（本仓 `docs/`）　|　**状态**：v1.9（草案 · **M1 施工图**）
> **v1.9 变更**：**§3.2「路线 B（套模板）」更正为「非向导等价物」** —— 原写「`TemplateDefs.ini` 给出的、**与向导等价**的创建规则」**有误**。实测 UE 5.8 源码 `GameProjectUtils::CreateProjectFromTemplate`：向导在「复制模板」之外另有 **6 件事**（写八组 ini 默认值 / 写 `ProjectID` / 建 `Content/` / `.uproject` 反序列化重存 / 跑 `GenerateProjectFiles` / 两遍占位符替换）。套模板脚本只复刻复制规则（已补 `Content/`）→ 产物**可编译可开图，但 ini 与向导不同**。§3.2 加**覆盖范围说明**。
> **v1.8 变更**：**§3.2 创建向导选项 → 按 UE 5.8 引擎源码实测重写**（**ADR-0017**）—— 原「六选项」中**三项与 5.8 实际不符**：① 「Target Platform 勾 Desktop + Mobile」**无法照做**（`EHardwareClass` 只有 Desktop / Mobile **单选**，且其性质是**默认画质档**而非平台开关）；② ③ Starter Content / Ray Tracing **UE 5.6 起已从向导移除**。§3.2 另补 **「目录名 ≠ 工程名」的实操路径**与**本机引擎启动方式**（无 Launcher / 无 VersionSelector / 引擎未注册）。§3.4 §7.2 §9 同步。
> **v1.7 变更**：§1 `server/` 行补**内部结构** —— 一级按**技术模块切**（**ADR-0016**）：`internal/{gateway, login, game}` + `platform/`；§9 待裁项「`server/` 结构」**关闭**（转已裁）。
> **v1.6 变更**：§1 `server/` 加**进程形态指针** —— 新建 **`docs/SERVER-ARCH.md`**（服务端架构与拆分时机 · **ADR-0015**）；§9 加一项**待裁**（`server/` 内部结构）。**本文件只管 UE 工程与服务端的一级目录；进程形态不再在此展开**（判据同纪律①）。
> **v1.5 变更**：§3.3 / §9 阻塞项由**三项**（含 protoc）更正为**两项**（**Go / Luban**）—— protoc 属 **M4**（`ENVIRONMENT.md` §4.2 / **ADR-0014**）。
> **v1.4 变更**：**环境事实全部迁出** → 新建真源 **`docs/ENVIRONMENT.md`**。§3.1 由 84 行实测表**收成指针**（依据纪律①：**同一事实不写两处**）；§9 待办同步（`git init` / `platforms/mobile/` / 版本锁定 **均已办**，仅剩**装齐 Go / protoc / Luban**）。
> **v1.3 变更**：§3.1 第 2 项**推翻 v1.2 的结论** —— 「MSVC 被禁」是**误判**。错在**拿目录名当版本号**：实测 `cl.exe` 的 `ProductVersion` = **`14.44.35228`**（微软「就地修补」，目录名仍写 `14.44.35207`）→ **合规、无需升级**。附 UE 源码依据（读 `ProductVersion` 优先）与正确验证命令。
> **v1.2 变更**：§3.1 第 2 项「MSVC 被禁」**细化为可执行** —— 补根因（装的是**锁定版组件**，**不随 VS 主程序滚动**）、五步升级操作、**验证命令**、两条退路；写明**有效可用区间 `14.44.35211`~`14.44.99999`**（**Banned 优先于 Preferred**）。
> **回答三问**：① `qiuyuan-dalu` 整个是什么结构　② UE 工程怎么创建　③ 手机端怎么预留
> **v1.1 变更**：① §1 目录树**新增 `platforms/`**（平台专属产出物归置点）；② §3.1 第 6 项**更正** —— 原写「Android+IOS 已就绪·勾 Mobile 即生效」是**错的**（平台模块在 ≠ 能出包，iOS 在 Windows 上物理出不了包）；③ §7 加**归置指针**，判据与归置分家；④ §9 待办与待裁同步。
> **归置与出包** → **`docs/MOBILE-PLAN.md`**（手机端专案书）。
> **与方案 §3 的关系**：方案 §3 只画到**一级目录**；本文件展开到**可施工**的粒度。
> **上游依据**：`10-MMO化/技术架构与技术选型.md` §2（客户端架构）/ §4（手机端方案）—— 本文件**承接**它们，不复写。

---

## 0. 本文件补的是什么缺口

方案 §3.2 止于 `ue-client/` 一级，只注明「UE5 客户端」。但**UE 工程内部长什么样、怎么创建、多端配置放哪**全是空白 ——
而 **M1 的第一件事就是建骨架**（`ROADMAP.md` §2）。

**故本文件 = M1 的施工图。**

**三条边界**（本文件**不**做）：

- ❌ 不定义资产引用格式 → 归 `contracts/asset-ref-contract.md`
- ❌ 不定义契约字段语义 → 归 `contracts/`
- ❌ 不重抄上游的渲染管线改造清单 → §7 只给指针

---

## 1. 全貌：`qiuyuan-dalu` 目录树

```
qiuyuan-dalu/                      ← monorepo 根（Git 仓库根，须 git init）
├─ docs/                           ┐
│  ├─ AGENTS.md                    │
│  ├─ CONVENTIONS.md               │ 机制层（与引擎无关，见方案 §3.1）
│  ├─ DECISIONS.md                 │ 注意：**不放** `MULTI-AGENT-DEV-PLAN.md`
│  ├─ DEVLOG.md                    │ 与 `contracts/` —— 两者都住 guild
│  └─ SKILL-ROUTING.md             ┘
├─ tasks/                          本工程内部任务卡（编号 `T-*`）
├─ records/                        每任务完成记录（强制产出 · 同仓铁律）
├─ tests/                          qa 的领地（验收脚本）
│
├─ ue-client/                      ★ UE5 工程（完整工程 · 单工程多平台 · 见 §2）
├─ platforms/                      ★ 平台专属产出物（**工程外** · 只建 mobile）
│  └─ mobile/                      手机端（M1 建 · 见 `MOBILE-PLAN.md` §5）
├─ server/                         ★ 服务端 · Go（重写 · 方案 §8.5）｜**进程形态 + 内部结构见 `SERVER-ARCH.md` §6**（技术模块切 · ADR-0016）
├─ data/                           ★ 配置表（Luban 表源 + 生成物）· **双端共享**
├─ admin/                          GM 后台（Vue3）
├─ db/                             迁移 SQL
├─ tools/                          跨平台通用脚本（校验 / 生成）
│
├─ .gitattributes                  ★ Git LFS 标记（美术资产不上 LFS 必崩）
├─ .gitignore
└─ .workbuddy/
```

**四处位置关系必须说清**（三处是「**不在这里**」）：

| 东西 | 在哪 | 为什么 |
|---|---|---|
| `MULTI-AGENT-DEV-PLAN.md`（方案总纲） | `qiuyuan-guild/docs/` | 它是**跨库**机制，不是本工程的 |
| `contracts/`（契约真源） | `qiuyuan-guild/contracts/` | 本工程**只读消费**；留本地副本 = 留一条分叉的路 |
| `data/`（配置表） | **本仓 repo 根** | 服务端与客户端读**同一份**；放 `ue-client/` 内 = 服务端另存一份 = 双真源（方案 §3.2） |
| `ue-client/`（UE 工程） | 本仓根 | 与 `server/` `admin/` 并列为**端**，不是仓根 |

---

## 2. 关键认识：`ue-client/` 是**一个完整独立的 UE 工程**

这一点最容易搞错。**`.uproject` 在哪，UE 工程根就在哪。**

```
ue-client/                         ← 这就是 UE 工程根（不是子目录）
├─ QiuyuanDalu.uproject            ← UE 靠它识别工程
├─ Config/    Content/    Source/    Plugins/
├─ Binaries/  Intermediate/  Saved/  DerivedDataCache/   ← UE 自动生成，**必须 gitignore**
```

**由此推出三条**：

1. **目录名不必等于工程名。** 目录取 `ue-client/`（多端并列用），工程名取 `QiuyuanDalu`（PascalCase，方案 §14.1-3）—— 两者是**两个场合的两种法定形式**（`CONVENTIONS.md` §6.1）。
2. **UE 生成的四个目录一律不提交**：`Binaries/`（可执行）、`Intermediate/`、`Saved/`（日志 / 自动保存）、`DerivedDataCache/`。**提交它们 = 仓库被二进制污染**。
3. **monorepo 里放 UE 工程是官方支持的** —— UE 用 `Default.uprojectdirs` 机制在子目录中发现工程。无需额外配置。

> **UE 版本必须全队锁定同一小版本** —— 本项目锁定 **UE 5.8.1**（锁定值与查法见 `ENVIRONMENT.md` §2.1），纪律见 `CONVENTIONS.md` §9。
> **理由**：UE 的**小版本之间不保证资产兼容** —— 5.8.1 存的 `.uasset`，被更高补丁版打开会升级且**不可回退**。
> 多工具 / 云电脑协作下，版本漂移会直接损坏资产。**这是硬约束，不是建议。**

---

## 3. UE 工程怎么创建（M1 第一件事）

### 3.1 前置：环境（**真源已移出** → `ENVIRONMENT.md`）

> **本节的版本号与现状不再在此维护** —— 真源是 **`ENVIRONMENT.md`**（开发环境与工具链台账）。
> 依据纪律①：**同一事实不写两处**。此处只留「M1 要做什么」，**事实一律查台账**。
> 历史上此处曾维护整张环境实测表，**已全部迁出**（含 MSVC 判据、移动端平台、Android SDK 等）。

**M1 开工前，环境侧两件事 —— ✅ 均已办（2026-09-28）：**

| # | 事项 | 状态 |
|---|---|---|
| 1 | 装齐 **Go / Luban**（protoc 属 M4，见台账 §4.2） | ✅ **已装**：Go 1.27.1 ／ Luban v5.1.0（`ENVIRONMENT.md` §1 / §2.2.1） |
| 2 | 先 `git init` + LFS + `.gitignore`，**再**创建 UE 工程 | ✅ dalu 已完成（台账 §4.3） |

**两条判据纪律**（本轮实测得来，务必记住）：

- **不看「装了没」，看「能不能编译」** —— 环境前置须**实测**，不得由安装记录推断。
  （同源：ADR-0002「**已验证 ≠ 正确**」——不看声明，看实物。）
- **判据要落在「引擎真正读取的那个字段」上** —— 最典型的例子是 MSVC：
  **目录名 `14.44.35207` 不是版本号**，UE 读的是 `cl.exe` 的 **`ProductVersion`**（本机 `14.44.35228` ✅ 合规）。
  **唯一正确查法**见 `ENVIRONMENT.md` §2.1.1。
  > 曾据此误报「MSVC 被禁导致 M1 阻塞」**两次**，并写进两仓文档 —— 复盘见 `records/X-0006.md` 附加节。

#### 创建前的顺序

**先 `git init` + `git lfs install` + 写 `.gitignore`，再创建工程。**

反了的话，UE 生成的 `Binaries/` `Intermediate/` `Saved/` 会**先落盘**，容易误提交 ——
**先让 `.gitignore` 挡着，再让 UE 生成。**（台账 §4.3 第 4 项的实操依据。）

### 3.2 创建向导的选项（**v1.8 按 UE 5.8 源码实测重写** · **ADR-0017**）

> ⚠️ **本节原列「六选项」，其中三项在 UE 5.8 里不存在或无法照做。**
> 依据是**引擎源码**，不是界面印象：`Engine/Source/Editor/GameProjectGeneration/Classes/TemplateProjectDefs.h`
> 的 `ETemplateSetting` 枚举 —— 向导**现存项只有** `Languages` / `HardwareTarget` / `GraphicsPreset` / `Variants` / `XR`。

**M1 要动的四项**：

| # | 向导项（**实际名**） | 取值 | 理由 / 代价 |
|---|---|---|---|
| 1 | **模板** | **游戏 → 空白** | 引擎内是 `Templates/TP_Blank`（**C++ 版**）与 `TP_BlankBP`（蓝图版）；选 C++ 即 `TP_Blank`。第三人称模板会塞进一整套示例内容；M1 要的只是「能进图」 |
| 2 | **`Languages`**（语言） | ★ **C++** | GAS、网络、存档、配置读取走 C++（上游 §2.2）；纯蓝图工程后期加 C++ 要重新编译整套 |
| 3 | **`HardwareTarget`**（硬件目标） | **`Desktop`** | ⚠️ **原「勾 Desktop + Mobile」作废** —— 见下「更正说明」 |
| 4 | **`GraphicsPreset`** | **`Scalable`**（**建议 · 可复核**） | Epic 官方指引：「Maximum 用于 PC / 主机，**Scalable 用于移动设备**」。Scalable 只是**改默认值**（默认关抗锯齿、运动模糊等耗资源项），PC 画质可在 `DeviceProfile` 单独开回；反之从 Maximum 起步要清理一批默认依赖。**反方留痕见 §3.4** |

**向导上已不存在、故 M1 无需操作的项**（**本次更正的重点**）：

| 原第 # | 原项 | UE 5.8 实际 |
|---|---|---|
| 5 | Starter Content | ❌ **已移除** —— 枚举项标注 `UE_DEPRECATED(5.6, "Ability to add Starter Content has been removed")` |
| 6 | Ray Tracing | ❌ **已废弃** —— 枚举项名即 `Raytracing_DEPRECATED` |
| — | `Variants` / `XR` | 存在，但**模板未定义变体、M1 不做 XR** → **不动** |

#### 更正说明（**ADR-0010 §二 第 3 项**）

原文写：「**Target Platform** ★ **Desktop + Mobile 都勾** —— **这是手机端预留最重要的一次点击**」。**两处都不成立**：

| # | 原判断 | 实测 |
|---|---|---|
| ① | 是个**可多选**的平台开关 | `HardwareTarget` 取值来自枚举 `EHardwareClass`，**只有 `Desktop` / `Mobile` 两个值，单选**（`Unspecified` 隐藏）。**没有「Desktop and Mobile」这一项** |
| ② | 管的是「**平台预留**」 | 它管的是**默认画质档** —— 源码 `HardwareTargetingModule.cpp` 按 `bLowEndMobile` / `bAnyPC` / `bHighEndPC` 等组合**批量应用一批 `URendererSettings`**，落点为 `Config/DefaultEngine.ini`：见下 |

```ini
[/Script/HardwareTargeting.HardwareTargetingSettings]
TargetedHardwareClass=Desktop           ; 或 Mobile（单选）
DefaultGraphicsPerformance=Scalable     ; 或 Maximum
```

**那「手机端预留」的落点究竟在哪？—— 不在创建向导里：**

| 层 | 事实 |
|---|---|
| **平台支持** | 是**引擎级**的（`Engine/Platforms/{Windows,Android,IOS}`）—— 本机**已装**（`ENVIRONMENT.md` §2.4）。**与工程创建时的任何选择无关** |
| **工程是否限定平台** | `.uproject` 的可选字段 `TargetPlatforms`。**向导不写它**（实测 `GameProjectUtils.cpp` 的创建流程只写 ini，不碰该字段）→ **不写 = 全平台开放**，反而是最宽松的状态 |
| **真正不可后补的两条** | 仍是 **「资产按移动端预算生成」** 与 **「输入抽象（Enhanced Input，不读键码）」**（§7.2）—— 这两条**与创建向导无关**，它们是**纪律** |

> **结论**：原「创建时勾 Mobile」**既无对应操作、也无必要**（UE 默认全平台开放）。
> **手机端预留的实质是「约束资产规格 + 抽象输入」，不是「一次点击」** —— 与 `MOBILE-PLAN.md` 的判断一致。

#### 路径与命名（**目录名 ≠ 工程名**）

**先认清向导的行为**：它按 **`<父目录>/<工程名>/`** 建工程（面板上就是 `Name` + `Location` 两格）。
**因此向导无法一次做到**「目录叫 `ue-client`、工程名叫 `QiuyuanDalu`」。两条路：

| 路线 | 做法 | 评价 |
|---|---|---|
| **A · 向导 + 重命名**（GUI） | ① `Location` 指 `F:/zxc/Project/qiuyuan-dalu/`、`Name` 填 `QiuyuanDalu` → 得到 `qiuyuan-dalu/QiuyuanDalu/`；② 把该目录**重命名为 `ue-client/`** | 可行。**`.uproject` 与模块名不动** —— UE 工程**相对路径寻址**，目录可移动（模板已证：`TP_Blank/` 内**无任何绝对路径**） |
| **B · 套模板**（命令行） | 把 `Templates/TP_Blank/` 复制为 `ue-client/`，按 `TemplateDefs.ini` 规则改名 | **可脚本化、可复现**（合「命令 + 输出」的记录纪律），且**天然满足「目录名 ≠ 工程名」**。⚠️ **非向导等价物** —— 见下方覆盖范围说明 |

**`TemplateDefs.ini` 给出的创建规则**（路线 B 的依据 —— **只覆盖「复制」环节**）：

| 规则 | 内容 |
|---|---|
| `FoldersToIgnore` | `Media`（模板预览图，不进工程） |
| `FilesToIgnore` | `%TEMPLATENAME%.uproject`（**由向导读它后重新序列化生成**，非直接复制）、`Config/TemplateDefs.ini`、`%TEMPLATENAME%.sln` 等 |
| `FolderRenames` | `Source/TP_Blank` → `Source/<工程名>` |
| `FilenameReplacements` / `ReplacementsInFiles` | 限定扩展名 **`cpp` / `h` / `ini` / `cs`**，把 `TP_Blank` / `TP_BLANK` / `tp_blank` → 工程名（**三种大小写都要覆盖**） |
| `bIsBlank=True` | **不指定默认地图** → 这正是 §3.3 第 3 项「设默认地图 / GameMode」被列为**创建后必做**的原因 |

> ⚠️ **路线 B 的覆盖范围（重要）**：向导的 `GameProjectUtils::CreateProjectFromTemplate`
> 在「复制模板」之外另有 **6 件事** —— **[1] 写一批 ini 默认值**（`AddHardwareConfigValues` /
> `AddLumenConfigValues` / 光追 / 阴影 / 后处理 / WorldPartition / UI DPI 等八组）、
> **[2] 写 `ProjectID`**、**[3] 建 `Content/` 空目录**、**[4] `.uproject` 反序列化后重存**（清
> `EngineAssociation`）、**[5] 跑 `GenerateProjectFiles`**（`.sln`）、**[6] 用两遍占位符法替换**。
> 套模板脚本**只复刻复制规则**（已补 `Content/`）→ 产物**可编译、可开图**，但 **ini 内容与向导产物不同**。
> 要「与向导一致」走 **路线 A**；操作细节与逐项对照见 `qiuyuan-dalu/docs/UE-PROJECT-SETUP.md`（附录）。


> **两条硬约束**：路径**不得含中文或空格**；工程名须以字母开头、≤20 字符。
> **先清空目标目录** —— `ue-client/` 现有一个 `.gitkeep` 占位，走哪条路都要先移掉（向导不接受非空目录）。

#### 引擎与启动（**本机实测**）

引擎在 **`F:/zxc/UE_5.8/`**（**非** `C:` 默认位）。**本机三处与常规安装不同**（真源见 `ENVIRONMENT.md` §2.1.2）：

| 项 | 本机实况 | 影响 |
|---|---|---|
| **Epic Launcher** | ❌ **未装** | 不能从 Launcher 启动 |
| **`UnrealVersionSelector.exe`** | ❌ **不存在** | 右键 `.uproject` 的「切换引擎版本 / 生成工程文件」**不可用** |
| **引擎注册** | `HKLM\SOFTWARE\EpicGames\Unreal Engine\` 下**只有 `4.0`**；`HKCU\...\Unreal Engine\Builds` **为空** | `.uproject` 的 `EngineAssociation` **不能填 `"5.8"`**（无注册项可解析） |

→ **推荐启动方式：直接指定编辑器**（最稳、可复现、可写进记录）

```
"F:/zxc/UE_5.8/Engine/Binaries/Win64/UnrealEditor.exe" "<工程根>/QiuyuanDalu.uproject"
```

首次打开时工程内**无 `Binaries/`** → 编辑器会提示「模块缺失，是否重新编译？」→ **选「是」**（编译 `QiuyuanDalu` 模块）。
> 生成 VS 工程文件（`.sln`）同理走命令行：`UnrealBuildTool.exe -projectfiles -project="…" -game -progress`。


### 3.3 创建后必做（六项）

| # | 事项 | 说明 |
|---|---|---|
| 1 | 启用 **`GameplayAbilities`** 插件 | GAS 是上游 §2.3 定的核心方案。UE5 自带但**默认未启用** |
| 2 | 确认 **`EnhancedInput`** 已启用 | UE5 默认启用；它是「输入抽象」的载体（§7.3 纪律 1） |
| 3 | 设**默认地图 / 默认 GameMode** | M1 的空场景 + 最小 GameMode。**模板 `bIsBlank=True` 不带默认地图**，此项必做 |
| 4 | ~~写 `.gitignore` / `.gitattributes`~~ | ✅ **已完成（2026-09-28）** —— 挡 UE 生成目录；`.uasset/.umap/.fbx/.png/.wav` 走 LFS（§4）。**已先于工程创建落盘**（§3.1 顺序纪律） |
| 5 | ~~首次提交~~ | ✅ **已完成（2026-09-28）** —— 骨架首推 `61dbaca`。**工程内容生成后需再提一次**（提交 `uproject` / `Config/` / `Content/` / `Source/` / `Plugins/`） |
| 6 | **命令行验证构建** | ★ **判据是「能编译」，不是「能打开」** —— 依据 §3.1 纪律「不看装了没，看能不能编译」。命令：`Engine/Build/BatchFiles/Build.bat QiuyuanDaluEditor Win64 Development -project="…/QiuyuanDalu.uproject"`。**这是 M1 第 0 项「建工程骨架」的出口判据** |

### 3.4 Quality Preset 的反方留痕（§3.2 第 4 项）

> **v1.8 补注**：向导上 `HardwareTarget` 与 `GraphicsPreset` 是**配对的两个下拉**，两者组合决定一套默认渲染设置
> （源码 `HardwareTargetingModule.cpp`：`bLowEndMobile` = Mobile + Scalable ／ `bHighEndPC` = Desktop + Maximum）。
> **本次取 `Desktop` + `Scalable`** —— 表明 M1 面向 PC，同时保持保守的默认画质。

上游《技术架构》§0.3 有句「**原型期：原生 UE5，全画质**」。若照此取 **Maximum**：

| | Scalable（建议） | Maximum |
|---|---|---|
| 与移动端目标 | 一致 | 需逐项清理默认依赖 |
| PC 画质上限 | 靠 DeviceProfile 开回（**可达成**） | 直接给到 |
| 主要代价 | 创建后要把 PC 档的画质开关调回来 | 将来做移动端时的清理由此项产生 |

> **本项属「推导建议」，可复核**（`DECISIONS.md` 格式纪律 2）。
> **另一读法**：若把上游那句理解为「UE5 工程也必须 PC 全画质优先」，则结论取 **Maximum** ——
> 此时**须在 M1 就登记一份「移动端改造清单」**，把要清理的项列出来，不许等到做大手机端时才发现。
> **建议仍取 Scalable**：因为它**不损失任何 PC 能力**，只是默认值更保守。

---

## 4. `Content/` 的组织：**按功能，不按类型**

Epic 官方与主流风格指南（Allar / Gamemakin，Epic 自家教程引用）的共识：

> **按游戏域组织（`Characters/` `Weapons/`），不要按资产类型组织（`Meshes/` `Textures/`）。**
> 后者在资产过数百后近乎不可维护，重排会产生**级联重定向器**（cascading redirectors）打断全部引用。

**另一条硬规则**：**所有项目资产放进一个命名空间文件夹，不放 `Content/` 根**（防资产迁移时命名冲突）。

```
ue-client/Content/
└─ QiuyuanDalu/                     ← 项目命名空间（**一切资产在此内**）
   ├─ Core/                         工程级：GameMode / PlayerController / 输入（IMC·IA）/ 全局设置
   ├─ UI/                           UMG（`WBP_*`）
   ├─ Characters/                   玩家 / NPC
   ├─ Scenes/                       关卡（`.umap`）
   ├─ Gameplay/                     GAS 资产（Ability / Effect / Cue）—— M2 起
   └─ Assets/                       GBE 交付包落位 —— M4 起，按 `asset-ref-contract` 分类
```

**M1 只用到三个**：`Core/` `UI/` `Scenes/`。
`Gameplay/` 与 `Assets/` **不预建** —— 空目录会在「不留空壳」的纪律下变成噪音（方案 §3.2 同旨）。

**命名前缀**（Epic 官方约定，`CONVENTIONS.md` §6.1 应补录）：

| 前缀 | 类型 | 例 |
|---|---|---|
| `SM_` | Static Mesh | `SM_Roof_Xieshan_01` |
| `SK_` | Skeletal Mesh | `SK_Role_Male` |
| `T_` | Texture | `T_Character_Hero_N` |
| `M_` / `MI_` | Material / Instance | `MI_Roof_Tile` |
| `BP_` | Blueprint | `BP_LoginController` |
| `WBP_` | Widget Blueprint | `WBP_AttributePanel` |
| `IA_` / `IMC_` | Input Action / Mapping Context | `IA_Move` / `IMC_Default` |
| `L_` | Level | `L_LoginScene` |

---

## 5. 源码模块（**M1 用单模块**）

```
ue-client/Source/
├─ QiuyuanDalu.Target.cs           游戏构建目标（含 TargetPlatforms）
├─ QiuyuanDaluEditor.Target.cs     编辑器构建目标
└─ QiuyuanDalu/
   ├─ QiuyuanDalu.Build.cs         模块依赖声明
   ├─ Public/                      头文件（`.h`）
   └─ Private/                     实现（`.cpp`）+ 模块入口
```

**M1 不拆模块**（单模块 `QiuyuanDalu`）。

| | 说明 |
|---|---|
| **为什么不拆** | 拆模块要动 `Target.cs` / `.uproject` / `Build.cs`，且会引入模块间依赖管理。M1 只有登录 / 建角 / 属性面板三屏，**拆了是过早优化**（方案 §10 反模式） |
| **何时拆** | 等 `world` / `combat` / `ui` 三条线的代码量**真实**撞上编译时间或耦合问题 |
| **拆的代价** | 低 —— 是**平级新增目录 + 改两处构建文件**，不是重构。**故不必预拆** |

> ⚠️ `Source/<Module>/Classes/` 是**已废弃**的旧约定，别用。用 `Public/`（头）+ `Private/`（实现）。

**M1 需要的 C++ 骨架**（最小集）：

- `QiuyuanDaluGameMode` / `QiuyuanDaluPlayerController`
- 一个 **HTTP 客户端**封装（登录 / 建角走 REST，用引擎自带 `FHttpModule`）
- 属性面板的**数据模型**（只读契约 §6 的派生结果，**不在客户端算属性** —— 服务端权威，上游 §2.4 铁律）

---

## 6. 配置分层（`Config/`）

```
ue-client/Config/
├─ DefaultEngine.ini              渲染 / 引擎默认（含 RHI、默认地图）
├─ DefaultGame.ini                项目信息（版本号、项目名）
├─ DefaultInput.ini               默认输入类与 IMC 引用
├─ DefaultDeviceProfiles.ini      ★ 设备分级（低 / 中 / 高）—— 手机端预留的落点
└─ <Platform>/                    平台专属覆盖（`Windows/` `Android/` `IOS/`）—— **按需建，不预建**
```

**两条纪律**：

1. **平台差异写进 `Config/<Platform>/` 或 DeviceProfile，不写进代码** ——
   代码里的 `#if PLATFORM_ANDROID` 会让逻辑分裂成两套，直接违反上游 §4.5「同一套玩法逻辑，双端共用」。
2. **`DeviceProfile` 是「一份资产、分档表现」的机制** —— 同一份资产按低/中/高档切 LOD 与特效等级（上游 §4.5）。

---

## 7. 手机端预留：**只留口子，不做适配**

> **分工**：本节只答「**现在动不动手**」（判据）；「**东西放哪、怎么变成安装包**」在 **`docs/MOBILE-PLAN.md`**。
> 两节合起来才是完整的「提前准备」：**判据（做不做）+ 归置（放哪）+ 出包（怎么出）**。

### 7.1 判据（这一节的核心）

`ROADMAP.md` §2 的 Out of scope 明写「**❌ 移动端适配**」。所以本节的「预留」**不是**做适配。

> ### 判据：一个决定，如果「不做」会在将来做移动端时**推翻已写的东西** → 现在做。
> ### 「不做」将来只是**补一个配置 / 一套布局** → 现在不做。

### 7.2 两栏对照表

| 项 | ✅ 现在做（零成本 / 事后不可补） | ❌ 现在不做（要投入 / 事后可补） |
|---|---|---|
| 平台支持 | **无需操作** —— 引擎级已装（`Engine/Platforms/{Windows,Android,IOS}`）；向导**不写 `TargetPlatforms`** 即全平台开放。（**v1.8 更正**：原写「创建时勾 Mobile」，UE 5.8 向导**无此项**，详见 §3.2「更正说明」） | — |
| 目录命名 | `ue-client/`（天然支持多端并列） | — |
| **输入抽象** | 全走 Enhanced Input 的 `IA_*` / `IMC_*`，**不读键码** | — |
| 资产规格 | 按**移动端预算**生成（上游 §4.4 那张表） | — |
| 贴图 / 源文件 | **保留无损源 + 原始高精度贴图**（上游 §4.3） | — |
| 引擎特有格式 | 不落（方案 §8.2） | — |
| UI 布局 | 只做 **PC 横屏**（上游 §4.5 说逻辑层已共用） | 竖屏布局后补 |
| DeviceProfile 分级 | 不调 | 后配 ini |
| ASTC 贴图生成 | 不做 | 打包时批量转 |
| Android / iOS 打包流水线 | 不做 | 后建 |
| 移动端性能优化 | 不做 | 后做 |

**读懂这张表的方法**：左栏全是「**一次点击**」或「**一条纪律**」，代价近零；
右栏全是「**要排期的工作**」，且**事后都能补**。**唯一不可后补的是「资产规格」与「输入抽象」** —— 前者返工无捷径，后者会逼着重构玩法代码。

> **右栏这些「后补」的东西要补到哪，事先已经定死了** —— 见 **`MOBILE-PLAN.md` §4 归置表 / §5 文件清单**。
> 「后补」不等于「到时候再想」：**位置先定，内容后填**。

### 7.3 三条硬纪律

| # | 纪律 | 为什么现在立 |
|---|---|---|
| **1** | **玩法代码不得直接读键码 / 触摸事件** —— 一律经 Enhanced Input 的 `IA_*` 映射 | 上游 §4.5：键鼠 / 触屏 / 手柄只是**三套映射**。在玩法代码里读键盘，等于把输入设备焊进了逻辑 |
| **2** | **AI 生成的资产按移动端预算验收，先过表再入库**（上游 §4.4） | 上游原话：「**宁可在产出时就压到移动端规格，也不要生成高模再回头降**」 |
| **3** | **保留无损源 + 原始高精度贴图** | BC vs ASTC 压缩格式不同，转移动端要**重新生成整套**贴图（上游 §4.3 标注为「最容易被低估的一条」） |

> **纪律 1 可机械校验**（扫 C++ 里的 `IsInputKeyDown` / 裸键码常量）→ **够格写成门禁规则**，M2 起补。
> **纪律 2 / 3 属资产侧** → 归 `contracts/asset-ref-contract.md` §6（已列规则 2、并已登记原型侧违规）。

---

## 8. 与上游 / 契约的关系

| 本文件章节 | 真源 | 关系 |
|---|---|---|
| §2 UE 工程结构 | Epic 官方目录约定 | 引用 |
| §3.2 创建选项 | **UE 5.8 引擎源码**（`TemplateProjectDefs.h` 的 `ETemplateSetting` ／ `HardwareTargetingModule.cpp`） | **实测更正**（v1.8）；落 **ADR-0010 + ADR-0017** |
| §4 Content 组织 | Epic 官方 + Allar 风格指南 | 引用 |
| §6 配置分层 | 上游《技术架构》§2.1 / §4.5 | 承接 |
| §7 手机端预留 | 上游《技术架构》**§4 全节** | **承接** —— 上游已写得很细，本文件只做「M1 该做什么」的过滤 |
| §1 `platforms/` / §7 归置指针 | **`MOBILE-PLAN.md` §4 / §5** | 分工：本文件答「动不动手」，彼答「放哪 / 怎么出包」 |

**明确不做的事**：不把上游 §4.3 的「渲染管线改造清单」（Lumen→烘焙、Nanite→LOD、BC→ASTC…）抄进来。
**那份清单是「做移动端时」的执行依据，不是 M1 的**。抄进来只会让 M1 的范围膨胀（违反范围闸门）。

---

## 9. 待办与前置

**M1 开工前置**（硬）：

- [x] ~~升级 MSVC~~ —— **实测无需**：`cl.exe` 的 `ProductVersion` = `14.44.35228`，本就合规（`ENVIRONMENT.md` §2.1.1）
- [x] `qiuyuan-dalu` 做 `git init` + `git lfs install` + `.gitattributes` / `.gitignore` —— **2026-09-28 完成**
- [x] 建 `platforms/mobile/` 并落文件清单（**`MOBILE-PLAN.md` §5**）—— 与 `git init` 同批
- [x] **建立 `docs/ENVIRONMENT.md`**（环境与工具链台账）+ 版本锁定 —— **2026-09-28 完成**
- [x] ~~**装齐两项工具链**：**Go** / **Luban**~~ → ✅ **2026-09-28 完成**（Go 1.27.1 / Luban v5.1.0，见 `ENVIRONMENT.md` §1）
  > ⚠️ **v1.5 更正**：原写「三项（含 **protoc**）」**有误** —— protoc 服务于**内部跨进程 gRPC**，而 M1 阶段八类 Go 进程**合并为单进程**（上游 §3.1），进程内调用不跨网络 → **M1 用不上**。触发器在 **M4**（场景服独立）。见台账 §4.2。
- [ ] **创建 `ue-client/` 工程内容** ← ★ **M1 第 0 项，下一步就做它**（规格见 **§3.2**；依据 **ADR-0010 + ADR-0017**）
  > **现状**：`ue-client/` 内**只有 `.gitkeep` 占位**。**动手前先清空该目录**（向导不接受非空目录）。

> **环境现状一律查 `ENVIRONMENT.md` §3** —— 本文件**不再复写任何版本号**（纪律①：同一事实不写两处）。

**待补**：

- [x] `CONVENTIONS.md` §6.1 命名表补录资产命名两条线（引擎内 / 引擎外）—— **2026-09-28 完成**
- [x] `CONVENTIONS.md` §9 补「环境与版本锁定」条文 —— **2026-09-28 完成**
- [ ] 上游《技术架构》§3.4 表结构漏列配置表 —— 已在 `registry/cross-repo-ledger.md`（**U-0004**）

**待裁**：

- [x] ~~Quality Preset 取 Scalable 还是 Maximum~~ → 建议 Scalable，见 §3.4
- [x] ~~**`server/` 内部结构**（技术模块 vs agent 领地）~~ → **已裁：技术模块切**（**ADR-0016**）；见 `SERVER-ARCH.md` §6
- [ ] **iOS 商业化走法**（只上 Android / 买 Mac / macOS CI）—— 见 `MOBILE-PLAN.md` §2.4；**不阻塞任何里程碑**

---

## 附：本文件的引用者

| 消费方 | 用途 |
|---|---|
| `qiuyuan-dalu` | M1 建骨架的执行依据 |
| `docs/ROADMAP.md` §2 | M1 In scope 第 0 项 |
| `docs/DECISIONS.md` | ADR-0010 |
