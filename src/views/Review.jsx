import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { data, useProgress, useNotes, useMemory, bookProgress, chaptersRead, stopStatus } from '../store';
import { makeStore } from '../store';
import { useSyncExternalStore } from 'react';

const quizStore = makeStore('vv.quiz', { best: {}, played: 0, right: 0, daily: {} });

// The year in review: what you have read, when, and where you lingered.
export default function Review() {
  const p = useProgress(); const n = useNotes(); const m = useMemory(); const q = useSyncExternalStore(quizStore.subscribe, quizStore.get);
  const year = new Date().getFullYear();
  const st = useMemo(() => {
    const books = data.books;
    let verses = 0; const perBook = books.map(b => { const x = bookProgress(p, b); verses += x.read; return { b, ...x }; });
    const done = perBook.filter(x => x.pct >= 1).length; const chs = chaptersRead(p, books);
    const log = (p.log || []).filter(x => x.d.startsWith(String(year))); const days = log.length; const marks = log.reduce((a, x) => a + x.n, 0);
    const set = new Set(log.map(x => x.d)); let best = 0, cur = 0; const d0 = new Date(year, 0, 1); const today = new Date();
    for (let d = new Date(d0); d <= today; d.setDate(d.getDate() + 1)) { const k = d.toISOString().slice(0, 10); if (set.has(k)) { cur++; best = Math.max(best, cur); } else cur = 0; }
    const busiest = [...log].sort((a, b) => b.n - a.n)[0];
    const months = Array.from({ length: 12 }, (_, i) => log.filter(x => +x.d.slice(5, 7) === i + 1).reduce((a, x) => a + x.n, 0));
    const hlByBook = {}; for (const k of Object.keys(n.hl)) { const b = k.split(':')[0]; hlByBook[b] = (hlByBook[b] || 0) + 1; }
    const topHl = Object.entries(hlByBook).sort((a, b) => b[1] - a[1])[0];
    const topRead = [...perBook].filter(x => x.read > 0).sort((a, b) => b.read - a.read).slice(0, 5);
    const stops = data.story.stops.filter(s => stopStatus(p, s).complete).length;
    const dailyPlayed = Object.keys(q.daily || {}).length; const dailyScore = Object.values(q.daily || {}).reduce((a, x) => a + x.score, 0);
    return { verses, done, chs, days, marks, best, busiest, months, topHl, topRead, stops, notes: Object.keys(n.notes).length, hls: Object.keys(n.hl).length, cards: m.cards.length, dailyPlayed, dailyScore };
  }, [p, n, m, q, year]);
  const MN = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']; const mx = Math.max(1, ...st.months);
  const share = async () => { const text = `My year with the Bible on Christ is King (${year}): ${st.verses.toLocaleString()} verses, ${st.chs} chapters, ${st.done} books finished, ${st.days} days of reading, longest streak ${st.best} days.\nhttps://christ-is-king-bible.github.io/`; try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); alert('Copied.'); } } catch {} };
  return (
    <div className="page fade-in review">
      <div className="eyebrow">Your year</div>
      <h1 className="title">{year} in review</h1>
      <p className="lede">Everything here lives only in this browser (Settings can sync it between devices). Nothing is sent anywhere unless you press share.</p>
      <div className="home-row three" style={{ marginTop: 0 }}>
        <div className="card"><h2 className="ch">Read</h2><div className="cont-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><b>{st.verses.toLocaleString()}</b><span>verses</span></div><div><b>{st.chs}</b><span>chapters</span></div><div><b>{st.done}</b><span>books finished</span></div><div><b>{st.stops}</b><span>story stops</span></div></div></div>
        <div className="card"><h2 className="ch">When</h2><div className="cont-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><b>{st.days}</b><span>days this year</span></div><div><b>{st.best}</b><span>longest streak</span></div><div><b>{st.marks}</b><span>things marked</span></div><div><b>{st.busiest ? new Date(st.busiest.d + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</b><span>busiest day</span></div></div>
          <div className="months">{st.months.map((v, i) => <div key={i} className="mo"><i style={{ height: `${Math.round((v / mx) * 100)}%` }} /><span>{MN[i]}</span></div>)}</div></div>
        <div className="card"><h2 className="ch">Kept</h2><div className="cont-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><b>{st.hls}</b><span>highlights</span></div><div><b>{st.notes}</b><span>notes</span></div><div><b>{st.cards}</b><span>memory verses</span></div><div><b>{st.dailyPlayed ? `${st.dailyScore}/${st.dailyPlayed * 5}` : '—'}</b><span>daily quizzes</span></div></div>
          {st.topHl && <div className="muted small" style={{ marginTop: 8 }}>Most highlighted: <b>{data.byId[st.topHl[0]]?.name}</b> ({st.topHl[1]})</div>}</div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="ch">Where you have been <span className="hint">— the books you read most</span></h2>
        {st.topRead.length ? <div className="stop-chs">{st.topRead.map(x => <Link key={x.b.id} to={`/book/${x.b.id}`} className="stop-ch"><span>{x.b.name}</span><i>{x.read.toLocaleString()} verses · {Math.round(x.pct * 100)}%</i></Link>)}</div> : <p className="muted">Nothing marked yet — open a chapter and tap the verses as you read, or press M to mark a chapter.</p>}
      </div>
      <div className="row" style={{ marginTop: 14 }}><button className="btn solid" onClick={share}>Share your year</button><Link className="btn" to="/journey">The journey →</Link></div>
    </div>
  );
}
