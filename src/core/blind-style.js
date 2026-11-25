// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ⑤ 从三路设计里学来的：日本、国际现代主义、波普
// ════════════════════════════════════════════════════════════════════
// 学的是办法，不是某一张作品：
//   日本   散し書き（行首高低不一、墨有浓淡、几行一簇）；汉字大、虚字小；同一个字铺成方阵，只一处不同
//   国际   两条轴、三档字号、左齐右不齐；行距、字距按等比走，疏密就是灰度；留白是版面的一半
//   波普   一句话连印几格、套色错一点；四个字垒成方块，歪一个；字顺着起伏长高长矮，一排咬一排
// 花样只用字和平涂的颜色，不画图形。
const bIsSmall = u => u.latin ? false : B_STOP.has(u.t) || '了着过的地得们在是和与又也都就把被让给从向到而且或吗呢吧啊呀于以之其'.includes(u.t);
const BLIND_STYLE = [
  // ── 日本 ────────────────────────────────────────────────────────
  { id: 'chirashi', g: 'jp', q: true, w: 10, face: ['serif', 'lightSerif', 'oldSerif'], fx: ['ink'], ok: B => B.cjk && B.clauses.length >= 2 && B.clauses.length <= 12 && B.N >= 8 && B.N <= 110, run(B){
    // 散书：一句一行竖着写，几行一簇；行首有高有低，墨蘸一回、淡下去、再蘸一回
    const { R, P, I, pal, A, maybe } = B, cs = [];
    for (const c of B.clauses){ const n = B.colLen(c.full); if (n > 11 && c.full.length > 5){ const k = Math.ceil(c.full.length / 2); cs.push(c.full.slice(0, k), c.full.slice(k)); } else cs.push(c.full); }
    const n = cs.length; if (n > 16) return false;
    const cut = []; for (let i = 0; i < n;){ const k = Math.min(n - i, I(2, n > 6 ? 4 : 3)); cut.push(k); i += k; }
    if (cut.length > 1 && cut[cut.length - 1] === 1 && cut[cut.length - 2] > 2){ cut[cut.length - 2]--; cut[cut.length - 1]++; }
    const longest = Math.max(...cs.map(q => B.colLen(q))), lead = R(1.5, 1.85), gapK = R(.9, 1.7), s = Math.min(86 * B.u, A.h * R(.56, .7) / longest, A.w * .94 / (n * lead + (cut.length - 1) * gapK)); if (s < 27) return false;
    const total = s * (n * lead + (cut.length - 1) * gapK), l = B.layer('hero', { read: true, gentle: true, quiet: true, body: s < 52 }), right = A.x + A.w - (A.w - total) * R(.1, .9);
    let x = right, k = 0, t = R(.02, .16); const down = maybe(.7);
    cut.forEach((m, j) => {
      const step = R(.035, .075) * (maybe(.75) ? 1 : -1);
      for (let i = 0; i < m; i++, k++){
        const len = B.colLen(cs[k]) * s, room = A.h - len, y = A.y + Math.max(0, Math.min(room, A.h * (t + step * i + R(-.012, .012)))), dip = (k % 4) / 4;      // 四行蘸一回墨
        x -= s * lead; B.col(l, cs[k], x + s * lead / 2, y, s, { c: pal.i, a: dip ? 1 - dip * .5 : undefined });
      }
      x -= s * gapK; t = down ? Math.min(.6, t + R(.12, .24)) : R(.02, .42);
    });
    return true;
  } },
  { id: 'hana', g: 'jp', q: true, w: 7, face: ['serif', 'lightSerif', 'sans', 'heavySerif'], ok: B => B.cjk && B.N >= 8 && B.N <= 150 && !!bDense(B.word ? B.word.t : ''), run(B){
    // 一字：同一个字铺成方阵，像下了一夜的雪；只有一处不一样
    const { R, P, I, pal, A, maybe, W, H } = B, ch = bDense(B.word.t), key = [...new Set(B.core.filter(u => !u.latin && u.t !== ch && !bIsSmall(u) && bDense(u.t)).map(u => u.t))], odd = key.length && maybe(.6) ? P(key) : ch;
    const cols = P([9, 11, 13]), cw = A.w / cols, rows = Math.floor(A.h / cw), y0 = A.y + (A.h - rows * cw) / 2, z = cw * R(.5, .72), d = B.layer('deco', { bleed: true }), heavy = /Black|Heavy|900/.test(B.fonts.hero + B.fonts.heroW), al = heavy ? R(.1, .16) : R(.2, .32);
    // 正文占一块空地：整格整格地让出来
    const bw = Math.min(cols - 2, Math.max(4, Math.round(cols * R(.42, .58)))), bh = Math.max(3, Math.min(rows - 4, Math.ceil(rows * Math.min(.5, .1 + B.N / 260)))), cx = P([1, cols - 1 - bw]), cy = P([1, rows - 1 - bh, Math.floor((rows - bh) / 2)]);
    const inBox = (i, j) => i >= cx && i < cx + bw && j >= cy && j < cy + bh, free = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (!inBox(i, j)) free.push([i, j]);
    const far = free.filter(([i, j]) => i > 0 && i < cols - 1 && j > 0 && j < rows - 1 && Math.hypot(i - cx - bw / 2, j - cy - bh / 2) > 3), [oi, oj] = P(far.length ? far : free);
    for (const [i, j] of free) if (i !== oi || j !== oj) B.glyph(d, ch, A.x + cw * (i + .5), y0 + cw * (j + .5), z, { c: pal.i, a: al });
    const l = B.layer('hero', { quiet: true, gentle: true }); B.glyph(l, odd, A.x + cw * (oi + .5), y0 + cw * (oj + .5), z * R(1.15, 1.5), { c: contrast(hex2rgb(pal.a), hex2rgb(pal.g)) >= 3 ? pal.a : pal.i });
    if (B.solo){ B.row(B.layer('hero', { read: true, gentle: true }), B.core, A.x + cw * (cx + bw / 2), y0 + cw * (cy + bh / 2), Math.min(cw * bw * .9 / B.emOf(B.core), cw * 1.1), { c: pal.i }); return true; }
    const v = maybe(.55), pad = cw * .34;
    return !!B.body(A.x + cw * cx + pad, y0 + cw * cy + pad, cw * bw - pad * 2, cw * bh - pad * 2, { vertical: v, max: 36, min: 21, va: v ? 'mid' : 'mid', ha: v ? 'center' : undefined });
  } },
  { id: 'primary', g: 'jp', w: 12, warm: true, face: ['oldSerif', 'oldSerif', 'serif', 'heavySerif', 'lightSerif'], ok: B => B.cjk && B.clauses.length >= 1 && B.clauses.length <= 9 && B.N >= 5 && B.N <= 64 && B.core.some(bIsSmall) && B.core.some(u => !bIsSmall(u)), run(B){
    // 大小：实字大，虚字小，像日文里汉字大、假名小。一句一行
    const { R, P, pal, A, maybe } = B, k = R(.48, .62), v = maybe(.5), lines = [];
    const lenOf = us => us.reduce((a, u) => a + (u.latin ? B.em(u.t) : 1) * (bIsSmall(u) || u.punct ? k : 1), 0);
    for (const c of B.clauses){ const us = c.full, n = lenOf(us); if (n > 6.4 && us.length > 4){ const [a, b] = B.split(us, 2); lines.push(a, b); } else lines.push(us); }
    const n = lines.length, side = v ? A.h : A.w, flow = v ? A.w : A.h, lead = R(1.1, 1.24), s = Math.min(side * .98 / Math.max(...lines.map(lenOf)), flow / (n * lead), 250 * B.u); if (s < 46) return false;
    const l = B.layer('hero', { read: true, gentle: true, quiet: true }), total = n * s * lead, off = (flow - total) * P([0, .5, 1]), step = maybe(.6) ? (side - Math.max(...lines.map(lenOf)) * s) / Math.max(1, n - 1) : 0, edge = P([0, 1]);
    lines.forEach((us, i) => {
      let p = step * i; const b = off + s * lead * (i + .5);
      for (const u of us){
        const z = s * (bIsSmall(u) || u.punct ? k : 1), w = (u.latin ? B.em(u.t) : 1) * z, o = { c: pal.i };
        if (v) B.glyph(l, u, A.x + A.w - b + (edge ? (s - z) * .45 : 0), A.y + p + w / 2, z, { ...o, r: u.latin ? Math.PI / 2 : 0, vp: !u.latin });
        else B.glyph(l, u, A.x + p + w / 2, A.y + b + (edge ? (s - z) * .42 : 0), z, o);
        p += w;
      }
    });
    return true;
  } },
  // ── 国际现代主义 ────────────────────────────────────────────────
  { id: 'module', g: 'intl', w: 10, face: ['heavySans', 'sans', 'lightSans', 'heavySerif', 'serif'], fx: ['melt', 'dither'], ok: B => B.clauses.length >= 3 && B.clauses.length <= 10 && B.N >= 12 && B.N <= 120 && B.keyClause && B.keyClause.n <= 9, run(B){
    // 模度：两条轴，三档字号，左齐右不齐。大的一句压住，别的挂在第二条轴上
    const { R, P, pal, A, maybe } = B, ax = A.x + A.w * P([1 / 4, 3 / 8, 1 / 2]), key = B.keyClause, rows = B.split(key.full.filter(u => !u.punct), key.n <= 3 ? 1 : key.n <= 6 ? P([1, 2]) : P([2, 3])), big = Math.min(A.w * R(.82, 1) / Math.max(...rows.map(r => B.emOf(r))), A.h * .36 / rows.length); if (big < 80 * B.u) return false;
    const at = B.clauses.findIndex(c => c === key), pre = B.clauses.slice(0, at), post = B.clauses.slice(at + 1), zone = big * 1.02 * rows.length, rest = A.h - zone - big * .3, m = pre.length + post.length, roomW = A.x + A.w - ax;
    const s = Math.min(46 * B.u, roomW / Math.max(...pre.concat(post).map(c => B.emOf(c.full, 'body'))), rest / (m * 1.5 + 1)); if (s < 22) return false;
    const lh = s * R(1.42, 1.62), h1 = pre.length * lh, h2 = post.length * lh, slack = A.h - zone - h1 - h2, l = B.layer('hero', { read: true }), t = B.layer('hero', { read: true, body: true, quiet: true });
    // 前头的字顶着上沿，后头的落在下沿：中间是白
    const yBig = pre.length && post.length ? A.y + h1 + slack * R(.3, .6) : pre.length ? A.y + A.h - zone : A.y;
    pre.forEach((c, i) => B.row(t, c.full, ax, A.y + lh * (i + .5), s, { f: 'body', align: 'left', c: pal.i }));
    rows.forEach((r, i) => B.row(l, r, A.x - big * .03, yBig + big * 1.02 * (i + .5), big, { align: 'left', c: pal.i }));
    post.forEach((c, i) => B.row(t, c.full, ax, A.y + A.h - h2 + lh * (i + .5), s, { f: 'body', align: 'left', c: pal.i }));
    return true;
  } },
  { id: 'dense', g: 'intl', w: 7, face: ['serif', 'sans', 'lightSerif', 'heavySans', 'heavySerif'], ok: B => B.cjk && B.N >= 36 && B.N <= 240, run(B){
    // 疏密：同样大的字，行距一路收紧，从白走到灰，再走到黑
    const { R, pal, A, maybe } = B, us = B.units, rev = maybe(.35), q = R(.5, .64);
    for (let s = Math.round(Math.min(74, Math.sqrt(A.w * A.h / B.N) * .52) * B.u); s >= 26; s--){
      const w = A.w * R(.97, 1), per = Math.floor(w / s), n = Math.ceil(us.length / per * 1.12) + 1; if (n < 5) continue;
      const raw = Array.from({ length: n - 1 }, (_, i) => Math.pow(q, i)), least = s * 1.24, free = A.h - s - least * (n - 1); if (free < s * 4) continue;
      const sum = raw.reduce((a, b) => a + b, 0), gaps = raw.map(g => least + free * g / sum); if (rev) gaps.reverse();
      let y = A.y + s / 2; const lines = [{ x0: A.x, x1: A.x + w, y }]; for (const g of gaps) lines.push({ x0: A.x, x1: A.x + w, y: y += g });
      const got = bFlow(B, us, s, lines, 'hero'); if (!got) continue;
      const used = new Set(got.map(g => g.line)).size; if (used < n - 1) continue;
      const l = B.layer('hero', { read: true, gentle: true, quiet: true, body: s < 50 * B.u }); for (const g of got) B.glyph(l, g.u, g.x, g.y, s, { c: B.isKey(g.u) && contrast(hex2rgb(pal.a), hex2rgb(pal.g)) >= 3.6 ? pal.a : pal.i });
      return true;
    }
    return false;
  } },
  { id: 'spread', g: 'intl', dup: true, w: 6, face: ['heavySans', 'lightSans', 'sans', 'heavySerif', 'serif'], fx: ['melt'], ok: B => B.cjk && B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 7 && B.D > 8 && B.N < 300, run(B){
    // 疏开：同一句念几遍，字和字越站越远
    const { R, P, I, pal, A, maybe } = B, hu = B.hero.units, m = hu.length, n = I(5, 8), zone = A.h * (B.solo ? .96 : R(.56, .66)), s = Math.min(zone / n * R(.78, .92), A.w * .7 / m); if (s < 44 * B.u) return false;
    const top = B.solo || maybe(.6), y0 = top ? A.y : A.y + A.h - zone, max = (A.w - s * m) / Math.max(1, m - 1), pw = R(1.2, 2), flip = maybe(.3), main = flip ? n - 1 : 0, ali = P(['left', 'left', 'center']);
    const l = B.layer('hero', { quiet: true }), d = B.layer('deco');
    for (let i = 0; i < n; i++){
      const t = Math.pow((flip ? n - 1 - i : i) / (n - 1), pw), g = max * t, w = s * m + g * (m - 1), x0 = ali === 'left' ? A.x : A.x + (A.w - w) / 2, y = y0 + zone / n * (i + .5);
      (i === main ? hu : bGhost(hu)).forEach((u, k) => B.glyph(i === main ? l : d, u, x0 + s / 2 + k * (s + g), y, s, { c: pal.i, a: i === main ? undefined : 1 - t * .62 }));
    }
    if (B.solo) return true;
    const gap = 46 * B.u, bh = A.h - zone - gap, by = top ? A.y + zone + gap : A.y, at = P([0, 1 / 4, 1 / 2]);
    return !!B.body(A.x + A.w * at, by, A.w * Math.min(.62, 1 - at), bh, { max: 32, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 30, va: top ? 'top' : 'bottom' });
  } },
  // ── 波普 ────────────────────────────────────────────────────────
  { id: 'billow', g: 'pop', dup: true, w: 7, face: ['heavySans', 'heavySerif', 'oldSerif'], fx: ['misreg', 'dots'], ok: B => B.cjk && B.hero && B.hero.units.length >= 2 && B.hero.units.length <= 8 && B.D > 8 && B.N < 260 && !B.hero.units.some(u => u.latin), run(B){
    // 起浪：一排字咬着一排字，顺着波长高、长矮
    const { R, P, I, pal, A, maybe } = B, hu = B.hero.units, m = hu.length, n = m <= 3 ? I(3, 4) : m <= 5 ? I(4, 5) : I(5, 6), zone = A.h * (B.solo ? 1 : R(.66, .74)), top = B.solo || maybe(.6), y0 = top ? A.y : A.y + A.h - zone, rh = zone / n, amp = rh * R(.24, .38), f = R(.55, 1.1), ph = R(0, 6.28), dl = R(.5, 1.3), cw = A.w / m;
    if (cw > rh * 3 || rh > cw * 2.6) return false;
    const edge = (j, t) => y0 + rh * j + (j === 0 || j === n ? 0 : amp * Math.sin(t * 6.28 * f + ph + j * dl)), main = I(0, n - 1), l = B.layer('hero', { quiet: true }), d = B.layer('deco'), hot = maybe(.5) && contrast(hex2rgb(pal.a), hex2rgb(pal.g)) >= 3 ? main : -1;
    for (let j = 0; j < n; j++) (j === main ? hu : bGhost(hu)).forEach((u, i) => { const t = (i + .5) / m, a = edge(j, t), b = edge(j + 1, t), pad = Math.min(cw, rh) * .035; B.glyph(j === main ? l : d, u, A.x + cw * (i + .5), (a + b) / 2, 100, { cell: [cw - pad * 2, Math.max(8, b - a - pad * 2)], c: j === hot ? pal.a : pal.i }); });
    if (B.solo) return true;
    const gap = 44 * B.u, bh = A.h - zone - gap, by = top ? A.y + zone + gap : A.y;
    return !!B.body(A.x + A.w * P([0, 1 / 3]), by, A.w * .64, bh, { max: 32, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 30, va: top ? 'top' : 'bottom' });
  } },
  { id: 'quad', g: 'pop', dup: true, w: 7, face: ['heavySerif', 'oldSerif', 'heavySans'], fx: ['misreg'], ok: B => B.cjk && B.hero && [4, 6, 9].includes(B.hero.units.length) && B.D > 8 && B.N < 280 && !B.hero.units.some(u => u.latin), run(B){
    // 叠字：几个字垒成一块，严丝合缝，歪一个
    const { R, P, I, pal, A, maybe } = B, hu = B.hero.units, m = hu.length, cols = m === 9 ? 3 : 2, rows = m / cols, v = maybe(.5), side = Math.min(A.w, A.h * (B.solo ? .92 : .68) / rows * cols), c = side / cols, left = maybe(.7), x0 = left ? A.x : A.x + A.w - side, top = B.solo ? maybe(.5) : maybe(.6), y0 = top ? A.y : A.y + A.h - c * rows, odd = I(0, m - 1), tilt = R(.14, .26) * (maybe(.5) ? 1 : -1), hot = contrast(hex2rgb(pal.a), hex2rgb(pal.g)) >= 3 && maybe(.7);
    if (c < 130 * B.u) return false;
    const l = B.layer('hero');
    hu.forEach((u, i) => { const r = v ? i % rows : Math.floor(i / cols), k = v ? cols - 1 - Math.floor(i / rows) : i % cols, z = c * .94 * (i === odd ? .86 : 1); B.glyph(l, u, x0 + c * (k + .5), y0 + c * (r + .5), 100, { cell: [z, z], r: i === odd ? tilt : 0, c: i === odd && hot ? pal.a : pal.i }); });
    if (B.solo) return true;
    const gap = 46 * B.u, used = c * rows, bh = A.h - used - gap, by = top ? A.y + used + gap : A.y;
    return !!B.body(A.x + A.w * P([0, .25, .5]), by, A.w * .5, bh, { max: 32, va: top ? 'bottom' : 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 30, va: top ? 'top' : 'bottom' });
  } },
  { id: 'serial', g: 'pop', dup: true, w: 4, calm: ['soft', 'multiply'], face: ['heavySerif', 'oldSerif', 'heavySans'], ok: B => B.cjk && B.hero && B.hero.units.length >= 1 && B.hero.units.length <= 4 && B.D > 8 && B.N < 220 && !B.dark && !B.hero.units.some(u => u.latin), run(B){
    // 连印：同一句印几格，底色一格一格换，颜色是一家的；套色总差一点点
    const { R, P, I, pal, A, maybe, W, H } = B, hu = B.hero.units, m = hu.length, cols = m === 1 ? 3 : 2, rows = m === 1 ? 3 : m === 2 ? P([3, 4]) : 4, full = B.solo, zone = H * (full ? 1 : R(.66, .72)), cw = W / cols, ch = zone / rows, [L, C, h] = bLch(pal.g), dk = B.dark;
    const tint = i => { const hh = h + (C < .02 ? bAnchor(pal) - h : 0) + [0, 8, -8, 14, -12, 4, 12, -6, 10][i % 9], cc = Math.min(.13, Math.max(.035, C) * [1, 1.2, .8, 1.1, 1.28, .9][i % 6]), LL = Math.max(.16, Math.min(.96, L + [0, dk ? .05 : -.05, dk ? -.03 : .02, dk ? .08 : -.085, .015, -.03][i % 6])); return bSafe(bOklch(LL, cc, h === undefined ? 0 : (dk ? bDarkHue(hh) : hh)), pal, 5); };
    const back = B.layer('back', { bleed: true }), gh = B.layer('deco', { bleed: true }), l = B.layer('hero', { quiet: true, nofx: true }), dx = R(5, 11) * B.u * (maybe(.5) ? 1 : -1), dy = R(3, 8) * B.u, main = I(0, cols * rows - 1), st = I(0, 5), soft = B.layer('deco', { bleed: true });
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++){
      const k = j * cols + i, x = cw * i, y = ch * j, mx = cw * .13, my = ch * .16, w = cw - mx * 2, hh = ch - my * 2, one = w / m, z = Math.min(hh, one * 1.5), zw = Math.min(one * .96, z);
      back.ops.push({ k: 'r', x, y, w: cw + .6, h: ch + .6, c: tint(k + st) });
      const ink = k === main && contrast(hex2rgb(pal.a), hex2rgb(pal.g)) >= 3.8 && bHueGap(bLch(pal.a)[2], bAnchor(pal)) < 70 ? pal.a : pal.i;
      hu.forEach((u, q) => { const px = x + cw / 2 + (q - (m - 1) / 2) * Math.max(zw, Math.min(one, zw * 1.06)), py = y + ch / 2; B.glyph(gh, u.t, px + dx, py + dy, 100, { cell: [zw, z], c: B.kin, a: .34 }); B.glyph(k === main ? l : soft, k === main ? u : u.t, px, py, 100, { cell: [zw, z], c: ink }); });
    }
    if (full) return true;
    const gap = 40 * B.u, by = zone + gap, bh = A.y + A.h - by; if (bh < 90) return false;
    return !!B.body(A.x + A.w * P([0, .34]), by, A.w * .62, bh, { max: 30, va: 'top' }) || !!B.body(A.x, by, A.w, bh, { max: 28, va: 'top' });
  } },
];
BLIND_COMPS.push(...BLIND_STYLE);      // 只能往后加：序号是每种方案随机流的盐
Object.assign(B_FULL, { hana: 1, billow: 1, quad: 1, serial: 1, spread: 1 });
Object.assign(B_LOUD, { billow: 1, quad: 1, serial: 1 });

// 两种气氛。也只能往后加
BLIND_LOOKS.push(
  // 横带：浮世绘天头那一抹渐渐化开的颜色，底下是和纸
  { id: 'bokashi', w: 8, grounds: ['bokashi'], fiber: .9, hero: [[], [], ['wash'], ['ink'], ['wear'], ['melt']], post: [[], [], [], ['soft'], ['multiply']], q: 1.5, warm: 1.3, ghost: 2, under: .25 },
  // 网点：平涂的底上，一角网点渐渐密起来
  { id: 'benday', w: 5, tone: 'light', chroma: .012, grounds: ['benday', 'benday', 'flat'], fiber: .2, hero: [['misreg'], ['dots'], ['misreg', 'dots'], ['echo'], [], []], post: [[]], loud: 2, q: .4, warm: 1.2, under: .15 });
Object.assign(B_ART, { bokashi: ['serif', 'lightSerif', 'oldSerif'], benday: ['heavySans', 'heavySerif', 'oldSerif'] });
Object.assign(BLIND_GROUND, {
  bokashi(x, E){
    const { R, W, H, pal, maybe } = E, cs = bGlowColors(E), p = R(.16, .38), g = x.createLinearGradient(0, 0, 0, H), c0 = bSafe(cs[0], pal), c1 = bSafe(cs[1], pal);
    g.addColorStop(0, c0); g.addColorStop(p * .28, bMix(c0, pal.g, .12)); g.addColorStop(p, pal.g);
    if (maybe(.62)){ const q = R(.1, .26); g.addColorStop(1 - q, pal.g); g.addColorStop(1, bMix(pal.g, c1, R(.5, .9))); } else g.addColorStop(1, pal.g);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    if (maybe(.35)) bBlob(x, cs[2], W * R(.1, .9), H * R(.45, .8), W * R(.4, .7), .4, R(.12, .3));      // 远处一抹横云
  },
  benday(x, E){
    const { R, P, W, H, pal } = E, c = bSafe(bMix(pal.g, bGlowColors(E)[0], .85), pal, 5.2), d = W * R(.018, .028), [cx, cy] = P([[0, 0], [W, 0], [0, H], [W, H], [W / 2, H], [W / 2, 0]]), reach = Math.hypot(W, H) * R(.5, .72), a = .785;
    x.fillStyle = c; x.beginPath();
    for (let i = -Math.ceil(H / d); i < W / d + H / d; i++) for (let j = 0; j < (W + H) / d * .8; j++){ const px = (i + j) * d * .7071 - H * 0, py = (j - i) * d * .7071; if (px < -d || px > W + d || py < -d || py > H + d) continue; const t = 1 - Math.hypot(px - cx, py - cy) / reach; if (t <= .04) continue; const r = d * .47 * Math.sqrt(t); x.moveTo(px + r, py); x.arc(px, py, r, 0, 6.2832); }
    x.fill();
  },
});
