import { data } from './store';

export function fmtYear(y) {
  const a = Math.abs(Math.round(y));
  return y < 0 ? `${a} BC` : `AD ${a}`;
}
export function refLabel(r) {
  const b = data.byId[r.b]; const name = b ? b.abbr : r.b;
  if (r.v1) return `${name} ${r.c1}:${r.v1}${r.v2 && r.v2 !== r.v1 ? '–' + r.v2 : ''}`;
  return r.c1 === r.c2 ? `${name} ${r.c1}` : `${name} ${r.c1}–${r.c2}`;
}
export function eraFor(y) { return data.timeline.eras.find(e => y >= e.s && y < e.e) || data.timeline.eras[data.timeline.eras.length - 1]; }
export function artUrl(wp) { return data.timeline.artFiles[wp]; }
export function eventsForChapter(b, c) { return (data.eventsByChapter[b + ':' + c] || []).slice().sort((x, y) => x.y - y.y); }
// verse where an event should be anchored inside a chapter (first verse-level ref in that chapter, else 1)
export function anchorVerse(ev, b, c) {
  let best = null;
  for (const r of ev.refs) if (r.b === b && r.c1 <= c && c <= r.c2 && r.v1) { if (best == null || r.v1 < best) best = r.v1; }
  return best || 1;
}
export function isPrimaryChapter(ev, b, c) {
  // the chapter where this event's first ref starts
  const r = ev.refs.find(x => x.b === b); return r && r.c1 === c;
}
// map projection (same frame as the original timeline site)
export const MAP = { LON0: 8, LON1: 54, LAT0: 12, LAT1: 43, W: 814, H: 600 };
export function proj(lon, lat) { return [(lon - MAP.LON0) / (MAP.LON1 - MAP.LON0) * MAP.W, (MAP.LAT1 - lat) / (MAP.LAT1 - MAP.LAT0) * MAP.H]; }
export function pathFrom(pts, close) { return pts.map((p, i) => { const [x, y] = proj(p[0], p[1]); return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }).join(' ') + (close ? ' Z' : ''); }
export const GEO = {
  SEA_MED: [[8,36.95],[9.2,37.25],[10.3,37.1],[11.1,36.6],[11.0,35.2],[10.1,33.8],[11.6,33.3],[13.2,32.9],[15.3,32.5],[15.6,31.5],[17.5,31.0],[19.4,30.4],[20.2,32.0],[22,32.8],[25,31.6],[27.5,31.15],[29.8,31.1],[30.5,31.5],[31.9,31.25],[32.35,31.15],[33.4,31.15],[34.25,31.35],[34.55,31.7],[34.95,32.6],[35.1,33.2],[35.5,33.9],[35.9,34.6],[35.85,35.5],[36.1,36.0],[35.9,36.4],[34.7,36.75],[33.1,36.45],[31.5,36.6],[30.0,36.35],[28.6,36.6],[27.3,36.85],[26.4,37.3],[26.3,38.5],[26.6,39.3],[26.2,40.05],[25.0,40.9],[22.5,42.0],[18.5,43],[8,43]],
  LAND_ITALY: [[10,43],[11.7,42.4],[12.2,41.7],[13.0,41.2],[13.9,40.95],[14.9,40.2],[15.6,40.0],[15.9,39.0],[16.15,38.1],[16.6,38.7],[17.2,39.1],[17.1,39.9],[17.9,40.25],[18.5,39.9],[18.3,40.9],[17.3,41.2],[16.1,41.9],[14.8,42.4],[13.6,43]],
  LAND_SICILY: [[12.4,38.0],[13.7,38.3],[15.2,38.25],[15.6,38.0],[15.1,36.9],[14.0,37.1],[12.6,37.6]],
  LAND_SARDINIA: [[8.4,41.2],[9.5,41.3],[9.8,40.5],[9.6,39.2],[8.9,38.9],[8.4,39.5]],
  LAND_BALKANS: [[17.9,43],[26.6,43],[26.4,41.5],[26.0,40.6],[25.2,40.9],[24.3,40.8],[23.6,40.5],[23.0,40.2],[22.6,40.0],[22.9,39.3],[23.2,38.8],[24.0,38.3],[23.9,37.7],[23.1,37.4],[22.9,36.9],[23.1,36.4],[22.4,36.5],[21.8,36.8],[21.6,37.3],[21.3,37.7],[21.1,38.3],[20.7,38.8],[20.0,39.6],[19.4,40.3],[19.3,41.0],[18.8,42.0]],
  LAND_CRETE: [[23.5,35.6],[24.8,35.65],[26.1,35.5],[26.3,35.2],[25.0,35.0],[23.6,35.2]],
  SEA_BLACK: [[26.5,43],[27.1,41.6],[29.05,41.15],[31,41.35],[33.5,42.0],[36,41.4],[38.5,40.95],[41.5,41.4],[43,41.7],[43.5,43]],
  SEA_RED: [[32.55,29.95],[33.0,28.7],[33.9,27.4],[35.0,25.9],[36.2,24.2],[37.6,22.2],[39.2,19.8],[41.2,16.8],[43.0,12.7],[43.35,13.1],[42.6,15.5],[41.6,17.7],[40.4,19.8],[39.3,21.4],[38.4,23.2],[37.2,24.9],[35.8,26.8],[34.9,27.9],[34.85,28.6],[35.05,29.55],[34.65,29.2],[34.45,28.3],[34.05,27.9],[33.5,28.3],[32.9,29.3]],
  SEA_GULF: [[48.4,30.0],[49.3,29.4],[50.2,28.6],[50.8,27.6],[51.6,26.8],[52.6,26.2],[54,26.2],[54,24.8],[53,24.3],[51.8,24.3],[50.8,25.0],[50.0,25.8],[49.2,26.6],[48.6,27.6],[47.9,28.9]],
  SEA_CASPIAN: [[48.8,43],[49.3,41.3],[49.9,40.0],[50.3,38.8],[51.0,37.6],[52.2,36.9],[54,36.8],[54,43]],
  RIV_NILE: [[32.5,12.5],[33.2,16.0],[31.8,19.5],[30.7,22.0],[32.9,25.0],[32.5,27.0],[31.1,29.0],[31.2,30.2],[30.6,31.3]],
  RIV_NILE2: [[31.2,30.2],[31.8,31.15]],
  RIV_EUPH: [[38.2,38.4],[38.0,36.8],[39.0,35.95],[40.14,35.33],[41.9,34.4],[43.3,33.4],[44.42,32.5],[45.6,31.3],[47.4,31.0],[48.4,30.0]],
  RIV_TIGR: [[40.2,38.1],[43.1,36.35],[43.7,35.0],[44.4,33.3],[45.8,32.2],[47.4,31.0]],
  RIV_JORD: [[35.6,33.2],[35.58,32.85],[35.55,32.1],[35.5,31.77],[35.5,31.35]],
};
export const CAT_NAMES = { scr: 'Scripture & prophets', emp: 'Empires & rulers', mig: 'Exiles & migrations', war: 'Wars & conquests', dis: 'Disasters & plagues', txt: 'Texts & theology' };
export const HIST = { trad: 'traditional narrative', mixed: 'tradition + history', hist: 'historical' };
