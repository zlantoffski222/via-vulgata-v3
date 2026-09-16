import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, useProgress, bookProgress, loadText } from '../store';

const GROUPS_OT = ['Pentateuch', 'Historical Books', 'Wisdom Books', 'Prophets'];
const GROUPS_NT = ['Gospels', 'Acts', 'Pauline Letters', 'Catholic Letters', 'Apocalypse'];

let corpus = null; // { drc: {id: chapters[]}, vul: {...} }
async function loadCorpus() {
  if (corpus) return corpus;
  const out = { drc: {}, vul: {} };
  await Promise.all(data.books.flatMap(b => [loadText('drc', b.id).then(t => out.drc[b.id] = t), loadText('vul', b.id).then(t => out.vul[b.id] = t)]));
  corpus = out; return out;
}
// parse a reference like "Gen 3:15", "1 Kings 18", "Psalm 22", "John 3"
function parseQuery(q) {
  const m = q.trim().match(/^((?:[123]\s*)?[A-Za-z][A-Za-z .]*?)\s*(\d+)?(?::(\d+))?$/);
  if (!m) return null;
  const name = m[1].replace(/\./g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const book = data.books.find(b => [b.name, b.abbr, b.latin, b.name.replace(/\s*\(.*\)/, '')].some(n => n.toLowerCase() === name || n.toLowerCase().replace(/\s/g, '') === name.replace(/\s/g, '')))
    || data.books.find(b => b.name.toLowerCase().startsWith(name) || b.latin.toLowerCase().startsWith(name));
  if (!book) return null;
  const c = m[2] ? Math.min(+m[2], book.chapters.length) : 1;
  return { book, c, v: m[3] ? +m[3] : null };
}

export default function Books() {
  const p = useProgress();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState(null);
  const [busy, setBusy] = useState(false);
  const ref = useMemo(() => q.length > 1 ? parseQuery(q) : null, [q]);

  useEffect(() => {
    if (q.trim().length < 3 || ref) { setHits(null); return; }
    let on = true; setBusy(true);
    const t = setTimeout(async () => {
      const c = await loadCorpus(); if (!on) return;
      const needle = q.trim().toLowerCase(); const out = [];
      for (const b of data.books) {
        const en = c.drc[b.id], la = c.vul[b.id];
        for (let ci = 0; ci < en.length && out.length < 200; ci++) for (let vi = 0; vi < Math.max(en[ci].length, la[ci]?.length || 0); vi++) {
          const e = en[ci][vi] || '', l = (la[ci] && la[ci][vi]) || '';
          if (e.toLowerCase().includes(needle) || l.toLowerCase().includes(needle)) out.push({ b: b.id, c: ci + 1, v: vi + 1, t: e.toLowerCase().includes(needle) ? e : l });
        }
        if (out.length >= 200) break;
      }
      setHits(out); setBusy(false);
    }, 350);
    return () => { on = false; clearTimeout(t); };
  }, [q, ref]);

  const mark = (t) => { const i = t.toLowerCase().indexOf(q.trim().toLowerCase()); if (i < 0) return t; return <>{t.slice(0, i)}<mark>{t.slice(i, i + q.trim().length)}</mark>{t.slice(i + q.trim().length)}</>; };

  return (
    <div className="page fade-in">
      <div className="eyebrow">Index</div>
      <h1 className="title">Biblia Sacra Vulgata</h1>
      <div className="search" style={{ marginTop: 14 }}>
        <input type="search" placeholder="Go to a passage (John 3:16, Ps 22) or search the text…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" />
        {ref && <div className="results"><Link className="result" to={`/read/${ref.book.id}/${ref.c}${ref.v ? '#v' + ref.v : ''}`}>Open <b>{ref.book.name} {ref.c}{ref.v ? ':' + ref.v : ''}</b> <span className="muted">· {ref.book.latin}</span></Link></div>}
        {busy && !ref && q.trim().length >= 3 && <div className="muted small" style={{ marginTop: 8 }}>Searching both texts…</div>}
        {hits && <div className="results">
          <div className="muted small">{hits.length >= 200 ? '200+' : hits.length} verses</div>
          {hits.map((h, i) => <Link key={i} className="result" to={`/read/${h.b}/${h.c}#v${h.v}`}><span className="eyebrow">{data.byId[h.b].abbr} {h.c}:{h.v}</span><div>{mark(h.t)}</div></Link>)}
        </div>}
      </div>
      {!hits && !ref && <>
        <Testament label="Old Testament" latin="Vetus Testamentum" groups={GROUPS_OT} p={p} />
        <Testament label="New Testament" latin="Novum Testamentum" groups={GROUPS_NT} p={p} />
      </>}
    </div>
  );
}

function Testament({ label, latin, groups, p }) {
  return (
    <section className="testament">
      <div className="eyebrow">{latin}</div>
      <h2 className="title" style={{ fontSize: 22 }}>{label}</h2>
      {groups.map(g => (
        <div className="group" key={g}>
          <h3>{g}</h3>
          <div className="books">
            {data.books.filter(b => b.group === g).map(b => { const x = bookProgress(p, b); return (
              <Link key={b.id} className={'book' + (x.pct >= 1 ? ' done' : '')} to={`/book/${b.id}`}>
                <div className="en">{b.name}</div>
                <div className="la">{b.latin} · {b.chapters.length} {b.chapters.length === 1 ? 'chapter' : 'chapters'}</div>
                <div className="bar"><i style={{ width: `${x.pct * 100}%` }} /></div>
              </Link>); })}
          </div>
        </div>
      ))}
    </section>
  );
}
