// 🔴 iOS 上的 Userscripts **没有**同步的 GM_getValue/GM_setValue（它只给异步的 GM.getValue）。
//    照原样直接调，每次都落到 catch 里返回默认值 —— 表现是「改了纸改了字，换一页全没了」，
//    而且一声不吭。探不到 GM 存储就退到 localStorage。
// ⚠️ 两者不等价：GM 存储跨网站共享，localStorage 按站点分家（每个网站要各设一次），
//    而且只有 ~5MB，3MB 的信纸素材包多半塞不进去。这些都在自检里如实说。
const hasGM = (() => {
  try { return typeof GM_getValue === 'function' && typeof GM_setValue === 'function'; }
  catch { return false; }
})();
const LSK = 'shiju:';
// 存了什么就返回什么，没存过返回 undefined —— 「没存过」和「存了个默认值」得分得开
const rawCfg = k => {
  try {
    if (hasGM) return GM_getValue(k);
    const s = localStorage.getItem(LSK + k);
    return s === null ? undefined : JSON.parse(s);
  } catch { return undefined; }
};
const cfg = k => { const v = rawCfg(k); return v === undefined ? DEF[k] : v; };
// 返回「到底存下没有」—— localStorage 会因为超配额而失败，失败了就得让人知道
const setCfg = (k, v) => {
  try {
    if (hasGM) GM_setValue(k, v); else localStorage.setItem(LSK + k, JSON.stringify(v));
    return true;
  } catch (e) { console.warn('[拾句] 存不下设置：', e.message); return false; }
};

