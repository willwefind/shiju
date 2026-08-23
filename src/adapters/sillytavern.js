// ════════════════════════════════════════════════════════════════════
//  酒馆（SillyTavern）里的入口
// ════════════════════════════════════════════════════════════════════
// 装成酒馆扩展时没有脚本管理器，也就没有那个「写点什么」的菜单。
// 在酒馆的「扩展」面板里挂一块。**判据是那两个容器在不在** ——
// 普通网页上没有这两个 id，下面这段等于不存在，一行也不会执行到。
function mountSillyTavern(){
  if (document.getElementById('shiju_st_block')) return true;
  const host = document.getElementById('extensions_settings2')
            || document.getElementById('extensions_settings');
  if (!host) return false;

  const box = document.createElement('div');
  box.id = 'shiju_st_block';
  box.className = 'shiju-st inline-drawer';
  box.innerHTML = `
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>拾句 · 网页摘录成图</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>
    <div class="inline-drawer-content">
      <div style="font-size:.9em;opacity:.8;line-height:1.7;margin-bottom:8px">
        选中一段回复 → 旁边冒出「摘」；或者按 <b>Alt+Q</b>（手机三指轻点）直接开一张白纸。
      </div>
      <div class="menu_button menu_button_icon" id="shiju_st_open">
        <span>写点什么（开一张白纸）</span>
      </div>
    </div>`;
  host.append(box);
  box.querySelector('#shiju_st_open').addEventListener('click', () => {
    if (mask) return;
    openPanel(String(getSelection() || '').trim());
  });
  // 抽屉的展开/收起用酒馆自己的样式类，它的脚本会接管；接管不到就自己兜一下
  const head = box.querySelector('.inline-drawer-toggle');
  head.addEventListener('click', () => {
    const body = box.querySelector('.inline-drawer-content');
    if (body) body.style.display = body.style.display === 'none' ? '' : 'none';
  });
  console.log('[拾句] 已挂进酒馆的「扩展」面板。');
  return true;
}
// 酒馆那块面板不一定比脚本先建好，探几次就放弃（普通网页上就是探几次然后安静收工）
(function waitForSillyTavern(n){
  if (mountSillyTavern() || n <= 0) return;
  setTimeout(() => waitForSillyTavern(n - 1), 1000);
})(15);

