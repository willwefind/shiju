// 拾句 · 折行微行为
//
// 避头尾的两条根规矩，单拎出来各站一班岗（golden 里它们也在，但这里红得更可读）：
// 句读不站行首（塞不下就「追出」上一行末字），开引号不站行尾（拉到下一行）。

import test from 'node:test';
import assert from 'node:assert/strict';
import { bootShiju } from './boot.mjs';
import { makeGauge } from './gauge.mjs';

test('避头：句号不站行首，追出上一行末字', () => {
  const { S } = bootShiju();
  const g = makeGauge();
  g.font = '46px 测试';
  // 版心宽 = 5 个汉字：naive 折法是「一二三四五 / 。六七」，句号站头。
  // 正确行为：追出「五」，得「一二三四 / 五。六七」。
  assert.deepEqual(S.wrap(g, '一二三四五。六七', 46 * 5, 0), ['一二三四', '五。六七']);
});

test('避尾：开引号不站行尾，拉到下一行', () => {
  const { S } = bootShiju();
  const g = makeGauge();
  g.font = '46px 测试';
  // 版心宽 = 4 个汉字：naive 折法是「一二三「 / 四五六七」，开引号吊在行尾。
  assert.deepEqual(S.wrap(g, '一二三「四五六七', 46 * 4, 0), ['一二三', '「四五六七']);
});

test('英文整词不拦腰断开', () => {
  const { S } = bootShiju();
  const g = makeGauge();
  g.font = '46px 测试';
  // mixed-width-sample 在假量具下宽 18×0.52em ≈ 9.36 个汉字位，
  // 版心只给 6 个汉字位：整词必须整体下行，绝不能从中间剁开。
  const lines = S.wrap(g, '前面几个字mixed-width-sample后面', 46 * 6, 0);
  assert.ok(lines.some(l => l.includes('mixed-width-sample')),
    `整词被剁开了：${JSON.stringify(lines)}`);
});
