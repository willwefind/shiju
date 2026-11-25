// 拾句 · 自己加字：认文件、拆字体包、读链接
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT } from './boot.mjs';

const src = fs.readFileSync(path.join(ROOT, 'src/studio/studio-fonts.js'), 'utf8');
const F = new Function('location', 'cfg', 'setCfg', 'hasGM', 'loadedCustom', 'dropFontProbes', src + '\nreturn { fontSniff, zipList, zipRead, fontLinkOf, fontFaces, fontRanges };')({ href: 'https://a.test/' }, () => [], () => true, false, new Set(), () => {});

function zip(files) {
  const parts = [], dir = []; let at = 0;
  for (const [name, data, how] of files) {
    const n = Buffer.from(name), raw = Buffer.from(data), d = how ? zlib.deflateRawSync(raw) : raw, h = Buffer.alloc(30), c = Buffer.alloc(46);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(0x800, 6); h.writeUInt16LE(how, 8); h.writeUInt32LE(d.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(n.length, 26);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(0x800, 8); c.writeUInt16LE(how, 10); c.writeUInt32LE(d.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(at, 42);
    parts.push(h, n, d); dir.push(c, n); at += 30 + n.length + d.length;
  }
  const cd = Buffer.concat(dir), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(at, 16);
  const b = Buffer.concat([...parts, cd, e]); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length);
}

test('看文件头认字体，不信扩展名', () => {
  const buf = a => Uint8Array.from(a).buffer, str = s => Uint8Array.from(Buffer.from(s)).buffer;
  assert.equal(F.fontSniff(buf([0, 1, 0, 0, 0, 1])), 'font');
  for (const k of ['OTTO', 'wOFF', 'wOF2', 'ttcf', 'true']) assert.equal(F.fontSniff(str(k + '....')), 'font');
  assert.equal(F.fontSniff(str('PK\x03\x04')), 'zip');
  assert.equal(F.fontSniff(str('Rar!xx')), 'pack');
  assert.equal(F.fontSniff(str('@font-face{}')), 'text');
});
test('字体包：中文名、压缩过的和没压的都拆得开', async () => {
  const big = 'x'.repeat(5000), z = zip([['包/明朝.ttf', big, 8], ['说明.txt', 'hi', 0], ['b.otf', 'OTTO', 0]]), l = F.zipList(z);
  assert.deepEqual(l.map(f => f.name), ['包/明朝.ttf', '说明.txt', 'b.otf']);
  assert.equal(Buffer.from(await F.zipRead(z, l[0])).toString(), big);
  assert.equal(Buffer.from(await F.zipRead(z, l[2])).toString(), 'OTTO');
  assert.throws(() => F.zipList(new ArrayBuffer(100)), e => e.code === 'zipBad');
});
test('链接：@import、<link>、裸网址、几家网站的页面，都认得出该取哪个；只认 https', () => {
  const g = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap';
  assert.equal(F.fontLinkOf(`@import url('${g}');`), g);
  assert.equal(F.fontLinkOf(`<link rel="stylesheet" href="${g.replace('&', '&amp;')}">`), g);
  assert.equal(F.fontLinkOf('  ' + g + '  '), g);
  assert.equal(F.fontLinkOf('@import "//a.test/x.css";'), 'https://a.test/x.css');
  assert.equal(F.fontLinkOf('http://a.test/x.ttf'), 'https://a.test/x.ttf');
  assert.equal(F.fontLinkOf('https://github.com/a/b/blob/main/x/y.ttf'), 'https://raw.githubusercontent.com/a/b/main/x/y.ttf');
  assert.equal(F.fontLinkOf('https://fonts.zeoseven.com/items/256/'), 'https://fontsapi.zeoseven.com/256/main/result.css');
  assert.equal(F.fontLinkOf('https://fonts.google.com/specimen/Ma+Shan+Zheng'), 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap');
  for (const bad of ['hello', 'file:///c:/x.ttf', 'javascript:alert(1)', '']) assert.equal(F.fontLinkOf(bad), null);
});
test('样式表：一个家族取最接近 400 的一档，分片全收，相对地址补全，斜体不要', () => {
  const css = `/* @font-face{font-family:no;src:url(no.woff)} */
    @font-face{font-family:'A B';font-weight:700;src:url(b.woff2) format("woff2");unicode-range:U+4E00-4E10}
    @font-face{font-family:'A B';font-weight:400;src:local("A"),url("./r1.woff2")format("woff2"),url(r1.woff);unicode-range:U+4E00-4E10,U+20??}
    @font-face{font-family:'A B';src:url(/r2.woff2);unicode-range:U+5000}
    @font-face{font-family:'A B';font-style:italic;src:url(i.woff2)}
    @font-face{font-family:V;font-weight:200 900;src:url(v.woff2)}`;
  const f = F.fontFaces(css, 'https://a.test/x/y.css');
  assert.deepEqual(f.map(q => q.name), ['A B', 'V']);
  assert.deepEqual(f[0].faces, [['https://a.test/x/r1.woff2', 'U+4E00-4E10,U+20??'], ['https://a.test/r2.woff2', 'U+5000']]);
  assert.deepEqual(f[1].faces, [['https://a.test/x/v.woff2', '', '200 900']]);
  assert.deepEqual(F.fontRanges({ id: 'q', faces: f[0].faces }), [[[0x4e00, 0x4e10], [0x2000, 0x20ff]], [[0x5000, 0x5000]]]);
});
test('🔒 联网只有一处，不带登录、不带来路', () => {
  const all = fs.readFileSync(path.join(ROOT, 'shiju.user.js'), 'utf8');
  assert.equal((all.match(/\bfetch\(/g) || []).length, 1);
  assert.ok(/fetch\(u, \{ credentials: 'omit', referrerPolicy: 'no-referrer'/.test(src));
  assert.ok(!/GM_xmlhttpRequest|@connect|XMLHttpRequest|sendBeacon|WebSocket/.test(all.split('==/UserScript==')[0] + all.split('==/UserScript==')[1]));
});
