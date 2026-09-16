import React, { useEffect, useState } from 'react';
import { data, loadText, versionHasBook } from '../store';

// One verse in every version the app carries, laid side by side.
export default function CompareVerse({ book, c, v, la, drc, onClose }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let on = true;
    Promise.all(data.versions.filter(x => x.id !== 'drc').map(async x => {
      if (!versionHasBook(x.id, book.id)) return { id: x.id, label: x.label, text: null, note: 'book not included' };
      const t = await loadText(x.id, book.id); const key = c + ':' + v;
      let txt = t.v[c - 1]?.[v - 1] || ''; if (Array.isArray(txt)) txt = txt.map(w => w[0]).join(' ');
      return { id: x.id, label: x.label, text: txt || null, note: t.m.includes(key) ? 'no matching verse' : t.j.includes(key) ? 'joined with the previous verse' : '', ref: t.r[key] || '' };
    })).then(r => on && setRows(r));
    return () => { on = false; };
  }, [book.id, c, v]);
  return (
    <div className="compare" onClick={e => e.stopPropagation()}>
      <div className="cv"><b>Vulgate</b><span>{la}</span></div>
      <div className="cv"><b>Douay-Rheims</b><span>{drc}</span></div>
      {rows ? rows.map(r => <div className="cv" key={r.id}><b>{r.label}{r.ref && <span className="ref">{r.ref}</span>}</b><span dir={r.id === 'heb' ? 'rtl' : 'ltr'} className={r.id === 'heb' ? 'he' : r.id === 'grc' ? 'grc' : ''}>{r.text || <i className="muted">— {r.note}</i>}</span></div>) : <div className="cv"><b>…</b><span className="muted">loading</span></div>}
      <div style={{ textAlign: 'right', marginTop: 4 }}><button className="btn sm ghost" onClick={onClose}>Close</button></div>
    </div>
  );
}
