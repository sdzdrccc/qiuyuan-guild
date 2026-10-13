#!/usr/bin/env node
'use strict';

/**
 * check-version-pins.js —— 版本配套表 ↔ 契约版本 一致性（来源 `X-0037` · 2026-10-13）
 *
 * ── 为什么有这条 ────────────────────────────────────────────
 *   ★ 大人 2026-10-13 提了一个真问题：「guild 加版本号合理吗？dalu 加的话，
 *     后续上线跟安装包版本会不会冲突？」
 *   ⇒ ★ 结论（见 `registry/version-pins.md` §三）：**四仓不需要同一套版本机制**，
 *     但需要一个**同一个答案** —— 「我现在拿到的这套东西，互相配不配」。
 *   ⇒ 本仓为此建了 `registry/version-pins.md`（**锚点表**，不是真源）。
 *   ★★ 而**锚点表会腐坏**：契约升版时忘了改它，它就成了一处**比没有更坏的**东西
 *     （有人会拿它做决定）。⇒ ★ 所以配这条门禁。
 *
 * ── 判据 ───────────────────────────────────────────────────
 *   A **契约版本一致**：每份 `contracts/*.md` 头部「状态」行的版本
 *     ↔ `registry/version-pins.md` 里登记的该契约版本 —— ★ 不一致即红。
 *   B **覆盖**：`contracts/` 下**每一份**契约都必须在配套表里有一行
 *     （★ 新加了契约却没登记 ⇒ 红；反方向：表里登记了不存在的契约 ⇒ 红）。
 *   C **覆盖自证**：扫到 0 份契约 ⇒ err（★ 本仓最忌「空集真空通过」）。
 *
 * ── 刻意不做的事（★ 边界，别扩）─────────────────────────────
 *   ★ **不校验** `gbe-studio` / `gbe-assets` / `dalu` 那三行 —— ★ 它们的真源**在别的仓**：
 *     若把它们也纳入，★ 那两仓**发个版就会把本仓门禁弄红** ⇒
 *     ★ 本仓**不是它们的发布守门人**（判据：**别把别人的事变成自己的红**）。
 *     详见 `registry/version-pins.md` §遗留 1。
 *
 * 用法：
 *   node scripts/check-version-pins.js              # 常规
 *   node scripts/check-version-pins.js --self-test  # 反向测试
 * 退出码：0 PASS ／ 1 FAIL
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTRACTS_DIR = path.join(ROOT, 'contracts');
const PINS_FILE = path.join(ROOT, 'registry', 'version-pins.md');

// ─────────────────────────────────────────────────────────────
// 待实现规则登记位 —— 机制③（来源 X-0016）
// ─────────────────────────────────────────────────────────────
/**
 * 本脚本**承诺但尚未实现**的规则。非空时**启动即打印**（warn），`--strict` 时 err。
 * ★ 规则真做了 → **立即移出**本数组（删掉，不是注释掉）。
 */
const PENDING_RULES = [
    // { id: 'P2', from: 'X-0037', desc: '把 gbe-* 与 dalu 三行也纳入比对', due: '另议' },
    //   ★ **当前刻意不做** —— 见文件头「刻意不做的事」：那两仓发版会把本仓门禁弄红，
    //     ★ 本仓不是它们的发布守门人。★ 若将来要做，应先落一条 ADR。
];

/** 纯函数：待实现规则的提示文本（空名单 → `null`，便于自测） */
function pendingNotice(list) {
    if (!Array.isArray(list) || list.length === 0) return null;
    return list
        .map(r => `${r.id || '?'}(from ${r.from || '⚠缺来源'}${r.due ? ', due ' + r.due : ''})`)
        .join(' / ');
}

// ─────────────────────────────────────────────────────────────
// 纯函数区（便于 --self-test 喂合成样本）
// ─────────────────────────────────────────────────────────────

/**
 * 纯函数：从契约正文里抽「状态」行的版本。
 * ★ 容忍**两种写法**（实测本仓两种都有）：
 *   `> … | **状态**：**v0.7**（…）`   ← 版本号加粗
 *   `> … | **状态**：v0.1 首版（Phase 0）` ← 不加粗
 * ★ 只看**前 20 行**（头部声明区）—— 正文里出现的 `vX.Y` 不算版本声明。
 */
function parseContractVersion(text) {
    const head = String(text).split(/\r?\n/).slice(0, 20).join('\n');
    // ★ 版本段数**两段或三段都收**（契约现为 `v0.4`／`v0.7`／`v0.1`；将来可能 `v1.0.0`）
    const m = head.match(/\*\*状态\*\*[：:]\s*(\*\*)?\s*v(\d+\.\d+(?:\.\d+)?)/);
    return m ? m[2] : null;
}

/**
 * 纯函数：从配套表里抽「名字 → 版本」。
 * ★ 只认**表格行**：`| \`name\` | **vX.Y** | …`
 * ★ 不认正文里的 `vX.Y` 提及（防把说明文字当登记值）。
 */
function parsePinTable(text) {
    const out = new Map();
    // ★ 同样收**两段或三段** —— ★ 这个 bug 是被 `--self-test` 抓出来的：
    //   原文写 `v(\d+\.\d+)` ⇒ 把 `v0.6.3` 截成 `0.6` ⇒ ★ 比对会**假绿**（两边都截短还能对上）。
    const re = /^\|\s*`([A-Za-z0-9_-]+)`\s*\|\s*\**\s*v(\d+\.\d+(?:\.\d+)?)/gm;
    let m;
    while ((m = re.exec(String(text))) !== null) out.set(m[1], m[2]);
    return out;
}

/** 纯函数：比对 —— 返回 { missing, extra, mismatched } */
function diffPins(contracts, pins) {
    const missing = [], extra = [], mismatched = [];
    for (const [name, ver] of contracts) {
        if (!pins.has(name)) { missing.push(name); continue; }
        if (pins.get(name) !== ver) mismatched.push(`${name}: 契约=${ver} 表=${pins.get(name)}`);
    }
    for (const name of pins.keys()) {
        if (name.endsWith('-contract') && !contracts.has(name)) extra.push(name);
    }
    return { missing, extra, mismatched };
}

// ─────────────────────────────────────────────────────────────

function readContracts() {
    if (!fs.existsSync(CONTRACTS_DIR)) return null;
    const out = new Map();
    for (const f of fs.readdirSync(CONTRACTS_DIR).filter(x => x.endsWith('.md'))) {
        const t = fs.readFileSync(path.join(CONTRACTS_DIR, f), 'utf8');
        const v = parseContractVersion(t);
        // ★ 没有「状态」行的契约也登记（值为 null）—— ★ 那是**要报出来的**，不是跳过
        out.set(f.replace(/\.md$/, ''), v);
    }
    return out;
}

function main() {
    const errs = [], warns = [];
    const err = (id, msg) => errs.push({ id, msg });     // ★ 带规则 ID（D3 要核对）

    const pn = pendingNotice(PENDING_RULES);
    if (pn) warns.push(`★ 已承诺未实现的规则（本脚本尚未覆盖）：${pn}`);

    const contracts = readContracts();
    if (contracts === null) { err('P1', '`contracts/` 不存在'); }
    // ── P5 覆盖自证 ──
    if (contracts && contracts.size === 0) {
        err('P5', '扫到 0 份契约 —— ★ 判据失效，不许空集通过');
    }
    if (contracts) for (const [name, v] of contracts) {
        if (v === null) err('P4', `\`contracts/${name}.md\` 头部**没有「状态」行**（或格式不认）—— ★ 契约必须能读出自己的版本`);
    }

    if (!fs.existsSync(PINS_FILE)) {
        err('P1', '`registry/version-pins.md` 不存在 —— ★ 配套表是这条门禁的被检对象');
    } else if (contracts) {
        const pins = parsePinTable(fs.readFileSync(PINS_FILE, 'utf8'));
        const d = diffPins(contracts, pins);
        for (const n of d.mismatched) err('P2', `版本不一致 → ${n}`);
        for (const n of d.missing) err('P3', `\`contracts/${n}.md\` **未在配套表登记** —— ★ 加了契约要同批登记`);
        for (const n of d.extra) err('P3', `配套表登记了 \`${n}\`，但 \`contracts/\` 下**没有这份契约** —— ★ 删了契约要同批销行`);

        console.log('  [check-version-pins] 版本配套表 ↔ 契约版本');
        console.log(`  契约 ${contracts.size} 份 · 配套表登记 ${pins.size} 项`);
        if (!errs.length) {
            for (const [n, v] of [...contracts.entries()].sort()) console.log(`    ✓ ${n}  v${v}`);
        }
    }

    warns.forEach(w => console.log('  ⚠ ' + w));
    if (errs.length) {
        console.log('');
        errs.forEach(e => console.log(`  ✗ ${e.id}  ${e.msg}`));
        console.log('  RESULT: FAIL（' + errs.length + ' 项）');
        console.log('  → 修：改 `registry/version-pins.md`（★ 它是锚点表；契约本身才是真源）');
        process.exit(1);
    }
    console.log('  RESULT: PASS');
    process.exit(0);
}

// ─────────────────────────────────────────────────────────────
// --self-test · 反向测试（★ 没失败过的判据 = 未被验证过的判据）
//   ★ 每条判据都要有「**必红**」与「**不得误报**」两侧。
// ─────────────────────────────────────────────────────────────

function selfTest() {
    const cases = [];
    const t = (id, name, got, want) => cases.push({ id, name, ok: got === want, got, want });

    // ── A 契约版本解析（★ 两种写法都要认）──
    t('A', '★ 加粗写法 `**状态**：**v0.4**（…）` → 认',
        parseContractVersion('> **层**：L3 | **状态**：**v0.4**（2026-10-01 补齐包）'), '0.4');
    t('A', '★★ 不加粗写法 `**状态**：v0.1 首版` → **也认**（asset-ref-contract 就是这个写法）',
        parseContractVersion('> **层**：L3 | **状态**：v0.1 首版（Phase 0）'), '0.1');
    t('A', '★ 正文里的 `v0.9` **不算**版本声明（只看前 20 行）',
        parseContractVersion('# t\n' + 'x\n'.repeat(25) + '**状态**：**v0.9**'), null);
    t('A', '没有状态行 → null（★ 不猜）',
        parseContractVersion('# t\n\n> **层**：L3\n'), null);

    // ── 配套表解析 ──
    const pin = parsePinTable('| `protocol-contract` | **v0.4** | `contracts/protocol-contract.md` |\n'
        + '| `gbe-studio` | **v0.6.3** | `../gbe-studio/VERSION` |');
    t('B', '配套表能抽出契约行', pin.get('protocol-contract'), '0.4');
    t('B', '非契约行也能抽出（★ 比对时才过滤）', pin.get('gbe-studio'), '0.6.3');
    t('B', '★ 正文里的 `v9.9` 提及**不算**登记（只认表格行）',
        parsePinTable('说明：契约当前 v9.9 左右').size, 0);

    // ── C 比对 ──
    const c = new Map([['protocol-contract', '0.4'], ['data-contract', '0.7']]);
    const good = new Map([['protocol-contract', '0.4'], ['data-contract', '0.7'], ['gbe-studio', '0.6.3']]);
    const d1 = diffPins(c, good);
    t('C', '全一致 → 不得误报', d1.mismatched.length + d1.missing.length + d1.extra.length, 0);
    t('C', '★ 版本升级但表没改 → **必红**（mismatched）',
        diffPins(c, new Map([['protocol-contract', '0.5'], ['data-contract', '0.7']])).mismatched.length, 1);
    t('C', '★ 新加契约没登记 → **必红**（missing）',
        diffPins(c, new Map([['protocol-contract', '0.4']])).missing.length, 1);
    t('C', '★ 表里登记了不存在的契约 → **必红**（extra）',
        diffPins(c, new Map([...good, ['ghost-contract', '0.1']])).extra.length, 1);
    t('C', '★ 非契约行（gbe-studio / dalu）**不得**被当成 extra',
        diffPins(c, new Map([...good, ['qiuyuan-dalu', '5f7']])).extra.length, 0);
    t('C', '★ 但契约版本为 null（读不出）→ 由调用方 err，比对本身不崩',
        diffPins(new Map([['x-contract', null]]), new Map([['x-contract', '0.1']])).mismatched.length, 1);

    const failed = cases.filter(x => !x.ok);
    console.log('  [check-version-pins] 反向测试（--self-test）');
    console.log('  纪律：没失败过的判据 = 未被验证过的判据\n');
    cases.forEach(x => console.log('  ' + (x.ok ? '✓' : '✗') + ' ' + x.id + '  ' + x.name
        + (x.ok ? '' : '   → 实际 ' + JSON.stringify(x.got) + ' · 期望 ' + JSON.stringify(x.want))));
    console.log('\n  结果：' + (failed.length ? '不通过（' + failed.length + ' / ' + cases.length + ' 失败）'
        : '通过（' + cases.length + ' / ' + cases.length + ' 用例）'));
    process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();
else main();
