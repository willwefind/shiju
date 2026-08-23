// 拾句 · 排版计划 golden 回归
//
// 这是重构的总闸：10 个样本的排版计划（分行、避头尾、分页、占位、几何）
// 必须与 tests/golden-plans.json 逐字段相同。红了先怀疑代码，不是先重跑 golden
// （重跑的唯一正当理由：有意改变排版行为且已确认新行为正确）。

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bootShiju } from './boot.mjs';
import { makeGauge } from './gauge.mjs';
import { FIXTURES, digest, diffPlans } from './plan-fixtures.mjs';

const golden = JSON.parse(fs.readFileSync(new URL('./golden-plans.json', import.meta.url), 'utf8'));

test('排版计划与 golden 逐字段一致', () => {
  const { S } = bootShiju();
  const got = {};
  for (const f of FIXTURES) got[f.name] = digest(S, f.st, makeGauge);
  const diffs = diffPlans(got, golden);
  const brief = diffs.slice(0, 5).map(d => `${d.at}: ${JSON.stringify(d.a)} ≠ ${JSON.stringify(d.b)}`);
  assert.equal(diffs.length, 0, `plans 漂了 ${diffs.length} 处：\n  ` + brief.join('\n  '));
});

test('量具共用一块 = 每次新造（font 时序不变量）', () => {
  // chrome() 量题头时会把量具 font 改成 22/26px；正文字号必须在那之后再设。
  // 这条不变量只写在注释里，这里给它站一班岗：共用一块量具跑出的计划
  // 必须与每次新造逐字段相同。
  const { S } = bootShiju();
  const fresh = {};
  for (const f of FIXTURES) fresh[f.name] = digest(S, f.st, makeGauge);
  const one = makeGauge();
  const shared = {};
  for (const f of FIXTURES) shared[f.name] = digest(S, f.st, () => one);
  const diffs = diffPlans(fresh, shared);
  assert.equal(diffs.length, 0,
    `共用量具时排版变了 ${diffs.length} 处，第一处 ${diffs[0] && diffs[0].at}`);
});

test('样本确实走到了它声称的路径', () => {
  // 防未来改样本文字改到「多页样本只排出一页」而没人发现
  assert.equal(golden['强制三页'].pages.length, 3, '强制三页要真有三页');
  assert.equal(golden['竖排强制两页'].pages.length, 2, '竖排强制两页要真有两页');
  assert.ok(golden['自动多页'].pages.length >= 2, '自动多页至少两页');
  assert.ok(golden['长题头长出处'].chrome.headLines.length >= 2, '长题头要真折行');
  assert.ok(golden['长题头长出处'].chrome.srcLines.length >= 2, '长出处要真折行');
  assert.ok(golden['长题头长出处'].title.lines.length >= 2, '96px 长标题要真折行');
  assert.ok(golden['竖排正文竖标题'].title.vertical, '竖标题要真竖排');
  assert.equal(golden['横版英文混排'].W, 1350, '横版宽 1350');
});
