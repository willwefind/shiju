// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ⑤ 气氛：底、光、字的质地、修图，一套一套地配
// ════════════════════════════════════════════════════════════════════
// 方案（recipes/quiet/image/more）只管字怎么站；这里管它站在什么样的空气里。
// 🔒 2026-11-24 定的：收走的只是代码画的花、雪花、水滴、眼睛和线条（归「自己添」）。
//    弥散、模糊、光、遮盖、质感、修图，一样都不许收。上一版把底全改成平涂，一下子就刻板了。
// 一套气氛：
//   tone ＝ 只配亮底 / 暗底（不写＝都行）；chroma ＝ 底要有点颜色；
//   grounds ＝ 底的画法，掷一种；hero ＝ 大字能上的几套效果，掷一套（可以是空的）；
//   post ＝ 修图的几套；pane ＝ 可能垫一片玻璃（局部模糊）；q ＝ 低声的方案在这里吃香几倍；
//   min ＝ 正文最小字号（整张要过油画、旋焦之类的，字小了就糊成一团）；
//   grain ＝ 颗粒；ghost ＝ 垫底的淡字糊多少。
const BLIND_LOOKS = [
  // 最初：第一版的样子。看得见纤维的纸，边上淡淡一两团颜色，字上一两道老手艺，不修图
  { id: 'first', w: 46, grounds: ['orbs', 'orbs', 'orbs', 'beam', 'flat'], fiber: 1, warm: 4, q: .7, hero: [['split', 'focus'], ['scan'], ['scan', 'focus'], ['misreg'], ['misreg'], ['dots'], ['dots'], ['sand'], ['sand'], ['ripple'], ['trail'], ['wear'], ['wear'], ['focus'], ['wash'], ['slice'], ['echo', 'focus'], ['burst'], ['scan', 'trail'], ['stitch'], ['haze'], [], [], []], post: [[], [], [], [], [], ['oil'], ['soft'], ['multiply'], ['swirl'], ['defocus']], ghost: 0, under: .22 },
  { id: 'mist', w: 8, tone: 'light', grounds: ['aura', 'aura', 'centre', 'horizon'], hero: [['melt'], ['haze'], ['focus'], ['wash'], []], post: [[], ['soft'], ['soft'], ['matte']], q: 1.6, ghost: 10 },
  { id: 'afterglow', w: 8, tone: 'light', grounds: ['beam', 'beam', 'corner', 'duo'], hero: [['echo', 'focus'], ['melt'], ['wash', 'melt'], ['trail'], ['wash']], post: [['multiply'], ['multiply'], ['soft'], ['halation'], []], ghost: 6 },
  { id: 'watercolor', w: 7, tone: 'light', grounds: ['wash', 'wash', 'aura', 'rice'], hero: [['wash'], ['ink'], [], []], post: [['oil'], ['oil'], ['oil', 'soft']], min: 30, q: 1.2 },
  { id: 'swirl', w: 7, grounds: ['aura', 'duo', 'horizon'], hero: [[], ['haze'], ['wash'], ['melt']], post: [['swirl'], ['swirl'], ['swirl', 'soft']], min: 28 },
  { id: 'over', w: 8, tone: 'light', grounds: ['centre', 'beam', 'aura', 'flat'], hero: [['burst'], ['burst'], ['haze'], ['trail']], post: [['defocus'], ['soft'], ['halation'], ['bokeh'], []], min: 26, tint: 1 },
  { id: 'night', w: 8, tone: 'dark', grounds: ['aura', 'horizon', 'corner'], hero: [['focus'], ['haze'], ['glow'], ['melt'], ['wash']], post: [['gauss'], ['bokeh'], ['soft'], ['spark'], []], min: 24, ghost: 8 },
  { id: 'lamp', w: 6, tone: 'dark', grounds: ['centre', 'corner', 'beam'], hero: [['focus'], ['glow'], ['wash'], ['echo', 'focus']], post: [['halation'], ['soft'], ['film'], []], q: 1.3, ghost: 8 },
  { id: 'darkroom', w: 5, tone: 'dark', grounds: ['corner', 'centre'], hero: [['melt'], ['glow'], ['focus'], ['drift']], post: [['halation'], ['gauss'], ['halation', 'film'], []], q: 1.3 },
  { id: 'neon', w: 5, tone: 'dark', grounds: ['aura', 'duo', 'corner'], hero: [['glow'], ['misreg', 'glow'], ['trail', 'glow'], ['burst', 'glow'], ['melt']], post: [['halation'], ['soft'], ['reeded'], []], loud: 1.4, grain: 1.6 },
  { id: 'dive', w: 5, chroma: .02, grounds: ['sunk', 'sunk', 'horizon'], hero: [['ripple'], ['melt'], ['wash', 'ripple'], ['focus']], post: [['soft'], ['gauss'], ['swirl'], []], min: 24, ghost: 12 },
  { id: 'paper', w: 7, tone: 'light', grounds: ['rice'], hero: [['ink'], ['wear'], ['wear'], ['drift'], []], post: [[], [], ['film'], ['soft']], q: 1.8, ghost: 0 },
  { id: 'press', w: 5, tone: 'light', grounds: ['rice', 'rice', 'flat'], hero: [['misreg'], ['dots'], ['misreg', 'wear'], ['scan'], ['wear'], ['misreg', 'dots']], post: [[], [], [], ['film'], ['retro'], ['lowq']], loud: 1.4 },
  { id: 'film', w: 5, grounds: ['aura', 'beam', 'corner'], hero: [['trail'], ['focus'], ['echo'], []], post: [['film'], ['film'], ['film', 'halation'], ['film', 'gauss']], min: 24 },
  { id: 'long', w: 6, grounds: ['horizon', 'duo', 'aura'], hero: [['trail'], ['smear'], ['burst'], ['trail', 'focus'], ['slit']], post: [['soft'], ['defocus'], ['halation'], []], loud: 1.3, min: 24 },
  { id: 'vanish', w: 8, grounds: ['aura', 'rice', 'horizon', 'centre'], hero: [['drift'], ['drift'], ['sand'], ['scatter'], ['motes'], ['dither'], ['dots']], post: [[], [], ['soft'], ['matte']] },
  { id: 'glass', w: 7, grounds: ['aura', 'aura', 'duo'], hero: [[], ['wash'], ['melt']], post: [['reeded'], [], [], []], pane: ['frost', 'reed', 'blurp', 'blurp', 'mosaic'], paneP: 1, min: 26 },
  { id: 'sandblast', w: 5, grounds: ['aura', 'duo', 'beam', 'corner'], hero: [['wash'], ['melt'], ['haze'], []], post: [['matte'], ['matte'], ['matte', 'halation']], min: 28, grain: 1.8 },
  { id: 'gradient', w: 7, grounds: ['duo', 'duo', 'aura', 'sunk'], hero: [['wash'], ['veil'], ['cuts'], ['melt'], []], post: [[], [], ['soft'], ['multiply']], grain: 1.9, loud: 1.2 },
  { id: 'pearl', w: 4, tone: 'light', grounds: ['aura', 'duo', 'centre'], hero: [['wash'], ['smear'], ['haze'], ['melt'], []], post: [['pearl'], ['pearl'], ['pearl', 'soft']] },
  { id: 'cover', w: 6, grounds: ['beam', 'rice', 'aura', 'flat', 'duo'], hero: [['veil'], ['blinds'], ['bars'], ['disc'], ['torn'], ['brush'], ['slice'], ['split'], ['stitch'], ['cuts']], post: [[], [], ['soft'], ['film']], loud: 1.6 },
  { id: 'signal', w: 3, grounds: ['flat', 'duo', 'corner'], hero: [['slice'], ['scan'], ['misreg'], ['smear'], []], post: [['vhs'], ['vhs'], ['lowq'], ['pixel']], loud: 1.5, min: 30 },
  { id: 'negative', w: 3, grounds: ['aura', 'beam', 'duo'], hero: [['melt'], ['haze'], ['burst'], []], post: [['negate'], ['negate', 'halation'], ['negate', 'soft']] },
  { id: 'subtitle', w: 2, grounds: ['aura', 'horizon', 'beam', 'corner'], hero: [['focus'], ['trail'], []], post: [['subtitle'], ['film', 'subtitle'], ['soft', 'subtitle']] },
  { id: 'flat', w: 6, grounds: ['flat'], hero: 'own', post: [[]], q: .5, loud: 1.8, fiber: .3 },
];

// 🔑 字体、颜色、效果、布局是一起设计的，不许各掷各的。单独拎一款字配一个效果，看着就像电商海报。
//    每种气氛只配得上这几类字；方案要的字这里没有，这个方案在这种空气里就少来。
const B_ART = {
  first: ['oldSerif', 'serif', 'heavySerif'], mist: ['lightSerif', 'serif', 'lightSans'], afterglow: ['serif', 'lightSerif', 'heavySerif'], watercolor: ['oldSerif', 'serif', 'lightSerif'],
  swirl: ['serif', 'heavySerif', 'lightSerif'], over: ['heavySerif', 'serif', 'oldSerif'], night: ['lightSerif', 'serif', 'lightSans'], lamp: ['serif', 'lightSerif', 'oldSerif'], darkroom: ['lightSerif', 'serif', 'oldSerif'],
  neon: ['lightSans', 'lightSerif', 'sans'], dive: ['lightSerif', 'serif'], paper: ['oldSerif', 'serif', 'lightSerif'], press: ['oldSerif', 'heavySerif', 'heavySans'], film: ['serif', 'lightSerif', 'sans', 'oldSerif'],
  long: ['heavySerif', 'heavySans', 'serif'], vanish: ['heavySerif', 'serif', 'oldSerif', 'lightSerif'], glass: ['serif', 'sans', 'lightSerif', 'heavySans'], sandblast: ['serif', 'heavySans', 'oldSerif'], gradient: ['heavySans', 'lightSans', 'sans', 'heavySerif'],
  pearl: ['lightSerif', 'lightSans', 'serif'], cover: ['heavySans', 'heavySerif', 'oldSerif'], signal: ['sans', 'heavySans'], negative: ['lightSerif', 'serif', 'heavySerif'], subtitle: ['serif', 'lightSerif'], flat: ['heavySans', 'sans', 'oldSerif', 'heavySerif'],
};
const bFaces = (c, look) => { const art = B_ART[look.id] || [], f = (c.face || ['heavySans']).filter(k => art.includes(k)); return f.length ? f : null; };
// 长文只过得起这几道修图：别的要么糊字，要么抢话
const B_LONG_POST = ['soft', 'matte', 'film', 'multiply', 'pearl', 'retro', 'negate'];
const B_LONG_FX = ['melt', 'focus', 'wash', 'ink', 'wear', 'drift', 'misreg', 'dots', 'haze', 'sand'];

// hex → OKLCH
function bLch(hex){
  const [r, g, b] = hex2rgb(hex).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  const L = .2104542553 * l + .793617785 * m - .0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, B = .0259040371 * l + .7827717662 * m - .808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180 / Math.PI + 360) % 360];
}
const bLookOk = (k, pal) => { const dark = pal.m === 'night', [, c, h] = bLch(pal.g); return !(k.id === 'negative' && c > .012 && bHueIn(h, 18, 165)) && !(k.tone === 'light' && dark) && !(k.tone === 'dark' && !dark) && !(k.chroma && c < k.chroma); };
// 给每套气氛发一个号，取合得上这套颜色的头一个 —— 换颜色的时候，气氛尽量不跟着跳
function bLook(pal, rnd, id){
  const roll = BLIND_LOOKS.map(k => ({ k, v: Math.pow(rnd(), 1 / k.w) })).sort((a, b) => b.v - a.v);
  return (id && BLIND_LOOKS.find(k => k.id === id)) || (roll.find(r => bLookOk(r.k, pal)) || roll[0]).k;
}

// ── 底 ──────────────────────────────────────────────────────────────
// 底上任何一处，墨都得读得出来：一块颜色先往底色退，退到墨和点睛都还立得住为止
function bSafe(c, pal, min = 4.6){
  const i = hex2rgb(pal.i), a = hex2rgb(pal.a); let q = c;
  for (let t = 0; t < 1 && (contrast(i, hex2rgb(q)) < min || contrast(a, hex2rgb(q)) < 2); t += .06) q = bMix(c, pal.g, t);
  return q;
}
// ── 调色的规矩（有一张褐底泛橄榄的，脏得不能看，才立的）──
// 1. 黄、绿、橙压暗了就是泥：暗底只许蓝、紫、玫红、酒红、青；碰上就挪到最近的干净色相。
// 2. 隔得远的颜色硬化在一起，当中那一段必是灰泥：一张底只用一个家族。
// 3. 黄绿一类只准往亮里走，不准往暗里走。
const bHueGap = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180);
const bHueIn = (h, lo, hi) => { h = (h % 360 + 360) % 360; return h >= lo && h <= hi; };
const bDarkHue = h => !bHueIn(h, 15, 165) ? h : bHueIn(h, 15, 52) ? 9 : bHueIn(h, 52, 122) ? 264 : 176;
// 暗底上从一家挪开一点：挪进褐区了，就往另一边挪
const bDarkNear = (h, d) => bDarkHue(bHueIn(h + d, 15, 165) ? h - d : h + d);
const bIsMud = (L, C, h) => L < .68 && C > .02 && C < .125 && bHueIn(h, 28, 152);
// 这张底是哪一家的：底色有颜色就随它，没颜色就随点睛；暗的先洗干净
function bAnchor(pal){
  const [L, C, h] = bLch(pal.g), [, ca, ha] = bLch(pal.a), [, cb, hb] = bLch(pal.b), q = C >= .012 ? h : ca >= .05 ? ha : cb >= .05 ? hb : 262;
  return L < .34 ? bDarkHue(q) : q;
}
// 淡字用的颜色：点睛跟底隔得远的话（靛底上的琥珀），一淡就成了泥，换成底自己那一家的
const bKin = pal => { const [L] = bLch(pal.g), [, , ha] = bLch(pal.a), h = bAnchor(pal); return bHueGap(ha, h) < 50 ? pal.a : L < .5 ? bOklch(.74, .1, bDarkHue(h)) : bOklch(.5, .11, h); };
// 点睛、副色也不许是泥：橄榄、土褐的，换成同一张底上立得住的朱或靛
function bClean2(pal){
  const h = bAnchor(pal), dark = pal.m === 'night', gap = bHueGap(h, 24), swap = () => bToward(dark ? bOklch(.74, .13, gap > 40 ? 30 : 262) : gap > 40 ? bOklch(.54, .18, 28) : bOklch(.42, .13, 262), pal.g, 2.8);
  const bad = c => { const [L, C, q] = bLch(c); return L < .66 && C > .02 && C < .15 && bHueIn(q, 58, 138); }, q = { ...pal };
  if (bad(q.a)) q.a = bad(q.b) ? swap() : q.b; if (bad(q.b)) q.b = q.a === pal.b ? swap() : bMix(q.a, q.i, .45);
  return q;
}
// 几块能化在一起的颜色，都是一家人
function bGlowColors(E){
  const { R, pal } = E, [L, C] = bLch(pal.g), h = bAnchor(pal), side = E.maybe(.5) ? 1 : -1, yellow = bHueIn(h, 40, 152);
  const at = [h, h + side * R(14, 30), h + side * R(26, L > .8 ? 62 : 44)];
  return at.map(q => {
    if (L < .34) return bSafe(bOklch(R(.25, .36), R(.045, C < .012 ? .08 : .11), bDarkNear(h, q - h)), pal);
    if (L < .8) return bSafe(bOklch(Math.max(.16, Math.min(.96, L + (yellow ? R(.02, .12) : R(-.08, .12)))), Math.min(.2, C * R(.95, 1.2) + .015), L < .72 && !yellow && bHueIn(h + (q - h) * .55, 40, 152) ? h - (q - h) * .55 : h + (q - h) * .55), pal);
    return bSafe(bOklch(R(.84, .93), R(.04, .09), q), pal);
  });
}
function bRadial(x, cx, cy, r, stops){ const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); for (const [t, c] of stops) g.addColorStop(t, c); return g; }
// 一团化得很开的颜色：高斯那样的坡，看不见边
const B_SOFT = [[0, 1], [.18, .93], [.36, .74], [.54, .46], [.72, .2], [.88, .05], [1, 0]];
const bBlob = (x, c, cx, cy, r, k, sq = 1, rot = 0) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(1, sq); x.fillStyle = bRadial(x, 0, 0, r, B_SOFT.map(([t, a]) => [t, bAlpha(c, a * k)])); x.fillRect(-r, -r, r * 2, r * 2); x.restore(); };
// 一两团颜色停在纸边上，淡得像刚洇开
function bOrbs(x, E, k = 1){
  const { R, I, W, H, pal } = E, cs = bGlowColors(E), n = I(1, 3), m = Math.max(W, H);
  for (let i = 0; i < n; i++){ const edge = E.maybe(.7), side = E.maybe(.5), cx = edge ? (side ? R(-.08, .16) : R(.84, 1.08)) * W : W * R(.2, .8), cy = H * R(.05, .98); bBlob(x, cs[i], cx, cy, m * R(.2, .44), R(.6, .95) * k, R(.75, 1.2), R(0, 3)); }
}
// 纸的纤维；暗的底只压一点四角（试过云斑，像黑板）
function bFiber(x, E){
  const { W, H, dark, idx } = E, L = relLum(hex2rgb(E.pal.g)); x.save();
  if (L > .3){ x.globalCompositeOperation = 'multiply'; x.globalAlpha = .88; x.drawImage(makePaper('rice', W, H, idx || 0), 0, 0); }
  else {
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; const g = x.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${dark ? .26 : .16})`); x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  x.restore();
}
const BLIND_GROUND = {
  orbs(x, E){ bOrbs(x, E); },
  flat(){},
  // 弥散：三五团颜色化在一起
  aura(x, E){
    const { R, I, W, H } = E, cs = bGlowColors(E), n = I(3, 5), m = Math.max(W, H), a0 = R(0, 6.28);
    for (let i = 0; i < n; i++){ const a = a0 + i / n * 6.28 + R(-.5, .5), d = R(.24, .56); bBlob(x, cs[i % cs.length], W / 2 + Math.cos(a) * W * d, H / 2 + Math.sin(a) * H * d, m * R(.42, .72), R(.75, 1), R(.6, 1.3), R(0, 3.14)); }
  },
  // 地平：天和水之间一道光
  horizon(x, E){
    const { R, W, H } = E, cs = bGlowColors(E), y = H * R(.3, .74), g = x.createLinearGradient(0, 0, 0, H), p = y / H;
    g.addColorStop(0, cs[0]); g.addColorStop(Math.max(.02, p - .3), bMix(cs[0], E.pal.g, .55)); g.addColorStop(p, E.pal.g); g.addColorStop(Math.min(.98, p + .22), bMix(cs[1], E.pal.g, .5)); g.addColorStop(1, cs[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H); bBlob(x, cs[2], W * R(.1, .9), y, W * R(.5, .85), .8, R(.16, .34));
  },
  // 余光：一道斜斜的亮，从一头照进来
  beam(x, E){
    const { R, W, H, pal, dark } = E, cs = bGlowColors(E), a = R(.35, 1.2) * (E.maybe(.5) ? 1 : -1), L = Math.hypot(W, H) / 2, p = R(.34, .66), lo = bSafe(bMix(pal.g, cs[0], .9), pal), hi = dark ? bSafe(bMix(cs[1], pal.i, .1), pal) : bSafe(bMix(pal.g, '#ffffff', .7), pal);
    const g = x.createLinearGradient(W / 2 - Math.sin(a) * L, H / 2 - Math.cos(a) * L, W / 2 + Math.sin(a) * L, H / 2 + Math.cos(a) * L);
    g.addColorStop(0, bSafe(bMix(pal.g, cs[1], .8), pal)); g.addColorStop(p - .2, pal.g); g.addColorStop(p - .012, hi); g.addColorStop(p + .02, bMix(hi, pal.g, .55)); g.addColorStop(Math.min(.95, p + .26), bMix(pal.g, lo, .5)); g.addColorStop(1, lo);
    x.fillStyle = g; x.fillRect(0, 0, W, H); bBlob(x, cs[0], W * R(0, 1), H * R(.8, 1.05), W * R(.6, 1), .7);
  },
  // 一角有光
  corner(x, E){
    const { R, P, W, H, pal, dark } = E, cs = bGlowColors(E), [cx, cy] = P([[0, 0], [1, 0], [0, 1], [1, 1]]), m = Math.hypot(W, H);
    bBlob(x, cs[0], W * cx, H * cy, m * R(.62, .95), 1); bBlob(x, cs[1], W * (1 - cx) + W * R(-.1, .1), H * (1 - cy), m * R(.4, .6), dark ? .55 : .7);
    if (dark) bBlob(x, bMix(pal.g, '#000000', .6), W * (1 - cx), H * R(.3, .7), m * .5, .6);
  },
  // 当中一团柔光，四周沉下去
  centre(x, E){
    const { R, W, H, pal, dark } = E, cs = bGlowColors(E), cx = W * R(.3, .7), cy = H * R(.3, .68), m = Math.max(W, H);
    const edge = dark ? bMix(pal.g, '#000000', .45) : bSafe(cs[0], pal); x.fillStyle = edge; x.fillRect(0, 0, W, H);
    bBlob(x, pal.g, cx, cy, m * R(.75, .95), 1); bBlob(x, dark ? cs[0] : bSafe(bMix(pal.g, '#ffffff', .75), pal), cx, cy, m * R(.36, .56), .95, R(.8, 1.2)); bBlob(x, cs[2], cx + W * R(-.3, .3), cy + H * R(-.3, .3), m * .4, .5);
  },
  // 往下沉：一头浅，一头深
  sunk(x, E){
    const { R, W, H, pal, dark } = E, [L, C, h] = bLch(pal.g), up = E.maybe(.25), a = bSafe(bOklch(Math.min(.97, L + (dark ? .16 : .06)), Math.min(.17, C * 1.1 + .03), h + R(-30, 30)), pal), b = bSafe(bOklch(Math.max(.1, L - (bHueIn(h, 40, 152) && !dark ? .03 : dark ? .06 : .13)), Math.min(.18, C * 1.15 + .02), h + R(-24, 24)), pal), g = x.createLinearGradient(0, up ? H : 0, W * R(-.2, .2), up ? 0 : H);
    g.addColorStop(0, a); g.addColorStop(R(.4, .6), pal.g); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, W, H);
    bBlob(x, bGlowColors(E)[0], W * R(0, 1), H * R(.1, .5), W * R(.5, .8), .55, .6, R(0, 3));
  },
  // 双色：两块颜色顺顺地走过去
  duo(x, E){
    const { R, W, H, pal } = E, cs = bGlowColors(E), a = R(0, 6.28), L = Math.hypot(W, H) / 2, g = x.createLinearGradient(W / 2 - Math.cos(a) * L, H / 2 - Math.sin(a) * L, W / 2 + Math.cos(a) * L, H / 2 + Math.sin(a) * L);
    g.addColorStop(0, cs[0]); g.addColorStop(R(.36, .64), E.maybe(.5) ? pal.g : bMix(cs[0], cs[1], .5)); g.addColorStop(1, cs[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    if (E.maybe(.6)) bBlob(x, cs[2], W * R(.1, .9), H * R(.1, .9), W * R(.45, .8), .8, R(.6, 1.2), R(0, 3));
  },
  // 宣纸
  rice(x, E){
    const { W, H, dark, R } = E, cs = bGlowColors(E);
    if (E.maybe(.6)) bBlob(x, cs[2], W * R(0, 1), H * R(0, 1), W * R(.6, 1), .45, R(.6, 1.2));
    x.globalCompositeOperation = dark ? 'soft-light' : 'multiply'; x.globalAlpha = dark ? .5 : .85; x.drawImage(makePaper('rice', W, H, E.idx || 0), 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  },
  // 水彩：颜色在湿纸上自己走开，边上积一圈
  wash(x, E){
    const { R, I, W, H, rnd } = E, cs = bGlowColors(E);
    for (let i = 0, n = I(4, 6); i < n; i++){
      const cx = W * R(-.05, 1.05), cy = H * R(-.05, 1.05), r = W * R(.26, .6), c = cs[i % cs.length], q = Array.from({ length: 26 }, () => r * (1 + (rnd() - .5) * .5));
      const at = (j, k) => [cx + Math.cos(j / 26 * 6.2832) * q[j % 26] * k, cy + Math.sin(j / 26 * 6.2832) * q[j % 26] * k];
      for (const [k, al] of [[1, .22], [.93, .2], [.84, .2]]){
        x.beginPath();
        for (let j = 0; j < 26; j++){ const a = at(j, k), b = at(j + 1, k), d = at(j + 2, k); if (!j) x.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); x.quadraticCurveTo(b[0], b[1], (b[0] + d[0]) / 2, (b[1] + d[1]) / 2); }
        x.closePath(); x.fillStyle = bAlpha(c, al); x.fill();
      }
      x.strokeStyle = bAlpha(c, .25); x.lineWidth = 2; x.stroke();
    }
    x.globalCompositeOperation = 'soft-light'; for (const [cell, a] of [[90, .22], [26, .16], [8, .1]]){ x.globalAlpha = a; x.imageSmoothingEnabled = true; x.drawImage(blobLayer(W, H, cell, rnd), 0, 0, W, H); } x.globalAlpha = 1;
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = .7; x.drawImage(makePaper('rice', W, H, E.idx || 0), 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  },
};
// 墨跟着底走：粉底上是深红，蓝底上是夜蓝 —— 不总是黑
function bTintInk(pal, rnd, force){
  if (rnd() > .5 && !force) return pal;
  const [mid, C, h] = bLch(pal.g), dark = pal.m === 'night', hue = C > .02 ? h : bLch(pal.a)[2];
  if (!dark && mid < .55) return pal;
  const i = dark ? bOklch(.93, .03, hue + 8) : bOklch(mid > .8 ? .3 : .24, bHueIn(hue, 60, 160) ? .04 : .09, hue - 4);
  return contrast(hex2rgb(i), hex2rgb(pal.g)) >= 6.2 ? { ...pal, i } : pal;
}
