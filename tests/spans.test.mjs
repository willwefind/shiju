// 拾句 · 局部样式（选中的那几个字单独改）
//
// 三块地面：① 样式跟着自己的字走（改字之后不许错位）；② 排版：折行按各自的字号量、
// 行高跟着最大的字、行与样式一一对应；③ 一处都没改过时，排版与从前逐字段相同。

import test from 'node:test';
import assert from 'node:assert/strict';
import { bootShiju } from './boot.mjs';
import { makeGauge } from './gauge.mjs';
import { FIXTURES, digest, diffPlans } from './plan-fixtures.mjs';

const { S } = bootShiju();
const base = over => ({ ...FIXTURES[0].st, title: '', ...over });

test('paintSpans：叠加、拆分、合并、单项还原', () => {
  let sp = S.paintSpans([], 10, 2, 6, { size: 80 });
  assert.deepEqual(sp, [{ s: 2, e: 6, size: 80 }]);
  sp = S.paintSpans(sp, 10, 4, 8, { ink: 'crimson' });
  assert.deepEqual(sp, [{ s: 2, e: 4, size: 80 }, { s: 4, e: 6, size: 80, ink: 'crimson' },
                        { s: 6, e: 8, ink: 'crimson' }]);
  sp = S.paintSpans(sp, 10, 0, 10, { size: null });
  assert.deepEqual(sp, [{ s: 4, e: 8, ink: 'crimson' }]);
  sp = S.paintSpans(sp, 10, 0, 10, { size: null, font: null, ink: null, weight: null });
  assert.deepEqual(sp, []);
});

test('脏数据：越界、反序、坏值都不炸，字号夹在 12–300', () => {
  assert.equal(S.richOf([{ s: 5, e: 2, size: 80 }, { s: 0, e: 9, size: 'x' }, null], 6, { size: 46, stack: 'a', weight: 0 }, base()), null);
  assert.deepEqual(S.paintSpans([], 3, -5, 99, { size: 9999 }), [{ s: 0, e: 3, size: 300 }]);
  assert.ok(S.planPages(base({ spans: 'oops', titleSpans: 42 }), makeGauge).pages.length);
});

test('改字之后样式跟着自己的字走', () => {
  const sp = [{ s: 2, e: 4, size: 80 }];                                 // 甲乙【丙丁】戊己
  const go = (now, caret) => S.shiftSpans(sp, '甲乙丙丁戊己', now, caret);
  assert.deepEqual(go('啊甲乙丙丁戊己', 1), [{ s: 3, e: 5, size: 80 }]);  // 前面插
  assert.deepEqual(go('甲乙丙啊丁戊己', 4), [{ s: 2, e: 5, size: 80 }]);  // 中间插：跟着
  assert.deepEqual(go('甲乙丙丁啊戊己', 5), sp);                          // 贴尾巴写：不跟
  assert.deepEqual(go('甲乙啊丙丁戊己', 3), [{ s: 3, e: 5, size: 80 }]);  // 贴头写：不跟
  assert.deepEqual(go('甲丁戊己', 1), [{ s: 1, e: 2, size: 80 }]);        // 删跨界
  assert.deepEqual(go('甲乙新戊己', 3), [{ s: 2, e: 3, size: 80 }]);      // 选中替换：跟首字
  assert.deepEqual(go('', 0), []);
});

test('重复的字：插在哪一个后面，光标说了算', () => {
  const sp = [{ s: 0, e: 1, size: 80 }];                                 // 【啊】啊啊
  assert.deepEqual(S.shiftSpans(sp, '啊啊啊', '啊啊啊啊', 1), [{ s: 1, e: 2, size: 80 }]);
  assert.deepEqual(S.shiftSpans(sp, '啊啊啊', '啊啊啊啊', 4), sp);
});

test('折行按各自的字号量，行高跟着最大的字，没改过的行一动不动', () => {
  const text = '一二三四五六七八九十'.repeat(6);                         // 版心 872，46px → 每行 18 字
  const plain = S.planPages(base({ text }), makeGauge).pages[0];
  assert.equal(plain[0].text.length, 18);
  const rows = S.planPages(base({ text, spans: [{ s: 2, e: 6, size: 92 }] }), makeGauge).pages[0];
  assert.equal(rows[0].text.length, 14);                                  // 4×92 + 10×46 = 828
  assert.equal(rows[0].h, Math.round(92 * 1.72));
  assert.equal(rows[0].rich.length, rows[0].text.length);
  assert.equal(rows[1].h, Math.round(46 * 1.72));
  assert.ok(!rows[1].rich, '没改过的行不该带样式');
  assert.equal(rows.map(r => r.text).join(''), text);
});

test('任何一行都不冲出版心（避尾拉下来的开引号也算宽）', () => {
  const p = '院子里的光从东墙上下来。他说：「『没有人催它』，它也不急。」——还有半句……';
  for (let a = 0; a < p.length; a++) {
    const st = base({ text: '甲'.repeat(a % 18) + p, spans: [{ s: a, e: a + 8, size: 64 + a }] });
    const plan = S.planPages(st, makeGauge), g = makeGauge();
    for (const it of plan.pages.flat()) {
      if (it.gap) continue;
      let w = 0;
      for (let i = 0; i < it.text.length; i++) {
        g.font = `${it.rich ? it.rich[i].size : st.fontSize}px x`;
        w += g.measureText(it.text[i]).width;
      }
      assert.ok(w <= plan.COL + 0.01, `行宽 ${w} > 版心 ${plan.COL}：${it.text}`);
    }
  }
});

test('下标认的是原文：段首空白、空行、行尾空格都不许让样式错位', () => {
  const text = '  　首行 \n\n\n\n次段开头 \t\n  第二行红字在此';
  const at = text.indexOf('红字');
  const rows = S.planPages(base({ text, spans: [{ s: at, e: at + 2, ink: '#ff0000' }] }), makeGauge).pages.flat();
  const hit = rows.filter(r => r.rich);
  assert.equal(hit.length, 1);
  assert.equal([...hit[0].text].filter((_, i) => hit[0].rich[i].ink === '#ff0000').join(''), '红字');
});

test('标题也吃：首尾空白不算，行高跟着大字', () => {
  const tb = S.titleBlock({ ...base({ title: '  返潮的纸 ' }), titleSpans: [{ s: 5, e: 6, size: 120 }] }, 872, 600, makeGauge);
  assert.deepEqual(tb.lines, ['返潮的纸']);
  assert.equal(tb.rows[0].h, Math.round(120 * 1.42));
  assert.deepEqual(tb.rows[0].rich.map(r => r.size), [69, 69, 69, 120]);
});

test('竖排：列高按各自的字号推进，列宽跟着最大的字', () => {
  const text = '一二三四五六七八九十'.repeat(8);
  const rows = S.planPages(base({ text, vertical: true, spans: [{ s: 0, e: 3, size: 92 }] }), makeGauge).pages[0];
  assert.equal(rows[0].h, Math.round(92 * 1.72));
  assert.ok(rows[0].text.length < rows[1].text.length);
  const g = makeGauge();
  // 两个英文词样式不同，中间的空格仍按西文空格推进，不占一个汉字
  const a = { size: 40, stack: 'x' }, b = { size: 40, stack: 'x' };
  g.font = '40px x';
  assert.equal(S.vAdvance(g, 'ab cd', 40, [a, a, a, b, b]), S.vAdvance(g, 'ab cd', 40));
});

test('一处都没单独改过：排版与从前逐字段相同', () => {
  const a = {}, b = {};
  for (const f of FIXTURES) {
    a[f.name] = digest(S, f.st, makeGauge);
    b[f.name] = digest(S, { ...f.st, spans: [], titleSpans: [] }, makeGauge);
  }
  assert.equal(diffPlans(a, b).length, 0);
});

test('局部样式是内容不是版式：不进 STYLE_KEYS', () => {
  for (const k of ['spans', 'titleSpans']) assert.ok(!S.STYLE_KEYS.includes(k));
});
