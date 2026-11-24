// ════════════════════════════════════════════════════════════════════
//  5. 分页
//     把正文压成一串「块」（行 / 段间空档），再按页容量流进若干张纸。
// ════════════════════════════════════════════════════════════════════
// cross = 与流动方向垂直的那条边：横排时是版心宽，竖排时是版心高。
// 两种排法都吐出同样形状的 items（一行 / 一列），所以下面的分页算法一字不用改。
//
// rich ＝ 原文逐字的样式（spans.js 的 richOf），没有就是 null。
function splitParas(text){
  // 空行＝分段（段间留空档）；单个换行＝硬换行（照断，不留空档）。
  // 每一行都记着自己在原文里的起点 at —— 局部样式按原文下标存，靠它对上号。
  const paras = []; let from = 0;
  for (const raw of text.split(/(\n{2,})/)){
    let at = from; from += raw.length;
    if (/^\n{2,}$/.test(raw)) continue;
    const parts = raw.split('\n');
    const lines = parts.map((s, i) => {
      const ln = { at, text: i < parts.length - 1 ? s.replace(/[ \t]+$/, '') : s };
      at += s.length + 1;
      return ln;
    });
    // 整段首尾的空白去掉（连带首尾的空行）
    while (lines.length && !lines[0].text.trim()) lines.shift();
    while (lines.length && !lines[lines.length-1].text.trim()) lines.pop();
    if (!lines.length) continue;
    const head = lines[0], tail = lines[lines.length-1];
    const t = head.text.trimStart(); head.at += head.text.length - t.length; head.text = t;
    tail.text = tail.text.trimEnd();
    paras.push(lines);
  }
  return paras;
}

function buildItems(ctx, text, cross, fontSize, vertical, rich){
  const LH = Math.round(fontSize * 1.72), GAP = Math.round(fontSize * .62);
  const font = ctx.font;
  const items = [];
  // 🔴 早先段内的单换行被 replace 抹掉了 —— 用户敲的回车在纸上凭空消失。
  splitParas(text).forEach((lines, i) => {
    if (i) items.push({ gap: true, h: GAP });
    for (const { text: hard, at } of lines){
      if (!hard.trim()){ items.push({ gap: true, h: LH }); continue; }   // 段内空行＝空一行
      items.push(...flowRows(ctx, hard, sliceRich(rich, at, at + hard.length),
                             { size: fontSize, cross, vertical, lead: 1.72, font, from: at }));
    }
  });
  return { items, LH, GAP };
}

// 一段不含换行的字 → 若干行（或竖排的列）。正文和标题都走这里。
// 行高跟着这一行里最大的字走：一行里有个大字，这一行就让出大字的高度，别的行不动。
function flowRows(ctx, str, rich, { size, cross, vertical, lead, font, from = 0 }){
  ctx.font = font;
  const parts = vertical ? wrapVertical(str, size, cross, ctx, null, rich) : wrap(ctx, str, cross, 0, rich);
  let at = 0;
  return parts.map(text => {
    const r = sliceRich(rich, at, at + text.length);
    const row = { text, h: Math.round(maxSize(r, size) * lead), at: from + at };
    at += text.length;
    if (r) row.rich = r;
    return row;
  });
}

// 贪心装箱；forceN 时按「剩余高度 / 剩余页数」均摊，让几页看起来一样满
function paginate(items, cap, forceN){
  const fill = capacity => {
    const total = items.reduce((a, it) => a + it.h, 0);
    const pages = [];
    let cur = [], curH = 0;
    let done = 0;      // 🔴 只能是「已翻篇的页」的高度。
                       //    把当前这页也算进去的话，目标高度会边填边缩，
                       //    前几页越切越早，剩下的全砸给最后一页（10/10/20 那个 bug）。
    for (let i = 0; i < items.length; i++){
      const it = items[i];
      const pagesLeft = forceN ? forceN - pages.length : Infinity;
      const target    = forceN ? (total - done) / Math.max(1, pagesLeft) : Infinity;
      const itemsLeft = items.length - i;
      const overflow  = curH + it.h > capacity;
      // 过了均摊线就翻篇，但要留够条目给后面的页，不然会凑不满 N 张
      const evened    = forceN && pagesLeft > 1 && curH > 0 && curH + it.h/2 > target;
      const mustBreak = forceN && pagesLeft > 1 && itemsLeft <= pagesLeft;
      if (cur.length && (overflow || evened || mustBreak)){
        pages.push(cur); done += curH; cur = []; curH = 0;
      }
      if (!cur.length && it.gap) continue;                   // 页首不留空档
      cur.push(it); curH += it.h;
    }
    if (cur.length) pages.push(cur);
    return pages;
  };

  let pages = fill(cap), grown = cap;
  // 页数被指定、但这么点高度装不下 —— 把每页一起加高，而不是偷偷多出一页
  while (forceN && pages.length > forceN && grown < cap * 12){
    grown = Math.ceil(grown * 1.12);
    pages = fill(grown);
  }
  return { pages, capacity: grown };
}

