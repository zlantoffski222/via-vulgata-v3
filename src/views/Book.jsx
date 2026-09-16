import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { data, useProgress, bookProgress, chapterDone, readSet } from '../store';
import { eventsForChapter, artUrl } from '../util';
import ArtImg from '../components/ArtImg';

export default function Book() {
  const { id } = useParams(); const p = useProgress();
  const b = data.byId[id]; if (!b) return <div className="page">No such book.</div>;
  const ctx = data.context[id] || {};
  const x = bookProgress(p, b);
  const next = (() => { for (let c = 1; c <= b.chapters.length; c++) if (!chapterDone(p, b, c)) return c; return 1; })();
  const evs = data.timeline.events.filter(e => e.refs.some(r => r.b === id)).sort((a, z) => a.y - z.y);
  const hero = evs.find(e => e.art);
  return (
    <div className="page fade-in">
      <Link to="/books" className="muted small sans" style={{ textDecoration: 'none' }}>← Index</Link>
      <div className="hero" style={{ minHeight: 220, marginTop: 10 }}>
        {hero && <ArtImg wp={hero.art.wp} alt="" />}
        <div className="in">
          <div className="eyebrow">{b.testament === 'OT' ? 'Vetus Testamentum' : 'Novum Testamentum'} · {b.group}</div>
          <h1 className="title">{b.name}</h1>
          <div className="muted"><i>{b.latin}</i> · {b.chapters.length} chapters · {b.verses.toLocaleString()} verses</div>
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn solid" to={`/read/${id}/${next}`}>{x.read ? `Continue at chapter ${next}` : 'Begin reading'}</Link>
            <span className="chip gold">{Math.round(x.pct * 100)}% read</span>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div>
          <div className="eyebrow">Chapters</div>
          <div className="chapters">
            {b.chapters.map((n, i) => { const c = i + 1; const done = chapterDone(p, b, c); const r = readSet(p, id, c).size; const hasArt = eventsForChapter(id, c).some(e => e.art);
              return <Link key={c} to={`/read/${id}/${c}`} className={(done ? 'done' : r ? 'part' : '') + (hasArt ? ' art' : '')} style={{ '--p': `${Math.round(r / n * 100)}%` }} title={`${r}/${n} verses`}>{c}</Link>; })}
          </div>
          <div className="muted small" style={{ marginTop: 8 }}>A red dot marks a chapter with art and sources.</div>
        </div>
        <div className="card">
          <div className="eyebrow">Setting the scene</div>
          {ctx.what && <p style={{ lineHeight: 1.5 }}>{ctx.what}</p>}
          {ctx.when && <><h4 className="eyebrow" style={{ marginTop: 12 }}>When</h4><p className="small" style={{ lineHeight: 1.5 }}>{ctx.when}</p></>}
          {ctx.where && <><h4 className="eyebrow" style={{ marginTop: 12 }}>Where</h4><p className="small" style={{ lineHeight: 1.5 }}>{ctx.where}</p></>}
          {ctx.who && <><h4 className="eyebrow" style={{ marginTop: 12 }}>Who speaks</h4><p className="small" style={{ lineHeight: 1.5 }}>{ctx.who}</p></>}
          {ctx.people && <div className="row" style={{ marginTop: 10 }}>{ctx.people.map(n => <span className="chip" key={n}>{n}</span>)}</div>}
        </div>
      </div>

      {evs.length > 0 && <>
        <div className="hr" />
        <div className="eyebrow">On the timeline</div>
        <div className="chronicle" style={{ marginTop: 10 }}>
          {evs.map(e => <Link key={e.id} to={`/event/${e.id}`} className={'tl-ev c-' + e.cat + (e.art ? ' has-img' : '')}>
            {e.art && <ArtImg wp={e.art.wp} alt="" loading="lazy" />}
            <div><div className="y">{e.d}</div><div className="h">{e.ttl}</div><div className="s">{e.sum}</div></div>
          </Link>)}
        </div>
      </>}
    </div>
  );
}
