import React from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { data, useProgress, useSettings, totalProgress, bookProgress, nextCanon, nextInPlan, chapterDone, goalStatus, useMemory, useNotes, activePlan, PLAN_NAMES, saintFor, stopFor } from '../store';
import DailyFive from '../components/DailyFive';
import { ReadingsList } from './Calendar';
import { liturgicalDay } from '../lectionary';
import { useIsMobile } from '../hooks';
import ArtImg from '../components/ArtImg';
import { SaintCard, FastChip, PrayerToday, LIT_COLOR } from '../components/TodayCards';
import { DIAGRAMS } from '../diagrams';

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
  const hero = target && data.timeline.events.find(e => e.art && e.refs.some(r => r.b === target.b && r.c1 <= target.c && target.c <= r.c2));
  const stop = s.plan === 'story' && target ? stopFor(target.b, target.c) : null;
  const readTo = target ? `/read/${target.b}/${target.c}${stop ? '?story=' + stop.n : ''}` : '/books';
  return { p, s, tot, ot, nt, target, last, cells, streak, goal, hero, stop, readTo };
}
const Streak = ({ cells }) => <div className="streak">{cells.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}</div>;

export default function Home() {
  const mobile = useIsMobile(); const [sp] = useSearchParams();
  if (sp.get('loc') || sp.get('ev') || sp.get('route')) return <Navigate to={'/explore?' + sp.toString()} replace />;
  return mobile ? <MobileHome /> : <DesktopHome />;
}

// The masthead: name, date, the Church's day.
function Masthead({ day, today, mobile }) {
  return (
    <header className={'top' + (mobile ? ' m' : '')}>
      <h1><span className="orn">✦</span>Christ is King<span className="orn">✦</span></h1>
      <div className="subtitle"><span className="lit-dot" style={{ '--lit': LIT_COLOR[day.color] }} />{today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: mobile ? undefined : 'numeric' })}{!mobile && <> — {day.name}</>}</div>
      {!mobile && <svg className="arches" width="260" height="26" viewBox="0 0 260 26" aria-hidden="true">
        <path d="M10 24 v-4 a20 20 0 0 1 40 0 v4 M60 24 v-4 a20 20 0 0 1 40 0 v4 M110 24 v-4 a20 20 0 0 1 40 0 v4 M160 24 v-4 a20 20 0 0 1 40 0 v4 M210 24 v-4 a20 20 0 0 1 40 0 v4" fill="none" stroke="#c9a45c" strokeWidth="1.4" opacity=".65" />
        <line x1="0" y1="25" x2="260" y2="25" stroke="#c9a45c" strokeWidth="1" opacity=".5" />
      </svg>}
    </header>
  );
}

// The week ahead: seven days, each with its feast or its place in the season.
function WeekAhead({ today }) {
  const days = [];
  for (let i = 0; i < 7; i++) { const d = new Date(today); d.setDate(today.getDate() + i); const ld = liturgicalDay(d); const st = saintFor(d); const feast = st && st.r !== 'trad' && st.r !== 'optional' ? st.n : null; days.push({ d, ld, st, feast }); }
  return (
    <div className="week">
      {days.map(({ d, ld, st, feast }, i) => (
        <Link key={i} to={`/calendar?d=${ymd(d)}`} className={'wd' + (i === 0 ? ' today' : '')} style={{ '--lit': LIT_COLOR[ld.color] }}>
          <span className="dow">{i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
          <span className="num">{d.getDate()}</span>
          <span className="what">{feast || (d.getDay() === 0 ? ld.name.replace(/ in Ordinary Time| of Advent| of Lent| of Easter/, '') : st ? st.n : ld.season)}</span>
        </Link>
      ))}
    </div>
  );
}

// Continue reading: the next chapter under its painting, with the progress that got you here.
function ContinueCard({ j }) {
  const { s, tot, ot, nt, target, last, cells, streak, goal, hero, stop, readTo } = j;
  const name = target ? `${data.byId[target.b].name.replace(/\s*\(.*\)/, '')} ${target.c}` : 'In principio';
  return (
    <div className="card cont">
      <Link to={readTo} className="cont-hero">
        {(stop || hero) && <ArtImg wp={stop ? stop.art : hero.art.wp} alt="" />}
        <div className="in">
          <div className="eyebrow">{stop ? `The story · stop ${stop.n} of ${data.story.stops.length}` : target && last && last.b === target.b && last.c === target.c ? 'Pick up where you left off' : 'Next in your journey'}</div>
          <div className="big">{stop ? stop.t : name}</div>
          <div className="sub">{stop ? name : hero ? hero.ttl : target ? data.byId[target.b].latin : 'Genesis 1'}</div>
        </div>
      </Link>
      <div className="cont-body">
        <div className="row" style={{ gap: 8 }}>
          {target && <Link className="btn solid sm" to={readTo}>Continue reading</Link>}
          <Link className="btn sm" to="/journey">{PLAN_NAMES[s.plan] || 'Canonical order'}</Link>
        </div>
        <div className="cont-stats">
          <div><b>{Math.round(tot.pct * 100)}%</b><span>of the Bible</span></div>
          <div><b>{Math.round(ot.pct * 100)}%</b><span>Old Testament</span></div>
          <div><b>{Math.round(nt.pct * 100)}%</b><span>New Testament</span></div>
          <div><b>{streak}</b><span>day streak</span></div>
        </div>
        <div className="bar"><i style={{ width: `${tot.pct * 100}%` }} /></div>
        <Streak cells={cells} />
        <div className="muted small" style={{ marginTop: 8 }}>{goal ? `${goal.perDay > 0 ? Math.ceil(goal.perDay * 10) / 10 + ' chapters a day' : 'Done'} to finish ${goal.label} by ${new Date(s.goal.date + 'T12:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} · ${goal.ahead >= 0 ? Math.round(goal.ahead) + ' ahead' : Math.round(-goal.ahead) + ' behind'}` : <Link to="/journey#goal">Set a finishing date →</Link>}</div>
      </div>
    </div>
  );
}

const WAYS = [
  ['/story', 'The story', () => `${data.story.stops.length} stops`, 'The whole Bible as one guided path, Genesis to the Apocalypse, read like a novel', 'M4 19V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM8 7h8M8 11h6'],
  ['/books', 'The Bible', 'seventy-three books', 'Latin and English side by side, in eleven versions', 'M4 4h5a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6z'],
  ['/explore', 'Timeline & map', '120 events', 'Four thousand years and the journeys of Abraham, Moses, Jesus and Paul', 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14'],
  ['/people', 'People', () => `${data.people.length} lives`, 'Portraits, chapters, events and places for every major figure', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7'],
  ['/harmony', 'Harmony of the Gospels', () => `${data.harmony?.sections.reduce((a, s) => a + s.items.length, 0) || 0} scenes`, 'The life of Christ scene by scene, four Gospels side by side', 'M12 3v18M6 8h12M8 21h8'],
  ['/prophecy', 'Prophecy & fulfilment', () => `${data.prophecy.length} pairs`, 'The promise beside the passage that claims it, Hebrew beside Latin', 'M4 12h6l2-5 3 10 2-5h3M4 19h16'],
  ['/diagrams', 'Diagrams', () => `${DIAGRAMS.length} drawings`, 'The Tabernacle, the Temples, the Ark, Jerusalem, the tribes, the kingdoms', 'M4 4h16v16H4zM4 12h16M12 4v16'],
  ['/prayer', 'Prayer', 'Latin & English', 'The Rosary, the Stations, the Chaplet, the Creeds, lectio divina', 'M12 2v6M9 5h6M8 22c0-6 1-9 4-14 3 5 4 8 4 14z'],
  ['/saints', 'Saints', '366 lives', 'A saint for every day of the year, with the Scripture of the feast', 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'],
  ['/quiz', 'Test yourself', 'six kinds of question', 'Who said it, where is it, who is this, what comes next', 'M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18h.01'],
  ['/journey', 'Reading plan', 'three orders', 'Canonical, story order, or the life of Christ — with a finishing date', 'M5 20c0-6 4-6 7-9s3-6 0-8M12 3l3 1-3 1M5 20l2 1-2 1'],
  ['/notebook', 'Notebook', s => s.nb ? `${s.nb} marks` : 'yours to fill', 'Every highlight and note you make, by book, exportable', 'M5 4h10l4 4v12H5zM15 4v4h4M8 13h8M8 17h5'],
  ['/memory', 'Memory verses', s => s.due ? `${s.due} due` : s.cards ? `${s.cards} cards` : 'learn by heart', 'Verses by heart with spaced repetition, in English or Latin', 'M12 21s-7-4.6-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.4-9 9-9 9z'],
];
export function Ways({ cols }) {
  const m = useMemory(); const n = useNotes();
  const st = { due: m.cards.filter(c => c.due <= Date.now()).length, cards: m.cards.length, nb: Object.keys(n.hl).length + Object.keys(n.notes).length };
  return (
    <div className="ways" style={cols ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}>
      {WAYS.map(([to, t, sub, d, path]) => <Link key={to} to={to} className="way">
        <svg viewBox="0 0 24 24"><path d={path} /></svg>
        <div className="in"><div className="h">{t}</div><div className="sub">{typeof sub === 'function' ? sub(st) : sub}</div>{d && <div className="d">{d}</div>}</div>
      </Link>)}
    </div>
  );
}

function Index({ p, books, mobile }) {
  return (
    <div className="card">
      <h2 className="ch">Biblical index <span className="hint">{mobile ? '' : '— the Vulgate\'s 73 books · gold fills as you read'}</span></h2>
      {['OT', 'NT'].map(t => (
        <div key={t}>
          <div className="idx-h">{t === 'OT' ? 'Vetus Testamentum — Old Testament' : 'Novum Testamentum — New Testament'}</div>
          {mobile
            ? <div className="idx-scroll">{books.filter(b => b.testament === t).map(b => { const x = bookProgress(p, b); return <Link key={b.id} to={`/book/${b.id}`} className={x.pct >= 1 ? 'done' : ''}>{b.abbr}<div className="bar"><i style={{ width: `${x.pct * 100}%` }} /></div></Link>; })}</div>
            : <div className="idx-grid">{books.filter(b => b.testament === t).map(b => { const x = bookProgress(p, b); return <Link key={b.id} to={`/book/${b.id}`} className={x.pct >= 1 ? 'done' : ''} title={`${b.latin} · ${b.chapters.length} chapters`}>{b.name.replace(/\s*\(.*\)/, '')}<div className="bar"><i style={{ width: `${x.pct * 100}%` }} /></div></Link>; })}</div>}
        </div>
      ))}
    </div>
  );
}

const FOOT = 'Latin: Clementine Vulgate · English: Douay-Rheims, Berean, Catholic Public Domain Version, King James, World English, JPS 1917, Brenton’s Septuagint · Español: Reina-Valera 1909 · Greek: SBLGNT · Hebrew: Westminster Leningrad Codex · Strong’s Concordance · cross-references from OpenBible.info · Latin dictionary from Whitaker’s WORDS · art from Wikimedia Commons. Traditional dates follow the biblical chronologies; scholarly dates follow mainstream research.';

function DesktopHome() {
  const j = useJourney(); const { p } = j;
  const books = data.books; const today = new Date(); const day = liturgicalDay(today);
  return (
    <div className="page home fade-in">
      <Masthead day={day} today={today} />

      <section className="home-row today-row">
        <div className="card lit" style={{ '--lit': LIT_COLOR[day.color] }}>
          <h2 className="ch">Today <span className="hint">— the Church's year</span></h2>
          <div className="lit-name">{day.name}</div>
          <div className="lit-meta"><span className="swatch" />{day.season} · Year {day.cycle}{day.week && day.season === 'Ordinary Time' ? ` · week ${day.week}` : ''}</div>
          <div style={{ margin: '8px 0 12px' }}><FastChip date={today} /></div>
          <ReadingsList day={day} />
          <div className="spacer" />
          <div className="idx-h" style={{ marginTop: 14 }}>The week ahead</div>
          <WeekAhead today={today} />
          <div className="row" style={{ marginTop: 12 }}><Link className="btn sm" to="/calendar">The whole calendar →</Link></div>
        </div>
        <SaintCard date={today} tall />
      </section>

      <section className="home-row three">
        <ContinueCard j={j} />
        <div className="card"><h2 className="ch">Prayer <span className="hint">— for this day</span></h2><PrayerToday date={today} /><div className="spacer" /><div className="row" style={{ marginTop: 12 }}><Link className="btn sm" to="/prayer">All the prayers →</Link></div></div>
        <div className="card"><DailyFive list /></div>
      </section>

      <section className="home-row">
        <div>
          <div className="section-h"><span className="eyebrow">Ways into the book</span></div>
          <Ways />
        </div>
      </section>

      <section className="home-row"><Index p={p} books={books} /></section>
      <footer className="foot">{FOOT}</footer>
    </div>
  );
}

// The phone's home: Today, then continue reading, then the ways in.
function MobileHome() {
  const j = useJourney(); const { p, s, tot, ot, nt, target, last, cells, streak, goal, hero, stop, readTo } = j;
  const today = new Date(); const day = liturgicalDay(today);
  const books = data.books;
  return (
    <div className="page home fade-in mhome">
      <Masthead day={day} today={today} mobile />

      <div className="card lit" style={{ '--lit': LIT_COLOR[day.color] }}>
        <div className="lit-name" style={{ fontSize: 18, marginTop: 0 }}>{day.name}</div>
        <div className="lit-meta"><span className="swatch" />{day.season} · Year {day.cycle}</div>
        <div style={{ margin: '6px 0 10px' }}><FastChip date={today} /></div>
        <ReadingsList day={day} compact />
        <div className="idx-h" style={{ marginTop: 10 }}>The week ahead</div>
        <WeekAhead today={today} />
      </div>

      <SaintCard date={today} compact />

      <Link to={readTo} className="mhero" style={{ marginTop: 12 }}>
        {(stop || hero) && <ArtImg wp={stop ? stop.art : hero.art.wp} alt="" />}
        <div className="in">
          <div className="eyebrow">{stop ? `The story · stop ${stop.n}` : target && last && last.b === target.b && last.c === target.c ? 'Pick up where you left off' : 'Next in your journey'}</div>
          <div className="big">{stop ? stop.t : target ? `${data.byId[target.b].name.replace(/\s*\(.*\)/, '')} ${target.c}` : 'In principio'}</div>
          <div className="muted">{stop ? `${data.byId[target.b].name.replace(/\s*\(.*\)/, '')} ${target.c}` : hero ? hero.ttl : (target ? data.byId[target.b].latin : 'Genesis 1')} · tap to read</div>
        </div>
      </Link>
      <div className="mstats">
        <div><b>{Math.round(tot.pct * 100)}%</b><span>of the Bible</span></div>
        <div><b>{Math.round(nt.pct * 100)}%</b><span>New Testament</span></div>
        <div><b>{Math.round(ot.pct * 100)}%</b><span>Old Testament</span></div>
        <div><b>{streak}</b><span>day streak</span></div>
      </div>
      <div className="card" style={{ marginTop: 12 }}><div className="bar"><i style={{ width: `${tot.pct * 100}%` }} /></div><div style={{ marginTop: 10 }}><Streak cells={cells} /></div><div className="muted small" style={{ marginTop: 8 }}>{goal ? `${Math.ceil(goal.perDay * 10) / 10} chapters a day to finish ${goal.label} by ${new Date(s.goal.date + 'T12:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}` : <Link to="/journey#goal">Set a finishing date →</Link>} · <Link to="/journey">{PLAN_NAMES[s.plan] || 'Canonical order'}</Link></div></div>

      <div className="card" style={{ marginTop: 12 }}><h2 className="ch">Prayer today</h2><PrayerToday date={today} /></div>
      <div className="card" style={{ marginTop: 12 }}><DailyFive compact list /></div>

      <div className="section-h" style={{ marginTop: 16 }}><span className="eyebrow">Ways into the book</span></div>
      <Ways cols={2} />

      <div style={{ marginTop: 12 }}><Index p={p} books={books} mobile /></div>
      <footer className="foot">Clementine Vulgate · Douay-Rheims · Berean · CPDV · King James · World English · JPS · Septuagint · Reina-Valera · SBLGNT · Leningrad Codex</footer>
    </div>
  );
}
