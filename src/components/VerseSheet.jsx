import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sheet from './Sheet';
import XrefList from './XrefList';
import CompareVerse from './CompareVerse';
import { data, useNotes, setHighlight, setNote, addCard, removeCard, useMemory, toggleVerse, useProgress, readSet, vkey } from '../store';
import { speak } from '../speech';

export const HL = { y: ['Gold', '#f4dd7a'], g: ['Olive', '#cfe3a8'], b: ['Lapis', '#bcd3f2'], r: ['Rose', '#f5c2c7'] };

// Everything you can do with one verse: mark, highlight, note, memorize, compare, cross-references, listen, copy.
export default function VerseSheet({ open, onClose, book, c, v, la, en, xrefs, initialTab = 'act' }) {
  const notes = useNotes(); const mem = useMemory(); const p = useProgress();
  const key = vkey(book.id, c, v);
  const [noteText, setNoteText] = useState(''); const [tab, setTab] = useState(initialTab);
  useEffect(() => { setNoteText(notes.notes[key]?.t || ''); setTab(initialTab); }, [key, open]); // eslint-disable-line
  if (!open) return null;
  const hl = notes.hl[key]; const isRead = readSet(p, book.id, c).has(v);
  const cardEn = mem.cards.find(x => x.b === book.id && x.c === c && x.v1 === v && x.lang === 'en');
  const cardLa = mem.cards.find(x => x.b === book.id && x.c === c && x.v1 === v && x.lang === 'la');
  const ref = `${book.name.replace(/\s*\(.*\)/, '')} ${c}:${v}`;
  const copy = async () => { try { await navigator.clipboard.writeText(`${en}\n— ${ref} (Douay-Rheims)\n${la}\n— Vulgata`); onClose(); } catch {} };
  const share = async () => { if (navigator.share) { try { await navigator.share({ title: ref, text: `“${en}” — ${ref}` }); } catch {} } else copy(); };
  return (
    <Sheet open={open} onClose={onClose} title={<span>{ref} <span className="muted small sans">· {book.latin}</span></span>}>
      <div className="vs-text"><div className="la">{la}</div><div className="en">{en}</div></div>
      <div className="tabs mini">
        <button className={tab === 'act' ? 'on' : ''} onClick={() => setTab('act')}>Actions</button>
        <button className={tab === 'xref' ? 'on' : ''} onClick={() => setTab('xref')}>See also{xrefs && xrefs.length ? ` (${xrefs.length})` : ''}</button>
        <button className={tab === 'cmp' ? 'on' : ''} onClick={() => setTab('cmp')}>Versions</button>
        <button className={tab === 'note' ? 'on' : ''} onClick={() => setTab('note')}>Note{notes.notes[key] ? ' ✎' : ''}</button>
      </div>
      {tab === 'act' && <div className="vs-actions">
        <button className={'act' + (isRead ? ' on' : '')} onClick={() => toggleVerse(book.id, c, v)}><b>{isRead ? '✓ Read' : 'Mark read'}</b><span>{isRead ? 'tap to unmark' : 'counts toward your journey'}</span></button>
        <div className="act hlrow"><b>Highlight</b><span className="swatches">{Object.entries(HL).map(([k, [n, col]]) => <button key={k} className={'sw' + (hl === k ? ' on' : '')} style={{ background: col }} title={n} onClick={() => setHighlight(book.id, c, v, hl === k ? null : k)} aria-label={n} />)}{hl && <button className="btn sm ghost" onClick={() => setHighlight(book.id, c, v, null)}>clear</button>}</span></div>
        <button className={'act' + (cardEn ? ' on' : '')} onClick={() => cardEn ? removeCard(cardEn.id) : addCard(book.id, c, v, v, 'en')}><b>{cardEn ? '★ In your memory deck' : 'Memorize (English)'}</b><span>{cardEn ? 'tap to remove' : 'spaced repetition, a few minutes a day'}</span></button>
        <button className={'act' + (cardLa ? ' on' : '')} onClick={() => cardLa ? removeCard(cardLa.id) : addCard(book.id, c, v, v, 'la')}><b>{cardLa ? '★ Latin in your deck' : 'Memorize (Latin)'}</b><span>{cardLa ? 'tap to remove' : 'learn the Vulgate by heart'}</span></button>
        <button className="act" onClick={() => speak([{ text: en, lang: 'en', key: c + ':' + v }, { text: la, lang: 'la', key: c + ':' + v }], ref)}><b>Listen</b><span>English, then the Latin</span></button>
        <button className="act" onClick={copy}><b>Copy</b><span>both texts with the reference</span></button>
        <button className="act" onClick={share}><b>Share</b><span>send this verse to someone</span></button>
        <Link className="act" to={`/read/${book.id}/${c}#v${v}`} onClick={onClose}><b>Link</b><span>#/read/{book.id}/{c}#v{v}</span></Link>
      </div>}
      {tab === 'xref' && <XrefList refs={xrefs} onGo={onClose} />}
      {tab === 'cmp' && <CompareVerse book={book} c={c} v={v} la={la} drc={en} onClose={() => setTab('act')} />}
      {tab === 'note' && <div>
        <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Your note on this verse…" rows={5} style={{ width: '100%' }} />
        <div className="row" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
          {notes.notes[key] && <button className="btn ghost" onClick={() => { setNote(book.id, c, v, ''); setNoteText(''); }}>Delete</button>}
          <button className="btn solid" onClick={() => { setNote(book.id, c, v, noteText); onClose(); }}>Save note</button>
        </div>
        <div className="help">Notes and highlights are collected in your <Link to="/notebook" onClick={onClose}>Notebook</Link>.</div>
      </div>}
    </Sheet>
  );
}
