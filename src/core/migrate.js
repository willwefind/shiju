// 一次性迁移：标题字号从「正文的百分比」改成绝对像素。
// 🔴 两种表示法并存必然对不上（同一件事写两套算法），所以迁完就把 titleScale 彻底扔掉，
//    代码里再也不认这个键。存下来的版式也一起迁，不然老版式一点就丢标题字号。
(function migrateTitleSize(){
  const px = (base, scale) => Math.round((base === undefined ? DEF.fontSize : base) * scale / 100);
  try {
    // 走 rawCfg/setCfg，别再直接摸 GM_* —— 那两个在 iOS 上根本不存在
    if (rawCfg('titleSize') === undefined && rawCfg('titleScale') !== undefined)
      setCfg('titleSize', px(rawCfg('fontSize'), rawCfg('titleScale')));
    const ps = rawCfg('presets');
    if (Array.isArray(ps) && ps.some(p => p && p.style && p.style.titleScale !== undefined))
      setCfg('presets', ps.map(p => {
        if (!p || !p.style || p.style.titleScale === undefined) return p;
        const style = { ...p.style };
        style.titleSize = px(style.fontSize, style.titleScale);
        delete style.titleScale;
        return { ...p, style };
      }));
  } catch (e) { console.warn('[拾句] 标题字号迁移没跑成：', e.message); }
})();

