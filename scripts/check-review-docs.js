#!/usr/bin/env node
'use strict';

/**
 * check-review-docs.js —— 审阅源材料的**存放纪律**（来源 `ADR-0038` · `REVIEW-PROCESS.md` v2.0 §9.4）
 *
 * 职责：管 `reviews/work/` 与 `reviews/ext/` 两处的**形状**与**不可改**。
 *   ① 一个 agent 一个文件夹，报告平铺在内 —— 不再按「来源 × 对象」建目录；
 *   ② 每份报告必须自报来源；H1 不得占 `X-` 编号（那是判定正本的位）；
 *   ③ **已发布的报告只读** —— 任何人（含作者）不得改写 / 删除 / 改名；
 *      确需补正 ⇒ 另写一份新报告，并在新报告头部指向被补正者。
 *
 * ── 为什么需要它（大人 2026-10-27 原话）────────────────────────
 *   「不要新建那么多文件夹，放一个文件夹的文档内」
 *   「不用允许动别人的审查文档」
 *   ★ 前一句是**布局**：2026-10-27 四路并行一次长出 22 个 `<来源>-<对象>/` 目录；
 *   ★ 后一句是**归属**：报告一旦落盘就是证据，被后人改写会让「当时看到什么」失传。
 *   ⇒ 两条都要有门禁，否则只是写在文档里的愿望（`REVIEW-PROCESS.md` §0）。
 *
 * ── 判据边界 ───────────────────────────────────────────────────
 *   · 只判**形状、命名、自报、是否被改**；**不判报告内容对不对**（那是审阅本身）。
 *   · 一次性搬迁登记在 `MOVED`：旧的 `<来源>-<对象>/` 目录并入 `<来源>/` 是**大人授权**的动作，
 *     逐条留证；★ 新增条目必须同时有 `reviews/X-*.md` 记录，不得拿它当「随手改名」的后门。
 *
 * 用法：
 *   node scripts/check-review-docs.js             # 常规
 *   node scripts/check-review-docs.js --strict    # 警告也视为失败
 *   node scripts/check-review-docs.js --self-test # 反向测试
 *
 * 退出码：0 = 通过 / 1 = 失败
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REVIEWS = path.join(ROOT, 'reviews');
const TIERS = ['work', 'ext'];
const STRICT = process.argv.includes('--strict');

const errors = [];
const warns = [];
const passes = [];
const err = (r, m) => errors.push({ rule: r, msg: m });
const warn = (r, m) => warns.push({ rule: r, msg: m });
const ok = (r, m) => passes.push({ rule: r, msg: m });

/** 待实现规则登记位（CONVENTIONS §7.1 纪律 7 · 机制③） */
const PENDING_RULES = [];

/**
 * 一次性搬迁登记（`ADR-0038` · 2026-10-27 大人「你来移动」）。
 * ★ 键 = 首次入库路径，值 = 现行路径。★ 只用于**已入 Git 的报告**的合并搬迁；
 *   未入 Git 的产物直接移动即可，不必登记。
 */
const MOVED = {
  'reviews/work/mimo-qiuyuan-dalu/PROJECT-REVIEW-MiMoDesktop-MiMo-2026-10-01.md':
    'reviews/work/mimo/PROJECT-REVIEW-MiMoDesktop-MiMo-2026-10-01-qiuyuan-dalu.md',
  'reviews/work/mimo-all-repos/PROJECT-REVIEW-MiMoDesktop-MiMo-2026-10-19.md':
    'reviews/work/mimo/PROJECT-REVIEW-MiMoDesktop-MiMo-2026-10-19-all-repos.md',
  'reviews/work/traecode-all-repos/PROJECT-REVIEW-TraeCode-DeepSeek-V4.1-Flash-2026-10-19.md':
    'reviews/work/traecode/PROJECT-REVIEW-TraeCode-DeepSeek-V4.1-Flash-2026-10-19-all-repos.md',
  'reviews/work/workbuddy-all-repos/PROJECT-REVIEW-WorkBuddy-DeepSeek-V4.1-Flash-2026-10-19.md':
    'reviews/work/workbuddy/PROJECT-REVIEW-WorkBuddy-DeepSeek-V4.1-Flash-2026-10-19-all-repos.md',
};

// ─────────────────────────────────────────────────────────────
// 纯函数区（便于 --self-test）
// ─────────────────────────────────────────────────────────────

/** 纯函数：agent 文件夹名 —— 小写-kebab ASCII。 */
function agentNameOk(name) {
  return /^[a-z0-9][a-z0-9-]*$/.test(String(name));
}

/** 纯函数：报告文件名。 */
function reportNameOk(name) {
  return /^PROJECT-REVIEW-.+\.md$/.test(String(name));
}

/** 纯函数：H1 是否占了 `X-` 编号位（那是 `reviews/X-*.md` 正本的名分）。 */
function h1ClaimsX(text) {
  const m = String(text).match(/^#\s+(.+)$/m);
  return Boolean(m) && /^X-\d{4}\b/.test(m[1].trim());
}

/** 纯函数：头部是否自报来源（允许 `- **来源**：`）。 */
function hasSourceField(text) {
  return String(text).split(/\r?\n/).slice(0, 25).some((l) => /^-\s*\**来源\**\s*[：:]/.test(l));
}

/** 纯函数：搬迁表解析 —— 目标必须存在。
 * @returns {{ok:boolean, why?:string}}
 */
function movedEntryOk(moved, oldPath, exists) {
  const target = moved[oldPath];
  if (!target) return { ok: false, why: '既不在 HEAD，也不在 MOVED 搬迁表 —— 报告被删或被改名' };
  if (!exists(target)) return { ok: false, why: `MOVED 指向的 ${target} 不存在` };
  return { ok: true };
}

/** 纯函数：某分区根下的条目是否合规（只许 agent 文件夹；`.gitkeep` 放行）。 */
function tierRootViolations(entries) {
  const out = [];
  for (const e of entries) {
    if (e.name === '.gitkeep') continue;
    if (!e.isDirectory()) { out.push(`${e.name}（文件直接躺在分区根下）`); continue; }
    if (!agentNameOk(e.name)) out.push(`${e.name}（文件夹名须小写-kebab）`);
  }
  return out;
}

function git(args, { allowFail = false } = {}) {
  try {
    // ★ 末尾两个 'pipe'：默认 stderr 会继承到终端，探测型调用（cat-file -e）会把
    //   「fatal: path ... does not exist」直接打到读者眼前 —— 那不是错误，是本规则的正常分支。
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    if (allowFail) return null;
    throw e;
  }
}

function gitOk() {
  return git(['rev-parse', '--is-inside-work-tree'], { allowFail: true }) === 'true';
}

function listDir(p) {
  try { return fs.readdirSync(p, { withFileTypes: true }); } catch { return null; }
}

// ─────────────────────────────────────────────────────────────
// V1 · 布局：一个 agent 一个文件夹、报告平铺、不再往下分层
// ─────────────────────────────────────────────────────────────
(function v1() {
  let tierCount = 0;
  for (const tier of TIERS) {
    const dir = path.join(REVIEWS, tier);
    const entries = listDir(dir);
    if (entries === null) { warn('V1', `reviews/${tier}/ 不存在 → 跳过（NOT a pass）`); continue; }
    tierCount++;

    for (const v of tierRootViolations(entries)) {
      err('V1', `reviews/${tier}/ 布局违规：${v} —— 一个 agent 一个文件夹，报告放进文件夹里`);
    }

    for (const e of entries) {
      if (!e.isDirectory() || e.name === '.gitkeep') continue;
      const inner = listDir(path.join(dir, e.name)) || [];
      const subdirs = inner.filter((x) => x.isDirectory()).map((x) => x.name);
      if (subdirs.length) {
        err('V1', `reviews/${tier}/${e.name}/ 下仍有子目录（${subdirs.join(' / ')}）—— 报告必须平铺在 agent 文件夹里`);
      }
    }
    if (tierRootViolations(entries).length === 0) {
      ok('V1', `reviews/${tier}/ 布局合规（${entries.filter((e) => e.isDirectory()).length} 个 agent 文件夹 · 无嵌套）`);
    }
  }
  if (tierCount === 0) err('V1', '`reviews/work/` 与 `reviews/ext/` 都不存在 —— 禁止空集真空通过');
})();

// ─────────────────────────────────────────────────────────────
// V2 · 报告本身：至少一份、命名、H1 不占 X-、头部自报来源
// ─────────────────────────────────────────────────────────────
(function v2() {
  let mdCount = 0;
  for (const tier of TIERS) {
    const dir = path.join(REVIEWS, tier);
    for (const e of listDir(dir) || []) {
      if (!e.isDirectory() || e.name === '.gitkeep') continue;
      const inner = listDir(path.join(dir, e.name)) || [];
      const mds = inner.filter((x) => x.isFile() && x.name.endsWith('.md'));
      if (mds.length === 0) {
        err('V2', `reviews/${tier}/${e.name}/ 没有任何报告 —— 不留空壳`);
        continue;
      }
      for (const m of mds) {
        mdCount++;
        const rel = `reviews/${tier}/${e.name}/${m.name}`;
        if (!reportNameOk(m.name)) {
          err('V2', `${rel} 命名不合规 —— 须为 \`PROJECT-REVIEW-<agent名>-<模型名>-<YYYY-MM-DD>[-<对象>].md\``);
        }
        let text = '';
        try { text = fs.readFileSync(path.join(REVIEWS, tier, e.name, m.name), 'utf8'); } catch { /* 由下一行报 */ }
        if (h1ClaimsX(text)) {
          err('V2', `${rel} 的 H1 占了 \`X-\` 编号位 —— \`X-*\` 只属 \`reviews/X-*.md\` 判定正本`);
        }
        if (!hasSourceField(text)) {
          warn('V2', `${rel} 头部未见「来源」自报（存量可接受；新报告必填）`);
        }
      }
    }
  }
  if (mdCount === 0) err('V2', '两个分区里没有任何 `PROJECT-REVIEW-*.md` —— 禁止空集真空通过');
  else ok('V2', `${mdCount} 份报告：命名与 H1 合规`);
})();

// ─────────────────────────────────────────────────────────────
// V3 · 只读：已入 Git 的报告不得改写 / 删除 / 改名
// ─────────────────────────────────────────────────────────────
(function v3() {
  if (!gitOk()) { warn('V3', '不在 Git 工作区（或 git 不可用）→ 跳过（NOT a pass）'); return; }

  const added = git(['log', '--all', '--diff-filter=A', '--pretty=format:', '--name-only', '--',
    'reviews/work', 'reviews/ext'], { allowFail: true });
  if (added === null) { warn('V3', '读不到 Git 历史 → 跳过（NOT a pass）'); return; }

  const paths = [...new Set(String(added).split(/\r?\n/).map((s) => s.trim())
    .filter((p) => /^reviews\/(?:work|ext)\/.+\.md$/.test(p)))];
  if (paths.length === 0) { warn('V3', 'Git 历史里没有任何源材料 → 无可核对（NOT a pass）'); return; }

  const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
  let checked = 0;
  let moved = 0;
  for (const p of paths) {
    // 成功时 `cat-file -e` 无输出（`''`），失败时 `allowFail` 给 `null`
    const inHead = git(['cat-file', '-e', `HEAD:${p}`], { allowFail: true }) !== null;

    if (!inHead) {
      const r = movedEntryOk(MOVED, p, exists);
      if (!r.ok) err('V3', `${p}：${r.why} —— 已发布的报告只能新增，不能改 / 删 / 改名（补正请另写新报告）`);
      else moved++;
      continue;
    }

    checked++;
    const first = (git(['log', '--diff-filter=A', '--format=%H', '-1', '--', p], { allowFail: true }) || '').split(/\r?\n/)[0];
    if (!first) { warn('V3', `${p}：找不到首次入库提交 → 跳过`); continue; }
    const atFirst = git(['rev-parse', `${first}:${p}`], { allowFail: true });
    const atHead = git(['rev-parse', `HEAD:${p}`], { allowFail: true });
    if (atFirst === null || atHead === null) { warn('V3', `${p}：取不到 blob → 跳过`); continue; }
    if (atFirst !== atHead) {
      err('V3', `${p}：已被改写（首次入库 ≠ 现在）—— 已发布的报告只读；补正请另写新报告并指向它`);
    }
  }
  ok('V3', `已发布报告只读核对（${checked} 份未改 · ${moved} 份按 MOVED 表合并搬迁）`);
})();

// ─────────────────────────────────────────────────────────────
// 反向测试
// ─────────────────────────────────────────────────────────────
function selfTest() {
  const cases = [];
  const eq = (name, got, want) => cases.push([name, got === want, `得 ${JSON.stringify(got)} / 期 ${JSON.stringify(want)}`]);

  eq('布局 · 合法 agent 文件夹', tierRootViolations([{ name: 'qoderdesktop', isDirectory: () => true }]).length, 0);
  eq('布局 · 分区根下的散文件被拦', tierRootViolations([{ name: 'X-0066.md', isDirectory: () => false }]).length, 1);
  eq('布局 · .gitkeep 放行', tierRootViolations([{ name: '.gitkeep', isDirectory: () => false }]).length, 0);
  eq('布局 · 大写文件夹名被拦', tierRootViolations([{ name: 'QoderDesktop', isDirectory: () => true }]).length, 1);

  eq('命名 · 合规报告', reportNameOk('PROJECT-REVIEW-Foo-Bar-2026-10-27-qiyuan-dalu.md'), true);
  eq('命名 · 缺前缀被拦', reportNameOk('review.md'), false);
  eq('H1 · 占 X- 被拦', h1ClaimsX('# X-0053 某报告\n'), true);
  eq('H1 · 不占 X- 放行', h1ClaimsX('# 某对象复审报告\n'), false);

  eq('自报 · 普通写法', hasSourceField('# t\n- 来源：某 agent\n'), true);
  eq('自报 · 加粗写法', hasSourceField('# t\n- **来源**：某 agent\n'), true);
  eq('自报 · 缺失被拦', hasSourceField('# t\n- 审查时间：昨天\n'), false);

  const exists = (p) => p === 'reviews/work/a/new.md';
  eq('搬迁 · 表内有目标', movedEntryOk({ 'old.md': 'reviews/work/a/new.md' }, 'old.md', exists).ok, true);
  eq('搬迁 · 表外删除被拦', movedEntryOk({}, 'old.md', exists).ok, false);
  eq('搬迁 · 目标不存在被拦', movedEntryOk({ 'old.md': 'reviews/work/a/new.md' }, 'old.md', () => false).ok, false);

  let bad = 0;
  console.log('[check-review-docs] 反向测试（--self-test）');
  console.log('─'.repeat(60));
  for (const [name, pass, detail] of cases) {
    console.log(`  ${pass ? '✔' : '✘'} ${name.padEnd(30)} ${detail}`);
    if (!pass) bad++;
  }
  console.log('─'.repeat(60));
  console.log(bad ? `  结果：不通过（${bad} 项不成立）` : '  结果：通过');
  process.exit(bad ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();

// ─────────────────────────────────────────────────────────────
// 输出
// ─────────────────────────────────────────────────────────────
console.log('[check-review-docs] 审阅源材料存放纪律（V1 布局 / V2 命名与自报 / V3 已发布只读）');
console.log('─'.repeat(60));
for (const p of passes) console.log(`  ✓ ${p.rule} ${p.msg}`);
for (const w of warns) console.log(`  ⚠ ${w.rule} ${w.msg}`);
for (const e of errors) console.log(`  ✗ ${e.rule} ${e.msg}`);
console.log('─'.repeat(60));
if (PENDING_RULES.length) console.log(`  待实现：${PENDING_RULES.map((r) => r.id).join(' / ')}`);
const failed = errors.length > 0 || (STRICT && warns.length > 0);
console.log(`  结果：${failed ? '不通过' : '通过'}（${passes.length} 项通过 / ${warns.length} 警告 / ${errors.length} 错误）`);
process.exit(failed ? 1 : 0);
