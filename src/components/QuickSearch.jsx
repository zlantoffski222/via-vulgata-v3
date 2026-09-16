import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { data, loadText } from '../store';
import Sheet from './Sheet';

// "/" anywhere: jump to a passage, a person, an event, a note — or search the Latin and English text.
let corpus = null;
async function loadCorpus() {
  if (corpus) return corpus; const out = { drc: {}, vul: {} };
  await Promise.all(data.books.flatMap(b => [loadText('drc', b.id).then(t => out.drc[b.id] = t), loadText('vul', b.id).then(t => out.vul[b.id] = t)]));
  corpus = out; return out;
}
export function parseRef(q) {
  const m = q.trim().match(/^((?:[123]\s*)?[A-Za-z][A-Za-z .]*?)\s*(\d+)?(?::(\d+))?$/); if (!m) return null;
  const name = m[1].replace(/\./g, '').replace(/\s+/g, ' ').trim().toLowerCase(); if (name.length < 2) return null;
  const book = data.books.find(b => [b.name, b.abbr, b.latin, b.name.replace(/\s*\(.*\)/, '')].some(n => n.toLowerCase() === name || n.toLowerCase().replace(/\s/g, '') === name.replace(/\s/g, '')))
    || data.books.find(b => b.name.toLowerCase().startsWith(name) || b.latin.toLowerCase().startsWith(name) || b.abbr.toLowerCase() === name);
  if (!book) return null; const c = m[2] ? Math.min(+m[2], book.chapters.length) : 1; return { book, c, v: m[3] ? +m[3] : null };
}

export default function QuickSearch({ open, onClose }) {
  const nav = useNavigate(); const [q, setQ] = useState(''); const [scope, setScope] = useState('all'); const [hits, setHits] = useState(null); const [busy, setBusy] = useState(false);
  const inp = useRef(null);
  useEffect(() => { if (open) { setQ(''); setHits(null); setTimeout(() => inp.current?.focus(), 50); } }, [open]);
  const ref = useMemo(() => q.length > 1 ? parseRef(q) : null, [q]);
  const go = to => { onClose(); nav(to); };
  const quick = useMemo(() => {
    const t = q.trim().toLowerCase(); if (t.length < 2) return [];
    const out = [];
    for (const p of data.people) if ((p.n + ' ' + (p.aka || []).join(' ') + ' ' + p.role).toLowerCase().includes(t)) out.push({ k: 'Person', t: p.n, s: p.role, to: `/people/${p.id}` });
    for (const e of data.timeline.events) if ((e.ttl + ' ' + (e.who || []).join(' ')).toLowerCase().includes(t)) out.push({ k: 'Event', t: e.ttl, s: e.d, to: `/event/${e.id}` });
    for (const [k, L] of Object.entries(data.timeline.locs)) if (L.n.toLowerCase().includes(t)) out.push({ k: 'Place', t: L.n, s: 'on the map', to: `/explore?loc=${k}` });
    for (const n of data.notes) if ((n.t + ' ' + n.n).toLowerCase().includes(t)) out.push({ k: 'Note', t: n.t, s: `${data.byId[n.b].abbr} ${n.c}:${n.v1}`, to: `/read/${n.b}/${n.c}#note${n.id}` });
    for (const it of data.prophecy) if (it.t.toLowerCase().includes(t)) out.push({ k: 'Prophecy', t: it.t, s: 'prophecy & fulfilment', to: '/prophecy' });
    for (const s of (data.harmony?.sections || [])) for (const it of s.items) if (it.t.toLowerCase().includes(t)) out.push({ k: 'Gospel scene', t: it.t, s: s.t, to: '/harmony' });
    return out.slice(0, 12);
  }, [q]);
  useEffect(() => {
    if (q.trim().length < 3 || ref || scope === 'index') { setHits(null); return; }
    let on = true; setBusy(true);
    const t = setTimeout(async () => {
      const c = await loadCorpus(); if (!on) return; const needle = q.trim().toLowerCase().replace(/æ/g, 'ae'); const out = [];
      for (const b of data.books) { const en = c.drc[b.id], la = c.vul[b.id];
        for (let ci = 0; ci < en.length && out.length < 150; ci++) for (let vi = 0; vi < Math.max(en[ci].length, la[ci]?.length || 0); vi++) {
          const e = scope === 'la' ? '' : (en[ci][vi] || ''), l = scope === 'en' ? '' : ((la[ci] && la[ci][vi]) || '');
          const lm = l && l.toLowerCase().replace(/æ/g, 'ae').replace(/œ/g, 'oe').includes(needle);
          if (e.toLowerCase().includes(needle) || lm) out.push({ b: b.id, c: ci + 1, v: vi + 1, t: e.toLowerCase().includes(needle) ? e : l });
        } if (out.length >= 150) break; }
      setHits(out); setBusy(false);
    }, 300);
    return () => { on = false; clearTimeout(t); };
  }, [q, ref, scope]);
  const mark = t => { const i = t.toLowerCase().indexOf(q.trim().toLowerCase()); if (i < 0) return t; return <>{t.slice(0, i)}<mark>{t.slice(i, i + q.trim().length)}</mark>{t.slice(i + q.trim().length)}</>; };
  return (
    <Sheet open={open} onClose={onClose} wide>
      <input ref={inp} type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="John 3:16 · Ps 22 · shepherd · misericordia · Moses · Jericho…" aria-label="Search" onKeyDown={e => { if (e.key === 'Enter' && ref) go(`/read/${ref.book.id}/${ref.c}${ref.v ? '#v' + ref.v : ''}`); }} />
      <div className="seg" style={{ marginTop: 8 }}><button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>Everything</button><button className={scope === 'en' ? 'on' : ''} onClick={() => setScope('en')}>English</button><button className={scope === 'la' ? 'on' : ''} onClick={() => setScope('la')}>Latin</button><button className={scope === 'index' ? 'on' : ''} onClick={() => setScope('index')}>People, events, notes</button></div>
      <div className="results" style={{ marginTop: 10 }}>
        {ref && <button className="result" onClick={() => go(`/read/${ref.book.id}/${ref.c}${ref.v ? '#v' + ref.v : ''}`)}>Open <b>{ref.book.name} {ref.c}{ref.v ? ':' + ref.v : ''}</b> <span className="muted">· {ref.book.latin} · Enter</span></button>}
        {scope !== 'en' && scope !== 'la' && quick.map((h, i) => <button key={i} className="result" onClick={() => go(h.to)}><span className="eyebrow">{h.k}</span><div><b>{h.t}</b> <span className="muted small">· {h.s}</span></div></button>)}
        {busy && !ref && <div className="muted small">Searching the text…</div>}
        {hits && <><div className="muted small">{hits.length >= 150 ? '150+' : hits.length} verses</div>{hits.map((h, i) => <button key={i} className="result" onClick={() => go(`/read/${h.b}/${h.c}#v${h.v}`)}><span className="eyebrow">{data.byId[h.b].abbr} {h.c}:{h.v}</span><div>{mark(h.t)}</div></button>)}</>}
        {!q && <div className="help">Type a reference to jump, or a word to search. Latin search ignores æ/ae. Press Esc to close.</div>}
      </div>
    </Sheet>
  );
}
