// 拾句 · 拼装嵌入包（给阅读器 vendor 用的第二种产物）
//
//   node tools/build-vendor.mjs [输出路径]     缺省写到 dist/shiju-embed.js（不入库）
//
// 与 build-userscript 同一批 src/ 碎片、同一个事实源，只是拼法不同：
// 嵌入方（Our Dialogues 阅读器）自己管生命周期、选区和菜单，所以这一包
// **不含** guard / selection / sillytavern / diagnostics / main —— 只有
// 存储退路 + 核心 + Studio。导出面也窄：window.__shijuEmbed，够用即可。
//
// 无 GM 环境下 storage.js 自动退 localStorage（键前缀 shiju:，与阅读器的
// our-dialogues.* 命名空间零冲突）；PLATFORM 默认走 document —— 都是现成行为。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = p => path.join(ROOT, 'src', p);
const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

// 嵌入包的碎片序 = 用户脚本序去掉适配器行李（storage/migrate 保留：语义各处一致）
export const VENDOR_ORDER = [
  'adapters/storage.js',
  'core/migrate.js',
  'core/platform.js',
  'core/model.js',
  'core/skin.js',
  'core/fonts.js',
  'core/papers.js',
  'core/typeset.js',
  'core/paginate.js',
  'core/layout.js',
  'core/render.js',
  'studio/studio-i18n.js',
  'studio/studio-shell.js',
];

export function buildVendorText() {
  const version = JSON.parse(read(path.join(ROOT, 'manifest.json'))).version;
  const head = [
    '// 拾句 · 嵌入包（生成物，别手改）',
    '// 事实源：willwefind/shiju 的 src/ 碎片；重新生成：node tools/build-vendor.mjs',
    `// 版本：${version} · 许可：AGPL-3.0（见源仓 LICENSE）`,
    '',
  ].join('\n');
  const open = "(function () {\n'use strict';\nconst SHIJU_VERSION = '" + version + "';\n\n";
  const body = VENDOR_ORDER.map(f => read(SRC(f))).join('');
  const tail = [
    '// ── 嵌入导出面（窄）────────────────────────────────────────────',
    '// openPanel(text, init) 是全部入口；其余是素材接线和版本核对用。',
    'window.__shijuEmbed = { SHIJU_VERSION, openPanel, setStudioLocale,',
    '                        installPack, packs, paperMean, bestInk, planPages, renderPage };',
    '',
  ].join('\n');
  const close = '})();\n';
  return head + open + body + tail + close;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = process.argv[2] || path.join(ROOT, 'dist', 'shiju-embed.js');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const text = buildVendorText();
  fs.writeFileSync(out, text);
  console.log(`嵌入包拼装完成：${VENDOR_ORDER.length} 个碎片 → ${out}（${text.length} 字符）`);
}
