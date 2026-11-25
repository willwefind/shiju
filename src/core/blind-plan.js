// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ⑥ 掷签、验收、落墨
// ════════════════════════════════════════════════════════════════════
// st.blind = { seed, seeds?, comp?, look?, hero?, word?, own?, pal?, fx?, post?, items?, move? }
//   seed 总种子；seeds ＝ 单独重掷过的那几样；comp/look/hero/word ＝ 拆出来就钉住的方案、气氛和主角 ——
//   🔑 钉住是因为人会接着改：早先主角每次重算都重挑，选中几个字加个粗，整张就换了一张脸。
//   own ＝ 这一个盒子里，纸 / 字 / 墨哪几样用自己的；pal/fx/post/items/move ＝ 人自己定过的。
//   v ＝ 2：每个决定各有各的随机流（字数、题头日期一变，不会连累后头的决定）；老盒子没有 v，照老样子算。
//   keep ＝「存为常用」时记下的：第几把试成的（turn）、版心和题头怎么摆（room）、哪一套字（face）。
//   amt ＝ 效果 / 修图的浓度（0–1，不写就是 1）。
// planBlind 只算「谁在哪」，不画一笔（量具用桩就能跑，测试靠它）；画都在 renderBlind。
const B_FX_ORDER = ['misreg', 'wash', 'echo', 'ink', 'drift', 'dots', 'dither', 'scan', 'wear', 'sand', 'motes', 'scatter', 'smear', 'slit', 'cuts', 'slice', 'split', 'stitch', 'ripple', 'veil', 'blinds', 'trail', 'burst', 'haze', 'glow', 'melt', 'focus', 'bars', 'disc', 'torn', 'brush', 'petals', 'snow'];
// 面板上：常用的几样露在外头，其余收在「更多」里。掷的时候一样都不用后者
const B_FX_MAIN = ['melt', 'ink', 'drift', 'focus', 'cuts', 'split', 'misreg', 'dither', 'dots', 'slit', 'smear', 'veil', 'blinds', 'disc', 'bars', 'trail', 'sand', 'scatter'];
const B_FX_BODY = ['melt', 'ink', 'drift', 'focus', 'misreg', 'wash', 'wear', 'haze', 'glow', 'bars', 'disc', 'torn', 'brush', 'petals', 'snow'];
const B_POST_MAIN = ['reeded', 'matte', 'gauss', 'soft', 'halation', 'film', 'multiply', 'negate', 'defocus', 'swirl', 'subtitle'];
const blindSeed = () => (Math.random() * 0xffffffff) >>> 0;

function blindContent(text, hero){
  const units = bUnits(text), core = units.filter(u => !u.punct), clauses = bClauses(text);
  const cjk = core.filter(u => !u.latin).length >= core.length * .7;
  return { text, units, core, N: core.length, clauses, cjk, hero };
}

// 每一样东西各有各的种子，都从总种子派生：单换一样的时候，别的一动不动。
const B_PARTS = ['pal', 'hero', 'font', 'comp', 'fx', 'line', 'post', 'look'];      // 只能往后加：序号就是它派生种子的盐（line 已经不掷了，位置留着）
const blindSeeds = bl => Object.fromEntries(B_PARTS.map((k, i) => [k, bl.seeds && bl.seeds[k] !== undefined ? bl.seeds[k] >>> 0 : bSub(bl.seed >>> 0, i)]));

// 钉住的主角还在不在（人可能改了正文）。在，就认它在原文里的位置。
function blindPinned(pin, text, title){
  if (!pin) return null;
  const src = pin.title ? title : text, at = src.indexOf(pin.t);
  if (at < 0) return null;
  const units = bUnits(pin.t).filter(u => !u.punct).map(u => ({ ...u, at: u.at + at, ...(pin.title ? { src: 'title' } : {}) }));
  return units.length ? { t: pin.t, title: !!pin.title, units } : null;
}

// 收下的版式拿去排另一段字：方案、气氛、颜色、字体照旧，跟原来那段字绑在一起的几样放开
function blindFor(bl, text, title){
  if (!bl || !bl.hero || blindPinned(bl.hero, text, (title || '').trim())) return bl;
  const { hero, word, move, ...rest } = bl; return rest;
}

function planBlind(st, mk){
  const bl = st.blind, own = bl.own || {}, S = SIZES[st.orient] || SIZES.portrait, sd = blindSeeds(bl), r = k => bRng(sd[k]).rnd;
  const text = (st.text || '').trim() ? st.text : (st.title || ''), title = (st.title || '').trim();
  if (!bUnits(text).some(u => !u.punct)) return null;

  let pal = bPalette(st, r('pal'), own);
  if (bl.pal) pal = { ...bl.pal, m: relLum(hex2rgb(bl.pal.g)) < .3 ? 'night' : 'clear' };
  else if (bl.look && !own.paper && !own.ink){                       // 钉住了气氛：颜色换到合得上的为止
    const k = bLook(pal, () => .5, bl.look), rp = bRng(bSub(sd.pal, 1)).rnd; for (let q = 0; q < 24 && !bLookOk(k, pal); q++) pal = bPalette(st, rp, own);
  }
  const look = bLook(pal, r('look'), bl.look);
  if (!pal.paper && !own.ink && !bl.pal) pal = bTintInk(pal, bRng(bSub(sd.look, 3)).rnd, look.tint);
  const rr = r('hero'), words = bWords(text), word0 = words.length ? (q => bDense(q.t) ? { ...q, t: q.t } : words.find(w => bDense(w.t)) || q)(bWeighted(rr, words)) : null;
  const hero = blindPinned(bl.hero, text, title) || bHero({ ...st, text }, bClauses(text), rr);
  const word = bl.word && text.includes(bl.word) ? { t: bl.word } : word0;
  const fonts = bFonts(st, r('font'), text, (hero ? hero.t : '') + (word ? word.t : '') + text, own.font);

  const kf = bl.keep && bl.keep.face, face0 = kf && !fonts.own && (!kf.canon || (bReal(kf.canon) && bHasGlyphs(bReal(kf.canon), (hero ? hero.t : '') + (word ? word.t : '') + text))) ? kf : null;
  const go = (t, h, w, whole) => blindCompose(st, S, pal, fonts, mk, t, h, w, bl, whole, sd, look, face0);
  let got = go(text, hero, word, true), inner = null, innerSt = null;
  if (!got){
    // 太长了：第一张只放主角当封面，全文按平常的排法跟在后面，同一张底同一套色
    got = go(hero ? hero.t : text.slice(0, 8), hero, word, false)
       || go(bUnits(text).filter(u => !u.punct).slice(0, 4).map(u => u.t).join(''), null, null, false);
    if (!got) return null;
    innerSt = { ...st, blind: null, title: '', pages: 'auto', showHeader: false, ink: pal.i, inkLight: 0, weight: 0, metaInk: bMix(pal.g, pal.i, .72),
                quoteInk: 'same', fontSize: 38, offsetX: 0, offsetY: 0, stack: got.B.fonts.body, vertical: got.B.cjk && r('font')() < .3, titleSpans: [] };
    inner = planPages(innerSt, mk);
    inner.ground = (ctx, i) => blindGround(ctx, inner.W, inner.H, pal, st, i + 1, look, sd);
  }
  const B = got.B;
  return { S, W: S.w, H: S.h, COL: S.w - S.pad * 2, stack: B.fonts.body, box: S.h, pages: [[]].concat(inner ? inner.pages : []),
           title: titleBlock({ ...st, title: '', titleSpans: [] }, 100, 100, mk), ch: { head: 0, title: 0, src: 0, foot: 0 },
           blind: { ...got, seed: bl.seed >>> 0, sd, pal, look, fonts: B.fonts, inner, innerSt,
                    pin: { comp: got.comp, look: look.id, hero: hero ? { t: hero.t, title: !!hero.title } : undefined, word: word ? word.t : undefined },
                    name: { comp: got.comp, look: look.id, fx: got.fxNames, post: B.post, scene: [...new Set(B.items.map(i => i.id))] } } };
}

function blindCompose(st, S, pal, fonts, mk, text, hero, word, bl, whole, sd, look, face0){
  const v2 = bl.v >= 2, info = blindContent(text, hero), draw = bRng(sd.comp).rnd, soft = bIsQuiet(pal);
  // 空气安静，方案也安静：底和说话的嗓门要是一回事
  const NL = info.N, long = NL >= 130, fit = c => (bFaces(c, look) ? 1 : .12) * (c.long ? (NL >= 150 ? 9 : NL >= 100 ? 2.4 : .7) : NL >= 150 ? (c.dup ? .12 : .45) : NL >= 100 && c.dup ? .6 : 1);
  const pool = BLIND_COMPS.map((c, i) => ({ c, i, w: fit(c) * c.w * (c.q ? (soft ? 1.3 : .8) * (look.q || 1) : c.warm ? look.warm || 1 : B_LOUD[c.id] ? (soft ? .5 : 1) * (look.loud || .8) : 1) }));
  let want = bl.comp ? pool.find(q => q.c.id === bl.comp) : null;                    // 钉住的先试，排不进去再掷
  while (pool.length){
    const it = want || bWeighted(draw, pool), tries = want ? 10 : 3; want = null; pool.splice(pool.indexOf(it), 1);
    const c = it.c;
    // 存下来的版式：先照上回试成的那一把、上回的版心来；放不下（字多了、题头压住了）才另想办法
    const kp = bl.keep && bl.comp === c.id ? bl.keep : null, plans = Array.from({ length: tries }, (_, k) => [k, null]);
    if (kp) plans.unshift([kp.turn | 0, kp.room || null], [kp.turn | 0, null]);
    for (const [k, room0] of plans){
      // 每种方案自己一条随机流：钉住它以后，前面掷过谁都不影响它长什么样
      const rnd = bRng(bSub(sd.comp, 100 + it.i * 11 + k)).rnd, own = j => v2 ? bRng(bSub(sd.comp, 9000 + it.i * 11 + k + j * 4096)).rnd : rnd;
      let face = fonts;
      if (!fonts.own){ const cls = bFaces(c, look) || c.face || ['heavySans']; face = kp && face0 ? face0 : fonts.pair(cls[Math.floor(bRng(bSub(sd.font, 60 + it.i)).rnd() * cls.length)]); }
      const B = blindStage(st, S, rnd, pal, face, mk, c.long ? .08 : c.warm ? .074 : .056);
      Object.assign(B, info, { word, B0: null, look, kin: bKin(pal), inkAccent: bInkAccent(pal), softHero: !/^heavy/.test(face.cls || '') && !/Black|Heavy|900|DuanHei/.test(face.hero + face.heroW), paras: bParas(text, info.cjk), warm: !!c.warm, minBody: bl.post ? 0 : look.min || 0 });
      B.titleUsed = !!(hero && hero.title);
      if (v2) B.verseRnd = own(5);
      B.solo = B.N <= 12 && (!whole || B.N <= 8 || own(1)() < .6);
      B.D = B.solo ? 40 : B.N;
      if (B.solo) B.hero = { t: B.core.map((u, i) => (i && u.sp ? ' ' : '') + u.t).join(''), units: B.core };
      B.keyClause = B.clauses.find(q => hero && q.t === hero.t) || (B.clauses.length ? bWeighted(own(2), B.clauses.map(q => ({ q, w: q.n >= 2 && q.n <= 8 ? 3 : 1 }))).q : null);
      const home = hero && !hero.title ? B.paras.find(p => hero.units[0].at >= p.at && hero.units[0].at < p.at + p.t.length) : null;
      B.keyPara = home || (B.paras.length ? bWeighted(own(3), B.paras.map(p => ({ p, w: (p.quote ? 4 : 1) * (p.ask ? 2 : 1) * (p.i === B.paras.length - 1 ? 2 : 1) * (p.n > 60 ? .2 : 1) }))).p : null);
      const keys = new Set(B.keyClause ? B.keyClause.units.map(u => u.at) : []);
      if (B.keyClause && B.keyClause.n > B.N * .6) keys.clear();
      B.isKey = u => keys.has(u.at);
      const mode = room0 ? room0.mode : bP(own(4), c.modes || (c.warm ? ['left', 'right', 'center', 'left', 'side', 'corners', 'corners'] : ['corners', 'corners', 'corners', 'top', 'foot', 'side'])), room = B.metaRoom(mode);
      B.A = room0 && room0.W === B.W ? { ...room0.A } : { x: B.M, y: room.t, w: B.W - B.M * 2, h: B.H - room.t - room.b };
      // 字幕：上下要裁掉两条黑边，字先让开
      if (!(room0 && room0.W === B.W) && (bl.post ? bl.post.includes('subtitle') : look.id === 'subtitle')){ const cut = B.H * .115; B.A.y = Math.max(B.A.y, cut); B.A.h = B.H - B.A.y - Math.max(cut, room.b); }
      const A0 = { ...B.A };
      if (!c.ok(B)) break;
      if (!c.run(B)) continue;
      bRestrain(B);
      B.placeMeta(mode);
      // 老宋的笔画粗细不一：同一款字，有时候把它印重一点
      if (c.warm){ const fw = B.P([0, 0, 1, 1, 2]); if (fw && /Huiwen|KingHwa|Chill|Nanxi/.test(B.fonts.canon || B.fonts.hero)) for (const l of B.layers) if (l.role === 'hero' && !l.body) for (const o of l.ops) if (o.k === 'g' && !o.cell && o.f === 'hero') o.fw = fw; }
      // 大字压到小字的地方，小字反色再印一遍（只印在大字里头）
      B.layers.forEach((l, i) => { if (l.twin){ l.of = i - 1; l.tc = (l.ops[0] || {}).c; } });
      if (B.maskOps){ const i = B.layers.findIndex(l => l.role === 'meta'); if (i >= 0) B.layers.push({ role: 'meta', ops: [], fx: [], twin: true, of: i, tc: B.maskC, mask: { mode: 'in', ops: B.maskOps } }); }
      for (const l of B.layers){ l.rect = blindRect(B, l); l.avg = blindAvg(l); }
      if (!blindFits(B)) continue;
      if (whole && !blindKeepsAll(B)) continue;
      blindUnder(B, bRng(bSub(sd.comp, 77 + it.i)), c, v2);
      blindMoves(B, bl.move);
      blindStyle(B, st);
      for (const l of B.layers) if (l.twin) { l.ops = B.layers[l.of].ops.map(o => ({ ...o, c: o.styled ? o.c : l.tc, rich: undefined })); l.rect = B.layers[l.of].rect; l.avg = B.layers[l.of].avg; }
      const main = B.layers.filter(l => l.role === 'hero' && !l.body && !l.twin)[0] || B.layers.find(l => l.role === 'hero') || B.layers.find(l => l.role === 'body');
      B.heroRect = main ? main.rect : null;
      const boxes = B.layers.filter(l => ['body', 'meta'].includes(l.role) || l.body).flatMap(l => l.ops.map(op => blindOpRect(B, op))).filter(Boolean);
      B.hit = (px, py, rr) => boxes.some(q => px > q.x - rr && px < q.x + q.w + rr && py > q.y - rr && py < q.y + q.h + rr);
      const fxNames = blindPickFx(B, bRng(sd.fx), bl, c, look);
      // 🔒 图形和线条一件都不掷，人想要自己添。例外只有玻璃那几片 —— 它们是「局部模糊」，不是图形
      const rp = v2 ? bRng(bSub(sd.post, 31)) : bRng(sd.post);
      B.items = bl.items || [];
      if (!bl.items && look.pane && rp.rnd() < look.paneP * (long || c.long ? .3 : 1)){
        const id = rp.P(look.pane), it = blindNewItem(id, bSub(sd.post, 9), pal, S.w, S.h), h = B.heroRect || { x: B.A.x, y: B.A.y, w: B.A.w, h: B.A.h };
        // 玻璃盖在主角的某一两个字上；正文最多被它挡掉一小半
        const gs = main ? main.ops.filter(o => o.k === 'g') : [], at = () => { const o = gs.length ? rp.P(gs) : { x: h.x + h.w * rp.R(.2, .8), y: h.y + h.h * rp.R(.2, .8), s: 120 }, z = o.cell ? Math.min(...o.cell) : o.s; return { x: o.x + z * rp.R(-.4, .4), y: o.y + z * rp.R(-.4, .4), z }; };
        let best = null;
        for (let q = 0; q < 12; q++){
          const a = at(), r = Math.max(S.w * .11, Math.min(S.w * .3, a.z * rp.R(.8, 1.5))), k = id === 'blurp' ? 1 : rp.P([.6, .9, 1.3, 1.8]), hide = boxes.filter(b => main && !main.body).reduce((s, b) => s + Math.max(0, Math.min(a.x + r, b.x + b.w) - Math.max(a.x - r, b.x)) * Math.max(0, Math.min(a.y + r * k, b.y + b.h) - Math.max(a.y - r * k, b.y)), 0) / Math.max(1, boxes.reduce((s, b) => s + b.w * b.h, 0));
          if (!best || hide < best.hide) best = { a, r, k, hide }; if (hide < .12) break;
        }
        if (best.hide < .4){ Object.assign(it, { x: Math.round(best.a.x), y: Math.round(best.a.y), r: Math.round(best.r), rot: 0, front: true }); if (id !== 'blurp') it.q = best.k; B.items = [it]; }
      }
      const rq = v2 ? bRng(sd.post) : rp; let ps = bl.post || rq.P(look.post); const still = long || c.long;
      // 长文滤掉那些糊字的修图之后，别落得光秃秃的：补一层轻的空气
      if (!bl.post && still && look.id !== 'flat' && !ps.some(q => B_LONG_POST.includes(q)) && rq.rnd() < .55) ps = [rq.P(['soft', 'soft', 'film', 'matte', 'multiply'])];
      B.post = B_POST_ORDER.filter(q => ps.includes(q) && (bl.post || !c.calm || c.calm.includes(q)) && (bl.post || !(long || c.long) || B_LONG_POST.includes(q)));
      return { B, comp: c.id, fxNames, turn: k, room: { mode, A: A0, W: B.W } };
    }
  }
  return null;
}
const bP = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

// 满得已经放不下一层淡字的那些
const B_FULL = Object.fromEntries(['block', 'vblock', 'pack', 'field', 'micro', 'mosaic', 'contour', 'shift', 'image', 'youme', 'void', 'drift', 'ear', 'underlay', 'canon', 'ramp', 'rain', 'giant', 'overprint', 'panel', 'half', 'slit', 'depth', 'frame'].map(k => [k, 1]));
const B_LOUD = Object.fromEntries(['block', 'vblock', 'pack', 'skyline', 'ramp', 'contour', 'overprint', 'cut', 'shutter', 'slit', 'micro', 'giant', 'grainy', 'shift', 'half', 'mosaic', 'tilt'].map(k => [k, 1]));
// 垫底的淡字：是从正文里来的回声（没有 at，不算正文）
function blindUnder(B, rng, c, v2){
  const { R, P, maybe } = rng, { W, H, A, M, pal, u, look } = B, heavy = /Black|Heavy|900/.test(B.fonts.hero + B.fonts.heroW), busy = B.layers.some(l => l.role === 'deco' && l.ops.some(o => o.k === 'g') || l.role === 'back');
  const key = B.hero ? B.hero.units : B.keyClause ? B.keyClause.units : B.core.slice(0, 4), ghost = key.map(q => ({ ...q, at: undefined }));
  const p0 = v => (v2 ? (x => () => x)(maybe(v)) : () => maybe(v)), want = p0((look.id === 'flat' ? .2 : look.under === undefined ? .5 : look.under) * (c.long ? .4 : 1));
  if (!B_FULL[c.id] && !busy && B.cjk && want((look.id === 'flat' ? .2 : look.under === undefined ? .5 : look.under) * (c.long ? .4 : 1))){
    const blur = maybe(.6) ? (look.ghost === undefined ? 5 : look.ghost) * R(.6, 1.6) * u : 0, col = P([pal.i, pal.i, B.kin]), al = (heavy ? R(.045, .08) : R(.07, .13)) * (blur > 4 ? 1.5 : 1) * (B.dark ? 1.15 : 1), l = B.layer('deco', { bleed: true, under: true, ...(blur ? { soft: blur } : {}) }), kind = P(['char', 'char', 'col', 'row', 'verse']);
    const body = B.layers.filter(q => q.role === 'body' || q.body).flatMap(q => q.ops.map(o => blindOpRect(B, o))).filter(Boolean), left = body.length ? body.reduce((s, r) => s + r.x + r.w / 2, 0) / body.length < W / 2 : maybe(.5);
    if (kind === 'char'){ const ch = bDense(B.word ? B.word.t : '') || bDense(ghost.map(g => g.latin ? '' : g.t).join('')) || ghost[0].t, s = W * R(.8, 1.35); B.glyph(l, ch, W * (left ? R(.58, .82) : R(.18, .42)), H * R(.3, .72), s, { c: col, a: al, ...(B.fonts.big ? { stack: B.fonts.big } : {}) }); }
    else if (kind === 'col'){ const n = B.colLen(ghost), s = Math.min(H * R(1, 1.25) / n, W * .7); B.col(l, ghost, W * (left ? R(.66, .86) : R(.14, .34)), H * .5 - s * n / 2 + H * R(-.08, .08), s, { c: col, a: al }); }
    else if (kind === 'row'){ const s = Math.min(W * R(1.15, 1.5) / B.emOf(ghost), H * .4); B.row(l, ghost, W * R(.4, .6), H * R(.2, .8), s, { c: col, a: al }); }
    else { const s = Math.min(W * .9 / B.emOf(ghost), H * .1), n = Math.ceil(H / (s * 1.16)), dx = R(-.5, .5) * s; for (let i = -1; i <= n; i++) B.row(l, ghost, W / 2 + dx * (i - n / 2), s * 1.16 * (i + .5), s, { c: col, a: al * (.45 + .55 * Math.abs(Math.sin(i * .7 + 1))) }); }
  }
  // 🔒 没写题头、出处、日期，角落就空着（2026-11-25）：早先拿正文里的词填在边上，人家没要
}

// 淡的、软的香槟色，替掉暗底上的金 —— 金字是喜报，不是诗
function bInkAccent(pal){
  const [L, C, h] = bLch(pal.a), dark = pal.m === 'night'; if (contrast(hex2rgb(pal.a), hex2rgb(pal.g)) < 3.6) return pal.i;
  return dark && bHueIn(h, 48, 108) && C > .07 ? bOklch(Math.max(.84, L), .055, h) : pal.a;
}
// 大字的颜色收一收：暗底上不许大金字；又大又艳又粗的，一张里头只留一样
function bRestrain(B){
  // 仿宋细而尖，是小字的字：拉长、加粗、放到巨大就露怯，换成干净的宋体
  if (/Zhuque|Fangsong|仿宋/.test(B.fonts.canon || B.fonts.hero)) for (const l of B.layers) if (l.role === 'hero') for (const o of l.ops) if (o.k === 'g' && o.f === 'hero' && !o.stack && (o.cell || o.s > 210 * B.u)){ o.stack = bClean(o.t, true); delete o.fw; }
  const { pal } = B, gold = B.dark && bHueIn(bLch(pal.a)[2], 46, 108) && bLch(pal.a)[1] > .07;
  for (const l of B.layers) if (l.role === 'hero' && !l.twin && !l.mask && !l.onAccent){ const z = blindAvg(l); if (gold && z > 64 * B.u) for (const o of l.ops) if (o.c === pal.a) o.c = z > 150 * B.u ? pal.i : B.inkAccent; }
}
const B_FX_QUIET = ['melt', 'ink', 'drift', 'focus', 'haze', 'wash', 'glow', 'dither', 'echo', 'trail', 'sand', 'motes', 'dots', 'wear', 'ripple', 'misreg', 'burst'];
const B_FX_DYE = ['misreg', 'echo', 'wash', 'glow'];                // 会把字染成点睛色的：压在色块上的字不上
function blindPickFx(B, rng, bl, c, look){
  const names = [], { P, maybe } = rng, own = look.hero === 'own', set = own ? (c.fx && maybe(.4) ? [P(c.fx)] : []) : P(look.hero), swap = P(['melt', 'haze', 'focus']);
  B.layers.forEach(l => {
    if (l.role !== 'hero' || l.twin) return;
    if (bl.fx){
      // 人自己点过效果：点了什么就是什么，只是小字那层收着力
      if (l.mask || l.tex) return;
      l.gentle = l.gentle || l.body;
      l.fx = B_FX_ORDER.filter(f => bl.fx.includes(f) && (!l.body || B_FX_BODY.includes(f)));
    } else if (!l.fx.length && !l.nofx && !l.mask && !l.tex && !l.own){
      if (c.long){ if (maybe(.45)) return; l.gentle = true; }      // 长文里大字只轻轻动一下，别把它弄没了
      const small = l.body || l.avg < 50 * B.u; let fx = set.slice();
      if (small){ l.gentle = true; fx = fx.filter(f => B_FX_BODY.includes(f) && !['bars', 'torn', 'brush'].includes(f) && !(look.id === 'sandblast' && f !== 'wash')); if (!l.body && !fx.length) fx = []; if (l.avg < 34 * B.u) fx = fx.filter(f => ['wash', 'haze', 'glow', 'focus'].includes(f)); }
      else if (l.quiet || l.gentle || ['melt', 'chorus', 'contour', 'shutter'].includes(c.id)) fx = fx.map(f => B_FX_QUIET.includes(f) || (!l.quiet && l.gentle && ['cuts', 'slice', 'split', 'stitch', 'veil', 'blinds', 'bars', 'disc', 'torn', 'brush', 'scatter', 'scan', 'smear'].includes(f)) ? f : swap);
      if (l.avg < 110 * B.u) fx = fx.filter(f => !['veil', 'split', 'stitch', 'smear', 'slit', 'scatter'].includes(f));
      // 一次只动一两种对比。粗、艳、发光、甩影子一起上，就是促销
      const col = (l.ops.find(o => o.k === 'g') || {}).c, ink = col === B.pal.i, heavy = !B.softHero || B.fonts.cls === 'oldSerif' || l.ops.some(o => o.fw) || /KingHwa|Nanxi|Zhaohua/.test(B.fonts.canon || B.fonts.hero), big = l.avg > 78 * B.u; l.heavy = heavy; l.ghost = B.kin;
      fx = fx.map(f => {
        if (c.long && !B_LONG_FX.includes(f)) return 'melt';
        if (f === 'wash' && (c.long || B.dark) && bHueGap(bLch(B.pal.a)[2], bAnchor(B.pal)) > 75) return 'focus';      // 一行字从白染到另一头的艳色，花
        if (['burst', 'trail', 'echo', 'smear'].includes(f) && !ink && big) return 'melt';
        if (f === 'echo' && big && (B.dark || heavy)) return 'focus';
        if (f === 'wear' && B.dark && l.avg > 110 * B.u) return 'melt';      // 大白字撒麻点，像掉了漆
        if (['glow', 'haze'].includes(f) && B.dark && heavy && big) return 'melt';
        if (f === 'burst' && B.dark && heavy && l.avg > 130 * B.u) return 'drift';
        if (['veil', 'bars'].includes(f) && !heavy) return 'focus';
        return f;
      });
      if (l.read && B_LOUD[c.id]) fx = fx.map(f => f === 'echo' ? 'wash' : f);
      if (l.onAccent || l.bleed) fx = fx.filter(f => !(l.onAccent && B_FX_DYE.includes(f)));
      l.fx = B_FX_ORDER.filter(f => fx.includes(f));
    }
    if (B.solo) l.gentle = true;
    for (const f of l.fx) if (!names.includes(f)) names.push(f);
  });
  return names;
}

// ── 人选中改过的字：排完之后盖上去，版面一动不动 ──────────────────
// 字号按比例走（普通版式里 46 → 92，就是大一倍），字体、颜色、粗细、浓淡照用。
function blindStyle(B, st){
  const marks = { text: spansToMarks(st.spans, (st.text || '').length), title: spansToMarks(st.titleSpans, (st.title || '').length) };
  const base = { text: st.fontSize || 46, title: titleFontSize(st) };
  if (!marks.text.some(Boolean) && !marks.title.some(Boolean)) return;
  for (const l of B.layers){
    if (l.tex || l.twin) continue;
    for (const op of l.ops){
      const m = op.src && op.at !== undefined && marks[op.src]; if (!m) continue;
      const k = q => q && q.size ? q.size / base[op.src] : 1;
      if (op.k === 'g'){
        const q = m[op.at]; if (!q) continue;
        op.styled = true; const z = k(q); op.s *= z; if (op.cell) op.cell = op.cell.map(v => v * z);
        if (q.ink) op.c = bToHex(inkOf(q.ink)); if (q.font) op.stack = pickStack(q.font, st, B.fonts[op.f] || B.fonts.body);
        if (q.weight !== undefined) op.fw = q.weight; if (q.alpha !== undefined) op.a = q.alpha;
        continue;
      }
      const slice = m.slice(op.at, op.at + op.t.length); if (!slice.some(Boolean)) continue;
      const plain = { size: op.s, stack: B.fonts[op.f || 'body'] || B.fonts.body, ink: null, stroke: 0, plain: true }, seen = new Map();
      op.styled = true;
      op.rich = slice.map(q => { if (!q) return plain; const id = JSON.stringify(q); if (!seen.has(id)){ const size = op.s * k(q); seen.set(id, { size, stack: q.font ? pickStack(q.font, st, B.fonts.body) : B.fonts[op.f || 'body'] || B.fonts.body, ink: q.ink ? inkOf(q.ink) : null, stroke: strokeFor(q.weight || 0, size), alpha: q.alpha }); } return seen.get(id); });
    }
  }
}
const bToHex = c => /^#[0-9a-f]{6}$/i.test(c) ? c : '#808080';

const blindAvg = l => { const s = l.ops.filter(o => o.s).map(o => o.cell ? Math.min(...o.cell) : o.s).sort((a, b) => a - b); return s.length ? s[s.length >> 1] : 60; };

// 人拖过的字块：整块平移、放缩、换色（move 以层的序号记；换方案时面板会把它清掉）
function blindMoves(B, move){
  if (!move) return;
  for (const [i, m] of Object.entries(move)){
    const l = B.layers[i]; if (!l || l.twin) continue;
    const k = Math.max(.2, Math.min(4, m.k || 1)), dx = m.dx || 0, dy = m.dy || 0, cx = l.rect.x + l.rect.w / 2, cy = l.rect.y + l.rect.h / 2;
    const X = v => cx + (v - cx) * k + dx, Y = v => cy + (v - cy) * k + dy;
    const move1 = op => {
      op.x = X(op.x); op.y = Y(op.y);
      for (const q of ['s', 'len', 'w', 'h', 'rad', 'o']) if (typeof op[q] === 'number') op[q] *= k;
      if (op.cell) op.cell = op.cell.map(v => v * k);
      if (m.c && op.k !== 'r') op.c = bCol(B.pal, m.c);
      if (m.a !== undefined) op.a = (op.a === undefined ? 1 : op.a) * m.a;
    };
    l.ops.forEach(move1);
    if (l.mask && l.mask.ops !== B.maskOps) l.mask.ops.forEach(move1);
    if (l.clip) l.clip = { x: X(l.clip.x), y: Y(l.clip.y), w: l.clip.w * k, h: l.clip.h * k };
    l.rect = blindRect(B, l); l.avg = blindAvg(l); l.moved = true;
  }
}

// ── 验收：没出界、没压住正文、一个字没丢 ──────────────────────────
function blindOpRect(B, op){
  if (op.k === 'g'){
    let w = op.cell ? op.cell[0] : (op.len || B.em(op.t, op.f) * op.s), h = op.cell ? op.cell[1] : op.s;
    const c = Math.abs(Math.cos(op.r || 0)), s = Math.abs(Math.sin(op.r || 0)), bw = w * c + h * s, bh = w * s + h * c;
    return { x: op.x - bw / 2, y: op.y - bh / 2, w: bw, h: bh };
  }
  if (op.k === 'l') return { x: op.x, y: op.y, w: op.len, h: op.s * 1.1 };
  if (op.k === 'v') return { x: op.x, y: op.y, w: op.s, h: op.len };
  if (op.k === 'r') return { x: op.x, y: op.y, w: op.w, h: op.h };
  return null;
}
const blindTurn = r => r;
function blindRect(B, l){
  const rs = l.ops.filter(o => !(o.k === 'r' && l.role !== 'back')).map(op => blindOpRect(B, op)).filter(Boolean);
  if (!rs.length) return { x: 0, y: 0, w: B.W, h: B.H };
  const x = Math.max(0, Math.min(...rs.map(r => r.x))), y = Math.max(0, Math.min(...rs.map(r => r.y)));
  return { x, y, w: Math.min(B.W, Math.max(...rs.map(r => r.x + r.w))) - x, h: Math.min(B.H, Math.max(...rs.map(r => r.y + r.h))) - y };
}
function blindFits(B){
  const pad = B.M * .5, boxes = [];
  for (const l of B.layers){
    if (l.role === 'deco' || l.role === 'back' || l.twin) continue;
    for (const op of l.ops){
      if (op.k === 'r') continue;
      if (!op.cell && !(op.s >= (l.role === 'meta' ? 11.5 : l.tex ? 10 : 18))) return false;
      const r = blindOpRect(B, op);
      if (!l.bleed && l.role !== 'meta' && (r.x < pad || r.y < pad || r.x + r.w > B.W - pad || r.y + r.h > B.H - pad)) return false;
      if (!l.bleed) boxes.push({ r, g: l.role === 'meta' ? 2 : (l.role === 'body' || l.body) ? 1 : 0, l });
    }
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++){
    const a = boxes[i], b = boxes[j]; if (a.l === b.l || a.g === b.g) continue;
    const w = Math.min(a.r.x + a.r.w, b.r.x + b.r.w) - Math.max(a.r.x, b.r.x), h = Math.min(a.r.y + a.r.h, b.r.y + b.r.h) - Math.max(a.r.y, b.r.y);
    if (w > 3 && h > 3 && w * h > .05 * Math.min(a.r.w * a.r.h, b.r.w * b.r.h)) return false;
  }
  return true;
}
// 🔒 一个字都不丢：凡是标了 read 的层，合起来必须装得下原文的每一个字
function blindKeepsAll(B){
  const have = new Map();
  const add = (t, d) => { for (const ch of t) if (!B_PUNCT.test(ch)) have.set(ch, (have.get(ch) || 0) + d); };
  for (const l of B.layers) if (!l.twin && !l.tex && (l.read || (B.solo && l.role === 'hero'))) for (const op of l.ops) if (op.t && !op.deco && op.at !== undefined) add(op.t, 1);
  for (const u of B.core) add(u.t, -1);
  for (const v of have.values()) if (v < 0) return false;
  return true;
}

// ── 落墨 ───────────────────────────────────────────────────────────
function blindGround(ctx, W, H, pal, st, idx, look, sd){
  if (pal.paper){
    const photo = groundPhoto({ paper: pal.paper, orient: st.orient });
    if (photo && !(photo.complete && photo.naturalWidth)){ ctx.fillStyle = pal.g; ctx.fillRect(0, 0, W, H); }
    else {
      drawGround(ctx, { paper: pal.paper, paperLight: pal.light, orient: st.orient }, W, H, idx);
      if (look && look.id === 'first'){ const E = { ...bRng(bSub(sd.look, 21)), W, H, pal, dark: pal.m === 'night' }; if (E.maybe(.6)) bOrbs(ctx, E, .55); }
    }
    return;
  }
  ctx.fillStyle = pal.g; ctx.fillRect(0, 0, W, H);
  if (!look) return;
  const E = { ...bRng(bSub(sd.look, 21)), W, H, pal, idx, u: Math.min(W, H) / 1080, dark: pal.m === 'night' };
  let kind = E.P(look.grounds); if (kind === 'beam' && E.dark) kind = E.P(['corner', 'aura', 'centre']);      // 暗底上一道斜光，是影楼
  ctx.save(); BLIND_GROUND[kind](ctx, E); ctx.restore();
  if (!['rice', 'wash'].includes(kind) && E.maybe(look.fiber === undefined ? .4 : look.fiber)) bFiber(ctx, E);
}
// 一款字的「墨迹框」：以「国」字为准。字身在字框里偏上偏下，各款不一样，居中要按墨迹居
function bInk(x, font, latin, cache){
  const key = font + (latin ? 'L' : 'C'); if (cache.has(key)) return cache.get(key);
  x.font = font; const m = x.measureText(latin ? 'Hx' : '国'), v = { dy: (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2, w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent };
  cache.set(key, v); return v;
}
function blindDrawOp(x, op, B, cache){
  const keep = x.globalAlpha;
  if (op.a !== undefined) x.globalAlpha = keep * op.a;
  if (op.k === 'l' || op.k === 'v'){
    x.textBaseline = 'top'; x.textAlign = 'start'; x.font = bFont(B, op.f || 'body', op.s);
    if (op.k === 'l') drawRich(x, op.x, op.y, op.t, op.c, op.c, strokeFor(op.heavy || 0, op.s), 0, op.rich || null);
    else drawColumn(x, op.x, op.y, op.t, op.s, op.c, op.c, 0, 0, op.rich || null);
  } else if (op.k === 'r'){
    if (op.hole && B.bare) x.clearRect(op.x, op.y, op.w, op.h); else { x.fillStyle = op.c; x.fillRect(op.x, op.y, op.w, op.h); }
  }
  else {
    x.save(); x.textAlign = 'center'; x.textBaseline = 'middle';
    const latin = /^[ -~]/.test(op.t), font = op.stack ? `${op.s}px ${op.stack}` : bFont(B, op.f, op.s), ref = bInk(x, font, latin, cache);
    x.font = font; x.translate(op.x, op.y); if (op.r) x.rotate(op.r);
    // 竖排的标点：句读坐右上角，引号括号转九十度（跟普通竖排一个规矩）
    if (op.vp && V_CORNER.includes(op.t)) x.translate(op.s * .5, -op.s * .5); else if (op.vp && V_ROTATE.includes(op.t)) x.rotate(Math.PI / 2);
    if (op.cell){ const w = latin ? x.measureText(op.t).width : ref.w; x.scale(op.cell[0] / Math.max(1, w), op.cell[1] / Math.max(1, ref.h)); }
    const dy = latin && !op.cell ? 0 : ref.dy;
    if (op.flip) x.scale(1, -1);
    if (op.hole && B.bare) x.globalCompositeOperation = 'destination-out';
    if (op.o){ x.strokeStyle = op.c; x.lineWidth = op.o; x.lineJoin = 'round'; x.strokeText(op.t, 0, dy); }
    else { const sw = op.fw ? strokeFor(op.fw, op.s) : 0; x.fillStyle = op.c; if (sw){ x.strokeStyle = op.c; x.lineWidth = sw; x.lineJoin = 'round'; x.miterLimit = 2; x.strokeText(op.t, 0, dy); } x.fillText(op.t, 0, dy); }
    x.restore();
  }
  x.globalAlpha = keep;
}
function blindDrawLayer(x, l, B, cache){
  x.save();
  if (l.clip){ x.beginPath(); x.rect(l.clip.x, l.clip.y, l.clip.w, l.clip.h); x.clip(); }
  for (const op of l.ops) blindDrawOp(x, op, B, cache);
  x.restore();
}
let bGrainTile = null;
function blindGrain(){
  if (bGrainTile) return bGrainTile;
  const c = PLATFORM.canvas(256, 256), x = c.getContext('2d'), im = x.createImageData(256, 256), rnd = mulberry32(99);
  for (let i = 0; i < 65536; i++){ const v = 128 + (rnd() - .5) * 200; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0);
  return (bGrainTile = c);
}

// 调浓淡：做过效果的和没做的按比例掺。两张都带透明，所以用相加，不用一张盖一张
function bLerp(after, before, k){
  const c = bCanvas(after.width, after.height), x = c.getContext('2d');
  x.globalAlpha = k; x.drawImage(after, 0, 0); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 1 - k; x.drawImage(before, 0, 0);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; return c;
}
const B_POST_WHOLE = ['negate', 'subtitle'];      // 反色掺一半就是一张灰，字幕要么有要么没有：这两样不分浓淡
// 读的字里最小的有多大（按 1080 宽算）：磨砂看它收着点
const blindSmall = B => Math.min(999, ...B.layers.filter(l => l.role === 'body' || l.body).flatMap(l => l.ops.filter(o => o.k !== 'r' && o.s).map(o => o.cell ? Math.min(...o.cell) : o.s))) / B.u;
// 只问这颗种子的气氛，不排版（重掷的时候先看一眼，一样就不必排）
function blindAir(st, bl){
  const own = bl.own || {}, sd = blindSeeds(bl), r = k => bRng(sd[k]).rnd;
  return bLook(bl.pal ? { ...bl.pal, m: relLum(hex2rgb(bl.pal.g)) < .3 ? 'night' : 'clear' } : bPalette(st, r('pal'), own), r('look'), bl.look).id;
}

function renderBlind(canvas, st, plan, idx){
  const { blind, W, H } = plan;
  if (idx > 0) return renderPage(canvas, blind.innerSt, blind.inner, idx - 1);
  const { B, pal, sd } = blind, ctx = canvas.getContext('2d'), cache = new Map(), amt = { fx: 1, post: 1, ...((st.blind || {}).amt || {}) };
  if (canvas.width !== W * DPR || canvas.height !== H * DPR){ canvas.width = W * DPR; canvas.height = H * DPR; }      // 尺寸没变就别重新要一块
  else if (ctx.reset) ctx.reset();      // 连上一张留下的笔（平滑、线帽、字距）一起清，不然同一张重画两遍会差一点点
  else { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'low'; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; ctx.miterLimit = 10; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!st.noGround) blindGround(ctx, W, H, pal, st, 0, blind.look, sd);
  B.bare = !!st.noGround;
  const env = salt => ({ ...bRng(bSub(sd.fx, salt)), u: B.u, W, H, pal, dark: B.dark, heroRect: B.heroRect, bodyRect: (B.layers.find(l => l.role === 'body' && !l.twin) || {}).rect, hit: B.hit });
  for (const it of B.items) blindDrawItem(ctx, it, B, 'back');

  const rank = { back: 0, deco: 1, hero: 2, body: 3, meta: 4 };
  B.layers.map((l, i) => ({ l, i })).sort((a, b) => rank[a.l.role] - rank[b.l.role] || a.i - b.i).forEach(({ l, i }) => {
    ctx.save();
    if (l.alpha !== undefined) ctx.globalAlpha = l.alpha;
    if (l.blend) ctx.globalCompositeOperation = l.blend;
    if (l.soft && !l.fx.length && !l.mask && !l.stripes && !l.fade && !l.ops.some(o => o.hole)){
      const q = l.soft > 4 ? .25 : .5, c = PLATFORM.canvas(Math.round(W * DPR * q), Math.round(H * DPR * q)), x = c.getContext('2d'); x.setTransform(DPR * q, 0, 0, DPR * q, 0, 0); blindDrawLayer(x, l, B, cache); x.setTransform(1, 0, 0, 1, 0, 0);
      const s = bBlur(c, l.soft * DPR * q); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(s, 0, 0, W, H); ctx.restore(); return;
    }
    if (!l.fx.length && !l.soft && !l.mask && !l.stripes && !l.fade && !(B.bare && l.ops.some(o => o.hole))){ blindDrawLayer(ctx, l, B, cache); ctx.restore(); return; }
    let cv = bCanvas(W * DPR, H * DPR);
    const x = cv.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); blindDrawLayer(x, l, B, cache); x.setTransform(1, 0, 0, 1, 0, 0);
    if (l.soft){ const s = bBlur(cv, l.soft * DPR); bFree(cv); cv = s; }
    if (l.fade){ const z = cv.getContext('2d'), g = z.createLinearGradient(0, l.fade.y0 * DPR, 0, l.fade.y1 * DPR); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); bMask(cv, g); }      // 没进雾里
    if (l.mask){
      const m = bCanvas(W * DPR, H * DPR), y = m.getContext('2d'); y.setTransform(DPR, 0, 0, DPR, 0, 0); for (const op of l.mask.ops) blindDrawOp(y, op, B, cache); y.setTransform(1, 0, 0, 1, 0, 0);
      const z = cv.getContext('2d'); z.globalCompositeOperation = l.mask.mode === 'in' ? 'destination-in' : 'destination-out'; z.drawImage(m, 0, 0); z.globalCompositeOperation = 'source-over'; bFree(m);
    }
    if (l.stripes){
      const { p, duty, vert, inv } = l.stripes, z = cv.getContext('2d'); z.globalCompositeOperation = 'destination-out';
      for (let k = -1; k * p < (vert ? W : H) + p; k++){ const a = (k + (inv ? 0 : duty)) * p * DPR, n = p * (inv ? duty : 1 - duty) * DPR; vert ? z.fillRect(a, 0, n, H * DPR) : z.fillRect(0, a, W * DPR, n); }
      z.globalCompositeOperation = 'source-over';
    }
    const kf = l.own ? 1 : amt.fx, plain = kf < 1 && l.fx.length ? bCopy(cv) : null;
    if (kf > 0) l.fx.forEach((f, k) => { const out = BLIND_FX[f](cv, env(i * 16 + k), l); if (out !== cv){ bFree(cv); cv = out; } });
    if (plain){ if (kf > 0){ const q = bLerp(cv, plain, kf); bFree(cv); cv = q; } bFree(plain); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(cv, 0, 0); bFree(cv);
    ctx.restore();
  });
  for (const it of B.items) blindDrawItem(ctx, it, B, 'front');

  if (!B.bare){ ctx.save(); ctx.setTransform(DPR / 2, 0, 0, DPR / 2, 0, 0);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = (B.dark ? .12 : .09) * (blind.look.grain || 1);
  ctx.fillStyle = ctx.createPattern(blindGrain(), 'repeat'); ctx.fillRect(0, 0, W * 2, H * 2); ctx.restore(); }
  // 修图：整张排好了再过一遍
  // （透明底时，会整张铺颜色的那几种就不过了）
  B.post.filter(p => !B.bare || ['gauss', 'defocus', 'swirl', 'matte', 'reeded'].includes(p)).forEach(p => {
    const k = B_POST_WHOLE.includes(p) ? 1 : amt.post; if (k <= 0) return;
    const was = k < 1 && p !== 'matte' ? bCopy(canvas) : null;
    BLIND_POST[p](canvas, { ...env(700 + B_POST_ORDER.indexOf(p)), full: B.layers.some(l => l.role === 'hero' && l.read), fonts: B.fonts, subtitle: B.hero ? B.hero.t : '', k, small: blindSmall(B) });
    if (was){ const q = bLerp(canvas, was, k), y = canvas.getContext('2d'); y.setTransform(1, 0, 0, 1, 0, 0); y.globalAlpha = 1; y.globalCompositeOperation = 'copy'; y.drawImage(q, 0, 0); y.globalCompositeOperation = 'source-over'; bFree(q); bFree(was); }
  });
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'start'; ctx.textBaseline = 'top';
  if (DPR > 1) bDrain();                // 草样用的小画布留着下一张接着用
}

