#!/usr/bin/env node
'use strict';

/**
 * check-docs-index.js —— `docs/` 索引覆盖率（黑户 / 幽灵 / 覆盖自证）（来源 `X-0037` · 2026-10-13）
 *
 * ── 为什么有这条 ────────────────────────────────────────────
 *   ★ 本仓 `AGENTS.md` **§8 文档地图**是文字约束（"什么住哪里 · 叫什么"），
 *     但 ★ **文字约束没有载体** —— ★ 而本仓自己的历史已经证明过它会长歪：
 *     2026-10-13 开工时核出 **§1 方向感表两处失真**（指向不存在的 `tasks/`/`records/`、
 *     把派生视图的真源写成 `records/`）—— ★ **没有人会发现**，直到有人手动核对。
 *   ⇒ ★ 本仓文化：**同一个规则在文档里写了三遍还不被执行，它就该做成门禁**。
 *   ⇒ 本条**第一次就带门禁**（与下游 `qiuyuan-dalu` 的 **T9** 同构；那边先立）。
 *
 * ── 判据 ───────────────────────────────────────────────────
 *   E1 **黑户**：`docs/` 顶层每份 `.md` **必须**被 `README.md` 点名
 *     （点名形如 `docs/XXX.md` 的链接）⇒ 没点名 ⇒ 红。
 *   E2 **幽灵**：`README.md` 点名了 `docs/XXX.md` 而**文件不存在** ⇒ 红。
 *     ★ **豁免**：该行含 `⏭`（显式标"计划中/待建"）—— ★ 那是**诚实的预留，不是漂移**。
 *   E3 **覆盖自证**：扫到 0 份文档 ⇒ 红（★ 本仓最忌「空集真空通过」）。
 *
 * ── 边界（★ 别扩）─────────────────────────────────────────
 *   ★ 只判 **`docs/` 顶层** —— ★ 子目录（若将来有）不逐个点名（同 dalu T9 的口径）。
 *   ★ **不判** `registry/` / `reviews/` —— ★ 它们的索引载体是**别的视图**
 *     （`registry/agent-log.md` 由 `gen-agent-log.js` 校验 · `reviews/INDEX.md` 由 `gen-review-index.js` 校验）。
 *
 * 用法：
 *   node scripts/check-docs-index.js              # 常规
 *   node scripts/check-docs-index.js --self-test  # 反向测试
 * 退出码：0 PASS ／ 1 FAIL
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const INDEX = path.join(ROOT, 'README.md');

// ─────────────────────────────────────────────────────────────
// 待实现规则登记位 —— 机制③（来源 X-0016）
// ─────────────────────────────────────────────────────────────
const PENDING_RULES = [
    {
        id: 'E4', from: 'X-0037', due: '条件触发：`docs/` 出现子目录时',
        desc: '把 docs/ 子目录也纳入点名',
        status: 'wontfix',
        why: '`docs/` 当前**无子目录** ⇒ 扩域即「空集真空通过」；判据边界仍按 E1~E3 只判顶层。`X-0054` G-2 裁决：不做也要留条目（★ 不许再注释掉）。',
    },
];

/** ★ `wontfix` 与「待做」必须分开：前者**不该**让 `--strict` 长红（否则就是永久误报）。 */
function splitPending(list) {
    const ok = Array.isArray(list) ? list : [];
    return {
        todo: ok.filter(r => r.status !== 'wontfix'),
        wontfix: ok.filter(r => r.status === 'wontfix'),
    };
}

function pendingNotice(list) {
    const { todo } = splitPending(list);
    if (todo.length === 0) return null;
    return todo.map(r => `${r.id || '?'}(from ${r.from || '⚠缺来源'}${r.due ? ', due ' + r.due : ''})`).join(' / ');
}

/** 纯函数：wontfix 的可见输出（★ 不做也要能被看见，且写清为什么不做） */
function wontfixNotice(list) {
    const { wontfix } = splitPending(list);
    if (wontfix.length === 0) return null;
    return wontfix.map(r => `${r.id}(from ${r.from})「${r.desc}」— ${r.why || '⚠缺理由'}`).join(' / ');
}

// ─────────────────────────────────────────────────────────────
// 纯函数区（便于 --self-test 喂合成样本）
// ─────────────────────────────────────────────────────────────

/** 纯函数：索引文档里点名了哪些 `docs/XXX.md`（★ 返回 name → 所在行，便于判豁免） */
function extractListed(text) {
    const out = new Map();
    for (const line of String(text).split(/\r?\n/)) {
        const re = /docs\/([A-Z][A-Z0-9-]*\.md)/g;
        let m;
        while ((m = re.exec(line)) !== null) {
            if (!out.has(m[1])) out.set(m[1], line);
        }
    }
    return out;
}

/** 纯函数：黑户 / 幽灵（`⏭` 行豁免） */
function diffIndex(have, listed) {
    const orphans = have.filter(n => !listed.has(n));
    const ghosts = [];
    for (const [name, line] of listed) {
        if (have.includes(name)) continue;
        if (/⏭/.test(line)) continue;          // ★ 显式标"计划中" ⇒ 豁免，不是漂移
        ghosts.push(name);
    }
    return { orphans, ghosts };
}

// ─────────────────────────────────────────────────────────────

function main() {
    const errs = [], warns = [];
    const err = (id, msg) => errs.push({ id, msg });

    const pn = pendingNotice(PENDING_RULES);
    if (pn) warns.push(`★ 已承诺未实现的规则（本脚本尚未覆盖）：${pn}`);
    const wf = wontfixNotice(PENDING_RULES);

    if (!fs.existsSync(DOCS)) { err('E1', '`docs/` 不存在'); }
    if (!fs.existsSync(INDEX)) { err('E1', '`README.md` 不存在 —— 它是本条的被检索引'); }

    if (fs.existsSync(DOCS) && fs.existsSync(INDEX)) {
        const have = fs.readdirSync(DOCS).filter(f => /\.md$/.test(f)).sort();
        // ── E3 覆盖自证 ──
        if (have.length === 0) err('E3', '扫到 0 份 `docs/` 顶层 .md —— ★ 判据失效，不许空集通过');

        const listed = extractListed(fs.readFileSync(INDEX, 'utf8'));
        const d = diffIndex(have, listed);

        console.log('  [check-docs-index] docs/ 顶层索引覆盖率');
        console.log(`  docs/ 顶层 ${have.length} 份 · README 点名 ${listed.size} 个`);

        for (const n of d.orphans) {
            err('E1', `**黑户**：\`docs/${n}\` 存在，但 \`README.md\` **没点名** —— ★ 没被索引的文档 = 没人找得到`);
        }
        for (const n of d.ghosts) {
            err('E2', `**幽灵**：\`README.md\` 点名了 \`docs/${n}\`，但**文件不存在** —— ★ 删了文档忘了销索引（若是有意预留，在该行标 \`⏭\`）`);
        }
        if (!errs.length) console.log(`  ✓ 覆盖 ${have.length}/${have.length}（100%），无幽灵`);
    }

    if (wf) console.log('  ○ WONTFIX  ' + wf);
    warns.forEach(w => console.log('  ⚠ ' + w));
    if (errs.length) {
        console.log('');
        errs.forEach(e => console.log(`  ✗ ${e.id}  ${e.msg}`));
        console.log('  RESULT: FAIL（' + errs.length + ' 项）');
        console.log('  → 修：把缺的补进 `README.md` 的「核心文档」节（★ 那是本仓的 docs 索引）');
        process.exit(1);
    }
    console.log('  RESULT: PASS');
    process.exit(0);
}

// ─────────────────────────────────────────────────────────────
// --self-test · 反向测试（★ 没失败过的判据 = 未被验证过的判据）
// ─────────────────────────────────────────────────────────────

function selfTest() {
    const cases = [];
    const t = (id, name, got, want) => cases.push({ id, name, ok: got === want, got, want });

    // ── 索引提取 ──
    const L = extractListed('- [`docs/ROADMAP.md`](docs/ROADMAP.md) — 路线图\n- 见 docs/CONVENTIONS.md\n'
        + '- [`docs/GHOST.md`](docs/GHOST.md) ⏭ 计划中');
    t('E', '链接式点名认得', L.has('ROADMAP.md'), true);
    t('E', '★ 裸路径点名也认得（`见 docs/CONVENTIONS.md`）', L.has('CONVENTIONS.md'), true);
    t('E', '★ 小写/非大写名**不误收**（本仓文档约定全大写）', extractListed('docs/lower.md').size, 0);

    // ── E1 黑户 ──
    t('E1', '★ 有文档没被点名 → **必红**（orphans）',
        diffIndex(['ROADMAP.md', 'SKILL-ROUTING.md'], new Map([['ROADMAP.md', 'x']])).orphans.length, 1);
    t('E1', '全被点名 → 不得误报',
        diffIndex(['ROADMAP.md'], new Map([['ROADMAP.md', 'x']])).orphans.length, 0);

    // ── E2 幽灵 ──
    t('E2', '★ 点名了但文件不存在 → **必红**',
        diffIndex([], new Map([['GHOST.md', '- [`docs/GHOST.md`](docs/GHOST.md)']])).ghosts.length, 1);
    t('E2', '★★ 但该行标了 `⏭`（计划中）→ **豁免**（诚实的预留 ≠ 漂移）',
        diffIndex([], new Map([['GHOST.md', '- [`docs/GHOST.md`](docs/GHOST.md) ⏭ 计划中']])).ghosts.length, 0);
    t('E2', '文件在 → 不得误报',
        diffIndex(['ROADMAP.md'], new Map([['ROADMAP.md', 'x']])).ghosts.length, 0);

    // ── E3 覆盖自证 ──
    t('E3', '★ 扫到 0 份 → 调用方须 err（判据失效）', diffIndex([], new Map()).orphans.length, 0);

    // ── 机制③ · wontfix（X-0054 G-2：不许用注释让规则消失）──
    const P = [{ id: 'E4', from: 'X-1', desc: 'd', why: 'w', status: 'wontfix' }, { id: 'E5', from: 'X-2', desc: 'd2', due: 'M9' }];
    t('机制③', '★ wontfix 不进「待做」（否则 --strict 永久红）', pendingNotice(P), 'E5(from X-2, due M9)');
    t('机制③', '★ wontfix 仍要可见（带理由）', /E4.*why|E4.*w/.test(wontfixNotice(P) || ''), true);
    t('机制③', '无 wontfix → 不打印', wontfixNotice([{ id: 'E5', from: 'X-2' }]), null);

    const failed = cases.filter(x => !x.ok);
    console.log('  [check-docs-index] 反向测试（--self-test）');
    console.log('  纪律：没失败过的判据 = 未被验证过的判据\n');
    cases.forEach(x => console.log('  ' + (x.ok ? '✓' : '✗') + ' ' + x.id + '  ' + x.name
        + (x.ok ? '' : '   → 实际 ' + JSON.stringify(x.got) + ' · 期望 ' + JSON.stringify(x.want))));
    console.log('\n  结果：' + (failed.length ? '不通过（' + failed.length + ' / ' + cases.length + ' 失败）'
        : '通过（' + cases.length + ' / ' + cases.length + ' 用例）'));
    process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();
else main();
