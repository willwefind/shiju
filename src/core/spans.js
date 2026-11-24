// ════════════════════════════════════════════════════════════════════
//  4b. 局部样式：选中的那几个字，单独的字号 / 字体 / 颜色 / 粗细 / 浓淡
// ════════════════════════════════════════════════════════════════════
// 存法：[{ s, e, size?, font?, ink?, weight? }]，s/e 是**原文**里的下标（左闭右开）。
// 没写的那几项＝跟着整篇走。它是内容不是版式，所以不进 STYLE_KEYS ——
// 换一套版式，已经单独改过的字不该跟着变。
// 字号是绝对像素，理由跟标题一样：按百分比算的话，一动正文字号它就跟着跑。
//
// 编辑期一律摊成「逐字一格」再收回来。几千字的文章摊开也就几千格，
// 换来的是：重叠、拆分、合并、插字、删字全都只有一种写法。
const SPAN_KEYS = ['size', 'font', 'ink', 'weight', 'alpha'];

function spanStyle(o){
  const r = {};
  if (Number.isFinite(+o.size) && +o.size > 0) r.size = Math.max(12, Math.min(300, Math.round(+o.size)));
  if (typeof o.font === 'string' && o.font && o.font !== 'same') r.font = o.font;
  if (typeof o.ink  === 'string' && o.ink  && o.ink  !== 'same') r.ink  = o.ink;
  if (o.weight === 0 || o.weight === 1 || o.weight === 2) r.weight = o.weight;
  if (typeof o.alpha === 'number' && o.alpha >= 0 && o.alpha < 1) r.alpha = Math.max(.05, Math.round(o.alpha * 100) / 100);      // 1 ＝ 不淡，等于没改
  return Object.keys(r).length ? r : null;
}
const sameMark = (a, b) => a === b || (!!a && !!b && SPAN_KEYS.every(k => a[k] === b[k]));

function spansToMarks(spans, len){
  const marks = new Array(len).fill(null);
  for (const sp of Array.isArray(spans) ? spans : []){
    const m = sp && spanStyle(sp);
    if (!m) continue;
    const s = Math.max(0, sp.s | 0), e = Math.min(len, sp.e | 0);
    for (let i = s; i < e; i++) marks[i] = marks[i] ? { ...marks[i], ...m } : m;
  }
  return marks;
}
function marksToSpans(marks){
  const out = [];
  for (let i = 0; i < marks.length;){
    let j = i + 1;
    while (j < marks.length && sameMark(marks[i], marks[j])) j++;
    if (marks[i]) out.push({ s: i, e: j, ...marks[i] });
    i = j;
  }
  return out;
}

// 给 [s,e) 盖一层样式。patch 里某项给 null ＝ 把那一项还给整篇。
function paintSpans(spans, len, s, e, patch){
  const marks = spansToMarks(spans, len);
  for (let i = Math.max(0, s); i < Math.min(len, e); i++){
    const m = { ...(marks[i] || {}) };
    for (const k of SPAN_KEYS) if (k in patch){ if (patch[k] == null) delete m[k]; else m[k] = patch[k]; }
    marks[i] = spanStyle(m);
  }
  return marksToSpans(marks);
}

// 改了字之后，样式要跟着自己的字走。caret ＝ 改完之后光标在哪 ——
// 「啊啊啊」里再敲一个「啊」，光看前后文分不出敲在第几个，得靠光标说了算。
// 规矩：在一截改过样式的字**中间**插字，跟着那一截；贴着它的尾巴往后写，不跟
// （改的是「选中的那几个字」，不是从此以后）。选中一截直接打字替换，跟被换掉的首字。
function shiftSpans(spans, oldText, newText, caret){
  if (!spans || !spans.length || oldText === newText) return spans || [];
  const ol = oldText.length, nl = newText.length;
  const c = caret == null ? nl : Math.max(0, Math.min(nl, caret));
  let suf = 0;
  const sufMax = Math.min(ol, nl - c);
  while (suf < sufMax && oldText[ol - 1 - suf] === newText[nl - 1 - suf]) suf++;
  let pre = 0;
  const preMax = Math.min(ol, nl) - suf;
  while (pre < preMax && oldText[pre] === newText[pre]) pre++;
  const marks = spansToMarks(spans, ol);
  const cut = ol - suf - pre, add = nl - suf - pre;       // 旧的去掉几个、新的添几个
  const left = marks[pre - 1] || null, right = marks[pre] || null;
  const carry = cut > 0 ? right : (sameMark(left, right) ? right : null);
  marks.splice(pre, cut, ...new Array(add).fill(carry));
  return marksToSpans(marks);
}

// 选中这一段眼下是什么样。某一项不统一时，mixed 里记一笔。
function spanCommon(spans, len, s, e){
  const marks = spansToMarks(spans, len).slice(s, e);
  const out = { mixed: {}, any: marks.some(Boolean) };
  for (const k of SPAN_KEYS){
    const v0 = marks[0] ? marks[0][k] : undefined;
    if (marks.every(m => (m ? m[k] : undefined) === v0)) out[k] = v0; else out.mixed[k] = true;
  }
  return out;
}

// 排版用：原文 → 逐字的「落定样式」。一处都没单独改过就返回 null，走老路，一个像素不动。
// base = { size, stack, weight }，就是整篇（或标题）自己的样子。
function richOf(spans, len, base, st){
  const marks = spansToMarks(spans, len);
  if (!marks.some(Boolean)) return null;
  const plain = { size: base.size, stack: base.stack, ink: null,
                  stroke: strokeFor(base.weight, base.size), plain: true };
  const seen = new Map();
  return marks.map(m => {
    if (!m) return plain;
    const key = JSON.stringify(SPAN_KEYS.map(k => m[k]));
    if (!seen.has(key)){
      const size = m.size || base.size;
      const weight = m.weight === undefined ? base.weight : m.weight;
      seen.set(key, { size, stack: m.font ? pickStack(m.font, st, base.stack) : base.stack,
                      ink: m.ink ? inkOf(m.ink) : null, stroke: strokeFor(weight, size), alpha: m.alpha });
    }
    return seen.get(key);
  });
}
// 截一行的样式。整行都没改过就给 null —— 老路画出来的才是从前那一行。
const sliceRich = (rich, a, b) => {
  if (!rich) return null;
  const r = rich.slice(a, b);
  return r.some(x => !x.plain) ? r : null;
};
const maxSize = (rich, size) => rich && rich.length ? rich.reduce((m, x) => Math.max(m, x.size), 0) : size;
const styleFont = s => `${s.size}px ${s.stack}`;

