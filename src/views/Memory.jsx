import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, useMemory, reviewCard, removeCard, addCard, loadText } from '../store';
import { speak, speechSupported } from '../speech';

const STARTER = [['JHN', 3, 16], ['PSA', 22, 1], ['MAT', 5, 3], ['ROM', 8, 28], ['PHP', 4, 13], ['ISA', 40, 31], ['GEN', 1, 1], ['JHN', 1, 1], ['MAT', 6, 9], ['1CO', 13, 4], ['PSA', 118, 105], ['JHN', 14, 6]];

// Memory verses with spaced repetition: the reference is shown, the text hidden until you recall it.
export default function Memory() {
  const m = useMemory();
  const [texts, setTexts] = useState({});
  const [reveal, setReveal] = useState(false);
  const [lang, setLang] = useState('all');
  const now = Date.now();
  const due = useMemo(() => m.cards.filter(c => c.due <= now && (lang === 'all' || c.lang === lang)).sort((a, b) => a.due - b.due), [m, now, lang]);
  const card = due[0];
  useEffect(() => { let on = true; const books = [...new Set(m.cards.map(c => c.b))]; Promise.all(books.flatMap(b => [loadText('drc', b).then(t => ['drc/' + b, t]), loadText('vul', b).then(t => ['vul/' + b, t])])).then(rs => on && setTexts(Object.fromEntries(rs))); return () => { on = false; }; }, [m]);
  useEffect(() => { setReveal(false); }, [card?.id]);
  const textOf = (c, tr) => { const t = texts[(tr === 'la' ? 'vul' : 'drc') + '/' + c.b]; if (!t) return '…'; return (t[c.c - 1] || []).slice(c.v1 - 1, c.v2).join(' '); };
  const ref = c => `${data.byId[c.b]?.name.replace(/\s*\(.*\)/, '')} ${c.c}:${c.v1}${c.v2 !== c.v1 ? '–' + c.v2 : ''}`;
  const nextDue = m.cards.filter(c => c.due > now).sort((a, b) => a.due - b.due)[0];
  return (
    <div className="page fade-in" style={{ maxWidth: 900 }}>
      <div className="eyebrow">Yours</div>
      <h1 className="title">Memory verses</h1>
      <p className="muted" style={{ lineHeight: 1.5, maxWidth: 680 }}>A deck of verses to learn by heart. Each card shows the reference; say the verse aloud, reveal it, and grade yourself — cards you know well come back less often, cards you miss come back sooner. Add any verse from its number in the reader.</p>
      <div className="row" style={{ margin: '10px 0' }}>
        <span className="chip gold">{m.cards.length} cards</span><span className="chip">{due.length} due now</span>
        <div className="seg"><button className={lang === 'all' ? 'on' : ''} onClick={() => setLang('all')}>All</button><button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button><button className={lang === 'la' ? 'on' : ''} onClick={() => setLang('la')}>Latin</button></div>
      </div>
      {card ? (
        <div className="card mem">
          <div className="eyebrow">{card.lang === 'la' ? 'Vulgata' : 'Douay-Rheims'} · {card.reps ? `seen ${card.reps} time${card.reps > 1 ? 's' : ''}` : 'new card'}</div>
          <div className="mem-ref">{ref(card)}</div>
          {!reveal ? <div className="mem-hidden"><button className="btn solid" onClick={() => setReveal(true)}>Reveal the verse</button><div className="help">Say it first. Then check.</div></div>
            : <div className="mem-text fade-in">{textOf(card, card.lang)}{speechSupported && <button className="btn sm ghost" onClick={() => speak([{ text: textOf(card, card.lang), lang: card.lang }], ref(card))}>▶ hear it</button>}</div>}
          {reveal && <div className="mem-grade">
            <button className="btn" onClick={() => reviewCard(card.id, 0)}><b>Again</b><small>10 min</small></button>
            <button className="btn" onClick={() => reviewCard(card.id, 1)}><b>Hard</b><small>{card.reps ? Math.max(1, Math.round(card.ivl * card.ease * 0.8)) : 1} d</small></button>
            <button className="btn solid" onClick={() => reviewCard(card.id, 2)}><b>Good</b><small>{card.reps === 0 ? 1 : card.reps === 1 ? 4 : Math.round(card.ivl * card.ease)} d</small></button>
            <button className="btn" onClick={() => reviewCard(card.id, 3)}><b>Easy</b><small>{card.reps === 0 ? 3 : card.reps === 1 ? 7 : Math.round(card.ivl * card.ease * 1.3)} d</small></button>
          </div>}
          <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}><Link className="small sans" to={`/read/${card.b}/${card.c}#v${card.v1}`}>Read in context →</Link><button className="btn sm ghost" onClick={() => removeCard(card.id)}>remove card</button></div>
        </div>
      ) : (
        <div className="card"><p style={{ margin: 0 }}>{m.cards.length ? <>All caught up. {nextDue && <>Next card due {new Date(nextDue.due).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}.</>}</> : 'Your deck is empty.'}</p>
          {!m.cards.length && <div style={{ marginTop: 10 }}><div className="help">Start with twelve verses everyone should know:</div><button className="btn solid" style={{ marginTop: 8 }} onClick={() => STARTER.forEach(([b, c, v]) => addCard(b, c, v, v, 'en'))}>Add the starter deck</button></div>}
        </div>
      )}
      {m.cards.length > 0 && <>
        <h2 className="title" style={{ fontSize: 19, margin: '22px 0 8px' }}>Your deck</h2>
        <div className="mem-list">{[...m.cards].sort((a, b) => a.due - b.due).map(c => <div key={c.id} className="mem-row"><Link to={`/read/${c.b}/${c.c}#v${c.v1}`}><b>{ref(c)}</b> <span className="chip" style={{ marginLeft: 6 }}>{c.lang === 'la' ? 'LA' : 'EN'}</span></Link><span className="muted small">{c.due <= now ? 'due now' : 'due ' + new Date(c.due).toLocaleDateString()} · interval {c.ivl} d</span><span className="mem-snip">{textOf(c, c.lang).slice(0, 90)}…</span><button className="btn sm ghost" onClick={() => removeCard(c.id)}>×</button></div>)}</div>
      </>}
    </div>
  );
}
