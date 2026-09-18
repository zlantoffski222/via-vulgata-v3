import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { data } from '../store';
import ArtImg from '../components/ArtImg';
import ArtViewer from '../components/ArtViewer';
import { eraFor } from '../util';

// The museum: every painting the app carries, in the order of the story it tells, each with its event and chapter.
export default function Gallery() {
  const [open, setOpen] = useState(null); const [q, setQ] = useState('');
  const items = useMemo(() => data.timeline.events.filter(e => e.art && data.timeline.artFiles[e.art.wp]).sort((a, b) => a.y - b.y), []);
  const shown = q ? items.filter(e => (e.art.t + ' ' + (e.art.by || '') + ' ' + e.ttl).toLowerCase().includes(q.toLowerCase())) : items;
  const byEra = {}; for (const e of shown) { const era = eraFor(e.y).n; (byEra[era] ||= []).push(e); }
  return (
    <div className="page fade-in gallery">
      <div className="eyebrow">The gallery</div>
      <h1 className="title">The paintings</h1>
      <p className="lede">{items.length} works from Wikimedia Commons, all public domain — Michelangelo, Caravaggio, Rembrandt, Raphael, Bruegel, Doré and the rest — hung in the order of the story they tell. Tap one to see it large, with the passage it illustrates. The same pictures drift behind every page as the gallery wall.</p>
      <input className="inp" placeholder="Search a painter, a title, a scene…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 420, marginBottom: 14 }} />
      {Object.entries(byEra).map(([era, evs]) => (
        <section key={era} style={{ marginBottom: 18 }}>
          <div className="section-h"><span className="eyebrow">{era}</span></div>
          <div className="gal-grid">
            {evs.map(e => <button key={e.id} className="gal-item" onClick={() => setOpen(e)}>
              <div className="pic"><ArtImg wp={e.art.wp} alt={e.art.t} loading="lazy" /></div>
              <div className="in"><div className="h">{e.art.t}</div><div className="muted small">{e.art.by ? e.art.by + ' · ' : ''}{e.ttl}</div></div>
            </button>)}
          </div>
        </section>
      ))}
      {open && <ArtViewer ev={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
