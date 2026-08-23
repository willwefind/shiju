// 拾句 · 墨色与对比度决策
//
// 深色纸自动配墨是「换到浓色纸上字读不出来」的救生索（对比度 < 3.2 换对比最好的）。
// 这里钉住决策层的纯函数：WCAG 对比度、bestInk 的取向、明暗 shade、墨色解析。

import test from 'node:test';
import assert from 'node:assert/strict';
import { bootShiju } from './boot.mjs';

test('contrast：黑白对比 = 21（WCAG 满格）', () => {
  const { S } = bootShiju();
  assert.equal(S.contrast([0, 0, 0], [255, 255, 255]), 21);
});

test('bestInk 是全部墨里的对比度 argmax', () => {
  const { S } = bootShiju();
  for (const mean of [[20, 40, 120], [240, 235, 220], [60, 60, 60]]) {
    const pick = S.bestInk(mean);
    const best = Math.max(...S.allInks().map(i => S.contrast(S.hex2rgb(i.c), mean)));
    assert.equal(S.contrast(S.hex2rgb(pick.c), mean), best,
      `纸色 ${mean} 挑的 ${pick.id} 不是对比最高的那支`);
  }
});

test('bestInk 取向：深纸挑浅墨，浅纸挑墨黑', () => {
  const { S } = bootShiju();
  assert.equal(S.bestInk([20, 40, 120]).id, 'paper');   // 克莱因蓝类深纸 → 纸白
  assert.equal(S.bestInk([240, 235, 220]).id, 'black'); // 浅纸 → 墨黑
});

test('inkOf：预设 id / 直接 #rrggbb 都认', () => {
  const { S } = bootShiju();
  assert.equal(S.inkOf('black'), '#12100e');
  assert.equal(S.inkOf('#aabbcc'), '#aabbcc');
  assert.equal(S.allInks().length, S.INKS.length);      // 没自调墨时就是 11 支预设
});

test('shade：0 不变，正往白走，负往黑走，与纸的覆盖层同式', () => {
  const { S } = bootShiju();
  assert.deepEqual(S.shade([100, 100, 100], 0), [100, 100, 100]);
  assert.deepEqual(S.shade([100, 100, 100], 0.25), [139, 139, 139]);
  assert.deepEqual(S.shade([100, 100, 100], -0.25), [75, 75, 75]);
});
