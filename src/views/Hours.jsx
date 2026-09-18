import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { data, getJson, loadText } from '../store';
import { liturgicalDay, easter } from '../lectionary';
import Passage from '../components/Passage';
import { PrayerText } from './Prayer';
import { speak, speechSupported } from '../speech';

let cache = null;
export function useHours() { const [H, setH] = useState(cache); useEffect(() => { if (cache) return; getJson('/data/hours.json').then(j => { cache = j; setH(j); }).catch(() => setH(null)); }, []); return H; }

// Which Marian antiphon the season asks for
export function marianSeason(date = new Date()) {
  const y = date.getFullYear(); const d = new Date(y, date.getMonth(), date.getDate());
  const E = easter(y); const holyWed = new Date(E); holyWed.setDate(E.getDate() - 4); const pent = new Date(E); pent.setDate(E.getDate() + 49);
  const xmas = new Date(y, 11, 25); const dow = xmas.getDay(); const adv = new Date(xmas); adv.setDate(xmas.getDate() - (dow === 0 ? 7 : dow) - 21);
  const cand = new Date(y, 1, 2);
  if (d >= adv || d <= cand) return 'advent';
  if (d > cand && d <= holyWed) return 'lent';
  if (d >= E && d <= pent) return 'easter';
  return 'ordinary';
}

const Gloria = () => <p className="hour-gloria">Glory be to the Father, and to the Son, and to the Holy Spirit: as it was in the beginning, is now, and ever shall be, world without end. Amen.</p>;

export default function Hours() {
  const { which } = useParams(); const H = useHours(); const P = data.prayers;
  const today = new Date(); const dow = today.getDay(); const day = liturgicalDay(today);
  useEffect(() => { window.scrollTo(0, 0); }, [which]);
  if (!H) return <div className="page"><p className="muted">Loading…</p></div>;
  const night = which === 'night'; const hour = night ? H.night : H.morning; const d = hour.days[dow];
  const pater = P && P.prayers.find(x => x.id === 'pater');
  const ant = night ? H.night.antiphons[marianSeason(today)] : null;
  const listenAll = async () => {
    const items = []; const add = async (r, label) => { const t = await loadText('drc', r[0]); for (let v = r[2]; v <= r[3]; v++) { const s = t[r[1] - 1]?.[v - 1]; if (s) items.push({ text: s, lang: 'en', key: r[1] + ':' + v, label }); } };
    if (!night) await add(hour.invitatory, 'Invitatory'); await add(d.psalm, 'Psalm'); if (d.psalm2) await add(d.psalm2, 'Psalm'); if (d.otc) await add(d.otc.ref, d.otc.n); await add(d.reading, 'Reading'); await add(hour.canticle.ref, hour.canticle.n);
    if (pater) items.push({ text: pater.en, lang: 'en', key: 'pater', label: 'Our Father' }); items.push({ text: d.prayer, lang: 'en', key: 'prayer', label: 'Prayer' });
    if (ant) items.push({ text: ant.en, lang: 'en', key: 'ant', label: ant.n });
    speak(items, night ? 'Night Prayer' : 'Morning Prayer');
  };
  return (
    <div className="page fade-in prayer-page hours">
      <div className="eyebrow"><Link to="/prayer">Prayer</Link> · the Hours</div>
      <h1 className="title">{night ? 'Night Prayer' : 'Morning Prayer'} <span className="muted" style={{ fontWeight: 400, fontSize: '.6em' }}>· {day.name.startsWith(today.toLocaleDateString(undefined, { weekday: 'long' })) ? day.name : today.toLocaleDateString(undefined, { weekday: 'long' }) + ', ' + day.name}</span></h1>
      <div className="row" style={{ margin: '6px 0 12px' }}>
        <div className="seg"><Link className={!night ? 'on' : ''} to="/prayer/hours/morning" style={{ padding: '6px 13px', textDecoration: 'none' }}>Morning</Link><Link className={night ? 'on' : ''} to="/prayer/hours/night" style={{ padding: '6px 13px', textDecoration: 'none' }}>Night</Link></div>
        {speechSupported && <button className="btn sm" onClick={listenAll}>▶ Pray it aloud</button>}
      </div>
      <p className="lede">{H.intro}</p>

      <div className="hour">
        <div className="hour-step"><div className="eyebrow">Opening</div><p className="hour-p">O God, come to my assistance. — O Lord, make haste to help me.</p><Gloria /></div>
        {!night && <div className="hour-step"><div className="eyebrow">Invitatory</div><Passage r={hour.invitatory} /></div>}
        {night && <div className="hour-step"><div className="eyebrow">Examination of conscience</div><p className="hour-p">{H.night.examination} <Link to="/prayer/examen">A fuller examination →</Link></p><p className="hour-p"><i>I confess to almighty God…</i> — the Confiteor is under <Link to="/prayer#confiteor">the prayers</Link>.</p></div>}
        <div className="hour-step"><div className="eyebrow">{night ? 'Psalmody' : 'Psalm'}</div><Passage r={d.psalm} latin /><Gloria />{d.psalm2 && <><Passage r={d.psalm2} latin /><Gloria /></>}</div>
        {d.otc && <div className="hour-step"><div className="eyebrow">{d.otc.n}</div><Passage r={d.otc.ref} /><Gloria /></div>}
        <div className="hour-step"><div className="eyebrow">Short reading</div><Passage r={d.reading} /></div>
        {night && <div className="hour-step"><div className="eyebrow">Responsory</div><p className="hour-p">{H.night.responsory}</p></div>}
        <div className="hour-step"><div className="eyebrow">{hour.canticle.n}</div><Passage r={hour.canticle.ref} latin /><Gloria /></div>
        {!night && <div className="hour-step"><div className="eyebrow">Intercessions</div><p className="hour-p">Pray for the Church, for those who govern, for the poor and the sick, for the dead, and for what this day holds. Then:</p></div>}
        {pater && <div className="hour-step"><div className="eyebrow">Our Father</div><PrayerText p={pater} /></div>}
        <div className="hour-step"><div className="eyebrow">Prayer</div><p className="hour-p">{d.prayer} <b>Amen.</b></p></div>
        {night ? <>
          <div className="hour-step"><div className="eyebrow">Blessing</div><p className="hour-p">{H.night.closing}</p></div>
          <div className="hour-step"><div className="eyebrow">Antiphon to the Blessed Virgin · {ant.n}</div><div className="muted small" style={{ marginBottom: 6 }}>{ant.when}</div><PrayerText p={ant} /></div>
        </> : <div className="hour-step"><div className="eyebrow">Conclusion</div><p className="hour-p">May the Lord bless us, protect us from all evil and bring us to everlasting life. Amen.</p></div>}
      </div>
    </div>
  );
}

// The examination of conscience.
export function Examen() {
  const H = useHours(); const P = data.prayers;
  if (!H) return <div className="page"><p className="muted">Loading…</p></div>;
  const act = P && P.prayers.find(x => x.id === H.examen.act);
  return (
    <div className="page fade-in prayer-page">
      <div className="eyebrow"><Link to="/prayer">Prayer</Link> · evening</div>
      <h1 className="title">Examination of conscience</h1>
      <p className="lede">{H.examen.intro}</p>
      {H.examen.groups.map((g, i) => <div key={i} className="card" style={{ marginBottom: 12 }}><h2 className="ch">{g.h}</h2><ul className="examen">{g.qs.map((q, j) => <li key={j}>{q}</li>)}</ul></div>)}
      {act && <div className="card"><h2 className="ch">{act.n}</h2><PrayerText p={act} /></div>}
      <div className="row" style={{ marginTop: 14 }}><Link className="btn" to="/prayer/hours/night">Night Prayer →</Link></div>
    </div>
  );
}

// The Psalms: the psalm of the day, and the families of psalms with their uses.
const GROUPS = [
  ['The penitential psalms', 'the seven the Church prays in Lent and for the dying', [[6], [31], [37], [50], [101], [129], [142]]],
  ['The gradual psalms', 'the fifteen Songs of Ascents sung by pilgrims going up to Jerusalem', [[119, 133]]],
  ['The Hallel', 'sung at Passover — Jesus and the apostles sang these after the Last Supper', [[112, 117]]],
  ['The Great Hallel', 'twenty-six times: for his mercy endureth for ever', [[135]]],
  ['Psalms of creation', 'the heavens, the earth and everything in them', [[8], [18], [28], [103], [147]]],
  ['Psalms of the king', 'David and the greater son of David', [[2], [19], [20], [44], [71], [88], [109]]],
  ['Psalms of trust', 'the shepherd, the rock, the wings', [[22], [26], [61], [90], [120], [130]]],
  ['Psalms of the Passion', 'quoted on the cross and in the Passion narratives', [[21], [30], [40], [68]]],
  ['Sunday Vespers', 'the psalms sung at Sunday evening prayer for a thousand years', [[109, 113]]],
  ['Psalms of Compline', 'the night psalms', [[4], [90], [133]]],
  ['The longest and the shortest', 'Psalm 118, the alphabet of the Law; Psalm 116, two verses', [[118], [116]]],
];
export function Psalms() {
  const H = useHours(); const today = new Date(); const dow = today.getDay();
  const [openG, setOpenG] = useState(0);
  const morning = H ? H.morning.days[dow].psalm : null, night = H ? H.night.days[dow].psalm : null;
  const bk = data.byId.PSA;
  return (
    <div className="page fade-in prayer-page">
      <div className="eyebrow">The Psalter</div>
      <h1 className="title">The Psalms</h1>
      <p className="lede">A hundred and fifty prayers that Israel sang and the Church has never stopped singing — every one of them, every week, in monasteries; the Church's whole book of feeling, from rage to rapture. The Vulgate numbers them one behind the Hebrew from 10 to 147, so 'the Lord is my shepherd' is Psalm 22 here. In the Latin they were sung to the eight Gregorian tones, each psalm framed by an antiphon; the Sunday Vespers psalms (109–113) are the ones most people have heard.</p>
      {H && <div className="home-row three" style={{ marginTop: 0 }}>
        <div className="card"><h2 className="ch">This morning's psalm</h2><Passage r={morning} latin max={6} /><Link className="btn sm" to="/prayer/hours/morning">Morning Prayer →</Link></div>
        <div className="card"><h2 className="ch">Tonight's psalm</h2><Passage r={night} latin max={6} /><Link className="btn sm" to="/prayer/hours/night">Night Prayer →</Link></div>
        <div className="card"><h2 className="ch">Read the Psalter</h2><p className="stop-p" style={{ fontSize: 15 }}>Five books, like the Torah: 1–40, 41–71, 72–88, 89–105, 106–150, each ending in a doxology. Read one a day and you will have prayed it all by spring.</p><Link className="btn sm" to="/book/PSA">All 150 →</Link></div>
      </div>}
      <div className="section-h" style={{ marginTop: 18 }}><span className="eyebrow">Families of psalms</span></div>
      <div className="prayer-list">
        {GROUPS.map(([n, sub, ranges], i) => { const nums = ranges.flatMap(([a, b]) => Array.from({ length: (b || a) - a + 1 }, (_, k) => a + k)); const isOpen = openG === i; return (
          <div key={n} className={'prayer' + (isOpen ? ' open' : '')}>
            <button className="ph" onClick={() => setOpenG(isOpen ? -1 : i)}><div><div className="h">{n}</div><div className="muted small">{sub}</div></div><span className="chev">{isOpen ? '−' : '+'}</span></button>
            {isOpen && <div className="pb"><div className="row" style={{ gap: 6 }}>{nums.map(c => <Link key={c} to={`/read/PSA/${c}`} className="chip">Ps {c}</Link>)}</div>{nums.length <= 3 && nums.map(c => <Passage key={c} r={['PSA', c, 1, bk.chapters[c - 1]]} latin max={4} />)}</div>}
          </div>); })}
      </div>
    </div>
  );
}
