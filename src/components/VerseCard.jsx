import React, { useEffect, useRef, useState } from 'react';
import { data, withBase } from '../store';

// A verse as a picture: the chapter's painting behind, the English and the Latin in the app's type, the reference in gold.
const SIZES = { portrait: [1080, 1350], square: [1080, 1080], wide: [1600, 900] };
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function wrap(ctx, text, maxW) { const words = text.split(/\s+/); const lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); if (!src.startsWith('data:')) im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = rej; im.src = src; }); }

export async function drawVerseCard(canvas, { en, la, ref, artSrc, size = 'portrait', showLatin = true, dark = true }) {
  const [W, H] = SIZES[size]; canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d');
  // background
  ctx.fillStyle = '#1d1a14'; ctx.fillRect(0, 0, W, H);
  let hadArt = false;
  if (artSrc) { try { const im = await loadImage(artSrc); const s = Math.max(W / im.width, H / im.height); const dw = im.width * s, dh = im.height * s; ctx.drawImage(im, (W - dw) / 2, (H - dh) * 0.3, dw, dh); hadArt = true; } catch {} }
  if (!hadArt) { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#3a3020'); g.addColorStop(1, '#17140f'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  const veil = ctx.createLinearGradient(0, 0, 0, H); veil.addColorStop(0, 'rgba(20,17,12,0.25)'); veil.addColorStop(0.45, 'rgba(20,17,12,0.55)'); veil.addColorStop(1, 'rgba(20,17,12,0.92)'); ctx.fillStyle = veil; ctx.fillRect(0, 0, W, H);
  // frame
  const m = Math.round(W * 0.05); ctx.strokeStyle = 'rgba(217,184,116,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
  ctx.strokeStyle = 'rgba(217,184,116,0.25)'; ctx.strokeRect(m + 10, m + 10, W - 2 * m - 20, H - 2 * m - 20);
  // text block
  const maxW = W - 2 * m - 2 * Math.round(W * 0.06); const x = m + Math.round(W * 0.06);
  let fs = size === 'wide' ? 54 : 58; let lines; ctx.textBaseline = 'alphabetic';
  do { ctx.font = `${fs}px ${SERIF}`; lines = wrap(ctx, '“' + en + '”', maxW); fs -= 2; } while (lines.length * fs * 1.28 > H * 0.42 && fs > 26);
  fs += 2; const lh = fs * 1.3;
  let laLines = []; let laFs = Math.round(fs * 0.62); if (showLatin && la) { ctx.font = `italic ${laFs}px ${SERIF}`; laLines = wrap(ctx, la, maxW); while (laLines.length * laFs * 1.3 > H * 0.2 && laFs > 20) { laFs -= 2; ctx.font = `italic ${laFs}px ${SERIF}`; laLines = wrap(ctx, la, maxW); } }
  const blockH = lines.length * lh + (laLines.length ? laLines.length * laFs * 1.3 + fs * 0.7 : 0) + fs * 1.6;
  let y = H - m - Math.round(W * 0.06) - blockH + fs;
  ctx.fillStyle = '#fffdf7'; ctx.font = `${fs}px ${SERIF}`; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12;
  for (const l of lines) { ctx.fillText(l, x, y); y += lh; }
  if (laLines.length) { y += fs * 0.2; ctx.fillStyle = '#e6d3a5'; ctx.font = `italic ${laFs}px ${SERIF}`; for (const l of laLines) { ctx.fillText(l, x, y); y += laFs * 1.3; } }
  y += fs * 0.5; ctx.shadowBlur = 0;
  ctx.fillStyle = '#d9b874'; ctx.font = `600 ${Math.round(fs * 0.5)}px ${SANS}`; ctx.letterSpacing = '0.14em'; ctx.fillText(ref.toUpperCase(), x, y);
  // ornament + credit
  ctx.font = `${Math.round(fs * 0.55)}px ${SERIF}`; ctx.fillStyle = '#c9a45c'; ctx.textAlign = 'center'; ctx.letterSpacing = '0.3em'; ctx.fillText('✦ ✦ ✦', W / 2, m + Math.round(W * 0.07));
  ctx.textAlign = 'right'; ctx.font = `${Math.round(fs * 0.36)}px ${SANS}`; ctx.fillStyle = 'rgba(232,223,207,0.7)'; ctx.letterSpacing = '0.08em'; ctx.fillText('CHRIST IS KING · christ-is-king-bible.github.io', W - m - 24, H - m - 22);
  ctx.textAlign = 'left'; ctx.letterSpacing = '0';
  return canvas;
}

export function artForChapter(bookId, c) {
  const evs = (data.eventsByChapter && data.eventsByChapter[bookId + ':' + c]) || []; const e = evs.find(x => x.art) || null;
  if (!e) return null; const src = withBase(data.timeline.artFiles[e.art.wp]); return src ? { src, t: e.art.t, by: e.art.by } : null;
}

export default function VerseCard({ book, c, v, en, la }) {
  const ref = `${book.name.replace(/\s*\(.*\)/, '')} ${c}:${v}`;
  const [size, setSize] = useState('portrait'); const [latin, setLatin] = useState(true); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const canvas = useRef(null); const art = artForChapter(book.id, c);
  useEffect(() => { let on = true; setBusy(true); drawVerseCard(canvas.current, { en, la, ref, artSrc: art?.src, size, showLatin: latin }).then(() => on && setBusy(false)); return () => { on = false; }; }, [en, la, ref, size, latin]); // eslint-disable-line
  const blob = () => new Promise(res => canvas.current.toBlob(res, 'image/png'));
  const download = async () => { const b = await blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = ref.replace(/[^\w]+/g, '-') + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); setMsg('Saved.'); };
  const share = async () => { const b = await blob(); const file = new File([b], ref.replace(/[^\w]+/g, '-') + '.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: ref, text: `“${en}” — ${ref}` }); return; } catch {} } download(); };
  return (
    <div className="vcard">
      <div className="vcard-pic"><canvas ref={canvas} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10, opacity: busy ? .5 : 1 }} /></div>
      <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <div className="seg">{[['portrait', 'Portrait'], ['square', 'Square'], ['wide', 'Wide']].map(([id, n]) => <button key={id} className={size === id ? 'on' : ''} onClick={() => setSize(id)}>{n}</button>)}</div>
        <div className="seg"><button className={latin ? 'on' : ''} onClick={() => setLatin(true)}>With Latin</button><button className={!latin ? 'on' : ''} onClick={() => setLatin(false)}>English only</button></div>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <button className="btn solid sm" onClick={share}>Share the picture</button>
        <button className="btn sm" onClick={download}>Save as PNG</button>
        <span className="muted small">{msg || (art ? `Painting: ${art.t}${art.by ? ', ' + art.by : ''}` : 'No painting for this chapter — gold background')}</span>
      </div>
    </div>
  );
}
