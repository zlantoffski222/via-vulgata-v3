// The interactive timeline / map / detail engine from the original "4,000-Year Quest" page,
// ported to run on the app's cleaned data and hand off to the reader. Plain DOM, mounted by Home.jsx.
import { data } from '../store';
import { proj, pathFrom, GEO, MAP, artUrl, CAT_NAMES, HIST } from '../util';

const CATS = {
  scr: { n: 'Scripture & Prophets', c: 'var(--s1)', shape: 'circle' },
  emp: { n: 'Empires & Rulers', c: 'var(--s2)', shape: 'square' },
  mig: { n: 'Exiles & Migrations', c: 'var(--s3)', shape: 'diamond' },
  war: { n: 'Wars & Conquests', c: 'var(--s4)', shape: 'tri' },
  dis: { n: 'Disasters & Plagues', c: 'var(--s5)', shape: 'tridown' },
  txt: { n: 'Texts & Theology', c: 'var(--s6)', shape: 'hex' },
};
const T0 = -4050, T1 = 610, JW = 60, MW = MAP.W, MH = MAP.H;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtYear = y => { const a = Math.abs(Math.round(y)); return y < 0 ? a + ' BC' : 'AD ' + a; };
function shapeSVG(shape, x, y, r, fill, cls) {
  const c = cls || 'mark';
  switch (shape) {
    case 'circle': return `<circle class="${c}" cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
    case 'square': return `<rect class="${c}" x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" rx="2" fill="${fill}"/>`;
    case 'diamond': return `<path class="${c}" d="M${x} ${y - r * 1.25} L${x + r * 1.25} ${y} L${x} ${y + r * 1.25} L${x - r * 1.25} ${y} Z" fill="${fill}"/>`;
    case 'tri': return `<path class="${c}" d="M${x} ${y - r * 1.2} L${x + r * 1.2} ${y + r} L${x - r * 1.2} ${y + r} Z" fill="${fill}"/>`;
    case 'tridown': return `<path class="${c}" d="M${x} ${y + r * 1.2} L${x + r * 1.2} ${y - r} L${x - r * 1.2} ${y - r} Z" fill="${fill}"/>`;
    case 'hex': { const a = r * 1.15, b = r * 0.62; return `<path class="${c}" d="M${x - b} ${y - a * 0.8} L${x + b} ${y - a * 0.8} L${x + a} ${y} L${x + b} ${y + a * 0.8} L${x - b} ${y + a * 0.8} L${x - a} ${y} Z" fill="${fill}"/>`; }
  }
  return '';
}
const firstSentence = s => { const i = s.indexOf('. '); return i > 0 ? s.slice(0, i + 1) : s; };
const refLabel = r => { const b = data.byId[r.b]; const nm = b ? b.abbr : r.b; if (r.v1) return `${nm} ${r.c1}:${r.v1}${r.v2 && r.v2 !== r.v1 ? '–' + r.v2 : ''}`; return r.c1 === r.c2 ? `${nm} ${r.c1}` : `${nm} ${r.c1}–${r.c2}`; };
const uniqRefs = rs => rs.filter((r, i) => rs.findIndex(x => x.b === r.b && x.c1 === r.c1) === i);

export function mount(root, opts) {
  const { navigate, isEventRead, renderIdle } = opts;
  const EVENTS = data.timeline.events, ERAS = data.timeline.eras, LOCS = data.timeline.locs;
  const $ = s => root.querySelector(s);
  const state = { win: [T0, T1], cats: new Set(Object.keys(CATS)), q: '', sel: null, mode: 'range', jt: -1950, playing: false, route: null, stop: 0 };
  let tlW = 800, jrTimer = null, mapDragging = false, tipSeq = 0;
  let mapView = { x: 0, y: 0, w: MW, h: MH };
  const mapK = () => MW / mapView.w;

  root.innerHTML = `
    <div class="controls">
      <div class="chips" id="cat-chips"></div>
      <input class="searchbox" id="q" type="search" placeholder="Search events, people…" aria-label="Search events">
      <span class="count" id="count"></span>
    </div>
    <div class="card" id="tl-card">
      <h2 class="ch">Timeline <span class="hint">— hover for art &amp; a summary · click an event · drag the golden strip below to adjust the visible range</span></h2>
      <div id="tl-scroll"><svg id="tlsvg"></svg></div>
      <svg id="ovsvg" height="58"></svg>
      <div class="presets" id="presets"></div>
    </div>
    <div class="row2">
      <div class="card">
        <h2 class="ch">The region <span class="hint">— scroll to zoom · drag to pan · click a city for its story</span></h2>
        <div class="seg" id="map-mode" style="margin-bottom:10px"><button data-m="range" class="on">Timeline range</button><button data-m="journey">✦ Time journey</button><button data-m="routes">⟶ Journeys</button></div>
        <div class="map-wrap">
          <svg id="mapsvg" viewBox="0 0 ${MW} ${MH}"></svg>
          <div class="map-ctl"><button id="mz-in" title="Zoom in">+</button><button id="mz-out" title="Zoom out">−</button><button id="mz-reset" title="Reset view">⌂</button></div>
        </div>
        <div id="routes-bar" style="display:none">
          <div class="journey-row"><button id="rt-play" title="Walk the route">▶</button><select id="rt-select" aria-label="Journey"></select><span class="jr-era" id="rt-era"></span></div>
          <div class="route-stops" id="rt-stops"></div>
        </div>
        <div id="journey-bar" style="display:none">
          <div class="journey-row"><button id="jr-play" title="Play through history">▶</button><div><div class="jr-year" id="jr-year"></div><div class="jr-era" id="jr-era"></div></div><input type="range" id="jr-slider" min="${T0}" max="${T1}" step="2" value="-1950"></div>
          <div class="journey-chips" id="journey-chips"></div>
        </div>
      </div>
      <div class="card" id="detail-card"><h2 class="ch" id="detail-h">Today</h2><div id="detail"><div id="detail-idle"></div><div id="detail-body"></div></div></div>
    </div>
    <div id="tooltip"></div>`;

  /* ---- helpers ---- */
  const matches = ev => { if (!state.cats.has(ev.cat)) return false; if (state.q) { const hay = (ev.ttl + ' ' + (ev.who || []).join(' ') + ' ' + ev.sum).toLowerCase(); if (!hay.includes(state.q)) return false; } return true; };
  const eraPct = er => { const evs = EVENTS.filter(e => e.y >= er.s && e.y < er.e && e.refs.length); if (!evs.length) return 0; return evs.filter(isEventRead).length / evs.length; };
  const tickStep = span => { for (const st of [50, 100, 250, 500, 1000]) if (st / span * tlW >= 72) return st; return 1000; };

  /* ---- controls ---- */
  const chips = $('#cat-chips');
  chips.innerHTML = Object.entries(CATS).map(([k, c]) => `<span class="chip" data-c="${k}"><svg width="14" height="14">${shapeSVG(c.shape, 7, 7, 5, c.c, 'm')}</svg>${c.n}</span>`).join('');
  chips.querySelectorAll('.chip').forEach(ch => ch.onclick = () => { const k = ch.dataset.c; if (state.cats.has(k)) state.cats.delete(k); else state.cats.add(k); ch.classList.toggle('off', !state.cats.has(k)); renderAll(); });
  $('#q').oninput = e => { state.q = e.target.value.trim().toLowerCase(); renderAll(); };
  const presets = [['Full span', T0, T1], ['Patriarchs & Exodus', -2150, -1150], ['Kings & Prophets', -1100, -500], ['Second Temple', -560, 40], ['Life of Jesus', -20, 100], ['The early Church', 25, 610]];
  $('#presets').innerHTML = presets.map((p, i) => `<button data-i="${i}">${p[0]}</button>`).join('') + `<span class="sp"></span><span class="lbl">Year spacing:</span><button id="tl-out" title="Wider span">−</button><button id="tl-in" title="Narrower span">+</button>`;
  $('#presets').querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { const p = presets[+b.dataset.i]; state.win = [p[1], p[2]]; renderTimeline(); renderOverview(); renderMapMarkers(); });
  $('#tl-in').onclick = () => zoomTL(1.5); $('#tl-out').onclick = () => zoomTL(1 / 1.5);
  $('#tlsvg').addEventListener('wheel', e => { e.preventDefault(); const r = $('#tlsvg').getBoundingClientRect(); const t = state.win[0] + (e.clientX - r.left) / r.width * (state.win[1] - state.win[0]); zoomTL(e.deltaY < 0 ? 1.25 : 1 / 1.25, t); }, { passive: false });
  function zoomTL(f, ct) { let [a, b] = state.win; const span = b - a; const s2 = Math.min(T1 - T0, Math.max(300, span / f)); if (ct == null) ct = (a + b) / 2; let na = ct - (ct - a) * (s2 / span); na = Math.max(T0, Math.min(na, T1 - s2)); state.win = [na, na + s2]; renderTimeline(); renderOverview(); renderMapMarkers(); }

  /* ---- timeline ---- */
  function renderTimeline() {
    const svg = $('#tlsvg'); tlW = svg.clientWidth || svg.parentNode.clientWidth || 800;
    const [w0, w1] = state.win, span = w1 - w0; const X = t => (t - w0) / span * tlW;
    let out = ''; let ei = 0;
    for (const er of ERAS) { const a = Math.max(er.s, w0), b = Math.min(er.e, w1); ei++; if (b <= a) continue; const x = X(a), w = X(b) - x; const pct = eraPct(er); out += `<rect class="era-band" x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="22" rx="4" fill-opacity="${ei % 2 ? 0.55 : 1}"/>`; if (pct > 0) out += `<rect class="era-fill" x="${x.toFixed(1)}" y="18" width="${(w * pct).toFixed(1)}" height="4" rx="2"><title>${Math.round(pct * 100)}% of this era read</title></rect>`; if (w > 76) out += `<text class="era-label" x="${(x + 6).toFixed(1)}" y="15">${esc(er.n)}${w > 150 && pct > 0 ? ` · ${Math.round(pct * 100)}%` : ''}</text>`; }
    const step = tickStep(span); const t0 = Math.ceil(w0 / step) * step; let ticks = ''; const stepPx = step / span * tlW;
    for (let t = t0; t <= w1; t += step) { const x = X(t); const end = x > tlW - 54; const label = (end && stepPx < 96) ? '' : `<text x="${end ? x - 3 : x + 3}" y="40"${end ? ' text-anchor="end"' : ''}>${fmtYear(t)}</text>`; ticks += `<g class="tick"><line x1="${x}" y1="28" x2="${x}" y2="1000"/>${label}</g>`; }
    const vis = EVENTS.map((ev, i) => ({ ev, i })).filter(o => matches(o.ev) && o.ev.y >= w0 - span * 0.02 && o.ev.y <= w1 + span * 0.02);
    vis.sort((a, b) => a.ev.y - b.ev.y);
    const rowLast = []; const y0 = 66, rowH = 26, minGap = 18; let maxRow = 0;
    const placed = vis.map(o => { const x = X(o.ev.y); let r = 0; while (r < rowLast.length && x - rowLast[r] < minGap) r++; rowLast[r] = x; maxRow = Math.max(maxRow, r); return { ...o, x, y: y0 + r * rowH, row: r }; });
    const H = Math.max(300, y0 + (maxRow + 1) * rowH + 16);
    svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${tlW} ${H}`);
    const byRow = {}; placed.forEach(p => { (byRow[p.row] = byRow[p.row] || []).push(p); });
    let labelOut = '';
    for (const r in byRow) { const arr = byRow[r]; for (let j = 0; j < arr.length; j++) { const p = arr[j]; const gap = (j + 1 < arr.length ? arr[j + 1].x : tlW) - p.x - 18; if (gap > 48) { const maxCh = Math.floor(gap / 6.2); let ttl = p.ev.ttl; if (ttl.length > maxCh) ttl = ttl.slice(0, Math.max(3, maxCh - 1)) + '…'; labelOut += `<text class="evt-label" x="${(p.x + 12).toFixed(1)}" y="${p.y + 3.5}">${esc(ttl)}</text>`; } } }
    let evOut = '';
    for (const p of placed) { const c = CATS[p.ev.cat]; const sel = state.sel === p.i ? ' sel' : ''; const rd = isEventRead(p.ev) ? ' read' : ''; evOut += `<g class="evt${sel}${rd}" data-i="${p.i}"><circle class="halo" cx="${p.x.toFixed(1)}" cy="${p.y}" r="11"/>${shapeSVG(c.shape, +p.x.toFixed(1), p.y, 6.5, c.c)}</g>`; }
    svg.innerHTML = ticks + `<line class="axisline" x1="0" y1="27" x2="${tlW}" y2="27"/>` + out + labelOut + evOut;
    svg.querySelectorAll('.evt').forEach(g => { g.addEventListener('click', () => select(+g.dataset.i)); g.addEventListener('mouseenter', e => showTip(e, EVENTS[+g.dataset.i])); g.addEventListener('mousemove', moveTip); g.addEventListener('mouseleave', hideTip); });
    const n = EVENTS.filter(matches).length; $('#count').textContent = `${n} of ${EVENTS.length} events in focus`;
  }

  /* ---- tooltip ---- */
  function tipFill(title, sub, desc, wp) {
    const t = $('#tooltip'); tipSeq++;
    t.innerHTML = `<div class="tip-title">${esc(title)}</div><div class="yr">${esc(sub)}</div>${desc ? `<div class="tip-desc">${esc(desc)}</div>` : ''}${wp && artUrl(wp) ? `<img class="tooltip-img" src="${artUrl(wp)}" alt="">` : ''}`;
    t.style.display = 'block';
  }
  function showTip(e, ev) { tipFill(ev.ttl, ev.d, firstSentence(ev.sum), ev.art ? ev.art.wp : null); moveTip(e); }
  function showLocTip(e, key) { const L = LOCS[key]; if (!L) return; const n = EVENTS.filter(ev => (ev.loc || []).includes(key)).length; tipFill(L.n, n ? n + ' event' + (n > 1 ? 's' : '') + ' here — click to explore' : 'click to explore', L.d || '', L.wp); moveTip(e); }
  function moveTip(e) { const t = $('#tooltip'); t.style.left = Math.min(e.clientX + 16, window.innerWidth - 300) + 'px'; t.style.top = Math.min(e.clientY + 16, window.innerHeight - 260) + 'px'; }
  function hideTip() { tipSeq++; $('#tooltip').style.display = 'none'; }

  /* ---- overview / brush ---- */
  function renderOverview() {
    const svg = $('#ovsvg'); const W = svg.clientWidth || 800, H = 58; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const X = t => (t - T0) / (T1 - T0) * W;
    let out = `<line class="axisline" x1="0" y1="${H - 14}" x2="${W}" y2="${H - 14}"/>`;
    for (const er of ERAS) out += `<rect class="era-band" x="${X(er.s).toFixed(1)}" y="${H - 12}" width="${Math.max(1, X(er.e) - X(er.s) - 1).toFixed(1)}" height="6" rx="2"/>`;
    for (let t = -4000; t <= 500; t += 500) { const x = X(t); const end = x > W - 54; out += `<text class="era-label" x="${end ? x - 2 : x + 2}" y="${H - 1}"${end ? ' text-anchor="end"' : ''}>${fmtYear(t)}</text>`; }
    for (const ev of EVENTS) { if (!matches(ev)) continue; const c = CATS[ev.cat]; out += `<circle class="ov-dot" cx="${X(ev.y).toFixed(1)}" cy="${H - 24 - (Math.abs(ev.y * 7) % 17)}" r="1.8" fill="${c.c}" opacity="0.8"/>`; }
    const x0 = X(state.win[0]), x1 = X(state.win[1]);
    out += `<rect class="ov-win" x="${x0}" y="2" width="${Math.max(2, x1 - x0)}" height="${H - 18}" rx="4"/><rect class="ov-mid" x="${x0 + 5}" y="2" width="${Math.max(2, x1 - x0 - 10)}" height="${H - 18}"/><rect class="ov-handle" data-h="0" x="${x0 - 4}" y="8" width="8" height="${H - 30}" rx="3"/><rect class="ov-handle" data-h="1" x="${x1 - 4}" y="8" width="8" height="${H - 30}" rx="3"/>`;
    svg.innerHTML = out; attachBrush(svg, W);
  }
  function attachBrush(svg, W) {
    const toT = px => T0 + px / W * (T1 - T0); let mode = null, startPx = 0, startWin = null, moved = false;
    const pos = e => { const r = svg.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; };
    svg.onpointerdown = e => { const p = pos(e); startPx = p; startWin = [...state.win]; moved = false; const t = e.target; if (t.classList.contains('ov-handle')) mode = t.dataset.h === '0' ? 'l' : 'r'; else if (t.classList.contains('ov-mid')) mode = 'm'; else mode = 'new'; svg.setPointerCapture(e.pointerId); e.preventDefault(); };
    svg.onpointermove = e => { if (!mode) return; const p = pos(e), dt = toT(p) - toT(startPx); if (Math.abs(p - startPx) > 2) moved = true; if (!moved) return; let [a, b] = startWin;
      if (mode === 'l') a = Math.min(toT(p), b - 300); else if (mode === 'r') b = Math.max(toT(p), a + 300); else if (mode === 'm') { const w = b - a; a = a + dt; b = a + w; if (a < T0) { a = T0; b = T0 + w; } if (b > T1) { b = T1; a = T1 - w; } } else { a = Math.min(toT(startPx), toT(p)); b = Math.max(toT(startPx), toT(p)); if (b - a < 300) b = a + 300; }
      state.win = [Math.max(T0, a), Math.min(T1, b)]; renderTimeline(); renderOverviewWindowOnly(); };
    svg.onpointerup = () => { const didMove = moved; mode = null; if (didMove) { renderOverview(); renderMapMarkers(); } };
    svg.ondblclick = () => { state.win = [T0, T1]; renderTimeline(); renderOverview(); renderMapMarkers(); };
  }
  function renderOverviewWindowOnly() { const svg = $('#ovsvg'); const W = +svg.viewBox.baseVal.width, H = 58; const X = t => (t - T0) / (T1 - T0) * W; const x0 = X(state.win[0]), x1 = X(state.win[1]); const win = svg.querySelector('.ov-win'), h0 = svg.querySelector('[data-h="0"]'), h1 = svg.querySelector('[data-h="1"]'), mid = svg.querySelector('.ov-mid'); if (!win) return; win.setAttribute('x', x0); win.setAttribute('width', Math.max(2, x1 - x0)); h0.setAttribute('x', x0 - 4); h1.setAttribute('x', x1 - 4); mid.setAttribute('x', x0 + 5); mid.setAttribute('width', Math.max(2, x1 - x0 - 10)); }

  /* ---- map ---- */
  function setMapViewBox() { $('#mapsvg').setAttribute('viewBox', `${mapView.x.toFixed(1)} ${mapView.y.toFixed(1)} ${mapView.w.toFixed(1)} ${mapView.h.toFixed(1)}`); }
  function zoomMap(f, cx, cy) { const w2 = Math.min(MW, Math.max(MW / 10, mapView.w / f)); if (cx == null) { cx = mapView.x + mapView.w / 2; cy = mapView.y + mapView.h / 2; } const s = w2 / mapView.w, h2 = MH * (w2 / MW); let x = cx - (cx - mapView.x) * s, y = cy - (cy - mapView.y) * s; mapView = { x: Math.min(Math.max(x, 0), MW - w2), y: Math.min(Math.max(y, 0), MH - h2), w: w2, h: h2 }; setMapViewBox(); renderMapBase(); renderMapMarkers(); }
  function mapClientToSvg(e) { const r = $('#mapsvg').getBoundingClientRect(); return [mapView.x + (e.clientX - r.left) / r.width * mapView.w, mapView.y + (e.clientY - r.top) / r.height * mapView.h]; }
  (function attachMapNav() {
    const svg = $('#mapsvg');
    svg.addEventListener('wheel', e => { e.preventDefault(); const [cx, cy] = mapClientToSvg(e); zoomMap(e.deltaY < 0 ? 1.3 : 1 / 1.3, cx, cy); }, { passive: false });
    let panning = false, sx = 0, sy = 0, sv = null;
    svg.addEventListener('pointerdown', e => { panning = true; mapDragging = false; sx = e.clientX; sy = e.clientY; sv = { ...mapView }; });
    window.addEventListener('pointermove', e => { if (!panning) return; if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 4) mapDragging = true; if (!mapDragging) return; const r = svg.getBoundingClientRect(); const dx = (e.clientX - sx) / r.width * sv.w, dy = (e.clientY - sy) / r.height * sv.h; mapView.x = Math.min(Math.max(sv.x - dx, 0), MW - sv.w); mapView.y = Math.min(Math.max(sv.y - dy, 0), MH - sv.h); setMapViewBox(); });
    window.addEventListener('pointerup', () => { if (panning) { panning = false; setTimeout(() => { mapDragging = false; }, 0); } });
    svg.addEventListener('dblclick', e => { const [cx, cy] = mapClientToSvg(e); zoomMap(1.6, cx, cy); });
    $('#mz-in').onclick = () => zoomMap(1.5); $('#mz-out').onclick = () => zoomMap(1 / 1.5);
    $('#mz-reset').onclick = () => { mapView = { x: 0, y: 0, w: MW, h: MH }; setMapViewBox(); renderMapBase(); renderMapMarkers(); };
  })();
  function renderMapBase() {
    const svg = $('#mapsvg'); const k = mapK(), iv = 1 / k;
    let out = `<rect class="map-land" x="0" y="0" width="${MW}" height="${MH}"/>`;
    for (const s of ['SEA_MED', 'SEA_BLACK', 'SEA_RED', 'SEA_GULF', 'SEA_CASPIAN']) out += `<path class="map-sea" d="${pathFrom(GEO[s], true)}"/>`;
    for (const s of ['LAND_ITALY', 'LAND_SICILY', 'LAND_SARDINIA', 'LAND_BALKANS', 'LAND_CRETE']) out += `<path class="map-land" d="${pathFrom(GEO[s], true)}" stroke="var(--river)" stroke-width="${iv}"/>`;
    { const [cx, cy] = proj(33.2, 35.1); out += `<ellipse class="map-land" cx="${cx}" cy="${cy}" rx="13" ry="5" stroke="var(--river)" stroke-width="${iv}"/>`; }
    for (const s of ['RIV_NILE', 'RIV_NILE2', 'RIV_EUPH', 'RIV_TIGR']) out += `<path class="map-river" stroke-width="${(2 * iv).toFixed(2)}" d="${pathFrom(GEO[s])}"/>`;
    out += `<path class="map-river" stroke-width="${(1.4 * iv).toFixed(2)}" d="${pathFrom(GEO.RIV_JORD)}"/>`;
    const fsT = (10 * iv).toFixed(2);
    for (const [n, lon, lat, rot] of [['Mediterranean Sea', 19.5, 34.3, 0], ['Red Sea', 37.4, 22.6, -52], ['Persian Gulf', 50.6, 27.3, -38], ['Black Sea', 33.5, 42.2, 0], ['Aegean', 24.8, 38.9, 0]]) { const [x, y] = proj(lon, lat); out += `<text class="map-sea-l" font-size="${fsT}" x="${x}" y="${y}" ${rot ? `transform="rotate(${rot} ${x} ${y})"` : ''}>${n}</text>`; }
    for (const [n, lon, lat] of [['A R A B I A', 41.5, 23.2], ['E G Y P T', 30.2, 26.5], ['MESOPOTAMIA', 43.2, 34.6], ['A N A T O L I A', 34.0, 39.6], ['P E R S I A', 49.8, 33.8], ['I T A L I A', 13.2, 42.1], ['HELLAS', 21.6, 39.4], ['AFRICA', 13.5, 31.6]]) { const [x, y] = proj(lon, lat); out += `<text class="map-title" font-size="${fsT}" x="${x}" y="${y}">${n}</text>`; }
    const fsL = (9.5 * iv).toFixed(2); let locOut = '';
    for (const [k2, L] of Object.entries(LOCS)) { if (L.edge) continue; if (L.quiet && k < 1.7) continue; const [x, y] = proj(L.ll[0], L.ll[1]); const end = x > MW - 64 * iv; locOut += `<g class="locg" data-loc="${k2}"><circle fill="transparent" cx="${x}" cy="${y}" r="${(8 * iv).toFixed(2)}"/><circle class="loc-dot" cx="${x}" cy="${y}" r="${(1.7 * iv).toFixed(2)}"/><text class="loc-label" font-size="${fsL}" x="${end ? x - 3.5 * iv : x + 3.5 * iv}" y="${y + 3 * iv}"${end ? ' text-anchor="end"' : ''}>${esc(L.n)}</text></g>`; }
    svg.innerHTML = out + locOut + `<g id="map-mig"></g><g id="map-markers"></g>`;
    svg.querySelectorAll('.locg').forEach(g => { g.addEventListener('click', e => { if (!mapDragging) { showLocDetail(g.dataset.loc); e.stopPropagation(); } }); g.addEventListener('mouseenter', e => showLocTip(e, g.dataset.loc)); g.addEventListener('mousemove', moveTip); g.addEventListener('mouseleave', hideTip); });
  }
  function renderMapMarkers() {
    const g = $('#map-markers'), mig = $('#map-mig'); if (!g) return; const k = mapK(), iv = 1 / k; let out = '', migOut = '';
    const journey = state.mode === 'journey'; const usedAt = {};
    for (let i = 0; i < EVENTS.length; i++) {
      const ev = EVENTS[i]; if (!matches(ev)) continue; let op = 1, near = false;
      if (journey) { const dy = Math.abs(ev.y - state.jt); if (dy > JW) continue; op = 0.3 + 0.7 * (1 - dy / JW); near = dy <= JW * 0.25; } else if (!(ev.y >= state.win[0] && ev.y <= state.win[1])) continue;
      const lk = ev.loc && ev.loc[0]; if (!lk || !LOCS[lk]) continue; const L = LOCS[lk];
      const n = (usedAt[lk] = (usedAt[lk] || 0) + 1); const ang = (n - 1) * 2.4, rad = n > 1 ? (5 + 1.8 * Math.sqrt(n)) * iv : 0;
      let [x, y] = proj(L.ll[0], L.ll[1]); x += rad * Math.cos(ang); y += rad * Math.sin(ang);
      const c = CATS[ev.cat]; const sel = state.sel === i; const sz = (journey ? (near ? 6.2 : 4.8) : (sel ? 6 : 4.4)) * iv;
      out += `<g class="map-marker${sel ? ' sel' : ''}" data-i="${i}" opacity="${op}">${near ? `<circle class="pulse-ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(7 * iv).toFixed(2)}" stroke-width="${(1.6 * iv).toFixed(2)}"/>` : ''}<circle fill="transparent" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(9 * iv).toFixed(2)}"/>${shapeSVG(c.shape, +x.toFixed(1), +y.toFixed(1), sz, c.c)}</g>`;
    }
    if (state.sel != null) { const ev = EVENTS[state.sel]; if (ev && ev.path && ev.path.length > 1) { const pts = ev.path.filter(k2 => LOCS[k2]).map(k2 => LOCS[k2].ll); migOut += `<path class="mig-path" stroke-width="${(2 * iv).toFixed(2)}" stroke-dasharray="${(6 * iv).toFixed(1)} ${(5 * iv).toFixed(1)}" d="${pathFrom(pts)}"/>`; const last = pts[pts.length - 1], prev = pts[pts.length - 2]; const [x2, y2] = proj(last[0], last[1]); const [x1, y1] = proj(prev[0], prev[1]); const a = Math.atan2(y2 - y1, x2 - x1); const s = 7 * iv; migOut += `<path fill="#7c611f" d="M${x2} ${y2} L${x2 - s * Math.cos(a - 0.42)} ${y2 - s * Math.sin(a - 0.42)} L${x2 - s * Math.cos(a + 0.42)} ${y2 - s * Math.sin(a + 0.42)} Z"/>`; } }
    if (state.mode === 'routes') { out = ''; migOut = renderRoute(iv); }
    mig.innerHTML = migOut; g.innerHTML = out;
    g.querySelectorAll('.map-marker').forEach(m => { m.addEventListener('click', e => { if (!mapDragging) { select(+m.dataset.i); e.stopPropagation(); } }); m.addEventListener('mouseenter', e => showTip(e, EVENTS[+m.dataset.i])); m.addEventListener('mousemove', moveTip); m.addEventListener('mouseleave', hideTip); });
  }

  /* ---- journeys (routes) ---- */
  const JOURNEYS = (opts.journeys || []);
  let rtTimer = null;
  function renderRoute(iv) {
    const j = JOURNEYS[state.route]; if (!j) return '';
    const pts = j.stops.map(st => st.ll); let out = `<path class="route-path" stroke="${j.color}" stroke-width="${(2.4 * iv).toFixed(2)}" d="${pathFrom(pts)}"/>`;
    j.stops.forEach((st, i) => { const [x, y] = proj(st.ll[0], st.ll[1]); const cur = i === state.stop; const done = i < state.stop; out += `<g class="route-stop${cur ? ' cur' : ''}" data-i="${i}"><circle cx="${x}" cy="${y}" r="${((cur ? 8 : 5.5) * iv).toFixed(2)}" fill="${done || cur ? j.color : 'var(--surface-1)'}" stroke="${j.color}" stroke-width="${(1.6 * iv).toFixed(2)}"/>${cur ? `<circle class="pulse-ring" cx="${x}" cy="${y}" r="${(9 * iv).toFixed(2)}" stroke="${j.color}" stroke-width="${(1.5 * iv).toFixed(2)}"/>` : ''}<text class="route-num" font-size="${(7.5 * iv).toFixed(2)}" x="${x}" y="${y + 2.6 * iv}" text-anchor="middle" fill="${done || cur ? '#fff' : j.color}">${i + 1}</text></g>`; });
    setTimeout(() => $('#mapsvg')?.querySelectorAll('.route-stop').forEach(el => { el.onclick = e => { if (!mapDragging) { stopRoute(); setStop(+el.dataset.i); e.stopPropagation(); } }; }), 0);
    return out;
  }
  function setRoute(i) { state.route = i; state.stop = 0; const j = JOURNEYS[i]; if (!j) return; $('#rt-select').value = i; $('#rt-era').textContent = j.era; fitRoute(j); renderMapMarkers(); renderStops(); showStop(); }
  function fitRoute(j) { const P = j.stops.map(st => proj(st.ll[0], st.ll[1])); const xs = P.map(p => p[0]), ys = P.map(p => p[1]); let w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys); w = Math.max(w * 1.6, 160); h = Math.max(h * 1.8, 100); const asp = MW / MH; if (w / h < asp) w = h * asp; else h = w / asp; w = Math.min(MW, w); h = Math.min(MH, h); let x = (Math.min(...xs) + Math.max(...xs)) / 2 - w / 2, y = (Math.min(...ys) + Math.max(...ys)) / 2 - h / 2; mapView = { x: Math.min(Math.max(x, 0), MW - w), y: Math.min(Math.max(y, 0), MH - h), w, h }; setMapViewBox(); renderMapBase(); }
  function setStop(i) { const j = JOURNEYS[state.route]; if (!j) return; state.stop = Math.max(0, Math.min(j.stops.length - 1, i)); renderMapMarkers(); renderStops(); showStop(); }
  function renderStops() { const j = JOURNEYS[state.route]; const box = $('#rt-stops'); if (!j || !box) return; box.innerHTML = j.stops.map((st, i) => `<span class="jchip${i === state.stop ? ' near' : ''}" data-i="${i}"><span class="y">${i + 1}</span>${esc(st.n)}</span>`).join(''); box.querySelectorAll('.jchip').forEach(ch => ch.onclick = () => { stopRoute(); setStop(+ch.dataset.i); }); const cur = box.querySelector('.jchip.near'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }
  function showStop() {
    const j = JOURNEYS[state.route]; if (!j) return; const st = j.stops[state.stop]; state.sel = null; renderTimeline();
    $('#detail-h').textContent = 'Journey'; $('#detail-idle').hidden = true;
    const r = st.ref; const bk = data.byId[r[0]]; const label = bk ? `${bk.abbr} ${r[1]}${r[2] ? ':' + r[2] : ''}` : '';
    const html = `<h3>${esc(j.name)}</h3><div class="meta-row"><span class="pill">${esc(j.era)}</span><span class="pill">stop ${state.stop + 1} of ${j.stops.length}</span></div><p class="summary" style="color:var(--ink-3);font-style:italic;font-family:var(--serif)">${esc(j.blurb)}</p><div class="route-card" style="border-color:${j.color}"><div class="rn" style="color:${j.color}">${state.stop + 1} · ${esc(st.n)}</div><p class="summary">${esc(st.t)}</p>${bk ? `<div class="read-links"><a href="#/read/${r[0]}/${r[1]}${r[2] ? '#v' + r[2] : ''}" data-nav="/read/${r[0]}/${r[1]}${r[2] ? '#v' + r[2] : ''}">Read ${esc(label)} →</a></div>` : ''}</div><div class="row" style="margin-top:10px;gap:6px"><button class="btn sm" id="rt-prev" ${state.stop === 0 ? 'disabled' : ''}>← previous stop</button><button class="btn sm solid" id="rt-next" ${state.stop >= j.stops.length - 1 ? 'disabled' : ''}>next stop →</button></div>`;
    const d = $('#detail-body'); d.innerHTML = html; wireNav(d); const pv = d.querySelector('#rt-prev'), nx = d.querySelector('#rt-next'); if (pv) pv.onclick = () => { stopRoute(); setStop(state.stop - 1); }; if (nx) nx.onclick = () => { stopRoute(); setStop(state.stop + 1); };
  }
  function stopRoute() { if (rtTimer) { clearInterval(rtTimer); rtTimer = null; } const b = $('#rt-play'); if (b) b.textContent = '▶'; }
  function playRoute() { const j = JOURNEYS[state.route]; if (!j) return; if (rtTimer) { stopRoute(); return; } if (state.stop >= j.stops.length - 1) state.stop = -1; $('#rt-play').textContent = '⏸'; setStop(state.stop + 1); rtTimer = setInterval(() => { if (state.stop >= j.stops.length - 1) { stopRoute(); return; } setStop(state.stop + 1); }, 2600); }
  if (JOURNEYS.length) { $('#rt-select').innerHTML = JOURNEYS.map((j, i) => `<option value="${i}">${esc(j.name)} — ${esc(j.era)}</option>`).join(''); $('#rt-select').onchange = e => { stopRoute(); setRoute(+e.target.value); }; $('#rt-play').onclick = playRoute; }

  /* ---- journey ---- */
  function setJourneyTime(t, fromSlider) { state.jt = Math.max(T0, Math.min(T1, t)); if (!fromSlider) $('#jr-slider').value = state.jt; $('#jr-year').textContent = fmtYear(state.jt); const era = ERAS.find(e => state.jt >= e.s && state.jt < e.e); $('#jr-era').textContent = era ? era.n : ''; renderMapMarkers(); renderJourneyChips(); }
  function renderJourneyChips() {
    const box = $('#journey-chips');
    const active = EVENTS.map((ev, i) => ({ ev, i, dy: Math.abs(ev.y - state.jt) })).filter(o => matches(o.ev) && o.dy <= JW).sort((a, b) => a.dy - b.dy).slice(0, 8);
    if (active.length) { box.innerHTML = active.map(o => `<span class="jchip${o.dy <= JW * 0.25 ? ' near' : ''}" data-i="${o.i}"><span class="y">${fmtYear(o.ev.y)}</span>${esc(o.ev.ttl)}</span>`).join(''); box.querySelectorAll('.jchip').forEach(ch => { ch.onclick = () => select(+ch.dataset.i); ch.addEventListener('mouseenter', e => showTip(e, EVENTS[+ch.dataset.i])); ch.addEventListener('mousemove', moveTip); ch.addEventListener('mouseleave', hideTip); }); }
    else { const next = EVENTS.map((ev, i) => ({ ev, i })).filter(o => matches(o.ev) && o.ev.y > state.jt).sort((a, b) => a.ev.y - b.ev.y)[0]; box.innerHTML = next ? `<span class="jr-empty">A quiet stretch of centuries… next: </span><span class="jchip" data-i="${next.i}"><span class="y">${fmtYear(next.ev.y)}</span>${esc(next.ev.ttl)}</span>` : `<span class="jr-empty">The story rests here.</span>`; const ch = box.querySelector('.jchip'); if (ch) ch.onclick = () => { setJourneyTime(EVENTS[+ch.dataset.i].y); select(+ch.dataset.i); }; }
  }
  function setMapMode(m) { state.mode = m; $('#map-mode').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $('#journey-bar').style.display = m === 'journey' ? '' : 'none'; $('#routes-bar').style.display = m === 'routes' ? '' : 'none'; if (m !== 'routes') stopRoute(); if (m === 'journey') { stopRoute(); setJourneyTime(state.jt); } else if (m === 'routes') { stopJourney(); if (state.route == null) setRoute(0); else { renderMapMarkers(); renderStops(); showStop(); } } else { stopJourney(); renderMapMarkers(); } }
  function stopJourney() { state.playing = false; if (jrTimer) { clearInterval(jrTimer); jrTimer = null; } const b = $('#jr-play'); if (b) b.textContent = '▶'; }
  $('#map-mode').querySelectorAll('button').forEach(b => b.onclick = () => setMapMode(b.dataset.m));
  $('#jr-slider').addEventListener('input', e => { stopJourney(); setJourneyTime(+e.target.value, true); });
  $('#jr-play').onclick = () => { if (state.playing) { stopJourney(); return; } state.playing = true; $('#jr-play').textContent = '⏸'; if (state.jt >= T1 - 5) state.jt = T0; jrTimer = setInterval(() => { const dense = EVENTS.some(ev => matches(ev) && Math.abs(ev.y - state.jt) <= JW); setJourneyTime(state.jt + (dense ? 3 : 9)); if (state.jt >= T1) stopJourney(); }, 90); };

  /* ---- detail ---- */
  function select(i) {
    if (state.mode === 'routes') setMapMode('range');
    state.sel = i; const ev = EVENTS[i];
    if (ev.y < state.win[0] || ev.y > state.win[1]) { const w = state.win[1] - state.win[0]; state.win = [Math.max(T0, ev.y - w / 2), Math.min(T1, ev.y + w / 2)]; renderOverview(); }
    renderTimeline(); renderMapMarkers(); renderDetail();
    if (window.innerWidth < 980) $('#detail-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderDetail() {
    const d = $('#detail-body'); $('#detail-idle').hidden = true; if (state.sel == null) return; const ev = EVENTS[state.sel]; const c = CATS[ev.cat]; const era = ERAS.find(e => ev.y >= e.s && ev.y < e.e);
    const locNames = (ev.loc || []).filter(k => LOCS[k]).map(k => LOCS[k].n).join(' · ');
    $('#detail-h').textContent = 'Event';
    const refs = uniqRefs(ev.refs);
    let html = `<h3>${esc(ev.ttl)}</h3><div class="meta-row"><span class="pill"><svg width="12" height="12">${shapeSVG(c.shape, 6, 6, 4.4, c.c, 'm')}</svg>${c.n}</span>${era ? `<span class="pill">${esc(era.n)}</span>` : ''}<span class="pill">${HIST[ev.h] || ''}</span>${locNames ? `<span class="pill">📍 ${esc(locNames)}</span>` : ''}${ev.evd ? `<span class="pill">🏺 <b>physical evidence</b></span>` : ''}${isEventRead(ev) ? `<span class="pill">✓ <b>read</b></span>` : ''}</div>`;
    if (refs.length) html += `<div class="read-links">${refs.map(r => `<a href="#/read/${r.b}/${r.c1}${r.v1 ? '#v' + r.v1 : ''}" data-nav="/read/${r.b}/${r.c1}${r.v1 ? '#v' + r.v1 : ''}">Read ${esc(refLabel(r))} →</a>`).join('')}</div>`;
    if (ev.art && artUrl(ev.art.wp)) html += `<div class="hero-art" style="margin-top:10px"><img src="${artUrl(ev.art.wp)}" alt="${esc(ev.art.t)}"><div class="art-cap">${esc(ev.art.t)}${ev.art.by ? ' — ' + esc(ev.art.by) : ''}</div></div>`;
    html += `<div class="dates"><b>${esc(ev.d)}</b>${ev.trad ? `<br>Traditional: ${esc(ev.trad)}` : ''}${ev.sch ? `<br>Scholarly: ${esc(ev.sch)}` : ''}</div><p class="summary">${esc(ev.sum)}</p>${ev.who && ev.who.length ? `<div class="who"><b>People:</b> ${esc(ev.who.join(', '))}</div>` : ''}`;
    if (ev.p) { if (ev.p.c) html += `<div class="persp"><div class="ph">✝ Christian reading</div>${esc(ev.p.c)}</div>`; if (ev.p.j) html += `<div class="persp"><div class="ph">✡ Jewish reading</div>${esc(ev.p.j)}</div>`; }
    if (ev.quotes && ev.quotes.length) html += `<div class="sect">In the texts</div>` + ev.quotes.map(q => `<div class="quote">“${esc(q.t)}”<div class="quote-src">${esc(q.s)}</div></div>`).join('');
    if (ev.evd && ev.evd.length) html += `<div class="sect">🏺 Artifacts &amp; evidence</div>` + ev.evd.map(x => `<div class="ev-item">${x.u ? `<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.n)}</a>` : `<b>${esc(x.n)}</b>`} — ${esc(x.d)}</div>`).join('');
    if (ev.links && ev.links.length) html += `<div class="links">${ev.links.map(l => `<a href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])} ↗</a>`).join('')}<a href="#/event/${ev.id}" data-nav="/event/${ev.id}">Full entry →</a></div>`;
    if (ev.path && ev.path.length > 1) html += `<div style="margin-top:8px;font-size:12px;color:var(--ink-3)">Route shown on the map: ${esc(ev.path.filter(k => LOCS[k]).map(k => LOCS[k].n).join(' → '))}</div>`;
    d.innerHTML = html; wireNav(d);
  }
  function showLocDetail(key) {
    const L = LOCS[key]; if (!L) return; if (state.mode === 'routes') setMapMode('range'); state.sel = null; renderTimeline(); renderMapMarkers();
    const evs = EVENTS.map((ev, i) => ({ ev, i })).filter(o => (o.ev.loc || []).includes(key)).sort((a, b) => a.ev.y - b.ev.y);
    $('#detail-h').textContent = 'Place';
    let html = `<h3>${esc(L.n)}</h3>${L.d ? `<p class="summary">${esc(L.d)}</p>` : ''}${L.wp && artUrl(L.wp) ? `<div class="hero-art"><img src="${artUrl(L.wp)}" alt="${esc(L.n)}"><div class="art-cap">${esc(L.n)}</div></div>` : ''}`;
    if (evs.length) html += `<div class="sect">What happened here</div><ul class="loc-events">` + evs.map(o => { const c = CATS[o.ev.cat]; return `<li data-i="${o.i}"><span class="yr">${esc(fmtYear(o.ev.y))}</span><svg width="11" height="11" style="flex:none;align-self:center">${shapeSVG(c.shape, 5.5, 5.5, 4, c.c, 'm')}</svg><span>${esc(o.ev.ttl)}</span></li>`; }).join('') + `</ul>`;
    else html += `<p class="summary" style="color:var(--ink-3)">No catalogued events at this exact spot — it appears along migration routes.</p>`;
    if (L.wp) html += `<div class="links"><a href="https://en.wikipedia.org/wiki/${esc(L.wp)}" target="_blank" rel="noopener">Wikipedia ↗</a></div>`;
    const d = $('#detail-body'); $('#detail-idle').hidden = true; d.innerHTML = html; d.querySelectorAll('.loc-events li').forEach(li => li.onclick = () => select(+li.dataset.i));
    if (window.innerWidth < 980) $('#detail-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function wireNav(el) { el.querySelectorAll('[data-nav]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.nav); })); }
  function renderIdleDetail() { $('#detail-h').textContent = 'Today'; $('#detail-body').innerHTML = ''; $('#detail-idle').hidden = false; renderIdle($('#detail-idle')); }

  function renderAll() { renderTimeline(); renderOverview(); renderMapMarkers(); if (state.sel != null) renderDetail(); }
  const onResize = () => { renderTimeline(); renderOverview(); };
  window.addEventListener('resize', onResize);

  renderMapBase(); renderAll(); renderIdleDetail();
  return {
    select, showLoc: showLocDetail, refresh: renderAll, idle: renderIdleDetail,
    showRoute(id) { const i = JOURNEYS.findIndex(j => j.id === id); if (i >= 0) { setMapMode('routes'); setRoute(i); setTimeout(() => $('.row2')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); } },
    destroy() { stopJourney(); stopRoute(); window.removeEventListener('resize', onResize); root.innerHTML = ''; },
  };
}
