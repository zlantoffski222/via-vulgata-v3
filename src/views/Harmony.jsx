import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { data, useProgress, chapterDone, readSet } from '../store';

const G = ['MAT', 'MRK', 'LUK', 'JHN'];
const NAMES = { MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John' };

// A harmony of the four Gospels: every scene in the life of Christ with its parallel passages.
export default function Harmony() {
  const p = useProgress(); const [only, setOnly] = useState('all');
  const sections = data.harmony?.sections || [];
  const isRead = (b, r) => { const book = data.byId[b]; if (!book) return false; if (r[1] === 1 && r[2] >= book.chapters[r[0] - 1]) return chapterDone(p, book, r[0]); const set = readSet(p, b, r[0]); for (let v = r[1]; v <= r[2]; v++) if (!set.has(v)) return false; return true; };
  let total = 0, done = 0;
  for (const s of sections) for (const it of s.items) { total++; if (G.some(b => it[b] && isRead(b, it[b]))) done++; }
  return (
    <div className="page fade-in">
      <div className="eyebrow">Study</div>
      <h1 className="title">A harmony of the Gospels</h1>
      <p className="muted" style={{ maxWidth: 720, lineHeight: 1.5 }}>The life of Christ as one story, scene by scene, with each evangelist's telling side by side. Matthew, Mark and Luke share most of their material (the 'Synoptics'); John tells largely his own. A scene is counted as read once you have read it in any one Gospel.</p>
      <div className="row" style={{ margin: '10px 0' }}>
        <div className="seg"><button className={only === 'all' ? 'on' : ''} onClick={() => setOnly('all')}>All scenes</button><button className={only === 'syn' ? 'on' : ''} onClick={() => setOnly('syn')}>In 3+ Gospels</button><button className={only === 'jhn' ? 'on' : ''} onClick={() => setOnly('jhn')}>Only in John</button><button className={only === 'todo' ? 'on' : ''} onClick={() => setOnly('todo')}>Unread</button></div>
        <span className="chip gold">{done} of {total} scenes read</span>
      </div>
      <div className="harm-head"><span /> {G.map(b => <span key={b}>{NAMES[b]}</span>)}</div>
      {sections.map(s => {
        const items = s.items.filter(it => { const n = G.filter(b => it[b]).length; const rd = G.some(b => it[b] && isRead(b, it[b])); return only === 'all' || (only === 'syn' && n >= 3) || (only === 'jhn' && it.JHN && n === 1) || (only === 'todo' && !rd); });
        if (!items.length) return null;
        return (
          <section key={s.t} className="harm-sec">
            <h2 className="harm-t">{s.t}</h2>
            {items.map(it => { const rd = G.some(b => it[b] && isRead(b, it[b])); return (
              <div key={it.t} className={'harm-row' + (rd ? ' done' : '')}>
                <div className="harm-scene">{rd && <span className="tick">✓</span>}{it.t}</div>
                {G.map(b => { const r = it[b]; if (!r) return <span key={b} className="harm-cell empty">·</span>; const lab = `${r[0]}:${r[1]}${r[2] !== r[1] ? '–' + r[2] : ''}`; return <Link key={b} className={'harm-cell' + (isRead(b, r) ? ' rd' : '')} to={`/read/${b}/${r[0]}#v${r[1]}`}>{lab}</Link>; })}
              </div>); })}
          </section>
        );
      })}
    </div>
  );
}
