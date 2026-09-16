import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, loadText, versionHasBook } from '../store';

const lab = ([b, c, v1, v2]) => `${data.byId[b]?.abbr || b} ${c}:${v1}${v2 !== v1 ? '–' + v2 : ''}`;
const pick = (t, c, v1, v2) => (t[c - 1] || []).slice(v1 - 1, v2).join(' ');

// Prophecy and fulfilment: Old Testament promises beside the New Testament passages that claim them,
// with the Jewish (JPS) rendering of the Hebrew alongside the Vulgate's, where they differ.
export default function Prophecy() {
  const [texts, setTexts] = useState({});
  const [open, setOpen] = useState(null);
  const items = data.prophecy;
  useEffect(() => {
    let on = true;
    (async () => {
      const out = {};
      for (const it of items) {
        const [ob, oc, ov1, ov2] = it.ot, [nb, nc, nv1, nv2] = it.nt;
        const [od, nd] = await Promise.all([loadText('drc', ob), loadText('drc', nb)]);
        let jps = null; if (versionHasBook('jps', ob)) { const j = await loadText('jps', ob); jps = { t: pick(j.v, oc, ov1, ov2), ref: j.r[oc + ':' + ov1] || '', diff: (j.d || []).some(k => { const [c, v] = k.split(':').map(Number); return c === oc && v >= ov1 && v <= ov2; }) }; }
        out[it.t] = { ot: pick(od, oc, ov1, ov2), nt: pick(nd, nc, nv1, nv2), jps };
        if (!on) return;
      }
      setTexts(out);
    })();
    return () => { on = false; };
  }, [items]);
  return (
    <div className="page fade-in">
      <div className="eyebrow">Study</div>
      <h1 className="title">Prophecy and fulfilment</h1>
      <p className="muted" style={{ maxWidth: 720, lineHeight: 1.5 }}>The New Testament reads the Old as a book of promises. Here are the passages it quotes most, in the Douay-Rheims (from the Vulgate) with the 1917 JPS Tanakh beside it — the reading of the Hebrew that Jewish tradition gives — so you can see where the two traditions read the same words differently. Tap a pair to open both texts.</p>
      <div className="proph">
        {items.map(it => { const t = texts[it.t]; const isOpen = open === it.t; return (
          <div key={it.t} className={'proph-row' + (isOpen ? ' open' : '')} onClick={() => setOpen(isOpen ? null : it.t)}>
            <div className="proph-h"><b>{it.t}</b><span className="chip gold">{lab(it.ot)}</span><span className="arrow">→</span><span className="chip">{lab(it.nt)}</span>{t?.jps?.diff && <span className="chip rubric" title="The JPS reads this differently from the Vulgate">≠ Hebrew</span>}</div>
            {t && <div className="proph-body">
              <div className="col"><div className="eyebrow">Douay-Rheims (Vulgate) · <Link to={`/read/${it.ot[0]}/${it.ot[1]}#v${it.ot[2]}`} onClick={e => e.stopPropagation()}>{lab(it.ot)}</Link></div><p className="q">{t.ot}</p>
                {t.jps && <><div className="eyebrow" style={{ marginTop: 8 }}>JPS Tanakh (Hebrew){t.jps.ref ? ` · ${t.jps.ref}` : ''}</div><p className="q">{t.jps.t || <i className="muted">no matching verse</i>}</p></>}</div>
              <div className="col"><div className="eyebrow">New Testament · <Link to={`/read/${it.nt[0]}/${it.nt[1]}#v${it.nt[2]}`} onClick={e => e.stopPropagation()}>{lab(it.nt)}</Link></div><p className="q">{t.nt}</p>
                <p className="note">{it.n}</p></div>
            </div>}
          </div>); })}
      </div>
    </div>
  );
}
