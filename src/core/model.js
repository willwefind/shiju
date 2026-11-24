// ════════════════════════════════════════════════════════════════════
//  0. 设置（GM 存储是跨网站共享的 —— 换纸换字设一次，全网通用）
// ════════════════════════════════════════════════════════════════════
const DEF = {
  paper: 'rice', font: 'auto', fontSize: 46, ink: 'black',
  orient: 'portrait', pages: 'auto',
  weight: 0,            // 字重：0 常规 / 1 中 / 2 粗
  latinFont: 'none',    // 西文字体：拼在中文字体前面，只接管拉丁字母和数字
  titleFont: 'same',    // 标题字体：same = 跟正文一样
  // 标题字号是**绝对像素**，不是正文的百分比 —— 早先按百分比算，于是一动正文字号
  // 标题就跟着变，「把标题和正文分开调」根本做不到。
  titleSize: 69,
  titleWeight: 1,
  inkLight: 0,          // 墨色明暗 −50…+50（正=往白走，负=往黑走）
  paperLight: 0,        // 纸张明暗 −50…+50
  theme: 'auto',        // 面板主题：auto 跟随系统 / day / night
  myInks: [],           // [{id,name,c}] 自己调的墨
  align: 'left',        // 正文对齐（在版心里，不是贴纸边）
  titleAlign: 'center',
  vertical: false,      // 竖排：字从上往下，列从右往左
  offsetX: 0, offsetY: 0,   // 整块位移（在预览图上拖出来的）
  metaInk: 'auto',      // 题头/出处/日期/线的颜色。auto = 跟着纸深浅自动定
  // 引号里那段话的颜色。auto = 跟着纸深浅自动定（原来的橙）；same = 跟正文一个色
  // （＝不给引号变色）；也可以指定任何一支墨或直接一个 #rrggbb。
  quoteInk: 'auto',
  blind: null,          // 版式盲盒 {seed, own, calm}。null = 普通版式；只随版式预设存，不跨面板记
  presets: [],          // [{id,name,style}] 存下来的版式
  headRule: true,       // 题头下那道线
  titleRule: true,      // 标题下那道短横
  footRule: true,       // 页脚那道线
  sourcePrefix: '—— ',  // 出处前面的符号，想删就清空
  titleVertical: false, // 标题自己的排向，跟正文分开定
  headText: '摘 录',    // 题头。空手写日记随笔时「摘录」两个字不对味，所以可改
  showHeader: true, showSource: true, showDate: true,
  subdir: '摘录',
  myPapers: [], myFonts: [],
};
