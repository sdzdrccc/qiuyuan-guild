#!/usr/bin/env node
'use strict';

/**
 * check-identifiers.js —— 跨文档标识符一致性（来源 X-0015）
 *
 * 职责：文档里被反引号引用的**配置表 / 数据库表标识符**，必须真的存在；
 *       引用了**已退役**的名字，必须在同一行标明退役。
 *
 * ── 为什么需要它（X-0015 §二-5 的实测证据）────────────────────
 *   dalu 的 `T-0017` 声称「引用面共 21 处**已一并处置 ✅**」，实际漏了 ——
 *   因为清点靠**人工按关键词 grep**，而同一事实在文档里有多种写法：
 *     · `spirit_root_anchor` 被写成 `spirit_root_anchor_ppm`（键名不存在）
 *     · `cultiv_mult_ppm` 是 v0.4 旧名，现行名是 `cultivation_mult_ppm`
 *     · `purity_mult_config` 已在第六轮整表删除，`CREATION-DATA.md` §6#4 仍当它活着
 *   「改一处、漏三处」是文档维护的固有陷阱（AGENTS.md §4 三类错误里的第一类）。
 *   **人可以漏，机器不会** —— 前提是把标识符集合变成可计算的。
 *
 * ── 判据为什么收得这么紧（设计取舍 · 重要）────────────────────
 *   首版曾用「键名前缀」等宽判据，实测 **44 个误报** —— 误报了 MySQL 表名、
 *   原型占位名 `xx_*`、示例占位符 `qydl_xxx`、以及**历史记录里本该保留的旧名**。
 *   而高误报门禁的结局是**被无视**，比没有门禁更糟（§7.1 纪律 1「虚假的安心」的反面）。
 *   → 故本规则**只收三个高信号命名空间**，宁少勿滥：
 *       ① `qydl_*`       —— 数据库表 / 配置表产物名
 *       ② `*_ppm`        —— 配置表参数与倍率列
 *       ③ `*_config`     —— 配置表逻辑名
 *     且**排除**：`xx_*`（原型占位约定，ADR-0001 §0.2 明定不是规范）、
 *                占位示例（`qydl_xxx`）、**`records/`（历史留痕，按纪律「只追加不改写」）**。
 *   → 换来的是：**每一条报出即真**。漏报多于误报，是这个取舍的自觉代价。
 *
 * ── 边界 ────────────────────────────────────────────────────
 *   · 查**存在性**，不查用法对错 —— 后者是语义判断，归人工检查点（§7.1 纪律 6）。
 *   · 不查 Go 类型 / 协议字段 —— 那些的受管集合还没有单一真源。
 *
 * 用法：
 *   node scripts/check-identifiers.js             # 常规
 *   node scripts/check-identifiers.js --strict    # 警告也视为失败
 *   node scripts/check-identifiers.js --self-test # 反向测试
 *
 * 退出码：0 = 通过 / 1 = 失败
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DALU = 'F:/zxc/Project/qiuyuan-dalu';
const DALU_DATA = path.join(DALU, 'data');
const DALU_DB = path.join(DALU, 'db');
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
  // { id: 'I2', from: 'X-0000', desc: '…', due: 'M2' },
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
const err = (r, m) => errors.push({ rule: r, msg: m });
const warn = (r, m) => warns.push({ rule: r, msg: m });
const ok = (r, m) => passes.push({ rule: r, msg: m });

const useColor = process.stdout.isTTY;
const c = (n, s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : s);
const GREEN = 32, RED = 31, YELLOW = 33, DIM = 2;

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

// ─────────────────────────────────────────────────────────────
// 退役标识符花名册（名字 → 原因）
//   ★ 只在这里加名字，且必须写清「谁在什么时候删的」——
//     否则下一个人不知道能不能引用它（与 ADR 只追加同理）。
// ─────────────────────────────────────────────────────────────
const RETIRED = {
  purity_mult_config: 'T-0017 第六轮：纯度侧改连续式，该表**整表删除**（配置表 7 → 6 张）',
  purity_threshold_low: '裁定 M：档位改由品级 `grade_rank` 决定，纯度不再有阈值',
  purity_threshold_high: '裁定 M：同上',
  purity_damage_min_ppm: '裁定 L/N 第六轮：改由 `purity_damage_influence_ppm` 一个标量给出',
  purity_damage_max_ppm: '裁定 L/N 第六轮：同上',
  cultiv_mult_ppm: '裁定 I 后改名为 `cultivation_mult_ppm`（现行名）',
};

/**
 * 退役标记 —— 同一行出现任一个，才允许引用退役名。
 * ★ 收得宽的自觉理由：**本表只在「该名已在 `RETIRED` 花名册里」时才被查阅**，
 *   而花名册里的名都已确认删除/改名 —— 于是一行里出现「删」字，几乎必然是在讲它被删。
 *   反之，**活跃名永远不会走这条分支**，故放宽不会放过「引用不存在标识符」那类真错。
 */
const RETIRED_MARKER = /已删|删除|删|退役|作废|撤销|废弃|~~|已闭|整张表|整表|不复存在|旧名|改名|原为|改由|不需要|不再|已无/;

/** 占位示例 —— 文档里的示意名，不是引用 */
const PLACEHOLDER = /(xxx|yyy|zzz|foo|bar|example|示例)/i;

// ─────────────────────────────────────────────────────────────
// 纯函数区（便于 --self-test）
// ─────────────────────────────────────────────────────────────

/** 从 XML 表定义提取 Luban 表名与 output（产物）名 */
function tableNamesFromXml(text) {
  const out = [];
  for (const m of String(text).matchAll(/<table\b[^>]*>/g)) {
    const tag = m[0];
    const n = tag.match(/\bname="([A-Za-z][A-Za-z0-9_]*)"/);
    const o = tag.match(/\boutput="([A-Za-z][A-Za-z0-9_]*)"/);
    if (n) out.push(n[1]);
    if (o) out.push(o[1]);
  }
  return out;
}

/** 从建表 SQL 提取 MySQL 表名（`CREATE TABLE ... \`name\``） */
function tableNamesFromSql(text) {
  const out = [];
  for (const m of String(text).matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z][A-Za-z0-9_]*)`?/gi)) {
    out.push(m[1]);
  }
  return out;
}

/** 从 CSV 表源提取字段名（`##var` 行的 B 列起） */
function fieldNamesFromCsv(text) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/);
  const header = (lines[0] || '').split(',');
  if (!/^##var\b/.test((header[0] || '').trim())) return [];
  return header.slice(1).map(s => s.trim()).filter(Boolean);
}

/** 从键值表 CSV 提取键名（列名 `key`） */
function configKeysFromCsv(text) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(s => s.trim());
  const ki = header.indexOf('key');
  if (ki < 0) return [];
  return lines.slice(1).map(l => (l.split(',')[ki] || '').trim()).filter(Boolean);
}

/**
 * 纯函数：受管标识符集合
 *   额外收**去前缀形态** —— `game_config` 与 `qydl_game_config` 是同一个表的两种合法写法
 *   （前缀属下游自决 · ADR-0001，文档里两种都出现）
 */
function managedIdentifiers(src) {
  const set = new Set();
  const add = (s) => { if (s) set.add(s); };
  src.tables.forEach(add);
  src.mysqlTables.forEach(add);
  src.files.forEach(f => { add(f); add(f.replace(/^qydl_/, '')); });
  src.fields.forEach(add);
  src.keys.forEach(add);
  return set;
}

/**
 * 纯函数：是否属于本规则管辖的三个高信号命名空间
 *   刻意**不含**「键名前缀」类宽判据 —— 实测误报 MySQL 表名 / `xx_*` / 需求层名（见文件头取舍）
 */
function isManagedNamespace(id) {
  if (!/^[a-z][a-z0-9_]*$/.test(id)) return false;   // 排除含大写/点的（如 purityAvg）
  if (PLACEHOLDER.test(id)) return false;            // 占位示例
  if (/^xx_/.test(id)) return false;                 // 原型占位约定（ADR-0001 §0.2：不是规范）
  if (/^qydl_.+/.test(id)) return true;              // ① 数据库表 / 配置表产物名（须带后缀，`qydl_` 本身是「前缀」概念）
  if (/_ppm$/.test(id)) return true;                 // ② 配置表参数与倍率列
  if (/_config$/.test(id)) return true;              // ③ 配置表逻辑名
  return false;
}

/**
 * 纯函数：抽出一行里**所有反引号跨度内**的标识符候选。
 *
 * 为什么要按非标识符字符再切一刀（实测教训）：
 *   文档常把「路径 + 值」写进**同一个**反引号跨度里 ——
 *   例：`` `qydl_game_config.spirit_root_anchor_ppm = 2000000` ``。
 *   只比对整段，`spirit_root_anchor_ppm` 这个**真错**会被 `.` 与空格挡在门外 → **漏报**。
 *   故跨度内再按 `[^A-Za-z0-9_]+` 切分，逐段判。
 */
function tokensInBackticks(line) {
  const out = new Set();
  for (const m of String(line).matchAll(/`([^`\n]+)`/g)) {
    for (const t of m[1].split(/[^A-Za-z0-9_]+/)) {
      if (t) out.add(t);
    }
  }
  return out;
}

/**
 * 纯函数：扫描单行里的受管标识符，返回违规项
 *   { id, reason: 'unknown' | 'retired-no-marker' }
 */
function scanLine(line, known, retired) {
  const out = [];
  for (const id of tokensInBackticks(line)) {
    if (!isManagedNamespace(id)) continue;
    if (known.has(id)) continue;
    if (Object.prototype.hasOwnProperty.call(retired, id)) {
      if (!RETIRED_MARKER.test(line)) out.push({ id, reason: 'retired-no-marker' });
      continue;
    }
    out.push({ id, reason: 'unknown' });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 规则 I1 · 文档引用的标识符必须存在（退役名须标退役）
// ─────────────────────────────────────────────────────────────

/**
 * 待扫描的文档。
 * ★ **不扫 `records/`** —— 那是历史留痕，按「只追加不改写」纪律**本就该保留旧名**；
 *   拿「今天还存在吗」去要求历史记录，是把判据用错了地方。
 * ★ 不扫 dalu 的 `docs/DATA-LAYOUT.md` 里 `defines/` 结构图那种示意名 —— 由 PLACEHOLDER 处理。
 */
function docFiles() {
  const out = [];
  const addDir = (d, re) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isFile() && re.test(e.name)) out.push(path.join(d, e.name));
    }
  };
  for (const base of [ROOT, DALU]) {
    const r = path.join(base, 'README.md');
    if (fs.existsSync(r)) out.push(r);
  }
  for (const base of [ROOT, DALU]) addDir(path.join(base, 'docs'), /\.md$/);
  addDir(path.join(ROOT, 'registry'), /\.md$/);
  addDir(path.join(ROOT, 'contracts'), /\.md$/);
  return [...new Set(out)];
}

(function i1() {
  const definesDir = path.join(DALU_DATA, 'defines');
  const datasDir = path.join(DALU_DATA, 'datas');
  if (!fs.existsSync(definesDir) || !fs.existsSync(datasDir)) {
    ok('I1', '配置表表源未建立（`qiuyuan-dalu/data/`）→ 跳过');
    return;
  }

  // ① 与真源联动地取受管集合
  const src = { tables: [], mysqlTables: [], files: [], fields: [], keys: [] };
  for (const f of fs.readdirSync(definesDir).filter(f => f.endsWith('.xml'))) {
    src.tables.push(...tableNamesFromXml(read(path.join(definesDir, f)) || ''));
  }
  for (const f of fs.readdirSync(datasDir).filter(f => f.endsWith('.csv'))) {
    src.files.push(f.replace(/\.csv$/, ''));
    const t = read(path.join(datasDir, f)) || '';
    src.fields.push(...fieldNamesFromCsv(t));
    src.keys.push(...configKeysFromCsv(t));
  }
  const migDir = path.join(DALU_DB, 'migrations');
  if (fs.existsSync(migDir)) {
    for (const f of fs.readdirSync(migDir).filter(f => f.endsWith('.sql'))) {
      src.mysqlTables.push(...tableNamesFromSql(read(path.join(migDir, f)) || ''));
    }
  }

  const known = managedIdentifiers(src);
  if (known.size === 0) {
    err('I1', '受管标识符集合为空 —— 疑似表源解析失效（禁止空集真空通过）');
    return;
  }
  if (src.mysqlTables.length === 0) {
    warn('I1', '未从 `db/migrations/*.sql` 取到 MySQL 表名 —— `qydl_*` 表名会被误判');
  }

  // ② 扫描
  const files = docFiles();
  if (files.length === 0) { err('I1', '未扫描到任何文档 —— 禁止空集真空通过'); return; }

  const unknown = [];
  const retired = [];
  let scanned = 0;
  for (const p of files) {
    const t = read(p);
    if (t === null) continue;
    scanned++;
    const rel = path.relative(ROOT, p).replace(/\\/g, '/');
    t.split(/\r?\n/).forEach((l, i) => {
      for (const v of scanLine(l, known, RETIRED)) {
        (v.reason === 'unknown' ? unknown : retired).push(`${rel}:${i + 1} \`${v.id}\``);
      }
    });
  }

  for (const u of unknown) {
    err('I1', `${u} —— **该标识符不存在**（受管集合 ${known.size} 个 · 禁凭空引用）`);
  }
  for (const r of retired) {
    const id = r.split('`')[1];
    warn('I1', `${r} —— 该名**已退役**（${RETIRED[id] || ''}），本行未标退役`);
  }
  if (unknown.length === 0 && retired.length === 0) {
    ok('I1', `标识符一致性通过（受管集合 ${known.size} 个 · 扫描 ${scanned} 篇文档 · 0 处凭空引用）`);
  }
})();

// ─────────────────────────────────────────────────────────────
// --self-test · 反向测试（CONVENTIONS §7.1 纪律 2）
// ─────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  const KNOWN = new Set(['qydl_game_config', 'game_config', 'qydl_role', 'spirit_root_anchor',
    'damage_mult_ppm', 'grade_rank', 'cultivation_mult_ppm']);
  const cases = [
    // 命名空间认法 —— 三个高信号命名空间
    ['I1', 'qydl_ 前缀 → 受管', isManagedNamespace('qydl_role_root') === true, true],
    ['I1', '_config 结尾 → 受管', isManagedNamespace('purity_mult_config') === true, true],
    ['I1', '_ppm 结尾 → 受管', isManagedNamespace('spirit_root_anchor_ppm') === true, true],
    // 命名空间认法 —— 必须排除的（首版 44 个误报的来源）
    ['I1', '原型占位名 xx_* → 不受管（ADR-0001 §0.2）', isManagedNamespace('xx_realm_level_config') === false, true],
    ['I1', '占位示例 qydl_xxx → 不受管', isManagedNamespace('qydl_xxx') === false, true],
    ['I1', '需求层名 inductive_progress → 不受管', isManagedNamespace('inductive_progress') === false, true],
    ['I1', '含大写（Go 变量风格）→ 不受管', isManagedNamespace('purityAvg') === false, true],
    ['I1', 'Go 类型名 → 不受管', isManagedNamespace('QydlRoleRoot') === false, true],
    ['I1', '普通英文词 → 不受管', isManagedNamespace('check-data') === false, true],
    // 违规判定
    ['I1', '不存在的键名 → 必拦下', scanLine('参数 `spirit_root_anchor_ppm`', KNOWN, RETIRED).some(v => v.reason === 'unknown'), true],
    ['I1', '存在的键名 → 不得误报', scanLine('参数 `spirit_root_anchor`', KNOWN, RETIRED).length === 0, true],
    ['I1', 'MySQL 表名（来自建表 SQL）→ 不得误报', scanLine('表 `qydl_role`', KNOWN, RETIRED).length === 0, true],
    ['I1', '去前缀表名也算存在 → 不得误报', scanLine('落 `game_config`', KNOWN, RETIRED).length === 0, true],
    ['I1', '旧名（已改名）未标退役 → 必拦下', scanLine('增 `cultiv_mult_ppm`', KNOWN, RETIRED).some(v => v.reason === 'retired-no-marker'), true],
    ['I1', '旧名 + 标了改名 → 放行', scanLine('原为 `cultiv_mult_ppm`，现行名见下', KNOWN, RETIRED).length === 0, true],
    ['I1', '退役名 + 标了退役 → 放行', scanLine('`purity_mult_config` 已整表删除', KNOWN, RETIRED).length === 0, true],
    ['I1', '退役名 + 未标退役 → 必拦下', scanLine('落 `purity_mult_config` 5 档', KNOWN, RETIRED).some(v => v.reason === 'retired-no-marker'), true],
    ['I1', '同一行多处引用去重', scanLine('`grade_rank` 与 `grade_rank`', KNOWN, RETIRED).length === 0, true],
    ['I1', '同一行两个坏名 → 各报一次', scanLine('`spirit_root_anchor_ppm` 与 `purity_damage_min_ppm`', KNOWN, RETIRED).length === 2, true],
    // ★ 实测教训：文档把「路径 + 值」写进同一个反引号跨度 → 必须切段才不**漏报**
    ['I1', '点号路径 + 值 同跨度 → 仍能抓到坏名', scanLine('| `anchor` | 基准 | `qydl_game_config.spirit_root_anchor_ppm = 2000000` |', KNOWN, RETIRED).some(v => v.id === 'spirit_root_anchor_ppm'), true],
    ['I1', '同跨度里的已知名不得误报', scanLine('`qydl_game_config.spirit_root_anchor = 2`', KNOWN, RETIRED).length === 0, true],
    // ★ 自觉的代价：**漏报多于误报**（见文件头取舍）—— 无后缀的键名不在管辖内
    ['I1', '不在三个命名空间内者：不报（自觉的漏报）', scanLine('阈值 `purity_threshold_low`', KNOWN, RETIRED).length === 0, true],
    ['I1', '「qydl_ 前缀」这个词本身 → 不得误报', scanLine('表名统一 `qydl_` 前缀', KNOWN, RETIRED).length === 0, true],
    // 集合构建
    ['I1', '表名主/副两种写法都收', (() => {
      const s = managedIdentifiers({ tables: [], mysqlTables: [], files: ['qydl_role_root'], fields: [], keys: [] });
      return s.has('qydl_role_root') && s.has('role_root');
    })(), true],
    ['I1', 'XML 表名与 output 都收', tableNamesFromXml('<table name="QydlGameConfig" value="GameConfig" output="qydl_game_config" />').join(',') === 'QydlGameConfig,qydl_game_config', true],
    ['I1', '建表 SQL 反引号表名 → 收到', tableNamesFromSql('CREATE TABLE IF NOT EXISTS `qydl_role` (').join(',') === 'qydl_role', true],
    ['I1', '建表 SQL 裸表名 → 收到', tableNamesFromSql('create table qydl_x (a int)').join(',') === 'qydl_x', true],
    ['I1', 'INSERT INTO 不得误当建表', tableNamesFromSql('INSERT INTO `qydl_role` VALUES (1)').length === 0, true],
    ['I1', 'CSV 字段名解析', fieldNamesFromCsv('##var,a,b\n,1,2\n').join(',') === 'a,b', true],
    ['I1', '非 ##var 表 → 字段为空（不误取）', fieldNamesFromCsv('x,y\n1,2\n').length === 0, true],
    ['I1', '键值表键名解析', configKeysFromCsv('##var,key,value\n,a,1\n,b,2\n').join(',') === 'a,b', true],
    ['I1', '无 key 列 → 不误取', configKeysFromCsv('##var,x,y\n,1,2\n').length === 0, true],
    // PEND 待实现规则登记位（机制③ · 来源 X-0016）
    ['PEND', '空名单 → 不告警（不打破现状）', pendingNotice([]) === null, true],
    ['PEND', '非空 → 生成提示（含来源）', pendingNotice([{ id: 'I2', from: 'X-0000' }]) === 'I2(from X-0000)', true],
    ['PEND', '缺 from → 显式标记（不许静默）', /⚠缺来源/.test(pendingNotice([{ id: 'I2' }])), true],
  ];

  const fails = cases.filter(([, , got, want]) => got !== want);
  console.log(c(1, '\n[check-identifiers] 反向测试（--self-test）'));
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

console.log(c(1, '\n[check-identifiers] 跨文档标识符一致性'));
console.log(c(DIM, `  真源      ${DALU_DATA} ＋ ${DALU_DB}`));
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
