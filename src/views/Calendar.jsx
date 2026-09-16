import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, loadText, useProgress, readSet } from '../store';
import { liturgicalDay } from '../lectionary';
import DailyFive from '../components/DailyFive';
import { speak, speechSupported } from '../speech';

const COL = { green: '#2f6a4f', violet: '#5a3d7a', rose: '#c96b7a', white: '#b08d3e', red: '#7b2d26' };
const fmt = d => d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export function ReadingsList({ day, compact = false }) {
  const p = useProgress();
  const [texts, setTexts] = useState({});
  useEffect(() => { let on = true; Promise.all(day.refs.map(async r => { if (!r.book) return null; const t = await loadText('drc', r.b); const [c, v1, v2] = r.parts[0]; let s = (t[c - 1] || []).slice(v1 - 1, Math.min(v2, v1 + 2)).join(' '); if (s.length > 200) s = s.slice(0, 190).replace(/\s\S*$/, '') + '…'; return [r.ref, s]; })).then(rs => on && setTexts(Object.fromEntries(rs.filter(Boolean)))); return () => { on = false; }; }, [day]);
  const names = day.gospelOnly ? ['Gospel'] : day.refs.length === 5 ? ['First reading', 'Second reading', 'Third reading', 'Epistle', 'Gospel'] : day.refs.length === 6 ? ['Night: first reading', 'Night: second reading', 'Night: Gospel', 'Day: first reading', 'Day: second reading', 'Day: Gospel'] : day.refs.length === 2 ? ['First reading', 'Gospel'] : ['First reading', 'Second reading', 'Gospel'];
  const isRead = r => { if (!r.book) return false; return r.parts.every(([c, v1, v2]) => { const set = readSet(p, r.b, c); for (let v = v1; v <= v2; v++) if (!set.has(v)) return false; return true; }); };
  if (!day.refs.length) return <p className="muted small">No proper readings are listed for this day in the app's tables — the weekday readings of this season continue from the Sunday.</p>;
  return (
    <div className={'readings' + (compact ? ' compact' : '')}>
      {day.refs.map((r, i) => <Link key={r.ref} to={r.book ? `/read/${r.b}/${r.c}#v${r.v}` : '#'} className={'reading' + (isRead(r) ? ' rd' : '')}>
        <div className="rk">{names[i] || 'Reading'}</div><div className="rr">{r.label}{isRead(r) && <span className="tick"> ✓</span>}</div>
        {!compact && <div className="rt">{texts[r.ref] || '…'}</div>}
      </Link>)}
    </div>
  );
}

export default function Calendar() {
  const [date, setDate] = useState(() => new Date());
  const day = useMemo(() => liturgicalDay(date), [date]);
  const today = new Date(); const isToday = date.toDateString() === today.toDateString();
  const shift = n => { const d = new Date(date); d.setDate(d.getDate() + n); setDate(d); };
  // month grid
  const first = new Date(date.getFullYear(), date.getMonth(), 1); const startDow = first.getDay(); const nDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells = []; for (let i = 0; i < startDow; i++) cells.push(null); for (let d = 1; d <= nDays; d++) cells.push(new Date(date.getFullYear(), date.getMonth(), d));
  const listenAll = async () => { const items = []; for (const r of day.refs) { if (!r.book) continue; const t = await loadText('drc', r.b); for (const [c, v1, v2] of r.parts) for (let v = v1; v <= v2; v++) { const s = t[c - 1]?.[v - 1]; if (s) items.push({ text: s, lang: 'en', key: c + ':' + v, label: `${r.book.abbr} ${c}:${v}` }); } } speak(items, day.name); };
  return (
    <div className="page fade-in">
      <div className="eyebrow">The Church's year</div>
      <h1 className="title">Readings of the day</h1>
      <div className="grid2" style={{ marginTop: 14 }}>
        <div>
          <div className="card lit" style={{ '--lit': COL[day.color] || COL.green }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button className="btn sm" onClick={() => shift(-1)}>← Yesterday</button>
              <div className="muted small sans">{fmt(date)}{!isToday && <button className="btn sm ghost" onClick={() => setDate(new Date())} style={{ marginLeft: 6 }}>today</button>}</div>
              <button className="btn sm" onClick={() => shift(1)}>Tomorrow →</button>
            </div>
            <div className="lit-name">{day.name}</div>
            <div className="lit-meta"><span className="swatch" />{day.season} · Year {day.cycle}{day.week && day.season === 'Ordinary Time' ? ` · week ${day.week}` : ''} · weekday cycle {day.weekdayCycle}</div>
            <ReadingsList day={day} />
            {speechSupported && day.refs.length > 0 && <div className="row" style={{ marginTop: 10 }}><button className="btn" onClick={listenAll}>▶ Listen to today's readings</button></div>}
            <div className="help" style={{ marginTop: 10 }}>Sundays, solemnities and the weekday Gospels of Ordinary Time follow the Roman Lectionary; responsorial psalms and the weekday first readings are not included. Epiphany and the Ascension are shown on their transferred Sundays, as in most English-speaking dioceses.</div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2 className="ch">{date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} <span className="hint">— tap a day</span></h2>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}><button className="btn sm" onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}>← month</button><button className="btn sm" onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}>month →</button></div>
            <div className="cal">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="dow">{d}</div>)}
              {cells.map((d, i) => { if (!d) return <div key={i} />; const ld = liturgicalDay(d); const sel = d.toDateString() === date.toDateString(); return <button key={i} className={'day' + (sel ? ' sel' : '') + (d.toDateString() === today.toDateString() ? ' today' : '') + (ld.key || ld.feast ? ' big' : '')} style={{ '--lit': COL[ld.color] || COL.green }} onClick={() => setDate(d)} title={ld.name}>{d.getDate()}</button>; })}
            </div>
          </div>
        </div>
        <div className="card"><DailyFive /></div>
      </div>
    </div>
  );
}
