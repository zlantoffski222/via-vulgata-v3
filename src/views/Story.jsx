import React, { useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { data, useProgress, useSettings, settingsStore, chapterDone, stopStatus, stopChapters, nextStop } from '../store';
import ArtImg from '../components/ArtImg';
import MiniMap from '../components/MiniMap';
import { byId as diagramsById } from '../diagrams';
import { useIsMobile } from '../hooks';

const chLabel = ([b, c1, c2]) => `${data.byId[b].name.replace(/\s*\(.*\)/, '')} ${c1}${c2 !== c1 ? '–' + c2 : ''}`;

// The whole path: eleven parts, ninety-odd stops, from the first light to the last Amen.
export default function Story() {
  const p = useProgress(); const s = useSettings(); const mobile = useIsMobile();
  const S = data.story; const stops = S.stops; if (!stops.length) return <div className="page"><p className="muted">The story is not loaded.</p></div>;
  const statuses = stops.map(st => stopStatus(p, st));
  const doneStops = statuses.filter(x => x.complete).length;
  const uniq = new Map(); for (const st of stops) for (const ch of stopChapters(st)) uniq.set(ch.b + ':' + ch.c, ch); const chTotal = uniq.size, chDone = [...uniq.values()].filter(ch => chapterDone(p, data.byId[ch.b], ch.c)).length;
  const nxt = nextStop(p); const cur = nxt || stops[stops.length - 1]; const curSt = stopStatus(p, cur);
  const listRef = useRef(null);
  useEffect(() => { const el = document.getElementById('stop-' + cur.n); if (el && doneStops > 0) el.scrollIntoView({ block: 'center' }); }, []); // eslint-disable-line
  return (
    <div className="page fade-in story">
      <div className="story-hero card">
        <div className="story-hero-pic"><ArtImg wp={cur.art} alt="" /></div>
        <div className="in">
          <div className="eyebrow">The story</div>
          <h1 className="title">The Bible, read as one story</h1>
          <p className="lede">From the first light to the last Amen in {stops.length} stops — each a few chapters, with its painting, its place on the map, its diagram, and two short notes: where we are, and what to watch for. Read it like a novel. Everything else in the app is one tap away when you want to go deeper.</p>
          <div className="story-progress">
            <div className="bar"><i style={{ width: `${(chDone / chTotal) * 100}%` }} /></div>
            <div className="muted small">{doneStops} of {stops.length} stops · {chDone} of {chTotal} chapters on the path</div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn solid" to={`/story/${cur.n}`}>{doneStops === 0 ? 'Begin at the beginning' : curSt.done ? `Continue — stop ${cur.n}` : `Next stop — ${cur.n}`}</Link>
            {s.plan !== 'story' && <button className="btn" onClick={() => settingsStore.set({ plan: 'story' })}>Make it my reading plan</button>}
            {s.plan === 'story' && <span className="chip gold">Your reading plan</span>}
          </div>
        </div>
      </div>

      <div className="path" ref={listRef}>
        {S.parts.map((part, pi) => (
          <section key={pi} className="path-part">
            <div className="path-part-h"><div className="eyebrow">Part {pi + 1}</div><h2 className="h2">{part.t}</h2><div className="muted small">{part.sub}</div></div>
            {stops.filter(st => st.part === pi).map(st => { const x = statuses[st.n - 1]; const isCur = st.n === cur.n; return (
              <Link key={st.id} id={'stop-' + st.n} to={`/story/${st.n}`} className={'stop-row' + (x.complete ? ' done' : '') + (isCur ? ' cur' : '')}>
                <div className="node"><span>{x.complete ? '✓' : st.n}</span></div>
                <div className="pic"><ArtImg wp={st.art} alt="" loading="lazy" /></div>
                <div className="in">
                  <div className="h">{st.t}</div>
                  <div className="muted small">{st.d} · {st.r.map(chLabel).join(', ')}</div>
                  {!mobile && <div className="d">{st.before}</div>}
                  {x.done > 0 && !x.complete && <div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${(x.done / x.total) * 100}%` }} /></div>}
                </div>
              </Link>); })}
          </section>
        ))}
      </div>
    </div>
  );
}

// One stop: the painting, where we are, what to watch for, the map, the reading.
export function Stop() {
  const { n } = useParams(); const nav = useNavigate(); const p = useProgress(); const mobile = useIsMobile();
  const S = data.story; const st = S.stops[+n - 1];
  useEffect(() => { window.scrollTo(0, 0); }, [n]);
  if (!st) return <div className="page"><p className="muted">No such stop.</p><Link to="/story" className="btn sm ghost">The story</Link></div>;
  const x = stopStatus(p, st); const prev = S.stops[st.n - 2], next = S.stops[st.n];
  const part = S.parts[st.part]; const ev = st.ev != null ? data.timeline.events.find(e => e.id === st.ev) : null; const dg = st.dg ? diagramsById[st.dg] : null;
  const chs = stopChapters(st); const first = x.next || chs[0];
  const readLink = ch => `/read/${ch.b}/${ch.c}?story=${st.n}`;
  return (
    <div className="page fade-in story stop-page">
      <div className="stop-hero">
        <ArtImg wp={st.art} alt="" />
        <div className="in">
          <div className="eyebrow"><Link to="/story">The story</Link> · part {st.part + 1}, {part.t} · stop {st.n} of {S.stops.length}</div>
          <h1 className="title">{st.t}</h1>
          <div className="sub">{st.d}{st.loc && st.loc.length ? ' · ' + st.loc.map(k => data.timeline.locs[k]?.n).filter(Boolean).join(', ') : ''}</div>
        </div>
      </div>

      <div className="stop-grid">
        <div className="stop-main">
          <div className="card"><h2 className="ch">Where we are</h2><p className="stop-p">{st.before}</p></div>
          <div className="card"><h2 className="ch">What to watch for</h2><p className="stop-p">{st.watch}</p></div>
          {(st.who && st.who.length > 0) && <div className="row" style={{ gap: 6 }}>{st.who.map(id => { const pp = data.people.find(q => q.id === id); return pp ? <Link key={id} to={`/people/${id}`} className="chip">{pp.n}</Link> : null; })}</div>}
          {(dg || ev) && <div className="stop-links">
            {dg && <Link to={`/diagrams/${dg.id}`} className="dg-link"><div className="dg-thumb">{dg.svg(null, () => {})}</div><div className="in"><div className="eyebrow">Diagram</div><div className="h">{dg.n}</div><div className="muted small">{dg.sub}</div></div></Link>}
            {ev && <Link to={`/event/${ev.id}`} className="ev-link"><div className="eyebrow">On the timeline</div><div className="h">{ev.ttl}</div><div className="muted small">{ev.d}</div></Link>}
          </div>}
        </div>
        <div className="stop-side">
          {st.loc && st.loc.length > 0 && <div className="card" style={{ padding: 8 }}><MiniMap keys={st.loc} height={mobile ? 160 : 200} /></div>}
          <div className="card">
            <h2 className="ch">The reading <span className="hint">{x.done}/{x.total} read</span></h2>
            <div className="stop-chs">
              {chs.map(ch => <Link key={ch.b + ch.c} to={readLink(ch)} className={'stop-ch' + (chapterDone(p, data.byId[ch.b], ch.c) ? ' done' : '')}><span>{data.byId[ch.b].name.replace(/\s*\(.*\)/, '')} {ch.c}</span><i>{chapterDone(p, data.byId[ch.b], ch.c) ? '✓' : '→'}</i></Link>)}
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <Link className="btn solid" to={readLink(first)}>{x.done === 0 ? 'Start reading' : x.complete ? 'Read it again' : 'Continue reading'}</Link>
            </div>
            {st.also && st.also.length > 0 && <>
              <div className="idx-h" style={{ marginTop: 14 }}>If you want the rest</div>
              <div className="row" style={{ gap: 6 }}>{st.also.map((r, i) => <Link key={i} to={`/read/${r[0]}/${r[1]}`} className="chip">{chLabel(r)}</Link>)}</div>
            </>}
          </div>
        </div>
      </div>

      <div className="card stop-then">
        <div className="eyebrow">Then</div>
        <p className="stop-p">{st.after}</p>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
          {prev ? <Link className="btn sm ghost" to={`/story/${prev.n}`}>← {prev.n}. {prev.t}</Link> : <span />}
          {next ? <Link className={'btn sm' + (x.complete ? ' solid' : '')} to={`/story/${next.n}`}>Next stop: {next.t} →</Link> : <Link className="btn sm" to="/story">Back to the beginning</Link>}
        </div>
      </div>
    </div>
  );
}
