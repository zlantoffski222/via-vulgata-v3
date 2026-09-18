import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { data } from '../store';
import ArtImg from './ArtImg';
import Passage from './Passage';

// A painting full-screen, with its title, painter and date, and the passage it illustrates.
export default function ArtViewer({ ev, wp, title, by, ref, onClose }) {
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); document.body.classList.add('sheet-open'); return () => { window.removeEventListener('keydown', k); document.body.classList.remove('sheet-open'); }; }, [onClose]);
  const art = ev ? ev.art : { wp, t: title, by };
  const r = ref || (ev && ev.refs && ev.refs[0] ? [ev.refs[0].b, ev.refs[0].c1, 1, Math.min(6, data.byId[ev.refs[0].b].chapters[ev.refs[0].c1 - 1])] : null);
  return createPortal(
    <div className="artview" onClick={onClose}>
      <button className="ib x" onClick={onClose} aria-label="Close">×</button>
      <div className="artview-pic" onClick={e => e.stopPropagation()}><ArtImg wp={art.wp} alt={art.t} /></div>
      <div className="artview-cap" onClick={e => e.stopPropagation()}>
        <div className="h">{art.t}</div>
        <div className="muted">{art.by}{art.by && ev ? ' · ' : ''}{ev ? `${ev.ttl} · ${ev.d}` : ''}</div>
        {r && <Passage r={r} max={4} />}
        <div className="row" style={{ gap: 8, marginTop: 8 }}>{ev && <Link to={`/event/${ev.id}`} className="btn sm" onClick={onClose}>The event →</Link>}<Link to="/gallery" className="btn sm ghost" onClick={onClose}>The gallery</Link></div>
      </div>
    </div>, document.body);
}
