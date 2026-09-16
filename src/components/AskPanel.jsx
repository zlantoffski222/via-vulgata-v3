import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, useSettings } from '../store';
import { eraFor } from '../util';

const SUGGEST = ['Where are we, and when?', 'Who is speaking here?', 'What is being discussed?', 'What happened just before this chapter?', 'Why does this matter for the whole story?'];

function buildSystem(book, c, evs, en) {
  const ctx = data.context[book.id] || {};
  const lines = [
    `You are a learned, warm guide accompanying a Christian reader through the Bible, chapter by chapter. They read Jerome's Latin Vulgate beside the Douay-Rheims. Answer plainly and concisely (a short paragraph or two unless asked for more), in the spirit of a good study Bible: identify who is speaking, to whom, where, when, and what is at stake. Mention verses by number when helpful. Do not invent citations or quotations. When history and tradition differ, say so briefly and fairly. Use Vulgate psalm numbering and the Douay-Rheims names when they differ from other Bibles.`,
    `\nCURRENT PASSAGE: ${book.name} (${book.latin}) chapter ${c} of ${book.chapters.length}.`,
    ctx.when ? `Book setting — when: ${ctx.when}` : '', ctx.where ? `Where: ${ctx.where}` : '', ctx.who ? `Who speaks: ${ctx.who}` : '', ctx.what ? `Summary: ${ctx.what}` : '',
  ];
  if (evs.length) {
    lines.push('\nTIMELINE EVENTS PINNED TO THIS CHAPTER:');
    for (const e of evs) lines.push(`- ${e.ttl} (${e.d}; era: ${eraFor(e.y).n}; places: ${e.loc.map(k => data.timeline.locs[k]?.n).filter(Boolean).join(', ') || 'n/a'}). ${e.sum}${e.p?.c ? ' Christian reading: ' + e.p.c : ''}${e.p?.j ? ' Jewish reading: ' + e.p.j : ''}${e.evd ? ' Evidence: ' + e.evd.map(x => x.n + ' — ' + x.d).join(' | ') : ''}`);
  }
  if (en && en[c - 1]) {
    const text = en[c - 1].map((v, i) => `${i + 1} ${v}`).join(' ');
    lines.push(`\nTEXT OF THE CHAPTER (Douay-Rheims):\n${text.slice(0, 14000)}`);
  }
  return lines.filter(Boolean).join('\n');
}

export default function AskPanel({ book, c, evs, en }) {
  const s = useSettings();
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef(null);
  useEffect(() => { setMsgs([]); setErr(''); }, [book.id, c]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [msgs, busy]);

  async function ask(text) {
    const question = (text || q).trim(); if (!question || busy) return;
    if (!s.apiKey) { setErr('Add your Anthropic API key in Settings to ask questions.'); return; }
    setQ(''); setErr('');
    const next = [...msgs, { role: 'user', content: question }];
    setMsgs(next); setBusy(true);
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': s.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: s.model || 'claude-sonnet-4-5', max_tokens: 900, system: buildSystem(book, c, evs, en), messages: next.map(m => ({ role: m.role, content: m.content })) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || `Request failed (${r.status})`);
      const answer = (j.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n');
      setMsgs([...next, { role: 'assistant', content: answer }]);
    } catch (e) { setErr(e.message); setMsgs(msgs); }
    setBusy(false);
  }

  return (
    <div>
      <div className="eyebrow">Ask about {book.abbr} {c}</div>
      <p className="muted small" style={{ marginTop: 4 }}>Questions go to Claude with this chapter, its timeline events and places as context.</p>
      {!s.apiKey && <p className="small" style={{ background: 'var(--walnut-3)', padding: 10, borderRadius: 6 }}>No API key yet. <Link to="/settings">Add one in Settings</Link> — it stays on this device.</p>}
      <div className="chat" style={{ marginTop: 10 }}>
        {msgs.length === 0 && <div className="suggest">{SUGGEST.map(t => <button key={t} onClick={() => ask(t)}>{t}</button>)}</div>}
        {msgs.map((m, i) => <div key={i} className={'msg ' + (m.role === 'user' ? 'u' : 'a')}>{m.content}</div>)}
        {busy && <div className="msg a muted"><i>Consulting the sources…</i></div>}
        {err && <div className="msg a" style={{ color: '#e0846f' }}>{err}</div>}
        <div ref={endRef} />
      </div>
      <div className="askrow">
        <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Who is speaking in verse 12?" onKeyDown={e => e.key === 'Enter' && ask()} aria-label="Your question" />
        <button className="btn solid" onClick={() => ask()} disabled={busy || !q.trim()}>Ask</button>
      </div>
      {msgs.length > 0 && <div className="suggest" style={{ marginTop: 8 }}>{SUGGEST.slice(0, 3).map(t => <button key={t} onClick={() => ask(t)}>{t}</button>)}<button onClick={() => setMsgs([])}>Clear</button></div>}
    </div>
  );
}
