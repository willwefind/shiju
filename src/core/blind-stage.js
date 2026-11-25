// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ③ 台面：尺、格、摆字的手
// ════════════════════════════════════════════════════════════════════
// B 的坐标是版面像素（1080×1350），设备像素在效果层才乘 DPR。
// 一个字的 op：{ k:'g', t, x, y, s, r, f, c, cell?, fit?, at, src }
//   at/src ＝ 它是原文（或标题）里的第几个字。人选中改样式的时候，靠它找到画面上的是哪一个 ——
//   样式在排完之后才盖上去（blindStyle），所以改几个字，版面一动不动。
function blindStage(st, S, rnd, pal, fonts, mk, margin = .056){
  const W = S.w, H = S.h, M = Math.round(Math.min(W, H) * margin);
  const ctx = (mk || newMeasure)();
  const R = (a, b) => a + (b - a) * rnd();
  const I = (a, b) => Math.floor(R(a, b + 1));
  const P = arr => arr[Math.floor(rnd() * arr.length)];
  const maybe = p => rnd() < p;
  const B = { st, W, H, M, u: Math.min(W, H) / 1080, rnd, R, I, P, maybe, pal, fonts: { ...fonts }, layers: [], items: [],
              dark: relLum(hex2rgb(pal.g)) < .3 };

  const emCache = new Map();
  B.em = (t, f = 'hero') => {
    if (!/[ -~]/.test(t)) return [...t].length;
    const k = f + B.fonts[f] + t;
    if (!emCache.has(k)){ ctx.font = bFont(B, f, 100); emCache.set(k, ctx.measureText(t).width / 100); }
    return emCache.get(k);
  };
  // 一串单位的总宽（em）。gap 是字间距（em）
  B.emOf = (units, f = 'hero', gap = 0) => units.reduce((a, x, i) => a + B.em(x.t, f) + (i ? gap + (x.sp ? .28 : 0) : 0), 0);
  B.layer = (role, o = {}) => { const l = { role, ops: [], fx: [], ...o }; B.layers.push(l); return l; };
  // u 可以是一个单位（带着原文下标），也可以就是一个字符串
  B.glyph = (l, u, x, y, s, o = {}) => { const op = { k: 'g', t: u.t || u, x, y, s, f: 'hero', ...(u.at !== undefined ? { at: u.at, src: u.src || 'text' } : {}), ...o }; l.ops.push(op); return op; };

  // 横着放一串，cx 是中心（align:'left' 时是左边）
  B.row = (l, units, x, y, s, { f = 'hero', gap = 0, align = 'center', ...o } = {}) => {
    const w = B.emOf(units, f, gap) * s;
    let px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    units.forEach((u, i) => {
      if (i) px += (gap + (u.sp ? .28 : 0)) * s;
      const ew = B.em(u.t, f) * s;
      B.glyph(l, u, px + ew / 2, y, s, { f, ...o });
      px += ew;
    });
    return w;
  };
  // 竖着放一串，从 top 往下；西文整词转 90°
  B.colLen = (units, f = 'hero', gap = 0) => units.reduce((a, x, i) => a + (x.latin ? B.em(x.t, f) : 1) + (i ? gap + (x.sp ? .25 : 0) : 0), 0);
  B.col = (l, units, x, top, s, { f = 'hero', gap = 0, ...o } = {}) => {
    let py = top;
    units.forEach((u, i) => {
      if (i) py += (gap + (u.sp ? .25 : 0)) * s;
      const len = (u.latin ? B.em(u.t, f) : 1) * s;
      B.glyph(l, u, x, py + len / 2, s, { f, r: u.latin ? Math.PI / 2 : 0, ...o });
      py += len;
    });
    return py - top;
  };
  // 拉伸着放：一串字撑满一个矩形（横着排）。每个字按字框拉，「一」不会被拉成一堵墙
  B.fill = (l, units, x, y, w, h, { f = 'hero', pad = 0, ...o } = {}) => {
    const em = B.emOf(units, f, 0); let px = x;
    units.forEach((u, i) => {
      if (i && u.sp) px += .28 / em * w;
      const cw = B.em(u.t, f) / em * w;
      B.glyph(l, u, px + cw / 2, y + h / 2, 100, { f, cell: [Math.max(4, cw - pad * 2), Math.max(4, h)], ...o });
      px += cw;
    });
  };
  // 同上，竖着撑满
  B.fillCol = (l, units, x, y, w, h, { f = 'hero', pad = 0, ...o } = {}) => {
    const n = B.colLen(units, f); let py = y;
    units.forEach(u => {
      const len = (u.latin ? B.em(u.t, f) : 1) / n * h;
      B.glyph(l, u, x + w / 2, py + len / 2, 100, u.latin ? { f, r: Math.PI / 2, cell: [len - pad * 2, w], ...o } : { f, cell: [w, Math.max(4, len - pad * 2)], ...o });
      py += len;
    });
  };
  // 词缝：大字、诗行断开的时候，不许断在一个词当中
  let seams = null;
  const isSeam = u => { if (u.at === undefined || u.src === 'title') return true; if (!seams){ seams = new Set(); try { for (const s of new Intl.Segmenter('zh', { granularity: 'word' }).segment(B.text)) seams.add(s.index); } catch { return true; } } return seams.has(u.at) && !'着了过的地得们吗呢吧啊'.includes(u.t); };
  // 拆成差不多齐的几行
  B.split = (units, n) => {
    const out = [], total = B.emOf(units); let cur = [], acc = 0;
    const at = [0]; for (const u of units) at.push(at[at.length - 1] + B.em(u.t));
    const cuts = []; for (let k = 1; k < n; k++){ let best = -1, cost = 1e9; for (let i = (cuts[cuts.length - 1] || 0) + 1; i < units.length; i++){ const c = Math.abs(at[i] - total * k / n) + (isSeam(units[i]) && !units[i].punct ? 0 : 1.7); if (c < cost){ cost = c; best = i; } } if (best > 0) cuts.push(best); }
    units.forEach((u, i) => { if (cuts.includes(i)){ out.push(cur); cur = []; } cur.push(u); });
    out.push(cur);
    return out;
  };

  // 正文块：在框里找一个最大的、放得下全文的字号。放不下返回 null。
  // 折行走拾句自己的 buildItems（避头尾、段落都在里头）。
  B.body = (x, y, w, h, { vertical = false, max = 34, min = 22, va = 'top', ha, align = 'left', c = pal.i, layer } = {}) => {
    if (B.solo) return { x, y, w, h: 0, s: max };                   // 就这么一句，主角就是全文，不必再抄一遍
    // 短的、有好几小句的，按诗排：一句一行，长句在词缝里折，行首错落
    if (B.verse === undefined) B.verse = B.cjk && B.N <= 100 && B.clauses.length >= 2 && B.clauses.length <= 10 && (B.verseRnd || rnd)() < .8 ? bP(B.verseRnd || rnd, ['flush', 'stair', 'loose', 'loose', 'hang']) : '';
    if (B.verse && w >= 90 && h >= 50){ const got = B.verseBody(x, y, w, h, { vertical, max: Math.round(max * 1.12), min, va, ha, align, c, layer }); if (got) return got; }
    const text = B.text, flowOf = items => items.reduce((a, it) => a + it.h, 0);
    const tryAt = (s, side) => {
      ctx.font = `${s}px ${B.fonts.body}`;
      const { items } = buildItems(ctx, text, side, s, vertical, null), flow = flowOf(items);
      return flow <= (vertical ? w : h) + s * .7 ? { s, items, flow } : null;
    };
    if (w < 90 || h < 50) return null;
    if (B.warm) max = Math.round(max * 1.14);
    if (B.N > 130) min = Math.max(min, 22);
    if (B.minBody && B.N < 150){ min = Math.max(min, Math.min(B.minBody, 34)); max = Math.max(max, min + 8); }      // 整张要过油画、旋焦的，小字撑不住
    const side0 = vertical ? h : w;
    let lo = min, hi = max, got = null;
    while (lo <= hi){ const mid = (lo + hi) >> 1, r = tryAt(mid, side0); if (r){ got = r; lo = mid + 1; } else hi = mid - 1; }
    if (!got) return null;
    // 末行只剩一两个字：先把版口收窄一点，不行就字号小一点
    const tailOk = items => { const rows = items.filter(it => !it.gap); return rows.length < 2 || bUnits(rows[rows.length - 1].text).filter(q => !q.punct).length > 2; };
    if (text.length < 420 && !tailOk(got.items))
      search: for (let s = got.s; s >= Math.max(min, got.s - 5); s--) for (let k = 0; k < 8; k++){
        const r = tryAt(s, side0 * (1 - .03 * k)); if (r && tailOk(r.items)){ got = r; break search; }
      }
    const { s, items, flow } = got, l = layer || B.layer('body', { read: true });
    l.read = true;
    let cross = 0;
    for (const it of items) if (!it.gap){
      ctx.font = `${s}px ${B.fonts.body}`;
      it.len = vertical ? vAdvance(ctx, it.text, s) : ctx.measureText(it.text).width;
      cross = Math.max(cross, it.len);
    }
    if (vertical){
      let px = (ha === 'left' ? x + flow : ha === 'center' ? x + (w + flow) / 2 : x + w);
      const y0 = va === 'bottom' ? y + h - cross : va === 'mid' ? y + (h - cross) / 2 : y, right = px;
      for (const it of items){ px -= it.h; if (!it.gap) l.ops.push({ k: 'v', t: it.text, at: it.at, src: 'text', x: px, y: y0, s, len: it.len, c }); }
      return { x: px, y: y0, w: right - px, h: cross, s, layer: l };
    }
    const used = flow - s * .72, x0 = ha === 'right' ? x + w - cross : ha === 'center' ? x + (w - cross) / 2 : x;
    let py = va === 'bottom' ? y + h - used : va === 'mid' ? y + (h - used) / 2 : y;
    const y0 = py;
    for (const it of items){
      if (!it.gap) l.ops.push({ k: 'l', t: it.text, at: it.at, src: 'text', x: x0 + alignOffset(align, cross, it.len), y: py, s, len: it.len, c });
      py += it.h;
    }
    return { x: x0, y: y0, w: cross, h: used, s, layer: l };
  };

  B.verseBody = (x, y, w, h, { vertical, max, min, va, ha, align, c, layer }) => {
    if (B.minBody){ min = Math.max(min, Math.min(B.minBody, 34)); max = Math.max(max, min + 10); }
    const side = vertical ? h : w, cross = vertical ? w : h, parts = [];
    for (const m of B.text.matchAll(/[^，。；、：！？!?…\n]+[，。；、：！？!?…]*[”」』）’]*/g)){ const raw = m[0], t = raw.trim().replace(/[，。；、：]+$/, ''); if (t) parts.push({ t, at: m.index + raw.length - raw.trimStart().length }); }
    const wid = t => bUnits(t).reduce((a, u) => a + (u.latin ? B.em(u.t, 'body') : 1), 0);
    const cut = (p, most) => {
      if (wid(p.t) <= most) return [p];
      const us = bUnits(p.t), n = Math.ceil(wid(p.t) / most), rows = B.split(us.map(u => ({ ...u, at: u.at + p.at })), n);
      return rows.map((r, i) => { const a = r[0].at - p.at, b = i + 1 < rows.length ? rows[i + 1][0].at - p.at : p.t.length; return { t: p.t.slice(a, b).trimEnd(), at: p.at + a }; });
    };
    const lead = P([1.75, 1.95, 2.2]), sd = rnd();
    for (const most of [13, 10, 8, 7]){
      const lines = parts.flatMap(p => cut(p, most)), n = lines.length; if (n < 2) return null;
      const ind = lines.map((_, i) => B.verse === 'stair' ? i * 1.5 : B.verse === 'hang' ? (i ? 2 : 0) : B.verse === 'loose' ? Math.floor((Math.sin(i * 12.9898 + sd * 78.233) * 43758.5453 % 1 + 1) % 1 * 5) : 0), long = Math.max(...lines.map((l, i) => wid(l.t) + ind[i]));
      const s = Math.floor(Math.min(max, side / long, cross / (n * lead - (lead - 1)))); if (s < min) continue;
      const l = layer || B.layer('body', { read: true }); l.read = true;
      const pitch = s * lead, flow = pitch * n - s * (lead - 1), sz = long * s; ctx.font = `${s}px ${B.fonts.body}`;
      if (vertical){
        let px = ha === 'left' ? x + flow : ha === 'center' ? x + (w + flow) / 2 : x + w; const right = px, y0 = va === 'bottom' ? y + h - sz : va === 'mid' ? y + (h - sz) / 2 : y;
        lines.forEach((q, i) => { l.ops.push({ k: 'v', t: q.t, at: q.at, src: 'text', x: px - s, y: y0 + ind[i] * s, s, len: vAdvance(ctx, q.t, s), c }); px -= pitch; });
        return { x: right - flow, y: y0, w: flow, h: sz, s, layer: l };
      }
      const x0 = ha === 'right' ? x + w - sz : ha === 'center' ? x + (w - sz) / 2 : x, y0 = va === 'bottom' ? y + h - flow : va === 'mid' ? y + (h - flow) / 2 : y;
      lines.forEach((q, i) => { const len = ctx.measureText(q.t).width; l.ops.push({ k: 'l', t: q.t, at: q.at, src: 'text', x: x0 + (B.verse === 'flush' ? alignOffset(align, sz, len) : ind[i] * s), y: y0 + pitch * i, s, len, c }); });
      return { x: x0, y: y0, w: sz, h: flow, s, layer: l };
    }
    return null;
  };

  // 小字：题头、出处、日期（还有没当上主角的标题）。它们是版面的一部分 —— 钉在格子上的几枚钉子。
  B.metaItems = () => {
    const out = [];
    if (st.showHeader && (st.headText || '').trim()) out.push({ t: st.headText.trim(), id: 'head' });
    if (st.showDate && (st.date || '').trim()) out.push({ t: st.date.trim(), id: 'date' });
    if (st.showSource && (st.source || '').trim()) out.push({ t: ((st.sourcePrefix || '') + st.source).trim(), id: 'src' });
    if ((st.title || '').trim() && !B.titleUsed) out.push({ t: st.title.trim(), id: 'title' });
    return out;
  };
  const MS = 18 * B.u;
  // mode：corners 四角 ／ top 顶上一行 ／ foot 底下一行 ／ side 侧边竖着
  B.metaRoom = mode => {
    const n = B.metaItems(); if (!n.length) return { t: M, b: M };
    const line = M + MS * 1.9;
    if (mode === 'top') return { t: line + MS * .6, b: M };
    if (mode === 'foot') return { t: M, b: line + MS * .6 };
    if (mode === 'side') return { t: M, b: M };
    if (['left', 'right', 'center'].includes(mode)) return { t: n.some(i => i.id === 'head') ? line : M, b: M + MS * (1.5 * n.filter(i => i.id !== 'head').length + .5) };
    return { t: n.some(i => i.id === 'head' || i.id === 'date') ? line : M, b: n.some(i => i.id === 'src' || i.id === 'title') ? line : M };
  };
  B.placeMeta = mode => {
    const items = B.metaItems(); if (!items.length) return;
    const l = B.layer('meta'), on = B.metaOn || {}, soft = bMix(pal.g, pal.i, .82), MX = B.metaBox ? B.metaBox.x : M, MW = B.metaBox ? B.metaBox.w : W - M * 2;
    const put = (it, x, y, align, maxW, c) => {
      let s = MS; ctx.font = bFont(B, 'meta', s); let len = ctx.measureText(it.t).width;
      if (len > maxW){ s = Math.max(12.5, s * maxW / len); ctx.font = bFont(B, 'meta', s); len = ctx.measureText(it.t).width; }
      l.ops.push({ k: 'l', t: it.t, f: 'meta', x: align === 'right' ? x - len : x, y, s, len, c: c || (it.id === 'title' ? pal.i : soft) });
    };
    const top = M * .86, bot = H - M * .86 - MS * 1.05;
    if (mode === 'side'){
      const t = items.map(i => i.t.replace(/^—— ?/, '')).join('　　'); let s = MS * .95;
      ctx.font = bFont(B, 'meta', s); let len = ctx.measureText(t).width; if (len > H - M * 2){ s *= (H - M * 2) / len; len = H - M * 2; }
      B.glyph(l, t, W - M * .46, M + len / 2, s, { f: 'meta', r: Math.PI / 2, c: on.side || soft, len });
      return;
    }
    if (['left', 'right', 'center'].includes(mode)){
      // 题头在上；标题、出处、日期叠在下头，一行一件
      const x = mode === 'left' ? MX : mode === 'right' ? MX + MW : 0, al = mode === 'right' ? 'right' : 'left', low = ['title', 'src', 'date'].map(id => items.find(i => i.id === id)).filter(Boolean), head = items.find(i => i.id === 'head');
      if (head) put(head, mode === 'center' ? MX : x, top, al, MW * .5, on.top);
      low.forEach((it, i) => { const y = bot - MS * 1.5 * (low.length - 1 - i); if (mode === 'center'){ ctx.font = bFont(B, 'meta', MS); const len = Math.min(MW, ctx.measureText(it.t).width); put(it, MX + (MW - len) / 2, y, 'left', MW, on.bot); } else put(it, x, y, al, MW * .7, on.bot); });
      return;
    }
    if (mode === 'top' || mode === 'foot'){
      // 一行里按格子排开：第一件靠左，最后一件靠右，中间的落在列线上
      const y = mode === 'top' ? top : bot, n = items.length;
      items.forEach((it, i) => put(it, n === 1 ? MX : MX + MW * [0, n === 2 ? 1 : n === 3 ? .5 : .34, n === 3 ? 1 : .67, 1][i], y, i && i === n - 1 ? 'right' : 'left', MW / n - 14, on[mode]));
      return;
    }
    for (const it of items){
      if (it.id === 'head') put(it, MX, top, 'left', MW * .45, on.top);
      if (it.id === 'date') put(it, MX + MW, top, 'right', MW * .45, on.top);
      if (it.id === 'src') put(it, MX, bot, 'left', MW * .6, on.bot);
      if (it.id === 'title') put(it, MX + MW, bot, 'right', MW * .36, on.bot);
    }
  };
  B.ctx = ctx;
  return B;
}
const bFont = (B, f, s) => `${(B.fonts[f + 'W'] || '')}${s}px ${B.fonts[f] || B.fonts.body}`;

// 不等宽的一叠行：把单位按顺序灌进去。灌不完返回 null。
function bFlow(B, units, s, lines, f = 'body', gap = 0){
  const out = []; let i = 0;
  for (const ln of lines){
    let x = ln.x0, n = 0;
    while (i < units.length){
      const u = units[i], w = (B.em(u.t, f) + gap + (n && u.sp ? .28 : 0)) * s;
      const hang = u.punct && NO_START.includes(u.t[0]);
      if (n && x + w > ln.x1 + (hang ? s * .7 : .5)){
        // 句读不站行首：挂不住的，就把前一个字一起带下去
        while (n > 1 && units[i].punct && NO_START.includes(units[i].t[0])){ const back = out.pop(); i--; n--; x = back.x - B.em(back.u.t, f) * s / 2; }
        break;
      }
      if (!n && w > ln.x1 - ln.x0 + s * .4) break;                     // 这行窄得一个也放不下，空过去
      if (n && u.punct && NO_END.includes(u.t) && x + w * 2 > ln.x1) break;
      if (n && u.sp) x += .28 * s;
      const ew = B.em(u.t, f) * s;
      out.push({ u, x: x + ew / 2, y: ln.y, line: ln, i });
      x += ew + gap * s; i++; n++;
    }
    ln.n = n; ln.end = x;
    if (i >= units.length) return out;
  }
  return null;
}

