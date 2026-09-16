import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, loadText, loadSide, makeStore } from '../store';
import { useSyncExternalStore } from 'react';

// Test yourself — every question is generated from the app's own data, so it never runs out.
const quizStore = makeStore('vv.quiz', { best: {}, played: 0, right: 0 });
const useQuiz = () => useSyncExternalStore(quizStore.subscribe, quizStore.get);

const rnd = n => Math.floor(Math.random() * n);
const pick = arr => arr[rnd(arr.length)];
const shuffle = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = rnd(i + 1); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const sample = (arr, n, not = () => false) => { const out = []; const pool = shuffle(arr.filter(x => !not(x))); while (out.length < n && pool.length) out.push(pool.pop()); return out; };
const SPK = { J: 'Jesus', G: 'God', A: 'an angel' };
const spkName = c => SPK[c] || c;
const GOSPEL_ACTS = ['MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'GEN', 'EXO', '1SA', '2SA', '1KI', 'JOB'];
const trim = (t, n = 240) => t.length > n ? t.slice(0, n - 1).replace(/\s\S*$/, '') + '…' : t;
const ref = (b, c, v1, v2) => `${data.byId[b].abbr} ${c}:${v1}${v2 && v2 !== v1 ? '–' + v2 : ''}`;

export const CATS = [
  ['who', 'Who said it?', 'A line of speech — name the speaker.'],
  ['where', 'Where is it?', 'A well-known passage — name the book.'],
  ['people', 'Who is this?', 'A life in two sentences — name the person.'],
  ['order', 'Which came first?', 'Four events — pick the earliest.'],
  ['prophecy', 'Promise and fulfilment', 'An Old Testament promise — which New Testament book claims it?'],
  ['next', 'What comes next?', 'A verse — choose the verse that follows it.'],
];

// Each generator returns { q, text, ref, link, options:[...], answer, explain }
const GEN = {
  async who() {
    for (let tries = 0; tries < 8; tries++) {
      const b = pick(GOSPEL_ACTS); const spk = await loadSide('speakers', b); const chs = Object.keys(spk); if (!chs.length) continue;
      const c = pick(chs); const vs = Object.keys(spk[c]); const v = +pick(vs); const who = spk[c][v];
      const others = [...new Set(Object.values(spk).flatMap(ch => Object.values(ch)))].filter(x => x !== who);
      if (others.length < 3) continue;
      const t = await loadText('drc', b); const text = t[c - 1]?.[v - 1]; if (!text || text.length < 40) continue;
      return { q: 'Who is speaking?', text: trim(text), ref: ref(b, +c, v), link: `/read/${b}/${c}#v${v}`, options: shuffle([spkName(who), ...sample(others, 3).map(spkName)]), answer: spkName(who), explain: `${data.byId[b].name} ${c}:${v}` };
    }
    return null;
  },
  async where() {
    const n = pick(data.notes); const t = await loadText('drc', n.b); const text = (t[n.c - 1] || []).slice(n.v1 - 1, Math.min(n.v2, n.v1 + 1)).join(' '); if (!text) return null;
    const book = data.byId[n.b]; const same = data.books.filter(b => b.testament === book.testament && b.id !== n.b);
    return { q: 'Which book is this from?', text: trim(text), ref: n.t, link: `/read/${n.b}/${n.c}#v${n.v1}`, options: shuffle([book.name, ...sample(same, 3).map(b => b.name)]), answer: book.name, explain: `${ref(n.b, n.c, n.v1, n.v2)} — ${n.t}` };
  },
  async people() {
    const P = data.people; const p = pick(P); const text = p.b.replace(new RegExp('\\b(' + [p.n, ...(p.aka || [])].map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'g'), '____');
    return { q: 'Who is this?', text: trim(text, 320), ref: p.role, link: `/people/${p.id}`, options: shuffle([p.n, ...sample(P, 3, x => x.id === p.id).map(x => x.n)]), answer: p.n, explain: `${p.n} — ${p.role}` };
  },
  async order() {
    const evs = sample(data.timeline.events.filter(e => typeof e.y === 'number'), 4); if (evs.length < 4) return null;
    const first = [...evs].sort((a, b) => a.y - b.y)[0];
    return { q: 'Which of these happened first?', text: '', ref: 'Four events from the chronicle', link: `/event/${first.id}`, options: shuffle(evs.map(e => e.ttl)), answer: first.ttl, explain: evs.slice().sort((a, b) => a.y - b.y).map(e => `${e.ttl} (${e.d})`).join(' → ') };
  },
  async prophecy() {
    const items = data.prophecy; const it = pick(items); const [b, c, v1, v2] = it.ot; const t = await loadText('drc', b); const text = (t[c - 1] || []).slice(v1 - 1, v2).join(' '); if (!text) return null;
    const ans = data.byId[it.nt[0]].name; const nts = [...new Set(items.map(x => x.nt[0]))].filter(x => x !== it.nt[0]);
    return { q: 'Which New Testament book claims this promise?', text: trim(text), ref: `${it.t} · ${ref(b, c, v1, v2)}`, link: `/read/${it.nt[0]}/${it.nt[1]}#v${it.nt[2]}`, options: shuffle([ans, ...sample(nts, 3).map(x => data.byId[x].name)]), answer: ans, explain: `${ref(...it.nt)} — ${it.n}` };
  },
  async next() {
    for (let tries = 0; tries < 6; tries++) {
      const n = pick(data.notes); const t = await loadText('drc', n.b); const ch = t[n.c - 1] || []; if (ch.length < 6) continue;
      const v = n.v1 + rnd(Math.max(1, Math.min(n.v2, ch.length - 1) - n.v1)); const cur = ch[v - 1], nxt = ch[v]; if (!cur || !nxt) continue;
      const others = sample(ch.map((x, i) => [x, i + 1]).filter(([x, i]) => i !== v + 1 && i !== v && x && x.length > 30), 3).map(x => x[0]); if (others.length < 3) continue;
      return { q: 'Which verse comes next?', text: trim(cur), ref: ref(n.b, n.c, v), link: `/read/${n.b}/${n.c}#v${v + 1}`, options: shuffle([nxt, ...others].map(x => trim(x, 160))), answer: trim(nxt, 160), explain: `${ref(n.b, n.c, v + 1)}` };
    }
    return null;
  },
};

async function makeQuestion(cat) { const k = cat === 'mix' ? pick(CATS)[0] : cat; const q = await GEN[k](); return q ? { ...q, cat: k } : makeQuestion(cat); }

export default function Quiz() {
  const st = useQuiz();
  const [cat, setCat] = useState('mix'); const [round, setRound] = useState(null); // { qs, i, score, chosen }
  const [q, setQ] = useState(null); const [chosen, setChosen] = useState(null); const [loading, setLoading] = useState(false);
  const N = 10;
  const start = async c => { setCat(c); setRound({ i: 0, score: 0, log: [] }); setChosen(null); setLoading(true); setQ(await makeQuestion(c)); setLoading(false); };
  const answer = o => { if (chosen) return; setChosen(o); const ok = o === q.answer; setRound(r => ({ ...r, score: r.score + (ok ? 1 : 0), log: [...r.log, { ...q, ok, chosen: o }] })); quizStore.set(s => ({ played: s.played + 1, right: s.right + (ok ? 1 : 0) })); };
  const next = async () => { if (round.i + 1 >= N) { const key = cat; quizStore.set(s => ({ best: { ...s.best, [key]: Math.max(s.best[key] || 0, round.score) } })); setRound(r => ({ ...r, i: N })); setQ(null); return; } setLoading(true); setChosen(null); setRound(r => ({ ...r, i: r.i + 1 })); setQ(await makeQuestion(cat)); setLoading(false); };
  useEffect(() => { const k = e => { if (!q || !chosen || e.key !== 'Enter') return; next(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); });

  if (!round) return (
    <div className="page fade-in">
      <div className="eyebrow">Test yourself</div>
      <h1 className="title">How well do you know the book?</h1>
      <p className="lede">Ten questions a round, drawn fresh each time from the text, the people, the chronicle and the prophecies. Every answer links to the passage, so a wrong guess is a place to go and read.{st.played ? ` You have answered ${st.played} questions and got ${Math.round(100 * st.right / st.played)}% right.` : ''}</p>
      <div className="study-grid">
        <button className="study" onClick={() => start('mix')}><div className="h">A bit of everything</div><div className="sub">{st.best.mix != null ? `best ${st.best.mix}/${N}` : 'mixed round'}</div><div className="d">All six kinds of question, shuffled.</div></button>
        {CATS.map(([id, n, d]) => <button key={id} className="study" onClick={() => start(id)}><div className="h">{n}</div><div className="sub">{st.best[id] != null ? `best ${st.best[id]}/${N}` : 'ten questions'}</div><div className="d">{d}</div></button>)}
      </div>
    </div>
  );
  if (round.i >= N) return (
    <div className="page fade-in">
      <div className="eyebrow">Round over</div>
      <h1 className="title">{round.score} out of {N}</h1>
      <p className="lede">{round.score === N ? 'Every one. Well read.' : round.score >= 7 ? 'A good round — the ones you missed are below, with their passages.' : 'The missed ones are below; each links to the place in the text.'}</p>
      <div className="row" style={{ marginBottom: 14 }}><button className="btn solid" onClick={() => start(cat)}>Another round</button><button className="btn" onClick={() => setRound(null)}>Choose a kind</button></div>
      <div className="quiz-log">{round.log.map((l, i) => <Link key={i} to={l.link} className={'ql ' + (l.ok ? 'ok' : 'no')}><span className="mark">{l.ok ? '✓' : '✗'}</span><span><b>{l.q}</b> {l.text ? <i>“{trim(l.text, 90)}”</i> : ''}<div className="muted small">{l.ok ? l.answer : `You said ${l.chosen} — it was ${l.answer}`} · {l.explain}</div></span></Link>)}</div>
    </div>
  );
  return (
    <div className="page fade-in quiz">
      <div className="row" style={{ justifyContent: 'space-between' }}><div className="eyebrow">{CATS.find(c => c[0] === (q?.cat || cat))?.[1] || 'Test yourself'}</div><div className="muted small">Question {round.i + 1} of {N} · {round.score} right</div></div>
      <div className="bar" style={{ margin: '6px 0 14px' }}><i style={{ width: `${(round.i / N) * 100}%` }} /></div>
      {loading || !q ? <p className="muted">Choosing a question…</p> : <div className="card qcard">
        <h2 className="qq">{q.q}</h2>
        {q.text && <blockquote className="qt">“{q.text}”</blockquote>}
        {!chosen && <div className="muted small">{q.cat === 'where' || q.cat === 'next' || q.cat === 'who' ? '' : q.ref}</div>}
        <div className="qopts">{q.options.map((o, i) => <button key={i} className={'qo' + (chosen ? (o === q.answer ? ' right' : o === chosen ? ' wrong' : ' dim') : '')} onClick={() => answer(o)} disabled={!!chosen}><span className="k">{'ABCD'[i]}</span>{o}</button>)}</div>
        {chosen && <div className={'qres ' + (chosen === q.answer ? 'ok' : 'no')}>
          <b>{chosen === q.answer ? 'Right.' : 'Not quite.'}</b> {q.explain}
          <div className="row" style={{ marginTop: 8 }}><button className="btn solid sm" onClick={next}>{round.i + 1 >= N ? 'See the result' : 'Next question'}</button><Link className="btn sm ghost" to={q.link}>Open the passage →</Link></div>
        </div>}
      </div>}
      <div className="row" style={{ marginTop: 12 }}><button className="btn sm ghost" onClick={() => setRound(null)}>Quit the round</button></div>
    </div>
  );
}
