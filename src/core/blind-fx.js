// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ② 效果：焦外、错版、光、散沙、网点、裂缝……
// ════════════════════════════════════════════════════════════════════
// 每种效果吃一层画好的字（透明底的画布），吐一层新的。
// 🔑 模糊不用 ctx.filter —— Safari 没有它，会一声不吭地不糊。自己缩小再放大，
//    哪儿都一样；而且几百像素的大糊也不费劲。
// 画布是 2160×2700 一张 23MB，所以用完就还回池子，同一时刻最多三四张。
const bPool = [];
function bCanvas(w, h){
  const i = bPool.findIndex(c => c.width === w && c.height === h);
  if (i >= 0){
    const c = bPool.splice(i, 1)[0], x = c.getContext('2d');
    if (x.reset){ x.reset(); if (x === bLastCtx) bLastRGB = -1; return c; }      // 连笔的状态一起清；颜色也回了黑，别当它还是上一种
    x.setTransform(1, 0, 0, 1, 0, 0); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'low';
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, w, h);
    return c;
  }
  return PLATFORM.canvas(w, h);
}
// 颜色没变就别重设：几十万粒沙，一粒解析一遍颜色字符串，比画还费
let bLastRGB = -1, bLastCtx = null;
const bFillRGB = (x, r, g, b) => { const k = r >> 2 << 12 | g >> 2 << 6 | b >> 2; if (k !== bLastRGB || x !== bLastCtx){ bLastRGB = k; bLastCtx = x; x.fillStyle = `rgb(${r},${g},${b})`; } };
const bFree = c => { if (c && bPool.length < 4 && c.width > 400){ if (bPool.length && bPool[0].width !== c.width && bPool[0].height !== c.height) bPool.length = 0; bPool.push(c); } };
const bDrain = () => { bPool.length = 0; };        // 一张画完就放掉，别常驻近百兆

// 糊。r 是设备像素的半径量级。逐级减半再逐级放大，比一步到位平滑得多。
function bBlur(cv, r){
  const W = cv.width, H = cv.height, n = Math.max(1, Math.round(Math.log2(Math.max(2, r))));
  const chain = []; let src = cv, w = W, h = H;
  for (let i = 0; i < n; i++){
    w = Math.max(2, Math.round(w / 2)); h = Math.max(2, Math.round(h / 2));
    const c = PLATFORM.canvas(w, h), x = c.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, w, h);
    chain.push(c); src = c;
  }
  for (let i = chain.length - 2; i >= 0; i--){
    const c = chain[i], x = c.getContext('2d');
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(src, 0, 0, c.width, c.height); src = c;
  }
  const out = bCanvas(W, H), x = out.getContext('2d');
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, W, H);
  return out;
}
function bTint(cv, color){
  const out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
  x.drawImage(cv, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, cv.width, cv.height);
  return out;
}
// 用渐变留住一部分（其余变透明）。直接改 cv。
function bMask(cv, grad){
  const x = cv.getContext('2d');
  x.globalCompositeOperation = 'destination-in';
  x.fillStyle = grad; x.fillRect(0, 0, cv.width, cv.height);
  x.globalCompositeOperation = 'source-over';
  return cv;
}
function bLinear(x, W, H, ang, stops){
  const cx = W / 2, cy = H / 2, L = Math.abs(Math.cos(ang)) * W / 2 + Math.abs(Math.sin(ang)) * H / 2;
  const g = x.createLinearGradient(cx - Math.cos(ang) * L, cy - Math.sin(ang) * L, cx + Math.cos(ang) * L, cy + Math.sin(ang) * L);
  for (const [p, a] of stops) g.addColorStop(p, `rgba(0,0,0,${a})`);
  return g;
}
// 这一层字实际占着哪一块（设备像素）。效果要落在字上，不是落在纸中央。
const bBox = (layer, E) => {
  const r = layer.rect || { x: 0, y: 0, w: E.W, h: E.H };
  return { x: r.x * DPR, y: r.y * DPR, w: r.w * DPR, h: r.h * DPR };
};

const BLIND_FX = {
  // 渐糊：从刀锋一路化到雾，四档糊叠成一条顺的坡
  melt(cv, E, L){
    const { R, P } = E, b = bBox(L, E), a = P([0, Math.PI, Math.PI / 2, -Math.PI / 2]), W = cv.width, H = cv.height, len = Math.abs(Math.cos(a)) * b.w + Math.abs(Math.sin(a)) * b.h, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const top = Math.max(8, Math.min(150, L.avg * DPR * (L.body ? .12 : L.gentle ? .13 : R(.2, .34)))), p0 = L.gentle || L.body ? R(.42, .56) : R(.2, .4), out = bCanvas(W, H), x = out.getContext('2d'), rs = [0, top * .16, top * .45, top];
    x.globalCompositeOperation = 'lighter';
    rs.forEach((r, i) => {
      const c = r ? bBlur(cv, r) : bCopy(cv), y = c.getContext('2d'), g = y.createLinearGradient(cx - Math.cos(a) * len / 2, cy - Math.sin(a) * len / 2, cx + Math.cos(a) * len / 2, cy + Math.sin(a) * len / 2), at = k => Math.min(1, Math.max(0, p0 + (1 - p0) * k / 3));
      if (i === 0){ g.addColorStop(0, '#000'); g.addColorStop(at(0), '#000'); g.addColorStop(at(1), 'rgba(0,0,0,0)'); }
      else { g.addColorStop(at(i - 1), 'rgba(0,0,0,0)'); g.addColorStop(at(i), '#000'); if (i < 3) g.addColorStop(at(i + 1), 'rgba(0,0,0,0)'); else g.addColorStop(1, '#000'); }
      bMask(c, g); x.drawImage(c, 0, 0); bFree(c);
    });
    x.globalCompositeOperation = 'source-over';
    return out;
  },
  // 错切：等宽的条，按一个节拍错开
  cuts(cv, E, L){
    const { R, I, P } = E, b = bBox(L, E), out = bCanvas(cv.width, cv.height), x = out.getContext('2d'), n = L.gentle ? I(3, 5) : I(4, 9), amp = (L.gentle ? R(.02, .045) : R(.04, .1)) * b.w, kind = P(['alt', 'sin', 'stair', 'one']), ph = R(0, 6.28), y0 = Math.floor(b.y - 8), h = (b.h + 16) / n, hit = I(0, n - 1);
    x.drawImage(cv, 0, 0, cv.width, Math.max(0, y0), 0, 0, cv.width, Math.max(0, y0));
    for (let i = 0; i < n; i++){ const a = Math.round(y0 + h * i), e = Math.round(y0 + h * (i + 1)), k = kind === 'alt' ? (i % 2 ? 1 : -1) * .5 : kind === 'sin' ? Math.sin(i / n * 6.28 + ph) : kind === 'stair' ? (i - (n - 1) / 2) / n * 1.4 : i === hit ? 1 : 0; x.drawImage(cv, 0, a, cv.width, e - a, Math.round(k * amp), a, cv.width, e - a); }
    const z = Math.round(y0 + h * n); if (z < cv.height) x.drawImage(cv, 0, z, cv.width, cv.height - z, 0, z, cv.width, cv.height - z);
    return out;
  },
  // 点阵：一头是实的，一头散成方格子（拜耳抖动，一格一格都对得齐）
  dither(cv, E, L){
    const { R, P, u } = E, b = bBox(L, E), W = cv.width, H = cv.height, p = Math.round(R(5, 9) * u) * DPR, w = Math.ceil(W / p), h = Math.ceil(H / p), c = PLATFORM.canvas(w, h), y = c.getContext('2d', { willReadFrequently: true });
    y.imageSmoothingQuality = 'high'; y.drawImage(cv, 0, 0, w, h);
    const im = y.getImageData(0, 0, w, h), d = im.data, B8 = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
    const a = P([0, Math.PI / 2, Math.PI, -Math.PI / 2, R(0, 6.28)]), ca = Math.cos(a), sa = Math.sin(a), len = Math.abs(ca) * b.w + Math.abs(sa) * b.h, cx = b.x + b.w / 2, cy = b.y + b.h / 2, p0 = L.gentle ? .5 : R(.12, .34), low = L.gentle ? .3 : .06;
    for (let r = 0, i = 0; r < h; r++) for (let q = 0; q < w; q++, i += 4){
      const t = ((q * p - cx) * ca + (r * p - cy) * sa) / len + .5, k = t < p0 ? 1.02 : 1 - (1 - low) * Math.min(1, (t - p0) / (1 - p0));
      d[i + 3] = d[i + 3] / 255 * k > (B8[(r & 7) * 8 + (q & 7)] + .5) / 64 ? 255 : 0;
    }
    y.putImageData(im, 0, 0);
    const out = bCanvas(W, H), x = out.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, w, h, 0, 0, w * p, h * p); x.imageSmoothingEnabled = true;
    return out;
  },
  // 晕染：墨落在生宣上，慢慢往外洇。近处浓、远处淡，边缘有纸的纤维
  ink(cv, E, L){
    const { R, u } = E, W = cv.width, H = cv.height, q = .5, w = Math.round(W * q), h = Math.round(H * q), seed = (E.rnd() * 4294967295) >>> 0, far = Math.max(5, Math.min(34, L.avg * (L.body ? .06 : L.gentle ? .075 : R(.085, .13)))) * u;
    const small = PLATFORM.canvas(w, h), sx = small.getContext('2d', { willReadFrequently: true }); sx.imageSmoothingQuality = 'high'; sx.drawImage(cv, 0, 0, w, h);
    const a = bBlur(small, bPx(far * 2.2)), A = a.getContext('2d').getImageData(0, 0, w, h).data, src = sx.getImageData(0, 0, w, h), d = src.data; bFree(a);
    let top = 1; for (let i = 3; i < A.length; i += 4 * 31) if (A[i] > top) top = A[i];                 // 细字糊开来很淡，按它自己最浓的地方归一
    const g = (cell, sd) => { const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, v = new Float32Array(gw * gh), r = mulberry32(sd); for (let i = 0; i < v.length; i++) v[i] = r(); return (x, y) => { const fx = x / cell, fy = y / cell, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, sX = tx * tx * (3 - 2 * tx), sY = ty * ty * (3 - 2 * ty), o = iy * gw + ix; return (v[o] * (1 - sX) + v[o + 1] * sX) * (1 - sY) + (v[o + gw] * (1 - sX) + v[o + gw + 1] * sX) * sY; }; };
    const n1 = g(bPx(190 * u), seed), n2 = g(bPx(34 * u), seed + 1), n3 = g(Math.max(2, bPx(9 * u)), seed + 2), n4 = g(Math.max(1.5, bPx(3)), seed + 3);
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4){
      const f = A[i + 3] / top, o = d[i + 3] / 255; if (f < .02 && !o) continue;
      const m = n1(x, y), k = n2(x, y) * .5 + n3(x, y) * .34 + n4(x, y) * .16, reach = .1 + .34 * (1 - m), t = Math.max(0, Math.min(1, (f - reach * (.55 + k * .9)) / .5)), v = t * t * (3 - 2 * t) * (.34 + .3 * m);
      const out = Math.max(v, o * (.9 + .1 * k));
      if (o < .6 && A[i + 3] > 2){ d[i] = A[i]; d[i + 1] = A[i + 1]; d[i + 2] = A[i + 2]; }
      d[i + 3] = out * 255;
    }
    sx.putImageData(src, 0, 0);
    const out = bCanvas(W, H), x = out.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(small, 0, 0, W, H); x.globalAlpha = .5; x.drawImage(cv, 0, 0); x.globalAlpha = 1;
    return out;
  },
  // 消散：一头还在，一头化成极细的尘，顺着一股气流走远
  drift(cv, E, L){
    bLastCtx = null;
    const { R, rnd, u } = E, b = bBox(L, E), W = cv.width, H = cv.height, a = R(-.7, .7) + (E.maybe(.5) ? 0 : Math.PI), ca = Math.cos(a), sa = Math.sin(a), len = Math.abs(ca) * b.w + Math.abs(sa) * b.h || 1, p0 = L.gentle || L.body ? R(.5, .62) : R(.28, .46), out = bCanvas(W, H), x = out.getContext('2d');
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, keep = bCopy(cv), g = keep.getContext('2d').createLinearGradient(cx - ca * len / 2, cy - sa * len / 2, cx + ca * len / 2, cy + sa * len / 2);
    g.addColorStop(0, '#000'); g.addColorStop(p0, '#000'); g.addColorStop(Math.min(1, p0 + (1 - p0) * .55), 'rgba(0,0,0,.32)'); g.addColorStop(1, 'rgba(0,0,0,0)'); bMask(keep, g); x.drawImage(keep, 0, 0); bFree(keep);
    const bx = Math.max(0, b.x | 0), by = Math.max(0, b.y | 0), bw = Math.min(W - bx, Math.ceil(b.w)), bh = Math.min(H - by, Math.ceil(b.h)); if (bw < 4 || bh < 4) return out;
    const d = cv.getContext('2d').getImageData(bx, by, bw, bh).data, n = Math.min(420000, bw * bh / 3.2), fly = (L.gentle || L.body ? 150 : 420) * u * DPR / 2, p1 = R(0, 6.28), p2 = R(0, 6.28), f1 = R(.0016, .003) * 2 / DPR, f2 = R(.005, .008) * 2 / DPR;
    for (let i = 0; i < n; i++){
      const px = (rnd() * bw) | 0, py = (rnd() * bh) | 0, o = (py * bw + px) * 4; if (d[o + 3] < 100) continue;
      const X = bx + px, Y = by + py, t = (((X - cx) * ca + (Y - cy) * sa) / len + .5 - p0) / (1 - p0); if (t <= 0 || rnd() > .12 + t * .95) continue;
      const go = Math.pow(rnd(), 2.6) * fly * (.15 + t * 1.5), th = a + Math.sin(X * f1 + Y * f1 * 1.3 + p1) * .55 + Math.sin(X * f2 - Y * f2 + p2) * .28 * (go / fly), lift = Math.sin(X * f1 * 2 + p2) * go * .2;
      const s = (.5 + Math.pow(rnd(), 5) * 2.2) * u * DPR / 2; x.globalAlpha = (.3 + rnd() * .6) * (1 - Math.min(.75, go / fly * .6)); bFillRGB(x, d[o], d[o + 1], d[o + 2]); x.fillRect(X + Math.cos(th) * go, Y + Math.sin(th) * go + lift, s, s);
    }
    x.globalAlpha = 1; return out;
  },
  // 狭缝：从某一行起，机器只剩下那一行，一直拉到纸边
  slit(cv, E, L){
    const b = bBox(L, E), W = cv.width, H = cv.height, yc = Math.round(b.y + (Math.min(b.h, H - b.y)) * (L.cutAt || E.R(.6, .8))), out = bCanvas(W, H), x = out.getContext('2d');
    x.drawImage(cv, 0, 0, W, yc, 0, 0, W, yc); x.imageSmoothingEnabled = false; x.drawImage(cv, 0, yc, W, 1, 0, yc, W, H - yc); x.imageSmoothingEnabled = true;
    return out;
  },
  // 局部焦外：一头清楚，一头化开。焦点落在哪、往哪边化，都是掷出来的。
  focus(cv, E, L){
    const { R, maybe } = E, b = bBox(L, E), W = cv.width, H = cv.height;
    // 糊多少看字有多大：同样的半径，大字是焦外，小字就成了一团
    const far = bBlur(cv, Math.max(5, Math.min(90, L.avg * DPR * (L.body ? R(.07, .1) : L.gentle ? R(.05, .085) : R(.1, .24)))));
    const sharp = bCanvas(W, H), sx = sharp.getContext('2d'); sx.drawImage(cv, 0, 0);
    const x = sharp.getContext('2d');
    let keep, lose;
    if (maybe(.5)){
      const fx = b.x + b.w * R(.2, .8), fy = b.y + b.h * R(.2, .8), rad = Math.max(b.w, b.h) * (L.gentle ? R(.5, .7) : R(.3, .5));
      const mk = inv => { const g = x.createRadialGradient(fx, fy, rad * .35, fx, fy, rad);
        g.addColorStop(0, `rgba(0,0,0,${inv ? 0 : 1})`); g.addColorStop(1, `rgba(0,0,0,${inv ? 1 : 0})`); return g; };
      keep = mk(false); lose = mk(true);
    } else {
      const a = R(0, Math.PI * 2), p = L.gentle ? R(.58, .72) : R(.35, .6);
      const g = inv => { const c = [b.x + b.w / 2, b.y + b.h / 2], len = Math.abs(Math.cos(a)) * b.w / 2 + Math.abs(Math.sin(a)) * b.h / 2;
        const gr = x.createLinearGradient(c[0] - Math.cos(a) * len, c[1] - Math.sin(a) * len, c[0] + Math.cos(a) * len, c[1] + Math.sin(a) * len);
        gr.addColorStop(0, `rgba(0,0,0,${inv ? 0 : 1})`); gr.addColorStop(p, `rgba(0,0,0,${inv ? 0 : 1})`);
        gr.addColorStop(Math.min(1, p + .28), `rgba(0,0,0,${inv ? 1 : 0})`); gr.addColorStop(1, `rgba(0,0,0,${inv ? 1 : 0})`); return gr; };
      keep = g(false); lose = g(true);
    }
    bMask(sharp, keep); bMask(far, lose);
    sx.drawImage(far, 0, 0); bFree(far);
    return sharp;
  },
  // 洇开：字还是清楚的，底下有一层晕
  haze(cv, E){
    const far = bBlur(cv, bPx(E.R(16, 34) * E.u)), out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    x.globalAlpha = E.dark ? .75 : .5; x.drawImage(far, 0, 0);
    x.globalAlpha = 1; x.drawImage(cv, 0, 0); bFree(far);
    return out;
  },
  // 发光：暗底才像光。亮底上改成暖色的投影
  glow(cv, E){
    const out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    const tint = bTint(cv, E.maybe(.6) ? E.pal.a : E.pal.b);
    for (const [r, a] of E.dark ? [[120, .9], [48, .9], [14, .8]] : [[90, .55], [36, .5]]){
      const g = bBlur(tint, bPx(r * E.u)); x.globalAlpha = a; x.drawImage(g, 0, 0); bFree(g);
    }
    bFree(tint);
    x.globalAlpha = 1; x.drawImage(cv, 0, 0);
    return out;
  },
  // 错版：两色各印一遍，对不准。叠住的地方自己会变深（亮底）或变亮（暗底）
  misreg(cv, E, L){
    const { R, u, pal } = E, out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    const d = (L.gentle ? R(4, 8) : R(7, 20)) * u * DPR / 2, a = R(0, Math.PI * 2);
    const A = bTint(cv, pal.a), B = bTint(cv, pal.b);
    x.drawImage(A, Math.cos(a) * d, Math.sin(a) * d);
    x.globalCompositeOperation = E.dark ? 'screen' : 'multiply';
    x.drawImage(B, -Math.cos(a) * d, -Math.sin(a) * d);
    x.globalCompositeOperation = 'source-over';
    // 两色要是都不够深，字就立不住：墨版压在中间
    const weak = Math.max(contrast(hex2rgb(pal.a), hex2rgb(pal.g)), contrast(hex2rgb(pal.b), hex2rgb(pal.g))) < 4;
    if (weak || L.gentle || E.maybe(.45)) x.drawImage(cv, 0, 0);
    bFree(A); bFree(B);
    return out;
  },
  // 切片：横着切成几条，各自滑开
  slice(cv, E, L){
    const { R, I, u } = E, b = bBox(L, E), out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    const n = L.gentle ? I(3, 5) : I(4, 11), amp = (L.gentle ? R(8, 16) : R(18, 70)) * u * DPR;
    let y = 0;
    const edges = [0]; for (let i = 1; i < n; i++) edges.push(b.y + b.h * (i + R(-.25, .25)) / n); edges.push(cv.height);
    edges.sort((p, q) => p - q);
    for (let i = 0; i + 1 < edges.length; i++){
      y = Math.round(edges[i]); const h = Math.round(edges[i + 1]) - y; if (h <= 0) continue;
      const dx = (i % 2 ? 1 : -1) * amp * R(0, 1);
      x.drawImage(cv, 0, y, cv.width, h, dx, y, cv.width, h);
    }
    return out;
  },
  // 裂缝：斜着断开，两半错位。缝合的时候，沿着缝有针脚
  split(cv, E, L){ return bSplit(cv, E, L, false); },
  stitch(cv, E, L){ return bSplit(cv, E, L, true); },
  // 水纹
  ripple(cv, E, L){
    const { R, u } = E, out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    const amp = (L.gentle ? R(5, 9) : R(10, 26)) * u * DPR, lam = bPx(R(44, 130) * u), ph = R(0, 6.28), step = DPR;
    for (let y = 0; y < cv.height; y += step){
      const k = L.mirror ? Math.min(1, Math.max(0, (y - L.mirror * DPR) / (260 * u * DPR))) * 1.3 + .12 : 1;
      const dx = Math.sin(y / lam + ph) * amp * k + Math.sin(y / (lam * .37) + ph * 2) * amp * .3 * k;
      x.drawImage(cv, 0, y, cv.width, step, dx, y, cv.width, step);
    }
    return out;
  },
  // 放射：从字里往外散的光
  burst(cv, E, L){
    const { R } = E, b = bBox(L, E), out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    const cx = b.x + b.w * R(.3, .7), cy = b.y + b.h * R(.2, .8), n = 26, k = L.gentle ? .006 : R(.008, .02);
    E.rnd(); const tint = bTint(cv, L.ghost || E.pal.a);
    for (let i = n; i >= 1; i--){
      const s = 1 + i * k;
      x.globalAlpha = .09 * (1 - i / (n + 1)) + .012;
      x.setTransform(s, 0, 0, s, cx * (1 - s), cy * (1 - s)); x.drawImage(tint, 0, 0);
    }
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.drawImage(cv, 0, 0); bFree(tint);
    return out;
  },
  // 拖影
  trail(cv, E, L){
    const { R, u } = E, out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    const a = E.P([0, Math.PI / 2, -Math.PI / 2, Math.PI, R(0, 6.28)]), len = (L.gentle ? Math.min(90, L.avg * R(.5, .9)) : R(110, 320)) * u * DPR, n = 46;
    const tint = bTint(cv, L.ghost || E.pal.a);
    for (let i = n; i >= 1; i--){
      const t = i / n; x.globalAlpha = (L.gentle ? .055 : .1) * Math.pow(1 - t, 1.5) + .004;
      x.drawImage(tint, Math.cos(a) * len * t, Math.sin(a) * len * t);
    }
    x.globalAlpha = 1; x.drawImage(cv, 0, 0); bFree(tint);
    return out;
  },
  // 叠影：往一个方向错开印几遍，一遍比一遍淡
  echo(cv, E, L){
    const { R, I, u } = E, out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    const n = I(2, 4), a = R(0, 6.28), d = (L.gentle ? R(9, 15) : R(14, 40)) * u * DPR / 2;
    const tint = bTint(cv, L.ghost || E.pal.a);
    for (let i = n; i >= 1; i--){ x.globalAlpha = .5 / i; x.drawImage(tint, Math.cos(a) * d * i, Math.sin(a) * d * i); }
    x.globalAlpha = 1; x.drawImage(cv, 0, 0); bFree(tint);
    return out;
  },
  // 拉丝：扫描仪上抽走了纸
  smear(cv, E, L){
    const { R, u } = E, b = bBox(L, E), W = cv.width, H = cv.height, out = bCanvas(W, H), x = out.getContext('2d');
    const yc = Math.round(b.y + b.h * R(.58, .8)), len = R(260, 620) * u * DPR;      // 淌到正文上也由它，盖住本身就是效果
    x.drawImage(cv, 0, yc, W, 2, 0, yc, W, len);
    const g = x.createLinearGradient(0, yc, 0, yc + len); g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    bMask(out, g); x.drawImage(cv, 0, 0, W, yc, 0, 0, W, yc);
    return out;
  },
  // 散沙：字的一边碎成沙，被风带走
  sand(cv, E, L){
    bLastCtx = null;
    const { R, rnd, u } = E, b = bBox(L, E), W = cv.width, H = cv.height;
    const out = bCanvas(W, H), x = out.getContext('2d');
    const a = R(0, 6.28), ca = Math.cos(a), sa = Math.sin(a), from = L.gentle ? R(.62, .75) : R(.42, .6);
    const len = Math.abs(ca) * b.w + Math.abs(sa) * b.h || 1;
    const pos = (px, py) => ((px - b.x - b.w / 2) * ca + (py - b.y - b.h / 2) * sa) / len + .5;
    const keep = bCanvas(W, H), kx = keep.getContext('2d'); kx.drawImage(cv, 0, 0);
    const g = kx.createLinearGradient(b.x + b.w / 2 - ca * len / 2, b.y + b.h / 2 - sa * len / 2, b.x + b.w / 2 + ca * len / 2, b.y + b.h / 2 + sa * len / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(from, 'rgba(0,0,0,1)');
    g.addColorStop(Math.min(1, from + .3), 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    bMask(keep, g); x.drawImage(keep, 0, 0); bFree(keep);
    const bx = Math.max(0, b.x | 0), by = Math.max(0, b.y | 0);
    const bw = Math.min(W - bx, Math.ceil(b.w)), bh = Math.min(H - by, Math.ceil(b.h));
    if (bw < 4 || bh < 4) return out;
    const d = cv.getContext('2d').getImageData(bx, by, bw, bh).data;
    const tries = Math.min(260000, bw * bh / 6), fly = (L.gentle ? 120 : 300) * u * DPR / 2;
    for (let i = 0; i < tries; i++){
      const px = (rnd() * bw) | 0, py = (rnd() * bh) | 0, o = (py * bw + px) * 4;
      if (d[o + 3] < 120) continue;
      const t = (pos(bx + px, by + py) - from) / (1 - from);
      if (t <= 0 || rnd() > .25 + t) continue;
      const far = Math.pow(rnd(), 1.8) * fly * (t * 1.5 + .1), side = (rnd() - .5) * fly * .5 * t;
      const sz = (.6 + rnd() * rnd() * 3.2) * u * DPR / 2;
      x.globalAlpha = .35 + rnd() * .6;
      bFillRGB(x, d[o], d[o + 1], d[o + 2]);
      x.fillRect(bx + px + ca * far - sa * side, by + py + sa * far + ca * side, sz, sz);
    }
    x.globalAlpha = 1;
    return out;
  },
  // 网点：一头是实的，一头化成半调网点
  dots(cv, E, L){
    const { R, u } = E, b = bBox(L, E), W = cv.width, H = cv.height;
    const out = bCanvas(W, H), x = out.getContext('2d');
    const p = (L.gentle ? R(9, 12) : R(11, 20)) * u * DPR / 2 * 1.4, a = R(0, 6.28), rot = R(.2, .7);
    const ca = Math.cos(a), sa = Math.sin(a), len = Math.abs(ca) * b.w + Math.abs(sa) * b.h || 1;
    const lo = L.gentle ? .58 : .34;
    x.fillStyle = '#000'; x.beginPath();
    const cr = Math.cos(rot), sr = Math.sin(rot), cx = b.x + b.w / 2, cy = b.y + b.h / 2, span = Math.hypot(b.w, b.h) / 2 + p * 2;
    for (let v = -span; v < span; v += p) for (let w = -span; w < span; w += p){
      const px = cx + w * cr - v * sr, py = cy + w * sr + v * cr;
      const t = ((px - cx) * ca + (py - cy) * sa) / len + .5;
      const r = p * Math.max(lo, .86 - t * .62);
      x.moveTo(px + r, py); x.arc(px, py, r, 0, 6.2832);
    }
    x.fill();
    x.globalCompositeOperation = 'source-in'; x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-over';
    if (E.maybe(.5) || L.gentle){ x.globalCompositeOperation = 'destination-over'; x.globalAlpha = .3; x.drawImage(cv, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
    return out;
  },
  // 散落：碎成小方块，越往一头散得越开
  scatter(cv, E, L){
    const { R, rnd, u } = E, b = bBox(L, E), out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    const s = Math.max(12, Math.round(L.avg * DPR * (L.gentle ? .3 : .22))), a = R(0, 6.28), ca = Math.cos(a), sa = Math.sin(a), len = Math.abs(ca) * b.w + Math.abs(sa) * b.h || 1, t0 = L.gentle ? .5 : .25, amp = (L.gentle ? 26 : 90) * u * DPR / 2;
    for (let y = Math.max(0, b.y | 0); y < b.y + b.h; y += s) for (let px = Math.max(0, b.x | 0); px < b.x + b.w; px += s){
      const t = Math.max(0, (((px + s / 2 - b.x - b.w / 2) * ca + (y + s / 2 - b.y - b.h / 2) * sa) / len + .5 - t0) / (1 - t0)), k = t * t;
      x.save(); x.translate(px + s / 2 + (R(-1, 1) * .5 + ca * rnd()) * amp * k, y + s / 2 + (R(-1, 1) * .5 + sa * rnd()) * amp * k); x.rotate(R(-1, 1) * k * 1.2); const q = 1 - k * R(0, .4); x.scale(q, q);
      x.drawImage(cv, px, y, s, s, -s / 2, -s / 2, s + .5, s + .5); x.restore();
    }
    return out;
  },
  // 粒子：字是一粒一粒聚出来的
  motes(cv, E, L){
    bLastCtx = null;
    const { rnd, u } = E, b = bBox(L, E), out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    const bx = Math.max(0, b.x | 0), by = Math.max(0, b.y | 0), bw = Math.min(cv.width - bx, Math.ceil(b.w)), bh = Math.min(cv.height - by, Math.ceil(b.h)); if (bw < 4 || bh < 4) return cv;
    const d = cv.getContext('2d').getImageData(bx, by, bw, bh).data;
    x.globalAlpha = L.gentle ? .5 : .22; x.drawImage(cv, 0, 0);
    const n = Math.min(160000, bw * bh / (L.gentle ? 12 : 16));
    for (let i = 0; i < n; i++){
      const px = (rnd() * bw) | 0, py = (rnd() * bh) | 0, o = (py * bw + px) * 4; if (d[o + 3] < 110) continue;
      const loose = rnd() < .1, s = (.8 + Math.pow(rnd(), 3) * 3.6) * u * DPR / 2, j = loose ? 46 * u * DPR / 2 * rnd() : 2.4, a = rnd() * 6.28;
      x.globalAlpha = loose ? .3 + rnd() * .4 : .55 + rnd() * .45; bFillRGB(x, d[o], d[o + 1], d[o + 2]); x.beginPath(); x.arc(bx + px + Math.cos(a) * j, by + py + Math.sin(a) * j, s, 0, 6.2832); x.fill();
    }
    x.globalAlpha = 1; return out;
  },
  // 残墨：老铅字没上匀的墨
  wear(cv, E, L){
    const { R, rnd, u } = E, b = bBox(L, E), out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    x.drawImage(cv, 0, 0);
    x.globalCompositeOperation = 'destination-out';
    const n = Math.min(26000, b.w * b.h / (L.gentle ? 190 : 110));
    for (let i = 0; i < n; i++){
      x.globalAlpha = .25 + rnd() * .7;
      const s = (.5 + rnd() * rnd() * 4.2) * u * DPR / 2;
      x.fillRect(b.x + rnd() * b.w, b.y + rnd() * b.h, s, s * R(.5, 1.6));
    }
    // 大块的没压实
    for (let i = 0; i < 14; i++){
      const px = b.x + rnd() * b.w, py = b.y + rnd() * b.h, r = R(30, 150) * u * DPR / 2;
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `rgba(0,0,0,${L.gentle ? .22 : .42})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = 1; x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    return out;
  },
  // 扫描线
  scan(cv, E, L){
    const out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'destination-out'; x.globalAlpha = L.gentle ? .4 : .75;
    const p = Math.round(E.R(8, 16) * E.u * DPR / 2) + 3;
    for (let y = 0; y < cv.height; y += p) x.fillRect(0, y, cv.width, Math.max(1.5, p * .26));
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    return out;
  },
  // 渐染：一行字从墨色走到点睛色
  wash(cv, E, L){
    const b = bBox(L, E), out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-in';
    const a = E.R(0, 6.28), cx = b.x + b.w / 2, cy = b.y + b.h / 2, len = (Math.abs(Math.cos(a)) * b.w + Math.abs(Math.sin(a)) * b.h) / 2;
    const g = x.createLinearGradient(cx - Math.cos(a) * len, cy - Math.sin(a) * len, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    g.addColorStop(0, E.pal.i); g.addColorStop(E.R(.3, .55), E.pal.i); g.addColorStop(E.R(.7, .85), E.pal.a); g.addColorStop(1, E.maybe(.5) ? E.pal.b : E.pal.a);
    x.fillStyle = g; x.fillRect(0, 0, cv.width, cv.height); x.globalCompositeOperation = 'source-over';
    return out;
  },
  // 倒影往下淡出（水面构图专用）
  fade(cv, E, L){
    const b = bBox(L, E), out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    x.drawImage(cv, 0, 0);
    const g = x.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, 'rgba(0,0,0,.72)'); g.addColorStop(1, 'rgba(0,0,0,.06)');
    return bMask(out, g);
  },
};

function bSplit(cv, E, L, sew){
  const { R, u, pal } = E, b = bBox(L, E), W = cv.width, H = cv.height, out = bCanvas(W, H), x = out.getContext('2d');
  const a = R(-.5, .5), cx = b.x + b.w * R(.4, .6), cy = b.y + b.h * R(.4, .6), far = W + H;
  const ca = Math.cos(a), sa = Math.sin(a);
  const d = (sew ? R(7, 14) : L.gentle ? R(8, 14) : R(16, 46)) * u * DPR, slide = (sew || L.gentle ? R(4, 16) : R(14, 60)) * u * DPR;
  for (const side of [-1, 1]){
    x.save();
    x.translate(-sa * side * d / 2 + ca * side * slide / 2, ca * side * d / 2 + sa * side * slide / 2);
    x.beginPath();
    x.moveTo(cx - ca * far, cy - sa * far); x.lineTo(cx + ca * far, cy + sa * far);
    x.lineTo(cx + ca * far - sa * side * far, cy + sa * far + ca * side * far);
    x.lineTo(cx - ca * far - sa * side * far, cy - sa * far + ca * side * far);
    x.closePath(); x.clip(); x.drawImage(cv, 0, 0); x.restore();
  }
  if (sew){
    const half = Math.min(Math.hypot(b.w, b.h) / 2, b.w * .52), gap = R(30, 44) * u * DPR / 2, arm = R(15, 24) * u * DPR / 2 + d * .5;
    x.strokeStyle = pal.a; x.lineCap = 'round'; x.lineWidth = 3.2 * u * DPR / 2;
    x.beginPath(); x.moveTo(cx - ca * half, cy - sa * half); x.lineTo(cx + ca * half, cy + sa * half);
    for (let t = -half + gap / 2; t < half; t += gap){
      const px = cx + ca * t, py = cy + sa * t, j = R(-.16, .16), vx = -Math.sin(a + j), vy = Math.cos(a + j), k = R(.8, 1.15);
      x.moveTo(px - vx * arm * k, py - vy * arm * k); x.lineTo(px + vx * arm * k, py + vy * arm * k);
    }
    x.stroke();
  }
  return out;
}

function bStar(x, cx, cy, r, color){
  x.fillStyle = color; x.beginPath();
  for (let i = 0; i < 8; i++){
    const a = i * Math.PI / 4, k = i % 2 ? r * .14 : r;
    x[i ? 'lineTo' : 'moveTo'](cx + Math.sin(a) * k, cy - Math.cos(a) * k);
  }
  x.closePath(); x.fill();
}
function bFlower(x, cx, cy, r, rot, color, E){
  x.save(); x.translate(cx, cy); x.rotate(rot);
  x.lineWidth = 1.5 * E.u; x.strokeStyle = bAlpha(color, .85); x.fillStyle = bAlpha(color, .14);
  const n = E.I(6, 9);
  for (let i = 0; i < n; i++){
    x.save(); x.rotate(i * 6.2832 / n); const k = E.R(.82, 1.08);
    x.beginPath(); x.moveTo(0, r * .12);
    x.bezierCurveTo(r * .24, r * .34, r * .2, r * .78 * k, 0, r * k); x.bezierCurveTo(-r * .2, r * .78 * k, -r * .24, r * .34, 0, r * .12);
    x.fill(); x.stroke(); x.restore();
  }
  x.fillStyle = bAlpha(color, .9);
  for (let i = 0; i < 7; i++){ x.beginPath(); x.arc(Math.cos(i * .9) * r * .1 * (i ? 1 : 0), Math.sin(i * .9) * r * .1 * (i ? 1 : 0), r * .045, 0, 6.2832); x.fill(); }
  x.restore();
}

// ── 遮盖 ───────────────────────────────────────────────────────────
// 盖住也是一种手法（2026-11-24 定的）：字都在原处，只是被挡了一部分。
// 两种用法：盖在某一层字上（BLIND_FX 里的 cover 类），或整张排完再盖一层（BLIND_OVER）。
// k ＝ 盖多少：主角可以盖狠一点，正文那一层轻一点。
const bOn = (c, pal) => contrast(hex2rgb(c), hex2rgb(pal.g)) >= contrast(hex2rgb(c), hex2rgb(pal.i)) ? pal.g : pal.i;

// 干刷一道：一束平行的毛，有的断、有的飞白
function bBrush(x, E, cx, cy, len, wid, ang, color){
  const { R, rnd } = E, n = Math.max(40, Math.round(wid / 1.15)), base = x.globalAlpha;
  x.save(); x.translate(cx, cy); x.rotate(ang); x.lineCap = 'butt';
  const bow = R(-.06, .06) * len, dry = R(.25, .55);
  x.strokeStyle = color; x.globalAlpha = base * .42; x.lineWidth = wid * .9; x.beginPath(); for (let k = 0; k <= 20; k++){ const q = -len * .485 + len * .86 * k / 20; x[k ? 'lineTo' : 'moveTo'](q, bow * (1 - Math.pow(q / len * 2, 2))); } x.stroke();
  for (let i = 0; i < n; i++){
    const f = i / (n - 1), v = (f - .5) * wid, edge = Math.abs(f - .5) * 2, load = .45 + rnd() * .55;      // 每根毛蘸的墨不一样多
    let a = -len / 2 + rnd() * len * .03 + Math.pow(edge, 3) * rnd() * len * .1;
    const end = len / 2 - Math.pow(rnd(), 1.6) * len * (dry * .5 + edge * .2);
    x.strokeStyle = bMix(color, rnd() < .5 ? '#ffffff' : '#000000', rnd() * .1);
    while (a < end){
      const seg = Math.min(end - a, len * R(.06, .34) * (1 + load)), t = (a + len / 2) / len;
      x.globalAlpha = base * Math.max(.1, load * (1 - t * dry) * R(.8, 1.1)); x.lineWidth = wid / n * R(.8, 2);
      x.beginPath();
      for (let k = 0; k <= 5; k++){ const q = a + seg * k / 5; x[k ? 'lineTo' : 'moveTo'](q, v + bow * (1 - Math.pow(q / len * 2, 2)) + Math.sin(q / 70 + i * .3) * .7); }
      x.stroke(); a += seg + (rnd() < t * dry * 1.5 ? len * rnd() * .06 : 0);
    }
  }
  x.restore();
}
// 撕下来的一条纸：毛边、露一线白茬、压一点影子
function bTorn(x, E, cx, cy, w, h, ang, color){
  const { rnd, u } = E, pts = [];
  const side = (x0, y0, x1, y1, amp) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(3, Math.round(L / (7 * u))), nx = -(y1 - y0) / L, ny = (x1 - x0) / L; let d = 0;
    for (let k = 0; k < n; k++){ d = d * .86 + (rnd() - .5) * amp; const e = d + (rnd() - .5) * amp * .18; pts.push([x0 + (x1 - x0) * k / n + nx * e, y0 + (y1 - y0) * k / n + ny * e]); }
  };
  side(-w / 2, -h / 2, w / 2, -h / 2, 13 * u); side(w / 2, -h / 2, w / 2 - h * .12, h / 2, 12 * u);
  side(w / 2 - h * .12, h / 2, -w / 2 + h * .1, h / 2, 13 * u); side(-w / 2 + h * .1, h / 2, -w / 2, -h / 2, 12 * u);
  const path = () => { x.beginPath(); pts.forEach(([a, b], i) => x[i ? 'lineTo' : 'moveTo'](a, b)); x.closePath(); };
  x.save(); x.translate(cx, cy); x.rotate(ang); x.lineJoin = 'round';
  x.shadowColor = 'rgba(0,0,0,.34)'; x.shadowBlur = 20 * u; x.shadowOffsetY = 6 * u;
  path(); x.fillStyle = bMix(color, '#ffffff', .62); x.fill();
  x.shadowColor = 'transparent'; path(); x.strokeStyle = bMix(color, '#ffffff', .62); x.lineWidth = 6 * u; x.stroke(); path(); x.fillStyle = color; x.fill();
  x.restore();
}
function bSnow(x, E, spots, r0){
  const { R, pal } = E, c = E.dark ? pal.i : bMix(pal.g, '#ffffff', .75);
  for (const [px, py] of spots){
    const r = r0 * R(.35, 1.15), g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, bAlpha(c, .96)); g.addColorStop(.55, bAlpha(c, .85)); g.addColorStop(1, bAlpha(c, 0));
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 6.2832); x.fill();
  }
}
// 在一层字的上头画东西（坐标是版面像素）
const bAtop = (cv, draw) => {
  const out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
  x.drawImage(cv, 0, 0); x.setTransform(DPR, 0, 0, DPR, 0, 0); x.save(); draw(x); x.restore(); x.setTransform(1, 0, 0, 1, 0, 0);
  return out;
};
Object.assign(BLIND_FX, {
  // 墨条：涂掉一截，像没解密的信
  bars(cv, E, L){
    const { R, rnd, pal } = E, gs = L.ops.filter(o => 'glv'.includes(o.k)), c = E.maybe(.65) ? pal.i : pal.a;
    return bAtop(cv, x => {
      x.fillStyle = c;
      if (L.rot){ x.translate(L.rot.cx, L.rot.cy); x.rotate(L.rot.r); x.translate(-L.rot.cx, -L.rot.cy); }
      const k = L.body ? .12 : L.gentle ? .16 : .3;
      for (const o of gs){
        if (o.k === 'g'){
          if (rnd() > k) continue;
          const w = o.fit ? o.fit[0] : (o.len || o.s * Math.max(1, [...o.t].length * .62)), h = o.fit ? o.fit[1] : o.s;
          x.save(); x.translate(o.x, o.y); x.rotate((o.r || 0) + R(-.02, .02));
          x.fillRect(-w * .54, -h * R(.02, .5), w * 1.08, h * R(.3, .62)); x.restore();
        } else {
          if (rnd() > k * 2.6) continue;
          const a = o.len * R(0, .6), n = Math.min(o.len - a, o.s * R(1.6, 5.5));
          if (o.k === 'l') x.fillRect(o.x + a, o.y + o.s * .02, n, o.s * 1.04); else x.fillRect(o.x - o.s * .02, o.y + a, o.s * 1.04, n);
        }
      }
    });
  },
  // 半掩：被底色的一块挡住，只露一部分
  veil(cv, E, L){
    const { R } = E, b = bBox(L, E), out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'destination-out';
    const k = L.gentle || L.body ? R(.1, .2) : R(.18, .34), a = E.P([0, 0, R(-.22, .22), Math.PI / 2]);
    x.translate(b.x + b.w / 2, b.y + b.h / 2); x.rotate(a);
    const W = Math.abs(Math.cos(a)) * b.w + Math.abs(Math.sin(a)) * b.h, H = Math.abs(Math.cos(a)) * b.h + Math.abs(Math.sin(a)) * b.w, side = E.P([-1, 1, 0]);
    const h = H * k, y = side ? side * (H / 2) - (side > 0 ? h : 0) : -h / 2 + H * R(-.14, .14);
    x.globalAlpha = .9; x.fillRect(-W, y - (side < 0 ? 4 : 0), W * 2, h + 4); x.globalAlpha = 1;      // 掩住，不是挖掉：后头还看得见一点
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over';
    if (!side && L.heavy && E.maybe(.4)) return bAtop(out, z => { z.translate((b.x + b.w / 2) / DPR, (b.y + b.h / 2) / DPR); z.rotate(a); z.fillStyle = E.pal.a; z.fillRect(-W / DPR / 2, y / DPR, W / DPR, 2.4 * E.u); z.fillRect(-W / DPR / 2, (y + h) / DPR, W / DPR, 2.4 * E.u); });
    return out;
  },
  // 百叶
  blinds(cv, E, L){
    const { R, u } = E, b = bBox(L, E), out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'destination-out';
    const p = Math.max(16 * u, L.avg * R(.16, .34)) * DPR, a = E.P([0, Math.PI / 2, R(-.6, .6)]), lo = .1, hi = L.gentle || L.body ? .34 : .68, far = Math.hypot(b.w, b.h);
    x.translate(b.x + b.w / 2, b.y + b.h / 2); x.rotate(a);
    for (let y = -far / 2; y < far / 2; y += p) x.fillRect(-far, y, far * 2, p * (lo + (hi - lo) * ((y + far / 2) / far)));
    return out;
  },
  // 反色圆：一枚圆压上来，圆里的字翻成另一个颜色
  disc(cv, E, L){
    const { R, pal } = E, b = bBox(L, E), c = E.maybe(.65) ? pal.a : pal.b, out = bCanvas(cv.width, cv.height), x = out.getContext('2d');
    const r = Math.min(Math.max(Math.min(b.w, b.h) * R(.36, .62), 90 * DPR), cv.width * .36), cx = b.x + b.w * R(.15, .85), cy = b.y + b.h * R(.2, .8);
    x.drawImage(cv, 0, 0);
    x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.fill();
    const on = bTint(cv, bOn(c, pal)); x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.clip(); x.drawImage(on, 0, 0); x.restore(); bFree(on);
    return out;
  },
  torn(cv, E, L){
    const { R, I, u, pal } = E, r = L.rect, n = L.gentle || L.body ? 1 : I(1, 2);
    return bAtop(cv, x => { for (let i = 0; i < n; i++) bTorn(x, E, r.x + r.w * R(.3, .7), r.y + r.h * R(.2, .85), Math.max(260 * u, r.w * R(.5, 1.15)), Math.min(150 * u, Math.max(30 * u, Math.min(r.h * (L.body ? .08 : R(.14, .28)), L.avg * 1.1))), R(-.24, .24), E.P([bMix(pal.g, pal.a, .34), pal.a, bMix(pal.g, E.dark ? '#ffffff' : '#000000', .1)])); });
  },
  brush(cv, E, L){
    const { R, u, pal } = E, r = L.rect, tall = r.h > r.w * 1.6;
    return bAtop(cv, x => bBrush(x, E, r.x + r.w * R(.4, .6), r.y + r.h * R(.25, .75), Math.max(r.w, 300 * u) * R(.7, 1.1), Math.min(230 * u, Math.max(34 * u, Math.min(L.avg * (L.gentle || L.body ? R(.5, .9) : R(.7, 1.2)), (tall ? r.w : r.h) * .6))), R(-.3, .3), E.P([pal.a, pal.b, bMix(pal.g, pal.a, .6)])));
  },
  petals(cv, E, L){
    const { R, I, u, pal, rnd } = E, r = L.rect;
    return bAtop(cv, x => { for (let i = 0, n = L.body ? I(3, 5) : I(4, 9); i < n; i++) { x.save(); x.translate(r.x + r.w * rnd(), r.y + r.h * rnd()); x.rotate(R(0, 6.28)); BLIND_ITEMS.bloom(x, { r: Math.max(22 * u, Math.min(130 * u, L.avg * R(.35, .85))) }, E, E.P([pal.a, pal.b, bMix(pal.a, '#ffffff', .4)])); x.restore(); } });
  },
  // 积雪：一点一点落在字上，盖住笔画的上沿
  snow(cv, E, L){
    const { rnd, R, u } = E, r = L.rect, n = Math.min(90, Math.round(r.w * r.h / (L.gentle || L.body ? 16000 : 8000)) + 8), spots = [];
    for (let i = 0; i < n; i++) spots.push([r.x + r.w * rnd(), r.y + r.h * rnd()]);
    return bAtop(cv, x => bSnow(x, E, spots, Math.max(9 * u, Math.min(46 * u, L.avg * .24))));
  },
});

