// 拾句 · 全屏：自己要来的自己还，别人开的不动
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './boot.mjs';

const src = fs.readFileSync(path.join(ROOT, 'src/studio/studio-full.js'), 'utf8');
function boot({ grant = true, has = true, already = false } = {}) {
  const doc = { fullscreenElement: already ? {} : null, left: 0, asked: 0,
    exitFullscreen() { doc.left++; doc.fullscreenElement = null; return Promise.resolve(); } };
  doc.documentElement = has ? { requestFullscreen() { doc.asked++; if (!grant) return Promise.reject(new Error('no')); doc.fullscreenElement = doc.documentElement; return Promise.resolve(); } } : {};
  const api = new Function('document', 't', src + '\nreturn { fullAsk, fullLeave, own: () => fullOwn };')(doc, k => k);
  return { doc, ...api };
}
const tick = () => new Promise(r => setTimeout(r, 0));

test('要到了，退的时候还回去', async () => {
  const f = boot(); f.fullAsk(() => true); await tick();
  assert.equal(f.doc.asked, 1); f.fullLeave();
  assert.equal(f.doc.left, 1); f.fullLeave(); assert.equal(f.doc.left, 1);
});
test('浏览器没有这个接口、或者不肯给：不报错，也不去退', async () => {
  for (const o of [{ has: false }, { grant: false }]) {
    const f = boot(o); f.fullAsk(() => true); await tick(); f.fullLeave();
    assert.equal(f.doc.left, 0); assert.equal(f.own(), false);
  }
});
test('网页自己已经全屏着：不要，也不替它退', async () => {
  const f = boot({ already: true }); f.fullAsk(() => true); await tick(); f.fullLeave();
  assert.equal(f.doc.asked, 0); assert.equal(f.doc.left, 0);
});
test('等答复的当口面板关了：到手的全屏还回去', async () => {
  const f = boot(); f.fullAsk(() => false); await tick();
  assert.equal(f.doc.left, 1); assert.equal(f.own(), false);
});
