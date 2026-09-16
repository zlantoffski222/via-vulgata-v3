import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, loadText } from '../store';

// Cross references for one verse: [[book, chapter, v1, v2], …] with the Douay text of each target.
export default function XrefList({ refs, onGo, compact = false }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let on = true; if (!refs || !refs.length) { setRows([]); return; }
    Promise.all(refs.map(async ([b, c, v1, v2]) => {
      const book = data.byId[b]; if (!book) return null;
      const t = await loadText('drc', b); const vs = (t[c - 1] || []).slice(v1 - 1, v2); let text = vs.join(' '); if (text.length > 220) text = text.slice(0, 210).replace(/\s\S*$/, '') + '…';
      return { b, c, v1, v2, book, text, label: `${book.abbr} ${c}:${v1}${v2 !== v1 ? '–' + v2 : ''}` };
    })).then(r => on && setRows(r.filter(Boolean)));
    return () => { on = false; };
  }, [refs]);
  if (!refs || !refs.length) return <p className="muted small" style={{ margin: '8px 0' }}>No cross-references recorded for this verse.</p>;
  return (
    <div className={'xrefs' + (compact ? ' compact' : '')}>
      {(rows || []).map(r => <Link key={r.label} to={`/read/${r.b}/${r.c}#v${r.v1}`} onClick={() => onGo && onGo()} className="xref"><b>{r.label}</b><span>{r.text}</span></Link>)}
      {!rows && <div className="muted small">Looking up the passages…</div>}
      {rows && <div className="help">From the OpenBible.info cross-reference set (CC-BY), the strongest links first.</div>}
    </div>
  );
}
