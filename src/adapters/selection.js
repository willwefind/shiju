// ════════════════════════════════════════════════════════════════════
//  8. 挂上去
// ════════════════════════════════════════════════════════════════════
let lastPt = { x: innerWidth/2, y: 120 };

function trySelection(x, y){
  if (mask) return;
  const s = window.getSelection ? window.getSelection() : null;
  const sel = String(s || '').trim();
  if (sel.length < 2){ if (pill) pill.hidden = true; return; }
  if (x == null && s && s.rangeCount){          // 键盘选的，贴着选区自己定位
    try {
      const r = s.getRangeAt(0).getBoundingClientRect();
      if (r.width || r.height){ x = r.left + r.width/2; y = r.top; }
    } catch {}
  }
  showPill((x ?? lastPt.x) + 6, y ?? lastPt.y, sel);
}

document.addEventListener('mouseup', e => {
  lastPt = { x: e.clientX, y: e.clientY };
  setTimeout(() => trySelection(e.clientX, e.clientY), 10);
}, true);

// 后备：有些站会吞掉 mouseup（自己实现的编辑器、拖拽层、canvas 上的文本层）
let selTimer;
document.addEventListener('selectionchange', () => {
  clearTimeout(selTimer);
  selTimer = setTimeout(() => trySelection(null, null), 260);
}, true);

// Alt+Q：选中了就带着选中的；什么都没选就开一张白纸（写日记、随笔用）
document.addEventListener('keydown', e => {
  if (e.altKey && (e.key === 'q' || e.key === 'Q')){
    if (mask) return;
    const tag = (document.activeElement || {}).tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement || {}).isContentEditable;
    if (typing) return;                       // 正在别处打字，别抢
    e.preventDefault();
    if (pill) pill.hidden = true;
    openPanel(String(getSelection() || '').trim());
  }
}, true);

// 三指轻点 = 手机上的 Alt+Q。
// 🔴 手机没有 Alt 键，而 iOS 的 Userscripts **不支持 GM_registerMenuCommand**，
//    也就没有脚本菜单可点 —— 空手起稿在手机上原本一个入口都没有。
//    选三指：网页几乎用不到这个手势，iOS 系统的三指手势只在可编辑区域里管撤销/重做，
//    所以在输入框里一律让开。
let tri = null;
document.addEventListener('touchstart', e => {
  if (mask) { tri = null; return; }
  const t = e.target;
  const editing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  tri = (e.touches.length === 3 && !editing)
    ? { t: Date.now(), x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
}, true);
document.addEventListener('touchend', e => {
  if (!tri || e.touches.length) return;          // 还有手指没抬起来，等
  const { t, x, y } = tri; tri = null;
  if (mask || Date.now() - t > 700) return;      // 按久了就不算「轻点」
  const c = e.changedTouches[0];
  if (c && Math.hypot(c.clientX - x, c.clientY - y) > 40) return;   // 划走了也不算
  if (pill) pill.hidden = true;
  openPanel(String(getSelection() || '').trim());
}, true);

