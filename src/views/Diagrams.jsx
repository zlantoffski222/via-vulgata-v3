import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DIAGRAMS, byId } from '../diagrams';
import Passage, { refLabel } from '../components/Passage';

// The gallery: every diagram as a small card.
export default function Diagrams() {
  return (
    <div className="page fade-in">
      <div className="eyebrow">Diagrams</div>
      <h1 className="title">See what the text describes</h1>
      <p className="lede">Plans, maps and pictures drawn to the measurements in the text — the Tabernacle and the Temples, the Ark, the city Jesus walked, the tribes' land, the two kingdoms. Tap any part of a drawing to read what it was and open the verses that describe it. The reader shows the right diagram beside the chapters it belongs to.</p>
      <div className="dg-grid">
        {DIAGRAMS.map(d => <Link key={d.id} to={`/diagrams/${d.id}`} className="dg-card">
          <div className="dg-thumb">{d.svg(null, () => {})}</div>
          <div className="in"><div className="h">{d.n}</div><div className="muted small">{d.sub}</div></div>
        </Link>)}
      </div>
    </div>
  );
}

// One diagram with its parts. Also embeddable (embed=true) inside the reader.
export function DiagramView({ id, embed = false }) {
  const d = byId[id]; const [active, setActive] = useState(null);
  useEffect(() => { setActive(null); }, [id]);
  if (!d) return null;
  const part = d.parts.find(p => p.id === active);
  return (
    <div className={'dg-view' + (embed ? ' embed' : '')}>
      <div className="dg-pic" onClick={() => setActive(null)}>{d.svg(active, setActive)}</div>
      <div className="dg-side">
        {part ? <div className="dg-part fade-in">
          <div className="eyebrow">{d.n}</div>
          <h3 className="h">{part.n}</h3>
          <p>{part.t}</p>
          {part.ref && <Passage r={part.ref} max={embed ? 3 : 8} />}
          <div className="row" style={{ gap: 6 }}><button className="btn sm ghost" onClick={() => setActive(null)}>← All parts</button></div>
        </div> : <div className="dg-parts">
          {!embed && <div className="eyebrow" style={{ marginBottom: 6 }}>Tap a part of the drawing, or a name here</div>}
          {d.parts.map(p => <button key={p.id} className="dg-pb" onClick={() => setActive(p.id)}><span className="h">{p.n}</span>{p.ref && <span className="muted small">{refLabel(p.ref)}</span>}</button>)}
        </div>}
      </div>
    </div>
  );
}

export function Diagram() {
  const { id } = useParams(); const d = byId[id];
  if (!d) return <div className="page"><p className="muted">No such diagram.</p><Link to="/diagrams" className="btn sm ghost">All diagrams</Link></div>;
  const i = DIAGRAMS.indexOf(d); const prev = DIAGRAMS[(i + DIAGRAMS.length - 1) % DIAGRAMS.length], next = DIAGRAMS[(i + 1) % DIAGRAMS.length];
  return (
    <div className="page fade-in">
      <div className="eyebrow"><Link to="/diagrams">Diagrams</Link> · {d.era}</div>
      <h1 className="title">{d.n}</h1>
      <div className="muted" style={{ marginBottom: 8 }}>{d.sub}</div>
      <p className="lede">{d.intro}</p>
      <DiagramView id={id} />
      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="ch">Read it in the text <span className="hint">the passages behind the drawing</span></h2>
        {d.refs.map((r, k) => <Passage key={k} r={r} max={6} />)}
      </div>
      <div className="saint-nav"><Link to={`/diagrams/${prev.id}`} className="btn sm ghost">← {prev.n}</Link><Link to="/diagrams" className="btn sm ghost">All diagrams</Link><Link to={`/diagrams/${next.id}`} className="btn sm ghost">{next.n} →</Link></div>
    </div>
  );
}
