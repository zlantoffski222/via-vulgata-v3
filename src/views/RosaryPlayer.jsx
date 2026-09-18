import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { data, loadText, useSettings, settingsStore } from '../store';
import { PrayerText } from './Prayer';
import Passage, { refLabel } from '../components/Passage';
import { speak, stop, subscribeSpeech, speechSupported } from '../speech';

// The Rosary, led: one prayer at a time, beads that advance as you tap, the Gospel read at the start of each decade,
// and, if you like, each prayer read aloud and the next one following on its own.
function buildSteps(P, set) {
  const pr = id => ({ kind: 'prayer', id });
  const steps = [pr('signum'), pr('credo-ap'), pr('pater'), { ...pr('ave'), note: 'for faith' }, { ...pr('ave'), note: 'for hope' }, { ...pr('ave'), note: 'for charity' }, pr('gloria')];
  set.m.forEach((m, i) => {
    steps.push({ kind: 'mystery', i, m });
    steps.push({ kind: 'passage', i, ref: m.ref });
    steps.push({ ...pr('pater'), dec: i });
    for (let b = 1; b <= 10; b++) steps.push({ ...pr('ave'), dec: i, bead: b });
    steps.push({ ...pr('gloria'), dec: i }); steps.push({ ...pr('fatima'), dec: i });
  });
  steps.push(pr('salve'), pr('signum'));
  return steps;
}

function Beads({ steps, idx }) {
  // five decades drawn as arcs of ten beads around a ring, the Our Father beads between
  const cur = steps[idx]; const decDone = d => steps.slice(0, idx).filter(s => s.dec === d && s.bead).length;
  return (
    <svg viewBox="0 0 220 220" className="beads">
      <circle cx="110" cy="110" r="88" fill="none" stroke="var(--ring)" strokeWidth="2" />
      {[0, 1, 2, 3, 4].map(d => { const a0 = -Math.PI / 2 + d * (2 * Math.PI / 5) + 0.12; const span = 2 * Math.PI / 5 - 0.3; const done = decDone(d); return (
        <g key={d}>
          <circle cx={110 + 88 * Math.cos(a0 - 0.1)} cy={110 + 88 * Math.sin(a0 - 0.1)} r="6" fill={cur && cur.dec === d && !cur.bead && cur.id === 'pater' ? 'var(--gold)' : 'var(--gold-soft)'} stroke="var(--gold)" strokeWidth="1.5" />
          {Array.from({ length: 10 }, (_, b) => { const a = a0 + 0.07 + (b / 9) * span; const on = b < done; const now = cur && cur.dec === d && cur.bead === b + 1; return <circle key={b} cx={110 + 88 * Math.cos(a)} cy={110 + 88 * Math.sin(a)} r={now ? 5.5 : 4} fill={on || now ? 'var(--gold)' : 'var(--surface-1)'} stroke="var(--gold)" strokeWidth="1.2" />; })}
        </g>); })}
      <path d="M110 198v14M104 205h12" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
      <text x="110" y="106" textAnchor="middle" fontFamily="var(--serif)" fontSize="30" fill="var(--ink-1)">{cur && cur.dec != null ? ['I', 'II', 'III', 'IV', 'V'][cur.dec] : '✦'}</text>
      <text x="110" y="128" textAnchor="middle" fontFamily="var(--sans)" fontSize="10" letterSpacing="1.5" fill="var(--ink-3)">{cur && cur.bead ? `BEAD ${cur.bead} OF 10` : cur && cur.dec != null ? 'DECADE' : 'ROSARY'}</text>
    </svg>
  );
}

export default function RosaryPlayer() {
  const P = data.prayers; const s = useSettings(); const [sp] = useSearchParams();
  const today = new Date(); const setId = sp.get('set') || P.rosary.days[String(today.getDay())];
  const set = P.rosary.sets.find(x => x.id === setId) || P.rosary.sets[0];
  const steps = useMemo(() => buildSteps(P, set), [set.id]); // eslint-disable-line
  const [idx, setIdx] = useState(0); const [voice, setVoice] = useState(false); const [passageText, setPassageText] = useState('');
  const find = id => P.prayers.find(p => p.id === id);
  const cur = steps[idx]; const done = idx >= steps.length - 1 && false;
  const idxRef = useRef(idx); idxRef.current = idx;
  const lang = s.prayerLang || 'both'; const prayLang = lang === 'la' ? 'la' : 'en';
  // read the current step aloud, and step on when it ends
  useEffect(() => {
    if (!voice) { stop(); return; }
    const st = steps[idx]; let text = '';
    if (st.kind === 'prayer') { const p = find(st.id); text = prayLang === 'la' && p.la ? p.la : p.en; }
    else if (st.kind === 'mystery') text = `The ${['first', 'second', 'third', 'fourth', 'fifth'][st.i]} ${set.n.replace('The ', '').replace(' Mysteries', '').toLowerCase()} mystery: ${st.m.n}. Fruit of the mystery: ${st.m.fruit}.`;
    else if (st.kind === 'passage') text = passageText;
    if (!text) return;
    speak([{ text, lang: st.kind === 'prayer' ? prayLang : 'en', key: 'r' + idx }], 'The Rosary');
  }, [idx, voice, passageText]); // eslint-disable-line
  useEffect(() => subscribeSpeech(st => { if (!voice) return; if (!st.playing && st.idx === -1 && st.items.length > 0 && advanceRef.current) { advanceRef.current = false; setTimeout(() => setIdx(i => Math.min(steps.length - 1, i + 1)), 600); } }), [voice, steps.length]);
  const advanceRef = useRef(false);
  useEffect(() => { advanceRef.current = voice; }, [idx, voice]);
  useEffect(() => { if (cur.kind !== 'passage') { setPassageText(''); return; } let on = true; loadText('drc', cur.ref[0]).then(t => { if (!on) return; setPassageText((t[cur.ref[1] - 1] || []).slice(cur.ref[2] - 1, cur.ref[3]).join(' ')); }); return () => { on = false; }; }, [idx]); // eslint-disable-line
  useEffect(() => { const k = e => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); } if (e.key === 'ArrowLeft') prev(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }); // eslint-disable-line
  useEffect(() => () => stop(), []);
  const next = () => { advanceRef.current = false; stop(); setIdx(i => Math.min(steps.length - 1, i + 1)); };
  const prev = () => { advanceRef.current = false; stop(); setIdx(i => Math.max(0, i - 1)); };
  const p = cur.kind === 'prayer' ? find(cur.id) : null;
  const pct = Math.round((idx / (steps.length - 1)) * 100);
  return (
    <div className="page fade-in rosary-player">
      <div className="eyebrow"><Link to="/prayer">Prayer</Link> · <Link to="/prayer/rosary">The Rosary</Link> · led</div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h1 className="title" style={{ margin: 0 }}>{set.n}</h1>
        <div className="row" style={{ gap: 8 }}>
          <div className="seg">{[['both', 'Latin & English'], ['la', 'Latin'], ['en', 'English']].map(([id, n]) => <button key={id} className={lang === id ? 'on' : ''} onClick={() => settingsStore.set({ prayerLang: id })}>{n}</button>)}</div>
          {speechSupported && <button className={'btn sm' + (voice ? ' solid' : '')} onClick={() => setVoice(v => !v)}>{voice ? '● Voice on — leading' : 'Lead me by voice'}</button>}
        </div>
      </div>
      <div className="bar" style={{ margin: '10px 0 14px' }}><i style={{ width: pct + '%' }} /></div>
      <div className="rp-grid">
        <div className="rp-beads"><Beads steps={steps} idx={idx} /><div className="muted small" style={{ textAlign: 'center' }}>{idx + 1} of {steps.length} · tap the prayer or press space to go on</div></div>
        <div className="rp-main" onClick={next} role="button" tabIndex={0}>
          {cur.kind === 'prayer' && <>
            <div className="eyebrow">{p.n}{cur.note ? ` — ${cur.note}` : ''}{cur.bead ? ` · ${cur.bead} of 10` : ''}</div>
            <div className="rp-text"><PrayerText p={p} /></div>
          </>}
          {cur.kind === 'mystery' && <>
            <div className="eyebrow">The {['first', 'second', 'third', 'fourth', 'fifth'][cur.i]} mystery</div>
            <div className="rp-mystery">{cur.m.n}</div>
            <div className="muted">Fruit of the mystery: {cur.m.fruit} · {refLabel(cur.m.ref)}</div>
            <p className="hour-p" style={{ marginTop: 10 }}>Hold the scene in mind through the decade. Tap to read the Gospel.</p>
          </>}
          {cur.kind === 'passage' && <div onClick={e => e.stopPropagation()}><div className="eyebrow">The Gospel of the mystery</div><Passage r={cur.ref} /><button className="btn solid sm" onClick={next}>Begin the decade →</button></div>}
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
        <button className="btn sm ghost" onClick={prev} disabled={idx === 0}>← Back</button>
        {idx < steps.length - 1 ? <button className="btn solid" onClick={next}>Next →</button> : <Link className="btn solid" to="/prayer">Amen — finish</Link>}
      </div>
    </div>
  );
}
