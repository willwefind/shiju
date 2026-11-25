// ════════════════════════════════════════════════════════════════════
//  6e. 自己加字：从文件、从字体包（zip）、从链接
// ════════════════════════════════════════════════════════════════════
// 一款字存在哪：
//   data  ＝ 存在油猴里（12MB 以内），所有网站通用 —— 老样子
//   idb   ＝ 存在这个网站自己的 IndexedDB：酒馆扩展没有油猴存储，localStorage 又只有 5MB，
//           一款中文字塞不进去（以前塞不进还不吭声，就是「字体包导不进去」）
//   faces ＝ 只记链接：网上切成一片片的字，用到哪些字就向那个链接取哪几片
// 🔒 联网只有这一处，而且得人自己贴了链接才有。不带登录信息、不带来路（no-referrer）。
const FONT_GM_MAX = 12 * 1024 * 1024, FONT_MAX = 64 * 1024 * 1024;
const fontErr = (code, x) => Object.assign(new Error(code), { code, x: x || {} });
function fontDb(mode, fn){
  return new Promise((res, rej) => {
    let rq; try { rq = indexedDB.open('shiju-fonts', 1); } catch (e){ rej(e); return; }
    rq.onupgradeneeded = () => rq.result.createObjectStore('fonts');
    rq.onerror = () => rej(rq.error); rq.onblocked = () => rej(new Error('blocked'));
    rq.onsuccess = () => {
      const db = rq.result; let tx, out;
      try { tx = db.transaction('fonts', mode); out = fn(tx.objectStore('fonts')); } catch (e){ db.close(); rej(e); return; }
      tx.oncomplete = () => { db.close(); res(out && out.result); };
      tx.onerror = tx.onabort = () => { db.close(); rej(tx.error || new Error('abort')); };
    };
  });
}
const fontPut = (id, buf) => fontDb('readwrite', s => s.put(buf, id));
const fontGet = id => fontDb('readonly', s => s.get(id));
const fontDel = id => fontDb('readwrite', s => s.delete(id)).catch(() => {});

// 看头几个字节认它是什么，不信扩展名
function fontSniff(buf){
  const b = new Uint8Array(buf, 0, Math.min(8, buf.byteLength)), s = String.fromCharCode(...b.slice(0, 4));
  if (s === 'OTTO' || s === 'true' || s === 'ttcf' || s === 'wOFF' || s === 'wOF2' || (b[0] === 0 && b[1] === 1 && b[2] === 0 && b[3] === 0)) return 'font';
  if (s.slice(0, 2) === 'PK') return 'zip';
  if (s === 'Rar!' || (b[0] === 0x37 && b[1] === 0x7a)) return 'pack';
  return 'text';
}
// 拆 zip：只读目录和要用的那几个文件
function zipList(buf){
  const v = new DataView(buf), n = buf.byteLength; let e = -1;
  for (let i = n - 22; i >= Math.max(0, n - 22 - 65535); i--) if (v.getUint32(i, true) === 0x06054b50){ e = i; break; }
  if (e < 0) throw fontErr('zipBad');
  const out = []; let p = v.getUint32(e + 16, true);
  for (let k = 0, m = v.getUint16(e + 10, true); k < m && p + 46 <= n && v.getUint32(p, true) === 0x02014b50; k++){
    const flag = v.getUint16(p + 8, true), nl = v.getUint16(p + 28, true), raw = new Uint8Array(buf, p + 46, nl);
    let name; try { name = new TextDecoder(flag & 0x800 ? 'utf-8' : 'gbk', { fatal: false }).decode(raw); } catch { name = new TextDecoder().decode(raw); }
    out.push({ name, flag, how: v.getUint16(p + 10, true), packed: v.getUint32(p + 20, true), size: v.getUint32(p + 24, true), at: v.getUint32(p + 42, true) });
    p += 46 + nl + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
  }
  return out;
}
async function zipRead(buf, f){
  if (f.flag & 1) throw fontErr('zipLocked');
  if (f.size > FONT_MAX) throw fontErr('huge', { mb: Math.round(f.size / 1e6) });
  const v = new DataView(buf), at = f.at + 30 + v.getUint16(f.at + 26, true) + v.getUint16(f.at + 28, true), part = buf.slice(at, at + f.packed);
  if (f.how === 0) return part;
  if (f.how !== 8 || typeof DecompressionStream !== 'function') throw fontErr('zipBad');
  return new Response(new Blob([part]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
}
const fontBase = s => s.split(/[\\/]/).pop().replace(/\.[^.]+$/, '').slice(0, 24) || 'font';
const fontId = () => 'f' + Date.now() + Math.floor(Math.random() * 1e4);

// 把一款字的文件装进来。装不上、存不下，都把话说清楚
async function fontAdd(name, buf){
  if (buf.byteLength > FONT_MAX) throw fontErr('huge', { mb: Math.round(buf.byteLength / 1e6) });
  const id = fontId(); let face;
  try { face = new FontFace(id, buf.slice(0)); await face.load(); } catch { throw fontErr('bad'); }
  const it = { id, name: name.slice(0, 24) }, list = (cfg('myFonts') || []).slice();
  const url = () => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(new Blob([buf], { type: 'font/sfnt' })); });
  let here = false;
  if (hasGM && buf.byteLength <= FONT_GM_MAX) it.data = await url();
  else {
    try { await fontPut(id, buf); it.idb = 1; here = hasGM; }
    catch { if (buf.byteLength > 3e6) throw fontErr('full'); it.data = await url(); }
  }
  if (!setCfg('myFonts', list.concat([it]))){ if (it.idb) fontDel(id); throw fontErr('full'); }
  document.fonts.add(face); loadedCustom.add(id);
  return { ...it, here };
}
// 一个文件（字体或 zip）→ 装进来的几款
async function fontFromBytes(name, buf, ask){
  const kind = fontSniff(buf);
  if (kind === 'font') return [await fontAdd(fontBase(name), buf)];
  if (kind === 'pack') throw fontErr('pack');
  if (kind !== 'zip') throw fontErr('bad');
  const fs = zipList(buf).filter(f => /\.(ttf|otf|ttc|woff2?)$/i.test(f.name) && !/(^|\/)(__MACOSX|\._)/.test(f.name) && f.size > 500);
  if (!fs.length) throw fontErr(zipList(buf).some(f => /\.(zip|rar|7z)$/i.test(f.name)) ? 'zipNest' : 'zipNone');
  let pick = fs;
  if (fs.length > 1){ const want = ask(fs.map(f => f.name.split('/').pop())); if (!want || !want.length) return []; pick = want.map(i => fs[i]).filter(Boolean); }
  const out = []; for (const f of pick) out.push(await fontAdd(fontBase(f.name), await zipRead(buf, f)));
  return out;
}

// ── 链接 ────────────────────────────────────────────────────────────
// 贴进来的可能是网址、@import、<link>，也可能是网页地址：挑出真正该取的那一个
function fontLinkOf(text){
  const s = String(text).trim(), m = s.match(/url\(\s*['"]?([^'")\s]+)/i) || s.match(/href\s*=\s*["']([^"']+)/i) || s.match(/@import\s+["']([^"']+)/i) || s.match(/(?:^|[\s"'(=])((?:https?:)?\/\/[^\s"'<>]+)/i);
  if (!m) return null;
  let u = m[1].replace(/&amp;/g, '&').replace(/[;,，。]+$/, ''); if (u.startsWith('//')) u = 'https:' + u;
  u = u.replace(/^http:/i, 'https:');
  let x; try { x = new URL(u); } catch { return null; }
  if (x.protocol !== 'https:') return null;
  let q = u.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/); if (q) return `https://raw.githubusercontent.com/${q[1]}/${q[2]}/${q[3]}`.replace(/\?.*$/, '');
  q = u.match(/^https:\/\/fonts\.google\.com\/(?:noto\/)?specimen\/([^/?#]+)/); if (q) return `https://fonts.googleapis.com/css2?family=${q[1]}&display=swap`;
  q = u.match(/^https:\/\/fonts\.zeoseven\.com\/items\/(\d+)/); if (q) return `https://fontsapi.zeoseven.com/${q[1]}/main/result.css`;
  return u;
}
// 样式表里的 @font-face：一个家族挑最接近 400 的那一档，分片（unicode-range）全收
function fontFaces(css, base){
  const fam = new Map(), prop = (b, k) => { const m = b.match(new RegExp('(?:^|[;{\\s])' + k + '\\s*:\\s*([^;}]+)', 'i')); return m ? m[1].trim() : ''; };
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@font-face\s*\{([^}]*)\}/gi)){
    const b = m[1].replace(/url\(\s*(['"]?)data:[^)]*\)/gi, ''), name = prop(b, 'font-family').replace(/^['"]|['"]$/g, ''), src = [...b.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)\s*(?:format\(\s*['"]?([^'")]+))?/gi)].map(q => ({ u: q[1].trim(), f: (q[2] || '').toLowerCase() })).filter(q => !/\.(eot|svg)(\?|#|$)/i.test(q.u));
    if (!name || !src.length || /italic|oblique/i.test(prop(b, 'font-style'))) continue;
    const s = src.find(q => /woff2/.test(q.f + q.u)) || src.find(q => /woff/.test(q.f + q.u)) || src[0]; let u; try { u = new URL(s.u, base).href.replace(/^http:/, 'https:'); } catch { continue; }
    const w = (prop(b, 'font-weight') || '400').replace('normal', '400').replace('bold', '700').split(/\s+/).map(Number), lo = w[0] || 400, hi = w[1] || lo, far = lo <= 400 && hi >= 400 ? 0 : Math.min(Math.abs(lo - 400), Math.abs(hi - 400));
    if (!fam.has(name)) fam.set(name, new Map()); const g = fam.get(name), k = lo + '-' + hi; if (!g.has(k)) g.set(k, { far, faces: [] });
    g.get(k).faces.push([u, prop(b, 'unicode-range'), ...(hi !== lo ? [lo + ' ' + hi] : [])]);
  }
  return [...fam].map(([name, g]) => ({ name, faces: [...g.values()].sort((a, b) => a.far - b.far)[0].faces }));
}
async function fontFetch(u){
  const c = new AbortController(), tm = setTimeout(() => c.abort(), 60000);
  try {
    const get = cache => fetch(u, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: c.signal, cache });
    let r = await get('default'); if (r.status === 204) r = await get('reload');      // 浏览器里可能存着一份「带来路、给了空」的旧回应
    if (!r.ok) throw fontErr('http', { n: r.status });
    if (+r.headers.get('content-length') > FONT_MAX) throw fontErr('huge', { mb: Math.round(r.headers.get('content-length') / 1e6) });
    const buf = await r.arrayBuffer(); if (!buf.byteLength) throw fontErr('net');
    return buf;
  } catch (e){ throw e.code ? e : fontErr('net'); } finally { clearTimeout(tm); }
}
const FONT_PROBE = '天地玄黄国AWMil0';
// 一片一片的字：要画的字落在哪几片，就取哪几片。自己取、自己装（不交给浏览器按 url 取）——
// 有的字体站看来路，从别人网页里来的一律给空；自己取不带来路。取过的存进 IndexedDB，下回不用再取。
const fontSeen = new Map(), fontHave = new Map(), fontCut = new Map();
const fontRanges = f => {
  if (!fontCut.has(f.id)) fontCut.set(f.id, f.faces.map(([, r]) => r ? r.split(',').map(q => { const m = q.trim().match(/^U\+([0-9a-f?]+)(?:-([0-9a-f]+))?$/i); return m ? [parseInt(m[1].replace(/\?/g, '0'), 16), parseInt(m[2] || m[1].replace(/\?/g, 'f'), 16)] : [1, 0]; }) : null));
  return fontCut.get(f.id);
};
// net ＝ 许不许联网；不许就只拿存过的。返回新装上几片
async function fontPieces(f, text, net){
  if (!fontSeen.has(f.id)){ fontSeen.set(f.id, new Set()); fontHave.set(f.id, new Map()); }
  const seen = fontSeen.get(f.id), have = fontHave.get(f.id), cut = fontRanges(f), add = [...new Set(text)].filter(c => c.trim() && !seen.has(c)), need = new Set();
  for (const c of add){ const n = c.codePointAt(0); for (let i = cut.length - 1; i >= 0; i--) if (!cut[i] || cut[i].some(([a, b]) => n >= a && n <= b)){ need.add(i); break; } }
  let got = 0, bad = null; const todo = [...need].filter(i => !have.has(i));
  const one = async i => {
    const [u, r, w] = f.faces[i], job = (async () => {
      const key = f.id + '#' + i; let buf = await fontGet(key).catch(() => null);
      if (!buf){ if (!net) return false; buf = await fontFetch(u); if (!buf.byteLength) throw fontErr('net'); fontPut(key, buf).catch(() => {}); }
      const face = new FontFace(f.id, buf, { ...(r ? { unicodeRange: r } : {}), ...(w ? { weight: w } : {}) }); await face.load(); document.fonts.add(face); return true;
    })();
    have.set(i, job);
    try { if (await job) got++; else have.delete(i); } catch (e){ have.delete(i); bad = e; }
  };
  for (let k = 0; k < todo.length; k += 6) await Promise.all(todo.slice(k, k + 6).map(one));
  await Promise.all([...need].map(i => have.get(i)).filter(Boolean)).catch(() => {});
  if (net && !bad) add.forEach(c => seen.add(c));
  if (bad && !got) throw bad.code ? bad : fontErr('bad');
  return got;
}
const fontPiecesDel = id => fontDb('readwrite', s => s.delete(IDBKeyRange.bound(id + '#', id + '#\uffff'))).catch(() => {});
let fontBusy = Promise.resolve();
// 链接来的字：要画的字先取齐。返回「有没有新取到的」；没什么要取的就是 null
function fontPrime(text, ids){
  const jobs = [];
  for (const f of cfg('myFonts') || []){
    if (!f.faces || (ids && !ids.includes(f.id))) continue;
    const seen = fontSeen.get(f.id); if (seen && ![...text].some(c => c.trim() && !seen.has(c))) continue;
    jobs.push(fontPieces(f, FONT_PROBE + text, true).catch(() => 0));
  }
  if (!jobs.length) return null;
  const p = Promise.all(jobs).then(r => { const any = r.some(Boolean); if (any) dropFontProbes(); return any; });
  fontBusy = p; return p;
}
async function fontFromLink(text, ask){
  let css = /@font-face/i.test(text) ? String(text) : '', base = location.href, u = null;
  if (!css){
    u = fontLinkOf(text); if (!u) throw fontErr('noLink');
    const buf = await fontFetch(u); base = u;
    if (fontSniff(buf) !== 'text') return fontFromBytes(decodeURIComponent(new URL(u).pathname), buf, ask);
    css = new TextDecoder().decode(buf);
    if (/^\s*</.test(css)) throw fontErr('page');
    if (!/@font-face/i.test(css)) for (const m of [...css.matchAll(/@import\s+(?:url\(\s*)?['"]?([^'")\s;]+)/gi)].slice(0, 4)){ const v = new URL(m[1], u).href; css += '\n' + new TextDecoder().decode(await fontFetch(v)).replace(/url\(\s*(['"]?)(?!data:|https?:|\/\/)/gi, (_, q) => `url(${q}${v.replace(/[^/]*$/, '')}`); }
  }
  const fams = fontFaces(css, base); if (!fams.length) throw fontErr('noFace');
  let pick = fams; if (fams.length > 1){ const want = ask(fams.map(f => f.name)); if (!want || !want.length) return []; pick = want.map(i => fams[i]).filter(Boolean); }
  const out = [];
  for (const f of pick){
    const it = { id: fontId(), name: f.name.slice(0, 24), faces: f.faces };
    if (!await fontPieces(it, FONT_PROBE + f.name, true)) throw fontErr('net');
    if (!setCfg('myFonts', (cfg('myFonts') || []).concat([it]))){ fontPiecesDel(it.id); throw fontErr('full'); }
    loadedCustom.add(it.id); out.push(it);
  }
  return out;
}
