// ════════════════════════════════════════════════════════════════════
//  6c. 版式盲盒的界面：按钮条（常驻在预览上方）＋「盒」那一屏（接着改）＋ 纸上直接拖
// ════════════════════════════════════════════════════════════════════
const BLIND_CSS = `
.bbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex:0 0 auto}
.bbar [hidden],.tabs [hidden],.bx [hidden]{display:none!important}
.bbar button{border:1px solid var(--line);background:var(--btn);color:var(--fg);border-radius:999px;
     font-size:12px;padding:6px 13px;cursor:pointer;letter-spacing:.06em}
.bbar button.go{background:var(--on-bg);color:var(--on-fg);border-color:var(--on-bg);padding:7px 18px;letter-spacing:.14em}
.bbar button.ic{padding:6px 11px}
.bbar button:disabled,.bx button:disabled{opacity:.35;cursor:default}
.bbar .kept{flex:1 1 100%;display:flex;flex-wrap:wrap;gap:5px;max-height:92px;overflow:auto}
.bbar .kept span{display:inline-flex;align-items:stretch;border:1px solid var(--line);border-radius:999px;overflow:hidden;background:var(--btn)}
.bbar .kept button{border:0;border-radius:0;padding:4px 4px 4px 11px;font-size:11px}
.bbar .kept button+button{padding:4px 9px 4px 5px;color:var(--dim)}
.bbar .nm{;color:var(--fg);letter-spacing:.06em;margin:0 4px;min-width:0}
.bx .acc{border-top:1px solid var(--line);margin-top:0}
.bx .acc:first-of-type{margin-top:12px}
.bx .acc:last-of-type{border-bottom:1px solid var(--line)}
.bx summary{cursor:pointer;list-style:none;padding:10px 2px;font-size:12px;color:var(--fg);letter-spacing:.06em;display:flex;gap:8px;align-items:baseline}
.bx summary::-webkit-details-marker{display:none}
.bx summary::after{content:'+';margin-left:auto;color:var(--dim)}
.bx .acc[open] summary::after{content:'–'}
.bx summary em{font-style:normal;font-size:11px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.bx .accin{padding:0 0 12px}
.bx .chips{display:flex;flex-wrap:wrap;gap:4px}
.bx .chips button{border:1px solid var(--line);background:var(--btn);color:var(--fg);border-radius:999px;font-size:11px;padding:3px 9px;cursor:pointer}
.bx .chips button[aria-pressed=true]{background:var(--on-bg);color:var(--on-fg);border-color:var(--on-bg)}
.bx .chips button.re::before{content:"↻ ";color:var(--dim)}
.bx .pals{display:grid;grid-template-columns:repeat(8,1fr);gap:4px}
.bx .pals button{height:24px;padding:0;border:1px solid var(--line);border-radius:4px;cursor:pointer;overflow:hidden;display:flex}
.bx .pals button[aria-pressed=true]{outline:2px solid var(--on-bg);outline-offset:1px}
.bx .pals i{flex:1;height:100%}
.bx .four{display:flex;gap:10px;margin-top:7px;font-size:11px;color:var(--dim)}
.bx .four span{display:flex;gap:4px;align-items:center}
.bx input[type=color]{width:26px;height:22px;padding:0;border:1px solid var(--line);border-radius:3px;background:var(--btn);cursor:pointer}
.bx .one{border:1px solid var(--on-bg);border-radius:5px;padding:9px;background:var(--field);margin-top:7px}
.bx .one .fs{margin-top:5px;font-size:11px;color:var(--dim)}
.bx .one .fs span{flex:0 0 34px}
.bx .dots{display:flex;gap:6px;align-items:center;margin-top:7px}
.bx .dots button{width:20px;height:20px;border-radius:50%;border:1px solid rgba(128,128,128,.4);padding:0;cursor:pointer}
.bx .dots button[aria-pressed=true]{outline:2px solid var(--on-bg);outline-offset:1px}
.bx .two{display:flex;gap:5px}
.bx .two button{flex:1;border:1px solid var(--line);background:var(--btn);color:var(--fg);border-radius:4px;font-size:12px;padding:6px 4px;cursor:pointer}
.bov{position:absolute;inset:0;outline:none}
.bsel{position:absolute;border:1.5px dashed #fff;box-shadow:0 0 0 1.5px rgba(185,32,11,.8);pointer-events:none;border-radius:3px}
.bsel i,.bsel u{position:absolute;pointer-events:auto;width:18px;height:18px;border-radius:50%;background:#fff;border:1px solid rgba(185,32,11,.85);
     box-shadow:0 1px 4px rgba(0,0,0,.25);touch-action:none;font:12px/16px sans-serif;text-align:center;text-decoration:none;color:#b9200b}
.bsel i{right:-9px;bottom:-9px;cursor:nwse-resize}
.bsel u{right:-9px;top:-9px;cursor:pointer}
@media (pointer: coarse){ .bov{pointer-events:none} .mask.bedit .bov{pointer-events:auto;touch-action:none} .bsel i,.bsel u{width:26px;height:26px;line-height:24px} }
@media (max-width: 760px){
  .bbar button{padding:9px 13px}
  .bbar button.go{padding:10px 18px}
  .bbar .nm{flex:1 1 100%;order:5}
  .mask.blind .view{max-height:62%}
  .bx .chips button{padding:8px 12px;font-size:12px}
  .bx .pals button{height:32px}
}
`;
const blindHtml = () => `
  <div class="bbar" id="bbar">
    <button class="go" id="bGo" title="${t('blind.openTitle')}">${t('blind.open')}</button>
    <button class="ic" id="bPrev" title="${t('blind.prev')}" aria-label="${t('blind.prev')}" hidden>‹</button>
    <button class="ic" id="bNext" title="${t('blind.next')}" aria-label="${t('blind.next')}" hidden>›</button>
    <button id="bEdit" hidden>${t('blind.edit')}</button>
    <button id="bKeep" title="${t('blind.keepTitle')}" hidden>${t('blind.keep')}</button>
    <button id="bOff" hidden>${t('blind.off')}</button>
    <button id="bMine" aria-expanded="false" hidden></button>
    <span class="nm" id="bName" hidden></span>
    <div class="kept" id="bKept" hidden></div>
  </div>`;
// 方案分三堆：低声的、意象、响亮的
const B_COMP_GROUPS = () => [['quiet', BLIND_COMPS.filter(c => c.q && c.id !== 'image' && c.id !== 'youme')], ['warm', BLIND_MORE], ['long', BLIND_LONG], ['image', BLIND_COMPS.filter(c => c.id === 'image' || c.id === 'youme')], ['loud', BLIND_COMPS.filter(c => !c.q && !c.long && !BLIND_MORE.includes(c))]];
const bAcc = (k, inner) => `<details class="acc" data-k="${k}"><summary>${t('blind.s_' + k)}<em id="bNow_${k}"></em></summary><div class="accin">${inner}</div></details>`;
const blindPaneHtml = () => `
  <div class="pane bx" data-p="box">
    <div class="two"><button id="bUndo">${t('blind.undo')}</button><button id="bRedo">${t('blind.redo')}</button></div>
    <div class="sub">${t('blind.reroll')}</div><div class="chips" id="bRe"></div>
    <div class="one" id="bOne" hidden>
      <div class="pkh"><b id="bOneName"></b><button id="bOneDel">${t('blind.del')}</button></div>
      <div id="bSwapBox"><div class="chips" id="bSwap"></div></div>
      <div id="bLineBox"><div class="chips" id="bFeel"></div><div class="chips" id="bMode" style="margin-top:4px"></div></div>
      <div class="dots" id="bDots"></div>
      <div class="fs" data-k="r"><span>${t('blind.size')}</span><input type="range" min="2" max="100" step="1"></div>
      <div class="fs" data-k="a"><span>${t('blind.alpha')}</span><input type="range" min="5" max="100" step="1"></div>
      <div class="fs" data-k="rot"><span>${t('blind.turn')}</span><input type="range" min="-180" max="180" step="1"></div>
      <div class="fs" data-k="t"><span>${t('blind.thick')}</span><input type="range" min="1" max="100" step="1"></div>
      <div class="two" style="margin-top:8px"><button id="bFront"></button><button id="bReseed">${t('blind.reseed')}</button><button id="bDup">${t('blind.dup')}</button></div>
    </div>
    <p class="pkhint" id="bTip">${t('blind.editHint')}</p>
    ${bAcc('comp', '<div id="bComp"></div>')}
    ${bAcc('look', '<div class="chips" id="bLook"></div>')}
    ${bAcc('pal', `<div class="two"><button id="bTune">${t('blind.tune')}</button></div>
      <div class="four" id="bFour">${['g', 'i', 'a', 'b'].map(k => `<span><input type="color" data-k="${k}">${t('blind.c' + k)}</span>`).join('')}</div>
      <div id="bPals"></div>
      <div class="sub">${t('blind.lock')}</div><div class="chips" id="bLock"><button data-k="paper">${t('blind.paper')}</button><button data-k="font">${t('blind.font')}</button><button data-k="ink">${t('blind.ink')}</button></div>`)}
    ${bAcc('fx', `<div class="chips" id="bFx"></div><div class="sub">${t('blind.more')}</div><div class="chips" id="bFx2"></div>`)}
    ${bAcc('post', '<div class="chips" id="bPost"></div>')}
    ${bAcc('add', `<div class="chips" id="bItems"></div><div id="bAdd"></div>`)}
  </div>`;

function mountBlind({ mask, st, draw, repaint, sync, alive, tip, keep, kept, openTab }){
  const q = s => mask.querySelector(s);
  // 一个盒子 ＝ 它自己的一串改动；盒子之间前后翻，盒子里头一步一步撤
  const boxes = []; let at = -1, plan = null, sel = null, name = '', short = '', label = '', lookNow = '';
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
    const base = {};
    let seed = blindSeed();
    for (let i = 0; i < 6 && label; i++){
      const p = planPages({ ...st, ...texts(), blind: { ...base, seed } });
      if (!p.blind || (p.blind.comp !== label && p.blind.look.id !== lookNow)) break;
      seed = blindSeed();
    }
    st.blind = { ...base, seed }; sel = null;
    boxes.push({ hist: [st.blind], i: 0 }); at = boxes.length - 1; lastTag = '';
    apply();
  };
  const jump = n => { at = n; st.blind = box().hist[box().i]; sel = null; apply(); };
  q('#bPrev').onclick = () => { if (at > 0) jump(at - 1); };
  q('#bNext').onclick = () => { if (at < boxes.length - 1) jump(at + 1); };
  q('#bUndo').onclick = () => { const b = box(); if (b && b.i > 0){ b.i--; st.blind = b.hist[b.i]; lastTag = ''; apply(); } };
  q('#bRedo').onclick = () => { const b = box(); if (b && b.i < b.hist.length - 1){ b.i++; st.blind = b.hist[b.i]; lastTag = ''; apply(); } };
  q('#bOff').onclick = () => { st.blind = null; sel = null; apply(); };
  q('#bEdit').onclick = () => openTab('box');
  // 常用版式：收下的时候把颜色也定死，以后换一段字、换一个版本，都还是它
  let open = false;
  q('#bKeep').onclick = () => { if (!plan || !plan.blind) return; const n = short.slice(0, 24); keep(n, { ...st.blind, pal: { ...plan.blind.pal } }); open = true; fillKept(); tip(t('blind.kept', { name: n })); };
  function fillKept(){
    const list = kept.list(), box = q('#bKept'); box.textContent = ''; q('#bMine').hidden = !list.length; box.hidden = !list.length || !open;
    q('#bMine').textContent = t('blind.mine', { n: list.length }); q('#bMine').setAttribute('aria-expanded', open && !!list.length);
    for (const p of list){
      const s = document.createElement('span'), b = document.createElement('button'), x = document.createElement('button');
      b.textContent = p.name; b.title = t('blind.mineUse'); x.textContent = '×'; x.title = t('blind.del'); x.setAttribute('aria-label', t('blind.del')); s.append(b, x); box.append(s);
      b.onclick = () => { const { text, title } = texts(); if (!(text.trim() || title.trim())){ tip(t('blind.empty')); return; } st.blind = blindFor({ ...p.style.blind }, text, title); sel = null; boxes.push({ hist: [st.blind], i: 0 }); at = boxes.length - 1; lastTag = ''; apply(); if (plan && plan.blind && p.style.blind.comp && plan.blind.comp !== p.style.blind.comp) tip(t('blind.compNo', { name: t('bc.' + p.style.blind.comp) })); };
      b.ondblclick = () => { const v = prompt(t('preset.renamePrompt'), p.name); if (v === null) return; kept.rename(p.id, v.trim().slice(0, 24) || p.name); fillKept(); };
      x.onclick = () => { if (!confirm(t('preset.deleteConfirm', { name: p.name }))) return; kept.remove(p.id); fillKept(); };
    }
  }
  q('#bMine').onclick = () => { open = !open; fillKept(); };

  // ── 单换一样 ────────────────────────────────────────────────────
  for (const k of ['comp', 'look', 'pal', 'font', 'hero', 'fx', 'post']){
    const b = document.createElement('button'); b.className = 're'; b.dataset.k = k; b.textContent = t('blind.re_' + k); q('#bRe').append(b);
  }
  q('#bRe').onclick = e => {
    const b = e.target.closest('button'); if (!b || !st.blind) return;
    const k = b.dataset.k, patch = { seeds: { ...(st.blind.seeds || {}), [k]: blindSeed() } };
    // 重掷某一样，就把人在这一样上定死的放开
    if (k === 'comp') Object.assign(patch, { comp: undefined, move: undefined });
    if (k === 'hero') Object.assign(patch, { move: undefined, hero: undefined, word: undefined });
    if (k === 'pal') Object.assign(patch, { pal: undefined, own: { ...(st.blind.own || {}), paper: false, ink: false } });
    if (k === 'font') patch.own = { ...(st.blind.own || {}), font: false };
    if (k === 'look') Object.assign(patch, { look: undefined, fx: undefined, post: undefined });
    if (k === 'fx') patch.fx = undefined;
    if (k === 'post') patch.post = undefined;
    go(patch);
  };

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
  for (const [g, cs] of B_COMP_GROUPS()){ const h = document.createElement('div'); h.className = 'sub'; h.textContent = t('blind.q_' + g); const r = document.createElement('div'); r.className = 'chips'; for (const c of cs) chip(r, c.id, t('bc.' + c.id)); q('#bComp').append(h, r); }
  // 一次只摊开一栏
  mask.querySelectorAll('.acc').forEach(d => d.addEventListener('toggle', () => { if (d.open) mask.querySelectorAll('.acc').forEach(o => { if (o !== d) o.open = false; }); }));
  q('#bComp').onclick = e => {
    const b = e.target.closest('button'); if (!b || !st.blind) return;
    const was = st.blind; set({ comp: b.dataset.v, move: undefined, seeds: { ...(was.seeds || {}), comp: blindSeed() } });
    apply();
    if (plan && plan.blind && plan.blind.comp !== b.dataset.v) tip(t('blind.compNo', { name: t('bc.' + b.dataset.v) }));
  };
  for (const k of BLIND_LOOKS) chip(q('#bLook'), k.id, t('bl.' + k.id));
  q('#bLook').onclick = e => { const b = e.target.closest('button'); if (b && st.blind){ const s = { ...(st.blind.seeds || {}) }; for (const k of ['look', 'fx', 'post']) s[k] = blindSeed(); go({ look: b.dataset.v, fx: undefined, post: undefined, seeds: s }); } };      // 点第二下：同一种气氛，换一张底
  for (const src of ['first', 'cn', 'jp', 'intl']){
    const h = document.createElement('div'); h.className = 'sub'; h.textContent = t('blind.pal_' + src); const r = document.createElement('div'); r.className = 'pals'; q('#bPals').append(h, r);
    for (const p of B_PALETTES.filter(p => p.src === src)){ const b = chip(r, p.id, ''); b.title = p.name; for (const k of ['g', 'i', 'a', 'b']){ const i = document.createElement('i'); i.style.background = p[k]; if (k === 'g') i.style.flex = '2'; b.append(i); } }
  }
  q('#bPals').onclick = e => { const b = e.target.closest('button'); if (b && st.blind) go({ pal: { ...B_PALETTES.find(p => p.id === b.dataset.v) } }); };
  q('#bTune').onclick = () => { if (st.blind) go({ pal: bTune(bRng(blindSeed()).rnd) }); };
  mask.querySelectorAll('#bFour input').forEach(inp => inp.oninput = () => {
    if (!plan || !plan.blind) return;
    const { g, i, a, b, paper, light } = plan.blind.pal, pal = { id: 'mine', g, i, a, b, paper, light, [inp.dataset.k]: inp.value };
    if (inp.dataset.k === 'g'){ pal.paper = undefined; pal.light = undefined; }      // 换了底色，就不再铺那张纸
    go({ pal }, 'pal' + inp.dataset.k);
  });
  q('#bLock').onclick = e => {
    const b = e.target.closest('button'); if (!b || !st.blind) return;
    const own = { ...(st.blind.own || {}) }; own[b.dataset.k] = !own[b.dataset.k];
    go({ own, ...(b.dataset.k !== 'font' ? { pal: undefined } : {}) });
  };
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
      if (!size){ sel = hit(x, y); refreshOne(); overlay(); if (!sel) return; openTab('box'); }
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
    for (const id of ['#bPrev', '#bNext', '#bEdit', '#bKeep', '#bOff', '#bName']) q(id).hidden = !on;
    const tab = q('#tabs button[data-v="box"]'); tab.hidden = !on;
    if (!on){ label = ''; sel = null; ov = null; if (tab.getAttribute('aria-pressed') === 'true') openTab('text'); return; }
    if (!box() || !box().hist.includes(st.blind)){ boxes.push({ hist: [st.blind], i: 0 }); at = boxes.length - 1; }       // 从收藏里点回来的
    const b = box();
    q('#bPrev').disabled = at <= 0; q('#bNext').disabled = at >= boxes.length - 1;
    q('#bUndo').disabled = b.i <= 0; q('#bRedo').disabled = b.i >= b.hist.length - 1;
    const n = plan.blind.name; label = n.comp; lookNow = n.look;
    q('#bNow_comp').textContent = t('bc.' + n.comp); q('#bNow_look').textContent = t('bl.' + n.look); q('#bNow_fx').textContent = n.fx.map(f => t('bf.' + f)).join(' '); q('#bNow_post').textContent = n.post.map(f => t('bp.' + f)).join(' '); q('#bNow_add').textContent = n.scene.map(f => t('bs.' + f)).join(' ');
    short = t('bc.' + n.comp) + ' · ' + t('bl.' + n.look);
    name = [short].concat(n.fx.map(f => t('bf.' + f)), n.post.map(f => t('bp.' + f)), n.scene.map(s => t('bs.' + s))).join(' · ');
    q('#bName').textContent = name;
    const own = st.blind.own || {}, B = plan.blind.B, pal = plan.blind.pal;
    q('#bNow_pal').textContent = pal.src === 'tune' ? t('blind.tuned') : (pal.name || '');
    press('#bComp', v => v === n.comp); press('#bLook', v => v === n.look); press('#bFx', v => v ? n.fx.includes(v) : !n.fx.length); press('#bFx2', v => n.fx.includes(v)); press('#bPost', v => v ? B.post.includes(v) : !B.post.length);
    press('#bPals', v => v === pal.id); press('#bLock', v => !!own[v]);
    const act = mask.getRootNode().activeElement;
    mask.querySelectorAll('#bFour input').forEach(i => { if (i !== act) i.value = bToHex(pal[i.dataset.k]); });
    if (!(act && act.type === 'color' && act.closest('#bDots'))) refreshOne();
    overlay();
  }
  const editing = on => mask.classList.toggle('bedit', on);
  const drop = () => { if (!sel) return false; sel = null; refreshOne(); overlay(); return true; };
  refreshOne();
  return { refresh, editing, drop, own: k => { if (st.blind) set({ own: { ...(st.blind.own || {}), [k]: true }, ...(k === 'font' ? {} : { pal: undefined }) }); } };
}

