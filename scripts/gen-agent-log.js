#!/usr/bin/env node
'use strict';

/**
 * gen-agent-log.js —— `registry/agent-log.md` 的**生成器**（来源 `X-0003` 遗留 · `X-0015` §五-⑧）
 *
 * 职责：把「**按 agent 的完成记录视图**」由 `reviews/X-*.md` **派生**出来，
 *       从此**不再手工维护**。
 *
 * ── 为什么需要它（`X-0015` §五-⑧ 的实测证据）────────────────
 *   `agent-log.md` 自称「**派生视图**，禁止手改」，却**一直是手工维护**：
 *   实测它**至少三次滞后**于 `reviews/` 与 `cross-repo-ledger.md`
 *   （v0.19 / v0.26 两次补登留痕 + `X-0009~X-0013` 五篇正文未进表）。
 *   根因同 `CONVENTIONS.md` §7.2：「同一个规则在文档里写了三遍还不被执行，
 *   它就该做成门禁，而不是再写第四遍」——**「禁止手改」这条规则，缺的正是生成器这个载体**。
 *
 * ── 与「单一真源」的关系 ────────────────────────────────────
 *   · **真源** = `reviews/X-*.md`；本脚本**只读**它，**不读也不写**任何别处。
 *   · 「改了契约」这条判据与 `check-records.js` 的 `C4` **同源**
 *     （`scripts/lib/record-rules.js`）—— 不许各写一份（`CONVENTIONS.md` §1.1）。
 *   · **本脚本不改 `reviews/`**。要修视图，先修正文，再重生成。
 *
 * ── 一条刻意的「不生成」（诚实设计）────────────────────────
 *   `CONVENTIONS.md` §5.5 的四个计数里，**「返工次数」「门禁失败次数」无法从记录派生**：
 *   它们依赖**开发过程事件**（一张卡被退回几次 / `check-*.js` 红了几轮），
 *   而 `reviews/` 里**没有这个字段**。
 *   ⇒ 本脚本**不填 `0` 冒充**（填 0 = 声称「从未发生过」，正是「虚假的安心」），
 *     而是输出 `—` 并把原因写在表下 —— **缺口必须可见**。
 *
 * 用法：
 *   node scripts/gen-agent-log.js             # 校验：与仓库内文件**逐字节比对**（不一致 → exit 1）
 *   node scripts/gen-agent-log.js --write     # 重生成（覆盖）
 *   node scripts/gen-agent-log.js --self-test # 反向测试
 *
 * 退出码：0 = 通过 / 1 = 失败
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RECORDS_DIR = path.join(ROOT, 'reviews');
const TARGET = path.join(ROOT, 'registry', 'agent-log.md');
const WRITE = process.argv.includes('--write');

// 共享判据（单一真源 · 与 `check-records.js` 的 C4 同源）
const { sectionByKeyword, touchesContracts } = require('./lib/record-rules.js');

/**
 * 待实现规则登记位（`CONVENTIONS.md` §7.1 纪律 7 · 机制③）
 * ★ 硬约束：每项必须带 `from`（来源记录号），否则不许加。
 */
const PENDING_RULES = [
  // { id: 'AGL1', from: 'X-0000', desc: '…', due: 'M2' },
];

function pendingNotice(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map(r => `${r.id || '?'}(from ${r.from || '⚠缺来源'}${r.due ? ', due ' + r.due : ''})`).join(' / ');
}

/** **横向职能**（`CONVENTIONS.md` §3.3 写权边界）—— 不在此集合者一律入「纵向 owner」 */
const HORIZONTAL = new Set(['arch', 'review', 'qa', 'ledger']);

/** 表格单元格转义：`|` 会破坏表格结构（`ROADMAP` 曾栽在这上面 → 门禁 `R8`） */
function cell(s) {
  return String(s == null || s === '' ? '—' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────
// 纯函数区（便于 --self-test）
// ─────────────────────────────────────────────────────────────

/** 纯函数：从文件名取编号（`X-0001.md` → `X-0001`；不符 → `null`） */
function recordId(fileName) {
  const m = String(fileName).match(/^(X-\d{4})\.md$/);
  return m ? m[1] : null;
}

/** 纯函数：取大标题（`# X-0001 标题…` → `标题…`；无 → `null`） */
function recordTitle(text) {
  const m = String(text).match(/^#\s+X-\d{4}\s+(.*)$/m);
  return m ? m[1].trim() : null;
}

/** 纯函数：取头部字段（`- <名>：<值>`；无 → `null`） */
function headerField(text, name) {
  const re = new RegExp(`^\\s*[-*]?\\s*${name}\\s*[：:]\\s*(.*)$`, 'm');
  const m = String(text).match(re);
  return m ? m[1].trim() : null;
}

/**
 * 纯函数：从「执行者」字段取角色名（反引号包裹的标识符）。
 * `\`arch\`（契约与纪律的守方）+ \`ledger\`（记录）` → `['arch', 'ledger']`
 * ★ 只认「纯标识符」形态（无 `.` / `/`），避免把路径或节号误当角色。
 */
function rolesOf(executorField) {
  const out = [];
  for (const m of String(executorField || '').matchAll(/`([A-Za-z][A-Za-z0-9_-]*)`/g)) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/** 纯函数：是否横向职能（其余一律纵向 owner） */
function isHorizontal(role) {
  return HORIZONTAL.has(String(role));
}

/** 纯函数：取「审核」节的结论（去粗体记号；无审核节 / 无结论行 → `null`） */
function reviewConclusion(text) {
  const sec = sectionByKeyword(text, '审核');
  if (sec === null) return null;
  const m = sec.match(/^\s*[-*>]?\s*\*{0,2}结论\*{0,2}\s*[：:]\s*(.*)$/m);
  if (!m) return null;
  return m[1].replace(/\*\*/g, '').trim() || null;
}

/** 纯函数：取日期（`- 日期：YYYY-MM-DD…`；无 → `null`） */
function recordDate(text) {
  const m = String(text).match(/^\s*[-*>]?\s*\*{0,2}日期\*{0,2}\s*[：:]\s*(\d{4}-\d{2}-\d{2})/m);
  return m ? m[1] : null;
}

/**
 * 纯函数：「遗留问题」节里**列出的条目数**（= 该卡抛给下一张卡的 TODO 数）。
 *
 * ★ 两种真实形态都要认（实测：本仓多数记录用**列表**，`X-0015` 起才有**表格**）：
 *   · 表格 → 数据行（去表头与分隔行 `|---|`）；
 *   · 列表 → `- ` / `* ` / `1. ` 起首的项。
 *
 * > **为什么口径改了**：此前手工维护的该列数值（`X-0003` 遗留那版）用的是**不可复现的口径**
 * > （`X-0002` 实有 5 条却记 1），无法核对。生成器只认**能机械复现**的口径。
 */
function pendingItemCount(text) {
  const sec = sectionByKeyword(text, '遗留问题');
  if (sec === null) return 0;
  let n = 0;
  let inTable = false;
  for (const l of sec.split(/\r?\n/)) {
    if (/^\s*\|/.test(l)) {
      if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) continue;   // 分隔行
      if (!inTable) { inTable = true; continue; }      // 首行 = 表头
      n++;
      continue;
    }
    inTable = false;
    if (/^\s*[-*+]\s+\S/.test(l) || /^\s*\d+[.、)]\s+\S/.test(l)) {
      // ★ 头部字段行（`- 日期：…`）**不计**为遗留项 —— 实测 `- 日期：` 常排在「遗留问题」节之后，
      //   若不排除，每篇记录都会被凭空多算 1 条（**判据过宽 → 计数虚高**）。
      if (!isFieldLine(l)) n++;
    }
  }
  return n;
}

/**
 * 纯函数：该列表行是否为**头部字段行**（`- 日期：…` / `- **执行者**：…`）。
 * 认法：`-` 后紧跟 **≤8 字的短名**再跟冒号 —— 长正文（如 `- **9 层制（境内）成长倍率待标定**：…`）不误认。
 */
function isFieldLine(l) {
  return /^\s*[-*+]\s*\*{0,2}[^\s：:]{1,8}\*{0,2}\s*[：:]/.test(l);
}

/** 纯函数：把一批记录解析成「行」—— 一份记录可含多个执行者 ⇒ 展开成多行 */
function parseRecords(files) {
  const rows = [];
  const counts = new Map();   // 首位执行者 → { contract, ledger }
  for (const f of files) {
    const id = recordId(f.name);
    if (!id) continue;
    const text = f.text;
    const roles = rolesOf(headerField(text, '执行者'));
    const rec = {
      id,
      title: recordTitle(text),
      status: headerField(text, '状态'),
      conclusion: reviewConclusion(text),
      date: recordDate(text),
      roles,
    };
    if (roles.length === 0) continue;         // 无执行者 → 由 `C1` 报，本视图不臆造
    for (const r of roles) rows.push({ role: r, ...rec });

    // 计数**归首位执行者**（一份记录只计一次）—— 否则「记录侧」会把同一件事重复计数
    const lead = roles[0];
    const c = counts.get(lead) || { contract: 0, ledger: 0 };
    if (touchesContracts(text)) c.contract += 1;
    c.ledger += pendingItemCount(text);
    counts.set(lead, c);
  }
  return { rows, counts };
}

/** 纯函数：渲染一张「执行者 × 记录」表（空 → 占位行） */
function renderRowsTable(rows, emptyNote) {
  const head = '| 执行者 | 编号 | 事项 | 状态 | 审核结论 | 日期 |\n|---|---|---|---|---|---|';
  if (rows.length === 0) return `${head}\n| — | — | （${emptyNote}） | — | — | — |`;
  return head + '\n' + rows
    .map(r => `| \`${cell(r.role)}\` | **${cell(r.id)}** | ${cell(r.title)} | ${cell(r.status)} | ${cell(r.conclusion)} | ${cell(r.date)} |`)
    .join('\n');
}

/** 纯函数：渲染「客观计数」表 */
function renderCountsTable(roles, counts) {
  const head = '| 执行者 | 返工次数 | 门禁失败次数 | 契约变更次数 | 遗留转出数 |\n|---|---|---|---|---|';
  const body = roles.map(r => {
    const c = counts.get(r) || { contract: 0, ledger: 0 };
    return `| \`${cell(r)}\` | — | — | ${c.contract} | ${c.ledger} |`;
  });
  return [head, ...body].join('\n');
}

/**
 * 纯函数：渲染**整份**视图。
 * 入参 `{ rows, counts }` —— 本函数不读文件，故可被反向测试直接调用。
 */
function renderAgentLog({ rows, counts }) {
  const byRole = new Map();
  for (const r of rows) {
    if (!byRole.has(r.role)) byRole.set(r.role, []);
    byRole.get(r.role).push(r);
  }
  for (const list of byRole.values()) list.sort((a, b) => a.id.localeCompare(b.id));
  const roles = [...byRole.keys()].sort();

  const vertRows = roles.filter(r => !isHorizontal(r)).flatMap(r => byRole.get(r));
  const horzRows = roles.filter(r => isHorizontal(r)).flatMap(r => byRole.get(r));
  const countRoles = [...new Set(rows.map(r => r.roles[0]))].sort();

  const L = [];
  L.push('# agent-log —— 按 agent 的完成记录视图');
  L.push('');
  L.push('> ## ⚠️ 本文件由脚本**生成**，不是真源');
  L.push('>');
  L.push('> - **真源**：`reviews/X-*.md`（每任务一份）');
  L.push('> - **生成器**：`node scripts/gen-agent-log.js --write`（默认**只校验**：不一致即报错）');
  L.push('> - **判据**：**视图可丢，`reviews` 不可丢。** 重建视图 = 重跑生成器');
  L.push('> - **禁止**：在本文件里手改内容（改了下次生成即被覆盖，且制造**双真源**）');
  L.push('');
  L.push('**它能回答的问题**：某 agent 到目前为止做过什么、结论如何、有无未通过项。');
  L.push('**它不能回答的问题**（**故意不提供**）：谁做得好、谁做得差。');
  L.push('');
  L.push('> **为什么没有「质量分」列** —— **ADR-0008**：审核判据**一律二值**，**禁主观评分**。');
  L.push('> 四个 agent 是**同一个模型扮的四个马甲**，给马甲排名无信息量，且会引发「为分数优化」。');
  L.push('> 需要健康度 → 用**四个客观计数**（返工 / 门禁失败 / 契约变更 / 遗留转出），见 `docs/CONVENTIONS.md` §5.5。');
  L.push('');
  L.push('**生成规则**（`scripts/gen-agent-log.js` 实现）：');
  L.push('');
  L.push('1. 扫 `reviews/X-*.md`（**只扫本仓**；`T-*` 属 dalu，不在本表）');
  L.push('2. 取每份的：编号、标题、**执行者**、状态、**审核结论**、日期');
  L.push('3. 按**执行者**分组（`arch` / `review` / `qa` / `ledger` 入**横向职能**，其余入**纵向 owner**），组内按编号升序');
  L.push('4. **执行环境不参与本表**（ADR-0007：不进任何统计）');
  L.push('');
  L.push('---');
  L.push('');
  L.push('## 一、纵向 owner（模块负责人）');
  L.push('');
  L.push(renderRowsTable(vertRows, '暂无 —— M1 起产生'));
  L.push('');
  L.push('> **M1 预计首批**：`world`（账号/角色/境界属性配置）、`ui`（登录屏 / 建角屏 / 属性面板）。');
  L.push('');
  L.push('---');
  L.push('');
  L.push('## 二、横向职能（arch / review / qa / ledger）');
  L.push('');
  L.push(renderRowsTable(horzRows, '暂无'));
  L.push('');
  L.push('---');
  L.push('');
  L.push('## 三、按 agent 的计数（**客观事件，非评分**）');
  L.push('');
  L.push('> 口径见 `docs/CONVENTIONS.md` §5.5。**计数归该记录的「首位执行者」** ——');
  L.push('> 一份记录只计一次，否则「记录侧」（`ledger`）会把同一件事**重复计数**。');
  L.push('>');
  L.push('> · **契约变更次数** = 「改了 `contracts/`」的记录篇数（判据与 `check-records.js` 的 `C4` **同源**，见 `scripts/lib/record-rules.js`）；');
  L.push('> · **遗留转出数** = 「遗留问题」节内**列出的条目数**（列表项 / 表格数据行 —— 两种真实形态都算）。');
  L.push('>   ⚠️ 此列**不沿用**此前手工维护的数值：那版口径**不可复现**（`X-0002` 实有 5 条却记 1），生成器只认能机械复现的口径。');
  L.push('');
  L.push(renderCountsTable(countRoles, counts));
  L.push('');
  L.push('> **`—` 的含义（重要）**：「返工次数」（同一张卡被退回几次）与「门禁失败次数」（`check-*.js` 红了几轮）');
  L.push('> 依赖**开发过程事件**，而 `reviews/` 里**没有这个字段** ⇒ **无法派生**。');
  L.push('> 本生成器**不填 `0` 冒充** —— 填 `0` 等于声称「从未发生过」，正是**虚假的安心**（`CONVENTIONS.md` §7.1 纪律 1）。');
  L.push('> 要让它可查，须给记录模板**加字段**（属真源变更）；在此之前由 `ledger` 按过程记录人工统计。');
  L.push('');
  L.push('---');
  L.push('');
  L.push('## 附：本视图的维护');
  L.push('');
  L.push('- **由 `scripts/gen-agent-log.js` 生成** —— 与 `reviews/` 同批维护（改记录模板要同步改生成规则）。');
  L.push('- **不得手工编辑** —— 需修正请改 `reviews/` 的正文，然后重生成。');
  L.push('');
  return L.join('\n');
}

// ─────────────────────────────────────────────────────────────
// --self-test · 反向测试（CONVENTIONS §7.1 纪律 2）
// ─────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  const SAMPLE = [
    '# X-0001 v0.14 契约去物理化',
    '',
    '- 状态：**已完成**',
    '- 执行者：`arch`（契约守方）+ `ledger`（记录）',
    '',
    '## 改动清单',
    '',
    '- **改** `contracts/data-contract.md` → v0.2',
    '',
    '## 审核',
    '',
    '- 结论：**通过**',
    '',
    '## 遗留问题',
    '',
    '| # | 项 | 去向 |',
    '|---|---|---|',
    '| 1 | a | b |',
    '| 2 | c | d |',
    '',
    '- 日期：2026-09-28（**补记**）',
    '',
  ].join('\n');

  const cases = [
    // 解析
    ['AGL', '文件名 → 编号', recordId('X-0001.md') === 'X-0001', true],
    ['AGL', '非记录文件名 → null（不臆造）', recordId('agent-log.md') === null, true],
    ['AGL', '取大标题（去编号）', recordTitle(SAMPLE) === 'v0.14 契约去物理化', true],
    ['AGL', '无大标题 → null', recordTitle('随便一段') === null, true],
    ['AGL', '取头部字段', headerField(SAMPLE, '状态') === '**已完成**', true],
    ['AGL', '缺该字段 → null', headerField(SAMPLE, '发起方') === null, true],
    ['AGL', '★ 执行者多角色 → 全部取出（一份记录展开成多行）', rolesOf('`arch`（a）+ `ledger`（记录）').join(',') === 'arch,ledger', true],
    ['AGL', '★ 同一角色重复 → 去重', rolesOf('`arch` + `arch`').join(',') === 'arch', true],
    ['AGL', '非标识符（含点 / 斜杠）**不**当角色', rolesOf('`docs/GLOSSARY.md`').join(',') === '', true],
    ['AGL', '空执行者 → 空数组（交由 C1 报，本视图不臆造）', rolesOf('').length === 0, true],
    ['AGL', '横向职能判定', isHorizontal('arch') === true && isHorizontal('world') === false, true],
    ['AGL', '取审核结论（去粗体记号）', reviewConclusion(SAMPLE) === '通过', true],
    ['AGL', '★ 无审核节 → null（不得拿正文里的「结论」冒充）', reviewConclusion('# t\n- 结论：通过') === null, true],
    ['AGL', '★ 结论行不在「审核」节内 → null', reviewConclusion('# t\n## 审核\n- x\n## 别的\n- 结论：通过') === null, true],
    ['AGL', '取日期（只取 YYYY-MM-DD）', recordDate(SAMPLE) === '2026-09-28', true],
    ['AGL', '无日期 → null', recordDate('# t') === null, true],
    // 遗留行数
    ['AGL', '「遗留问题」表数据行数 = 2（去表头与分隔行）', pendingItemCount(SAMPLE) === 2, true],
    ['AGL', '★ 「遗留问题」**列表**形态亦计（本仓多数记录的真实形态）',
      pendingItemCount('# t\n## 遗留问题\n\n- a → 转 M1\n- b\n\n## 下一节\n- 不算') === 2, true],
    ['AGL', '★ 有序列表项亦计', pendingItemCount('# t\n## 遗留问题\n\n1. a\n2) b\n') === 2, true],
    ['AGL', '★ 头部字段行（`- 日期：…`）**不计**为遗留项（否则每篇凭空 +1）',
      pendingItemCount('# t\n## 遗留问题\n\n- a\n- 日期：2026-09-28\n') === 1, true],
    ['AGL', '★ 长正文里的冒号**不**误判为字段行',
      pendingItemCount('# t\n## 遗留问题\n\n- **9 层制（境内）成长倍率待标定**：转 M1\n') === 1, true],
    ['AGL', '无「遗留问题」节 → 0', pendingItemCount('# t\n## 改动清单\n- x') === 0, true],
    ['AGL', '★ 空表（只有表头）→ 0（不得算成 1）', pendingItemCount('# t\n## 遗留问题\n\n| # | 项 |\n|---|---|\n') === 0, true],
    ['AGL', '★ 「遗留问题」字样出现在正文 → 不算该节', pendingItemCount('# t\n- 见遗留问题表\n') === 0, true],
    // 渲染
    ['AGL', '单元格转义 `|`（防破表）', cell('a|b') === 'a\\|b', true],
    ['AGL', '空值渲染为 `—`（不留空格）', cell(null) === '—' && cell('') === '—', true],
    ['AGL', '空组的表 → 占位行（不输出空表）', renderRowsTable([], '暂无').includes('| — | — | （暂无）'), true],
    ['AGL', '整份渲染含三节与生成器指针', (() => { const s = renderAgentLog({ rows: [], counts: new Map() }); return s.includes('## 一、纵向 owner') && s.includes('## 二、横向职能') && s.includes('## 三、按 agent 的计数') && s.includes('gen-agent-log.js'); })(), true],
    ['AGL', '★ 计数表对「不可派生」两列输出 `—`（**不填 0 冒充**）',
      renderCountsTable(['arch'], new Map([['arch', { contract: 2, ledger: 48 }]])).includes('| `arch` | — | — | 2 | 48 |'), true],
    // PENDING_RULES（纪律 7）
    ['PEND', '空名单 → 不告警', pendingNotice([]) === null, true],
    ['PEND', '缺 from → 显式标记（不许静默）', /⚠缺来源/.test(pendingNotice([{ id: 'AGL1' }])), true],
  ];

  const fails = cases.filter(([, , got, want]) => got !== want);
  console.log('\n[gen-agent-log] 反向测试（--self-test）');
  console.log('  纪律：没失败过的校验脚本 = 未被验证过的校验脚本\n');
  for (const [rule, name, got, want] of cases) {
    console.log(`  ${got === want ? '✓' : '✗'} ${rule}  ${name}`);
  }
  console.log('\n' + (fails.length
    ? `结果：不通过（${fails.length} / ${cases.length} 用例失败）`
    : `结果：通过（${cases.length} / ${cases.length} 用例，反向测试全绿）`) + '\n');
  process.exit(fails.length ? 1 : 0);
}

// ─────────────────────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────────────────────

if (!fs.existsSync(RECORDS_DIR)) {
  console.error('✗ 读不到 `reviews/` 目录');
  process.exit(1);
}
const files = fs.readdirSync(RECORDS_DIR)
  .filter(f => /^X-\d{4}\.md$/.test(f)).sort()
  .map(name => ({ name, text: fs.readFileSync(path.join(RECORDS_DIR, name), 'utf8') }));

if (files.length === 0) {
  console.error('✗ `reviews/` 下无任何 `X-*.md` —— 禁止空集真空通过');
  process.exit(1);
}

const { rows, counts } = parseRecords(files);
if (rows.length === 0) {
  console.error('✗ 未解析出任何「执行者」→ 视图会是空的 —— 禁止空集真空通过（先查 `C1`）');
  process.exit(1);
}

const rendered = renderAgentLog({ rows, counts });

const pend = pendingNotice(PENDING_RULES);

console.log('\n[gen-agent-log] `agent-log` 视图生成器');
console.log(`  真源      ${RECORDS_DIR}`);
console.log(`  产物      ${TARGET}`);
console.log(`  模式      ${WRITE ? '--write（重生成）' : '校验（逐字节比对）'}\n`);
if (pend) console.log(`  ⚠ PEND  已承诺未实现：${pend}`);

if (WRITE) {
  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, rendered, 'utf8');
  console.log(`  ✓ 已重生成（${files.length} 篇记录 → ${rows.length} 行）\n`);
  process.exit(0);
}

const current = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, 'utf8') : null;
if (current === rendered) {
  console.log(`  ✓ 与仓库内文件**逐字节一致**（${files.length} 篇记录 → ${rows.length} 行）`);
  console.log('\n结果：通过（1 项通过 / 0 警告）\n');
  process.exit(0);
}

console.log('  ✗ 与仓库内文件**不一致** —— 视图已滞后于 `reviews/`（这正是生成器要治的病）');
if (current === null) {
  console.log(`     仓库内无 \`registry/agent-log.md\``);
} else {
  const a = current.split(/\r?\n/), b = rendered.split(/\r?\n/);
  const n = Math.max(a.length, b.length);
  let shown = 0;
  for (let i = 0; i < n && shown < 5; i++) {
    if (a[i] !== b[i]) {
      shown++;
      console.log(`     行 ${i + 1}：仓库内 \`${(a[i] ?? '(缺)').slice(0, 60)}\``);
      console.log(`              期望   \`${(b[i] ?? '(缺)').slice(0, 60)}\``);
    }
  }
}
console.log('\n     修法：\`node scripts/gen-agent-log.js --write\`（**不要手工编辑视图**）');
console.log('\n结果：不通过（1 错 / 0 警告）\n');
process.exit(1);
