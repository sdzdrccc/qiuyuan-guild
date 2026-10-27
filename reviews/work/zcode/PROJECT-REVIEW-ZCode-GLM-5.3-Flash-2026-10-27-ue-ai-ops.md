# ue-ai-ops 复审源材料 —— X-0053 三条未通过项复跑 ＋ 机械判据（2026-10-27）

- 状态：已完成（待主 agent 汇编进判定正本）
- 来源：ZCode · 大人在 ZCode 会话派出
- Agent 名称：ZCode-ue-ai-ops-reviewer
- 大模型：GLM-5.3-Flash
- 审查时间：2026-10-27
- 审查对象：`ue-ai-ops` @`da78413`（`F:/zxc/Project/ue-ai-ops` · 参考只读）
- 审查范围：★ X-0053 §十一 U-1.1 / U-1.2 / U-1.3 三条**逐项复跑** ＋ 修复载体核验（该仓 git log）＋ 该仓自身门禁 `check.sh`（全跑 ＋ `--selftest`）＋ 上次判「通过」的两点（§4·21 / §4·22 条目与指针）复验 ＋ 纪律 3 之外抽查（本机用户名 / 用户目录路径、判据反向用例在位）。没审什么见「本次未覆盖」。
- 硬约束确认：被审对象**只读** —— 本次对 `ue-ai-ops` 未改一字，无 commit / push / checkout；本次唯一写入的文件是本报告。
- 与前作关系：X-0053 §十一（第二审阅者补记，判 ue-ai-ops 不通过）的**复审** —— 只复跑其未通过项 ＋ 常规机械判据，不重抄已成立结论。

---

## 一、判定（二值表）

**总判定：不通过。** U-1 三条全部未销，该仓零修复动作。

| # | 审查项 | 判定 | 一句话依据 |
|---|---|---|---|
| 1 | U-1.1 复跑（活文档含项目痕迹） | **不通过** | 仍命中 4 行 / 2 个文件（`references/07` ＋ `docs/evidence/`），一字未改 |
| 2 | U-1.2 复跑（check.sh 模式盲区） | **不通过** | 模式集仍只有 4 条，无「项目名」token、无坑编号 `A\d+`；A59 实际在场且被放行 |
| 3 | U-1.3 复跑（LICENSE / README 漂移） | **不通过** | `LICENSE:88` 仍写「三条硬纪律」；README 内容清单仍无 `references/07` |
| 4 | 修复载体 | **未启动** | `git log --since=2026-10-19` 为空，HEAD 仍是 2026-10-17 的 `da78413` |
| 5 | 该仓门禁 `check.sh` 全跑 | 通过（脚本自身） | 全绿 EXIT=0 —— ★ 但见第 2 行：**这绿不能当「纪律 3 通过」的证据** |
| 6 | `check.sh --selftest` | 通过 | 5 条反向用例全过 —— ★ 均不含「项目名」用例（同 U-1.2 盲区） |
| 7 | 上次通过两点复验（§4·21 / §4·22） | **通过（无回归）** | 条目在 `references/04:638/667`，指针在 `references/03:128-131`，均在位 |
| 8 | 抽查：本机用户名 / 用户目录路径 | 通过 | `Administrator`、`C:.Users` 全仓（除 scripts/）0 命中 |

---

## 二、U-1 三条复跑结果

### 前置 · 修复载体核验 —— 零提交，三条必然仍开着

```bash
$ git -C F:/zxc/Project/ue-ai-ops log --since=2026-10-19 --oneline
（空输出 —— 2026-10-19 之后零提交）

$ git -C F:/zxc/Project/ue-ai-ops log -1 --format="%h %ad %s" --date=iso
da78413 2026-10-17 00:31:55 +0800 docs(03/04): 提炼两条通用判据 —— 同进程「删净重建」不清旧树（§4·21）· play session 期间改资产（§4·22）

$ git -C F:/zxc/Project/ue-ai-ops status --short
（空输出 —— 工作树干净，与 HEAD 一致，不存在「改了没提交」的中间态）
```

### U-1.1 活文档含项目痕迹 —— 仍不通过（4 行 / 2 文件）

```bash
$ grep -rn "qiuyuan-dalu\|QiuyuanDalu\|ue-client" F:/zxc/Project/ue-ai-ops --exclude-dir=.git
F:/zxc/Project/ue-ai-ops\references\07-crash-bisection-headless.md:61:项目侧已沉淀：`qiuyuan-dalu/tools/edit-wbp.py`（MODE=delete/collapse + 复核树）、
F:/zxc/Project/ue-ai-ops\references\07-crash-bisection-headless.md:84:> ★ 本节 2026-10-13 由**断点 D 审计**补入：此前这条判据只住在项目侧（`qiuyuan-dalu` 的
F:/zxc/Project/ue-ai-ops\docs\evidence\compile-livecoding-experiment.md:89:2) 编译：Build.bat QiuyuanDaluEditor Win64 Development -Project=<uproject> -WaitMutex
F:/zxc/Project/ue-ai-ops\docs\evidence\compile-livecoding-experiment.md:113:grep "LogLiveCoding" ue-client/Saved/Logs/QiuyuanDalu.log | tail -5
```

- 当前实测 **4 行 / 2 个文件**（含 `.git` 一起搜，命中的文本文件也仍只有这 2 个）。
- **与上次「6 处」的差异说明**：上次清单里的 `references/07:85` 与 `:87` 两行，按当前文件内容只含坑编号 `A59`，**不含**这三个 token（已用 `sed -n '58,90p'` 逐行核对）—— 属上次列证时把续行/上下文行一并列入。两次计数**指向同一违规事实**，不影响判定。
- 判据出处：该仓 `AGENTS.md` §2 **纪律 3**「不含具体项目痕迹（盘符路径 / 项目名 / 具体端口 / 记录编号）」。`references/07` 是手册（活文档）、`docs/evidence/` 是现行证据落点（该仓 `check.sh` 注释自陈「扫描范围已修正为扫全仓」），纪律 5 的「历史记录不改」**不豁免**。维持 X-0053 的判定。

### U-1.2 check.sh 判据盲区 —— 仍不通过

**① 模式集仍无「项目名」token、无坑编号模式：**

```bash
$ grep -n "scan_all" F:/zxc/Project/ue-ai-ops/scripts/check.sh
57:scan_all "[A-Za-z]:[\\/][^/\\ ]" "盘符路径"
60:scan_all "\b[T-X]-00[0-9]{2}\b|ADR-00[0-9]{2}" "记录卡号"
63:scan_all "\b(64892|50664|3306|6379)\b" "本机特有端口"
66:scan_all "Administrator" "本机用户名"

$ grep -c "qiuyuan-dalu\|QiuyuanDalu\|ue-client" F:/zxc/Project/ue-ai-ops/scripts/check.sh
0        ← 项目名 token 在模式集中的出现次数：0
```

**② 盲区被活体实demo —— 门禁全绿与违规共存：** 第一节机械判据里 `check.sh` 全绿（EXIT=0），而上面 U-1.1 同一工作树上 grep 命中 4 行。**「全绿」只证明「扫了」，不证明「扫得全」**（REVIEW-PROCESS §6 坑 9「未覆盖 ⇒ 静默」）。

**③ 坑编号 `A\d+` 仍不在模式集内，且 A59 实际在场被放行：**

```bash
$ grep -rn "A59" F:/zxc/Project/ue-ai-ops/references/ F:/zxc/Project/ue-ai-ops/docs/
F:/zxc/Project/ue-ai-ops\references\07-crash-bisection-headless.md:85:> `docs/PITFALLS.md` A59），本文原只有一句「项目侧留有专文档」—— ★ 方向倒了：
F:/zxc/Project/ue-ai-ops\references\07-crash-bisection-headless.md:87:> ★ 分工：**判据在本文**（任何 UE 工程用得上）· **证据链在项目侧 A59**（那台机器的崩溃包与变异台账）。
```

（`A59` 不匹配 `\b[T-X]-00[0-9]{2}\b|ADR-00[0-9]{2}`，门禁不拦。）

**④ 反向用例仍为 5 条、均不含项目名用例：** `--selftest` 输出只有 `[A] 盘符路径`、`[B] 记录卡号`、`[C] 恢复全绿`、`[D] 坏表`、`[E] 转义竖线好表` 五条（全文见第三节），无「含项目名必拦」用例。维持 X-0053 U-1.2 判定与修法（补项目名 token 表 ＋ 正反两条反向用例）。

### U-1.3 文档漂移 —— 仍不通过（两处原样）

**① LICENSE:88 仍写「三条硬纪律」，且指向已不存在的 README §4.2（实为五条、已搬进 AGENTS.md §2）：**

```bash
$ sed -n '88p' F:/zxc/Project/ue-ai-ops/LICENSE
★ 贡献前请读 `README.md` §4.2 的三条硬纪律 ——

$ grep -n "三条\|五条" F:/zxc/Project/ue-ai-ops/LICENSE F:/zxc/Project/ue-ai-ops/README.md
F:/zxc/Project/ue-ai-ops\LICENSE:88:★ 贡献前请读 `README.md` §4.2 的三条硬纪律 ——
F:/zxc/Project/ue-ai-ops\README.md:110:★ 本仓是什么 / 往哪写 / **五条硬纪律** / 改完怎么验 / 自检清单，**都在那里**。
F:/zxc/Project/ue-ai-ops\README.md:116:★ **顺带修一处**：原 §4.2 标题写「**三条**硬纪律」，而表里其实有 **5 条** ⇒ 现已按 5 条如实写。
F:/zxc/Project/ue-ai-ops\README.md:133:★ 欢迎补案例与判据，但请遵守 [`AGENTS.md`](AGENTS.md) **§2 的五条硬纪律** ——
```

README 自己 116 行都写明「现已按 5 条如实写」，唯独 LICENSE 没跟着改 —— 双重过时（条数 ＋ 死指针）。

**② README 内容清单仍未列 `references/07`：**

```bash
$ grep -n "references/07\|07-crash" F:/zxc/Project/ue-ai-ops/README.md
（EXIT=1 —— 无命中；README §2 表格只列到 references/06）

$ grep -n "references/07" F:/zxc/Project/ue-ai-ops/SKILL.md
391:| ★★ `references/07-crash-bisection-headless.md` | ★★ **崩溃变异体二分**：…
```

维持 X-0053 U-1.3 判定。

---

## 三、机械判据

### 1. `bash scripts/check.sh` 全跑 —— 脚本自身全绿

```bash
$ cd F:/zxc/Project/ue-ai-ops && bash scripts/check.sh
[1] 通用性（★ 全仓扫描 · 排除 scripts/ 自身）
    ✓ 无盘符路径
    ✓ 无记录卡号
    ✓ 无本机特有端口
    ✓ 无本机用户名
[2] 结构
    ✓ SKILL.md ✓ README.md ✓ INSTALL.md
    ✓ references/01-compile-and-launch.md ✓ references/04-avoiding-pitfalls.md
    ✓ references/05-official-mcp-and-toolsets.md
    ✓ scripts/find-ue-editor-info.sh ✓ scripts/sync-to-skill.sh ✓ scripts/mcp-session-probe.py
[3] Markdown 表格列数
    ✓ 表格列数一致
[4] ★ 提示：…应标来源
    ✓ 未发现明显绝对化措辞
   结果: 全绿
===EXIT=0===
```

★ **判读**：EXIT=0 属实，但因 U-1.2 模式盲区，此绿**不构成**「纪律 3 通过」的证据（同工作树 grep 4 命中）。

### 2. `bash scripts/check.sh --selftest` —— 5 条反向用例全过

```bash
$ cd F:/zxc/Project/ue-ai-ops && bash scripts/check.sh --selftest
   [A] 塞入盘符路径 ⇒ 判据① 应报错      ✓ 已拦（符合预期）
   [B] 塞入记录卡号 T-0099 ⇒ 判据① 应报错  ✓ 已拦（符合预期）
   [C] 移除后应恢复全绿                   ✓ 已恢复（符合预期）
   [D] 塞入列数不一致的表 ⇒ 判据③ 应报错   ✓ 已拦（符合预期）
   [E] 塞入**带转义竖线**的好表 ⇒ ★ 不得误报 ✓ 未误报（符合预期）
   ★ 结论：五条反向用例全过 ⇒ ★ 判据真的在干活
===EXIT=0===
```

★ 反向用例数 = **5**，与上次一致；**仍无「项目名」用例**。

### 3. 上次判「通过」两点复验 —— 无回归

```bash
$ grep -n "4·21\|4·22" F:/zxc/Project/ue-ai-ops/references/03-umg-and-assets.md
128:  · ★ **不能有 play session 在跑**（★ 会话期间改资产 ⇒ 崩溃报告 ＋ …）⇒ **§4·22**；
131:    （★ 同一个编辑器进程里「删掉重建」**不会清空旧树**，…）⇒ **§4·21**。

$ grep -n "4·21\|4·22" F:/zxc/Project/ue-ai-ops/references/04-avoiding-pitfalls.md
638:## 4·21、★★★ 「删掉重建」在**同一个编辑器进程里不会清空旧树** —— ★ 做加法永远看不出来，★ 只有做减法才暴露
667:## 4·22、★★★ **有 play session 在跑时改资产**：三条后果全都不报错，★ 而整条流水线一路绿
688:  **§4·21**（同一批投递里另一条"全绿但树是旧的"）。
```

条目（`references/04:638/667`）与指针（`references/03:128-131`）均在位 —— X-0053 §一 行 6 的通过依据（「指针在位 · §4·21/§4·22 在位」）**复验成立，无回归**。

### 4. 纪律 3 之外抽查 —— 无新违规

**① 不含本机用户名 / 用户目录路径（独立于门禁自查）：**

```bash
$ grep -rn "Administrator" F:/zxc/Project/ue-ai-ops --exclude-dir=.git --exclude-dir=scripts
（EXIT=1 —— 无命中）
$ grep -rnE "C:.Users" F:/zxc/Project/ue-ai-ops --exclude-dir=.git --exclude-dir=scripts
（EXIT=1 —— 无命中）
```

**② 纪律 2「检查器必须带反向用例」在位**：`--selftest` 5 条真实存在且全过（见上）—— 该仓门禁的反向用例义务**履约中**，盲区在模式集本身（U-1.2），不在用例机制。

**③ 纪律 1 软提示级抽查**：`check.sh [4]` 报「未发现明显绝对化措辞」；独立复跑 `grep -rnE "必然会|一定不会|永远不会|必定" references/` 输出为空。语义级「断言是否都指了来源」未逐条核（见「本次未覆盖」）。

---

## 四、缺陷清单（本次新发现）

### N-1【轻微】SKILL.md / README 的判据索引均未收录 §4·21 / §4·22

```bash
$ grep -n "删净\|旧树\|会话期间\|保存通道" F:/zxc/Project/ue-ai-ops/SKILL.md F:/zxc/Project/ue-ai-ops/README.md
F:/zxc/Project/ue-ai-ops\SKILL.md:391:| ★★ `references/07-crash-bisection-headless.md` | …
（唯一命中是 references/07 那一行；references/03、04 的索引行均未提这两条判据）

$ grep -n "4·2[0-9]" F:/zxc/Project/ue-ai-ops/SKILL.md
（EXIT=1 —— 无命中）
```

- `SKILL.md` §5.5 只列到 §4·9 ~ §4·16；§7 参考文档表里 `references/03`（:385）与 `references/04`（:386）两行的内容摘要都没提这两条 2026-10-17 新增的判据。README §2 内容清单同。
- **定性**：与 U-1.3 同族的内容清单漂移（判据已进正文、索引没跟上）。★ 它**不是** X-0053 通过项的回归 —— X-0053 当时核的是「指针 ＋ 条目在位」，未要求索引覆盖；本次按任务书核对「索引是否含它们」，实测不含。
- **去向**：并入 ue-ai-ops 自修批（见第五节），与 U-1.3 同一笔修。

除 N-1 外，本次常规机械判据**无其他新缺陷**。

---

## 五、遗留（给去向）

1. **U-1.1 / U-1.2 / U-1.3 ＋ N-1 → `ue-ai-ops` 上游自修**（铁律一，本仓不代写）。X-0053 §U-3 已给全修法；N-1 并入同一笔：`SKILL.md` §7 两行索引各补一句话（或 §5.5 扩为「…与 §4·21/§4·22」）、`README` §2 同步。修后按该仓 `AGENTS.md` §4 跑三件套：`bash scripts/check.sh` ＋ `--selftest` ＋ `bash scripts/sync-to-skill.sh`，并按 U-1.2 的修法给项目名 token 补正反两条反向用例。销号时逐条复跑本报告第二节的命令。
2. **汇编方动作提示**：本报告落盘 `reviews/work/zcode-ue-ai-ops/` 后，按 REVIEW-PROCESS §10.5 需重跑 `node scripts/gen-review-index.js --write`（`reviews/INDEX.md` 是派生视图）—— 由主 agent 执行，不在本 agent 权限内。

---

## 本次未覆盖

- `references/01~06` 全文逐条「断言有来源」核查（纪律 1 只做到软提示级 ＋ 独立 grep 抽查，语义层未逐条读）。
- `pre-push` hook 实跑（本次不推送，未触发）；GitHub 侧 CI 实跑。
- `scripts/` 其余脚本功能正确性（`find-ue-editor-info.sh` / `mcp-session-probe.py` / `install-hooks.sh` / `hooks/`）；`sync-to-skill.sh` 的 SKILL.md 副本一致性全文比对（只对索引行做了点查）。
- `LICENSE` 其余条款、`.github/` 工作流内容、`INSTALL.md` 正文。
- UE 编辑器侧任何实测（本对象为纯文档/脚本仓，无可实测行为面）。
- `references/02` / `03` 对第三方插件 `UmgMcp` 与纪律 4 的张力 —— X-0053 §U-4 已记「待裁、未定论」，本次未重裁。

---

## 执行环境（可选 · 仅供回溯，不作质量判据）

- 工具：Git Bash on Windows（环境内 `grep` 实为 ugrep：bracket 表达式 `[/\]` 会报 mismatched，已改拆等价命令重跑复核；文中命令均为最终可复跑形态）。
- 模型：GLM-5.3-Flash
- 日期：2026-10-27
