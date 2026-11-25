// 拾句 · Studio 界面语言铁律
//
// 键名平衡：zh-CN 与 en 的键集合必须完全相同 —— 少一条翻译就红。
// 参数平衡：同一键两边的 {参数} 集合必须相同 —— 少传一个占位就红。

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { bootShiju, ROOT } from './boot.mjs';

const src = fs.readFileSync(path.join(ROOT, 'src/studio/studio-i18n.js'), 'utf8');

// 词典是碎片里的普通常量，不在导出面上 —— 直接在隔离作用域里取出来
function dicts() {
  const grab = new Function(src + '\nreturn STUDIO_I18N;');
  return grab.call(Object.create(null));
}

test('zh-CN 与 en 键集合完全相同', () => {
  const d = dicts();
  const zh = Object.keys(d['zh-CN']).sort();
  const en = Object.keys(d['en']).sort();
  assert.deepEqual(en, zh, 'en 与 zh-CN 的键不一致');
  assert.ok(zh.length > 0);
});

test('同一键两边的 {参数} 集合相同', () => {
  const d = dicts();
  const params = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
  for (const k of Object.keys(d['zh-CN'])) {
    assert.deepEqual(params(d['en'][k]), params(d['zh-CN'][k]), `键 ${k} 的参数不平衡`);
  }
});

test('词典值全是非空字符串', () => {
  const d = dicts();
  for (const loc of ['zh-CN', 'en']) {
    for (const [k, v] of Object.entries(d[loc])) {
      assert.equal(typeof v, 'string', `${loc}.${k} 不是字符串`);
      assert.ok(v.length > 0, `${loc}.${k} 是空串`);
    }
  }
});

test('拼进成品后照常启动（i18n 碎片不破坏无头环境）', () => {
  const { S } = bootShiju();
  assert.equal(typeof S.planPages, 'function');
});

test('面板语言：嵌入方指定的 > 自己换过的 > 浏览器的', () => {
  const run = (cfg, v) => new Function('cfg', 'v', src + '\nreturn resolveStudioLocale(panelLocale(v));')(() => cfg, v);
  assert.equal(run('en', 'zh-CN'), 'zh-CN');
  assert.equal(run('zh-CN', 'en'), 'en');
  assert.equal(run('en', 'auto'), 'en');
  assert.equal(run('zh-CN', undefined), 'zh-CN');
  assert.ok(['zh-CN', 'en'].includes(run('auto', undefined)));
});

test('面板里写到的每个词，词典里都有；每一屏都有名字', () => {
  const d = dicts()['zh-CN'], dir = path.join(ROOT, 'src/studio'), miss = [];
  for (const f of fs.readdirSync(dir)) for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/\bt\('([\w.]+)'/g)) if (!m[1].endsWith('_') && !m[1].endsWith('.') && !(m[1] in d)) miss.push(f + ' ' + m[1]);
  for (const k of ['text', 'paper', 'font', 'ink', 'layout', 'comp', 'look', 'pal', 'feel', 'add']) if (!d['tab.' + k]) miss.push('tab.' + k);
  for (const k of ['all', 'air', 'tex', 'lens', 'word', 'print']) if (!d['blind.k_' + k]) miss.push('k_' + k);
  assert.deepEqual(miss, []);
});
test('气氛分堆：一种不落', () => {
  const { S } = bootShiju(), s = fs.readFileSync(path.join(ROOT, 'src/studio/studio-blind.js'), 'utf8').split(/\r?\n/).find(l => l.startsWith('const B_LOOK_GROUPS'));
  const g = new Function(s + '\nreturn B_LOOK_GROUPS;')();
  assert.deepEqual(g.flatMap(x => x[1] || []).sort(), S.BLIND_LOOKS.map(k => k.id).sort());
});
