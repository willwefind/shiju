// ════════════════════════════════════════════════════════════════════
//  6. 画一页
// ════════════════════════════════════════════════════════════════════
// 标题字号：绝对像素，跟正文字号互不相干。夹一道上下限，别让旧值或手输的数字画出鬼来。
const titleFontSize = st => Math.max(12, Math.min(300, Math.round(st.titleSize || DEF.titleSize)));

// 标题排好之后占多高。只印第一页，但**每页都按它预留**——
// 各页版心一样高，正文垂直居中才对得齐，也绝不会溢出。
function titleBlock(st, COL, availH, mk){
  const t = (st.title || '').trim();
  if (!t) return { lines: [], h: 0, w: 0, size: 0, lh: 0, vertical: false };
  const size = titleFontSize(st);
  const lh = Math.round(size * 1.42);
  const ctx = (mk || newMeasure)();
  // 🔴 latinFont 必须显式从 st 传：不传的话 fontStack 会去读存储里的配置，
  //    当前状态被无声忽略 —— 会变成「选了西文字体却没反应」。
  ctx.font = `${size}px ${titleStack(st)}`;
  // 标题的排向跟正文分开定：竖排正文配横标题是常见排法，配竖标题也是，让用户自己挑
  if (st.titleVertical){
    const cols = t.split(/\n+/).flatMap(line => wrapVertical(line, size, availH || 600, ctx));
    const longest = cols.reduce((a, c) => Math.max(a, vAdvance(ctx, c, size)), 0);
    return { lines: cols, vertical: true, size, lh,
             w: cols.length * lh + Math.round(size * 0.6),
             h: longest + Math.round(size * 0.9) };
  }
  const lines = t.split(/\n+/).flatMap(line => wrap(ctx, line, COL));
  return { lines, vertical: false, size, lh, w: COL,
           h: lines.length * lh + Math.round(size * 0.9) };
}

// 版心之外那些固定占位。竖排时题头/出处/日期是竖着排在左右两侧的，
// 所以它们吃掉的是**横向**空间（headW/metaW），不是纵向。
const HEAD_SZ = 22, SRC_SZ = 26, DATE_SZ = 21;

// 题头和出处都不限字数，所以它们的占位必须按**实际折出来多少行/多少列**算，
// 不能写死。写死的后果是字一长就冲出版心。
function chrome(st, COL, availH, mk){
  const tb = titleBlock(st, COL, availH, mk);
  const head = st.showHeader ? (st.headText || '').trim() : '';
  const src  = st.showSource ? (st.source || '').trim() : '';
  const date = st.showDate ? (st.date || '').trim() : '';
  const ctx = (mk || newMeasure)();
  const stack = fontStack(st.font, st.latinFont);

  if (st.vertical){
    const colH = (availH || 600) - (tb.vertical ? 0 : tb.h);
    ctx.font = `${HEAD_SZ + 2}px ${stack}`;
    const headCols = head ? wrapVertical(head.replace(/\s+/g, ''), HEAD_SZ + 2, colH, ctx) : [];
    ctx.font = `${SRC_SZ - 2}px ${stack}`;
    const srcCols  = src  ? wrapVertical((st.sourcePrefix || '') + src, SRC_SZ - 2, colH, ctx) : [];
    ctx.font = `${DATE_SZ}px ${stack}`;
    const dateCols = date ? wrapVertical(date, DATE_SZ, colH, ctx) : [];
    return {
      title : tb.vertical ? 0 : tb.h,
      titleW: tb.vertical ? tb.w : 0,
      headW : headCols.length ? headCols.length * 34 + 30 : 0,
      metaW : (srcCols.length + dateCols.length)
              ? srcCols.length * 38 + dateCols.length * 32 + 24 : 0,
      headCols, srcCols, dateCols,
      head: 0, src: 0, foot: 0 };
  }

  ctx.font = `${HEAD_SZ}px ${stack}`;
  const headLines = head ? wrap(ctx, head, COL, 5) : [];
  ctx.font = `${SRC_SZ}px ${stack}`;
  const srcLines = src ? wrap(ctx, (st.sourcePrefix || '') + src, COL, 1.4) : [];
  return { title: tb.h, titleW: 0,
    head: st.showHeader ? (headLines.length * 30 + 50) : 24,
    src : srcLines.length ? srcLines.length * 36 + 56 : 0,
    foot: 128,
    headLines, srcLines,
    headW: 0, metaW: 0 };
}

function planPages(st, mk){
  const S = SIZES[st.orient] || SIZES.portrait;
  const COL0 = S.w - S.pad * 2;
  const stack = fontStack(st.font, st.latinFont);
  const probe = (mk || newMeasure)();
  // 竖标题的列长受版心高度限制，而版心高度又要先知道标题占多少 —— 先按整页高度估一轮
  const ch = chrome(st, COL0, S.h - S.pad*2, mk);
  // 🔴 正文字号必须设在 chrome() **之后**：chrome 量题头/出处时会把 font 改成 22/26px，
  //    共用同一块量具的话，先设就被它改掉了 —— 正文会按 22px 折行，静默错到底。
  probe.font = `${st.fontSize}px ${stack}`;
  // 版心高度。按最坏情况留（题头、标题、出处都按每页都在算）：牺牲一点留白，换绝不溢出
  const box0 = S.h - S.pad*2 - ch.head - ch.title - ch.src - ch.foot;
  const { items } = buildItems(probe, st.text, st.vertical ? box0 : COL0, st.fontSize, st.vertical);
  // 横排流向是往下，装不下就加高；竖排流向是往左，装不下就加宽
  const cap0 = st.vertical ? (COL0 - ch.headW - ch.titleW - ch.metaW) : box0;
  const forceN = st.pages === 'auto' ? 0 : Math.max(1, parseInt(st.pages, 10) || 1);
  const { pages, capacity } = paginate(items, Math.max(cap0, 120), forceN);
  const grow = Math.max(0, capacity - cap0);
  const W = S.w + (st.vertical ? grow : 0);
  const H = S.h + (st.vertical ? 0 : grow);
  return { S, W, H, COL: W - S.pad*2, box: box0, stack, ch,
           pages: pages.length ? pages : [[]], title: titleBlock(st, COL0, S.h - S.pad*2, mk) };
}

// 对齐永远是在版心里对齐，不是贴到纸边
// 夹到 ≥0：万一还有哪条线比版心宽，也只会顶到版心左边，绝不会跑出去
const alignOffset = (align, avail, used) => Math.max(0,
  align === 'center' ? (avail - used) / 2 : align === 'right' ? (avail - used) : 0);

