// 铺纸。图还没解码完就先拿宣纸垫着。
const groundPhoto = st => st.paper.startsWith('pk:') ? packImg(st.paper.slice(3), st.orient)
                        : st.paper.startsWith('my:') ? myPaper(st.paper.slice(3)) : null;
function drawGround(ctx, st, W, H, idx){
  const photo = groundPhoto(st);
  if (!(photo && drawCover(ctx, photo, W, H))) ctx.drawImage(makePaper(photo ? 'rice' : st.paper, W, H, idx), 0, 0);

  // 纸张明暗：盖一层白/黑。alpha 与 shade() 用的是同一个 t，两边算出来的颜色一致。
  const pl = (st.paperLight || 0) / 100;
  if (pl){
    ctx.fillStyle = pl > 0 ? `rgba(255,255,255,${pl})` : `rgba(0,0,0,${-pl})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function renderPage(canvas, st, plan, idx){
  if (plan.blind) return renderBlind(canvas, st, plan, idx);
  const { S, W, H, COL, box, stack, pages, ch, title } = plan;
  const ctx = canvas.getContext('2d');
  const ink = inkColorOf(st);
  const last = idx === pages.length - 1;
  const many = pages.length > 1;

  // 纸深了就把辅助元素一起提亮，否则页码日期分隔线全沉进纸里。
  // 判据必须用「调完亮度之后」的纸色，不然纸调暗了这些还留在浅色上。
  const mean = paperMean(st.paper, st.paperLight);
  const dark = relLum(mean) < 0.34;
  // 题头/出处/日期/线的颜色：auto 就跟着纸深浅走，指定了就用指定的
  const custom = st.metaInk && st.metaInk !== 'auto' ? inkOf(st.metaInk) : null;
  const grey = custom || (dark ? 'rgba(248,245,238,.62)' : GREY);
  const rule = custom ? custom + '66' : (dark ? 'rgba(248,245,238,.30)' : RULE);
  // 引号里那段话的颜色。跟 metaInk 一个套路：auto 跟着纸深浅走，指定了就用指定的。
  // 多一个 same＝跟正文一个色，也就是「不要引号变色」——有人就是不想要那抹橙。
  const quote = st.quoteInk === 'same' ? ink
              : (st.quoteInk && st.quoteInk !== 'auto') ? inkOf(st.quoteInk)
              : (dark ? QUOTE_ON_DARK : QUOTE);

  canvas.width = W * DPR; canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  if (st.noGround){ /* 透明底：什么都不铺 */ }
  else if (plan.ground) plan.ground(ctx, idx);      // 盲盒的内页：跟封面同一张底
  else drawGround(ctx, st, W, H, idx);

  ctx.textBaseline = 'top';
  let y = S.pad;

  // 横排的题头在顶上；竖排的题头立在右边（下面竖排那一段里画）
  if (st.showHeader && !st.vertical && ch.headLines && ch.headLines.length){
    ctx.font = `${HEAD_SZ}px ${stack}`; ctx.fillStyle = grey;
    let hy = y;
    for (const ln of ch.headLines){ tracked(ctx, S.pad, hy, ln, 5); hy += 30; }
    if (st.headRule !== false){ ctx.fillStyle = rule; ctx.fillRect(S.pad, hy + 14, COL, 1); }
  }
  y += ch.head;

  // 每画一行都先把 font 设回来：有局部样式的行会把它改掉
  const titleFont = `${title.size}px ${titleStack(st)}`;
  const bodyFont  = `${st.fontSize}px ${stack}`;

  // 标题：只印第一页。横排正文时它占顶上那条带（横竖两种排向都在这条带里画）
  if (ch.title){
    if (idx === 0){
      const tsw = strokeFor(st.titleWeight, title.size);
      if (title.vertical){
        // 竖标题立在这条带里，列从右往左；titleAlign 管这一叠列往哪边靠
        const bw = title.rows.reduce((a, r) => a + r.h, 0);
        let tx = S.pad + alignOffset(st.titleAlign, COL, bw) + bw, tqd = 0;
        for (const row of title.rows){
          tx -= row.h;
          ctx.font = titleFont;
          drawColumn(ctx, tx, y, row.text, title.size, ink, quote, tsw, tqd, row.rich);
          tqd = quoteDepthAfter(row.text, tqd);
        }
        if (st.titleRule !== false){
          ctx.fillStyle = rule;
          ctx.fillRect(S.pad + alignOffset(st.titleAlign, COL, bw) - Math.round(title.size*0.34),
                       y, 1, ch.title - Math.round(title.size * 0.5));
        }
      } else {
        let ty = y, tqd = 0;
        for (const row of title.rows){
          ctx.font = titleFont;
          const w = textWidth(ctx, row.text, row.rich);
          drawRich(ctx, S.pad + alignOffset(st.titleAlign, COL, w), ty, row.text, ink, quote, tsw, tqd, row.rich);
          tqd = quoteDepthAfter(row.text, tqd);
          ty += row.h;
        }
        // 标题下的短横跟着标题走，不然居左的标题配居中的横线会很怪
        if (st.titleRule !== false){
          const rw = 88, rx = S.pad + alignOffset(st.titleAlign, COL, rw);
          ctx.fillStyle = rule;
          ctx.fillRect(rx, ty + Math.round(title.size * 0.30), rw, 1);
        }
      }
    }
    y += ch.title;
  }

  // 正文块在版心里居中。横版尤其需要 —— 顶对齐的话字全挤在上面，下面空一大片。
  // 各页用同一个版心尺寸，所以整叠看起来是齐的。
  const used = pages[idx].reduce((a, it) => a + it.h, 0);
  const ox = st.offsetX || 0, oy = st.offsetY || 0;
  const sw = strokeFor(st.weight, st.fontSize);

  if (st.vertical){
    // 竖排：从右往左依次是 题头 → 竖标题 → 正文 → 出处日期。
    const bandR = S.pad + COL - ch.headW - ch.titleW;   // 正文右界
    const bandL = S.pad + ch.metaW;                     // 正文左界
    const band  = bandR - bandL;
    const top   = S.pad + ch.title;
    const colH  = box;

    if (ch.headW && ch.headCols){
      ctx.font = `${HEAD_SZ + 2}px ${stack}`;
      let hx = S.pad + COL - 34;
      for (const c of ch.headCols){ drawColumn(ctx, hx, top, c, HEAD_SZ + 2, grey, grey, 0); hx -= 34; }
      if (st.headRule !== false){
        ctx.fillStyle = rule;
        ctx.fillRect(S.pad + COL - ch.headW, top, 1, colH);
      }
    }

    // 竖标题自成一栏，紧挨着题头的左边
    if (idx === 0 && ch.titleW){
      const tsw = strokeFor(st.titleWeight, title.size);
      let tx = S.pad + COL - ch.headW - Math.round(title.size * 0.3), tqd = 0;
      for (const row of title.rows){
        tx -= row.h;
        ctx.font = titleFont;
        const h = vAdvance(ctx, row.text, title.size, row.rich);
        ctx.font = titleFont;
        drawColumn(ctx, tx, top + alignOffset(st.titleAlign, colH, h),
                   row.text, title.size, ink, quote, tsw, tqd, row.rich);
        tqd = quoteDepthAfter(row.text, tqd);
      }
      if (st.titleRule !== false){ ctx.fillStyle = rule; ctx.fillRect(bandR, top, 1, colH); }
    }

    let x = bandR - Math.max(0, (band - used) / 2) + ox;
    let qd = quoteDepthAtPage(pages, idx);
    for (const it of pages[idx]){
      x -= it.h;
      if (it.gap){ qd = 0; continue; }
      ctx.font = bodyFont;
      const h = vAdvance(ctx, it.text, st.fontSize, it.rich);
      const cy = top + alignOffset(st.align, colH, h) + oy;
      drawColumn(ctx, x, cy, it.text, st.fontSize, ink, quote, sw, qd, it.rich);
      qd = quoteDepthAfter(it.text, qd);
    }

    if (ch.metaW){
      if (st.footRule !== false){ ctx.fillStyle = rule; ctx.fillRect(bandL, top, 1, colH); }
      let mx = S.pad + ch.metaW - 34;
      if (last && ch.srcCols){
        ctx.font = `${SRC_SZ - 2}px ${stack}`;
        for (const c of ch.srcCols){ drawColumn(ctx, mx, top, c, SRC_SZ - 2, grey, grey, 0); mx -= 38; }
      } else if (ch.srcCols) mx -= ch.srcCols.length * 38;
      if (ch.dateCols){
        ctx.font = `${DATE_SZ}px ${stack}`;
        for (const c of ch.dateCols){ drawColumn(ctx, mx, top, c, DATE_SZ, grey, grey, 0); mx -= 32; }
      }
    }
    if (many){
      ctx.font = `21px ${stack}`; ctx.fillStyle = grey;
      const t = `${cnNum(idx+1)} / ${cnNum(pages.length)}`;
      drawColumn(ctx, S.pad + COL - 40, H - S.pad - trackedWidth(ctx, t, 0) - 10, t, 21, grey, grey, 0);
    }
    return;                                    // 竖排的页眉页脚已经画完，别再走横排那套
  } else {
    y += Math.max(0, (box - used) / 2) + oy;
    let qd = quoteDepthAtPage(pages, idx);
    for (const it of pages[idx]){
      if (it.gap) qd = 0;                      // 换段就把没闭合的引号忘掉
      else {
        ctx.font = bodyFont;
        const w = textWidth(ctx, it.text, it.rich);
        drawRich(ctx, S.pad + alignOffset(st.align, COL, w) + ox, y, it.text, ink, quote, sw, qd, it.rich);
        qd = quoteDepthAfter(it.text, qd);
      }
      y += it.h;
    }
  }

  // 出处只印最后一页。前面那个符号是自己填的，想删就把那栏清空。多行时逐行右对齐。
  if (last && ch.src && ch.srcLines){
    ctx.font = `${SRC_SZ}px ${stack}`; ctx.fillStyle = grey;
    let sy = H - S.pad - ch.foot - ch.src + 20;
    for (const ln of ch.srcLines){
      tracked(ctx, S.pad + COL - trackedWidth(ctx, ln, 1.4), sy, ln, 1.4);
      sy += 36;
    }
  }

  const fy = H - S.pad - 46;
  if (st.footRule !== false){ ctx.fillStyle = rule; ctx.fillRect(S.pad, fy - 34, COL, 1); }
  ctx.font = `21px ${stack}`; ctx.fillStyle = grey;
  if (st.showDate && st.date.trim()) tracked(ctx, S.pad, fy, st.date.trim(), 2.2);
  if (many){
    const t = `${cnNum(idx+1)} / ${cnNum(pages.length)}`;
    tracked(ctx, S.pad + COL/2 - trackedWidth(ctx, t, 2)/2, fy, t, 2);
  }
}

