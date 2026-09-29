#!/usr/bin/env node
'use strict';

/**
 * check-records.js —— 记录与台账齐备闸门（来源 X-0015）
 *
 * 职责：把方案 §6「记录机制：强制产出 + 台账查账」里**已经写明、但从没被执行过**的
 *       规则，变成可机械执行的门禁。
 *
 * ── 为什么需要它（X-0015 §二-2 的实测证据）────────────────────
 *   ① `registry/cross-repo-ledger.md` 的「有正文无索引 = 孤儿记录」规则，
 *      其自身留痕写着「**该规则立了，但从未被执行过**」—— 立了不执行 = 没有。
 *   ② dalu 的 M1 波次 1 + 建库建表**三笔提交无任何 `records/T-*.md`**，
 *      而记录模板里那个「审核」节，**14 篇 guild 记录里一篇都没有**。
 *   ③ 根因不是缺规则，是缺**执行载体** —— 正是方案 §11.6 与 CONVENTIONS §7.2 的病：
 *      「同一个规则在文档里写了三遍还不被执行，它就该做成门禁，而不是再写第四遍」。
 *
 * ── 规则的出处（本脚本不自造判据）──────────────────────────
 *   C1 记录必备节          ← 方案 §6.1 记录模板
 *   C2 台账 ↔ 正文 双向核对 ← 方案 §6.2 + `cross-repo-ledger.md` §附 维护纪律 1 / 3
 *   C3 审核结论二值        ← ADR-0008 + 方案 §5.5（禁评分）
 *   C4 审核分级须声明      ← 方案 §5.3（v2 升级：L0~L3 **必填**；改契约必须 L3 = arch + 大人）
 *   C5 改动须有同批记录     ← AGENTS.md §3 纪律 4（交付即产记录 · 与改动同仓）
 *   C6 下游卡契约回执      ← 机制⑦（来源 X-0016）—— dalu 卡须有**非空**「契约回执」节
 *
 * ── 存量与新增的切分（重要的诚实设计）──────────────────────
 *   C3 / C4 / C5 揭示的是**历史存量缺口**（14 篇记录无审核节、三笔 dalu 提交无记录）。
 *   把存量一律判红 = 门禁一上线就永久红 = 被无视。
 *   故以 `GATE_EPOCH`（本脚本诞生时的两仓 HEAD）为界：
 *     · **EPOCH 及其之前** → `warn`，逐条列为**存量清单**（可见、不掩盖）；
 *     · **EPOCH 之后**     → `err`，**必须办**。
 *   → 这既不是「虚假的安心」（存量全部点名列出了），也不会变成「永远误报」（§7.1 纪律 4）。
 *
 * 用法：
 *   node scripts/check-records.js             # 常规
 *   node scripts/check-records.js --strict    # 警告也视为失败
 *   node scripts/check-records.js --self-test # 反向测试
 *
 * 退出码：0 = 通过 / 1 = 失败
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DALU = 'F:/zxc/Project/qiuyuan-dalu';
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
  // { id: 'C7', from: 'X-0000', desc: '…', due: 'M2' },
];

/** 纯函数：待实现规则的提示文本（空名单 → `null`，便于 `--self-test`） */
function pendingNotice(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list
    .map(r => `${r.id || '?'}(from ${r.from || '⚠缺来源'}${r.due ? ', due ' + r.due : ''})`)
    .join(' / ');
}

// ─────────────────────────────────────────────────────────────
// 豁免花名册 —— 「豁免也要留证，且必须写清谁在什么时候放的」（来源 X-0016）
// ─────────────────────────────────────────────────────────────
/**
 * 与 `check-identifiers.js` 的 `RETIRED`（退役名花名册）同构：
 * 命中者**从 backlog 移入「已豁免」并原样打印**（仍可见，只是不再报 warn）。
 *
 * ★ 存在的理由：X-0015 §六 说存量「可**书面豁免**」，但**脚本里没有任何实现位** ⇒
 *   存量项会**永久黄**，与 §四-3「不许给未来埋雷 / 不许永久误报」**自相矛盾**。
 *   此表就是那个「书面豁免」的落点：**豁免必须留证**（理由 · 裁定人 · 日期）。
 */
const WAIVED = {
  // 提交级（C5）：'e1ff46e': '骨架期前置提交 · 大人 2026-09-30 裁定',
  commits: {},
  // 记录级（C6 契约回执）：'T-0001': '存量卡（机制上线前）· 大人 2026-09-30 裁定',
  records: {},
};

/** 纯函数：某 key 是否已豁免（命中 → 返回理由串；未命中 → `null`） */
function waivedReason(table, key) {
  if (!table || !Object.prototype.hasOwnProperty.call(table, key)) return null;
  return table[key] || '（⚠ 无理由 · 违规 —— 豁免必须写清谁在什么时候放的）';
}

/**
 * 门禁纪元 —— 本脚本诞生时两仓的 HEAD。
 * 这两条提交**及其之前**的缺口记为存量（warn）；之后的必须办（err）。
 * ★ 本值是**一次性快照**，不随仓库推进而改 —— 否则存量会被悄悄洗白。
 */
const GATE_EPOCH = {
  [ROOT]: '83560e6',   // guild：docs(v0.26) M1 出身收敛 + 账号协议口径勘误（ADR-0018）
  [DALU]: 'b306b9f',   // dalu：执行建库建表 + 修 Windows 客户端中文乱码
};

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

/** 纯函数：记录必备节的在场判定（按**关键词**认，不按标题精确匹配 —— 存量记录用中文序号标题） */
function sectionPresence(text) {
  const t = String(text);
  return {
    status: /状态[：:]/.test(t),
    author: /执行者[：:]/.test(t),
    changes: /改动清单/.test(t),
    evidence: /验证证据/.test(t) || /门禁/.test(t),
    review: /审核/.test(t),
  };
}

/**
 * 纯函数：标题的「主体名」—— 去掉 `#`、空白与常见序号前缀（`九、` / `7.`）。
 *
 * ★ 存在的理由（实测踩出来的误报）：`reviewSection` 原判据是「标题**含**『审核』」，
 *   于是把 `# X-0016 … ⑥ 审核分级` 这种**大标题**也认成了审核节 ⇒ 误报。
 *   → 收紧为「**主体名以某词开头**」，并要求其后不是汉字。
 */
function headingName(line) {
  const head = String(line).replace(/^#{1,6}\s*/, '').trim();
  return head.replace(/^(?:[一二三四五六七八九十]+|\d+)\s*[、.．)）]\s*/, '');
}

/** 纯函数：抽出「审核」节正文（无该节返回 null）—— **主体名须以「审核」开头** */
function reviewSection(text) {
  const lines = String(text).split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i]) && /^审核/.test(headingName(lines[i]))) { start = i; break; }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join('\n');
}

/**
 * 纯函数：审核节里是否出现「评分式」表述（ADR-0008 禁主观评分）
 *
 * 三处刻意的收窄（实测教训 · 曾两次误报 X-0002）：
 *   ① **只看「审核」节** —— ADR-0008 约束的是**审核结论**。
 *      首版扫全文，于是把「新增 ADR-0008（禁主观评分）」这种**引用规则本身**的行也报了。
 *   ② **逐行给「豁免」** —— 行内出现「禁 / 不得 / 评分制 / ADR-0008」时，
 *      该行是在**讲规则**而不是**在评分**，放行。
 *   ③ **（X-0016 补）豁免词加「否决 / 不采用 / 取代 / 拒绝」** ——
 *      X-0002 的审核节里有「20（其他 agent **评分**）**否决**并给出替代品」，
 *      那是**在讲被否决的提案**，不是自己在评分 ⇒ 第二次误报，再收窄。
 *   → 判据仍是机械的；收窄的是**适用范围**，不是放宽标准。
 */
function hasScoreLanguage(text) {
  const sec = reviewSection(text);
  if (sec === null) return false;   // 无审核节 → 本规则不适用（缺节由 C1 报）
  return sec.split(/\r?\n/).some(l =>
    !/禁|不得|不许|不评分|无评分|免|评分制|ADR-0008|否决|不采用|取代|拒绝/.test(l) &&
    /\d+(\.\d+)?\s*分|满意度|评分|打分|得分/.test(l));
}

/** 纯函数：记录是否涉及契约变更（改动清单里提到 `contracts/`） */
function touchesContracts(text) {
  return /contracts\//.test(String(text));
}

/** 纯函数：记录是否声明了 L3 终审（须出现「大人」—— 方案 §5.3 L3 = arch + 大人） */
function declaresL3(text) {
  return /大人/.test(String(text));
}

/** 纯函数：从 ledger 抽出已登记的编号（只认 `**X-0001**` 形态的首列） */
function ledgerEntries(text) {
  const out = new Set();
  for (const m of String(text).matchAll(/^\|\s*\*\*(X-\d{4})\*\*/gm)) out.add(m[1]);
  return out;
}

/** 纯函数：从 records 目录文件名抽出编号（只认 `X-0001.md` 形态） */
function recordEntries(fileNames) {
  const out = new Set();
  for (const f of fileNames) {
    const m = String(f).match(/^(X-\d{4})\.md$/);
    if (m) out.add(m[1]);
  }
  return out;
}

/** 纯函数：双向差集 */
function ledgerDiff(ledger, records) {
  return {
    missingBody: [...ledger].filter(x => !records.has(x)).sort(),   // 有索引无正文
    orphanBody: [...records].filter(x => !ledger.has(x)).sort(),    // 有正文无索引
  };
}

/** 纯函数：某笔提交是否「改了实现/契约却没带同批记录」 */
function commitNeedsRecord(files, implRe, recordRe) {
  const impl = files.some(f => implRe.test(f));
  const rec = files.some(f => recordRe.test(f));
  return impl && !rec;
}

/**
 * 纯函数：抽出「主体名以 `kw` 开头且其后不是汉字」的节的正文（无 → `null`）。
 * `reviewSection` 的泛化；**同样要求主体开头**（防「标题里顺带提到该词」被误认）。
 */
function sectionByKeyword(text, kw) {
  const lines = String(text).split(/\r?\n/);
  const re = new RegExp(`^${kw}(?![\\u4e00-\\u9fff])`);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i]) && re.test(headingName(lines[i]))) { start = i; break; }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join('\n');
}

/**
 * 纯函数：是否含**非空**的「契约回执」节（机制⑦ · 下游卡义务 · 来源 X-0016）
 * ★ 「无」也算非空 —— 它要的是**显式表态**，不是「写点好话」。
 */
function contractReceiptPresence(text) {
  const sec = sectionByKeyword(text, '契约回执');
  if (sec === null) return false;
  return sec.split(/\r?\n/).slice(1).join('\n').trim().length > 0;   // 去掉标题行后非空
}

/** 纯函数：审核节声明的**触发级别**（L0~L3）；未声明 → `null`（方案 §5.3） */
function declaredLevel(text) {
  const sec = reviewSection(text);
  if (sec === null) return null;
  const m = sec.match(/\bL([0-3])\b/);
  return m ? Number(m[1]) : null;
}

/** 纯函数：级别是否与改动面匹配 —— **改了 `contracts/` 的必须 L3**（方案 §5.3） */
function levelMatches(level, touches) {
  if (level === null) return false;
  return touches ? level === 3 : level >= 0;
}

// ─────────────────────────────────────────────────────────────
// git 读取（失败即降级为 warn —— 门禁不得因环境而假绿）
// ─────────────────────────────────────────────────────────────

function git(repo, args) {
  try {
    return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

/** 读某仓提交（含改动文件清单）。返回 null = git 不可用 */
function commits(repo, limit) {
  const raw = git(repo, ['log', `-n`, String(limit), '--name-only', '--pretty=format:@@%H%x09%ad%x09%s', '--date=short']);
  if (raw === null) return null;
  const out = [];
  let cur = null;
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith('@@')) {
      if (cur) out.push(cur);
      const [hash, date, ...s] = line.slice(2).split('\t');
      cur = { hash, date, subject: s.join('\t'), files: [] };
    } else if (line.trim() !== '' && cur) {
      cur.files.push(line.trim());
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** EPOCH 及其之前的提交集合（= 存量） */
function epochSet(repo, epoch) {
  const raw = git(repo, ['rev-list', epoch]);
  if (raw === null) return null;
  return new Set(raw.split(/\r?\n/).filter(Boolean));
}

/**
 * 读某文件**首次出现**（`--diff-filter=A`）的提交，是否在纪元之后。
 * `true` = 新增（**须办**）；`false` / `null` = 存量 或 git 不可用（**按 warn 处理，保守**）。
 * ★ 判据：**存量与新增必须分开算**（X-0015 §四-3）—— 门禁一上线就永久红 = 被无视。
 * ★ 取「首次出现」而非「最后一次改动」—— 否则「纪元前建的卡、纪元后被顺手改一行」
 *   会被误判为新增（**实测踩过**：`T-0010` / `T-0017` 因修一处引用而从 warn 变 err）。
 */
function fileIsFresh(repo, rel, epoch) {
  if (epoch === null || epoch === undefined) return true;
  const h = git(repo, ['log', '--diff-filter=A', '-1', '--format=%H', '--', rel]);
  if (h === null) return null;      // git 不可用 → 保守按存量
  const hash = h.trim();
  if (hash === '') return true;     // 尚未提交 → 视为新增
  return !epoch.has(hash);
}

// ─────────────────────────────────────────────────────────────
// C1 · 记录必备节（方案 §6.1）
// ─────────────────────────────────────────────────────────────

const GUILD_RECORDS = path.join(ROOT, 'records');

function guildRecordFiles() {
  if (!fs.existsSync(GUILD_RECORDS)) return [];
  return fs.readdirSync(GUILD_RECORDS).filter(f => /^X-\d{4}\.md$/.test(f)).sort();
}

(function c1() {
  const files = guildRecordFiles();
  if (files.length === 0) {
    err('C1', '`records/` 下无任何 `X-*.md` —— 禁止空集真空通过');
    return;
  }
  const bad = { status: [], author: [], changes: [], evidence: [], review: [] };
  for (const f of files) {
    const p = sectionPresence(read(path.join(GUILD_RECORDS, f)) || '');
    for (const k of Object.keys(bad)) if (!p[k]) bad[k].push(f.replace(/\.md$/, ''));
  }

  // 「状态 / 执行者」缺 → err：没有执行者，§6.1 的派生视图 `agent-log` 直接失效
  for (const k of ['status', 'author']) {
    if (bad[k].length) {
      err('C1', `${bad[k].length} 篇记录缺「${k === 'status' ? '状态' : '执行者'}」节（方案 §6.1 记录模板必填）：${bad[k].join(' / ')}`);
    }
  }
  // 「改动清单 / 验证证据 / 审核」缺 → warn（存量缺口，逐条点名）
  const softName = { changes: '改动清单', evidence: '验证证据（或门禁）', review: '审核' };
  for (const k of ['changes', 'evidence', 'review']) {
    if (bad[k].length) {
      warn('C1', `${bad[k].length} 篇记录缺「${softName[k]}」节：${bad[k].join(' / ')}`);
    }
  }
  if (Object.values(bad).every(v => v.length === 0)) {
    ok('C1', `记录必备节齐备（${files.length} 篇：状态 / 执行者 / 改动清单 / 验证证据 / 审核）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// C2 · 台账 ↔ 正文 双向核对（方案 §6.2 · ledger §附 纪律 1/3）
// ─────────────────────────────────────────────────────────────

(function c2() {
  const ledgerPath = path.join(ROOT, 'registry', 'cross-repo-ledger.md');
  const lt = read(ledgerPath);
  if (lt === null) { err('C2', '读不到 `registry/cross-repo-ledger.md` —— 无法交叉查账'); return; }

  const ledger = ledgerEntries(lt);
  const records = recordEntries(guildRecordFiles());
  if (ledger.size === 0) { err('C2', 'ledger 未解析出任何 `X-*` 索引行 —— 禁止空集真空通过'); return; }
  if (records.size === 0) { err('C2', '`records/` 未解析出任何 `X-*.md` —— 禁止空集真空通过'); return; }

  const diff = ledgerDiff(ledger, records);
  if (diff.missingBody.length) {
    err('C2', `有索引无正文（**缺账**）：${diff.missingBody.join(' / ')}`);
  }
  if (diff.orphanBody.length) {
    err('C2', `有正文无索引（**孤儿记录**）：${diff.orphanBody.join(' / ')}`);
  }
  if (!diff.missingBody.length && !diff.orphanBody.length) {
    ok('C2', `台账 ↔ 正文 双向核对通过（索引 ${ledger.size} 行 / 正文 ${records.size} 篇，无缺账、无孤儿）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// C3 / C4 · 审核结论二值 + 契约变更须 L3 终审
// ─────────────────────────────────────────────────────────────

(function c34() {
  const files = guildRecordFiles();
  if (files.length === 0) return;

  const epoch = epochSet(ROOT, GATE_EPOCH[ROOT]);
  const scored = [];
  const noLevel = { fresh: [], backlog: [] };   // 有审核节却**未声明触发级别**
  const lvlBad = { fresh: [], backlog: [] };    // 改了契约但**级别 ≠ L3**
  const noAdult = { fresh: [], backlog: [] };   // 改了契约但**未出现「大人」**
  const push = (b, id, isFresh) => b[isFresh ? 'fresh' : 'backlog'].push(id);

  for (const f of files) {
    const t = read(path.join(GUILD_RECORDS, f)) || '';
    const id = f.replace(/\.md$/, '');
    if (hasScoreLanguage(t)) scored.push(id);

    const touches = touchesContracts(t);
    const lvl = declaredLevel(t);
    const fresh = fileIsFresh(ROOT, `records/${f}`, epoch) === true;
    if (lvl === null) {
      // 「有审核节却无级别」才进本判据；**无审核节**的由 C1 报，不重复
      if (reviewSection(t) !== null) push(noLevel, id, fresh);
    } else {
      if (touches && lvl !== 3) push(lvlBad, `${id}(L${lvl})`, fresh);
      if (touches && !declaresL3(t)) push(noAdult, id, fresh);
    }
  }

  if (scored.length) {
    err('C3', `${scored.length} 篇记录出现评分式表述（ADR-0008：判据一律二值，禁主观评分）：${scored.join(' / ')}`);
  } else {
    ok('C3', `审核判据二值合规（${files.length} 篇记录无评分 / 满意度 / 打分表述）`);
  }

  // ── C4（v2 升级：从「须含大人」升级为「**触发级别须声明且与改动面匹配**」）──
  for (const id of noLevel.fresh) {
    err('C4', `${id}：**审核节未声明触发级别**（方案 §5.3：L0 自检 / L1 消费者审 / L2 会审 / L3 终审，必填）`);
  }
  if (noLevel.backlog.length) {
    warn('C4', `${noLevel.backlog.length} 篇**存量**记录审核节未声明触发级别（纪元 \`${GATE_EPOCH[ROOT]}\` 之前，须补记或书面豁免）：${noLevel.backlog.join(' / ')}`);
  }
  for (const id of lvlBad.fresh) {
    err('C4', `${id}：改了 \`contracts/\` 但**级别不是 L3**（方案 §5.3：改契约须 L3 终审，不可省）`);
  }
  if (lvlBad.backlog.length) {
    warn('C4', `${lvlBad.backlog.length} 篇**存量**记录改了 \`contracts/\` 但级别不是 L3：${lvlBad.backlog.join(' / ')}`);
  }
  for (const id of noAdult.fresh) {
    err('C4', `${id}：改了 \`contracts/\` 但**未出现「大人」**（L3 = \`arch\` + **大人**，不可省）`);
  }
  if (noAdult.backlog.length) {
    warn('C4', `${noAdult.backlog.length} 篇**存量**记录改了 \`contracts/\` 但未出现「大人」：${noAdult.backlog.join(' / ')}`);
  }
  if (!noLevel.fresh.length && !noLevel.backlog.length &&
      !lvlBad.fresh.length && !lvlBad.backlog.length &&
      !noAdult.fresh.length && !noAdult.backlog.length) {
    ok('C4', `审核分级合规（${files.length} 篇：触发级别已声明，且与改动面匹配）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// C5 · 改了实现 / 契约，就必须有同批记录（AGENTS.md §3 纪律 4）
// ─────────────────────────────────────────────────────────────

const IMPL_RE = {
  [DALU]: /^(server|data|db|ue-client|admin|tools|platforms)\//,
  [ROOT]: /^(contracts|scripts)\//,
};
const RECORD_RE = {
  [DALU]: /^records\/T-\d+\.md$/,
  [ROOT]: /^records\/X-\d+\.md$/,
};
const REPO_LABEL = { [DALU]: 'dalu', [ROOT]: 'guild' };

(function c5() {
  for (const repo of [DALU, ROOT]) {
    const label = REPO_LABEL[repo];
    const cs = commits(repo, 200);
    if (cs === null) { warn('C5', `${label}：git 不可用 → 本仓 C5 跳过`); continue; }

    const epoch = epochSet(repo, GATE_EPOCH[repo]);
    if (epoch === null) {
      warn('C5', `${label}：定位不到门禁纪元 \`${GATE_EPOCH[repo]}\`（历史被改写？）→ 全部按存量 warn`);
    }

    const backlog = [];
    const fresh = [];
    for (const cm of cs) {
      if (!commitNeedsRecord(cm.files, IMPL_RE[repo], RECORD_RE[repo])) continue;
      const isBacklog = epoch === null ? true : epoch.has(cm.hash);
      (isBacklog ? backlog : fresh).push(`${cm.hash.slice(0, 7)} ${cm.date} ${cm.subject.slice(0, 42)}`);
    }

    // 存量里剔除**已豁免**者（「豁免也要留证」· 来源 X-0016 · 补 X-0015 §六「书面豁免」无实现位之缺）
    const waived = [], kept = [];
    for (const f of backlog) {
      const h = f.slice(0, 7);
      (waivedReason(WAIVED.commits, h) ? waived : kept).push(f);
    }

    for (const f of fresh) {
      err('C5', `${label}：提交改了实现/契约却**无同批记录** → ${f}`);
    }
    if (kept.length) {
      warn('C5', `${label}：**存量** ${kept.length} 笔提交改了实现/契约却无同批记录（纪元 \`${GATE_EPOCH[repo]}\` 之前，须补记或书面豁免）：${kept.map(x => x.slice(0, 7)).join(' / ')}`);
    }
    for (const f of waived) {
      ok('C5', `${label}：**已豁免**（留证）→ ${f.slice(0, 7)}：${waivedReason(WAIVED.commits, f.slice(0, 7))}`);
    }
    if (!fresh.length && !kept.length && !waived.length) {
      ok('C5', `${label}：改动与记录同批（近 ${cs.length} 笔提交无缺口）`);
    }
  }
})();

// ─────────────────────────────────────────────────────────────
// C6 · 下游卡必须持「契约回执」（机制⑦ · 来源 X-0016）
// ─────────────────────────────────────────────────────────────
/**
 * 治的是：**guild 自己的契约与门禁落后下游一整天，无人发现**（X-0015 §五-⑦）。
 * 方案 §5.2「审核者 = 下游消费者」表里**没有任何一行**覆盖「guild 的契约由谁审」。
 * 补法：让**下游（dalu）每张完成卡自动上报** —— 必填一节「契约回执」，
 *       写清「本次消费了契约哪几节 / 哪一处读不通、缺定义、需变更」（无则显式写「无」）。
 * ★ 它**不参与质量判定**（二值），只作**上报通道** —— 免得又变成「为写好话」而写。
 */

const DALU_RECORDS = path.join(DALU, 'records');

function daluRecordFiles() {
  if (!fs.existsSync(DALU_RECORDS)) return [];
  return fs.readdirSync(DALU_RECORDS).filter(f => /^T-\d+\.md$/.test(f)).sort();
}

(function c6() {
  const files = daluRecordFiles();
  if (files.length === 0) { ok('C6', 'dalu 暂无 `T-*` 记录 → 本规则不适用'); return; }

  const epoch = epochSet(DALU, GATE_EPOCH[DALU]);
  const fresh = [], backlog = [], waived = [];
  for (const f of files) {
    const id = f.replace(/\.md$/, '');
    const why = waivedReason(WAIVED.records, id);
    if (why) { waived.push(`${id}：${why}`); continue; }
    const t = read(path.join(DALU_RECORDS, f)) || '';
    if (contractReceiptPresence(t)) continue;
    (fileIsFresh(DALU, `records/${f}`, epoch) === true ? fresh : backlog).push(id);
  }

  for (const id of fresh) {
    err('C6', `dalu 卡**缺「契约回执」节（或该节为空）**（机制⑦：须写清本次消费了契约哪几节 / 哪一处读不通 · 无则显式写「无」）：${id}`);
  }
  if (backlog.length) {
    warn('C6', `dalu **存量** ${backlog.length} 篇 T-* 卡缺「契约回执」节（纪元 \`${GATE_EPOCH[DALU]}\` 之前，须补记或书面豁免 · 落 WAIVED.records）：${backlog.join(' / ')}`);
  }
  for (const w of waived) ok('C6', `已豁免（留证）→ ${w}`);
  if (!fresh.length && !backlog.length) {
    ok('C6', `下游卡契约回执齐备（${files.length} 篇 T-*，全含非空「契约回执」节）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// --self-test · 反向测试（CONVENTIONS §7.1 纪律 2）
// ─────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  const REC_OK = '# X-0001 标题\n\n- 状态：已完成\n- 执行者：`arch`\n\n## 改动清单\n- 改 `docs/ROADMAP.md`\n\n## 验证证据\n```\nnode x\n→ 通过\n```\n\n## 审核\n- 结论：通过\n';
  const cases = [
    // C1 必备节
    ['C1', '齐备样本 → 五节全在', (() => { const p = sectionPresence(REC_OK); return p.status && p.author && p.changes && p.evidence && p.review; })(), true],
    ['C1', '缺「状态」→ 必判缺', sectionPresence('# 标题\n- 执行者：a\n## 改动清单\n## 验证证据\n## 审核').status === false, true],
    ['C1', '缺「执行者」→ 必判缺', sectionPresence('# 标题\n- 状态：已完成\n## 改动清单\n## 验证证据\n## 审核').author === false, true],
    ['C1', '「门禁与自检」也算验证证据节', sectionPresence('# t\n状态：x\n执行者：y\n改动清单\n## 门禁与自检\n审核').evidence === true, true],
    ['C1', '缺「审核」→ 必判缺（存量记录的真实形态）', sectionPresence('# t\n状态：x\n执行者：y\n## 改动清单\n## 门禁与自检').review === false, true],
    // C3 二值判据（★ 只看「审核」节 —— 首版扫全文曾误报「引用规则本身」的记录）
    ['C3', '审核节出现「8 分」→ 必判违规', hasScoreLanguage('## 审核\n- 结论：8 分') === true, true],
    ['C3', '审核节出现「满意度」→ 必判违规', hasScoreLanguage('## 审核\n- 满意度 90%') === true, true],
    ['C3', '审核节出现「打分」→ 必判违规', hasScoreLanguage('## 审核\n- 给这次打分') === true, true],
    ['C3', '「通过 / 不通过」→ 不得误判', hasScoreLanguage('## 审核\n- 结论：通过；未通过项：无') === false, true],
    ['C3', '★审核节外的评分字样 → 不得误判（改动清单里提 ADR 而已）', hasScoreLanguage('- 新增 ADR-0008（禁主观评分）\n\n## 改动清单\n- 其他 agent 评分：否决') === false, true],
    ['C3', '审核节内「在讲规则」→ 放行', hasScoreLanguage('## 审核\n- 依 ADR-0008，禁主观评分，只填二值') === false, true],
    ['C3', '★ 审核节内「某提案被否决」（讲机制）→ 不得误判', hasScoreLanguage('## 审核\n> 20（其他 agent 评分）**否决**并给出替代品') === false, true],
    ['C3', '无审核节 → 本规则不适用', hasScoreLanguage('# t\n- 结论：8 分') === false, true],
    ['C3', '「2 处待裁项」→ 不得误判为评分', hasScoreLanguage('## 审核\n- 检出 2 处待裁项') === false, true],
    // C4 L3 终审
    ['C4', '改动含 contracts/ → 判为涉契约', touchesContracts('- 修改 `contracts/data-contract.md` §3.2') === true, true],
    ['C4', '未涉契约 → 不判', touchesContracts('- 修改 `docs/GLOSSARY.md`') === false, true],
    ['C4', '涉契约且出现「大人」→ 已声明 L3', declaresL3('L3 审核者：arch + 大人') === true, true],
    ['C4', '涉契约但未出现「大人」→ 未声明', declaresL3('结论：通过') === false, true],
    // C2 双向核对
    ['C2', 'ledger 编号解析（只认 **X-0001** 首列）', [...ledgerEntries('| **X-0001** | a |\n| X-0002 | b |')].join(',') === 'X-0001', true],
    ['C2', 'records 编号解析', [...recordEntries(['X-0001.md', 'X-0002.md', 'notes.md'])].join(',') === 'X-0001,X-0002', true],
    ['C2', '有索引无正文 → 缺账命中', ledgerDiff(new Set(['X-0009']), new Set()).missingBody.join(',') === 'X-0009', true],
    ['C2', '有正文无索引 → 孤儿命中', ledgerDiff(new Set(), new Set(['X-0009'])).orphanBody.join(',') === 'X-0009', true],
    ['C2', '两侧一致 → 双向皆空', (() => { const d = ledgerDiff(new Set(['X-0001']), new Set(['X-0001'])); return d.missingBody.length === 0 && d.orphanBody.length === 0; })(), true],
    // C5 同批记录
    ['C5', '改 server/ 无 T-* 记录 → 缺口', commitNeedsRecord(['server/cmd/main.go'], IMPL_RE[DALU], RECORD_RE[DALU]) === true, true],
    ['C5', '改 data/ 且带 T-* 记录 → 不算缺口', commitNeedsRecord(['data/datas/a.csv', 'records/T-0018.md'], IMPL_RE[DALU], RECORD_RE[DALU]) === false, true],
    ['C5', '只改 docs/ → 不要求记录', commitNeedsRecord(['docs/x.md'], IMPL_RE[DALU], RECORD_RE[DALU]) === false, true],
    ['C5', '只改 records/ → 不要求', commitNeedsRecord(['records/T-0001.md'], IMPL_RE[DALU], RECORD_RE[DALU]) === false, true],
    ['C5', 'guild 改 contracts/ 无 X-* → 缺口', commitNeedsRecord(['contracts/data-contract.md'], IMPL_RE[ROOT], RECORD_RE[ROOT]) === true, true],
    ['C5', 'guild 改 contracts/ 带 X-* → 不算缺口', commitNeedsRecord(['contracts/data-contract.md', 'records/X-0015.md'], IMPL_RE[ROOT], RECORD_RE[ROOT]) === false, true],
    ['C5', 'guild 只改 docs/ → 不要求记录（文档动作另有门禁）', commitNeedsRecord(['docs/GLOSSARY.md'], IMPL_RE[ROOT], RECORD_RE[ROOT]) === false, true],
    // C6 契约回执（机制⑦ · 来源 X-0016）
    ['C6', '有非空「契约回执」节 → 通过', contractReceiptPresence('# t\n\n## 契约回执（下游 → 上游）\n- 本次消费：`data-contract.md` §3.1 / §3.2\n- 读不通：无') === true, true],
    ['C6', '该节为空 → 不通过', contractReceiptPresence('# t\n\n## 契约回执\n\n## 改动清单\n- x') === false, true],
    ['C6', '无该节 → 不通过', contractReceiptPresence('# t\n\n## 改动清单\n- x') === false, true],
    ['C6', '只写「无」也算非空（要的是显式表态）', contractReceiptPresence('# t\n## 契约回执\n- 无') === true, true],
    ['C6', '★ 正文提到「契约回执」但无该节 → 不通过', contractReceiptPresence('# t\n- 按契约回执机制办\n\n## 改动清单\n- x') === false, true],
    // C4 v2 触发级别（机制⑥ 落地载体 · 来源 X-0016）
    ['C4', '「触发级别：**L3 终审**」→ 级别 3', declaredLevel('## 审核\n- 触发级别：**L3 终审**\n- 结论：通过') === 3, true],
    ['C4', '「L1 消费者审」→ 级别 1', declaredLevel('## 审核\n- 触发级别：L1 消费者审\n- 结论：通过') === 1, true],
    ['C4', '审核节未声明级别 → null', declaredLevel('## 审核\n- 结论：通过\n- 未通过项：无') === null, true],
    ['C4', '无审核节 → null（缺节由 C1 报）', declaredLevel('# t\n- 结论：通过') === null, true],
    ['C4', '改契约 + L3 → 匹配', levelMatches(3, true) === true, true],
    ['C4', '改契约 + L1 → **不匹配**', levelMatches(1, true) === false, true],
    ['C4', '未改契约 + L1 → 匹配', levelMatches(1, false) === true, true],
    ['C4', '未声明级别 → 一律不匹配', levelMatches(null, false) === false, true],
    // 审核节识别收严（★ 实测误报：大标题含「审核」二字被认成审核节 —— 来源 X-0016）
    ['C4', '★ 大标题含「审核」→ 不得误认作审核节', reviewSection('# X-0016 … ⑥ 审核分级\n\n- 状态：已完成') === null, true],
    ['C4', '「## 九、审核」→ 认作审核节', (reviewSection('# t\n\n## 九、审核\n- 触发级别：L3 终审') || '').includes('L3'), true],
    ['C4', '「## 审核结论」→ 认作审核节', (reviewSection('# t\n\n## 审核结论\n- 通过') || '').includes('通过'), true],
    ['C4', '「## 审核分级」→ 认作审核节（主体以「审核」开头）', reviewSection('# t\n## 审核分级\n- 触发级别：L2 会审') !== null, true],
    // 契约回执节识别收严（同上 · 来源 X-0016）
    ['C6', '★ 标题只是提到「契约回执」→ 不得误认', contractReceiptPresence('# t\n\n### 2. 契约回执机制说明\n- x') === false, true],
    ['C6', '「## 契约回执（下游 → 上游）」→ 认作该节', contractReceiptPresence('# t\n\n## 契约回执（下游 → 上游）\n- 无') === true, true],
    // WAIVED 豁免花名册（来源 X-0016 · 补 X-0015 §六「书面豁免」无实现位之缺）
    ['C5', '豁免名单命中 → 返回理由', waivedReason({ e1ff46e: '骨架期前置 · 大人 2026-09-30' }, 'e1ff46e') === '骨架期前置 · 大人 2026-09-30', true],
    ['C5', '未命中 → null', waivedReason({}, 'e1ff46e') === null, true],
    ['C5', '命中但空理由 → 显式标为违规', /无理由/.test(waivedReason({ x: '' }, 'x')), true],
    // PEND 待实现规则登记位（机制③ · 来源 X-0016）
    ['PEND', '空名单 → 不告警（不打破现状）', pendingNotice([]) === null, true],
    ['PEND', '非空 → 生成提示（含来源）', pendingNotice([{ id: 'C7', from: 'X-0000' }]) === 'C7(from X-0000)', true],
    ['PEND', '缺 from → 显式标记（不许静默）', /⚠缺来源/.test(pendingNotice([{ id: 'C7' }])), true],
  ];

  const fails = cases.filter(([, , got, want]) => got !== want);
  console.log(c(1, '\n[check-records] 反向测试（--self-test）'));
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

console.log(c(1, '\n[check-records] 记录与台账齐备闸门'));
console.log(c(DIM, `  记录      ${GUILD_RECORDS} ／ ${DALU}/records`));
console.log(c(DIM, `  门禁纪元  guild=${GATE_EPOCH[ROOT]}  dalu=${GATE_EPOCH[DALU]}`));
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
