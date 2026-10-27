# ue-ai-ops 复审（2026-10-27）—— U-1 三项复跑 · X-0053 §十一 补覆盖 · 文档去留总表

- **来源**：Qoder Desktop 主 agent 派出的 sub-agent（内部源材料，非判定正本，不自称 guild 侧 review）
- **Agent 名称**：QoderDesktop sub-agent（单对象审阅：ue-ai-ops）
- **大模型**：Qoder Desktop · 底层模型不披露
- **审查时间**：2026-10-27
- **审查对象**：`ue-ai-ops` = `F:/zxc/Project/ue-ai-ops`（UE 通用经验库，对本生态只读）
- **与前作关系**：**复审** —— 正本 `reviews/X-0053.md` §一 判「通过」、§十一（第二审阅者补记）主张改判「不通过」；本份**逐条复跑其 U-1.1/U-1.2/U-1.3** 并**补覆盖其 U-4 自陈未复核项**。§3 六步 / §5 纪律 / §6 坑（1/8/9）/ §10 均依 `docs/REVIEW-PROCESS.md` v1.9。
- **审阅快照**：ue-ai-ops HEAD `da78413`（`git log -1` 实测 `2026-10-17 00:31:55 +0800`；★ 注：派单写「2026-10-18」，实测提交日期为 10-17，不影响「零新增」结论）；`git log --since=2026-10-19 --oneline | wc -l` = **0** ⇒ **2026-10-19 之后零提交**；`git status --short` 输出为空 ⇒ 工作区干净。guild 侧本报告落 `reviews/work/qoderdesktop-ue-ai-ops/`。
- **覆盖**：U-1.1/1.2/1.3 逐条复跑 ＋ 独立复算（更宽痕迹扫描、自建反向用例）；`check.sh` 常规跑 ＋ `--selftest` 实跑（在 /tmp 克隆内，避免向被审仓写临时文件）；`pre-push` 三层触发实测（本地 bare 仓模拟推送）；CI GitHub 侧 REST API 取证；两份 skill 副本逐字节对比；`references/01~06` 来源抽查（01/02 全文 ＋ 03/04/05 高风险节 spot-check ＋ 06 全文头部）；§4·17~22 项目值泄漏检查；文档去留总表。
- **未覆盖**：见「本次未覆盖」节（必填）。
- **硬约束确认**：只读 ✓（原仓零写入，`--selftest` 与注入类反向用例全部在 `/tmp` 克隆内执行，用毕已删）／未改被审对象 ✓／未 commit / 未 push 到 origin ✓／未跑 `sync-to-skill.sh`（会写盘）✓／删除搬家类**只出清单、未执行** ✓。

---

## 一、对象与判定（二值）

| # | 审阅项 | 判定 | 依据（命令＋输出 / 文件:行） |
|---|---|---|---|
| 1 | **总体：X-0053 §一「通过」是否成立** | ★ **不通过** | 下述 U-1.1/U-1.2/U-1.3 三项全部**未销**且取证成立 ⇒ 支持 §十一 的改判 |
| 2 | U-1.1 纪律 3 项目痕迹 | **未销 · 主张成立**（且本审**多查出 1 处**，见二节） | `grep -rn "qiuyuan-dalu\|QiuyuanDalu\|ue-client" --include='*.md' .` = 4 行直接命中；逐行读 07:84-87 确认 85/86/87 亦含项目记录号/私仓指针 ⇒ 合计 **7 行**（原判 6 行 ＋ 新增 07:86） |
| 3 | U-1.2 门禁盲区（全绿 ≠ 纪律 3 通过） | **未销 · 主张成立**（本审用**自建反向用例独立证明**，非仅读模式集） | 见四节 [R1]：塞入 `qiuyuan-dalu`＋`A59` ⇒ check.sh 判据①四项全 ✓ 放行 |
| 4 | U-1.3 文档漂移（LICENSE / README 清单） | **未销 · 主张成立** | `sed -n '88p' LICENSE` = 「§4.2 的三条硬纪律」；README §2 内容清单（约 60~71 行）列 01~06 无 07；`grep -rn "三条硬纪律"` 全仓唯一命中即 LICENSE:88 |
| 5 | §十一（第二审阅者）自身取证是否成立 | **成立**（未发现任何不实项） | 其 6 处行号、check.sh 模式四类、LICENSE/README 漂移 —— 全部由本审独立复跑命中（含其 U-4 自陈的复跑范围） |
| 6 | U-4 补覆盖①：01~06 来源抽查（纪律 1） | **通过** | 见三节表；抽查未发现「写得像事实、其实无来源且未标推测」的断言 |
| 7 | U-4 补覆盖②：`--selftest` 实跑 | **通过**（5/5 绿，且五条用例**均真实可测**） | 见四节 [S] |
| 8 | U-4 补覆盖③：pre-push 真装上并触发 | **通过** | 见四节 [P] |
| 9 | U-4 补覆盖④：CI 在 GitHub 侧真跑过 | **通过** | 见四节 [C] |
| 10 | 源仓 ↔ skill 副本同步 | **通过** | 见三节表（两处副本逐字节一致） |
| 11 | §4·17~22 等新规约有无「项目值当通用做法」（纪律 3 另一形态） | **通过** | 见三节表 |
| 12 | 纪律 4 张力（`UmgMcp` / `UmgSetSubsystem` 等第三方插件名） | **待裁 · 未定论**（沿用 §十一 U-4 的判定，本审复核后无新证据推翻） | `03:255-259` 通道分工表点名 `UmgMcp`；`07` §2-3 通篇其子系统 API —— 属「针对具体第三方依赖」还是「以插件为例的通道判据」，两读法都有人持，**不自造裁** |

**★ 对争议（「U-1 应改判不通过」）的独立结论**：**支持改判「不通过」**。三项缺陷均**可复现、现行、非历史记录豁免**（证据详见二节），且依赖它们给出「通过」的 `check.sh` 绿灯已被本审**独立反向用例证明扫不到纪律 3 的核心面**（坑 9「未覆盖→静默」实锤）。本次是「判据本身有争议」的正解路径：**不采信任何一方的转述，两边都重跑**。

---

## 二、X-0053 §十一 U-1.1 / U-1.2 / U-1.3 复跑（三态：已销 / 未销 / 复发）

> 该仓 10-19 后**零提交**（快照节已证）⇒ 三态只可能是「已销」或「未销」；实际全部**未销**。逐条：

### U-1.1（项目痕迹违反纪律 3）—— **未销**，且独立复算**+1 处**

```bash
$ grep -rn "qiuyuan-dalu\|QiuyuanDalu\|ue-client" --include='*.md' .
./docs/evidence/compile-livecoding-experiment.md:89:2) 编译：Build.bat QiuyuanDaluEditor Win64 Development -Project=<uproject> -WaitMutex
./docs/evidence/compile-livecoding-experiment.md:113:grep "LogLiveCoding" ue-client/Saved/Logs/QiuyuanDalu.log | tail -5
./references/07-crash-bisection-headless.md:61:项目侧已沉淀：`qiuyuan-dalu/tools/edit-wbp.py`（MODE=delete/collapse + 复核树）、
./references/07-crash-bisection-headless.md:84:> ★ 本节 2026-10-13 由**断点 D 审计**补入：此前这条判据只住在项目侧（`qiuyuan-dalu` 的
```

再读 `07:85-87`（token grep 抓不全的行，人工核对命中「记录编号」类痕迹）：

- `07:85`：`docs/PITFALLS.md` **A59**（dalu 侧坑号）；
- `07:86`：★ **按 guild `AGENTS.md` §11.2**（私仓名＋章号 —— **§十一 原判 6 处漏计此行为第 7 处**，本审独立复算新增）；
- `07:87`：证据链在项目侧 **A59**。

⇒ 合计 **7 行 / 2 个文件**，与 §十一 主张的 6 行**行号全部吻合**（其 84/85 是把一个跨行句拆计，口径成立），另**加 1 处**（07:86）。

**「纪律 5 历史豁免」不成立的独立论证**（比 §十一 更进一步）：
1. `docs/evidence/compile-livecoding-experiment.md` **自己的头部**（约 12~16 行）白纸黑字写「★ 其中的盘符路径与人名已做**脱敏**（`<EngineRoot>`/`<ProjectRoot>` 占位）★ 指向作者私有仓库的记录编号也已移除」—— 残留 `QiuyuanDaluEditor`/`ue-client/` 是**脱敏工序的漏网**，不是刻意留档；
2. 该仓**自己的机制**认定 evidence 目录受纪律 3 管：`check.sh` 注释明写初版漏扫 `docs/evidence/` 是漏洞并改为全仓扫；`--selftest` 的临时用例**专门种在 `docs/evidence/`**（`check.sh:154` 注释：「★ 这正是初版漏扫的目录，用它才能测出范围问题」）；
3. `references/07` 是**手册（活文档）**，纪律 5 只对「历史记录（评估/复盘/当时的实测）」豁免，手册不在其列。

### U-1.2（check.sh 判据①无「项目名」模式 ⇒ 全绿不能作为纪律 3 通过的证据）—— **未销**，独立证明

读 `scripts/check.sh:56-66`：判据①仅四类模式 —— 盘符 `[A-Za-z]:[\\/]`、卡号 `\b[T-X]-00[0-9]{2}\b|ADR-00[0-9]{2}`、端口 `(64892|50664|3306|6379)`、用户名 `Administrator`。**不含项目名**。

本审不止于读模式，做了**自建反向用例**（/tmp 克隆内，见四节 [R1]）：文件里只写 `qiuyuan-dalu` 与 `A59` ⇒ 判据①四项全 ✓、总结果「全绿」 ⇒ **§十一 的推论被实测坐实：现存的 check.sh 绿灯确实证明不了纪律 3**。

### U-1.3（LICENSE / README 漂移）—— **未销**，两处原样在

```bash
$ sed -n '88p' LICENSE
★ 贡献前请读 `README.md` §4.2 的三条硬纪律 ——        # 实为五条（AGENTS.md §2 表格 5 行），且 README §4 已压成指针、无 §4.2
$ grep -rn "三条硬纪律" --include='*.md' . LICENSE    # 全仓唯一命中 = LICENSE:88（README §4 已自述"现按 5 条如实写"）
```

README §2「内容清单」表列 `references/01~06` ＋ scripts ＋ evidence，**无 07 行**；而 `SKILL.md:391` 已列 `references/07` ⇒ 清单漂移原样在。且**无任何门禁**覆盖「README 清单 = references 实际文件集」（客观核对：README §2 列 6 篇，`ls references/*.md` = 7 篇）。

---

## 三、上次（§十一 U-4）未复核项的补覆盖结果

| 补覆盖项 | 判定 | 关键读数 |
|---|---|---|
| `references/01~06` 逐条**来源抽查**（纪律 1） | **通过** | ① 六篇来源标注密度：01=18 / 02=5 / 03=24 / 04=57 / 05=41 / 06=36 处（`grep -cE "来源\|出处\|实测\|官方\|源码\|未核实\|推测\|\.h:\|\.cpp:"`）。② 高风险断言逐条抽读：**01** 快捷键 `Ctrl+Alt+F11` 给出可复跑源码出处（`LC_AppSettings.cpp` 搜 `0x37A`，01:80/176）；**05** §1「610 文件 · 92k 行」标（实测），§9 出处节给官方文档 URL＋运行时真源＋`<Engine>/Plugins/Experimental/...`，并声明「Experimental · 换版本以运行时真源为准」；**03:386** `CanvasPanelSlot` 节标题即注「读引擎源码定的」并列 `Runtime/UMG/Private/Components/CanvasPanelSlot.cpp` 四访问器行为表；**06** 为带日期（2026-10-02）· 带方法（真调用非读文档）· 逐项留证的抽样报告。③ **推测全部显式标注**：`04:559`（4·17 根因「未核实」）、`04:659`（4·21）、`04:686`（4·22）均写「机制未核实 · 只登记现象与规避，不写因果」；`04:468` 记录了一条从「机制推断·未核实」**升为「实测」**的轨迹 —— 纪律 1 的「推测标未核实」不是口号，是实际执行了的 |
| `check.sh --selftest` 实跑 | **通过 · 五条用例均非虚设** | 5/5「已拦/未误报」（四节 [S]）。**「有没有反向用例其实测不出反向」**的检查：本审读源码核对其用例形状纪律（`check.sh:150-151` 沿革注明初版 `T-9999` 测不到 `T-00xx` 的病，现用例 `T-0099` 为真实形状；[A][B] 种在初版漏扫的 `docs/evidence/`）；[E] 为**防误报**方向用例（转义竖线好表不得判红）⇒ 正反两向都有。**但注意**：五条用例验证的是「四类模式各自能拦」，**不含「项目名」这一维**（该维根本没有判据）—— 与 U-1.2 同因，见四节 [R1] |
| `pre-push` 是否真装上并触发 | **通过** | 原仓 `git config core.hooksPath` = `scripts/hooks`（实跑输出）；钩子真触发用**离线模拟**（克隆仓 ＋ 本地 bare remote，不触网不推 origin）：干净 push ⇒ 钩子打印 check.sh 全绿输出并放行（`* [new branch] main -> main`）；注入含盘符路径的提交后 push ⇒ `✗ 发现盘符路径` ＋ `[pre-push] 推送被拦下` ＋ `error: failed to push some refs`。**逃生舱** `UE_AIOPS_SKIP_CHECK=1` 存在（钩子文件内），未滥用测试 |
| CI（X-0044 建）GitHub 侧是否真跑过 | **通过 · 4/4 成功** | `curl api.github.com/repos/sdzdrccc/ue-ai-ops/actions/runs`：`total_count: 4`，run#1~#4 对应 `d7b9b5c`（建 CI 提交本身）、`d7409de`、`c0458c2`、`da78413`（**HEAD**，2026-10-16T16:32Z），全部 `event=push conclusion=success`。run#4 的 jobs API：job「check.sh ＋ 反向自测」success，steps 含 `self-check (判据①②③)` 与 `reverse tests (--selftest)` ⇒ CI 不是摆设，最后一条提交被它验过 |
| 源仓 ↔ 已安装 skill 副本同步 | **通过 · 两处副本零漂移** | ① `~/.workbuddy/skills/ue-ai-ops`：`SYNC-ORIGIN.txt` 记同步时间 **2026-10-19 00:08:53**（晚于 HEAD 提交 10-17 ⇒ 覆盖全部内容）；`diff -q` SKILL.md / AGENTS.md / references/*.md（7 篇数量对得上）/ scripts 五件 —— **零差异**。② `~/.qoder-cn/skills/ue-ai-ops`：同一 SYNC-ORIGIN 时间戳，references 逐篇 `diff -q` 零差异 ⇒ 「只改源不同步」的病**当前不存在**。（`docs/evidence/` 不同步进副本是脚本注释里的**设计**，非漏同步。） |
| §4·17~22（X-0046~49/X-0054 回流批次）有无「项目值当通用做法」 | **通过** | 批次提交 `d7409de`（4·17/18）`c0458c2`（03 四判据）`da78413`（4·21/22）内容抽读：全部写成「**怎么查**」—— 4·17 判据「看 `cl.exe` CPU 增量＋产物 mtime」、4·18 判据「先 `where python` 看指向」（WindowsApps 路径是 OS 通用别名桩位置，非某项目私有值）、4·19「阈值取在结果量上」的 0.5° 是**换算方法示例**并注明依据 §4·13 实测、4·21/22 均标「机制未核实」。盘符/卡号/端口/用户名四类 check.sh 亦绿（第二道网）。⚠ 登记一个边缘：4·18 正解「去仓内门禁脚本抄那个已验证的绝对路径」把具体值留给了**消费方项目**，写法本身合规 |

---

## 四、机械判据与自测实跑读数

```bash
# [常规] 原仓直接跑（只读；写盘分支仅 --selftest 路径，故自测放 /tmp 克隆）
$ cd F:/zxc/Project/ue-ai-ops && bash scripts/check.sh; echo EXIT=$?
  [1] 通用性: ✓无盘符路径 ✓无记录卡号 ✓无本机特有端口 ✓无本机用户名
  [2] 结构: 9 项全 ✓   [3] 表格列数一致 ✓   [4] 未发现绝对化措辞
  结果: 全绿   EXIT=0
# ★ 判读（坑9）：此绿灯的扫描范围 = 四类模式，**不含项目名/坑号** ⇒ 不构成纪律3通过的证据

# [S] 克隆内 bash scripts/check.sh --selftest → SELFTEST_EXIT=0，五条全过：
#   [A] 塞盘符路径→拦  [B] 塞T-0099→拦  [C] 移除→恢复全绿  [D] 坏表→拦  [E] 转义竖线好表→未误报

# [R1] 本审自建反向用例（判据①的覆盖边界，独立复算）：
#   文件内容仅含「qiuyuan-dalu 的坑号 A59」 ⇒ [1] 四项全 ✓、结果全绿  ⇒ ★ 项目名+坑号维度无判据（U-1.2 实证）
#   文件含「F:/zxc/...」盘符 ⇒ ✗ 发现盘符路径（拦得住）
#   文件含「ADR-0009」 ⇒ ✗ 发现记录卡号（拦得住）
#   ★ 无差别误伤核对：通用词（"8000 是官方默认"、Build.bat、GetWidgets）均不在红名单 ⇒ 未见误伤面

# [P] pre-push 三层证据：原仓 core.hooksPath=scripts/hooks；克隆+本地 bare 模拟：绿放行 / 红拦截（见三节）

# [C] CI：GitHub REST runs total_count=4，#4 @ da78413 success，steps 含 reverse tests（见三节；gh CLI 本机不可用，改用 curl REST API）
```

---

## 五、ue-ai-ops 文档去留总表

> §10.4 · 排序与结论**只依据客观量**（仓内被引用文件数、顶层三文件点名次数、是否被 `check.sh` 结构判据/`sync-to-skill.sh` 覆盖）；**无主观分级**；**删除/搬家只出清单、未执行**。

| 文件 | 它是什么 | 谁该读 | 被引用（仓内文件数） | 顶层点名（AGENTS+README+SKILL 次数） | 同步进 skill 副本 | 过没过时（客观判据） | 去留结论 |
|---|---|---|---|---|---|---|---|
| `references/01-compile-and-launch.md` | 启动/编译决策表＋实测节 | AI＋人 | 5 | 8 | ✓ | check [2] 结构点名文件；无更替代品 | **保留**（瑕疵：§5 与 evidence 篇重叠属「有意分工」，01:183 有指针） |
| `references/02-editor-mcp-channel.md` | MCP 通道三层/端口/握手排查 | AI＋人 | 4 | 4 | ✓ | 同上；`mcp-session-probe.py` 是其配套 | **保留** |
| `references/03-umg-and-assets.md` | UMG 架构判据＋落盘根因＋引擎源码级节 | AI＋人 | 5 | 4 | ✓ | 15 个章节，多数自注「实测/源码」日期 | **保留**（`UmgMcp` 相关两节存在纪律 4 张力，见遗留 4，属**内容裁定**不属去留） |
| `references/04-avoiding-pitfalls.md` | 避坑总表 §4·1~4·22 | AI（AGENTS §6 指定先读） | 4 | 7 | ✓ | 4·17~22 为 2026-10 新增；无空节 | **保留** |
| `references/05-official-mcp-and-toolsets.md` | 官方 MCP/工具集「优先用官方」总论 | AI（AGENTS §1/§6 点名） | 4 | 12 | ✓ | §9 出处含版本警示（Experimental→以运行时真源为准） | **保留** |
| `references/06-sampling-test-report.md` | 2026-10-02 抽样实测报告（5/5） | 人＋复核 05 的 AI | 3 | 6 | ✓ | 快照性质、自我声明「可复跑」；被 README:45/69 与 SKILL 引用 | **保留**（若嫌快照性质与手册混放，去向见遗留 5 —— 只登记） |
| `references/07-crash-bisection-headless.md` | 崩溃 headless 二分手册 | AI | 2 | **1**（仅 SKILL.md:391；README 清单缺席） | ✓ | 10-13 新篇；含未销痕迹（U-1.1） | **保留**，但**两处待修**：U-1.1 痕迹 ＋ README 清单补行（属「改」不属「删」，§10.4 判据「还有人读 ⇒ 改不删」） |
| `docs/evidence/compile-livecoding-experiment.md` | 10-02 编译/热重载原始实测记录 | 人（追溯 01 结论用） | 被 4 处指针引用（AGENTS:42 · README:71/73/75 · 01:183） | — | ✗（设计如此，sync 注释明写不同步 evidence 防臃肿） | 01 的结论未过期，其证据链仍是唯一行号级留档 | **保留**（待修：U-1.1 两处脱敏漏网 —— 改，不删） |
| 顶层 `SKILL.md/README.md/INSTALL.md/AGENTS.md/LICENSE` | 主文件/人读门面/装法/纪律/许可 | —— | — | `check.sh` 结构判据点名 SKILL/README/INSTALL | SKILL+AGENTS 同步 | — | **保留**（LICENSE:88 与 README 清单为 U-1.3 待修点） |

**删除/搬家清单：空。** 按 §10.4 引用的判据（dalu `AGENTS.md` §4「判据：还有没有人读」＋「还有人读 ⇒ 改，不删」），本仓 12 份文档**全部有活引用或机制点名**，无「无人读」候选；不存在可删项。

---

## 本次未覆盖（必填）

1. **未逐行通读** `references/03`/`04`/`05` 全文（共 ~1580 行）—— 按「高风险断言 spot-check ＋ 标注密度统计」抽查，非字面逐条；01/02/06/07 为通读。
2. **未向 origin 真实推送**验证 GitHub 侧 pre-push/CI 联动（只读约束）—— 用 REST API 历史 run ＋ 本地 bare 仓模拟替代；「现在推送一次是否仍触发全部三层」未被端到端实证。
3. `scripts/mcp-session-probe.py`、`find-ue-editor-info.sh`、`install-hooks.sh` **未实执行**（前两者需 UE 运行时环境；后者会写 git 配置）—— 仅源码审读。
4. 未复核 dalu 侧 `docs/PITFALLS.md` A59 与 ops `07` §5 的**内容一致性**（跨对象，越界即登记 —— 坑 6）。
5. CI run #1~#3 的**step 级明细**未展开（仅 #4 展开；前三次以 run 级 success 采信）。
6. `虬渊大陆`/guild 契约与 ops 判据的**语义对账**不在本对象范围。
7. skill 副本的**运行时生效性**（AI 实际读到哪份）未验证 —— 只证文件级一致。

## 遗留问题（逐条给去向 · ★ 依铁律一**只登记不代写**）

| # | 事项 | 去向 | 备注 |
|---|---|---|---|
| 1 | U-1.1 项目痕迹 **7 处**（07:61/84/85/86/87 ＋ evidence:89/113；本审比 §十一 +07:86「guild AGENTS.md §11.2」一处） | **ue-ai-ops 侧**（应开跨库卡，§十一 U-3 ①的同一批，**行号清单已更新为本表**） | 修复判据：07 去项目名泛指化；evidence 按其文件头自declared脱敏口径补净 |
| 2 | U-1.2 `check.sh` 判据①无「项目名/坑号」模式，且无该维反向用例 | **ue-ai-ops 侧**（同卡 ②：加模式 ＋ 正/反两条用例；本审 [R1] 可作验收判据：含 `qiuyuan-dalu`/`A59` 必红、`Build.bat`/`8000` 不得误红） | ★ 加项目名 token 表时注意与本仓自身 README/CHANGELOG 语境协调 |
| 3 | U-1.3 `LICENSE:88`「三条硬纪律/§4.2」＋ `README.md` §2 清单缺 `references/07` | **ue-ai-ops 侧**（同卡 ③） | 根因是「README 清单 vs references 实际文件集」无门禁 —— 建议随卡补一条结构判据（可选） |
| 4 | 纪律 4 张力：`03:255-273` 通道表点名 `UmgMcp`、`07` §2-3 通篇 `UmgSetSubsystem/UmgGetSubsystem/set_widget_properties` 等插件级 API | **大人/ guild 裁定**（§十一 U-4 原样移交：待裁） | 两种读法各有代价：判「违纪律4」⇒ 07 大半要中性化；判「以插件为例的通道判据」⇒ 纪律 4 需要写明「例举」边界 |
| 5 | `references/06` 的「带日期快照」与 `references/` 手册定位的关系（05 §9 已自注版本失效规则） | **ue-ai-ops 侧**（低优先级，随下次动仓顺带裁：留原位＋文首快照声明，或中性化） | 现状不构成违规：§3 落点表未禁快照类入 references/ |
| 6 | 三处待修（1~3）修复后需重走：`check.sh` ＋ `--selftest` ＋ `sync-to-skill.sh`（本审未替它跑，跑即写盘） | **ue-ai-ops 侧卡内的验收步骤** | 与 §十一 U-3 的「三件」一致 |

## 执行环境（可选 · 仅供回溯）

- 工具：Qoder Desktop sub-agent · Git Bash on Windows（win32）· `git clone`/`diff -q`/`grep`/`awk` · `curl` 直连 GitHub REST API（`gh` 本机不可用）· `--selftest` 与注入用例全程在 `C:/Users/…/Temp/ueops-review-clone`（用毕已 `rm -rf`，含本地 bare `ueops-bare`）
- 模型：Qoder Desktop · 底层模型不披露
- 日期：2026-10-27
- 被审对象状态回程核对：审阅结束后原仓 `git status --short` 仍为空、HEAD 仍 `da78413` —— 零写入 ✓
