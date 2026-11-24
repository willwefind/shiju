// ════════════════════════════════════════════════════════════════════
//  4. 中文排版：避头尾 + 英文整词不断行 + 引号变色
// ════════════════════════════════════════════════════════════════════
const NO_START = '，。、；：？！）」』】》〉…—·%,.;:?!”’';
const NO_END   = '（「『【《〈“‘';
const ASCII    = /[A-Za-z0-9][A-Za-z0-9\-_.@/+']*/y;

function tokenize(str){
  const t = []; let i = 0;
  while (i < str.length){
    ASCII.lastIndex = i;
    const m = ASCII.exec(str);
    if (m && m[0].length > 1){ t.push(m[0]); i = ASCII.lastIndex; }
    else { t.push(str[i]); i++; }
  }
  return t;
}
// 一截字有多宽。rich ＝ 逐字样式（见 spans.js），同样式的连成一段一次量完；
// 没有 rich 就用 ctx 当前的 font，跟从前一样。
// 🔑 给了 rich 的话 ctx.font 会被改掉，调用方接着要量/画素字得自己设回来。
function textWidth(ctx, str, rich, a = 0, b = str.length){
  if (!rich) return ctx.measureText(str.slice(a, b)).width;
  let w = 0;
  for (let i = a; i < b;){
    let j = i + 1;
    while (j < b && rich[j] === rich[i]) j++;
    ctx.font = styleFont(rich[i]);
    w += ctx.measureText(str.slice(i, j)).width;
    i = j;
  }
  return w;
}
// track = 逐字字距。题头/出处是带字距画的，折行时不把它算进来，
// 行就会比版心宽（每字多几像素，三十来个字就多出上百）。
// 🔑 每一行都是原串里连续的一段 [a,b)，全部行首尾相接正好等于原串 ——
//    局部样式就靠这一条按下标跟过去，别在这里增删任何字符。
function wrap(ctx, str, width, track, rich){
  const t = track || 0;
  const W = (from, to) => textWidth(ctx, str, rich, from, to) + t * (to - from);
  const lines = []; let a = 0, b = 0, w = 0, at = 0;
  for (const tok of tokenize(str)){
    let from = at; const to = at + tok.length; at = to;
    let tw = W(from, to);
    if (b > a && w + tw > width){
      // 避尾：行尾不能是「（ 这类开引号，把它拉到下一行
      while (b > a && NO_END.includes(str[b - 1])){ b--; from = b; }
      lines.push([a, b]); a = b = from; w = 0;
      // 🔴 拉下来的开引号也占宽。早先没算它，这一行就比版心宽出一两个字 ——
      //    字小时看不出来，选中的字一调大就冲出去了。
      tw = W(from, to);
    }
    // 避头：句读不能站行首。先试着塞回上一行；塞不下就把上一行最后一个字一起拉下来（追出）。
    // 🔴 早先这里是无条件塞回去的 —— 行就悄悄超出版心，
    //    平时看不出来，一做对齐立刻露馅（右对齐会算出负偏移，字跑到版心左边去）。
    if (a === b && NO_START.includes(str[from]) && lines.length){
      const prev = lines[lines.length - 1];
      if (W(prev[0], to) <= width){ prev[1] = to; a = b = to; continue; }
      if (prev[1] - prev[0] > 1){
        // 🔴 拉下来的要是个句读（「走。」连着两个），它自己又站了行首 —— 一直拉到不是为止
        do prev[1]--; while (prev[1] - prev[0] > 1 && NO_START.includes(str[prev[1]]));
        a = prev[1]; w = W(a, from);
      }
    }
    b = to; w += tw;
  }
  if (b > a) lines.push([a, b]);
  return lines.map(([x, y]) => str.slice(x, y));
}
// 字重不用 bold 关键字：中文字体大多只装了 Regular，浏览器合成出来的假粗
// 各家不一样、也没法微调。改成描边加粗 —— 任何字体都吃，粗细可控。
// 同色的连续一段一次画完，而不是一个字一个字画 ——
// 逐字画会把西文的字距调整（kerning）全丢掉，接了西文字体后一眼就看得出松散。
// 只在引号变色的地方断开。
// 一段字走完之后，引号还剩几层没闭合。折行/翻页时用它把深度接上。
const Q_OPEN = '「『“', Q_CLOSE = '」』”';
function quoteDepthAfter(str, d = 0){
  for (const ch of str){
    if (Q_OPEN.includes(ch)) d++;
    else if (Q_CLOSE.includes(ch)) d = Math.max(0, d - 1);
  }
  return d;
}
// 翻到第 idx 页时，正文的引号深度应该是多少（段间空档归零）
function quoteDepthAtPage(pages, idx){
  let d = 0;
  for (let p = 0; p < idx; p++)
    for (const it of pages[p]) d = it.gap ? 0 : quoteDepthAfter(it.text, d);
  return d;
}
// 🔴 depth0：一段引号常常跨行（甚至跨页）。早先 depth 每行从 0 起，
//    于是「一句话说到第二行就变回墨色」—— 颜色在折行处断掉，看着像坏了。
//    现在由调用方把上一行结束时的深度传进来。
function drawRich(ctx, x, y, line, inkColor, quoteColor, stroke, depth0 = 0, rich = null){
  let depth = depth0, run = '', runCol = null, runSty = null;
  const drop = rich ? richBaseline(ctx, rich) : null;   // 大小字混排：全行坐在同一条基线上
  if (drop != null){ ctx.textBaseline = 'alphabetic'; y += drop; }
  const flush = () => {
    if (!run) return;
    const sw = runSty ? runSty.stroke : stroke;
    if (runSty) ctx.font = styleFont(runSty);
    const keep = ctx.globalAlpha; if (runSty && runSty.alpha !== undefined) ctx.globalAlpha = keep * runSty.alpha;
    ctx.fillStyle = runCol;
    if (sw > 0){
      ctx.strokeStyle = runCol; ctx.lineWidth = sw;
      ctx.lineJoin = 'round'; ctx.miterLimit = 2;
      ctx.strokeText(run, x, y);
    }
    ctx.fillText(run, x, y); ctx.globalAlpha = keep;
    x += ctx.measureText(run).width;
    run = '';
  };
  for (let i = 0; i < line.length; i++){
    const ch = line[i], sty = rich ? rich[i] : null;
    if (Q_OPEN.includes(ch)) depth++;
    // 自己挑过颜色的字，压过引号变色
    const col = (sty && sty.ink) || (depth > 0 ? quoteColor : inkColor);
    if (col !== runCol || sty !== runSty){ flush(); runCol = col; runSty = sty; }
    run += ch;
    if (Q_CLOSE.includes(ch)) depth = Math.max(0, depth - 1);
  }
  flush();
  if (drop != null) ctx.textBaseline = 'top';
}
// 'top' 基线到字母基线有多远。每款字的度量不同，只能现量；
// 两种基线下同一个字的上沿之差就是它，跟用哪个字量无关。
function baseDrop(ctx, font){
  ctx.font = font;
  ctx.textBaseline = 'alphabetic'; const a = ctx.measureText('永').actualBoundingBoxAscent;
  ctx.textBaseline = 'top';        const b = ctx.measureText('永').actualBoundingBoxAscent;
  return a - b;
}
// 一行的基线由最大的那几个字定。里头要是有没改过的素字就听它的 ——
// 只换了字体或颜色的行，其余的字不许跟着上下挪。
function richBaseline(ctx, rich){
  const M = maxSize(rich, 0);
  const top = [...new Set(rich.filter(r => r.size === M))];
  const pick = top.some(r => r.plain) ? top.filter(r => r.plain) : top;
  return Math.max(...pick.map(r => baseDrop(ctx, styleFont(r))));
}
const strokeFor = (weight, size) => [0, size * 0.020, size * 0.042][weight || 0] || 0;
const tracked      = (ctx, x, y, str, tr) => { for (const c of str){ ctx.fillText(c, x, y); x += ctx.measureText(c).width + tr; } };
const trackedWidth = (ctx, str, tr) => { let w = 0; for (const c of str) w += ctx.measureText(c).width; return w + tr*(str.length-1); };

// ── 竖排 ────────────────────────────────────────────────────────────
// 中文竖排不是「把横排转 90 度」：字要正着写、一个一个往下落，列从右往左走。
// 但标点得分三类各自处理，不然一眼就露馅。
const V_ROTATE = '「」『』（）〔〕【】《》〈〉〔〕()[]{}—…～~－-';  // 要转 90° 的
const V_CORNER = '。，、；：';                                     // 要挪到格子右上角的
const isLatin  = ch => /[A-Za-z0-9@#$%&*+=/\\|<>^_]/.test(ch);

// 一列拆成一格一格：连着的英文数字并成一格（整串转 90°），其余一字一格。
// 样式一变就断开，但「算不算同一串英文」看的是整列 —— 不然两个词样式不同，
// 中间那个空格会被当成一个汉字那么高。
// 🔑 量（vAdvance）和画（drawColumn）都走这一份格子 —— 折列时估一套、
//    画的时候走另一套，就一定会对不上。
function vCells(col, rich){
  const cells = [];
  for (let i = 0; i < col.length;){
    if (!isLatin(col[i])){ cells.push({ t: col[i], at: i, latin: false }); i++; continue; }
    let j = i;
    while (j < col.length && (isLatin(col[j]) || (col[j] === ' ' && isLatin(col[j+1] || '')))) j++;
    while (i < j){
      let k = i + 1;
      while (k < j && (!rich || rich[k] === rich[i])) k++;
      cells.push({ t: col.slice(i, k), at: i, latin: true });
      i = k;
    }
  }
  return cells;
}

// 一列排下来有多高。
// 🔴 英文串竖排时整体旋转，实际吃掉的高度＝它的渲染宽度，不是「字数×某个系数」。
//    早先按 0.5 估，估少了列就漏到纸外去。现在真去量。
function vAdvance(ctx, col, size, rich){
  let h = 0;
  for (const c of vCells(col, rich)){
    const sty = rich ? rich[c.at] : null;
    if (!c.latin){ h += sty ? sty.size : size; continue; }
    if (sty) ctx.font = styleFont(sty);
    h += ctx.measureText(c.t).width;
  }
  return h;
}

// 把一段话切成竖排的列。每列是一串字符，列高由版心高度决定。
// colH 是像素高度，不是格子数。跟 wrap 一样：各列首尾相接正好等于原串。
function wrapVertical(str, size, colH, ctx, mk, rich){
  if (!ctx){ const c = (mk || newMeasure)(); c.font = `${size}px serif`; ctx = c; }
  const H = (from, to) => vAdvance(ctx, str.slice(from, to), size, rich && rich.slice(from, to));
  const cols = [];
  let a = 0, b = 0, at = 0;
  for (const tok of tokenize(str)){
    let from = at; const to = at + tok.length; at = to;
    if (b > a && H(a, to) > colH){
      while (b > a && NO_END.includes(str[b - 1])){ b--; from = b; }
      if (b > a) cols.push([a, b]);
      a = b = from;
    }
    if (a === b && NO_START.includes(str[from]) && cols.length){ cols[cols.length-1][1] = to; a = b = to; continue; }
    b = to;
  }
  if (b > a) cols.push([a, b]);
  return cols.map(([x, y]) => str.slice(x, y));
}

// 画一列竖排的字。返回这一列实际用掉的高度。
// 大小字混排时，每个字都居中在这一列的中轴上（轴由最大的字定）。
function drawColumn(ctx, x, y, col, size, inkColor, quoteColor, stroke, depth0 = 0, rich = null){
  let depth = depth0, cy = y;
  const M = maxSize(rich, size);
  for (const cell of vCells(col, rich)){
    const ch = cell.t, sty = rich ? rich[cell.at] : null;
    const sz = sty ? sty.size : size, sw = sty ? sty.stroke : stroke;
    const gx = x + (M - sz) / 2, keep = ctx.globalAlpha;
    if (sty) ctx.font = styleFont(sty);
    if (sty && sty.alpha !== undefined) ctx.globalAlpha = keep * sty.alpha;
    if (Q_OPEN.includes(ch)) depth++;
    const c = (sty && sty.ink) || (depth > 0 ? quoteColor : inkColor);
    ctx.fillStyle = c;
    if (sw > 0){ ctx.strokeStyle = c; ctx.lineWidth = sw; ctx.lineJoin = 'round'; ctx.miterLimit = 2; }

    const cw = ctx.measureText(ch).width;
    // 英文/数字连成一串，整串顺时针转 90° 写，读起来才是正的
    if (cell.latin || V_ROTATE.includes(ch)){
      ctx.save();
      ctx.translate(gx + sz * 0.5, cy);
      ctx.rotate(Math.PI / 2);
      if (sw > 0) ctx.strokeText(ch, 0, -sz * 0.5);
      ctx.fillText(ch, 0, -sz * 0.5);
      ctx.restore();
    } else if (V_CORNER.includes(ch)){
      // 句读在竖排里坐格子的右上角
      const px = gx + sz * 0.42, py = cy - sz * 0.42;
      if (sw > 0) ctx.strokeText(ch, px, py);
      ctx.fillText(ch, px, py);
    } else {
      const px = gx + (sz - cw) / 2;
      if (sw > 0) ctx.strokeText(ch, px, cy);
      ctx.fillText(ch, px, cy);
    }
    if (Q_CLOSE.includes(ch)) depth = Math.max(0, depth - 1);
    ctx.globalAlpha = keep;
    cy += cell.latin ? cw : sz;
  }
  return cy - y;
}

const CN = '〇一二三四五六七八九';
function cnNum(n){
  if (n <= 10) return n === 10 ? '十' : CN[n];
  if (n < 20)  return '十' + CN[n-10];
  return CN[Math.floor(n/10)] + '十' + (n%10 ? CN[n%10] : '');
}

