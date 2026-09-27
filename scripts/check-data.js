#!/usr/bin/env node
'use strict';

/**
 * check-data.js —— 数据契约一致性校验（Phase 0 首版）
 *
 * 职责：校验 `contracts/data-contract.md` 自身的完整性，以及它与
 *       `contracts/protocol-contract.md` 的跨契约一致性。
 *
 * 零依赖（与 GBE 侧 `@gbe/schema` 同一取舍：离线可用 + 无供应链面）。
 *
 * 用法：
 *   node scripts/check-data.js            # 常规校验
 *   node scripts/check-data.js --strict   # 警告也视为失败
 *
 * 退出码：0 = 通过 / 1 = 失败
 *
 * ── 设计约束（来自 CONVENTIONS.md）────────────────────────────────
 *   · 本脚本**不校验资产本体**——那是 L2 `@gbe/schema` 的事（§0 不跨层引用）。
 *   · 规则宁可少而真，不要多而虚。「没有校验脚本的契约 = 装饰品」，
 *     但「校验脚本里塞假规则」比没有更糟。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTRACTS = path.join(ROOT, 'contracts');
const STRICT = process.argv.includes('--strict');

const errors = [];
const warns = [];
const passes = [];

function err(rule, msg) { errors.push({ rule, msg }); }
function warn(rule, msg) { warns.push({ rule, msg }); }
function ok(rule, msg) { passes.push({ rule, msg }); }

// 颜色（self-test 段与报告段共用，故定义在前）
const useColor = process.stdout.isTTY;
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : s);
const GREEN = 32, RED = 31, YELLOW = 33, DIM = 2;

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function line(p) {
  const t = read(p);
  if (t === null) return null;
  return t.split(/\r?\n/);
}

// ─────────────────────────────────────────────────────────────
// R1 · 三份契约必须存在，且带元信息头
// ─────────────────────────────────────────────────────────────

const REQUIRED = ['data-contract.md', 'asset-ref-contract.md', 'protocol-contract.md'];

(function r1() {
  const missing = REQUIRED.filter(f => !fs.existsSync(path.join(CONTRACTS, f)));
  if (missing.length) {
    err('R1', `契约文件缺失：${missing.join(', ')}`);
    return;
  }
  const noHeader = REQUIRED.filter(f => {
    const t = read(path.join(CONTRACTS, f)) || '';
    // 注意：`^` 需配 `m` 标志才能逐行匹配（初版漏了 m，导致全部误报）
    return !/^>\s*\*\*层\*\*：L3/m.test(t) || !/状态/.test(t);
  });
  if (noHeader.length) {
    err('R1', `契约缺元信息头（层 / 状态）：${noHeader.join(', ')}`);
  } else {
    ok('R1', `三份契约齐备，元信息头完整（${REQUIRED.length}/${REQUIRED.length}）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// R2 · §0 勘误必须钉死（防误删 —— 这两处是提炼出来的硬结论）
//      v0.2 改造：境界部分**不再钉 `0~8`**（那与 ADR-0006 的主张相反），
//      改为钉「9 大境界 + 三种口径并存 + 已指向 ADR」。
// ─────────────────────────────────────────────────────────────

const ROOT_ORDER = '金木水火土风雷冰';   // 权威（勘误一）
const ROOT_ORDER_WRONG = '金木水火土雷风冰'; // 已作废的笔误

/** 纯函数：便于 `--self-test` 反向测试 */
function errataIssues(t) {
  const out = { errors: [], warns: [] };

  if (!t.includes(ROOT_ORDER)) {
    out.errors.push(`未出现权威灵根顺序「${ROOT_ORDER}」（勘误一被删？）`);
  } else if (!t.includes('勘误一')) {
    out.warns.push('灵根顺序在场，但「勘误一」标题不见了');
  }

  if (!/9\s*大境界/.test(t)) {
    out.errors.push('未声明「9 大境界」');
  }
  // v0.2：境界的「境内粒度」与「基址」都是**待裁项**，契约必须**显式标注**而非假装已定。
  if (!/ADR-0004/.test(t)) {
    out.errors.push('未标注 ADR-0004（境内粒度 9 层 vs 4 阶段）—— 该冲突不得静默消失');
  }
  if (!/ADR-0006/.test(t)) {
    out.errors.push('未标注 ADR-0006（realm_id 基址）—— 该冲突不得静默消失');
  }
  // 作废的笔误不得复活
  if (t.includes(ROOT_ORDER_WRONG) && !/作废|笔误/.test(t)) {
    out.errors.push(`作废的灵根顺序「${ROOT_ORDER_WRONG}」出现在契约中但未标注作废`);
  }
  return out;
}

(function r2() {
  const t = read(path.join(CONTRACTS, 'data-contract.md'));
  if (!t) return;
  const r = errataIssues(t);
  r.errors.forEach(m => err('R2', m));
  r.warns.forEach(m => warn('R2', m));
  if (r.errors.length === 0 && r.warns.length === 0) {
    ok('R2', '两处勘误已钉死 + 境界两处待裁项已显式标注（ADR-0004 / 0006）');
  }
})();

// ─────────────────────────────────────────────────────────────
// R7 · ADR-0001 门禁：契约不含物理映射（表名 / 前缀）
//      判据：**标题**（实体名所在处）与**代码块**（示例）里不得出现 `xx_`。
//      §1 实体总览的「原型对应（仅备查）」列是**合法引用**，故不检查普通表格行。
// ─────────────────────────────────────────────────────────────

/** 纯函数：便于 `--self-test` 反向测试 */
function scanPhysicalNames(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  let inCode = false;

  lines.forEach((l, i) => {
    if (/^\s*```/.test(l)) { inCode = !inCode; return; }

    // ① 标题里的表名 —— 说明实体被按物理名定义
    if (/^#{2,4}\s[^\n]*xx_[a-z]/.test(l)) {
      out.push({ line: i + 1, kind: '标题含表名' });
      return;
    }
    // ② 代码块里的表名 —— 说明物理细节进了示例
    if (inCode && /xx_[a-z]/.test(l)) {
      out.push({ line: i + 1, kind: '代码块含表名' });
      return;
    }
    // ③ 字段表首列直接写表名（| `xx_foo` | ...）
    if (/^\|\s*`xx_[a-z][^`]*`\s*\|/.test(l)) {
      out.push({ line: i + 1, kind: '表格首列含表名' });
    }
  });
  return out;
}

(function r7() {
  const files = ['data-contract.md', 'asset-ref-contract.md', 'protocol-contract.md'];
  const violations = [];

  for (const f of files) {
    const t = read(path.join(CONTRACTS, f));
    if (!t) continue;
    for (const v of scanPhysicalNames(t)) violations.push(`${f}:${v.line} ${v.kind}`);
  }

  if (violations.length) {
    err('R7', `契约含物理表名（ADR-0001：逻辑进契约，物理归下游）：${violations.join(' / ')}`);
  } else {
    ok('R7', 'ADR-0001 生效：契约标题 / 代码块 / 字段表首列均无物理表名');
  }
})();

// ─────────────────────────────────────────────────────────────
// R3 · 跨契约一致性：protocol 的 affixes 键 ⊆ data-contract 的词条键表
// ─────────────────────────────────────────────────────────────

function extractDataAffixKeys(t) {
  // data-contract §7.2 的代码块：键以 ` / ` 分隔，且**可跨行**
  // 注意：换行被拼成空格后，必须按「斜杠**或**空白」切分 —— 初版只按 `/` 切，
  //       导致相邻两行的首尾键（如 `shenshi` / `hit`）粘成一个词而被静默丢弃。
  const m = t.match(/###\s*7\.2[\s\S]*?```([\s\S]*?)```/);
  if (!m) return null;
  const body = m[1];
  return new Set(
    body.split(/\r?\n/)
      .filter(l => !/^\s*(元素攻|元素|<!--)/.test(l))
      .join(' ')
      .split(/[/\s]+/)
      .map(s => s.replace(/`/g, '').trim())
      .filter(s => /^[A-Za-z][A-Za-z0-9]*$/.test(s))
  );
}

function extractProtocolAffixKeys(t) {
  const m = t.match(/"affixes"\s*:\s*\{([^}]*)\}/);
  if (!m) return null;
  return new Set([...m[1].matchAll(/"([A-Za-z][A-Za-z0-9]*)"\s*:/g)].map(x => x[1]));
}

(function r3() {
  const d = read(path.join(CONTRACTS, 'data-contract.md'));
  const p = read(path.join(CONTRACTS, 'protocol-contract.md'));
  if (!d || !p) return;

  const dKeys = extractDataAffixKeys(d);
  const pKeys = extractProtocolAffixKeys(p);

  if (!dKeys || dKeys.size === 0) { err('R3', 'data-contract §7.2 词条键表解析失败'); return; }
  if (!pKeys || pKeys.size === 0) { err('R3', 'protocol-contract affixes 示例解析失败'); return; }

  const orphan = [...pKeys].filter(k => !dKeys.has(k));
  if (orphan.length) {
    err('R3', `protocol 的 affixes 键未在 data-contract 词条表中声明：${orphan.join(', ')}`);
  } else {
    ok('R3', `词条键名跨契约一致（词条表 ${dKeys.size} 键，示例引用 ${pKeys.size} 键全部命中）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// R4 · 铁律 3：枚举必须留 unknown
// ─────────────────────────────────────────────────────────────

(function r4() {
  const t = read(path.join(CONTRACTS, 'data-contract.md'));
  if (!t) return;
  if (!/unknown/.test(t)) {
    err('R4', 'data-contract 未声明 `unknown` 枚举约定（CONVENTIONS §1.1 铁律 3）');
  } else {
    ok('R4', '枚举 `unknown` 约定已声明');
  }
})();

// ─────────────────────────────────────────────────────────────
// R5 · 待裁决项登记（不是错误，是进度可见）
// ─────────────────────────────────────────────────────────────

// v0.2 扩写：原先只匹配「待裁决 / ⚠️待」，**漏掉了「待确认 / 待裁 / proposed」等写法**。
//            漏报比误报危险得多 —— 待裁项被静默忽略，就是「空集真空通过」的兄弟问题。
const PENDING = /待裁决|待裁定|待裁\b|待确认|待大人|proposed|⚠️\s*待/;
const EXPECTED_FLOOR = 3;   // 已知至少 3 条（ADR-0004/0005/0006）—— 低于此数即疑似漏报

/** 纯函数：便于 `--self-test` 反向测试 */
function findPending(text, file) {
  const out = [];
  text.split(/\r?\n/).forEach((l, i) => {
    if (PENDING.test(l) && !/^>\s*\*\*层/.test(l)) out.push(`${file}:${i + 1}`);
  });
  return out;
}

(function r5() {
  const all = [];
  for (const f of REQUIRED) {
    const t = read(path.join(CONTRACTS, f));
    if (!t) continue;
    all.push(...findPending(t, f));
  }

  if (all.length === 0) {
    warn('R5', '契约内未检出任何待裁项 —— 若 ADR 台账里还有 `proposed`，说明本规则漏报了');
  } else if (all.length < EXPECTED_FLOOR) {
    warn('R5', `${all.length} 处待裁项 —— 少于已知下限 ${EXPECTED_FLOOR}（ADR-0004/0005/0006），疑似漏报：${all.join(' / ')}`);
  } else {
    warn('R5', `${all.length} 处待裁项（须在**对应里程碑开工前**裁定，见 docs/DECISIONS.md）：${all.slice(0, 6).join(' / ')}${all.length > 6 ? ' …' : ''}`);
  }
})();

// ─────────────────────────────────────────────────────────────
// R6 · 配置表检查（dalu 侧存在时才跑）
//      v0.2 改造：**删去 `xx_` 前缀强制**（违反 ADR-0001）。
//      改为两条：① 目录存在则**不得为空**（禁止空集真空通过）；② 文件名**命名合规**。
// ─────────────────────────────────────────────────────────────

const DATA_DIR = 'F:/zxc/Project/qiuyuan-dalu/data';

(function r6() {
  if (!fs.existsSync(DATA_DIR)) {
    ok('R6', '配置表目录未建立（`qiuyuan-dalu/data/`）→ 跳过');
    return;
  }
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(json|csv|yaml|yml)$/i.test(e.name)) continue;
      files.push(path.relative(DATA_DIR, p).replace(/\\/g, '/'));
    }
  };
  walk(DATA_DIR);

  if (files.length === 0) {
    err('R6', '配置表目录存在但**无任何配置文件** —— 建了目录未放内容（禁止空集真空通过）');
    return;
  }

  // 命名合规：只允许小写字母 / 数字 / 下划线 / 连字符 / 点（**不再强制任何前缀** —— ADR-0001）
  const bad = files.filter(f => !/^[a-z0-9_\-./]+$/.test(f));
  if (bad.length) {
    err('R6', `配置表文件名含非法字符（须小写字母/数字/下划线/连字符）：${bad.join(', ')}`);
  } else {
    ok('R6', `配置表命名合规（${files.length} 个文件；前缀由 qiuyuan-dalu 自定 —— ADR-0001）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// --self-test · 反向测试（CONVENTIONS §7.1 纪律 2）
//   「**没失败过的校验脚本 = 未被验证过的校验脚本**」
//   注入坏样本，断言**必须被拦下**；再注入好样本，断言**不得误报**。
//   用法：node scripts/check-data.js --self-test
// ─────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  // [规则, 用例名, 实际结果, 期望结果]
  const cases = [
    // R7 · 坏样本必须被拦下
    ['R7', '标题含表名 → 必拦下', scanPhysicalNames('### 3.1 `xx_characters`（角色主表）').length > 0, true],
    ['R7', '代码块含表名 → 必拦下', scanPhysicalNames('```\nSELECT * FROM xx_roles;\n```').length > 0, true],
    ['R7', '表格首列含表名 → 必拦下', scanPhysicalNames('| `xx_players` | 玩家账号 |').length > 0, true],
    // R7 · 好样本不得误报
    ['R7', '实体名标题 → 不得误报', scanPhysicalNames('### 3.1 角色 `Role`（角色主实体）').length === 0, true],
    ['R7', '备查列引用表名 → 不得误报', scanPhysicalNames('| 账号 `Account` | `account` | `xx_players` | 平台账号层 |').length === 0, true],
    ['R7', '正文提到 `xx_` 前缀约定 → 不得误报', scanPhysicalNames('`xx_` 前缀是原型的占位约定，不构成约束').length === 0, true],
    // R2 · 缺待裁项标注必须报错
    ['R2', '缺 ADR-0004 标注 → 必报错', errataIssues('9 大境界 ADR-0006 金木水火土风雷冰 勘误一').errors.length > 0, true],
    ['R2', 'ADR 齐备 → 不得报错', errataIssues('9 大境界 ADR-0004 ADR-0006 金木水火土风雷冰 勘误一').errors.length === 0, true],
    ['R2', '作废笔误复活且未标注 → 必报错', errataIssues('9 大境界 ADR-0004 ADR-0006 金木水火土风雷冰 勘误一 金木水火土雷风冰').errors.length > 0, true],
    // R5 · 漏报防线
    ['R5', '「待确认」→ 必拦下', findPending('此处待确认', 'x.md').length > 0, true],
    ['R5', '「proposed」→ 必拦下', findPending('状态：`proposed`', 'x.md').length > 0, true],
    ['R5', '「待大人处置」→ 必拦下', findPending('待大人处置', 'x.md').length > 0, true],
    ['R5', '元信息头内的字样 → 不得误报', findPending('> **层**：L3　待裁决', 'x.md').length === 0, true],
    ['R5', '普通正文 → 不得误报', findPending('这是一个正常段落。', 'x.md').length === 0, true],
  ];

  const fails = cases.filter(([, , got, want]) => got !== want);

  console.log(c(1, '\n[check-data] 反向测试（--self-test）'));
  console.log(c(DIM, '  纪律：没失败过的校验脚本 = 未被验证过的校验脚本\n'));
  for (const [rule, name, got, want] of cases) {
    const okCase = got === want;
    console.log(`  ${okCase ? c(GREEN, '✓') : c(RED, '✗')} ${c(DIM, rule)}  ${name}`);
  }
  console.log(
    '\n' + (fails.length
      ? c(RED, `结果：不通过（${fails.length} / ${cases.length} 用例失败）`)
      : c(GREEN, `结果：通过（${cases.length} / ${cases.length} 用例，反向测试全绿）`)) + '\n'
  );
  process.exit(fails.length ? 1 : 0);
}

// ─────────────────────────────────────────────────────────────
// 报告
// ─────────────────────────────────────────────────────────────

console.log(c(1, '\n[check-data] 数据契约一致性校验'));
console.log(c(DIM, `  契约目录  ${CONTRACTS}`));
console.log(c(DIM, `  模式      ${STRICT ? 'strict（警告即失败）' : '常规'}\n`));

for (const p of passes) console.log(`  ${c(GREEN, '✓')} ${c(DIM, p.rule)}  ${p.msg}`);
for (const w of warns) console.log(`  ${c(YELLOW, '⚠')} ${c(DIM, w.rule)}  ${w.msg}`);
for (const e of errors) console.log(`  ${c(RED, '✗')} ${c(DIM, e.rule)}  ${e.msg}`);

const failed = errors.length > 0 || (STRICT && warns.length > 0);
console.log(
  '\n' +
  (failed
    ? c(RED, `结果：不通过（${errors.length} 错 / ${warns.length} 警告）`)
    : c(GREEN, `结果：通过（${passes.length} 项通过 / ${warns.length} 警告）`)) +
  '\n'
);

process.exit(failed ? 1 : 0);
