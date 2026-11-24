// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ⑥ 修图：整张排好之后再过一遍
// ════════════════════════════════════════════════════════════════════
// 跟 BLIND_FX 的区别：那些落在某一层字上，这些吃的是整张成品（纸、字、物件全在内）。
// 每一种就地改 cv（设备像素，2160×2700）。E 里的 rnd 走它自己的种子。
// 逐像素的尽量在半幅上算 —— 全幅五百八十万像素，多来两遍就顿了。
const bCopy = cv => { const c = bCanvas(cv.width, cv.height); c.getContext('2d').drawImage(cv, 0, 0); return c; };
// 收 (x, W, H) 的按两倍图的坐标画（草样时坐标系自己缩）；只收 x 的是整张搬图，按真像素
const bFull = (cv, fn) => { const x = cv.getContext('2d'), k = fn.length > 1 ? DPR / 2 : 1; x.save(); x.setTransform(k, 0, 0, k, 0, 0); fn(x, cv.width / k, cv.height / k); x.restore(); };
// 缩到 w×h 上逐像素改，再放回来
function bPixels(cv, scale, fn, smooth = true){
  const w = Math.max(2, Math.round(cv.width * scale)), h = Math.max(2, Math.round(cv.height * scale)), c = PLATFORM.canvas(w, h), x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, w, h);
  const im = x.getImageData(0, 0, w, h); const out = fn(im, w, h) || im; x.putImageData(out, 0, 0);
  bFull(cv, (y, W, H) => { y.imageSmoothingEnabled = smooth; y.imageSmoothingQuality = 'high'; y.drawImage(c, 0, 0, W, H); });
}
const bNoisePat = x => x.createPattern(blindGrain(), 'repeat');

const BLIND_POST = {
  // 反色
  negate(cv){ const src = bCopy(cv); bFull(cv, (x, W, H) => { x.globalCompositeOperation = 'difference'; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'hue'; x.drawImage(src, 0, 0, W, H); }); bFree(src); },
  // 正片叠底：压一层颜色上去（暗底上正片叠底看不见，用它的反面：滤色）
  multiply(cv, E){
    const { R, pal } = E;
    bFull(cv, (x, W, H) => {
      const a = R(0, 6.28), g = x.createLinearGradient(W / 2 - Math.cos(a) * W, H / 2 - Math.sin(a) * H, W / 2 + Math.cos(a) * W, H / 2 + Math.sin(a) * H);
      const h = bAnchor(pal), s = E.maybe(.5) ? 1 : -1;      // 压上去的颜色跟底是一家的，不然一叠就灰
      if (E.dark){ x.globalCompositeOperation = 'screen'; g.addColorStop(0, bAlpha(bOklch(.42, .12, bDarkHue(h)), .6)); g.addColorStop(.6, bAlpha(bOklch(.36, .1, bDarkNear(h, s * 24)), .2)); g.addColorStop(1, bAlpha(bOklch(.4, .11, bDarkNear(h, s * 40)), .5)); }
      else { x.globalCompositeOperation = 'multiply'; g.addColorStop(0, bOklch(.85, .095, h)); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, bOklch(.88, .08, h + s * 44)); }
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    });
  },
  // 移轴的高斯模糊：留一条清楚的带子
  gauss(cv, E){
    const { R, u } = E, far = bBlur(cv, bPx(R(9, 20) * u)), far2 = far.getContext('2d'), a = R(-.4, .4), z = (E.bodyRect && E.maybe(.65) ? E.bodyRect : E.heroRect), p = z ? Math.max(.14, Math.min(.86, (z.y + z.h / 2) / E.H)) : R(.3, .7), k = R(.17, .28);
    far2.globalCompositeOperation = 'destination-in'; far2.setTransform(1, 0, 0, 1, 0, 0);
    const W = cv.width, H = cv.height, g = far2.createLinearGradient(W / 2 - Math.sin(a) * H / 2, H / 2 - Math.cos(a) * H / 2, W / 2 + Math.sin(a) * H / 2, H / 2 + Math.cos(a) * H / 2);
    for (const [t, v] of [[0, 1], [Math.max(.01, p - k - .16), 1], [Math.max(.02, p - k), 0], [Math.min(.98, p + k), 0], [Math.min(.99, p + k + .16), 1], [1, 1]]) g.addColorStop(t, `rgba(0,0,0,${v})`);
    far2.fillStyle = g; far2.fillRect(0, 0, W, H); far2.globalCompositeOperation = 'source-over';
    bFull(cv, x => x.drawImage(far, 0, 0)); bFree(far);
  },
  // 失焦：整张都虚着，像没戴眼镜
  defocus(cv, E){
    const a = bBlur(cv, bPx(E.R(5, 8) * E.u)), b = bBlur(cv, bPx(26 * E.u));
    bFull(cv, x => { x.globalAlpha = .82; x.drawImage(a, 0, 0); x.globalAlpha = .4; x.globalCompositeOperation = E.dark ? 'screen' : 'soft-light'; x.drawImage(b, 0, 0); }); bFree(a); bFree(b);
  },
  // 旋焦：中间清楚，越往边上越转
  swirl(cv, E){
    const W = cv.width, H = cv.height, h = E.heroRect || { x: 0, y: 0, w: E.W, h: E.H }, bd = E.bodyRect, mid = (a, w) => a + w / 2, cx = bd ? (mid(bd.x, bd.w) * .62 + mid(h.x, h.w) * .38) * DPR : mid(h.x, h.w) * DPR * .6 + W * .2, cy = bd ? (mid(bd.y, bd.h) * .62 + mid(h.y, h.h) * .38) * DPR : mid(h.y, h.h) * DPR * .6 + H * .2, src = bCopy(cv), acc = bCanvas(W, H), x = acc.getContext('2d'), n = 22, sweep = E.full ? E.R(.035, .06) : E.R(.07, .14);
    for (let i = 0; i < n; i++){ x.globalAlpha = 1 / (i + 1); x.setTransform(1, 0, 0, 1, cx, cy); x.rotate((i / (n - 1) - .5) * sweep); x.drawImage(src, -cx, -cy); }
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'destination-in';
    const r = Math.max(W, H), g = x.createRadialGradient(cx, cy, r * (E.full ? .24 : .17), cx, cy, r * (E.full ? .56 : .46)); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
    bFull(cv, y => y.drawImage(acc, 0, 0)); bFree(src); bFree(acc);
  },
  // 柔光
  soft(cv, E){ const b = bBlur(cv, bPx(34 * E.u)); bFull(cv, x => { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = .8; x.drawImage(b, 0, 0); x.globalCompositeOperation = 'screen'; x.globalAlpha = E.dark ? .45 : .22; x.drawImage(b, 0, 0); }); bFree(b); },
  // 光晕：亮处漫出一圈暖边
  halation(cv, E){
    const warm = bHueGap(bAnchor(E.pal), 20) < 60 || bLch(E.pal.g)[1] < .012, tint = hex2rgb(warm ? '#ff6834' : bOklch(.66, .15, E.dark ? bDarkHue(bAnchor(E.pal)) : bAnchor(E.pal)));
    const c = PLATFORM.canvas(cv.width >> 2, cv.height >> 2), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(cv, 0, 0, c.width, c.height);
    const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4){ const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255, sat = (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2])) / 255, k = E.dark ? Math.max(0, l - .42) * 1.7 : Math.max(0, sat - .3) * 1.1; d[i] = Math.min(255, tint[0] * k); d[i + 1] = Math.min(255, tint[1] * k); d[i + 2] = Math.min(255, tint[2] * k); d[i + 3] = 255; }
    x.putImageData(im, 0, 0); const b = bBlur(c, bPx(13));
    bFull(cv, (y, W, H) => { y.imageSmoothingQuality = 'high'; y.globalCompositeOperation = E.dark ? 'screen' : 'soft-light'; y.globalAlpha = E.dark ? .95 : .7; y.drawImage(b, 0, 0, W, H); });
  },
  // 光斑
  bokeh(cv, E){
    // 镜头外的光：大、软、少，聚在一角；硬边的小圆片撒一地，是素材，不是光
    const { R, I, P, pal } = E, h = bAnchor(pal);
    bFull(cv, (x, W, H) => {
      x.globalCompositeOperation = E.dark ? 'screen' : 'soft-light';
      const cx = W * P([R(-.05, .2), R(.8, 1.05)]), cy = H * R(.02, .98);
      for (let i = 0, n = I(6, 11); i < n; i++){
        const px = cx + (E.rnd() + E.rnd() - 1) * W * .5, py = cy + (E.rnd() + E.rnd() - 1) * H * .42, r = W * R(.06, .2), c = E.dark ? P([bOklch(.6, .11, bDarkHue(h)), bOklch(.52, .1, bDarkNear(bDarkHue(h), 30))]) : P(['#ffffff', bMix(pal.a, '#ffffff', .5)]), k = E.dark ? R(.1, .24) : R(.3, .6);
        const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, bAlpha(c, k)); g.addColorStop(.55, bAlpha(c, k * .8)); g.addColorStop(.8, bAlpha(c, k * .42)); g.addColorStop(1, bAlpha(c, 0));
        x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 6.2832); x.fill();
      }
    });
  },
  // 暗闪：压暗四周，撒一把碎亮片
  spark(cv, E){
    const { R, I, P, pal, rnd } = E;
    bFull(cv, (x, W, H) => {
      const cx = W * R(.35, .65), cy = H * R(.35, .65), g = x.createRadialGradient(cx, cy, W * .18, cx, cy, H * .74); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, E.dark ? 'rgba(0,0,0,.6)' : 'rgba(20,10,24,.42)');
      x.globalCompositeOperation = 'multiply'; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
      for (let i = 0, n = I(420, 900); i < n; i++){ const s = Math.pow(rnd(), 5) * 5 + .8; x.globalAlpha = .25 + rnd() * .75; x.fillStyle = P(['#ffffff', bMix(pal.a, '#ffffff', .5), bMix(pal.b, '#ffffff', .4)]); x.fillRect(W * rnd(), H * rnd(), s * 1.2, s * 1.2); }
      for (let i = 0, n = I(14, 30); i < n; i++){ x.globalAlpha = R(.5, 1); bStar(x, W * rnd(), H * rnd(), R(8, 38) * E.u, P(['#ffffff', bMix(pal.a, '#ffffff', .6)])); }
    });
  },
  // 珠光：贝壳里面那种随角度变的虹彩
  pearl(cv, E){
    const { R } = E;
    bFull(cv, (x, W, H) => {
      const cols = ['#ffd9ec', '#d9e4ff', '#d6fff4', '#fff6cf', '#f0d6ff', '#cfe9ff', '#ffe0d6'], a = R(0, 6.28), g = x.createLinearGradient(W / 2 - Math.cos(a) * W, H / 2 - Math.sin(a) * H, W / 2 + Math.cos(a) * W, H / 2 + Math.sin(a) * H);
      for (let i = 0; i <= 13; i++) g.addColorStop(i / 13, cols[i % 7]);
      x.globalCompositeOperation = E.dark ? 'overlay' : 'multiply'; x.globalAlpha = E.dark ? .5 : .78; x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++){ const px = W * R(0, 1), py = H * R(0, 1), r = W * R(.3, .7), q = x.createRadialGradient(px, py, 0, px, py, r); q.addColorStop(0, 'rgba(255,255,255,.55)'); q.addColorStop(1, 'rgba(255,255,255,0)'); x.globalCompositeOperation = 'soft-light'; x.globalAlpha = .8; x.fillStyle = q; x.fillRect(0, 0, W, H); }
    });
  },
  // 胶片：压浅黑位、偏暖、划痕、灰尘、一角漏光
  film(cv, E){
    const { R, I, rnd } = E;
    bFull(cv, (x, W, H) => {
      const h = bAnchor(E.pal), warm = bHueGap(h, 30) < 50, leak = E.dark ? bOklch(.5, .15, bDarkNear(h, warm ? -14 : 18)) : warm || bLch(E.pal.g)[1] < .02 ? '#ff7a3c' : bOklch(.74, .13, h + 24);
      x.globalCompositeOperation = 'lighten'; x.fillStyle = E.dark ? bOklch(.22, .02, bDarkHue(h)) : '#26222a'; x.fillRect(0, 0, W, H);
      if (!E.dark && warm){ x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(255,196,120,.3)'; x.fillRect(0, 0, W, H); }
      const left = rnd() < .5, g = x.createLinearGradient(left ? 0 : W, H * R(0, 1), left ? W * R(.25, .5) : W * R(.5, .75), H * R(0, 1)); g.addColorStop(0, bAlpha(leak, .72)); g.addColorStop(.35, bAlpha(leak, .28)); g.addColorStop(1, bAlpha(leak, 0));
      x.globalCompositeOperation = 'screen'; x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = 'source-over'; x.strokeStyle = 'rgba(255,255,255,.35)';
      for (let i = 0, n = I(5, 11); i < n; i++){ const px = W * rnd(); x.globalAlpha = R(.2, .7); x.lineWidth = R(.7, 1.8); x.beginPath(); x.moveTo(px, 0); for (let y = 0; y <= H; y += H / 10) x.lineTo(px + R(-3, 3), y); x.stroke(); }
      for (let i = 0, n = I(60, 130); i < n; i++){ x.globalAlpha = R(.25, .8); x.fillStyle = rnd() < .7 ? '#fff' : '#1a1410'; const s = Math.pow(rnd(), 3) * 7 + 1; x.beginPath(); x.ellipse(W * rnd(), H * rnd(), s, s * R(.3, 1), rnd() * 3, 0, 6.2832); x.fill(); }
      x.globalAlpha = .32; x.globalCompositeOperation = 'overlay'; x.fillStyle = bNoisePat(x); x.fillRect(0, 0, W, H);
    });
  },
  // 复古：褪色、泛黄、折痕
  retro(cv, E){
    const { R, I } = E;
    bFull(cv, (x, W, H) => {
      x.globalCompositeOperation = 'saturation'; x.globalAlpha = .5; x.fillStyle = '#808080'; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
      x.globalCompositeOperation = E.dark ? 'screen' : 'multiply'; x.fillStyle = E.dark ? '#2a1c10' : '#f0d9ae'; x.fillRect(0, 0, W, H);
      const g = x.createRadialGradient(W / 2, H / 2, W * .35, W / 2, H / 2, H * .72); g.addColorStop(0, 'rgba(90,50,14,0)'); g.addColorStop(1, 'rgba(70,36,8,.5)'); x.globalCompositeOperation = 'multiply'; x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0, n = I(1, 3); i < n; i++){                         // 折过的印子
        const v = E.rnd() < .5, p = R(.3, .7) * (v ? W : H), w = 26; const q = v ? x.createLinearGradient(p - w, 0, p + w, 0) : x.createLinearGradient(0, p - w, 0, p + w);
        q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(.48, 'rgba(60,36,10,.07)'); q.addColorStop(.5, 'rgba(255,248,228,.2)'); q.addColorStop(.56, 'rgba(255,248,228,.1)'); q.addColorStop(1, 'rgba(0,0,0,0)'); x.globalCompositeOperation = 'source-over'; x.fillStyle = q; v ? x.fillRect(p - w, 0, w * 2, H) : x.fillRect(0, p - w, W, w * 2);
      }
      x.globalAlpha = .22; x.globalCompositeOperation = 'overlay'; x.fillStyle = bNoisePat(x); x.fillRect(0, 0, W, H);
    });
  },
  // 磨砂：像隔着一层砂面看
  matte(cv, E){
    const seed = (E.rnd() * 4294967295) >>> 0, amp = E.R(1.2, 2.2) * E.u * (DPR > 1 ? 1 : .8);
    bPixels(cv, DPR > 1 ? .62 : 1, (im, w, h) => {
      const s = im.data, out = new ImageData(w, h), d = out.data, src = new Uint32Array(s.buffer), dst = new Uint32Array(d.buffer), r = mulberry32(seed), k = amp * 2;
      for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++){
        const q = r(), xx = x + ((q * k * 2 - k) | 0), yy = y + ((q * 997 % 1 * k * 2 - k) | 0);
        dst[i] = src[(yy < 0 ? 0 : yy >= h ? h - 1 : yy) * w + (xx < 0 ? 0 : xx >= w ? w - 1 : xx)];
      }
      return out;
    });
    bFull(cv, (x, W, H) => { x.globalAlpha = .28; x.globalCompositeOperation = 'soft-light'; x.fillStyle = bNoisePat(x); x.fillRect(0, 0, W, H); });
  },
  // 油画：Kuwahara —— 每一点看四个角，取最匀的那个角的颜色，边就变成了笔触
  oil(cv, E){
    const fine = DPR > 1, R0 = Math.max(2, Math.round(E.R(2, 3.7) * E.u * (fine ? 1 : .72)));
    bPixels(cv, fine ? .5 : .72, (im, w, h) => {
      const s = im.data, W1 = w + 1, N = W1 * (h + 1), sr = new Float64Array(N), sg = new Float64Array(N), sb = new Float64Array(N), sl = new Float64Array(N);
      for (let y = 0; y < h; y++){ let a = 0, b = 0, c = 0, l2 = 0; for (let x = 0; x < w; x++){ const i = (y * w + x) * 4, r = s[i], g = s[i + 1], q = s[i + 2], l = r * .3 + g * .59 + q * .11; a += r; b += g; c += q; l2 += l * l; const o = (y + 1) * W1 + x + 1, p = y * W1 + x + 1; sr[o] = sr[p] + a; sg[o] = sg[p] + b; sb[o] = sb[p] + c; sl[o] = sl[p] + l2; } }
      const out = new ImageData(w, h), d = out.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
        let best = 1e18, br = 0, bg = 0, bb = 0;
        for (let q = 0; q < 4; q++){
          const x0 = Math.max(0, q & 1 ? x : x - R0), x1 = Math.min(w, (q & 1 ? x + R0 : x) + 1), y0 = Math.max(0, q & 2 ? y : y - R0), y1 = Math.min(h, (q & 2 ? y + R0 : y) + 1), n = (x1 - x0) * (y1 - y0);
          const A = y1 * W1 + x1, B2 = y0 * W1 + x1, C = y1 * W1 + x0, D = y0 * W1 + x0;
          const r = (sr[A] - sr[B2] - sr[C] + sr[D]) / n, g = (sg[A] - sg[B2] - sg[C] + sg[D]) / n, b = (sb[A] - sb[B2] - sb[C] + sb[D]) / n, l = r * .3 + g * .59 + b * .11, v = (sl[A] - sl[B2] - sl[C] + sl[D]) / n - l * l;
          if (v < best){ best = v; br = r; bg = g; bb = b; }
        }
        const i = (y * w + x) * 4; d[i] = br; d[i + 1] = bg; d[i + 2] = bb; d[i + 3] = 255;
      }
      return out;
    });
    // 一层画布的纹
    bFull(cv, (x, W, H) => { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = .2; x.strokeStyle = '#000'; x.lineWidth = 1.2; x.beginPath(); for (let i = 0; i < W; i += 7){ x.moveTo(i, 0); x.lineTo(i, H); } for (let i = 0; i < H; i += 7){ x.moveTo(0, i); x.lineTo(W, i); } x.stroke(); x.globalAlpha = .3; x.fillStyle = bNoisePat(x); x.fillRect(0, 0, W, H); });
  },
  // 像素
  pixel(cv, E){
    const cell = E.I(3, 5) * E.u, lv = E.I(14, 20);
    bPixels(cv, 1 / (cell * DPR), im => { const d = im.data; for (let i = 0; i < d.length; i++) if (i % 4 !== 3) d[i] = Math.round(d[i] / 255 * lv) / lv * 255; }, false);
  },
  // 低画质：被转发了很多遍
  lowq(cv, E){
    const q = Math.min(1, E.R(.16, .24) * 2 / DPR);
    bPixels(cv, q, (im, w, h) => {
      const d = im.data;
      for (let by = 0; by < h; by += 8) for (let bx = 0; bx < w; bx += 8){                   // 一块一块的，色彩糊在一起
        let a = 0, b = 0, n = 0; const x1 = Math.min(w, bx + 8), y1 = Math.min(h, by + 8);
        for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++){ const i = (y * w + x) * 4, l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; a += d[i] - l; b += d[i + 2] - l; n++; }
        a /= n; b /= n; const jit = (E.rnd() - .5) * 9;
        for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++){ const i = (y * w + x) * 4; let l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; l = Math.round((l + jit) / 9) * 9; d[i] = l + a; d[i + 2] = l + b; d[i + 1] = l - (a * .3 + b * .11) / .59; }
      }
    });
  },
  // 录像带
  vhs(cv, E){
    const { R, I, rnd, u } = E, src = bCopy(cv), d = R(5, 12) * u * DPR / 2, W = cv.width, H = cv.height;
    const ch = col => { const c = bCopy(src), x = c.getContext('2d'); x.globalCompositeOperation = 'multiply'; x.fillStyle = col; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; return c; };
    const r = ch('#ff0000'), gb = ch('#00ffff');
    bFull(cv, x => {
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'; x.drawImage(r, -d, 0); x.drawImage(gb, d, 0); x.globalCompositeOperation = 'source-over';
      const snap = bCopy(cv);
      for (let i = 0, n = I(3, 6); i < n; i++){ const y = H * rnd() | 0, h = R(10, 70) * u | 0, dx = R(-60, 60) * u; x.drawImage(snap, 0, y, W, h, dx, y, W, h); x.fillStyle = `rgba(255,255,255,${R(.05, .18)})`; x.fillRect(0, y, W, R(1, 5)); }
      bFree(snap);
      x.fillStyle = 'rgba(0,0,0,.2)'; for (let y = 0; y < H; y += bPx(6)) x.fillRect(0, y, W, bPx(2.4));
      x.globalCompositeOperation = 'overlay'; x.globalAlpha = .4; x.fillStyle = bNoisePat(x); x.fillRect(0, 0, W, H);
    });
    bFree(src); bFree(r); bFree(gb);
  },
  // 长虹玻璃：整张隔着一排竖棱看
  reeded(cv, E){
    const src = bCopy(cv), W = cv.width, H = cv.height, p = E.R(30, 64) * E.u * DPR / 2 * 1.6, from = E.maybe(.6) ? W * E.R(.36, .6) : 0;
    bFull(cv, x => bReed(x, src, from, 0, W - from, H, p, E)); bFree(src);
  },
  // 字幕：上下黑边，底下一行白字黄字
  subtitle(cv, E){
    const W = cv.width, H = cv.height, src = bCopy(cv), k = .8, top = H * .075;
    bFull(cv, x => {
      x.fillStyle = '#060606'; x.fillRect(0, 0, W, H); const h = H * k, full = W / H > 1;
      const w = full ? W * k : W, hh = full ? h : h; x.save(); x.beginPath(); x.rect((W - w) / 2, top, w, hh); x.clip(); const s = Math.max(w / W, hh / H); x.drawImage(src, (W - W * s) / 2, top + (hh - H * s) / 2, W * s, H * s); x.restore();
      const t = E.subtitle || ''; if (!t) return;
      let s1 = 40 * E.u * DPR; x.font = `${s1}px ${E.fonts.body}`; const tw = x.measureText(t).width; if (tw > W * .86){ s1 *= W * .86 / tw; x.font = `${s1}px ${E.fonts.body}`; }
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = E.maybe(.5) ? '#f4e27a' : '#f5f2ea'; x.strokeStyle = 'rgba(0,0,0,.8)'; x.lineWidth = s1 * .09; x.lineJoin = 'round'; const y = top + hh + (H - top - hh) * .46; x.strokeText(t, W / 2, y); x.fillText(t, W / 2, y);
    });
    bFree(src);
  },
};
// 竖棱：每一条把背后的画面压窄一点、错开一点，再各有一道明暗
function bReed(x, src, X, Y, W, H, p, E){
  for (let i = 0; i < W; i += p){
    const w = Math.min(p, W - i), take = p * 2.3, sx = X + i + w / 2 - take / 2;
    const a = Math.max(0, sx), b = Math.min(src.width, sx + take); if (b - a > 1) x.drawImage(src, a, Y, b - a, H, X + i, Y, w + .6, H);
    const g = x.createLinearGradient(X + i, 0, X + i + p, 0); g.addColorStop(0, 'rgba(0,0,0,.2)'); g.addColorStop(.18, 'rgba(255,255,255,.2)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(.9, 'rgba(0,0,0,.05)'); g.addColorStop(1, 'rgba(0,0,0,.22)');
    x.fillStyle = g; x.fillRect(X + i, Y, w + .6, H);
  }
}
const B_POST_ORDER = ['oil', 'matte', 'swirl', 'gauss', 'defocus', 'reeded', 'multiply', 'soft', 'halation', 'bokeh', 'pearl', 'spark', 'retro', 'film', 'vhs', 'lowq', 'pixel', 'negate', 'subtitle'];
const B_POST_W = { oil: 2, matte: 3, swirl: 2, gauss: 3, defocus: 1, reeded: 3, multiply: 3, soft: 3, halation: 3, bokeh: 3, pearl: 3, spark: 2, retro: 3, film: 4, vhs: 2, lowq: 1, pixel: 1, negate: 1, subtitle: 2 };

// ── 一片一片的：毛玻璃、长虹玻璃、马赛克、模糊、水珠 ────────────────
// 它们看的是「已经画到这一步的画面」，所以必须垫在字上面；能拖、能放大、能转。
function bSnapshot(x){ const c = bCanvas(x.canvas.width, x.canvas.height); c.getContext('2d').drawImage(x.canvas, 0, 0); return c; }
function bPaneClip(x, it, E, fn, round){
  // 进来时坐标系已经在它的中心转好了；取景用的是没转的整张画面
  const src = bSnapshot(x), w = it.r * 2, h = it.q ? it.r * 2 * it.q : (it.t || 300) * E.u, m = x.getTransform();
  x.save(); x.beginPath();
  if (round === 'circle') x.arc(0, 0, it.r, 0, 6.2832);
  else { const k = Math.min(round || 0, w / 2, h / 2); x.moveTo(-w / 2 + k, -h / 2); x.arcTo(w / 2, -h / 2, w / 2, h / 2, k); x.arcTo(w / 2, h / 2, -w / 2, h / 2, k); x.arcTo(-w / 2, h / 2, -w / 2, -h / 2, k); x.arcTo(-w / 2, -h / 2, w / 2, -h / 2, k); x.closePath(); }
  x.clip(); x.setTransform(1, 0, 0, 1, 0, 0); fn(src, m, w, h); x.restore(); bFree(src);
}
Object.assign(BLIND_ITEMS, {
  frost(x, it, E, c){
    bPaneClip(x, it, E, src => { const b = bBlur(src, bPx(34 * E.u)); x.globalAlpha = 1; x.drawImage(b, 0, 0); bFree(b); x.globalAlpha = 1; x.fillStyle = E.dark ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.3)'; x.fillRect(0, 0, x.canvas.width, x.canvas.height); x.globalCompositeOperation = 'soft-light'; x.globalAlpha = .4; x.fillStyle = bNoisePat(x); x.fillRect(0, 0, x.canvas.width, x.canvas.height); }, 26 * E.u);
    const w = it.r * 2, h = it.q ? it.r * 2 * it.q : (it.t || 300) * E.u, k = 26 * E.u; x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1.4 * E.u; x.beginPath(); x.moveTo(-w / 2 + k, -h / 2); x.arcTo(w / 2, -h / 2, w / 2, h / 2, k); x.arcTo(w / 2, h / 2, -w / 2, h / 2, k); x.arcTo(-w / 2, h / 2, -w / 2, -h / 2, k); x.arcTo(-w / 2, -h / 2, w / 2, -h / 2, k); x.closePath(); x.stroke();
  },
  reed(x, it, E){ bPaneClip(x, it, E, src => bReed(x, src, 0, 0, src.width, src.height, 38 * E.u * DPR / 2 * 1.6, E)); },
  mosaic(x, it, E){
    bPaneClip(x, it, E, src => { const s = 1 / (E.R(13, 22) * E.u * DPR), c = PLATFORM.canvas(Math.max(2, Math.round(src.width * s)), Math.max(2, Math.round(src.height * s))), y = c.getContext('2d'); y.imageSmoothingQuality = 'high'; y.drawImage(src, 0, 0, c.width, c.height); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, src.width, src.height); });
  },
  blurp(x, it, E){
    const src = bSnapshot(x), b = bBlur(src, bPx(34 * E.u)), y = b.getContext('2d'), m = x.getTransform();
    y.globalCompositeOperation = 'destination-in'; y.setTransform(m); const g = y.createRadialGradient(0, 0, it.r * .45, 0, 0, it.r); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); y.fillStyle = g; y.beginPath(); y.arc(0, 0, it.r * 4, 0, 6.2832); y.fill(); y.setTransform(1, 0, 0, 1, 0, 0); y.globalCompositeOperation = 'source-over';
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(b, 0, 0); x.restore(); bFree(src); bFree(b);
  },
  // 水珠：底下的字被它放大
  lens(x, it, E, c){
    bPaneClip(x, it, E, (src, m) => { const cx = m.e, cy = m.f, n = 14; for (let i = 0; i < n; i++){ const r = it.r * DPR * (1 - i / n), k = 1.12 + .5 * (i / n); x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.clip(); x.setTransform(k, 0, 0, k, cx * (1 - k), cy * (1 - k)); x.drawImage(src, 0, 0); x.restore(); } }, 'circle');
    const g = x.createRadialGradient(-it.r * .2, -it.r * .25, it.r * .2, 0, 0, it.r); g.addColorStop(0, 'rgba(255,255,255,.1)'); g.addColorStop(.78, 'rgba(255,255,255,0)'); g.addColorStop(.95, 'rgba(0,0,0,.18)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, it.r, 0, 6.2832); x.fill();
    x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.ellipse(-it.r * .4, -it.r * .5, it.r * .2, it.r * .09, -.7, 0, 6.2832); x.fill(); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = it.r * .035; x.beginPath(); x.arc(0, 0, it.r * .84, .5, 1.6); x.stroke();
  },
});
B_SHAPES.pane = ['frost', 'reed', 'mosaic', 'blurp', 'lens'];
const B_PANES = B_SHAPES.pane;

