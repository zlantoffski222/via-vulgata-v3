import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { data, loadStrongs, loadSide } from '../store';

// A verse of the Greek or Hebrew text as tappable words; each word opens its Strong's entry.
export function OrigText({ tokens, lang, onWord }) {
  if (!tokens) return null;
  return <span className={'orig ' + lang} dir={lang === 'he' ? 'rtl' : 'ltr'} lang={lang === 'he' ? 'he' : 'grc'}>
    {tokens.map((t, i) => <React.Fragment key={i}><span className={'gw' + (t[1] ? ' has' : '')} onClick={e => { e.stopPropagation(); if (t[1]) onWord(t, e.currentTarget); }}>{t[0]}</span>{' '}</React.Fragment>)}
  </span>;
}

export function StrongsPopover({ token, anchor, onClose }) {
  const [entry, setEntry] = useState(undefined);
  const [occ, setOcc] = useState(null); const [showAll, setShowAll] = useState(false);
  const ref = useRef(null); const num = token[1];
  useEffect(() => { let on = true; setEntry(undefined); setOcc(null); setShowAll(false); loadStrongs().then(d => { if (on) setEntry(d[num] || null); }); return () => { on = false; }; }, [num]);
  useEffect(() => { if (!showAll) return; let on = true; const g = num[0] + Math.floor(+num.slice(1) / 100); loadSide('strongs', g).then(d => { if (on) setOcc((d && d[num]) || []); }); return () => { on = false; }; }, [showAll, num]);
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; const c = e => { if (ref.current && !ref.current.contains(e.target) && e.target !== anchor) onClose(); }; window.addEventListener('keydown', k); window.addEventListener('pointerdown', c, true); return () => { window.removeEventListener('keydown', k); window.removeEventListener('pointerdown', c, true); }; }, [onClose, anchor]);
  if (!anchor) return null;
  const r = anchor.getBoundingClientRect(); const W = Math.min(360, window.innerWidth - 24);
  const left = Math.max(12, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - 12));
  const style = r.bottom + 240 < window.innerHeight ? { left, top: r.bottom + 8, width: W } : { left, bottom: window.innerHeight - r.top + 8, width: W };
  const isHeb = num[0] === 'H';
  // group occurrences by book for a compact list
  const byBook = {}; if (occ) for (const [b, c, v] of occ) (byBook[b] ||= []).push([c, v]);
  return createPortal(
    <div className="lat-pop strong" style={style} ref={ref} role="dialog">
      <div className="lw" dir={isHeb ? 'rtl' : 'ltr'}>{token[0].replace(/[׃־,.;·]+$/, '')}</div>
      {entry === undefined && <div className="muted small">Looking it up…</div>}
      {entry === null && <div className="muted small">No dictionary entry for {num}.</div>}
      {entry && <div className="le">
        <b dir={isHeb ? 'rtl' : 'ltr'}>{entry[0]}</b> <i>{entry[1]}</i> <span className="morph">· Strong's {num}{entry[5] ? ` · ${entry[5].toLocaleString()} occurrence${entry[5] === 1 ? '' : 's'}` : ''}</span>
        <div className="gl">{entry[2]}</div>
        {entry[3] && <div className="gl kjv"><span className="muted">KJV renders it:</span> {entry[3]}</div>}
        {entry[4] && <div className="gl muted small">{entry[4]}</div>}
        {entry[5] > 0 && !showAll && <button className="btn sm" style={{ marginTop: 6 }} onClick={() => setShowAll(true)}>Every place it appears</button>}
        {showAll && !occ && <div className="muted small">Gathering the references…</div>}
        {occ && <div className="occ">{Object.entries(byBook).map(([b, refs]) => <div key={b} className="occ-b"><b>{data.byId[b]?.abbr || b}</b> {refs.slice(0, 40).map(([c, v], i) => <Link key={i} to={`/read/${b}/${c}#v${v}`} onClick={onClose}>{c}:{v}</Link>)}{refs.length > 40 && <span className="muted small"> +{refs.length - 40} more</span>}</div>)}</div>}
      </div>}
      <div className="help" style={{ marginTop: 6 }}>Strong's Concordance · {isHeb ? 'Westminster Leningrad Codex' : 'SBL Greek New Testament'} · tap anywhere to close</div>
    </div>, document.body);
}
