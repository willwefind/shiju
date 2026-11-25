// ════════════════════════════════════════════════════════════════════
//  6c. 版式盲盒的界面：按钮条（常驻在预览上方）＋「盒」那一屏（接着改）＋ 纸上直接拖
// ════════════════════════════════════════════════════════════════════
const BLIND_CSS = `
.chips{display:flex;flex-wrap:wrap;gap:5px;align-items:center}
.chips button{border:1px solid var(--line);background:var(--btn);color:var(--fg);border-radius:999px;font-size:12px;padding:4px 11px;cursor:pointer}
.chips button[aria-pressed=true]{background:var(--on-bg);color:var(--on-fg);border-color:var(--on-bg)}
.chips button.re::before{content:"↻ ";color:var(--dim)}
.chips .bre,.chips .bLock{display:contents}
.bsec{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:var(--fg);margin:0 0 4px;letter-spacing:.04em}
.bsec:not(:first-child){margin-top:24px}
.bsec .chips button{font-size:11px;padding:3px 9px}
.amts.fs{margin:4px 0 12px;font-size:12px;color:var(--dim)}
.pals{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.pals button{height:32px;padding:0;border:1px solid var(--line);border-radius:5px;cursor:pointer;overflow:hidden;display:flex}
.pals button[aria-pressed=true]{outline:2px solid var(--on-bg);outline-offset:1px}
.pals i{flex:1;height:100%}
.four{display:flex;gap:14px;font-size:12px;color:var(--dim)}
.four span{display:flex;gap:5px;align-items:center}
.four input,.dots input{width:28px;height:24px;padding:0;border:1px solid var(--line);border-radius:3px;background:var(--btn);cursor:pointer}
.one{border:1px solid var(--on-bg);border-radius:6px;padding:10px;background:var(--field);margin:2px 0 16px}
.one .fs{margin-top:5px;font-size:11px;color:var(--dim)}
.one .fs span{flex:0 0 34px}
.dots{display:flex;gap:6px;align-items:center;margin-top:7px}
.dots button{width:20px;height:20px;border-radius:50%;border:1px solid rgba(128,128,128,.4);padding:0;cursor:pointer}
.dots button[aria-pressed=true]{outline:2px solid var(--on-bg);outline-offset:1px}
.two{display:flex;gap:5px}
.two button{flex:1;border:1px solid var(--line);background:var(--btn);color:var(--fg);border-radius:4px;font-size:12px;padding:6px 4px;cursor:pointer}
.bov{position:absolute;inset:0;outline:none}
.bsel{position:absolute;border:1.5px dashed #fff;box-shadow:0 0 0 1.5px rgba(185,32,11,.8);pointer-events:none;border-radius:3px}
.bsel i,.bsel u{position:absolute;pointer-events:auto;width:18px;height:18px;border-radius:50%;background:#fff;border:1px solid rgba(185,32,11,.85);
     box-shadow:0 1px 4px rgba(0,0,0,.25);touch-action:none;font:12px/16px sans-serif;text-align:center;text-decoration:none;color:#b9200b}
.bsel i{right:-9px;bottom:-9px;cursor:nwse-resize}
.bsel u{right:-9px;top:-9px;cursor:pointer}
@media (pointer: coarse){ .bov{pointer-events:none} .mask.bedit .bov{pointer-events:auto;touch-action:none} .bsel i,.bsel u{width:26px;height:26px;line-height:24px} }
@media (max-width: 760px){
  .chips button{padding:8px 13px}
  .pals button{height:38px}
  .dots button{width:28px;height:28px}
}
`;
// 方案分三堆：低声的、意象、响亮的
const B_COMP_GROUPS = () => [['quiet', BLIND_COMPS.filter(c => c.q && !c.g && c.id !== 'image' && c.id !== 'youme')], ['warm', BLIND_MORE], ['long', BLIND_LONG], ['image', BLIND_COMPS.filter(c => c.id === 'image' || c.id === 'youme')], ['jp', BLIND_STYLE.filter(c => c.g === 'jp')], ['intl', BLIND_STYLE.filter(c => c.g === 'intl')], ['pop', BLIND_STYLE.filter(c => c.g === 'pop')], ['loud', BLIND_COMPS.filter(c => !c.q && !c.long && !c.g && !BLIND_MORE.includes(c))]];
// 气氛分几堆（跟 README 那张表一个分法）
const B_LOOK_GROUPS = [['all', null], ['air', ['mist', 'afterglow', 'over', 'night', 'lamp', 'darkroom', 'neon', 'dive', 'gradient', 'pearl']], ['tex', ['first', 'watercolor', 'paper', 'press', 'film', 'sandblast', 'signal']], ['lens', ['swirl', 'long', 'glass', 'negative', 'subtitle']], ['word', ['vanish', 'cover', 'flat']], ['print', ['bokashi', 'benday']]];
const bRe = ks => `<span class="bre" data-ks="${ks}"></span>`;
const bAmt = k => `<div class="fs amts" data-k="${k}"><span>${t('blind.amt')}</span><input type="range" min="0" max="100" step="1" aria-label="${t('blind.amt_' + k)}"><span class="val"></span></div>`;
// 在纸上点中的那一块：哪一屏都在最上头
const blindOneHtml = () => `
    <div class="bx"><div class="one" id="bOne" hidden>
      <div class="pkh"><b id="bOneName"></b><button id="bOneDel">${t('blind.del')}</button></div>
      <div id="bSwapBox"><div class="chips" id="bSwap"></div></div>
      <div id="bLineBox"><div class="chips" id="bFeel"></div><div class="chips" id="bMode" style="margin-top:4px"></div></div>
      <div class="dots" id="bDots"></div>
      <div class="fs" data-k="r"><span>${t('blind.size')}</span><input type="range" min="2" max="100" step="1"></div>
      <div class="fs" data-k="a"><span>${t('blind.alpha')}</span><input type="range" min="5" max="100" step="1"></div>
      <div class="fs" data-k="rot"><span>${t('blind.turn')}</span><input type="range" min="-180" max="180" step="1"></div>
      <div class="fs" data-k="t"><span>${t('blind.thick')}</span><input type="range" min="1" max="100" step="1"></div>
      <div class="two" style="margin-top:8px"><button id="bFront"></button><button id="bReseed">${t('blind.reseed')}</button><button id="bDup">${t('blind.dup')}</button></div>
    </div></div>`;
const blindPaneHtml = () => `
  <div class="pane bx" data-p="comp"><div class="gs" id="bCompG"></div><div class="th" id="bComp"></div>
    <div class="sub" style="margin-top:20px">${t('blind.reroll')}</div><div class="chips">${bRe('hero')}</div><p class="pkhint" id="bTip">${t('blind.editHint')}</p></div>
  <div class="pane bx" data-p="look"><div class="gs" id="bLookG"></div><div class="th" id="bLook"></div></div>
  <div class="pane bx" data-p="pal">
    <div class="chips" style="margin-bottom:14px">${bRe('pal')}<button id="bTune">${t('blind.tune')}</button></div>
    <div class="gs" id="bPalG"></div><div class="pals" id="bPals"></div>
    <div class="sub" style="margin-top:18px">${t('blind.fourSub')}</div>
    <div class="four" id="bFour">${['g', 'i', 'a', 'b'].map(k => `<span><input type="color" data-k="${k}">${t('blind.c' + k)}</span>`).join('')}</div>
    <details class="fold" style="margin-top:20px"><summary>${t('blind.minePaper')}</summary><div class="chips bLock" style="display:flex"><button data-k="paper">${t('blind.usePaper')}</button></div><div id="palPaper"></div></details>
    <details class="fold" style="margin-top:0"><summary>${t('blind.mineInk')}</summary><div class="chips bLock" style="display:flex"><button data-k="ink">${t('blind.useInk')}</button></div><div id="palInk"></div></details>
  </div>
  <div class="pane bx" data-p="feel">
    <div class="bsec"><span>${t('blind.s_fx')}</span><span class="chips">${bRe('fx')}</span></div>${bAmt('fx')}
    <div class="chips" id="bFx"></div><details class="fold"><summary>${t('blind.more')}</summary><div class="chips" id="bFx2"></div></details>
    <div class="bsec"><span>${t('blind.s_post')}</span><span class="chips">${bRe('post')}</span></div>${bAmt('post')}
    <div class="chips" id="bPost"></div>
  </div>
  <div class="pane bx" data-p="add"><div class="sub" style="margin-top:0">${t('blind.addNow')}</div><div class="chips" id="bItems"></div><div id="bAdd"></div></div>`;

function mountBlind({ resume, mask, st, draw, repaint, sync, alive, tip, keep, kept, tab, keptOpen, shutPops, typing }){
  const q = s => mask.querySelector(s);
  // 一个盒子 ＝ 它自己的一串改动；盒子之间前后翻，盒子里头一步一步撤
  const boxes = resume ? resume.boxes : []; let at = resume ? resume.at : -1, plan = null, sel = null, name = '', short = '', label = '', lookNow = '';
  const box = () => boxes[at];
  const texts = () => ({ text: q('#t').value, title: q('#ti').value });
  const apply = () => { sync(); draw(); };
  let lastTag = '', lastAt = 0;
  // 记一步。tag 相同、又挨得很近的（拖滑块）只算一步
  const set = (patch, tag) => {
    st.blind = { ...st.blind, ...patch };
    if (!box()){ boxes.push({ hist: [st.blind], i: 0 }); at = boxes.length - 1; }
    else {
      const b = box(), now = Date.now();
      if (tag && tag === lastTag && now - lastAt < 900 && b.i > 0){ b.hist.length = b.i + 1; b.hist[b.i] = st.blind; }
      else { b.hist.length = b.i + 1; b.hist.push(st.blind); b.i++; }
      lastTag = tag || ''; lastAt = now;
    }
  };
  const go = (patch, tag) => { set(patch, tag); apply(); };

  q('#bGo').onclick = () => {
    if (!(q('#t').value.trim() || q('#ti').value.trim())){ tip(t('blind.empty')); return; }
    // 连着两次同一种方案就没意思了，多掷几颗挑一颗不一样的
    // 每拆一个都是全新的：上一个盒子里换的纸、挑的字，留在上一个盒子里
    const amt = cfg('blindAmt'), base = { v: 2, ...(amt ? { amt } : {}) }, mk = () => ({ ...base, seed: blindSeed() });
    undress();
    // 先看一眼气氛，跟上一张一样就不必排；方案要排完才知道，最多多排两回。排好的那张直接拿去画
    let bl = mk(), got = null;
    for (let i = 0, full = 0; i < 12 && label && full < 2; i++){
      if (blindAir({ ...st, ...texts() }, bl) !== lookNow){ full++; got = planPages({ ...st, ...texts(), blind: bl }); if (!got.blind || got.blind.comp !== label) break; got = null; }
      bl = mk();
    }
    st.blind = bl; sel = null; hot = got ? { bl, plan: got } : null;
    boxes.push({ hist: [st.blind], i: 0 }); at = boxes.length - 1; lastTag = '';
    apply();
  };
  // 排好了还没画的那一张（拆的时候为了不重样先排过），画的时候别再排一遍
  let hot = null;
  const take = () => { const h = hot; hot = null; return h && h.bl === st.blind ? h.plan : null; };
  // 常用版式连着它当时的横竖、题头出处日期、用的字：只管这一个盒子，换盒子、合上，就还回去
  let worn = null;
  const undress = () => { if (worn) for (const [k, v] of Object.entries(worn.now)) if (st[k] === v) st[k] = worn.was[k]; worn = null; };
  const dress = set => { undress(); if (!set) return; worn = { now: set, was: {} }; for (const k of Object.keys(set)){ worn.was[k] = st[k]; st[k] = set[k]; } };
  const jump = n => { at = n; dress(box().set); st.blind = box().hist[box().i]; sel = null; apply(); };
  q('#bPrev').onclick = () => { if (at > 0) jump(at - 1); };
  q('#bNext').onclick = () => { if (at < boxes.length - 1) jump(at + 1); };
  q('#bUndo').onclick = () => { const b = box(); if (b && b.i > 0){ b.i--; st.blind = b.hist[b.i]; lastTag = ''; apply(); } };
  q('#bRedo').onclick = () => { const b = box(); if (b && b.i < b.hist.length - 1){ b.i++; st.blind = b.hist[b.i]; lastTag = ''; apply(); } };
  // 换模式：回信纸不丢盒子，再进来还是刚才那一个
  const off = () => { undress(); st.blind = null; sel = null; apply(); };
  const on = () => { if (at >= 0 && boxes[at] && (q('#t').value.trim() || q('#ti').value.trim())) jump(at); else q('#bGo').onclick(); };
  // 常用版式：收下的时候把颜色也定死，以后换一段字、换一个版本，都还是它
  const frozen = () => {
    const p = plan.blind, { cls, canon, big, hero, heroW, body, bodyW, meta, metaW } = p.fonts, own = st.blind.own || {};
    return { ...st.blind, pal: { ...p.pal }, keep: { turn: p.turn, room: p.room, ...(own.font ? {} : { face: { cls, canon, big, hero, heroW, body, bodyW, meta, metaW } }) } };
  };
  const setOf = p => { const s = {}; for (const k of ['orient', 'showHeader', 'showSource', 'showDate'].concat((p.style.blind.own || {}).font ? ['font', 'latinFont', 'titleFont'] : [])) if (k in p.style) s[k] = p.style[k]; return s; };
  q('#bKeep').onclick = () => { if (!plan || !plan.blind) return; const n = short.slice(0, 24); keep(n, frozen()); fillKept(); tip(t('blind.kept', { name: n })); };
  let keptStamp = null;
  function fillKept(){
    const list = kept.list(), stamp = list.map(p => p.id + p.name).join(); if (stamp === keptStamp) return; keptStamp = stamp;
    const box = q('#bKept'); box.textContent = ''; q('#bKeptNone').hidden = !!list.length;
    for (const p of list.slice().reverse()){
      const d = document.createElement('div'), b = document.createElement('button'), x = document.createElement('button');
      d.className = 'ti'; d.dataset.id = p.id; b.append(document.createElement('canvas'), document.createTextNode(p.name)); b.title = t('blind.mineUse'); x.className = 'x'; x.textContent = '×'; x.title = t('blind.del'); x.setAttribute('aria-label', t('blind.del')); d.append(b, x); box.append(d);
      b.onclick = () => { const { text, title } = texts(); if (!(text.trim() || title.trim())){ tip(t('blind.empty')); return; } const set = setOf(p); dress(set); st.blind = blindFor({ ...p.style.blind }, text, title); sel = null; boxes.push({ hist: [st.blind], i: 0, set }); at = boxes.length - 1; lastTag = ''; shutPops(); apply(); if (plan && plan.blind && p.style.blind.comp && plan.blind.comp !== p.style.blind.comp) tip(t('blind.compNo', { name: t('bc.' + p.style.blind.comp) })); };
      b.ondblclick = () => { const v = prompt(t('preset.renamePrompt'), p.name); if (v === null) return; kept.rename(p.id, v.trim().slice(0, 24) || p.name); fillKept(); thumbs(); };
      x.onclick = () => { if (!confirm(t('preset.deleteConfirm', { name: p.name }))) return; kept.remove(p.id); fillKept(); thumbs(); };
    }
  }

  // ── 单换一样 ────────────────────────────────────────────────────
  mask.querySelectorAll('.bre').forEach(box => { for (const k of box.dataset.ks.split(',')){
    const b = document.createElement('button'); b.className = 're'; b.dataset.k = k; b.textContent = t('blind.re_' + k); b.onclick = () => reroll(b); box.append(b);
  } });
  const reroll = b => {
    if (!st.blind) return;
    const k = b.dataset.k, patch = { seeds: { ...(st.blind.seeds || {}), [k]: blindSeed() } };
    // 重掷某一样，就把人在这一样上定死的放开
    if (k === 'comp') Object.assign(patch, { comp: undefined, move: undefined, keep: undefined });
    if (k === 'hero') Object.assign(patch, { move: undefined, hero: undefined, word: undefined });
    if (k === 'pal') Object.assign(patch, { pal: undefined, own: { ...(st.blind.own || {}), paper: false, ink: false } });
    if (k === 'font'){ patch.own = { ...(st.blind.own || {}), font: false }; if (st.blind.keep) patch.keep = { ...st.blind.keep, face: undefined }; }
    if (k === 'look') Object.assign(patch, { look: undefined, fx: undefined, post: undefined });
    if (k === 'fx') patch.fx = undefined;
    if (k === 'post') patch.post = undefined;
    go(patch);
  };

  // ── 浓淡：效果（字上的）和修图（整张的）各一根 ──────────────────
  let amtWait = 0;
  mask.querySelectorAll('.amts input').forEach(inp => inp.oninput = () => {
    const k = inp.parentElement.dataset.k, v = +inp.value / 100; inp.nextElementSibling.textContent = inp.value + '%';
    if (!st.blind) return;
    const amt = { fx: 1, post: 1, ...(st.blind.amt || {}), [k]: v }; set({ amt }, 'amt' + k); lastAt = Date.now(); setCfg('blindAmt', amt.fx >= 1 && amt.post >= 1 ? null : amt);
    if (!amtWait) amtWait = setTimeout(() => { amtWait = 0; if (alive()) apply(); }, 30);      // 拖着的时候别一像素画一张
  });

  // ── 画面上的东西 ────────────────────────────────────────────────
  const items = () => plan.blind.B.items;
  const setItem = (i, patch, tag) => go({ items: items().map((it, k) => (k === i ? { ...it, ...patch } : it)) }, tag);
  const addItem = it => { sel = { kind: 'item', i: items().length }; go({ items: items().concat(it) }); };
  const chip = (box, v, text, on) => { const b = document.createElement('button'); b.dataset.v = v; b.textContent = text; if (on !== undefined) b.setAttribute('aria-pressed', on); box.append(b); return b; };
  const allShapes = Object.values(B_SHAPES).flat();
  for (const [g, ids] of [['line', B_SHAPES.line], ['shape', B_SHAPES.shape], ['light', B_SHAPES.light], ['cover', B_SHAPES.cover], ['pane', B_SHAPES.pane]]){ const h = document.createElement('div'); h.className = 'sub'; h.textContent = t('blind.g_' + g); const r = document.createElement('div'); r.className = 'chips'; for (const id of ids) chip(r, id, t('bs.' + id)); q('#bAdd').append(h, r); }
  q('#bAdd').onclick = e => { const b = e.target.closest('button'); if (b && plan && plan.blind) addItem(blindNewItem(b.dataset.v, blindSeed(), plan.blind.pal, plan.W, plan.H)); };
  q('#bItems').onclick = e => { const b = e.target.closest('button'); if (!b) return; sel = { kind: 'item', i: +b.dataset.v }; refreshOne(); overlay(); };
  q('#bSwap').onclick = e => {
    const b = e.target.closest('button'); if (!b || !sel) return;
    // 换形状：位置、大小、角度、颜色都留着，只换它是什么
    const it = items()[sel.i], id = b.dataset.v, fresh = blindNewItem(id, it.seed, plan.blind.pal, plan.W, plan.H);
    const big = B_FIELD.includes(id) || id === 'thread' || B_FIELD.includes(it.id) || it.id === 'thread';
    setItem(sel.i, { ...fresh, ...(big ? {} : { x: it.x, y: it.y, r: it.r, rot: it.rot }), c: id === 'thread' || it.id === 'thread' ? fresh.c : it.c, front: fresh.front || it.front, id });
  };
  q('#bOneDel').onclick = () => {
    if (!sel) return;
    if (sel.kind === 'layer'){ const move = { ...(st.blind.move || {}) }; delete move[sel.i]; go({ move }); return; }
    const i = sel.i; sel = null; go({ items: items().filter((_, k) => k !== i) });
  };
  q('#bFront').onclick = () => { if (sel && sel.kind === 'item') setItem(sel.i, { front: !items()[sel.i].front }); };
  q('#bReseed').onclick = () => { if (sel && sel.kind === 'item') setItem(sel.i, { seed: blindSeed() }); };
  q('#bDup').onclick = () => { if (sel && sel.kind === 'item'){ const it = items()[sel.i]; addItem({ ...it, seed: blindSeed(), x: it.x + plan.W * .06, y: it.y + plan.H * .05 }); } };
  q('#bDots').onclick = e => { const b = e.target.closest('button'); if (!b || !sel) return; if (sel.kind === 'item') setItem(sel.i, { c: b.dataset.v }); else moveLayer(sel.i, { c: b.dataset.v }); };
  q('#bFeel').onclick = e => { const b = e.target.closest('button'); if (b && sel) setItem(sel.i, { feel: b.dataset.v, ...(b.dataset.v === 'yarn' ? { t: Math.max(6, items()[sel.i].t || 6) } : {}) }); };
  q('#bMode').onclick = e => { const b = e.target.closest('button'); if (b && sel) setItem(sel.i, { mode: b.dataset.v }); };
  // 滑块的刻度：大小走平方（小的地方调得细）
  const maxR = () => plan.W, toR = v => Math.max(5, Math.pow(v / 100, 2) * maxR()), fromR = r => Math.sqrt(r / maxR()) * 100;
  const maxT = it => it.id === 'thread' ? 26 : 700;
  mask.querySelectorAll('#bOne .fs input').forEach(inp => inp.oninput = () => {
    if (!sel) return;
    const k = inp.parentElement.dataset.k, v = +inp.value;
    if (sel.kind === 'layer'){ if (k === 'r') moveLayer(sel.i, { k: Math.pow(2, (v - 50) / 25) }, 'lk' + sel.i); if (k === 'a') moveLayer(sel.i, { a: v / 100 }, 'la' + sel.i); return; }
    const it = items()[sel.i];
    setItem(sel.i, k === 'r' ? { r: toR(v) } : k === 'rot' ? { rot: v * Math.PI / 180 } : k === 'a' ? { a: v / 100 } : { t: Math.max(1, v / 100 * maxT(it)) }, k + sel.i);
  });
  const moveLayer = (i, patch, tag) => go({ move: { ...(st.blind.move || {}), [i]: { ...((st.blind.move || {})[i] || {}), ...patch } } }, tag);

  // ── 构图 / 配色 / 用我的 / 效果 / 修图 ──────────────────────────
  const groups = B_COMP_GROUPS(); let compG = 'warm', lookG = 'all';
  const tabsOf = (sel, list, get, set) => { const box = q(sel); for (const [v, n] of list) chip(box, v, n); box.onclick = e => { const b = e.target.closest('button'); if (b) set(b.dataset.v); }; };
  const mark = (sel, v) => q(sel).querySelectorAll('button').forEach(b => { const on = b.dataset.v === v; b.setAttribute('aria-pressed', String(on)); if (on) try { const p = b.parentElement; p.scrollLeft = Math.max(0, b.offsetLeft - p.clientWidth / 2 + b.offsetWidth / 2); } catch {} });
  // 一格小图：头一格是「另掷一张」
  const tile = (box, v, text) => { const d = document.createElement('div'), b = document.createElement('button'); d.className = 'ti'; b.dataset.v = v; if (v === 're'){ const s = document.createElement('span'); s.className = 're'; s.innerHTML = ICO.again; b.append(s); } else b.append(document.createElement('canvas')); b.append(document.createTextNode(text)); d.append(b); box.append(d); };
  const buildComp = g => { compG = g; const box = q('#bComp'); box.textContent = ''; tile(box, 're', t('blind.again1')); for (const c of (groups.find(x => x[0] === g) || groups[0])[1]) tile(box, c.id, t('bc.' + c.id)); mark('#bCompG', g); if (label) press('#bComp', v => v === label); thumbs(); };
  const buildLook = g => { lookG = g; const box = q('#bLook'); box.textContent = ''; tile(box, 're', t('blind.again1')); for (const k of (B_LOOK_GROUPS.find(x => x[0] === g)[1] || BLIND_LOOKS.map(k => k.id))) tile(box, k, t('bl.' + k)); mark('#bLookG', g); if (lookNow) press('#bLook', v => v === lookNow); thumbs(); };
  tabsOf('#bCompG', groups.map(([g]) => [g, t('blind.q_' + g)]), () => compG, g => buildComp(g));
  tabsOf('#bLookG', B_LOOK_GROUPS.map(([g]) => [g, t('blind.k_' + g)]), () => lookG, g => buildLook(g));
  q('#bComp').onclick = e => {
    const b = e.target.closest('button'); if (!b || !st.blind) return;
    // 换一种方案：种子不动，换回来还是原来那张。点的就是正用着的那种（或者「另掷一张」），才另掷
    const was = st.blind, now = plan && plan.blind && plan.blind.comp, v = b.dataset.v === 're' ? now : b.dataset.v, again = v === now; if (!v) return;
    set({ comp: v, move: undefined, ...(again ? { keep: undefined, seeds: { ...(was.seeds || {}), comp: blindSeed() } } : {}) });
    apply();
    if (plan && plan.blind && plan.blind.comp !== v) tip(t('blind.compNo', { name: t('bc.' + v) }));
  };
  q('#bLook').onclick = e => {
    const b = e.target.closest('button'); if (!b || !st.blind) return;
    const v = b.dataset.v === 're' ? lookNow : b.dataset.v, s = { ...(st.blind.seeds || {}) }; if (!v) return;
    if (v === lookNow) for (const k of ['look', 'fx', 'post']) s[k] = blindSeed();      // 点第二下：同一种气氛，换一张底
    go({ look: v, fx: undefined, post: undefined, seeds: s });
  };
  const buildPals = src => { const r = q('#bPals'); r.textContent = ''; for (const p of B_PALETTES.filter(p => p.src === src)){ const b = chip(r, p.id, ''); b.title = p.name; for (const k of ['g', 'i', 'a', 'b']){ const i = document.createElement('i'); i.style.background = p[k]; if (k === 'g') i.style.flex = '2'; b.append(i); } } mark('#bPalG', src); if (plan && plan.blind) press('#bPals', v => v === plan.blind.pal.id); };
  tabsOf('#bPalG', ['first', 'cn', 'jp', 'intl'].map(g => [g, t('blind.pal1_' + g)]), null, g => buildPals(g));
  q('#bPals').onclick = e => { const b = e.target.closest('button'); if (b && st.blind) go({ pal: { ...B_PALETTES.find(p => p.id === b.dataset.v) } }); };
  q('#bTune').onclick = () => { if (st.blind) go({ pal: bTune(bRng(blindSeed()).rnd) }); };
  mask.querySelectorAll('#bFour input').forEach(inp => inp.oninput = () => {
    if (!plan || !plan.blind) return;
    const { g, i, a, b, paper, light } = plan.blind.pal, pal = { id: 'mine', g, i, a, b, paper, light, [inp.dataset.k]: inp.value };
    if (inp.dataset.k === 'g'){ pal.paper = undefined; pal.light = undefined; }      // 换了底色，就不再铺那张纸
    go({ pal }, 'pal' + inp.dataset.k);
  });
  mask.querySelectorAll('.bLock').forEach(box => box.onclick = e => {
    const b = e.target.closest('button'); if (!b || !st.blind) return;
    const own = { ...(st.blind.own || {}) }; own[b.dataset.k] = !own[b.dataset.k];
    go({ own, ...(b.dataset.k !== 'font' ? { pal: undefined } : {}) });
  });
  chip(q('#bFx'), '', t('blind.none')); for (const f of B_FX_MAIN) chip(q('#bFx'), f, t('bf.' + f));
  for (const f of B_FX_ORDER) if (!B_FX_MAIN.includes(f)) chip(q('#bFx2'), f, t('bf.' + f));
  chip(q('#bPost'), '', t('blind.none')); for (const p of B_POST_MAIN.concat(B_POST_ORDER.filter(p => !B_POST_MAIN.includes(p)))) chip(q('#bPost'), p, t('bp.' + p));
  const toggles = (sel, key, cur) => q(sel).onclick = e => {
    const b = e.target.closest('button'); if (!b || !plan || !plan.blind) return;
    const v = b.dataset.v, now = cur(); go({ [key]: !v ? [] : now.includes(v) ? now.filter(x => x !== v) : now.concat(v).slice(-4) });
  };
  toggles('#bFx', 'fx', () => plan.blind.name.fx); toggles('#bFx2', 'fx', () => plan.blind.name.fx); toggles('#bPost', 'post', () => plan.blind.B.post);

  // ── 纸上直接动手 ────────────────────────────────────────────────
  const near = (it, px, py) => {
    if (it.id === 'thread'){ const pts = bThreadPath(it, plan.blind.B), d = (it.t || 6) + 14; return pts.some(([x, y], i) => i % 3 === 0 && Math.abs(x - px) < d && Math.abs(y - py) < d); }
    if (B_FIELD.includes(it.id)) return false;
    const c = Math.cos(-(it.rot || 0)), s = Math.sin(-(it.rot || 0)), dx = px - it.x, dy = py - it.y, lx = dx * c - dy * s, ly = dx * s + dy * c;
    const b = blindItemBox({ ...it, rot: 0 }), hx = Math.max(16, b.w / 2), hy = Math.max(16, b.h / 2), k = it.id === 'orb' ? .55 : 1;
    if (it.id === 'ring' || it.id === 'ellipse'){ const d = Math.hypot(lx / hx, ly / hy); return d > .78 && d < 1.16 || (hx < 60 && d < 1); }      // 环只认那一圈，圈里的字还点得着
    return Math.abs(lx) < hx * k && Math.abs(ly) < hy * k;
  };
  const hit = (px, py) => {
    const B = plan.blind.B, its = B.items.map((it, i) => ({ it, i })).reverse();
    const front = its.find(o => (o.it.front || o.it.id === 'thread') && near(o.it, px, py)); if (front) return { kind: 'item', i: front.i };
    const small = its.find(o => !o.it.front && o.it.id !== 'orb' && near(o.it, px, py)); 
    const ls = B.layers.map((l, i) => ({ l, i })).filter(o => ['hero', 'body', 'meta', 'deco'].includes(o.l.role) && !o.l.twin).sort((a, b) => (a.l.role === 'deco') - (b.l.role === 'deco') || b.i - a.i);
    const lay = ls.find(({ l }) => l.ops.some(op => { const r = 'glv'.includes(op.k) && blindTurn(blindOpRect(B, op), l.rot); return r && px > r.x - 4 && px < r.x + r.w + 4 && py > r.y - 4 && py < r.y + r.h + 4; }));
    if (small && (!lay || blindItemBox(small.it).w < 260)) return { kind: 'item', i: small.i };
    if (lay) return { kind: 'layer', i: lay.i };
    const orb = its.find(o => near(o.it, px, py)); return orb ? { kind: 'item', i: orb.i } : null;
  };
  let ov = null, selEl = null;
  const selRect = () => {
    if (!sel || !plan || !plan.blind) return null;
    if (sel.kind === 'layer'){ const l = plan.blind.B.layers[sel.i]; return l && l.rect; }
    const it = items()[sel.i]; if (!it || it.id === 'thread' || B_FIELD.includes(it.id)) return null;
    return blindItemBox(it);
  };
  function overlay(){
    const pg = q('.pg[data-i="0"]'); if (!pg || !plan || !plan.blind){ ov = null; return; }
    if (!ov || ov.parentElement !== pg){ ov = document.createElement('div'); ov.className = 'bov'; ov.tabIndex = -1; pg.append(ov); wire(); }
    ov.textContent = ''; selEl = null;
    const r = selRect(); if (!r) return;
    selEl = document.createElement('div'); selEl.className = 'bsel'; place(r);
    const h = document.createElement('i'); h.dataset.h = 'size'; selEl.append(h);
    if (sel.kind === 'item'){ const x = document.createElement('u'); x.textContent = '×'; x.onclick = e => { e.stopPropagation(); q('#bOneDel').click(); }; selEl.append(x); }
    ov.append(selEl);
  }
  const place = r => { const s = selEl.style; s.left = r.x / plan.W * 100 + '%'; s.top = r.y / plan.H * 100 + '%'; s.width = r.w / plan.W * 100 + '%'; s.height = r.h / plan.H * 100 + '%'; };
  function wire(){
    const pos = e => { const b = ov.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * plan.W, (e.clientY - b.top) / b.height * plan.H]; };
    ov.onpointermove = e => { if (!drag) { const [x, y] = pos(e); ov.style.cursor = e.target.dataset && e.target.dataset.h ? '' : hit(x, y) ? 'move' : 'default'; } };
    let drag = null;
    ov.onpointerdown = e => {
      if (e.target.tagName === 'U') return;
      const [x, y] = pos(e), size = e.target.dataset.h === 'size';
      if (!size){ sel = hit(x, y); refreshOne(); overlay(); if (!sel) return; q('#pbody').scrollTop = 0; }
      e.preventDefault(); ov.setPointerCapture(e.pointerId); ov.focus({ preventScroll: true });
      const layer = sel.kind === 'layer', from = layer ? { dx: 0, dy: 0, k: 1, ...((st.blind.move || {})[sel.i] || {}) } : { ...items()[sel.i] };
      const r = selRect(), c = r ? [r.x + r.w / 2, r.y + r.h / 2] : [plan.W / 2, plan.H / 2];
      const tag = 'drag' + Date.now(); let busy = false, next = null, moved = false, slow = 0; drag = true;
      const step = () => {
        if (!next || busy || !alive()) return; busy = true; const [nx, ny] = next; next = null;
        let patch;
        if (size){
          const k = Math.hypot(nx - c[0], ny - c[1]) / (Math.hypot(x - c[0], y - c[1]) || 1), a = Math.atan2(ny - c[1], nx - c[0]) - Math.atan2(y - c[1], x - c[0]);
          patch = layer ? { k: Math.max(.2, Math.min(4, from.k * k)) } : { r: Math.max(5, from.r * k), rot: (from.rot || 0) + a, ...(from.t && from.id !== 'thread' ? { t: Math.max(4, from.t * k) } : {}) };
        } else patch = layer ? { dx: from.dx + nx - x, dy: from.dy + ny - y } : { x: from.x + nx - x, y: from.y + ny - y };
        if (layer) set({ move: { ...(st.blind.move || {}), [sel.i]: { ...from, ...patch } } }, tag);
        else set({ items: items().map((it, i) => (i === sel.i ? { ...it, ...patch } : it)) }, tag);
        lastAt = Date.now();
        const t0 = performance.now(); plan = repaint(slow > 110) || plan; slow = performance.now() - t0;      // 修图太慢的话，拖的时候先不修
        const rr = selRect(); if (rr && selEl) place(rr);
        requestAnimationFrame(() => { busy = false; step(); });
      };
      ov.onpointermove = ev => { const p = pos(ev); if (!moved && Math.hypot(p[0] - x, p[1] - y) < 4) return; moved = true; next = p; step(); };
      const up = () => { drag = null; ov.onpointerup = ov.onpointercancel = null; ov.onpointermove = null; const o = ov; ov = null; o.remove(); if (moved) apply(); else overlay(); };
      ov.onpointerup = ov.onpointercancel = up;
    };
    ov.onkeydown = e => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel && sel.kind === 'item'){ e.preventDefault(); e.stopPropagation(); q('#bOneDel').click(); }
    };
  }

  // ── 面板跟着走 ──────────────────────────────────────────────────
  function refreshOne(){
    const one = q('#bOne'), B = plan && plan.blind && plan.blind.B;
    if (sel && B && (sel.kind === 'item' ? !B.items[sel.i] : !B.layers[sel.i])) sel = null;
    one.hidden = !sel; if (!sel || !B) { markItems(); return; }
    const layer = sel.kind === 'layer', it = layer ? null : B.items[sel.i], row = k => one.querySelector(`.fs[data-k="${k}"]`);
    q('#bOneName').textContent = layer ? t('blind.l_' + B.layers[sel.i].role) : t('bs.' + it.id);
    q('#bOneDel').textContent = layer ? t('blind.home') : t('blind.del');
    q('#bSwapBox').hidden = layer || it.id === 'thread'; q('#bLineBox').hidden = layer || it.id !== 'thread';
    q('#bFront').parentElement.hidden = layer;
    row('rot').hidden = layer;
    row('t').hidden = layer || !['thread', 'torn', 'brush', 'band', 'frost', 'reed', 'mosaic'].includes(it.id);
    const mv = layer ? ((st.blind.move || {})[sel.i] || {}) : null, dots = cur => { const d = q('#bDots'); d.textContent = ''; for (const k of ['i', 'a', 'b', 'g', 'w', '#b41f2b']){ const b = chip(d, k, '', cur === k); b.style.background = bCol(plan.blind.pal, k); } const ck = document.createElement('input'); ck.type = 'color'; ck.value = bToHex(bCol(plan.blind.pal, cur || 'i')); ck.oninput = () => (layer ? moveLayer(sel.i, { c: ck.value }, 'lc' + sel.i) : setItem(sel.i, { c: ck.value }, 'col' + sel.i)); d.append(ck); };
    if (layer){ row('r').querySelector('input').value = 50 + Math.log2(mv.k || 1) * 25; row('a').querySelector('input').value = (mv.a === undefined ? 1 : mv.a) * 100; dots(mv.c); markItems(); return; }
    if (it.id === 'thread'){ const f = q('#bFeel'), m = q('#bMode'); f.textContent = m.textContent = ''; for (const k of ['line', 'yarn']) chip(f, k, t('blind.f_' + k), (it.feel || 'line') === k); for (const k of B_LINE_MODES) chip(m, k, t('blind.m_' + k), it.mode === k); }
    row('r').querySelector('input').value = fromR(it.r); row('rot').querySelector('input').value = Math.round(((it.rot || 0) * 180 / Math.PI + 540) % 360 - 180);
    row('a').querySelector('input').value = (it.a === undefined ? 1 : it.a) * 100; row('t').querySelector('input').value = (it.t || 6) / maxT(it) * 100;
    q('#bFront').textContent = it.front ? t('blind.toBack') : t('blind.toFront');
    const sw = q('#bSwap'); sw.textContent = ''; const fam = Object.values(B_SHAPES).find(g => g.includes(it.id)) || [];
    for (const id of fam.concat(B_SHAPES.shape.filter(x => !fam.includes(x)))) chip(sw, id, t('bs.' + id), id === it.id);
    dots(it.c);
    markItems();
  }
  const markItems = () => {
    const bx = q('#bItems'); bx.textContent = '';
    if (!(plan && plan.blind)) return;
    items().forEach((it, i) => chip(bx, i, t('bs.' + it.id), !!(sel && sel.kind === 'item' && sel.i === i)));
    if (!items().length){ const s = document.createElement('span'); s.className = 'pkhint'; s.textContent = t('blind.noItems'); bx.append(s); }
  };
  const press = (s, on) => q(s).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', on(b.dataset.v === undefined ? b.dataset.k : b.dataset.v)));
  // 正拖着这一屏里的滑块/取色器时别整屏重排，手底下的东西会被换掉
  function refresh(p){
    if (!alive()) return;
    plan = p;
    const on = !!(st.blind && plan && plan.blind);
    mask.classList.toggle('blind', on); fillKept();
    // 🔒 拆出来就钉住方案和主角：之后改样式、改颜色，这张脸不会换
    if (on && plan.blind.pin && (!st.blind.comp || !st.blind.look || (!st.blind.hero && plan.blind.pin.hero))){ const was = st.blind; st.blind = { ...was, comp: was.comp || plan.blind.pin.comp, look: was.look || plan.blind.pin.look, hero: was.hero || plan.blind.pin.hero, word: was.word || plan.blind.pin.word }; if (box()){ const k = box().hist.indexOf(was); if (k >= 0) box().hist[k] = st.blind; } }
    q('#bGo').textContent = on ? t('blind.again') : t('blind.open');
    if (!on){ label = ''; sel = null; ov = null; q('#bName').textContent = ''; for (const id of ['#bPrev', '#bNext', '#bUndo', '#bRedo', '#bKeep']) q(id).disabled = true; thumbs(); return; }
    if (!box() || !box().hist.includes(st.blind)){ boxes.push({ hist: [st.blind], i: 0 }); at = boxes.length - 1; }       // 从收藏里点回来的
    const b = box();
    q('#bPrev').disabled = at <= 0; q('#bNext').disabled = at >= boxes.length - 1;
    q('#bUndo').disabled = b.i <= 0; q('#bRedo').disabled = b.i >= b.hist.length - 1; q('#bKeep').disabled = false;
    const n = plan.blind.name, moved = label !== n.comp, aired = lookNow !== n.look; label = n.comp; lookNow = n.look;
    if (moved || !q('#bComp').children.length){ const g = groups.find(x => x[0] === compG && x[1].some(c => c.id === n.comp)) || groups.find(x => x[1].some(c => c.id === n.comp)); if (g && (g[0] !== compG || !q('#bComp').children.length)) buildComp(g[0]); }      // 掷到别的堆里去了，跟过去
    if (aired || !q('#bLook').children.length){ const g = B_LOOK_GROUPS.find(x => x[0] === lookG); if (!q('#bLook').children.length || (g[1] && !g[1].includes(n.look))) buildLook('all'); }
    if (!q('#bPals').children.length) buildPals(['first', 'cn', 'jp', 'intl'].includes(plan.blind.pal.src) ? plan.blind.pal.src : 'first');
    short = t('bc.' + n.comp) + ' · ' + t('bl.' + n.look);
    name = [short].concat(n.fx.map(f => t('bf.' + f)), n.post.map(f => t('bp.' + f)), n.scene.map(s => t('bs.' + s))).join(' · ');
    q('#bName').textContent = name;
    const own = st.blind.own || {}, B = plan.blind.B, pal = plan.blind.pal;
    mask.querySelectorAll('.amts').forEach(d => { const v = Math.round(100 * ((st.blind.amt || {})[d.dataset.k] === undefined ? 1 : st.blind.amt[d.dataset.k])), i = d.querySelector('input'); if (+i.value !== v) i.value = v; d.lastElementChild.textContent = v + '%'; });
    press('#bComp', v => v === n.comp); press('#bLook', v => v === n.look); press('#bFx', v => v ? n.fx.includes(v) : !n.fx.length); press('#bFx2', v => n.fx.includes(v)); press('#bPost', v => v ? B.post.includes(v) : !B.post.length);
    press('#bPals', v => v === pal.id); mask.querySelectorAll('.bLock button').forEach(b => b.setAttribute('aria-pressed', String(!!own[b.dataset.k])));
    const act = mask.getRootNode().activeElement;
    mask.querySelectorAll('#bFour input').forEach(i => { if (i !== act) i.value = bToHex(pal[i.dataset.k]); });
    if (!(act && act.type === 'color' && act.closest('#bDots'))) refreshOne();
    overlay(); thumbs();
  }

  // ── 小图 ────────────────────────────────────────────────────────
  let drag0 = 0, thT = 0;
  const th = mountThumbs({ alive, busy: () => typing() || Date.now() - drag0 < 260, view: () => (keptOpen() ? q('#keptPop') : q('#pbody')) });
  mask.addEventListener('pointerdown', () => { drag0 = Date.now(); }, true); mask.addEventListener('pointermove', e => { if (e.buttons) drag0 = Date.now(); }, { passive: true });
  // 先让海报画完、人的手停下来，再说小图
  function thumbs(){ clearTimeout(thT); thT = setTimeout(thumbsNow, 220); }
  function thumbsNow(){
    if (!alive()) return;
    const { text, title } = texts(), jobs = [], has = !!(text.trim() || title.trim()), now = { ...st, text, title, pages: '1', noGround: false }, gen = o => JSON.stringify([text, title, now.headText, now.source, now.date, now.sourcePrefix, now.showHeader, now.showSource, now.showDate, now.orient, now.spans, now.titleSpans, now.font, now.latinFont, now.titleFont, now.paper, now.paperLight, now.ink, now.inkLight, loadedCustom.size, o]);
    if (keptOpen() && has) for (const p of kept.list()){ const c = q(`#bKept .ti[data-id="${p.id}"] canvas`); if (!c) continue; const set = setOf(p), bl = p.style.blind; jobs.push({ cv: c, key: 'k' + p.id + gen([bl, set]), st: () => ({ ...now, ...set, blind: blindFor({ ...bl }, text, title) }) }); }
    if (st.blind && plan && plan.blind && has){
      const v = tab();
      if (v === 'comp'){ const bl = { ...st.blind, comp: undefined, move: undefined, keep: undefined, items: undefined }, g = gen(bl); q('#bComp').querySelectorAll('button[data-v]').forEach(b => { const id = b.dataset.v, c = b.querySelector('canvas'); if (!c) return; jobs.push({ cv: c, key: 'c' + id + g, want: id, st: () => ({ ...now, blind: { ...bl, comp: id } }), tell: ok => { if (ok) delete b.parentElement.dataset.no; else b.parentElement.dataset.no = '1'; b.title = ok ? '' : t('blind.compNo', { name: t('bc.' + id) }); } }); }); }
      if (v === 'look'){ const bl = { ...st.blind, look: undefined, fx: undefined, post: undefined }, g = gen(bl); q('#bLook').querySelectorAll('button[data-v]').forEach(b => { const id = b.dataset.v, c = b.querySelector('canvas'); if (!c) return; jobs.push({ cv: c, key: 'l' + id + g, st: () => ({ ...now, blind: { ...bl, look: id } }) }); }); }
    }
    th.set(jobs);
  }
  const editing = on => mask.classList.toggle('bedit', on);
  const drop = () => { if (!sel) return false; sel = null; refreshOne(); overlay(); return true; };
  refreshOne();
  return { refresh, editing, drop, take, on, off, thumbs, kick: () => th.kick(), dispose: () => { clearTimeout(thT); th.dispose(); }, frozen: () => (plan && plan.blind && st.blind ? frozen() : st.blind), state: () => ({ boxes, at }), own: k => { if (st.blind) set({ own: { ...(st.blind.own || {}), [k]: true }, ...(k === 'font' ? {} : { pal: undefined }) }); } };
}

