// ════════════════════════════════════════════════════════════════════
//  6b. 选中即改：在内容框 / 标题框里选中几个字，只改这几个字
// ════════════════════════════════════════════════════════════════════
// 内容框仍是朴素的 textarea，没有换成 contenteditable：
// 输入法、粘贴、撤销、iOS 上 shadow DOM 里取选区，contenteditable 样样是坑。
// 样式由右边那张纸实时给你看；框里只在改过的字底下垫一道色线、给选中的字铺一层底。
const PICK_CSS = `
.ta{position:relative;background:var(--field);border-radius:4px}
.ta textarea{position:relative;display:block;background:transparent}
.ta textarea,.ta .bk{font-size:13px;line-height:1.7;letter-spacing:0;text-spacing-trim:space-all;
     text-autospace:no-autospace;white-space:pre-wrap;overflow-wrap:break-word}
.ta .bk{position:absolute;left:0;top:0;bottom:0;overflow:hidden;border:1px solid transparent;pointer-events:none}
.ta .bk div{padding:8px;color:transparent}
.ta .bk .x{background:rgba(214,158,72,.34)}
.pick[hidden],.pick [hidden],.pkhint[hidden],.pkhint [hidden]{display:none}
.pick{margin-top:6px}
.pkbox{border:1px solid var(--on-bg);border-radius:5px;padding:9px;background:var(--field)}
.pkh{display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:11px;color:var(--dim)}
.pkh b{flex:1;min-width:0;font-weight:400;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pkh button,.pkf{border:1px solid var(--line);background:var(--btn);color:var(--fg);border-radius:3px;
     font-size:11px;padding:3px 8px;cursor:pointer;flex:0 0 auto}
.pkh button:disabled{opacity:.4;cursor:default}
.pkinks{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:9px}
.pkinks button{width:20px;height:20px;border-radius:50%;border:1px solid rgba(128,128,128,.4);padding:0;cursor:pointer}
.pkinks button.same{width:auto;height:22px;border-radius:3px;border-color:var(--line);background:var(--btn);
     color:var(--fg);font-size:11px;padding:0 7px}
.pkinks button[aria-pressed=true]{outline:2px solid var(--on-bg);outline-offset:1px}
.pkinks input{width:26px;height:22px;padding:0;border:1px solid var(--line);border-radius:3px;background:var(--btn);cursor:pointer}
.pkf{display:flex;width:100%;margin-top:9px;padding:6px 9px;font-size:14px;text-align:left;align-items:baseline}
.pkf span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pkf i{font-style:normal;font-size:10px;color:var(--dim)}
.pick .flist{margin-top:4px;max-height:216px;overflow:auto;overscroll-behavior:contain}
.pkhint{font-size:11px;color:var(--dim);margin:5px 0 0;line-height:1.5}
.pkhint button{border:0;background:transparent;color:var(--fg);font-size:11px;text-decoration:underline;cursor:pointer;padding:0 0 0 4px}
@media (max-width: 760px){
  .pkinks button{width:28px;height:28px}
  .pkinks button.same{height:30px;padding:0 10px}
  .pkinks input{width:36px;height:30px}
  .pkh button{padding:8px 11px}
  .pkf{padding:11px 9px}
}
`;

// 面板 HTML 里的那一块（摆在内容框下面；选中的是标题时会挪到标题框下面）
const pickHtml = () => `
  <div class="pick" id="pick" hidden>
    <div class="pkbox">
      <div class="pkh"><b id="pkWhat"></b><button id="pkClear">${t('pick.clear')}</button></div>
      <div class="fs">
        <input type="range" id="pkS" min="20" max="140" step="1">
        <input type="number" id="pkSn" min="12" max="300" step="1">
        <span class="sw" id="pkW">
          <button data-v="0">${t('weight.regular')}</button><button data-v="1">${t('weight.medium')}</button><button data-v="2">${t('weight.bold')}</button></span>
      </div>
      <div class="fs" style="margin-top:7px"><span class="val" style="width:auto;text-align:left">${t('pick.alpha')}</span><input type="range" id="pkA" min="5" max="100" step="1"><span class="val" id="pkAv"></span></div>
      <div class="pkinks" id="pkInk"></div>
      <button class="pkf" id="pkF"><span></span><i></i></button>
      <div class="flist" id="pkFl" hidden></div>
    </div>
    <div class="sub" id="pkRest"></div>
  </div>`;

// deps: { mask, st, draw, alive, fillFonts }
//   fillFonts(box, firstLabel, withSys) —— 列出能用的字，跟「标题字体」那一列是同一份
// 返回 { edited(which), refresh(), drop(), dispose() }
function mountPick({ mask, st, draw, alive, fillFonts }){
  const q = s => mask.querySelector(s);
  const bar = q('#pick'), fl = q('#pkFl'), ta = q('#t'), bk = q('.ta .bk'), bkIn = q('.ta .bk div');
  const FIELDS = {
    body : { el: ta,       spans: 'spans',      size: () => st.fontSize,  weight: () => st.weight,
             after: () => q('.ta'), rest: 'pick.restBody' },
    title: { el: q('#ti'), spans: 'titleSpans', size: () => titleFontSize(st), weight: () => st.titleWeight,
             after: () => q('#ti'), rest: 'pick.restTitle' },
  };
  for (const f of Object.values(FIELDS)) f.last = f.el.value;

  let cur = null;                   // { f, a, b } —— 正在改哪个框的哪一截
  const activeEl = () => mask.getRootNode().activeElement;

  // ── 垫在内容框背后的那层 ───────────────────────────────────────
  const paintBack = () => {
    const text = ta.value, n = text.length;
    const marks = spansToMarks(st.spans, n);
    const on = cur && cur.f === FIELDS.body ? cur : null;
    const picked = i => !!on && i >= on.a && i < on.b;
    bkIn.textContent = '';
    for (let i = 0; i < n;){
      let j = i + 1;
      while (j < n && sameMark(marks[i], marks[j]) && picked(i) === picked(j)) j++;
      const seg = document.createElement('span');
      seg.textContent = text.slice(i, j);
      if (marks[i]) seg.style.boxShadow = `inset 0 -2px 0 ${marks[i].ink ? inkOf(marks[i].ink) : 'rgba(199,113,12,.86)'}`;
      if (picked(i)) seg.className = 'x';
      bkIn.append(seg);
      i = j;
    }
    // 收尾垫一个字：末尾那个换行在 div 里不占行，在 textarea 里占，不垫滚到底会差一行
    bkIn.append(document.createTextNode('​'));
    fitBack();
  };
  const fitBack = () => {
    bk.style.width = (ta.clientWidth + 2) + 'px';       // 滚动条出来时 textarea 的字会变窄，跟着它
    bkIn.style.transform = `translateY(${-ta.scrollTop}px)`;
  };

  // ── 选区 ───────────────────────────────────────────────────────
  const read = f => {
    if (!alive() || activeEl() !== f.el) return;        // 焦点在别处（比如正调字号）时，选区原样留着
    const a = f.el.selectionStart, b = f.el.selectionEnd;
    if (a === b){ if (cur) { cur = null; refresh(); } return; }
    if (cur && cur.f === f && cur.a === a && cur.b === b) return;
    cur = { f, a, b }; fl.hidden = true;
    refresh();
  };
  const later = f => () => setTimeout(() => read(f), 0);
  for (const f of Object.values(FIELDS))
    for (const ev of ['select', 'keyup', 'mouseup', 'touchend', 'focus']) f.el.addEventListener(ev, later(f));
  // 拖选拖出框外才松手的，上面那些一个都收不到；手机上拖选区手柄也只有它
  const onSel = () => { for (const f of Object.values(FIELDS)) read(f); };
  document.addEventListener('selectionchange', onSel);
  const drop = () => {
    if (!cur) return false;
    const { f, b } = cur;
    cur = null;
    try { f.el.setSelectionRange(b, b); } catch {}
    refresh();
    return true;
  };
  // 按小条上的按钮别抢走焦点 —— 框里的选区才会一直亮着
  bar.addEventListener('mousedown', e => { if (!e.target.closest('input')) e.preventDefault(); });

  ta.addEventListener('scroll', fitBack);
  let ro = null;
  try { ro = new ResizeObserver(fitBack); ro.observe(ta); } catch {}

  // ── 改 ─────────────────────────────────────────────────────────
  const put = patch => {
    if (!cur) return;
    st[cur.f.spans] = paintSpans(st[cur.f.spans], cur.f.el.value.length, cur.a, cur.b, patch);
    remember(cur.f);
    refresh(); draw();
  };

  // 撤销/重做回到某一版文字时，把那一版的样式也请回来（textarea 的撤销只管字）
  for (const f of Object.values(FIELDS)) f.past = new Map();
  const remember = f => {
    f.past.delete(f.el.value);
    f.past.set(f.el.value, st[f.spans]);
    if (f.past.size > 300) f.past.delete(f.past.keys().next().value);
  };
  const edited = (which, e) => {
    const f = FIELDS[which], now = f.el.value;
    if (now === f.last) return;
    const back = e && /^history/.test(e.inputType || '') ? f.past.get(now) : null;
    st[f.spans] = back || shiftSpans(st[f.spans], f.last, now, f.el.selectionEnd);
    f.last = now;
    remember(f);
    cur = null;
    refresh();
    read(f);                                            // 撤销之后浏览器可能留着选区
  };
  for (const f of Object.values(FIELDS)) remember(f);

  // ── 小条 ───────────────────────────────────────────────────────
  const setSize = v => {
    const n = Math.max(12, Math.min(300, Math.round(+v)));
    if (n) put({ size: n });
  };
  q('#pkS').oninput  = e => setSize(e.target.value);
  // 数字框边打边生效，但别把人正在敲的半截数字改写掉（想敲 80，先敲到 8）
  q('#pkSn').oninput = e => { if (+e.target.value >= 12) setSize(e.target.value); };
  q('#pkSn').onchange = e => { if (e.target.value !== '') setSize(e.target.value); refresh(); };
  q('#pkA').oninput = e => put({ alpha: +e.target.value >= 100 ? null : +e.target.value / 100 });
  q('#pkW').onclick = e => { const b = e.target.closest('button'); if (b) put({ weight: +b.dataset.v }); };
  q('#pkClear').onclick = () => put({ size: null, font: null, ink: null, weight: null, alpha: null });
  q('#pkInk').onclick = e => {
    const b = e.target.closest('button'); if (b) put({ ink: b.dataset.v || null });
  };
  q('#pkF').onclick = () => {
    if (fl.hidden){ fillFonts(fl, t('pick.fontSame'), true); markFont(); }
    fl.hidden = !fl.hidden;
  };
  fl.onclick = e => {
    const b = e.target.closest('button'); if (!b || !b.dataset.v) return;
    put({ font: b.dataset.v === 'same' ? null : b.dataset.v });
  };
  const fontLabel = id => {
    const f = FONTS.find(x => x.id === id); if (f) return tName('font', f.id, f.name);
    const m = myFontList().find(x => x.id === id); if (m) return m.name;
    const l = LATIN.find(x => x.id === id); return l ? l.name : id;
  };
  let now = { mixed: {} };
  const markFont = () => fl.querySelectorAll('button').forEach(b =>
    b.setAttribute('aria-pressed', !now.mixed.font && b.dataset.v === (now.font || 'same')));

  function buildInks(){
    const box = q('#pkInk'); box.textContent = '';
    const same = document.createElement('button');
    same.className = 'same'; same.dataset.v = ''; same.textContent = t('pick.inkSame');
    box.append(same);
    for (const i of allInks()){
      const b = document.createElement('button');
      b.dataset.v = i.id; b.style.background = i.c;
      b.title = tName('ink', i.id, i.name); b.setAttribute('aria-label', b.title);
      box.append(b);
    }
    const c = document.createElement('input');
    c.type = 'color'; c.title = t('pick.inkCustom');
    c.oninput = e => put({ ink: e.target.value });
    box.append(c);
  }

  let inkStamp = '';
  function refresh(){
    if (!alive()) return;
    paintBack();
    const n = [...spansOf('body'), ...spansOf('title')].length;
    q('#pkHint').firstChild.textContent = n ? t('pick.hintSome', { n }) : t('pick.hint');
    q('#pkReset').hidden = !n;
    bar.hidden = !cur; q('#pkHint').hidden = !!cur;
    if (!cur){ fl.hidden = true; return; }

    const { f, a, b } = cur, text = f.el.value;
    if (bar.previousElementSibling !== f.after()) f.after().after(bar);
    now = spanCommon(st[f.spans], text.length, a, b);
    const what = text.slice(a, b).replace(/\s+/g, ' ');
    q('#pkWhat').textContent = t('pick.what', { text: what });
    q('#pkWhat').title = what;
    q('#pkRest').textContent = t(f.rest);
    q('#pkClear').disabled = !now.any;

    const size = now.mixed.size ? null : (now.size || f.size());
    q('#pkS').value = Math.max(20, Math.min(140, size || f.size()));
    if (activeEl() !== q('#pkSn')) q('#pkSn').value = size == null ? '' : size;
    q('#pkSn').placeholder = t('pick.mixed');
    const w = now.mixed.weight ? null : (now.weight === undefined ? (f.weight() || 0) : now.weight);
    q('#pkW').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === String(w)));

    const al = now.mixed.alpha ? null : Math.round((now.alpha === undefined ? 1 : now.alpha) * 100);
    q('#pkA').value = al == null ? 100 : al; q('#pkAv').textContent = al == null ? t('pick.mixed') : al + '%';

    const stamp = allInks().map(i => i.id + i.c + i.name).join();
    if (stamp !== inkStamp){ inkStamp = stamp; buildInks(); }
    const ink = now.mixed.ink ? null : (now.ink || '');
    q('#pkInk').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === ink));
    const ck = q('#pkInk input');
    if (ink && activeEl() !== ck) ck.value = /^#[0-9a-f]{6}$/i.test(ink) ? ink : inkOf(ink);

    const fs = q('#pkF').firstChild;
    fs.textContent = now.mixed.font ? t('pick.fontMixed') : now.font ? fontLabel(now.font) : t('pick.fontSame');
    fs.style.fontFamily = now.font && !now.mixed.font ? pickStack(now.font, st, 'inherit') : '';
    q('#pkF').lastChild.textContent = t('pick.fontPick');
    markFont();
  }
  const spansOf = which => {
    const f = FIELDS[which];
    return marksToSpans(spansToMarks(st[f.spans], f.el.value.length));
  };
  q('#pkReset').onclick = () => {
    for (const f of Object.values(FIELDS)){ st[f.spans] = []; remember(f); }
    refresh(); draw();
  };

  return { edited, refresh, drop,
           dispose(){ document.removeEventListener('selectionchange', onSel); if (ro) ro.disconnect(); } };
}

