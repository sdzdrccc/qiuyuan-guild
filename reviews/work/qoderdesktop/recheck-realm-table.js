// 独立复算：按 境界基础属性.md §8.1/§8.2/§8.3 公式重算，与 §5 表逐格比对
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8').replace(/\r/g, '');
const lines = src.split('\n');

// 解析 §5.1..§5.9 的表（含 层次/气血/灵力/物攻/法攻/物防/法防/暴击率/命中率/闪避率/速度）
const tables = [];
let cur = null;
lines.forEach((ln, i) => {
  const h = /^### 5\.(\d+) (.+?)（十层）/.exec(ln);
  if (h) { cur = { realm: Number(h[1]), name: h[2], start: i + 1, rows: [] }; tables.push(cur); return; }
  if (cur && /^\| 第 \d+ 层/.test(ln)) {
    const c = ln.split('|').slice(1, -1).map(s => s.trim());
    if (c.length >= 11) {
      const layer = Number(/第 (\d+) 层/.exec(c[0])[1]);
      cur.rows.push({ line: i + 1, layer, hp: Number(c[1]), mp: Number(c[2]), pa: Number(c[3]), ma: Number(c[4]),
        pd: Number(c[5]), md: Number(c[6]), crit: parseFloat(c[7]), hit: parseFloat(c[8]), dodge: parseFloat(c[9]), spd: Number(c[10]) });
    }
  }
});

const REALM_BASE_HP = 100, R1 = 1.25 ** (1 / 3);
const rhu = x => Math.floor(x + 0.5);           // 四舍五入（.5 上取）
const rh2 = x => Math.round(x * 100) / 100;
const bad = [];
let mono = true, prevMax = 0;

for (const t of tables) {
  const realm = t.realm;                                 // 1..9
  const base = realm === 1 ? REALM_BASE_HP : REALM_BASE_HP * 3 ** (realm - 1);   // §8.1
  for (const r of t.rows) {
    // 气血：炼气 = 100*1.0772^(n-1)；筑基及以上 = 初期*1.077^(n-1)（同一底）
    const expHp = base * R1 ** (r.layer - 1);
    const gotHp = rhu(expHp);
    if (gotHp !== r.hp) bad.push(`${t.name} L${r.layer}(:${r.line}) 气血 表=${r.hp} 公式=${expHp.toFixed(2)}→${gotHp}`);
    // 派生列（§8.1 取整口径：以已取整气血再算）
    if (rhu(r.hp / 2) !== r.mp) bad.push(`${t.name} L${r.layer}(:${r.line}) 灵力 表=${r.mp} 应=${rhu(r.hp / 2)}`);
    if (rhu(r.hp / 10) !== r.pa) bad.push(`${t.name} L${r.layer}(:${r.line}) 物攻 表=${r.pa} 应=${rhu(r.hp / 10)}`);
    if (rhu(r.hp / 20) !== r.pd) bad.push(`${t.name} L${r.layer}(:${r.line}) 物防 表=${r.pd} 应=${rhu(r.hp / 20)}`);
    // 单调性
    if (r.layer > 1 && r.hp <= prevInRealm) mono = false;
    prevInRealm = r.hp;
    if (r.layer === 1 && realm > 1 && r.hp <= tables[realm - 2].rows[9].hp) mono = false;
  }
}

// §8.2 百分比公式（表称「下表系数为炼气期口径」）
const PCT = {
  crit:  { base: 5,   perRealm: 3,    perLayer: 0.25 },
  hit:   { base: 90,  perRealm: 0.5,  perLayer: 0.06 },
  dodge: { base: 5,   perRealm: 2,    perLayer: 0.125 },
};
const pctBad = [];
for (const t of tables) for (const r of t.rows) {
  for (const k of Object.keys(PCT)) {
    const p = PCT[k];
    const v = p.base + (t.realm - 1) * p.perRealm + (r.layer - 1) * p.perLayer;
    if (rh2(v) !== r[k]) pctBad.push({ k, realm: t.name, layer: r.layer, line: r.line, tab: r[k], formula: +v.toFixed(4) });
  }
}
// 按境界聚合，看「公式在哪一境开始偏离」
const byRealm = {};
for (const x of pctBad) (byRealm[x.k] ||= []).push(x.realm + ' L' + x.layer);

// §8.3 速度
const spdBad = [];
for (const t of tables) for (const r of t.rows) {
  let v;
  if (t.realm === 1) v = 100 * (1 + (r.layer - 1) * 0.0125);
  else {
    const a = { 1: 100 * 1.2 ** (t.realm - 1), 4: null, 7: null, 10: null };
    // 锚点：第1层=100*1.2^(realm-1)；表给 1/4/7/10 锚点 = 120/122/123/125 型；段内线性
    const L1 = 100 * 1.2 ** (t.realm - 1);
    if (r.layer === 1) v = L1;
    else {
      const a4 = t.rows[3].spd, a7 = t.rows[6].spd, a10 = t.rows[9].spd;
      v = r.layer < 4 ? L1 + (a4 - L1) * (r.layer - 1) / 3
        : r.layer < 7 ? a4 + (a7 - a4) * (r.layer - 4) / 3
        : r.layer < 10 ? a7 + (a10 - a7) * (r.layer - 7) / 3 : a10;
    }
  }
  const rr = rhu(v), ff = Math.floor(v);
  if (r.spd !== rr && r.spd !== ff) spdBad.push(`${t.name} L${r.layer}(:${r.line}) 速度 表=${r.spd} 公式=${v.toFixed(4)} (round=${rr}/floor=${ff})`);
  if (t.realm === 1) { /* 炼气直接比 */ }
}

console.log('=== 九境十层解析 ===');
console.log('表数=' + tables.length, '每表行数=' + tables.map(t => t.rows.length).join(','));
console.log('\n=== §8.1 气血 + 派生列 不符 ==='); console.log(bad.length ? bad.join('\n') : '（全符）');
console.log('\n=== 单调性（境内膜增 / 跨境跃升）==='); console.log(mono ? '单调 通过' : '不单调 不通过');
console.log('\n=== 跨界压制比（上一境圆满→下一境初期）===');
for (let i = 1; i < tables.length; i++) console.log(`${tables[i - 1].name}圆满→${tables[i].name}初期: ${(tables[i].rows[0].hp / tables[i - 1].rows[9].hp).toFixed(4)}`);
console.log('\n=== 总跨度 ==='); console.log((tables[8].rows[9].hp / tables[0].rows[0].hp).toFixed(2));
console.log('\n=== §8.2 百分比公式 vs 表（不符计数按境界）===');
for (const k of Object.keys(PCT)) console.log(k + ': ' + (byRealm[k] ? byRealm[k].length + ' 处 → ' + [...new Set(byRealm[k].map(s => s.split(' ')[0]))].join(' / ') : '全符'));
console.log('样例：', pctBad.slice(0, 6).map(x => `${x.realm} L${x.layer} ${x.k} 表=${x.tab} 公式=${x.formula} (:${x.line})`).join('\n'));
console.log('\n=== §8.3 速度 不符 ==='); console.log(spdBad.length ? spdBad.join('\n') : '（全符，含 round/floor 两口径）');
// 炼气逐格
console.log('\n=== 炼气速度逐格：公式值 vs 表 ===');
tables[0].rows.forEach(r => console.log(`L${r.layer}(:${r.line}) 表=${r.spd} 公式=${(100 * (1 + (r.layer - 1) * 0.0125)).toFixed(2)}`));
// 筑基及以上 第1层 = 100*1.2^(realm-1)
console.log('\n=== 各境初期速度：100×1.2^(n-1) vs 表 ===');
tables.forEach(t => { const v = 100 * 1.2 ** (t.realm - 1); console.log(`${t.name} 表=${t.rows[0].spd} 公式=${v.toFixed(3)} round=${rhu(v)} floor=${Math.floor(v)}`); });
