// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ⑤ 低声的那些
// ════════════════════════════════════════════════════════════════════
// 尺子是这一句：不要杂乱、不要吵，要像有个人重章叠句地在你耳边念白。
// 这一组是盲盒的底色：同一句话念几遍、有的实有的虚；淡字垫在底下，浓字从上面走过；
// 同一段字浓淡不一。手段只有三样 —— 位置、大小、透明度；空气归 blind-looks 给。
// 淡字（没有 at 的）是回声，不算正文；正文每个字最淡也读得出来（≥ .34）。
const bGhost = us => us.map(u => ({ ...u, at: undefined }));
// 找两句话共有的一个字（不在同一句里）
function bCross(cs, rnd){
  const hits = [];
  for (let p = 0; p < cs.length; p++) for (let q = 0; q < cs.length; q++) if (p !== q && cs[p].n >= 3 && cs[p].n <= 11 && cs[q].n >= 3 && cs[q].n <= 13)
    cs[p].units.forEach((u, i) => cs[q].units.forEach((w, j) => { if (u.t === w.t && !B_STOP.has(u.t)) hits.push({ a: cs[p], b: cs[q], i, j }); }));
  return hits.length ? hits[rnd ? Math.floor(rnd() * hits.length) : 0] : null;
}
const BLIND_QUIET = [
  { id: 'refrain', q: true, dup: true, w: 7, fx: ['ink', 'drift'], face: ['lightSerif', 'serif', 'heavySerif', 'lightSans'],
    ok: B => B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 10 && B.D > 9 && B.N < 260, run(B){
    // 重章：一句话叠着念几遍，大的虚，小的实
    const { W, R, P, pal, A, maybe } = B, hu = B.hero.units, em = B.emOf(hu), zone = A.h * (B.solo ? 1 : R(.64, .74)), top = B.solo || maybe(.6), y0 = top ? A.y : A.y + A.h - zone;
    const s0 = Math.min(A.w * R(.62, .8) / em, zone * .16); if (s0 < 44 * B.u) return false;
    const set = P([[[2.7, .07], [1.7, .13], [1, 1], [.62, .42]], [[.62, .4], [1, 1], [1.7, .14], [2.6, .07]], [[1.9, .1], [1, 1], [1.9, .1], [.6, .38], [.6, .2]], [[3.2, .06], [1, 1], [1, .34], [1, .14]]]);
    const hs = set.map(([k]) => s0 * k), total = hs.reduce((a, b) => a + b, 0), ov = Math.max(0, (total - zone) / (hs.length - 1)), gap = total < zone ? (zone - total) / (hs.length - 1) : -ov; let y = y0; const lean = P([0, .5, 1]);
    set.forEach(([k, a], i) => {
      const s = s0 * k, w = em * s, main = a === 1, l = B.layer(main ? 'hero' : 'deco', main ? { quiet: true } : { bleed: true }), room = A.w - w, t = main ? P([0, .5, 1]) : (lean + i * .37) % 1;
      const x = room > 0 ? A.x + room * t : A.x + room * t; B.row(l, main ? hu : bGhost(hu), x, y + s / 2, s, { align: 'left', c: pal.i, a: main ? undefined : a });
      y += s + gap;
    });
    if (B.solo) return true;
    const g = 44 * B.u, bh = A.h - zone - g, by = top ? A.y + zone + g : A.y;
    return !!B.body(A.x + A.w * P([0, 1 / 3, .5]), by, A.w * .5, bh, { max: 28, min: 20, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w * .86, bh, { max: 28, min: 20, va: top ? 'bottom' : 'top' });
  } },

  { id: 'underlay', q: true, w: 7, face: ['lightSerif', 'serif', 'heavySerif'],
    ok: B => B.clauses.length >= 2 && B.clauses.length <= 11 && B.N >= 8 && B.N <= 130, run(B){
    // 底里的话：极淡的大字铺在底下，小字一句一落从上面走过
    const { W, R, P, I, pal, A, maybe } = B, key = B.keyClause, v = B.cjk && maybe(.45), heavy = /Black|Heavy|900/.test(B.fonts.hero + B.fonts.heroW), al = heavy ? R(.05, .085) : R(.1, .16), d = B.layer('deco', { bleed: true });
    const us = bGhost(key.units), rows = v ? [us] : B.split(us, key.n > 3 ? P([2, 3]) : 1);
    if (v){ const s = Math.min(A.h * 1.12 / B.colLen(us), A.w * .72); B.col(d, us, A.x + A.w * P([.3, .62]), A.y - s * .05, s, { c: pal.i, a: al }); }
    else { const s = Math.min(A.w * 1.16 / Math.max(...rows.map(r => B.emOf(r))), A.h * .36), y = A.y + (A.h - s * rows.length) * R(.15, .85); rows.forEach((r, i) => B.row(d, r, A.x - s * R(0, .2) + (i % 2) * s * .3, y + s * (i + .5), s, { align: 'left', c: pal.i, a: al })); }
    const cs = B.clauses, n = cs.length, col = A.w / 12, l = B.layer('hero', { read: true, body: true, quiet: true });
    const z = Math.min(44 * B.u, A.h * .86 / n * .55, A.w * .8 / Math.max(...cs.map(c => B.emOf(c.full, 'body')))); if (z < 23) return false;
    if (v && cs.every(c => B.colLen(c.full, 'body', .08) * z < A.h * .7)){ const w = Math.min(z * 2.1, A.w * .9 / n); let x = A.x + A.w - (A.w - w * n) * P([.2, .5, .8]); cs.forEach((c, i) => { x -= w; const len = B.colLen(c.full, 'body', .08) * z; B.col(l, c.full, x + w / 2, A.y + (A.h - len) * Math.min(1, (i + R(0, .7)) / Math.max(1, n)), z, { f: 'body', gap: .08, c: pal.i }); }); return true; }
    const pitch = Math.min(A.h * .9 / n, z * R(2, 3.1)); let y = A.y + (A.h - pitch * n) * P([0, .5, 1]), at = I(0, 3);
    cs.forEach((c, i) => { const room = Math.floor((A.w - B.emOf(c.full, 'body') * z) / col); at = Math.max(0, Math.min(room, at + I(-2, 3))); B.row(l, c.full, A.x + at * col, y + pitch / 2, z, { f: 'body', align: 'left', c: pal.i }); y += pitch; });
    return true;
  } },

  { id: 'stagger', q: true, w: 7, face: ['serif', 'lightSerif', 'sans', 'lightSans'],
    ok: B => B.clauses.length >= 2 && B.clauses.length <= 12 && B.N <= 120, run(B){
    // 错落：一句一落，有的重有的轻，像说话时的气口
    const { R, P, I, pal, A, maybe } = B, cs = B.clauses, n = cs.length, v = B.cjk && maybe(.5), key = B.keyClause, l = B.layer('hero', { read: true, gentle: true, body: B.N > 46, quiet: true });
    const base = Math.min(52 * B.u, (v ? A.w : A.h) / n * .46), sz = c => c === key ? base * R(1.9, 3) : base * P([.62, .74, 1, 1]), al = c => c === key ? 1 : P([.9, .66, .5, .38]), side = v ? A.h : A.w, len = (c, s) => (v ? B.colLen(c.full, 'hero', .06) : B.emOf(c.full, 'hero', .03)) * s;
    const ss = cs.map(c => Math.min(sz(c), side * .94 / len(c, 1))); if (Math.min(...ss) < 21) return false;
    const step = side / 12, total = ss.reduce((a, b) => a + b * 1.25, 0), room0 = (v ? A.w : A.h) - total; if (room0 < 0) return false;
    const gaps = cs.map(() => P([.3, .6, 1, 1.9])), gs = gaps.slice(1).reduce((a, b) => a + b, 0) || 1, use = room0 * R(.55, .95); let p = (room0 - use) * P([0, .5]), at = I(0, 4);
    cs.forEach((c, i) => {
      if (i) p += use * gaps[i] / gs; const s = ss[i], room = Math.max(0, Math.floor((side - len(c, s)) / step)); at = Math.max(0, Math.min(room, at + P([-3, -1, 1, 2, 3, 4]))); if (room && i && at === room) at = Math.max(0, at - 1);
      const o = { gap: v ? .06 : .03, c: pal.i, a: al(c) < 1 ? al(c) : undefined };
      if (v) B.col(l, c.full, A.x + A.w - p - s * .62, A.y + at * step, s, o); else B.row(l, c.full, A.x + at * step, A.y + p + s * .62, s, { align: 'left', ...o });
      p += s * 1.25;
    });
    return true;
  } },

  { id: 'canon', q: true, w: 5, face: ['serif', 'lightSerif'],
    ok: B => B.N >= 10 && B.N <= 64, run(B){
    // 轮唱：同一段错开几拍再念，一遍比一遍淡
    const { R, P, pal, A, maybe } = B, v = B.cjk && maybe(.6), k = P([2, 2, 3]), w = A.w * (v ? .62 : .72), h = A.h * (v ? .62 : .5), dx = (A.w - w) / k, dy = (A.h - h) / k, sx = v ? -1 : 1, flip = maybe(.35) ? -1 : 1;
    const x0 = sx > 0 ? A.x : A.x + A.w - w, y0 = flip > 0 ? A.y : A.y + A.h - h, main = B.layer('body', { read: true }), got = B.body(x0, y0, w, h, { vertical: v, max: 44, min: 26, ha: v ? 'right' : 'left', va: 'top', layer: main }); if (!got) return false;
    for (let i = 1; i <= k; i++){ const l = B.layer('deco', { bleed: true, alpha: [.24, .12, .06][i - 1] }); l.ops = main.ops.map(o => ({ ...o, at: undefined, x: o.x + sx * dx * i * R(.85, 1), y: o.y + flip * dy * i * R(.85, 1) })); }
    return true;
  } },

  { id: 'breath', q: true, w: 6, face: ['serif', 'lightSerif', 'heavySerif', 'sans'],
    ok: B => B.N >= 10 && B.N <= 180, run(B){
    // 呼吸：同一段字，浓一阵，淡一阵
    const { R, P, I, pal, A, maybe } = B, v = B.cjk && maybe(.45), lead = 1.7, us = B.units;
    for (let s = Math.round(Math.min(96, Math.sqrt(A.w * A.h / B.N) * .6)); s >= 25; s--){
      const pitch = s * lead, lines = [], cross = v ? A.h * .92 : A.w * R(.9, .901), n = Math.floor((v ? A.w : A.h) * .94 / pitch); for (let i = 0; i < n; i++) lines.push({ x0: 0, x1: cross, y: i * pitch });
      const got = bFlow(B, us, s, lines, 'hero', .02); if (!got) continue;
      const used = got[got.length - 1].y + s, start = ((v ? A.w : A.h) - used) * P([0, .5, 1]), l = B.layer('hero', { read: true, gentle: true, body: s < 50, quiet: true }), f = R(1.1, 2.6), ph = R(0, 6.28), kind = P(['wave', 'wave', 'focus', 'clause']), cx = R(.2, .8), cy = R(.2, .8), N = got.length, of = new Map(); B.clauses.forEach((c, q) => c.units.forEach(u => of.set(u.at, q)));
      got.forEach((g, i) => {
        const t = i / (N - 1 || 1), gx = g.x / cross, gy = g.y / (used || 1); let a = kind === 'wave' ? .5 + .5 * Math.sin(t * f * 6.2832 + ph) : kind === 'focus' ? 1 - Math.min(1, Math.hypot(gx - cx, (gy - cy) * .8) * 1.25) : (of.get(g.u.at) || 0) % 2 ? .12 : 1;
        a = .34 + .66 * Math.max(0, Math.min(1, a)); if (B.isKey(g.u)) a = 1;
        if (v) B.glyph(l, g.u, A.x + A.w - start - g.y - s / 2, A.y + g.x, s, { r: g.u.latin ? Math.PI / 2 : 0, c: pal.i, a, vp: true }); else B.glyph(l, g.u, A.x + g.x, A.y + start + g.y + s / 2, s, { c: pal.i, a });
      });
      return true;
    }
    return false;
  } },

  { id: 'fade', q: true, dup: true, w: 5, face: ['lightSerif', 'serif', 'heavySerif', 'lightSans'],
    ok: B => B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 11 && B.D > 9 && B.N < 280, run(B){
    // 渐隐：越念越轻，走到纸的另一头
    const { R, P, I, pal, A, maybe } = B, hu = B.hero.units, v = B.cjk && maybe(.5), n = I(5, 8), em = v ? B.colLen(hu) : B.emOf(hu), back = maybe(.4);
    const len0 = (v ? A.h : A.w) * R(.62, .86), zone = (v ? A.w : A.h) * (B.solo ? .96 : R(.52, .66)), s = Math.min(len0 / em, zone / n * R(.74, .92)), pitch = (zone - s) / (n - 1), drift = ((v ? A.h : A.w) - em * s) / (n - 1) * P([0, .5, 1]) * 1; if (s < 34 * B.u) return false;
    for (let i = 0; i < n; i++){
      const k = back ? n - 1 - i : i, main = k === 0, a = main ? undefined : Math.max(.05, .62 * Math.pow(.62, k - 1)), l = B.layer(main ? 'hero' : 'deco', main ? { quiet: true } : {});
      if (v) B.col(l, main ? hu : bGhost(hu), A.x + A.w - s / 2 - pitch * i, A.y + drift * i, s, { c: pal.i, a }); else B.row(l, main ? hu : bGhost(hu), A.x + drift * i, A.y + s / 2 + pitch * i, s, { align: 'left', c: pal.i, a });
    }
    if (B.solo) return true;
    const g = 56 * B.u; if (v) return !!B.body(A.x, A.y + A.h * P([0, .3]), A.w - zone - g, A.h * .7, { vertical: true, max: 28, min: 20, ha: 'left' });
    return !!B.body(A.x + A.w * P([0, .5]), A.y + zone + g, A.w * .5, A.h - zone - g, { max: 28, min: 20, va: 'bottom' }) || !!B.body(A.x, A.y + zone + g, A.w * .86, A.h - zone - g, { max: 28, min: 20, va: 'bottom' });
  } },

  { id: 'ear', q: true, w: 5, face: ['lightSerif', 'heavySerif', 'lightSans'],
    ok: B => B.cjk && B.word && B.N >= 8 && B.N <= 130, run(B){
    // 耳边：一个很大很淡的字，几行很小很实的话贴着它说
    const { W, H, R, P, pal, A, maybe } = B, ch = (bDense(B.word.t) || [...B.word.t][0]), s = W * R(.86, 1.18), heavy = /Black|Heavy|900/.test(B.fonts.hero + B.fonts.heroW), gx = P([.36, .5, .66]), gy = P([.4, .55, .64]);
    B.glyph(B.layer('deco', { bleed: true }), ch, W * gx, H * gy, s, { c: pal.i, a: heavy ? R(.05, .08) : R(.12, .2) });
    const v = maybe(.65), w = A.w * R(.34, .5), h = A.h * R(.36, .52);
    return !!B.body(P([A.x + A.w * .12, A.x + A.w - w - A.w * .08, A.x + (A.w - w) / 2]), A.y + (A.h - h) * P([.18, .5, .82]), w, h, { vertical: v, max: 32, min: 22, ha: 'center', va: 'mid' });
  } },

  { id: 'drift', q: true, w: 5, face: ['serif', 'lightSerif'],
    ok: B => B.N >= 10 && B.N <= 120, run(B){
    // 双声：同一段话，大而淡的一遍，小而实的一遍，叠在一起念
    const { R, P, pal, A, maybe } = B, v = B.cjk && maybe(.4), big = B.layer('deco', { alpha: R(.12, .2) }), got = B.body(A.x, A.y, A.w, A.h, { vertical: v, max: 130, min: 44, layer: big, va: 'mid', ha: v ? 'center' : 'left' }); if (!got) return false;
    big.read = false; big.ops.forEach(o => { delete o.at; });
    const w = A.w * R(.46, .6), h = A.h * R(.34, .5);
    return !!B.body(A.x + (A.w - w) * P([.12, .5, .9]), A.y + (A.h - h) * P([.25, .5, .8]), w, h, { vertical: v, max: 30, min: 22, va: 'mid', ha: v ? 'center' : 'left' });
  } },

  { id: 'blank', q: true, w: 6, face: ['serif', 'lightSerif', 'sans', 'lightSans'],
    ok: B => B.N >= 3 && B.N <= 150, run(B){
    // 留白：空的那一大片才是主角，字只是让它显出来
    const { R, P, pal, A, maybe } = B, v = B.cjk && maybe(.55), cs = B.clauses, one = cs.length >= 2 && cs.length <= 8 && maybe(.6);
    if (one){
      const l = B.layer('hero', { read: true, body: true, quiet: true }), s = R(23, 34) * B.u, gap = R(.08, .3), pitch = s * R(2, 3.2), n = cs.length, cut = maybe(.45) && n > 2 ? n - 1 : n, lens = cs.map(c => (v ? B.colLen(c.full, 'body', gap) : B.emOf(c.full, 'body', gap)) * s); if (Math.max(...lens) > (v ? A.h : A.w) * .9) return false;
      const block = pitch * cut, X = P([0, 1]), Y = P([0, .28, .72, 1]);
      cs.forEach((c, i) => { const lone = i >= cut; if (v){ const x = lone ? A.x + s * .6 : A.x + A.w - s * .6 - (A.w - block - s * 3) * (X ? 0 : .3) - pitch * i, y = lone ? A.y + A.h - lens[i] : A.y + (A.h - Math.max(...lens.slice(0, cut))) * Math.min(.6, Y); B.col(l, c.full, x, y, s, { f: 'body', gap, c: pal.i }); } else { const x = lone ? A.x + A.w - lens[i] : A.x + (A.w - Math.max(...lens.slice(0, cut))) * X * .9, y = lone ? A.y + A.h - s * .6 : A.y + s * .6 + (A.h - block - s * 4) * Math.min(.85, Y) + pitch * i; B.row(l, c.full, x, y, s, { f: 'body', align: 'left', gap, c: pal.i }); } });
      return true;
    }
    const w = A.w * R(.3, .46), h = A.h * R(.24, .4); return !!B.body(A.x + (A.w - w) * P([0, 1, .62, .38]), A.y + (A.h - h) * P([0, 1, .62, .38]), w, h, { vertical: v, max: 27, min: 20, ha: P(['left', 'right']), va: P(['top', 'bottom']) }) || !!B.body(A.x + A.w * .5, A.y + A.h * .5, A.w * .5, A.h * .5, { max: 26, min: 20, va: 'bottom' });
  } },

  { id: 'void', q: true, dup: true, w: 5, face: ['lightSans', 'sans', 'lightSerif', 'heavySans'],
    ok: B => B.cjk && B.hero && B.hero.units.length >= 1 && B.hero.units.length <= 6 && B.N > 12 && B.N < 130, run(B){
    // 空格：一个词铺成一面墙，当中抽掉一块，正文站在那块空里
    const { R, P, pal, A, maybe } = B, hu = bGhost(B.hero.units), em = B.emOf(hu) + .9, s = R(26, 40) * B.u, cols = Math.max(2, Math.round(A.w / (em * s))), cw = A.w / cols, lh = s * R(1.9, 2.5), rows = Math.floor(A.h / lh), l = B.layer('deco'), w = Math.max(cw * Math.max(1, Math.round(cols * .5)), A.w * .4), x = A.x + (A.w - w) * P([0, .5, 1]), h = A.h * R(.36, .5), y = A.y + (A.h - h) * P([.2, .5, .8]);
    const got = B.body(x + 10 * B.u, y, w - 20 * B.u, h, { max: 34, min: 21, va: 'mid', ha: 'center' }); if (!got) return false;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++){ const px = A.x + cw * i, py = A.y + lh * (j + .5); if (px + (em - .9) * s > got.x - s && px < got.x + got.w + s && py > got.y - s * 1.3 && py < got.y + got.h + s * 1.3) continue; B.row(l, hu, px, py, s, { align: 'left', c: pal.i, a: .34 }); }
    return true;
  } },

  { id: 'grow', q: true, w: 6, face: ['serif', 'lightSerif', 'sans', 'heavySerif'],
    ok: B => B.cjk && B.clauses.length >= 1 && B.N >= 4 && B.N <= 60 && B.clauses.some(c => c.n >= 3 && c.n <= 11), run(B){
    // 渐成：一个字一个字地长成一句，长成了的那一句才是实的
    const { R, P, pal, A, maybe } = B, c = B.keyClause && B.keyClause.n >= 3 && B.keyClause.n <= 11 ? B.keyClause : P(B.clauses.filter(q => q.n >= 3 && q.n <= 11)), n = c.n, rest = B.N - n, zone = rest ? A.h * R(.62, .7) : A.h * .9, v = maybe(.4), s = Math.min((v ? zone : A.w * R(.6, .96)) / (n * 1.04), (v ? A.w * .8 : zone) / (n * 1.12), 96 * B.u); if (s < 24) return false;
    const right = maybe(.35), l = B.layer('hero', { read: true, quiet: true, body: s < 44 }), d = B.layer('deco'), pitch = Math.min((v ? A.w : zone) / n, s * R(1.12, 1.7)), back = maybe(.3);
    for (let i = 0; i < n; i++){ const k = back ? n - i : i + 1, us = c.units.slice(0, k), main = k === n, a = main ? undefined : .1 + .42 * Math.pow(k / n, 1.6), q = main ? l : d, uu = main ? us : bGhost(us); if (v) B.col(q, uu, A.x + A.w - pitch * (i + .5), A.y, s, { gap: .04, c: pal.i, a }); else B.row(q, uu, right ? A.x + A.w : A.x, A.y + pitch * (i + .5), s, { align: right ? 'right' : 'left', gap: .04, c: pal.i, a }); }
    if (!rest) return true;
    const g = 50 * B.u, Y = v ? A.y + zone + g : A.y + pitch * n + g; return !!B.body(A.x + A.w * P([0, 1 / 3]), Y, A.w * .6, A.y + A.h - Y, { max: 30, min: 20, va: 'bottom' }) || !!B.body(A.x, Y, A.w, A.y + A.h - Y, { max: 28, min: 20, va: 'bottom' });
  } },

  { id: 'cross', q: true, w: 7, face: ['serif', 'lightSerif', 'heavySans', 'heavySerif'],
    ok: B => B.cjk && B.clauses.length >= 2 && B.N <= 110 && !!bCross(B.clauses), run(B){
    // 十字：两句话在同一个字上相交
    const { R, P, pal, A, maybe } = B, { a, b, i, j } = bCross(B.clauses, B.rnd), rest = B.N - a.n - b.n, zone = rest > 0 ? A.h * .72 : A.h, s = Math.min(A.w / a.n, zone / b.n, 170 * B.u); if (s < 34) return false;
    const x0 = A.x + (A.w - a.n * s) * P([0, .5, 1]), y0 = A.y + (zone - b.n * s) * P([0, .5]), l = B.layer('hero', { read: true, quiet: true }), px = x0 + (i + .5) * s, py = y0 + (j + .5) * s;
    a.units.forEach((u, k) => B.glyph(l, u, x0 + (k + .5) * s, py, s * .92, { c: k === i ? pal.a : pal.i }));
    b.units.forEach((u, k) => { if (k === j){ const o = B.glyph(l, u, px, py, s * .92, { c: pal.a }); o.a = .001; } else B.glyph(l, u, px, y0 + (k + .5) * s, s * .92, { c: pal.i }); });
    if (rest <= 0) return true;
    const g = 40 * B.u; return !!B.body(A.x + A.w * P([0, .4]), A.y + zone + g, A.w * .6, A.h - zone - g, { max: 28, min: 20, va: 'bottom' }) || !!B.body(A.x, A.y + zone + g, A.w, A.h - zone - g, { max: 26, min: 20, va: 'bottom' });
  } },

  // ── 日本 ────────────────────────────────────────────────────────
  { id: 'ma', q: true, dup: true, w: 5, fx: ['ink', 'drift', 'melt'], face: ['lightSerif', 'heavySerif', 'lightSans'],
    ok: B => B.cjk && B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 6 && B.D > 9 && B.N < 200, run(B){
    // 间：几个字隔得很开，正文竖着站在它们中间
    const { R, P, pal, A } = B, hu = B.hero.units, n = hu.length, s = Math.min(A.w * R(.25, .34), A.h / Math.ceil(n / 2) * .7), X = [A.x + A.w - s / 2, A.x + s / 2], per = Math.ceil(n / 2), l = B.layer('hero', { quiet: true });
    hu.forEach((u, i) => { const c = Math.floor(i / per), r = i % per, rows = c ? n - per : per, y = per === 1 ? (c ? A.y + A.h - s / 2 : A.y + s / 2) : A.y + s / 2 + (A.h - s) * (rows === 1 ? (c ? 1 : 0) : r / (per - 1)); B.glyph(l, u, X[c], y, s, { c: pal.i }); });
    if (B.solo) return true;
    const w = A.w - s * 2 - 90 * B.u, h = A.h * R(.42, .58);
    return !!B.body(A.x + s + 45 * B.u, A.y + (A.h - h) * P([.3, .5, .7]), w, h, { vertical: true, max: 28, min: 20, ha: 'center', va: 'mid' });
  } },

  { id: 'tate', q: true, w: 6, fx: ['ink', 'melt'], face: ['serif', 'lightSerif', 'heavySerif'],
    ok: B => B.cjk && B.clauses.length >= 2 && B.clauses.length <= 10 && B.N <= 110 && B.clauses.every(c => c.n <= 17), run(B){
    // 立：竖排，一句比一句低，走成一道缓坡
    const { R, P, pal, A, maybe } = B, cs = B.clauses, n = cs.length, lens = cs.map(c => B.colLen(c.full, 'hero', .1)), s = Math.min(56 * B.u, A.w / n * .5, A.h * .72 / Math.max(...lens)); if (s < 23) return false;
    const w = Math.min(s * R(1.9, 2.6), A.w / n), x0 = A.x + A.w - (A.w - w * n) * P([0, 0, .5, 1]), l = B.layer('hero', { read: true, gentle: true, body: s < 44, quiet: true }), up = maybe(.25), fall = Math.min(...lens.map((e, i) => n > 1 ? (A.h - e * s) / Math.max(1, up ? n - 1 - i : i) : A.h)), step = Math.min(fall, A.h * R(.06, .13));
    cs.forEach((c, i) => B.col(l, c.full, x0 - w * (i + .5), A.y + step * (up ? n - 1 - i : i), s, { gap: .1, c: c === B.keyClause && maybe(.5) ? pal.a : pal.i }));
    return true;
  } },

  // ── 瑞士 ────────────────────────────────────────────────────────
  { id: 'axis', q: true, w: 5, face: ['heavySans', 'sans', 'serif', 'heavySerif'], fx: ['melt'],
    ok: B => B.clauses.length >= 2 && B.clauses.length <= 10 && B.N <= 150, run(B){
    // 轴线：一根看不见的轴，句子一左一右地靠着它，从纸顶走到纸底
    const { R, P, pal, A, maybe } = B, cs = B.clauses.flatMap(c => c !== B.keyClause && c.n > 9 ? B.split(c.full, 2).map(full => ({ full, of: c })) : [{ full: c.full, of: c }]), n = cs.length, ax = A.x + A.w * P([.382, .382, .5, .618]), room = i => i % 2 ? ax - A.x : A.x + A.w - ax, flip = maybe(.4) ? 1 : 0, side = i => (i + flip) % 2;
    const key = cs.findIndex(c => c.of === B.keyClause), gut = 16 * B.u, kRows = B.split(cs[key].full, cs[key].full.length > 4 ? 2 : 1), kS = Math.min(A.w * .96 / Math.max(...kRows.map(r => B.emOf(r))), A.h * .17), s = Math.min(46 * B.u, kS * .5, ...cs.map((c, i) => i === key ? 1e4 : (room(side(i)) - gut) / B.emOf(c.full, 'body'))); if (s < 24 || kS < 64) return false;
    const hs = cs.map((c, i) => i === key ? kS * 1.12 * kRows.length : s * 1.5), sum = hs.reduce((a, b) => a + b, 0), air = A.h - sum; if (air < 0) return false;
    const g = cs.slice(1).map(() => P([.4, 1, 1, 2.6])), gs = g.reduce((a, b) => a + b, 0) || 1, l = B.layer('hero', { read: true, gentle: true, quiet: true }), b = B.layer('hero', { read: true, body: true, quiet: true }); let y = A.y;
    cs.forEach((c, i) => {
      if (i) y += air * g[i - 1] / gs;
      if (i === key) kRows.forEach((r, j) => { const w = B.emOf(r) * kS, x = side(i) ? Math.max(A.x, ax - w) : Math.min(ax, A.x + A.w - w); B.row(l, r, x - kS * .03, y + kS * 1.12 * (j + .5), kS, { align: 'left', c: maybe(.4) ? pal.a : pal.i }); });
      else B.row(b, c.full, side(i) ? ax - gut : ax + gut, y + hs[i] / 2, s, { f: 'body', align: side(i) ? 'right' : 'left', c: pal.i });
      y += hs[i];
    });
    return true;
  } },

  { id: 'turn', dup: true, w: 4, face: ['heavySans', 'lightSans', 'heavySerif'], fx: ['melt', 'cuts'],
    ok: B => B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 10 && B.D > 12 && B.N < 380, run(B){
    // 转题：标题转九十度贴着纸边，正文落在旁边的栏里
    const { R, P, pal, A, maybe } = B, hu = B.hero.units, em = B.emOf(hu), s = Math.min(A.h / em, A.w * R(.26, .4)), left = maybe(.6), x = left ? A.x + s / 2 : A.x + A.w - s / 2, r = left ? -Math.PI / 2 : Math.PI / 2, l = B.layer('hero'); if (s < 80) return false;
    let d = maybe(.5) ? 0 : A.h - em * s; hu.forEach(u => { const w = B.em(u.t) * s; B.glyph(l, u, x, left ? A.y + A.h - d - w / 2 : A.y + d + w / 2, s, { r, c: pal.i }); d += w; });
    if (B.solo) return true;
    const g = 56 * B.u, w = A.w - s - g; return !!B.body(left ? A.x + s + g : A.x, A.y, Math.min(w, A.w * .5), A.h, { max: 30, min: 20, va: P(['top', 'bottom']) });
  } },
];
BLIND_COMPS.unshift(...BLIND_QUIET);

