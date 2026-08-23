// ════════════════════════════════════════════════════════════════════
//  Studio 界面语言（zh-CN / en）
// ════════════════════════════════════════════════════════════════════
// 只管 Studio Shell 的界面文字（面板、药丸、提示、确认框）。
// 内容与内容默认值不在此列：题头默认「摘 录」、出处前缀「—— 」、提示句
// TAGLINES 是**作品上的字**，不是界面文字，保持原样（已声明的取舍）。
// 适配器注入：嵌入方开面板时传 init.locale（'zh-CN' | 'en' | 'auto'），
// 用户脚本自己走 auto = 浏览器语言（zh-* → zh-CN，其余 → en）。
//
// 铁律（与阅读器 Phase 1 相同）：
//   1. zh-CN 词典的值必须与清扫前的界面原文**逐字相同** —— 中文界面一个字都不变；
//   2. 新增任何可见字符串必须 zh + en 双词条，键名平衡、{参数} 平衡
//      （tests/studio-i18n.test.mjs 站岗）；
//   3. 参数用 {name} 花括号占位，t() 做整串替换，不做任何格式化。

const STUDIO_I18N = {
  'zh-CN': {
    // ── 药丸 / 面板骨架 ──────────────────────────────────────────
    'pill.clip': '摘',
    'app.title': '拾 句',
    'theme.auto': '跟随', 'theme.day': '白天', 'theme.night': '黑夜',
    'tab.text': '文', 'tab.paper': '纸', 'tab.font': '字', 'tab.ink': '色', 'tab.layout': '版',
    'act.save': '存 图', 'act.copy': '复制这张', 'act.close': '关闭',
    'act.store': '存',

    // ── 通用小件（开关 / 字重 / 对齐 / 排向）──────────────────────
    'sw.show': '显示', 'sw.hide': '隐藏',
    'weight.regular': '常', 'weight.medium': '中', 'weight.bold': '粗',
    'align.left': '左', 'align.center': '中', 'align.right': '右',
    'dir.horizontal': '横排', 'dir.vertical': '竖排',
    'tip.renameDelete': '双击改名 · 右键删掉',
    'tip.rightDelete': '右键删掉',

    // ── 文 ───────────────────────────────────────────────────────
    'text.title': '标题',
    'text.sizeWeight': '字号 · 字重',
    'text.titlePh': '留空就没有标题',
    'text.body': '内容',
    'text.source': '出处',
    'text.sourcePrefixPh': '前缀',
    'text.date': '日期',
    'text.header': '题头',
    'text.headerPh': '摘 录 / 日记 / 随笔 …',
    'text.rules': '三道线要不要',
    'text.ruleHead': '题头下', 'text.ruleTitle': '标题下', 'text.ruleFoot': '页脚',

    // ── 纸 ───────────────────────────────────────────────────────
    'paper.builtin': '内置（代码画的）',
    'paper.pack': '素材包',
    'paper.packEmpty': '素材包（还没导，按下面的「＋包」）',
    'paper.mine': '我加的',
    'paper.bright': '纸张明暗',
    'paper.groupBold': '浓色', 'paper.groupSoft': '柔色',
    'paper.packTileTitle': '{name}（{group}）',
    'paper.addTile': '＋',
    'paper.addTileTitle': '把你自己的信纸图丢进来',
    'paper.addPack': '＋包',
    'paper.addPackTitle': '导入信纸素材包（.json），导一次就常驻，所有网站通用',
    'paper.importing': '正在收纸…',
    'paper.defaultName': '我的纸{n}',
    'paper.oneFail': '这张收不进来：{name}',
    'paper.importedAll': '收了 {n} 张（已占 {mb}MB）。双击一张纸可以改名，右键删掉。',
    'paper.importedSome': '{total} 张里收进来 {n} 张（已占 {mb}MB）。双击改名，右键删掉。',
    'paper.storageFull': ' 存的东西有点多了，建议删掉些不用的。',
    'paper.packReading': '正在读素材包…',
    'paper.packInstalled': '装好了：{n} 套（横竖各一张）。以后不用再导。',
    'paper.packVolatile': '这次能用：{n} 套。但存不下来（浏览器给脚本的空间不够装这么大的包），换一页要重导。',
    'paper.packBad': '这个素材包读不了：{msg}',
    'paper.renamePrompt': '这张纸叫什么？',
    'paper.deleteConfirm': '删掉「{name}」这张纸？',
    'paper.autoInkSwapped': '这张纸太浓，黑字看不清，墨色替你换成了「{name}」——不喜欢就自己再挑。',

    // ── 字 ───────────────────────────────────────────────────────
    'font.body': '正文字体',
    'font.latin': '西文字体（只管字母和数字）',
    'font.title': '标题字体',
    'font.sameAsBody': '同正文',
    'font.noneLatin': '不指定（跟着中文字体走）',
    'font.hintMissing': '没装',
    'font.hintCustom': '自装',
    'font.hintCjk': '中文',
    'font.hintLatin': '西文',
    'font.missingTitle': '系统里没装这款字',
    'font.add': '＋ 从文件装一款字',
    'font.addTitle': '存在油猴里，所有网站通用',
    'font.tooBig': '{name} 有 {mb}MB，太大存不进油猴。请用裁过子集的版本，或直接双击装进系统。',
    'font.installFail': '装不上：{name}',
    'font.urlLoading': '正在装载 {name}…',
    'font.urlFailed': '{name} 装载失败。',
    'font.notInstalledTip': '这款字系统里没装。双击字体文件装进 Windows（装完要**完全重开浏览器**），或按下面的「＋ 从文件装」。',

    // ── 色 ───────────────────────────────────────────────────────
    'ink.body': '正文墨色',
    'ink.meta': '题头/出处/日期的颜色',
    'ink.quote': '引号里那段话的颜色',
    'ink.custom': '自己调',
    'ink.customHint': '双击改名 · 右键删',
    'ink.namePh': '起个名，比如「黄昏」',
    'ink.bright': '墨色明暗',
    'ink.followPaper': '跟着纸',
    'ink.followBody': '跟正文',
    'ink.defaultName': '自配{n}',
    'ink.saved': '存好了：「{name}」{c}。双击它可以改名，右键删掉。',
    'ink.renamePrompt': '这支墨叫什么？',
    'ink.deleteConfirm': '删掉「{name}」这支墨？',

    // ── 版 ───────────────────────────────────────────────────────
    'preset.label': '版式预设',
    'preset.namePh': '给当前这套版式起个名',
    'preset.builtinTitle': '内置排版',
    'preset.defaultName': '我的版式{n}',
    'preset.applied': '换成「{name}」了。内容没动。',
    'preset.saved': '存好了：「{name}」。双击改名，右键删掉。',
    'preset.renamePrompt': '这套版式叫什么？',
    'preset.deleteConfirm': '删掉「{name}」这套版式？',
    'layout.bodyDir': '正文排向',
    'layout.titleDir': '标题排向',
    'layout.bodyAlign': '正文对齐',
    'layout.titleAlign': '标题对齐',
    'layout.orient': '版式',
    'layout.pages': '拆成几张',
    'layout.pagesAuto': '自动',
    'layout.offset': '整块位移',
    'layout.offsetHint': '在右边预览图上直接拖',
    'layout.offsetVal': '左右 {x} · 上下 {y}',
    'layout.offsetNone': '没挪过',
    'layout.offsetReset': '归位',

    // ── 预览 / 计数 ──────────────────────────────────────────────
    'count.pages': '{n} 张　{w}×{h}　导出 {ew}×{eh}',
    'count.notesGlue': '　—— ',
    'count.notesJoin': '；',
    'count.grewNote': '这么多字放不进这么少张，整叠一起加高了',
    'count.fewerNote': '要 {want} 张，但内容只够 {got} 张',
    'count.renderFail': '画不出来：{msg}',

    // ── 存 / 复制 ────────────────────────────────────────────────
    'save.working': '正在存 {n} 张…',
    'save.fileOne': '摘录_{stamp}.jpg',
    'save.fileMulti': '摘录_{stamp}_{i}of{n}.jpg',
    'save.doneFallback': '存了 {n} 张，其中 {fb} 张进不了子目录，直接落在下载目录。',
    'save.done': '已存 {n} 张到：下载目录/{dir}',
    'copy.donePage': '已复制第 {n} 张',
    'copy.done': '已复制到剪贴板',
    'copy.denied': '这个网站不给复制权限，请用「存图」',

    // ── 登记表显示名（核心数据不动，显示时查这里；用户自造的走兜底）──
    'orient.portrait': '竖版', 'orient.landscape': '横版',
    'paper.rice': '宣纸', 'paper.cream': '米黄', 'paper.kraft': '牛皮',
    'paper.linen': '布纹', 'paper.black': '纯黑',
    'preset.p_zhai': '摘录', 'preset.p_riji': '日记', 'preset.p_xin': '信件', 'preset.p_shu': '竖排',
    'ink.black': '墨黑', 'ink.sepia': '深褐', 'ink.indigo': '靛青', 'ink.crimson': '绛红',
    'ink.pine': '松绿', 'ink.ash': '烟灰', 'ink.paper': '纸白', 'ink.moon': '月白',
    'ink.gold': '浅金', 'ink.rose': '藕荷', 'ink.jade': '霜青',
    'font.sys': '系统宋体', 'font.zhuque': '朱雀仿宋', 'font.jinghua': '京華老宋',
    'font.huiwen': '汇文明朝', 'font.jinshu': '寒蝉锦书', 'font.chillhuo': '寒蝉活宋',
    'font.duanhei': '寒蝉端黑', 'font.nanxi': '南西油墨', 'font.nano': '纳米老宋',
    'font.chaohua': '朝華標題', 'font.chaohuaB': '朝華標題B', 'font.dinglie': '鼎猎宋刻',
    'font.pixel': '像素',
    'hint.fellEng': '十七世纪活字', 'hint.fellPica': '十七世纪活字',
    'hint.elite': '打字机', 'hint.limelight': '装饰体', 'hint.uncial': '安色尔',
    'hint.smokum': '西部厚板', 'hint.beau': '花体', 'hint.jim': '哥特手写',
    'hint.tages': '手写', 'hint.coral': '像素',
  },
  'en': {
    // ── 药丸 / 面板骨架 ──────────────────────────────────────────
    'pill.clip': 'Clip',
    'app.title': 'Shiju',
    'theme.auto': 'System', 'theme.day': 'Day', 'theme.night': 'Night',
    'tab.text': 'Text', 'tab.paper': 'Paper', 'tab.font': 'Type', 'tab.ink': 'Ink', 'tab.layout': 'Layout',
    'act.save': 'Save', 'act.copy': 'Copy this one', 'act.close': 'Close',
    'act.store': 'Save',

    // ── 通用小件（开关 / 字重 / 对齐 / 排向）──────────────────────
    'sw.show': 'Show', 'sw.hide': 'Hide',
    'weight.regular': 'Regular', 'weight.medium': 'Medium', 'weight.bold': 'Bold',
    'align.left': 'Left', 'align.center': 'Center', 'align.right': 'Right',
    'dir.horizontal': 'Horizontal', 'dir.vertical': 'Vertical',
    'tip.renameDelete': 'Double-click to rename · right-click to delete',
    'tip.rightDelete': 'Right-click to delete',

    // ── 文 ───────────────────────────────────────────────────────
    'text.title': 'Title',
    'text.sizeWeight': 'Size · weight',
    'text.titlePh': 'Leave empty for no title',
    'text.body': 'Body',
    'text.source': 'Source',
    'text.sourcePrefixPh': 'Prefix',
    'text.date': 'Date',
    'text.header': 'Header',
    'text.headerPh': 'Excerpt / Diary / Notes …',
    'text.rules': 'Divider lines',
    'text.ruleHead': 'Below header', 'text.ruleTitle': 'Below title', 'text.ruleFoot': 'Footer',

    // ── 纸 ───────────────────────────────────────────────────────
    'paper.builtin': 'Built-in (drawn by code)',
    'paper.pack': 'Paper packs',
    'paper.packEmpty': 'Paper packs (none yet — use “＋Pack” below)',
    'paper.mine': 'My papers',
    'paper.bright': 'Paper brightness',
    'paper.groupBold': 'bold', 'paper.groupSoft': 'soft',
    'paper.packTileTitle': '{name} ({group})',
    'paper.addTile': '＋',
    'paper.addTileTitle': 'Drop in your own paper images',
    'paper.addPack': '＋Pack',
    'paper.addPackTitle': 'Import a paper pack (.json) — import once, it stays for every site',
    'paper.importing': 'Importing paper…',
    'paper.defaultName': 'My paper {n}',
    'paper.oneFail': 'Could not import: {name}',
    'paper.importedAll': 'Imported {n} ({mb}MB used). Double-click a paper to rename, right-click to delete.',
    'paper.importedSome': 'Imported {n} of {total} ({mb}MB used). Double-click to rename, right-click to delete.',
    'paper.storageFull': ' Storage is getting full — consider deleting some unused items.',
    'paper.packReading': 'Reading the pack…',
    'paper.packInstalled': 'Installed: {n} sets (portrait and landscape each). No need to import again.',
    'paper.packVolatile': 'Usable this time: {n} sets, but they could not be stored (the browser gives scripts too little space for a pack this big) — re-import on the next page.',
    'paper.packBad': 'Could not read this pack: {msg}',
    'paper.renamePrompt': 'Name this paper?',
    'paper.deleteConfirm': 'Delete the paper “{name}”?',
    'paper.autoInkSwapped': 'This paper is too dark for black text, so the ink was switched to “{name}” — pick another if you prefer.',

    // ── 字 ───────────────────────────────────────────────────────
    'font.body': 'Body font',
    'font.latin': 'Latin font (letters and digits only)',
    'font.title': 'Title font',
    'font.sameAsBody': 'Same as body',
    'font.noneLatin': 'None (follow the Chinese font)',
    'font.hintMissing': 'missing',
    'font.hintCustom': 'custom',
    'font.hintCjk': 'Chinese',
    'font.hintLatin': 'Latin',
    'font.missingTitle': 'This font is not installed on your system',
    'font.add': '＋ Install a font from file',
    'font.addTitle': 'Stored in the userscript manager, works on every site',
    'font.tooBig': '{name} is {mb}MB — too big to store in the userscript manager. Use a subsetted version, or double-click the file to install it system-wide.',
    'font.installFail': 'Could not install: {name}',
    'font.urlLoading': 'Loading {name}…',
    'font.urlFailed': 'Could not load {name}.',
    'font.notInstalledTip': 'This font is not installed. Double-click the font file to install it into Windows (then fully restart the browser), or use “＋ Install a font from file” below.',

    // ── 色 ───────────────────────────────────────────────────────
    'ink.body': 'Body ink',
    'ink.meta': 'Header / source / date color',
    'ink.quote': 'Quoted text color',
    'ink.custom': 'Mix your own',
    'ink.customHint': 'double-click to rename · right-click to delete',
    'ink.namePh': 'Name it, like “Dusk”',
    'ink.bright': 'Ink brightness',
    'ink.followPaper': 'Follow paper',
    'ink.followBody': 'Same as body',
    'ink.defaultName': 'Custom {n}',
    'ink.saved': 'Saved: “{name}” {c}. Double-click it to rename, right-click to delete.',
    'ink.renamePrompt': 'Name this ink?',
    'ink.deleteConfirm': 'Delete the ink “{name}”?',

    // ── 版 ───────────────────────────────────────────────────────
    'preset.label': 'Presets',
    'preset.namePh': 'Name the current setup',
    'preset.builtinTitle': 'Built-in preset',
    'preset.defaultName': 'My preset {n}',
    'preset.applied': 'Switched to “{name}”. Your content is untouched.',
    'preset.saved': 'Saved: “{name}”. Double-click to rename, right-click to delete.',
    'preset.renamePrompt': 'Name this preset?',
    'preset.deleteConfirm': 'Delete the preset “{name}”?',
    'layout.bodyDir': 'Body direction',
    'layout.titleDir': 'Title direction',
    'layout.bodyAlign': 'Body alignment',
    'layout.titleAlign': 'Title alignment',
    'layout.orient': 'Page size',
    'layout.pages': 'Split into',
    'layout.pagesAuto': 'Auto',
    'layout.offset': 'Block offset',
    'layout.offsetHint': 'drag directly on the preview',
    'layout.offsetVal': 'X {x} · Y {y}',
    'layout.offsetNone': 'Not moved',
    'layout.offsetReset': 'Reset',

    // ── 预览 / 计数 ──────────────────────────────────────────────
    'count.pages': 'Pages: {n} · {w}×{h} · exports {ew}×{eh}',
    'count.notesGlue': ' — ',
    'count.notesJoin': '; ',
    'count.grewNote': 'too much text for that few pages, the whole stack grew taller',
    'count.fewerNote': 'asked for {want} pages, but the content only fills {got}',
    'count.renderFail': 'Could not render: {msg}',

    // ── 存 / 复制 ────────────────────────────────────────────────
    'save.working': 'Saving {n} images…',
    'save.fileOne': 'excerpt_{stamp}.jpg',
    'save.fileMulti': 'excerpt_{stamp}_{i}of{n}.jpg',
    'save.doneFallback': 'Saved {n} images; {fb} could not go into the subfolder and landed straight in Downloads.',
    'save.done': 'Saved {n} images to: Downloads/{dir}',
    'copy.donePage': 'Copied page {n}',
    'copy.done': 'Copied to clipboard',
    'copy.denied': 'This site blocks clipboard access — use “Save” instead',

    // ── 登记表显示名（核心数据不动，显示时查这里；用户自造的走兜底）──
    'orient.portrait': 'Portrait', 'orient.landscape': 'Landscape',
    'paper.rice': 'Rice paper', 'paper.cream': 'Cream', 'paper.kraft': 'Kraft',
    'paper.linen': 'Linen', 'paper.black': 'Pure black',
    'preset.p_zhai': 'Excerpt', 'preset.p_riji': 'Diary', 'preset.p_xin': 'Letter', 'preset.p_shu': 'Vertical',
    'ink.black': 'Ink black', 'ink.sepia': 'Sepia', 'ink.indigo': 'Indigo', 'ink.crimson': 'Crimson',
    'ink.pine': 'Pine green', 'ink.ash': 'Ash gray', 'ink.paper': 'Paper white', 'ink.moon': 'Moon white',
    'ink.gold': 'Pale gold', 'ink.rose': 'Lotus pink', 'ink.jade': 'Frost jade',
    'font.sys': 'System Songti', 'font.zhuque': 'Zhuque Fangsong', 'font.jinghua': 'KingHwa OldSong',
    'font.huiwen': 'Huiwen Mincho', 'font.jinshu': 'ChillJinshuSong', 'font.chillhuo': 'ChillHuoSong',
    'font.duanhei': 'ChillDuanHeiSong', 'font.nanxi': 'Nanxi Youmosong', 'font.nano': 'Nano OldSong',
    'font.chaohua': 'Zhaohua Min A', 'font.chaohuaB': 'Zhaohua Min B', 'font.dinglie': 'Dinglie Songke',
    'font.pixel': 'Fusion Pixel',
    'hint.fellEng': '17th-century type', 'hint.fellPica': '17th-century type',
    'hint.elite': 'typewriter', 'hint.limelight': 'display', 'hint.uncial': 'uncial',
    'hint.smokum': 'western slab', 'hint.beau': 'script', 'hint.jim': 'blackletter',
    'hint.tages': 'handwritten', 'hint.coral': 'pixel',
  },
};

function resolveStudioLocale(v) {
  if (v === 'zh-CN' || v === 'en') return v;
  let lang = 'zh';
  try {
    lang = String((navigator.languages && navigator.languages[0]) || navigator.language || 'zh');
  } catch {}
  return lang.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}
let studioLocale = resolveStudioLocale('auto');
function setStudioLocale(v) { studioLocale = resolveStudioLocale(v); }

// 查词：当前语言 → zh-CN 兜底 → 键名本身（宁可露出键名也不静默空白）
function t(key, params) {
  let s = STUDIO_I18N[studioLocale][key];
  if (s == null) s = STUDIO_I18N['zh-CN'][key];
  if (s == null) return key;
  if (params) for (const p in params) s = s.split('{' + p + '}').join(String(params[p]));
  return s;
}

// 登记表显示名：有词条用词条，没有（用户自造的）用它存的名字
function tName(prefix, id, fallback) {
  const k = prefix + '.' + id;
  return (STUDIO_I18N[studioLocale][k] != null || STUDIO_I18N['zh-CN'][k] != null) ? t(k) : fallback;
}
