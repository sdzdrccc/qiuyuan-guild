// 搬运链比对：设定库 §5 九境十层表 ↔ dalu qydl_realm_level_config.csv（修正表头解析）
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8').replace(/\r/g, '');
const lib = new Map();
let realm = 0;
src.split('\n').forEach((ln, i) => {
  const h = /^### 5\.(\d+) /.exec(ln);
  if (h) { realm = Number(h[1]); return; }
  const m = /^\| 第 (\d+) 层/.exec(ln);
  if (m && realm) {
    const c = ln.split('|').slice(1, -1).map(s => s.trim());
    if (c.length >= 11) lib.set(`${realm}-${m[1]}`, { hp: +c[1], mp: +c[2], pa: +c[3], pd: +c[5], crit: parseFloat(c[7]), hit: parseFloat(c[8]), dodge: parseFloat(c[9]), spd: +c[10], line: i + 1 });
  }
});
const raw = fs.readFileSync(process.argv[3], 'utf8').replace(/\r/g, '').split('\n').filter(l => l.length);
const head = raw[0].replace(/^##var,/, '').split(',');       // 第 0 列是 Luban 行标记位，非字段
const col = n => head.indexOf(n);
const rows = raw.slice(1).filter(l => l.startsWith(','));
const diffs = [];
const attrCols = ['hp_max', 'mp_max', 'phy_atk', 'mag_atk', 'phy_def', 'mag_def', 'crit_rate', 'crit_dmg', 'crit_resist', 'hit_rate', 'dodge_rate', 'def_break', 'block_rate', 'block_reduce', 'speed'];
const unknown = head.slice(1).filter(c => !attrCols.includes(c) && !['realm_id', 'layer', 'level_name'].includes(c));
for (const l of rows) {
  const c = l.split(',');
  const r = +c[col('realm_id') + 1], lay = +c[col('layer') + 1];   // 数据行首列为空 ⇒ 索引 +1
  const a = lib.get(`${r}-${lay}`);
  if (!a) { diffs.push(`库内无 ${r}-${lay}`); continue; }
  for (const name of attrCols) {
    const got = parseFloat(c[col(name) + 1]);
    const expect = { hp_max: a.hp, mp_max: a.mp, phy_atk: a.pa, mag_atk: a.pa, phy_def: a.pd, mag_def: a.pd, crit_rate: a.crit, hit_rate: a.hit, dodge_rate: a.dodge, speed: a.spd }[name];
    if (expect !== undefined && Math.abs(got - expect) > 0.005) diffs.push(`境${r} 第${lay}层 ${name}: 设定库=${expect}(:${a.line}) CSV=${got}`);
  }
}
console.log('设定库表行=' + lib.size + ' / CSV 数据行=' + rows.length + ' / CSV 字段数=' + head.length);
console.log('CSV 中设定库 15 项之外的字段 = ' + (unknown.join(', ') || '无'));
console.log('逐格差异 = ' + diffs.length + ' 处');
console.log(diffs.slice(0, 45).join('\n') || '（九境十层 15 项与设定库逐格一致）');
const per = {}; rows.forEach(l => { const c = l.split(','); per[+c[col('realm_id') + 1]] = (per[+c[col('realm_id') + 1]] || 0) + 1; });
console.log('每境行数 = ' + JSON.stringify(per));
// 抽查关键格
const pick = [[1,1],[1,10],[2,1],[9,10]];
pick.forEach(([r,l]) => { const row = rows.find(x => { const c = x.split(','); return +c[col('realm_id')+1] === r && +c[col('layer')+1] === l; });
  const c = row.split(','); console.log(`抽查 境${r}第${l}层: hp=${c[col('hp_max')+1]} 暴击=${c[col('crit_rate')+1]} 速度=${c[col('speed')+1]} 神识(${unknown[0]||'-'})=${c[col(unknown[0])+1]||''}`); });
