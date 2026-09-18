import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSyncExternalStore } from 'react';
import { data, getJson, makeStore } from '../store';
import { speak, speechSupported } from '../speech';

const latinStore = makeStore('vv.latin', { done: {}, known: {} });
const useLatin = () => useSyncExternalStore(latinStore.subscribe, latinStore.get);
let cache = null;
function useCourse() { const [C, setC] = useState(cache); useEffect(() => { if (cache) return; getJson('/data/latin-course.json').then(j => { cache = j; setC(j); }).catch(() => setC({ lessons: [] })); }, []); return C; }
const POS = { 'conj.': 'conjunction', 'prep.': 'preposition', 'pron.': 'pronoun', 'adj.': 'adjective', 'adv.': 'adverb', noun: 'noun', verb: 'verb', 'interj.': 'interjection', num: 'numeral' };
const shuffle = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const mark = (la, form) => { const re = new RegExp('(^|[^a-zæœ])(' + form.replace(/ae/g, '(?:ae|æ)').replace(/oe/g, '(?:oe|œ)') + ')(?=[^a-zæœ]|$)', 'i'); const m = la.match(re); if (!m) return la; const i = m.index + m[1].length; return <>{la.slice(0, i)}<mark>{la.slice(i, i + m[2].length)}</mark>{la.slice(i + m[2].length)}</>; };

// Latin from the Vulgate: twenty lessons of a dozen words, the most frequent first, each drilled with a real verse.
export default function Latin() {
  const C = useCourse(); const st = useLatin(); const nav = useNavigate();
  if (!C) return <div className="page"><p className="muted">Loading…</p></div>;
  const done = Object.keys(st.done).length;
  return (
    <div className="page fade-in latin">
      <div className="eyebrow">Latin</div>
      <h1 className="title">Read the Vulgate in its own words</h1>
      <p className="lede">{C.intro} Each lesson is twelve words: the dictionary form, its meaning, the shapes it takes in the text, and a verse that uses it — then a short test. Learn these and the Latin column stops being decoration.</p>
      <div className="row" style={{ marginBottom: 14 }}><span className="chip gold">{done} of {C.lessons.length} lessons passed</span><Link className="btn sm" to="/alphabets">Greek & Hebrew alphabets →</Link></div>
      <div className="ways" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {C.lessons.map(L => <button key={L.n} className={'way' + (st.done[L.n] ? ' done' : '')} onClick={() => nav(`/latin/${L.n}`)} style={{ display: 'block' }}>
          <div className="in"><div className="sub">Lesson {L.n}{st.done[L.n] ? ` · ${st.done[L.n]}/12` : ''}</div><div className="h">{L.words.slice(0, 4).map(w => w.l).join(' · ')}</div><div className="d">{L.words.slice(4).map(w => w.l).join(' · ')}</div></div>
        </button>)}
      </div>
    </div>
  );
}

export function Lesson() {
  const { n } = useParams(); const C = useCourse(); const st = useLatin(); const nav = useNavigate();
  const [mode, setMode] = useState('learn'); const [qi, setQi] = useState(0); const [score, setScore] = useState(0); const [chosen, setChosen] = useState(null);
  useEffect(() => { setMode('learn'); setQi(0); setScore(0); setChosen(null); window.scrollTo(0, 0); }, [n]);
  const L = C && C.lessons[+n - 1];
  const quiz = useMemo(() => L ? shuffle(L.words).map(w => ({ w, opts: shuffle([w, ...shuffle(L.words.filter(x => x !== w)).slice(0, 3)]) })) : [], [L, mode === 'quiz']); // eslint-disable-line
  if (!C) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!L) return <div className="page"><p className="muted">No such lesson.</p></div>;
  const say = (text, lang = 'la') => speechSupported && speak([{ text, lang, key: 'x' }], 'Latin');
  const q = quiz[qi];
  const answer = w => { if (chosen) return; setChosen(w); if (w === q.w) setScore(s => s + 1); };
  const next = () => { if (qi + 1 >= quiz.length) { const final = score; latinStore.set(s => ({ done: { ...s.done, [L.n]: Math.max(s.done[L.n] || 0, final) } })); setMode('result'); return; } setQi(i => i + 1); setChosen(null); };
  return (
    <div className="page fade-in latin">
      <div className="eyebrow"><Link to="/latin">Latin</Link> · lesson {L.n} of {C.lessons.length}</div>
      <h1 className="title">{L.t}</h1>
      <div className="row" style={{ margin: '8px 0 14px' }}><div className="seg"><button className={mode === 'learn' ? 'on' : ''} onClick={() => setMode('learn')}>Learn</button><button className={mode !== 'learn' ? 'on' : ''} onClick={() => { setMode('quiz'); setQi(0); setScore(0); setChosen(null); }}>Test</button></div>{st.done[L.n] != null && <span className="chip gold">best {st.done[L.n]}/12</span>}</div>
      {mode === 'learn' && <div className="words">
        {L.words.map(w => <div key={w.l} className="word card">
          <div className="wh"><span className="lemma">{w.l}</span><span className="muted small">{POS[w.pos] || w.pos} · {w.n.toLocaleString()} times in the Vulgate</span>{speechSupported && <button className="ib" onClick={() => say(w.l)} aria-label="Hear it">▶</button>}</div>
          <div className="gloss">{w.g}</div>
          <div className="forms">{w.forms.map(([f, m]) => <span key={f} className="chip" title={m}>{f}{m ? <i> {m}</i> : null}</span>)}</div>
          <div className="ex"><div className="la">{mark(w.ex[3], w.ex[5])}</div><div className="en">{w.ex[4]}</div><Link to={`/read/${w.ex[0]}/${w.ex[1]}#v${w.ex[2]}`} className="muted small">{data.byId[w.ex[0]].abbr} {w.ex[1]}:{w.ex[2]} →</Link></div>
        </div>)}
        <div className="row"><button className="btn solid" onClick={() => { setMode('quiz'); setQi(0); setScore(0); setChosen(null); }}>Test these twelve →</button></div>
      </div>}
      {mode === 'quiz' && q && <div className="card qcard">
        <div className="muted small">Question {qi + 1} of {quiz.length} · {score} right</div>
        <h2 className="qq" style={{ marginTop: 6 }}>What does <span className="lemma">{q.w.ex[5]}</span> mean?</h2>
        <blockquote className="qt">{mark(q.w.ex[3], q.w.ex[5])}</blockquote>
        <div className="qopts">{q.opts.map((o, i) => <button key={o.l} className={'qo' + (chosen ? (o === q.w ? ' right' : o === chosen ? ' wrong' : ' dim') : '')} onClick={() => answer(o)} disabled={!!chosen}><span className="k">{'ABCD'[i]}</span>{o.g}</button>)}</div>
        {chosen && <div className={'qres ' + (chosen === q.w ? 'ok' : 'no')}><b>{chosen === q.w ? 'Right.' : 'Not quite.'}</b> <i>{q.w.l}</i> — {q.w.g}. <span className="muted">{q.w.ex[4]}</span><div className="row" style={{ marginTop: 8 }}><button className="btn solid sm" onClick={next}>{qi + 1 >= quiz.length ? 'See the result' : 'Next'}</button></div></div>}
      </div>}
      {mode === 'result' && <div className="card"><h2 className="title">{score} of {quiz.length}</h2><p className="lede">{score === quiz.length ? 'Every one. On to the next.' : score >= 9 ? 'Good — one more pass and they will stick.' : 'Read them again, then try once more.'}</p><div className="row"><button className="btn" onClick={() => setMode('learn')}>Read them again</button>{C.lessons[L.n] && <button className="btn solid" onClick={() => nav(`/latin/${L.n + 1}`)}>Lesson {L.n + 1} →</button>}</div></div>}
    </div>
  );
}

// The Greek and Hebrew alphabets, with the sound and a word from the text for each letter.
const GREEK = [['Α', 'α', 'alpha', 'a as in father', 'ἀγάπη', 'love'], ['Β', 'β', 'beta', 'b', 'βασιλεία', 'kingdom'], ['Γ', 'γ', 'gamma', 'g as in go', 'γῆ', 'earth'], ['Δ', 'δ', 'delta', 'd', 'δόξα', 'glory'], ['Ε', 'ε', 'epsilon', 'e as in met', 'ἐκκλησία', 'church'], ['Ζ', 'ζ', 'zeta', 'dz / z', 'ζωή', 'life'], ['Η', 'η', 'eta', 'ay as in they', 'ἡμέρα', 'day'], ['Θ', 'θ', 'theta', 'th as in thin', 'θεός', 'God'], ['Ι', 'ι', 'iota', 'i as in machine', 'Ἰησοῦς', 'Jesus'], ['Κ', 'κ', 'kappa', 'k', 'κύριος', 'Lord'], ['Λ', 'λ', 'lambda', 'l', 'λόγος', 'word'], ['Μ', 'μ', 'mu', 'm', 'μαθητής', 'disciple'], ['Ν', 'ν', 'nu', 'n', 'νόμος', 'law'], ['Ξ', 'ξ', 'xi', 'x / ks', 'ξένος', 'stranger'], ['Ο', 'ο', 'omicron', 'o as in not', 'ὁδός', 'way'], ['Π', 'π', 'pi', 'p', 'πίστις', 'faith'], ['Ρ', 'ρ', 'rho', 'r (rolled)', 'ῥῆμα', 'saying'], ['Σ', 'σ ς', 'sigma', 's (ς at the end of a word)', 'σάρξ', 'flesh'], ['Τ', 'τ', 'tau', 't', 'τέκνον', 'child'], ['Υ', 'υ', 'upsilon', 'ü / u', 'υἱός', 'son'], ['Φ', 'φ', 'phi', 'ph / f', 'φῶς', 'light'], ['Χ', 'χ', 'chi', 'ch as in loch', 'Χριστός', 'Christ'], ['Ψ', 'ψ', 'psi', 'ps', 'ψυχή', 'soul'], ['Ω', 'ω', 'omega', 'o as in bone', 'ὥρα', 'hour']];
const HEBREW = [['א', 'aleph', 'silent (a carrier)', 'אֱלֹהִים', 'God, Elohim'], ['ב', 'bet', 'b / v', 'בְּרֵאשִׁית', 'in the beginning'], ['ג', 'gimel', 'g', 'גָּדוֹל', 'great'], ['ד', 'dalet', 'd', 'דָּבָר', 'word, thing'], ['ה', 'he', 'h', 'הַלְלוּיָהּ', 'hallelujah'], ['ו', 'vav', 'v / w; also o, u', 'וְ', 'and'], ['ז', 'zayin', 'z', 'זָכַר', 'remember'], ['ח', 'chet', 'ch as in loch', 'חֶסֶד', 'steadfast love'], ['ט', 'tet', 't', 'טוֹב', 'good'], ['י', 'yod', 'y', 'יְהוָה', 'the Name'], ['כ', 'kaf', 'k / kh (ך at the end)', 'כָּבוֹד', 'glory'], ['ל', 'lamed', 'l', 'לֵב', 'heart'], ['מ', 'mem', 'm (ם at the end)', 'מֶלֶךְ', 'king'], ['נ', 'nun', 'n (ן at the end)', 'נֶפֶשׁ', 'soul'], ['ס', 'samekh', 's', 'סֵפֶר', 'book'], ['ע', 'ayin', 'silent (guttural)', 'עוֹלָם', 'eternity, world'], ['פ', 'pe', 'p / f (ף at the end)', 'פָּנִים', 'face'], ['צ', 'tsade', 'ts (ץ at the end)', 'צֶדֶק', 'righteousness'], ['ק', 'qof', 'q / k', 'קָדוֹשׁ', 'holy'], ['ר', 'resh', 'r', 'רוּחַ', 'spirit, breath'], ['ש', 'shin / sin', 'sh / s', 'שָׁלוֹם', 'peace'], ['ת', 'tav', 't', 'תּוֹרָה', 'Torah, law']];
export function Alphabets() {
  const [which, setWhich] = useState('greek'); const [flip, setFlip] = useState({});
  const rows = which === 'greek' ? GREEK : HEBREW;
  return (
    <div className="page fade-in latin">
      <div className="eyebrow"><Link to="/latin">Latin</Link> · the other two tongues</div>
      <h1 className="title">{which === 'greek' ? 'The Greek alphabet' : 'The Hebrew alphabet'}</h1>
      <div className="row" style={{ margin: '8px 0 12px' }}><div className="seg"><button className={which === 'greek' ? 'on' : ''} onClick={() => setWhich('greek')}>Greek · 24 letters</button><button className={which === 'hebrew' ? 'on' : ''} onClick={() => setWhich('hebrew')}>Hebrew · 22 letters</button></div></div>
      <p className="lede">{which === 'greek' ? 'The New Testament was written in the everyday Greek of the Roman world. Learn these twenty-four letters and you can sound out every word under the verses when the Greek original is turned on — and Strong\'s will tell you what it means.' : 'Hebrew reads from right to left and, in the Bible, is written with the vowel points added by the Masoretes; the letters are the consonants. Five letters change shape at the end of a word. Learn these and the Hebrew under the Old Testament verses stops being a wall.'} Tap a card to hide the name and test yourself.</p>
      <div className="alpha-grid">
        {rows.map((r, i) => { const hidden = flip[i]; return (
          <button key={i} className={'alpha' + (hidden ? ' hidden' : '')} onClick={() => setFlip(f => ({ ...f, [i]: !f[i] }))}>
            <div className={'glyph' + (which === 'hebrew' ? ' he' : ' grc')}>{which === 'greek' ? r[0] + ' ' + r[1] : r[0]}</div>
            {!hidden && <><div className="name">{which === 'greek' ? r[2] : r[1]}</div><div className="muted small">{which === 'greek' ? r[3] : r[2]}</div><div className={'ex' + (which === 'hebrew' ? ' he' : ' grc')}>{which === 'greek' ? r[4] : r[3]}</div><div className="muted small">{which === 'greek' ? r[5] : r[4]}</div></>}
            {hidden && <div className="muted small">tap to reveal</div>}
          </button>); })}
      </div>
    </div>
  );
}
