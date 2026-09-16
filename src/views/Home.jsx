import React from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { data, useProgress, useSettings, totalProgress, bookProgress, nextCanon, nextInPlan, chapterDone, goalStatus, useMemory, useNotes, activePlan, PLAN_NAMES } from '../store';
import DailyFive from '../components/DailyFive';
import { ReadingsList } from './Calendar';
import { liturgicalDay } from '../lectionary';
import { useIsMobile } from '../hooks';
import ArtImg from '../components/ArtImg';
import { SaintCard, FastChip, PrayerToday, LIT_COLOR } from '../components/TodayCards';

function useJourney() {
  const p = useProgress(); const s = useSettings();
  const books = data.books;
  const tot = totalProgress(p, books);
  const ot = totalProgress(p, books.filter(b => b.testament === 'OT')), nt = totalProgress(p, books.filter(b => b.testament === 'NT'));
  const nxt = activePlan(s) ? nextInPlan(activePlan(s), p) : nextCanon(books, p);
  const last = p.last && data.byId[p.last.b] ? p.last : null;
  const target = last && !chapterDone(p, data.byId[last.b], last.c) ? last : (nxt || last);
  const days = p.log || []; const today = new Date(); const cells = [];
  for (let i = 27; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate() - i); cells.push(days.some(x => x.d === d.toISOString().slice(0, 10))); }
  const streak = (() => { let n = 0; for (let i = cells.length - 1; i >= 0 && cells[i]; i--) n++; return n; })();
  const goal = goalStatus(p, s);
  return { p, s, tot, ot, nt, target, last, cells, streak, goal };
}
const Streak = ({ cells }) => <div className="streak">{cells.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}</div>;
function GoalLine({ goal, s }) {
  if (!goal) return <Link className="btn sm" to="/journey#goal">Set a finishing date</Link>;
  const behind = goal.ahead < -0.5;
  return <div className="goal"><div className="row" style={{ gap: 8 }}><span className="chip gold">{goal.perDay > 0 ? `${Math.ceil(goal.perDay * 10) / 10} chapters a day` : 'done!'}</span><span className={'chip ' + (behind ? 'rubric' : '')}>{goal.ahead >= 0 ? `${Math.round(goal.ahead)} ahead` : `${Math.round(-goal.ahead)} behind`}</span></div><div className="muted small" style={{ marginTop: 5 }}>to finish {goal.label} by {new Date(s.goal.date + 'T12:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} · {goal.left} chapters left</div></div>;
}

export default function Home() {
  const mobile = useIsMobile(); const [sp] = useSearchParams();
  if (sp.get('loc') || sp.get('ev') || sp.get('route')) return <Navigate to={'/explore?' + sp.toString()} replace />;
  return mobile ? <MobileHome /> : <DesktopHome />;
}

function ContinueCard({ j, hero }) {
  const { s, tot, ot, nt, target, last, cells, streak, goal } = j;
  return (
    <div className="card">
      <h2 className="ch">Your journey <span className="hint">— every verse you mark is remembered here</span></h2>
      <div className="home-progress">
        <div>
          <div className="eyebrow">{target && last && last.b === target.b && last.c === target.c ? 'Pick up where you left off' : 'Next in your journey'}</div>
          <div className="big">{target ? `${data.byId[target.b].name.replace(/\s*\(.*\)/, '')} ${target.c}` : 'In principio'}</div>
          {hero && <div className="muted small" style={{ marginTop: 2 }}>{hero.ttl}</div>}
          <div className="row" style={{ marginTop: 8 }}>
            {target && <Link className="btn solid" to={`/read/${target.b}/${target.c}`}>Continue reading</Link>}
            <Link className="btn" to="/journey">{PLAN_NAMES[s.plan] || 'Canonical order'} · change</Link>
          </div>
          <div style={{ marginTop: 12 }}><GoalLine goal={goal} s={s} /></div>
        </div>
        <div>
          <div className="stat"><b>{Math.round(tot.pct * 100)}%</b><span className="muted small">{tot.read.toLocaleString()} of {tot.total.toLocaleString()} verses</span></div>
          <div className="bar"><i style={{ width: `${tot.pct * 100}%` }} /></div>
          <div className="row small muted" style={{ marginTop: 6, gap: 14 }}><span>Old Testament {Math.round(ot.pct * 100)}%</span><span>New Testament {Math.round(nt.pct * 100)}%</span></div>
          <div className="stat" style={{ marginTop: 14 }}><b>{streak}</b><span className="muted small">day streak</span></div>
          <Streak cells={cells} />
        </div>
      </div>
    </div>
  );
}

function DesktopHome() {
  const j = useJourney(); const { p } = j;
  const books = data.books; const today = new Date(); const day = liturgicalDay(today);
  return (
    <div className="page fade-in">
      <header className="top">
        <h1><span className="orn">✦</span>Christ is King<span className="orn">✦</span></h1>
        <div className="subtitle">{today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} — {day.name}</div>
        <svg className="arches" width="260" height="26" viewBox="0 0 260 26" aria-hidden="true">
          <path d="M10 24 v-4 a20 20 0 0 1 40 0 v4 M60 24 v-4 a20 20 0 0 1 40 0 v4 M110 24 v-4 a20 20 0 0 1 40 0 v4 M160 24 v-4 a20 20 0 0 1 40 0 v4 M210 24 v-4 a20 20 0 0 1 40 0 v4" fill="none" stroke="#c9a45c" strokeWidth="1.4" opacity=".65" />
          <line x1="0" y1="25" x2="260" y2="25" stroke="#c9a45c" strokeWidth="1" opacity=".5" />
        </svg>
      </header>

      <div className="today-grid">
        <div className="card lit" style={{ '--lit': LIT_COLOR[day.color] }}>
          <h2 className="ch">Today <span className="hint">— the Church's year</span></h2>
          <div className="lit-name">{day.name}</div>
          <div className="lit-meta"><span className="swatch" />{day.season} · Year {day.cycle}{day.week && day.season === 'Ordinary Time' ? ` · week ${day.week}` : ''}</div>
          <div style={{ margin: '8px 0 12px' }}><FastChip date={today} /></div>
          <ReadingsList day={day} />
          <div className="row" style={{ marginTop: 10 }}><Link className="btn sm" to="/calendar">Calendar & every day's readings →</Link></div>
        </div>
        <div>
          <SaintCard date={today} />
          <div className="card" style={{ marginTop: 14 }}><h2 className="ch">Prayer <span className="hint">— for this day</span></h2><PrayerToday date={today} /></div>
        </div>
      </div>

      <div className="row3" style={{ marginTop: 14 }}>
        <ContinueCard j={j} />
        <div className="card"><DailyFive /></div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2 className="ch">Biblical index <span className="hint">— the Vulgate's 73 books · gold fills as you read</span></h2>
        {['OT', 'NT'].map(t => (
          <div key={t}>
            <div className="idx-h">{t === 'OT' ? 'Vetus Testamentum — Old Testament' : 'Novum Testamentum — New Testament'}</div>
            <div className="idx-grid">
              {books.filter(b => b.testament === t).map(b => { const x = bookProgress(p, b); return <Link key={b.id} to={`/book/${b.id}`} className={x.pct >= 1 ? 'done' : ''} title={`${b.latin} · ${b.chapters.length} chapters`}>{b.name.replace(/\s*\(.*\)/, '')}<div className="bar"><i style={{ width: `${x.pct * 100}%` }} /></div></Link>; })}
            </div>
          </div>
        ))}
      </div>

      <div className="study-grid" style={{ marginTop: 18 }}>
        {[['/explore', 'Timeline & map', '4,000 years, 120 events, the journeys of Abraham, Moses, Jesus and Paul'], ['/diagrams', 'Diagrams', 'the Tabernacle, the Temples, the Ark, Jerusalem, the tribes'], ['/people', 'People', `${data.people.length} lives, portraits and places`], ['/harmony', 'Harmony of the Gospels', 'the life of Christ scene by scene'], ['/prophecy', 'Prophecy & fulfilment', 'promise beside fulfilment, Hebrew beside Latin'], ['/quiz', 'Test yourself', 'who said it, where is it, what comes next'], ['/prayer', 'Prayers', 'the Rosary, the Stations, the Creeds — in Latin and English'], ['/saints', 'Saints', 'a life for every day of the year']].map(([to, t, d]) => <Link key={to} to={to} className="study"><div className="h">{t}</div><div className="d">{d}</div></Link>)}
      </div>

      <footer className="foot">Latin: Clementine Vulgate · English: Douay-Rheims, Berean, Catholic Public Domain Version, King James, World English, JPS 1917, Brenton’s Septuagint · Español: Reina-Valera 1909 · Greek: SBLGNT · Hebrew: Westminster Leningrad Codex · Strong's Concordance · cross-references from OpenBible.info · Latin dictionary from Whitaker's WORDS · art from Wikimedia Commons. Traditional dates follow the biblical chronologies; scholarly dates follow mainstream research.</footer>
    </div>
  );
}

// The phone's home: Today, then continue reading, then the ways in.
function MobileHome() {
  const j = useJourney(); const { p, s, tot, ot, nt, target, last, cells, streak, goal } = j;
  const m = useMemory(); const n = useNotes();
  const due = m.cards.filter(c => c.due <= Date.now()).length;
  const today = new Date(); const day = liturgicalDay(today);
  const hero = target && data.timeline.events.find(e => e.art && e.refs.some(r => r.b === target.b && r.c1 <= target.c && target.c <= r.c2));
  const books = data.books;
  return (
    <div className="page fade-in mhome">
      <header className="top m"><h1><span className="orn">✦</span>Christ is King<span className="orn">✦</span></h1><div className="subtitle">{today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div></header>

      <div className="card lit" style={{ '--lit': LIT_COLOR[day.color] }}>
        <div className="lit-name" style={{ fontSize: 18, marginTop: 0 }}>{day.name}</div>
        <div className="lit-meta"><span className="swatch" />{day.season} · Year {day.cycle}</div>
        <div style={{ margin: '6px 0 10px' }}><FastChip date={today} /></div>
        <ReadingsList day={day} compact />
        <Link className="btn sm" to="/calendar" style={{ marginTop: 8 }}>Calendar →</Link>
      </div>

      <SaintCard date={today} compact />

      <Link to={target ? `/read/${target.b}/${target.c}` : '/books'} className="mhero" style={{ marginTop: 12 }}>
        {hero && <ArtImg wp={hero.art.wp} alt="" />}
        <div className="in">
          <div className="eyebrow">{target && last && last.b === target.b && last.c === target.c ? 'Pick up where you left off' : 'Next in your journey'}</div>
          <div className="big">{target ? `${data.byId[target.b].name.replace(/\s*\(.*\)/, '')} ${target.c}` : 'In principio'}</div>
          <div className="muted">{hero ? hero.ttl : (target ? data.byId[target.b].latin : 'Genesis 1')} · tap to read</div>
        </div>
      </Link>
      <div className="mstats">
        <div><b>{Math.round(tot.pct * 100)}%</b><span>of the Bible</span></div>
        <div><b>{Math.round(nt.pct * 100)}%</b><span>New Testament</span></div>
        <div><b>{Math.round(ot.pct * 100)}%</b><span>Old Testament</span></div>
        <div><b>{streak}</b><span>day streak</span></div>
      </div>
      <div className="card" style={{ marginTop: 12 }}><div className="bar"><i style={{ width: `${tot.pct * 100}%` }} /></div><div style={{ marginTop: 10 }}><Streak cells={cells} /></div><div style={{ marginTop: 10 }}><GoalLine goal={goal} s={s} /></div></div>

      <div className="card" style={{ marginTop: 12 }}><h2 className="ch">Prayer today</h2><PrayerToday date={today} /></div>
      <div className="card" style={{ marginTop: 12 }}><DailyFive compact /></div>

      <div className="mquick">
        {[['/explore', '🗺', 'Map & timeline'], ['/diagrams', '📐', 'Diagrams'], ['/people', '👤', 'People'], ['/saints', '✧', 'Saints'], ['/prayer', '📿', 'Prayers'], ['/harmony', '✝', 'Gospels harmony'], ['/prophecy', '✡', 'Prophecy'], ['/quiz', '?', 'Test yourself'], ['/memory', '★', due ? `${due} cards due` : 'Memory verses'], ['/notebook', '✎', `Notebook${Object.keys(n.hl).length + Object.keys(n.notes).length ? ' · ' + (Object.keys(n.hl).length + Object.keys(n.notes).length) : ''}`], ['/journey', '⟶', 'Plan & goal'], ['/timeline', '📜', 'Chronicle']].map(([to, ic, t]) => <Link key={to} to={to} className="mq"><span className="ic">{ic}</span><span>{t}</span></Link>)}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 className="ch">Biblical index</h2>
        {['OT', 'NT'].map(t => (
          <div key={t}><div className="idx-h">{t === 'OT' ? 'Old Testament' : 'New Testament'}</div>
            <div className="idx-scroll">{books.filter(b => b.testament === t).map(b => { const x = bookProgress(p, b); return <Link key={b.id} to={`/book/${b.id}`} className={x.pct >= 1 ? 'done' : ''}>{b.abbr}<div className="bar"><i style={{ width: `${x.pct * 100}%` }} /></div></Link>; })}</div>
          </div>))}
      </div>
      <footer className="foot">Clementine Vulgate · Douay-Rheims · Berean · CPDV · King James · World English · JPS · Septuagint · Reina-Valera · SBLGNT · Leningrad Codex</footer>
    </div>
  );
}
