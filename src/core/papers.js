// ════════════════════════════════════════════════════════════════════
//  3. 纸：内置的全部用代码生成，不带素材；用户自己的纸另存
// ════════════════════════════════════════════════════════════════════
// 核心边界：这一层允许摸的外部名字只有 cfg/setCfg 和 PLATFORM
// （myPaper/packs 读 cfg，installPack 写 setCfg('packs')；造图走 PLATFORM.image）。
// wash = 三层云斑的强度。给大了纸会花成做旧咖啡渍，深色纸尤其敏感，所以逐种调。
const PAPERS = {
  rice : { name:'宣纸', base:'#f7f5f0', fiber:'rgba(120,105,80,.28)', fibers:240, grain:8, wash:[.15,.11,.09] },
  cream: { name:'米黄', base:'#f4ecd9', fiber:'rgba(150,125,80,.16)', fibers:90,  grain:6, wash:[.07,.06,.06] },
  kraft: { name:'牛皮', base:'#cdaa82', fiber:'rgba(105, 70, 38,.20)', fibers:200, grain:7, wash:[.05,.05,.05] },
  linen: { name:'布纹', base:'#f2efe6', fiber:'rgba(120,110,90,.12)', fibers:40,  grain:5, wash:[.06,.06,.07], weave:true },
  // flat = 一点纹理都不加。纯黑就该是纯黑，加了云斑和草屑反而脏。
  black: { name:'纯黑', base:'#000000', flat:true },
};

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

function blobLayer(w, h, cell, rnd){
  const sw = Math.max(2, Math.ceil(w/cell)), sh = Math.max(2, Math.ceil(h/cell));
  const c = PLATFORM.canvas(sw, sh);
  const ctx = c.getContext('2d'), img = ctx.createImageData(sw, sh);
  for (let i = 0; i < sw*sh; i++){
    const v = 128 + (rnd()-0.5)*255;
    img.data[i*4] = img.data[i*4+1] = img.data[i*4+2] = v; img.data[i*4+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const paperCache = new Map();
function makePaper(kind, w, h, seedShift){
  const key = `${kind}:${w}x${h}:${seedShift || 0}`;
  if (paperCache.has(key)) return paperCache.get(key);
  if (paperCache.size > 24) paperCache.clear();          // 多页 × 多尺寸，别无限涨
  const spec = PAPERS[kind] || PAPERS.rice;
  // 每一页的纸纹都不一样（真的一叠纸就是这样），但同一页每次重画都一样
  const rnd = mulberry32(0x5E1F + kind.length*977 + kind.charCodeAt(0)*13 + (seedShift || 0)*7919);
  const cv = PLATFORM.canvas(w, h);
  const ctx = cv.getContext('2d');

  ctx.fillStyle = spec.base; ctx.fillRect(0, 0, w, h);
  if (spec.flat){ paperCache.set(key, cv); return cv; }

  // soft-light 而不是 overlay：overlay 会把中间调对比拉爆，纸就花了
  ctx.globalCompositeOperation = 'soft-light';
  const wash = spec.wash || [.15, .11, .09];
  [[110, wash[0]], [30, wash[1]], [9, wash[2]]].forEach(([cell, alpha]) => {
    ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(blobLayer(w, h, cell, rnd), 0, 0, w, h);
  });
  ctx.globalAlpha = spec.grain / 100;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(blobLayer(w, h, 1.6, rnd), 0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true;

  // 织纹：不能画连续直线 —— 规则栅格在任何缩放比例下都起摩尔纹，缩略图上就成了方格纸
  if (spec.weave){
    ctx.lineWidth = 1; ctx.lineCap = 'butt';
    for (let y = 0; y < h; y += 3){
      let x = rnd()*6;
      while (x < w){
        const seg = 3 + rnd()*11;
        ctx.strokeStyle = `rgba(150,142,124,${(.035 + rnd()*.045).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(x, y+.5); ctx.lineTo(Math.min(w, x+seg), y+.5); ctx.stroke();
        x += seg + 1 + rnd()*5;
      }
    }
    for (let x = 0; x < w; x += 3){
      let y = rnd()*6;
      while (y < h){
        const seg = 3 + rnd()*11;
        ctx.strokeStyle = `rgba(150,142,124,${(.030 + rnd()*.040).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(x+.5, y); ctx.lineTo(x+.5, Math.min(h, y+seg)); ctx.stroke();
        y += seg + 1 + rnd()*5;
      }
    }
  }

  ctx.strokeStyle = spec.fiber; ctx.lineCap = 'round';
  for (let i = 0; i < spec.fibers; i++){
    const x = rnd()*w, y = rnd()*h, len = 4 + rnd()*26, ang = rnd()*Math.PI*2;
    ctx.lineWidth = rnd() < .18 ? 1.7 : 0.9;
    ctx.globalAlpha = .25 + rnd()*.65;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(ang)*len*.6 + (rnd()-.5)*7,
                         y + Math.sin(ang)*len*.6 + (rnd()-.5)*7,
                         x + Math.cos(ang)*len,     y + Math.sin(ang)*len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const g = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*.32, w/2, h/2, Math.max(w,h)*.78);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,78,58,.09)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  paperCache.set(key, cv);
  return cv;
}

const myPaperImgs = new Map();
function myPaper(id){
  if (myPaperImgs.has(id)) return myPaperImgs.get(id);
  const rec = cfg('myPapers').find(p => p.id === id);
  if (!rec) return null;
  const img = PLATFORM.image(); img.src = rec.data;
  myPaperImgs.set(id, img);
  return img;
}

// ── 素材包：横竖成对，按当前版式自动取对应那张 ──────────────────────
// 3MB 的图不塞进脚本本体（脚本会被注入到你打开的每一个网页），
// 而是导入一次进 GM 存储 —— GM 存储是跨网站共享的，导完就等于常驻在插件里。
let _packs = null;
const packs = () => (_packs || (_packs = cfg('packs') || []));
const packSet = key => packs().find(s => s.key === key);
const packImgs = new Map();
function packImg(key, orient){
  const id = key + ':' + orient;
  if (packImgs.has(id)) return packImgs.get(id);
  const s = packSet(key); if (!s) return null;
  const img = PLATFORM.image(); img.src = s[orient] || s.portrait;
  packImgs.set(id, img);
  return img;
}

// 一张纸的代表色 —— 用来给它配墨。lightAdj 是「调完亮度之后」的样子。
const meanCache = new Map();
function paperMean(paperId, lightAdj){
  const base = paperMeanRaw(paperId);
  return lightAdj ? shade(base, lightAdj / 100) : base;
}
function paperMeanRaw(paperId){
  if (meanCache.has(paperId)) return meanCache.get(paperId);
  let rgb = [247, 245, 240];
  if (paperId.startsWith('pk:')){
    const s = packSet(paperId.slice(3));
    if (s && s.mean) rgb = s.mean;
  } else if (paperId.startsWith('my:')){
    const img = myPaper(paperId.slice(3));
    if (img && img.complete && img.naturalWidth){
      const c = PLATFORM.canvas(1, 1);
      const cx = c.getContext('2d'); cx.drawImage(img, 0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data; rgb = [d[0], d[1], d[2]];
    } else return rgb;                       // 还没解码完，先别记进缓存
  } else if (PAPERS[paperId]){
    rgb = hex2rgb(PAPERS[paperId].base);
  }
  meanCache.set(paperId, rgb);
  return rgb;
}
function drawCover(ctx, src, w, h){
  const sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight;
  if (!sw || !sh) return false;
  const s = Math.max(w/sw, h/sh);
  ctx.drawImage(src, (w - sw*s)/2, (h - sh*s)/2, sw*s, sh*s);
  return true;
}


// 装素材包。抽成独立函数，好让自测直接喂真文件进来验（不用去点文件选择框）。
// opt.warm === false：装完**不**预解码。
// 🔴 预热那一步在浏览器里是必要的（导完包马上点纸，不预热会点开一张白的），
//    但它的代价是把 20 套 × 竖横两版 = 40 张 2160×2700 全解进内存 ≈ 930MB。
//    服务端（MCP）没人点纸，只在真要画的那一刻取一张，所以让它能关掉。
async function installPack(text, opt = {}){
  const data = JSON.parse(text);
  const sets = (data.sets || []).filter(s => s.key && (s.portrait || s.landscape));
  if (!sets.length) throw new Error('这个文件里没有可用的信纸');
  // 先把这一份记在内存里，再谈存不存得下 —— 存不下（localStorage 只有 ~5MB）也不该
  // 让刚导进来的纸当场消失。存不下的话回头告诉用户「这次能用，下次还得再导」。
  const kept = setCfg('packs', sets);
  _packs = sets; packImgs.clear(); meanCache.clear();
  installPack.persisted = kept;
  // 等图真的解码完再说「装好了」，不然点开一张纸是白的
  if (opt.warm !== false)
    await Promise.all(sets.flatMap(s => ['portrait','landscape'].map(o => new Promise(r => {
      const im = packImg(s.key, o); if (!im || im.complete) return r();
      im.onload = r; im.onerror = r;
    }))));
  return sets.length;
}
