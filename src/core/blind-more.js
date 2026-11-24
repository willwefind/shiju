// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ④′ 有体温的那些
// ════════════════════════════════════════════════════════════════════
// 第一版里舍不得丢的（横幅、直幅、色块、起伏、坠落、倒影……）和新写的几种。
// 它们自己不讲究，全靠气氛（looks）托着：老宋体、化得开的底、字上有光有质地。
const bTurn = (l, r, cx, cy) => { const c = Math.cos(r), s = Math.sin(r); for (const o of l.ops){ const dx = o.x - cx, dy = o.y - cy; o.x = cx + dx * c - dy * s; o.y = cy + dx * s + dy * c; o.r = (o.r || 0) + r; } };
const BLIND_MORE = [
  { id: 'banner', dup: true, w: 6, face: ['oldSerif', 'oldSerif', 'heavySerif', 'serif', 'heavySans', 'lightSerif'],
    ok: B => B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 12 && B.D > 10 && B.N < 420, run(B){
    // 横幅：主角顶满一整行或两行，正文退得远远的
    const { W, R, P, pal, A, maybe } = B, hu = B.hero.units, two = hu.length >= 4 && (hu.length > 7 || maybe(.6)), rows = two ? B.split(hu, hu.length > 9 ? 3 : 2) : [hu];
    const s = Math.min(...rows.map(r => A.w / B.emOf(r)), A.h * (two ? .24 : .34)), zone = rows.length * s * 1.04; if (s < 70) return false;
    const pos = B.solo ? 'mid' : P(['top', 'top', 'bottom', 'mid']), l = B.layer('hero'), c = P([pal.i, pal.i, pal.a]), al = P(['left', 'cross', 'cross', 'center']);
    const put = y => rows.forEach((r, i) => B.row(l, r, al === 'left' ? A.x : al === 'center' ? W / 2 : i % 2 ? A.x + A.w : A.x, y + s * 1.04 * (i + .5), s, { align: al === 'left' ? 'left' : al === 'center' ? 'center' : i % 2 ? 'right' : 'left', c }));
    const gap = R(50, 90) * B.u, rest = A.h - zone - gap;
    if (B.solo){ put(A.y + (A.h - zone) * R(.2, .7)); return true; }
    if (pos === 'mid'){ const up = rest * R(.14, .32); put(A.y + up); return !!B.body(A.x + A.w * P([0, .3, .42]), A.y + up + zone + gap, A.w * .58, rest - up, { max: 36, va: P(['top', 'bottom']) }) || !!B.body(A.x, A.y + up + zone + gap, A.w, rest - up, { max: 32 }); }
    put(pos === 'top' ? A.y : A.y + A.h - zone); const y = pos === 'top' ? A.y + zone + gap : A.y, v = B.cjk && maybe(.45);
    return !!B.body(A.x + (v ? 0 : A.w * P([0, .2, .42])), y, A.w * (v ? 1 : .58), rest, { vertical: v, max: 36, ha: P(['right', 'left']), va: pos === 'top' ? P(['bottom', 'bottom', 'top']) : 'top' }) || !!B.body(A.x, y, A.w, rest, { max: 32, va: 'top' });
  } },

  { id: 'full', w: 8, face: ['oldSerif', 'oldSerif', 'oldSerif', 'heavySerif', 'serif'], ok: B => B.clauses.length >= 2 && B.clauses.length <= 10 && B.N >= 4 && B.N <= 90, run(B){
    // 满排：每一行都撑到两边，字少的大，字多的小；字不拉不扁
    const { W, R, P, pal, A, maybe } = B, cs = B.clauses.flatMap(c => c.n > 11 ? B.split(c.full, 2).map(full => ({ full, of: c })) : [{ full: c.full, of: c }]), n = cs.length; if (n > 11) return false;
    let best = [];
    for (let m = 0; m < 1 << (n - 1); m++){
      const rows = [[]]; cs.forEach((c, i) => { rows[rows.length - 1].push(c); if (i < n - 1 && m >> i & 1) rows.push([]); });
      let h = 0, ok = true; const rs = rows.map(r => { const em = r.reduce((a, c, i) => a + B.emOf(c.full) + (i ? .5 : 0), 0), s = Math.min(A.w / em, A.h * .42); if (s < 30) ok = false; h += s * 1.08; return { r, em, s }; });
      // 光是塞满不够，行与行要有大有小
      if (ok && h <= A.h && h >= A.h * .42) best.push({ rs, h, v: h / A.h + .5 * Math.min(2.4, Math.max(...rs.map(q => q.s)) / Math.min(...rs.map(q => q.s))) / 2.4 });
    }
    if (!best.length) return false;
    best.sort((a, b) => b.v - a.v); const { rs, h } = P(best.slice(0, 5)), l = B.layer('hero', { read: true, gentle: true }), gap = rs.length > 1 ? Math.min((A.h - h) / (rs.length - 1), 40 * B.u) : 0, hit = maybe(.75);
    let y = A.y + (A.h - h - gap * (rs.length - 1)) * P([0, .5, .5, 1]);
    for (const { r, em, s } of rs){ let x = A.x + (A.w - em * s) / 2; r.forEach((c, i) => { if (i) x += .5 * s; x += B.row(l, c.full, x, y + s * .54, s, { align: 'left', c: hit && c.of === B.keyClause && n > 1 ? pal.a : pal.i }); }); y += s * 1.08 + gap; }
    return true;
  } },

  { id: 'stars', w: 6, face: ['oldSerif', 'oldSerif', 'serif', 'lightSerif'], ok: B => B.N >= 4 && B.N <= 44, run(B){
    // 散星：字一颗一颗散开，顺着一条看不见的线往下读
    const { R, P, maybe, pal, A } = B, us = B.core, n = us.length, turns = R(.6, 1.5), ph = R(0, 6.28), amp = A.w * R(.26, .4);
    const pts = us.map((u, i) => { const t = n > 1 ? i / (n - 1) : .5, big = B.isKey(u), s = Math.min(170, Math.sqrt(A.w * A.h / n) * (big ? R(.56, .72) : P([.26, .36, .46, .56]))) / Math.max(1, B.em(u.t) * .62); return { u, s: Math.max(34, s), big, x: A.x + A.w / 2 + Math.sin(t * turns * 6.28 + ph) * amp + R(-30, 30), y: A.y + 60 + t * (A.h - 120) + R(-16, 16) }; }), rad = p => p.s * Math.max(1, B.em(p.u.t)) * .62;
    for (let k = 0; k < 90; k++) for (let i = 0; i < n; i++){
      for (let j = i + 1; j < n; j++){ const a = pts[i], b = pts[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, need = (rad(a) + rad(b)) * 1.06; if (d < need){ const m = (need - d) / 2 / d; a.x -= dx * m; a.y -= dy * m * .6; b.x += dx * m; b.y += dy * m * .6; } }
      const p = pts[i], r = rad(p); p.x = Math.max(A.x + r, Math.min(A.x + A.w - r, p.x)); p.y = Math.max(A.y + p.s * .55, Math.min(A.y + A.h - p.s * .55, p.y));
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < (rad(pts[i]) + rad(pts[j])) * .8) return false;
    const l = B.layer('hero', { read: true, gentle: true, quiet: true }), twist = maybe(.3) ? .16 : 0; for (const p of pts) B.glyph(l, p.u, p.x, p.y, p.s, { c: p.big ? pal.a : pal.i, r: R(-twist, twist) });
    return true;
  } },

  { id: 'column', dup: true, w: 8, face: ['oldSerif', 'oldSerif', 'heavySerif', 'serif', 'heavySerif', 'lightSerif'],
    ok: B => B.cjk && B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 9 && B.D > 10 && B.N < 420, run(B){
    // 直幅：主角竖着从天落到地，字不拉不扁；正文竖排，靠在它的影子里
    const { R, maybe, P, pal, A } = B, hu = B.hero.units, n = B.colLen(hu), s = Math.min(A.h * R(.7, .98) / n, A.w * R(.2, .36)), right = maybe(.66), slack = A.h - s * n, x = right ? A.x + A.w - s / 2 : A.x + s / 2;
    const l = B.layer('hero'); B.col(l, hu, x, A.y + slack * P([0, 0, 1, .4]), s, { c: P([pal.i, pal.i, pal.a]) }); if (B.solo) return true;
    const gap = R(54, 110) * B.u, w = A.w - s - gap, h = A.h * R(.42, .7), bx = right ? A.x : A.x + s + gap;
    return !!B.body(bx, maybe(.3) ? A.y + A.h - h : A.y, w, h, { vertical: true, max: 36, ha: right ? P(['right', 'left', 'left']) : 'right' }) || !!B.body(bx, A.y, w, A.h, { vertical: true, max: 32, min: 20, ha: 'right' });
  } },

  { id: 'panel', dup: true, w: 5, face: ['oldSerif', 'oldSerif', 'heavySerif', 'serif', 'heavySans'], modes: ['left', 'right'],
    ok: B => B.cjk && B.hero && B.hero.units.length <= 8 && B.D > 10 && B.N < 380, run(B){
    // 色块：纸分两色，一边喊，一边说
    const { W, H, R, P, pal, A, maybe, M } = B, hu = B.hero.units, on = bOn(pal.a, pal), d = B.layer('back', { bleed: true, nofx: true }), l = B.layer('hero', { onAccent: on }), t = P([R(.3, .4), R(.3, .4), .618]), right = maybe(.6), w = W * t, x = right ? W - w : 0;
    const p = { k: 'r', x, y: 0, w, h: H, c: pal.a }; d.ops.push(p); if (maybe(.4)) d.soft = R(14, 60) * B.u;
    const n = B.colLen(hu, 'hero', .05), s = Math.min((H - M * 2.4) * .96 / n, w * .66); if (s < 60) return false;
    B.col(l, hu, x + w * P([.5, right ? .42 : .58]), P([M * 1.2, H - M * 1.2 - n * s, (H - n * s) / 2]), s, { gap: .05, c: on });
    const bx = right ? M : w + M * .8, bw = W - w - M * 1.8; B.metaBox = { x: bx, w: bw }; if (B.solo) return true;
    return !!B.body(bx, A.y, bw, A.h, { vertical: maybe(.6), max: 36, ha: right ? P(['right', 'left']) : 'right', va: P(['top', 'bottom']) });
  } },

  { id: 'chorus', dup: true, w: 5, face: ['oldSerif', 'oldSerif', 'heavySerif', 'serif', 'heavySans'],
    ok: B => B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 8 && B.D > 10 && B.N < 280, run(B){
    // 回声：一句话喊了好几遍，只有一遍是实的
    const { W, R, I, P, pal, A, maybe } = B, hu = B.hero.units, em = B.emOf(hu), s = Math.min(A.w * R(.8, 1) / em, A.h * .19, 250), rows = I(4, 6), pitch = s * R(.62, 1), zone = pitch * (rows - 1) + s; if (zone > A.h * .68 || s < 56) return false;
    const top = maybe(.6), y0 = (top ? A.y : A.y + A.h - zone) + s / 2, main = P([0, rows - 1, I(0, rows - 1)]), style = P(['line', 'fade', 'color', 'blur']), shift = maybe(.6) ? R(-34, 34) * B.u : 0, l = B.layer('hero');
    for (let i = 0; i < rows; i++){
      const d = Math.abs(i - main), y = y0 + i * pitch, x = W / 2 + shift * (i - main); if (!d){ B.row(l, hu, x, y, s, { c: pal.i }); continue; }
      const g = B.layer('deco', { bleed: true, ...(style === 'blur' ? { soft: 3 * d * B.u } : {}) });
      if (style === 'line') B.row(g, bGhost(hu), x, y, s, { c: B.kin, o: 1.8, a: Math.max(.22, .9 - d * .16) }); else B.row(g, bGhost(hu), x, y, s, { c: style === 'color' && d % 2 ? B.kin : pal.i, a: Math.max(.06, .46 - d * .11) });
    }
    if (B.solo) return true;
    const gap = 50 * B.u, bh = A.h - zone - gap, by = top ? A.y + zone + gap : A.y;
    return !!B.body(A.x + A.w * P([0, .2, .42]), by, A.w * .56, bh, { max: 34, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 32, va: 'top' });
  } },

  { id: 'depth', dup: true, w: 7, face: ['oldSerif', 'oldSerif', 'heavySerif', 'serif', 'lightSerif', 'heavySans'],
    ok: B => B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 8 && B.D > 9 && B.N < 280, run(B){
    // 景深：同一句站在三个远近上，只有一处对得上焦
    const { W, H, R, P, pal, A, maybe } = B, hu = B.hero.units, v = B.cjk && maybe(.5), em = v ? B.colLen(hu) : B.emOf(hu), side = v ? A.h : A.w, s = Math.min(side * (v ? .52 : .7) / em, (v ? A.w : A.h) * .2); if (s < 44) return false;
    const put = (l, us, cx, cy, z, o) => v ? B.col(l, us, cx, cy - em * z / 2, z, o) : B.row(l, us, cx, cy, z, o), fx = R(.3, .7), fy = R(.22, .4);
    const far = [[R(2, 2.7), R(22, 40), R(.2, .34)], [R(1.3, 1.7), R(7, 13), R(.3, .5)]], sx = P([1, -1]);
    far.forEach(([k, b, a], i) => put(B.layer('deco', { bleed: true, soft: b * B.u, alpha: a }), bGhost(hu), W * (.5 + sx * [.2, -.22][i] + R(-.06, .06)), H * (v ? [.5, .46][i] : [.2, .48][i] + R(-.05, .05)), s * k, { c: i ? pal.i : P([B.kin, pal.i]) }));
    const l = B.layer('hero', { quiet: true }), w = v ? s : em * s, h = v ? em * s : s, cx = A.x + w / 2 + (A.w - w) * fx, cy = A.y + h / 2 + (A.h * .62 - h) * Math.min(1, Math.max(0, fy)); if (h > A.h * .62) return false;
    put(l, hu, cx, cy, s, { c: pal.i }); if (B.solo) return true;
    const by = cy + h / 2 + 56 * B.u; return !!B.body(A.x + A.w * P([0, .3, .5]), by, A.w * .5, A.y + A.h - by, { max: 30, va: 'bottom' }) || !!B.body(A.x, by, A.w, A.y + A.h - by, { max: 30, va: 'bottom' });
  } },

  { id: 'wave', w: 5, face: ['oldSerif', 'oldSerif', 'serif', 'lightSerif', 'heavySerif'], ok: B => B.N >= 14 && B.N <= 190, run(B){
    // 起伏：整段字浮在水上
    const { R, pal, A, maybe } = B, us = B.units, gap = R(0, .1), cap = Math.round(Math.min(92, Math.sqrt(A.w * A.h / B.N) * .52));
    for (let s = cap; s >= 27; s--){
      const lh = s * 1.9, rows = Math.floor(A.h * .84 / lh), lines = []; for (let i = 0; i < rows; i++) lines.push({ x0: A.x + s * .3, x1: A.x + A.w - s * .3, y: i * lh });
      const got = bFlow(B, us, s, lines, 'hero', gap); if (!got) continue;
      const used = got[got.length - 1].y + s, y0 = A.y + (A.h - used) * R(.3, .7) + s / 2, amp = Math.min(s * R(.34, .6), lh * .42), lam = R(300, 720), drift = R(-.9, .9), l = B.layer('hero', { read: true, gentle: true, body: s < 52 }), key = maybe(.7);
      for (const g of got){ const ph = g.x / lam * 6.28 + g.y / lh * drift; B.glyph(l, g.u, g.x, y0 + g.y + Math.sin(ph) * amp, s, { r: Math.cos(ph) * amp * 6.28 / lam * .8, c: key && B.isKey(g.u) ? pal.a : pal.i }); }
      return true;
    }
    return false;
  } },

  { id: 'fall', w: 4, face: ['oldSerif', 'oldSerif', 'serif', 'lightSerif'], ok: B => B.N >= 20 && B.N <= 200 && B.cjk, run(B){
    // 坠落：一开始好好排着，越到后头越散
    const { R, pal, A } = B, us = B.units, zone = A.h * .6, cap = Math.round(Math.min(86, Math.sqrt(A.w * A.h / B.N) * .5));
    for (let s = cap; s >= 27; s--){
      const lh = s * 1.75, rows = Math.floor(zone / lh), lines = []; for (let i = 0; i < rows; i++) lines.push({ x0: A.x, x1: A.x + A.w * .96, y: A.y + s / 2 + i * lh });
      const got = bFlow(B, us, s, lines, 'hero'); if (!got) continue;
      const t0 = R(.34, .55), l = B.layer('hero', { read: true, gentle: true, body: s < 52, quiet: true }), n = got.length, yEnd = got[n - 1].y, drop = A.y + A.h - s * .6 - yEnd, ps = [];
      got.forEach((g, i) => { const t = Math.max(0, (i / (n - 1) - t0) / (1 - t0)), k = t * t; ps.push({ g, k, x: Math.max(A.x + s / 2, Math.min(A.x + A.w - s / 2, g.x + R(-1, 1) * k * s * 1.1)), y: Math.min(A.y + A.h - s * .55, g.y + k * drop * R(.86, 1)) }); });
      // 散是散，别两个字摞在一起
      for (let q = 0; q < 60; q++) for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++){ const a = ps[i], b = ps[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, need = s * 1.02; if (d < need && b.k > .02){ const m = (need - d) / d; b.x += dx * m * .6; b.y += dy * m * .6; b.x = Math.max(A.x + s / 2, Math.min(A.x + A.w - s / 2, b.x)); b.y = Math.min(A.y + A.h - s * .55, Math.max(A.y + s * .5, b.y)); } }
      for (const { g, k, x, y } of ps) B.glyph(l, g.u, x, y, s * (1 - k * R(0, .2)), { r: R(-1, 1) * k * .6, c: B.isKey(g.u) ? pal.a : pal.i, a: k > .3 ? 1 - k * .35 : undefined });
      return true;
    }
    return false;
  } },

  { id: 'water', dup: true, w: 5, face: ['oldSerif', 'oldSerif', 'heavySerif', 'serif', 'heavySans', 'lightSerif'],
    ok: B => B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 8 && B.D > 10 && B.N < 260, run(B){
    // 水面：上面是字，下面是它的倒影
    const { W, R, P, pal, A, maybe } = B, hu = B.hero.units, em = B.emOf(hu), s = Math.min(A.w * R(.8, .98) / em, A.h * .26); if (s < 64) return false;
    const hz = A.y + Math.max(s * 1.12, A.h * R(.28, .42)), l = B.layer('hero', { quiet: true }), m = B.layer('back', { mirror: hz, alpha: .8, bleed: true, fx: ['ripple', 'fade'], own: true }); B.row(l, hu, W / 2, hz - s * .56, s, { c: pal.i }); B.row(m, bGhost(hu), W / 2, hz + s * .56, s, { c: maybe(.6) ? B.kin : pal.i, flip: true });
    if (maybe(.5)) B.layer('deco').ops.push({ k: 'r', x: 0, y: hz - .7, w: W, h: 1.4, c: bAlpha(pal.i, .3) });
    if (B.solo) return true; const y = hz + s * 1.25 + 40;
    return !!B.body(A.x + A.w * P([0, .2, .42]), y, A.w * .58, A.y + A.h - y, { max: 34, va: P(['bottom', 'bottom', 'top']) }) || !!B.body(A.x, y, A.w, A.y + A.h - y, { max: 32, va: 'top' });
  } },

  { id: 'shape', w: 4, face: ['oldSerif', 'oldSerif', 'serif', 'lightSerif', 'heavySerif'], ok: B => B.N >= 24 && B.N <= 420 && B.cjk, run(B){
    // 形：字灌进一个形状里 —— 月、沙漏、叶
    const { W, P, pal, A } = B, kind = P(['moon', 'drop', 'glass', 'leaf', 'drop']), shapes = { drop: t => t < .62 ? Math.pow(t / .62, 1.1) : Math.sqrt(Math.max(0, 1 - ((t - .62) / .38) ** 2)), moon: t => Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)), glass: t => .16 + .84 * Math.pow(Math.abs(2 * t - 1), 1.1), leaf: t => Math.pow(Math.sin(Math.PI * t), .85) };
    const ratio = { moon: 1, drop: 1.22, glass: 1.35, leaf: 1.4 }[kind], size = P([.72, .86, 1]), hgt = Math.min(A.h, A.w * ratio) * size, wid = Math.min(A.w, hgt / ratio * (ratio > 1 ? 1.12 : 1)), y0 = A.y + (A.h - hgt) * P([.2, .5, .5, .8]), cx = W / 2 + (A.w - wid) * P([0, 0, .4, -.4]);
    for (let s = 110; s >= 24; s--){
      const lh = s * 1.5, rows = Math.floor(hgt / lh), lines = []; for (let i = 0; i < rows; i++){ const t = (i + .5) / rows, half = shapes[kind](t) * wid / 2; lines.push({ x0: cx - half, x1: cx + half, y: y0 + (i + .5) * hgt / rows }); }
      const got = bFlow(B, B.units, s, lines, 'hero'); if (!got) continue;
      const used = new Set(got.map(g => g.line)); if (used.size < Math.max(4, rows * .86) || rows < 5) return false;
      const l = B.layer('hero', { read: true, gentle: true, body: s < 52, quiet: true });
      for (const g of got){ const ln = g.line, slack = ln.x1 - ln.end, last = got[got.length - 1].line === ln, idx = got.filter(q => q.line === ln).indexOf(g), dx = last || slack < 0 ? slack / 2 : 0, just = !last && slack > 0 && ln.n > 1 ? slack / (ln.n - 1) * idx : 0; B.glyph(l, g.u, g.x + dx + just, g.y, s, { c: B.isKey(g.u) ? pal.a : pal.i }); }
      return true;
    }
    return false;
  } },

  { id: 'board', w: 4, face: ['oldSerif', 'oldSerif', 'serif', 'heavySerif', 'lightSerif', 'heavySans'], ok: B => B.N >= 8 && B.N <= 110 && !B.core.some(u => u.latin), run(B){
    // 棋局：一格一字，几枚点睛；浓淡跟着一片看不见的云走
    const { R, P, pal, A, maybe } = B, us = B.core, n = us.length, v = maybe(.6), cols = Math.max(3, Math.round(Math.sqrt(n * A.w / A.h) + R(-.6, .9))), rows = Math.ceil(n / cols), cw = A.w / cols, ch = Math.min(A.h / rows, cw * 1.35), s = Math.min(cw, ch) * R(.46, .74); if (s < 27) return false;
    const y0 = A.y + (A.h - ch * rows) * P([0, .5, 1]), l = B.layer('hero', { read: true, gentle: true, quiet: true }), cloud = maybe(.55), f1 = R(.5, 1.1), f2 = R(.5, 1.1), p1 = R(0, 6), p2 = R(0, 6);
    us.forEach((u, i) => { const c = v ? cols - 1 - Math.floor(i / rows) : i % cols, r = v ? i % rows : Math.floor(i / cols), key = B.isKey(u), k = .5 + .5 * Math.sin(c * f1 + p1) * Math.cos(r * f2 + p2); B.glyph(l, u, A.x + (c + .5) * cw, y0 + (r + .5) * ch, s * (key ? 1.22 : 1), { c: key ? pal.a : pal.i, a: cloud && !key ? .34 + .66 * k : undefined }); });
    return true;
  } },

  { id: 'quote', w: 3, face: ['oldSerif', 'oldSerif', 'serif', 'lightSerif', 'heavySerif'], ok: B => B.N >= 10 && B.N <= 280, run(B){
    // 引号：一对巨大的引号把话捧住
    const { R, P, pal, A, maybe } = B, s = R(260, 460) * B.u, d = B.layer('deco', { bleed: true }), pad = s * .4, [o, c] = B.cjk && maybe(.5) ? ['「', '」'] : ['“', '”'], w = A.w * R(.6, .88), side = P([0, .5, 1]);
    const got = B.body(A.x + (A.w - w) * side, A.y + pad, w, A.h - pad * 2, { vertical: B.cjk && o === '「' && maybe(.6), max: 76, min: 28, va: 'mid', ha: 'center', layer: B.layer('hero', { read: true, gentle: true, body: true }) }); if (!got || B.solo) return false;
    const a = P([.18, .9, .9]), col = P([pal.a, pal.b]); B.glyph(d, o, Math.max(A.x + s * .2, got.x - s * .1), Math.max(A.y + s * .16, got.y - s * .2), s, { c: col, a }); B.glyph(d, c, Math.min(A.x + A.w - s * .2, got.x + got.w + s * .1), Math.min(A.y + A.h - s * .16, got.y + got.h + s * .22), s, { c: col, a });
    return true;
  } },

  { id: 'tilt', dup: true, w: 4, face: ['oldSerif', 'oldSerif', 'heavySans', 'heavySerif', 'serif'],
    ok: B => B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 10 && B.D > 10 && B.N < 280, run(B){
    // 倾斜：大字整个歪过去，小字站得笔直
    const { W, R, pal, P, A, maybe } = B, hu = B.hero.units, r = R(.1, .34) * P([1, -1]), rows = hu.length > 4 ? B.split(hu, 2) : [hu], zone = A.h * (B.solo ? .9 : .6), top = maybe(.65), w = A.w * 1.16, c = Math.abs(Math.cos(r)), k = Math.abs(Math.sin(r)), big = Math.max(...rows.map(q => B.emOf(q)));
    const s = Math.min(w / big, zone / (big * k + rows.length * c)); if (s < 70) return false;
    const cx = W / 2, cy = (top ? A.y : A.y + A.h - zone) + zone / 2, l = B.layer('hero', { bleed: true }); rows.forEach((q, i) => B.row(l, q, A.x + (A.w - big * s) / 2, cy + s * 1.02 * (i - (rows.length - 1) / 2), s, { align: 'left', c: i % 2 && maybe(.4) ? pal.a : pal.i })); bTurn(l, r, cx, cy);
    if (B.solo) return true; const g = 40 * B.u, by = top ? A.y + zone + g : A.y, bh = A.h - zone - g;
    return !!B.body(A.x + A.w * P([0, .42]), by, A.w * .56, bh, { max: 32, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 30, va: top ? 'bottom' : 'top' });
  } },

  { id: 'frame', w: 1, face: ['oldSerif', 'oldSerif', 'serif', 'lightSerif', 'sans'], ok: B => B.N >= 20 && B.N <= 260 && B.cjk && B.hero && B.hero.units.length <= 8, run(B){
    // 回廊：字贴着纸边走，一圈一圈往里绕，当中留一句
    const { W, R, pal, A, maybe } = B, us = B.units, em = us.map(u => B.em(u.t, 'body') + (u.sp ? .28 : 0));
    for (let s = 92; s >= 23; s--){
      const pitch = s * 1.8; let inset = s * .5, i = 0, loops = 0; const out = [];
      for (let loop = 0; loop < 4 && i < us.length; loop++){
        const x0 = A.x + inset, y0 = A.y + inset, x1 = A.x + A.w - inset, y1 = A.y + A.h - inset; if (x1 - x0 < A.w * .4) break;
        for (const [sx, sy, dx, dy, len, r] of [[x0, y0, 1, 0, x1 - x0, 0], [x1, y0, 0, 1, y1 - y0, Math.PI / 2], [x1, y1, -1, 0, x1 - x0, Math.PI], [x0, y1, 0, -1, y1 - y0 - pitch * (loop < 3 ? .2 : 0), -Math.PI / 2]]){ let p = s; while (i < us.length && p + em[i] * s * 1.08 <= len - s * .35){ const w = em[i] * s * 1.08; out.push([us[i], sx + dx * (p + w / 2), sy + dy * (p + w / 2), r]); p += w; i++; } }
        inset += pitch; loops++;
      }
      if (i < us.length) continue;
      const iw = A.w - inset * 2 - 40, ih = A.h - inset * 2 - 40; if (iw < A.w * .36) continue;
      const l = B.layer('hero', { read: true, gentle: true, body: true, quiet: true }); for (const [u, x, y, r] of out) B.glyph(l, u, x, y, s, { f: 'body', r, c: pal.i });
      const hu = bGhost(B.hero.units), c = B.layer('hero', { quiet: true }), cy = A.y + A.h / 2;
      if (hu.length > 2 || maybe(.5)){ const len = B.colLen(hu, 'hero', .06), q = Math.min(ih * R(.6, 1) / len, iw * .6, 220 * B.u); B.col(c, hu, W / 2, cy - len * q / 2, q, { gap: .06, c: pal.a }); } else { const q = Math.min(iw / B.emOf(hu), ih * .6, 280 * B.u); B.row(c, hu, W / 2, cy, q, { c: pal.a }); }
      return true;
    }
    return false;
  } },

  { id: 'stretch', w: 5, face: ['oldSerif', 'oldSerif', 'serif', 'lightSerif', 'sans', 'heavySerif'],
    ok: B => B.cjk && B.clauses.length >= 2 && B.clauses.length <= 9 && B.N <= 90 && B.clauses.every(c => c.n <= 16), run(B){
    // 拉长：每一句都拉到同样宽，字少的隔得远，像把一个词念得很慢
    const { R, P, pal, A, maybe } = B, rows = B.clauses.flatMap(c => c.n > 8 ? B.split(c.full, 2) : [c.full]), n = rows.length, v = maybe(.4), side = v ? A.h : A.w, cross = v ? A.w : A.h, most = Math.max(...rows.map(r => v ? B.colLen(r) : B.emOf(r))), s = Math.min(side * .92 / most, cross / n * R(.42, .7), 140 * B.u); if (s < 30 || n > 11) return false;
    const pitch = Math.min(cross / n, s * R(1.5, 2.8)), total = pitch * n, start = (cross - total) * P([0, .5, 1]), l = B.layer('hero', { read: true, gentle: true, body: s < 46, quiet: true });
    rows.forEach((r, i) => { const key = B.keyClause && r.includes(B.keyClause.units[0]), k = r.length; r.forEach((u, j) => { const t = k === 1 ? .5 : j / (k - 1), p = s / 2 + (side - s) * t, q = start + pitch * (i + .5); B.glyph(l, u, v ? A.x + A.w - q : A.x + p, v ? A.y + p : A.y + q, s, { c: key ? pal.a : pal.i, a: key || maybe(.7) ? undefined : .55, vp: v }); }); });
    return true;
  } },

  { id: 'recede', w: 4, face: ['oldSerif', 'oldSerif', 'heavySans', 'heavySerif', 'serif'],
    ok: B => B.cjk && B.clauses.length >= 2 && B.clauses.length <= 8 && B.N <= 80, run(B){
    // 渐远：一行比一行窄，像一条路走进纸里
    const { W, R, P, pal, A, maybe } = B, rows = B.clauses.flatMap(c => c.n > 7 ? B.split(c.full, 2) : [c.full]), n = rows.length, up = maybe(.4), cx = P([W / 2, W / 2, A.x + A.w * .32, A.x + A.w * .68]), end = R(.16, .34); if (n < 3) return false;
    const ws = rows.map((_, i) => A.w * (1 + (end - 1) * Math.pow((up ? n - 1 - i : i) / (n - 1), .8))), hs = rows.map((r, i) => Math.min(ws[i] / B.emOf(r), 230 * B.u)), gap = R(.1, .3), total = hs.reduce((a, h) => a + h * (1 + gap), 0), k = Math.min(1, A.h / total); if (Math.min(...hs) * k < 20) return false;
    const l = B.layer('hero', { read: true, gentle: true, quiet: true }); let y = A.y + (A.h - total * k) * (up ? 1 : P([0, .5, 1]));
    rows.forEach((r, i) => { const s = hs[i] * k, w = B.emOf(r) * s, t = (up ? n - 1 - i : i) / (n - 1), c = cx - w / 2 < A.x ? A.x + w / 2 : cx + w / 2 > A.x + A.w ? A.x + A.w - w / 2 : cx; B.row(l, r, c, y + s * (1 + gap) / 2, s, { c: pal.i, a: t > .1 ? 1 - t * .5 : undefined }); y += s * (1 + gap); });
    return true;
  } },
];
BLIND_COMPS.push(...BLIND_MORE);
for (const c of BLIND_COMPS) if (BLIND_MORE.includes(c) || ['inline', 'mosaic', 'blank'].includes(c.id)) c.warm = true;
