import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { data } from '../store';
import ArtImg from '../components/ArtImg';
import Passage from '../components/Passage';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const RANK = { solemnity: 'Solemnity', feast: 'Feast', memorial: 'Memorial', optional: 'Optional memorial', trad: 'Traditional calendar' };
const todayKey = () => { const d = new Date(); return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const pretty = k => { const [m, d] = k.split('-'); return `${MONTHS[+m - 1]} ${+d}`; };

// The calendar of saints, one for every day: browse by month, search by name.
export default function Saints() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (ql) return data.saints.filter(s => (s.n + ' ' + s.t + ' ' + s.b).toLowerCase().includes(ql));
    return data.saints.filter(s => +s.d.slice(0, 2) === month + 1);
  }, [month, q]);
  const tk = todayKey();
  return (
    <div className="page fade-in">
      <div className="eyebrow">The calendar of saints</div>
      <h1 className="title">A saint for every day</h1>
      <p className="lede">Three hundred and sixty-six lives, from the apostles to the martyrs of the last century, each with a short account and, where the Church gives one, the Scripture read on the day. The current Roman calendar first; older feasts kept by the traditional calendar are marked.</p>
      <div className="saints-tools">
        <input className="inp" placeholder="Search a name — Augustine, Thérèse, Polycarp…" value={q} onChange={e => setQ(e.target.value)} />
        {!q && <div className="seg wrap">{MONTHS.map((m, i) => <button key={m} className={i === month ? 'on' : ''} onClick={() => setMonth(i)}>{m.slice(0, 3)}</button>)}</div>}
      </div>
      <div className="saints-list">
        {list.map(s => <Link key={s.d} to={`/saints/${s.d}`} className={'saint-row' + (s.d === tk ? ' today' : '')}>
          <div className="pic"><ArtImg wp={s.wp} alt="" loading="lazy" /></div>
          <div className="in">
            <div className="eyebrow">{pretty(s.d)}{s.d === tk ? ' · today' : ''} · {RANK[s.r]}</div>
            <div className="h">{s.n}</div>
            <div className="t">{s.t}{s.y ? ` · † ${s.y}` : ''}</div>
          </div>
        </Link>)}
        {!list.length && <p className="muted">No saint matches that.</p>}
      </div>
    </div>
  );
}

// One saint: portrait, life, and the readings of the day.
export function Saint() {
  const { d } = useParams();
  const i = data.saints.findIndex(s => s.d === d); const s = data.saints[i];
  if (!s) return <div className="page"><p className="muted">No entry for that day.</p><Link to="/saints" className="btn sm ghost">All saints</Link></div>;
  const prev = data.saints[(i + data.saints.length - 1) % data.saints.length], next = data.saints[(i + 1) % data.saints.length];
  return (
    <div className="page fade-in saint-page">
      <div className="saint-hero">
        <div className="pic"><ArtImg wp={s.wp} alt={s.n} /></div>
        <div className="in">
          <div className="eyebrow">{pretty(s.d)} · {RANK[s.r]}</div>
          <h1 className="title">{s.n}</h1>
          <div className="t">{s.t}{s.y ? ` · died ${s.y}` : ''}</div>
          <p className="b">{s.b}</p>
          {s.r === 'trad' && <p className="muted small">Kept on the traditional (1962) calendar; the current Roman calendar has moved or omitted this feast.</p>}
        </div>
      </div>
      {s.refs && s.refs.length > 0 && <div className="card" style={{ marginTop: 14 }}>
        <h2 className="ch">Scripture for the day <span className="hint">the readings proper to this feast</span></h2>
        {s.refs.map((r, k) => <Passage key={k} r={r} max={8} />)}
      </div>}
      <div className="saint-nav">
        <Link to={`/saints/${prev.d}`} className="btn sm ghost">← {prev.n}</Link>
        <Link to="/saints" className="btn sm ghost">All saints</Link>
        <Link to={`/saints/${next.d}`} className="btn sm ghost">{next.n} →</Link>
      </div>
    </div>
  );
}
