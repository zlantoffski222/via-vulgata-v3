import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, dailyNotes, loadText, useSettings } from '../store';
import { speak, speechSupported } from '../speech';

// Five New Testament passages for today: the Douay text, the Latin beneath, and the note on tap.
export default function DailyFive({ compact = false, list = false }) {
  const s = useSettings(); const scope = s.dailyScope || 'nt';
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(null);
  useEffect(() => {
    let on = true;
    const notes = dailyNotes(new Date(), scope);
    Promise.all(notes.map(async n => {
      const [en, la] = await Promise.all([loadText('drc', n.b), loadText('vul', n.b)]);
      const pick = (t) => { const vs = t[n.c - 1].slice(n.v1 - 1, n.v2); let out = ''; for (const v of vs) { if (out.length > 150) break; out += (out ? ' ' : '') + v; } return out.length > 190 ? out.slice(0, 180).replace(/\s\S*$/, '') + '…' : out; };
      const full = en[n.c - 1].slice(n.v1 - 1, n.v2).join(' ');
      return { n, en: pick(en), la: pick(la), full };
    })).then(x => on && setItems(x));
    return () => { on = false; };
  }, [scope]);
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <section>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>{!compact && <div className="eyebrow">Five for today</div>}<div className="muted small">{compact ? 'Five passages for ' + today + ' · tap one to learn more' : today + (scope === 'all' ? ' · from the whole Bible' : ' · from the New Testament') + ' · tap one to learn more'}</div></div>
        {speechSupported && items && <button className="btn sm" onClick={() => speak(items.map(x => ({ text: x.full, lang: 'en', label: `${data.byId[x.n.b].abbr} ${x.n.c}:${x.n.v1}` })), 'Five for today')}>▶ Listen</button>}
      </div>
      <div className={'daily' + (compact ? ' compact' : '') + (list ? ' list' : '')}>
        {(items || []).map(({ n, en }, i) => {
          const book = data.byId[n.b]; const isOpen = open === n.id;
          return (
            <div key={n.id} className={'d' + (isOpen ? ' open' : '')} onClick={() => setOpen(isOpen ? null : n.id)} role="button" tabIndex={0} aria-expanded={isOpen} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(isOpen ? null : n.id); } }}>
              <span className="num">{['I', 'II', 'III', 'IV', 'V'][i]}</span>
              <div className="q">{en}</div>
              <div className="ref">{book.name.replace(/\s*\(.*\)/, '')} {n.c}:{n.v1}{n.v2 !== n.v1 ? '–' + n.v2 : ''}</div>
            </div>
          );
        })}
        {!items && <div className="muted small">Choosing today's passages…</div>}
      </div>
      {items && items.filter(x => x.n.id === open).map(({ n, la }) => (
        <div className="daily-more fade-in" key={n.id}>
          <div className="lt">{la}</div>
          <div className="h">{n.t}</div>
          <p>{n.n}</p>
          <Link className="btn sm solid" to={`/read/${n.b}/${n.c}#note${n.id}`}>Read it in context</Link>
        </div>
      ))}
    </section>
  );
}
