// 拾句 · 排版计划回归样本 + 摘要口径
//
// 样本文字全部为本仓测试新写的合成文字，不摘自任何真实语料。
// 摘要（digest）里放什么，标准只有一条：**排版重构可能改坏的东西，都要在里面** ——
// 不只分行结果，还有 chrome 的占位、标题块尺寸、每一块的高度。
// 逐像素不比：Canvas/Skia/抗锯齿天然有差；这里比的是「同一段文字排出同样的
// 分行、同样的避头尾、同样的分页、同样的坐标」。

const BASE = {
  text: '', title: '', source: '样本', date: '2026.08.23', headText: '摘 录',
  paper: 'rice', font: 'sys', latinFont: 'none', fontSize: 46, titleSize: 69,
  ink: 'black', metaInk: 'auto', quoteInk: 'auto', orient: 'portrait', pages: 'auto',
  weight: 0, titleFont: 'same', titleWeight: 1, inkLight: 0, paperLight: 0,
  align: 'left', titleAlign: 'center', vertical: false, titleVertical: false,
  offsetX: 0, offsetY: 0, sourcePrefix: '—— ',
  headRule: true, titleRule: true, footRule: true,
  showHeader: true, showSource: true, showDate: true,
};

const mk = over => ({ ...BASE, ...over });

// 短中文 + 引号 + 句读 —— 避头尾的基本盘
const T_SHORT =
  '灯下翻旧账，纸页有些返潮。有人说：「字要一笔一笔写，路要一步一步走。」' +
  '窗外的雨停了又下，下了又停。';

// 中英混排 + 长英文词 + 硬换行 + 段内空行
const T_MIXED =
  '样本第 12 页写着 test-run-2026 与 mixed-width-sample 两个词——整词不许拦腰断开。\n' +
  '下一行从这里开始，验证硬换行。\n' +
  '\n' +
  'The five boxing wizards jump quickly, and the plain page holds them all.';

// 标点连环 —— 引号嵌套、问叹省破顿逗句一网打尽
const T_PUNCT =
  '「你听——」他顿了顿，又说：『风从北边来，卷着沙；也卷着一点旧年的味道。』' +
  '问号呢？有！省略号……破折号——顿号、逗号、句号，全在这一段里等着被排。';

// 长文 —— 段落长短不一，逼出多页与均摊分页
const T_LONG = [
  '院子里的光是从东墙上下来的，先落在水缸沿上，再一点点挪到砖缝里。没有人催它，它也不急。',
  '早年这里种过一棵石榴，后来挪走了，地上留下一圈浅浅的印子。下雨的时候，那圈印子先湿。',
  '扫帚靠在门后，穗子磨秃了一半。用它扫台阶的人换了几茬，台阶还是那几级。',
  '猫从墙头走过，不看任何人。它有自己的路线，和节气一样准。',
  '这一段是为了把纸撑满，好让分页真的分出好几页来，不然「多页」这条路根本没被走到。',
  '再来一段，作用是占地方。字数不必好看，但也不能是乱码——乱码看不出避头尾对得对不对。',
].join('\n\n');

export const FIXTURES = [
  // 最基本的一张：横排、有标题、宣纸
  { name: '基本横排有题', st: mk({ text: T_SHORT, title: '返潮' }) },

  // 竖排正文 + 竖排标题：wrapVertical / vAdvance / chrome 竖排分支全在这里
  { name: '竖排正文竖标题', st: mk({
      text: T_PUNCT, title: '北风', vertical: true, titleVertical: true,
      source: '一段很长的出处，长到必须折成好几列才放得下的那种' }) },

  // 竖排正文 + 横标题（常见排法）
  { name: '竖排正文横标题', st: mk({ text: T_SHORT, title: '返潮', vertical: true }) },

  // 横版纸 + 英文密集 + 硬换行 + 段内空行
  { name: '横版英文混排', st: mk({
      text: T_MIXED, title: 'Plain Page', orient: 'landscape',
      align: 'center', titleAlign: 'left' }) },

  // 指定页数 → paginate 的 forceN 均摊那条路
  { name: '强制三页', st: mk({ text: T_LONG, title: '院子', pages: '3' }) },

  // auto 多页：长文自然溢出
  { name: '自动多页', st: mk({ text: T_LONG, title: '', fontSize: 58 }) },

  // 没标题、没题头、没出处、没日期 —— chrome 的每个开关都关掉
  { name: '光板无题头', st: mk({
      text: T_SHORT, title: '', showHeader: false, showSource: false, showDate: false,
      align: 'right', fontSize: 64 }) },

  // 题头和出处都很长 → 占位必须按真实折行数算（题头 22px、出处 26px，
  // 版心 872：不到四十个字根本填不满一行，所以这两段必须真的很长）
  { name: '长题头长出处', st: mk({
      text: T_SHORT, title: '一个相当长的标题也要能自己折行不冲出版心',
      headText: '这是一个长得出奇的题头，长到必须折成好几行才放得下——再添半句，让它无论如何都得折行才装得下',
      source: '某本没有名字的册子 · 第二章 · 关于院子与季节的那一节 · 兼论水缸沿上那一道光的来历与去处',
      titleSize: 96 }) },

  // 竖排 + 强制两页：竖排往左流，装不下要加宽（grow 走 W 不是 H）
  { name: '竖排强制两页', st: mk({ text: T_LONG, title: '院子', vertical: true, pages: '2' }) },

  // 标点连环横排 + 自定义出处前缀
  { name: '标点连环横排', st: mk({ text: T_PUNCT, title: '听风', sourcePrefix: '△ ' }) },
];

// 浮点只在 measureText 那层出现，摘要里的量基本都被 round 过；
// 万一漏一个浮点进来，最后几位不同不该判红，统一收到 3 位小数。
export function norm(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? v : Math.round(v * 1000) / 1000;
  if (Array.isArray(v)) return v.map(norm);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = norm(v[k]);
    return o;
  }
  return v;
}

// 一份 st → 一份可序列化摘要。**只走公开导出的那几个函数** ——
// 核心怎么重构都行，只要这几个入口的行为不变。
export function digest(S, st, mkGauge) {
  const plan = S.planPages(st, mkGauge);
  const ch = plan.ch, tb = plan.title;
  return norm({
    W: plan.W, H: plan.H, COL: plan.COL, box: plan.box, stack: plan.stack,
    chrome: {
      head: ch.head, src: ch.src, foot: ch.foot,
      title: ch.title, titleW: ch.titleW, headW: ch.headW, metaW: ch.metaW,
      headLines: ch.headLines || null, srcLines: ch.srcLines || null,
      headCols: ch.headCols || null, srcCols: ch.srcCols || null, dateCols: ch.dateCols || null,
    },
    title: { size: tb.size, lh: tb.lh, w: tb.w, h: tb.h, vertical: tb.vertical, lines: tb.lines },
    pages: plan.pages.map(pg => pg.map(it => (it.gap ? { gap: it.h } : { h: it.h, text: it.text }))),
  });
}

// 逐字段深比，报到具体那一格。
export function diffPlans(a, b) {
  const out = [];
  const isObj = v => v && typeof v === 'object';
  const walk = (x, y, at) => {
    if (JSON.stringify(x) === JSON.stringify(y)) return;
    if (!isObj(x) || !isObj(y) || Array.isArray(x) !== Array.isArray(y)) {
      out.push({ at, a: x, b: y });
      return;
    }
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], at + '.' + k);
  };
  for (const n of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[n], b[n], n);
  return out;
}
