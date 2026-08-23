// 拾句 · 嵌入包契约
//
// 嵌入包 = 存储退路 + 核心 + Studio，不带用户脚本的行李：
// 没有守卫、没有选区监听、没有油猴菜单、没有 window.__shiju 全量导出。
// 这里无头 boot 它，钉住导出面和「排版计划与用户脚本逐字段相同」。

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { bootShiju } from './boot.mjs';
import { makeGauge } from './gauge.mjs';
import { FIXTURES, digest, diffPlans } from './plan-fixtures.mjs';
import { buildVendorText } from '../tools/build-vendor.mjs';

function bootVendor() {
  const tmp = path.join(os.tmpdir(), 'shiju-embed-test.js');
  fs.writeFileSync(tmp, buildVendorText());
  return bootShiju({ script: tmp, expect: '__shijuEmbed' });
}

test('嵌入包起得来：导出面齐、不带用户脚本的行李', () => {
  const { S: E } = bootVendor();
  for (const k of ['SHIJU_VERSION', 'openPanel', 'setStudioLocale', 'installPack', 'planPages', 'renderPage']) {
    assert.ok(k in E, `导出面缺 ${k}`);
  }
  assert.equal(globalThis.__shiju, undefined, '嵌入包不该挂 __shiju');
  // 用户脚本的单例守卫不在包里：documentElement 上不该有标记
  assert.ok(!globalThis.document.documentElement.dataset.shijuRunning, '守卫标记不该出现');
});

test('嵌入包与用户脚本：10 个样本排版计划逐字段相同', () => {
  const { S: E } = bootVendor();
  const vendor = {};
  for (const f of FIXTURES) vendor[f.name] = digest(E, f.st, makeGauge);

  const { S } = bootShiju();          // 正常用户脚本
  const scriptPlans = {};
  for (const f of FIXTURES) scriptPlans[f.name] = digest(S, f.st, makeGauge);

  const diffs = diffPlans(vendor, scriptPlans);
  assert.equal(diffs.length, 0,
    `两种产物的排版漂了 ${diffs.length} 处，第一处 ${diffs[0] && diffs[0].at}`);
});

test('嵌入包版本与 manifest 一致', () => {
  const { S: E } = bootVendor();
  const manifest = JSON.parse(fs.readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
  assert.equal(E.SHIJU_VERSION, manifest.version);
});
