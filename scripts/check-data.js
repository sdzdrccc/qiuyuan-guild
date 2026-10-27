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
  // { id: 'R11', from: 'X-0000', desc: '…', due: 'M2' },
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
// R2 · §0 勘误与已裁口径必须钉死（防误删 / 防静默改回）
//      v0.2：境界部分**不再钉 `0~8`**（那与 ADR-0006 的主张相反）。
//      v0.3：ADR-0004 / 0006 **已裁定**，本规则改为**钉住裁定结果**——
//            契约必须仍引用这两条 ADR（口径不得被静默改回原型口径）。
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
  // v0.3：ADR-0004 / 0006 **已裁定** —— 契约必须仍引用它们。
  //       作用由「标注待裁」转为「钉住裁定结果」：口径不得被静默改回原型口径。
  if (!/ADR-0004/.test(t)) {
    out.errors.push('未引用 ADR-0004（境内 9 层）—— 已裁口径不得静默消失');
  }
  if (!/ADR-0006/.test(t)) {
    out.errors.push('未引用 ADR-0006（realm_id 1–9）—— 已裁口径不得静默消失');
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
    ok('R2', '两处勘误已钉死 + 已裁口径的 ADR 引用在场（ADR-0004 境内 9 层 / ADR-0006 基址 1–9）');
  }
})();

// ─────────────────────────────────────────────────────────────
// ★ v 扩模（X-0043 · ADR-0027 ①）：原只认 `xx_`（原型前缀），契约里 3 处 `qydl_*` 下游物理表名
//   **看不见**（X-0032 G-6）—— 现已从契约摘除，判据同步扩到 `qydl_`，再进即红。
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
    if (/^#{2,4}\s[^\n]*(?:xx|qydl)_[a-z]/.test(l)) {
      out.push({ line: i + 1, kind: '标题含表名' });
      return;
    }
    // ② 代码块里的表名 —— 说明物理细节进了示例
    if (inCode && /(?:xx|qydl)_[a-z]/.test(l)) {
      out.push({ line: i + 1, kind: '代码块含表名' });
      return;
    }
    // ③ 字段表首列直接写表名（| `xx_foo` | ...）
    if (/^\|\s*`(?:xx|qydl)_[a-z][^`]*`\s*\|/.test(l)) {
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
    ok('R7', 'ADR-0001 生效：契约标题 / 代码块 / 字段表首列均无物理表名（xx_ / qydl_ 双前缀 · ADR-0027 ① 扩模）');
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
/**
 * R4 判据的作用域 —— 铁律 3 的原文是「凡**向后回填**的枚举，必须允许未核实取值」。
 *
 * ★ 「向后回填」在本契约里有**可机械识别的形态**：取值不由本仓掌握，而是指向别处或待并入 ——
 *   `归 dalu <表>` / `需求层未列` / `待上游并入` / `属原型扩展`。这类枚举若已落成取值表却不留哨兵，才是违规。
 * ★ 反过来，**本仓自定义的封闭枚举**（`status = 0/1/2`、`gender = 0/1`）**不在铁律 3 的适用范围内**：
 *   它们没有"未核实"这种状态，硬塞一个 `unknown=未核实` 只会造出一个没人能写入的死值，
 *   看着像合规、实际是**假落地**（比漏标更坏 —— 它会骗过下一个人）。
 *   我上一版判据就是把枚举行一律要求哨兵，误杀了这两个封闭枚举（`X-0033` §四 同型错误的第三次）。
 */
const ENUM_ROW_RE = /^\|\s*`([a-z0-9_]+)`\s*\|[^|]*\|[^|]*\|\s*`([^`]*\d+\s*[=＝][^`]*)`\s*\|/;
const BACKFILL_MARK_RE = /(归\s*dalu|需求层未列|待上游并入|属原型扩展)/;
const UNKNOWN_TOKEN_RE = /unknown|未核实|-1\s*[=＝]/;

/** 纯函数：从契约正文抽出枚举（字段名 → 取值串），与是否含未核实哨兵 */
function scanEnums(text) {
  const out = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = ENUM_ROW_RE.exec(line);
    if (!m) continue;
    const [, field, values] = m;
    if ((values.match(/\d+\s*[=＝]/g) || []).length < 2) continue; // 单项不算枚举
    out.push({ field, values, hasUnknown: UNKNOWN_TOKEN_RE.test(values) });
  }
  return out;
}

/** 纯函数：抽出「向后回填」的引用点（字段/实体名 + 那句话本身） */
function scanBackfillRefs(text) {
  const out = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!BACKFILL_MARK_RE.test(line)) continue;
    const named = /`([a-z0-9_]+)`/.exec(line);
    out.push({ where: named ? named[1] : line.slice(0, 40), line });
  }
  return out;
}

(function r4() {
  const t = read(path.join(CONTRACTS, 'data-contract.md'));
  if (!t) return;

  // ① 铁律 3 本身必须在场（原判据的合理内核，保留）
  if (!/枚举必须留/.test(t)) {
    err('R4', 'data-contract 未声明铁律 3「枚举必须留 unknown」（CONVENTIONS §1.1）');
    return;
  }

  const enums = scanEnums(t);
  const backfillRefs = scanBackfillRefs(t);

  // ② 已落成取值表的枚举：只查**带回填标注**的那些（行内或同段有回填标记）
  const backfilled = enums.filter((e) => BACKFILL_MARK_RE.test(e.values));
  const badBackfilled = backfilled.filter((e) => !e.hasUnknown);
  if (badBackfilled.length) {
    err(
      'R4',
      `${badBackfilled.length} 个**向后回填**的枚举没留未核实哨兵：` +
        badBackfilled.map((e) => `${e.field}（${e.values}）`).join(' ｜ ')
    );
  }

  // ③ 封闭枚举：如实报数，明确写「不适用铁律 3」，**不判红、也不假装它们合格**
  const closed = enums.filter((e) => !BACKFILL_MARK_RE.test(e.values));
  if (closed.length) {
    ok('R4', `本仓自定义的封闭枚举 ${closed.length} 个（${closed.map((e) => e.field).join(' / ')}）—— **不在铁律 3 适用范围内**，不要求未核实取值`);
  }

  // ④ 回填引用点若一条都没落地 → 看得见，但按 warn（契约自己写了"待并入 / 归他仓"= 有去向，不是违约）
  if (backfillRefs.length && !backfilled.length) {
    warn(
      'R4',
      `${backfillRefs.length} 处「向后回填」引用（${backfillRefs.map((r) => r.where).join(' / ')}）` +
        `**尚未落成取值表** ⇒ 铁律 3 目前对它们无可判对象；契约已写明去向（待上游并入 / 名单归 dalu），` +
        `并入时必须带未核实哨兵 —— 见 ADR-0002`
    );
  } else if (!enums.length && !backfillRefs.length) {
    err('R4', '既无枚举取值表、也无回填引用 → 判据无从生效（禁止空集真空通过）');
  }
})();

// ─────────────────────────────────────────────────────────────
// R5 · 待裁决项登记（不是错误，是进度可见）
// ─────────────────────────────────────────────────────────────

// v0.2 扩写：原先只匹配「待裁决 / ⚠️待」，**漏掉了「待确认 / 待裁 / proposed」等写法**。
//            漏报比误报危险得多 —— 待裁项被静默忽略，就是「空集真空通过」的兄弟问题。
// v0.3 改造：**取消魔法数字下限**（原 `EXPECTED_FLOOR = 3`，ADR 裁定后必然失效），
//            改为**与 ADR 台账联动** —— 契约的待裁项与 `docs/DECISIONS.md` 的 `proposed` 条数
//            必须**方向一致**。这才是真正的漏报防线。
// ★ X-0043 修一处死分支：原 `待裁\b` 的 `\b` 只认 ASCII 词字符，汉字后永无边界
//   =>「待裁）」「待裁项」这类**漏报**。改纯 `待裁`（长形态本就在同 alternation 里，不漏匹配）。
const PENDING = /待裁决|待裁定|待裁|待确认|待大人|proposed|⚠️\s*待/;

/** 纯函数：便于 `--self-test` 反向测试 */
function findPending(text, file) {
  const out = [];
  text.split(/\r?\n/).forEach((l, i) => {
    if (PENDING.test(l) && !/^>\s*\*\*层/.test(l)) out.push(`${file}:${i + 1}`);
  });
  return out;
}

/** 从 ADR 台账索引表数 `proposed` 条数（null = 台账不存在） */
function countProposedAdr() {
  const t = read(path.join(ROOT, 'docs', 'DECISIONS.md'));
  if (!t) return null;
  const m = t.match(/^\|\s*ADR-\d+\s*\|[^|]*\|\s*`proposed`/gm);
  return m ? m.length : 0;
}

/** 纯函数：判定待裁项与 ADR 台账是否自洽（便于反向测试） */
function classifyPending(allCount, proposedCount) {
  if (proposedCount === null) return 'adr-missing';
  if (proposedCount > 0 && allCount === 0) return 'suspect-miss';
  if (proposedCount === 0 && allCount === 0) return 'clean';
  return 'pending';
}

(function r5() {
  const all = [];
  for (const f of REQUIRED) {
    const t = read(path.join(CONTRACTS, f));
    if (!t) continue;
    all.push(...findPending(t, f));
  }
  const proposed = countProposedAdr();

  switch (classifyPending(all.length, proposed)) {
    case 'adr-missing':
      warn('R5', `检出 ${all.length} 处待裁项，但**未找到 docs/DECISIONS.md** —— 无法交叉核对`);
      break;
    case 'suspect-miss':
      warn('R5', `ADR 台账有 ${proposed} 条 \`proposed\`，但契约**未检出任何待裁项** —— 疑似漏报（本规则是防漏报的最后一道）`);
      break;
    case 'clean':
      ok('R5', '契约无待裁项，ADR 台账亦无 `proposed` —— 两侧一致');
      break;
    default: {
      const note = proposed > 0
        ? `（含 ${proposed} 条 ADR \`proposed\`，须在**对应里程碑开工前**裁定）`
        : '（均为里程碑级；ADR 台账无 `proposed`）';
      warn('R5', `${all.length} 处待裁项${note}：${all.slice(0, 6).join(' / ')}${all.length > 6 ? ' …' : ''}`);
    }
  }
})();

// ─────────────────────────────────────────────────────────────
// R6 · 配置表检查（dalu 侧存在时才跑）
//      v0.2 改造：**删去 `xx_` 前缀强制**（违反 ADR-0001）。
//      v0.21 改造：区分「**骨架期**」与「**空目录错**」——
//        dalu 建仓时会先落 `data/` 骨架（里面只有 `.gitkeep`），**此时尚无配置表是正常的**；
//        而「**有非占位文件却无配置表**」才是「建了目录未放内容」。
//        来源：v0.21 实测 —— dalu 首次提交后 R6 立刻误报（门禁**确实在联动**，但判据过粗）。
//      ⚠️ 本规则此前**没有反向测试**（违反 §7.1 纪律 2）—— v0.21 一并补齐（6 用例）。
// ─────────────────────────────────────────────────────────────

// ★ 环境变量覆盖点（X-0044）：CI 可搬运；不设则回退本机默认路径。
const DATA_DIR = `${process.env.QYD_DALU_REPO || 'F:/zxc/Project/qiuyuan-dalu'}/data`;

/** 配置表文件（Luban 表源：Excel / CSV / JSON —— 上游 §6.2） */
const CFG_FILE = /\.(json|csv|ya?ml|xlsx?)$/i;
/** 占位文件 —— 只有它们在场 = **骨架期**，不算「建了目录未放内容」 */
const CFG_PLACEHOLDER = /(^|\/)(\.gitkeep|\.gitignore|\.gitattributes|\.keep|README\.md)$/i;

/** 纯函数：便于 `--self-test` 反向测试。入参为目录下**所有**文件（相对路径 · `/` 分隔） */
function configDirVerdict(allFiles) {
  const cfg = allFiles.filter(f => CFG_FILE.test(f));
  const real = allFiles.filter(f => !CFG_PLACEHOLDER.test(f));
  if (cfg.length > 0) {
    const bad = cfg.filter(f => !/^[a-z0-9_\-./]+$/.test(f));
    return { kind: bad.length ? 'badname' : 'ok', cfg, bad, real };
  }
  return { kind: real.length === 0 ? 'skeleton' : 'empty-err', cfg, bad: [], real };
}

(function r6() {
  if (!fs.existsSync(DATA_DIR)) {
    ok('R6', '配置表目录未建立（`qiuyuan-dalu/data/`）→ 跳过');
    return;
  }
  const all = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      all.push(path.relative(DATA_DIR, p).replace(/\\/g, '/'));
    }
  };
  walk(DATA_DIR);

  const v = configDirVerdict(all);
  if (v.kind === 'skeleton') {
    ok('R6', `配置表目录为**骨架期**（${all.length} 个占位文件，尚无配置表）→ 跳过（M1 起放表）`);
  } else if (v.kind === 'empty-err') {
    err('R6', `配置表目录含 ${v.real.length} 个非占位文件，但**无任何配置表**（.xlsx / .csv / .json）—— 建了目录未放内容（禁止空集真空通过）`);
  } else if (v.kind === 'badname') {
    err('R6', `配置表文件名含非法字符（须小写字母/数字/下划线/连字符）：${v.bad.join(', ')}`);
  } else {
    ok('R6', `配置表命名合规（${v.cfg.length} 个文件；前缀由 qiuyuan-dalu 自定 —— ADR-0001）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// R8 · Markdown 表格结构（v0.4 新增）
//   缘起：ROADMAP.md §1 的 M2~M17 行把「依赖」值填进了「状态」列。
//        列数**恰好齐**（尾部空单元格补齐），所以任何「数管道」的检查都查不出来，
//        最后由大人在 Obsidian 里肉眼发现 —— **门禁缺位**。
//   两条判据（Obsidian / GitHub / markdown-it 通用）：
//     ① 数据行列数须与表头一致。
//     ② 行尾空单元格 → **warn**（疑似列位错填；确为空时可忽略）。
//   注：**列数一致 ≠ 列位正确** —— ①只拦「数得出来」的错，②才是防错位的软信号。
//
//   ★★ 勘误（2026-09-30 · `X-0023`）：原 ①「表格块**前一行必须为空行**」**已删**。
//     理由：该判据**依据的事实是错的** —— cmark-gfm 官方测试集明文有
//       "a table can be recognised when separated from a paragraph of text without an empty line"
//       （`test/extensions.txt` §Tables：`123\n456\n| a | b |\n| ---| --- |\nd | e` → **渲染出 `<table>`**）；
//       实测 markdown-it 与 GitHub 线上渲染（`POST /markdown` · mode=gfm）**亦均能出表**。
//     ⇒ 属「**判据过宽 → 误报**」：把**能正常渲染**的写法（尤其「标题 + 表格」）报成错误。
//       实证：2026-09-30 在 dalu `docs/GUILD-PROPOSAL-X0015.md` 误报 3 处「`### 落点` + 表格」。
//     **误报率高 = 没门禁**（`CONVENTIONS.md` §7.1 纪律 1）⇒ **删，而非降级**：
//       留住一条基于错事实的 `warn` 仍是负债。（若要重新引入，须附**复现用例**。）
// ─────────────────────────────────────────────────────────────

  const TROW = /^\s*\|.*\|\s*$/;            // 表头 / 数据行
  const TDELIM = /^\s*\|[\s:|-]+\|\s*$/;    // 分隔行（|---|---|）

  /**
   * 纯函数：一行的**列数**。
   * ★★ 2026-10-13 修正（`X-0040`）：原实现是**裸 `split('|')`** ⇒ ★ 把
   *   单元格里的**转义竖线 `\|`** 也当成了列分隔符 ⇒ ★ **误报**。
   *   ★ 而 `\|` 是 Markdown 表格里**写一个字面竖线的规范写法**（GitHub / Obsidian /
   *     markdown-it 都认）⇒ ★ 属「**判据过宽 → 误报**」。
   *   ★★ 实证：`reviews/X-0040.md` 里写「转义竖线 `\|`」这一句，被判「列数 4 ≠ 表头 3」。
   *   ★ 判据：**数结构之前，先把它"不是结构"的部分去掉。**
   */
  function tableCols(line) {
    return line.replace(/\\\|/g, '').split('|').length - 2;
  }

/** 纯函数：便于 `--self-test` 反向测试 */
function scanTables(text, file) {
  const out = { errors: [], warns: [], tables: 0 };
  const lines = text.split(/\r?\n/);

  // 先标记代码围栏内的行 —— 伪表格不得误报
  const inCode = [];
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) { inCode[i] = true; fence = !fence; continue; }
    inCode[i] = fence;
  }

  for (let i = 0; i < lines.length - 1; i++) {
    if (inCode[i]) continue;
    if (!TROW.test(lines[i]) || !TDELIM.test(lines[i + 1])) continue;

    out.tables++;
    // ① ② 逐行核对（原「表格前一行须为空行」判据已于 2026-09-30 删除 —— 见上方勘误）
      const cols = tableCols(lines[i]);
      let j = i + 2;
      for (; j < lines.length && !inCode[j] && TROW.test(lines[j]); j++) {
        const n = tableCols(lines[j]);
      if (n !== cols) {
        out.errors.push(`${file}:${j + 1} 列数 ${n} ≠ 表头 ${cols}`);
      } else if (cols > 1 && /\|\s*\|\s*$/.test(lines[j])) {
        out.warns.push(`${file}:${j + 1} 行尾空单元格 —— 核对是否列位错填`);
      }
    }
    i = j - 1;   // 跳过整个表块
  }
  return out;
}

(function r8() {
  const dirs = [CONTRACTS, path.join(ROOT, 'docs'), path.join(ROOT, 'registry'), path.join(ROOT, 'reviews')];
  const files = [];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isFile() && e.name.endsWith('.md')) files.push(path.join(d, e.name));
    }
  }
  const rootReadme = path.join(ROOT, 'README.md');
  if (fs.existsSync(rootReadme)) files.push(rootReadme);

  let tables = 0;
  for (const f of files) {
    const t = read(f);
    if (t === null) continue;
    const r = scanTables(t, path.relative(ROOT, f).replace(/\\/g, '/'));
    tables += r.tables;
    r.errors.forEach(m => err('R8', m));
    r.warns.forEach(m => warn('R8', m));
  }

  if (tables === 0) {
    err('R8', '未扫描到任何 Markdown 表格 —— 疑似扫描范围出错（禁止空集真空通过）');
  } else if (!errors.some(e => e.rule === 'R8')) {
    ok('R8', `Markdown 表格结构合规（${tables} 张表：列数 / 尾格）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// R9 · 第一设计原则的锚点一致性（v0.5 新增 · ADR-0009）
//   缘起：「世界真实性优先」是**第一原则**，但四处入口是分开的 ——
//         新人看 README、AI 看 AGENTS、工程约定看 CONVENTIONS、总纲看方案。
//         **只写一处 = 其余入口的人读不到**；写了四处又容易改一处漏三处。
//   与本规则的分工（重要）：
//     本规则查的是「**锚点存在性**」—— 可机械校验。
//     原则**有没有被遵守**、三问答得对不对 —— 是**语义判断**，只能人判
//       （`CONVENTIONS.md` §7.4 第 1 号人工检查点）。
//     **拿脚本假装能判后者 = 虚假的安心**（§7.1 纪律 1 同类病）。
// ─────────────────────────────────────────────────────────────

const PRINCIPLE_KEY = '世界真实性';
const PRINCIPLE_ANCHORS = [
  'README.md',
  'AGENTS.md',
  'docs/CONVENTIONS.md',
  'docs/MULTI-AGENT-DEV-PLAN.md',
];

/** 纯函数：便于 `--self-test` 反向测试。入参 [[文件, 全文], …]，返回**缺失锚点的文件**数组 */
function missingAnchors(key, pairs) {
  return pairs.filter(pair => !pair[1].includes(key)).map(pair => pair[0]);
}

(function r9() {
  const pairs = [];
  for (const rel of PRINCIPLE_ANCHORS) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) {
      err('R9', `锚点文件不存在：${rel}`);
      continue;
    }
    pairs.push([rel, read(p) || '']);
  }

  if (pairs.length === 0) {
    err('R9', '未读到任何锚点文件 —— 禁止空集真空通过');
    return;
  }

  const missing = missingAnchors(PRINCIPLE_KEY, pairs);
  if (missing.length) {
    err('R9', `第一设计原则「${PRINCIPLE_KEY}」缺锚点：${missing.join(' / ')} —— 只写一处，其余入口的人读不到`);
  } else if (!errors.some(e => e.rule === 'R9')) {
    ok('R9', `第一设计原则「${PRINCIPLE_KEY}」四处锚点齐备（${pairs.length}/${PRINCIPLE_ANCHORS.length}）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// R10 · 配置表**内容**断言（v0.27 新增 · 来源 X-0015）
//   缘起：R6 只查**文件名合法性**——于是「配置表内容全错」也能绿灯通过。
//        而 `SPIRIT-ROOT-FORMULA.md` §6.3 与 `M1-IMPLEMENTATION.md` §3.2③
//        **早就写明「表校验（check-data 须加）」**，却因为写在**下游文档**里、
//        而脚本归 guild，**这句承诺无处追踪**，一直没人实现。
//        → 实测证据：X-0015 §二 · 「门禁空过」一节。
//   本规则只收**机械可比**的判据；语义判断一律留给人工检查点（§7.1 纪律 6）。
//   四条子规则：
//     ㈠ CSV 每个数据行的字段数 = `##var` 列数     ← 直接治 X-0015 §二-4 那个坑
//     ㈡ `prob_ppm` 列合计 = 1000000（概率表）
//     ㈢ `quality` 升序时倍率两列单调不减（裁定 K 的目的就是让这条能加上）
//     ㈣ 用 `qydl_game_config` 的公式参数**手算**品级值，须与表内 ppm 一致
// ─────────────────────────────────────────────────────────────

const DALU_DATA = `${process.env.QYD_DALU_REPO || 'F:/zxc/Project/qiuyuan-dalu'}/data`;   // ★ 同上（X-0044）

/**
 * 纯函数：解析 Luban CSV 表源（只认 A 列为 `##var` 的表）
 * 返回 null = 不是本规则认得形态（不报错，直接跳过）
 */
function parseLubanCsv(text) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return null;
  const header = lines[0].split(',');
  if (!/^##var\b/.test(header[0].trim())) return null;
  const fields = header.slice(1).map(s => s.trim());
  const rows = lines.slice(1).map((l, i) => {
    const cells = l.split(',');
    const rec = {
      __line: i + 2,
      __cells: cells.length,
      __extra: cells.slice(fields.length + 1),
    };
    fields.forEach((f, k) => { rec[f] = (cells[k + 1] === undefined ? '' : cells[k + 1]).trim(); });
    return rec;
  });
  return { fields, rows };
}

/**
 * 纯函数：键值表行 → `{键: 值}`。
 * ★ dalu `T-0139` 起表头由 `key/value` 改为 `param_key/param_value` —— 两种都认，
 *   否则 R10 公式复现会**静默跳过**（`X-0062` 实测：跳过长得像绿）。
 */
function configRowsToMap(rows) {
  const out = {};
  for (const r of rows || []) {
    const k = r.param_key !== undefined ? r.param_key : r.key;
    const v = r.param_value !== undefined ? r.param_value : r.value;
    if (k !== undefined && k !== '') out[k] = v;
  }
  return out;
}

/** 纯函数：㈠ 字段数不齐的行（多出的格子 = 未转义逗号） */
function csvWidthIssues(parsed) {
  if (!parsed) return [];
  const expect = parsed.fields.length + 1;
  return parsed.rows
    .filter(r => r.__cells !== expect)
    .map(r => ({ line: r.__line, got: r.__cells, expect, extra: r.__extra }));
}

/** 纯函数：㈡ 概率合计（该表无 `prob_ppm` 列时返回 null） */
function probPpmSum(parsed) {
  if (!parsed || !parsed.fields.includes('prob_ppm')) return null;
  return parsed.rows.reduce((a, r) => a + Number(r.prob_ppm || 0), 0);
}

/** 纯函数：㈢ 单调不减检查，返回第一个违例（无违例返回 null） */
function firstMonotonicBreak(values) {
  for (let i = 1; i < values.length; i++) {
    if (!(Number(values[i]) >= Number(values[i - 1]))) {
      return { index: i, prev: values[i - 1], cur: values[i] };
    }
  }
  return null;
}

/** 纯函数：㈣ 公式① 复算（返回每行 {q, want, got, diff}） */
function computeGradeFormula(parsed, params) {
  if (!parsed || !params) return null;
  const { v, anchor, p } = params;
  if (![v, anchor, p].every(Number.isFinite)) return null;
  if (!parsed.fields.includes('wuxing_min') || !parsed.fields.includes('damage_mult_ppm')) return null;
  return parsed.rows.map(r => {
    const nw = (Number(r.wuxing_min) + Number(r.wuxing_max)) / 2;
    const nv = (Number(r.variant_min) + Number(r.variant_max)) / 2;
    const C = nw + nv;
    const nEff = nw + nv * v;
    const want = Math.round(Math.pow(anchor / C, p) * Math.pow(nEff / C, p) * 1e6);
    const got = Number(r.damage_mult_ppm);
    const gotCul = Number(r.cultivation_mult_ppm);
    return { q: r.quality, want, got, gotCul, diff: got - want, diffCul: gotCul - want };
  });
}

/**
 * itemDomainIssues —— R10 的物品域内容断言（★ 纯函数，好让 --self-test 注入样本）
 *
 * 判据来源：`contracts/data-contract.md` §7.3 品质轨与取值域 / §7.4 物品定义 / §7.6 容量两轴相乘 / §8.1 used_slots
 *   ＋ 需求层《法宝系统》强化表（至宝不分阶）· 来源卡 `X-0058` / `ADR-0033`（dalu `T-0115`）。
 *
 * ★ 最要紧的三条：
 *   ① quality 上界**由档表算出**，越界必须拦（契约禁止写死 54 / 63）；
 *   ② 容量倍率 = 0 只允许给「上游未裁」那一档（现 = 地品）⇒ 别的档给 0 就是偷偷兜底；
 *   ③ 等级段轴末段仍是 54 —— ★ 这条把「四张表留六档」的已知分叉钉成看得见的：谁改成 63 就是替上游补了数 ⇒ 必红。
 */
/**
 * 纯函数：九境修为区间必须首尾相接（`ADR-0039`）。
 * ★ 为什么必须机器判：启动期只校验「不重叠」，**不校验「相接」** ⇒ 4 处断档静默存在，
 *   玩家会在不可达区间前卡住（`X-0063` 实测 9,999 / 9,999,999 / 99,999,999 / 999,999,999）。
 */
function realmRangeIssues(rows) {
  const issues = [];
  const by = {};
  for (const r of rows || []) {
    const id = Number(r.realm_id);
    if (!Number.isFinite(id)) continue;
    const lo = Number(r.exp_min);
    const hi = Number(r.exp_max);
    by[id] = { lo, hi };
    if (!(hi > lo) || lo < 0) issues.push(`境界 ${id} 修为区间不成立：${r.exp_min}~${r.exp_max}`);
  }
  const ids = Object.keys(by).map(Number).sort((a, b) => a - b);
  for (let i = 1; i < ids.length; i++) {
    const prev = by[ids[i - 1]];
    const cur = by[ids[i]];
    if (cur.lo !== prev.hi + 1) {
      issues.push(`境界 ${ids[i]} 与上一境不相接：下限 ${cur.lo}，上一境上限 ${prev.hi}（应差 1）`);
    }
  }
  return issues;
}

/**
 * 纯函数：神识两列 = 「未定哨兵」只允许 `0/0` 或两列皆正（`ADR-0039`）。
 * ★ 半填（`0/2` / `10/0`）会被运行时代码当成合法值照算 ⇒ 假值冒充真值。
 */
function shenshiLadderIssues(rows) {
  const issues = [];
  const pairs = {};
  for (const r of rows || []) {
    const id = Number(r.realm_id);
    if (!Number.isFinite(id)) continue;
    const s = Number(r.shenshi_start);
    const st = Number(r.shenshi_step);
    if (!Number.isFinite(s) || !Number.isFinite(st)) continue;
    if (s < 0 || st < 0) issues.push(`境界 ${id} 第 ${r.layer} 层神识为负：${s}/${st}`);
    if ((s === 0) !== (st === 0)) {
      issues.push(`境界 ${id} 第 ${r.layer} 层神识半填：${s}/${st}（未定必须两列同时为 0）`);
    }
    const pair = `${s}/${st}`;
    if (pairs[id] && pairs[id] !== pair) issues.push(`境界 ${id} 神识各行不一致：${pairs[id]} vs ${pair}`);
    pairs[id] = pair;
  }
  return issues;
}

function itemDomainIssues(parsedByTable) {
	const out = [];

	// ㈤ 物品域（M5 · `X-0058` / `ADR-0033`）—— ★ 新表必须进本规则集（dalu DATA-LAYOUT §三 那条义务）
	//   判据来源：`contracts/data-contract.md` §7.3 / §7.4 / §7.6 / §8.1 ＋ 需求层《储物系统》《法宝系统》
	const itemDef = parsedByTable['qydl_item_def_config'];
	const itemCat = parsedByTable['qydl_item_category_config'];
	const gradeTbl = parsedByTable['qydl_quality_grade_config'];
	const treasureTbl = parsedByTable['qydl_storage_treasure_def_config'];
	const multTbl = parsedByTable['qydl_storage_quality_mult_config'];
	const axisTbl = parsedByTable['qydl_storage_level_axis_config'];
	const enhanceTbl = parsedByTable['qydl_enhance_rule_config'];

	if (gradeTbl && itemDef) {
	  // ㈤-1 每轨的阶区间必须**从 1 起、连续、无缝**（缝里掉的 quality 会显示成空品质名）
	  const byTrack = new Map();
	  for (const r of gradeTbl.rows) {
	    const tk = String(r.track);
	    if (!byTrack.has(tk)) byTrack.set(tk, []);
	    byTrack.get(tk).push(r);
	  }
	  for (const [tk, list] of byTrack) {
	    list.sort((a, b) => Number(a.tier_min) - Number(b.tier_min));
	    let next = 1;
	    for (const g of list) {
	      if (Number(g.tier_min) !== next) {
	        out.push(`quality_grade 轨 ${tk} 档「${g.grade_name}」阶区间不连续：期望从 ${next} 起，实为 ${g.tier_min}`);
	      }
	      if (Number(g.tier_max) < Number(g.tier_min)) {
	        out.push(`quality_grade 轨 ${tk} 档「${g.grade_name}」区间倒挂 ${g.tier_min}–${g.tier_max}`);
	      }
	      next = Number(g.tier_max) + 1;
	    }
	  }
	  if (byTrack.size !== 4) {
	    out.push(`quality_grade 应有**四轨**（品阶 / 器道八档 / 符阵三阶九级 / 灵植三品十级），实得 ${byTrack.size}`);
	  }
	  // ㈤-2 每个物品的 quality 必须落在所属轨道的算出来的域内（★ 上界由档表给，不写死）
	  const maxOf = new Map();
	  for (const [tk, list] of byTrack) {
	    maxOf.set(tk, Math.max(...list.map(g => Number(g.tier_max))));
	  }
	  const cats = new Set(itemCat ? itemCat.rows.map(r => String(r.category_id)) : []);
	  for (const r of itemDef.rows) {
	    const mx = maxOf.get(String(r.track));
	    if (mx === undefined) {
	      out.push(`item_def 物品 ${r.item_id}(${r.name}) 的轨道 ${r.track} 在档表里没有行`);
	    } else if (Number(r.quality) < 1 || Number(r.quality) > mx) {
	      out.push(`item_def 物品 ${r.item_id}(${r.name}) quality=${r.quality} 越界（轨 ${r.track} 合法域 1–${mx}）`);
	    }
	    if (itemCat && !cats.has(String(r.category_id))) {
	      out.push(`item_def 物品 ${r.item_id}(${r.name}) 的分类 ${r.category_id} 不存在`);
	    }
	    if (Number(r.stack_max) < 1) {
	      out.push(`item_def 物品 ${r.item_id}(${r.name}) stack_max=${r.stack_max}，必须 ≥ 1`);
	    }
	  }
	}

	// ㈤-3 品质轴容量倍率：★ 值为 0 只允许出现在「上游未给」那一档（现 = 地品），其余档必须 > 0
	if (multTbl) {
	  for (const r of multTbl.rows) {
	    if (Number(r.mult_ppm) === 0 && r.grade_name !== '地品') {
	      out.push(`storage_quality_mult 档「${r.grade_name}」倍率为 0 —— 0 只允许给上游未裁的「地品」`);
	    }
	    if (Number(r.mult_ppm) < 0) {
	      out.push(`storage_quality_mult 档「${r.grade_name}」倍率为负`);
	    }
	  }
	}

	// ㈤-4 等级段轴：区间连续不重叠，且**末段仍写 54**（★ 这条把"四张表留六档"的分叉钉成可见事实）
	if (axisTbl) {
	  const rows = [...axisTbl.rows].sort((a, b) => Number(a.level_min) - Number(b.level_min));
	  let next = 1;
	  for (const r of rows) {
	    if (Number(r.level_min) !== next) {
	      out.push(`storage_level_axis 段 ${r.level_min}–${r.level_max} 与前段不衔接（期望从 ${next} 起）`);
	    }
	    next = Number(r.level_max) + 1;
	  }
	  const tail = Math.max(...rows.map(r => Number(r.level_max)));
	  if (tail === 63) {
	    out.push('storage_level_axis 末段被改到了 63 —— ★ 上游那张表只给到 54，地品行是**待裁**不是已配（X-0058 遗留 1）');
	  }
	  if (tail !== 54) {
	    out.push(`storage_level_axis 末段 = ${tail}，期望 54（上游原文只给到 46–54 段）`);
	  }
	}

	// ㈤-5 强化规则：档 1–5 的 level_max 单调不减；档 6–8（三档至宝）必须为 0（不分阶、不参与强化）
	if (enhanceTbl) {
	  const by = new Map(enhanceTbl.rows.map(r => [String(r.rank_idx), r]));
	  let prev = 0;
	  for (const rank of ['1', '2', '3', '4', '5']) {
	    const r = by.get(rank);
	    if (!r) { out.push(`enhance_rule 缺档 ${rank}`); continue; }
	    if (Number(r.level_max) < prev) {
	      out.push(`enhance_rule 档 ${rank}(${r.rank_name}) 上限 ${r.level_max} 低于上一档 ${prev} ⇒ 不单调`);
	    }
	    prev = Number(r.level_max);
	    if (Number(r.rate_start_ppm) < Number(r.rate_end_ppm)) {
	      out.push(`enhance_rule 档 ${rank} 成功率区间方向反了（${r.rate_start_ppm} → ${r.rate_end_ppm}）`);
	    }
	  }
	  for (const rank of ['6', '7', '8']) {
	    const r = by.get(rank);
	    if (r && Number(r.level_max) !== 0) {
	      out.push(`enhance_rule 档 ${rank}(${r.rank_name}) 是至宝档，需求层明写"不分阶、不参与强化"，上限却 = ${r.level_max}`);
	    }
	  }
	}

	// ㈤-6 储物法宝规格：item_id 必须在物品表里存在（否则"发物开空间"会算不出容量）
	if (treasureTbl && itemDef) {
	  const ids = new Set(itemDef.rows.map(r => String(r.item_id)));
	  for (const r of treasureTbl.rows) {
	    if (!ids.has(String(r.item_id))) {
	      out.push(`storage_treasure_def 的 item_id ${r.item_id} 在物品表里没有对应行`);
	    }
	    if (Number(r.base_capacity) < 1) {
	      out.push(`storage_treasure_def item ${r.item_id} base_capacity=${r.base_capacity}，必须 ≥ 1（★ 格数的真源在此列）`);
	    }
	  }
	}

	return out;
}

(function r10() {
  const datasDir = path.join(DALU_DATA, 'datas');
  if (!fs.existsSync(datasDir)) {
    ok('R10', '配置表表源目录未建立（`qiuyuan-dalu/data/datas/`）→ 跳过');
    return;
  }

  const csvs = fs.readdirSync(datasDir).filter(f => f.endsWith('.csv'));
  if (csvs.length === 0) {
    warn('R10', '`data/datas/` 下无 CSV 表源 —— 跳过（骨架期）');
    return;
  }

  const issues = [];
  const parsedByTable = {};
  for (const f of csvs) {
    const parsed = parseLubanCsv(read(path.join(datasDir, f)));
    if (!parsed) { warn('R10', f + ' 不是 Luban ##var 形态 → 跳过'); continue; }
    parsedByTable[f.replace(/\.csv$/, '')] = parsed;

    // ㈠ 字段数
    for (const w of csvWidthIssues(parsed)) {
      issues.push(`${f}:${w.line} 字段数 ${w.got} ≠ 表头 ${w.expect}` +
        (w.extra.length ? `（多出 ${JSON.stringify(w.extra)} —— 疑似**未转义逗号**，会被 Luban 静默丢弃）` : ''));
    }

    // ㈡ 概率合计
    const sum = probPpmSum(parsed);
    if (sum !== null && sum !== 1000000) {
      issues.push(f + ' 的 prob_ppm 合计 ' + sum + ' ≠ 1000000');
    }
  }

  // ㈢ 倍率单调（表名含 spirit_root_grade 者）
  const gradeEntry = Object.entries(parsedByTable)
    .find(([name]) => /spirit_root_grade/.test(name));
  if (gradeEntry) {
    const [, parsed] = gradeEntry;
    for (const col of ['damage_mult_ppm', 'cultivation_mult_ppm']) {
      if (!parsed.fields.includes(col)) continue;
      const values = parsed.rows.map(r => r[col]);
      const brk = firstMonotonicBreak(values);
      if (brk) {
        issues.push(gradeEntry[0] + ' 的 ' + col + ' 在 quality 升序上**不单调**：' +
        'q' + parsed.rows[brk.index - 1].quality + '=' + brk.prev +
        ' → q' + parsed.rows[brk.index].quality + '=' + brk.cur);
      }
    }

    // ㈣ 公式① 手算复现
    const gc = parsedByTable['qydl_game_config'];
    if (!gc) {
      warn('R10', '找不到 `qydl_game_config.csv` → 公式① 手算复现（子规则㈣）跳过');
    } else {
      const key = configRowsToMap(gc.rows);
      const params = {
        v: Number(key.spirit_root_variant_value),
        anchor: Number(key.spirit_root_anchor),
        p: Number(key.spirit_root_p_damage_ppm) / 1e6,
      };
      const calc = computeGradeFormula(parsed, params);
      if (!calc) {
        warn('R10', '公式参数缺失（`spirit_root_variant_value` / `spirit_root_anchor` / `spirit_root_p_damage_ppm`）→ 手算复现跳过');
      } else {
        for (const row of calc) {
          if (row.diff !== 0 || row.diffCul !== 0) {
            issues.push(`${gradeEntry[0]} q${row.q} 表值与公式① 不符：公式 ${row.want} / 表 ${row.got}` +
              (row.diffCul !== 0 ? `（修炼列 ${row.gotCul}）` : ''));
          }
        }
        if (calc.every(r => r.diff === 0 && r.diffCul === 0)) {
          ok('R10', `公式① 手算复现一致（${calc.length} 行 · v=${params.v} anchor=${params.anchor} p=${params.p}）`);
        }
      }
    }
  }

  // ㈤ 物品域（M5）—— 判据已抽成纯函数，★ 反向测试在 --self-test 的 R10 段
  issues.push(...itemDomainIssues(parsedByTable));

  // ㈥ 境界区间相接 ＋ 神识哨兵（ADR-0039）—— 同样是纯函数，反向测试在 R10 段
  const rc = parsedByTable['qydl_realm_config'];
  if (!rc) warn('R10', '找不到 `qydl_realm_config.csv` → 九境区间相接检查跳过（NOT a pass）');
  else issues.push(...realmRangeIssues(rc.rows));
  const rl = parsedByTable['qydl_realm_level_config'];
  if (!rl) warn('R10', '找不到 `qydl_realm_level_config.csv` → 神识哨兵检查跳过（NOT a pass）');
  else issues.push(...shenshiLadderIssues(rl.rows));

  if (issues.length) {
    issues.forEach(m => err('R10', m));
  } else {
    ok('R10', `配置表内容断言通过（${csvs.length} 张表：字段数 / 概率合计 / 倍率单调 / 公式复现 / 物品域档位与两轴与强化 / 九境区间相接 / 神识哨兵）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// --self-test · 反向测试（CONVENTIONS §7.1 纪律 2）
//   「**没失败过的校验脚本 = 未被验证过的校验脚本**」
//   注入坏样本，断言**必须被拦下**；再注入好样本，断言**不得误报**。
//   用法：node scripts/check-data.js --self-test
// ─────────────────────────────────────────────────────────────

// itemFixture —— 造一份**合法形态**的物品域表集，供反向测试改单一字段后断言。
//
// ★ 为什么先要有合法样本：收紧判据却不配"合法形态不得死"的用例，
//   等于允许一条把正确数据也判红的规则存在（本仓踩过的假红灯）。
function itemFixture(mut) {
  const mk = (name, text) => [name, parseLubanCsv(text)];
  const grade = mk("qydl_quality_grade_config",
    "##var,track,grade_idx,grade_name,tier_min,tier_max,color_key,note\n" +
    ",1,1,凡品,1,9,white,\n,1,2,灵品,10,18,green,\n,1,3,地品,19,27,blue,\n,1,4,天品,28,36,purple,\n" +
    ",1,5,仙品,37,45,gold,\n,1,6,神品,46,54,red,\n,1,7,圣品,55,63,rainbow,\n" +
    ",2,1,法器,1,1,,\n,3,1,灵,1,9,,\n,4,1,灵草,1,10,,\n");
  const item = mk("qydl_item_def_config",
    "##var,item_id,name,category_id,track,quality,enhance_rank,realm_req,stack_max\n,1001,补气丹,1,1,1,0,0,99\n");
  const cat = mk("qydl_item_category_config", "##var,category_id,name,is_currency\n,1,丹药,0\n");
  const mult = mk("qydl_storage_quality_mult_config",
    "##var,grade_idx,grade_name,mult_ppm\n,1,凡品,1000000\n,2,灵品,1500000\n,3,地品,0\n,4,天品,2500000\n");
  const axis = mk("qydl_storage_level_axis_config",
    "##var,level_min,level_max,per_level_ppm\n,1,9,100000\n,10,18,150000\n,19,27,200000\n,28,36,250000\n,37,45,300000\n,46,54,500000\n");
  const enh = mk("qydl_enhance_rule_config",
    "##var,rank_idx,rank_name,level_min,level_max,rate_start_ppm,rate_end_ppm,fail_penalty,pity_max\n" +
    ",1,法器,1,9,1000000,800000,0,0\n,2,灵器,10,18,700000,400000,1,10\n,3,宝器,19,27,350000,200000,2,20\n,4,仙器,28,36,150000,50000,3,50\n,5,神器,28,36,150000,50000,3,50\n,6,先天至宝,0,0,0,0,0,0\n,7,混沌至宝,0,0,0,0,0,0\n,8,造化至宝,0,0,0,0,0,0\n");
  const tre = mk("qydl_storage_treasure_def_config", "##var,item_id,storage_type,base_capacity\n,1001,袋,10\n");
  const base = {};
  for (const [k, v] of [grade, item, cat, mult, axis, enh, tre]) base[k] = v;
  if (mut) mut(base);
  return base;
}

if (process.argv.includes('--self-test')) {
  // [规则, 用例名, 实际结果, 期望结果]
  const cases = [
    // R4 · 铁律 3 只管「向后回填的枚举」—— 判据必须能分对象，不许误杀封闭枚举（X-0032 G-2 的正解）
    ['R4', '枚举含 unknown → 识别为已落地', scanEnums('| `kind` | INT | 类型 | `0=a, 1=b, unknown=未核实` |')[0].hasUnknown, true],
    ['R4', '数值枚举用 `-1=` 作哨兵 → 同上', scanEnums('| `sect` | INT | 门派 | `-1=未核实, 1=剑` |')[0].hasUnknown, true],
    ['R4', '封闭枚举无哨兵 → 识别为无哨兵（**由 r4() 判"不适用"，不判红**）', scanEnums('| `status` | INT | 账号状态 | `0=正常, 1=封禁, 2=注销` |')[0].hasUnknown, false],
    ['R4', '★ 封闭枚举**不带回填标记** → 不得进"违规"集', BACKFILL_MARK_RE.test('0=正常, 1=封禁, 2=注销'), false],
    ['R4', '★ 带回填标记却不留哨兵 → 必须落进"违规"集', BACKFILL_MARK_RE.test('0=剑, 1=丹, 名单归 dalu qydl_x_config'), true],
    ['R4', '「待上游并入」→ 认出为回填引用', scanBackfillRefs('> `shenshi_base` 需求层未列 —— 属原型扩展，**按 ADR-0002 应标 `unknown`**，待上游并入。').length > 0, true],
    ['R4', '「本仓不列名单，归 dalu」→ 认出为回填引用', scanBackfillRefs('| `body_name` | VARCHAR | 体质 | 名单归 dalu `qydl_physique_def_config` |').length > 0, true],
    ['R4', '普通段落 → 不得误判为回填引用', scanBackfillRefs('| `name` | VARCHAR | 角色名 | — |').length, 0],
    ['R4', '单项取值不算枚举（防误报）', scanEnums('| `flag` | INT | 是否 | `0=否` |').length, 0],
    ['R4', '★ 规则条文自身不得被当成枚举或落地证据', scanEnums('3. **枚举必须留 `unknown`**：凡向后回填的枚举，必须允许「未核实」取值。').length, 0],
    ['R4', '空文本 → 识别 0 个（由 r4() 判 err，禁止空集真空通过）', scanEnums('').length, 0],
    // R7 · 坏样本必须被拦下
    ['R7', '标题含表名 → 必拦下', scanPhysicalNames('### 3.1 `xx_characters`（角色主表）').length > 0, true],
    ['R7', '代码块含表名 → 必拦下', scanPhysicalNames('```\nSELECT * FROM xx_roles;\n```').length > 0, true],
    ['R7', '表格首列含表名 → 必拦下', scanPhysicalNames('| `xx_players` | 玩家账号 |').length > 0, true],
    // R7 · 好样本不得误报
    ['R7', '实体名标题 → 不得误报', scanPhysicalNames('### 3.1 角色 `Role`（角色主实体）').length === 0, true],
    ['R7', '备查列引用表名 → 不得误报', scanPhysicalNames('| 账号 `Account` | `account` | `xx_players` | 平台账号层 |').length === 0, true],
    ['R7', '正文提到 `xx_` 前缀约定 → 不得误报', scanPhysicalNames('`xx_` 前缀是原型的占位约定，不构成约束').length === 0, true],
    ['R7', '★ 标题含 qydl_ 下游表名 → 必拦下（ADR-0027 ① 扩模）', scanPhysicalNames('### 3.1 `qydl_game_config`（全局配置）').length > 0, true],
    ['R7', '★ 表格首列含 qydl_ → 必拦下', scanPhysicalNames('| `qydl_physique_def_config` | 体质名单 |').length > 0, true],
    ['R7', '变更记录行叙述「摘除了 qydl_」→ 不得误报（历史留痕，非活引用）', scanPhysicalNames('| **v0.8** | 2026-10-13 | 摘除物理表名 `qydl_physique_def_config` |').length === 0, true],
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
    // R5 · v0.3 新增：待裁项 ↔ ADR 台账联动（取代原魔法数字下限）
    ['R5', 'ADR 有 proposed 但契约无待裁项 → 判为漏报', classifyPending(0, 2) === 'suspect-miss', true],
    ['R5', '两侧皆空 → 判为一致', classifyPending(0, 0) === 'clean', true],
    ['R5', '契约有待裁项 → 判为 pending', classifyPending(3, 0) === 'pending', true],
    ['R5', '契约有待裁项 + ADR proposed → 仍为 pending', classifyPending(4, 1) === 'pending', true],
    ['R5', 'ADR 台账缺失 → 判为无法核对', classifyPending(1, null) === 'adr-missing', true],
    // R8 · 表格结构（v0.4）
    ['R8', '段落/标题紧接表格（无空行）→ **不得**报错（cmark-gfm `test/extensions.txt` §Tables 明文允许）', scanTables('段落文字\n| a | b |\n|---|---|\n| 1 | 2 |', 'x.md').errors.length === 0, true],
    ['R8', '数据行列数不齐 → 必报错', scanTables('\n| a | b |\n|---|---|\n| 1 |', 'x.md').errors.length > 0, true],
    ['R8', '行尾空单元格 → 必告警', scanTables('\n| a | b |\n|---|---|\n| 1 | |', 'x.md').warns.length > 0, true],
    ['R8', '标准表格 → 不得报错', scanTables('\n| a | b |\n|---|---|\n| 1 | 2 |', 'x.md').errors.length === 0, true],
    ['R8', '代码块内伪表格 → 不得误报', scanTables('\n```\n| a | b |\n|---|---|\n| 1 |\n```', 'x.md').errors.length === 0, true],
    // ★★ 2026-10-13 新增（`X-0040`）：**一正一反**。★ 上面几条只测"坏表被拦"或"好表通过"，
    //   ★ 若判据把**转义竖线**当列分隔符，它们**全都照样过** ⇒ ★ 必须专门测这一条。
    ['R8', '★★ 单元格含**转义竖线**（表格里写字面 `|` 的规范写法）→ **不得误报**',
      scanTables('\n| a | b |\n|---|---|\n| `x \\| y` | ok |', 'x.md').errors.length === 0, true],
    ['R8', '★ 反向：转义竖线**不能**把真错掩盖 —— 列数真不齐仍必报',
      scanTables('\n| a | b |\n|---|---|\n| `x \\| y` | ok | extra |', 'x.md').errors.length > 0, true],
    // R9 · 第一设计原则锚点（v0.5）
    ['R9', '缺一处锚点 → 必报错并点名', missingAnchors('世界真实性', [['a.md', '世界真实性优先'], ['b.md', '无关内容']]).length === 1, true],
    ['R9', '四处齐备 → 不得报错', missingAnchors('世界真实性', [['a.md', '世界真实性'], ['b.md', '世界真实性优先']]).length === 0, true],
    ['R9', '全缺 → 全部列出', missingAnchors('世界真实性', [['a.md', 'x'], ['b.md', 'y']]).length === 2, true],
    // R6 · 骨架期 vs 空目录错（v0.21 补齐 —— 本规则此前**无反向测试**）
    ['R6', '无文件 → 骨架期（不报错）', configDirVerdict([]).kind === 'skeleton', true],
    ['R6', '仅 .gitkeep → 骨架期（不报错）', configDirVerdict(['.gitkeep']).kind === 'skeleton', true],
    ['R6', '仅 README.md → 骨架期（不报错）', configDirVerdict(['README.md']).kind === 'skeleton', true],
    ['R6', '有非占位文件却无配置表 → 必报错', configDirVerdict(['notes.txt']).kind === 'empty-err', true],
    ['R6', '有配置表 → 通过', configDirVerdict(['realm_level_config.json']).kind === 'ok', true],
    ['R6', '配置表名含大写 → 必报错', configDirVerdict(['Realm.json']).kind === 'badname', true],
    // R10 · 配置表内容断言（v0.27 补齐 —— 本规则是 X-0015 的产物，故自带上反向测试）
    ['R10', '非 ##var 形态 → 不认（不误报）', parseLubanCsv('a,b\n1,2') === null, true],
    ['R10', '##var 表头 → 正常解析', (() => { const p = parseLubanCsv('##var,k,v\n,a,1\n'); return p && p.fields.length === 2 && p.rows.length === 1; })(), true],
    ['R10', 'A 列空、字段从 B 列起 → 字段值正确', (() => { const p = parseLubanCsv('##var,k,v\n,x,7\n'); return p.rows[0].k === 'x' && p.rows[0].v === '7'; })(), true],
    ['R10', '字段数多一格（未转义逗号）→ 必拦下', csvWidthIssues(parseLubanCsv('##var,a,b\n,1,2,3\n')).length === 1, true],
    ['R10', '字段数齐 → 不得误报', csvWidthIssues(parseLubanCsv('##var,a,b\n,1,2\n')).length === 0, true],
    ['R10', '键值表 key/value 形态 → 映射正常', configRowsToMap(parseLubanCsv('##var,key,value\n,a,1\n').rows).a === '1', true],
    ['R10', '★ param_key/param_value 形态（dalu T-0139）→ 同样映射', configRowsToMap(parseLubanCsv('##var,param_key,param_value\n,a,1\n').rows).a === '1', true],
    ['R10', '未转义逗号的额外格子被点名', csvWidthIssues(parseLubanCsv('##var,a,comment\n,1,"x, y"\n'))[0].extra.join(',') === ' y"', true],
    ['R10', 'prob_ppm 合计 ≠ 1000000 → 必拦下', probPpmSum(parseLubanCsv('##var,prob_ppm\n,900000\n')) === 900000, true],
    ['R10', 'prob_ppm 合计 = 1000000 → 通过', probPpmSum(parseLubanCsv('##var,prob_ppm\n,900000\n,100000\n')) === 1000000, true],
    ['R10', '无 prob_ppm 列 → 返回 null（不误报）', probPpmSum(parseLubanCsv('##var,prob_ppm_x\n,1\n')) === null, true],
    ['R10', '倍率倒挂 → 必拦下', firstMonotonicBreak([1, 2, 1.5]) !== null, true],
    ['R10', '倍率持平 → 视为单调（不减，非严格递增）', firstMonotonicBreak([1, 2, 2, 3]) === null, true],
    ['R10', '倍率单调 → 不得误报', firstMonotonicBreak([1, 2, 3]) === null, true],
    ['R10', '公式参数缺失 → 返回 null（不误判）', computeGradeFormula(parseLubanCsv('##var,quality,wuxing_min,wuxing_max,variant_min,variant_max,damage_mult_ppm,cultivation_mult_ppm\n,3,2,2,0,0,1000000,1000000\n'), { v: NaN, anchor: 2, p: 0.3 }) === null, true],
    ['R10', '★ 九境区间首尾相接 → 不得误报', realmRangeIssues(parseLubanCsv('##var,realm_id,exp_min,exp_max\n,1,0,999\n,2,1000,9999\n').rows).length, 0],
    ['R10', '★ 区间留断档 → 必抓（X-0063 的 4 处）', realmRangeIssues(parseLubanCsv('##var,realm_id,exp_min,exp_max\n,1,0,999\n,2,1001,9999\n').rows).length, 1],
    ['R10', '★ 上界 ≤ 下界 → 必抓', realmRangeIssues(parseLubanCsv('##var,realm_id,exp_min,exp_max\n,1,0,0\n').rows).length, 1],
    ['R10', '★ 神识 0/0 与 10/2 合法 → 不得误报', shenshiLadderIssues(parseLubanCsv('##var,realm_id,layer,shenshi_start,shenshi_step\n,1,1,10,2\n,1,2,10,2\n,4,1,0,0\n').rows).length, 0],
    ['R10', '★ 神识半填 0/2 → 必抓', shenshiLadderIssues(parseLubanCsv('##var,realm_id,layer,shenshi_start,shenshi_step\n,1,1,0,2\n').rows).length, 1],
    ['R10', '★ 同一境界各行不一致 → 必抓', shenshiLadderIssues(parseLubanCsv('##var,realm_id,layer,shenshi_start,shenshi_step\n,1,1,10,2\n,1,2,10,3\n').rows).length, 1],
    ['R10', '公式① 双灵根锚点 → 恰为 1000000', (() => {
      const p = parseLubanCsv('##var,quality,wuxing_min,wuxing_max,variant_min,variant_max,damage_mult_ppm,cultivation_mult_ppm\n,3,2,2,0,0,1000000,1000000\n');
      const r = computeGradeFormula(p, { v: 2, anchor: 2, p: 0.3 });
      return r && r[0].want === 1000000 && r[0].diff === 0;
    })(), true],
    ['R10', '公式① 值与表值不符 → 必拦下', (() => {
      const p = parseLubanCsv('##var,quality,wuxing_min,wuxing_max,variant_min,variant_max,damage_mult_ppm,cultivation_mult_ppm\n,6,0,0,1,1,1000000,1000000\n');
      const r = computeGradeFormula(p, { v: 2, anchor: 2, p: 0.3 });
      return r && r[0].diff !== 0;
    })(), true],
    // R10 · 物品域内容断言（X-0058 / ADR-0033 —— ★ 合法形态不得死 + 五种坏样本必拦）
    ['R10', '物品域合法样本 → 一条都不许报', itemDomainIssues(itemFixture()).length, 0],
    ['R10', 'quality 越出档表算出的上界 → 必拦下',
      itemDomainIssues(itemFixture((b) => { b["qydl_item_def_config"].rows[0].quality = "999"; })).length > 0, true],
    ['R10', '档区间留缝（地品从 20 起）→ 必拦下',
      itemDomainIssues(itemFixture((b) => { b["qydl_quality_grade_config"].rows[2].tier_min = "20"; })).length > 0, true],
    ['R10', '倍率 0 给到**非地品**那一档 → 必拦下（偷偷兜底的红线）',
      itemDomainIssues(itemFixture((b) => {
        b["qydl_storage_quality_mult_config"].rows[1].grade_name = "灵品";
        b["qydl_storage_quality_mult_config"].rows[1].mult_ppm = "0";
      })).length > 0, true],
    ['R10', '★ 等级段轴末段被改成 63 → 必拦下（那是替上游补数，大人裁的是「只改物品」）',
      itemDomainIssues(itemFixture((b) => {
        b["qydl_storage_level_axis_config"].rows[5].level_max = "63";
      })).length > 0, true],
    ['R10', '至宝档给了强化上限 → 必拦下（需求层：不分阶、不参与强化）',
      itemDomainIssues(itemFixture((b) => { b["qydl_enhance_rule_config"].rows[5].level_max = "9"; })).length > 0, true],
    ['R10', '储物规格指向不存在的物品 → 必拦下',
      itemDomainIssues(itemFixture((b) => { b["qydl_storage_treasure_def_config"].rows[0].item_id = "8888"; })).length > 0, true],
    ['R10', '物品指向不存在的分类 → 必拦下',
      itemDomainIssues(itemFixture((b) => { b["qydl_item_def_config"].rows[0].category_id = "77"; })).length > 0, true],

    // PEND 待实现规则登记位（机制③ · 来源 X-0016）
    ['PEND', '空名单 → 不告警（不打破现状）', pendingNotice([]) === null, true],
    ['PEND', '非空 → 生成提示（含来源）', pendingNotice([{ id: 'R11', from: 'X-0000' }]) === 'R11(from X-0000)', true],
    ['PEND', '缺 from → 显式标记（不许静默）', /⚠缺来源/.test(pendingNotice([{ id: 'R11' }])), true],
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
