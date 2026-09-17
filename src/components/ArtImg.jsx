import React, { useEffect, useState } from 'react';
import { data, withBase } from '../store';

// Shows a bundled artwork from /art when present; otherwise resolves the image from
// Wikipedia's page summary (the same source the pictures came from) and remembers it.
const mem = {};
function cached(wp) { if (mem[wp]) return mem[wp]; try { return localStorage.getItem('vv.art.' + wp) || null; } catch { return null; } }
async function resolve(wp) {
  const hit = cached(wp); if (hit) return hit;
  const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(wp));
  if (!r.ok) throw new Error('no image');
  const j = await r.json(); const url = j.originalimage?.source || j.thumbnail?.source; if (!url) throw new Error('no image');
  mem[wp] = url; try { localStorage.setItem('vv.art.' + wp, url); } catch {}
  return url;
}
export default function ArtImg({ wp, alt = '', ...rest }) {
  const local = withBase(data.timeline.artFiles[wp]);
  const [src, setSrc] = useState(local || cached(wp));
  const [failed, setFailed] = useState(false);
  useEffect(() => { if (local && !failed) return; let on = true; resolve(wp).then(u => on && setSrc(u)).catch(() => {}); return () => { on = false; }; }, [wp, local, failed]);
  if (!src) return <div {...rest} style={{ ...(rest.style || {}), background: 'linear-gradient(135deg, #332e2a, #26221f)' }} aria-hidden="true" />;
  return <img src={src} alt={alt} onError={() => { if (!failed) { setFailed(true); setSrc(cached(wp)); } }} {...rest} />;
}
