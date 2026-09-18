import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { data, getJson, withBase } from '../store';
import ArtImg from '../components/ArtImg';
import Passage from '../components/Passage';

let cache = null;
function useLists() { const [L, setL] = useState(cache); useEffect(() => { if (cache) return; getJson('/data/lists.json').then(j => { cache = j; setL(j); }).catch(() => setL([])); }, []); return L; }
const refLabel = ([b, c, v1, v2]) => `${data.byId[b].abbr} ${c}:${v1}${v2 && v2 !== v1 ? '–' + v2 : ''}`;
function artFor(ref) { if (!ref) return null; const evs = (data.eventsByChapter[ref[0] + ':' + ref[1]] || []).filter(e => e.art); return evs[0] ? evs[0].art : null; }

// The lists people want by heart: parables, miracles, commandments, beatitudes, the I AM sayings, the last words, the apostles.
export default function Lists() {
  const { id } = useParams(); const nav = useNavigate(); const L = useLists();
  const [open, setOpen] = useState(null);
  useEffect(() => { setOpen(null); window.scrollTo(0, 0); }, [id]);
  if (!L) return <div className="page"><p className="muted">Loading…</p></div>;
  const cur = L.find(x => x.id === id) || L[0];
  const numbered = ['commandments', 'beatitudes', 'lastwords'].includes(cur.id);
  return (
    <div className="page fade-in lists">
      <div className="eyebrow">By heart</div>
      <h1 className="title">{cur.t}</h1>
      <div className="seg wrap" style={{ margin: '8px 0 12px' }}>{L.map(x => <button key={x.id} className={x.id === cur.id ? 'on' : ''} onClick={() => nav('/lists/' + x.id)}>{x.t.replace(/^The /, '')}</button>)}</div>
      <p className="lede">{cur.intro}</p>
      {cur.refs && <div className="row" style={{ gap: 6, marginBottom: 14 }}>{cur.refs.map((r, i) => <Link key={i} to={`/read/${r[0]}/${r[1]}#v${r[2]}`} className="chip">{refLabel(r)}</Link>)}</div>}
      <div className={'list-items' + (numbered ? ' numbered' : '')}>
        {cur.items.map((it, i) => {
          const refs = it.refs || (it.ref ? [it.ref] : []); const art = artFor(refs[0]); const isOpen = open === i;
          return (
            <div key={i} className={'list-item' + (isOpen ? ' open' : '') + (art ? ' has-art' : '')} onClick={() => refs.length && setOpen(isOpen ? null : i)} role={refs.length ? 'button' : undefined} tabIndex={refs.length ? 0 : undefined}>
              {numbered && <div className="num">{i + 1}</div>}
              {art && <div className="pic"><ArtImg wp={art.wp} alt="" loading="lazy" /></div>}
              <div className="in">
                <div className="h">{it.n}</div>
                {it.k && <div className="k">{it.k}</div>}
                {refs.length > 0 && <div className="row" style={{ gap: 6, marginTop: 6 }}>{refs.map((r, j) => <Link key={j} to={`/read/${r[0]}/${r[1]}#v${r[2]}`} className="chip" onClick={e => e.stopPropagation()}>{refLabel(r)}</Link>)}</div>}
                {isOpen && refs[0] && <div onClick={e => e.stopPropagation()} style={{ marginTop: 8 }}><Passage r={refs[0]} max={10} /></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
