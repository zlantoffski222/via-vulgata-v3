import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { data, useProgress, chapterDone } from '../store';
import { fmtYear, eraFor } from '../util';
import ArtImg from '../components/ArtImg';
import MiniMap from '../components/MiniMap';

const refLabel = ([b, c1, c2]) => { const bk = data.byId[b]; return `${bk ? bk.abbr : b} ${c1}${c2 !== c1 ? '–' + c2 : ''}`; };

export default function People() {
  const [q, setQ] = useState('');
  const list = useMemo(() => data.people.filter(p => !q || (p.n + ' ' + p.role + ' ' + (p.aka || []).join(' ')).toLowerCase().includes(q.toLowerCase())), [q]);
  const groups = [['Patriarchs & the Exodus', p => p.y < -1200], ['Judges, kings & prophets', p => p.y >= -1200 && p.y < -300], ['Between the Testaments', p => p.y >= -300 && p.y < -40], ['The Gospels', p => p.y >= -40 && p.y < 30], ['The early Church', p => p.y >= 30]];
  return (
    <div className="page fade-in">
      <div className="eyebrow">Index</div>
      <h1 className="title">People of the Bible</h1>
      <p className="muted" style={{ maxWidth: 680, lineHeight: 1.5 }}>Every person here links to the chapters where they appear, the events on the timeline, and the places they walked. Portraits are drawn from the art in your collection and from Wikimedia Commons.</p>
      <input type="search" placeholder="Search people…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 360, marginTop: 10 }} aria-label="Search people" />
      {groups.map(([g, f]) => { const ps = list.filter(f); if (!ps.length) return null; return (
        <section className="group" key={g}><h3>{g}</h3>
          <div className="people">{ps.map(p => <PersonCard key={p.id} p={p} />)}</div>
        </section>); })}
    </div>
  );
}
function PersonCard({ p }) {
  const ev = p.events.map(i => data.timeline.events[i]).find(e => e && e.art);
  return (
    <Link to={`/people/${p.id}`} className="person">
      <div className="pic">{ev ? <ArtImg wp={ev.art.wp} alt="" loading="lazy" /> : <ArtImg wp={p.wp} alt="" loading="lazy" />}</div>
      <div><div className="h">{p.n}</div><div className="r">{p.role}</div><div className="y">{fmtYear(p.y)}{p.events.length ? ` · ${p.events.length} event${p.events.length > 1 ? 's' : ''}` : ''}</div></div>
    </Link>
  );
}

export function Person() {
  const { id } = useParams(); const p = data.people.find(x => x.id === id); const prog = useProgress();
  if (!p) return <div className="page">No such person.</div>;
  const evs = p.events.map(i => data.timeline.events[i]).filter(Boolean).sort((a, b) => a.y - b.y);
  const hero = evs.find(e => e.art);
  const locs = [...new Set(evs.flatMap(e => [...(e.loc || []), ...(e.path || [])]))].filter(k => data.timeline.locs[k]);
  const chapters = p.refs.flatMap(([b, c1, c2]) => Array.from({ length: c2 - c1 + 1 }, (_, i) => ({ b, c: c1 + i })));
  const readN = chapters.filter(x => data.byId[x.b] && chapterDone(prog, data.byId[x.b], x.c)).length;
  const idx = data.people.indexOf(p); const prev = data.people[idx - 1], next = data.people[idx + 1];
  return (
    <div className="page fade-in">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Link to="/people" className="muted small sans" style={{ textDecoration: 'none' }}>← People</Link>
        <span className="muted small sans">{prev && <Link to={`/people/${prev.id}`} style={{ marginRight: 12 }}>← {prev.n}</Link>}{next && <Link to={`/people/${next.id}`}>{next.n} →</Link>}</span>
      </div>
      <div className="hero" style={{ minHeight: 260, marginTop: 10 }}>
        {hero ? <ArtImg wp={hero.art.wp} alt="" /> : <ArtImg wp={p.wp} alt="" />}
        <div className="in">
          <div className="eyebrow">{p.role} · {fmtYear(p.y)}</div>
          <h1 className="title">{p.n}</h1>
          <div className="muted"><i>{p.la}</i>{hero ? ` · ${hero.art.t}${hero.art.by ? ', ' + hero.art.by : ''}` : ''}</div>
        </div>
      </div>
      <div className="grid2">
        <div>
          <p className="body" style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.6 }}>{p.b}</p>
          <div className="eyebrow" style={{ marginTop: 18 }}>In the text · {readN}/{chapters.length} chapters read</div>
          <div className="bar" style={{ margin: '6px 0 10px', maxWidth: 360 }}><i style={{ width: `${chapters.length ? readN / chapters.length * 100 : 0}%` }} /></div>
          <div className="row">{p.refs.map((r, i) => <Link key={i} className="chip gold" to={`/read/${r[0]}/${r[1]}`} style={{ textDecoration: 'none' }}>{refLabel(r)}</Link>)}</div>
          {evs.length > 0 && <>
            <div className="eyebrow" style={{ marginTop: 22 }}>On the timeline</div>
            <div className="chronicle" style={{ marginTop: 8 }}>
              {evs.map(e => <Link key={e.id} to={`/event/${e.id}`} className={'tl-ev c-' + e.cat + (e.art ? ' has-img' : '')}>
                {e.art && <ArtImg wp={e.art.wp} alt="" loading="lazy" />}
                <div><div className="y">{e.d} · {eraFor(e.y).n}</div><div className="h">{e.ttl}</div><div className="s">{e.sum}</div></div>
              </Link>)}
            </div>
          </>}
        </div>
        <div>
          {locs.length > 0 && <div className="card"><div className="eyebrow">Places</div><div style={{ marginTop: 8 }}><MiniMap keys={locs} height={220} /></div>
            <div className="row" style={{ marginTop: 8 }}>{locs.map(k => <Link key={k} className="chip" to={`/explore?loc=${k}`} style={{ textDecoration: 'none' }}>{data.timeline.locs[k].n}</Link>)}</div></div>}
          {p.wp && <div className="links" style={{ marginTop: 12 }}><a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(p.wp)}`} target="_blank" rel="noreferrer">Wikipedia ↗</a></div>}
        </div>
      </div>
    </div>
  );
}
