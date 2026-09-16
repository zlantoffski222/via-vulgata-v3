import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { data, useProgress, chapterDone } from '../store';
import { mount } from '../home/engine';
import DailyFive from './DailyFive';

// Mounts the interactive timeline/map engine and keeps it in step with reading progress and the URL.
export default function EngineHost({ idle = true }) {
  const p = useProgress(); const nav = useNavigate(); const [sp] = useSearchParams();
  const host = useRef(null); const engine = useRef(null);
  const [idleEl, setIdleEl] = useState(null);
  const pRef = useRef(p); pRef.current = p;
  const isEventRead = ev => { const r = ev.refs[0]; if (!r) return false; const book = data.byId[r.b]; if (!book) return false; for (let c = r.c1; c <= r.c2; c++) if (!chapterDone(pRef.current, book, c)) return false; return true; };
  useEffect(() => {
    engine.current = mount(host.current, { navigate: to => nav(to), isEventRead, renderIdle: el => setIdleEl(el), journeys: data.journeys });
    return () => { engine.current?.destroy(); engine.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const loc = sp.get('loc'), ev = sp.get('ev'), route = sp.get('route'); if (!engine.current) return;
    if (loc) engine.current.showLoc(loc); else if (ev != null && data.timeline.events[+ev]) engine.current.select(+ev); else if (route) engine.current.showRoute(route);
  }, [sp]);
  useEffect(() => { engine.current?.refresh(); }, [p.read]);
  return <><div ref={host} className="engine" />{idle && idleEl && createPortal(<DailyFive compact />, idleEl)}</>;
}
