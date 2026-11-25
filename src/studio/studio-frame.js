// ════════════════════════════════════════════════════════════════════
//  6f. 骨架：两个模式（排信纸 / 拆盲盒）、标签栏、钉底的存图、手机上的抽屉
// ════════════════════════════════════════════════════════════════════
// 电脑：顶栏横着，左边一条标签，中间面板，右边纸。手机：纸在上，抽屉在中间，标签在拇指底下。
// 🔑 规矩：每个模式只摆对它起作用的几屏；存图永远在手边；一年改不了两次的收进「⋯」。
const FRAME_CSS = `
.box [hidden]{display:none!important}
.box{position:relative;display:grid;grid-template:54px minmax(0,1fr)/62px 322px minmax(0,1fr);gap:0;padding:0;border-radius:12px;overflow:hidden;
     max-width:1240px;width:100%;height:min(100%,900px);max-height:100%}
.hd{grid-column:1/-1;display:flex;align-items:center;gap:6px;padding:0 12px 0 18px;border-bottom:1px solid var(--line);min-width:0}
.hd h2{margin:0;font-size:14px;letter-spacing:.2em;font-weight:500;color:var(--fg);white-space:nowrap}
.hd p.h{margin:0 0 0 8px;font-size:11px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.hd .sp{flex:1 1 0;min-width:4px}
.hb{flex:0 0 auto;min-width:34px;height:34px;padding:0;border:0;background:transparent;border-radius:999px;color:var(--fg);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12px;letter-spacing:.06em}
.hb.w{padding:0 12px}
.hb svg,.bbar svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;display:block}
@media (hover:hover){ .hb:hover{background:var(--soft)} }
#more svg{stroke-width:3}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden;background:var(--field);flex:0 0 auto}
.seg button{border:0;background:transparent;padding:6px 15px;font-size:12px;color:var(--dim);letter-spacing:.06em;cursor:pointer;white-space:nowrap}
.seg button[aria-pressed=true]{background:var(--on-bg);color:var(--on-fg)}
.tabs{display:flex;flex-direction:column;gap:2px;margin:0;padding:10px 0;border:0;border-right:1px solid var(--line);overflow:auto}
.tabs button{flex:0 0 46px;position:relative;margin:0;padding:0 2px;border:0;background:transparent;color:var(--dim);font-size:12px;letter-spacing:.06em;cursor:pointer}
.tabs button[aria-pressed=true]{color:var(--fg)}
.tabs button[aria-pressed=true]::before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:2px;background:var(--on-bg)}
.side{display:flex;flex-direction:column;min-width:0;min-height:0;width:auto;overflow:hidden;padding:0;border-right:1px solid var(--line)}
.grab{display:none}
.pbody{flex:1 1 0;min-height:0;overflow:auto;overscroll-behavior:contain;padding:14px 16px 20px}
.pane{padding-top:0}
.pane>label:first-child,.pane>.sub:first-child{margin-top:0}
.foot{flex:0 0 auto;display:flex;gap:8px;align-items:center;padding:12px 16px;border-top:1px solid var(--line)}
.foot button.save{flex:1 1 auto;border:0;border-radius:6px;padding:11px 8px;font-size:13px;letter-spacing:.2em;cursor:pointer}
.foot button.copy{flex:0 0 auto;border:0;border-radius:6px;padding:11px 13px;font-size:13px;cursor:pointer}
.tg{flex:0 0 auto;display:inline-flex;gap:6px;align-items:center;border:0;background:transparent;padding:6px 0;font-size:11px;color:var(--dim);cursor:pointer;letter-spacing:0}
.tg u{flex:0 0 auto;width:28px;height:16px;border-radius:9px;background:var(--line);position:relative;transition:background .2s}
.tg u::after{content:"";position:absolute;width:12px;height:12px;border-radius:50%;background:#fff;left:2px;top:2px;transition:left .2s}
.tg[aria-pressed=true] u{background:var(--on-bg)} .tg[aria-pressed=true] u::after{left:14px;background:var(--on-fg)}
.view{min-width:0;min-height:0;padding:12px 18px 12px;gap:8px}
.count{min-height:14px;text-align:center}
.pages{container-type:size;align-content:safe center;--pgmax:4000px;padding:6px}
.nm{font-size:11px;color:var(--dim);text-align:center;letter-spacing:.06em;flex:0 0 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:15px}
.tip{min-height:17px;margin:0;text-align:center;flex:0 0 auto}
.bbar{display:flex;justify-content:center;align-items:center;gap:8px;flex:0 0 auto;min-height:42px}
.bbar button{flex:0 0 auto;border:1px solid var(--line);background:var(--btn);color:var(--fg);border-radius:999px;cursor:pointer;font-size:13px;padding:0}
.bbar button.ic{width:38px;height:38px;display:inline-flex;align-items:center;justify-content:center}
.bbar button.go{background:var(--on-bg);color:var(--on-fg);border-color:var(--on-bg);padding:11px 26px;letter-spacing:.14em;white-space:nowrap}
.bbar button.sv{background:var(--soft);border-color:transparent;padding:11px 18px;letter-spacing:.14em;white-space:nowrap}
.bbar .gap{width:10px}
.bbar button:disabled,.bx button:disabled{opacity:.32;cursor:default}
.mask[data-mode=plain] .bbar>:not(.sv){display:none}
.mask[data-mode=plain] .bx,.mask[data-mode=box] .pl{display:none!important}
.mask[data-mode=plain] .nm{display:none}
@media (min-width: 761px){ .mask[data-mode=plain] .bbar{min-height:0} }
/* 一行一件：名字、字、开关 */
.rw{display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding:3px 0}
.rws{border-top:1px solid var(--line);margin-top:16px}
.rw>span{flex:0 0 auto;min-width:34px;font-size:12px;color:var(--fg)}
.rw input[type=text]{border:0;background:transparent;padding:8px 4px;font-size:12px;min-width:0;flex:1 1 0;width:auto}
.rw input.mini{flex:0 0 46px;color:var(--dim)}
.pane .flist{gap:1px}
.pane .flist button{border-color:transparent;background:transparent}
.pane .flist button[aria-pressed=true]{background:var(--on-bg)}
.fold{border-top:1px solid var(--line);margin-top:10px}
.fold>summary{cursor:pointer;list-style:none;padding:11px 2px;font-size:12px;color:var(--dim);letter-spacing:.04em;display:flex;justify-content:space-between}
.fold>summary::-webkit-details-marker{display:none}
.fold>summary::after{content:"+"} .fold[open]>summary::after{content:"–"}
.ctr{text-align:center;margin-bottom:12px}
/* 小图 */
.gs{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;margin:0 -16px 12px;padding:0 12px}
.gs::-webkit-scrollbar{display:none}
.gs button{flex:0 0 auto;white-space:nowrap;border:0;background:transparent;font-size:12px;color:var(--dim);padding:6px 10px;border-radius:999px;cursor:pointer}
.gs button[aria-pressed=true]{background:var(--soft);color:var(--fg)}
.th{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 8px}
.th .ti{position:relative;min-width:0}
.th .ti>button:first-child{display:block;width:100%;border:0;background:transparent;padding:0;cursor:pointer;font-size:11px;color:var(--dim);line-height:1.35;text-align:center}
.th canvas,.th .re{display:block;width:100%;aspect-ratio:var(--ar,.8);border-radius:3px;margin-bottom:5px;background:var(--soft);box-shadow:0 1px 6px rgba(0,0,0,.14)}
.th .re{display:flex;align-items:center;justify-content:center;background:transparent;box-shadow:none;border:1px dashed var(--dim);opacity:.75}
.th .re svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.th button[aria-pressed=true]{color:var(--fg)!important}
.th button[aria-pressed=true] canvas{outline:2px solid var(--on-bg);outline-offset:2px}
.th .ti[data-no] canvas{opacity:.28}
.th .ti .x{position:absolute;right:-4px;top:-5px;width:22px;height:22px;border-radius:50%;border:1px solid var(--line);background:var(--bg);color:var(--dim);font:13px/1 sans-serif;padding:0;cursor:pointer}
.pop{position:absolute;right:12px;top:50px;z-index:6;width:250px;max-height:calc(100% - 64px);overflow:auto;background:var(--bg);border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:14px 16px}
.pop .foot{padding:0 0 14px;margin-bottom:12px;border-top:0;border-bottom:1px solid var(--line)}
.pop .foot .tg{margin-left:auto}
.pop .sub{margin:12px 0 6px;font-size:11px}.pop .sub:first-child{margin-top:0}
.pop .th{grid-template-columns:1fr 1fr}
@media (max-width: 760px){
  .box{display:flex;flex-direction:column;border-radius:0;height:100%;max-height:100%;padding:0;gap:0}
  .hd{flex:0 0 50px;padding:0 6px 0 16px;gap:2px}
  .hd p.h,.hb.w span,#fSheet{display:none!important}
  .hb{min-width:40px;height:40px}.hb.w{padding:0}
  .seg button{padding:9px 15px}
  .view{flex:1 1 0;height:auto;max-height:none;padding:6px 12px 4px;gap:5px;order:0}
  .count:not([data-note]){display:none}
  .pages{padding:5px}
  .tip:empty{display:none}
  .tip{max-height:34px;overflow:hidden}
  .bbar{gap:5px;min-height:46px}
  .bbar button.ic{width:38px;height:42px}
  .bbar button.go{padding:12px 15px;letter-spacing:.06em}
  .bbar button.sv{padding:12px 13px;letter-spacing:.06em}
  .bbar .gap{display:none}
  .side{order:1;flex:0 0 auto;height:var(--sh,40%);border-right:0;border-top:1px solid var(--line);transition:height .26s cubic-bezier(.22,.61,.36,1)}
  .side.drag{transition:none}
  .mask[data-sh=low] .side{height:22px}
  .mask[data-sh=tall] .side{height:54%}
  .mask[data-sh=low] .pbody,.mask[data-sh=low] .foot{visibility:hidden}
  .grab{display:flex;flex:0 0 22px;width:100%;border:0;background:transparent;padding:0;align-items:center;justify-content:center;cursor:grab;touch-action:none}
  .grab::after{content:"";width:40px;height:4px;border-radius:3px;background:var(--line)}
  .pbody{padding:0 16px 12px}
  .foot button.save{display:none}
  .tabs{order:2;flex:0 0 auto;flex-direction:row;padding:0 4px env(safe-area-inset-bottom,0px);border-right:0;border-top:1px solid var(--line);overflow:visible}
  .tabs button{flex:1 1 0;height:50px;font-size:13px;letter-spacing:0;min-width:0}
  .tabs button[aria-pressed=true]::before{left:22%;right:22%;top:0;bottom:auto;width:auto;height:2px}
  .gs button{padding:9px 12px;font-size:13px}
  .th .ti>button:first-child{font-size:12px}
  .rw input[type=text]{padding:11px 4px;font-size:13px}
  .tg{padding:9px 0;font-size:12px}
  .fold>summary{padding:14px 2px;font-size:13px}
  .pop{right:8px;left:8px;width:auto;top:48px}
  .pop .th{grid-template-columns:repeat(3,1fr)}
  /* 打字：键盘一上来只剩半屏，让给字和纸，别的先退下 */
  .mask.typing .hd,.mask.typing .tabs,.mask.typing .bbar,.mask.typing .nm,.mask.typing .foot,.mask.typing .grab{display:none}
  .mask.typing .view{flex:0 0 38%}
  .mask.typing .side{flex:1 1 0;height:auto}
  .mask.typing .pbody{padding-top:12px}
}
@media (max-width: 400px){ .hd{padding-left:12px} .hd .hb{min-width:36px} .hd .seg button{padding:9px 12px} }
@media (max-width: 379px){ #bRedo,.hd h2{display:none!important} .bbar{gap:4px} .bbar button.ic{width:34px} .bbar button.go{padding:12px 11px;letter-spacing:0} .bbar button.sv{padding:12px 11px;letter-spacing:0} }
`;
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const ICO = {
  prev: svg('M15 5l-7 7 7 7'), next: svg('M9 5l7 7-7 7'), undo: svg('M8 5L4 9l4 4M4 9h10a6 6 0 0 1 0 12h-3'), redo: svg('M16 5l4 4-4 4M20 9H10a6 6 0 0 0 0 12h3'),
  heart: svg('M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.3 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z'), full: svg('M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'), shrink: svg('M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5'),
  more: svg('M5.5 12h.02M12 12h.02M18.5 12h.02'), close: svg('M6 6l12 12M18 6L6 18'), side: svg('M4 5h16v14H4zM10 5v14'), again: svg('M20 6v5h-5M19.5 11A7.5 7.5 0 1 0 20 15'),
};
const FRAME_TABS = { plain: ['text', 'paper', 'font', 'ink', 'layout'], box: ['text', 'comp', 'look', 'pal', 'feel', 'font', 'add'] };
const tabsHtml = () => [...new Set([...FRAME_TABS.plain, ...FRAME_TABS.box])].sort((a, b) => ['text', 'paper', 'comp', 'look', 'pal', 'feel', 'font', 'ink', 'layout', 'add'].indexOf(a) - ['text', 'paper', 'comp', 'look', 'pal', 'feel', 'font', 'ink', 'layout', 'add'].indexOf(b)).map(k => `<button data-v="${k}">${t('tab.' + k)}</button>`).join('');
const headHtml = (init) => `
  <div class="hd">
    <h2>${t('app.title')}</h2><p class="h" id="tag"></p><span class="sp"></span>
    <span class="seg" id="mode"><button data-v="plain">${t('mode.plain')}</button><button data-v="box">${t('mode.box')}</button></span><span class="sp"></span>
    <button class="hb w" id="bMine" aria-expanded="false" title="${t('blind.mineTitle')}">${ICO.heart}<span>${t('blind.mineShort')}</span></button>
    <button class="hb" id="fSheet" hidden></button>
    <button class="hb" id="fGo" aria-pressed="false"></button>
    <button class="hb" id="more" aria-expanded="false" title="${t('head.more')}" aria-label="${t('head.more')}">${ICO.more}</button>
    <button class="hb" id="close" title="${t('act.close')}" aria-label="${t('act.close')}">${ICO.close}</button>
  </div>`;
const popsHtml = init => `
  <div class="pop" id="morePop" hidden>
    <div class="sub">${t('head.theme')}</div>
    <span class="seg" id="theme"><button data-v="auto">${t('theme.auto')}</button><button data-v="day">${t('theme.day')}</button><button data-v="night">${t('theme.night')}</button></span>
    <div id="lang" style="margin-top:14px"${hostLocale(init.locale) ? ' hidden' : ''}><div class="sub">${t('head.lang')}</div>
      <span class="seg"><button data-v="zh-CN" aria-pressed="${studioLocale !== 'en'}">中文</button><button data-v="en" aria-pressed="${studioLocale === 'en'}">English</button></span></div>
  </div>
  <div class="pop" id="keptPop" hidden><div class="sub">${t('blind.mineTitle')}</div><div class="th" id="bKept"></div><p class="pkhint" id="bKeptNone">${t('blind.mineNone')}</p></div>`;
const barHtml = () => `
  <div class="nm" id="bName"></div>
  <div class="bbar" id="bbar">
    <button class="ic" id="bPrev" title="${t('blind.prev')}" aria-label="${t('blind.prev')}">${ICO.prev}</button>
    <button class="go" id="bGo" title="${t('blind.openTitle')}">${t('blind.open')}</button>
    <button class="ic" id="bNext" title="${t('blind.next')}" aria-label="${t('blind.next')}">${ICO.next}</button>
    <span class="gap"></span>
    <button class="ic" id="bUndo" title="${t('blind.undo')}" aria-label="${t('blind.undo')}">${ICO.undo}</button>
    <button class="ic" id="bRedo" title="${t('blind.redo')}" aria-label="${t('blind.redo')}">${ICO.redo}</button>
    <button class="ic" id="bKeep" title="${t('blind.keepTitle')}" aria-label="${t('blind.keep')}">${ICO.heart}</button>
    <button class="sv" id="fSave" hidden>${t('act.save')}</button>
  </div>`;

// 骨架自己的事：换模式、换标签、弹层、抽屉、打字时让位。
//   moved ＝ 同一块控件两个模式都用，换模式时搬到那边去：[[选择器, 排信纸时的家, 拆盲盒时的家]]
function mountFrame({ mask, resume, alive, onTab, onMode, moved }){
  const q = s => mask.querySelector(s), small = () => { try { return matchMedia('(max-width: 760px)').matches; } catch { return false; } };
  const last = { plain: 'text', box: 'comp', ...(resume && resume.last) };
  let mode = '', tab = '';
  // ── 标签 ────────────────────────────────────────────────────────
  const show = v => {
    if (!FRAME_TABS[mode].includes(v)) v = FRAME_TABS[mode][0];
    tab = v; last[mode] = v;
    mask.querySelectorAll('#tabs button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === v));
    mask.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.dataset.p === v));
    q('#pbody').scrollTop = 0;
    onTab(v, mode);
  };
  q('#tabs').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (small() && b.dataset.v === tab){ sheet(mask.dataset.sh === 'low' ? 'mid' : mask.dataset.sh === 'mid' ? 'tall' : 'low'); return; }      // 再点一下正开着的：抽屉拉高、收起
    if (small() && mask.dataset.sh === 'low') sheet('mid');
    show(b.dataset.v);
  };
  const setMode = m => {
    if (m === mode) return;
    mode = m; mask.dataset.mode = m;
    q('#mode').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === m));
    mask.querySelectorAll('#tabs button').forEach(b => { b.hidden = !FRAME_TABS[m].includes(b.dataset.v); });
    for (const [what, plain, box] of moved) q(m === 'box' ? box : plain).append(q(what));
    show(last[m]);
  };
  q('#mode').onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.v !== mode) onMode(b.dataset.v); };
  // ── 弹层 ────────────────────────────────────────────────────────
  const pops = [['#more', '#morePop'], ['#bMine', '#keptPop']];
  const shut = () => { let any = false; for (const [b, p] of pops) if (!q(p).hidden){ q(p).hidden = true; q(b).setAttribute('aria-expanded', 'false'); any = true; } return any; };
  const pop = (b, p, on) => { const want = on === undefined ? q(p).hidden : on; shut(); q(p).hidden = !want; q(b).setAttribute('aria-expanded', String(want)); };
  for (const [b, p] of pops) q(b).onclick = () => pop(b, p);
  mask.addEventListener('pointerdown', e => { if (!pops.some(([b, p]) => e.target.closest(b) || e.target.closest(p))) shut(); }, true);
  // ── 抽屉（只有手机看得见把手）──────────────────────────────────
  const sheet = v => { mask.dataset.sh = v; };
  sheet((resume && resume.sh) || 'mid');
  const grab = q('#grab'), side = q('.side');
  grab.onpointerdown = e => {
    e.preventDefault(); grab.setPointerCapture(e.pointerId);
    const y0 = e.clientY, h0 = side.offsetHeight, H = q('.box').offsetHeight; let dy = 0;
    side.classList.add('drag');
    grab.onpointermove = ev => { dy = y0 - ev.clientY; if (Math.abs(dy) > 4) side.style.height = Math.max(22, Math.min(H * .72, h0 + dy)) + 'px'; };
    grab.onpointerup = grab.onpointercancel = () => {
      grab.onpointermove = grab.onpointerup = grab.onpointercancel = null; side.classList.remove('drag');
      const h = side.offsetHeight / H; side.style.height = '';
      if (Math.abs(dy) <= 4) sheet(mask.dataset.sh === 'low' ? 'mid' : mask.dataset.sh === 'mid' ? 'tall' : 'low');
      else sheet(h < .2 ? 'low' : h < .5 ? 'mid' : 'tall');
    };
  };
  // 手机上「存图」在拇指边，复制和透明底不常用，收进「⋯」，把地方让给小图
  const home = () => { const f = q('.foot'), want = small() ? q('#morePop') : q('.side'); if (f.parentElement !== want){ if (small()) want.prepend(f); else want.append(f); } };
  home(); let mq = null; try { mq = matchMedia('(max-width: 760px)'); mq.addEventListener('change', home); } catch {}
  // ── 打字 ────────────────────────────────────────────────────────
  // 认「眼前这块屏真的矮了一截」，不认焦点：接着实体键盘的、键盘不挤屏的，都不动排布；
  // 安卓按返回收键盘，焦点还在框里，屏一长回来也就还原 —— 认焦点的话会卡在打字的样子里出不来
  const vv = window.visualViewport, touch = () => { try { return matchMedia('(pointer: coarse)').matches; } catch { return false; } };
  let base = vv ? vv.height : 0, wide = vv ? vv.width : 0, typeT = 0;
  const typing = () => {
    clearTimeout(typeT); typeT = setTimeout(() => {
      if (!alive() || !vv) return;
      if (Math.abs(vv.width - wide) > 40){ wide = vv.width; base = vv.height; } base = Math.max(base, vv.height);
      const el = mask.getRootNode().activeElement, on = small() && touch() && !!el && el.matches && el.matches('textarea,input[type=text],input[type=number]') && vv.height < base * .82;
      mask.classList.toggle('typing', on);
    }, 90);
  };
  if (vv) vv.addEventListener('resize', typing);
  q('.side').addEventListener('focusin', typing); q('.side').addEventListener('focusout', typing);
  q('.view').addEventListener('pointerdown', () => { const el = mask.getRootNode().activeElement; if (mask.classList.contains('typing') && el && el.blur) el.blur(); });
  return { dispose(){ clearTimeout(typeT); if (vv) vv.removeEventListener('resize', typing); if (mq) try { mq.removeEventListener('change', home); } catch {} }, setMode, show, shut, pop, sheet, tab: () => tab, mode: () => mode, state: () => ({ last, sh: mask.dataset.sh }) };
}
