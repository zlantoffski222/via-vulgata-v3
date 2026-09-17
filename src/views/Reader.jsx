import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { data, useText, useProgress, useSettings, settingsStore, readSet, toggleVerse, setChapter, setLast, nextChapter, prevChapter, chapterDone, useVersionText, versionHasBook, useSide, useNotes, vkey, stopChapters } from '../store';
import CompareVerse from '../components/CompareVerse';
import { eventsForChapter, anchorVerse, isPrimaryChapter, eraFor } from '../util';
import ContextPanel from '../components/ContextPanel';
import AskPanel from '../components/AskPanel';
import ArtImg from '../components/ArtImg';
import VerseSheet, { HL } from '../components/VerseSheet';
import { LatinText, LatinPopover } from '../components/LatinText';
import { OrigText, StrongsPopover } from '../components/OrigText';
import MiniMap from '../components/MiniMap';
import Sheet from '../components/Sheet';
import { speak, subscribeSpeech, speechSupported, stop as stopSpeech } from '../speech';
import { useIsMobile, longPress } from '../hooks';

const Ico = {
  prev: <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>,
  next: <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>,
  ctx: <svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>,
  aa: <svg viewBox="0 0 24 24"><path d="M4 18L9 6l5 12M6 14h6M15 18l2.5-6 2.5 6M16 16h3"/></svg>,
  play: <svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>,
  stop: <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>,
  check: <svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>,
  pin: <svg viewBox="0 0 24 24"><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>,
};
const SPK = { J: ['Jesus', 'spk-j'], G: ['God', 'spk-g'], A: ['Angel', 'spk-a'] };
const spkInfo = code => code ? (SPK[code] || [code.replace(/^the /, ''), 'spk-n']) : null;

export default function Reader() {
  const { id, c: cs } = useParams(); const c = +cs;
  const nav = useNavigate(); const loc = useLocation(); const mobile = useIsMobile();
  const p = useProgress(); const s = useSettings(); const notes = useNotes();
  const book = data.byId[id];
  const la = useText('vul', id); const en = useText('drc', id);
  const ver = s.enVersion || 'drc'; const verInfo = data.versions.find(x => x.id === ver) || data.versions[0];
  const verHas = versionHasBook(ver, id);
  const vt = useVersionText(ver, id);
  const speakers = useSide('speakers', id, s.showSpeakers !== false);
  const xrefs = useSide('xref', id, s.showXrefs !== false);
  const origVer = book && book.testament === 'NT' ? 'grc' : 'heb';
  const origHas = book ? versionHasBook(origVer, id) && data.versions.some(v => v.id === origVer) : false;
  const orig = useVersionText(s.showOriginal && origHas ? origVer : null, id);
  const [gword, setGword] = useState(null);
  const [cmp, setCmp] = useState(null);
  const [sheet, setSheet] = useState(null); // verse number
  const [word, setWord] = useState(null); // { w, el }
  const [opts, setOpts] = useState(false);
  const [where, setWhere] = useState(false);
  const [reading, setReading] = useState(null); // key of verse being read aloud
  const flags = useMemo(() => { const f = {}; if (vt && vt.d) { for (const k of vt.d) f[k] = 'd'; for (const k of vt.m) f[k] = 'm'; for (const k of vt.j) f[k] = 'j'; } return f; }, [vt]);
  const [tab, setTab] = useState('context');
  const [drawer, setDrawer] = useState(false);
  const evs = useMemo(() => eventsForChapter(id, c), [id, c]);
  const anchors = useMemo(() => { const m = {}; for (const e of evs) { const v = anchorVerse(e, id, c); (m[v] ||= []).push(e); } return m; }, [evs, id, c]);
  const plateEv = evs.find(e => e.art && isPrimaryChapter(e, id, c)) || null;
  const glosses = useMemo(() => { const m = {}; for (const n of (data.notesByChapter[id + ':' + c] || [])) (m[n.v1] ||= []).push(n); return m; }, [id, c]);
  const [openGloss, setOpenGloss] = useState(null);
  const locKeys = useMemo(() => [...new Set(evs.flatMap(e => e.loc))].filter(k => data.timeline.locs[k]), [evs]);

  useEffect(() => { if (book) setLast(id, c); }, [id, c, book]);
  useEffect(() => subscribeSpeech(st => setReading(st.items[st.idx]?.key || null)), []);
  useEffect(() => () => stopSpeech(), [id, c]);
  useEffect(() => {
    if (!la || !en) return;
    const g = loc.hash.match(/#note(\d+)/);
    if (g) { setOpenGloss(+g[1]); const el = document.getElementById('note' + g[1]); if (el) { el.scrollIntoView({ block: 'center' }); } return; }
    const m = loc.hash.match(/#v(\d+)/);
    if (m) { const el = document.getElementById('v' + m[1]); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('mark'); } }
    else window.scrollTo(0, 0);
  }, [la, en, loc.hash, id, c]);
  // keyboard: ← → chapters, m mark chapter, l listen, o options
  // reading inside the story: ?story=n keeps the chapter sequence of that stop
  const storyN = +(new URLSearchParams(loc.search).get('story') || 0); const stop = storyN ? data.story.stops[storyN - 1] : null;
  const stopChs = stop ? stopChapters(stop) : null; const stopIdx = stopChs ? stopChs.findIndex(x => x.b === id && x.c === c) : -1;
  const nextStopObj = stop ? data.story.stops[stop.n] : null;
  const nx = stop && stopIdx >= 0 ? (stopChs[stopIdx + 1] ? { ...stopChs[stopIdx + 1], story: stop.n } : (nextStopObj ? { toStop: nextStopObj } : null)) : book ? nextChapter(data.books, id, c) : null;
  const pv = stop && stopIdx > 0 ? { ...stopChs[stopIdx - 1], story: stop.n } : book ? prevChapter(data.books, id, c) : null;
  const go = t => { if (!t) return; if (t.toStop) nav(`/story/${t.toStop.n}`); else nav(`/read/${t.b}/${t.c}${t.story ? '?story=' + t.story : ''}`); };
  useEffect(() => {
    const k = e => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight' && nx) go(nx); else if (e.key === 'ArrowLeft' && pv) go(pv);
      else if (e.key === 'm' && book) { const done = chapterDone(progressNow(), book, c); setChapter(id, c, book.chapters[c - 1], !done); }
      else if (e.key === 'l') listen(); else if (e.key === 'o') setOpts(o => !o); else if (e.key === 'c') setDrawer(d => !d);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }); // eslint-disable-line
  const progressNow = () => p;

  const listen = useCallback((fromV = 1) => {
    if (!la || !en || !book) return; const items = [];
    for (let v = fromV; v <= book.chapters[c - 1]; v++) { const L = la[c - 1]?.[v - 1], E = en[c - 1]?.[v - 1]; const label = `${book.abbr} ${c}:${v}`;
      if (s.mode !== 'en' && L) items.push({ text: L, lang: 'la', key: c + ':' + v, label });
      if (s.mode !== 'la' && E) items.push({ text: E, lang: 'en', key: c + ':' + v, label }); }
    speak(items, `${book.name.replace(/\s*\(.*\)/, '')} ${c}`);
  }, [la, en, book, c, s.mode]);

  if (!book) return <div className="page">No such book.</div>;
  const nVerses = book.chapters[c - 1];
  const read = readSet(p, id, c);
  const done = chapterDone(p, book, c);
  const ctx = data.context[id] || {};
  const mode = s.mode;
  const sceneEv = evs.find(x => isPrimaryChapter(x, id, c)) || evs[0];
  const sceneLine = (() => {
    if (sceneEv) { const places = sceneEv.loc.map(k => data.timeline.locs[k]?.n).filter(Boolean).join(', '); return <><span className="sans">{eraFor(sceneEv.y).n} · {sceneEv.d}</span><div><b>{sceneEv.ttl}</b>{places ? ` — ${places}. ` : '. '}{sceneEv.sum.split(/(?<=\.)\s/)[0]}</div></>; }
    return <><span className="sans">{ctx.where ? 'Where we are' : book.group}</span><div>{ctx.where || ctx.what}</div></>;
  })();
  const spkFor = v => (speakers && speakers[c] && speakers[c][v]) || null;

  const panelInner = (<>
      <div className="tabs">
        <button className={tab === 'context' ? 'on' : ''} onClick={() => setTab('context')}>Context</button>
        <button className={tab === 'ask' ? 'on' : ''} onClick={() => setTab('ask')}>Ask</button>
      </div>
      <div className="body">
        {tab === 'context' ? <ContextPanel book={book} c={c} evs={evs} /> : <AskPanel book={book} c={c} evs={evs} en={en} />}
      </div>
  </>);
  const whereChip = locKeys.length > 0 && <button className="where-chip" onClick={() => setWhere(true)} title="Where are we?">{Ico.pin}<span>{data.timeline.locs[locKeys[0]].n}{locKeys.length > 1 ? ` +${locKeys.length - 1}` : ''}</span></button>;
  const sheetV = sheet != null ? sheet : null;
  const lp = longPress(e => { const el = e.target.closest('.v'); if (el) setSheet(+el.dataset.v); });

  return (
    <div className={'reader' + (mobile ? ' m' : '')}>
      <div>
        <div className="readbar">
          {!mobile && <button className="ib" onClick={() => go(pv)} disabled={!pv} aria-label="Previous chapter">{Ico.prev}</button>}
          {mobile && <Link className="ib" to={`/book/${id}`} aria-label="Chapters">{Ico.prev}</Link>}
          <Link className="where" to={`/book/${id}`}><div className="bk">{book.name.replace(/\s*\(.*\)/, '')} {c}</div><div className="ch">{mobile ? `${read.size}/${nVerses} read` : `Ch. ${c} of ${book.chapters.length} · ${read.size}/${nVerses} read`}</div></Link>
          {!mobile && whereChip}
          {!mobile && <div className="seg" aria-label="Text">
            <button className={mode === 'la' ? 'on' : ''} onClick={() => settingsStore.set({ mode: 'la' })}>LA</button>
            <button className={mode === 'parallel' ? 'on' : ''} onClick={() => settingsStore.set({ mode: 'parallel' })}>Both</button>
            <button className={mode === 'en' ? 'on' : ''} onClick={() => settingsStore.set({ mode: 'en' })}>EN</button>
          </div>}
          {!mobile && data.versions.length > 1 && <select value={ver} onChange={e => settingsStore.set({ enVersion: e.target.value })} aria-label="English version" title="English version">{data.versions.filter(v => !['grc', 'heb'].includes(v.id)).map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select>}
          {speechSupported && !mobile && <button className={'ib' + (reading ? ' on' : '')} onClick={() => reading ? stopSpeech() : listen()} aria-label={reading ? 'Stop reading aloud' : 'Read aloud'} title="Read aloud (L)">{reading ? Ico.stop : Ico.play}</button>}
          <button className="ib" onClick={() => setOpts(true)} aria-label="Reading options" title="Reading options (O)">{Ico.aa}</button>
          {!mobile && <button className={'ib ctxbtn' + (drawer ? ' on' : '')} onClick={() => setDrawer(d => !d)} aria-label="Context and questions">{Ico.ctx}</button>}
          {!mobile && <button className="ib" onClick={() => go(nx)} disabled={!nx} aria-label="Next chapter">{Ico.next}</button>}
        </div>

        <article className="folio" key={id + c}>
          {plateEv && <Link to={`/event/${plateEv.id}`} className="plate" style={{ display: 'block' }}>
            <ArtImg wp={plateEv.art.wp} alt={plateEv.art.t} />
            <div className="cap"><b>{plateEv.art.t}</b><span>{plateEv.art.by}{plateEv.art.by ? ' · ' : ''}{plateEv.ttl}</span></div>
          </Link>}
          {stop && <Link to={`/story/${stop.n}`} className="story-bar"><span className="eyebrow">The story · stop {stop.n} of {data.story.stops.length}</span><b>{stop.t}</b><span className="muted small">{stopIdx >= 0 ? `chapter ${stopIdx + 1} of ${stopChs.length}` : ''}</span></Link>}
          <header className="folio-head">
            <div className="bk">{book.latin}</div>
            <div className="num">{c}</div>
            <div className="latin">{book.name}{book.id === 'PSA' ? ' · Vulgate numbering' : ''}</div>
            <div className="orn">✦ ✦ ✦</div>
          </header>
          <div className="folio-ctx">{sceneLine}{mobile && whereChip}</div>
          {ver !== 'drc' && !verHas && verInfo && <div className="version-note">The {verInfo.long} does not include {book.name.replace(/\s*\(.*\)/, '')}{ver === 'jps' && book.testament === 'NT' ? ' — it is a translation of the Hebrew Bible only' : ''}. Showing the Douay-Rheims instead.</div>}
          {ver !== 'drc' && verHas && vt && (vt.d.length + vt.m.length > 0) && <div className="version-note">{verInfo.label} verses are laid on the Vulgate's chapter-and-verse grid. In this book it reads differently from the Douay-Rheims in {vt.d.length} verse{vt.d.length === 1 ? '' : 's'}{vt.m.length ? ` and lacks ${vt.m.length}` : ''} — marked as you read; tap a mark to compare.</div>}
          {!la || !en || (ver !== 'drc' && verHas && !vt) || (s.showOriginal && origHas && !orig) ? <div className="loading">Turning the page…</div> : (
            <div className={'verses ' + (mode === 'parallel' ? 'parallel' : '') + (s.showSpeakers !== false && speakers ? ' spk' : '')} {...lp}>
              {Array.from({ length: nVerses }, (_, i) => i + 1).map(v => {
                const L = la[c - 1]?.[v - 1] || '', D = en[c - 1]?.[v - 1] || '';
                const key = c + ':' + v; const fl = (ver !== 'drc' && verHas && vt) ? flags[key] : null;
                const E = (ver !== 'drc' && verHas && vt) ? (vt.v[c - 1]?.[v - 1] || '') : D;
                const oref = (ver !== 'drc' && verHas && vt) ? vt.r[key] : null;
                const isRead = read.has(v); const hl = notes.hl[vkey(id, c, v)]; const note = notes.notes[vkey(id, c, v)];
                const spk = spkFor(v); const spkPrev = spkFor(v - 1); const si = spkInfo(spk); const xr = xrefs && xrefs[key];
                return (
                  <React.Fragment key={v}>
                    {si && spk !== spkPrev && <div className={'spk-label ' + si[1]}><i /> {si[0]}{spk === 'J' ? ' speaks' : spk === 'G' ? ' speaks' : spk === 'A' ? ' speaks' : ''}</div>}
                    <div id={'v' + v} data-v={v} className={'v' + (isRead ? ' read' : '') + (mode === 'parallel' ? ' par' : '') + (si ? ' ' + si[1] : '') + (reading === key ? ' reading' : '')} style={hl ? { '--hl': HL[hl][1] } : undefined} onClick={() => toggleVerse(id, c, v)} role="checkbox" aria-checked={isRead} tabIndex={0} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleVerse(id, c, v); } if (e.key === 'ArrowDown') { e.preventDefault(); document.getElementById('v' + (v + 1))?.focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); document.getElementById('v' + (v - 1))?.focus(); } if (e.key === 'h') { e.preventDefault(); setSheet(v); } }}>
                      <span className="n" title="Verse tools: highlight, note, memorize, compare…" onClick={ev => { ev.stopPropagation(); setSheet(v); }}>{v}</span>
                      {mode !== 'en' && <span className={'t la' + (hl ? ' hl' : '')}>{L ? (s.latinHelp !== false ? <LatinText text={L} onWord={(w, el) => setWord({ w, el })} /> : L) : <i className="muted">—</i>}{orig && orig.v[c - 1]?.[v - 1] && <span className="t origline"><OrigText tokens={orig.v[c - 1][v - 1]} lang={origVer === 'heb' ? 'he' : 'grc'} onWord={(t, el) => setGword({ t, el })} /></span>}</span>}
                      {mode === 'en' && orig && orig.v[c - 1]?.[v - 1] && <span className="t origline solo"><OrigText tokens={orig.v[c - 1][v - 1]} lang={origVer === 'heb' ? 'he' : 'grc'} onWord={(t, el) => setGword({ t, el })} /></span>}
                      {mode !== 'la' && <span className={'t en' + (hl ? ' hl' : '')}>
                        {fl === 'm' ? <><span className="absent">Not in the {verInfo.label} — Douay-Rheims: </span>{D}</> : fl === 'j' ? <span className="absent">Included in the previous verse in the {verInfo.label}.</span> : (E || <i className="muted">—</i>)}
                        {(fl === 'd' && s.markDiffs) && <span className="vmark" title="Reads differently from the Douay-Rheims — tap to compare" onClick={ev => { ev.stopPropagation(); setCmp(cmp === v ? null : v); }}>≠ Douay</span>}
                        {fl === 'm' && <span className="vmark miss" onClick={ev => { ev.stopPropagation(); setCmp(cmp === v ? null : v); }}>compare</span>}
                        {oref && !fl && (v === 1 || !oref.endsWith(':' + v)) && <span className="vmark" title={'Numbered ' + oref + ' in that version'} onClick={ev => { ev.stopPropagation(); setCmp(cmp === v ? null : v); }}>{oref}</span>}
                        {xr && s.showXrefs !== false && <span className="vmark xr" title="See also — cross-references" onClick={ev => { ev.stopPropagation(); setSheet({ v, tab: 'xref' }); }}>⇄ {xr.length}</span>}
                        {note && <span className="vmark nt" title={note.t} onClick={ev => { ev.stopPropagation(); setSheet({ v, tab: 'note' }); }}>✎</span>}
                      </span>}
                      {mode === 'la' && (xr && s.showXrefs !== false || note) && <span className="t la-marks">{xr && s.showXrefs !== false && <span className="vmark xr" onClick={ev => { ev.stopPropagation(); setSheet({ v, tab: 'xref' }); }}>⇄ {xr.length}</span>}{note && <span className="vmark nt" onClick={ev => { ev.stopPropagation(); setSheet({ v, tab: 'note' }); }}>✎</span>}</span>}
                    </div>
                    {cmp === v && <CompareVerse book={book} c={c} v={v} la={L} drc={D} onClose={() => setCmp(null)} />}
                    {s.showGlosses !== false && glosses[v] && glosses[v].map(n => (
                      <div key={'g' + n.id} id={'note' + n.id} className={'gloss' + (openGloss === n.id ? ' open' : '')} onClick={ev => { ev.stopPropagation(); setOpenGloss(openGloss === n.id ? null : n.id); }} role="button" tabIndex={0} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setOpenGloss(openGloss === n.id ? null : n.id); } }}>
                        <div className="gh"><span className="gm">✎</span><span className="gt">{n.t}</span><span className="gr">{book.abbr} {n.c}:{n.v1}{n.v2 !== n.v1 ? '–' + n.v2 : ''}</span></div>
                        <div className="gn">{n.n}</div>
                      </div>))}
                    {s.showArtInline && anchors[v] && anchors[v].filter(e => !(plateEv && e.id === plateEv.id) && (e.art || e.evd || e.quotes.length)).map(e => (
                      <Link key={e.id} to={`/event/${e.id}`} className="margin-art" onClick={ev => ev.stopPropagation()}>
                        {e.art ? <ArtImg wp={e.art.wp} alt="" loading="lazy" /> : <div style={{ width: 96, height: 96, borderRadius: 3, background: 'rgba(120,90,40,0.15)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', color: 'var(--rubric)' }}>✦</div>}
                        <div><div className="h">{e.ttl}</div><div className="s">{e.sum}</div><div className="d">{e.d}{e.art ? ` · ${e.art.t}${e.art.by ? ', ' + e.art.by : ''}` : ''}{e.evd ? ` · ${e.evd.length} source${e.evd.length > 1 ? 's' : ''}` : ''}</div></div>
                      </Link>))}
                  </React.Fragment>
                );
              })}
            </div>
          )}
          <footer className="folio-foot">
            <button className="btn" onClick={() => go(pv)} disabled={!pv}>← {pv ? `${data.byId[pv.b].abbr} ${pv.c}` : ''}</button>
            <button className={'btn' + (done ? '' : ' solid')} onClick={() => setChapter(id, c, nVerses, !done)}>{done ? 'Unmark chapter' : 'Mark chapter read'}</button>
            <button className={'btn' + (nx && nx.toStop ? ' solid' : '')} onClick={() => { if (!done) setChapter(id, c, nVerses, true); go(nx); }} disabled={!nx}>{nx && nx.toStop ? `${done ? '' : 'Done · '}Next stop: ${nx.toStop.t}` : `${done ? 'Next' : 'Done, next'} ${nx ? `${data.byId[nx.b].abbr} ${nx.c}` : ''}`} →</button>
          </footer>
        </article>
      </div>
      <aside className="panel side">{panelInner}</aside>
      {drawer && <div className="drawer" onClick={() => setDrawer(false)}><aside className="panel" onClick={e => e.stopPropagation()}><div className="grab" />{panelInner}</aside></div>}

      {mobile && <div className="reader-tools" role="toolbar">
        <button className="rt" onClick={() => go(pv)} disabled={!pv} aria-label="Previous chapter">{Ico.prev}<span>{pv ? `${data.byId[pv.b].abbr} ${pv.c}` : '—'}</span></button>
        <button className={'rt' + (done ? ' on' : '')} onClick={() => setChapter(id, c, nVerses, !done)} aria-label="Mark chapter read">{Ico.check}<span>{done ? 'Read ✓' : 'Mark read'}</span></button>
        <button className={'rt' + (drawer ? ' on' : '')} onClick={() => setDrawer(d => !d)} aria-label="Context and questions">{Ico.ctx}<span>Context</span></button>
        {speechSupported && <button className={'rt' + (reading ? ' on' : '')} onClick={() => reading ? stopSpeech() : listen()} aria-label="Read aloud">{reading ? Ico.stop : Ico.play}<span>{reading ? 'Stop' : 'Listen'}</span></button>}
        <button className="rt" onClick={() => go(nx)} disabled={!nx} aria-label="Next chapter">{Ico.next}<span>{nx ? (nx.toStop ? 'Next stop' : `${data.byId[nx.b].abbr} ${nx.c}`) : '—'}</span></button>
      </div>}

      {sheetV != null && la && en && (() => { const v = typeof sheetV === 'object' ? sheetV.v : sheetV; return <VerseSheet key={v + ':' + (typeof sheetV === 'object' ? sheetV.tab : '')} open onClose={() => setSheet(null)} book={book} c={c} v={v} la={la[c - 1]?.[v - 1] || ''} en={en[c - 1]?.[v - 1] || ''} xrefs={xrefs && xrefs[c + ':' + v]} initialTab={typeof sheetV === 'object' ? sheetV.tab : 'act'} />; })()}
      {word && <LatinPopover word={word.w} anchor={word.el} onClose={() => setWord(null)} />}
      {gword && <StrongsPopover token={gword.t} anchor={gword.el} onClose={() => setGword(null)} />}
      <Sheet open={opts} onClose={() => setOpts(false)} title="Reading options">
        <div className="field"><label>Text</label><div className="seg">
          <button className={mode === 'la' ? 'on' : ''} onClick={() => settingsStore.set({ mode: 'la' })}>Latin</button>
          <button className={mode === 'parallel' ? 'on' : ''} onClick={() => settingsStore.set({ mode: 'parallel' })}>Both</button>
          <button className={mode === 'en' ? 'on' : ''} onClick={() => settingsStore.set({ mode: 'en' })}>English</button></div></div>
        {data.versions.length > 1 && <div className="field"><label>English version</label><div className="seg wrap">{data.versions.filter(v => !['grc', 'heb'].includes(v.id)).map(v => <button key={v.id} className={ver === v.id ? 'on' : ''} onClick={() => settingsStore.set({ enVersion: v.id })}>{v.label}</button>)}</div></div>}
        <div className="field"><label>Text size — {s.fontSize}px</label><div className="row"><button className="btn" onClick={() => settingsStore.set({ fontSize: Math.max(14, s.fontSize - 1) })}>A−</button><input type="range" min="14" max="28" value={s.fontSize} onChange={e => settingsStore.set({ fontSize: +e.target.value })} style={{ flex: 1, accentColor: 'var(--gold)' }} /><button className="btn" onClick={() => settingsStore.set({ fontSize: Math.min(28, s.fontSize + 1) })}>A+</button></div></div>
        <div className="field"><label>Theme</label><div className="seg"><button className={s.theme === 'day' ? 'on' : ''} onClick={() => settingsStore.set({ theme: 'day' })}>Day</button><button className={(s.theme || 'auto') === 'auto' ? 'on' : ''} onClick={() => settingsStore.set({ theme: 'auto' })}>Auto</button><button className={s.theme === 'night' ? 'on' : ''} onClick={() => settingsStore.set({ theme: 'night' })}>Lights out</button></div></div>
        <div className="togglelist">
          <Toggle on={s.showSpeakers !== false} set={v => settingsStore.set({ showSpeakers: v })} label="Who is speaking" help="Colour the words of Jesus, of God, of angels and of named people" />
          {origHas && <Toggle on={!!s.showOriginal} set={v => settingsStore.set({ showOriginal: v })} label={origVer === 'grc' ? 'Greek original' : 'Hebrew original'} help={origVer === 'grc' ? 'The SBL Greek New Testament under each verse — tap a word for Strong\'s' : 'The Leningrad Codex Hebrew under each verse — tap a word for Strong\'s'} />}
          <Toggle on={s.showXrefs !== false} set={v => settingsStore.set({ showXrefs: v })} label="Cross-references" help="⇄ marks with the passages that echo each verse" />
          <Toggle on={s.latinHelp !== false} set={v => settingsStore.set({ latinHelp: v })} label="Latin word help" help="Tap any Latin word for its dictionary form and meaning" />
          <Toggle on={s.showGlosses !== false} set={v => settingsStore.set({ showGlosses: v })} label="Passage notes" help="Short explanations under significant verses" />
          <Toggle on={s.showArtInline !== false} set={v => settingsStore.set({ showArtInline: v })} label="Art and sources beside the verses" help="When hidden they stay in the Context panel" />
          <Toggle on={s.markDiffs !== false} set={v => settingsStore.set({ markDiffs: v })} label="Mark verses that read differently" help="When another English version is chosen" />
        </div>
        {speechSupported && <div className="field"><label>Reading voice speed — {s.voiceRate || 1}× · <Link to="/settings" onClick={() => setOpts(false)}>choose the voice</Link></label><input type="range" min="0.6" max="1.4" step="0.1" value={s.voiceRate || 1} onChange={e => settingsStore.set({ voiceRate: +e.target.value })} style={{ width: '100%', accentColor: 'var(--gold)' }} /></div>}
        <div className="field"><label>Print</label><div className="row"><button className="btn" onClick={() => { setOpts(false); setTimeout(() => window.print(), 250); }}>Print this chapter · save as PDF</button><span className="muted small">Text only, in the current language mode; the panels and pictures stay off the page.</span></div></div>
        <div className="help">Keyboard: ← → chapters · ↑ ↓ verses · space marks a verse · H opens verse tools · M marks the chapter · L listens · C context · / search · T theme</div>
      </Sheet>
      <Sheet open={where} onClose={() => setWhere(false)} title="Where we are">
        {locKeys.length > 0 && <MiniMap keys={locKeys} height={240} />}
        {locKeys.map(k => { const L = data.timeline.locs[k]; return <p key={k} style={{ lineHeight: 1.5 }}><b>{L.n}.</b> {L.d} <Link to={`/explore?loc=${k}`} onClick={() => setWhere(false)}>Explore on the map →</Link></p>; })}
        {sceneEv && <p className="muted small">{eraFor(sceneEv.y).n} · {sceneEv.d} — {sceneEv.ttl}</p>}
      </Sheet>
    </div>
  );
}

function Toggle({ on, set, label, help }) {
  return <label className={'toggle' + (on ? ' on' : '')}><input type="checkbox" checked={on} onChange={e => set(e.target.checked)} /><span className="sw" /><span><b>{label}</b>{help && <small>{help}</small>}</span></label>;
}
