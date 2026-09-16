import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { data } from '../store';
import { artUrl, fmtYear, refLabel, CAT_NAMES } from '../util';
import ArtImg from '../components/ArtImg';
const uniqRefs = rs => rs.filter((r, i) => rs.findIndex(x => x.b === r.b && x.c1 === r.c1) === i);

export default function Timeline() {
  const { eras, events } = data.timeline;
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const vis = events.filter(e => (cat === 'all' || e.cat === cat) && (!q || (e.ttl + ' ' + e.sum + ' ' + (e.who || []).join(' ')).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="page fade-in">
      <div className="eyebrow">Chronicle</div>
      <h1 className="title">From Creation to the Vulgate</h1>
      <p className="muted" style={{ maxWidth: 680, lineHeight: 1.5 }}>Every event in the story, in order, with the art that remembers it and the passage that tells it. Dates before about 1000 BC follow the traditional chronology.</p>
      <div className="ribbon" style={{ marginTop: 10 }}>
        {eras.map(er => <a key={er.n} href={'#era-' + er.n.replace(/\W+/g, '-')}>{er.n}</a>)}
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          <button className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>All</button>
          {Object.entries(CAT_NAMES).map(([k, n]) => <button key={k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>{n}</button>)}
        </div>
        <input type="search" placeholder="Search events, people…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 260 }} aria-label="Search events" />
      </div>
      {eras.map(er => {
        const list = vis.filter(e => e.y >= er.s && e.y < er.e); if (!list.length) return null;
        return (
          <section className="era" key={er.n} id={'era-' + er.n.replace(/\W+/g, '-')}>
            <div className="era-h"><h2 className="title">{er.n}</h2><span className="rng">{fmtYear(er.s)} – {fmtYear(er.e)}</span></div>
            <div className="chronicle">
              {list.map(e => (
                <Link key={e.id} to={`/event/${e.id}`} className={'tl-ev c-' + e.cat + (e.art ? ' has-img' : '')}>
                  {e.art && <ArtImg wp={e.art.wp} alt="" loading="lazy" />}
                  <div>
                    <div className="y">{e.d}</div>
                    <div className="h">{e.ttl}</div>
                    <div className="s">{e.sum}</div>
                    <div className="refs">{uniqRefs(e.refs).slice(0, 2).map((r, i) => <span className="chip gold" key={i} style={{ marginRight: 5 }}>{refLabel(r)}</span>)}{e.evd && <span className="chip">{e.evd.length} source{e.evd.length > 1 ? 's' : ''}</span>}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
