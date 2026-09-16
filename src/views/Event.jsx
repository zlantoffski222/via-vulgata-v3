import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { data } from '../store';
import { artUrl, eraFor, refLabel, HIST, CAT_NAMES } from '../util';
import MiniMap from '../components/MiniMap';
import ArtImg from '../components/ArtImg';

export default function Event() {
  const { id } = useParams(); const e = data.timeline.events[+id];
  if (!e) return <div className="page">No such event.</div>;
  const evs = data.timeline.events; const prev = evs[e.id - 1], next = evs[e.id + 1];
  const locs = [...new Set([...(e.path || []), ...e.loc])];
  return (
    <div className="page fade-in">
      <div className="event">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Link to="/timeline" className="muted small sans" style={{ textDecoration: 'none' }}>← Chronicle</Link>
          <span className="muted small sans">{prev && <Link to={`/event/${prev.id}`} style={{ marginRight: 12 }}>← {prev.ttl}</Link>}{next && <Link to={`/event/${next.id}`}>{next.ttl} →</Link>}</span>
        </div>
        {e.art && <div style={{ marginTop: 12 }}>
          <img className="big" src={artUrl(e.art.wp)} alt={e.art.t} />
          <div className="credit"><i>{e.art.t}</i>{e.art.by ? ` — ${e.art.by}` : ''}</div>
        </div>}
        <div className="eyebrow" style={{ marginTop: 16 }}>{eraFor(e.y).n} · {e.d}</div>
        <h1 className="title">{e.ttl}</h1>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="chip">{CAT_NAMES[e.cat]}</span><span className="chip">{HIST[e.h]}</span>
          {e.refs.map((r, i) => <Link key={i} className="chip gold" to={`/read/${r.b}/${r.c1}${r.v1 ? '#v' + r.v1 : ''}`} style={{ textDecoration: 'none' }}>Read {refLabel(r)}</Link>)}
        </div>
        <p className="body">{e.sum}</p>
        {(e.trad || e.sch) && <div className="card" style={{ marginTop: 10 }}>
          {e.trad && <p className="small" style={{ margin: 0 }}><span className="eyebrow">Traditional dating</span><br />{e.trad}</p>}
          {e.sch && <p className="small" style={{ marginTop: e.trad ? 10 : 0, marginBottom: 0 }}><span className="eyebrow">What historians say</span><br />{e.sch}</p>}
        </div>}
        {e.who?.length > 0 && <div className="row" style={{ marginTop: 12 }}><span className="eyebrow">People</span>{e.who.map(w => <span className="chip" key={w}>{w}</span>)}</div>}
        {e.quotes.length > 0 && <div style={{ marginTop: 14 }}>{e.quotes.map((q, i) => <div className="quote" key={i} style={{ fontSize: 18 }}>“{q.t}”<small>{q.s}</small></div>)}</div>}
        {e.p?.c && <div className="persp"><b>Christian reading</b>{e.p.c}</div>}
        {e.p?.j && <div className="persp"><b>Jewish reading</b>{e.p.j}</div>}
        {e.evd && <>
          <div className="eyebrow" style={{ marginTop: 18 }}>Sources & evidence</div>
          {e.evd.map((s, i) => <div className="src" key={i}><b>{s.n}</b> — {s.d} {s.u && <a href={s.u} target="_blank" rel="noreferrer">Read more ↗</a>}</div>)}
        </>}
        {locs.length > 0 && <>
          <div className="eyebrow" style={{ marginTop: 18 }}>Where</div>
          <MiniMap keys={locs} height={220} />
          {e.path && <div className="muted small" style={{ marginTop: 6 }}>Route: {e.path.map(k => data.timeline.locs[k]?.n).filter(Boolean).join(' → ')}</div>}
          {e.loc.map(k => { const L = data.timeline.locs[k]; return L && L.d ? <p key={k} style={{ lineHeight: 1.5 }}><b>{L.n}.</b> {L.d} <Link to={`/?loc=${k}`} className="small sans">Explore on the home map →</Link></p> : null; })}
        </>}
        {e.links.length > 0 && <><div className="eyebrow" style={{ marginTop: 18 }}>Further reading</div><div className="links">{e.links.map((l, i) => <a key={i} href={l[1]} target="_blank" rel="noreferrer">{l[0]} ↗</a>)}</div></>}
      </div>
    </div>
  );
}
