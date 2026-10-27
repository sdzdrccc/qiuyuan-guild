# PROJECT-REVIEW-WorkBuddy-DeepSeek-V4.1-Flash-2026-10-27

- 来源：**本仓派出**（大人发起，WorkBuddy 会话执行）
- Agent 名称 / 大模型：`review` / **DeepSeek-V4.1-Flash**
- 审查时间：2026-10-27 00:19 → 01:05（GMT+8）
- 审查对象：`qiuyuan-guild` · `qiuyuan-dalu` · `gbe-studio`（v0.9.1）· `gbe-assets`（v0.9.0）
- 审查范围：
  - **覆盖**：四仓机械判据（guild 10 门禁；dalu 编译/vet/test/生成幂等/check-gates T1~T16；GBE 双仓测试/版本/端口）· `X-0053`→`X-0057` 的销号复核 · 10-19 之后的新增面（契约 v0.9~v0.11、dalu T-0132~T-0139、GBE v0.8~v0.9.1）· 世界观库 A 类销号抽查
  - **未覆盖**：T4/T8 实机（编辑器未开）· `go test -race` · 像素比对 · 世界观库全库通读 · GBE Blender 链路 · GitHub 侧 CI 实跑 · 落库实测 · dalu `admin` 质量
- 硬约束确认：只读 ✓ 未改被审对象 ✓ 删除类只出清单 ✓
- 审阅快照：guild `8b44ca1`（干净）／ dalu `1378f09`（干净）／ gbe-studio `13de06a`（0.9.1）／ gbe-assets `5656dcf`（0.9.0）／ 虬渊大陆 `07b380d`（V1.74）
- 判定正本：`reviews/X-0062.md`（汇编；本文件是它的**内部源材料**之一，按 `ADR-0032` 落 `work/`）

---

## 一、判定（二值）

| # | 对象 | 机械判据 | 文档 / 契约一致性 | 判定 |
|---|---|---|---|---|
| 1 | `qiuyuan-guild` | **不通过**（`run-all-checks` 9/10，`check-identifiers` 41 错） | 不通过（`CONVENTIONS` 脚本数 8→实 10；`X-0059` 缺三节） | **不通过** |
| 2 | `qiuyuan-dalu` | **通过**（build/vet/test 净 · gen 两次零 diff · T1~T16 除 T4/T8 SKIPPED 外全绿） | **不通过**（契约 82 vs 表 90；`exp_max` 列删而契约仍列；`README`/`ARCHITECTURE` 两处 M1 状态残留） | **不通过** |
| 3 | `gbe-studio` | **通过**（26/0 · ports 交叉一致 · version 0.9.1 绿 · 新增 4 套测试全过） | **部分**（v0.9 新增 10 个 `pipeline/tools` 脚本零测试） | **不通过**（1 条中等） |
| 4 | `gbe-assets` | **通过**（49/0 · 30/0 · kit 10/10 · intake 0/0 · version 0.9.0 绿） | **不通过**（文档仍称 Unity 8080；`asset.schema.json` 指针不存在 ×3） | **不通过** |
| 5 | `虬渊大陆`（只读 · 抽查） | 不适用 | **通过（A 类已销）**：V1.73/V1.74 已订正十层与「巅峰」口径 | **通过**（就本次抽查范围） |

**总判：不通过**（4 个代码仓全不通过；世界观库本次抽查的 A 类已由上游自修）。

---

## 二、机械判据（命令 ＋ 实际输出）

### 1. `qiuyuan-guild`

```text
$ node scripts/run-all-checks.js --quiet
  通过 9 / 10 个脚本
  FAILED: check-identifiers.js
  ⚠ check-data.js :: ⚠ R10 公式参数缺失（spirit_root_variant_value / spirit_root_anchor / spirit_root_p_damage_ppm）→ 手算复现跳过
  RESULT: some checks FAILED

$ node scripts/check-identifiers.js
  ✗ I1 … 41 条 … 受管集合 216 个
  结果：不通过（41 错 / 0 警告）        EXIT=1
$ node scripts/check-identifiers.js --self-test
  结果：通过（35 / 35 用例，反向测试全绿）   ← ★ 自测全绿 ≠ 判据有效
```

### 2. `qiuyuan-dalu`

```text
$ cd server && go build ./...   # 0，无输出
$ go vet ./...                  # 0，无输出
$ go test ./...                 # 全部 ok（game/item/login/config/world/gmauth）
$ cd .. && bash data/gen.sh && git status --porcelain data/gen … | wc -l   # 0（幂等）
$ CI=1 cmd //c check-gates.bat ; echo $?   # EXIT=2
  T4 SKIPPED（9 屏未被覆盖）· T8 SKIPPED（编辑器未开）
  T16 database naming → 通过（21 张表 165 列 · 0 豁免）
```

### 3/4. GBE 双仓

```text
$ cd gbe-studio && node core/policy/test/router.smoke.js   # 26 / 0
$ node bridges/sync-ports.js --check                       # 视图一致 ＋ 交叉一致
$ node scripts/version.js check                            # v0.9.1 一致
$ cd gbe-assets && node packages/schema/test/smoke.js      # 49 / 0
$ node packages/schema/test/assembly.js                    # 30 / 0
$ node packages/schema/index.js kit kits/cn-ancient/kit.json   # 通过
$ node tools/intake.js --dry-run                           # 0 / 0
$ node scripts/version.js check                            # v0.9.0 一致
```

---

## 三、缺陷清单

### A. `qiuyuan-guild`

#### G-1【严重】`I1` 与 `R10` 写死 CSV 列名 `key`，被 dalu 改名打成「40 误报 ＋ 1 真缺陷 ＋ 1 假绿」

**根因链**：

```text
dalu T-0139：qydl_game_config 表头 key,value → param_key,param_value
  data/defines/90_global.xml：<var name="param_key"> <var name="param_value">  ← 真源
  guild check-identifiers.js:154  header.indexOf('key')      → -1 ⇒ 键集合为空
  guild check-data.js:881-887      r.key / r.value           → undefined ⇒ 参数缺失
```

**41 错归类**（逐条统计）：

| 类 | 条数 | 判定 | 证据 |
|---|---|---|---|
| `purity_damage_influence_ppm` | 13 | 误报 | CSV `param_key` 行 14 存在 |
| `purity_cultivation_influence_ppm` | 9 | 误报 | 行 15 |
| `spirit_root_p_damage_ppm` | 6 | 误报 | 行 12 |
| `spirit_root_p_cultivation_ppm` | 6 | 误报 | 行 13 |
| `shenshi_pool_regen_ppm` | 5 | 误报 | 行 19 |
| `qydl_role_name` | 1 | 误报（在「错误示例」列） | `dalu/docs/DATA-LAYOUT.md:179`；`db/0001_init.sql:58` 是索引名 `uk_qydl_role_name` |
| `qydl_realm_life_config` | 1 | **真缺陷** | `PITFALLS.md:2098` 引用已删表；`records/T-0134.md:24` 记「同日取代」；`RETIRED` 未登记 |

⇒ **40 误报 / 1 真缺陷**。

**R10 的假绿**：参数取空后 `computeGradeFormula` 返回 `null` ⇒ 只 `warn`「跳过」，退出码仍 0。用正确参数独立复算：**7 行 diff=0，数据本身是对的** ⇒ 41 红与 R10 跳过**均无数据侧后果**，纯判据失效（假红 ＋ 假绿各一条）。

**判据修正建议**（不代改）：
1. `configKeysFromCsv` 读 `90_global.xml` 的 `<var name="param_key">`，或双列名兼容（`key` ∪ `param_key`）；
2. `check-data.js:881` 同步；**参数取空必须 err，不许 warn**；
3. `check-identifiers.js` 排除「错误示例」列；
4. `qydl_realm_life_config` 登记 `RETIRED`（写明 `T-0134` 删除）；
5. 两侧各补反向用例：列名变体不得误报；真缺键仍须报；空集不得真空通过。

#### G-2【中等】`R10` 的 `ok` 文案宣称「公式复现」，而子规则已跳过

`check-data.js:911` 的 `ok` 文案与 `:890` 的 `warn` 同次输出并存 ⇒ 读者看到「✓ 公式复现」＋「⚠ 跳过」。改法：`ok` 文案按实际覆盖分支生成。

#### G-3【中等】`shenshi_*` 四件产物无任何机械断言

`grep -rn shenshi scripts/*.js` → 仅 `check-data.js:210` 注释 ＋ `:959` 反向用例字符串；`shenshi_start/step` 无 R10 断言 ⇒ ADR-0036/0037 改错无人拦（坑 9）。

#### G-4【中等】`CONVENTIONS.md:432` 写「依次跑上面**全部 8 个**」，实际 10 个

`run-all-checks.js` 的 `STEPS` = 10；`D5` 只扫 README/AGENTS，**恰不扫 CONVENTIONS**，正则也不认「全部 N 个」。

#### G-5【中等】`X-0059` 缺 `改动清单` / `验证证据` / `审核` 三节

`check-records` 的 `C1` 报三条 warn；`grep "^## " reviews/X-0059.md` → 只有 `1.`~`7.` 自造节名。

#### G-6【轻微】`registry/version-pins.md` 的 GBE 两行落后 3 个版本

表 `v0.6.5` / `v0.7.0`，真源 `0.9.1` / `0.9.0`；`check-version-pins` 的 **P6 软判**已如实报警（`RESULT: PASS`）。

### B. `qiuyuan-dalu`

#### D-1【严重】契约 82 台阶 vs 实现 90 行（境界层数）

| 侧 | 内容 | 位置 |
|---|---|---|
| 契约 | 「行数 = 台阶数 = **82**（炼气 10 ＋ 8 境 × 9）」 | `data-contract.md:331` |
| 实现 | **90 行**（9 境 × 10 层） | `data/datas/qydl_realm_level_config.csv` |
| 世界观 | **十层**（V1.66 裁、V1.73 订正残留） | `境界基础属性.md:15-17,342` |
| ADR | `ADR-0004` 取「1~9，第 9 层 = 圆满」 | `DECISIONS.md` |

⇒ **契约与 ADR 落后于世界观与实现**；dalu 已出提案 `GUILD-PROPOSAL-X0067`，guild 侧**无台账行、无 ADR**（`grep -rln X-0067 guild` 零命中）。

#### D-2【中等】`exp_max` 列已删，契约仍称「唯一修为字段」

契约 `data-contract.md:331-357` 明列 `exp_max`；实现改由 `qydl_realm_config.exp_min/exp_max` 区间按层派生（`config.go:394-408`）。⇒ 语义保留、物理列不一致，**契约未收编**。另新表 `qydl_realm_config`（寿元/修为区间/速度倍率）在契约中**无此实体**。

#### D-3【中等】高境神识 `shenshi_start/step` 全 0，无 unknown 哨兵

`realm 4~9` 两列集合均为 0；`config.go:211` 只判 `<0` 与「同境界一致」⇒ 0 合法通过 ⇒ 元婴及以上余量上限 = 0 × 10 = 0。`T-0135` 写明「0 = 未定、不代填」，但**按 ADR-0002 应标 `unknown`**，且 0 会让面板静默显示「无余量」。

#### D-4【中等】M1 状态仍有两处残留（X-0055 只修了一半）

- `README.md:24`「**M0 已完成 → 下一步 M1「建号」**」，同页 `:33` 表格 M1 却「✅ 已收口」。
- `ARCHITECTURE.md:280`「缺：属性面板（**波次 4**）」，而 `M1-IMPLEMENTATION.md:1684` 记「波次 4 ✅」。

#### D-5【中等】GM 玩家页前端写死 `limit=50`，无翻页

`admin/src/views/PlayersView.vue:26` `fetchCharacters(keyword, 50)`；后端 `limit≤200` 夹死、`offset` 有夹取，但第 51 个角色起前端拿不到（只显示 `total`）。只读 / 鉴权 / 防拖库均成立。

#### D-6【轻微】`shenshi_pool_factor` 的配置注释口径落后一个 ADR

`qydl_game_config.csv:18` 写「上限 = **神识强度** × 该系数」；ADR-0037 与契约 `:256` 已改「= **境界段** × 该系数」。数不变，注释错。

#### D-7【轻微】`features/CULTIVATION.md:174` 仍称「`exp_max` 现值全为 0（`qydl_realm_level_config.csv` 炼气十层）」—— 该列已被 `T-0134` 删除。

#### D-8【中等】登录屏三方不等（`T-0110` 未收）

`X-0057` 抓到：spec 72 / layout 70 / WBP 82，三方没有一对相等；T8 不含 login ⇒ 门禁静默。`T-0110` 标「已完成（2026-10-19）」，但实测 layout 81 个 `widget_name`、spec 72 个 `name`，仍不等。

### C. `gbe-studio`

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| S-1 | 中等 | v0.9.0 新增 **10 个 `pipeline/tools` 脚本，零测试零门禁** | `git ls-files pipeline/tools \| wc -l` → 10；`grep -rln "pipeline/tools" --include="*test*"` → 空 |
| S-2 | 轻微 | `ci.yml` 三 gate ≠ `AGENTS §4` 自检清单（缺 `reconcile` 与 `validate --impl`） | `ci.yml` vs `AGENTS.md:92-96` |
| S-3 | 轻微 | v0.9.1 提交时间早于报告日期；CHANGELOG 漏记 3 份提示词 | `git log -1 --format=%ci` = 2026-10-24；`PILOT-2026-10-26.md` 在库 |

### D. `gbe-assets`

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| A-1 | 中等 | 文档仍称 Unity 预留 **8080**、且「当前不占用」 | `CONVENTIONS.md:700` · `PLAN.md:465` vs `ports.json:67`（8090）/`:77`（qiuyuan-game-ws 8080 在实际用） |
| A-2 | 中等 | `CONVENTIONS.md` 三处把**不存在的** `asset.schema.json` 当真源 | `:21/:318/:542`；实为 `asset.v2.schema.json` |
| A-3 | 轻微 | README 装配清单只列 1 份（实有 3） | `README.md:75` vs `find assemblies` → 3 |
| A-4 | 轻微 | 「民居形制 18 类全部在库」可被读成假（`components/bracket` 0/3） | `CHANGELOG.md:45` vs `kit.coverage` |

### E. `虬渊大陆`（只读 · 抽查）

- **A 类已销**：`境界基础属性.md:342` 明写「V1.73 订正 V1.66 残留的『筑基及以上 1–9』」；`:15-18` 十层 ＋ 巅峰＝临门态（V1.74）。X-0053 的 W-02~W-05 **已由上游自修**。
- **仍悬空**：W-01（82 vs 90）—— 但责任已不在上游（上游是十层），在**契约与 ADR**。

---

## 四、`X-0053`→`X-0057` 销号复核

| 原项 | 结论 | 证据 |
|---|---|---|
| G-1 README 五类漂移 | ✅ 已销 | README 改为「不复制状态」；CI 行在 |
| G-2 `PENDING_RULES` | ✅ 已销（到期告警仍未做，已自陈） | `check-docs-index.js:43-50` `wontfix` |
| G-3 契约回执 | ✅ 已销 | `C6` 实跑「回执要点 67 条」 |
| G-4 `X-0049` 审核节 | ✅ 已销 | `X-0049:72` |
| G-5 L2 载体 | ✅ 已销 | `CONVENTIONS.md:527` 第 3 号 |
| G-6 `R7` 双前缀 | ✅ 已销 | 上一轮已修 |
| G-7 README/AGENTS | ✅ 已销（本轮 G-4 另开新条） | 同 G-1 |
| D-1 M1 状态 | ⚠️ **部分销** | 头部与表格已修；`README:24`、`ARCHITECTURE:280` 仍残留（D-4） |
| D-2 登录 layout | ❌ **未真销** | 三方 72/70/82 仍不等（D-8） |
| D-3 解码失败 | ✅ 已销 | `T-0093` |
| D-4 `realmCaps` 回 0 | ✅ 已销 | `*float64` |
| D-5 契约行 | ✅ 已销 | `protocol:170` |
| D-6 孤儿按钮 | ✅ 已销 | `RemoveDynamic` |
| S-1 CI path | ✅ 已销 | `ci.yml:37 path: gbe-assets` |
| S-2 端口副本 | ⚠️ **部分销** | studio 侧清零；assets 文档仍 8080（A-1） |
| S-3 自检不可达 | ✅ 已销 | `base.js:175-178` `--impl` |
| S-4 测试面 | ✅ 已销 | 4 套测试 |
| S-5 README 计数 | ✅ 已销 | 「以输出为准」 |
| S-6 版本校验 | ✅ 已销 | README/嵌套包纳入 |
| A-1 assets 无 CI | ✅ 已销 | `.github/workflows/ci.yml` 存在，6 步 |
| A-2 分类 | ⚠️ **部分销** | 28 类已并集执法；`asset.schema.json` 指针仍在（A-2 本轮） |
| A-3 CONTRIBUTING | ✅ 已销 | 已删并入 README |
| A-4/A-5 | ✅ 已销 | README 不写区间；test 串三条 |
| T4/T8（X-0057） | ✅ 已销 | 2026-10-19 实跑 PASS（430 绑定 / 201·49·216）；本轮 SKIPPED 只因编辑器未开 |

**统计：抽查 24 项 → 已销 18 / 部分销 3（D-1 · S-2 · A-2）/ 未销 1（D-2）· 2 项为环境未复跑。**

---

## 五、待裁与遗留

| # | 事 | 去向 |
|---|---|---|
| 1 | **I1/R10 判据与列名耦合**（G-1） | **guild**（改脚本 ＋ 反向用例） |
| 2 | 境界 82 vs 90（D-1） | **guild 契约 ＋ ADR**（dalu 提案 `X-0067` 已备） |
| 3 | `exp_max` 列删除 ＋ 新表 `RealmConfig`（D-2） | **guild 契约**（收编提案） |
| 4 | 高境神识 0 哨兵（D-3） | **dalu ＋ 契约 §4.1 备注** |
| 5 | 登录屏三方不等（D-8） | **dalu `T-0110`**（纳入 T8） |
| 6 | GM 玩家页翻页（D-5） | **dalu**（新 `T-*`） |
| 7 | `shenshi_*` 无断言（G-3） | **guild**（R10 子规则） |
| 8 | assets 8080 / `asset.schema.json` 指针（A-1/A-2） | **gbe-assets** |
| 9 | `pipeline/tools` 零测试（S-1） | **gbe-studio** |
| 10 | `X-0059` 缺三节 · `CONVENTIONS` 8→10（G-4/G-5） | **guild** |
| 11 | version-pins GBE 落后（G-6） | **guild**（`P6` 已报警，改表即可） |

---

## 本次未覆盖

1. **T4 / T8 未实跑**（编辑器未开）；X-0057 的 PASS 沿用未重验；像素比对不存在。
2. **`go test -race`** 未跑（本机无 cgo）。
3. **落库实测**：`0008`/`0009` 是否已在 MySQL 执行、列名/注释/索引是否生效，未验。
4. **世界观库**只抽查 A 类四项与十层口径，未做三份台账全量增量。
5. **GBE Blender 链路**（`retopo-bake.py` 等）未复跑；`pipeline/out` 四批产物不可从仓库核验。
6. **GitHub Actions 未实跑**（两仓 CI 只做代码/本地等效）。
7. **dalu `admin/` 前端质量**只核分页与写路径，未审样式/错误态/dist 同步。
8. **契约 `protocol-contract.md` 未逐字段审**（只核了它与 `data-contract` 的神识两列同口径）。
9. **数值**只复算灵根品级 7 行 ＋ 神识阶梯 3 境 × 2 层 ＋ 天劫 9 行的可判项。
