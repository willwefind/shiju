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
// track = 逐字字距。题头/出处是带字距画的，折行时不把它算进来，
// 行就会比版心宽（每字多几像素，三十来个字就多出上百）。
function wrap(ctx, str, width, track){
  const t = track || 0;
  const lines = []; let cur = '', w = 0;
  for (let tok of tokenize(str)){
    const tw = ctx.measureText(tok).width + t * tok.length;
    if (cur && w + tw > width){
      // 避尾：行尾不能是「（ 这类开引号，把它拉到下一行
      while (cur && NO_END.includes(cur.at(-1))){
        tok = cur.at(-1) + tok; w -= ctx.measureText(cur.at(-1)).width + t; cur = cur.slice(0, -1);
      }
      lines.push(cur); cur = ''; w = 0;
    }
    // 避头：句读不能站行首。先试着塞回上一行；塞不下就把上一行最后一个字一起拉下来（追出）。
    // 🔴 早先这里是无条件塞回去的 —— 行就悄悄超出版心，
    //    平时看不出来，一做对齐立刻露馅（右对齐会算出负偏移，字跑到版心左边去）。
    if (!cur && NO_START.includes(tok[0]) && lines.length){
      const prev = lines[lines.length - 1];
      if (ctx.measureText(prev + tok).width + t * (prev.length + tok.length) <= width){
        lines[lines.length - 1] = prev + tok; continue;
      }
      if (prev.length > 1){
        const moved = prev.at(-1);
        lines[lines.length - 1] = prev.slice(0, -1);
        cur = moved; w = ctx.measureText(moved).width + t;
      }
    }
    cur += tok; w += tw;
  }
  if (cur) lines.push(cur);
  return lines;
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
function drawRich(ctx, x, y, line, inkColor, quoteColor, stroke, depth0 = 0){
  let depth = depth0, run = '', runCol = depth0 > 0 ? quoteColor : inkColor;
  const flush = () => {
    if (!run) return;
    ctx.fillStyle = runCol;
    if (stroke > 0){
      ctx.strokeStyle = runCol; ctx.lineWidth = stroke;
      ctx.lineJoin = 'round'; ctx.miterLimit = 2;
      ctx.strokeText(run, x, y);
    }
    ctx.fillText(run, x, y);
    x += ctx.measureText(run).width;
    run = '';
  };
  for (const ch of line){
    if ('「『“'.includes(ch)) depth++;
    const col = depth > 0 ? quoteColor : inkColor;
    if (col !== runCol){ flush(); runCol = col; }
    run += ch;
    if ('」』”'.includes(ch)) depth = Math.max(0, depth - 1);
  }
  flush();
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

// 把一段话切成竖排的列。每列是一串字符，列高由版心高度决定。
// 🔴 英文串竖排时整体旋转，实际吃掉的高度＝它的渲染宽度，不是「字数×某个系数」。
//    早先按 0.5 估，估少了列就漏到纸外去。现在真去量。
// 一列排下来有多高。🔑 这套规则必须和 drawColumn 的推进**一模一样** ——
// 折列时估一套、画的时候走另一套，就一定会对不上（英文串按渲染宽度推进，
// 不是「字数×系数」；空格能不能并进英文串也有讲究）。所以两边都走这个函数的规则。
function vAdvance(ctx, col, size){
  let h = 0, i = 0;
  while (i < col.length){
    if (isLatin(col[i])){
      let run = '';
      while (i < col.length && (isLatin(col[i]) || (col[i] === ' ' && isLatin(col[i+1] || '')))) run += col[i++];
      h += ctx.measureText(run).width;
      continue;
    }
    h += size; i++;
  }
  return h;
}

// colH 是像素高度，不是格子数
function wrapVertical(str, size, colH, ctx, mk){
  if (!ctx){ const c = (mk || newMeasure)(); c.font = `${size}px serif`; ctx = c; }
  const cols = [];
  let cur = '';
  for (let tok of tokenize(str)){
    if (cur && vAdvance(ctx, cur + tok, size) > colH){
      while (cur && NO_END.includes(cur.at(-1))){ tok = cur.at(-1) + tok; cur = cur.slice(0, -1); }
      if (cur){ cols.push(cur); cur = ''; }
    }
    if (!cur && NO_START.includes(tok[0]) && cols.length){ cols[cols.length-1] += tok; continue; }
    cur += tok;
  }
  if (cur) cols.push(cur);
  return cols;
}

// 画一列竖排的字。返回这一列实际用掉的高度。
function drawColumn(ctx, x, y, col, size, inkColor, quoteColor, stroke, depth0 = 0){
  let depth = depth0, cy = y;
  let i = 0;
  while (i < col.length){
    const ch = col[i];
    if ('「『“'.includes(ch)) depth++;
    const c = depth > 0 ? quoteColor : inkColor;
    ctx.fillStyle = c;
    if (stroke > 0){ ctx.strokeStyle = c; ctx.lineWidth = stroke; ctx.lineJoin = 'round'; ctx.miterLimit = 2; }

    // 英文/数字连成一串，整串顺时针转 90° 写，读起来才是正的
    if (isLatin(ch)){
      let run = '';
      while (i < col.length && (isLatin(col[i]) || (col[i] === ' ' && isLatin(col[i+1] || '')))) run += col[i++];
      const w = ctx.measureText(run).width;
      ctx.save();
      ctx.translate(x + size * 0.5, cy);
      ctx.rotate(Math.PI / 2);
      if (stroke > 0) ctx.strokeText(run, 0, -size * 0.5);
      ctx.fillText(run, 0, -size * 0.5);
      ctx.restore();
      cy += w;
      continue;
    }

    const cw = ctx.measureText(ch).width;
    if (V_ROTATE.includes(ch)){
      ctx.save();
      ctx.translate(x + size * 0.5, cy);
      ctx.rotate(Math.PI / 2);
      if (stroke > 0) ctx.strokeText(ch, 0, -size * 0.5);
      ctx.fillText(ch, 0, -size * 0.5);
      ctx.restore();
    } else if (V_CORNER.includes(ch)){
      // 句读在竖排里坐格子的右上角
      const px = x + size * 0.42, py = cy - size * 0.42;
      if (stroke > 0) ctx.strokeText(ch, px, py);
      ctx.fillText(ch, px, py);
    } else {
      const px = x + (size - cw) / 2;
      if (stroke > 0) ctx.strokeText(ch, px, cy);
      ctx.fillText(ch, px, cy);
    }
    if ('」』”'.includes(ch)) depth = Math.max(0, depth - 1);
    cy += size;
    i++;
  }
  return cy - y;
}

const CN = '〇一二三四五六七八九';
function cnNum(n){
  if (n <= 10) return n === 10 ? '十' : CN[n];
  if (n < 20)  return '十' + CN[n-10];
  return CN[Math.floor(n/10)] + '十' + (n%10 ? CN[n%10] : '');
}

