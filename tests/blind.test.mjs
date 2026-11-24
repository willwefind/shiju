// 拾句 · 版式盲盒
//
// 钉住：同一颗种子永远拆出同一张；拆完一个字都不丢、不出界、不压正文；
// 没有字就照普通版式；配色读得出来；散星/断句不许打乱语序。

import test from 'node:test';
import assert from 'node:assert/strict';
import { bootShiju } from './boot.mjs';
import { makeGauge } from './gauge.mjs';
import { FIXTURES } from './plan-fixtures.mjs';

const { S } = bootShiju();
const TEXTS = {
  '一句': '雪落在信上。',
  '短': '我把灯留着，等雪停。你若回来，不必敲门。',
  '英': 'I kept the lamp on until the snow stopped. If you come back, do not knock; the door remembers you.',
  '混': 'iPhone 响了三声，我没接——😀窗外 12 点的钟「当」了一下。',
  ...Object.fromEntries(FIXTURES.map(f => [f.name, f.st.text])),
};
const st = (text, seed, over = {}) => ({ ...FIXTURES[0].st, title: '', text, spans: [], titleSpans: [], blind: { seed }, ...over });
const plan = (...a) => S.planPages(st(...a), makeGauge);
const strip = p => JSON.stringify(p.blind.B.layers.map(l => [l.role, l.fx, l.ops.map(o => [o.k, o.t, o.x, o.y, o.s, o.c])]));

test('同一颗种子、同一段字，永远是同一张', () => {
  for (const seed of [1, 7, 123456789, 4294967295]) {
    assert.equal(strip(plan(TEXTS['短'], seed)), strip(plan(TEXTS['短'], seed)));
  }
  assert.notEqual(strip(plan(TEXTS['短'], 1)), strip(plan(TEXTS['短'], 2)));
});

test('一个字都不丢：要么海报里有全文，要么全文在内页', () => {
  for (const [name, text] of Object.entries(TEXTS)) for (let i = 0; i < 60; i++) {
    for (const orient of ['portrait', 'landscape']) {
      const p = plan(text, i * 7919 + 3, { orient });
      assert.ok(p.blind, `${name} #${i} 没拆出来`);
      const { B } = p.blind, have = new Map();
      const add = (s, d) => { for (const c of s) if (!/[\s\p{P}\p{S}]/u.test(c)) have.set(c, (have.get(c) || 0) + d); };
      if (p.blind.inner) for (const it of p.blind.inner.pages.flat()) add(it.text || '', 1);
      else for (const l of B.layers) if (l.read || (B.solo && l.role === 'hero')) for (const o of l.ops) add(o.t || '', 1);
      add(text, -1);
      for (const [c, n] of have) assert.ok(n >= 0, `${name} #${i} ${orient} ${p.blind.comp} 丢了「${c}」`);
    }
  }
});

test('字不出纸，正文不小于 18px', () => {
  for (const text of Object.values(TEXTS)) for (let i = 0; i < 40; i++) {
    const p = plan(text, i * 104729 + 11);
    for (const l of p.blind.B.layers) {
      if (l.bleed || l.role === 'deco' || l.role === 'back') continue;
      for (const o of l.ops) if ('glv'.includes(o.k)) {
        assert.ok(o.x > -5 && o.x < p.W + 5 && o.y > -5 && o.y < p.H + 5, `${p.blind.comp} 有字在纸外`);
        if (l.role === 'body') assert.ok(o.s >= 18, `${p.blind.comp} 正文太小 ${o.s}`);
      }
    }
  }
});

test('错落、骰子、底里的话：读的顺序不乱，从上往下（竖排从右往左）', () => {
  for (const comp of ['stagger', 'steps', 'underlay', 'tate', 'rain', 'axis']) for (let i = 0; i < 40; i++) {
    const p = plan(TEXTS['短'], i, { blind: { seed: i, comp } });
    if (p.blind.comp !== comp) continue;
    const ops = p.blind.B.layers.filter(l => l.read).flatMap(l => l.ops).filter(o => o.at !== undefined).sort((x, y) => x.at - y.at);
    assert.equal(ops.map(o => o.t).join('').replace(/[，。]/g, ''), '我把灯留着等雪停你若回来不必敲门', comp);
    for (let k = 1; k < ops.length; k++) { const A = ops[k - 1], B = ops[k]; assert.ok(B.x > A.x - 1 || B.y > A.y + 1 || B.x < A.x - 1 && Math.abs(B.x - A.x) > 8, `${comp} 种子 ${i} 第 ${k} 个字往回跑了`); }
  }
});

test('🔒 钉住：改样式不换脸 —— 版面、位置、方案、主角都不动，只有那几个字变', () => {
  const text = TEXTS['短'];
  for (let seed = 1; seed < 60; seed++) {
    const a = plan(text, seed), pin = { seed, ...a.blind.pin }, at = text.indexOf('回来');
    const b = plan(text, seed, { blind: pin }), c = plan(text, seed, { blind: pin, spans: [{ s: at, e: at + 2, weight: 2, ink: '#ff0000', alpha: .5 }] });
    assert.equal(b.blind.comp, a.blind.comp); assert.equal(c.blind.comp, a.blind.comp);
    const geo = p => JSON.stringify(p.blind.B.layers.filter(l => !l.twin).map(l => l.ops.map(o => [o.t, o.x, o.y, o.s])));
    assert.equal(geo(b), geo(c), `种子 ${seed} ${a.blind.comp} 换了脸`);
    const hit = c.blind.B.layers.flatMap(l => l.ops).filter(o => o.styled);
    assert.ok(hit.length, `种子 ${seed} ${a.blind.comp} 样式没盖上`);
  }
});

test('意象字：图是回声，正文另有全文；每个字都有画法', () => {
  for (const [ch, kind] of S.B_IMAGE_OF) assert.ok(S.B_PICTO[kind], ch);
  for (let i = 0; i < 60; i++) { const p = plan('山在那里，你不必问我为什么。', i, { blind: { seed: i, comp: 'image' } }); if (p.blind.comp === 'image') assert.ok(p.blind.B.layers.some(l => l.read)); }
});

test('🔒 图形和线条一件都不掷；玻璃片（局部模糊）可以；落花积雪也算图形', () => {
  const pane = new Set(S.B_SHAPES.pane); let panes = 0, fx = new Set(), post = new Set(), looks = new Set();
  for (const [n, t] of Object.values(TEXTS).entries()) for (let i = 0; i < 260; i++) {
    const p = plan(t, i * 17 + n * 100003); if (!p.blind) continue;
    for (const q of p.blind.B.items){ assert.ok(pane.has(q.id) && q.id !== 'lens', q.id); panes++; }
    p.blind.name.fx.forEach(f => fx.add(f)); p.blind.B.post.forEach(f => post.add(f)); looks.add(p.blind.look.id);
  }
  assert.ok(!fx.has('petals') && !fx.has('snow'));
  // 一样都不许收：效果和修图，除了图形那两样，都掷得到
  assert.ok(panes > 3); assert.equal(looks.size, S.BLIND_LOOKS.length, [...looks].join());
  for (const f of S.B_FX_ORDER) if (!['petals', 'snow'].includes(f)) assert.ok(fx.has(f), `「${f}」掷不到`);
  for (const f of S.B_POST_ORDER) assert.ok(post.has(f), `「${f}」掷不到`);
});

test('气氛：亮底的不配暗底，底都画得出来，钉住以后换颜色也不跳', () => {
  for (const k of S.BLIND_LOOKS) { for (const g of k.grounds) assert.ok(S.BLIND_GROUND[g], g); for (const f of k.hero === 'own' ? [] : k.hero.flat()) assert.ok(S.BLIND_FX[f], f); for (const f of k.post.flat()) assert.ok(S.BLIND_POST[f], f); }
  for (let i = 0; i < 200; i++) {
    const p = plan(TEXTS['短'], i * 13), k = p.blind.look; assert.ok(S.bLookOk(k, p.blind.pal), k.id);
    const q = plan(TEXTS['短'], 0, { blind: { seed: i * 13, ...p.blind.pin, seeds: { pal: 99 + i } } }); assert.equal(q.blind.look.id, k.id);
  }
});

test('🔒 不掷泥：暗褐、橄榄、土黄不进盲盒；底上化开的颜色是一家人', () => {
  let n = 7; const rnd = () => { n = (n * 1103515245 + 12345) & 0x7fffffff; return n / 0x7fffffff; };
  const E = pal => ({ rnd, R: (a, b) => a + (b - a) * rnd(), maybe: p => rnd() < p, P: a => a[Math.floor(rnd() * a.length)], pal, dark: pal.m === 'night' });
  for (let i = 0; i < 600; i++) {
    const pal = plan(TEXTS['短'], i * 7).blind.pal; if (pal.paper) continue;
    const g = S.bLch(pal.g); assert.ok(!S.bIsMud(...g) && !(g[0] < .45 && g[1] > .012 && g[2] > 26 && g[2] < 165), `种子 ${i * 7} 底 ${pal.name} ${pal.g}`);
    for (const k of ['a', 'b']) { const [L, C, h] = S.bLch(pal[k]); assert.ok(!(k === 'a' && L < .64 && C > .03 && C < .14 && h > 62 && h < 134), `${pal.name} 点睛是泥 ${pal[k]}`); }
    assert.ok(S.contrast(S.hex2rgb(pal.a), S.hex2rgb(pal.g)) >= 2.1, pal.name);
    for (let k = 0; k < 4; k++) {
      const cs = S.bGlowColors(E(pal)).map(S.bLch);
      for (const c of cs) if (g[0] < .34) assert.ok(!S.bIsMud(...c), `${pal.name} 化出了泥 ${c}`);
      for (const c of cs) for (const d of cs) if (c[1] > .03 && d[1] > .03) assert.ok(S.bHueGap(c[2], d[2]) < 78, `${pal.name} 隔得太远 ${c[2]} ${d[2]}`);
    }
  }
});

test('长文：认得出段落、引语、问句；长文有自己的排法，一个字不丢', () => {
  const t = '夜里起了风。\n「你还记得那盏灯吗？」\n我说记得，它一直亮着，亮到后来谁也不去关它，仿佛关了就会惊动什么。\n他没有说话。\n窗外的树影晃来晃去，像有人在纸上反复涂改同一句话，涂了又写，写了又涂，最后只剩下一个很淡的轮廓。\n「那就让它亮着吧。」\n我们坐了很久，久到茶凉了，久到街上最后一个人也走远了。';
  const ps = S.bParas(t, true); assert.deepEqual(ps.map(p => +p.quote), [0, 1, 0, 0, 0, 1, 0]); assert.ok(ps[1].ask && ps[3].short); for (const p of ps) assert.equal(t.slice(p.at, p.at + p.t.length), p.t);
  const long = t + '\n' + t.replace(/夜里/, '后来'), seen = new Set(); let own = 0;
  for (let i = 0; i < 160; i++){ const p = plan(long, i * 11); seen.add(p.blind.comp); if (S.BLIND_LONG.some(c => c.id === p.blind.comp)) own++; }
  assert.ok(own > 110, `160 张里只有 ${own} 张是长文的排法`); assert.ok(seen.size >= 9, [...seen].join());
  for (const c of S.BLIND_LONG){ let k = 0; for (const x of [t, long, '院子里的光是从东墙上下来的，先落在水缸沿上。' + t]) for (let i = 0; i < 24; i++) if (plan(x, 0, { blind: { seed: i * 5 + 1, comp: c.id } }).blind.comp === c.id) k++; assert.ok(k > 3, `${c.id} 排不出来`); }
});

test('成套：每种气氛都写了配哪几类字；暗底上没有大金字；长文不过糊字的修图', () => {
  for (const k of S.BLIND_LOOKS) assert.ok((S.B_ART[k.id] || []).length >= 2, k.id);
  for (let i = 0; i < 300; i++){
    const { B, pal } = plan(TEXTS['短'], i * 19).blind, [L, C, h] = S.bLch(pal.a); if (!B.dark || h < 46 || h > 108 || C < .07) continue;
    for (const l of B.layers) if (l.role === 'hero' && !l.twin && !l.mask && !l.onAccent && S.blindAvg(l) > 64) for (const o of l.ops) assert.notEqual(o.c, pal.a, `种子 ${i * 19} ${B.look.id}`);
  }
});

test('常用版式：换一段字，方案、气氛、颜色、字体照旧；跟原文绑着的放开', () => {
  const a = plan(TEXTS['短'], 77), bl = { seed: 77, ...a.blind.pin, pal: a.blind.pal, move: { 0: { dx: 9 } } };
  const same = S.blindFor(bl, TEXTS['短'], ''); assert.equal(same, bl);
  const b = S.blindFor(bl, '风从北边来，雪落在南边。谁也没有问它们。', ''); assert.ok(!b.hero && !b.move && b.comp === bl.comp && b.look === bl.look);
  let ok = 0; for (let i = 0; i < 60; i++) { const x = plan(TEXTS['短'], i), y = plan('风从北边来，雪落在南边。谁也没有问它们。', 0, { blind: S.blindFor({ seed: i, ...x.blind.pin, pal: x.blind.pal }, '风从北边来，雪落在南边。谁也没有问它们。', '') }); assert.equal(y.blind.look.id, x.blind.look.id); assert.equal(y.blind.pal.g, x.blind.pal.g); if (y.blind.comp === x.blind.comp) ok++; }
  assert.ok(ok > 48, `60 次里只有 ${ok} 次方案没变`);
});

test('自己选中改过的字，多半会被拆成主角', () => {
  const text = TEXTS['短'], at = text.indexOf('等雪停');
  let hit = 0;
  for (let i = 0; i < 80; i++) {
    const p = plan(text, i * 31 + 5, { spans: [{ s: at, e: at + 3, size: 90 }] });
    if (p.blind.B.hero && p.blind.B.hero.t === '等雪停') hit++;
  }
  assert.ok(hit > 40, `80 次里只有 ${hit} 次`);
});

test('同一个盒子里花样要多：一段短文至少拆得出 15 种构图', () => {
  const kinds = new Set();
  for (let i = 0; i < 400; i++) kinds.add(plan(TEXTS['短'], i * 13).blind.comp);
  assert.ok(kinds.size >= 15, [...kinds].join());
  const one = new Set();
  for (let i = 0; i < 300; i++) one.add(plan(TEXTS['一句'], i * 13).blind.comp);
  assert.ok(one.size >= 6, [...one].join());
});

test('没有字可排：照普通版式走', () => {
  for (const t of ['', '   \n ', '……！？']) assert.ok(!plan(t, 5).blind);
  assert.ok(plan('', 5, { title: '只有标题' }).blind, '只写了标题也能拆');
});

test('用我的墨：底色让墨，读得出来', () => {
  for (const ink of ['black', 'paper', 'crimson', '#1f45c8']) for (let i = 0; i < 40; i++) {
    const p = plan(TEXTS['短'], i, { ink, blind: { seed: i, own: { ink: true } } });
    const c = S.contrast(S.hex2rgb(p.blind.pal.i), S.hex2rgb(p.blind.pal.g));
    assert.ok(c >= 4, `${ink} 对比度只有 ${c.toFixed(1)}`);
  }
});

test('配色：墨压得住底，点睛色看得见', () => {
  let n = 1; const rnd = () => { n = (n * 1103515245 + 12345) & 0x7fffffff; return n / 0x7fffffff; };
  const tuned = Array.from({ length: 400 }, () => S.bTune(rnd));
  assert.ok(S.B_PALETTES.length > 100);
  for (const p of S.B_PALETTES.concat(tuned)) {
    const g = S.hex2rgb(p.g); for (const k of ['g', 'i', 'a', 'b']) assert.match(p[k], /^#[0-9a-f]{6}$/, p.name + k);
    assert.ok(S.contrast(S.hex2rgb(p.i), g) >= 4.6, `${p.name} 墨 ${S.contrast(S.hex2rgb(p.i), g).toFixed(2)}`);
    assert.ok(S.contrast(S.hex2rgb(p.a), g) >= 2.5, `${p.name} 点睛 ${S.contrast(S.hex2rgb(p.a), g).toFixed(2)}`);
  }
});

test('断句：按标点和换行断，问叹省略留着，英文词之间留空格', () => {
  const c = S.bClauses('他说：「走吧！」\n雪停了，真的？I am here');
  assert.deepEqual(c.map(x => x.t), ['他说', '走吧', '雪停了', '真的', 'I am here']);
  assert.equal(c[1].tail, '！');
});

test('单换一样：钉住方案之后，重掷配色、效果、线，字一个都不挪', () => {
  const pos = p => JSON.stringify(p.blind.B.layers.filter(l => !l.twin).map(l => l.ops.map(o => [o.t, o.x, o.y, o.s])));
  for (let seed = 1; seed < 40; seed++) {
    const a = plan(TEXTS['短'], seed), b = plan(TEXTS['短'], seed, { blind: { seed, ...a.blind.pin, seeds: { line: 99, pal: 1234, fx: 5 } } });
    assert.equal(a.blind.comp, b.blind.comp); assert.equal(pos(a), pos(b), `种子 ${seed} ${a.blind.comp} 动了不该动的`);
    const c = plan(TEXTS['短'], seed, { blind: { seed, seeds: { comp: 4242 } } }); assert.deepEqual(a.blind.pal, c.blind.pal);
  }
});

test('人动过的东西说了算：物件、效果、修图、点名的构图', () => {
  const it = S.blindNewItem('moon', 7, S.B_PALETTES[0], 1080, 1350);
  const p = plan(TEXTS['短'], 11, { blind: { seed: 11, items: [it], fx: ['wash'], post: ['soft', 'film', '没这个'], comp: 'rain' } });
  assert.deepEqual(p.blind.B.items, [it]);
  assert.deepEqual(p.blind.B.post, ['soft', 'film']);
  assert.deepEqual(p.blind.name.fx, ['wash']);
  assert.equal(p.blind.comp, 'rain');
});

test('浓淡：存得住、夹得住、1 等于没改', () => {
  assert.deepEqual(S.paintSpans([], 4, 0, 2, { alpha: .4 }), [{ s: 0, e: 2, alpha: .4 }]);
  assert.deepEqual(S.paintSpans([], 4, 0, 2, { alpha: 1 }), []);
  assert.deepEqual(S.paintSpans([], 4, 0, 2, { alpha: .01 }), [{ s: 0, e: 2, alpha: .05 }]);
});

test('拖过的字块：整块平移放缩，字一个不少', () => {
  const a = plan(TEXTS['短'], 11, { blind: { seed: 11, comp: 'rain' } }), i = a.blind.B.layers.findIndex(l => l.role === 'hero');
  const b = plan(TEXTS['短'], 11, { blind: { seed: 11, comp: 'rain', move: { [i]: { dx: 30, dy: -20, k: 1.5 } } } });
  const A = a.blind.B.layers[i], C = b.blind.B.layers[i], cx = A.rect.x + A.rect.w / 2;
  assert.equal(A.ops.map(o => o.t).join(''), C.ops.map(o => o.t).join(''));
  assert.ok(Math.abs(C.ops[0].s - A.ops[0].s * 1.5) < 1e-6);
  assert.ok(Math.abs(C.ops[0].x - (cx + (A.ops[0].x - cx) * 1.5 + 30)) < 1e-6);
});

test('每一样东西、每一种效果都有中英文名', async () => {
  const fs = await import('node:fs'); const src = fs.readFileSync(new URL('../src/studio/studio-i18n.js', import.meta.url), 'utf8');
  const D = new Function(src + '\nreturn STUDIO_I18N;')();
  for (const loc of ['zh-CN', 'en']) {
    for (const id of Object.values(S.B_SHAPES).flat()) assert.ok(D[loc]['bs.' + id], `${loc} 缺 bs.${id}`);
    for (const id of Object.keys(S.BLIND_FX)) assert.ok(D[loc]['bf.' + id], `${loc} 缺 bf.${id}`);
    for (const id of S.B_POST_ORDER) { assert.ok(S.BLIND_POST[id], id); assert.ok(D[loc]['bp.' + id], `${loc} 缺 bp.${id}`); }
    for (const c of S.BLIND_COMPS) assert.ok(D[loc]['bc.' + c.id], `${loc} 缺 bc.${c.id}`);
    for (const c of S.BLIND_LOOKS) assert.ok(D[loc]['bl.' + c.id], `${loc} 缺 bl.${c.id}`);
  }
  for (const id of Object.values(S.B_SHAPES).flat()) assert.ok(id === 'thread' || S.BLIND_ITEMS[id], `没有 ${id} 的画法`);
});

test('普通版式不受影响：blind 为 null 时没有盲盒', () => {
  assert.ok(!S.planPages(st(TEXTS['短'], 0, { blind: null }), makeGauge).blind);
});

test('字体认别名：嵌入方捆的 Huiwen Mincho 也算汇文明朝', async () => {
  const fs = await import('node:fs'), src = fs.readFileSync(new URL('../src/core/blind-text.js', import.meta.url), 'utf8');
  const line = src.split(/\r?\n/).find(l => l.startsWith('const bReal ='));
  const make = has => new Function('FONTS', 'hasFont', 'resolveFont', line + '\nreturn bReal;')(S.FONTS, has, f => (f.probes || []).find(has) || null);
  assert.equal(make(f => f === 'Huiwen Mincho')('Huiwen-mincho'), 'Huiwen Mincho');
  assert.equal(make(f => f === 'Zhuque Fangsong')('Zhuque Fangsong (technical prev'), 'Zhuque Fangsong');
  assert.equal(make(f => f === 'Huiwen-mincho')('Huiwen-mincho'), 'Huiwen-mincho');
  assert.equal(make(() => false)('Noto Serif SC'), null);
});
