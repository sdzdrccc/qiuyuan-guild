# PROJECT-REVIEW-MiMoDesktop-MiMo-2026-10-19

- **来源**：**本仓派出的 agent**（大人于 2026-10-18 深夜下令「按 §10 做项目群全量审查」，由 MiMo Desktop 承接执行）
- **Agent 名称 / 大模型**：MiMoDesktop / MiMo
- **审查时间**：2026-10-18 23:57 → 2026-10-19 00:20（跨零点）
- **审查对象**：虬渊大陆生态**六仓全集** —— `qiuyuan-guild` · `qiuyuan-dalu` · `gbe-studio` · `gbe-assets` · `虬渊大陆`（上游只读）· `ue-ai-ops`（上游只读）
- **审查范围**：本次覆盖 **§10 项目群全量审查的全部动作** —— 六对象各自站得稳不稳 · 前作 `X-0042` 四条遗留复跑 · §10.3 世界观库专项 · §10.4 三条必产出。
  **没覆盖**：dalu T4/T8 实跑（需带 MCP 的 UE 编辑器，本次编辑器未启）· PIE 五链路与六屏像素复验 · `ws-smoke` 端到端 · gbe-studio CI 在 GitHub 侧实跑 · 虬渊大陆三份台账「仍悬空」条目逐条重判 · `ue-ai-ops` `check.sh --selftest` · 各仓 `AGENTS.md` 逐条语义合规 · dalu 47 份文档逐份读内容（只按客观量定性）。
- **约束确认**：**只读** ✓ **未改任何被审对象** ✓ **删除类只出清单，不执行** ✓ **上游四库一字未动** ✓

> ★ **本文件是「源材料」不是「判定正本」**（`ADR-0032` 三档模型）。
> 判定正本 = `reviews/X-0053.md`（guild 侧 `review` 汇总 · 与台账同号）；本文件是派出 agent 的**独立报告**，供横向对比。

---

## 一、快照（六仓 · 仅标识本次看到哪一刻 ≠ 门禁基线）

| 仓 | HEAD | 工作区 |
|---|---|---|
| `qiuyuan-guild` | `34db3e9` | 脏（`REVIEW-PROCESS.md` v1.7 未提交） |
| `qiuyuan-dalu` | `a60b73e` | 干净 |
| `gbe-studio` | `7007ec5` | 干净 |
| `gbe-assets` | `6275231` | 干净 |
| `虬渊大陆` | `ea0d4fd` | 干净 |
| `ue-ai-ops` | `da78413` | 干净 |

---

## 二、二值判定（六对象 · 禁分数 · ADR-0008）

| # | 对象 | 判定 | 一句话依据 |
|---|---|---|---|
| 1 | `qiuyuan-guild` | **不通过** | 门禁 10/10 绿 + 自检全绿，但 `registry/version-pins.md` 双仓版本钉落后 1~2 版 |
| 2 | `qiuyuan-dalu` | **不通过** | `check-gates` `GATES_EXIT=2`（T4/T8 SKIPPED）⇒ 按其 AGENTS §5.7「T4/T8 实跑且 all green」M1 收口不成立 |
| 3 | `gbe-studio` | **通过** | `version.js check` / `sync-ports --check` / `npm test` 26 通过 / `reconcile.js` 50 类三方吻合 全绿；只读纪律干净 |
| 4 | `gbe-assets` | **不通过** | `kit.categories` 含越 enum 值且 `kit.schema` 无 enum 兜底 ⇒ 真源 kit 照过 smoke = 假绿 |
| 5 | `虬渊大陆`（上游只读） | **通过**（机制运转） | 三份台账在维护；业务错漏 P0/P1/P2/D 全清账无增量；搬运链五项抽查一致 |
| 6 | `ue-ai-ops`（上游只读） | **通过** | `check.sh` 全绿；guild 与 dalu 无通用经验副本（分工合规） |

**项目群总判定：不通过**（对象级 3 通过 / 3 不通过 · P1×3 / P2×4）。

---

## 三、缺陷清单（每条 = 命令 + 实际输出）

### 【P1】

#### D1 · dalu：门禁收口不成立 —— T4/T8 SKIPPED

```text
$ cd F:\zxc\Project\qiuyuan-dalu && cmd /c check-gates.bat
  [门禁 A] WBP_AttributePanelScreen：预期控件 216 个
    ⚠ 读不到编辑器（8000 没在听？）—— ★ 本门禁**没跑到**，不算通过
  -- T8 SKIPPED - editor not running, layout diff did not run
  ============================================================
    RESULT: NOT green - some gates SKIPPED  (skipped is NOT a pass)
  ============================================================
  GATES_EXIT=2
```

⇒ 六屏 430 控件（T4）+ 三屏 216 控件（T8）未核对。
按该仓 `AGENTS.md` §5.7（check-gates all green **且** T4/T8 实跑）⇒ **M1「收口」口径不成立**。
★ 该脚本自己就把「skipped is NOT a pass」写在输出里，**账上却仍标 ✅**（ROADMAP / X-0052）。

#### D2 · dalu：属性面板只有几何、零素材；九宫格卡片底图未做

```text
$ Select-String tools/gen-umg-layout.py -Pattern IMAGE_PLACEHOLDER_SCREENS  ⇒ 含 attribute-panel
$ ue-client/Content/UI/Icons/attribute-panel   ⇒ 目录不存在
    （login 7 枚 · main-hud 34 枚 · create 3 枚 · attribute-panel 0 枚）
$ ue-client/Content/UI/Textures/               ⇒ 仅 T_HUD_Background + 2 张 jpg
$ Select-String QYDMainHUD.cpp -Pattern "圆角|贴图"  ⇒「圆角要等贴图」
```

⇒ 九宫格卡片底图（`X-0026` 判定为「国风 UI 正解」）**至今未落**；`T-0102 §8.4` 未销。

#### D3 · gbe-assets：`kit.categories` 越真源且 schema 无兜底

```text
$ node -e "…kit.json…"                     ⇒ categories 含 "assemblies/building"
$ node -e "…catalog/schema/asset.v2.schema.json…"
    ⇒ root.properties.category 的 enum 共 26 项，**不含 assemblies/building**
$ node -e "…catalog/schema/kit.schema.json…"
    ⇒ categories.items = {type:string, minLength:1}
      ★ 描述写「必须属于 asset.v2 的 category enum」，★ 实现**无 enum**
```

⇒ 描述宣称的约束**没有执法**，真源 kit 带越界值**照样过 smoke**（49 通过 / 0 失败）= **假绿**。

### 【P2】

#### D4 · guild：`version-pins.md` 双仓版本钉落后

```text
$ Get-Content gbe-studio/VERSION  ⇒ 0.6.5
$ Get-Content gbe-assets/VERSION  ⇒ 0.7.0
$ 台账原登记 ⇒ gbe-studio v0.6.4 · gbe-assets v0.6.3   ← 落后 1 版 / 2 版
```

★ gbe-assets 的 **v0.7.0 正是「端口真源账实不符修正」那一笔** —— 修一处账实，自己在 guild 侧留另一处。

#### D5 · dalu：同一份文档两处读数打架

- `ARCHITECTURE.md:243`「✗ 属性面板（波次4）」 vs 同文件 §10 波次 5「属性面板 ✅」
- `T-0102` 状态仍「🟡 进行中」 vs `M1-IMPLEMENTATION.md:1586`「波次 5 ✅」

#### D6 · dalu：已修未复跑的前科（A83 · T-0107）

`T-0107 §7.3` 改画稿后未重投、未跑门禁，卡上却写「门禁全绿」；`T-0108:292` 实录「从 T-0107 起 T8 一直红着」。

#### D7 · guild：`REVIEW-PROCESS.md` v1.7（本审依据）**未提交**

`git status` → `M docs/REVIEW-PROCESS.md`（+112/−3）。规范已写、未入库 ⇒ 别的 agent 从 git 拿到的仍是 v1.6。

### 【P3 · 归组】

- **dalu**：`check-tables` 6 处行尾空单元格 · T3 项目级记忆 3981/3000（132%）· `ARCHITECTURE.md:334` PITFALLS 写「18 条」实为 83 条 · `:327` 归档件未带 `archive/` 路径 · `refs/ueskill1002-VERDICT.md` 引用 0 且 README 未点名 · 最近 10 笔 T 卡 T-0100~T-0107 遗留未销
- **gbe-studio**：`qa/` 空壳目录（违反其 AGENTS §6.2.4）· `PLAN §10` 目录结构与实际不符
- **gbe-assets**：`CONVENTIONS §4` L148 真源写 `asset.schema.json`（实际 `asset.v2.schema.json`）· §4 全集混入 `assemblies/*` 且宣称「CI 校验与 enum 一致」无实现

---

## 四、前作遗留复跑（`X-0042` 四条 · §3 第 6 步）

| # | 遗留 | 复跑证据 | 判定 |
|---|---|---|---|
| 1 | G-6/D-5 仍须 ADR | `DECISIONS.md:1868` **ADR-0027** 已落地 | ✅ 已销 |
| 2 | 断点 D 只登记 A62 | `X-0043:56` §四 六仓系统审计已完成 | ✅ 已销 |
| 3 | UE 三处未真机验证 | 本轮复跑 `check-gates` 仍 `GATES_EXIT=2` | ❌ 未销 → D1 |
| 4 | gbe-studio CI 未实测 | workflow 本机推不出发件端运行记录 | ❌ 未销（非阻塞） |

---

## 五、§10.3 设定冲突台账（上游只读 · 一条一行）

| 编号 | 冲突点 | 类别 | 我方出处 | 设定方出处 | 建议处置 | 待裁 |
|---|---|---|---|---|---|---|
| S-1 | 境内层数：9 层/82 台阶 vs 十层/90 台阶 | **B** | `DECISIONS.md:220-222` · `data-contract.md:48-49` · `protocol-contract.md:361` | `10-MMO化/境界基础属性.md:15`（V1.66） | 摆两案：A 改契约按十层（82→90 行重算）／ B 维持 82、请上游复核 §10.1 | **是** |
| S-2 | 上游页内九层残留与自家 V1.66 打架 | **A** | —（我方仅消费） | 同页 `:339` `:358` `:211-225` vs `:15` | 上游自改清残留；清后 S-1 即收敛 | 否（归上游） |
| S-3 | 八系攻防加值口径未收口 | **C** | `protocol-contract.md:219`「未裁 ⇒ 八元素全 null」 | `角色创建.md:27`「主 +25% 副 +10%」 | 摆两案：A 按上游落 ADR 收口／ B 保持 null 待标定 | **是** |
| S-4 | 体质准入：下游删五行灵体 | **B** | ADR-0021 · `CREATION-DATA.md:160` | `角色创建.md:46` · `流派与技能.md:18` | 已由 ADR-0021 裁定，差异备查 | 否 |

**搬运链抽查通过 5 项**：灵根八系枚举 · 体质四档 90/9/0.9/0.1 · 觉醒概率 0.5/1.5/5/7/22/39/25 · `realm_id` 1~9 · 命中上限 99% —— 全部一致。
**旧台账增量**：业务错漏清单无增量；设定冲突仍悬空 9 条；缺失清单仍悬空 B15/17/18/19/21/22 · C21/23/24/25 等。

---

## 六、§10.4 三条必产出

### ①《文档去留总表》（dalu · 47 份 · 仅列不删 · 排序只依据客观量）

| 建议 | 文件 |
|---|---|
| **归档候选（2）** | `refs/ueskill1002-VERDICT.md`（引用 0 + README 未点名 = 全表唯一双零）· `proposals/done/X0029`（已采纳） |
| **待大人裁（1）** | `proposals/X0035`（主菜单 8 vs 15 仍未裁） |
| **保留 + 修（3）** | `PITFALLS.md`（实为 83 条，ARCHITECTURE 误写 18）· `M1-IMPLEMENTATION.md`（读数过时）· `ARCHITECTURE.md`（3 处过时） |
| **其余 41 份** | 保留（含 `docs/refs/` 4 份外部原文归档件 · `features/*` 19 份按功能切，不冗余） |

> ★ 本项目文档尚未出现「该合并的同类项」；删除类**只出清单不执行**。

### ②《机制缺口清单》（治「开发总被打断」）

| # | 缺口 | 该写进哪份既有文档 |
|---|---|---|
| M-1 | **「门禁绿」与「界面 ✅」是两套账，无对账机制**（D1/D5/D6 三次同型） | dalu `AGENTS.md` §5 —— 建议：标 ✅ 前必须附 `check-gates` 实际退出码 |
| M-2 | **版本钉靠人抄，抄漏无人拦**（D4；`version-pins.md:126` 自注「可并入门禁但默认不并」） | guild `version-pins.md` §四 —— 建议并入 `check-version-pins.js` |
| M-3 | **描述宣称的约束无执法 = 假绿**（D3） | gbe-assets `AGENTS.md` §2.1 —— 描述含「必须/禁止」须有 enum/required/测试兜底 |
| M-4 | **「本轮就开 U-\*」的建议会沉掉**（X-0052 建议开六条动作清单 U-\*，至今未开） | guild `ROADMAP.md` §7 —— 建议加「谁去开卡」责任人字段 |
| M-5 | **上游三份台账悬空条目无优先级** | 虬渊大陆 `00-总览/`（只读，本审只登记不改） |

### ③《UI 还原差异清单》（治「UI 还原不了画稿」· 断点位置）

| 画稿要什么 | 实现到哪 | **断点** |
|---|---|---|
| 九宫格卡片底图（决定成败的两张） | 无 | `Textures/` 仅 3 文件；`QYDMainHUD`「圆角要等贴图」 |
| 远山/太极/仙鹤/光束/雾（背景 5 张） | 无 | 缺 5 张背景 |
| 四角花 `T_Corner×4` | 仅 main-hud `icon-corner-*` 4 枚 | login / attribute-panel 未挂 |
| 渐变标题 `T_Title_Gradient` | 纯金近似 | 未落贴图 |
| 图标 `T_Icon_User/Lock/Smartphone/ShieldCheck` | login 7 枚 rail 图标（非同名） | 契约四枚未逐一对上 |
| 技能排 7 格 | `icon-skill-0..5` 共 6 枚 | 缺 1 格 |
| 角色页 5 法宝槽/雷达/立绘 | 0 图标，全透明占位 | `T-0102 §8.4` 未销 |
| 聊天输入框可点 | Border + 占位字 | 待换 `EditableTextBox` |

⇒ **当前处在「≈60%」档**（结构能做、质感未补）；到 ≈90% 需补齐上表 8 项；到 100% 只有 CEF 那条路（而 CEF 在 `X-0026` §2 判为 M1 ❌ 暂不做，**不矛盾**）。

---

## 七、可复现验证证据

```bash
# guild（本审基线）
cd F:/zxc/Project/qiuyuan-guild && node scripts/run-all-checks.js --quiet   # 10/10 绿
node scripts/check-records.js --self-test                                   # 102/102 反向全绿
# dalu
cd ../qiuyuan-dalu/server && go build ./... && go vet ./...                 # BUILD/VET EXIT=0
cd .. && node tools/check-tables.js                                        # 0 错 / 6 警告
cmd /c check-gates.bat                                                      # RESULT: NOT green · GATES_EXIT=2 ★
F:/zxc/Git/bin/bash.exe ./data/gen.sh && git status --short                 # 空 ⇒ 幂等
# gbe-studio
cd ../gbe-studio && node scripts/version.js check && npm test               # 全绿 · 26 通过
# gbe-assets
cd ../gbe-assets && node packages/schema/test/smoke.js                      # 49 通过 / 0 失败（★ 假绿，见 D3）
# 版本钉独立复算
cat ../gbe-studio/VERSION ../gbe-assets/VERSION                             # 0.6.5 / 0.7.0
```

---

## 八、本次未覆盖（必填）

1. **dalu T4/T8 实跑** —— 需带 MCP 的 UE 编辑器；PIE 五链路 / 六屏像素 / `ws-smoke` 端到端 / `server` 单测全量 / LFS 大文件内容 均未做。
2. **gbe-studio CI 在 GitHub 侧实跑**。
3. **虬渊大陆三份台账「仍悬空」条目逐条重判** —— 只登记悬空计数与本轮增量。
4. **`ue-ai-ops` `check.sh --selftest`**、`references/` 逐条来源抽查、hooks 安装状态。
5. **各仓 `AGENTS.md` 逐条语义合规**（只核与本轮缺陷相关的条款）。
6. **dalu 47 份文档逐份读内容** —— 只按客观量（引用数/点名/门禁）定性。
7. **产品方向类待裁**：装备要不要开发 · 主菜单一级入口 8 vs 15 · 角色页五条小裁定 —— 本报告**不代裁**。

---

## 九、遗留去向（逐条）

| # | 项 | 去向 |
|---|---|---|
| 1 | D1 起编辑器 + 装 MCP，真跑 T4/T8 到 all green | dalu（B4 前置） |
| 2 | D2 补九宫格底图 + 属性面板素材层 8 项 | dalu + GBE 资产线 |
| 3 | D3 `kit.schema` 加 enum（或跨双 enum 校验）+ smoke 反向用例 | gbe-assets（上游只读，开跨库卡） |
| 4 | D5 修 `ARCHITECTURE.md` 三处过时 | dalu |
| 5 | D6 改画稿后必须重投 + 跑门禁 | dalu（写进 PITFALLS） |
| 6 | D7 提交 `REVIEW-PROCESS.md` v1.7 | guild · 待大人点头 |
| 7 | S-1 境内层数 · S-3 八系加值 | **大人**（摆案已给） |
| 8 | U-0001~U-0005 五条上游订正仍全「待开卡」 | 上游虬渊大陆（只读，走 `qiuyuan-vault-iterate`） |
| 9 | S-2 上游页内九层残留（A 类） | 上游自改 |
| 10 | 《文档去留》归档候选 2 份 | dalu · 只出清单不执行 |

---

> ★ **执行环境指纹**（仅供回溯 · ADR-0007 · 禁据此排名）：
> Go 1.27.1 · Node 22.x · UE 5.8（本次未启动）· Git 2.55 · Git Bash `F:\zxc\Git` · PowerShell 5.1
> Agent：MiMoDesktop · 大模型：MiMo · 日期：2026-10-19
