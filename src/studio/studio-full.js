// ════════════════════════════════════════════════════════════════════
//  6d. 全屏：面板铺满整块屏，纸整张看得见；手机上再收起浏览器自己的地址栏
// ════════════════════════════════════════════════════════════════════
// 两层，各走各的：
//   ① 排布（.full）—— 纯 CSS，哪儿都有。iPhone 的 Safari 不让网页进真全屏，它只有这一层。
//   ② 浏览器的全屏接口 —— 有就顺手要一下，要不到也不吭声，① 照样成立。
// .sheet ＝ 控制面板露不露。手机上进来先收着，只看纸；宽屏两栏摆得下，默认露着。
const FULL_CSS = `
.cbar{display:flex;gap:6px;align-items:center;flex:0 0 auto}
.cbar .count{flex:1;min-width:0}
.cbar [hidden],.ftip[hidden]{display:none!important}
.cbar button{border:1px solid var(--line);background:var(--btn);color:var(--fg);border-radius:999px;
     font-size:11px;padding:4px 11px;cursor:pointer;letter-spacing:.06em;white-space:nowrap;flex:0 0 auto}
.ftip{font-size:11px;color:var(--dim);line-height:1.5;flex:0 0 auto}
.mask.full{padding:0}
.mask.full .box{max-width:none;height:100%;border-radius:0;
     padding:calc(12px + env(safe-area-inset-top,0px)) calc(12px + env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) calc(12px + env(safe-area-inset-left,0px))}
.mask.full .pages{container-type:size;align-content:safe center;--pgmax:4000px}
.mask.full:not(.sheet) .side{display:none}
@media (max-width: 760px){
  .cbar button{padding:8px 12px}
  /* 一整张都要看得见：预览区给定高，纸按这块地方的宽和高两头收。
     --need ＝ 按屏宽铺开要多高，横版卡片用不着那么高，就别占着。 */
  .view{height:55%;height:min(55%, calc(var(--need, 100vw) + 112px))}
  .mask.blind .view{height:62%;height:min(62%, calc(var(--need, 100vw) + 160px))}
  .pages{container-type:size;padding:5px}      /* 选中的那圈边要有地方待，不然左右被裁掉 */
  .bbar .nm{font-size:12px}
  .mask.full .box .view{flex:1 1 auto;height:auto;max-height:none}
  .mask.full.sheet .box .view{flex:0 0 56%}
  .mask.full.sheet .side{min-height:0}
  .mask.full .count{display:none}
  .mask.full .cbar{justify-content:flex-end}
}
`;
const fullHtml = () => `
  <div class="cbar"><div class="count" id="count"></div>
    <button id="fSave" hidden>${t('act.save')}</button>
    <button id="fSheet" aria-expanded="false" hidden></button>
    <button id="fGo" aria-pressed="false" title="${t('full.title')}"></button>
  </div>
  <div class="ftip" id="fTip" hidden></div>`;

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

function mountFull({ resume, mask, alive, tipEl, changed: told }){
  const q = s => mask.querySelector(s), small = () => { try { return matchMedia('(max-width: 760px)').matches; } catch { return false; } };
  let on = false, sheet = true, leftAt = 0, tipTimer = 0;
  const paint = () => {
    mask.classList.toggle('full', on); mask.classList.toggle('sheet', on && sheet);
    q('#fGo').textContent = on ? t('full.off') : t('full.on'); q('#fGo').setAttribute('aria-pressed', String(on));
    q('#fSheet').hidden = !on; q('#fSheet').textContent = sheet ? t('full.hide') : t('full.show'); q('#fSheet').setAttribute('aria-expanded', String(sheet));
    q('#fSave').hidden = !on || sheet;
    if (!on || sheet) q('#fTip').hidden = true;
    if (told) told();      // 纸变大了，草样可能就不够清楚了
  };
  const go = v => { if (on === v) return; on = v; if (on){ sheet = !small(); fullAsk(() => on && alive()); } else fullLeave(); paint(); };
  q('#fGo').onclick = () => go(!on);
  q('#fSheet').onclick = () => { sheet = !sheet; paint(); };
  q('#fSave').onclick = () => q('#save').click();
  // 「改一改」要用面板：收着的话替你拉开。只认这颗按钮 —— 在纸上点中一块字也会翻到「盒」那一屏，
  // 那时候拉开面板，纸会从手指底下缩走
  q('#bEdit').addEventListener('click', () => { if (on && !sheet){ sheet = true; paint(); } });
  // 面板收着，底下那行话（「已存 1 张」）就看不见了，借到纸旁边说
  const mo = new MutationObserver(() => {
    const s = tipEl.textContent; if (!on || sheet || !s) return;
    q('#fTip').textContent = s; q('#fTip').hidden = false;
    clearTimeout(tipTimer); tipTimer = setTimeout(() => { q('#fTip').hidden = true; }, 5000);
  });
  mo.observe(tipEl, { childList: true, characterData: true, subtree: true });
  // 用户从浏览器那头退的（Esc、安卓的返回、下拉）：排布跟着收
  const changed = () => {
    if (!alive()) return dispose();
    if (fullNow() || !fullOwn) return;
    fullOwn = false; leftAt = Date.now(); go(false);
  };
  for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, changed);
  function dispose(){
    for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.removeEventListener(ev, changed);
    mo.disconnect(); clearTimeout(tipTimer);
  }
  if (resume && resume.on){ on = true; sheet = resume.sheet; }
  paint();
  return {
    dispose, state: () => ({ on, sheet }),
    // Esc：先退全屏，再按一次才关面板。有的浏览器退全屏那一下 Esc 也会送到网页里，别算两次
    drop: () => { if (on){ go(false); return true; } return Date.now() - leftAt < 400; },
  };
}
