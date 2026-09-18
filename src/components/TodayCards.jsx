import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { data, useSettings, settingsStore, saintFor } from '../store';
import { liturgicalDay } from '../lectionary';
import { fastingFor, RULES, LEVEL_COLOR } from '../fasting';
import ArtImg from './ArtImg';
import Sheet from './Sheet';

export const LIT_COLOR = { green: '#2f6a4f', violet: '#5a3d7a', rose: '#c96b7a', white: '#b08d3e', red: '#7b2d26' };
const RANK = { solemnity: 'Solemnity', feast: 'Feast', memorial: 'Memorial', optional: 'Optional memorial', trad: 'Traditional calendar' };

// The saint of the day, with portrait and a short life.
export function SaintCard({ date = new Date(), compact = false, tall = false }) {
  const s = saintFor(date); if (!s) return null;
  return (
    <Link to={`/saints/${s.d}`} className={'saint-card' + (compact ? ' compact' : '') + (tall ? ' tall' : '')}>
      <div className="pic"><ArtImg wp={s.wp} alt="" loading="lazy" /></div>
      <div className="in">
        <div className="eyebrow">Saint of the day · {RANK[s.r] || ''}</div>
        <div className="h">{s.n}</div>
        <div className="t">{s.t}{s.y ? ` · † ${s.y}` : ''}</div>
        {!compact && <p className="b">{s.b}</p>}
        {compact && <p className="b clamp">{s.b}</p>}
        {tall && <div className="more"><span className="btn sm">Read the life →</span><span className="muted small">and a saint for every other day</span></div>}
      </div>
    </Link>
  );
}

// What today asks: fast, abstinence, penance — under the chosen discipline, with a sheet to explain and switch.
export function FastChip({ date = new Date() }) {
  const s = useSettings(); const rule = s.fastRule || 'catholic';
  const f = fastingFor(date, rule); const [open, setOpen] = useState(false);
  return (<>
    <button className="fast-chip" style={{ '--fc': LEVEL_COLOR[f.level] }} onClick={() => setOpen(true)}><i />{f.title}<span className="muted small"> · {RULES.find(r => r[0] === rule)[1]}</span></button>
    <Sheet open={open} onClose={() => setOpen(false)} title="Fasting and abstinence">
      <div className="seg" style={{ marginBottom: 12 }}>{RULES.map(([id, n]) => <button key={id} className={rule === id ? 'on' : ''} onClick={() => settingsStore.set({ fastRule: id })}>{n}</button>)}</div>
      <div className="fast-big" style={{ '--fc': LEVEL_COLOR[f.level] }}><i /><div><b>{f.title}</b><div className="muted">{date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div></div></div>
      {f.detail && <p style={{ lineHeight: 1.55 }}>{f.detail}</p>}
      {f.notes.map((n, i) => <p key={i} className="muted small" style={{ lineHeight: 1.5 }}>{n}</p>)}
      <div className="help">Catholic: the law of the Latin Church since 1966 — fasting and abstinence on Ash Wednesday and Good Friday, abstinence on the Fridays of Lent, penance on every Friday. Traditional: the fuller discipline before 1966 — the whole of Lent, the Ember days and the vigils. Orthodox: the Byzantine fasts of Wednesday, Friday and the four fasting seasons. None of this replaces your confessor's or your bishop's guidance.</div>
    </Sheet>
  </>);
}

// The liturgical day in one line, coloured.
export function LitLine({ date = new Date() }) {
  const day = liturgicalDay(date);
  return <div className="lit-meta" style={{ '--lit': LIT_COLOR[day.color] }}><span className="swatch" />{day.season} · Year {day.cycle}{day.week && day.season === 'Ordinary Time' ? ` · week ${day.week}` : ''}</div>;
}

// Which Rosary mysteries fall today, and whether it is the Angelus or the Regina Caeli.
export function PrayerToday({ date = new Date() }) {
  const P = data.prayers; if (!P) return null;
  const set = P.rosary.sets.find(x => x.id === P.rosary.days[String(date.getDay())]);
  const day = liturgicalDay(date); const easterTide = day.season === 'Easter';
  return (
    <div className="pray-today">
      <Link to="/prayer/hours/morning" className="pt"><div className="eyebrow">When you rise</div><div className="h">Morning Prayer</div><div className="muted small">The psalm of the day, a reading and the Benedictus</div></Link>
      <Link to={`/prayer/rosary`} className="pt"><div className="eyebrow">Today's Rosary</div><div className="h">{set.n}</div><div className="muted small">{set.m.map(m => m.n).join(' · ')}</div></Link>
      <Link to={`/prayer#${easterTide ? 'regina' : 'angelus'}`} className="pt"><div className="eyebrow">Morning, noon and evening</div><div className="h">{easterTide ? 'Regina Caeli' : 'The Angelus'}</div><div className="muted small">{easterTide ? 'In Eastertide the Regina Caeli replaces the Angelus' : 'The Annunciation in three verses and three Hail Marys'}</div></Link>
      <Link to="/prayer/hours/night" className="pt"><div className="eyebrow">Before sleep</div><div className="h">Night Prayer</div><div className="muted small">Examination, the night psalm, the Nunc dimittis and the Salve</div></Link>
    </div>
  );
}
