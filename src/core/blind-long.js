// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ④″ 长文：读出结构，再排
// ════════════════════════════════════════════════════════════════════
// 早先长文只有一种排法：一个大字标题，底下一整块正文，看着像电商详情页。
// 几条规矩（查过资料才写的）：
//   · 形式从文本的性质里长出来（奇肖尔德）—— 先认出段落、引语、问句、独句，再给它们位置；
//   · 一句主句大字穿过全文，别的按轻重分级，空白是音程（马拉美《骰子一掷》）；
//   · 行越长，行距越大；版心 ＝ 字号 × 每行字数 × 行距（日文排版规范）；
//   · 一次只动一两种对比（Carl Dair）—— 大小、粗细、方向、颜色、质地，别一起上。
function bParas(text, cjk){
  let out = [];
  for (const m of text.matchAll(/[^\n]+/g)){ const t = m[0].trim(); if (t) out.push({ t, at: m.index + m[0].length - m[0].trimStart().length }); }
  // 一大段不换行的：按句子拆成意群，两三句一组
  if (out.length <= 2) out = out.flatMap(p => {
    if (p.t.length < (cjk ? 90 : 260)) return [p];
    const re = cjk ? /[^。！？!?…]+[。！？!?…]*[”」』）]*/g : /[^.!?]+[.!?]*["')\]]*\s*/g, parts = []; let cur = null;
    for (const m of p.t.matchAll(re)){ const lead = m[0].length - m[0].trimStart().length, t = m[0].trim(); if (!t) continue; if (cur && cur.t.length + t.length < (cjk ? 46 : 150)) cur.t = p.t.slice(cur.at, m.index + lead + t.length); else { cur = { t, at: m.index + lead }; parts.push(cur); } }
    return parts.map(q => ({ t: q.t, at: p.at + q.at }));
  });
  out.forEach((p, i) => { p.i = i; p.n = bUnits(p.t).filter(u => !u.punct).length; p.quote = /^[「『“"]/.test(p.t); p.ask = /[？?][”」』"]*$/.test(p.t); p.short = p.n <= (cjk ? 14 : 8); });
  return out.filter(p => p.n);
}
// 一段 → 若干行（横的或竖的）。末行只剩一两个字的，把版口收窄一点
function bLines(B, p, w, s, v, f = 'body'){
  const ctx = B.ctx, wr = q => { ctx.font = bFont(B, f, s); return buildItems(ctx, p.t, q, s, v, null).items.filter(it => !it.gap); };
  let ls = wr(w);
  if (ls.length > 1) for (let k = 1; k < 6 && bUnits(ls[ls.length - 1].text).filter(u => !u.punct).length <= 2; k++){ const t = wr(w * (1 - .035 * k)); if (t.length > ls.length) break; ls = t; }
  return ls.map(q => ({ t: q.text, at: p.at + q.at, len: v ? vAdvance(ctx, q.text, s) : ctx.measureText(q.text).width, s, f }));
}
// 几段摞成一条流。style(p) 给这一段的：k 字号倍数、f 字体、c 颜色、a 浓淡、ind 缩进、before 段前、lead 行距
function bStack(B, ps, w, s, { v = false, lead = 1.85, gap = .6, style = () => ({}) } = {}){
  const lines = []; let off = 0;
  ps.forEach((p, i) => {
    const st = style(p, i) || {}, z = s * (st.k || 1), ind = (st.ind || 0) * s, ld = st.lead || lead; if (i) off += (st.before || 0) * s;
    const ls = bLines(B, p, w - ind, z, v, st.f || 'body'); ls.forEach((l, j) => { lines.push({ ...l, p, off, ind, c: st.c, a: st.a, first: !j, last: j === ls.length - 1 }); off += z * ld; });
    off += gap * s - z * (ld - lead) * .5;
  });
  const end = lines[lines.length - 1]; return { lines, flow: end ? end.off + end.s : 0, cross: Math.max(0, ...lines.map(l => l.ind + l.len)) };
}
function bPlace(B, l, lines, box, v, { align = 'left', shift = 0 } = {}){
  for (const q of lines) l.ops.push({ k: v ? 'v' : 'l', t: q.t, at: q.at, src: 'text', s: q.s, len: q.len, c: q.c || B.pal.i, ...(q.f !== 'body' ? { f: q.f } : {}), ...(q.a !== undefined && q.a < 1 ? { a: q.a } : {}),
    x: v ? box.x + box.w - (q.off - shift) - q.s : box.x + (align === 'right' ? box.w - q.len - q.ind : align === 'center' ? (box.w - q.len) / 2 : q.ind), y: v ? box.y + q.ind : box.y + q.off - shift });
}
// 一条流灌进几个框
function bPour(lines, frames, v){
  const out = []; let f = 0, base = lines.length ? lines[0].off : 0, cur = [];
  for (let i = 0; i < lines.length; i++){
    const q = lines[i], fr = frames[f]; if (!fr) return null; const cap = v ? fr.w : fr.h, end = q.off - base + q.s;
    const orphan = q.first && !q.last && lines[i + 1] && lines[i + 1].off - base + q.s > cap;
    if (cur.length && (end > cap || orphan)){ out.push({ fr, lines: cur, base }); f++; base = q.off; cur = []; i--; continue; }
    if (end > cap + 1) return null; cur.push(q);
  }
  if (cur.length) out.push({ fr: frames[f], lines: cur, base });
  return out.length <= frames.length ? out : null;
}
// 放得下的最大字号。小的放得下、大的放不下 —— 对半找，一个字号一个字号试太慢
const bFit = (hi, lo, fn) => { let best = fn(lo); if (!best) return null; while (lo < hi){ const m = (lo + hi + 1) >> 1, r = fn(m); if (r){ best = r; lo = m; } else hi = m - 1; } return best; };
// 这一张里，引语（没有就那一段主句）跟叙述怎么区分 —— 只用一种办法，全张一致
function bRole(B, strong){
  const has = B.paras.some(p => p.quote), mark = p => has ? p.quote : p === B.keyPara, way = B.P(['indent', 'tone', 'kin', 'indent']);
  return p => way === 'indent' ? (mark(p) ? { ind: 2 } : {}) : way === 'tone' ? (mark(p) ? {} : { a: .64 }) : (mark(p) ? { c: B.inkAccent, ind: strong ? 1 : 0 } : {});
}
const bPoints = (B, us) => us.map(u => ({ ...u, at: undefined }));
// 主句：含着主角的那一段里，取一整句（不超过 26 个字）
function bKeyLine(B, most = 26){
  const p = B.keyPara, cs = B.clauses.filter(c => c.at >= p.at && c.at < p.at + p.t.length), i0 = Math.max(0, B.hero && !B.hero.title ? cs.findIndex(c => c.units.some(u => u.at === B.hero.units[0].at)) : 0); if (!cs.length) return null;
  const out = []; for (let i = i0; i < cs.length && out.reduce((a, c) => a + c.n, 0) + cs[i].n <= most; i++) out.push(cs[i]); if (!out.length) out.push(cs[i0]);
  return { clauses: out, n: out.reduce((a, c) => a + c.n, 0), units: out.flatMap(c => c.full) };
}

const BLIND_LONG = [
  { id: 'folio', w: 6, face: ['serif', 'oldSerif', 'lightSerif'], ok: B => B.N >= 90, run(B){
    // 一页书：古典的版心，天头大于地脚；标题不喊，站在空白里
    const { R, P, maybe, pal, A } = B, v = B.cjk && maybe(.55), dense = B.N / B.paras.length < 34, w = A.w * R(.62, .78), big = B.N > 220 ? .14 : 0, h = A.h * ((v ? R(.56, .7) : R(.6, .74)) + big), role = bRole(B);
    const lead = B.N > 220 ? 1.76 : 1.92, got = bFit(36, 22, s => { const t = bStack(B, B.paras, v ? h : w, s, { v, lead, gap: dense ? .42 : .85, style: role }); return t.flow <= (v ? w : h) ? { s, ...t } : null; }); if (!got) return false;
    const bw = v ? got.flow : got.cross, bh = v ? got.cross : got.flow, left = maybe(.4), x = left ? A.x : A.x + A.w - bw, y = A.y + A.h - bh;
    bPlace(B, B.layer('body', { read: true }), got.lines, { x, y, w: bw, h: bh }, v);
    const hu = B.hero && B.hero.units.length >= 2 ? B.hero.units : null; if (!hu) return true;
    const l = B.layer('hero', { quiet: true }), z = Math.min(got.s * R(1.9, 3.1), (A.h - bh - 70 * B.u) * .7, A.w * .8 / B.emOf(hu, 'hero', .12));
    if (z < got.s * 1.35){ B.layers.pop(); return true; }
    if (B.cjk && maybe(.4) && B.colLen(hu, 'hero', .1) * z < A.h - bh - 50 * B.u) B.col(l, hu, left ? A.x + A.w - z / 2 : A.x + z / 2, A.y, z, { gap: .1, c: pal.i }); else B.row(l, hu, left ? A.x : A.x + A.w - B.emOf(hu, 'hero', .12) * z, A.y + z / 2, z, { align: 'left', gap: .12, c: pal.i });
    return true;
  } },

  { id: 'hung', w: 6, face: ['lightSerif', 'serif', 'sans', 'heavySerif', 'heavySans'], ok: B => B.N >= 110, run(B){
    // 悬栏：两三栏从同一条线上挂下来，底下参差；线上面只有一句话和一片空
    const { R, P, maybe, pal, A, u } = B, n = A.w > A.h ? P([3, 4]) : P([2, 2, 3]), gut = 44 * u, cw = (A.w - gut * (n - 1)) / n, hang = A.h * R(.3, .46), stag = maybe(.45) ? R(.05, .12) * A.h : 0, role = bRole(B), hu = B.hero ? B.hero.units : B.core.slice(0, 6);
    const frames = Array.from({ length: n }, (_, i) => ({ x: A.x + (cw + gut) * i, y: A.y + hang + stag * i, w: cw, h: A.h - hang - stag * i }));
    const got = bFit(30, 22, s => { if (cw / s < 8) return null; const t = bStack(B, B.paras, cw, s, { lead: 1.75, gap: .7, style: role }), p = bPour(t.lines, frames); return p ? { s, p } : null; }); if (!got) return false;
    const l = B.layer('body', { read: true }); for (const { fr, lines, base } of got.p) bPlace(B, l, lines, fr, false, { shift: base });
    const rows = B.split(hu, hu.length > 6 ? 2 : 1), z = Math.min(A.w * R(.5, .8) / Math.max(...rows.map(r => B.emOf(r))), hang * .62 / rows.length, 132 * u), h = B.layer('hero'), low = maybe(.4); if (z < got.s * 1.6) return false;
    rows.forEach((r, i) => B.row(h, r, A.x, (low ? A.y + hang - 46 * u - z * 1.1 * rows.length : A.y) + z * 1.1 * (i + .5), z, { align: 'left', c: pal.i }));
    if (maybe(.5)) B.layer('deco').ops.push({ k: 'r', x: A.x, y: A.y + hang - 24 * u, w: A.w, h: 1.2, c: bAlpha(pal.i, .6) });
    return true;
  } },

  { id: 'tiers', w: 7, face: ['lightSerif', 'oldSerif', 'serif', 'heavySerif'], ok: B => B.cjk && B.N >= 120, run(B){
    // 段组：竖排，一层一层往下读，像旧报纸的副刊；主角一列从天到地
    const { R, P, I, maybe, pal, A, u } = B, n = B.N > 300 ? P([2, 3]) : 2, gut = 52 * u, hu = B.hero && B.hero.units.length >= 2 ? B.hero.units : B.core.slice(0, 5), right = maybe(.75), z = Math.min(A.h * R(.6, .98) / B.colLen(hu, 'hero', .08), A.w * R(.1, .17)), gap = z * R(.5, .9), w = A.w - z - gap, th = (A.h - gut * (n - 1)) / n, x = right ? A.x : A.x + z + gap, role = bRole(B);
    const frames = Array.from({ length: n }, (_, i) => ({ x, y: A.y + (th + gut) * i, w, h: th }));
    const got = bFit(34, 22, s => { const t = bStack(B, B.paras, th, s, { v: true, lead: 1.85, gap: .55, style: role }), p = bPour(t.lines, frames, true); return p ? { s, p } : null; }); if (!got || got.p.length < 2) return false;
    const l = B.layer('body', { read: true }); for (const { fr, lines, base } of got.p) bPlace(B, l, lines, fr, true, { shift: base });
    if (z < got.s * 1.5) return false; B.col(B.layer('hero', { quiet: true }), hu, right ? A.x + A.w - z / 2 : A.x + z / 2, A.y + (A.h - B.colLen(hu, 'hero', .08) * z) * P([0, 0, 1]), z, { gap: .08, c: pal.i });
    if (maybe(.6)) for (let i = 1; i < n; i++) B.layer('deco').ops.push({ k: 'r', x, y: A.y + (th + gut) * i - gut / 2, w, h: 1.1, c: bAlpha(pal.i, .5) });
    return true;
  } },

  { id: 'theme', w: 8, face: ['serif', 'lightSerif', 'oldSerif', 'heavySerif'], ok: B => B.N >= 90 && B.N <= 460 && !!bKeyLine(B) && bKeyLine(B).n >= 5, run(B){
    // 主句：一句话拆成几截，大字一路穿下去；小字跟着它走
    const { R, P, I, maybe, pal, A, u } = B, key = bKeyLine(B), k = key.n <= 8 ? 2 : key.n <= 14 ? P([3, 3, 4]) : P([4, 5]), frag = B.split(key.units.filter(q => !q.punct || /[？?！!]/.test(q.t)), k), ps = B.paras, total = ps.reduce((a, p) => a + p.n + 6, 0);
    const groups = frag.map(() => []); let acc = 0; ps.forEach(p => { groups[Math.min(frag.length - 1, Math.floor((acc + p.n / 2) / total * frag.length))].push(p); acc += p.n + 6; }); if (groups.some(g => !g.length)) return false;
    const most = Math.max(...frag.map(f => B.emOf(f))), dir = maybe(.75) ? 1 : -1;
    // 字多的时候，大字和小字并排走，不上下摞
    if (B.N > 190){
      const gw = A.w * R(.52, .58), v = B.cjk && maybe(.4), fw = A.w - gw - 48 * u, z = Math.min(v ? fw * .62 : fw / most, 118 * u), right = maybe(.3);
      const got = bFit(30, 22, s => { const st = groups.map(g => bStack(B, g, gw, s, { lead: 1.72, gap: .5 })), hs = st.map((t, i) => Math.max(t.flow, v ? B.colLen(frag[i], 'hero', .06) * z : z * 1.1)), sum = hs.reduce((a, t) => a + t, 0) + (frag.length - 1) * s * 1.1; return sum <= A.h ? { s, st, hs, sum } : null; }); if (!got || z < got.s * 1.5) return false;
      const h = B.layer('hero', { quiet: true }), l = B.layer('body', { read: true }), gap = got.s * 1.1 + Math.min((A.h - got.sum) / Math.max(1, frag.length - 1), got.s * 2.4); let y = A.y;
      frag.forEach((f, i) => { const us = f.map(q => ({ ...q, at: undefined })); if (v) B.col(h, us, right ? A.x + A.w - z / 2 : A.x + z / 2, y, z, { gap: .06, c: pal.i }); else B.row(h, us, right ? A.x + A.w - B.emOf(f) * z : A.x, y + z * .5, z, { align: 'left', c: pal.i }); bPlace(B, l, got.st[i].lines, { x: right ? A.x : A.x + A.w - gw, y, w: gw, h: 0 }, false); y += got.hs[i] + gap; });
      return true;
    }
    const z = Math.min(A.w * R(.46, .64) / most, A.h * R(.07, .1)), gw = A.w * R(.5, .58);
    const got = bFit(32, 22, s => { const st = groups.map(g => bStack(B, g, gw, s, { lead: 1.75, gap: .55 })), sum = st.reduce((a, t) => a + t.flow, 0) + frag.length * z * 1.5; return sum <= A.h * .97 ? { s, st, sum } : null; }); if (!got || z < got.s * 1.7) return false;
    const h = B.layer('hero', { quiet: true }), l = B.layer('body', { read: true }), air = (A.h - got.sum) / Math.max(1, frag.length * 2 - 1); let y = A.y;
    frag.forEach((f, i) => {
      const t = frag.length > 1 ? i / (frag.length - 1) : 0, tt = dir > 0 ? t : 1 - t, fw = B.emOf(f) * z; B.row(h, f.map(q => ({ ...q, at: undefined })), A.x + (A.w - fw) * tt, y + z * .55, z, { align: 'left', c: pal.i }); y += z * 1.28 + air * .7;
      bPlace(B, l, got.st[i].lines, { x: tt < .5 ? A.x + A.w - gw : A.x, y, w: gw, h: 0 }, false); y += got.st[i].flow + z * .22 + air * 1.3;
    });
    return true;
  } },

  { id: 'voices', w: 8, face: ['lightSerif', 'serif', 'oldSerif'], ok: B => B.cjk && B.N >= 60 && B.paras.length >= 4 && B.paras.filter(p => p.quote).length >= 1 && B.paras.filter(p => p.quote).length < B.paras.length, run(B){
    // 两个声音：叙述靠一边，引语在另一边，一前一后地说
    const { R, P, maybe, pal, A } = B, v = maybe(.5), side = v ? A.h : A.w, flow = v ? A.w : A.h, w0 = side * R(.44, .5), w1 = side * R(.42, .48), flip = maybe(.25);
    const got = bFit(38, 22, s => { let off = 0, last = null; const set = B.paras.map(p => { const q = p.quote, t = bStack(B, [p], q ? w1 : w0, s, { v, lead: 1.85, style: () => q ? { k: 1.16, c: B.inkAccent, f: B.softHero ? 'hero' : 'body' } : {} }); if (last) off += (last.quote === q ? .75 : .2) * s; const at = off; off += t.flow + s * .6; last = p; return { q, t, at }; }); return off <= flow ? { s, set, flow: off - s * .6 } : null; }); if (!got) return false;
    const l = B.layer('body', { read: true }), o0 = (flow - got.flow) * P([0, 0, .4, 1]);
    for (const { q, t, at } of got.set){ const far = q !== flip, off = o0 + at; if (v) bPlace(B, l, t.lines, { x: A.x, y: far ? A.y + A.h - w1 : A.y, w: A.w - off, h: 0 }, true); else bPlace(B, l, t.lines, { x: far ? A.x + A.w - w1 : A.x, y: A.y + off, w: w0, h: 0 }, false); }
    return true;
  } },

  { id: 'center', w: 6, face: ['lightSerif', 'oldSerif', 'serif', 'heavySerif'], ok: B => B.cjk && B.N >= 110 && B.hero && B.hero.units.length >= 3 && B.hero.units.length <= 11 && B.paras.length >= 3, run(B){
    // 中轴：一句站在当中，前文从右上来，后文往左下去
    const { R, P, maybe, pal, A, u } = B, hu = B.hero.units, z = Math.min(A.h * R(.6, .9) / B.colLen(hu, 'hero', .12), A.w * R(.11, .17)), gap = z * R(.55, .9), side = (A.w - z) / 2 - gap, at = B.hero.title ? B.N / 2 : B.hero.units[0].at; let a = B.paras.filter(p => p.at + p.t.length <= at), b = B.paras.filter(p => p.at + p.t.length > at); if (!a.length || !b.length || a.length < b.length / 3 || b.length < a.length / 3){ const k = Math.ceil(B.paras.length / 2); a = B.paras.slice(0, k); b = B.paras.slice(k); }
    const hh = A.h * (B.N > 220 ? R(.86, .95) : R(.62, .86)), role = bRole(B), gp = B.N > 220 ? .25 : .5, ld = B.N > 220 ? 1.62 : 1.8, got = bFit(34, 21, s => { const p = bStack(B, a, hh, s, { v: true, lead: ld, gap: gp, style: role }), q = bStack(B, b, hh, s, { v: true, lead: ld, gap: gp, style: role }); return p.flow <= side && q.flow <= side ? { s, p, q } : null; }); if (!got || z < got.s * 1.7) return false;
    const l = B.layer('body', { read: true }), dy = A.h - hh; bPlace(B, l, got.p.lines, { x: A.x + A.w - side, y: A.y, w: side, h: hh }, true); bPlace(B, l, got.q.lines, { x: A.x, y: A.y + dy, w: side, h: hh }, true);
    B.col(B.layer('hero', { quiet: true }), hu, A.x + A.w / 2, A.y + (A.h - B.colLen(hu, 'hero', .12) * z) * P([.5, .5, .3]), z, { gap: .12, c: pal.i });
    return true;
  } },

  { id: 'initial', w: 5, face: ['oldSerif', 'heavySerif', 'lightSerif', 'serif'], ok: B => B.cjk && B.N >= 100 && B.paras[0].n >= 10 && !B.core[0].latin && !B_PUNCT.test(B.paras[0].t[0]), run(B){
    // 首字：第一个字大到占五六行，整篇绕着它起头
    const { R, P, I, maybe, pal, A, u } = B, w = A.w * R(.7, 1), x = A.x + (A.w - w) * P([0, 1]), p0 = B.paras[0], cap = B.core[0], us = bUnits(p0.t).slice(1).map(q => ({ ...q, at: q.at + p0.at })), role = bRole(B), rest = B.paras.slice(1);
    for (let m = P([4, 5, 6]); m >= 3; m--) for (let s = 34; s >= 23; s--){
      const pitch = s * 1.85, capS = pitch * (m - 1) + s, lines = []; if (capS > w * .5) continue; let i = 0; for (; i < 60; i++) lines.push({ x0: i < m ? capS + s * .9 : 0, x1: w, y: i * pitch });
      const flow = bFlow(B, us, s, lines, 'body'); if (!flow) continue;
      // 第一段撑不满首字的高，后面几段接着绕
      let used = lines.filter(q => q.n).length, done = [...flow], next = 0; while (used < m && next < rest.length){ const q = rest[next++], ul = bUnits(q.t).map(k => ({ ...k, at: k.at + q.at })), ls = []; for (let j = used; j < 60; j++) ls.push({ x0: j < m ? capS + s * .9 : 0, x1: w, y: j * pitch }); const f = bFlow(B, ul, s, ls, 'body'); if (!f) break; done = done.concat(f); used += ls.filter(k => k.n).length; }
      const h1 = Math.max(m, used) * pitch, t = bStack(B, rest.slice(next), w, s, { lead: 1.85, gap: .6, style: role }), all = h1 + (rest.length > next ? s * .5 + t.flow : 0); if (all > A.h) continue;
      const y = A.y + (A.h - all) * P([0, .4, 1]), l = B.layer('body', { read: true }); for (const g of done) B.glyph(l, g.u, x + g.x, y + g.y + s / 2, s, { f: 'body', c: pal.i });
      bPlace(B, l, t.lines, { x, y: y + h1 + s * .5, w, h: 0 }, false); B.glyph(B.layer('hero', { read: true }), cap, x + capS / 2, y + capS / 2, capS, { c: P([pal.i, B.inkAccent]) });
      return true;
    }
    return false;
  } },

  { id: 'cascade', w: 6, face: ['serif', 'heavySerif', 'lightSerif', 'heavySans', 'sans'], ok: B => B.N >= 80 && B.paras.length >= 3, run(B){
    // 递降：第一句最大，一段比一段低下去（或者反过来，越说越响）
    const { R, P, maybe, pal, A } = B, up = maybe(.4), n = B.paras.length, q = R(.58, .72), w = A.w * R(.82, 1);
    for (const K of [3.6, 3, 2.5, 2, 1.7]){
      const k = i => Math.max(1, K * Math.pow(q, up ? n - 1 - i : i)), got = bFit(30, 22, s => { const t = bStack(B, B.paras, w, s, { lead: 1.75, gap: .55, style: (p, i) => k(i) > 1.02 ? { k: k(i), f: k(i) > 1.5 ? 'hero' : 'body', lead: k(i) > 1.5 ? 1.32 : 1.55 } : {} }); return t.flow <= A.h ? { s, ...t } : null; });
      if (!got || got.flow < A.h * .6) continue;
      const big = got.lines.filter(l => l.f === 'hero'); if (big.length > 7 || !big.length) continue;
      const y = A.y + (A.h - got.flow) * (up ? 1 : P([0, 0, .5])), h = B.layer('hero', { read: true, quiet: true, gentle: true }), l = B.layer('body', { read: true }); bPlace(B, h, big, { x: A.x, y, w, h: 0 }, false); bPlace(B, l, got.lines.filter(q => q.f !== 'hero'), { x: A.x, y, w, h: 0 }, false);
      return true;
    }
    return false;
  } },

  { id: 'develop', w: 7, face: ['serif', 'oldSerif', 'lightSerif', 'sans'], ok: B => B.N >= 90 && B.N <= 560, run(B){
    // 显影：全文铺满，都还淡着；只有那几句显了出来
    const { R, P, maybe, pal, A } = B, v = B.cjk && maybe(.45), keys = B.paras.filter(p => p === B.keyPara || (p.quote && maybe(.7)) || (p.i === B.paras.length - 1 && maybe(.5))), on = at => keys.some(p => at >= p.at && at < p.at + p.t.length), low = R(.4, .52), hit = maybe(.4) ? B.inkAccent : pal.i; if (keys.reduce((a, p) => a + p.n, 0) > B.N * .55) return false;
    for (let s = Math.round(Math.min(64, Math.sqrt(A.w * A.h / B.N) * .74)); s >= 23; s--){
      const pitch = s * 1.72, side = v ? A.h : A.w, n = Math.floor(((v ? A.w : A.h) - s) / pitch) + 1, lines = []; for (let i = 0; i < n; i++) lines.push({ x0: 0, x1: side, y: i * pitch });
      const got = bFlow(B, B.units, s, lines, 'body', .015); if (!got) continue;
      const used = got[got.length - 1].y + s, start = ((v ? A.w : A.h) - used) * P([0, .5]), l = B.layer('hero', { read: true, gentle: true, body: true, quiet: true });
      for (const g of got){ const k = on(g.u.at), o = { f: 'body', c: k ? hit : pal.i, a: k ? undefined : low }; if (v) B.glyph(l, g.u, A.x + A.w - start - g.y - s / 2, A.y + g.x, s, { ...o, r: g.u.latin ? Math.PI / 2 : 0, vp: true }); else B.glyph(l, g.u, A.x + g.x, A.y + start + g.y + s / 2, s, o); }
      return true;
    }
    return false;
  } },

  { id: 'steps2', w: 7, face: ['lightSerif', 'serif', 'sans', 'oldSerif'], ok: B => B.N >= 80 && B.paras.length >= 4, run(B){
    // 错段：一段一个落点，长短、远近跟着说话的口气；独句前后留一大口气
    const { R, P, I, maybe, pal, A } = B, col = A.w / 8, pat = P([[0, 2, 1, 3], [0, 0, 3, 1], [1, 3, 0, 2], [0, 3, 0, 4]]), rnds = B.paras.map(() => B.rnd()), role = P(['plain', 'plain', 'tone']);
    const got = bFit(38, 22, s => {
      let off = 0; const out = B.paras.map((p, i) => {
        const c = p.quote ? P2(rnds[i], [2, 3, 3]) : p.short ? P2(rnds[i], [0, 2, 4]) : pat[i % 4] % 3, w = Math.min(A.w - col * c, p.short ? A.w : col * (p.n > 60 ? 6 : 5)), t = bStack(B, [p], w, s, { lead: 1.78, style: () => ({ a: role === 'tone' && !p.quote && !p.short && p !== B.keyPara ? .62 : 1, ...(p === B.keyPara ? { k: 1.42, f: 'hero', lead: 1.5 } : {}) }) });
        if (t.cross > A.w - col * c + 1) return null; if (i) off += (p.short || p === B.keyPara || B.paras[i - 1].short ? 1.7 : 1.25) * s; const at = off; off += t.flow; return { x: A.x + col * c, at, t }; });
      return out.every(Boolean) && off <= A.h ? { s, out, flow: off } : null;
    }); if (!got) return false;
    const l = B.layer('body', { read: true }), room = A.h - got.flow, gap = Math.min(room / Math.max(1, got.out.length - 1), got.s * .8); let y = A.y + (room - gap * (got.out.length - 1)) * P([0, .4, 1]);
    got.out.forEach((q, i) => bPlace(B, l, q.t.lines, { x: q.x, y: y + q.at + gap * i, w: 0, h: 0 }, false));
    return true;
  } },

  { id: 'aside', w: 6, face: ['lightSerif', 'oldSerif', 'serif'], ok: B => B.cjk && B.N >= 130 && B.clauses.filter(c => c.n >= 3 && c.n <= 10).length >= 3, run(B){
    // 边注：正文一栏，旁边空着的那一栏里，有人用大一号的轻声把几句又念了一遍
    const { R, P, maybe, pal, A, u } = B, right = maybe(.6), w = A.w * R(.5, .56), mx = right ? A.x : A.x + w + 64 * u, mw = A.w - w - 64 * u, x = right ? A.x + A.w - w : A.x;
    const got = bFit(32, 22, s => { const t = bStack(B, B.paras, w, s, { lead: 1.82, gap: .7 }); return t.flow <= A.h ? { s, ...t } : null; }); if (!got || got.flow < A.h * .5) return false;
    const y = A.y + (A.h - got.flow) * P([0, 1]), l = B.layer('body', { read: true }); bPlace(B, l, got.lines, { x, y, w, h: 0 }, false);
    const z = Math.min(got.s * R(1.5, 2.1), 64 * u), h = B.layer('hero', { quiet: true }), v = maybe(.55), pick = B.clauses.filter(c => c.n >= 3 && c.n <= 10 && (v || B.emOf(c.units) * z <= mw * 1.02) && bJudge(B.text, c) >= .9), step = got.flow / 3.4; let next = A.y, put = 0, vx = 0;
    for (const c of pick){
      const ln = got.lines.find(q => q.at <= c.at && c.at < q.at + q.t.length); if (!ln) continue; const cy = y + ln.off; if (cy < next) continue; if (put && B.rnd() < .25) continue;
      if (v){ const len = B.colLen(c.units, 'hero', .1) * z; if (cy + len > A.y + A.h + 4) continue; B.col(h, bPoints(B, c.units), right ? mx + mw - z * .6 - vx : mx + z * .6 + vx, cy, z, { gap: .1, c: pal.i, a: put % 2 ? .5 : undefined }); vx = vx ? 0 : Math.min(mw - z * 1.4, z * 1.8); next = cy + Math.min(step, len * .75); }
      else { B.row(h, bPoints(B, c.units), right ? mx + mw - B.emOf(c.units) * z : mx, cy + z * .5, z, { align: 'left', c: pal.i, a: put % 2 ? .5 : undefined }); next = cy + Math.max(step * .8, z * 2); }
      if (++put >= 4) break;
    }
    return put >= 2;
  } },

  { id: 'silence', w: 6, face: ['lightSerif', 'serif', 'lightSans', 'oldSerif'], ok: B => B.N >= 80 && B.N <= 420, run(B){
    // 静：字都退到一角，小而匀；余下的一大片，是它没说的
    const { R, P, maybe, pal, A, u } = B, v = B.cjk && maybe(.5), w = A.w * R(.46, .6), h = A.h * R(.44, .6), many = B.N > 220, got = bFit(28, 21, s => { const t = bStack(B, B.paras, v ? h * (many ? 1.1 : 1) : w * (many ? 1.15 : 1), s, { v, lead: many ? 1.66 : 1.9, gap: many ? .3 : .5 }); return t.flow <= (v ? w * (many ? 1.55 : 1.25) : h * (many ? 1.42 : 1.15)) ? { s, ...t } : null; }); if (!got) return false;
    const bw = v ? got.flow : got.cross, bh = v ? got.cross : got.flow, cx = P([0, 1]), cy = P([0, 1, 1]), x = A.x + (A.w - bw) * cx, y = A.y + (A.h - bh) * cy; if (bw > A.w || bh > A.h * .8) return false;
    bPlace(B, B.layer('body', { read: true }), got.lines, { x, y, w: bw, h: bh }, v);
    const hu = B.hero ? B.hero.units : null; if (!hu || hu.length < 2 || maybe(.15)) return true;
    const z = Math.min(got.s * R(1.6, 2.6), A.w * .8 / B.emOf(hu, 'hero', .3)), l = B.layer('hero', { quiet: true }), up = cy === 1; if (z < got.s * 1.3) return true;
    B.row(l, hu, cx ? A.x : A.x + A.w - B.emOf(hu, 'hero', .3) * z, up ? A.y + z / 2 : A.y + A.h - z / 2, z, { align: 'left', gap: .3, c: pal.i });
    return true;
  } },

  { id: 'ledger', w: 4, face: ['heavySans', 'sans', 'serif', 'lightSerif'], ok: B => B.paras.length >= 4 && B.paras.length <= 18 && B.N >= 70, run(B){
    // 条目：一段一格，细线隔开，左边一列是序；瑞士人的账本
    const { R, P, maybe, pal, A, u } = B, nc = A.w * R(.12, .2), w = A.w - nc, cn = [...'一二三四五六七八九十'], num = i => B.cjk ? (i < 10 ? cn[i] : '十' + cn[i - 10]) : String(i + 1), hu = B.hero && maybe(.7) ? B.hero.units : null, z = hu ? Math.min(A.w / B.emOf(hu), A.h * .13, 120 * u) : 0, top = hu ? z * 1.5 : 0;
    const got = bFit(32, 22, s => { let off = 0; const pad = s * (B.paras.length > 9 ? .42 : .62), rows = B.paras.map(p => { const t = bStack(B, [p], w, s, { lead: 1.7 }), y = off + pad; off += t.flow + pad * 2; return { t, y }; }); return off <= A.h - top ? { s, rows, h: off } : null; }); if (!got) return false;
    const l = B.layer('body', { read: true }), d = B.layer('deco'), extra = Math.min((A.h - top - got.h) / got.rows.length, got.s * 1.1), y0 = A.y + top + (A.h - top - got.h - extra * got.rows.length) * (hu ? 1 : P([0, 1]));
    got.rows.forEach((r, i) => { const y = y0 + r.y + extra * i; d.ops.push({ k: 'r', x: A.x, y: y - got.s * (B.paras.length > 9 ? .42 : .62) - extra / 2, w: A.w, h: 1.1, c: bAlpha(pal.i, .5) }); bPlace(B, l, r.t.lines, { x: A.x + nc, y, w, h: 0 }, false); B.row(d, [...num(i)].map(t => ({ t })), A.x, y + got.s * .5, got.s * .66, { f: 'meta', align: 'left', c: pal.i, a: .7 }); });
    if (hu) B.row(B.layer('hero'), hu, A.x - z * .03, A.y + z / 2, z, { align: 'left', c: pal.i });
    return true;
  } },

  { id: 'swell', w: 5, face: ['serif', 'sans', 'heavySerif'], ok: B => B.cjk && B.N >= 90 && B.N <= 480, run(B){
    // 起潮：一行行都撑到两边，字从小涨到大，又落回去
    const { R, P, maybe, pal, A } = B, us = B.units, kind = P(['up', 'down', 'tide', 'ebb']), curve = t => kind === 'up' ? t : kind === 'down' ? 1 - t : kind === 'tide' ? Math.sin(t * Math.PI) : 1 - Math.sin(t * Math.PI), ratio = R(1.9, 3);
    const build = base => {
      const rows = []; let i = 0, h = 0; const NP = Math.max(1, us.length);
      while (i < us.length){
        const t = i / NP, s0 = base * (1 + (ratio - 1) * curve(t)), cap = A.w / s0, row = []; let w = 0;
        while (i < us.length && (w + B.em(us[i].t, 'body') <= cap || !row.length)){ w += B.em(us[i].t, 'body'); row.push(us[i]); i++; }
        while (i < us.length && us[i].punct && NO_START.includes(us[i].t[0])){ w += B.em(us[i].t, 'body'); row.push(us[i]); i++; }
        const tail = row[row.length - 1]; if (i < us.length && tail.punct && NO_END.includes(tail.t) && row.length > 2){ row.pop(); i--; w -= B.em(tail.t, 'body'); }
        const s = i >= us.length && w < cap * .72 ? s0 : A.w / w; rows.push({ row, s }); h += s * (1.3 + .25 * Math.min(1, 30 / s));
      }
      return { rows, h };
    };
    let lo = 14, hi = 80, best = null; for (let k = 0; k < 18; k++){ const m = (lo + hi) / 2, r = build(m); if (r.h <= A.h){ best = r; lo = m; } else hi = m; }
    if (!best || best.h < A.h * .82 || Math.min(...best.rows.map(r => r.s)) < 21) return false;
    const l = B.layer('hero', { read: true, gentle: true, body: true, quiet: true }), key = maybe(.5), on = q => key && q.at >= B.keyPara.at && q.at < B.keyPara.at + B.keyPara.t.length; let y = A.y;
    best.rows.forEach(({ row, s }) => { const p = s * (1.3 + .25 * Math.min(1, 30 / s)); B.row(l, row, A.x, y + s * .55, s, { f: 'body', align: 'left', c: pal.i }); if (key) l.ops.slice(-row.length).forEach(o => { if (on(o)) o.c = B.inkAccent; }); y += p; });
    return true;
  } },

  { id: 'strophe', w: 6, face: ['lightSerif', 'serif', 'oldSerif'], ok: B => B.cjk && B.N >= 70 && B.N <= 380 && B.clauses.length >= 8 && B.clauses.length <= 36, run(B){
    // 分行：一小句一行，一段一节；主句那一行忽然站了出来
    const { R, P, maybe, pal, A } = B, v = maybe(.5), side = v ? A.h : A.w, flow = v ? A.w : A.h, key = B.keyPara, parts = B.paras.map((p, i) => ({ p, ls: B.clauses.filter(c => c.at >= p.at && c.at < p.at + p.t.length).flatMap(c => c.n > 16 ? B.split(c.full, 2) : [c.full]), ind: [0, 1.5, 0, 3, 1][i % 5] * (maybe(.8) ? 1 : 0) })).filter(q => q.ls.length), len = (us, f) => v ? B.colLen(us, f) : B.emOf(us, f), rows = parts.reduce((a, q) => a + q.ls.length, 0);
    for (let s = 40; s >= 21; s--){
      const pitch = s * 1.56, k = Math.min(2.1, side * .9 / (s * Math.max(...parts.filter(q => q.p === key).flatMap(q => q.ls).map(l => len(l, 'hero'))))), total = parts.reduce((a, q) => a + q.ls.length * (q.p === key ? s * k * 1.4 : pitch) + s * .95, 0); if (k < 1.25 || total > flow || parts.some(q => q.p !== key && q.ls.some(l => (len(l, 'body') + q.ind) * s > side))) continue;
      const b = B.layer('body', { read: true }), h = B.layer('hero', { read: true, quiet: true, gentle: true }); let o = (flow - total) * P([0, .4]);
      for (const q of parts){ const big = q.p === key, z = big ? s * k : s, st = big ? z * 1.4 : pitch; for (const us of q.ls){ const l = big ? h : b, f = big ? 'hero' : 'body', i = big ? 0 : q.ind * s; if (v) B.col(l, us, A.x + A.w - o - st / 2, A.y + i, z, { f, c: pal.i, vp: true }); else B.row(l, us, A.x + i, A.y + o + st / 2, z, { f, align: 'left', c: pal.i }); o += st; } o += s * .95; }
      return true;
    }
    return false;
  } },
];
const P2 = (r, a) => a[Math.floor(r * a.length)];
BLIND_COMPS.push(...BLIND_LONG);
for (const c of BLIND_LONG){ c.long = true; c.warm = true; c.dup = true; c.modes = ['left', 'right', 'left', 'corners', 'center']; }
