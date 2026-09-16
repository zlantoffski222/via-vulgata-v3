import React from 'react';
import { data } from '../store';
import { proj, pathFrom, GEO, MAP } from '../util';

// Small static map centred on the given location keys.
export default function MiniMap({ keys, height = 180 }) {
  const pts = keys.map(k => data.timeline.locs[k]).filter(Boolean).map(L => proj(L.ll[0], L.ll[1]));
  if (!pts.length) return null;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const w = 340, h = height; let cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), (Math.max(...ys) - Math.min(...ys)) * w / h, 240) * 1.5;
  const vw = span, vh = span * h / w;
  const x0 = Math.min(Math.max(cx - vw / 2, 0), MAP.W - vw), y0 = Math.min(Math.max(cy - vh / 2, 0), MAP.H - vh);
  const k = MAP.W / vw; const u = vw / 340; // one screen pixel in viewBox units
  return (
    <svg viewBox={`${x0} ${y0} ${vw} ${vh}`} style={{ width: '100%', height, borderRadius: 6, background: '#d8c9a6' }} aria-label="Map">
      <rect x="0" y="0" width={MAP.W} height={MAP.H} className="map-land" />
      {['SEA_MED', 'SEA_BLACK', 'SEA_RED', 'SEA_GULF', 'SEA_CASPIAN'].map(s => <path key={s} className="map-sea" d={pathFrom(GEO[s], true)} />)}
      {['LAND_ITALY', 'LAND_SICILY', 'LAND_SARDINIA', 'LAND_BALKANS', 'LAND_CRETE'].map(s => <path key={s} className="map-land" d={pathFrom(GEO[s], true)} />)}
      {['RIV_NILE', 'RIV_NILE2', 'RIV_EUPH', 'RIV_TIGR', 'RIV_JORD'].map(s => <path key={s} className="map-river" strokeWidth={1.6 * u} d={pathFrom(GEO[s])} />)}
      {keys.map(key => { const L = data.timeline.locs[key]; if (!L) return null; const [x, y] = proj(L.ll[0], L.ll[1]);
        return <g key={key}><circle className="loc-dot" cx={x} cy={y} r={3.5 * u} strokeWidth={1.2 * u} /><text className="loc-label" x={x + 6 * u} y={y + 4 * u} fontSize={12 * u} strokeWidth={3 * u}>{L.n}</text></g>; })}
    </svg>
  );
}
