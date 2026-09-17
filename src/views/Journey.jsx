import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { data, useProgress, useSettings, settingsStore, chapterDone, nextInPlan, nextCanon, bookProgress, goalStatus, chaptersRead, activePlan, PLAN_NAMES } from '../store';
import { easter } from '../lectionary';

function Ring({ pct }) {
  const r = 18, C = 2 * Math.PI * r;
  return <svg className="ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" /><circle cx="22" cy="22" r={r} fill="none" stroke="var(--gold)" strokeWidth="4" strokeDasharray={`${C * pct} ${C}`} strokeLinecap="round" transform="rotate(-90 22 22)" />
    {pct >= 1 && <text x="22" y="27" textAnchor="middle" fontSize="14" fill="var(--gold-2)">✓</text>}</svg>;
}

export default function Journey() {
  const p = useProgress(); const s = useSettings();
  const plan = activePlan(s);
  const nxt = plan ? nextInPlan(plan, p) : nextCanon(data.books, p);
  return (
    <div className="page fade-in">
      <div className="eyebrow">Reading plan</div>
      <h1 className="title">The journey</h1>
      <SharedPlan s={s} p={p} />
      <div className="row" style={{ margin: '10px 0 6px' }}>
        <div className="seg">
          <button className={s.plan === 'canon' ? 'on' : ''} onClick={() => settingsStore.set({ plan: 'canon' })}>Canonical order</button>
          <button className={s.plan === 'chrono' ? 'on' : ''} onClick={() => settingsStore.set({ plan: 'chrono' })}>Story order</button>
          <button className={s.plan === 'christ' ? 'on' : ''} onClick={() => settingsStore.set({ plan: 'christ' })}>The life of Christ</button>
          <button className={s.plan === 'story' ? 'on' : ''} onClick={() => settingsStore.set({ plan: 'story' })}>The story</button>
        </div>
        <ShareButton s={s} />
        {nxt && <Link className="btn solid" to={`/read/${nxt.b}/${nxt.c}`}>Next: {data.byId[nxt.b].name} {nxt.c}</Link>}
      </div>
      <GoalCard p={p} s={s} />
      <p className="muted" style={{ maxWidth: 680, lineHeight: 1.5 }}>
        {s.plan === 'story' ? 'The guided walkthrough: the whole Bible as one path of stops, each with its painting, map, diagram and notes. The chapters on the main path count here; open any stop from The story page.' : s.plan === 'christ' ? 'The four Gospels read as one story, in the order of the harmony: the prologue of John, the infancy in Luke and Matthew, the Galilean year, the road south, Holy Week hour by hour, the forty days. Every chapter of the four Gospels, placed where its scenes fall in the story, each read once.' : s.plan === 'chrono'
          ? 'Read the Bible as one continuous chronicle: Job among the patriarchs, the prophets beside the kings they preached to, the psalms in the age that sang them, and the four Gospels one after another.'
          : "Read in the order Jerome's Vulgate arranges the books — Law, histories, wisdom, prophets, Maccabees; then Gospels, Acts, letters and the Apocalypse. Either way, every verse counts once."}
      </p>
      {plan ? plan.map((step, i) => {
        const chs = step.items.flatMap(([b, c1, c2]) => Array.from({ length: c2 - c1 + 1 }, (_, k) => ({ b, c: c1 + k })));
        const done = chs.filter(x => chapterDone(p, data.byId[x.b], x.c)).length;
        return (
          <div className="step" key={i}>
            <Ring pct={done / chs.length} />
            <div>
              <div className="e">{step.era}</div>
              <div className="h">{step.title}</div>
              <div className="items">{step.items.map(([b, c1, c2], j) => { const bd = Array.from({ length: c2 - c1 + 1 }, (_, k) => c1 + k).every(c => chapterDone(p, data.byId[b], c)); return <Link key={j} className={bd ? 'done' : ''} to={`/read/${b}/${c1}`}>{data.byId[b].abbr} {c1 === c2 ? c1 : `${c1}–${c2}`}</Link>; })}</div>
              <div className="muted small" style={{ marginTop: 4 }}>{done}/{chs.length} chapters</div>
            </div>
          </div>
        );
      }) : ['Pentateuch', 'Historical Books', 'Wisdom Books', 'Prophets', 'Gospels', 'Acts', 'Pauline Letters', 'Catholic Letters', 'Apocalypse'].map(g => {
        const bs = data.books.filter(b => b.group === g); const read = bs.reduce((a, b) => a + bookProgress(p, b).read, 0), tot = bs.reduce((a, b) => a + b.verses, 0);
        return (
          <div className="step" key={g}>
            <Ring pct={read / tot} />
            <div>
              <div className="e">{bs[0].testament === 'OT' ? 'Old Testament' : 'New Testament'}</div>
              <div className="h">{g}</div>
              <div className="items">{bs.map(b => <Link key={b.id} className={bookProgress(p, b).pct >= 1 ? 'done' : ''} to={`/book/${b.id}`}>{b.abbr}</Link>)}</div>
              <div className="muted small" style={{ marginTop: 4 }}>{read.toLocaleString()}/{tot.toLocaleString()} verses</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// A plan is shareable as a link: #/journey?plan=christ&scope=nt&date=2026-12-25 — whoever opens it is offered the same plan and goal.
function ShareButton({ s }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const q = new URLSearchParams({ plan: s.plan || 'canon' }); if (s.goal?.scope && s.goal?.date) { q.set('scope', s.goal.scope); q.set('date', s.goal.date); }
    const url = location.href.split('#')[0] + '#/journey?' + q.toString();
    const text = `Read with me — ${PLAN_NAMES[s.plan] || 'Canonical order'}${s.goal?.date ? ', finishing by ' + s.goal.date : ''}: ${url}`;
    try { if (navigator.share) { await navigator.share({ title: 'Christ is King — reading plan', text, url }); } else { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } } catch {}
  };
  return <button className="btn sm ghost" onClick={share}>{done ? 'Link copied' : 'Share this plan'}</button>;
}
function SharedPlan({ s, p }) {
  const [sp, setSp] = useSearchParams(); const plan = sp.get('plan'); if (!plan || !PLAN_NAMES[plan]) return null;
  const scope = sp.get('scope'), date = sp.get('date');
  const adopt = () => {
    const patch = { plan };
    if (scope && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) { const books = data.books.filter(b => scope === 'all' || (scope === 'nt' ? b.testament === 'NT' : b.testament === 'OT')); patch.goal = { scope, date, startDate: ymd(new Date()), startDone: chaptersRead(p, books) }; }
    settingsStore.set(patch); setSp({}, { replace: true });
  };
  return (
    <div className="card" style={{ margin: '10px 0', borderColor: 'var(--gold-2)' }}>
      <h2 className="ch">A plan shared with you</h2>
      <p style={{ margin: '0 0 8px' }}><b>{PLAN_NAMES[plan]}</b>{scope && date ? ` — finish ${scope === 'all' ? 'the whole Bible' : scope === 'nt' ? 'the New Testament' : 'the Old Testament'} by ${new Date(date + 'T12:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}. Read along with whoever sent it.</p>
      <div className="row"><button className="btn solid sm" onClick={adopt}>Follow this plan</button><button className="btn sm ghost" onClick={() => setSp({}, { replace: true })}>Not now</button></div>
    </div>
  );
}

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function GoalCard({ p, s }) {
  const g = goalStatus(p, s); const y = new Date().getFullYear();
  const today = new Date(); const inDays = n => { const d = new Date(today); d.setDate(d.getDate() + n); return ymd(d); };
  const nextEaster = easter(y) > today ? easter(y) : easter(y + 1); const xmas = new Date(y, 11, 25) > today ? new Date(y, 11, 25) : new Date(y + 1, 11, 25);
  const presets = [['Easter', ymd(nextEaster)], ['Christmas', ymd(xmas)], ['90 days', inDays(90)], ['A year', inDays(365)]];
  const set = (scope, date) => { const books = data.books.filter(b => scope === 'all' || (scope === 'nt' ? b.testament === 'NT' : b.testament === 'OT')); settingsStore.set({ goal: { scope, date, startDate: ymd(today), startDone: chaptersRead(p, books) } }); };
  const scope = s.goal?.scope || 'nt';
  return (
    <div className="card" id="goal" style={{ margin: '12px 0' }}>
      <h2 className="ch">Reading goal <span className="hint">— a date to finish by, and how much that means each day</span></h2>
      {g ? <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
        <div className="stat"><b>{g.perDay > 0 ? (Math.ceil(g.perDay * 10) / 10) : 0}</b><span className="muted small">chapters a day</span></div>
        <div className="stat"><b>{g.daysLeft}</b><span className="muted small">days left</span></div>
        <div className="stat"><b className={g.ahead < -0.5 ? 'behind' : ''}>{g.ahead >= 0 ? '+' : ''}{Math.round(g.ahead)}</b><span className="muted small">chapters {g.ahead >= 0 ? 'ahead of' : 'behind'} pace</span></div>
        <div style={{ flex: 1, minWidth: 200 }}><div className="muted small">Finish {g.label} by {new Date(s.goal.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {g.done}/{g.total} chapters</div><div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${g.pct * 100}%` }} /></div></div>
        <button className="btn sm ghost" onClick={() => settingsStore.set({ goal: null })}>clear</button>
      </div> : <p className="muted small" style={{ margin: '0 0 8px' }}>No goal yet. Choose what to finish and when — the home page will keep count.</p>}
      <div className="row" style={{ marginTop: 10 }}>
        <div className="seg"><button className={scope === 'nt' ? 'on' : ''} onClick={() => set('nt', s.goal?.date || presets[0][1])}>New Testament</button><button className={scope === 'ot' ? 'on' : ''} onClick={() => set('ot', s.goal?.date || presets[3][1])}>Old Testament</button><button className={scope === 'all' ? 'on' : ''} onClick={() => set('all', s.goal?.date || presets[3][1])}>Whole Bible</button></div>
        <span className="muted small">by</span>
        {presets.map(([n, d]) => <button key={n} className={'btn sm' + (s.goal?.date === d ? ' solid' : '')} onClick={() => set(scope, d)}>{n}</button>)}
        <input type="date" value={s.goal?.date || ''} min={ymd(today)} onChange={e => e.target.value && set(scope, e.target.value)} style={{ width: 'auto' }} aria-label="Finish date" />
      </div>
    </div>
  );
}
