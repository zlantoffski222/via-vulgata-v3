import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { data, useSettings, settingsStore, setNote, useNotes, vkey } from '../store';
import { liturgicalDay } from '../lectionary';
import Passage, { refLabel } from '../components/Passage';

const useP = () => data.prayers;

// Latin on the left, English on the right — or one at a time on a phone.
function LangSeg() {
  const s = useSettings(); const mode = s.prayerLang || 'both';
  return <div className="seg">{[['both', 'Latin & English'], ['la', 'Latin'], ['en', 'English']].map(([id, n]) => <button key={id} className={mode === id ? 'on' : ''} onClick={() => settingsStore.set({ prayerLang: id })}>{n}</button>)}</div>;
}
export function PrayerText({ p, open = true }) {
  const s = useSettings(); const mode = s.prayerLang || 'both';
  const la = p.la && (mode !== 'en'), en = p.en && (mode !== 'la' || !p.la);
  return (
    <div className={'prayer-text' + (la && en ? ' two' : '')}>
      {la && <div className="la">{p.la.split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>}
      {en && <div className="en">{p.en.split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>}
    </div>
  );
}

// The index: every prayer, plus the four guided ways of praying.
export default function Prayer() {
  const P = useP(); const loc = useLocation(); const [open, setOpen] = useState(() => (loc.hash || '').slice(1) || null);
  useEffect(() => { const h = (loc.hash || '').slice(1); if (h) { setOpen(h); setTimeout(() => document.getElementById('p-' + h)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60); } }, [loc.hash]);
  if (!P) return <div className="page"><p className="muted">Loading…</p></div>;
  const today = new Date(); const set = P.rosary.sets.find(x => x.id === P.rosary.days[String(today.getDay())]);
  const easterTide = liturgicalDay(today).season === 'Easter';
  const ways = [
    ['/prayer/rosary', 'The Rosary', `Today: ${set.n}`, 'Twenty mysteries, each with the Gospel passage it meditates on.'],
    ['/prayer/stations', 'The Way of the Cross', 'fourteen stations', 'From Pilate\'s court to the tomb, each station with its Scripture.'],
    ['/prayer/mercy', 'Divine Mercy Chaplet', 'the three o\'clock hour', 'Prayed on Rosary beads, with John 19 and Luke 23.'],
    ['/prayer/lectio', 'Lectio divina', 'fifteen minutes', 'Read, reflect, pray, rest — a timed sitting with today\'s Gospel.'],
  ];
  return (
    <div className="page fade-in prayer-page">
      <div className="eyebrow">Prayer</div>
      <h1 className="title">The prayers of the Church</h1>
      <p className="lede">The common prayers in the Latin the Church has prayed for fifteen centuries, with the English beside them; and four guided ways of praying with Scripture. Tap a prayer to open it.</p>
      <div className="study-grid" style={{ marginBottom: 18 }}>{ways.map(([to, t, sub, d]) => <Link key={to} to={to} className="study"><div className="h">{t}</div><div className="sub">{sub}</div><div className="d">{d}</div></Link>)}</div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 className="h2" style={{ margin: 0 }}>Common prayers</h2><LangSeg />
      </div>
      <div className="prayer-list">
        {P.prayers.map(p => {
          const isOpen = open === p.id; const hint = p.id === 'angelus' && easterTide ? 'In Eastertide, pray the Regina Caeli instead' : p.id === 'regina' && !easterTide ? 'Prayed in place of the Angelus from Easter to Pentecost' : '';
          return (
            <div key={p.id} id={'p-' + p.id} className={'prayer' + (isOpen ? ' open' : '')}>
              <button className="ph" onClick={() => setOpen(isOpen ? null : p.id)}>
                <div><div className="h">{p.n}</div>{p.sub && <div className="muted small">{p.sub}</div>}</div>
                <span className="chev">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <div className="pb">
                {hint && <div className="help" style={{ marginBottom: 8 }}>{hint}</div>}
                <PrayerText p={p} />
                {p.refs && p.refs.length > 0 && <div className="prefs">{p.refs.map((r, i) => <Passage key={i} r={r} max={6} />)}</div>}
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// The Rosary: today's mysteries by default, any set on request, the Gospel of each mystery beneath it.
export function Rosary() {
  const P = useP(); const today = new Date();
  const [setId, setSetId] = useState(() => P?.rosary.days[String(today.getDay())]);
  const [openM, setOpenM] = useState(0);
  if (!P) return null;
  const set = P.rosary.sets.find(x => x.id === setId); const isToday = setId === P.rosary.days[String(today.getDay())];
  const find = id => P.prayers.find(p => p.id === id);
  return (
    <div className="page fade-in prayer-page">
      <div className="eyebrow"><Link to="/prayer">Prayer</Link> · The Rosary</div>
      <h1 className="title">{set.n}</h1>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center', margin: '8px 0 12px' }}>
        <div className="seg wrap">{P.rosary.sets.map(x => <button key={x.id} className={x.id === setId ? 'on' : ''} onClick={() => { setSetId(x.id); setOpenM(0); }}>{x.n.replace('The ', '').replace(' Mysteries', '')}</button>)}</div>
        <span className="muted small">{set.when}{isToday ? ' — today' : ''}</span>
        <LangSeg />
      </div>
      <p className="lede">{P.rosary.intro}</p>
      <div className="ros-open">
        <details><summary>The opening prayers — Sign of the Cross, Creed, Our Father, three Hail Marys, Glory Be</summary>
          {['signum', 'credo-ap', 'pater', 'ave', 'gloria'].map(id => { const p = find(id); return p && <div key={id} className="ros-p"><div className="eyebrow">{p.n}</div><PrayerText p={p} /></div>; })}
        </details>
      </div>
      <ol className="mysteries">
        {set.m.map((m, i) => (
          <li key={i} className={'mystery' + (openM === i ? ' open' : '')}>
            <button className="mh" onClick={() => setOpenM(openM === i ? -1 : i)}>
              <span className="num">{['I', 'II', 'III', 'IV', 'V'][i]}</span>
              <span className="in"><span className="h">{m.n}</span><span className="muted small">{refLabel(m.ref)} · fruit of the mystery: {m.fruit}</span></span>
            </button>
            {openM === i && <div className="mb">
              <Passage r={m.ref} />
              <div className="help">Read the passage, then an Our Father, ten Hail Marys and a Glory Be, holding the scene in mind. Many add the Fatima prayer: <i>O my Jesus, forgive us our sins…</i></div>
            </div>}
          </li>
        ))}
      </ol>
      <div className="ros-open">
        <details><summary>The closing prayers — Hail, Holy Queen; the Fatima prayer</summary>
          {['salve', 'fatima'].map(id => { const p = find(id); return p && <div key={id} className="ros-p"><div className="eyebrow">{p.n}</div><PrayerText p={p} /></div>; })}
        </details>
      </div>
    </div>
  );
}

// The fourteen stations, each with its Gospel.
export function Stations() {
  const P = useP(); const [open, setOpen] = useState(0);
  if (!P) return null;
  return (
    <div className="page fade-in prayer-page">
      <div className="eyebrow"><Link to="/prayer">Prayer</Link> · Via Crucis</div>
      <h1 className="title">The Way of the Cross</h1>
      <p className="lede">{P.stations.intro}</p>
      <ol className="mysteries">
        {P.stations.s.map((st, i) => (
          <li key={i} className={'mystery' + (open === i ? ' open' : '')}>
            <button className="mh" onClick={() => setOpen(open === i ? -1 : i)}>
              <span className="num">{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'][i]}</span>
              <span className="in"><span className="h">{st.n}</span><span className="muted small">{st.ref ? refLabel(st.ref) : 'from tradition'}</span></span>
            </button>
            {open === i && <div className="mb">
              {st.ref ? <Passage r={st.ref} /> : <p className="muted">This station comes from the Church's tradition rather than a Gospel scene.</p>}
              <div className="help"><i>We adore thee, O Christ, and we bless thee — because by thy holy Cross thou hast redeemed the world.</i> An Our Father, a Hail Mary and a Glory Be at each station.</div>
            </div>}
          </li>
        ))}
      </ol>
    </div>
  );
}

// The Chaplet of Divine Mercy.
export function Mercy() {
  const P = useP(); if (!P) return null;
  return (
    <div className="page fade-in prayer-page">
      <div className="eyebrow"><Link to="/prayer">Prayer</Link> · Three o'clock</div>
      <h1 className="title">The Chaplet of Divine Mercy</h1>
      <p className="lede">{P.mercy.intro}</p>
      <ol className="steps">{P.mercy.steps.map((s, i) => <li key={i}><div className="eyebrow">{s.n}</div>{s.en && <p>{s.en}</p>}</li>)}</ol>
      <div className="card" style={{ marginTop: 14 }}><h2 className="ch">The hour of mercy <span className="hint">the Scripture behind the chaplet</span></h2>{P.mercy.refs.map((r, i) => <Passage key={i} r={r} />)}</div>
    </div>
  );
}

// Lectio divina: four timed rungs with today's Gospel, and a place to write what the word said.
export function Lectio() {
  const P = useP(); const notes = useNotes();
  const day = useMemo(() => liturgicalDay(new Date()), []);
  const gospel = day.refs.length ? day.refs[day.refs.length - 1] : null;
  const ref = gospel && gospel.book ? [gospel.b, ...gospel.parts[0]] : ['JHN', 1, 1, 18];
  const [step, setStep] = useState(0); const [left, setLeft] = useState(null); const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const key = vkey(ref[0], ref[1], ref[2]);
  const [text, setText] = useState(() => notes.notes[key]?.t || '');
  useEffect(() => { if (!running) return; timer.current = setInterval(() => setLeft(l => { if (l <= 1) { clearInterval(timer.current); setRunning(false); try { navigator.vibrate && navigator.vibrate(200); } catch {} return 0; } return l - 1; }), 1000); return () => clearInterval(timer.current); }, [running]);
  if (!P) return null;
  const S = P.lectio.steps; const cur = S[step];
  const start = () => { setLeft(cur.min * 60); setRunning(true); };
  const mmss = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  const go = i => { clearInterval(timer.current); setRunning(false); setLeft(null); setStep(i); };
  return (
    <div className="page fade-in prayer-page lectio">
      <div className="eyebrow"><Link to="/prayer">Prayer</Link> · Lectio divina</div>
      <h1 className="title">Read, reflect, pray, rest</h1>
      <p className="lede">{P.lectio.intro} The passage is today's Gospel{gospel && gospel.book ? '' : ' — or, on a day without one, the prologue of John'}. Each rung is timed; sit with it, then move on.</p>
      <div className="lectio-grid">
        <div>
          <div className="steps-nav">{S.map((s, i) => <button key={i} className={'stp' + (i === step ? ' on' : '') + (i < step ? ' done' : '')} onClick={() => go(i)}><span className="n">{i + 1}</span>{s.n.split(' — ')[0]}</button>)}</div>
          <div className="card lectio-step">
            <h2 className="ch">{cur.n}</h2>
            <p style={{ lineHeight: 1.6 }}>{cur.t}</p>
            <div className="timer">
              <div className="big">{left === null ? mmss(cur.min * 60) : mmss(left)}</div>
              {!running && left !== 0 && <button className="btn solid sm" onClick={start}>{left === null ? `Begin ${cur.min} minutes` : 'Resume'}</button>}
              {running && <button className="btn sm" onClick={() => { clearInterval(timer.current); setRunning(false); }}>Pause</button>}
              {left === 0 && step < S.length - 1 && <button className="btn solid sm" onClick={() => go(step + 1)}>Next: {S[step + 1].n.split(' — ')[0]}</button>}
              {left === 0 && step === S.length - 1 && <span className="muted">Deo gratias.</span>}
            </div>
          </div>
          {step >= 1 && <div className="card" style={{ marginTop: 12 }}>
            <h2 className="ch">The word that stopped you <span className="hint">saved to your notebook on {refLabel(ref)}</span></h2>
            <textarea rows={5} value={text} onChange={e => setText(e.target.value)} onBlur={() => setNote(ref[0], ref[1], ref[2], text)} placeholder="A word, a phrase, what it asked of you…" />
          </div>}
        </div>
        <div className="card lectio-text"><h2 className="ch">Today's Gospel <span className="hint">{day.name}</span></h2><Passage r={ref} latin={false} /></div>
      </div>
    </div>
  );
}
