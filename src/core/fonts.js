// ════════════════════════════════════════════════════════════════════
//  2. 字
//     每款给一串候选族名，探到哪个用哪个。为什么不能只写一个：
//       · Windows 族名硬上限 31 字符（GDI 的 LF_FACESIZE），
//         「Zhuque Fangsong (technical preview)」在系统里叫「…(technical prev」
//       · 有的字 Windows 只认英文族名（朝華標題 → ZhaohuaMinA），有的只认中文
//     猜单个名字猜错＝浏览器静默退回宋体，不报错也看不出来。
// ════════════════════════════════════════════════════════════════════
const FONTS = [
  { id:'sys',      name:'系统宋体',  probes:[] },
  { id:'zhuque',   name:'朱雀仿宋',  probes:['Zhuque Fangsong (technical preview)','Zhuque Fangsong (technical prev','朱雀仿宋（预览测试版）','朱雀仿宋'] },
  { id:'jinghua',  name:'京華老宋',  probes:['KingHwaOldSong','京華老宋體','京華老宋体'] },
  { id:'huiwen',   name:'汇文明朝',  probes:['Huiwen-mincho','汇文明朝体'] },
  { id:'jinshu',   name:'寒蝉锦书',  probes:['寒蝉锦书宋','寒蟬錦書宋','ChillJinshuSong'] },
  { id:'chillhuo', name:'寒蝉活宋',  probes:['ChillHuoSong_F','寒蝉活宋体__'] },
  { id:'duanhei',  name:'寒蝉端黑',  probes:['寒蝉端黑宋Pro','寒蟬端黑宋Pro','ChillDuanHeiSongPro'] },
  { id:'nanxi',    name:'南西油墨',  probes:['NanxiYoumosong','南西油墨宋'] },
  { id:'nano',     name:'纳米老宋',  probes:['NanoOldSong-C','纳米老宋-C'] },
  { id:'chaohua',  name:'朝華標題',  probes:['ZhaohuaMinA','朝華標題A','朝华标题A','朝華見出明朝A'] },
  { id:'chaohuaB', name:'朝華標題B', probes:['ZhaohuaMinB Black','ZhaohuaMinB','朝華標題B','朝华标题B'] },
  // ⚠️ 鼎猎宋刻体：授权书禁止把字体「文件」嵌入网站/程序。这里只是调用系统里已装的字来
  //    渲染，属于正常用字，不是嵌入。但它的字体文件绝不可以随这个项目分发。
  { id:'dinglie',  name:'鼎猎宋刻',  probes:['dingliesongtypeface','鼎猎宋刻体'] },
  { id:'pixel',    name:'像素',      probes:['Fusion Pixel 12px Proportional'] },
];

// 西文字体：拼在中文字体**前面**，浏览器就只让它接管它有的字形（拉丁字母、数字、
// 西文标点），汉字自动落回后面的中文字体。这是字体栈本来的机制，不用做字符分流。
// 下面是 Windows/Office 自带的几款；自己下的字用「＋」装进来后也会出现在这一行。
const LATIN = [
  { id:'none',      name:'不指定',    probes:[] },
  // 系统自带
  { id:'georgia',   name:'Georgia',   probes:['Georgia'] },
  { id:'garamond',  name:'Garamond',  probes:['EB Garamond','Garamond','Adobe Garamond Pro'] },
  { id:'times',     name:'Times',     probes:['Times New Roman'] },
  { id:'cambria',   name:'Cambria',   probes:['Cambria'] },
  { id:'constantia',name:'Constantia',probes:['Constantia'] },
  { id:'palatino',  name:'Palatino',  probes:['Palatino Linotype','Book Antiqua'] },
  { id:'baskerv',   name:'Baskerville', probes:['Baskerville Old Face','Libre Baskerville','Baskerville'] },
  { id:'didot',     name:'Didot',     probes:['Bodoni MT','Didot','Playfair Display'] },
  // Google Fonts 上的几款（全部 OFL / Apache，可随包分发，见 docs/FONTS.md）
  { id:'fellEng',   name:'IM Fell English', probes:['IM FELL English'],    hint:'十七世纪活字' },
  { id:'fellPica',  name:'IM Fell DW Pica', probes:['IM FELL DW Pica'],    hint:'十七世纪活字' },
  { id:'elite',     name:'Special Elite',   probes:['Special Elite'],      hint:'打字机' },
  { id:'limelight', name:'Limelight',       probes:['Limelight'],          hint:'装饰体' },
  { id:'uncial',    name:'Uncial Antiqua',  probes:['Uncial Antiqua'],     hint:'安色尔' },
  { id:'smokum',    name:'Smokum',          probes:['Smokum'],             hint:'西部厚板' },
  { id:'beau',      name:'Beau Rivage',     probes:['Beau Rivage'],        hint:'花体' },
  { id:'jim',       name:'Jim Nightshade',  probes:['Jim Nightshade'],     hint:'哥特手写' },
  { id:'tages',     name:'Tagesschrift',    probes:['Tagesschrift'],       hint:'手写' },
  { id:'coral',     name:'Coral Pixels',    probes:['Coral Pixels'],       hint:'像素' },
];

// 宽度对比法：document.fonts.check() 在 Chrome 上对不存在的字体也返回 true，不能用
const probeCache = new Map();
function hasFont(family){
  if (!family) return true;
  if (probeCache.has(family)) return probeCache.get(family);
  const c = PLATFORM.canvas().getContext('2d');
  const s = '天地玄黄AWMil0';
  c.font = '72px monospace';               const base = c.measureText(s).width;
  c.font = `72px "${family}", monospace`;  const got  = c.measureText(s).width;
  const ok = Math.abs(got - base) > 0.5;
  probeCache.set(family, ok);
  return ok;
}
const resolveFont   = f => (f.probes || []).find(hasFont) || null;
const fontAvailable = f => !f.probes || !f.probes.length || !!resolveFont(f);

function cjkStack(id){
  if (id === 'auto'){
    for (const f of FONTS){ const hit = f.probes && f.probes.length && resolveFont(f); if (hit) return `"${hit}",${SYS}`; }
    return SYS;
  }
  const custom = cfg('myFonts').find(f => f.id === id);
  if (custom) return `"${custom.id}",${SYS}`;
  const f = FONTS.find(f => f.id === id);
  const hit = f && resolveFont(f);
  return hit ? `"${hit}",${SYS}` : SYS;
}
// 从任何一张表里把「系统里真正叫什么」解出来：自装的 → 中文表 → 西文表
function familyOf(id){
  const custom = cfg('myFonts').find(f => f.id === id);
  if (custom) return custom.id;
  const f = FONTS.find(x => x.id === id); if (f) return resolveFont(f);
  const l = LATIN.find(x => x.id === id); if (l) return resolveFont(l);
  return null;
}
// 标题可以挑中文字，也可以挑英文字。挑了英文字时它管拉丁，汉字自动落回正文的中文字体。
function titleStack(st){
  if (!st.titleFont || st.titleFont === 'same') return fontStack(st.font, st.latinFont);
  const hit = familyOf(st.titleFont);
  return hit ? `"${hit}",${cjkStack(st.font)}` : fontStack(st.font, st.latinFont);
}

// 西文字体拼在最前面。它没有的字形（汉字）浏览器会自动往后找，不用我们分流字符。
function fontStack(id, latinId){
  const base = cjkStack(id);
  const lid = latinId === undefined ? cfg('latinFont') : latinId;
  if (!lid || lid === 'none') return base;
  const custom = cfg('myFonts').find(f => f.id === lid);
  if (custom) return `"${custom.id}",${base}`;
  const l = LATIN.find(x => x.id === lid);
  const hit = l && resolveFont(l);
  return hit ? `"${hit}",${base}` : base;
}

const loadedCustom = new Set();
async function ensureCustomFonts(){
  for (const f of cfg('myFonts')){
    if (loadedCustom.has(f.id)) continue;
    try { const face = new FontFace(f.id, `url(${f.data})`); await face.load(); document.fonts.add(face); loadedCustom.add(f.id); }
    catch (e){ console.warn('[拾句] 装不上字体', f.name, e.message); }
  }
}

