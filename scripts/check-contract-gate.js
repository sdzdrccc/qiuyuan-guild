#!/usr/bin/env node
'use strict';

/**
 * check-contract-gate.js —— 契约完备性闸门（来源 X-0015）
 *
 * 职责：回答一个此前**没人问过**的问题 ——
 *   `ROADMAP.md` 声明某里程碑要「新增展开」的实体，**在 `contracts/` 里真的展开了吗？**
 *
 * ── 为什么需要它（X-0015 §二-1 的实测证据）────────────────────
 *   ROADMAP §2 M1「契约增量」表列了 5 个实体要「新增展开」，实际只展开了 3 个；
 *   而 dalu 侧**已经把未展开的那两个（`Account` / `GameConfig`）实现落库了**。
 *   → 「契约先于实现」（AGENTS.md §3 纪律 1 / 方案 §4.1）被绕过，
 *     而当时**没有任何机制会发现** —— check-data 查的是契约自身一致性，
 *     不查「声明 vs 展开」的差集。
 *
 *   判据是**机械可比**的：实体名（反引号标识符）→ 契约里有没有以它命名的展开节。
 *   故落成门禁，而非再写一遍纪律（CONVENTIONS §7.2：
 *   「同一个规则在文档里写了三遍还不被执行，它就该做成门禁」）。
 *
 * ── 边界（明确不做什么）────────────────────────────────────
 *   · **不判**展开得对不对、字段全不全 —— 那是语义判断，归人工检查点（§7.1 纪律 6）。
 *   · **不管** out-of-scope 的实体 —— 只认 ROADMAP 标了「新增展开」的行。
 *   · 未展开 ≠ 立刻能开工：本脚本只报「声明的增量尚未落契约」这一事实。
 *
 * 用法：
 *   node scripts/check-contract-gate.js             # 常规
 *   node scripts/check-contract-gate.js --strict    # 警告也视为失败
 *   node scripts/check-contract-gate.js --self-test # 反向测试
 *
 * 退出码：0 = 通过 / 1 = 失败
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTRACTS = path.join(ROOT, 'contracts');
const STRICT = process.argv.includes('--strict');

// ─────────────────────────────────────────────────────────────
// 待实现规则登记位 —— 机制③（来源 X-0016 · 回应 X-0015 §五-③）
// ─────────────────────────────────────────────────────────────
/**
 * 本脚本**承诺但尚未实现**的规则。非空时**启动即打印**（warn），`--strict` 时 err。
 *
 * 存在的理由：X-0015 §二-3 —— 「某脚本须加某规则」被写进**下游文档**里，
 * 而脚本归 guild ⇒ **两不管**，那句承诺**没有任何落点**。此常量就是那个落点。
 *
 * ★ 硬约束：每项**必须带 `from`（来源记录号）**，否则不许加 —— 防它变成「永久待办黑洞」。
 *   规则真做了 → **立即移出**本数组（删掉，不是注释掉）。
 */
const PENDING_RULES = [
  // { id: 'G2', from: 'X-0000', desc: '…', due: 'M2' },
];

/** 纯函数：待实现规则的提示文本（空名单 → `null`，便于 `--self-test`） */
function pendingNotice(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list
    .map(r => `${r.id || '?'}(from ${r.from || '⚠缺来源'}${r.due ? ', due ' + r.due : ''})`)
    .join(' / ');
}

const errors = [];
const warns = [];
const passes = [];
const err = (r, m) => errors.push({ rule: r, msg: m });
const warn = (r, m) => warns.push({ rule: r, msg: m });
const ok = (r, m) => passes.push({ rule: r, msg: m });

const useColor = process.stdout.isTTY;
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : s);
const GREEN = 32, RED = 31, YELLOW = 33, DIM = 2;

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

// ─────────────────────────────────────────────────────────────
// 纯函数区（便于 --self-test）
// ─────────────────────────────────────────────────────────────

/**
 * 从 ROADMAP 全文抽出「契约增量」表里标了「新增展开」的实体。
 * 返回 [{ milestone, entity, raw }]
 *
 * 认法（刻意保守 —— 宁可漏认，不要错认）：
 *   ① 定位 `### 契约增量` 之后的第一张表；
 *   ② 行内**第一列**是反引号标识符，且**状态列**含「新增展开」；
 *   ③ 里程碑名取该表之前最近的 `## N. 【Mx】…` 标题。
 */
function entitiesFromRoadmap(text) {
  const out = [];
  const lines = String(text).split(/\r?\n/);
  let milestone = '(未知里程碑)';
  let inSection = false;
  let seenTable = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    const mh = l.match(/^##\s+\d+\.\s*【([^】]+)】/);
    if (mh) { milestone = mh[1]; inSection = false; seenTable = false; continue; }

    if (/^#{3}\s*契约增量/.test(l)) { inSection = true; seenTable = false; continue; }

    // 出了这一节：遇到同级或更高级标题就关掉
    if (inSection && /^#{1,3}\s/.test(l) && !/^#{3}\s*契约增量/.test(l)) { inSection = false; continue; }

    if (!inSection) continue;

    // 表头 + 分隔行 → 表格开始
    if (/^\s*\|/.test(l) && !seenTable) {
      if (/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) { seenTable = true; i++; }
      continue;
    }
    if (!seenTable) continue;
    if (!/^\s*\|/.test(l)) { seenTable = false; inSection = false; continue; }

    const cells = l.split('|').slice(1, -1).map(s => s.trim());
    if (cells.length < 2) continue;
    const ent = cells[0].match(/^`([A-Za-z][A-Za-z0-9_]*)`$/);
    if (!ent) continue;
    if (!/新增展开/.test(cells.slice(1).join(' '))) continue;

    out.push({ milestone, entity: ent[1], raw: l.trim() });
  }
  return out;
}

/** 契约全文里所有「以某实体命名」的展开节所声明的实体名集合 */
function expandedEntities(contractTexts) {
  const set = new Set();
  for (const t of contractTexts) {
    for (const l of String(t).split(/\r?\n/)) {
      const m = l.match(/^#{2,4}\s+.*?`([A-Za-z][A-Za-z0-9_]*)`/);
      if (m) set.add(m[1]);
    }
  }
  return set;
}

/** 纯函数：差集判定，返回未展开的条目 */
function unexpanded(declared, expanded) {
  return declared.filter(d => !expanded.has(d.entity));
}

// ─────────────────────────────────────────────────────────────
// 规则 G1 · ROADMAP 声明的「契约增量」必须已展开
// ─────────────────────────────────────────────────────────────

const ROADMAP = path.join(ROOT, 'docs', 'ROADMAP.md');

(function g1() {
  const rm = read(ROADMAP);
  if (rm === null) { err('G1', '读不到 `docs/ROADMAP.md` —— 无法核对契约增量'); return; }

  const declared = entitiesFromRoadmap(rm);
  if (declared.length === 0) {
    err('G1', '未从 ROADMAP 解析出任何「新增展开」实体 —— 疑似解析失效（禁止空集真空通过）');
    return;
  }

  const files = fs.existsSync(CONTRACTS)
    ? fs.readdirSync(CONTRACTS).filter(f => f.endsWith('.md')).map(f => read(path.join(CONTRACTS, f)) || '')
    : [];
  if (files.length === 0) { err('G1', '未读到任何契约文件 —— 禁止空集真空通过'); return; }

  const expanded = expandedEntities(files);
  const missing = unexpanded(declared, expanded);

  if (missing.length) {
    for (const m of missing) {
      err('G1', `【${m.milestone}】声明「新增展开」\`${m.entity}\`，但 \`contracts/\` 内**无该实体的展开节**` +
        ` —— 契约先于实现（AGENTS.md §3 纪律 1）未满足`);
    }
  } else if (declared.length > 0) {
    ok('G1', `ROADMAP 声明的契约增量**已全部展开**（${declared.length} 个实体：${[...new Set(declared.map(d => d.entity))].join(' / ')}）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// --self-test · 反向测试（CONVENTIONS §7.1 纪律 2）
// ─────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  const RM = [
    '## 2. 【M1】建号 —— 详案',
    '',
    '### 契约增量（**只展开这些**）',
    '',
    '| 实体 | 状态 |',
    '|---|---|',
    '| `Account` | 新增展开 |',
    '| `Role` | 新增展开（`realm_id` **`1~9`**） |',
    '| `§6 属性派生` | 已有公式 |',
    '',
    '## 3. 【M2】首战 —— 概要',
    '',
    '### 契约增量',
    '',
    '| 实体 | 状态 |',
    '|---|---|',
    '| `SpellDef` | 未定义（M6） |',
  ].join('\n');

  const cases = [
    // 认表
    ['G1', '认出标了「新增展开」的实体', entitiesFromRoadmap(RM).map(d => d.entity).join(',') === 'Account,Role', true],
    ['G1', '未标「新增展开」的行不认', !entitiesFromRoadmap(RM).some(d => d.entity === 'SpellDef'), true],
    ['G1', '非反引号首列（如「§6 属性派生」）不认', !entitiesFromRoadmap(RM).some(d => d.entity.includes('属性派生')), true],
    ['G1', '里程碑名归属正确', entitiesFromRoadmap(RM)[0].milestone === 'M1', true],
    ['G1', '无「契约增量」节 → 空集（交由调用方报错）', entitiesFromRoadmap('## 1. 【M1】x\n\n| a | b |\n|---|---|\n| `Role` | 新增展开 |').length === 0, true],
    // 展开节认法
    ['G1', '以实体命名的标题 → 认作已展开', expandedEntities(['### 3.1 角色 `Role`（角色主实体）']).has('Role'), true],
    ['G1', '前缀相近者不得混淆（`RoleRoot` ≠ `Role`）', !expandedEntities(['### 3.2 角色灵根 `RoleRoot`']).has('Role'), true],
    ['G1', '正文提到实体名 → 不算展开', expandedEntities(['正文提到 `Account` 一词']).has('Account') === false, true],
    // 差集
    ['G1', '声明未展开 → 差值命中', unexpanded([{ milestone: 'M1', entity: 'Account' }], new Set()).length === 1, true],
    ['G1', '声明已展开 → 差值空', unexpanded([{ milestone: 'M1', entity: 'Role' }], new Set(['Role'])).length === 0, true],
    ['G1', '全未展开 → 全部列出', unexpanded([{ entity: 'A' }, { entity: 'B' }], new Set()).length === 2, true],
    // PEND 待实现规则登记位（机制③ · 来源 X-0016）
    ['PEND', '空名单 → 不告警（不打破现状）', pendingNotice([]) === null, true],
    ['PEND', '非空 → 生成提示（含来源）', pendingNotice([{ id: 'G2', from: 'X-0000' }]) === 'G2(from X-0000)', true],
    ['PEND', '缺 from → 显式标记（不许静默）', /⚠缺来源/.test(pendingNotice([{ id: 'G2' }])), true],
  ];

  const fails = cases.filter(([, , got, want]) => got !== want);
  console.log(c(1, '\n[check-contract-gate] 反向测试（--self-test）'));
  console.log(c(DIM, '  纪律：没失败过的校验脚本 = 未被验证过的校验脚本\n'));
  for (const [rule, name, got, want] of cases) {
    console.log(`  ${got === want ? c(GREEN, '✓') : c(RED, '✗')} ${c(DIM, rule)}  ${name}`);
  }
  console.log('\n' + (fails.length
    ? c(RED, `结果：不通过（${fails.length} / ${cases.length} 用例失败）`)
    : c(GREEN, `结果：通过（${cases.length} / ${cases.length} 用例，反向测试全绿）`)) + '\n');
  process.exit(fails.length ? 1 : 0);
}

// ─────────────────────────────────────────────────────────────
// 报告
// ─────────────────────────────────────────────────────────────

console.log(c(1, '\n[check-contract-gate] 契约完备性闸门'));
console.log(c(DIM, `  路线图    ${ROADMAP}`));
console.log(c(DIM, `  模式      ${STRICT ? 'strict（警告即失败）' : '常规'}\n`));

// 机制③：待实现规则必须让人看见（不许静默 · 来源 X-0016）
{ const pend = pendingNotice(PENDING_RULES); if (pend) (STRICT ? err : warn)('PEND', `${PENDING_RULES.length} 条「已承诺未实现」规则：${pend}`); }
for (const p of passes) console.log(`  ${c(GREEN, '✓')} ${c(DIM, p.rule)}  ${p.msg}`);
for (const w of warns) console.log(`  ${c(YELLOW, '⚠')} ${c(DIM, w.rule)}  ${w.msg}`);
for (const e of errors) console.log(`  ${c(RED, '✗')} ${c(DIM, e.rule)}  ${e.msg}`);

const failed = errors.length > 0 || (STRICT && warns.length > 0);
console.log('\n' + (failed
  ? c(RED, `结果：不通过（${errors.length} 错 / ${warns.length} 警告）`)
  : c(GREEN, `结果：通过（${passes.length} 项通过 / ${warns.length} 警告）`)) + '\n');

process.exit(failed ? 1 : 0);
