// ════════════════════════════════════════════════════════════════════
//  6d. 全屏：面板铺满整块屏，纸整张看得见；手机上再收起浏览器自己的地址栏
// ════════════════════════════════════════════════════════════════════
// 两层，各走各的：
//   ① 排布（.full）—— 纯 CSS，哪儿都有。iPhone 的 Safari 不让网页进真全屏，它只有这一层。
//   ② 浏览器的全屏接口 —— 有就顺手要一下，要不到也不吭声，① 照样成立。
// .sheet ＝ 电脑上面板露不露。手机上不归它管：那边有抽屉，进全屏先把抽屉放下去。
const FULL_CSS = `
.mask.full{padding:0}
.mask.full .box{max-width:none;height:100%;border-radius:0;
     padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)}
@media (min-width: 761px){
  .mask.full:not(.sheet) .box{grid-template-columns:0 0 minmax(0,1fr)}
  .mask.full:not(.sheet) .side,.mask.full:not(.sheet) .tabs{visibility:hidden;border:0}
}
`;

// 全屏是整页的事，不跟着哪一代面板走：换语言重拼面板时它还开着
let fullOwn = false;      // 这个真全屏是不是拾句要来的；别人（网页自己）开的不去动它
const fullNow = () => document.fullscreenElement || document.webkitFullscreenElement || null;
function fullLeave(){
  if (!fullOwn) return;
  fullOwn = false;
  if (!fullNow()) return;
  try { const r = (document.exitFullscreen || document.webkitExitFullscreen).call(document); if (r && r.catch) r.catch(() => {}); } catch {}
}
function fullAsk(still){
  const el = document.documentElement, ask = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!ask || fullNow()) return;
  fullOwn = true;
  const no = () => { fullOwn = false; };
  // 等答复的当口又退出来了（或者面板已经关了），到手的全屏要还回去
  try { const r = ask.call(el, { navigationUI: 'hide' }); if (r && r.then) r.then(() => { if (!still()){ fullOwn = true; fullLeave(); } }, no); } catch { no(); }
}

function mountFull({ resume, mask, alive, changed: told, low }){
  const q = s => mask.querySelector(s); let mq = null; try { mq = matchMedia('(max-width: 760px)'); } catch {}
  const small = () => !!(mq && mq.matches);
  let on = false, sheet = true, leftAt = 0;
  const paint = () => {
    mask.classList.toggle('full', on); mask.classList.toggle('sheet', on && sheet);
    const go = q('#fGo'); go.innerHTML = on ? ICO.shrink : ICO.full; go.setAttribute('aria-pressed', String(on)); go.title = on ? t('full.off') : t('full.title'); go.setAttribute('aria-label', on ? t('full.off') : t('full.on'));
    const sh = q('#fSheet'); sh.hidden = !on; sh.innerHTML = ICO.side; sh.title = sheet ? t('full.hide') : t('full.show'); sh.setAttribute('aria-label', sh.title); sh.setAttribute('aria-expanded', String(sheet));
    q('#fSave').hidden = !(small() || (on && !sheet));      // 手机上存图在拇指边；电脑上面板收着的时候，底下那颗看不见了
    if (told) told();      // 纸变大了，草样可能就不够清楚了
  };
  const go = v => { if (on === v) return; on = v; if (on){ sheet = true; if (small() && low) low(); fullAsk(() => on && alive()); } else fullLeave(); paint(); };
  q('#fGo').onclick = () => go(!on);
  q('#fSheet').onclick = () => { sheet = !sheet; paint(); };
  q('#fSave').onclick = () => q('#save').click();
  const sized = () => { if (alive()) paint(); };
  if (mq && mq.addEventListener) mq.addEventListener('change', sized);
  // 用户从浏览器那头退的（Esc、安卓的返回、下拉）：排布跟着收
  const changed = () => {
    if (!alive()) return dispose();
    if (fullNow() || !fullOwn) return;
    fullOwn = false; leftAt = Date.now(); go(false);
  };
  for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, changed);
  function dispose(){
    for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.removeEventListener(ev, changed);
    if (mq && mq.removeEventListener) mq.removeEventListener('change', sized);
  }
  if (resume && resume.on){ on = true; sheet = resume.sheet; }
  paint();
  return {
    dispose, state: () => ({ on, sheet }),
    // Esc：先退全屏，再按一次才关面板。有的浏览器退全屏那一下 Esc 也会送到网页里，别算两次
    drop: () => { if (on){ go(false); return true; } return Date.now() - leftAt < 400; },
  };
}
