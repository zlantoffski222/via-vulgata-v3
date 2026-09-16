import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { loadLatin } from '../store';

// Latin verse text whose words can be tapped for a gloss from Whitaker's WORDS.
let dict = null; let loading = null;
function ensure() { if (dict) return Promise.resolve(dict); if (!loading) loading = loadLatin().then(d => { dict = d; return d; }); return loading; }
const norm = w => w.toLowerCase().replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/[^a-z]/g, '');

export function LatinText({ text, onWord }) {
  // split into words and separators, keep punctuation outside the tap targets
  const parts = text.split(/([A-Za-zÆæŒœ]+)/);
  return <>{parts.map((p, i) => i % 2 ? <span key={i} className="w" onClick={e => { e.stopPropagation(); onWord(p, e.currentTarget); }}>{p}</span> : p)}</>;
}

export function LatinPopover({ word, anchor, onClose }) {
  const [entries, setEntries] = useState(undefined);
  const ref = useRef(null);
  useEffect(() => { let on = true; setEntries(undefined); ensure().then(d => { if (!on) return; const key = norm(word); setEntries(d[key] || d[key.replace(/j/g, 'i')] || d[key.replace(/v/g, 'u')] || null); }); return () => { on = false; }; }, [word]);
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; const c = e => { if (ref.current && !ref.current.contains(e.target) && e.target !== anchor) onClose(); }; window.addEventListener('keydown', k); window.addEventListener('pointerdown', c, true); return () => { window.removeEventListener('keydown', k); window.removeEventListener('pointerdown', c, true); }; }, [onClose, anchor]);
  if (!anchor) return null;
  const r = anchor.getBoundingClientRect(); const W = Math.min(340, window.innerWidth - 24);
  let left = Math.max(12, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - 12));
  const below = r.bottom + 8; const above = window.innerHeight - r.top + 8;
  const style = r.bottom + 190 < window.innerHeight ? { left, top: below, width: W } : { left, bottom: above, width: W };
  return createPortal(
    <div className="lat-pop" style={style} ref={ref} role="dialog">
      <div className="lw">{word.replace(/[^A-Za-zÆæŒœ]/g, '')}</div>
      {entries === undefined && <div className="muted small">Looking it up…</div>}
      {entries === null && <div className="muted small">Not in the dictionary — most often a proper name (people and places are left in their Hebrew or Greek forms) or a rare medieval spelling.</div>}
      {entries && entries.map((e, i) => <div key={i} className="le"><b>{e[0]}</b> <i>{e[1]}</i>{e[2] && <span className="morph"> · {e[2]}</span>}<div className="gl">{e[3].replace(/;\s*$/, '')}</div></div>)}
      <div className="help" style={{ marginTop: 6 }}>Whitaker's WORDS · tap anywhere to close</div>
    </div>, document.body);
}
