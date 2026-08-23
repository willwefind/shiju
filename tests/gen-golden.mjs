// 拾句 · 重新生成排版计划 golden
//
//   node tests/gen-golden.mjs
//
// 什么时候才允许重跑：**有意**改变排版行为并已确认新行为正确的时候。
// 重构（行为不该变）时若测试红了，先怀疑重构，不是先重跑 golden。
// golden 用确定性量具生成（tests/gauge.mjs），任何机器重跑同一版代码结果逐字节相同。

import fs from 'node:fs';
import { bootShiju } from './boot.mjs';
import { makeGauge } from './gauge.mjs';
import { FIXTURES, digest } from './plan-fixtures.mjs';

const { S } = bootShiju();
const out = {};
for (const f of FIXTURES) out[f.name] = digest(S, f.st, makeGauge);

const dst = new URL('./golden-plans.json', import.meta.url);
fs.writeFileSync(dst, JSON.stringify(out, null, 1) + '\n');
console.log(`写出 ${Object.keys(out).length} 个样本 → tests/golden-plans.json`);
