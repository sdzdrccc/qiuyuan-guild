#!/usr/bin/env node
'use strict';

/**
 * run-all-checks.js —— 本仓门禁**汇总入口**（来源 `X-0036` §追加「处理盲区问题」· 2026-10-13）
 *
 * ── 为什么需要它（实测出来的盲区 · ★ 以下为 2026-10-13 立此脚本时的历史）──
 *   ★★ 当时本仓有 **8 条 `check-*` 判据**，但**没有任何自动执行机制**：
 *      · **无 CI**、**无 git hook**（`core.hooksPath` 未设）；
 *      · 脚本硬编码本机绝对路径、**零 `process.env` 覆盖点** ⇒ 上 Actions 必然 ENOENT。
 *   ⇒ 后果实测：`check-records.js` 长期报 **35 错**（26 张 dalu 卡缺「契约回执」+ 9 笔无同批记录），
 *     ★ **而它报的红一直没人看见** —— 直到 2026-10-13 人工跑了一次。
 *   ⇒ ★★ **判据：一个只在"有人记得手动跑"时才存在的门禁，等于没有门禁。**
 *
 * ── ★ 现状（2026-10-19 订正 · `X-0054` G-6）─────────────────
 *   · **CI 已有**：`.github/workflows/ci.yml`（`X-0044`）—— 上面那两条「无 CI / 配不了」已过期；
 *   · **覆盖点已有**：`check-data` / `check-identifiers` / `check-asset-ref` / `check-records`
 *     与本脚本共 5 处读 `process.env`（`GBE_ASSETS_REPO` / `QYD_DALU_REPO`）；
 *   · **汇总口径**：本文件跑 **11 条** = 9 条 `check-*` 判据 ＋ 2 条 `gen-*` 视图一致性
 *     （2026-10-27 起加 `check-review-docs.js` —— `ADR-0038`）。
 *     ★ 文档写「N 个脚本」时以本文件的 `STEPS.length` 为准（`D5` 会核）。
 *   · ★ **历史陈述不改写**（上面那段保留原样），只在此追加现状 —— 改历史会让"为什么这么做"失传。
 *
 * ── 定位：它不是第 9 条判据，是**入口** ────────────────────
 *   ★ 命名**故意不叫 `check-*`** —— 那个命名空间由 `check-doc-anchors.js` 的 **D1** 双向核对
 *     （`CONVENTIONS.md` §7.1 清单 ↔ 实际文件）。汇总入口不是判据，不该混进去
 *     （同 `gen-*.js` 的处理）。
 *   ★ 它**不自己判任何东西** —— 只负责**依次跑、汇总、给退出码**。
 *
 * ── 用法 ───────────────────────────────────────────────────
 *   node scripts/run-all-checks.js            # 跑全部；任一红则退出码 1
 *   node scripts/run-all-checks.js --quiet    # 只出汇总（各脚本输出丢弃）
 *   node scripts/run-all-checks.js --self-test
 *   退出码：0 = 全绿 / 1 = 有红
 *
 * ── ★ 与下游仓的关系（重要）────────────────────────────────
 *   其中几个脚本要**只读**下游仓（dalu / gbe-assets）。★ 下游不在场时**不冒充通过**：
 *   · 各脚本自己会 `warn`（"不可读 → 跳过"）—— ★ 那是**跳过**，不是绿；
 *   · 本汇总另加一条：★ **扫描各脚本输出里的"跳过 / 不可读"字样并单列**，
 *     让"没跑到"与"跑过了"在汇总里**看得出差别**。
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const QUIET = process.argv.includes('--quiet');

/**
 * 待实现规则登记位（CONVENTIONS §7.1 纪律 7 · 机制③）。
 * ★ 本脚本是**汇总入口**、不自己判事（见头部「定位」节）⇒ 无待实现规则，空名单即诚实表态。
 */
const PENDING_RULES = [];

/** 依次要跑的脚本（★ `check-*` 在前，`gen-*` 在后 —— 后者是"视图一致性"，通常更快更吵） */
const STEPS = [
    { file: 'check-data.js', label: '契约 ↔ 配置表 + 文档表格 + 第一原则锚点' },
    { file: 'check-contract-gate.js', label: '契约完备性（ROADMAP 声明 ↔ contracts/）' },
    { file: 'check-identifiers.js', label: '跨文档标识符（配置表 / DB 表 / 退役名）' },
    { file: 'check-doc-anchors.js', label: '脚本清单 / 规则 ID / skill 版本 / README 禁抄版本号与易腐事实' },
    { file: 'check-asset-ref.js', label: '资产引用契约 ↔ gbe-assets（只读交叉校验）' },
    { file: 'check-version-pins.js', label: '版本配套表 ↔ 契约版本 ＋ 兄弟仓版本钉（软）' },
    { file: 'check-docs-index.js', label: 'docs/ 顶层索引覆盖率（黑户 / 幽灵）' },
    { file: 'check-records.js', label: '记录与台账齐备（C1~C9）' },
    { file: 'check-review-docs.js', label: '审阅源材料：一 agent 一文件夹 / 命名与自报 / 已发布只读（V1~V3）' },
    { file: 'gen-agent-log.js', label: 'agent-log 视图一致性（默认只校验）' },
    { file: 'gen-review-index.js', label: 'reviews/INDEX 视图一致性（默认只校验）' },
];

/** 抓「跳过 / 不可读」类字样 —— ★ 让"没跑到"在汇总里看得出来 */
const SKIP_PAT = /不可读|跳过|SKIPPED|未执行/;

function runOne(step) {
    const p = path.join(ROOT, 'scripts', step.file);
    if (!fs.existsSync(p)) return { ok: false, out: '', missing: true };
    try {
        const out = execFileSync(process.execPath, [p], { cwd: ROOT, encoding: 'utf8' });
        return { ok: true, out: out };
    } catch (e) {
        return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') };
    }
}

/** 纯函数：从一段输出里挑出"跳过"行（便于自测） */
function skipLines(text) {
    return String(text).split(/\r?\n/).filter(l => SKIP_PAT.test(l)).map(l => l.trim());
}

/** 纯函数：从一段失败输出里挑出失败行。
 *  ★ 不截断 —— `X-0063` 实证：`slice(0,8)` 把 42 条错显示成 8 条，两路会话据此报出 41/42 两个数。
 *    「只显示一部分」在汇总里**没有提示**，读者会当成全部。
 */
function failureLines(text) {
    return String(text).split(/\r?\n/).filter(l => /✗|FAIL|不通过/.test(l)).map(l => l.trim());
}

function selfTest() {
    const cases = [];
    const t = (id, name, got, want) => cases.push({ id, name, ok: got === want, got, want });
    t('S', '含「不可读 … 跳过」的单行 → 按**行**计 1 条（★ 不是按关键词命中数）',
        skipLines('x\ny 不可读（a/b）→ 跳过\nz').length, 1);
    t('S', '含 SKIPPED → 抓得到', skipLines('-- T4 SKIPPED - no editor').length, 1);
    t('S', '★ 正常输出 → 不得误报', skipLines('✓ C2 台账 ↔ 正文 双向核对通过').length, 0);
    t('S', '空输出 → 不得误报', skipLines('').length, 0);
    t('F', '★ 12 条失败 → 全列（不截断；X-0063 实证 42 显示成 8）',
        failureLines(Array.from({ length: 12 }, (_, i) => '✗ 错 ' + i).join('\n')).length, 12);
    const failed = cases.filter(c => !c.ok);
    console.log('  [run-all-checks] 反向测试（--self-test）\n');
    cases.forEach(c => console.log('  ' + (c.ok ? '✓' : '✗') + ' ' + c.id + '  ' + c.name +
        (c.ok ? '' : '   → 实际 ' + JSON.stringify(c.got) + ' · 期望 ' + JSON.stringify(c.want))));
    console.log('\n  结果：' + (failed.length ? '不通过（' + failed.length + ' / ' + cases.length + '）'
        : '通过（' + cases.length + ' / ' + cases.length + ' 用例）'));
    process.exit(failed.length ? 1 : 0);
}

function main() {
    console.log('============================================================');
    console.log(' [guild] run-all-checks —— 本仓 11 个脚本（9 条判据 ＋ 2 条视图一致性）');
    console.log(' root: ' + ROOT);
    console.log('============================================================\n');

    const results = [];
    for (const step of STEPS) {
        const r = runOne(step);
        results.push({ step, r });
        const tag = r.missing ? 'MISSING' : (r.ok ? 'PASS' : 'FAIL');
        console.log('[' + tag + '] ' + step.file + '  —— ' + step.label);
        if (!r.missing && r.ok && !QUIET) {
            r.out.trim().split(/\r?\n/).slice(-4).forEach(l => console.log('    ' + l));
        }
        if (!r.ok && !r.missing) {
            const lines = failureLines(r.out);
            console.log('    ✗ 失败 ' + lines.length + ' 行（全列）：');
            lines.forEach(l => console.log('    ' + l));
        }
        console.log('');
    }

    const failed = results.filter(x => !x.r.ok);
    const skipped = [];
    for (const { step, r } of results) {
        skipLines(r.out).forEach(l => skipped.push(step.file + ' :: ' + l));
    }

    console.log('============================================================');
    console.log(' 通过 ' + (results.length - failed.length) + ' / ' + results.length + ' 个脚本');
    if (failed.length) {
        console.log(' FAILED: ' + failed.map(x => x.step.file).join(', '));
    }
    if (skipped.length) {
        // ★★ 关键：把"跳过"与"通过"分开写 —— 跳过不是绿（本仓最忌「跳过长得像绿灯」）
        console.log('');
        console.log(' ⚠ 其中含「跳过 / 不可读 / 未执行」的行（★ 这些**不是通过**，逐条列出）：');
        skipped.slice(0, 12).forEach(l => console.log('    ' + l));
    }
    console.log('============================================================');
    console.log('  RESULT: ' + (failed.length ? 'some checks FAILED' : 'all checks green'));
    process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();
else main();
