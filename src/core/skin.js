// ════════════════════════════════════════════════════════════════════
//  1. 皮肤 token
// ════════════════════════════════════════════════════════════════════
const INKS = [
  { id:'black',   name:'墨黑', c:'#12100e' },
  { id:'sepia',   name:'深褐', c:'#4a3728' },
  { id:'indigo',  name:'靛青', c:'#1f3a55' },
  { id:'crimson', name:'绛红', c:'#6d2a24' },
  { id:'pine',    name:'松绿', c:'#26433a' },
  { id:'ash',     name:'烟灰', c:'#4b4a46' },
  // 浓色纸上黑字根本读不出来，下面这几支是给它们的
  { id:'paper',   name:'纸白', c:'#f6f2e9' },
  { id:'moon',    name:'月白', c:'#e9eef3' },
  { id:'gold',    name:'浅金', c:'#e3c987' },
  { id:'rose',    name:'藕荷', c:'#f1dade' },
  { id:'jade',    name:'霜青', c:'#d6e7df' },
];
// 墨可以是：预设 id ／ 存下来的 id ／ 直接一个 #rrggbb（临时调的，没存也能用）
function inkOf(id){
  if (typeof id === 'string' && id[0] === '#') return id;
  const mine = (cfg('myInks') || []).find(i => i.id === id);
  if (mine) return mine.c;
  return (INKS.find(i => i.id === id) || INKS[0]).c;
}
const allInks = () => INKS.concat(cfg('myInks') || []);
const QUOTE_ON_DARK = 'rgba(240,186,104,.92)';   // 深纸上橙引号要提亮，不然沉进去
const QUOTE  = 'rgba(199,113,12,.86)';
const RULE   = 'rgba(120,112,100,.34)';
const GREY   = 'rgba(90,84,76,.62)';
const SYS    = '"Songti SC","SimSun","宋体",serif';

// 版心。DPR=2，导出是这个尺寸的两倍。
// 横版是 5:4：与 2700×2160 的信纸素材严丝合缝，一个像素都不用裁。
const SIZES = {
  portrait : { name:'竖版', w:1080, h:1350, pad:104 },
  landscape: { name:'横版', w:1350, h:1080, pad:110 },
};
const DPR = 2;

// ── 配色：按对比度挑墨，不靠拍脑袋 ──────────────────────────────────
const hex2rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const chan = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
const relLum = ([r,g,b]) => 0.2126*chan(r) + 0.7152*chan(g) + 0.0722*chan(b);
function contrast(rgbA, rgbB){
  const a = relLum(rgbA), b = relLum(rgbB);
  return (Math.max(a,b) + 0.05) / (Math.min(a,b) + 0.05);
}
const bestInk = mean => allInks().reduce((best, i) =>
  contrast(hex2rgb(i.c), mean) > contrast(hex2rgb(best.c), mean) ? i : best, INKS[0]);

// 一套「版式」＝下面这些键（纸、字、色、排版全在内）。内容（正文/出处/日期）不在里面 —— 换版式不该动已经写好的字。
const STYLE_KEYS = ['paper','font','latinFont','fontSize','ink','metaInk','quoteInk','orient','pages',
                    'weight','titleFont','titleSize','titleWeight','inkLight','paperLight',
                    'align','titleAlign','vertical','offsetX','offsetY',
                    'headText','showHeader','showSource','showDate',
                    'headRule','titleRule','footRule','sourcePrefix','titleVertical'];

const BUILTIN_PRESETS = [
  { id:'p_zhai', name:'摘录', style:{ headText:'摘 录', showHeader:true, showSource:true, showDate:true,
      align:'left', titleAlign:'center', vertical:false, orient:'portrait', paper:'rice',
      ink:'black', metaInk:'auto', quoteInk:'auto', fontSize:46, titleSize:69, titleWeight:1, weight:0,
      offsetX:0, offsetY:0 } },
  { id:'p_riji', name:'日记', style:{ headText:'日 记', showHeader:true, showSource:false, showDate:true,
      align:'left', titleAlign:'left', vertical:false, orient:'portrait', paper:'cream',
      ink:'sepia', metaInk:'auto', quoteInk:'auto', fontSize:44, titleSize:57, titleWeight:0, weight:1,
      offsetX:0, offsetY:0 } },
  { id:'p_xin',  name:'信件', style:{ headText:'', showHeader:false, showSource:true, showDate:true,
      align:'left', titleAlign:'left', vertical:false, orient:'portrait', paper:'linen',
      ink:'indigo', metaInk:'auto', quoteInk:'auto', fontSize:42, titleSize:59, titleWeight:0, weight:0,
      offsetX:0, offsetY:0 } },
  { id:'p_shu',  name:'竖排', style:{ headText:'', showHeader:false, showSource:true, showDate:true,
      align:'left', titleAlign:'center', vertical:true, orient:'portrait', paper:'rice',
      ink:'black', metaInk:'auto', quoteInk:'auto', fontSize:44, titleSize:66, titleWeight:0, weight:0,
      offsetX:0, offsetY:0 } },
];

// 每次打开随机拿一句。Alt+Q 已经能空手起稿了，那句「选中的话，排成纸」不再准确。
const TAGLINES = [
  '我想记住的',
  '文字也认得写字的人吗？',
  '加入了我的一点私心',
  '再靠近我一点吧',
  '纸短情长',
  '万物与我，都是荒诞的静寂',
  '物是人非事事休',
  '房子实际上并没有这么大',
];

// 明暗调节。t ∈ [−0.5, 0.5]，正=往白走，负=往黑走。
// 纸的调法是盖一层同 alpha 的白/黑，算式与这里完全一致 ——
// 所以「算对比度用的均色」和「画出来的纸」永远是同一个数，不会各说各话。
const shade = (rgb, t) => t >= 0
  ? rgb.map(v => Math.round(v + (255 - v) * t))
  : rgb.map(v => Math.round(v * (1 + t)));
const rgb2css = ([r,g,b]) => `rgb(${r},${g},${b})`;
const inkColorOf = st => rgb2css(shade(hex2rgb(inkOf(st.ink)), (st.inkLight || 0) / 100));

