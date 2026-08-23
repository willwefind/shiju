// 拾句 · 测试启动垫（零依赖）
//
// 不改一行 shiju.user.js，垫一层最小 DOM 把它在 node:test 里跑起来。
// 思路与私坊 Node 适配器同源，但这里**不依赖任何 native 模块** ——
// 量具与平台全用 tests/gauge.mjs 的确定性桩，所以任何机器都能跑。
//
// 平台差异只许留在这个文件里；核心里一个 if (isTest) 都不许有。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makePlatform } from './gauge.mjs';

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const fakeEl = () => ({
  style: {}, dataset: {}, classList: { add() {}, toggle() {}, contains() { return false; } },
  children: [], append() {}, appendChild() {}, remove() {},
  setAttribute() {}, getAttribute() { return null; },
  addEventListener() {}, removeEventListener() {},
  querySelector() { return null; }, querySelectorAll() { return []; },
  attachShadow() { return fakeEl(); },
});

/**
 * 把真脚本跑起来，拿到 window.__shiju 导出面。
 * @param {{storage?: Record<string, any>, platform?: object, script?: string}} opt
 *   storage — 预置存储（逻辑键 → 值；会按 localStorage 退路的口径存成 shiju:键=JSON）。
 *             脚本在无 GM 环境里自动退到 localStorage，正好被这里接住。
 *   platform — 替换 __shijuPlatform（缺省用确定性桩）。
 * @returns {{S: object, store: Map<string, string>}}  store 即假 localStorage 的底座，
 *   测试可用 readCfg(store, k) 读回脚本写下的任何设置。
 */
export function bootShiju(opt = {}) {
  const store = new Map();
  for (const [k, v] of Object.entries(opt.storage || {})) {
    store.set('shiju:' + k, JSON.stringify(v));
  }

  globalThis.window = globalThis;
  globalThis.innerWidth = 1280;
  globalThis.innerHeight = 800;
  // Node 自带只读 navigator，得 defineProperty 盖掉
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'shiju-tests', maxTouchPoints: 0 }, configurable: true, writable: true,
  });
  globalThis.location = { href: 'test://shiju', hostname: 'shiju-tests' };
  globalThis.getSelection = () => '';
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  // 每次 boot 造新 document：dataset 归零，单例守卫不会拦第二次 boot
  globalThis.document = {
    documentElement: { dataset: {} },
    head: fakeEl(), body: fakeEl(), title: '拾句 · 测试', activeElement: null,
    fonts: { add() {}, check() { return true; }, ready: Promise.resolve() },
    addEventListener() {}, removeEventListener() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    getElementById() { return null; },      // 酒馆入口来问，null 它就安静收工
    createElement() { return fakeEl(); },   // 排版/计划路径不建 DOM，这只喂面板残余
  };

  globalThis.__shijuPlatform = opt.platform || makePlatform();
  delete globalThis.__shiju;
  delete globalThis.__shijuEmbed;

  const script = opt.script || path.join(ROOT, 'shiju.user.js');
  new Function(fs.readFileSync(script, 'utf8'))();

  // 用户脚本挂 __shiju；嵌入包挂 __shijuEmbed（opt.expect 指定）
  const expect = opt.expect || '__shiju';
  const S = globalThis[expect];
  if (!S) throw new Error(`脚本没把 ${expect} 挂出来 —— 看看是不是被守卫挡了`);
  return { S, store };
}

/** 读回脚本经 localStorage 退路写下的设置（没写过返回 undefined）。 */
export function readCfg(store, k) {
  const s = store.get('shiju:' + k);
  return s === undefined ? undefined : JSON.parse(s);
}
