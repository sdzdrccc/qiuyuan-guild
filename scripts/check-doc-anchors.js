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

/**
 * 纯函数：脚本是否具备两条硬要求（CONVENTIONS §7.1 纪律 2 / 7）
 *
 * ★ `selfTest` 与 `pending` **必须同口径**（X-0032 的 G-1）：
 *   原写法里 `pending` 明确剥注释（防「把登记位注释掉」绕过），而 `selfTest` 只看**原始文本** ——
 *   脚本里随便一句注释（`check-asset-ref.js:44` 的「便于 \`--self-test\`」）就能被判成
 *   「具备反向测试」。实测：6 个脚本里只有 `check-asset-ref.js` 是注释命中，
 *   它一次反向用例都没跑过，而 D4 却输出「6 个脚本均具备 \`--self-test\`」= **假绿**。
 *   ⇒ 现在：① 先剥注释 ② 还要求脚本里**真有自测分支**（`argv.includes('--self-test')`），
 *   光有字符串不算。
 */
function hasSelfTestAndPending(scriptText) {
  const raw = String(scriptText);
  const code = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')                        // 块注释
    .split(/\r?\n/)
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))            // 行注释 / JSDoc 续行
    .join('\n');
  return {
    selfTest: /--self-test/.test(code) && /argv\.includes\(\s*['"]--self-test['"]\s*\)/.test(code),
    // ★ 必须**真声明**：注释掉的 `// const PENDING_RULES = []` 不算
    //   （否则「把登记位注释掉」就能静默绕过纪律 7 —— 正是本脚本要防的那类漏洞）
    pending: code.split(/\r?\n/).some((l) => /const\s+PENDING_RULES\s*=/.test(l)),
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

/**
 * 纯函数：D4 要扫描的脚本清单 —— **`scripts/` 顶层全部 `.js`**（X-0032 G-5）。
 *
 * ★ 为什么从 `^check-` 扩到全部：原判据只扫 `check-*.js`，于是
 *   `gen-review-index.js`（缺 `PENDING_RULES`）、`install-hooks.js`（两样都缺）
 *   **没有任何门禁看得见** —— 与坑 9「未覆盖 → 静默」同族。
 * ★ `lib/` 子目录不进（共享模块，不是可执行脚本）；非 `.js` 不进。
 */
function scriptsToScan(dir) {
  return fs.readdirSync(dir)
    .filter(f => /\.js$/.test(f) && fs.statSync(path.join(dir, f)).isFile())
    .sort();
}

(function d4() {
  const dir = path.join(ROOT, 'scripts');
  if (!fs.existsSync(dir)) return;
  const files = scriptsToScan(dir);
  if (files.length === 0) return;

  let bad = 0;
  for (const f of files) {
    const r = hasSelfTestAndPending(read(path.join(dir, f)) || '');
    if (!r.selfTest) { err('D4', `\`scripts/${f}\` **无 \`--self-test\`** —— 没有反向测试的脚本 = 未被验证过的脚本（纪律 2）`); bad++; }
    if (!r.pending) { err('D4', `\`scripts/${f}\` **无 \`PENDING_RULES\`** —— 「已承诺未实现」无处登记（纪律 7）`); bad++; }
  }
  if (bad === 0) ok('D4', `${files.length} 个脚本均具备 \`--self-test\` 与 \`PENDING_RULES\`（含 gen-* / 装机脚本 · G-5 扩面）`);
})();

// ─────────────────────────────────────────────────────────────
// D5 · README **不得复制**文档版本号（X-0032 G-7 · 反 duplication 锚定）
//
// ★ 病灶（2026-10-12 实测）：README 手抄了 7 份文档的版本号（还抄了两份 ——
//   「仓库内容」块 + 底部链接区各一份），其中 4 份已腐（REVIEW-PROCESS v1.2→v1.6 ·
//   data-contract v0.6→v0.7 · protocol-contract v0.3→v0.4 · PROJECT-STRUCTURE v1.6→v2.0）。
// ★ 修法不是「配个校对判据把两份对齐」—— 那要求永远同时维护两处：
//   **版本号只住文档头部（单一真源）；README 一个版本号都不许抄。**
//   ⇒ 本判据钉的是这条不变式，比「两边相等」更强、也更简单（没有第二份，就无从漂移）。
// ─────────────────────────────────────────────────────────────

/** 头部带版本号的文档（README 曾手抄版本的那几份） */
const VERSIONED_DOCS = [
  { file: 'docs/MULTI-AGENT-DEV-PLAN.md', label: '协作方案' },
  { file: 'docs/CONVENTIONS.md', label: '工程约定' },
  { file: 'docs/REVIEW-PROCESS.md', label: '审阅流程' },
  { file: 'docs/PROJECT-STRUCTURE.md', label: '工程结构详案' },
  { file: 'contracts/data-contract.md', label: '数据契约' },
  { file: 'contracts/protocol-contract.md', label: '协议契约' },
  { file: 'contracts/asset-ref-contract.md', label: '资产引用契约' },
];

/**
 * 纯函数：README 里提及某文档的行**抄下来的版本号**（一行一个；一行多个也算抄）。
 * 返回数组 —— 空 = 没抄（合规）；非空 = 每项都是一处待腐的副本（D5 报错用）。
 */
function readmeVersionClaims(readmeText, baseName) {
  const out = [];
  for (const line of String(readmeText).split(/\r?\n/)) {
    if (!line.includes(baseName)) continue;
    for (const v of line.match(/v[\d.]+/g) || []) out.push(v);
  }
  return out;
}

(function d5() {
  const readme = read(path.join(ROOT, 'README.md'));
  if (readme === null) { warn('D5', '读不到 `README.md` → 跳过'); return; }
  let checked = 0;
  for (const { file, label } of VERSIONED_DOCS) {
    const base = path.basename(file);
    if (!readme.includes(base)) { err('D5', `README **未提及** \`${base}\` —— 门面文档漏了它（${label}）`); continue; }
    const dup = readmeVersionClaims(readme, base);
    if (dup.length > 0) {
      err('D5', `README 的 \`${base}\` 行**抄了版本号**（${dup.join(' / ')}）—— 版本只住文档头部，门面不复制（G-7：手抄必腐，实测 4/7 已腐）`);
      continue;
    }
    checked++;
    ok('D5', `${label}：README 提及且未抄版本号（单一真源在文档头部）`);
  }
  if (checked === 0) warn('D5', '无任何文档完成核对');
})();

// ─────────────────────────────────────────────────────────────
// D5（扩面）· 门面**只写指针，不写状态与区间**（`X-0054` · 治 G-1 的五类漂移）
//
// ★ 病灶：`X-0053` 实测 README / AGENTS 五处「自称」与真源冲突，而 `D5` 只锚版本号 ——
//   ★ **漂移的从来不只是版本号**：记录号区间、里程碑状态、脚本计数、CI 有无，四类全都腐过。
//   ★ 修法与 D5 同源：**不给它第二处副本**，而不是"配个校对判据把两份对齐"。
// ★ 判据边界（防误报 = 纪律 1）：
//   · 只扫 `README.md` / `AGENTS.md` 两份**门面/纪律**文档（契约/流程文档不在此列）；
//   · 只认**四类机械可比**的形态，语义判断（"这段写得对不对"）不碰；
//   · 记录号区间、CI 断言、里程碑状态：**有即错**（无豁免——只有一个真源）；
//   · 脚本计数：**与 `run-all-checks.js` 的 `STEPS.length` 比**，不是与 `check-*.js` 文件数比
//     （两者本就不同：8 条判据 ＋ 2 条视图一致性 = 10）。★ 口径写错比数字写错更难发现。
// ─────────────────────────────────────────────────────────────

/** 纯函数：抄下来的记录号区间（`X-0001 … X-0040` / `X-0001~X-0052`） */
function recordSpanClaims(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/\bX-(\d{4})(?:\.md)?\s*(?:…|\.\.\.|~|–|—|-)\s*X-(\d{4})/);
    if (m) out.push(`X-${m[1]}…X-${m[2]}`);
  }
  return out;
}

/** 纯函数：「本仓没有 CI」类断言（CI 实际存在时即为漂移） */
function ciDenialClaims(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    // ★ 只认「本仓/全仓 + 无 CI」的**现状断言**；历史叙述（「此前无 CI」）不在此列
    if (/(?:本仓|全仓|这里)[^。\n]{0,6}(?:没有|无|未配|没配)\s*CI/.test(line)) out.push(line.trim());
  }
  return out;
}

/** 纯函数：里程碑表行自带状态（`| **M1** | … | ⏭ 下一步 |`） */
function milestoneStatusRows(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!/^\|\s*\**\s*M\d+\**\s*\|/.test(line)) continue;
    if (/(✅|⏭|🟡|🔴|已完成|未开始|进行中|下一步)/.test(line)) out.push(line.trim());
  }
  return out;
}

/** 纯函数：文档里「跑 N 个脚本」的计数断言 */
function scriptCountClaims(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/(?:依次跑|汇总跑|一共跑|跑)\s*(\d+)\s*个(?:校验)?脚本/);
    if (m) out.push(Number(m[1]));
  }
  return out;
}

/** 纯函数：`run-all-checks.js` 实跑的条目数（`STEPS` 数组长度）——★ 计数的唯一真源 */
function runAllEntryCount(scriptText) {
  const m = String(scriptText).match(/const\s+STEPS\s*=\s*\[([\s\S]*?)\n\];/);
  if (!m) return null;
  return (m[1].match(/\{\s*file:\s*'/g) || []).length;
}

(function d5b() {
  const ci = fs.existsSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'));
  const runAll = runAllEntryCount(read(path.join(ROOT, 'scripts', 'run-all-checks.js')) || '');
  const targets = [
    { file: 'README.md', label: 'README 门面' },
    { file: 'AGENTS.md', label: 'AGENTS 纪律' },
  ];
  let checked = 0;
  for (const { file, label } of targets) {
    const t = read(path.join(ROOT, file));
    if (t === null) { warn('D5', `${label}（${file}）读不到 → 跳过`); continue; }
    checked++;
    let hit = 0;

    for (const s of recordSpanClaims(t)) {
      hit++;
      err('D5', `${label}：抄了记录号区间 \`${s}\` —— 记录清单唯一真源是 \`reviews/INDEX.md\`（G-1 实证：写到 X-0040 时已到 X-0053）`);
    }
    for (const n of scriptCountClaims(t)) {
      if (runAll === null) { warn('D5', `${label}：写了脚本计数 ${n}，但读不出 \`run-all-checks.js\` 的 \`STEPS\` → 无法核对`); continue; }
      if (n !== runAll) {
        hit++;
        err('D5', `${label}：写「跑 ${n} 个脚本」而 \`run-all-checks.js\` 实跑 **${runAll}** 条 —— 计数只住脚本（8 条判据 ＋ 2 条视图一致性），文档不复写`);
      }
    }
    if (ci) for (const s of ciDenialClaims(t)) {
      hit++;
      err('D5', `${label}：断言「没有 CI」而 \`.github/workflows/ci.yml\` 存在 —— \`${s.slice(0, 50)}\``);
    }
    if (file === 'README.md') for (const s of milestoneStatusRows(t)) {
      hit++;
      err('D5', `${label}：里程碑行写了状态（\`${s.slice(0, 40)}\`）—— 状态唯一真源是 \`docs/ROADMAP.md\`，门面只写指针`);
    }
    if (hit === 0) ok('D5', `${label}：无易腐事实副本（记录号区间 / 脚本计数 / CI 断言 / 里程碑状态）`);
  }
  if (checked === 0) warn('D5', '两份门面文档均不可读 → 扩面判据未执行');
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
    // ★ G-1 的补漏：原判据**不剥注释**，一句注释就能骗过它 —— 而反向用例独缺 selfTest 的注释用例，
    //   所以这个假绿**永远不会被它自己发现**（不对称 = 比误报更危险）。
    ['D4', '行注释里的 --self-test → 不算（G-1 的原始漏洞）', hasSelfTestAndPending("// 便于 --self-test\nconst x = 1;").selfTest === false, true],
    ['D4', 'JSDoc 块注释里的 --self-test → 不算', hasSelfTestAndPending('/**\n * 用法：node x.js --self-test\n */\nconst y = 2;').selfTest === false, true],
    ['D4', '只有字符串提及、无 argv 分支 → 不算真自测', hasSelfTestAndPending("console.log('--self-test');").selfTest === false, true],
    ['D4', '真有 argv 分支 → 算（不许把合格脚本判死）', hasSelfTestAndPending("if (process.argv.includes('--self-test')) run();").selfTest === true, true],
    // D1 · 「待建」条目
    ['D1', '标了（待建）的缺失条目 → 不算漂移', declaredAsPending('跨模块接口 ↔ contracts（待建）') === true, true],
    ['D1', '未标注即缺失 → 必报（删了脚本忘了删文档）', declaredAsPending('记录与台账齐备（C1~C6）') === false, true],
    // D2 · 版本同步
    ['D2', '取出版本号 v1.2', docVersion('> **版本**：**v1.2**（2026-09-30…') === 'v1.2', true],
    ['D2', '无版本声明 → 返回 null', docVersion('普通段落') === null, true],
    // D5 · README 禁抄版本号（G-7 · 反 duplication）
    ['D5', '★ 行尾抄了版本号 → 必抓出（G-7 的手抄副本）', readmeVersionClaims('REVIEW-PROCESS.md  审阅流程（六步 · v1.6）', 'REVIEW-PROCESS.md').join(','), 'v1.6'],
    ['D5', '★ 粗体形态的抄写也抓（**v0.28**）', readmeVersionClaims('- [x](x.md) — 方案（**v0.28**）', 'x.md').join(','), 'v0.28'],
    ['D5', '没抄版本号 → 空（合规 · 不许误报）', readmeVersionClaims('data-contract.md  数据模型', 'data-contract.md').length, 0],
    ['D5', '一行抄两个 → 两个都报（不猜哪个对）', readmeVersionClaims('x.md a v1.0 / b v2.0', 'x.md').join(','), 'v1.0,v2.0'],
    ['D5', '别的行提到同名无关文本不受影响', readmeVersionClaims('aaa.md v1.0\nbbb.md 无版本', 'bbb.md').length, 0],
    // D5 扩面 · 门面禁写易腐事实（X-0054 · G-1）
    ['D5', '★ 抄了记录号区间 → 必抓（G-1 的实证形态）', recordSpanClaims('  X-0001.md … X-0040.md     一篇不落').join(','), 'X-0001…X-0040'],
    ['D5', '★ 单个记录号不算区间（不许误报）', recordSpanClaims('见 `reviews/X-0053.md`').length, 0],
    ['D5', '★「本仓没有 CI」→ 必抓', ciDenialClaims('## 10. 门禁怎么跑（★ **本仓没有 CI** · 2026-10-13 新增）').length, 1],
    ['D5', '★ 历史叙述「此前无 hook」→ 不得误报成 CI 断言', ciDenialClaims('★ 当时无 CI、无 git hook（这是历史）').length, 0],
    ['D5', '★ 里程碑行带 ⏭ → 必抓', milestoneStatusRows('| **M1** | 建号 | ⏭ **下一步** |').length, 1],
    ['D5', '★ 里程碑行进位符 ✅ → 也抓', milestoneStatusRows('| **M0** | 契约层 | ✅ **已完成** |').length, 1],
    ['D5', '★ 里程碑行无状态 → 不得误报（指针形态是正解）', milestoneStatusRows('| **M2** | 首战 | 见 `docs/ROADMAP.md` §2 |').length, 0],
    ['D5', '★「依次跑 8 个脚本」→ 抓出计数', scriptCountClaims('node scripts/run-all-checks.js            # 依次跑 8 个脚本；任一红 → 退出码 1').join(','), '8'],
    ['D5', '★「8 个校验脚本此前没有机制」→ 不算计数断言（无「跑」）', scriptCountClaims('★★ **8 个校验脚本此前没有任何自动执行机制**').length, 0],
    ['D5', '★ run-all 条目数：从 STEPS 数组数 file 项', runAllEntryCount("const STEPS = [\n  { file: 'a.js', label: 'x' },\n  { file: 'b.js', label: 'y' },\n];"), 2],
    ['D5', '★ 读不出 STEPS → null（调用方降级为警告，不许当成 0）', runAllEntryCount('没有这段'), null],
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
