// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ④ 方案：每一种都是一张排好的实验字体海报
// ════════════════════════════════════════════════════════════════════
// 🔑 一种方案只管字怎么站：用哪类字、多大的反差、落在哪儿。底、光、质地、修图归 blind-looks。
//    图形和线条一律不进盲盒，人想要自己添。
// face ＝ 主角用哪一类字（blind-text 的 B_TYPE）；fx ＝ 允许再叠一道的效果（可没有）；
// dup  ＝ 主角是从正文里另抄出来的，正文仍有全文。
const BLIND_COMPS = [
  // ── 全文就是画面 ────────────────────────────────────────────────
  { id: 'block', w: 6, face: ['heavySans', 'heavySans', 'heavySerif'], fx: ['cuts', 'melt'],
    ok: B => B.clauses.length >= 2 && B.clauses.length <= 9 && B.N <= 78 && B.cjk, run(B){
    // 满版：一句一行，每行撑满两边，高矮悬殊
    const { R, P, maybe, pal, A } = B, rows = B.clauses.flatMap(c => c.n > 11 ? B.split(c.full, 2) : [c.full]), n = rows.length, gap = R(8, 16) * B.u;
    const q = R(1.28, 1.75), mode = P(['ramp', 'fall', 'one', 'fib', 'fib']), big = B.I(0, n - 1);
    let hs = rows.map((_, i) => mode === 'ramp' ? Math.pow(q, i) : mode === 'fall' ? Math.pow(q, n - 1 - i) : mode === 'one' ? (i === big ? n * 1.1 : 1) : P([1, 1, 1.6, 2.6, 4.2]));
    const cw = rows.map(r => A.w / B.emOf(r)), H = A.h - gap * (n - 1);
    for (let k = 0; k < 6; k++){ const s = hs.reduce((a, b) => a + b, 0); hs = hs.map((h, i) => Math.max(cw[i] * .42, Math.min(cw[i] * 4.6, h / s * H))); }
    const sum = hs.reduce((a, b) => a + b, 0); if (Math.abs(sum - H) > H * .03 || Math.min(...hs) < 26) return false;
    const l = B.layer('hero', { read: true, gentle: true }), bars = maybe(.2), hit = maybe(.55) ? rows.findIndex((r, i) => B.keyClause && r.includes(B.keyClause.units[0])) : -1;
    let y = A.y;
    rows.forEach((r, i) => {
      const on = bars && i % 2 === 1;
      if (on) l.ops.push({ k: 'r', x: 0, y: y - gap / 2, w: B.W, h: hs[i] + gap, c: i === hit ? pal.a : pal.i });
      B.fill(l, r, A.x, y, A.w, hs[i], { pad: cw[i] * .03, c: on ? pal.g : i === hit ? pal.a : pal.i });
      y += hs[i] + gap;
    });
    if (bars) l.bleed = l.onAccent = true;
    return true;
  } },

  { id: 'vblock', w: 4, face: ['heavySerif', 'heavySans'], fx: ['cuts', 'melt'],
    ok: B => B.cjk && B.clauses.length >= 2 && B.clauses.length <= 8 && B.N <= 64, run(B){
    // 竖满版：一句一列，从右往左，列列撑到底，宽窄悬殊
    const { R, P, pal, A } = B, cols = B.clauses.flatMap(c => c.n > 12 ? B.split(c.full, 2) : [c.full]), n = cols.length, gap = R(10, 20) * B.u;
    const ch = cols.map(c => A.h / B.colLen(c)), W = A.w - gap * (n - 1), q = R(1.3, 1.8), mode = P(['ramp', 'fall', 'fib', 'fib']);
    let ws = cols.map((_, i) => mode === 'ramp' ? Math.pow(q, i) : mode === 'fall' ? Math.pow(q, n - 1 - i) : P([1, 1, 1.6, 2.8, 4]));
    for (let k = 0; k < 6; k++){ const s = ws.reduce((a, b) => a + b, 0); ws = ws.map((w, i) => Math.max(ch[i] * .4, Math.min(ch[i] * 3.4, w / s * W))); }
    const sum = ws.reduce((a, b) => a + b, 0); if (Math.abs(sum - W) > W * .04 || Math.min(...ws) < 26) return false;
    const l = B.layer('hero', { read: true, gentle: true }), hit = B.maybe(.55) ? cols.findIndex(c => B.keyClause && c.includes(B.keyClause.units[0])) : -1;
    let x = A.x + A.w;
    cols.forEach((c, i) => { x -= ws[i]; B.fillCol(l, c, x, A.y, ws[i], A.h, { pad: ch[i] * .03, c: i === hit ? pal.a : pal.i }); x -= gap; });
    return true;
  } },

  { id: 'pack', w: 5, face: ['heavySans', 'heavySerif'], fx: ['cuts', 'misreg'],
    ok: B => B.cjk && B.clauses.length >= 3 && B.clauses.length <= 9 && B.clauses.every(c => c.n <= 13), run(B){
    // 回旋：一横一竖，贴着往里卷，把纸卷满
    const { R, maybe, pal, A } = B, gap = R(12, 24) * B.u, l = B.layer('hero', { read: true, gentle: true }), cs = B.clauses, n = cs.length;
    let r = { x: A.x, y: A.y, w: A.w, h: A.h }, horiz = maybe(.6);
    for (let i = 0; i < n; i++){
      const c = cs[i], last = i === n - 1, col = c === B.keyClause ? pal.a : pal.i, left = n - i;
      if (horiz){
        const natural = r.w / B.emOf(c.full), h = last ? Math.min(r.h, natural * 2.4) : Math.min(natural * R(.9, 1.5), r.h / left * R(1.1, 1.9), r.h * .62);
        if (h < 30 || natural < 20) return false;
        B.fill(l, c.full, r.x, r.y, r.w, h, { pad: natural * .03, c: col }); r = { x: r.x, y: r.y + h + gap, w: r.w, h: r.h - h - gap };
      } else {
        const natural = r.h / B.colLen(c.full), w = last ? Math.min(r.w, natural * 2.2) : Math.min(natural * R(.9, 1.4), r.w / left * R(1.1, 1.9), r.w * .6);
        if (w < 30 || natural < 20) return false;
        B.fillCol(l, c.full, r.x + r.w - w, r.y, w, r.h, { pad: natural * .03, c: col }); r = { x: r.x, y: r.y, w: r.w - w - gap, h: r.h };
      }
      if (!last && (r.w < 60 || r.h < 60)) return false;
      horiz = !horiz;
    }
    return true;
  } },

  { id: 'steps', w: 4, face: ['lightSerif', 'heavySans', 'serif', 'heavySerif'], fx: ['melt', 'drift'],
    ok: B => B.clauses.length >= 2 && B.clauses.length <= 9 && B.N <= 96, run(B){
    // 骰子：落点都在六栏的格线上，字只有三个号，大的那几个字贴着纸边
    const { P, I, maybe, pal, A } = B, rows = B.clauses.flatMap(c => c.n > 6 ? B.split(c.full, Math.ceil(c.n / 6)) : [c.full]), n = rows.length, col = A.w / 6, hit = maybe(.6) && B.keyClause ? Math.max(0, rows.findIndex(r => r.includes(B.keyClause.units[0]))) : I(0, n - 1), l = B.layer('hero', { read: true, gentle: true, body: B.N > 60 }); if (n > 10) return false;
    const small = Math.max(26, Math.min(44, A.h / n * .36)) * B.u, mid = Math.min(small * 1.9, A.h / n * .6), keyS = Math.min(A.w * P([.72, .9, 1]) / B.emOf(rows[hit]), A.h * .24);
    const ss = rows.map((r, i) => Math.min(i === hit ? keyS : P([small, small, mid]), A.w * .9 / B.emOf(r))), total = ss.reduce((a, b) => a + b, 0) * 1.1, air = A.h - total; if (air < n * 10) return false;
    const ws = rows.map(() => P([.3, .6, 1.4, 2.6])), sum = ws.slice(1).reduce((a, b) => a + b, 0) || 1; let y = A.y, at = I(0, 3), last = -1;
    rows.forEach((r, i) => {
      if (i) y += air * ws[i] / sum; const w = B.emOf(r) * ss[i], room = Math.max(0, Math.floor((A.w - w) / col + .02));
      if (i === hit) at = P([0, room]); else { at = Math.min(room, (at + P([1, 2, 3, 4])) % (room + 1)); if (at === last && room) at = (at + 1) % (room + 1); } last = at;
      B.row(l, r, at === room && room ? A.x + A.w - w : A.x + at * col, y + ss[i] * .55, ss[i], { align: 'left', c: i === hit && maybe(.6) ? pal.a : pal.i }); y += ss[i] * 1.1;
    });
    return true;
  } },

  { id: 'rain', w: 5, face: ['lightSerif', 'serif', 'heavySerif'], fx: ['melt', 'ink', 'drift'],
    ok: B => B.cjk && B.clauses.length >= 2 && B.clauses.length <= 11 && B.clauses.every(c => c.n <= 18), run(B){
    // 雨：一句一缕，越往下落得越急；身后还有许多听不清的雨
    const { W, H, I, R, P, pal, A, maybe } = B, cs = B.clauses, n = cs.length, key = B.keyClause, acc = R(.02, .09), off = (i, len) => i + acc * i * i * 8 / Math.max(6, len), L = c => c.full.reduce((a, u) => a + (u.latin ? B.em(u.t) : 1), 0);
    const lenOf = c => off(L(c) - 1, L(c)) + 1, cw = A.w / n, keyS = Math.min(A.w * (n < 4 ? .2 : .17), A.h * .9 / lenOf(key)), rest = (A.w - keyS * 1.2) / Math.max(1, n - 1), s = Math.min(rest * .62, 62 * B.u, A.h * .84 / Math.max(...cs.map(lenOf))); if (s < 24 || keyS < s * 1.15) return false;
    const drop = (l, us, x, y, z, o) => { let k = 0; us.forEach(u => { const w = u.latin ? B.em(u.t) : 1, i = k + (w - 1) / 2; B.glyph(l, u, x, y + z * (off(i, us.length) + .5), z, { r: u.latin ? Math.PI / 2 : 0, vp: true, ...o }); k += w; }); };
    const back = I(7, 12);
    for (let i = 0; i < back; i++){ const t = R(0, 1), g = bGhost(P(cs).full.filter(u => !u.punct)), z = s * R(.5, 1 + t * 2.6), d = B.layer('deco', { bleed: true, ...(t > .45 ? { soft: t * 14 * B.u } : {}) }); drop(d, g, W * (i + R(.1, .9)) / back, H * R(-.25, .62), z, { c: maybe(.3) ? B.kin : pal.i, a: R(.05, .17) }); }
    const l = B.layer('hero', { read: true, gentle: true, body: s < 44, quiet: true }); let x = A.x + A.w, at = R(0, 1);
    cs.forEach(c => { const big = c === key, w = big ? keyS * 1.2 : rest, z = big ? keyS : s, len = lenOf(c) * z; at = (at + R(.28, .62)) % 1; x -= w; drop(l, c.full, x + w / 2 + (big ? 0 : R(-.12, .12) * w), A.y + (A.h - len) * (big ? R(.1, .8) : at), z, { c: big && maybe(.6) ? pal.a : pal.i }); });
    return true;
  } },

  { id: 'field', w: 5, face: ['heavySans', 'heavySerif', 'sans'], fx: ['melt'],
    ok: B => B.N >= 12 && B.N <= 150 && B.cjk && !B.core.some(u => u.latin && u.t.length > 5), run(B){
    // 字场：一格一字，大小跟着一个看不见的场起伏
    const { R, P, pal, A, maybe } = B, us = B.core, n = us.length, v = maybe(.5);
    const cols = Math.max(3, Math.round(Math.sqrt(n * A.w / A.h))), rows = Math.ceil(n / cols), cw = A.w / cols, ch = A.h / rows, m = Math.min(cw, ch); if (m < 34) return false;
    const cx = P([.18, .5, .82, R(.2, .8)]), cy = P([.18, .5, .82, R(.2, .8)]), kind = P(['in', 'out', 'diag', 'band']), ang = R(0, 6.28), l = B.layer('hero', { read: true, gentle: true }), tint = maybe(.5);
    us.forEach((u, i) => {
      const c = v ? cols - 1 - Math.floor(i / rows) : i % cols, r = v ? i % rows : Math.floor(i / cols), x = (c + .5) / cols, y = (r + .5) / rows, d = Math.hypot(x - cx, (y - cy) * A.h / A.w) / 1.05;
      const t = kind === 'in' ? 1 - Math.min(1, d) : kind === 'out' ? Math.min(1, d) : kind === 'diag' ? (x * Math.cos(ang) + y * Math.sin(ang) + 1) / 2 : .5 + .5 * Math.sin((x * Math.cos(ang) + y * Math.sin(ang)) * 9);
      const s = m * (.22 + .92 * Math.pow(Math.max(0, Math.min(1, t)), 1.5)) / Math.max(1, B.em(u.t));
      B.glyph(l, u, A.x + (c + .5) * cw, A.y + (r + .5) * ch, Math.max(19, s), { c: tint && t > .8 ? pal.a : pal.i });
    });
    return true;
  } },

  { id: 'path', w: 1, face: ['sans', 'lightSerif', 'heavySans'], ok: B => B.N >= 8 && B.N <= 72, run(B){
    // 一笔：整段字走成一条干净的曲线
    const { W, H, R, P, pal, A, maybe } = B, us = B.units, kind = P(['s', 'arc', 's']), X = t => A.x + A.w * t, Y = t => A.y + A.h * t;
    const ctrl = kind === 's' ? [[X(.06), Y(.1)], [X(.86), Y(.12)], [X(.95), Y(.36)], [X(.4), Y(.48)], [X(.06), Y(.64)], [X(.2), Y(.86)], [X(.94), Y(.9)]]
      : kind === 'arc' ? [[X(.04), Y(.94)], [X(.1), Y(.5)], [X(.36), Y(.16)], [X(.72), Y(.1)], [X(.96), Y(.22)]]
      : [[X(.02), Y(.62)], [X(.34), Y(.72)], [X(.72), Y(.6)], [X(.8), Y(.3)], [X(.52), Y(.16)], [X(.28), Y(.34)], [X(.42), Y(.66)], [X(.74), Y(.84)], [X(.98), Y(.82)]];
    if (maybe(.4)) ctrl.forEach(p => { p[1] = A.y * 2 + A.h - p[1]; });
    const pts = bKnead(bEven(bSpline(ctrl, 4), 3), 24), len = (pts.length - 1) * 3, em = us.map(u => B.em(u.t) + (u.sp ? .28 : 0)), sum = em.reduce((a, b) => a + b, 0), s = Math.min(len / (sum * 1.06), 150 * B.u); if (s < 24) return false;
    const gap = Math.min(.5, len / (sum * s) - 1), l = B.layer('hero', { read: true, gentle: true, body: s < 44 }); let d = Math.max(0, (len - sum * s * (1 + gap)) / 2);
    us.forEach((u, i) => {
      const w = em[i] * s * (1 + gap), m = Math.min(pts.length - 2, Math.round((d + w / 2) / 3)), a = pts[Math.max(0, m - 6)], b = pts[Math.min(pts.length - 1, m + 6)];
      B.glyph(l, u, pts[m][0], pts[m][1], s, { r: Math.atan2(b[1] - a[1], b[0] - a[0]), c: B.isKey(u) ? pal.a : pal.i }); d += w;
    });
    return true;
  } },

  { id: 'inline', w: 8, face: ['oldSerif', 'oldSerif', 'serif', 'heavySerif', 'heavySans'], ok: B => B.N >= 14 && B.N <= 300 && B.keyClause, run(B){
    // 句中：版面规规矩矩，就那几个字忽然大声
    const { R, P, pal, A, maybe } = B, v = B.cjk && maybe(.62), key = B.keyClause, src = B.text;
    let a = key.units[0].at; const last = key.units[key.units.length - 1]; let b = last.at + last.t.length;
    while (a > 0 && Q_OPEN.includes(src[a - 1])) a--;
    while (b < src.length && NO_START.includes(src[b])) b++;
    const parts = [[0, a], [a, b], [b, src.length]], side = v ? A.h : A.w, flow0 = v ? A.w : A.h, bigUnits = bUnits(src.slice(a, b)).map(u => ({ ...u, at: u.at + a }));
    const bigS = Math.min(side / B.emOf(bigUnits), flow0 * R(.16, .3)); if (bigS < 60) return false;
    for (let s = 40; s >= 22; s--){
      B.ctx.font = `${s}px ${B.fonts.body}`;
      const sets = [parts[0], parts[2]].map(([x, y]) => { const t = src.slice(x, y); return t.trim() ? buildItems(B.ctx, t, side * (v ? 1 : .8), s, v, null).items.map(it => ({ ...it, at: it.at === undefined ? undefined : it.at + x })) : []; });
      const flows = sets.map(q => q.reduce((m, it) => m + it.h, 0)), gap = s * 1.5, total = flows[0] + flows[1] + bigS * 1.05 + gap * 2;
      if (total > flow0) continue;
      const l = B.layer('hero', { read: true, gentle: true, body: true }), h = B.layer('hero', { read: true, gentle: true });
      let p = (flow0 - total) * P([0, .5, 1]);
      const run = items => { for (const it of items){ if (!it.gap){ B.ctx.font = `${s}px ${B.fonts.body}`; const len = v ? vAdvance(B.ctx, it.text, s) : B.ctx.measureText(it.text).width; l.ops.push(v ? { k: 'v', t: it.text, at: it.at, src: 'text', x: A.x + A.w - p - it.h, y: A.y, s, len, c: pal.i } : { k: 'l', t: it.text, at: it.at, src: 'text', x: A.x, y: A.y + p, s, len, c: pal.i }); } p += it.h; } };
      run(sets[0]); if (sets[0].length) p += gap * .6;
      const col = maybe(.5) ? pal.a : pal.i, show = bigUnits.filter(u => !u.punct || /[？！?!…]/.test(u.t));
      if (v) B.col(h, show, A.x + A.w - p - bigS / 2, A.y, bigS, { c: col }); else B.row(h, show, A.x, A.y + p + bigS * .52, bigS, { align: 'left', c: col });
      p += bigS * 1.05 + gap; run(sets[1]);
      return true;
    }
    return false;
  } },

  // ── 主角放大，正文守在格子里 ────────────────────────────────────
  { id: 'swiss', dup: true, w: 6, face: ['heavySans', 'heavySans', 'heavySerif', 'lightSans'], fx: ['melt', 'ink', 'drift', 'cuts', 'misreg', 'dither'],
    ok: B => B.hero && B.hero.units.length <= 10 && B.D > 10 && B.N < 420, run(B){
    // 网格：大标题顶着左边，底下正文落在栏里
    const { P, maybe, pal, A } = B, hu = B.hero.units, n = hu.length <= 2 ? 1 : hu.length <= 5 ? P([1, 2]) : P([2, 2, 3]), rows = B.split(hu, n), col = A.w / 6, gut = 22 * B.u;
    const s = Math.min(...rows.map(r => A.w / B.emOf(r)), A.h * (B.solo ? .5 : .44) / rows.length), zone = rows.length * s * .98, top = maybe(.62), l = B.layer('hero');
    if (s < 90) return false;
    const y0 = top ? A.y : A.y + A.h - zone;
    rows.forEach((r, i) => B.row(l, r, A.x - s * .02, y0 + s * .98 * (i + .5), s, { align: 'left', c: pal.i }));
    if (B.solo) return true;
    const gap = 44 * B.u, by = top ? A.y + zone + gap : A.y, bh = A.h - zone - gap;
    if (maybe(.5)) B.layer('deco').ops.push({ k: 'r', x: A.x, y: top ? by - gap * .5 : by + bh + gap * .5 - 1.4, w: A.w, h: 1.4, c: pal.i });
    const at = P([0, 0, 2, 3]), w = col * (6 - at) - gut;
    return !!B.body(A.x + col * at, by, Math.min(w, col * 4 - gut), bh, { max: 32, va: top ? P(['top', 'bottom']) : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 30 });
  } },

  { id: 'pillar', dup: true, w: 5, face: ['heavySerif', 'heavySans', 'lightSerif'], fx: ['melt', 'ink', 'drift', 'cuts', 'misreg', 'dither'],
    ok: B => B.cjk && B.hero && B.D > 12 && B.N < 380 && B.hero.units.length <= 9, run(B){
    // 立柱：主角一列顶天立地，正文贴着另一边
    const { R, P, maybe, pal, A } = B, hu = B.hero.units, n = B.colLen(hu), ch = A.h / n, w = Math.min(A.w * R(.28, .46), ch * 1.5), right = maybe(.65), x = right ? A.x + A.w - w : A.x;
    if (ch < w * .34) return false;
    const l = B.layer('hero'); B.fillCol(l, hu, x, A.y, w, A.h, { pad: ch * .03, c: P([pal.i, pal.i, pal.a]) });
    if (B.solo) return true;
    const gap = R(60, 100) * B.u, bw = A.w - w - gap, bx = right ? A.x : A.x + w + gap, h = A.h * P([.46, .6, .8]);
    return !!B.body(bx, A.y, bw, h, { vertical: true, max: 34, ha: right ? P(['right', 'left']) : 'right' }) || !!B.body(bx, A.y, bw, A.h, { vertical: true, max: 32, ha: 'right' });
  } },

  { id: 'skyline', dup: true, w: 5, face: ['heavySans', 'heavySerif'], fx: ['cuts', 'misreg'],
    ok: B => B.cjk && B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 8 && B.D > 10 && B.N < 300, run(B){
    // 天际线：一排字等宽，高矮不齐地长上去（或挂下来）
    const { R, P, I, pal, A, maybe } = B, hu = B.hero.units, n = hu.length, zone = A.h * (B.solo ? .96 : R(.56, .66)), up = maybe(.6), gap = R(6, 14) * B.u, cw = (A.w - gap * (n - 1)) / n, kind = P(['ramp', 'fall', 'sin', 'rand', 'v']), l = B.layer('hero');
    let prev = -1;
    hu.forEach((u, i) => {
      const t = n > 1 ? i / (n - 1) : 1; let k = kind === 'ramp' ? t : kind === 'fall' ? 1 - t : kind === 'sin' ? .5 + .5 * Math.sin(t * 5.2 + 1) : kind === 'v' ? Math.abs(t * 2 - 1) : P([.1, .3, .55, .8, 1].filter(q => q !== prev));
      prev = k; const h = Math.min(zone, Math.max(cw * .62, zone * (.2 + .8 * k)));
      B.glyph(l, u, A.x + cw / 2 + i * (cw + gap), up ? A.y + zone - h / 2 : A.y + A.h - zone + h / 2, 100, { cell: [cw, h], c: pal.i });
    });
    if (B.solo) return true;
    const g = 48 * B.u, bh = A.h - zone - g;
    return !!B.body(A.x + A.w * P([0, 1 / 3]), up ? A.y + zone + g : A.y, A.w * .64, bh, { max: 32, va: up ? 'top' : 'bottom' }) || !!B.body(A.x, up ? A.y + zone + g : A.y, A.w, bh, { max: 30, va: up ? 'top' : 'bottom' });
  } },

  { id: 'ramp', dup: true, w: 5, face: ['heavySans', 'heavySerif'],
    ok: B => B.cjk && B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 9 && B.D > 10 && B.N < 260, run(B){
    // 变奏：同一句，从一条缝一直拉到半张纸
    const { R, I, P, pal, A, maybe } = B, hu = B.hero.units, n = I(6, 9), zone = A.h * (B.solo ? 1 : R(.62, .7)), q = R(1.42, 1.72), gap = 8 * B.u, down = maybe(.6), l = B.layer('hero');
    const raw = Array.from({ length: n }, (_, i) => Math.pow(q, down ? i : n - 1 - i)), sum = raw.reduce((a, b) => a + b, 0), hs = raw.map(h => h / sum * (zone - gap * (n - 1))), top = B.solo || maybe(.6), cw = A.w / B.emOf(hu);
    if (Math.max(...hs) > cw * 4.4) return false;
    let y = top ? A.y : A.y + A.h - zone; const mark = maybe(.4) ? (down ? n - 1 : 0) : -1;
    hs.forEach((h, i) => { B.fill(l, hu, A.x, y, A.w, h, { pad: cw * .02, c: i === mark ? pal.a : pal.i }); y += h + gap; });
    if (B.solo) return true;
    const g = 46 * B.u, bh = A.h - zone - g, by = top ? A.y + zone + g : A.y;
    return !!B.body(A.x + A.w * P([0, 1 / 3, .5]), by, A.w * .5, bh, { max: 30, va: top ? 'top' : 'bottom' }) || !!B.body(A.x, by, A.w * .8, bh, { max: 30 }) || !!B.body(A.x, by, A.w, bh, { max: 26, min: 20 });
  } },

  { id: 'contour', dup: true, w: 2, face: ['heavySans', 'heavySerif'],
    ok: B => B.cjk && (B.word || B.hero) && B.D > 8 && B.N < 300, run(B){
    // 等高线：一两个字往外一圈一圈地扩
    const { W, H, R, I, P, pal, A, maybe, M } = B, us = (B.solo ? B.hero.units : B.word ? [...B.word.t] : B.hero.units.slice(0, 2)).slice(0, 4), n = us.length, stack = n > 1 && (n > 2 || maybe(.5));
    const zone = A.h * (B.solo ? 1 : R(.6, .68)), top = B.solo || maybe(.65), y0 = top ? A.y : A.y + A.h - zone, d = R(9, 16) * B.u, s = stack ? Math.min(zone * .62 / n, W * .5) : Math.min(W * .62 / n, zone * .56), rings = Math.max(6, Math.floor(((stack ? zone - s * n : zone - s) / 2 - 6) / d));
    const l = B.layer('hero', { bleed: true, clip: { x: 0, y: y0, w: W, h: zone }, nofx: true }), rr = { n: rings, d, c1: pal.i, c2: pal.g };
    const at = i => stack ? [W / 2, y0 + zone / 2 + (i - (n - 1) / 2) * s * .96] : [W / 2 + (i - (n - 1) / 2) * s * .96, y0 + zone / 2];
    for (let k = rings; k >= 1; k--) us.forEach((u, i) => { const [x, y] = at(i); B.glyph(l, u, x, y, s, { o: k * d * 2, c: k % 2 ? pal.g : pal.i, deco: true, hole: k % 2 === 1 }); });
    us.forEach((u, i) => { const [x, y] = at(i); B.glyph(l, u, x, y, s, { c: maybe(.5) ? pal.a : pal.i }); });
    if (B.solo) return true;
    const g = 40 * B.u, by = top ? A.y + zone + g : A.y, bh = A.h - zone - g;
    return !!B.body(A.x + A.w * P([0, 1 / 3]), by, A.w * .66, bh, { max: 30, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 28, min: 20 });
  } },

  { id: 'overprint', dup: true, w: 5, face: ['heavySans', 'heavySerif'],
    ok: B => B.cjk && B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 6 && B.D > 8 && B.N < 300, run(B){
    // 叠印：几个大字压着印，两色一叠出第三色
    const { W, H, R, P, pal, A, maybe } = B, hu = B.hero.units, n = hu.length, zone = A.h * (B.solo ? 1 : R(.62, .7)), top = B.solo || maybe(.65), y0 = top ? A.y : A.y + A.h - zone, kind = P(['diag', 'stack', 'row']);
    const s = kind === 'row' ? Math.min(zone * .98, A.w / (1 + (n - 1) * .56)) : kind === 'stack' ? Math.min(A.w * .9, zone / (1 + (n - 1) * .5)) : Math.min(A.w / (1 + (n - 1) * .44), zone / (1 + (n - 1) * .44));
    if (s < 190 * B.u) return false;
    const cols = bHueGap(bLch(pal.a)[2], bLch(pal.b)[2]) > 125 ? [pal.a, pal.i] : [pal.a, pal.b];      // 隔太远的两色叠出来是泥
    hu.forEach((u, i) => {
      const t = n > 1 ? i / (n - 1) : 0, x = kind === 'stack' ? A.x + A.w / 2 + (i % 2 ? 1 : -1) * A.w * .04 : A.x + s / 2 + (A.w - s) * t, y = kind === 'row' ? y0 + zone / 2 + (i % 2 ? 1 : -1) * zone * .03 : y0 + s / 2 + (zone - s) * t;
      const l = B.layer('hero', { blend: B.dark ? 'screen' : 'multiply', nofx: false, quiet: true }); B.glyph(l, u, x, y, s, { c: cols[i % 2] });
    });
    if (B.solo) return true;
    const g = 46 * B.u, bh = A.h - zone - g, by = top ? A.y + zone + g : A.y;
    return !!B.body(A.x + A.w * P([0, 1 / 3]), by, A.w * .66, bh, { max: 30, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 28, min: 20 });
  } },

  { id: 'cut', dup: true, w: 5, face: ['heavySans', 'heavySerif'],
    ok: B => B.cjk && B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 9 && B.D > 10 && B.N < 320, run(B){
    // 错切：大字横着切成等宽的条，错开半拍
    const { R, P, pal, A, maybe } = B, hu = B.hero.units, rows = B.split(hu, hu.length <= 3 ? 1 : hu.length <= 6 ? 2 : 3), zone = A.h * (B.solo ? .94 : R(.54, .64)), rh = zone / rows.length, top = B.solo || maybe(.65), y0 = top ? A.y : A.y + A.h - zone;
    if (rows.some(r => { const c = A.w / B.emOf(r); return rh > c * 2.6 || rh < c * .5; })) return false;
    const l = B.layer('hero', { fx: ['cuts'], own: true }); rows.forEach((r, i) => B.fill(l, r, A.x + A.w * .04, y0 + rh * i, A.w * .92, rh * .95, { pad: A.w / B.emOf(r) * .04, c: pal.i }));
    if (B.solo) return true;
    const g = 50 * B.u, bh = A.h - zone - g, by = top ? A.y + zone + g : A.y;
    return !!B.body(A.x + A.w * P([0, .5, 1 / 3]), by, A.w * .5, bh, { max: 30, va: top ? 'top' : 'bottom' }) || !!B.body(A.x, by, A.w * .8, bh, { max: 30 }) || !!B.body(A.x, by, A.w, bh, { max: 28, min: 20 });
  } },

  { id: 'shutter', dup: true, w: 1, face: ['heavySans', 'heavySerif'],
    ok: B => B.cjk && B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 6 && B.D > 10 && B.N < 300 && B.clauses.some(c => c.t !== B.hero.t && c.n >= 2 && c.n <= 7), run(B){
    // 交错：两句话隔着一道道百叶，各露一半
    const { R, P, pal, A, maybe } = B, other = P(B.clauses.filter(c => c.t !== B.hero.t && c.n >= 2 && c.n <= 7)), zone = A.h * R(.52, .62), top = maybe(.65), y0 = top ? A.y : A.y + A.h - zone, rowsA = B.split(B.hero.units, B.hero.units.length > 3 ? 2 : 1), rowsB = B.split(other.units, other.n > 3 ? 2 : 1);
    const p = R(26, 64) * B.u, st = { p, duty: .5, vert: maybe(.75) }, put = (l, rows, c) => rows.forEach((r, i) => B.fill(l, r, A.x, y0 + zone / rows.length * i, A.w, zone / rows.length * .97, { c }));
    put(B.layer('hero', { nofx: true, stripes: { ...st, inv: false } }), rowsA, pal.i); put(B.layer('hero', { nofx: true, stripes: { ...st, inv: true } }), rowsB, pal.a);
    const g = 50 * B.u, bh = A.h - zone - g, by = top ? A.y + zone + g : A.y;
    return !!B.body(A.x + A.w * P([0, 1 / 3]), by, A.w * .62, bh, { max: 30, va: top ? 'top' : 'bottom' }) || !!B.body(A.x, by, A.w, bh, { max: 28, min: 20 });
  } },

  { id: 'melt', dup: true, w: 5, face: ['heavySans', 'heavySerif', 'lightSerif'],
    ok: B => B.hero && B.hero.units.length <= 8 && B.D > 10 && B.N < 320, run(B){
    // 渐糊：同一句叠几遍，一遍比一遍失焦
    const { R, I, P, pal, A, maybe } = B, hu = B.hero.units, zone = A.h * (B.solo ? .96 : R(.56, .66)), n = I(3, 5), em = B.emOf(hu), s = Math.min(A.w / em, zone / n * 1.12), pitch = Math.min(s * 1.02, (zone - s) / (n - 1)), top = B.solo || maybe(.6), y0 = (top ? A.y : A.y + A.h - zone) + s / 2, rev = maybe(.5), left = maybe(.5);
    if (s < 84) return false;
    for (let i = 0; i < n; i++){
      const k = rev ? i : n - 1 - i, l = B.layer('hero', { nofx: k > 0, soft: k ? Math.pow(k / (n - 1), 1.4) * R(.2, .3) * s : 0 });
      B.row(l, hu, left ? A.x : A.x + A.w / 2, y0 + pitch * i, s, { align: left ? 'left' : 'center', c: pal.i });
      if (k) l.ops.forEach(o => { delete o.at; });
    }
    if (B.solo) return true;
    const g = 48 * B.u, bh = A.h - zone - g, by = top ? A.y + zone + g : A.y;
    return !!B.body(A.x + A.w * P([0, 1 / 3]), by, A.w * .6, bh, { max: 30, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 28, min: 20 });
  } },

  { id: 'slit', dup: true, w: 4, modes: ['top'], face: ['heavySans', 'heavySerif'],
    ok: B => B.cjk && B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 7 && B.D > 10 && B.N < 240, run(B){
    // 狭缝：字扫到一半，机器停住了，剩下的一直拉到纸边
    const { W, H, R, P, pal, A, maybe, M } = B, hu = B.hero.units, rows = B.split(hu, hu.length > 4 ? 2 : 1), zone = A.h * R(.4, .5), rh = zone / rows.length;
    if (rows.some(r => { const c = A.w / B.emOf(r); return rh > c * 2.4 || rh < c * .55; })) return false;
    const l = B.layer('hero', { fx: ['slit'], own: true, bleed: true, cutAt: R(.62, .8) }); rows.forEach((r, i) => B.fill(l, r, A.x, A.y + rh * i, A.w, rh * .97, { c: pal.i }));
    if (B.solo) return true;
    // 正文压在一块干净的底上
    const card = B.layer('body', { read: true }), pad = 30 * B.u, w = A.w * P([.5, .62]), x = P([A.x, A.x + A.w - w]), max = A.h * .4;
    const got = B.body(x + pad, A.y + A.h - max + pad, w - pad * 2, max - pad * 2, { max: 28, min: 20, va: 'bottom', layer: card }); if (!got) return false;
    card.ops.unshift({ k: 'r', x, y: got.y - pad, w, h: got.h + pad * 2, c: pal.g, hole: true }); return true;
  } },

  { id: 'micro', dup: true, w: 5, face: ['heavySans', 'heavySerif'],
    ok: B => B.cjk && B.word && B.N > 12 && B.N < 260, run(B){
    // 字中字：远看是一个字，近看是一整篇
    const { W, H, R, P, pal, A, maybe } = B, ch = [...B.word.t], zone = A.h * R(.68, .74), top = maybe(.7), y0 = top ? A.y : A.y + A.h - zone, s = Math.min(A.w * 1.02 / ch.length, zone * (ch.length > 1 ? 1 : 1.02)), hole = maybe(.35);
    const z = R(15, 20) * B.u, lh = z * 1.28, l = B.layer('hero', { nofx: true, bleed: true, tex: true, mask: { mode: hole ? 'out' : 'in', ops: [] }, clip: { x: A.x, y: y0, w: A.w, h: zone } });
    ch.forEach((t, i) => l.mask.ops.push({ k: 'g', t, x: A.x + A.w / 2 + (i - (ch.length - 1) / 2) * s * .97, y: y0 + zone / 2, s, f: 'hero', c: '#000' }));
    const rep = B.core.map(u => u.t).join(B.cjk ? '' : ' '), per = Math.ceil(A.w / z) + 4; let k = 0;
    for (let y = y0; y < y0 + zone; y += lh){ let t = ''; while ([...t].length < per) { t += rep[k % rep.length]; k++; } l.ops.push({ k: 'l', t, x: A.x - z * R(0, 1), y, s: z, len: A.w, c: pal.i, heavy: 2 }); }
    const g = 40 * B.u, bh = A.h - zone - g, by = top ? A.y + zone + g : A.y;
    return !!B.body(A.x + A.w * P([0, 1 / 3]), by, A.w * .66, bh, { max: 28, min: 20, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 26, min: 20 });
  } },

  { id: 'giant', dup: true, w: 5, face: ['heavySerif', 'heavySans'], fx: ['dither', 'ink', 'drift'],
    ok: B => B.cjk && (B.word || B.hero) && B.D > 8 && B.N < 340, run(B){
    // 出血：一个字大到纸装不下，小字从它身上穿过去就反色
    const { W, H, R, P, pal, A, maybe } = B, t = B.solo ? B.core[0] : B.word ? (bDense(B.word.t) || [...B.word.t][0]) : B.hero.units[0], s = W * R(1.18, 1.55), c = P([pal.a, pal.i, pal.i]);
    const [gx, gy] = P([[.72, .62], [.3, .64], [.66, .34], [.5, .5]]), op = { k: 'g', t: t.t || t, x: W * gx, y: H * gy, s, f: 'hero', c };
    const l = B.layer('hero', { bleed: true }); l.ops.push({ ...op, ...(t.at !== undefined ? { at: t.at, src: 'text' } : {}) }); B.maskOps = [op]; B.maskC = bOn(c, pal);
    if (B.solo){ const us = B.core.slice(1), z = Math.min(64 * B.u, A.h / B.colLen(us, 'body', .3)), q = B.layer('body', { read: true }); if (z < 30) return false; B.col(q, us, A.x + z / 2, A.y, z, { f: 'body', gap: .3, c: pal.i }); const k = B.layer('body', { mask: { mode: 'in', ops: [op] }, twin: true }); k.ops = q.ops.map(o => ({ ...o, c: bOn(c, pal) })); l.read = true; return true; }
    const v = maybe(.45), w = A.w * R(.4, .56), h = A.h * R(.36, .6), q = B.layer('body', { read: true });
    const got = B.body(gx > .5 ? A.x : A.x + A.w - w, gy > .5 ? A.y : A.y + A.h - h, w, h, { vertical: v, max: 30, min: 21, va: gy > .5 ? 'top' : 'bottom', ha: gx > .5 ? 'left' : 'right', layer: q }) ||
                B.body(A.x, A.y, A.w, A.h * .7, { max: 28, min: 20, layer: q });
    if (!got) return false;
    const k = B.layer('body', { mask: { mode: 'in', ops: [op] }, twin: true }); k.ops = q.ops.map(o => ({ ...o, c: bOn(c, pal) }));
    return true;
  } },

  { id: 'grainy', dup: true, w: 4, face: ['heavySans', 'heavySerif'],
    ok: B => B.cjk && (B.word || B.hero) && B.D > 8 && B.N < 320, run(B){
    // 点阵：一两个大字，一头是实的，一头散成方格子
    const { R, P, pal, A, maybe } = B, us = (B.solo ? B.hero.units : B.word ? [...B.word.t] : B.hero.units.slice(0, 2)), n = us.length; if (n > 5) return false;
    const zone = A.h * (B.solo ? 1 : R(.62, .7)), top = B.solo || maybe(.65), y0 = top ? A.y : A.y + A.h - zone, rows = n > 2 ? B.split(us.map(u => u.t ? u : { t: u }), 2) : [us.map(u => u.t ? u : { t: u })], rh = zone / rows.length;
    const l = B.layer('hero', { fx: ['dither'], own: true }); rows.forEach((r, i) => B.fill(l, r, A.x, y0 + rh * i, A.w, rh * .97, { pad: 4, c: P([pal.i, pal.a]) }));
    if (rows.some(r => { const c = A.w / B.emOf(r); return rh > c * 2.2 || rh < c * .45; })) return false;
    if (B.solo) return true;
    const g = 44 * B.u, bh = A.h - zone - g, by = top ? A.y + zone + g : A.y;
    return !!B.body(A.x + A.w * P([0, 1 / 3, .5]), by, A.w * .5, bh, { max: 30, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 28, min: 20 });
  } },

  { id: 'shift', dup: true, w: 4, face: ['heavySans', 'heavySerif', 'sans'],
    ok: B => B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 9 && B.D > 10 && B.N < 280, run(B){
    // 错行：一句话铺满一面墙，一行挪一格，只有一行是说给你听的
    const { W, R, I, P, pal, A, maybe } = B, hu = B.hero.units, zone = A.h * (B.solo ? 1 : R(.62, .7)), top = B.solo || maybe(.6), y0 = top ? A.y : A.y + A.h - zone, n = I(7, 12), lh = zone / n, s = lh * .94, em = B.emOf(hu) + .6, step = R(.35, 1.1) * s * P([1, -1]), main = I(1, n - 2), ghost = bMix(pal.g, pal.i, B.dark ? .2 : .13);
    const g0 = B.layer('deco', { bleed: true, clip: { x: 0, y: y0, w: W, h: zone } }), l = B.layer('hero', { bleed: true, read: B.solo, nofx: true });
    for (let i = 0; i < n; i++){
      let x = A.x + step * (i - main); while (x > A.x) x -= em * s; const y = y0 + lh * (i + .5);
      for (; x < W + em * s; x += em * s){ const me = i === main && Math.abs(x - A.x) < 1; B.row(me ? l : g0, me ? hu : hu.map(u => ({ ...u, at: undefined })), x, y, s, { align: 'left', c: me ? pal.a : ghost }); }
    }
    if (!l.ops.length) return false;
    if (B.emOf(hu) * s > A.w) return false;
    if (B.solo) return true;
    const g = 46 * B.u, bh = A.h - zone - g, by = top ? A.y + zone + g : A.y;
    return !!B.body(A.x + A.w * P([0, 1 / 3]), by, A.w * .6, bh, { max: 30, va: top ? 'top' : 'bottom' }) || !!B.body(A.x, by, A.w, bh, { max: 28, min: 20 });
  } },

  { id: 'half', dup: true, w: 4, face: ['heavySerif', 'heavySans'], modes: ['left', 'side'], fx: ['cuts'],
    ok: B => B.cjk && B.hero && B.hero.units.length <= 8 && B.D > 12 && B.N < 340, run(B){
    // 对开：纸分两色，大字骑在缝上，过缝就反色
    const { W, H, R, P, pal, A, maybe, M } = B, hu = B.hero.units, t = P([1 / 3, .5, .5, .618]), vert = maybe(.5), on = bOn(pal.a, pal), d = B.layer('back', { bleed: true, nofx: true });
    const panel = vert ? { k: 'r', x: 0, y: 0, w: W * t, h: H, c: pal.a } : { k: 'r', x: 0, y: 0, w: W, h: H * t, c: pal.a }; d.ops.push(panel); B.maskOps = [panel]; B.maskC = on;
    const l = B.layer('hero', { quiet: true }), tw = B.layer('hero', { mask: { mode: 'in', ops: [panel] }, twin: true, nofx: true });
    if (vert){ const s = Math.min(A.w / B.emOf(hu), A.h * .3); if (s < 90) return false; B.row(l, hu, A.x + A.w / 2, A.y + s * .55 + (A.h * .34 - s) * .5, s, { c: pal.i }); tw.ops = l.ops.map(o => ({ ...o, c: on }));
      const y = A.y + A.h * .42, bx = W * t + M * .7, bw = W - M - bx; B.metaBox = { x: bx, w: bw }; if (B.solo) return true; return !!B.body(bx, y, bw, A.y + A.h - y, { max: 30, min: 20, va: 'bottom' }); }
    const n = B.colLen(hu), w = Math.min(A.w * .4, A.h / n * 1.3); B.fillCol(l, hu, A.x + A.w - w, A.y, w, A.h, { pad: A.h / n * .03, c: pal.i }); tw.ops = l.ops.map(o => ({ ...o, c: on }));
    if (B.solo) return true;
    const y = H * t + 46 * B.u; return !!B.body(A.x, y, A.w - w - 56 * B.u, A.y + A.h - y, { max: 30, min: 20, va: P(['top', 'bottom']) });
  } },

  { id: 'mosaic', w: 8, face: ['oldSerif', 'oldSerif', 'oldSerif', 'heavySerif', 'heavySans'], fx: ['cuts'],
    ok: B => B.cjk && ((B.hero && B.hero.units.length >= 3 && B.hero.units.length <= 8 && B.N < 280 && B.N > 9) || (B.N >= 3 && B.N <= 18)), run(B){
    // 拼板：每个字撑满自己那一格，胖的胖瘦的瘦
    const { R, pal, A, maybe, rnd } = B, whole = B.N <= 18 && (B.N <= 9 || !B.hero || maybe(.6)), us = whole ? B.core : B.hero.units; if (us.some(u => u.latin)) return false;
    const zoneH = whole ? A.h : A.h * R(.56, .66), top = whole || maybe(.6), gap = R(10, 18) * B.u, l = B.layer('hero', whole ? { read: true, gentle: true } : {}), hit = maybe(.6) ? Math.floor(rnd() * us.length) : -1, twoTone = maybe(.25), cutAt = Math.ceil(us.length * R(.4, .7)); let bad = false;
    const cut = (x, y, w, h, list) => {
      if (list.length === 1){ if (Math.min(w, h) < 70 || w / h > 2.2 || h / w > 2.1) bad = true; B.glyph(l, list[0], x + w / 2, y + h / 2, 100, { cell: [w - gap, h - gap], c: us.indexOf(list[0]) === hit || twoTone && us.indexOf(list[0]) < cutAt ? pal.a : pal.i }); return; }
      const k = list.length === 2 ? 1 : Math.max(1, Math.min(list.length - 1, Math.round(list.length * R(.32, .68)))), t = Math.max(.27, Math.min(.73, k / list.length + R(-.13, .13)));
      if (w > h * R(.8, 1.15)){ cut(x, y, w * t, h, list.slice(0, k)); cut(x + w * t, y, w * (1 - t), h, list.slice(k)); } else { cut(x, y, w, h * t, list.slice(0, k)); cut(x, y + h * t, w, h * (1 - t), list.slice(k)); }
    };
    if (whole && B.clauses.length > 1 && maybe(.5)){ const hs = B.clauses.map(c => Math.sqrt(c.n) * R(.8, 1.3)), sum = hs.reduce((a, b) => a + b, 0); let y = A.y; B.clauses.forEach((c, i) => { const h = A.h * hs[i] / sum; cut(A.x - gap / 2, y, A.w + gap, h, c.units); y += h; }); }
    else cut(A.x - gap / 2, top ? A.y : A.y + A.h - zoneH, A.w + gap, zoneH, us);
    if (bad) return false;
    if (whole) return true;
    const g = 44 * B.u, rest = A.h - zoneH - g;
    return !!B.body(A.x + (maybe(.4) ? A.w / 3 : 0), top ? A.y + zoneH + g : A.y, A.w * .64, rest, { max: 30, va: top ? 'top' : 'bottom' }) || !!B.body(A.x, top ? A.y + zoneH + g : A.y, A.w, rest, { max: 28, min: 20 });
  } },
];
const P3 = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

