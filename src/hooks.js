import { useEffect, useState, useSyncExternalStore } from 'react';
import { settingsStore } from './store';

const MQ = typeof window !== 'undefined' ? window.matchMedia('(max-width: 760px)') : null;
export function useIsMobile() {
  return useSyncExternalStore(cb => { if (!MQ) return () => {}; MQ.addEventListener('change', cb); return () => MQ.removeEventListener('change', cb); }, () => MQ ? MQ.matches : false, () => false);
}
export const isMobile = () => MQ ? MQ.matches : false;

const DARK = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
export function applyTheme() {
  const t = settingsStore.get().theme || 'auto';
  const night = t === 'night' || (t === 'auto' && DARK && DARK.matches);
  document.documentElement.dataset.theme = night ? 'night' : 'day';
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.setAttribute('content', night ? '#1b1815' : '#f8f5ec');
  return night;
}
export function useTheme() {
  const [night, setNight] = useState(() => typeof document !== 'undefined' && document.documentElement.dataset.theme === 'night');
  useEffect(() => {
    const run = () => setNight(applyTheme());
    run(); const un = settingsStore.subscribe(run); DARK && DARK.addEventListener('change', run);
    return () => { un(); DARK && DARK.removeEventListener('change', run); };
  }, []);
  return night;
}

// long-press helper: returns handlers; calls onLong after `ms` without movement
export function longPress(onLong, ms = 480) {
  let t = null, x0 = 0, y0 = 0, fired = false;
  const clear = () => { if (t) clearTimeout(t); t = null; };
  return {
    onPointerDown: e => { if (e.pointerType === 'mouse' && e.button !== 0) return; fired = false; x0 = e.clientX; y0 = e.clientY; clear(); t = setTimeout(() => { fired = true; onLong(e); }, ms); },
    onPointerMove: e => { if (t && (Math.abs(e.clientX - x0) > 8 || Math.abs(e.clientY - y0) > 8)) clear(); },
    onPointerUp: clear, onPointerCancel: clear, onPointerLeave: clear,
    onClickCapture: e => { if (fired) { e.stopPropagation(); e.preventDefault(); fired = false; } },
    onContextMenu: e => { e.preventDefault(); },
  };
}
