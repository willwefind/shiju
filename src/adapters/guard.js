// ════════════════════════════════════════════════════════════════════
//  同一页只许有一份
// ════════════════════════════════════════════════════════════════════
// 这个文件有两个去处：① 用户脚本（篡改猴注入到任意网页）② 酒馆扩展（酒馆自己
// 用 <script type="module"> 加载）。装了扩展的人如果同时还开着用户脚本，
// 酒馆那一页上就会同时跑两份 —— 两套监听、两颗「摘」、两个面板。
// 🔑 标记必须放在 DOM 上：篡改猴的沙箱和页面**不共享 window**，但共享 document。
const MARK = 'shijuRunning';
if (document.documentElement.dataset[MARK]) {
  console.log('[拾句] 这一页已经有一份在跑了（' +
    document.documentElement.dataset[MARK] + '），这一份让开。');
  return;
}
document.documentElement.dataset[MARK] = '0.16.8';

