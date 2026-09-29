#!/usr/bin/env node
'use strict';

/**
 * check-asset-ref.js —— 资产引用契约校验（Phase 0 首版）
 *
 * 职责：
 *   ① 校验本仓 `contracts/asset-ref-contract.md` 自身（边界声明 / 交付基准）；
 *   ② **跨层一致性**：本契约列出的资产分类 ↔ L2 权威枚举（`gbe-assets/catalog/schema/asset.v2.schema.json`）；
 *   ③ 校验场景清单 `resource-manifest.yaml`（存在时）；
 *   ④ 引用的 kit 在 `gbe-assets/kits/` 实际存在（只读交叉校验）。
 *
 * 零依赖。用法：`node scripts/check-asset-ref.js [--strict]`
 * 退出码：0 = 通过 / 1 = 失败
 *
 * ── 关键边界（CONVENTIONS §2 层次规则 1）──────────────────────────
 *   本脚本**不校验资产本体是否合法** —— 那是 L2 `@gbe/schema` 的事。
 *   若将来有人在这里加「校验几何/材质/许可」的规则，就是跨层重复实现，必须删。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTRACT = path.join(ROOT, 'contracts', 'asset-ref-contract.md');
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
  // { id: 'A6', from: 'X-0000', desc: '…', due: 'M2' },
];

/** 纯函数：待实现规则的提示文本（空名单 → `null`，便于 `--self-test`） */
function pendingNotice(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list
    .map(r => `${r.id || '?'}(from ${r.from || '⚠缺来源'}${r.due ? ', due ' + r.due : ''})`)
    .join(' / ');
}

const GBE_ASSETS = 'F:/zxc/Project/gbe-assets';
const L2_ASSET_SCHEMA = path.join(GBE_ASSETS, 'catalog', 'schema', 'asset.v2.schema.json');
const GBE_KITS = path.join(GBE_ASSETS, 'kits');

// 场景清单的搜索位置（本仓 + 下游工程）
const MANIFEST_DIRS = [
  path.join(ROOT, 'contracts', 'manifests'),
  'F:/zxc/Project/qiuyuan-dalu/data',
];

const errors = [];
const warns = [];
const passes = [];
const err = (r, m) => errors.push({ rule: r, msg: m });
const warn = (r, m) => warns.push({ rule: r, msg: m });
const ok = (r, m) => passes.push({ rule: r, msg: m });

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

// ─────────────────────────────────────────────────────────────
// A1 · 契约边界声明必须存在（防跨层重复实现）
// ─────────────────────────────────────────────────────────────

(function a1() {
  const t = read(CONTRACT);
  if (!t) { err('A1', 'asset-ref-contract.md 不存在'); return; }
  const hasBoundary = /不重造校验|不重实现|不跨层引用/.test(t) && /@gbe\/schema/.test(t);
  if (!hasBoundary) {
    err('A1', '契约未声明「不重造 L2 校验」的边界（CONVENTIONS §2 层次规则 1）');
  } else {
    ok('A1', '契约边界声明在场（资产本体校验归 L2 `@gbe/schema`）');
  }
})();

// ─────────────────────────────────────────────────────────────
// A2 · 交付基准必须与 GBE 一致
// ─────────────────────────────────────────────────────────────

(function a2() {
  const t = read(CONTRACT);
  if (!t) return;
  const checks = [
    [/\+Y up|`\+Y up`/, '+Y up'],
    [/-Z forward|`-Z forward`/, '-Z forward'],
    [/米（m）|单位.*米/, '米'],
    [/引擎导入器/, 'up 轴由引擎导入器负责'],
  ];
  const miss = checks.filter(([re]) => !re.test(t)).map(([, n]) => n);
  if (miss.length) {
    err('A2', `交付基准声明缺失：${miss.join(' / ')}`);
  } else {
    ok('A2', '交付基准与 GBE 一致（+Y up / -Z forward / 米；轴转换归引擎导入器）');
  }
})();

// ─────────────────────────────────────────────────────────────
// A3 · 跨层一致性：契约分类 ↔ L2 权威枚举
// ─────────────────────────────────────────────────────────────

(function a3() {
  const raw = read(L2_ASSET_SCHEMA);
  if (raw === null) {
    warn('A3', `L2 schema 不可读（${L2_ASSET_SCHEMA}）→ 跳过跨层比对`);
    return;
  }
  let l2cats;
  try {
    l2cats = new Set(JSON.parse(raw).properties.category.enum);
  } catch (e) {
    err('A3', `L2 schema 解析失败：${e.message}`);
    return;
  }

  const t = read(CONTRACT) || '';
  // 段落要到**下一个标题**为止 —— 初版截到首个空行，结果分类表没进解析范围，
  // 空集导致「全部命中」的真空通过（比报错更危险）。
  const seg = t.match(/###\s*3\.1[\s\S]*?(?=\n###|\n##|$)/);
  if (!seg) { err('A3', '契约 §3.1 分类表解析失败'); return; }

  // 契约用「组前缀 + 叶名」记法，需还原成 L2 的全路径
  const groups = [...seg[0].matchAll(/`([a-z-]+)\/\*`\s*\|\s*([^|\n]+)/g)];
  const expanded = new Set();
  for (const [, grp, list] of groups) {
    for (const item of list.split('·')) {
      const leaf = item.replace(/[`\s]/g, '');
      if (leaf && /^[a-z-]+$/.test(leaf)) expanded.add(`${grp}/${leaf}`);
    }
  }
  if (expanded.size === 0) {
    err('A3', '未能从契约 §3.1 解析出任何分类 → 比对无意义（禁止空集真空通过）');
    return;
  }

  const missing = [...l2cats].filter(c => !expanded.has(c));
  const extra = [...expanded].filter(c => !l2cats.has(c));

  if (extra.length) {
    err('A3', `契约列出的分类在 L2 权威枚举中不存在：${extra.join(', ')}`);
  }
  if (missing.length) {
    // L2 有而契约未列：只警告（契约可以只覆盖用到的子集）
    warn('A3', `L2 有 ${missing.length} 个分类未写入契约（未用到可忽略）：${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ' …' : ''}`);
  }
  if (!extra.length) {
    ok('A3', `契约分类全部命中 L2 权威枚举（契约解析 ${expanded.size} 项 / L2 共 ${l2cats.size} 项，覆盖 ${expanded.size}/${l2cats.size}）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// A4 · kit 交叉校验（只读上游）
// ─────────────────────────────────────────────────────────────

(function a4() {
  if (!fs.existsSync(GBE_KITS)) {
    warn('A4', `gbe-assets/kits 不可读（${GBE_KITS}）→ 跳过 kit 校验`);
    return;
  }
  const kits = fs.readdirSync(GBE_KITS, { withFileTypes: true })
    .filter(e => e.isDirectory()).map(e => e.name);
  if (kits.length === 0) {
    warn('A4', 'gbe-assets/kits 为空');
    return;
  }
  const t = read(CONTRACT) || '';
  const declared = [...new Set([...t.matchAll(/`(cn-[a-z-]+)`/g)].map(m => m[1]))];
  const unknown = declared.filter(k => !kits.includes(k));
  if (unknown.length) {
    err('A4', `契约提到的 kit 在 gbe-assets/kits 中不存在：${unknown.join(', ')}`);
  } else {
    ok('A4', `kit 引用有效（上游在库 ${kits.length} 个：${kits.join(', ')}）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// A5 · 场景清单校验（存在时才跑）
// ─────────────────────────────────────────────────────────────

const REF_RE = /^([a-z0-9-]+)\.([a-z0-9-]+)\.([a-z0-9-]+)@(\d+\.\d+\.\d+)$/;

function findManifests() {
  const found = [];
  for (const dir of MANIFEST_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const walk = (d, depth) => {
      if (depth > 4) return;
      let entries;
      try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (e.name !== '.git' && e.name !== 'node_modules') walk(p, depth + 1); }
        else if (/^resource-manifest\.ya?ml$/i.test(e.name)) found.push(p);
      }
    };
    walk(dir, 0);
  }
  return found;
}

(function a5() {
  const manifests = findManifests();
  if (manifests.length === 0) {
    ok('A5', '暂无场景清单（`resource-manifest.yaml`）→ 跳过');
    return;
  }

  for (const p of manifests) {
    const rel = path.relative(ROOT, p).replace(/\\/g, '/');
    const t = read(p) || '';

    // 环境三项
    for (const [label, re] of [['up_axis', /up_axis:\s*["']?\+Y/i], ['forward_axis', /forward_axis:\s*["']?-Z/i], ['unit', /unit:\s*["']?m["']?\s*$/im]]) {
      if (!re.test(t)) err('A5', `${rel}：env.${label} 缺失或与交付基准不一致`);
    }

    // ref 格式
    const refs = [...t.matchAll(/ref:\s*["']?([^"'\s#]+)/g)].map(m => m[1]);
    for (const r of refs) {
      if (!REF_RE.test(r)) {
        err('A5', `${rel}：引用格式非法「${r}」（应为 <kit>.<leaf>.<name>@<version>）`);
      }
    }

    // rotation 弧度（90/180/270 整数 → 疑似写了角度）
    [...t.matchAll(/rotation:\s*\[([^\]]*)\]/g)].forEach((m, i) => {
      const nums = m[1].split(',').map(s => Number(s.trim()));
      if (nums.some(n => Number.isFinite(n) && Math.abs(n) > 6.5 && n % 90 === 0)) {
        warn('A5', `${rel}：第 ${i + 1} 处 rotation 含 90/180/270 整数值 → 疑似写了「角度」（契约单位为**弧度**）`);
      }
    });

    // 实例 id 唯一
    const ids = [...t.matchAll(/^\s*-?\s*id:\s*(\S+)/gm)].map(m => m[1]);
    const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
    if (dup.length) err('A5', `${rel}：实例 id 重复（${[...new Set(dup)].join(', ')}）`);
  }

  if (!errors.some(e => e.rule === 'A5')) {
    ok('A5', `场景清单校验通过（${manifests.length} 份）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// 报告
// ─────────────────────────────────────────────────────────────

const useColor = process.stdout.isTTY;
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : s);
const GREEN = 32, RED = 31, YELLOW = 33, DIM = 2;

console.log(c(1, '\n[check-asset-ref] 资产引用契约校验'));
console.log(c(DIM, `  契约      ${CONTRACT}`));
console.log(c(DIM, `  上游(L2)  ${GBE_ASSETS}`));
console.log(c(DIM, `  模式      ${STRICT ? 'strict（警告即失败）' : '常规'}\n`));

// 机制③：待实现规则必须让人看见（不许静默 · 来源 X-0016）
{ const pend = pendingNotice(PENDING_RULES); if (pend) (STRICT ? err : warn)('PEND', `${PENDING_RULES.length} 条「已承诺未实现」规则：${pend}`); }
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
