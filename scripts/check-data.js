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
// ─────────────────────────────────────────────────────────────

const ROOT_ORDER = '金木水火土风雷冰';   // 权威（勘误一）
const ROOT_ORDER_WRONG = '金木水火土雷风冰'; // 已作废的笔误

(function r2() {
  const t = read(path.join(CONTRACTS, 'data-contract.md'));
  if (!t) return;

  if (!t.includes(ROOT_ORDER)) {
    err('R2', `data-contract 未出现权威灵根顺序「${ROOT_ORDER}」（勘误一被删？）`);
  } else if (!t.includes('勘误一')) {
    warn('R2', '灵根顺序在场，但「勘误一」标题不见了');
  }

  if (!/9\s*大境界/.test(t) || !/0~8/.test(t)) {
    err('R2', 'data-contract 未声明「9 大境界 / 索引 0~8」（勘误二被删？）');
  }

  if (!errors.some(e => e.rule === 'R2')) {
    ok('R2', '两处勘误已钉死（灵根 5=风6=雷7=冰 / 境界 0~8 共 42 阶段）');
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

(function r5() {
  const all = [];
  for (const f of REQUIRED) {
    const t = read(path.join(CONTRACTS, f));
    if (!t) continue;
    t.split(/\r?\n/).forEach((l, i) => {
      if (/待裁决|⚠️\s*待/.test(l) && !/^>\s*\*\*层/.test(l)) {
        all.push(`${f}:${i + 1}`);
      }
    });
  }
  if (all.length) {
    warn('R5', `${all.length} 处待裁决/待核项（Phase 1 须裁定并落 ADR）：${all.join(' / ')}`);
  } else {
    ok('R5', '契约内无待裁决项');
  }
})();

// ─────────────────────────────────────────────────────────────
// R6 · 配置表检查（dalu 侧存在时才跑）
// ─────────────────────────────────────────────────────────────

const DATA_DIR = 'F:/zxc/Project/qiuyuan-dalu/data';

(function r6() {
  if (!fs.existsSync(DATA_DIR)) {
    ok('R6', '配置表目录未建立（`qiuyuan-dalu/data/`）→ 跳过');
    return;
  }
  let checked = 0;
  const bad = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(json|csv|yaml|yml)$/i.test(e.name)) continue;
      checked++;
      if (!/^xx_/.test(e.name)) bad.push(path.relative(DATA_DIR, p));
    }
  };
  walk(DATA_DIR);
  if (bad.length) {
    err('R6', `配置表文件名未带 \`xx_\` 前缀（CONVENTIONS §3.1）：${bad.join(', ')}`);
  } else {
    ok('R6', `配置表命名合规（${checked} 个文件）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// 报告
// ─────────────────────────────────────────────────────────────

const useColor = process.stdout.isTTY;
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : s);
const GREEN = 32, RED = 31, YELLOW = 33, DIM = 2;

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
