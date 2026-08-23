// 拾句 · 确定性量具（测试专用）
//
// 排版计划（plan）里的一切几何都来自 canvas measureText。真字体的量宽因机器而异，
// 拿它出 golden 就变成「比两台机器装了什么字」。这里给一块**确定性的假量具**：
// 宽度只由「字号 × 字符类别」决定，与任何真实字体无关 —— 同一段文字在任何机器、
// 任何年代量出来都一样，golden 才敢进仓库。
//
// 类别宽（em）：CJK/全角/中文标点 1.0；ASCII 可见字符 0.52；空格 0.5；其余 0.6。
// 模型不追求像真字体，只追求：确定、单调、可加。折行/避头尾/分页照样被充分行使。
//
// 只实现排版路径真正会碰的面：font 属性 + measureText().width。
// 故意不给 fillRect/drawImage —— 计划层测试若碰到绘制调用，就该炸出来。

export function pxOf(font) {
  const m = /(\d+(?:\.\d+)?)px/.exec(String(font));
  return m ? Number(m[1]) : 16;
}

export function charEm(cp) {
  if (cp === 0x20) return 0.5;                       // 空格
  if (cp > 0x20 && cp < 0x7f) return 0.52;           // ASCII 可见字符
  if (cp >= 0x2e80) return 1;                        // CJK、全角标点、半宽假名等
  if (cp >= 0x2000 && cp <= 0x206f) return 1;        // —— …… “” 等一般标点区
  return 0.6;                                        // 其余（罕见）
}

export function measureStr(s, px) {
  let w = 0;
  for (const ch of String(s)) w += px * charEm(ch.codePointAt(0));
  return w;
}

/** 量具工厂：与核心的 mk 契约一致 —— 每次调用返回一块「先设 font 再量」的上下文。 */
export function makeGauge() {
  const ctx = {
    font: '16px sans-serif',
    measureText(s) { return { width: measureStr(s, pxOf(ctx.font)) }; },
  };
  return ctx;
}

/** 平台桩：canvas() 只够字体探测量宽用；image() 是永不解码的哑对象。 */
export function makePlatform() {
  return {
    canvas(w, h) {
      return {
        width: w == null ? 300 : w,
        height: h == null ? 150 : h,
        getContext() { return makeGauge(); },
      };
    },
    image() {
      return {
        complete: false, naturalWidth: 0, naturalHeight: 0,
        onload: null, onerror: null,
        set src(v) { /* 测试里没人解码 */ },
      };
    },
  };
}
