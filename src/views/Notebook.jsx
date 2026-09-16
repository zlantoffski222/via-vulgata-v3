import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, useNotes, loadText, setHighlight, setNote } from '../store';
import { HL } from '../components/VerseSheet';

// Everything you have highlighted or written, grouped by book, exportable as Markdown.
export default function Notebook() {
  const n = useNotes();
  const [texts, setTexts] = useState({});
  const [filter, setFilter] = useState('all');
  const entries = useMemo(() => {
    const keys = new Set([...Object.keys(n.hl), ...Object.keys(n.notes)]);
    const order = Object.fromEntries(data.books.map(b => [b.id, b.order]));
    return [...keys].map(k => { const [b, c, v] = k.split(':'); return { k, b, c: +c, v: +v, hl: n.hl[k], note: n.notes[k] }; }).filter(e => data.byId[e.b]).sort((a, z) => (order[a.b] - order[z.b]) || (a.c - z.c) || (a.v - z.v));
  }, [n]);
  useEffect(() => { let on = true; const books = [...new Set(entries.map(e => e.b))]; Promise.all(books.map(b => loadText('drc', b).then(t => [b, t]))).then(rs => on && setTexts(Object.fromEntries(rs))); return () => { on = false; }; }, [entries]);
  const shown = entries.filter(e => filter === 'all' || (filter === 'notes' ? e.note : e.hl === filter));
  const byBook = []; for (const e of shown) { const last = byBook[byBook.length - 1]; if (last && last.b === e.b) last.items.push(e); else byBook.push({ b: e.b, items: [e] }); }
  const text = e => texts[e.b]?.[e.c - 1]?.[e.v - 1] || '';
  const exportMd = () => {
    const lines = ['# Christ is King — notebook', '', `Exported ${new Date().toLocaleDateString()}`, ''];
    for (const g of byBook) { lines.push(`## ${data.byId[g.b].name}`, ''); for (const e of g.items) { lines.push(`**${data.byId[e.b].abbr} ${e.c}:${e.v}**${e.hl ? ` _(${HL[e.hl][0]})_` : ''}  `, `> ${text(e)}`, ''); if (e.note) lines.push(e.note.t, ''); } }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'via-vulgata-notebook.md'; a.click();
  };
  return (
    <div className="page fade-in" style={{ maxWidth: 900 }}>
      <div className="eyebrow">Yours</div>
      <h1 className="title">Notebook</h1>
      <p className="muted" style={{ lineHeight: 1.5 }}>Highlights and notes you have made while reading. Tap a verse number in the reader — or press and hold a verse — to add one.</p>
      <div className="row" style={{ margin: '10px 0' }}>
        <div className="seg"><button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All ({entries.length})</button><button className={filter === 'notes' ? 'on' : ''} onClick={() => setFilter('notes')}>Notes</button>{Object.entries(HL).map(([k, [nm, col]]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}><span className="sw-dot" style={{ background: col }} />{nm}</button>)}</div>
        {entries.length > 0 && <button className="btn" onClick={exportMd}>Export as Markdown</button>}
      </div>
      {entries.length === 0 && <div className="card" style={{ marginTop: 14 }}><p className="muted" style={{ margin: 0 }}>Nothing here yet. Open any chapter, tap a verse number, and choose a highlight colour or write a note.</p></div>}
      {byBook.map(g => (
        <section key={g.b} className="nb-book">
          <h2 className="title" style={{ fontSize: 19, margin: '18px 0 8px' }}>{data.byId[g.b].name}</h2>
          {g.items.map(e => (
            <div key={e.k} className="nb-item" style={e.hl ? { '--hl': HL[e.hl][1] } : undefined}>
              <Link to={`/read/${e.b}/${e.c}#v${e.v}`} className="nb-ref">{data.byId[e.b].abbr} {e.c}:{e.v}</Link>
              <div className={'nb-text' + (e.hl ? ' hl' : '')}>{text(e) || '…'}</div>
              {e.note && <div className="nb-note">{e.note.t}<div className="muted small sans">{new Date(e.note.d).toLocaleDateString()}</div></div>}
              <div className="row nb-act"><span className="swatches">{Object.entries(HL).map(([k, [nm, col]]) => <button key={k} className={'sw' + (e.hl === k ? ' on' : '')} style={{ background: col }} title={nm} onClick={() => setHighlight(e.b, e.c, e.v, e.hl === k ? null : k)} />)}</span>{e.note && <button className="btn sm ghost" onClick={() => { if (confirm('Delete this note?')) setNote(e.b, e.c, e.v, ''); }}>delete note</button>}</div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
