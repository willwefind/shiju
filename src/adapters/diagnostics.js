// 自检：脚本要么大声说话，要么就该被看见。别再出现「选中没反应，但不知道死在哪」。
function selfCheck(){
  alert([
    '拾句 自检', '',
    '脚本版本：' + SHIJU_VERSION,
    `当前页面：${location.href.slice(0, 70)}`,
    `在 iframe 里：${window.top !== window.self ? '是（脚本声明了 @noframes，不在 iframe 里跑）' : '否'}`,
    `GM_download：${typeof GM_download === 'function' ? '有' : '没有 —— 走浏览器自己的下载，一样能存图'}`,
    `设置存在哪：${hasGM ? 'GM 存储（所有网站共用一份）' : '这个网站自己的 localStorage（跨网站不共享，得每个站各设一次）'}`,
    `脚本菜单：${typeof GM_registerMenuCommand === 'function' ? '有' : '没有（iOS 的 Userscripts 就没有）—— 空手起稿请用三指轻点'}`,
    `面板容器：${host && host.isConnected ? '已挂上' : '还没挂（选中文字才会建）'}`,
    `你现在选中了：${String(window.getSelection() || '').trim().slice(0, 24) || '（什么都没选）'}`,
    `系统里能用的字：${FONTS.filter(fontAvailable).map(f => f.name).join('、')}`,
    `没装的：${FONTS.filter(f => !fontAvailable(f)).map(f => f.name).join('、') || '（没有）'}`,
    `你自己加的纸：${cfg('myPapers').length} 张　字：${cfg('myFonts').length} 款`,
    '',
    '看到这个框，说明脚本在这一页是活的。',
    '不用先选文字就开一张白纸：电脑按 Alt+Q 或用油猴菜单；手机三指轻点屏幕。',
    '选中文字没反应，多半是这页在你装脚本之前就开着了 —— 按 F5。',
    '字体装了却还是灰的 —— 要完全退出浏览器再开，Chrome 系不热加载字体列表。',
  ].join('\n'));
}

try {
  GM_registerMenuCommand('拾句：写点什么（不用先选文字）', () => openPanel(''));
  GM_registerMenuCommand('拾句：自检（选中没反应先点这个）', selfCheck);
  GM_registerMenuCommand('设置保存子目录', () => {
    const v = prompt('存到浏览器下载目录下的哪个子文件夹？（留空＝直接放下载目录）', cfg('subdir'));
    if (v !== null){ setCfg('subdir', v.trim()); alert('好了，以后存到：下载目录/' + (v.trim() || '（根目录）')); }
  });
  GM_registerMenuCommand('清空我加的纸 / 字 / 墨', () => {
    if (confirm('把你自己加的信纸、字体、墨色都清掉？内置的和素材包不受影响。')){
      setCfg('myPapers', []); setCfg('myFonts', []); setCfg('myInks', []);
      myPaperImgs.clear(); loadedCustom.clear();
      alert('清好了');
    }
  });
} catch {}

