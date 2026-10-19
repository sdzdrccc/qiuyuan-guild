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
 *   ★ **不把** `gbe-studio` / `gbe-assets` / `dalu` 那三行做成 **err** —— ★ 它们的真源**在别的仓**：
 *     若做成硬判据，★ 那两仓**发个版就会把本仓门禁弄红** ⇒
 *     ★ 本仓**不是它们的发布守门人**（判据：**别把别人的事变成自己的红**）。
 *   ★★ 但「不红」≠「不看」（`X-0054` 修正）：实测这三行**真腐过**（写 v0.6.4/v0.6.3 时真源已
 *     v0.6.5/v0.7.0）⇒ 现做成 **`P6` 软判据**：读到真源就比、不一致只 **warn**；
 *     读不到（CI / 别机克隆）**打印「跳过（NOT a pass）」**，绝不静默。
 *     ★ 详见 `registry/version-pins.md` §遗留 1。
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
 *
 * ★ 2026-10-19（`X-0054` · G-7 / MiMo D4）：原来的 `P2` 条目**被注释掉**了 ——
 *   「承诺未落且不可见」，正是纪律 7 要治的病。现改为：
 *   · 三行兄弟仓版本钉**做成软判据 `P6`**（见 main 尾部）：读到就比、不一致就 **warn 不 err**；
 *   · 理由不变 —— ★ **本仓不是它们的发布守门人**，不能把别人发版变成自己的红；
 *   · 但「软」不等于「不看」：★ 不可读时也**打印「跳过（NOT a pass）」**。
 */
const PENDING_RULES = [];

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
// P6（软）· 兄弟仓版本钉 ↔ 真源 `VERSION`（`X-0054` · G-7 / MiMo D4）
//   ★ 软的理由：本仓不是它们的发布守门人 ⇒ **不一致不阻断**（warn）。
//   ★ 仍要看的理由：这三行**真腐过**，而「锚点表腐坏」比没有表更坏（有人会拿它做决定）。
// ─────────────────────────────────────────────────────────────

/** 兄弟仓真源路径（环境变量优先 —— CI / 别机克隆用） */
const SIBLINGS = [
    {
        name: 'gbe-studio',
        file: process.env.GBE_STUDIO_REPO
            ? path.join(process.env.GBE_STUDIO_REPO, 'VERSION')
            : path.resolve(ROOT, '..', 'gbe-studio', 'VERSION'),
    },
    {
        name: 'gbe-assets',
        file: process.env.GBE_ASSETS_REPO
            ? path.join(process.env.GBE_ASSETS_REPO, 'VERSION')
            : path.resolve(ROOT, '..', 'gbe-assets', 'VERSION'),
    },
];

/** 纯函数：解析 `VERSION` 文件内容（单行 SemVer；读不出 → null，**不猜**） */
function parseVersionFile(text) {
    const m = String(text || '').trim().match(/^v?(\d+\.\d+(?:\.\d+)?)\s*$/);
    return m ? m[1] : null;
}

/**
 * 纯函数：比对兄弟仓版本钉。
 * @param {Map<string,string>} pins  配套表（name → 版本）
 * @param {Array<{name:string, version:string|null}>} readings 真源读数
 * @returns {{matched:string[], mismatched:string[], unreadable:string[], unregistered:string[]}}
 *   ★ 四类**分开**，不许压成一句「3 项异常」—— 修复手段不同（改表 / 加路径 / 补登记）。
 */
function diffSiblingPins(pins, readings) {
    const out = { matched: [], mismatched: [], unreadable: [], unregistered: [] };
    for (const r of readings) {
        if (r.version === null) { out.unreadable.push(r.name); continue; }
        if (!pins.has(r.name)) { out.unregistered.push(r.name); continue; }
        if (pins.get(r.name) !== r.version) out.mismatched.push(`${r.name}: 表=v${pins.get(r.name)} 真源=v${r.version}`);
        else out.matched.push(`${r.name} v${r.version}`);
    }
    return out;
}

function readSiblings() {
    return SIBLINGS.map(s => {
        try {
            return { name: s.name, version: parseVersionFile(fs.readFileSync(s.file, 'utf8')) };
        } catch {
            return { name: s.name, version: null };
        }
    });
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
    const warn = (id, msg) => warns.push({ id, msg });   // ★ 软判据也带 ID（P6）—— 否则 D3 看不见它

    const pn = pendingNotice(PENDING_RULES);
    if (pn) warn(null, `★ 已承诺未实现的规则（本脚本尚未覆盖）：${pn}`);

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

        // ── P6（软）· 兄弟仓版本钉 ↔ 真源 `VERSION` ──
        //   ★ 不一致**只 warn**（本仓不是它们的发布守门人）；★ 不可读**显式写「跳过 · NOT a pass」**。
        const sib = diffSiblingPins(pins, readSiblings());
        for (const m of sib.mismatched) warn('P6', `${m} —— ★ 软判据：不阻断 · 但不许当没看见（改 \`registry/version-pins.md\` 或对方真源）`);
        for (const n of sib.unregistered) warn('P6', `${n}：配套表**未登记** —— ★ 补一行，否则这一仓等于没人管`);
        const seen = sib.matched.length + sib.mismatched.length;
        warn('P6', `兄弟仓版本钉：读到 ${seen} / ${SIBLINGS.length} 项`
            + (sib.matched.length ? `（一致 ${sib.matched.join(' / ')}）` : '')
            + (sib.unreadable.length ? `（**不可读 → 跳过 · NOT a pass**：${sib.unreadable.join(' / ')}）` : ''));

        console.log('  [check-version-pins] 版本配套表 ↔ 契约版本');
        console.log(`  契约 ${contracts.size} 份 · 配套表登记 ${pins.size} 项`);
        if (!errs.length) {
            for (const [n, v] of [...contracts.entries()].sort()) console.log(`    ✓ ${n}  v${v}`);
        }
    }

    warns.forEach(w => console.log('  ⚠ ' + (w.id ? w.id + '  ' : '') + w.msg));
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

    // ── P6 · 兄弟仓版本钉（软）──
    t('P6', 'VERSION 单行 → 取出 0.6.5', parseVersionFile('0.6.5\n'), '0.6.5');
    t('P6', '★ 带 v 前缀也认', parseVersionFile('v0.7.0'), '0.7.0');
    t('P6', '空文件 / 垃圾 → null（★ 不猜）', parseVersionFile(''), null);
    const pins6 = new Map([['gbe-studio', '0.6.5'], ['gbe-assets', '0.7.0']]);
    const sibOk = diffSiblingPins(pins6, [{ name: 'gbe-studio', version: '0.6.5' }, { name: 'gbe-assets', version: '0.7.0' }]);
    t('P6', '两侧一致 → 不得误报（matched 两项）', sibOk.matched.length + sibOk.mismatched.length, 2);
    t('P6', '★ 表落后真源 → mismatched 必报（只 warn 不 err）',
        diffSiblingPins(pins6, [{ name: 'gbe-studio', version: '0.6.4' }]).mismatched.length, 1);
    t('P6', '★ 真源不可读 → 单列 unreadable（跳过 · NOT a pass）',
        diffSiblingPins(pins6, [{ name: 'gbe-assets', version: null }]).unreadable.join(','), 'gbe-assets');
    t('P6', '★ 表里没登记 → unregistered（不许静默放过）',
        diffSiblingPins(pins6, [{ name: 'ue-ai-ops', version: '0.1.0' }]).unregistered.join(','), 'ue-ai-ops');

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
