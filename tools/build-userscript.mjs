// 拾句 · 拼装单文件成品
//
//   node tools/build-userscript.mjs
//
// src/ 是唯一事实源；根目录的 shiju.user.js 是**生成物**（篡改猴和酒馆都只认它，
// 而且要能整段复制进控制台，所以必须是一个自足的单文件）。
// 改代码改 src/，改完跑这里重新拼装；直接改根文件的话，
// tests/built-artifact.test.mjs 会当场翻脸。
//
// 拼法：userscript 头 + 一层 IIFE + 按 ORDER 顺序原样连接全部碎片。
// 所有碎片共享同一个闭包作用域 —— 拆文件只是组织手段，不改变任何语义。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = p => path.join(ROOT, 'src', p);

// 连接顺序就是原文件的自然顺序：先守卫和地基，再核心，再界面，最后挂接与导出。
export const ORDER = [
  'adapters/guard.js',       // 同一页只许有一份（必须最先跑）
  'core/model.js',           // 默认值 DEF —— 内容/样式模型的地基
  'adapters/storage.js',     // GM 存储 / localStorage 退路
  'core/migrate.js',         // titleScale → titleSize 一次性迁移
  'core/platform.js',        // 平台缝：canvas/image 环境抽象 + 量具工厂
  'core/skin.js',            // 墨色/对比度/版式白名单/内置版式/尺寸表
  'core/fonts.js',           // 字体登记表/探测/字体栈
  'core/papers.js',          // 纸：程序化生成/素材包（含 installPack）/代表色
  'core/typeset.js',         // 避头尾/引号变色/竖排
  'core/spans.js',           // 局部样式：选中的字单独的字号/字体/颜色
  'core/paginate.js',        // 正文压流/分页装箱
  'core/layout.js',          // titleBlock/chrome/planPages —— 排版计划
  'core/render.js',          // renderPage —— 把一页画到 canvas
  'core/blind-text.js',      // 版式盲盒：断句/挑主角/字体/配色
  'core/blind-colors.js',    // 版式盲盒：配色（中国／和田三造／国际／现调）
  'core/blind-fx.js',        // 版式盲盒：效果与景
  'core/blind-items.js',     // 版式盲盒：物件（光/环/星/花/毛线）
  'core/blind-post.js',      // 版式盲盒：修图（整张后期）与玻璃片
  'core/blind-stage.js',     // 版式盲盒：台面（尺、格、摆字）
  'core/blind-recipes.js',   // 版式盲盒：方案（一种就是一张排好的海报）
  'core/blind-quiet.js',     // 版式盲盒：低声的那些
  'core/blind-image.js',     // 版式盲盒：意象字（文字即图形）
  'core/blind-more.js',      // 版式盲盒：有体温的那些
  'core/blind-long.js',      // 版式盲盒：长文
  'core/blind-looks.js',     // 版式盲盒：气氛（底、光、质地、修图）
  'core/blind-plan.js',      // 版式盲盒：掷签、验收、落墨
  'studio/studio-i18n.js',   // Studio 界面语言（zh-CN/en 词典 + t()）
  'studio/studio-pick.js',   // 选中即改：只改选中的那几个字
  'studio/studio-blind.js',  // 版式盲盒的按钮条
  'studio/studio-full.js',   // 全屏
  'studio/studio-shell.js',  // Shadow DOM 面板全部界面
  'adapters/selection.js',   // 选区监听/Alt+Q/三指轻点
  'adapters/sillytavern.js', // 酒馆扩展入口
  'adapters/diagnostics.js', // 自检 + 油猴菜单
  'main.js',                 // 启动日志 + window.__shiju 导出面
];

const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

export function buildText() {
  // 版本只有一处事实源：manifest.json（酒馆读它，构建替脚本头/守卫/日志/自检盖章）
  const version = JSON.parse(read(path.join(ROOT, 'manifest.json'))).version;
  const head = read(SRC('userscript-head.txt')).replace('{{SHIJU_VERSION}}', version);
  if (!head.includes('@version      ' + version)) throw new Error('脚本头没盖上版本章');
  const open = "(function () {\n'use strict';\nconst SHIJU_VERSION = '" + version + "';\n\n";
  const body = ORDER.map(f => read(SRC(f))).join('');
  const close = '})();\n';
  return head + open + body + close;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = path.join(ROOT, 'shiju.user.js');
  const text = buildText();
  fs.writeFileSync(out, text);
  console.log(`拼装完成：${ORDER.length + 1} 个碎片 → shiju.user.js（${text.length} 字符）`);
}
