# 开发环境与工具链台账（ENVIRONMENT）

> **层**：L4 规范层（本仓 `docs/`）　|　**状态**：v1.3（**唯一真源** · 开工前置物）
> **回答**：开发这个游戏**用到哪些应用**、**锁定在哪个版本**、**本机装没装**、**怎么校验**、**还缺什么**。
> **上游依据**：《技术架构与技术选型》**§八 技术选型总表** + §3.1 进程划分 + §3.2 通信协议 + §6.2 Luban + §7.4 GM 后台（需求层）。
> **为什么要这份文件**：环境是**一次性的地基**——版本错了要重装、缺了要停工，且**事后返工成本远高于开工前对齐**。
> 与 `contracts/` 同级对待：**它是真源，不是备忘**。
>
> **v1.3 变更**（**补一行「引擎怎么启动」的环境事实** · 随 **ADR-0017**）：
> 新增 **§2.1.2 引擎注册与启动方式** —— 本机**无 Epic Launcher / 无 `UnrealVersionSelector` / 引擎未在 `HKLM` 注册**（只有 `4.0`）
> → `.uproject` 的 `EngineAssociation` **不能填 `"5.8"`**；**启动与构建一律走命令行指定引擎**。
> §2.1 表 UE 行「获取」列同步更正为「**本机为独立安装**」。
>
> **v1.2 变更**（**M1 两项工具装机完成 → M1 硬前置全部解除**）：
> ① **Go 1.27.1** 装入 **`F:\zxc\go`**（官方 zip 直装 + sha256 校验；`GOPATH=F:\zxc\gopath`／`GOPROXY=goproxy.cn`，详见 §2.2.1）；
> ② **Luban v5.1.0** 装入 **`F:\zxc\Luban`**（GitHub release `Luban.7z`；**自带 `Luban.exe`，无需 `dotnet` 起**）；
> ③ **端到端验证（不只 `--version`）** —— Luban 导表 → **207 Go 文件 + 53 JSON**；**生成代码经 `go build` / `go vet` 全过**；
> ④ **§4.1「M1 前必装」清空** —— 环境侧**无阻塞项**（见 §3 / §4.3）。
>
> **v1.1 变更**（**把 M4 才需要的东西从 M1 的账上划掉**）：
> ① **protoc 移出「M1 前必装」** → §4.2 按里程碑装（**触发点 M4**）；
> ② 更正 §4.1 原「契约层已定 gRPC + Protobuf」的**引用错误**（契约定的是 WebSocket + JSON）；
> ③ 总表 protoc 行补「**内部链路 · 非客户端协议**」限定语。

---

## 0. 三条纪律

**① 这是唯一真源 —— 同一事实不写两处。**
`PROJECT-STRUCTURE.md` / `CONVENTIONS.md` / `ROADMAP.md` 里一律**指针引用本文件**，不再各自重复版本号。
> 判据：**同一事实写两处 = 迟早不一致。** 与铁律三（guild 只装无处可归的东西）同源。

**② 「现状」列只写实测，不写声明。**
每一项的现状必须能由**校验命令**当场复现。
> 承接坑 11~16：**「装了」≠「能用」**（坑 11）、**「模块在」≠「能出包」**（坑 12）、**「目录名旧」≠「编译器旧」**（坑 16）。
> **禁止**从安装记录、版本号外观、目录名推断现状。

**③ 版本变更须 ADR。**
锁定版本是**纪律**，不是备忘。改动锁定值（含升级、降级、换选型）必须先在 `DECISIONS.md` 落一条 ADR，再改本文件。
> 与 `CONVENTIONS.md` 的「铁律级，升版需 ADR」一致。

---

## 1. 总表（锁定的应用一览）

| 层 | 应用 | 锁定版本 | 用途 | 现状 |
|---|---|---|---|---|
| 引擎 | Unreal Engine | **5.8.1** | 客户端 + 场景服（Dedicated Server） | ✅ 已装 |
| 客户端构建 | VS 2022 BuildTools | **17.14.x** | C++ 编译宿主 | ✅ 已装 |
| 客户端构建 | MSVC v143 工具链 | **≥ 14.44.35211** | 编译器本体 | ✅ 合规 |
| 客户端构建 | Windows SDK | **≥ 10.0.22621** | Win64 目标平台 | ✅ 已装 |
| 客户端构建 | .NET SDK | **10.x** | UnrealBuildTool 运行时 | ✅ 已装 |
| 服务端 | Go | **1.27.1** | 网关/登录/世界/业务/社交/经济/排行/GM 八类进程 | ✅ **已装**（`F:\zxc\go`） |
| 服务端 | gRPC + Protobuf | **protoc ≥ 3.21** | **内部跨进程**强类型通信（**非客户端协议**；M1 单进程用不上 → §4.2） | ❌ **未装** |
| 数据 | MySQL | **8.0.x** | 持久数据（不可丢） | ✅ 已装 |
| 数据 | Redis | **≥ 7.2**（建议） | 会话/排行/锁/限流 | ⚠️ **版本过旧** |
| 配置表 | Luban | **v5.1.0** | 策划改表不动代码 | ✅ **已装**（`F:\zxc\Luban`） |
| 容器 | Docker Compose | **装机时锁定** | 服务端起步编排 | ❌ **未装** |
| 工具 | Node.js | **22.x** | 门禁脚本 / GM 前端构建 | ✅ 已装 |
| 工具 | Python | **3.13.x** | 顺表 / 数据脚本 | ✅ 已装 |
| 工具 | Git + Git LFS | **2.55.x + 3.7.x** | 版本控制（**必须上 LFS**） | ✅ 已装 |
| 资产 | Blender | 归 **GBE** 线 | 建筑建模 / blender-mcp | ⚪ 见 §2.6 |
| 资产 | Tripo3D / Meshy | 在线服务 | 图生 3D（人物 / 道具） | ⚪ 见 §2.6 |
| 移动端 | Android SDK / NDK | **待定** | Android 出包 | ❌ 未配（**不阻塞**） |
| 移动端 | Xcode | — | iOS 出包 | 🚫 **Windows 上物理不可用** |

---

## 2. 详表（按层 · 含获取方式与校验命令）

### 2.1 客户端构建链

| 应用 | 锁定版本 | 获取 | 校验命令 |
|---|---|---|---|
| Unreal Engine | **5.8.1** | **本机为独立安装**（`F:\zxc\UE_5.8`，**非** Launcher 管理 —— 见 §2.1.2） | `cat F:/zxc/UE_5.8/Engine/Build/Build.version` |
| VS 2022 BuildTools | **17.14.x** | Visual Studio Installer | `"C:/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe" -all -property installationVersion` |
| MSVC v143 | **≥ 14.44.35211** | VS Installer → 单个组件 → `v143` | 见 §2.1.1 ✓ **判据不是目录名** |
| Windows SDK | **≥ 10.0.22621** | VS Installer → 单个组件 | `ls "C:/Program Files (x86)/Windows Kits/10/Include/"` |
| .NET SDK | **10.x** | VS Installer / dotnet 官网 | `dotnet --list-sdks` |

#### 2.1.1 MSVC 判据（**唯一正确查法**）

```powershell
(Get-Item "F:\zxc\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\*\bin\Hostx64\x64\cl.exe").VersionInfo.ProductVersion
```

- **本机实测 = `14.44.35228.0`** ✅
- UE 5.8 的禁用区间：`Engine/Config/Windows/Windows_SDK.json` → `BannedVisualCppVersions`，其中 `14.44.0-14.44.35210` 被禁。
- ⚠️ **目录名 `14.44.35207` 不是版本号** —— 微软用**就地修补（Servicing）**更新二进制，目录名保持「家族基线名」不变。
- UE 源码判据：`UnrealBuildTool/Platform/Windows/MicrosoftPlatformSDK.cs` → `IsValidToolChainDirMSVC()` **先读 `ProductVersion`，读不到才回退目录名**。
- **禁止**改引擎的 `Windows_SDK.json` 去放行旧版本。

#### 2.1.2 引擎注册与启动方式（**本机实测 · 2026-09-28**）

**本机引擎是「独立安装」，不在 Epic 生态里注册** —— 三处与常规安装不同：

| 项 | 本机实况 | 影响 |
|---|---|---|
| **Epic Launcher** | ❌ **未装** | 不能从 Launcher 启动引擎或工程 |
| **`UnrealVersionSelector.exe`** | ❌ **不存在**（`Engine/Binaries/Win64/` 下无此文件） | 右键 `.uproject` 的「切换引擎版本 / 生成工程文件」**不可用** |
| **引擎注册** | `HKLM\SOFTWARE\EpicGames\Unreal Engine\` 下**只有 `4.0`**（无 `5.8`）；`HKCU\SOFTWARE\Epic Games\Unreal Engine\Builds` **为空** | `.uproject` 的 `EngineAssociation` **不能填 `"5.8"`**（无注册项可解析） |

**→ 启动与构建一律用命令行指定引擎**（最稳、可复现、可写进记录）：

| 目的 | 命令 |
|---|---|
| **打开工程** | `"F:/zxc/UE_5.8/Engine/Binaries/Win64/UnrealEditor.exe" "<工程根>/QiuyuanDalu.uproject"` |
| **生成 VS 工程文件**（`.sln`，替代右键菜单） | `Engine/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool.exe -projectfiles -project="<…>.uproject" -game -progress` |
| **编译 Editor 目标**（判据是**能编译**，非「能打开」） | `Engine/Build/BatchFiles/Build.bat <Project>Editor Win64 Development -project="<…>.uproject"` |

> **可选项**：若要让 `.uproject` 双击可开，可把引擎注册进 `HKCU\SOFTWARE\Epic Games\Unreal Engine\Builds`
> （**值名** = 任意标识、**值数据** = `F:/zxc/UE_5.8`），再在 `.uproject` 写 `"EngineAssociation": "<该标识>"`。
> **本项目不依赖此路径** —— 判据：**能复现的命令优于文件关联**。

### 2.2 服务端

上游 §3.1 定九类进程，其中**八类用 Go**（仅场景服是 UE Dedicated Server）：

| 进程 | 职责 | 技术 |
|---|---|---|
| Gateway | 连接管理 / 鉴权 / 路由 / 限流 | Go |
| Login | 账号注册登录 / 令牌签发 | Go |
| World | 分线调度 / 全局状态 | Go |
| Scene / DS | 移动 / 战斗 / AI / 掉落 | **UE Dedicated Server** |
| Game | 角色 / 背包 / 装备 / 境界 / 技能 | Go |
| Social | 好友 / 宗门 / 师徒 / 道侣 / 聊天 | Go |
| Economy | 交易 / 拍卖行 / 邮件 / 灵石 | Go |
| Rank / Scheduler | 排行 / 定时任务 | Go |
| GM | 运营指令 / 封禁 / 补偿 / 审计 | Go |

| 应用 | 锁定版本 | 获取 | 校验命令 |
|---|---|---|---|
| Go 工具链 | **1.27.1** | 官方 zip 解压（本机 **`F:\zxc\go`**） | `go version` |
| gRPC + Protobuf | **protoc ≥ 3.21** | `winget install protobuf` 或用 `buf` | `protoc --version` |
| protoc 插件 | `protoc-gen-go` / `protoc-gen-go-grpc` | `go install` | `protoc-gen-go --version` |

> **起步部署**：Gateway / Login / World / Game / Social / Economy / Rank / GM **合并为一个 Go 进程**（单体但模块化），只把场景服独立。
> **写进代码规范的拆分前提**：① 禁全局单例；② 玩家数据不驻留进程内存；③ 模块间只走接口；④ 跨模块调用走同一条内部 RPC 抽象（上游 §3.1）。

#### 2.2.1 Go 环境变量（**本机实测 · 2026-09-28**）

| 变量 | 值 | 说明 |
|---|---|---|
| `GOROOT` | `F:\zxc\go` | 由 `go.exe` **自定位** —— **未手动设置**（Go 官方建议不设，避免升级时忘记改） |
| `GOPATH` | `F:\zxc\gopath` | **用户级**；模块缓存（`pkg\mod`）与 `go install` 落点（`bin`）均在此 |
| `GOPROXY` | `https://goproxy.cn,direct` | **用户级**；国内拉依赖加速，`direct` 兜底（直连本机实测可达） |
| `PATH`（用户级新增） | `F:\zxc\go\bin` · `F:\zxc\gopath\bin` · `F:\zxc\Luban` | 安装位置**全部在 F 盘**（与既有约定一致：UE / MSVC 同在 `F:\zxc`） |

**校验命令**（应全部指向 F 盘）：

```powershell
go version                    # go version go1.27.1 windows/amd64
go env GOPATH GOMODCACHE      # F:\zxc\gopath  /  F:\zxc\gopath\pkg\mod
Luban.exe --version           # Luban 5.1.0+df34215d2e…
```

> ⚠️ **注册表变量需新终端才生效** —— 当前已开的终端读不到（需重开）。排障时先确认「是不是没重开终端」。

### 2.3 数据与中间件

| 应用 | 锁定版本 | 用途 | 校验命令 |
|---|---|---|---|
| MySQL | **8.0.x**（本机 8.0.46） | 持久数据 / 审计流水（只增不改） | `"C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe" --version` |
| Redis | **≥ 7.2** ⚠️ | 会话 / 排行 / 锁 / 限流 | `"C:/Program Files/Redis/redis-server.exe" --version` |
| Docker Compose | **装机时锁定** | 起步编排（后期才考虑 K8s） | `docker --version` |

> ⚠️ **本机 Redis 是 `3.0.504`（2015 年版 Windows 移植）** —— 落后主线 4 个大版本：
> 缺 `Streams`(5.0) / `ACL`(6.0) / `GEO`(3.2) 等；**且现行 Go 客户端（go-redis v9）按 Redis ≥ 6 设计**。
> **不阻塞 M1**（M1 不用 Redis），但**进入 M2 前须升级到 ≥ 7.2**。

**数据分层**（上游 §3.4）：Redis 可丢 / MySQL 不可丢 / 日志库只增不改。起步**单库单表**，所有玩家表以 `role_id` 为一级键（为将来分片预留）。

### 2.4 配置表与协议

| 应用 | 锁定版本 | 用途 | 校验命令 |
|---|---|---|---|
| Luban | **v5.1.0** | 配置表：Excel/CSV/JSON → C++/Go/Lua/JSON/二进制 | `Luban.exe --version`（**自带 exe，无需 `dotnet` 起**） |
| Protobuf 编译器 | 同 §2.2 | 协议契约落地 | `protoc --version` |

> **为什么必须有配置表工具**（上游 §6.1）：**策划改表不动代码**，且类型错误在**导表阶段**就被拦下，不必等运行时。
> **输入形态**：Excel / CSV / JSON；**输出必须同时产 C++（客户端）与 Go（服务端）** —— 一份表源，两端消费。

### 2.5 脚本与工具

| 应用 | 锁定版本 | 用途 | 校验命令 |
|---|---|---|---|
| Node.js | **22.x** | 门禁脚本（`scripts/check-*.js`） | `node -v` |
| Python | **3.13.x** | 顺表 / 数据清洗脚本 | `python --version` |
| 打包 | **RunUAT**（引擎内） | `BuildCookRun` 出包 | `ls F:/zxc/UE_5.8/Engine/Build/BatchFiles/RunUAT.bat` |
| CI | **GitHub Actions**（待建） | 自动门禁 + 打包 | 见 `.github/workflows/` |

> **门禁脚本跑法**（managed node，与 guild 一致）：
> ```
> N="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node.exe"
> $N scripts/check-data.js
> ```

### 2.6 资产线（**归 GBE，本表只登记接口**）

| 应用 | 位置 | 用途 |
|---|---|---|
| GBE 流水线 | `F:/zxc/Project/gbe-studio` · `gbe-assets` | 资产生成与仓储（**唯一出口**） |
| blender-mcp | 本地 MCP | 建筑建模 |
| ue5-mcp | 本地 MCP | 资产接入游戏 |
| Tripo3D / Meshy | 在线服务 | 图生 3D |
| KitBash3D / Quixel | 素材库 | 模块化建筑 |

> **资产线的真源不在本文件** —— 归 GBE 两仓。本表只登记「dalu 要用到什么」。
> **双端资产预算**（上游 §4.4）：AI 生成**从第一天就遵守**移动端预算，否则 PC 做完要重做一遍。

### 2.7 版本控制与协作

| 应用 | 锁定版本 | 用途 | 校验命令 |
|---|---|---|---|
| Git | **2.55.x** | 版本控制 | `git --version` |
| Git LFS | **3.7.x** | 大二进制（`.uasset` / `.umap` / `.fbx` / 贴图 / 音频） | `git lfs version` |
| IDE（C++） | VS 2022 ／ Rider（可选） | 客户端开发 | — |
| IDE（Go） | IntelliJ IDEA ／ VS Code | 服务端开发 | — |
| 笔记 | Obsidian | 世界观库（`虬渊大陆`）阅读编辑 | — |

> ⚠️ **Git LFS 是硬性要求**（上游 §八标注「⚠️ 必须，不上 LFS 会崩」）——
> UE 的 `.uasset`/`.umap` 是二进制且体积大，**不上 LFS 仓库会在数月内不可用**。
> **LFS 追踪规则必须在首次提交前定**（见 dalu 的 `.gitattributes`），后补需重写历史。
> **用法（怎么装 / 怎么加规则 / 克隆拿不到真身 / 推送撞代理）** → 工程侧手册 **`F:/zxc/Project/qiuyuan-dalu/docs/GIT-LFS.md`**
> —— **本台账只记「版本与是否就绪」，手册只记「怎么用」**，两者各自唯一真源。

### 2.8 移动端（**预留 · 不阻塞任何里程碑**）

| 应用 | 用途 | 现状 |
|---|---|---|
| Android Studio（SDK / NDK / JDK） | Android 出包 | ❌ 未配 |
| Xcode | iOS 出包 | 🚫 **仅 macOS** —— Windows 物理出不了 `.ipa` |

> 详见 **`MOBILE-PLAN.md`**（手机端专案书）与 **ADR-0011**。三条应对已登记待裁，商业化期前处理即可。

---

## 3. 本机现状总盘点（实测 · 2026-09-28）

**✅ 已就绪（13 项）**：UE 5.8.1 · VS BuildTools 17.14.39 · MSVC 14.44.35228（合规）· Windows SDK 10.0.26100.0 · .NET SDK 10.0.302 · **Go 1.27.1** · **Luban v5.1.0** · MySQL 8.0.46 · Node 22.x · Python 3.13 · Git 2.55.0 · Git LFS 3.7.1 · VS Code / IDEA / Obsidian

**⚠️ 需处理（1 项）**：Redis `3.0.504`（过旧 · 不阻塞 M1）

**❌ 未装（2 项）**：protoc（**M4** 才要）· Docker（多进程编排时才要）

**🚫 不可用（1 项）**：Xcode（Windows 上物理不可能）

---

## 4. 缺口与开工前置

### 4.1 M1 前必装 —— ✅ **已清空**（2026-09-28 装机完成）

M1 = **建号**（注册登录 → 建角 → 属性面板）。逐项核对 M1 的真实依赖：

| 缺口 | 为什么 M1 就要 | 状态 |
|---|---|---|
| ~~**Go**~~ | Login 服 + 账号表读写是 M1 的核心交付 | ✅ **已装 1.27.1**（`F:\zxc\go`） |
| ~~**Luban**~~ | M1 的属性面板要读**配置表**（境界表 `realm_level_config` 等） | ✅ **已装 v5.1.0**（`F:\zxc\Luban`） |

> **M1 硬前置至此全部解除** —— 环境侧**无阻塞项**。
> 本表**清空后不再新增**：后续工具一律按 §4.2 的里程碑触发点装（protoc 属 M4）。

> **判据**（沿用「预留」纪律的同一句话）：**「不做」将来会推翻已写的东西 → 现在做；将来只是补配置 → 现在不做。**
> Go / Luban 属于前者（M1 的代码直接依赖它们）；protoc / Docker / Redis 升级属于后者（可后补）。

> **⚠️ protoc 已从本表移出**（v1.1 更正 —— 原判为「M1 前必装」**有误**）：
> ① **引用错误**：原文写「契约层已定 gRPC + Protobuf（`protocol-contract.md`）」——**契约定的是 WebSocket + JSON**（`protocol-contract.md` §1）；
> 　gRPC + Protobuf 出自**上游《技术架构》§3.2**，管的是**内部链路**（`Gateway ↔ 业务服` / `场景服 ↔ 业务服`），不是客户端协议。
> ② **时序错误**：上游 §3.1「起步部署」写明八类 Go 进程**合并为一个**（单体但模块化），
> 　M1 阶段 `Gateway → Login` / `Gateway → Game` 是**进程内 Go 调用**，不跨网络 → **无 gRPC，故无需 protoc**。
> ③ **触发点**：protoc 真正需要是 **M4+** —— 场景服（UE DS）独立成进程、`Scene ↔ Game` 要走 gRPC 时。见 §4.2。

### 4.2 按里程碑装（**不预装**）

| 缺口 | 何时需要 | 触发里程碑 |
|---|---|---|
| **protoc + gRPC 插件**（`protoc-gen-go` / `-go-grpc`） | **内部调用真跨进程时** —— M1 阶段八类 Go 进程合并为单进程，进程内调用用 Go 接口即可 | **M4**（世界/场景/移动） |
| Redis 升级至 ≥ 7.2 | 用到会话 / 排行 / 锁 / 限流时 | M2+ |
| Docker Compose | 多进程编排时 | 服务端多进程拆分时 |
| Android SDK / NDK | 首次出 Android 包时 | 商业化期前 |
| GitHub Actions CI | 门禁跑自动化的第一天 | M1 后立即 |

### 4.3 非工具类前置（**环境之外，同样阻塞开工**）

| # | 事项 | 状态 |
|---|---|---|
| 1 | `qiuyuan-dalu` 仓 `git init` + LFS + `.gitignore`/`.gitattributes` | ✅ **本轮完成** |
| 2 | LFS 追踪规则（哪些扩展名走 LFS）写入 `.gitattributes` | ✅ **本轮完成** |
| 3 | 顶层目录骨架落位（`ue-client/` `server/` `data/` `admin/` `db/` `tools/` `platforms/`） | ✅ **本轮完成**（`ue-client/` 内容待 UE 向导） |
| 4 | `CONVENTIONS.md` 补 **UE 版本锁定条文** | ✅ **本轮完成** |
| 5 | `CONVENTIONS.md` 补 **UE 资产命名前缀**（§6.1） | ✅ **本轮完成** |
| 6 | 装机后**回填本文件的锁定版本**（Go / Luban；protoc 待 M4） | ✅ **本轮完成**（Go 1.27.1 / Luban v5.1.0 —— 见 §1 / §3） |
| 7 | skill 安装（M1 按需，须过 `CONVENTIONS.md` §7.3 准入四步） | ⏭ M1 |
| 8 | 密钥管理纪律（DB 密码 / Tripo-Meshy key **不入库**） | ⏭ M1 |

---

## 5. 维护规则

**什么时候改本文件：**

| 触发 | 动作 |
|---|---|
| 新装一个工具 | 填锁定版本 + 现状 → ✅ → 回填「校验命令」实际输出 |
| 升级锁定版本 | **先落 ADR**（纪律③）→ 再改本文件的锁定值与「现状」 |
| 发现某个「现状」与实测不符 | **立刻改正**（纪律②）—— 误报比缺失更危险 |
| 某个工具被替换 / 弃用 | 保留原行 + 标注「已弃用」，**不删历史**（与 ADR 只追加一致） |

**改完必跑门禁**（本文件的表格受 `R8` 扫）：

```bash
N="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node.exe"
$N scripts/check-data.js
```

**与其它文档的关系：**

| 文件 | 关系 |
|---|---|
| `CONVENTIONS.md` | 本文件的**版本锁定纪律**落在此处（铁律级）；技术约定也在此 |
| `PROJECT-STRUCTURE.md` | §3.1 的「环境前置」**改为指针**指向本文件 |
| `ROADMAP.md` | M1 In scope 第 0 项「建工程骨架」引用本文件的 §4 |
| `MOBILE-PLAN.md` | 手机端出包链路的前置工具引用本文件 §2.8 |
| `DECISIONS.md` | 每次锁定版本变更的 ADR |
