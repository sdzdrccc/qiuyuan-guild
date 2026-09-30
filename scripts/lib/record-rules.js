'use strict';

/**
 * record-rules.js —— 记录解析的**共享判据**（单一真源）
 *
 * ── 为什么单独成文件 ────────────────────────────────────────
 * 同一条判据**要在两处用**：
 *   · `check-records.js` 的 `C4` —— 改了契约 ⇒ 级别须 L3 终审；
 *   · `gen-agent-log.js`  §三   —— 「契约变更次数」计数。
 * 若各写一份，即 `CONVENTIONS.md` §1.1 铁律所指的「**同一事实写两处**」——
 * 两处必然漂移，且**漂移时没人会发现**（一个改了、另一个照旧绿着）。
 *
 * ★ 本模块**只放纯函数**：不读文件、不碰 git、不打印、不 exit。
 *   判据的口径与踩坑史见各自调用点（`check-records.js` C4 注释最详）。
 */

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

/**
 * 纯函数：抽出「主体名以 `kw` 开头且其后不是汉字」的节的正文（无 → `null`）。
 * **同样要求主体开头**（防「标题里顺带提到该词」被误认）。
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
 * 纯函数：记录是否**真的改了**契约。
 *
 * **三道同时成立**（`X-0018` §遗留 5 的收窄 · 原判据 `正文出现 contracts/` 误报 4 篇存量）：
 *   ① **范围**：只看「改动清单」节 —— **找不到该节则回退全文**（宁可误报，**不可漏报**）；
 *   ② **形态**：须命中 `contracts/<文件名>.md`（**光写目录名不算** —— 排除「扫描 `contracts/`」那类枚举）；
 *   ③ **否定豁免**：同一行出现「未改 / 未动 / 只读 / 待补 / 无变更 …」时放行（该行是在**否认**改动）。
 *
 * > **过宽会误报（立刻暴露）；过窄会漏判（一直绿灯）** —— 后者才是真危险（`REVIEW-PROCESS` 坑 8）。
 */
function touchesContracts(text) {
  const t = String(text);
  const sec = sectionByKeyword(t, '改动清单');
  const scope = sec === null ? t : sec;
  return scope.split(/\r?\n/).some(l =>
    /contracts\/[\w.-]+\.md/.test(l) &&
    !/未改|未动|不改|未触及|只读|不涉及|未修改|待补|无变更/.test(l));
}

module.exports = { headingName, sectionByKeyword, touchesContracts };
