// ════════════════════════════════════════════════════════════════════
//  7. 界面（关在 shadow DOM 里，免得被网站的 CSS 冲了）
// ════════════════════════════════════════════════════════════════════
const CSS = `
:host{all:initial}
*{box-sizing:border-box;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.mask{
  --bg:#faf8f4; --fg:#12100e; --dim:#8a8580; --line:#d7d1c7; --field:#fff;
  --btn:#fff; --on-bg:#12100e; --on-fg:#faf8f4; --soft:#e6e1d8; --veil:rgba(28,26,22,.55);
  --shadow:0 24px 70px rgba(0,0,0,.4);
}
.mask.night{
  --bg:#1b1a18; --fg:#eae6de; --dim:#8f8a82; --line:#3a3733; --field:#232120;
  --btn:#232120; --on-bg:#eae6de; --on-fg:#1b1a18; --soft:#332f2c; --veil:rgba(8,7,6,.72);
  --shadow:0 24px 70px rgba(0,0,0,.65);
}
.pill{position:fixed;z-index:2147483646;background:#12100e;color:#f7f5f0;border:0;border-radius:999px;
      padding:7px 15px;font-size:13px;letter-spacing:.14em;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3)}
/* 🔴 手机上的「整体上移」就出在这儿。软键盘一弹、地址栏一收放，浏览器缩的是
   **visual viewport**，并且把 layout viewport 往上推；position:fixed 钉的是后者 ——
   面板于是有一截顶到屏幕外，底下露出网页，看着就像整页往上跑了。
   带 data-vv 的那条把遮罩直接钉在 visual viewport 上（尺寸由 JS 实时喂）。
   上面四条 top/right/bottom/left 是兜底：写 inset 简写的话，老一点的
   安卓内核（X浏览器/Via 那批）整条声明会被丢掉，遮罩缩成内容大小，veil 盖不满屏。 */
.mask{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;background:var(--veil);
      display:flex;align-items:center;justify-content:center;padding:18px;
      overflow:hidden;overscroll-behavior:contain}
.mask[data-vv]{right:auto;bottom:auto;
      left:var(--vvl,0px);top:var(--vvt,0px);width:var(--vvw,100%);height:var(--vvh,100%)}
/* max-height 跟着遮罩的实高走，不跟 vh —— vh 量的是「地址栏收起时」的大视口，
   手机上永远比眼前这块屏高一截。 */
.box{background:var(--bg);border-radius:8px;max-width:1240px;width:100%;max-height:100%;
     display:flex;gap:18px;padding:18px;box-shadow:var(--shadow)}
.side{width:308px;flex:0 0 308px;overflow:auto;overscroll-behavior:contain;padding-right:6px}
.side h2{margin:0 0 2px;font-size:14px;letter-spacing:.16em;color:var(--fg)}
.side p.h{margin:0 0 12px;font-size:11px;color:var(--dim)}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.1em;
      color:var(--dim);margin:13px 0 5px}
/* 🔴 这三条原本写的是「label .sw …」（这段 CSS 住在模板字符串里，注释别用反引号）
   —— 可 .sw 有一半根本不在 label 里
   （常/中/粗 那两排在 .fs 行里，跟随/白天/黑夜 在 h2 里）。结果那些按钮拿的是浏览器
   默认样式：灰底黑字，而且**选中的那颗跟没选中的长得一模一样**，按了不知道按没按上。
   去掉 label 前缀，一视同仁。 */
.sw{display:flex;gap:4px}
.sw button{border:1px solid var(--line);background:var(--btn);border-radius:3px;font-size:10px;
      padding:2px 7px;cursor:pointer;color:var(--dim);letter-spacing:0}
.sw button[aria-pressed=true]{background:var(--on-bg);color:var(--on-fg);border-color:var(--on-bg)}
textarea,input[type=text]{width:100%;border:1px solid var(--line);border-radius:4px;padding:8px;
     font:13px/1.7 inherit;background:var(--field);resize:vertical;color:var(--fg)}
textarea{height:110px}
input[type=text]:disabled{opacity:.5}
.row{display:flex;gap:5px;flex-wrap:wrap}
.row button{flex:1 1 auto;min-width:52px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:7px 4px;border:1px solid var(--line);background:var(--btn);
     border-radius:4px;cursor:pointer;font-size:12px;color:var(--fg)}
.row button[aria-pressed=true]{background:var(--on-bg);color:var(--on-fg);border-color:var(--on-bg)}
.row button[data-off=1]{opacity:.4}
.row button.add{flex:0 0 auto;min-width:32px;color:var(--dim)}
.inks button,.row button.sw2{position:relative;padding-left:22px}
.inks i,.row button.sw2 i{position:absolute;left:6px;top:50%;transform:translateY(-50%);
     width:10px;height:10px;border-radius:50%;border:1px solid rgba(128,128,128,.35)}
/* 分页标签：东西一多，平铺的按钮墙就没法看了，拆成几屏 */
.tabs{display:flex;gap:2px;margin:12px 0 0;border-bottom:1px solid var(--line)}
.tabs button{flex:1;padding:7px 2px;border:0;background:transparent;color:var(--dim);
     font-size:12px;letter-spacing:.1em;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.tabs button[aria-pressed=true]{color:var(--fg);border-bottom-color:var(--on-bg)}
.pane{display:none;padding-top:2px}
.pane.on{display:block}
/* 纸：直接看缩略图，比看名字快得多 */
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.sw3{position:relative;aspect-ratio:4/5;border-radius:3px;overflow:hidden;padding:0;
     border:1px solid var(--line);background:var(--btn);cursor:pointer}
.sw3 img,.sw3 canvas{width:100%;height:100%;object-fit:cover;display:block}
.sw3 b{position:absolute;left:0;right:0;bottom:0;font-size:9px;font-weight:400;
     background:rgba(18,16,14,.5);color:#fbfaf7;padding:1px 2px;line-height:1.3;
     white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sw3[aria-pressed=true]{outline:2px solid var(--on-bg);outline-offset:1px}
.sw3.plus{display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--dim);aspect-ratio:4/5}
/* 字：每一行用它自己的样子写出来，这才叫挑字体 */
.flist{display:flex;flex-direction:column;gap:3px}
.flist button{display:flex;align-items:baseline;gap:8px;width:100%;text-align:left;
     padding:6px 9px;border:1px solid var(--line);background:var(--btn);color:var(--fg);
     border-radius:4px;cursor:pointer;font-size:16px;line-height:1.35}
.flist button[aria-pressed=true]{background:var(--on-bg);color:var(--on-fg);border-color:var(--on-bg)}
.flist button[data-off=1]{opacity:.38}
.flist button i{font-style:normal;font-size:10px;opacity:.6;font-family:-apple-system,sans-serif;margin-left:auto}
.sub{font-size:10px;color:var(--dim);margin:10px 0 4px;letter-spacing:.08em}
.fs{display:flex;gap:8px;align-items:center}
/* min-width:0 —— 少了它，range 撑在自己 129px 的固有宽度上不肯缩，
   「滑块＋数字框＋常中粗」这一行就顶破 308px 的侧栏，底下冒出一条横向滚动条。 */
.fs input[type=range]{flex:1;min-width:0}
.fs input[type=number]{width:62px;border:1px solid var(--line);border-radius:4px;padding:5px 6px;
     font:13px inherit;text-align:center;color:var(--fg);background:var(--field)}
.fs .val{width:44px;text-align:right;font-size:11px;color:var(--dim)}
.acts{display:flex;gap:8px;margin-top:14px}
.acts button{flex:1;padding:10px;border:0;border-radius:4px;font-size:13px;letter-spacing:.14em;cursor:pointer}
.save{background:var(--on-bg);color:var(--on-fg)}
.copy{background:var(--soft);color:var(--fg)}
.close{background:transparent;color:var(--dim);border:1px solid var(--line)!important}
.tip{font-size:11px;color:var(--dim);min-height:30px;line-height:1.55;margin-top:8px}
.view{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.count{font-size:11px;color:var(--dim);letter-spacing:.08em;flex:0 0 auto}
.pages{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;display:flex;flex-wrap:wrap;gap:14px;align-content:flex-start;
       justify-content:center;padding:4px}
.pg{position:relative;cursor:pointer}
/* touch-action:pinch-zoom —— 整块位移是在画布上按住拖出来的。触屏上不写这一句，
   单指拖会被浏览器当成滚动手势收走（pointerdown 里 preventDefault 挡不住滚动，
   挡它的就是 touch-action），于是手机上「拖不动」。留着 pinch-zoom 是为了还能双指放大看细节。 */
.pg canvas{display:block;max-width:100%;box-shadow:0 6px 20px rgba(0,0,0,.18);border-radius:2px;
       outline:2px solid transparent;outline-offset:3px;touch-action:pinch-zoom}
.pg[aria-selected=true] canvas{outline-color:rgba(185,32,11,.7)}
.mask.bare .pg canvas{background:repeating-conic-gradient(#d9d9d9 0 25%,#f4f4f4 0 50%) 0 0/18px 18px}
.pg span{position:absolute;left:6px;top:6px;background:rgba(18,16,14,.72);color:#faf8f4;
       font-size:10px;padding:1px 6px;border-radius:3px}

/* 手机：左右分栏在窄屏上必死 —— 侧栏钉死 308px，预览区被挤成 0 宽，
   实测 375px 视口下画布量出来就是 0×0（能操作，但一眼都看不见成品）。
   改成上下叠：预览在上，控制在下。 */
@media (max-width: 760px){
  .mask{padding:0}
  .box{flex-direction:column;gap:10px;padding:12px;border-radius:0;
       width:100%;height:100%;max-height:100%}
  /* 55%：竖版卡片按屏宽铺开正好这么高，整张能一眼看全，不用滚。
     原来写的是 55vh —— vh 认的是地址栏收起时的大视口，键盘一弹它比整个面板还高，
     底下的控制区被挤成零；而 dvh 老内核不认，整条 height 被丢掉。都换成百分比，
     一路跟着 .box → .mask → visual viewport。 */
  .view{order:-1;flex:0 0 auto;max-height:55%;min-height:0}
  .pages{padding:0;gap:8px}
  .side{width:auto;flex:1 1 auto;padding-right:0}
  .side h2{font-size:13px}
  textarea{height:88px}
  .acts button{padding:12px}
  /* 手指按不准 24px 高的按钮。桌面上 29×24 够用，手机上把这几排撑开。 */
  .tabs button{padding:11px 2px;font-size:13px}
  .sw button{padding:10px 11px;font-size:11px}
  .row button{padding:10px 6px}
}
/* 「摘」那颗药丸也一样：手指点得中才算数 */
@media (pointer: coarse){
  .pill{padding:11px 20px;font-size:14px}
}
`;

let host, root, pill, mask, tipEl, hideTimer, vvStop = null;
let pageCanvases = [], selected = 0;

function ui(){
  if (host && host.isConnected) return;
  host = document.createElement('div');
  host.style.cssText = 'all:initial;position:static';
  root = host.attachShadow({ mode: 'open' });
  const st = document.createElement('style'); st.textContent = CSS + PICK_CSS + BLIND_CSS; root.append(st);
  document.documentElement.append(host);
  pill = null;
}

function showPill(x, y, text){
  ui();
  if (!pill){
    pill = document.createElement('button');
    pill.className = 'pill'; pill.textContent = t('pill.clip');
    pill.onmousedown = e => e.preventDefault();     // 别让点击清掉选区
    root.append(pill);
  }
  setStudioLocale(panelLocale()); pill.textContent = t('pill.clip');      // 在面板上换过语言，这颗也跟着
  pill.style.left = Math.min(x, innerWidth - 70) + 'px';
  pill.style.top  = Math.max(8, y - 44) + 'px';
  pill.hidden = false;
  pill.onclick = () => { pill.hidden = true; openPanel(text); };
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { if (pill) pill.hidden = true; }, 7000);
}

// 把遮罩钉在 visual viewport 上：offsetLeft/Top 抵掉浏览器推 layout viewport 的那一下，
// width/height 是键盘/地址栏之后**眼前真正剩下**的那块屏。返回撤销函数。
// 没有 visualViewport 的老浏览器直接走 CSS 里 top/right/bottom/left 那套兜底。
function trackViewport(el){
  const vv = window.visualViewport;
  if (!vv) return () => {};
  const apply = () => {
    el.style.setProperty('--vvl', vv.offsetLeft + 'px');
    el.style.setProperty('--vvt', vv.offsetTop  + 'px');
    el.style.setProperty('--vvw', vv.width      + 'px');
    el.style.setProperty('--vvh', vv.height     + 'px');
  };
  apply();                       // 先喂尺寸再挂 data-vv，免得有一帧钉在错地方
  el.setAttribute('data-vv', '');
  vv.addEventListener('resize', apply);
  vv.addEventListener('scroll', apply);
  return () => { vv.removeEventListener('resize', apply); vv.removeEventListener('scroll', apply); };
}

const p2 = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}.${p2(d.getMonth()+1)}.${p2(d.getDate())}`; };
const stampName = () => { const d = new Date(); return `${d.getFullYear()}${p2(d.getMonth()+1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`; };
const readFile = (file, as) => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej;
  as === 'url' ? r.readAsDataURL(file) : r.readAsArrayBuffer(file);
});
const pickFiles = accept => new Promise(res => {
  const i = document.createElement('input');
  i.type = 'file'; i.accept = accept; i.multiple = true;
  i.onchange = () => res([...i.files]); i.click();
});

// init 是给嵌入方（比如阅读器）的缝：{ title, source, date } 预填内容，
// onClose 在面板真正关掉后回调一次（嵌入方拿它恢复自己的阅读位置/焦点）。
// 不传 init 时行为与从前完全相同 —— 网页选中路径一个字都没变。
function openPanel(text, init = {}){
  // 语言先落定再建面板：面板 HTML 是开面板时现拼的，t() 在拼的那一刻取词
  setStudioLocale(panelLocale(init.locale));
  // 嵌入方可为可再分发西文字体提供文件 URL（{latinId: url}）——选中才装载
  const embedFontUrls = (init.fontUrls && typeof init.fontUrls === 'object') ? init.fontUrls : {};
  ui();
  if (vvStop) { vvStop(); vvStop = null; }
  if (mask) mask.remove();
  const blank = !String(text || '').trim();     // 空手起稿（写日记随笔），不是从网页上摘的
  const st = {
    text: text || '',
    // 空手写的时候，出处默认给空 —— 那是自己写的话，不是从这个网页摘的
    source: init.source != null ? String(init.source).slice(0, 200)
          : blank ? '' : (document.title || location.hostname).slice(0, 200),
    headText: cfg('headText'),
    date  : init.date != null ? String(init.date) : today(),
    title: init.title != null ? String(init.title) : '',
    blind: null,                    // 版式盲盒：null = 普通版式
    noGround: false,                // 透明底：不铺纸，存成 PNG
    spans: [], titleSpans: [],      // 选中的字单独改过的样式（spans.js）
    paper: cfg('paper'), font: cfg('font'), fontSize: cfg('fontSize'), ink: cfg('ink'),
    orient: cfg('orient'), pages: cfg('pages'),
    weight: cfg('weight'), latinFont: cfg('latinFont'),
    align: cfg('align'), titleAlign: cfg('titleAlign'), vertical: cfg('vertical'),
    offsetX: cfg('offsetX'), offsetY: cfg('offsetY'), metaInk: cfg('metaInk'),
    quoteInk: cfg('quoteInk'),
    headRule: cfg('headRule'), titleRule: cfg('titleRule'), footRule: cfg('footRule'),
    titleVertical: cfg('titleVertical'),
    sourcePrefix: cfg('sourcePrefix'),
    titleFont: cfg('titleFont'), titleSize: cfg('titleSize'), titleWeight: cfg('titleWeight'),
    inkLight: cfg('inkLight'), paperLight: cfg('paperLight'),
    theme: cfg('theme'),
    showHeader: cfg('showHeader'), showSource: cfg('showSource'), showDate: cfg('showDate'),
  };
  // 换语言：面板整个重拼一遍，手上的东西原样接过来
  const back = init.resume; if (back) Object.assign(st, back.st);
  const prefersDark = () => { try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };
  const applyTheme = () => {
    if (!alive()) return;      // 系统主题翻转可能发生在面板关掉之后
    const night = st.theme === 'night' || (st.theme === 'auto' && prefersDark());
    mask.classList.toggle('night', night);
  };

  mask = document.createElement('div'); mask.className = 'mask';
  // 本代面板的身份证：关掉或被新面板顶替后，这一代遗留的异步回调
  // （字体装载、纸解码、聚焦定时器、主题监听）一律安静退场，不再摸已空的 mask。
  const thisMask = mask;
  const alive = () => mask === thisMask;
  mask.innerHTML = `
    <div class="box">
      <div class="side">
        <h2>${t('app.title')}<span class="sw" id="lang" style="float:right;margin-left:6px${hostLocale(init.locale) ? ';display:none' : ''}"><button title="${t('lang.toggle')}" aria-label="${t('lang.toggle')}">${studioLocale === 'en' ? '中' : 'EN'}</button></span><span class="sw" id="theme" style="float:right">
          <button data-v="auto">${t('theme.auto')}</button><button data-v="day">${t('theme.day')}</button><button data-v="night">${t('theme.night')}</button>
        </span></h2><p class="h" id="tag"></p>

        <div class="tabs" id="tabs">
          <button data-v="text">${t('tab.text')}</button><button data-v="paper">${t('tab.paper')}</button>
          <button data-v="font">${t('tab.font')}</button><button data-v="ink">${t('tab.ink')}</button>
          <button data-v="layout">${t('tab.layout')}</button>
          <button data-v="box" hidden>${t('tab.box')}</button>
        </div>

        <div class="pane" data-p="text">
          <label>${t('text.title')}<span class="sw"><span style="font-size:10px">${t('text.sizeWeight')}</span></span></label>
          <input type="text" id="ti" placeholder="${t('text.titlePh')}">
          <div class="fs" style="margin-top:6px">
            <input type="range" id="ts" min="20" max="140" step="1">
            <input type="number" id="tsn" min="12" max="300" step="1">
            <span class="sw" id="tw">
              <button data-v="0">${t('weight.regular')}</button><button data-v="1">${t('weight.medium')}</button><button data-v="2">${t('weight.bold')}</button></span>
          </div>
          <label>${t('text.body')}<span class="sw"><span style="font-size:10px">${t('text.sizeWeight')}</span></span></label>
          <div class="ta"><div class="bk" aria-hidden="true"><div></div></div><textarea id="t"></textarea></div>
          ${pickHtml()}
          <p class="pkhint" id="pkHint">&nbsp;<button id="pkReset" hidden>${t('pick.reset')}</button></p>
          <div class="fs" style="margin-top:6px">
            <input type="range" id="fs" min="20" max="96" step="1">
            <input type="number" id="fsn" min="12" max="200" step="1">
            <span class="sw" id="weight">
              <button data-v="0">${t('weight.regular')}</button><button data-v="1">${t('weight.medium')}</button><button data-v="2">${t('weight.bold')}</button></span>
          </div>
          <label>${t('text.source')}<span class="sw" id="swSrc">
            <button data-v="1">${t('sw.show')}</button><button data-v="0">${t('sw.hide')}</button></span></label>
          <div class="fs">
            <input type="text" id="sp" placeholder="${t('text.sourcePrefixPh')}" style="width:64px;padding:5px 6px;font-size:12px">
            <input type="text" id="s" style="flex:1">
          </div>
          <label>${t('text.date')}<span class="sw" id="swDate">
            <button data-v="1">${t('sw.show')}</button><button data-v="0">${t('sw.hide')}</button></span></label>
          <input type="text" id="d">
          <label>${t('text.header')}<span class="sw" id="swHead">
            <button data-v="1">${t('sw.show')}</button><button data-v="0">${t('sw.hide')}</button></span></label>
          <input type="text" id="hd" placeholder="${t('text.headerPh')}">
          <label>${t('text.rules')}</label>
          <div class="row">
            <button id="rHead" style="flex:1">${t('text.ruleHead')}</button>
            <button id="rTitle" style="flex:1">${t('text.ruleTitle')}</button>
            <button id="rFoot" style="flex:1">${t('text.ruleFoot')}</button>
          </div>
        </div>

        <div class="pane" data-p="paper">
          <div class="sub">${t('paper.builtin')}</div><div class="grid" id="paperBuiltin"></div>
          <div class="sub" id="packHd">${t('paper.pack')}</div><div class="grid" id="paperPack"></div>
          <div class="sub">${t('paper.mine')}</div><div class="grid" id="paperMine"></div>
          <label>${t('paper.bright')}</label>
          <div class="fs"><input type="range" id="pl" min="-50" max="50" step="1">
            <span class="val" id="plv"></span></div>
        </div>

        <div class="pane" data-p="font">
          <div class="sub">${t('font.body')}</div><div class="flist" id="font"></div>
          <div class="sub">${t('font.latin')}</div><div class="flist" id="latin"></div>
          <div class="sub">${t('font.title')}</div><div class="flist" id="swTitleFont"></div>
        </div>

        <div class="pane" data-p="ink">
          <label>${t('ink.body')}</label><div class="row inks" id="ink"></div>
          <label>${t('ink.meta')}</label><div class="row inks" id="metaInk"></div>
          <label>${t('ink.quote')}</label><div class="row inks" id="quoteInk"></div>
          <label>${t('ink.custom')}<span class="sw"><span style="font-size:10px">${t('ink.customHint')}</span></span></label>
          <div class="fs">
            <input type="color" id="ck">
            <input type="text" id="ckn" placeholder="${t('ink.namePh')}" maxlength="24"
                   style="flex:1;padding:5px 7px;font-size:12px">
            <button id="ckSave" style="padding:6px 9px;border:1px solid var(--line);
                    background:var(--btn);color:var(--fg);border-radius:4px;cursor:pointer;font-size:12px">${t('act.store')}</button>
          </div>
          <label>${t('ink.bright')}</label>
          <div class="fs"><input type="range" id="il" min="-50" max="50" step="1">
            <span class="val" id="ilv"></span></div>
        </div>

        <div class="pane" data-p="layout">
          <label>${t('preset.label')}</label><div class="row" id="presets"></div>
          <div class="fs" style="margin-top:6px">
            <input type="text" id="psn" placeholder="${t('preset.namePh')}" maxlength="24"
                   style="flex:1;padding:5px 7px;font-size:12px">
            <button id="psSave" style="padding:6px 9px;border:1px solid var(--line);
                    background:var(--btn);color:var(--fg);border-radius:4px;cursor:pointer;font-size:12px">${t('act.store')}</button>
          </div>

          <label>${t('layout.bodyDir')}<span class="sw" id="vert">
            <button data-v="0">${t('dir.horizontal')}</button><button data-v="1">${t('dir.vertical')}</button></span></label>
          <label>${t('layout.titleDir')}<span class="sw" id="tvert">
            <button data-v="0">${t('dir.horizontal')}</button><button data-v="1">${t('dir.vertical')}</button></span></label>
          <label>${t('layout.bodyAlign')}</label><div class="row" id="align"></div>
          <label>${t('layout.titleAlign')}</label><div class="row" id="talign"></div>
          <label>${t('layout.orient')}</label><div class="row" id="orient"></div>
          <label>${t('layout.pages')}</label><div class="row" id="pagesRow"></div>
          <label>${t('layout.offset')}<span class="sw"><span style="font-size:10px">${t('layout.offsetHint')}</span></span></label>
          <div class="fs">
            <span class="val" id="offv" style="width:auto"></span>
            <button id="offReset" style="padding:5px 9px;border:1px solid var(--line);
                    background:var(--btn);color:var(--fg);border-radius:4px;cursor:pointer;font-size:12px">${t('layout.offsetReset')}</button>
          </div>
        </div>

        ${blindPaneHtml()}
        <label style="margin:14px 0 -6px">${t('act.bare')}<span class="sw" id="bare"><button data-v="0">${t('sw.off')}</button><button data-v="1">${t('sw.on')}</button></span></label>
        <div class="acts">
          <button class="save" id="save">${t('act.save')}</button>
          <button class="copy" id="copy">${t('act.copy')}</button>
        </div>
        <div class="acts"><button class="close" id="close">${t('act.close')}</button></div>
        <div class="tip" id="tip"></div>
      </div>
      <div class="view">
        ${blindHtml()}
        <div class="count" id="count"></div>
        <div class="pages" id="pgs"></div>
      </div>
    </div>`;
  vvStop = trackViewport(mask);
  root.append(mask);

  const q = s => mask.querySelector(s);
  tipEl = q('#tip');
  q('#tag').textContent = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  q('#ck').value = /^#[0-9a-f]{6}$/i.test(st.ink) ? st.ink : inkOf(st.ink);
  q('#t').value = st.text; q('#s').value = st.source; q('#d').value = st.date;
  q('#hd').value = st.headText; q('#ti').value = st.title; q('#sp').value = st.sourcePrefix;
  q('#fs').value = st.fontSize; q('#fsn').value = st.fontSize;
  q('#ts').value = st.titleSize; q('#tsn').value = st.titleSize;

  // ── 画 ──────────────────────────────────────────────────────────
  let plan = null, dragging = false, blindBar = null;
  // 盲盒里自己挑了纸 / 字 / 墨，那一样就归自己，别的照旧听种子的
  const ownIt = k => { if (blindBar) blindBar.own(k); };
  // 拖的时候只重画已有的画布，绝不重建 DOM ——
  // 🔴 早先 draw() 每次都把预览区整个清空重建，正在拖的那个 canvas 当场被销毁，
  //    指针捕获立刻断掉，于是「只能拖动一下下」。不是范围小，是只生效了一帧。
  const redrawOnly = () => {
    if (!alive() || !plan) return;
    pageCanvases.forEach((cv, i) => { if (plan.pages[i]) renderPage(cv, st, plan, i); });
  };
  // 盲盒一张要好几道效果，满尺寸画一遍不便宜：预览先出草样，手停下来再补成导出的尺寸
  let fineTimer = 0, rough = false;
  const finish = () => { clearTimeout(fineTimer); if (!rough || !plan || !alive()) return; rough = false; pageCanvases.forEach((cv, i) => { if (plan.pages[i]) renderPage(cv, st, plan, i); }); };
  const settle = () => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => finish(), { timeout: 2500 }) : finish());      // 等浏览器真闲下来再补
  const draw = () => {
    if (!alive()) return;
    st.text = q('#t').value; st.source = q('#s').value; st.date = q('#d').value;
    st.headText = q('#hd').value; st.title = q('#ti').value;
    st.sourcePrefix = q('#sp').value;
    if (dragging){ redrawOnly(); return; }
    try {
      plan = planPages(st);
      const box = q('#pgs'), same = !!plan.blind && pageCanvases.length === plan.pages.length && box.children.length === plan.pages.length;
      if (!same){ box.textContent = ''; pageCanvases = []; }
      clearTimeout(fineTimer); rough = !!plan.blind;
      const paint = (cv, i) => (plan.blind ? withDPR(1, () => renderPage(cv, st, plan, i)) : renderPage(cv, st, plan, i));
      plan.pages.forEach((_, i) => {
        const cols = Math.min(plan.pages.length, 3), wide = `min(calc((100% - ${(cols - 1) * 14}px) / ${cols}), ${plan.W > plan.H ? 620 : 420}px)`;
        if (same){ const cv = pageCanvases[i]; paint(cv, i); cv.style.cursor = 'default'; cv.parentElement.style.width = wide; return; }
        const wrapEl = document.createElement('div');
        wrapEl.className = 'pg'; wrapEl.dataset.i = i;
        const cv = document.createElement('canvas');
        paint(cv, i);
        // 缩到能并排看下：一张时给大，多张时按张数分
        // 🔴 宽度得给外壳：早先给的是画布，百分比算的是外壳的宽，而外壳自己撑满整行 ——
        //    说是并排，其实一直一张一行往下堆
        wrapEl.style.width = wide;
        cv.style.width = '100%';
        cv.style.cursor = st.blind ? 'default' : 'move';
        // 在预览图上直接拖 = 整块位移。按显示比例换算回真实像素，拖多少就挪多少。
        cv.onpointerdown = e => {
          if (st.blind) return;          // 盲盒里没有「整块位移」这回事
          e.preventDefault();
          const scale = plan.W / cv.getBoundingClientRect().width;
          const sx = e.clientX, sy = e.clientY, bx = st.offsetX || 0, by = st.offsetY || 0;
          cv.setPointerCapture(e.pointerId);
          dragging = true;
          const move = ev => {
            st.offsetX = Math.round(bx + (ev.clientX - sx) * scale);
            st.offsetY = Math.round(by + (ev.clientY - sy) * scale);
            q('#offv').textContent = t('layout.offsetVal', { x: st.offsetX, y: st.offsetY });
            redrawOnly();
          };
          const up = () => {
            dragging = false;
            cv.removeEventListener('pointermove', move);
            cv.removeEventListener('pointerup', up);
            cv.removeEventListener('pointercancel', up);
            setCfg('offsetX', st.offsetX); setCfg('offsetY', st.offsetY);
            sync();
          };
          cv.addEventListener('pointermove', move);
          cv.addEventListener('pointerup', up);
          cv.addEventListener('pointercancel', up);
        };
        wrapEl.append(cv);
        if (plan.pages.length > 1){
          const tag = document.createElement('span'); tag.textContent = `${i+1}`; wrapEl.append(tag);
        }
        wrapEl.onclick = () => { selected = i; markSel(); };
        box.append(wrapEl); pageCanvases.push(cv);
      });
      if (selected >= plan.pages.length) selected = plan.pages.length - 1;
      markSel();
      // 张数、尺寸、以及「没照你说的办」的时候必须说出来，不能默默给个别的结果
      const S0 = SIZES[st.orient] || SIZES.portrait;
      const grew = plan.H > S0.h || plan.W > S0.w;
      const want = st.pages === 'auto' ? 0 : parseInt(st.pages, 10);
      const notes = [];
      if (plan.blind && plan.pages.length > 1) notes.push(t('blind.coverNote', { n: plan.pages.length - 1 }));
      if (grew) notes.push(t('count.grewNote'));
      if (want && plan.pages.length < want) notes.push(t('count.fewerNote', { want, got: plan.pages.length }));
      q('#count').textContent =
        t('count.pages', { n: plan.pages.length, w: plan.W, h: plan.H, ew: plan.W*DPR, eh: plan.H*DPR })
        + (notes.length ? t('count.notesGlue') + notes.join(t('count.notesJoin')) : '');
      // 盲盒可能抽中一张还没解码完的信纸：先垫纯色，解完再画一次
      if (plan.blind && plan.blind.pal.paper){
        const im = groundPhoto({ paper: plan.blind.pal.paper, orient: st.orient });
        if (im && !im.complete) im.addEventListener('load', draw, { once: true });
      }
      if (blindBar) blindBar.refresh(plan);
      if (rough) fineTimer = setTimeout(settle, 1600);
    } catch (e){ tipEl.textContent = t('count.renderFail', { msg: e.message }); }
  };
  // 打字的时候盲盒别一字一画（一张要一两百毫秒），停手再画
  let typingTimer;
  const drawTyping = () => { clearTimeout(typingTimer); if (st.blind) typingTimer = setTimeout(draw, 240); else draw(); };
  const markSel = () => mask.querySelectorAll('.pg').forEach(el =>
    el.setAttribute('aria-selected', +el.dataset.i === selected));

  // ── 各种选择器 ──────────────────────────────────────────────────
  const mkRow = (sel, list, key, cast) => {
    const box = q(sel); box.textContent = '';
    for (const o of list){
      const b = document.createElement('button');
      b.dataset.v = o.v; b.textContent = o.n;
      if (o.dot){ const i = document.createElement('i'); i.style.background = o.dot; b.prepend(i); }
      box.append(b);
    }
    box.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      st[key] = cast ? cast(b.dataset.v) : b.dataset.v;
      setCfg(key, st[key]); sync(); draw();
    });
  };
  mkRow('#orient', Object.entries(SIZES).map(([v, s]) => ({ v, n: tName('orient', v, s.name) })), 'orient');
  mkRow('#pagesRow', [{v:'auto',n:t('layout.pagesAuto')},{v:'1',n:'1'},{v:'2',n:'2'},{v:'3',n:'3'},
                      {v:'4',n:'4'},{v:'5',n:'5'},{v:'6',n:'6'}], 'pages');
  function buildInks(){
    // 题头/出处那一行、引号那一行：都是「几个特殊挡 + 全部墨色」，所以走同一个工厂。
    // 🔑 别为第二行再抄一遍 —— 这个项目栽过三次「同一件事写两套」。
    const mkInkRow = (sel, key, extra) => {
      const box = q(sel); if (!box) return;
      box.textContent = '';
      for (const [v, n] of extra){
        const b = document.createElement('button');
        b.dataset.v = v; b.textContent = n; box.append(b);
      }
      for (const i of allInks()){
        const b = document.createElement('button');
        b.dataset.v = i.id; b.textContent = tName('ink', i.id, i.name);
        const dot = document.createElement('i'); dot.style.background = i.c; b.prepend(dot);
        box.append(b);
      }
      box.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        st[key] = b.dataset.v; setCfg(key, st[key]); sync(); draw();
      });
    };
    mkInkRow('#metaInk',  'metaInk',  [['auto', t('ink.followPaper')]]);
    // 引号多一挡「跟正文」＝不要那抹橙
    mkInkRow('#quoteInk', 'quoteInk', [['auto', t('ink.followPaper')], ['same', t('ink.followBody')]]);

    const box = q('#ink'); box.textContent = '';
    for (const i of allInks()){
      const b = document.createElement('button');
      b.dataset.v = i.id; b.textContent = tName('ink', i.id, i.name);
      const dot = document.createElement('i'); dot.style.background = i.c; b.prepend(dot);
      const mine = (cfg('myInks') || []).some(x => x.id === i.id);
      if (mine){
        b.title = t('tip.renameDelete');
        b.ondblclick = e => {
          e.preventDefault(); e.stopPropagation();
          const v = prompt(t('ink.renamePrompt'), i.name);
          if (v === null) return;
          const name = v.trim().slice(0, 24) || i.name;
          setCfg('myInks', cfg('myInks').map(x => x.id === i.id ? { ...x, name } : x));
          buildInks(); sync();
        };
        b.oncontextmenu = e => {
          e.preventDefault();
          if (!confirm(t('ink.deleteConfirm', { name: i.name }))) return;
          setCfg('myInks', cfg('myInks').filter(x => x.id !== i.id));
          if (st.ink === i.id){ st.ink = 'black'; setCfg('ink', st.ink); }
          buildInks(); sync(); draw();
        };
      }
      box.append(b);
    }
    box.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      st.ink = b.dataset.v; setCfg('ink', st.ink); ownIt('ink'); sync(); draw();
    });
  }
  mkRow('#align',  [{v:'left',n:t('align.left')},{v:'center',n:t('align.center')},{v:'right',n:t('align.right')}], 'align');
  mkRow('#talign', [{v:'left',n:t('align.left')},{v:'center',n:t('align.center')},{v:'right',n:t('align.right')}], 'titleAlign');
  q('#vert').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    st.vertical = b.dataset.v === '1'; setCfg('vertical', st.vertical); sync(); draw();
  });
  q('#tvert').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    st.titleVertical = b.dataset.v === '1'; setCfg('titleVertical', st.titleVertical); sync(); draw();
  });
  q('#offReset').onclick = () => {
    st.offsetX = 0; st.offsetY = 0; setCfg('offsetX', 0); setCfg('offsetY', 0); sync(); draw();
  };

  // ── 版式预设（不只是文字排版，纸/字/色都在里面，所以叫版式）────────────────────────────────────────────────────
  const allPresets = () => BUILTIN_PRESETS.concat(cfg('presets') || []);
  function applyPreset(p){
    for (const k of STYLE_KEYS) if (k in p.style && k !== 'blind'){ st[k] = p.style[k]; setCfg(k, st[k]); }
    st.blind = blindFor(p.style.blind || null, q('#t').value, q('#ti').value);
    q('#hd').value = st.headText; q('#sp').value = st.sourcePrefix;
    q('#fs').value = Math.max(20, Math.min(96, st.fontSize)); q('#fsn').value = st.fontSize;
    q('#ts').value = Math.max(20, Math.min(140, st.titleSize)); q('#tsn').value = st.titleSize;
    q('#ck').value = /^#[0-9a-f]{6}$/i.test(st.ink) ? st.ink : inkOf(st.ink);
    buildPapers(); buildFonts(); buildInks(); buildPresets(); sync(); draw();
    tipEl.textContent = t('preset.applied', { name: tName('preset', p.id, p.name) });
  }
  function buildPresets(){
    const box = q('#presets'); box.textContent = '';
    for (const p of allPresets()){
      const b = document.createElement('button');
      b.dataset.v = p.id; b.textContent = tName('preset', p.id, p.name);
      const mine = (cfg('presets') || []).some(x => x.id === p.id);
      b.title = mine ? t('tip.renameDelete') : t('preset.builtinTitle');
      if (mine){
        b.ondblclick = e => {
          e.preventDefault(); e.stopPropagation();
          const v = prompt(t('preset.renamePrompt'), p.name);
          if (v === null) return;
          const name = v.trim().slice(0, 24) || p.name;
          setCfg('presets', cfg('presets').map(x => x.id === p.id ? { ...x, name } : x));
          buildPresets();
        };
        b.oncontextmenu = e => {
          e.preventDefault();
          if (!confirm(t('preset.deleteConfirm', { name: p.name }))) return;
          setCfg('presets', cfg('presets').filter(x => x.id !== p.id));
          buildPresets();
        };
      }
      b.onclick = () => applyPreset(p);
      box.append(b);
    }
  }
  q('#psSave').onclick = () => {
    const name = (q('#psn').value || '').trim().slice(0, 24) || t('preset.defaultName', { n: (cfg('presets') || []).length + 1 });
    const style = {}; for (const k of STYLE_KEYS) style[k] = st[k];
    setCfg('presets', (cfg('presets') || []).concat([{ id: 'ps' + Date.now(), name, style }]));
    q('#psn').value = '';
    buildPresets();
    tipEl.textContent = t('preset.saved', { name });
  };

  // 标签页
  q('#tabs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    mask.querySelectorAll('#tabs button').forEach(x => x.setAttribute('aria-pressed', x === b));
    mask.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.dataset.p === b.dataset.v));
    if (blindBar) blindBar.editing(b.dataset.v === 'box');
  });
  q('#tw').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    st.titleWeight = +b.dataset.v; setCfg('titleWeight', st.titleWeight); sync(); draw();
  });
  // 正文字重。跟标题那排长一个样，就摆在内容框底下 —— 标题怎么调，正文就怎么调。
  q('#weight').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    st.weight = +b.dataset.v; setCfg('weight', st.weight); sync(); draw();
  });
  q('#theme').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    st.theme = b.dataset.v; setCfg('theme', st.theme); applyTheme(); sync();
  });

  q('#lang').onclick = e => {
    if (!e.target.closest('button')) return;
    const { resume, ...rest } = init, tab = mask.querySelector('#tabs button[aria-pressed=true]');
    Object.assign(st, { text: q('#t').value, title: q('#ti').value, source: q('#s').value, date: q('#d').value, headText: q('#hd').value, sourcePrefix: q('#sp').value });
    setCfg('uiLang', studioLocale === 'en' ? 'zh-CN' : 'en');
    document.removeEventListener('keydown', esc); pick.dispose(); clearTimeout(fineTimer); clearTimeout(typingTimer);
    openPanel(st.text, { ...rest, resume: { st, tab: tab ? tab.dataset.v : 'text', blind: blindBar.state() } });
  };

  const mkSwitch = (sel, key) => q(sel).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    st[key] = b.dataset.v === '1'; setCfg(key, st[key]); sync(); draw();
  });
  mkSwitch('#swSrc', 'showSource'); mkSwitch('#swDate', 'showDate'); mkSwitch('#swHead', 'showHeader');
  // 三道线：按钮本身就是开关，亮着＝要
  for (const [sel, key] of [['#rHead','headRule'], ['#rTitle','titleRule'], ['#rFoot','footRule']]){
    q(sel).onclick = () => { st[key] = !st[key]; setCfg(key, st[key]); sync(); draw(); };
  }

  // 换纸时，只有当前这支墨在新纸上「读不出来」才自动换掉 ——
  // 用户挑的颜色要留住，但不能让人拿到一张黑字压克莱因蓝的图
  const MIN_CONTRAST = 3.2;
  function autoInk(){
    // 用「调完亮度之后」的纸色和墨色来判断，不然滑块一动这套判断就作废了
    const mean = paperMean(st.paper, st.paperLight);
    const cur  = shade(hex2rgb(inkOf(st.ink)), (st.inkLight || 0) / 100);
    if (contrast(cur, mean) >= MIN_CONTRAST) return null;
    const pick = bestInk(mean);
    st.ink = pick.id; setCfg('ink', pick.id);
    return tName('ink', pick.id, pick.name);
  }

  // 一枚纸的缩略图按钮。看图选纸比看名字快得多，这是这轮改版的核心。
  function paperTile(value, label, thumb, title){
    const b = document.createElement('button');
    b.className = 'sw3'; b.dataset.v = value; b.title = title || label;
    b.append(thumb);
    const cap = document.createElement('b'); cap.textContent = label; b.append(cap);
    b.onclick = () => {
      st.paper = value; setCfg('paper', st.paper); ownIt('paper');
      const swapped = autoInk();
      sync(); draw();
      if (swapped) tipEl.textContent = t('paper.autoInkSwapped', { name: swapped });
    };
    return b;
  }

  function buildPapers(){
    const bi = q('#paperBuiltin'), pk = q('#paperPack'), mine = q('#paperMine');
    bi.textContent = ''; pk.textContent = ''; mine.textContent = '';

    for (const [k, v] of Object.entries(PAPERS)){
      const c = document.createElement('canvas'); c.width = 72; c.height = 90;
      c.getContext('2d').drawImage(makePaper(k, 72, 90), 0, 0);
      bi.append(paperTile(k, tName('paper', k, v.name), c));
    }

    const ps = packs();
    q('#packHd').textContent = ps.length ? t('paper.pack') : t('paper.packEmpty');
    for (const s of ps){
      const im = document.createElement('img');
      im.src = s.portrait || s.landscape; im.loading = 'lazy';
      pk.append(paperTile('pk:' + s.key, s.cn || s.en, im,
                          t('paper.packTileTitle', { name: s.cn || s.en,
                            group: s.group === 'bold' ? t('paper.groupBold') : t('paper.groupSoft') })));
    }

    for (const p of cfg('myPapers')){
      const im = document.createElement('img'); im.src = p.data;
      const b = paperTile('my:' + p.id, p.name, im, t('tip.renameDelete'));
      b.ondblclick = e => {
        e.preventDefault(); e.stopPropagation();
        const v = prompt(t('paper.renamePrompt'), p.name);
        if (v === null) return;
        const name = v.trim().slice(0, 24) || p.name;
        setCfg('myPapers', cfg('myPapers').map(x => x.id === p.id ? { ...x, name } : x));
        buildPapers(); sync(); draw();
      };
      b.oncontextmenu = e => {
        e.preventDefault();
        if (!confirm(t('paper.deleteConfirm', { name: p.name }))) return;
        setCfg('myPapers', cfg('myPapers').filter(x => x.id !== p.id));
        myPaperImgs.delete(p.id); meanCache.delete('my:' + p.id);
        if (st.paper === 'my:' + p.id){ st.paper = 'rice'; setCfg('paper', st.paper); }
        buildPapers(); sync(); draw();
      };
      mine.append(b);
    }

    const box = mine;
    const add = document.createElement('button');
    add.className = 'sw3 plus'; add.textContent = t('paper.addTile'); add.title = t('paper.addTileTitle');
    add.onclick = async () => {
      const files = await pickFiles('image/*'); if (!files.length) return;
      tipEl.textContent = t('paper.importing');
      const list = cfg('myPapers').slice(); let ok = 0;
      for (const f of files){
        try {
          const data = await shrink(await readFile(f, 'url'));
          // 文件名要是「1.jpg」这种没信息量的，别拿来当名字，给个「我的纸N」
          const raw = f.name.replace(/\.[^.]+$/, '').trim();
          const name = (raw && !/^[\d\s_-]+$/.test(raw)) ? raw.slice(0, 24) : t('paper.defaultName', { n: list.length + 1 });
          list.push({ id:'p'+Date.now()+Math.floor(Math.random()*1e4), name, data });
          ok++;
        } catch { tipEl.textContent = t('paper.oneFail', { name: f.name }); }
      }
      setCfg('myPapers', list);
      const mb = (storedBytes()/1e6).toFixed(1);
      // 收尾话由真发生的事推出来，不写死「收了 N 张」
      tipEl.textContent = ok === files.length
        ? t('paper.importedAll', { n: ok, mb })
        : t('paper.importedSome', { total: files.length, n: ok, mb });
      if (storedBytes() > 9e6) tipEl.textContent += t('paper.storageFull');
      buildPapers(); sync(); draw();
    };
    box.append(add);

    const pkBtn = document.createElement('button');
    pkBtn.className = 'sw3 plus'; pkBtn.textContent = t('paper.addPack');
    pkBtn.title = t('paper.addPackTitle');
    pkBtn.onclick = async () => {
      const files = await pickFiles('.json,application/json'); if (!files.length) return;
      tipEl.textContent = t('paper.packReading');
      try {
        const text = await new Promise((res, rej) => {
          const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(files[0]);
        });
        const n = await installPack(text);
        // 收尾这句必须照事实说 —— 存不下的时候「以后不用再导」就是句谎话
        tipEl.textContent = installPack.persisted
          ? t('paper.packInstalled', { n })
          : t('paper.packVolatile', { n });
        buildPapers(); sync(); draw();
      } catch (e){ tipEl.textContent = t('paper.packBad', { msg: e.message }); }
    };
    box.append(pkBtn);
  }

  // 一行字体：**用它自己的样子写出它的名字**。挑字体本来就该这么挑。
  function fontRow(value, label, previewStack, hint, off){
    const b = document.createElement('button');
    b.dataset.v = value;
    if (off) b.dataset.off = '1';
    const s = document.createElement('span');
    s.textContent = label;
    if (previewStack) s.style.fontFamily = previewStack;
    b.append(s);
    if (hint){ const i = document.createElement('i'); i.textContent = hint; b.append(i); }
    return b;
  }

  // 「指名要某一款」的字单：中文、自装、西文排在一列。标题字体和选中的字共用这一份。
  function fillFonts(tb, firstLabel, withSys){
    tb.textContent = '';
    tb.append(fontRow('same', firstLabel, null, ''));
    for (const f of FONTS){
      if ((!f.probes.length && !withSys) || !fontAvailable(f)) continue;
      tb.append(fontRow(f.id, tName('font', f.id, f.name), cjkStack(f.id), t('font.hintCjk')));
    }
    for (const f of cfg('myFonts')) tb.append(fontRow(f.id, f.name, `"${f.id}"`, t('font.hintCustom')));
    for (const l of LATIN){
      if (!l.probes.length) continue;
      const hit = resolveFont(l); if (!hit) continue;
      tb.append(fontRow(l.id, `${l.name} — Aa`, `"${hit}"`, l.hint ? tName('hint', l.id, l.hint) : t('font.hintLatin')));
    }
  }

  function buildFonts(){
    // 正文字体
    const box = q('#font'); box.textContent = '';
    for (const f of FONTS){
      const ok = fontAvailable(f);
      const b = fontRow(f.id, tName('font', f.id, f.name), ok ? cjkStack(f.id) : null, ok ? '' : t('font.hintMissing'), !ok);
      if (!ok) b.title = t('font.missingTitle');
      box.append(b);
    }
    for (const f of cfg('myFonts')){
      const b = fontRow(f.id, f.name, `"${f.id}"`, t('font.hintCustom'));
      b.title = t('tip.rightDelete');
      b.oncontextmenu = e => {
        e.preventDefault();
        setCfg('myFonts', cfg('myFonts').filter(x => x.id !== f.id));
        if (st.font === f.id){ st.font = 'sys'; setCfg('font', 'sys'); }
        buildFonts(); sync(); draw();
      };
      box.append(b);
    }

    // 西文字体：列真装了的；嵌入方给了文件 URL 的也列（选中那一刻才装载，§9.3）
    const lb = q('#latin'); lb.textContent = '';
    for (const l of LATIN){
      const hit = l.probes.length ? resolveFont(l) : null;
      const url = !hit && l.probes.length ? embedFontUrls[l.id] : null;
      if (l.probes.length && !hit && !url) continue;
      const row = fontRow(l.id, l.id === 'none' ? t('font.noneLatin') : `${l.name} — Aa Bb 0123`,
                        hit ? `"${hit}"` : null, l.hint ? tName('hint', l.id, l.hint) : '');
      if (url) row.addEventListener('click', async e => {
        e.stopPropagation();               // 拦下通用委托，先装字再落选
        tipEl.textContent = t('font.urlLoading', { name: l.name });
        try {
          await ensureUrlFont(l.probes[0], url);
          if (!alive()) return;
          st.latinFont = l.id; setCfg('latinFont', st.latinFont);
          buildFonts(); sync(); draw();
          tipEl.textContent = '';
        } catch (err) {
          if (alive()) tipEl.textContent = t('font.urlFailed', { name: l.name });
        }
      });
      lb.append(row);
    }

    // 标题字体：中文和英文都能挑（挑了英文字，汉字会自动落回正文的中文字体）
    fillFonts(q('#swTitleFont'), t('font.sameAsBody'), false);

    const add = document.createElement('button');
    add.textContent = t('font.add'); add.style.fontSize = '12px';
    add.title = t('font.addTitle');
    add.onclick = async () => {
      const files = await pickFiles('.ttf,.otf,.woff,.woff2,font/*'); if (!files.length) return;
      const list = cfg('myFonts').slice();
      for (const f of files){
        if (f.size > 12*1024*1024){
          tipEl.textContent = t('font.tooBig', { name: f.name, mb: (f.size/1e6).toFixed(0) });
          continue;
        }
        try { list.push({ id:'f'+Date.now()+Math.floor(Math.random()*1e4),
                          name: f.name.replace(/\.[^.]+$/, '').slice(0, 24),
                          data: await readFile(f, 'url') }); }
        catch { tipEl.textContent = t('font.installFail', { name: f.name }); }
      }
      setCfg('myFonts', list); await ensureCustomFonts(); buildFonts(); sync(); draw();
    };
    box.append(add);

    const pickFont = (el, key) => el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !b.dataset.v) return;
      if (b.dataset.off === '1'){
        tipEl.textContent = t('font.notInstalledTip');
        return;
      }
      st[key] = b.dataset.v; setCfg(key, st[key]); ownIt('font'); sync(); draw();
    });
    pickFont(box, 'font'); pickFont(q('#latin'), 'latinFont'); pickFont(q('#swTitleFont'), 'titleFont');
  }

  q('#bare').addEventListener('click', e => { const b = e.target.closest('button'); if (b){ st.noGround = b.dataset.v === '1'; sync(); draw(); } });
  const sync = () => {
    q('#bare').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === '1') === st.noGround));
    mask.classList.toggle('bare', st.noGround);
    pick.refresh();
    const marks = [['#orient', st.orient], ['#pagesRow', st.pages],
                   ['#paperBuiltin', st.paper], ['#paperPack', st.paper], ['#paperMine', st.paper],
                   ['#font', st.font], ['#ink', st.ink], ['#weight', st.weight], ['#theme', st.theme],
                   ['#align', st.align], ['#talign', st.titleAlign], ['#vert', st.vertical?'1':'0'], ['#tvert', st.titleVertical?'1':'0'],
                   ['#metaInk', st.metaInk],
                   ['#quoteInk', st.quoteInk],
                   ['#latin', st.latinFont], ['#swTitleFont', st.titleFont], ['#tw', st.titleWeight],
                   ['#swSrc', st.showSource?'1':'0'], ['#swDate', st.showDate?'1':'0'],
                   ['#swHead', st.showHeader?'1':'0']];
    for (const [sel, val] of marks)
      mask.querySelectorAll(sel + ' button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === String(val)));
    q('#s').disabled = !st.showSource; q('#sp').disabled = !st.showSource;
    q('#d').disabled = !st.showDate;
    q('#hd').disabled = !st.showHeader;
    q('#rHead').setAttribute('aria-pressed', st.headRule !== false);
    q('#rTitle').setAttribute('aria-pressed', st.titleRule !== false);
    q('#rFoot').setAttribute('aria-pressed', st.footRule !== false);
    const fmt = v => (v > 0 ? '+' : '') + v;
    q('#il').value = st.inkLight;   q('#ilv').textContent = fmt(st.inkLight);
    q('#pl').value = st.paperLight; q('#plv').textContent = fmt(st.paperLight);
    q('#offv').textContent = (st.offsetX || st.offsetY)
      ? t('layout.offsetVal', { x: Math.round(st.offsetX), y: Math.round(st.offsetY) }) : t('layout.offsetNone');
  };

  // 字号：滑块和数字框互相跟随，数字框可以超出滑块范围。
  // 正文一套、标题一套，但推进规则只写这一份 —— 同一件事写两处，迟早对不上。
  const mkSize = (key, rng, num, lo, hi, sLo, sHi) => {
    const set = v => {
      const n = Math.max(lo, Math.min(hi, Math.round(+v || DEF[key])));
      st[key] = n; setCfg(key, n);
      q(rng).value = Math.max(sLo, Math.min(sHi, n)); q(num).value = n;
      draw();
    };
    q(rng).oninput = e => set(e.target.value);
    q(num).oninput = e => { if (e.target.value !== '') set(e.target.value); };
  };
  mkSize('fontSize',  '#fs',  '#fsn', 12, 200, 20,  96);
  mkSize('titleSize', '#ts',  '#tsn', 12, 300, 20, 140);
  // 取色器：拖的时候就直接用上（st.ink 可以直接是个 #rrggbb，不必先存），存不存随意
  q('#ck').oninput = e => { st.ink = e.target.value; setCfg('ink', st.ink); ownIt('ink'); sync(); draw(); };
  q('#ckSave').onclick = () => {
    const c = q('#ck').value;
    const name = (q('#ckn').value || '').trim().slice(0, 24) || t('ink.defaultName', { n: (cfg('myInks') || []).length + 1 });
    const id = 'ink' + Date.now() + Math.floor(Math.random() * 1e4);
    setCfg('myInks', (cfg('myInks') || []).concat([{ id, name, c }]));
    st.ink = id; setCfg('ink', id);
    q('#ckn').value = '';
    buildInks(); sync(); draw();
    tipEl.textContent = t('ink.saved', { name, c });
  };
  q('#il').oninput = e => { st.inkLight   = +e.target.value; setCfg('inkLight',   st.inkLight);   sync(); draw(); };
  q('#pl').oninput = e => { st.paperLight = +e.target.value; setCfg('paperLight', st.paperLight); sync(); draw(); };
  const pick = mountPick({ mask, st, draw, alive, fillFonts });
  q('#t').oninput  = e => { pick.edited('body', e); drawTyping(); };
  q('#ti').oninput = e => { pick.edited('title', e); drawTyping(); };
  q('#s').oninput = drawTyping; q('#d').oninput = drawTyping;
  blindBar = mountBlind({ resume: back && back.blind, mask, st, draw, sync, alive, tip: m => { tipEl.textContent = m; },
    openTab: v => { const b = q('#tabs button[data-v="' + v + '"]'); if (b.getAttribute('aria-pressed') !== 'true') b.click(); },
    // 拖着的时候只重画第一张，不重建预览（重建的话手底下那层会被销毁，拖动当场断掉）
    repaint: draft => {
      plan = planPages(st); if (!plan.blind || !pageCanvases[0]) return null;
      const post = plan.blind.B.post; if (draft) plan.blind.B.post = [];
      clearTimeout(fineTimer); withDPR(1, () => renderPage(pageCanvases[0], st, plan, 0)); rough = true; fineTimer = setTimeout(settle, 1600); plan.blind.B.post = post;
      return plan;
    },
    kept: { list: () => (cfg('presets') || []).filter(p => p.style && p.style.blind),
            rename: (id, name) => { setCfg('presets', cfg('presets').map(x => (x.id === id ? { ...x, name } : x))); buildPresets(); },
            remove: id => { setCfg('presets', cfg('presets').filter(x => x.id !== id)); buildPresets(); } },
    keep: (name, blind) => {
      const style = {}; for (const k of STYLE_KEYS) style[k] = st[k];
      style.blind = blind;
      setCfg('presets', (cfg('presets') || []).concat([{ id: 'ps' + Date.now(), name, style }]));
      buildPresets();
    } });
  q('#hd').oninput = () => { setCfg('headText', q('#hd').value); drawTyping(); };

  const close = () => {
    // 自己的 Esc 监听无条件先摘：被新面板顶替后残留的那份也借这条路自清
    document.removeEventListener('keydown', esc);
    pick.dispose();
    if (!alive()) return;
    if (vvStop) { vvStop(); vvStop = null; }
    mask.remove(); mask = null;
    // onClose 只在真关掉的那一次响 —— close 本身保持幂等
    if (typeof init.onClose === 'function') try { init.onClose(); } catch {}
  };
  q('#close').onclick = close;
  // 🔴 按下也得在遮罩上才算「点了外面」。在内容框里拖选、手滑到面板外才松开，
  //    浏览器会把这一下 click 算给遮罩 —— 面板当场关掉，写的字全没了。
  let downOnMask = false;
  mask.addEventListener('pointerdown', e => { downOnMask = e.target === mask; }, true);
  mask.onclick = e => { if (e.target === mask && downOnMask) close(); };
  // 正选着字的时候，Esc 先放开选中的字，再按一次才关面板
  const esc = e => { if (e.key === 'Escape' && !(alive() && (pick.drop() || blindBar.drop()))) close(); };
  document.addEventListener('keydown', esc);

  // ── 存 / 复制 ───────────────────────────────────────────────────
  q('#save').onclick = async () => {
    finish();
    const n = pageCanvases.length;
    const stamp = stampName();
    const sub = (cfg('subdir') || '').replace(/[\\/]+$/, '');
    let ok = 0, viaFallback = 0;
    tipEl.textContent = t('save.working', { n });
    for (let i = 0; i < n; i++){
      const blob = await new Promise(r => st.noGround ? pageCanvases[i].toBlob(r, 'image/png') : pageCanvases[i].toBlob(r, 'image/jpeg', 0.94));
      if (!blob) continue;
      const url = URL.createObjectURL(blob);
      const base = (n > 1 ? t('save.fileMulti', { stamp, i: i+1, n }) : t('save.fileOne', { stamp })).replace(/\.jpe?g$/, st.noGround ? '.png' : '.jpg');
      const name = (sub ? sub + '/' : '') + base;
      const done = await new Promise(res => {
        try {
          GM_download({ url, name, saveAs:false,
            onload : () => res('gm'),
            onerror: () => {
              const a = document.createElement('a'); a.href = url; a.download = base; a.click();
              res('fallback');
            } });
        } catch {
          const a = document.createElement('a'); a.href = url; a.download = base; a.click();
          res('fallback');
        }
      });
      if (done === 'gm') ok++; else viaFallback++;
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      await new Promise(r => setTimeout(r, 160));      // 连着触发下载浏览器会掐
    }
    // 说出真发生的事，不说固定句
    tipEl.textContent = viaFallback
      ? t('save.doneFallback', { n: ok + viaFallback, fb: viaFallback })
      : t('save.done', { n: ok, dir: sub ? sub + '/' : '' });
  };

  q('#copy').onclick = () => {
    finish();
    const cv = pageCanvases[selected]; if (!cv) return;
    cv.toBlob(async b => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
        tipEl.textContent = pageCanvases.length > 1 ? t('copy.donePage', { n: selected+1 }) : t('copy.done');
      } catch { tipEl.textContent = t('copy.denied'); }
    }, 'image/png');
  };

  applyTheme();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); } catch {}
  q('#tabs').querySelector('button').click();      // 默认落在「文」这一屏
  if (back && back.tab !== 'box') q(`#tabs button[data-v="${back.tab}"]`).click();
  buildPapers(); buildFonts(); buildInks(); buildPresets(); sync(); draw();
  if (back && back.tab === 'box' && st.blind) q('#tabs button[data-v="box"]').click();      // 「盒」那一屏要等盲盒画出来才有
  if (blank && !back) setTimeout(() => { if (alive()) q('#t').focus(); }, 60);   // 空手起稿，光标直接落在内容框
  ensureCustomFonts().then(() => { if (!alive()) return; buildFonts(); sync(); draw(); });
  Promise.all(cfg('myPapers').map(p => new Promise(r => {
    const i = myPaper(p.id); i && !i.complete ? (i.onload = r, i.onerror = r) : r();
  }))).then(draw);
}

// 存纸的上限必须 ≥ 导出分辨率，否则纸会被放大 2 倍、纸纹糊掉，
// 那就是「给再高清的素材也白给」的那种坑。
const PAPER_MAX_W = Math.max(SIZES.portrait.w, SIZES.landscape.w) * DPR;   // 2880
const PAPER_MAX_H = 2900;
function shrink(dataUrl){
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, PAPER_MAX_W / img.width, PAPER_MAX_H / img.height);
      if (s >= 1 && dataUrl.length < 900e3) return res(dataUrl);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const cx = c.getContext('2d'); cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/webp', 0.82));
    };
    img.onerror = rej; img.src = dataUrl;
  });
}
const storedBytes = () => cfg('myPapers').reduce((a,p) => a + p.data.length, 0)
                        + cfg('myFonts').reduce((a,f) => a + f.data.length, 0);

