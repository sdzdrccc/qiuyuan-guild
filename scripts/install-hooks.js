#!/usr/bin/env node
/**
 * 启用本仓的 Git 钩子
 * ==================
 *
 * 把 `core.hooksPath` 指向仓内的 `scripts/hooks/`，让 pre-push 门禁生效
 * （推送前自动跑 `scripts/run-all-checks.js`，即本仓 8 个校验脚本）。
 *
 * 为什么用 core.hooksPath 而不是往 `.git/hooks/` 拷文件：
 *   —— `.git/` 不进版本库，钩子会被 clone 丢掉；`scripts/hooks/` 是受版本管理的。
 *   —— ★ 与隔壁 `gbe-studio` / `gbe-assets` 用**同一套机制**（它们的 pre-push 校版本号）。
 *
 * ★ 来源：`X-0036` §追加「处理盲区问题」（2026-10-13）——
 *   本仓此前无 CI、无 hook ⇒ 8 个脚本没人跑 ⇒ `check-records.js` 的 35 错无人看见。
 *
 * 用法：node scripts/install-hooks.js
 * 撤销：git config --unset core.hooksPath
 * 放行一次：QYD_SKIP_CHECKS=1 git push
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOKS_DIR = 'scripts/hooks';

/**
 * 待实现规则登记位（CONVENTIONS §7.1 纪律 7 · 机制③）。
 * ★ 本脚本是**装机工具**（不判事）⇒ 无待实现规则，空名单即诚实表态。
 */
const PENDING_RULES = [];

/** 纯函数：pre-push 钩子是否在场（供 --self-test 喂合成目录，不碰真仓） */
function prePushPresent(root, hooksDir) {
  return fs.existsSync(path.join(root, hooksDir, 'pre-push'));
}

function selfTest() {
  const cases = [];
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qyd-hooks-'));
  const t = (name, got, want) => cases.push([name, got === want, got, want]);
  t('钩子在场 → true', prePushPresent(tmp, 'scripts/hooks') === false, true); // 空临时目录：先证「不在场」可判
  fs.mkdirSync(path.join(tmp, 'scripts', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'scripts', 'hooks', 'pre-push'), '#!/bin/sh\n');
  t('建了 pre-push → true', prePushPresent(tmp, 'scripts/hooks'), true);
  t('hooks 目录名写错 → false（不静默放行）', prePushPresent(tmp, 'script/hooks'), false);
  let bad = 0;
  console.log('[install-hooks] 反向测试（--self-test）');
  for (const [name, okk, got, want] of cases) {
    if (!okk) bad++;
    console.log(`  ${okk ? '✓' : '✗'} ${name}${okk ? '' : `  → 实际 ${got} / 期望 ${want}`}`);
  }
  console.log(`  结果：${bad ? '不通过' : '通过'}（${cases.length - bad} / ${cases.length}）`);
  process.exit(bad ? 1 : 0);
}

function git(args) {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function main() {
    if (!fs.existsSync(path.join(ROOT, HOOKS_DIR, 'pre-push'))) {
        console.error(`✗ 找不到 ${HOOKS_DIR}/pre-push —— 本脚本需在仓库根目录下运行`);
        process.exit(1);
    }
    try {
        git(['rev-parse', '--is-inside-work-tree']);
    } catch (e) {
        console.error('✗ 当前目录不是 git 仓库');
        process.exit(1);
    }

    git(['config', 'core.hooksPath', HOOKS_DIR]);
    console.log(`✓ core.hooksPath = ${HOOKS_DIR}`);
    console.log('  pre-push 门禁已生效（每次推送会先跑 scripts/run-all-checks.js）');
    console.log('');
    console.log('  撤销：git config --unset core.hooksPath');
    console.log('  放行一次：QYD_SKIP_CHECKS=1 git push');
}

if (process.argv.includes('--self-test')) selfTest();
else main();
