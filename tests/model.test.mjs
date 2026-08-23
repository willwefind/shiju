// 拾句 · 内容/样式模型契约
//
// 钉住三件事：版式白名单与默认值的同构关系、titleScale→titleSize 一次性迁移、
// 素材包键的缺省行为。这些是拆分「模型层」时最容易踩碎的地面。

import test from 'node:test';
import assert from 'node:assert/strict';
import { bootShiju, readCfg } from './boot.mjs';

test('STYLE_KEYS 全部在 DEF 里，内容键全不在', () => {
  const { S } = bootShiju();
  assert.equal(S.STYLE_KEYS.length, 29);
  for (const k of S.STYLE_KEYS) assert.ok(k in S.DEF, `STYLE_KEYS 的 ${k} 不在 DEF`);
  for (const k of ['text', 'title', 'source', 'date']) {
    assert.ok(!S.STYLE_KEYS.includes(k), `内容键 ${k} 混进了版式白名单`);
  }
});

test('内置版式的 style 只用白名单里的键', () => {
  const { S } = bootShiju();
  assert.equal(S.BUILTIN_PRESETS.length, 4);
  for (const p of S.BUILTIN_PRESETS) {
    for (const k of Object.keys(p.style)) {
      assert.ok(S.STYLE_KEYS.includes(k), `版式「${p.name}」的 ${k} 不在 STYLE_KEYS`);
    }
  }
});

test('titleSize 默认是绝对像素，quoteInk 键存在', () => {
  const { S } = bootShiju();
  assert.equal(S.DEF.titleSize, 69);
  assert.equal(S.DEF.quoteInk, 'auto');
});

test('迁移：titleScale 百分比 → titleSize 绝对像素', () => {
  // 有正文字号：40 × 150% = 60
  const a = bootShiju({ storage: { titleScale: 150, fontSize: 40 } });
  assert.equal(readCfg(a.store, 'titleSize'), 60);
  // 没存过正文字号：用 DEF.fontSize 46 × 150% = 69
  const b = bootShiju({ storage: { titleScale: 150 } });
  assert.equal(readCfg(b.store, 'titleSize'), 69);
  // titleSize 已存在：迁移不许碰
  const c = bootShiju({ storage: { titleSize: 80, titleScale: 150 } });
  assert.equal(readCfg(c.store, 'titleSize'), 80);
});

test('迁移：存下来的版式一起迁，style 里的 titleScale 彻底移除', () => {
  const { store } = bootShiju({
    storage: { presets: [{ id: 'p1', name: '旧版式', style: { fontSize: 50, titleScale: 120 } }] },
  });
  const ps = readCfg(store, 'presets');
  assert.equal(ps[0].style.titleSize, 60);              // 50 × 120%
  assert.ok(!('titleScale' in ps[0].style), '旧键该从版式里消失');
});

test('素材包：没装过时 packs() 返回空数组（packs 键不在 DEF，靠兜底）', () => {
  const { S } = bootShiju();
  assert.deepEqual(S.packs(), []);
});
