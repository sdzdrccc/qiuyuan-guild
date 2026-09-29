#!/usr/bin/env node
'use strict';

/**
 * check-doc-anchors.js —— 流程/约定文档 ↔ 实际门禁的一致性（来源 X-0018 · `REVIEW-PROCESS.md` v1.2 §S6）
 *
 * 职责：把「**文档里写的脚本与规则**」与「**仓库里真实存在的脚本与规则**」钉在一起。
 *
 * ── 为什么需要它（X-0018 的实测证据）────────────────────────
 *   `REVIEW-PROCESS.md` 自述「与 `CONVENTIONS.md` / `AGENTS.md` 同级」（**纪律级真源**），
 *   但**没有任何门禁引用它**（实测 `grep -l REVIEW-PROCESS scripts/*.js` 为空）。
 *   于是它长出两个**已经在腐烂**的接口：
 *     ① §3 第 3 步的**脚本清单** —— 现为 5 条，与实际一致，但**无人保证**：
 *        加一个脚本忘了写文档、删一个脚本忘了删文档，都不会有人发现；
 *     ② 每个脚本后面注的**规则 ID 范围**（如 `# C1~C6`）—— 脚本加了 `C7` 而文档照旧，静默漂移；
 *     ③ 仓外的 skill（`~/.workbuddy/skills/qiuyuan-review-pipeline/`）——
 *        `X-0017` 就得**手工同步**它，正说明「人能漏，机器不会」。
 *   → 这正是 `AGENTS.md` §4 三类错误里的**第一类（引用未同步）**，也是唯一能靠 grep 抓的那类。
 *     既然能抓，就该做成门禁，而不是再写一遍纪律（`CONVENTIONS.md` §7.2）。
 *
 * ── 判据的边界 ─────────────────────────────────────────────
 *   · 只查**一致性**（文档说的 ↔ 实际有的），**不查**脚本逻辑对不对、规则设计好不好。
 *   · 规则 ID 的解析**按脚本自身的字母前缀过滤**（见 `declaredRuleIds`），
 *     避免把正文里的 `L1` / `M3` / `ADR` 之类误取成规则 ID —— 宁可漏认，不可误认。
 *
 * 用法：
 *   node scripts/check-doc-anchors.js             # 常规
 *   node scripts/check-doc-anchors.js --strict    # 警告也视为失败
 *   node scripts/check-doc-anchors.js --self-test # 反向测试
 *
 * 退出码：0 = 通过 / 1 = 失败
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');

const errors = [];
const warns = [];
const passes = [];
const err = (r, m) => errors.push({ rule: r, msg: m });
const warn = (r, m) => warns.push({ rule: r, msg: m });
const ok = (r, m) => passes.push({ rule: r, msg: m });

const STRICT = process.argv.includes('--strict');
const useColor = process.stdout.isTTY;
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : s);
const GREEN = 32, RED = 31, YELLOW = 33, DIM = 2;

/** 待实现规则登记位（CONVENTIONS §7.1 纪律 7 · 机制③）—— 本脚本自己也要有 */
const PENDING_RULES = [
  // { id: 'D5', from: 'X-0000', desc: '…', due: 'M2' },
];

function pendingNotice(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map(r => `${r.id || '?'}(from ${r.from || '⚠缺来源'}${r.due ? ', due ' + r.due : ''})`).join(' / ');
}

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

/** 声明了脚本清单的文档（**真源** · 三处都要核） */
const DOC_INVENTORY = [
  { file: 'docs/REVIEW-PROCESS.md', label: '审阅流程' },
  { file: 'docs/CONVENTIONS.md', label: '工程约定' },
  { file: 'README.md', label: 'README 门面' },
];

/** 审阅 skill（**仓外 · 用户级**） */
const SKILL = path.join(os.homedir(), '.workbuddy', 'skills', 'qiuyuan-review-pipeline', 'SKILL.md');

// ─────────────────────────────────────────────────────────────
// 纯函数区（便于 --self-test）
// ─────────────────────────────────────────────────────────────

/**
 * 纯函数：抽出文档里声明的 `scripts/check-*.js` 清单。
 * 认法：`node scripts/check-xxx.js` 起首的行（注释写在 `#` 之后）。
 * 返回 Map<脚本名, 注释串>
 */
function declaredScripts(text) {
  const out = new Map();
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^\s*(?:\$|>)?\s*node\s+scripts\/(check-[A-Za-z0-9_-]+\.js)\s*(?:#\s*(.*))?$/);
    if (m) out.set(m[1], (m[2] || '').trim());
  }
  return out;
}

/** 纯函数：剥离注释（行注释 + 块注释）—— 注释里出现的样例调用不得算作实现 */
function stripComments(s) {
  return String(s)
    .replace(/\/\*[\s\S]*?\*\//g, '')        // 块注释
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');   // 行注释（避开 `http://` 这类）
}

/**
 * 纯函数：某脚本**实际实现**的规则 ID（取自 err/ok/warn 的调用）。
 *
 * ★ 两处必须收窄（都是**实测踩出来的**，否则本脚本会**误报自己**）：
 *   ① **截断在自检代码块之前** —— 自检夹具里会出现「样例 err 调用」，
 *      它们是用来验证本函数的样本，不是已实现的规则；
 *   ② **剥离注释** —— 解释性注释里也会提到这种样例调用。
 *   规则一律定义在自检块**之前**（本仓 6 个脚本皆如此），故截断安全且精确。
 */
function implementedRuleIds(scriptText) {
  const ids = new Set();
  const t = String(scriptText);
  const m = t.match(/^if\s*\(\s*process\.argv\.includes\('--self-test'\)\s*\)/m);
  const body = stripComments(m ? t.slice(0, m.index) : t);
  for (const x of body.matchAll(/\b(?:err|ok|warn)\(\s*'([A-Z]\d+)'/g)) ids.add(x[1]);
  return ids;
}

/**
 * 纯函数：从文档注释里解析**声明的**规则 ID。
 * 支持 `C1~C6` 区间与 `G1` / `A1~A5` 单点；**按 `allowLetters` 过滤**
 * （防把正文里的 `L1` / `M3` 误取成规则 ID —— 只认与脚本自身同前缀的 ID）。
 */
function declaredRuleIds(annotation, allowLetters) {
  const out = new Set();
  const allow = new Set([...allowLetters].map(s => String(s).toUpperCase()));
  const text = String(annotation || '');
  // 区间：C1~C6 / C1-C6 / C1–C6
  for (const m of text.matchAll(/\b([A-Z])(\d+)\s*[~\-–—]\s*([A-Z]?)(\d+)\b/g)) {
    const L = m[1].toUpperCase();
    const L2 = (m[3] || m[1]).toUpperCase();
    if (L !== L2 || !allow.has(L)) continue;
    const a = Number(m[2]), b = Number(m[4]);
    if (b >= a && b - a <= 50) for (let i = a; i <= b; i++) out.add(L + i);
  }
  // 单点：G1 / I1
  for (const m of text.matchAll(/\b([A-Z])(\d+)\b/g)) {
    const L = m[1].toUpperCase();
    if (allow.has(L)) out.add(L + m[2]);
  }
  return out;
}

/** 纯函数：两集合的差集描述（便于反向测试） */
function setDiff(a, b) {
  return {
    onlyInA: [...a].filter(x => !b.has(x)).sort(),
    onlyInB: [...b].filter(x => !a.has(x)).sort(),
  };
}

/** 纯函数：脚本是否具备两条硬要求（CONVENTIONS §7.1 纪律 2 / 7） */
function hasSelfTestAndPending(scriptText) {
  const t = String(scriptText);
  return {
    selfTest: /--self-test/.test(t),
    // ★ 必须**真声明**：注释掉的 `// const PENDING_RULES = []` 不算
    //   （否则「把登记位注释掉」就能静默绕过纪律 7 —— 正是本脚本要防的那类漏洞）
    pending: t.split(/\r?\n/).some(l =>
      /const\s+PENDING_RULES\s*=/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l)),
  };
}

/** 纯函数：该清单条目是否**显式标注待建**（`（待建）` / TODO / 计划） */
function declaredAsPending(annotation) {
  return /待建|待补|计划|TODO|未建/i.test(String(annotation || ''));
}

/** 纯函数：从流程文档取版本号（`> **版本**：**v1.2**`） */
function docVersion(text) {
  const m = String(text).match(/\*\*版本\*\*[：:]\s*\*\*(v[\d.]+)\*\*/);
  return m ? m[1] : null;
}

// ─────────────────────────────────────────────────────────────
// D1 · 文档声明的脚本清单 ↔ scripts/ 实际文件（双向核对）
// ─────────────────────────────────────────────────────────────

(function d1() {
  const dir = path.join(ROOT, 'scripts');
  if (!fs.existsSync(dir)) { err('D1', '读不到 `scripts/` 目录'); return; }
  const actual = new Set(fs.readdirSync(dir).filter(f => /^check-[A-Za-z0-9_-]+\.js$/.test(f)));
  if (actual.size === 0) { err('D1', '`scripts/` 下无 `check-*.js` —— 禁止空集真空通过'); return; }

  let checkedDocs = 0;
  for (const { file, label } of DOC_INVENTORY) {
    const t = read(path.join(ROOT, file));
    if (t === null) { warn('D1', `${label}（${file}）读不到 → 跳过`); continue; }
    const declared = declaredScripts(t);
    if (declared.size === 0) {
      err('D1', `${label}（${file}）**未声明任何脚本清单** —— 该文档是真源，清单必填（禁止空集真空通过）`);
      continue;
    }
    checkedDocs++;
    const d = setDiff(actual, new Set(declared.keys()));
    for (const f of d.onlyInA) err('D1', `${label}：\`scripts/${f}\` **存在但清单未列** —— 加了脚本忘了写文档`);
    // ★ 显式标注「待建」的条目**不算缺口**（它是诚实的预留，不是漂移）—— 但仍打印出来，不静默
    const missing = [];
    for (const f of d.onlyInB) {
      if (declaredAsPending(declared.get(f))) missing.push(f);
      else err('D1', `${label}：清单列了 \`scripts/${f}\` 但**该文件不存在** —— 删了脚本忘了删文档`);
    }
    for (const f of missing) {
      ok('D1', `${label}：\`scripts/${f}\` 已声明**待建**（不算缺口 · 仍不静默）`);
    }
    if (d.onlyInA.length === 0 && missing.length === d.onlyInB.length) {
      ok('D1', `${label}：脚本清单 ↔ 实际一致（${declared.size} 个${missing.length ? `，含 ${missing.length} 个待建` : ''}）`);
    }
  }
  if (checkedDocs === 0) err('D1', '两份真源文档均无法核对 —— 禁止空集真空通过');
})();

// ─────────────────────────────────────────────────────────────
// D3 · 规则 ID：文档**声明**的 ↔ 脚本**实现**的
// ─────────────────────────────────────────────────────────────

(function d3() {
  const dir = path.join(ROOT, 'scripts');
  if (!fs.existsSync(dir)) return;

  // 文档里所有脚本名 → 注释串（两份真源合并；同一脚本重复声明时取并集描述）
  const annotations = new Map();
  for (const { file } of DOC_INVENTORY) {
    const t = read(path.join(ROOT, file));
    if (t === null) continue;
    for (const [script, note] of declaredScripts(t)) {
      if (!annotations.has(script)) annotations.set(script, new Set());
      if (note) annotations.get(script).add(note);
    }
  }
  if (annotations.size === 0) { warn('D3', '两份真源均未声明脚本注释 → 规则 ID 无从核对'); return; }

  let checked = 0;
  for (const [script, notes] of annotations) {
    const src = read(path.join(dir, script));
    if (src === null) continue;                       // 缺文件由 D1 报，不重复
    const impl = implementedRuleIds(src);
    if (impl.size === 0) { warn('D3', `${script}：未解析出任何规则 ID → 跳过`); continue; }

    const letters = new Set([...impl].map(s => s[0]));
    const decl = new Set();
    let anyNote = false;
    for (const n of notes) {
      if (!n) continue;
      anyNote = true;
      for (const id of declaredRuleIds(n, letters)) decl.add(id);
    }
    if (!anyNote) { warn('D3', `${script}：文档未给规则 ID 注释 → 无法核对（建议补 \`# X1~Xn\`）`); continue; }
    checked++;

    const d = setDiff(impl, decl);
    for (const id of d.onlyInA) err('D3', `${script}：脚本有 \`${id}\` 但**文档注释未列** —— 加了规则忘了改文档`);
    for (const id of d.onlyInB) err('D3', `${script}：文档注释列了 \`${id}\` 但**脚本未实现** —— 删了规则忘了改文档`);
    if (d.onlyInA.length === 0 && d.onlyInB.length === 0) {
      ok('D3', `${script}：规则 ID 一致（${[...impl].sort().join(' / ')}）`);
    }
  }
  if (checked === 0) warn('D3', '无任何脚本完成规则 ID 核对（缺注释）');
})();

// ─────────────────────────────────────────────────────────────
// D4 · 每个脚本须有 `--self-test` 与 `PENDING_RULES`
//      （CONVENTIONS §7.1 纪律 2「每条规则必须有反向测试」+ 纪律 7「登记已承诺未实现」）
// ─────────────────────────────────────────────────────────────

(function d4() {
  const dir = path.join(ROOT, 'scripts');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => /^check-[A-Za-z0-9_-]+\.js$/.test(f));
  if (files.length === 0) return;

  let bad = 0;
  for (const f of files) {
    const r = hasSelfTestAndPending(read(path.join(dir, f)) || '');
    if (!r.selfTest) { err('D4', `\`scripts/${f}\` **无 \`--self-test\`** —— 没有反向测试的脚本 = 未被验证过的脚本（纪律 2）`); bad++; }
    if (!r.pending) { err('D4', `\`scripts/${f}\` **无 \`PENDING_RULES\`** —— 「已承诺未实现」无处登记（纪律 7）`); bad++; }
  }
  if (bad === 0) ok('D4', `${files.length} 个脚本均具备 \`--self-test\` 与 \`PENDING_RULES\``);
})();

// ─────────────────────────────────────────────────────────────
// D2 · 仓外 skill 与流程文档**版本同步**（warn —— 跨机不强求）
// ─────────────────────────────────────────────────────────────

(function d2() {
  const doc = read(path.join(ROOT, 'docs', 'REVIEW-PROCESS.md'));
  if (doc === null) { warn('D2', '读不到 `docs/REVIEW-PROCESS.md` → 跳过'); return; }
  const want = docVersion(doc);
  if (!want) { warn('D2', '流程文档未声明版本（`> **版本**：**vX.Y**`）→ 无法核对 skill 同步'); return; }

  const skill = read(SKILL);
  if (skill === null) {
    warn('D2', `审阅 skill 未在本机找到（\`${SKILL.replace(os.homedir(), '~')}\`）→ 跳过版本核对（跨机不强求）`);
    return;
  }
  if (skill.includes(want)) {
    ok('D2', `审阅 skill 与流程文档版本一致（${want}）`);
  } else {
    warn('D2', `审阅 skill **未同步**到流程文档版本 ${want} —— 手工同步易漏（\`X-0017\` 即先例）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// --self-test · 反向测试（CONVENTIONS §7.1 纪律 2）
// ─────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  const DOC = [
    '```bash',
    'node scripts/check-data.js            # R1~R10',
    'node scripts/check-contract-gate.js   # G1',
    'node scripts/check-records.js         # 记录与台账齐备（C1~C6）',
    '```',
  ].join('\n');
  const SRC = "err('C1', 'x'); ok('C2', 'y'); warn('C4', 'z');";
  const L = new Set(['C']);

  const cases = [
    // D1 · 脚本清单解析与双向核对
    ['D1', '解析出 node scripts/check-*.js 清单', declaredScripts(DOC).size === 3, true],
    ['D1', '注释串被一并取出', (declaredScripts(DOC).get('check-records.js') || '').includes('C1~C6'), true],
    ['D1', '非 check- 脚本（如 gen-agent-log.js）不误认', declaredScripts('node scripts/gen-agent-log.js # x').size === 0, true],
    ['D1', '无清单 → 空 Map（交由调用方报错）', declaredScripts('随便一段文字').size === 0, true],
    ['D1', '实际有而清单无 → 命中 onlyInA', setDiff(new Set(['a.js', 'b.js']), new Set(['a.js'])).onlyInA.join(',') === 'b.js', true],
    ['D1', '清单有而实际无 → 命中 onlyInB', setDiff(new Set(['a.js']), new Set(['a.js', 'b.js'])).onlyInB.join(',') === 'b.js', true],
    ['D1', '两侧一致 → 双向皆空', (() => { const d = setDiff(new Set(['a.js']), new Set(['a.js'])); return !d.onlyInA.length && !d.onlyInB.length; })(), true],
    // D3 · 规则 ID
    ['D3', '实现 ID 提取自 err/ok/warn', [...implementedRuleIds(SRC)].sort().join(',') === 'C1,C2,C4', true],
    ['D3', '★ 自检块里的样例调用不得算作已实现（防脚本误报自己）',
      implementedRuleIds("err('C1','x');\nif (process.argv.includes('--self-test')) {\n  const c = \"err('C9','y')\";\n}").has('C9') === false, true],
    ['D3', '★ 注释里的样例调用不得算作已实现',
      implementedRuleIds("// 例如 err('C8', 'x')\nerr('C1','y');").has('C8') === false, true],
    ['D3', '★ 字符串里的 URL 不被当作行注释起点', stripComments('const u = "http://x"; // 注释').includes('http://'), true],
    ['D3', '注释里的单点 ID 被认出', [...declaredRuleIds('# G1', new Set(['G']))].join(',') === 'G1', true],
    ['D3', '区间 C1~C6 展开为 6 个', declaredRuleIds('（C1~C6）', L).size === 6, true],
    ['D3', '区间含连字符写法 C1-C3', declaredRuleIds('C1-C3', L).size === 3, true],
    ['D3', '★前缀过滤：仅声明 C 时，正文里的 L1 不误取', [...declaredRuleIds('（L1）C1', L)].join(',') === 'C1', true],
    ['D3', '★前缀过滤：仅声明 C 时，M3 不误取', declaredRuleIds('M3 与 ADR-0008', L).size === 0, true],
    ['D3', '非规则 ID 的纯词不误取', declaredRuleIds('记录与台账齐备：必备节 / 双向核对', L).size === 0, true],
    ['D3', '字母不一体的区间**不展开为区间**（C1~D3 不产生 C2）', !declaredRuleIds('C1~D3', L).has('C2'), true],
    ['D3', '空注释 → 空集', declaredRuleIds('', L).size === 0, true],
    // D4 · 脚本硬要求
    ['D4', '有 --self-test 与 PENDING_RULES → 双通过', (() => { const r = hasSelfTestAndPending('const PENDING_RULES = [];\nif (process.argv.includes(\'--self-test\')) {}'); return r.selfTest && r.pending; })(), true],
    ['D4', '缺 --self-test → 必判缺', hasSelfTestAndPending('const PENDING_RULES = [];').selfTest === false, true],
    ['D4', '缺 PENDING_RULES → 必判缺', hasSelfTestAndPending("if (process.argv.includes('--self-test')) {}").pending === false, true],
    ['D4', '注释掉的 PENDING_RULES → 不算（须真声明）', hasSelfTestAndPending('// const PENDING_RULES = [];').pending === false, true],
    ['D4', '块注释里的 PENDING_RULES → 不算', hasSelfTestAndPending(' * const PENDING_RULES = [];').pending === false, true],
    // D1 · 「待建」条目
    ['D1', '标了（待建）的缺失条目 → 不算漂移', declaredAsPending('跨模块接口 ↔ contracts（待建）') === true, true],
    ['D1', '未标注即缺失 → 必报（删了脚本忘了删文档）', declaredAsPending('记录与台账齐备（C1~C6）') === false, true],
    // D2 · 版本同步
    ['D2', '取出版本号 v1.2', docVersion('> **版本**：**v1.2**（2026-09-30…') === 'v1.2', true],
    ['D2', '无版本声明 → 返回 null', docVersion('普通段落') === null, true],
  ];

  const fails = cases.filter(([, , got, want]) => got !== want);
  console.log(c(1, '\n[check-doc-anchors] 反向测试（--self-test）'));
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

const pend = pendingNotice(PENDING_RULES);

console.log(c(1, '\n[check-doc-anchors] 流程/约定文档 ↔ 实际门禁一致性'));
console.log(c(DIM, `  真源文档  ${DOC_INVENTORY.map(d => d.file).join(' ／ ')}`));
console.log(c(DIM, `  审阅 skill ${SKILL.replace(os.homedir(), '~')}`));
console.log(c(DIM, `  模式      ${STRICT ? 'strict（警告即失败）' : '常规'}\n`));

if (pend) console.log(`  ${c(YELLOW, '⚠')} ${c(DIM, 'PEND')}  已承诺未实现：${pend}`);

for (const p of passes) console.log(`  ${c(GREEN, '✓')} ${c(DIM, p.rule)}  ${p.msg}`);
for (const w of warns) console.log(`  ${c(YELLOW, '⚠')} ${c(DIM, w.rule)}  ${w.msg}`);
for (const e of errors) console.log(`  ${c(RED, '✗')} ${c(DIM, e.rule)}  ${e.msg}`);

const failed = errors.length > 0 || (STRICT && (warns.length > 0 || pend !== null));
console.log('\n' + (failed
  ? c(RED, `结果：不通过（${errors.length} 错 / ${warns.length} 警告）`)
  : c(GREEN, `结果：通过（${passes.length} 项通过 / ${warns.length} 警告）`)) + '\n');

process.exit(failed ? 1 : 0);
