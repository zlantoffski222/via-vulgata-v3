import React from 'react';
import { Link } from 'react-router-dom';
import { data } from '../store';
import { artUrl, eraFor, refLabel, HIST } from '../util';
import MiniMap from './MiniMap';
import ArtImg from './ArtImg';
import { diagramsFor } from '../diagrams';

export default function ContextPanel({ book, c, evs }) {
  const ctx = data.context[book.id] || {};
  const locKeys = [...new Set(evs.flatMap(e => e.loc))];
  return (
    <div>
      <div className="eyebrow">{book.name} {c}</div>
      {diagramsFor(book.id, c).map(d => <Link key={d.id} to={`/diagrams/${d.id}`} className="dg-link"><div className="dg-thumb">{d.svg(null, () => {})}</div><div className="in"><div className="eyebrow">Diagram</div><div className="h">{d.n}</div><div className="muted small">{d.sub}</div></div></Link>)}
      {evs.length > 0 ? <>
        <h4>What happens here</h4>
        {evs.map(e => (
          <div className="ev-card" key={e.id}>
            {e.art && <Link to={`/event/${e.id}`}><ArtImg wp={e.art.wp} alt={e.art.t} loading="lazy" /></Link>}
            <div className="in">
              <div className="h">{e.ttl}</div>
              <div className="d">{e.d} · {eraFor(e.y).n} · {HIST[e.h]}</div>
              <div className="s">{e.sum}</div>
              {e.who?.length > 0 && <div className="row" style={{ marginTop: 8, gap: 5 }}>{e.who.map(w => <span className="chip" key={w}>{w}</span>)}</div>}
              {e.quotes.map((q, i) => <div className="quote" key={i}>“{q.t}”<small>{q.s}</small></div>)}
              {e.art && <div className="d" style={{ marginTop: 6 }}><i>{e.art.t}</i>{e.art.by ? `, ${e.art.by}` : ''}</div>}
              <div className="links" style={{ marginTop: 6 }}>
                {e.refs.map((r, i) => <Link key={i} to={`/read/${r.b}/${r.c1}${r.v1 ? '#v' + r.v1 : ''}`}>{refLabel(r)}</Link>)}
                <Link to={`/event/${e.id}`}>Full entry →</Link>
              </div>
            </div>
          </div>
        ))}
        {evs.some(e => e.evd) && <>
          <h4>Sources & evidence</h4>
          {evs.flatMap(e => (e.evd || []).map((s, i) => <div className="src" key={e.id + '-' + i}><b>{s.n}</b> — {s.d} {s.u && <a href={s.u} target="_blank" rel="noreferrer">Read more ↗</a>}</div>))}
        </>}
        {locKeys.length > 0 && <>
          <h4>Where</h4>
          <MiniMap keys={locKeys} />
          {locKeys.map(k => { const L = data.timeline.locs[k]; return L && L.d ? <p key={k} className="small"><b>{L.n}.</b> {L.d} <Link to={`/?loc=${k}`}>Explore →</Link></p> : null; })}
        </>}
        <h4>Further reading</h4>
        <div className="links">{evs.flatMap(e => e.links.map((l, i) => <a key={e.id + i} href={l[1]} target="_blank" rel="noreferrer">{l[0]} ↗</a>))}</div>
      </> : <p className="muted" style={{ marginTop: 8 }}>No timeline event is pinned to this chapter. The notes below set the scene for the whole book; use <b>Ask</b> for who is speaking and what is happening in this passage.</p>}

      {(data.notesByChapter[book.id + ':' + c] || []).length > 0 && <>
        <h4>Passages worth knowing</h4>
        {(data.notesByChapter[book.id + ':' + c] || []).map(n => <div className="src" key={n.id}><b>{n.t}</b> <span className="muted small sans">{book.abbr} {n.c}:{n.v1}{n.v2 !== n.v1 ? '–' + n.v2 : ''}</span><div style={{ marginTop: 4 }}>{n.n}</div></div>)}
      </>}
      <h4>About {book.name}</h4>
      {ctx.what && <p>{ctx.what}</p>}
      {ctx.when && <><h4>When</h4><p className="small">{ctx.when}</p></>}
      {ctx.where && <><h4>Where</h4><p className="small">{ctx.where}</p></>}
      {ctx.who && <><h4>Who speaks</h4><p className="small">{ctx.who}</p></>}
      {ctx.people && <div className="row" style={{ marginTop: 8, gap: 5 }}>{ctx.people.map(n => <span className="chip" key={n}>{n}</span>)}</div>}
    </div>
  );
}
