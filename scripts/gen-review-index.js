#!/usr/bin/env node
/**
 * gen-review-index.js —— 由 `reviews/` **派生** `reviews/INDEX.md`（总索引视图）。
 *
 * ── 为什么是生成器而不是手工维护（本项目纪律）────────────────────
 * `reviews/INDEX.md` 是**视图**，不是第二真源。
 * 「同一事实写两处 = 迟早不一致」（`CONVENTIONS.md` §9）——
 * 所以它**由 `reviews/` 目录内容派生**，可随时重生成、**不得手工编辑**。
 * （与 `gen-agent-log.js` 同构：视图可丢，正文不可丢；重建视图 = 重跑生成器。）
 *
 * ── 真源 ────────────────────────────────────────────────────────
 * · 审阅记录正文（**判定正本**）：`reviews/X-*.md`（每篇的 H1 标题 + 头部「状态」行）
 * · 内部源材料：  `reviews/work/<名>/`（目录即一篇）—— ★ `ADR-0032` 第三档（2026-10-19）
 * · 外部源材料：  `reviews/ext/<名>/`（目录即一篇）
 *
 * ★ 注意：本文件注释里**不能出现** `*` 紧跟 `/` 的写法（哪怕是举例路径）——
 *   它会**提前闭合块注释**，把后面的行当代码解析（本文件第一版就这么炸的）。
 *
 * ── 用法 ────────────────────────────────────────────────────────
 *   node scripts/gen-review-index.js          # 检查（与仓库内文件是否一致）
 *   node scripts/gen-review-index.js --write  # 重生成
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REVIEWS = path.join(ROOT, 'reviews');
const INDEX = path.join(REVIEWS, 'INDEX.md');

/**
 * 待实现规则登记位（CONVENTIONS §7.1 纪律 7 · 机制③）。
 * ★ 本脚本是**视图生成器**（不判事、无规则 ID）—— 空名单即诚实表态：
 *   D4 要的是「登记位在场」，不是「有货」；缺这一行反而会被判「已承诺未实现无处登记」。
 */
const PENDING_RULES = [];

/** 从正文抽「标题 + 状态」——纯函数，便于 `--self-test` 喂合成样本。 */
function parseReviewText(text) {
  const lines = text.split(/\r?\n/);

  let title = '';
  for (const l of lines) {
    const m = /^#\s+(.+)$/.exec(l);
    if (m) { title = m[1].trim(); break; }
  }

  // 「- 状态：**已完成**（…）」/「- 状态：**进行中**（…）」
  let status = '—';
  for (const l of lines.slice(0, 20)) {
    const m = /^-\s*\*{0,2}状态\*{0,2}\s*[:：]\s*(.+)$/.exec(l);
    if (m) {
      // 去掉 markdown 强调符，只留文字；过长的括号说明截断
      status = m[1].replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
      if (status.length > 40) status = status.slice(0, 40) + '…';
      break;
    }
  }
  return { title, status };
}

function parseReview(file) {
  // ★ 重构时漏掉的坑：`parseReviewText` 只回「标题+状态」，**id 由文件名派生** ——
  //   少拼这一句，生成的表格会整列变 `undefined`（而且 `--check` 会报「不一致」，倒不至于静默）。
  return { id: file.replace(/\.md$/, ''), ...parseReviewText(fs.readFileSync(path.join(REVIEWS, file), 'utf8')) };
}

/** 反向测试（本项目纪律：每个脚本都要有 `--self-test`；新增判据**必带反向用例**）。 */
function selfTest() {
  const cases = [];
  const eq = (name, got, want) => cases.push([name, got === want, `得 ${JSON.stringify(got)} / 期 ${JSON.stringify(want)}`]);

  // ① 正向：标题 + 状态都取到
  const full = '# X-9999 样例审阅\n\n- 状态：**已完成**（判定：通过）\n- 覆盖模块：x\n';
  const r1 = parseReviewText(full);
  eq('正向 · 取到 H1 标题', r1.title, 'X-9999 样例审阅');
  eq('正向 · 状态去强调符', r1.status, '已完成（判定：通过）');

  // ② ★ 反向：**没有状态行** ⇒ 必须是 `—`（**不编造**）—— 本项目的「不填 0 冒充」同族
  const noStatus = '# X-9998 无状态\n\n- 覆盖模块：y\n';
  eq('反向 · 缺状态行 ⇒ —（不编）', parseReviewText(noStatus).status, '—');

  // ③ 反向：**没有 H1** ⇒ 标题为空串（不拿正文当标题）
  eq('反向 · 缺 H1 ⇒ 空标题', parseReviewText('正文而已。\n').title, '');

  // ④ 边界：状态行在前 20 行之外 ⇒ 视为没有（不越界抓）
  const farStatus = '# X-9997\n\n' + '\n'.repeat(25) + '- 状态：**已完成**\n';
  eq('边界 · 状态行超 20 行不算', parseReviewText(farStatus).status, '—');

  // ⑤ ★ 分区列举（`ADR-0032` 第三档 · 扩域判据**必补覆盖用例** · `REVIEW-PROCESS` §6 坑 9）
  const ents = [
    { name: 'b-x', isDirectory: () => true },
    { name: 'a-x', isDirectory: () => true },
    { name: 'README.md', isDirectory: () => false },
  ];
  eq('★ 分区只数目录、不数文件（README 不算一篇报告）', pickDirNames(ents).join(','), 'a-x,b-x');
  eq('★ 空分区 ⇒ 空数组（不编造）', pickDirNames([]).length, 0);

  let bad = 0;
  console.log('[gen-review-index] 反向测试（--self-test）');
  console.log('─'.repeat(60));
  for (const [name, ok, detail] of cases) {
    console.log(`  ${ok ? '✔' : '✘'} ${name.padEnd(28)} ${detail}`);
    if (!ok) bad++;
  }
  console.log('─'.repeat(60));
  console.log(bad ? `  结果：不通过（${bad} 项不成立）` : '  结果：通过');
  process.exit(bad ? 1 : 0);
}

/** 纯函数：从 `readdirSync` 的条目里挑「**子目录**名」并排序（= 一个分区里的一篇）。
 *  ★ 只认目录 —— **文件不算**：分区里的 `README.md` 是**收件说明**，不是一篇报告。
 *  ★ 目录不存在 ⇒ 由调用方给空数组（**不编造**）。
 */
function pickDirNames(entries) {
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

/** 列某分区（`work` / `ext`）下的子目录名；分区不存在 ⇒ 空数组。 */
function listTierDirs(name) {
  const d = path.join(REVIEWS, name);
  return fs.existsSync(d) ? pickDirNames(fs.readdirSync(d, { withFileTypes: true })) : [];
}

function buildMarkdown() {
  const reviews = fs.readdirSync(REVIEWS)
    .filter((f) => /^X-\d{4}\.md$/.test(f))
    .sort()
    .map(parseReview);

  const works = listTierDirs('work');
  const exts = listTierDirs('ext');

  const L = [];
  L.push('# reviews/INDEX.md —— 审阅文档总索引');
  L.push('');
  L.push('> ★ **本文件是视图，不是第二真源** —— 由 `scripts/gen-review-index.js` 生成，**不得手工编辑**。');
  L.push('> 要改内容请改 `reviews/` 下的正文，然后重跑生成器（`node scripts/gen-review-index.js --write`）。');
  L.push('>');
  L.push(`> 真源：审阅记录 \`reviews/X-*.md\`（${reviews.length} 篇） · 内部源材料 \`reviews/work/\`（${works.length} 篇） · 外部源材料 \`reviews/ext/\`（${exts.length} 篇）`);
  L.push('> 一行一事的台账仍在 `registry/cross-repo-ledger.md`（那边管**跨库交付**，这里管**目录视图**）。');
  L.push('');
  L.push('## 一、审阅记录（`reviews/X-*.md`）');
  L.push('');
  L.push('| 编号 | 标题 | 状态 |');
  L.push('|---|---|---|');
  for (const r of reviews) {
    L.push(`| [\`${r.id}\`](${r.id}.md) | ${r.title} | ${r.status} |`);
  }
  L.push('');
  const tiers = [
    { n: '二', key: 'work', label: '内部源材料（本仓派出去的 agent 各一份 · `reviews/work/`）', list: works },
    { n: '三', key: 'ext', label: '外部源材料（非本仓派出 · `reviews/ext/`）', list: exts },
  ];
  for (const t of tiers) {
    L.push(`## ${t.n}、${t.label}`);
    L.push('');
    if (t.list.length === 0) {
      L.push('（暂无）');
    } else {
      L.push('| 目录 | 说明 |');
      L.push('|---|---|');
      for (const e of t.list) {
        // 目录名即「来源-对象」，原样列出；说明读目录里排序第一的 .md（有就写，没有就 —）
        let note = '—';
        const files = fs.readdirSync(path.join(REVIEWS, t.key, e)).filter((f) => f.endsWith('.md'));
        if (files.length) note = files.sort()[0];
        L.push(`| [\`${t.key}/${e}/\`](${t.key}/${e}/) | ${note} |`);
      }
    }
    L.push('');
  }
  return L.join('\n');
}

const generated = buildMarkdown();
const current = fs.existsSync(INDEX) ? fs.readFileSync(INDEX, 'utf8') : null;
const wantWrite = process.argv.includes('--write');

if (process.argv.includes('--self-test')) {
  selfTest();   // 不返回（内部 exit）
}

console.log('[gen-review-index] 审阅文档总索引视图');
console.log('─'.repeat(60));

if (wantWrite) {
  fs.writeFileSync(INDEX, generated, 'utf8');
  const n = (generated.match(/^\| \[`X-/gm) || []).length;
  console.log(`  ✓ 已重生成（${n} 篇审阅记录）`);
  console.log(`  → ${INDEX}`);
  process.exit(0);
}

if (current === null) {
  console.log('  ✗ `reviews/INDEX.md` 不存在 —— 请跑 `--write` 生成');
  process.exit(1);
}
if (current !== generated) {
  console.log('  ✗ 与仓库内文件**不一致** —— 视图已滞后于 `reviews/`（这正是生成器要治的病）');
  console.log('    修法：`node scripts/gen-review-index.js --write`（**不要手工编辑视图**）');
  process.exit(1);
}
console.log('  ✓ 与仓库内文件一致');
console.log('  结果：通过（1 项通过 / 0 警告）');
