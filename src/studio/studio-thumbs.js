// ════════════════════════════════════════════════════════════════════
//  6g. 小图：方案、气氛、常用版式，用你正在排的这段字现画
// ════════════════════════════════════════════════════════════════════
// 海报先出来，小图后到。规矩：
//   ① 只画看得见的；② 趁空一张一张画，人一动手就停；③ 同样的字、同样的设置画过就留着；
//   ④ 四分之一大小画，一张多半几毫秒。
const THUMB_DPR = .25, THUMB_KEEP = 260;
function mountThumbs({ alive, busy, view }){
  const cache = new Map();      // key → { cv, ok }
  let queue = [], running = false, timer = 0;
  const idle = fn => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 400 }) : setTimeout(fn, 24));
  const seen = el => { if (!el.isConnected) return false; const r = el.getBoundingClientRect(); if (!r.width) return false; const v = view().getBoundingClientRect(); return r.bottom > v.top - 40 && r.top < v.bottom + 120; };
  const lay = (job, got) => {
    const c = job.cv, g = got.cv; if (c.width !== g.width || c.height !== g.height){ c.width = g.width; c.height = g.height; }
    const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.drawImage(g, 0, 0); c.dataset.key = job.key;
    if (job.tell) job.tell(got.ok);
  };
  const paint = job => {
    const cv = PLATFORM.canvas(8, 8); let ok = true;
    try { const s = job.st(), plan = planPages(s); ok = !job.want || !!(plan.blind && plan.blind.comp === job.want); if (plan.blind) withDPR(THUMB_DPR, () => renderPage(cv, s, plan, 0)); else ok = false; } catch { ok = false; }
    const got = { cv, ok }; cache.set(job.key, got);
    if (cache.size > THUMB_KEEP) cache.delete(cache.keys().next().value);
    return got;
  };
  const step = () => {
    if (!alive()){ running = false; queue = []; return; }
    if (busy()){ timer = setTimeout(step, 160); return; }
    const i = queue.findIndex(j => seen(j.cv));
    if (i < 0){ running = false; return; }      // 剩下的都看不见：等滚到再说
    const job = queue.splice(i, 1)[0]; lay(job, paint(job)); idle(step);
  };
  const kick = () => { if (!running && queue.length){ running = true; idle(step); } };
  // jobs：[{ cv, key, st: () => 排它用的设置, want?: 非得是这种方案, tell?: ok => {} }]
  const set = jobs => {
    queue = [];
    for (const j of jobs){ if (j.cv.dataset.key === j.key) continue; const got = cache.get(j.key); if (got){ cache.delete(j.key); cache.set(j.key, got); lay(j, got); } else queue.push(j); }
    kick();
  };
  return { set, kick, dispose(){ queue = []; clearTimeout(timer); cache.clear(); } };
}
