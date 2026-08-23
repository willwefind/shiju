// ════════════════════════════════════════════════════════════════════
//  5. 分页
//     把正文压成一串「块」（行 / 段间空档），再按页容量流进若干张纸。
// ════════════════════════════════════════════════════════════════════
// cross = 与流动方向垂直的那条边：横排时是版心宽，竖排时是版心高。
// 两种排法都吐出同样形状的 items（一行 / 一列），所以下面的分页算法一字不用改。
function buildItems(ctx, text, cross, fontSize, vertical){
  const LH = Math.round(fontSize * 1.72), GAP = Math.round(fontSize * .62);
  // 空行＝分段（段间留空档）；单个换行＝硬换行（照断，不留空档）。
  // 🔴 早先段内的单换行被 replace 抹掉了 —— 用户敲的回车在纸上凭空消失。
  const paras = text.split(/\n{2,}/).map(s => s.replace(/[ \t]+\n/g, '\n').trim()).filter(Boolean);
  const items = [];
  paras.forEach((p, i) => {
    if (i) items.push({ gap: true, h: GAP });
    for (const hard of p.split('\n')){
      if (!hard.trim()){ items.push({ gap: true, h: LH }); continue; }   // 段内空行＝空一行
      if (vertical){
        for (const c of wrapVertical(hard, fontSize, cross, ctx)) items.push({ text: c, h: LH });
      } else {
        for (const ln of wrap(ctx, hard, cross)) items.push({ text: ln, h: LH });
      }
    }
  });
  return { items, LH, GAP };
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

