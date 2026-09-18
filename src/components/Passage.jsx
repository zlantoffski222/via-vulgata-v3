import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, loadText, useSettings } from '../store';

// A short passage quoted inline — Douay-Rheims by default, Latin beside it when asked — with a link into the reader.
export function refLabel([b, c, v1, v2]) { const bk = data.byId[b]; return `${bk ? bk.abbr : b} ${c}:${v1}${v2 && v2 !== v1 ? '–' + v2 : ''}`; }

export default function Passage({ r, latin = false, max = 0, className = '' }) {
  const s = useSettings();
  const [b, c, v1, v2 = v1] = r; const bk = data.byId[b];
  const [en, setEn] = useState(null); const [la, setLa] = useState(null);
  useEffect(() => {
    let on = true;
    if (!bk) return;
    loadText('drc', b).then(t => on && setEn((t[c - 1] || []).slice(v1 - 1, v2)));
    if (latin) loadText('vul', b).then(t => on && setLa((t[c - 1] || []).slice(v1 - 1, v2)));
    return () => { on = false; };
  }, [b, c, v1, v2, latin]);
  if (!bk) return null;
  const lines = en ? en.map((t, i) => ({ v: v1 + i, en: t, la: la ? la[i] : null })) : [];
  const shown = max && lines.length > max ? lines.slice(0, max) : lines;
  return (
    <div className={'passage ' + className}>
      <Link to={`/read/${b}/${c}#v${v1}`} className="pref">{refLabel(r)}<span className="muted small"> · open in the reader</span></Link>
      {!en && <div className="muted small">…</div>}
      {shown.map(l => <p key={l.v} className="pl"><sup>{l.v}</sup>{latin && l.la ? <><span className="la">{l.la}</span> <span className="en">{l.en}</span></> : l.en}</p>)}
      {max && lines.length > max ? <Link to={`/read/${b}/${c}#v${v1}`} className="muted small">… {lines.length - max} more verses</Link> : null}
      {s.showLatin === false && null}
    </div>
  );
}
