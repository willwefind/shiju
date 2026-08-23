// ════════════════════════════════════════════════════════════════════
//  平台缝：排版/绘制这条路上，只有「造一块画布」和「造一张图」跟环境有关
// ════════════════════════════════════════════════════════════════════
// 收在这一处，Node 那边就只要换掉这两个函数，不用垫一整套 DOM ——
// 这样浏览器和服务端跑的是**同一份文件**，而不是两份会分叉的实现。
// 面板 UI 里的 createElement 不走这里（那些本来就只在浏览器里活）。
const PLATFORM = {
  canvas(w, h){
    const c = document.createElement('canvas');
    if (w != null) c.width = w;
    if (h != null) c.height = h;
    return c;
  },
  image(){ return new Image(); },
};
// 加载这份脚本之前先塞一个 globalThis.__shijuPlatform，就能整体替换掉上面两件
try { if (globalThis.__shijuPlatform) Object.assign(PLATFORM, globalThis.__shijuPlatform); } catch {}

// 量具：排版全程只要「量一段字有多宽」这一件能力。
// 排版那几个函数（planPages / chrome / titleBlock / wrapVertical）都收一个可选的
// 量具工厂，不自己去造画布 —— 这样核心离「一个不碰环境的纯排版模块」只差搬家。
// 🔑 工厂可以每次给新的，也可以每次都返回同一块（省着用）：调用链上每个用量具的
//    地方都会**先设 font 再量**，所以共用一块是安全的。planPages 里 probe.font
//    特意设在 chrome() 之后，就是为了共用时不被 chrome 改掉的 font 坑到。
const newMeasure = () => PLATFORM.canvas().getContext('2d');
