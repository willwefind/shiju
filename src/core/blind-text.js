// ════════════════════════════════════════════════════════════════════
//  9. 版式盲盒 ① 读字：断句、挑主角、挑字体、挑配色
// ════════════════════════════════════════════════════════════════════
// 盲盒 = 一颗种子 → 一张字体海报。同一颗种子、同一段字，永远拆出同一张，
// 所以能往回翻、能收藏。全部随机都走传进来的 rnd，别在这几个文件里碰 Math.random。
// 三条规矩（改的时候别破）：
//   1. 一个字都不丢 —— 每种构图排完要过 blindKeepsAll，漏字就作废换下一种；
//   2. 字上的效果只落在主字上，正文那一层不单独加工（整张修图的时候，它跟着一起过）；
//   3. 没有任何素材，也没有图形：盲盒只玩字。人想加图形，自己添。
const B_PUNCT = /^[\s，。、；：？！…—～·,.;:?!"'“”‘’「」『』（）()《》〈〉【】[\]–\-*#]+$/;

// 一段字拆成一个个「单位」：一个汉字算一个，一个英文词算一个。
function bUnits(str){
  const out = []; let at = 0, high = '';
  for (const tok of tokenize(str)){
    const t = high + tok, start = at - high.length;
    at += tok.length; high = '';
    if (/^[\uD800-\uDBFF]$/.test(tok)){ high = tok; continue; }     // 表情是两个半截，拼回一个
    if (/^\s+$/.test(t)) continue;
    const latin = /^[A-Za-z0-9]/.test(t), prev = out[out.length - 1];
    out.push({ t, at: start, latin, punct: B_PUNCT.test(t),
               sp: latin && !!prev && /\s/.test(str.slice(prev.at + prev.t.length, start)) });
  }
  return out;
}
// 断成一小句一小句。收尾的句号逗号扔掉（大字带着它们很难看），问叹省略留下。
function bClauses(text){
  const out = []; let cur = null;
  const close = () => { if (cur && cur.units.length) out.push(cur); cur = null; };
  let last = -1;
  for (const u of bUnits(text)){
    const gap = last >= 0 ? text.slice(last, u.at) : '';
    last = u.at + u.t.length;
    if (/\n/.test(gap)) close();
    if (u.punct){
      if (cur && /^[？！?!…]$/.test(u.t)) { cur.tail += u.t; }
      else if (cur && !/^[-'’·]$/.test(u.t)) close();
      continue;
    }
    if (cur && cur.tail) close();
    if (!cur) cur = { units: [], at: u.at, tail: '' };
    cur.units.push(u);
  }
  close();
  for (const c of out){
    c.n = c.units.length;
    c.t = c.units.map((u, i) => (i && u.sp ? ' ' : '') + u.t).join('');
    c.full = c.tail ? c.units.concat([...c.tail].map(t => ({ t, punct: true }))) : c.units;
  }
  return out;
}

const B_STOP = new Set([...'的了是在我你他她它们这那和与就也都不有没很又再把被让给到从向对于而且但或之其着过吗呢吧啊呀哦哪什么怎一个上下里来去说要会能可以还只才因为所以如果虽然已经自己什么时候没有我们你们他们']);
function bWords(text){
  const keep = [];
  try {
    const seg = new Intl.Segmenter('zh', { granularity: 'word' });
    for (const s of seg.segment(text)){
      const w = s.segment;
      if (!s.isWordLike || /^[A-Za-z0-9]/.test(w)) continue;
      const len = [...w].length;
      if (len < 1 || len > 2) continue;
      if ([...w].every(c => B_STOP.has(c))) continue;
      if (len === 1 && B_STOP.has(w)) continue;
      keep.push({ t: w, w: len === 2 ? 3 : 2 });
    }
  } catch {}
  return keep;
}
const B_THIN = '一二三十丁了人入八小不卜刁几儿乙厂';
const bDense = t => [...t].find(c => !B_THIN.includes(c)) || null;
function bWeighted(rnd, list){
  const sum = list.reduce((a, x) => a + (x.w || 1), 0);
  let r = rnd() * sum;
  for (const x of list){ r -= (x.w || 1); if (r <= 0) return x; }
  return list[list.length - 1];
}
// 这一小句单拎出来像不像话
function bJudge(src, c){
  const end = c.units[c.n - 1], a = src[c.at - 1] || '\n', b = src[end.at + end.t.length] || '\n'; let k = 1;
  if (a === '、' || b === '、') k *= .08;                                        // 列举里的一项，是半截话
  if (/[。！？!?…\n「『“]/.test(a) && /[。！？!?…\n」』”]/.test(b)) k *= 2.2;      // 自己就是完整的一句
  if (/[：:「『“]/.test(b)) k *= .12;                                             // 「它没有说」后头还有话
  if (/^[它他她这那]/.test(c.t)) k *= .7;
  if (/[「『“]/.test(src.slice(Math.max(0, src.lastIndexOf('\n', c.at - 1)), c.at))) k *= 1.8;   // 引语
  if (/^(而|却|但|并|也|又|且|因|所以|于是|如果|那么|虽|只是|甚至|尤其|反而|面对|来证明)/.test(c.t)) k *= .25;
  if (/(的|了|着|地|得|是|在|把|被|和|与|说|指出)$/.test(c.t)) k *= .35;
  if (src.length - end.at < src.length * .08) k *= 1.6;                           // 收尾那一句
  return k;
}
// 主角：你自己选中改过样式的字最优先，其次标题，其次正文里一小句。
function bHero(st, clauses, rnd){
  const cands = [];
  for (const sp of spansOfText(st.spans, st.text)) {
    const units = bUnits(sp.t).filter(u => !u.punct).map(u => ({ ...u, at: u.at + sp.at }));
    if (units.length >= 1 && units.length <= 12) cands.push({ t: sp.t, units, w: 14 });
  }
  const title = (st.title || '').trim();
  if (title){
    const units = bUnits(title).filter(u => !u.punct).map(u => ({ ...u, src: 'title' }));
    if (units.length && units.length <= 12) cands.push({ t: title, units, w: 5, title: true });
  }
  const src = st.text || '', many = clauses.length > 6, judge = c => many ? bJudge(src, c) : 1;
  for (const c of clauses)
    if (c.n >= 2 && c.n <= (many ? 12 : 10)) cands.push({ t: c.t, units: c.units, w: (c.n <= 7 ? 2 : many ? 1.5 : 1) * (c.n < 4 && many ? .5 : 1) * judge(c) });
  // 整句太长的，从句尾往回取几个词（「……肩上那一点没化的雪」取「没化的雪」）
  for (const c of clauses) if (c.n > 10 && (!many || bJudge(src, c) > 1.5)){      // 长文里只有引语、独句才值得从尾巴上取
    try {
      const ws = [...new Intl.Segmenter('zh', { granularity: 'word' }).segment(c.t)].map(q => q.segment).filter(q => q.trim()); let n = 0;
      for (let i = ws.length - 1; i > 0; i--){
        n += bUnits(ws[i]).length; if (n > 8) break;
        if (n >= 2 && !B_STOP.has(ws[i][0])) cands.push({ t: c.units.slice(-n).map((u, q) => (q && u.sp ? ' ' : '') + u.t).join(''), units: c.units.slice(-n), w: (n >= 3 && n <= 6 ? 2 : 1) * (many ? (n < 4 ? .15 : .6) : 1) });
      }
    } catch {}
  }
  if (!cands.length && clauses.length){
    const c = clauses.reduce((a, b) => (b.n < a.n ? b : a));
    cands.push({ t: c.units.slice(0, 8).map((u, q) => (q && u.sp ? ' ' : '') + u.t).join(''), units: c.units.slice(0, 8), w: 1 });
  }
  return cands.length ? bWeighted(rnd, cands) : null;
}
function spansOfText(spans, text){
  return marksToSpans(spansToMarks(spans, text.length)).map(s => { const raw = text.slice(s.s, s.e); return { t: raw.trim(), at: s.s + raw.length - raw.trimStart().length }; }).filter(s => s.t);
}

// ── 字体 ────────────────────────────────────────────────────────────
// 有的字库只收了常用字（或只收繁体），缺的字会悄悄落回宋体 —— 一句大字里混两款，
// 一眼就脏。所以挑之前真画出来比：跟系统宋体画得一模一样，就是它没有这个字。
const bGlyphCache = new Map(), B_CELL = 22;
let bBaseStrip = { key: '', data: null };
function bHasGlyphs(family, text){
  const chars = [...new Set(text)].filter(c => c >= '㐀' && c <= '鿿').slice(0, 160), todo = chars.filter(ch => !bGlyphCache.has(family + '\u0000' + ch));
  try {
    if (todo.length){
      const cv = PLATFORM.canvas(B_CELL * todo.length, B_CELL), c = cv.getContext('2d', { willReadFrequently: true }); if (!c.getImageData) return true;
      const strip = font => { c.clearRect(0, 0, cv.width, cv.height); c.font = font; c.textBaseline = 'top'; todo.forEach((ch, i) => { c.save(); c.beginPath(); c.rect(i * B_CELL, 0, B_CELL, B_CELL); c.clip(); c.fillText(ch, i * B_CELL + 1, 1); c.restore(); }); return c.getImageData(0, 0, cv.width, cv.height).data; };
      const key = todo.join(''), base = bBaseStrip.key === key ? bBaseStrip.data : strip(`20px ${SYS}`), got = strip(`20px "${family}",${SYS}`), row = cv.width * 4; bBaseStrip = { key, data: base };
      todo.forEach((ch, i) => { let diff = false; for (let y = 0; y < B_CELL && !diff; y++) for (let x = i * B_CELL * 4; x < (i + 1) * B_CELL * 4; x++) if (base[y * row + x] !== got[y * row + x]){ diff = true; break; } bGlyphCache.set(family + '\u0000' + ch, diff); });
    }
  } catch { return true; }
  return chars.every(ch => bGlyphCache.get(family + '\u0000' + ch));
}
// 海报上的字按「嗓门」分类，第三个数是分量；分量 0 的只是替补，前头的一款都没有才上。
// 🔑 老宋体（汇文、京華、活宋、朝華、南西、朱雀）是这套东西的体温。我一度嫌毛边把它们从
//    大字里剔了出去，只剩 Noto，海报一下子就冷了、刻板了。别再剔。
const B_TYPE = {
  heavySans : [['Noto Sans SC Black', '', 5], ['Source Han Sans SC Heavy', '', 4], ['思源黑体 CN Heavy', '', 4], ['ChillDuanHeiSongPro', '', 3], ['寒蝉端黑宋Pro', '', 3], ['HarmonyOS Sans SC Black', '', 2], ['MiSans Heavy', '', 2], ['PingFang SC', '600 ', 0], ['Microsoft YaHei', '700 ', 0], ['SimHei', '', 0]],
  lightSans : [['Noto Sans SC Thin', '', 3], ['Noto Sans SC Light', '', 2], ['Source Han Sans SC ExtraLight', '', 3], ['HarmonyOS Sans SC Thin', '', 2], ['PingFang SC', '200 ', 0], ['Microsoft YaHei Light', '', 0], ['DengXian Light', '', 0]],
  sans      : [['Noto Sans SC', '', 3], ['Noto Sans SC Medium', '', 1], ['Source Han Sans SC', '', 3], ['HarmonyOS Sans SC', '', 2], ['PingFang SC', '', 0], ['Microsoft YaHei', '', 0], ['DengXian', '', 0]],
  heavySerif: [['Noto Serif SC Black', '', 4], ['Source Han Serif SC Heavy', '', 4], ['ZhaohuaMinB Black', '', 3], ['ZhaohuaMinA', '', 2], ['KingHwaOldSong', '', 4], ['Huiwen-mincho', '', 3], ['NanxiYoumosong', '', 2], ['dingliesongtypeface', '', 2], ['ChillDuanHeiSongPro', '', 2], ['Noto Serif SC SemiBold', '', 1], ['Songti SC', '900 ', 0]],
  oldSerif  : [['KingHwaOldSong', '', 5], ['Huiwen-mincho', '', 5], ['NanxiYoumosong', '', 3], ['ChillHuoSong_F', '', 2], ['dingliesongtypeface', '', 1], ['Noto Serif SC Black', '', 1], ['Noto Serif SC SemiBold', '', 0], ['Songti SC', '900 ', 0]],      // 毛边就是它的好处：越大越要露出来
  lightSerif: [['Zhuque Fangsong (technical preview)', '', 4], ['Zhuque Fangsong (technical prev', '', 4], ['Huiwen-mincho', '', 4], ['Noto Serif SC Light', '', 2], ['Noto Serif SC ExtraLight', '', 2], ['ChillHuoSong_F', '', 2], ['ChillJinshuSong', '', 2], ['Songti SC', '300 ', 0], ['STSong', '', 0]],
  serif     : [['Huiwen-mincho', '', 6], ['KingHwaOldSong', '', 4], ['ChillHuoSong_F', '', 3], ['NanxiYoumosong', '', 2], ['Zhuque Fangsong (technical prev', '', 2], ['Noto Serif SC', '', 2], ['Noto Serif SC Medium', '', 2], ['Source Han Serif SC', '', 2], ['NanoOldSong-C', '', 1], ['Songti SC', '', 0], ['STSong', '', 0]],
};
const B_LATIN = ['georgia', 'garamond', 'constantia', 'palatino', 'baskerv', 'didot', 'fellEng', 'fellPica', 'elite'];
// 同一款字，系统里装的、嵌入方捆的，登记的名字不一样（Huiwen-mincho / Huiwen Mincho / 汇文明朝体）。
// 认得别名，不然阅读器里明明带着汇文明朝，盲盒也掷不到它
const bReal = fam => { if (hasFont(fam)) return fam; const f = FONTS.find(x => x.probes.includes(fam)); return (f && resolveFont(f)) || null; };
function bFace(cls, rnd, sample, lat = ''){
  const mine = /[sS]erif/.test(cls) ? myFontList().map(f => [f.id, '', 2]) : [], roll = rnd(), seen = new Set(), left = B_TYPE[cls].concat(mine).filter(f => f[2]).map(f => ({ f, w: f[2], real: bReal(f[0]) })).filter(q => q.real && !seen.has(q.real) && seen.add(q.real));
  let first = true;
  while (left.length){                                             // 先掷签再验字形，验不过再掷 —— 一次全验完要画几千个字
    const it = bWeighted(first ? () => roll : rnd, left); first = false;
    if (bHasGlyphs(it.real, sample)) return { stack: `${lat}"${it.real}",${SYS}`, w: it.f[1] || '', canon: it.f[0] };
    left.splice(left.indexOf(it), 1);
  }
  for (const [fam, w, k] of B_TYPE[cls]) if (!k && hasFont(fam) && bHasGlyphs(fam, sample)) return { stack: `${lat}"${fam}",${SYS}`, w: w || '', canon: fam };
  return { stack: lat + SYS, w: '', canon: '' };
}
// 垫在底下的淡字用干净的字形（它大过整张纸，毛边在那儿只显脏）。主角不许换：毛边就是要大到露出来
const B_READ = ['Huiwen-mincho', 'KingHwaOldSong', 'Zhuque Fangsong (technical prev', 'Zhuque Fangsong (technical preview)', 'ChillHuoSong_F', 'ChillJinshuSong', 'NanxiYoumosong', 'Noto Serif SC', 'Noto Serif SC Medium', 'Noto Serif SC Light', 'Noto Sans SC', 'Noto Sans SC Light', 'Source Han Serif SC'];      // 当正文也站得住的
const B_ROUGH = ['NanxiYoumosong', 'KingHwaOldSong', 'Huiwen-mincho', 'NanoOldSong-C', 'ChillHuoSong_F', 'ChillJinshuSong', 'dingliesongtypeface'];
function bClean(sample, thin){
  for (const fam of thin ? ['Noto Serif SC Light', 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC'] : ['Noto Serif SC Black', 'Source Han Serif SC Heavy', 'ZhaohuaMinB Black', 'Noto Serif SC', 'Songti SC']) if (hasFont(fam) && bHasGlyphs(fam, sample)) return `"${fam}",${SYS}`;
  return SYS;
}
function bFonts(st, rnd, text, heroText, own){
  if (own) return { own: true, hero: titleStack(st), body: fontStack(st.font, st.latinFont), meta: fontStack(st.font, st.latinFont), heroW: '' };
  const roll = [rnd(), rnd(), rnd(), rnd(), rnd(), rnd()], seq = k => { let n = 0; return () => (roll[k] + n++ * .618) % 1; };      // 先掷好：换一种方案不至于连正文字体也跟着跳
  const latins = B_LATIN.map(id => familyOf(id)).filter(Boolean), lat = latins.length ? `"${latins[Math.floor(roll[4] * latins.length)]}",` : '';
  const pair = cls => {
    // 配对的规矩：要么同一款（或同一家的粗细），要么差得远；两款差不多的老宋放一块最难看
    const serif = /[sS]erif/.test(cls), h = bFace(cls, seq(0), heroText, serif ? lat : ''), fam = h.canon, readable = B_READ.includes(fam);
    const one = f => { const real = bReal(f); return real && bHasGlyphs(real, text) ? { stack: `${serif ? lat : ''}"${real}",${SYS}`, w: '' } : null; };
    let b = null;
    if (readable && roll[1] < .8) b = one(fam);
    else if (/Noto Serif SC/.test(h.stack)) b = one('Noto Serif SC');
    else if (/Noto Sans SC/.test(h.stack)) b = roll[1] < .62 ? one('Noto Sans SC') : null;
    if (!b) b = serif ? bFace('serif', seq(2), text, lat) : roll[1] < .6 ? bFace('sans', seq(2), text) : bFace('lightSerif', seq(2), text, lat);
    const m = roll[3] < .7 ? b : bFace('sans', () => 0, text);
    return { cls, canon: h.canon, big: B_ROUGH.includes(h.canon) ? bClean(heroText, cls === 'lightSerif' || cls === 'serif') : null, hero: h.stack, heroW: h.w, body: b.stack, bodyW: b.w, meta: m.stack, metaW: m.w || '' };
  };
  return { pair, ...pair('heavySans') };
}

// ── 配色的几样小工具（配色本身在 blind-colors）─────────────────────
const bMix = (h1, h2, t) => {
  const a = hex2rgb(h1), b = hex2rgb(h2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
const bAlpha = (hex, a) => { const [r, g, b] = hex2rgb(hex); return `rgba(${r},${g},${b},${a})`; };
const bHex = rgb => '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

// 用一张真纸当底时，从它的代表色反推一套配色
function bPaletteForPaper(st, paper, light, rnd, ownInk){
  const mean = paperMean(paper, light), g = bHex(mean), dark = relLum(mean) < .3;
  const ink = ownInk ? bHex(shade(hex2rgb(inkOf(st.ink)), (st.inkLight || 0) / 100))
                     : (contrast(hex2rgb(bMix(g, '#000000', .86)), mean) > 7 ? bMix(g, '#0c0a09', .88) : bestInk(mean).c);
  const pool = B_PALETTES.flatMap(p => [p.a, p.b]).filter(c => contrast(hex2rgb(c), mean) >= 3);
  const take = () => pool.length ? pool[Math.floor(rnd() * pool.length)] : ink;
  return { id: 'paper', paper, light, g, i: ink, a: take(), b: take(), m: dark ? 'night' : 'clear' };
}
// 一套颜色有多少机会：泥不掷，灰扑扑的少掷，刺眼的少掷（面板上照样点得到）
function bPalW(p){
  const [L, C, h] = bLch(p.g);
  if (L < .45 && C > .012 && bHueIn(h, 26, 165)) return 0;        // 暗褐、暗橄榄
  if (L < .38 && C < .075 && bHueIn(h, 292, 335)) return .12;      // 发灰的暗紫
  if (bIsMud(L, C, h)) return 0;                                  // 土黄、竹青、摩卡
  if (L > .26 && L < .74 && C < (L < .36 ? .028 : .035)) return 0;                  // 不黑不白的灰
  if (bHueIn(h, 80, 112) && L < .86 && C > .05) return 0;       // 芥末
  if (bHueIn(h, 98, 136) && C > .13) return 0;                    // 荧光黄绿
  if (C > .165) return L > .88 ? .05 : .3;                        // 荧光
  return p.src === 'first' ? 1.3 : bIsQuiet(p) ? 2.2 : 1;
}
function bPalette(st, rnd, own){
  if (own.paper) return bPaletteForPaper(st, st.paper, st.paperLight, rnd, own.ink);
  const ps = packs(), k = rnd(), src = k < .3 ? 'first' : k < .5 ? 'cn' : k < .66 ? 'jp' : k < .82 ? 'intl' : 'tune';
  if (ps.length && !own.ink && rnd() < .1) return bPaletteForPaper(st, 'pk:' + ps[Math.floor(rnd() * ps.length)].key, 0, rnd, false);      // 偶尔铺一张装好的真纸
  let pal = src === 'tune' ? bTune(rnd) : { ...bWeighted(rnd, B_PALETTES.filter(p => p.src === src && bPalW(p)).map(p => ({ p, w: bPalW(p) }))).p };
  if (own.ink){
    const c = bHex(shade(hex2rgb(inkOf(st.ink)), (st.inkLight || 0) / 100));
    // 指定了自己的墨，底就得让墨：挑一张读得出来的
    if (contrast(hex2rgb(c), hex2rgb(pal.g)) < 4){
      const fit = B_PALETTES.filter(p => contrast(hex2rgb(c), hex2rgb(p.g)) >= 4.5);
      if (fit.length) pal = { ...fit[Math.floor(rnd() * fit.length)] };
    }
    pal.i = c;
  }
  pal.m = relLum(hex2rgb(pal.g)) < .3 ? 'night' : 'clear';
  return own.ink ? pal : bClean2(pal);
}

