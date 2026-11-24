// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ⑤ 物件：光、环、星、花、线……纸上每一样能单独拿起来的东西
// ════════════════════════════════════════════════════════════════════
// 一件东西 = { id, seed, x, y, r, q, rot, c, a, front, t }
//   x,y 中心｜r 半径（版面像素）｜q 扁的程度｜rot 角度｜c 颜色（a/b/i/g/w 或 #rrggbb）
//   a 浓淡｜front 盖在字上还是垫在字下｜t 线的粗细｜seed 它自己的长相
// 盲盒掷出来的和人自己摆上去的，是同一种东西 —— 所以拆完还能接着改：
// 拖它就是改 x,y，换形状就是改 id，位置大小颜色都还在原处。
const bRng = seed => {
  const rnd = mulberry32(seed >>> 0); rnd(); rnd(); rnd();
  const R = (a, b) => a + (b - a) * rnd();
  return { rnd, R, I: (a, b) => Math.floor(R(a, b + 1)), P: arr => arr[Math.floor(rnd() * arr.length)], maybe: p => rnd() < p };
};
const bSub = (seed, salt) => (Math.imul((seed ^ Math.imul(salt + 1, 0x9E3779B1)) >>> 0, 0x85EBCA6B) ^ (seed >>> 13)) >>> 0;
const bCol = (pal, c) => (typeof c === 'string' && c[0] === '#') ? c : c === 'w' ? '#ffffff' : (pal[c] || pal.a);

// 穿过这些点的一条柔线（Catmull-Rom），密密地取点
function bSpline(ctrl, step = 4){
  const out = [], n = ctrl.length;
  if (n < 2) return ctrl.slice();
  for (let i = 0; i < n - 1; i++){
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(n - 1, i + 2)];
    const m = Math.max(3, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < m; k++){
      const t = k / m, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(d => .5 * (2 * p1[d] + (p2[d] - p0[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  out.push(ctrl[n - 1]);
  return out;
}
function bTrace(x, pts){ x.beginPath(); pts.forEach(([a, b], i) => x[i ? 'lineTo' : 'moveTo'](a, b)); x.stroke(); }

// ── 毛线 ───────────────────────────────────────────────────────────
// 字在哪，线才知道往哪绕：从排好的字里找落脚点。有「你」有「我」就先系住这两个。
function bAnchors(B){
  const out = [];
  for (const l of B.layers){
    if (l.role === 'meta' || l.role === 'back' || l.role === 'deco' || l.bleed || l.twin) continue;
    for (const op of l.ops){
      const push = (t, x, y, s) => { const r = blindTurn({ x: x - s / 2, y: y - s / 2, w: s, h: s }, l.rot); out.push({ t, x: r.x + r.w / 2, y: r.y + r.h / 2, s, hero: l.role === 'hero' && !l.body }); };
      if (op.k === 'g' && op.t.length <= 8){ const s = op.fit ? Math.min(...op.fit) : op.s * Math.max(1, B.em(op.t, op.f) * .7); push(op.t, op.x, op.y, s); }
      else if (op.k === 'l' || op.k === 'v'){
        let p = 0;
        [...op.t].forEach((ch, i) => { const s = op.rich && op.rich[i] ? op.rich[i].size : op.s, w = op.k === 'v' ? s : B.em(ch, 'body') * s; if (!B_PUNCT.test(ch)) push(ch, op.k === 'v' ? op.x + s / 2 : op.x + p + w / 2, op.k === 'v' ? op.y + p + s / 2 : op.y + s / 2, s); p += w; });
      }
    }
  }
  return out;
}
// 走法（mode）：sweep 一笔带过 ／ coil 一路打圈 ／ tie 系住两个字 ／ orbit 绕着主角
// 🔑 一根线只做一件事。早先一根线又荡又绕又打结，十次有六次是一团乱。
const B_LINE_MODES = ['sweep', 'coil', 'tie', 'orbit'];
function bYouMe(B, an){
  const find = list => { const c = an.filter(a => list.includes(a.t.toLowerCase())); return c.length ? c.reduce((p, q) => (q.s > p.s ? q : p)) : null; };
  return [find(['我', '吾', 'me', 'i']), find(['你', '您', '妳', 'you'])];
}
function bThreadPath(it, B){
  const { R, I, P, maybe } = bRng(it.seed), { W, H, u } = B, an = bAnchors(B), [me, you] = bYouMe(B, an), big = an.filter(a => a.hero).length >= 2 ? an.filter(a => a.hero) : an;
  const mode = it.mode || (me && you ? 'tie' : P(['sweep', 'sweep', 'coil', 'orbit']));
  let pts = [];
  const add = (x, y) => pts.push([x, y]);
  if (mode === 'tie' && an.length >= 2){
    let p = me, q = you; if (!(p && q)) { p = big[0]; q = big[big.length - 1]; }
    const loop = (g, a0, dir, turns) => { const s = Math.max(g.s, 30 * u); for (let k = 0; k <= 26 * turns; k++){ const a = a0 + dir * k / 26 * 6.2832; add(g.x + Math.cos(a) * s * .78, g.y + Math.sin(a) * s * .72); } };
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx), dir = maybe(.5) ? 1 : -1, sag = Math.min(260 * u, L * R(.18, .42)) * (maybe(.5) ? 1 : -1), nx = -dy / L, ny = dx / L;
    const e = [p.x < W / 2 ? -80 : W + 80, p.y + R(-.12, .12) * H]; add(...e); add((e[0] + p.x) / 2, (e[1] + p.y) / 2 + R(-70, 70) * u);
    loop(p, ang + Math.PI * .9, dir, 1.35);
    for (const t of [.3, .5, .7]) add(p.x + dx * t + nx * sag * Math.sin(Math.PI * t), p.y + dy * t + ny * sag * Math.sin(Math.PI * t));
    loop(q, ang + Math.PI * 1.1, -dir, 1.35);
    const f = [q.x < W / 2 ? -80 : W + 80, q.y + R(-.14, .14) * H]; add((q.x + f[0]) / 2, (q.y + f[1]) / 2 + R(-70, 70) * u); add(...f);
  } else if (mode === 'orbit'){
    const r = B.heroRect || { x: W * .2, y: H * .25, w: W * .6, h: H * .3 }, cx = r.x + r.w / 2, cy = r.y + r.h / 2, rx = Math.min(W * .56, r.w * .58 + 30 * u), ry = Math.min(H * .4, r.h * R(.3, .56) + 24 * u), n = I(2, 4), tilt = R(-.35, .35), turn = R(.16, .34);
    for (let k = 0; k <= n * 60; k++){ const a = k / 60 * 6.2832, th = tilt + turn * a / 6.2832, x = Math.cos(a) * rx, y = Math.sin(a) * ry; add(cx + x * Math.cos(th) - y * Math.sin(th), cy + x * Math.sin(th) + y * Math.cos(th)); }
  } else if (mode === 'coil'){
    const vert = maybe(.4), n = I(4, 9), rad = (vert ? W : H) * R(.05, .12), y0 = R(.2, .8), bend = R(-.14, .14), L = (vert ? H : W) + 160;
    for (let k = 0; k <= n * 48; k++){ const t = k / (n * 48), a = t * n * 6.2832, m = -80 + L * t - Math.sin(a) * rad * .82, c = ((vert ? W : H) * (y0 + bend * Math.sin(t * Math.PI))) - Math.cos(a) * rad; vert ? add(c, m) : add(m, c); }
  } else {
    const vert = maybe(.5), n = P([2, 3, 3]), amp = R(.22, .46) * (vert ? W : H) * (maybe(.5) ? 1 : -1), mid = R(.36, .64);
    for (let k = 0; k <= 80; k++){ const t = k / 80, m = -80 + ((vert ? H : W) + 160) * t, c = (vert ? W : H) * mid + Math.sin(t * Math.PI * n * .5 + .3) * amp * (1 - t * .3); vert ? add(c, m) : add(m, c); }
  }
  const line = bKnead(bEven(bKnead(bEven(bSpline(pts, 6 * u), 4 * u), mode === 'tie' ? 12 : 7), 3.2 * u), 4);
  const k = it.r / (W / 2), ox = it.x - W / 2, oy = it.y - H / 2, ca = Math.cos(it.rot || 0), sa = Math.sin(it.rot || 0);
  return line.map(([x, y]) => { const dx = (x - W / 2) * k, dy = (y - H / 2) * k; return [W / 2 + dx * ca - dy * sa + ox, H / 2 + dx * sa + dy * ca + oy]; });
}
// 按等距重新取点
function bEven(pts, step){
  const out = [pts[0]]; let acc = 0;
  for (let i = 1; i < pts.length; i++){
    let [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; let d = Math.hypot(x1 - x0, y1 - y0);
    while (acc + d >= step){ const t = (step - acc) / d; x0 += (x1 - x0) * t; y0 += (y1 - y0) * t; out.push([x0, y0]); d = Math.hypot(x1 - x0, y1 - y0); acc = 0; }
    acc += d;
  }
  out.push(pts[pts.length - 1]); return out;
}
// 揉：每一点往左右邻居的平均靠，来回两遍
function bKnead(pts, w){
  for (let pass = 0; pass < 2; pass++){
    const n = pts.length, sx = new Float64Array(n + 1), sy = new Float64Array(n + 1);
    for (let i = 0; i < n; i++){ sx[i + 1] = sx[i] + pts[i][0]; sy[i + 1] = sy[i] + pts[i][1]; }
    pts = pts.map((p, i) => { const q = Math.min(w, i, n - 1 - i), a = i - q, b = i + q + 1; return [(sx[b] - sx[a]) / (b - a), (sy[b] - sy[a]) / (b - a)]; });
  }
  return pts;
}
// 碰到字的地方一前一后：这个字从它前面过，下一个字从它后面过
function bWeave(pts, B){
  const boxes = B.layers.filter(l => l.role !== 'meta' && l.role !== 'deco' && l.role !== 'back' && !l.bleed && !l.twin)
    .flatMap(l => l.ops.filter(o => 'glv'.includes(o.k)).map(o => blindTurn(blindOpRect(B, o), l.rot)));
  const hit = ([x, y]) => boxes.some(q => x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h);
  let on = false, over = true; const flag = new Array(pts.length).fill(false);
  for (let i = 0; i < pts.length; i++){
    const h = hit(pts[i]);
    if (h && !on) over = !over;
    on = h; flag[i] = h && over;
  }
  return flag;
}
// 质感（feel）：line 干净的单线（默认）／ yarn 毛线
function bPlain(x, pts, flag, want, w, color){
  x.lineCap = 'butt'; x.lineJoin = 'round'; x.strokeStyle = color; x.lineWidth = w;
  for (let s = 0; s < pts.length;){ if (flag[s] !== want){ s++; continue; } let e = s; while (e + 1 < pts.length && flag[e + 1] === want) e++; const run = pts.slice(Math.max(0, s - 1), Math.min(pts.length, e + 2)); if (run.length > 1) bTrace(x, run); s = e + 1; }
}
function bYarn(x, pts, flag, want, w, color, seed, E){
  const dark = bMix(color, '#000000', .34), light = bMix(color, '#ffffff', .36), n = pts.length;
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (let s = 0; s < n;){
    if (flag[s] !== want){ s++; continue; }
    let e = s; while (e + 1 < n && flag[e + 1] === want) e++;
    const a = Math.max(0, s - 2), b = Math.min(n - 1, e + 2), run = pts.slice(a, b + 1);
    if (run.length > 1){
      x.save(); x.shadowColor = want ? 'rgba(0,0,0,.4)' : 'rgba(0,0,0,.2)'; x.shadowBlur = w * 1.7 * DPR; x.shadowOffsetX = w * .25 * DPR; x.shadowOffsetY = w * (want ? .7 : .3) * DPR;
      x.strokeStyle = dark; x.lineWidth = w; bTrace(x, run); x.restore();
      x.strokeStyle = color; x.lineWidth = w * .74; bTrace(x, run);
      // 捻：一道一道斜着的股
      for (let i = a; i < b; i += Math.max(1, Math.round(w * .2))){
        const p = pts[i], q = pts[Math.min(n - 1, i + 1)], ang = Math.atan2(q[1] - p[1], q[0] - p[0]) + .72, h = w * .46, c = Math.cos(ang) * h, d = Math.sin(ang) * h;
        x.strokeStyle = (i / Math.max(1, Math.round(w * .2)) | 0) % 2 ? bAlpha(light, .62) : bAlpha(dark, .5); x.lineWidth = Math.max(.7, w * .13);
        x.beginPath(); x.moveTo(p[0] - c, p[1] - d); x.quadraticCurveTo(p[0] + d * .2, p[1] - c * .2, p[0] + c, p[1] + d); x.stroke();
      }
      // 绒：往外炸的细毛
      for (let i = a; i <= b; i++){
        const r = mulberry32(seed + i * 7919); r();
        for (let k = 0; k < 3; k++){
          if (r() > .6) continue;
          const p = pts[i], ang = r() * 6.2832, len = w * (.4 + r() * r() * 1.25), bend = (r() - .5) * len;
          x.strokeStyle = bAlpha(r() < .5 ? light : color, .16 + r() * .26); x.lineWidth = .5 + r() * .55;
          x.beginPath(); x.moveTo(p[0], p[1]); x.quadraticCurveTo(p[0] + Math.cos(ang) * len * .6 - Math.sin(ang) * bend, p[1] + Math.sin(ang) * len * .6 + Math.cos(ang) * bend, p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len); x.stroke();
        }
      }
    }
    s = e + 1;
  }
}

// ── 形状 ───────────────────────────────────────────────────────────
// draw(x, it, E)：画布已经移到它的中心、转好角度；color 是解好的颜色，E.rnd 走它自己的种子。
const bPetal = (x, r, w, k) => { x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(r * w, r * .24, r * w * .86, r * .84 * k, 0, r * k); x.bezierCurveTo(-r * w * .86, r * .84 * k, -r * w, r * .24, 0, 0); };
const BLIND_ITEMS = {
  // 形
  ring(x, it, E, c){ for (const [w, a] of [[26, .07], [12, .13], [2, .85]]){ x.lineWidth = w * E.u; x.strokeStyle = bAlpha(c, a); x.beginPath(); x.ellipse(0, 0, it.r, it.r * (it.q || 1), 0, 0, 6.2832); x.stroke(); } },
  ellipse(x, it, E, c){ BLIND_ITEMS.ring(x, { ...it, q: it.q && it.q < .9 ? it.q : .38 }, E, c); },
  disc(x, it, E, c){ x.fillStyle = c; x.beginPath(); x.arc(0, 0, it.r, 0, 6.2832); x.fill(); },
  bubble(x, it, E, c){ const g = x.createRadialGradient(0, 0, it.r * .55, 0, 0, it.r); g.addColorStop(0, bAlpha(c, 0)); g.addColorStop(.8, bAlpha(c, .16)); g.addColorStop(.96, bAlpha(c, .62)); g.addColorStop(1, bAlpha(c, 0)); x.fillStyle = g; x.beginPath(); x.arc(0, 0, it.r, 0, 6.2832); x.fill(); x.fillStyle = bAlpha('#ffffff', .75); x.beginPath(); x.ellipse(-it.r * .38, -it.r * .45, it.r * .17, it.r * .09, -.7, 0, 6.2832); x.fill(); },
  moon(x, it, E, c){ const r = it.r; x.fillStyle = c; x.beginPath(); x.arc(0, 0, r, 1.15, -1.15 + 6.2832); x.quadraticCurveTo(-r * .62, 0, Math.cos(1.15) * r, Math.sin(1.15) * r); x.fill(); },
  star(x, it, E, c){ bStar(x, 0, 0, it.r, c); },
  flake(x, it, E, c){
    const r = it.r, n = 3 + Math.floor(E.rnd() * 2), sp = Array.from({ length: n }, () => .25 + E.rnd() * .62), ln = sp.map(() => .16 + E.rnd() * .26);
    x.strokeStyle = c; x.lineWidth = Math.max(1.1, r * .045); x.lineCap = 'round';
    for (let k = 0; k < 6; k++){ x.save(); x.rotate(k * Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -r); sp.forEach((p, i) => { for (const s of [-1, 1]){ x.moveTo(0, -r * p); x.lineTo(s * r * ln[i] * (1.15 - p * .5), -r * (p + ln[i] * .62)); } }); x.stroke(); x.restore(); }
  },
  flower(x, it, E, c){ bFlower(x, 0, 0, it.r, 0, c, E); },
  // 水彩的花：一层一层洇上去，盖得住字
  bloom(x, it, E, c){
    const n = E.I(5, 8), r = it.r;
    for (let i = 0; i < n; i++){
      x.save(); x.rotate(i * 6.2832 / n + E.R(-.12, .12));
      for (let k = 0; k < 3; k++){ x.fillStyle = bAlpha(bMix(c, '#ffffff', E.R(.02, .3)), .34); bPetal(x, r * E.R(.9, 1.06), E.R(.36, .5), E.R(.9, 1.06)); x.fill(); }
      const g = x.createRadialGradient(0, 0, 0, 0, 0, r * .6); g.addColorStop(0, bAlpha(bMix(c, '#000000', .25), .5)); g.addColorStop(1, bAlpha(c, 0)); x.fillStyle = g; bPetal(x, r, .42, .96); x.fill();
      x.strokeStyle = bAlpha(bMix(c, '#000000', .2), .26); x.lineWidth = Math.max(.6, r * .012); x.stroke(); x.restore();
    }
    x.fillStyle = bMix(c, E.dark ? '#ffffff' : '#3a2410', .6);
    for (let i = 0; i < 11; i++){ const a = E.R(0, 6.28), q = r * .13 * Math.sqrt(E.rnd()); x.beginPath(); x.arc(Math.cos(a) * q, Math.sin(a) * q, r * E.R(.014, .03), 0, 6.2832); x.fill(); }
  },
  drop(x, it, E, c){ const r = it.r; x.beginPath(); x.moveTo(0, -r); x.bezierCurveTo(r * .2, -r * .4, r * .66, 0, r * .62, r * .42); x.bezierCurveTo(r * .56, r * 1.02, -r * .56, r * 1.02, -r * .62, r * .42); x.bezierCurveTo(-r * .66, 0, -r * .2, -r * .4, 0, -r); x.fillStyle = bAlpha(c, .5); x.fill(); x.strokeStyle = bAlpha(c, .9); x.lineWidth = Math.max(1, r * .03); x.stroke(); x.strokeStyle = bAlpha('#ffffff', .75); x.lineCap = 'round'; x.lineWidth = Math.max(1, r * .06); x.beginPath(); x.arc(0, r * .36, r * .4, 2.2, 3.1); x.stroke(); },
  leaf(x, it, E, c){ const r = it.r; x.fillStyle = bAlpha(c, .82); x.beginPath(); x.moveTo(0, -r); x.bezierCurveTo(r * .62, -r * .4, r * .5, r * .5, 0, r); x.bezierCurveTo(-r * .5, r * .5, -r * .62, -r * .4, 0, -r); x.fill(); x.strokeStyle = bAlpha(bMix(c, '#ffffff', .5), .8); x.lineWidth = Math.max(.8, r * .02); x.beginPath(); x.moveTo(0, -r * .9); x.lineTo(0, r * 1.2); for (let k = -3; k <= 3; k++){ x.moveTo(0, r * k * .22); x.quadraticCurveTo(r * .2, r * (k * .22 - .1), r * .3 * (1 - Math.abs(k) * .16), r * (k * .22 - .24)); x.moveTo(0, r * k * .22); x.quadraticCurveTo(-r * .2, r * (k * .22 - .1), -r * .3 * (1 - Math.abs(k) * .16), r * (k * .22 - .24)); } x.stroke(); },
  feather(x, it, E, c){
    const r = it.r, bow = r * .22; x.lineCap = 'round';
    for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 70; k++){
      const t = k / 69, y = -r * .92 + t * r * 1.55, px = bow * (1 - Math.pow((y / r), 2)), len = r * .42 * Math.sin(Math.PI * Math.min(1, t * .9 + .1)) * E.R(.82, 1.06), gap = E.rnd() < .05;
      if (gap) continue;
      x.strokeStyle = bAlpha(bMix(c, '#ffffff', E.R(0, .32)), E.R(.38, .8)); x.lineWidth = Math.max(.6, r * .012);
      x.beginPath(); x.moveTo(px, y); x.quadraticCurveTo(px + s * len * .6, y - r * .03, px + s * len, y - r * E.R(.12, .2)); x.stroke();
    }
    x.strokeStyle = c; x.lineWidth = Math.max(1, r * .02); x.beginPath(); for (let k = 0; k <= 30; k++){ const y = -r + k / 30 * r * 2, px = bow * (1 - Math.pow(y / r, 2)); x[k ? 'lineTo' : 'moveTo'](px, y); } x.stroke();
  },
  // 含着泪的眼睛
  eye(x, it, E, c){
    const r = it.r; x.strokeStyle = c; x.lineCap = 'round'; x.lineWidth = Math.max(1.2, r * .032);
    x.beginPath(); x.moveTo(-r, 0); x.bezierCurveTo(-r * .5, -r * .62, r * .5, -r * .62, r, 0); x.bezierCurveTo(r * .5, r * .46, -r * .5, r * .46, -r, 0); x.fillStyle = bAlpha(E.dark ? c : '#ffffff', .12); x.fill(); x.stroke();
    const g = x.createRadialGradient(0, -r * .04, r * .06, 0, -r * .04, r * .34); g.addColorStop(0, bAlpha(bMix(c, '#000000', .5), .95)); g.addColorStop(.5, bAlpha(c, .8)); g.addColorStop(1, bAlpha(c, .5)); x.fillStyle = g; x.beginPath(); x.arc(0, -r * .04, r * .32, 0, 6.2832); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(-r * .1, -r * .15, r * .075, 0, 6.2832); x.arc(r * .1, r * .07, r * .035, 0, 6.2832); x.fill();
    for (let k = 0; k < 9; k++){ const t = k / 8, px = -r * .86 + t * r * 1.72, py = -r * .46 * Math.sin(Math.PI * (t * .94 + .03)); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + (t - .5) * r * .2, py - r * .16, px + (t - .5) * r * .46, py - r * E.R(.2, .28)); x.stroke(); }
    x.save(); x.translate(r * .34, r * .62); x.fillStyle = bAlpha(bMix(c, '#ffffff', .5), .85); x.beginPath(); x.moveTo(0, -r * .26); x.bezierCurveTo(r * .05, -r * .1, r * .13, 0, r * .11, r * .1); x.bezierCurveTo(r * .09, r * .22, -r * .09, r * .22, -r * .11, r * .1); x.bezierCurveTo(-r * .13, 0, -r * .05, -r * .1, 0, -r * .26); x.fill(); x.restore();
  },
  heart(x, it, E, c){ const r = it.r; x.beginPath(); for (let k = 0; k <= 80; k++){ const a = k / 80 * 6.2832; x[k ? 'lineTo' : 'moveTo'](Math.pow(Math.sin(a), 3) * r, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16 * r); } x.closePath(); x.fillStyle = bAlpha(c, .2); x.fill(); x.strokeStyle = c; x.lineWidth = Math.max(1.4, r * .04); x.lineJoin = 'round'; x.stroke(); },
  // 缝合的疤
  scar(x, it, E, c){
    const r = it.r, pts = bSpline([[-r, E.R(-.1, .1) * r], [-r * .4, E.R(-.2, .2) * r], [r * .3, E.R(-.2, .2) * r], [r, E.R(-.1, .1) * r]], 3); x.strokeStyle = c; x.lineCap = 'round'; x.lineWidth = Math.max(1.4, r * .02); bTrace(x, pts);
    for (let i = 6; i < pts.length - 4; i += Math.max(5, Math.round(r * .05))){ const a = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) + 1.5708 + E.R(-.2, .2), h = Math.max(7, r * .1) * E.R(.8, 1.15); x.beginPath(); x.moveTo(pts[i][0] - Math.cos(a) * h, pts[i][1] - Math.sin(a) * h); x.lineTo(pts[i][0] + Math.cos(a) * h, pts[i][1] + Math.sin(a) * h); x.stroke(); }
  },
  // 光
  orb(x, it, E, c0){
    const c = E.dark && relLum(hex2rgb(c0)) < relLum(hex2rgb(E.pal.g)) + .04 ? bMix(E.pal.a, E.pal.i, .3)      // 比底还暗的「光」是个黑洞
            : !E.dark && relLum(hex2rgb(c0)) < .14 ? bMix(c0, E.pal.g, .5) : c0;
    const g = x.createRadialGradient(0, 0, 0, 0, 0, it.r);
    for (let k = 0; k <= 14; k++){ const t = k / 14; g.addColorStop(t, bAlpha(c, Math.exp(-4.2 * t * t) * (1 - t * t * t))); }   // 高斯，中心没有尖
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, it.r, 0, 6.2832); x.fill();
  },
  beam(x, it, E, c){
    x.globalCompositeOperation = E.dark ? 'screen' : 'soft-light'; const col = E.dark ? c : '#ffffff', L = Math.hypot(E.W, E.H);
    for (let i = 0, n = E.I(2, 4); i < n; i++){ const w = it.r * E.R(.2, .6), off = it.r * E.R(-.8, .8), g = x.createLinearGradient(off - w, 0, off + w, 0); g.addColorStop(0, bAlpha(col, 0)); g.addColorStop(.5, bAlpha(col, E.dark ? E.R(.5, 1) : 1)); g.addColorStop(1, bAlpha(col, 0)); x.fillStyle = g; x.fillRect(off - w, -L, w * 2, L * 2); }
  },
  // 撒开的
  dust(x, it, E, c){ for (let i = 0, n = E.I(26, 60); i < n; i++){ x.fillStyle = bAlpha(E.maybe(.5) ? c : E.pal.i, E.R(.15, .6)); x.beginPath(); x.arc(E.R(-1, 1) * it.r, E.R(-1, 1) * it.r * E.H / E.W, E.R(.6, 1.9) * E.u, 0, 6.2832); x.fill(); } },
  snow(x, it, E, c){ const s = []; for (let i = 0, n = E.I(50, 120); i < n; i++) s.push([E.R(-1, 1) * it.r, (Math.pow(E.rnd(), .7) * 2 - 1) * it.r * E.H / E.W]); bSnow(x, E, s, 20 * E.u); },
  marks(x, it, E, c){
    const { W, H, u, pal } = E, m = 34 * u; x.translate(-W / 2, -H / 2); x.strokeStyle = bAlpha(pal.i, .5); x.lineWidth = 1.2 * u;
    for (const [px, py] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]]){ x.beginPath(); x.arc(px, py, 7 * u, 0, 6.2832); x.moveTo(px - 13 * u, py); x.lineTo(px + 13 * u, py); x.moveTo(px, py - 13 * u); x.lineTo(px, py + 13 * u); x.stroke(); }
    [pal.i, pal.a, pal.b, bMix(pal.g, pal.i, .4)].forEach((col, i) => { x.fillStyle = col; x.fillRect(W / 2 - 34 * u + i * 17 * u, H - m - 5 * u, 15 * u, 10 * u); });
  },
  // 几缕软线
  strand(x, it, E, c){
    const { W, H, u } = E, k = it.r / (W / 2), vert = E.maybe(.5), n = E.I(2, 5), sway = E.R(.05, .2), base = [];
    for (let i = 0; i < 6; i++) base.push([((vert ? E.R(-1, 1) * sway : -0.56 + i * .224) + (vert ? E.R(-.3, .3) * .1 : 0)) * W * k, (vert ? -0.56 + i * .224 : E.R(-1, 1) * sway) * H * k]);
    x.strokeStyle = bAlpha(c, .6); x.lineCap = 'round';
    for (let j = 0; j < n; j++){ x.lineWidth = E.R(.7, 1.7) * u; const d = j * E.R(8, 20) * u; bTrace(x, bSpline(base.map(([a, b], i) => [a + (vert ? d : 0) + E.R(-9, 9) * u, b + (vert ? 0 : d) + E.R(-9, 9) * u]), 4)); }
  },
  // 盖的
  torn(x, it, E, c){ bTorn(x, E, 0, 0, it.r * 2, (it.t || 90) * E.u, 0, c); },
  brush(x, it, E, c){ bBrush(x, E, 0, 0, it.r * 2, (it.t || 100) * E.u, 0, c); },
  invert(x, it, E){ x.globalCompositeOperation = 'difference'; x.globalAlpha = 1; x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, it.r, 0, 6.2832); x.fill(); },
  band(x, it, E){ x.globalCompositeOperation = 'difference'; x.globalAlpha = 1; x.fillStyle = '#fff'; x.fillRect(-it.r, -(it.t || 130) * E.u / 2, it.r * 2, (it.t || 130) * E.u); },
};
// 人能换来换去的，分几堆（面板上照这个顺序排）
const B_SHAPES = {
  shape: ['ring', 'ellipse', 'disc', 'moon', 'star', 'flake', 'flower', 'bloom', 'feather', 'eye', 'heart', 'drop', 'leaf', 'bubble', 'scar'],
  line : ['thread', 'strand'],
  light: ['orb', 'beam', 'dust', 'marks'],
  cover: ['torn', 'brush', 'snow', 'invert', 'band'],
};
const B_FIELD = ['dust', 'marks', 'snow', 'strand', 'beam'];         // 铺满整页的，点不着，只在单子里选
// 新添一件时的默认样子
function blindNewItem(id, seed, pal, W, H){
  const { R, P } = bRng(seed), u = Math.min(W, H) / 1080, dark = relLum(hex2rgb(pal.g)) < .3;
  const it = { id, seed, x: W / 2, y: H / 2, r: 120 * u, rot: 0, c: P(['a', 'b', 'a']), a: 1, front: false };
  if (id === 'thread'){
    const red = dark ? '#d9343f' : '#b41f2b';
    return { ...it, r: W / 2, feel: 'line', t: P([1.4, 2.2, 4, 7]) * u, c: contrast(hex2rgb(red), hex2rgb(pal.g)) >= 1.9 && R(0, 1) < .78 ? red : 'a' };
  }
  if (B_FIELD.includes(id)) Object.assign(it, { r: W / 2, a: id === 'beam' ? (dark ? R(.2, .34) : R(.6, .95)) : 1, rot: id === 'beam' ? R(-.9, .9) : 0, front: id === 'snow' });
  if (id === 'orb') Object.assign(it, { r: Math.max(W, H) * R(.28, .6), a: dark ? R(.28, .5) : R(.22, .44) });
  if (id === 'ellipse') it.q = R(.28, .5);
  if (id === 'star' || id === 'flake' || id === 'flower') it.r = R(30, 56) * u;
  if (id === 'bloom') Object.assign(it, { r: R(50, 96) * u, front: true });
  if (id === 'torn') Object.assign(it, { r: W * R(.45, .75), t: R(60, 140), rot: R(-.28, .28), front: true, c: P(['a', 'b', bMix(pal.g, pal.a, .4)]) });
  if (id === 'brush') Object.assign(it, { r: W * R(.3, .5), t: R(60, 150), rot: R(-.5, .5), front: true });
  if (id === 'invert') Object.assign(it, { r: W * R(.16, .32), front: true });
  if (id === 'band') Object.assign(it, { r: W, t: R(90, 240), rot: R(-.3, .3), front: true });
  if (id === 'disc') it.a = .92;
  if (['frost', 'reed', 'mosaic', 'blurp', 'lens'].includes(id)) Object.assign(it, { front: true, x: W * R(.25, .75), y: H * R(.2, .8), r: (id === 'lens' || id === 'blurp' ? R(110, 240) : R(200, 380)) * u, t: R(180, 460), rot: id === 'lens' || id === 'blurp' ? 0 : P([0, 0, R(-.2, .2)]) });
  return it;
}
const blindItemBox = it => {
  const q = it.id === 'ellipse' ? (it.q && it.q < .9 ? it.q : .38) : ['torn', 'brush', 'band', 'frost', 'reed', 'mosaic'].includes(it.id) ? 0 : 1;
  const hx = it.r, hy = q ? it.r * q : (it.t || 90) / 2, c = Math.abs(Math.cos(it.rot || 0)), s = Math.abs(Math.sin(it.rot || 0));
  const w = (hx * c + hy * s) * 2, h = (hx * s + hy * c) * 2;
  return { x: it.x - w / 2, y: it.y - h / 2, w, h };
};

// ── 掷景：一个「景」掷成几件独立的东西 ─────────────────────────────
function blindScene(group, B, seed){
  const E = bRng(seed), { R, I, P, maybe, rnd } = E, { W, H, u, pal } = B, out = [];
  const put = (id, o = {}) => { const it = { ...blindNewItem(id, Math.floor(rnd() * 4294967295), pal, W, H), ...o }; out.push(it); return it; };
  const spot = (r, strict, tries = 30) => { for (let k = 0; k < tries; k++){ const x = W * R(.04, .96), y = H * R(.04, .96); if (!B.hit(x, y, r, strict)) return [x, y]; } return null; };
  if (group === 'orbs') for (let i = 0, n = I(2, 4); i < n; i++) put('orb', { x: W * R(-.05, 1.05), y: H * R(-.05, 1.05), c: P(['a', 'b', 'a']) });
  else if (group === 'halo'){
    const h = B.heroRect || { x: W * .3, y: H * .3, w: W * .4, h: H * .3 };
    for (let k = 0; k < 26; k++){
      // 先想套住主角，套不住就去空地上挂一个
      const free = k > 7, x = free ? W * R(.1, .9) : h.x + h.w / 2, y = free ? H * R(.1, .9) : h.y + h.h / 2, q = maybe(.4) ? R(.28, .5) : 1;
      const r = free ? W * R(.12, .34) : Math.min(W * .46, Math.max(h.w, h.h) * R(.5, .68) + 40), rot = R(-.5, .5); let bad = false;
      for (let i = 0; i < 72 && !bad; i++){ const a = i * 6.2832 / 72, px = Math.cos(a) * r, py = Math.sin(a) * r * q; bad = B.hit(x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot), 8, free); }
      if (!bad){ put(q < 1 ? 'ellipse' : 'ring', { x, y, r, rot, q, c: 'a' }); break; }
    }
  }
  else if (group === 'stars'){ put('dust', { c: 'a' }); for (let i = 0, n = I(3, 7); i < n; i++){ const r = R(7, 24) * u, p = spot(r, true); if (p) put('star', { x: p[0], y: p[1], r, c: 'a', a: R(.6, .95) }); } }
  else if (group === 'flower'){
    const id = P(['flower', 'flower', 'flake']);
    for (let i = 0, n = I(2, 5), k = 0; i < n && k < 40; k++){
      const side = maybe(.5), x = side ? P([R(.03, .13), R(.87, .97)]) * W : W * R(.05, .95), y = side ? H * R(.05, .95) : P([R(.03, .1), R(.9, .97)]) * H, r = R(16, 46) * u;
      if (B.hit(x, y, r, true) || out.some(o => Math.hypot(o.x - x, o.y - y) < o.r + r)) continue;
      put(id, { x, y, r, rot: R(0, 6.28) }); i++;
    }
  }
  else if (group === 'motif'){ const id = P(['moon', 'feather', 'eye', 'heart', 'drop', 'bubble', 'scar', 'leaf']), r = R(54, 120) * u, p = spot(r, true, 60); if (p) put(id, { x: p[0], y: p[1], r, rot: id === 'eye' || id === 'heart' || id === 'drop' ? R(-.2, .2) : R(-.8, .8) }); }
  else if (group === 'petals'){ const cx = W * R(.1, .9), cy = H * R(.1, .9); for (let i = 0, n = I(6, 12); i < n; i++) put('bloom', { x: cx + (rnd() + rnd() - 1) * W * .36, y: cy + (rnd() + rnd() - 1) * H * .3, r: R(22, 84) * u, rot: R(0, 6.28), c: P(['a', 'b', bMix(pal.a, '#ffffff', .4)]) }); }
  else if (group === 'torn') put('torn', { x: W * R(.3, .7), y: H * R(.15, .85) });
  else if (group === 'brush') put('brush', { x: W * R(.35, .65), y: H * R(.2, .8) });
  else if (group === 'invert') maybe(.6) ? put('invert', { x: W * R(.2, .8), y: H * R(.2, .8) }) : put('band', { x: W / 2, y: H * R(.2, .8) });
  else if (group === 'beam') put('beam', { x: W * R(.25, .75), c: 'a' });
  else if (group === 'lines') put('strand', { x: W * R(.1, .9), y: H * R(.1, .9), c: 'a' });
  else if (BLIND_ITEMS[group] || group === 'thread') put(group);
  return out;
}

function blindDrawItem(x, it, B, pass){
  const { pal, W, H, u } = B, c = bCol(pal, it.c);
  if (it.id === 'thread'){
    const pts = bThreadPath(it, B), flag = bWeave(pts, B), all = it.front ? flag.map(() => true) : flag;
    x.save(); x.globalAlpha = it.a === undefined ? 1 : it.a;
    if (it.feel === 'yarn') bYarn(x, pts, all, pass === 'front', it.t || 6 * u, c, it.seed, B); else bPlain(x, pts, all, pass === 'front', it.t || 3 * u, c);
    x.restore();
    return;
  }
  if ((pass === 'front') !== !!it.front) return;
  const E = { ...bRng(it.seed), u, W, H, pal, dark: B.dark };
  x.save(); x.globalAlpha = it.a === undefined ? 1 : it.a; x.translate(it.x, it.y); if (it.rot) x.rotate(it.rot);
  BLIND_ITEMS[it.id](x, it, E, c); x.restore();
}

