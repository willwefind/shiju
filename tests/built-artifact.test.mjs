// 拾句 · 成品一致性守卫
//
// 根目录 shiju.user.js 是生成物，src/ 才是事实源。
// 谁手改了根文件、或者改了 src/ 忘了拼装，这里当场翻脸。

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildText, ROOT } from '../tools/build-userscript.mjs';

test('根目录成品 = src/ 拼装结果（一字不差）', () => {
  const committed = fs.readFileSync(path.join(ROOT, 'shiju.user.js'), 'utf8').replace(/\r\n/g, '\n');
  const built = buildText();
  if (committed !== built) {
    let i = 0;
    while (i < Math.min(committed.length, built.length) && committed[i] === built[i]) i++;
    const around = s => JSON.stringify(s.slice(Math.max(0, i - 40), i + 40));
    assert.fail(
      `成品与拼装结果在第 ${i} 字符处走样（成品 ${committed.length} / 拼装 ${built.length} 字符）。\n` +
      `  成品：${around(committed)}\n  拼装：${around(built)}\n` +
      '  改了 src/ 要跑 node tools/build-userscript.mjs；根文件本身不许手改。');
  }
});
