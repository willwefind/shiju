// 拾句 · URL 素材包（嵌入方登记的静态素材）
//
// 图不进存储、不占配额；与存储包并列出现，key 撞了存储包优先；
// 重复登记 = 整体替换（幂等）。这是阅读器 vendor 信纸的地基。

import test from 'node:test';
import assert from 'node:assert/strict';
import { bootShiju } from './boot.mjs';

const URL_SETS = [
  { key: 'u01', group: 'soft', en: 'mist', cn: '雾白', mean: [240, 240, 238],
    portrait: 'vendor/papers/u01_portrait.webp', landscape: 'vendor/papers/u01_landscape.webp' },
  { key: 'u02', group: 'bold', en: 'deep', cn: '深靛', mean: [30, 40, 90],
    portrait: 'vendor/papers/u02_portrait.webp', landscape: 'vendor/papers/u02_landscape.webp' },
  { key: 'bad-no-img', cn: '没图的要被筛掉' },
];

test('登记后 packs() 合并出现，无效条目被筛掉', () => {
  const { S } = bootShiju();
  assert.deepEqual(S.packs(), []);
  const n = S.registerUrlPack(URL_SETS);
  assert.equal(n, 2);
  assert.deepEqual(S.packs().map(s => s.key), ['u01', 'u02']);
});

test('packImg 直接用 URL 当 src，横竖各取各的', async () => {
  // PLATFORM 在脚本加载那一刻就把 __shijuPlatform assign 进去了，
  // 所以记录桩必须在 boot 时注入，事后改没用。
  const { makeGauge } = await import('./gauge.mjs');
  const seen = [];
  const platform = {
    canvas(w, h) { return { width: w ?? 300, height: h ?? 150, getContext() { return makeGauge(); } }; },
    image() {
      const im = { complete: false, naturalWidth: 0, onload: null, onerror: null };
      Object.defineProperty(im, 'src', { set(v) { seen.push(v); }, get() { return seen[seen.length - 1]; } });
      return im;
    },
  };
  const { S } = bootShiju({ platform });
  S.registerUrlPack(URL_SETS);
  S.packImg('u02', 'portrait');
  S.packImg('u02', 'landscape');
  assert.deepEqual(seen, ['vendor/papers/u02_portrait.webp', 'vendor/papers/u02_landscape.webp']);
});

test('paperMean 用登记的 mean，深纸自动配浅墨', () => {
  const { S } = bootShiju();
  S.registerUrlPack(URL_SETS);
  assert.deepEqual(S.paperMean('pk:u02', 0), [30, 40, 90]);
  assert.equal(S.bestInk(S.paperMean('pk:u02', 0)).id, 'paper');   // 深靛 → 纸白
});

test('与存储包并列；key 相撞时存储包优先', () => {
  const { S } = bootShiju({ storage: { packs: [
    { key: 'st01', cn: '存储包', mean: [250, 250, 250], portrait: 'data:image/webp;base64,x' },
    { key: 'u01', cn: '存储版U01', mean: [1, 2, 3], portrait: 'data:image/webp;base64,y' },
  ] } });
  S.registerUrlPack(URL_SETS);
  const keys = S.packs().map(s => s.key);
  assert.deepEqual(keys, ['st01', 'u01', 'u01', 'u02']);
  // packSet 语义 = find 先出现的 → paperMean 取存储版
  assert.deepEqual(S.paperMean('pk:u01', 0), [1, 2, 3]);
});

test('重复登记整体替换；登记空数组即清空', () => {
  const { S } = bootShiju();
  S.registerUrlPack(URL_SETS);
  assert.equal(S.packs().length, 2);
  S.registerUrlPack([URL_SETS[0]]);
  assert.deepEqual(S.packs().map(s => s.key), ['u01']);
  S.registerUrlPack([]);
  assert.deepEqual(S.packs(), []);
});

test('installPack 之后 URL 包仍在（合并视图重算而不是被顶掉）', async () => {
  const { S } = bootShiju();
  S.registerUrlPack(URL_SETS);
  const packText = JSON.stringify({ sets: [
    { key: 'imp01', cn: '导入的', mean: [200, 200, 200], portrait: 'data:image/webp;base64,z' },
  ] });
  const n = await S.installPack(packText, { warm: false });
  assert.equal(n, 1);
  assert.deepEqual(S.packs().map(s => s.key), ['imp01', 'u01', 'u02']);
});
