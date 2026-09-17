// Data loading, reading progress, notes, memory deck and settings — all persisted in localStorage.
import { useSyncExternalStore, useEffect, useState } from 'react';

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------- static data ---------- */
export const data = { books: null, byId: {}, timeline: null, context: null, plan: null, notes: [], notesByChapter: {}, versions: [], people: [], journeys: [], harmony: null, prophecy: [], lectionary: null, saints: [], prayers: null, ready: false };
// Single-file builds embed every data file in window.__VV__ keyed by path; otherwise fetch from /data.
const EMBED = typeof window !== 'undefined' ? window.__VV__ : null;
const EMBEDZ = typeof window !== 'undefined' ? window.__VVZ__ : null;
async function inflate(b64) {
  const bin = atob(b64); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
}
export const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const withBase = p => (p && p.startsWith('/') && BASE && !p.startsWith(BASE + '/')) ? BASE + p : p;
export const getJson = p => EMBED && EMBED[p] ? Promise.resolve(EMBED[p]) : EMBEDZ && EMBEDZ[p] ? inflate(EMBEDZ[p]) : fetch(withBase(p)).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
let dataPromise = null;
export function loadData() {
  if (!dataPromise) {
    dataPromise = Promise.all([
      getJson('/data/books.json'),
      getJson('/data/timeline.json'),
      getJson('/data/books_context.json'),
      getJson('/data/plan_chrono.json'),
      getJson('/data/notes_nt.json').catch(() => []),
      getJson('/data/versions.json').catch(() => ({ versions: [] })),
      getJson('/data/notes_ot.json').catch(() => []),
      getJson('/data/people.json').catch(() => ({ people: [] })),
      getJson('/data/journeys.json').catch(() => ({ journeys: [] })),
      getJson('/data/harmony.json').catch(() => ({ sections: [] })),
      getJson('/data/prophecy.json').catch(() => ({ items: [] })),
      getJson('/data/lectionary.json').catch(() => null),
      getJson('/data/saints.json').catch(() => []),
      getJson('/data/prayers.json').catch(() => null),
    ]).then(([books, timeline, context, plan, notesNT, versions, notesOT, people, journeys, harmony, prophecy, lectionary, saints, prayers]) => {
      data.versions = versions.versions || [];
      data.books = books; data.byId = Object.fromEntries(books.map(b => [b.id, b]));
      data.timeline = timeline; data.context = context; data.plan = plan; data.ready = true;
      data.people = people.people || []; data.journeys = journeys.journeys || []; data.harmony = harmony; data.prophecy = prophecy.items || []; data.lectionary = lectionary; data.saints = saints; data.prayers = prayers;
      // index events by book/chapter
      const byChapter = {};
      for (const ev of timeline.events) for (const r of ev.refs) for (let c = r.c1; c <= r.c2; c++) {
        const k = r.b + ':' + c; (byChapter[k] ||= []); if (!byChapter[k].includes(ev)) byChapter[k].push(ev);
      }
      data.eventsByChapter = byChapter;
      const order = Object.fromEntries(books.map(b => [b.id, b.order]));
      const all = [...notesNT.map(n => ({ ...n, nt: true })), ...notesOT.map(n => ({ ...n, nt: false }))].sort((a, z) => (order[a.b] - order[z.b]) || (a.c - z.c) || (a.v1 - z.v1));
      data.notes = all.map((n, i) => ({ ...n, id: i }));
      const nbc = {}; for (const n of data.notes) (nbc[n.b + ':' + n.c] ||= []).push(n);
      data.notesByChapter = nbc;
      // people: match timeline events by name
      for (const p of data.people) { const names = (p.aka || [p.n]).map(x => x.toLowerCase()); p.events = timeline.events.filter(e => (e.who || []).some(w => names.some(n => w.toLowerCase() === n || w.toLowerCase().startsWith(n + ' (')))).map(e => e.id); }
      return data;
    });
  }
  return dataPromise;
}
export function useData() {
  const [ready, setReady] = useState(data.ready);
  useEffect(() => { if (!ready) loadData().then(() => setReady(true)); }, [ready]);
  return ready ? data : null;
}

const textCache = {};
export async function loadText(tr, bookId) {
  const k = tr + '/' + bookId;
  if (!textCache[k]) textCache[k] = getJson(`/data/text/${tr}/${bookId}.json`);
  return textCache[k];
}
export function useText(tr, bookId) {
  const [t, setT] = useState(null);
  useEffect(() => { let on = true; setT(null); loadText(tr, bookId).then(x => on && setT(x)); return () => { on = false; }; }, [tr, bookId]);
  return t;
}
// lazy per-book side data (cross references, speakers) and the Latin dictionary
const sideCache = {};
export function loadSide(kind, bookId) { const k = kind + '/' + bookId; if (!sideCache[k]) sideCache[k] = getJson(`/data/${kind}/${bookId}.json`).catch(() => ({})); return sideCache[k]; }
export function useSide(kind, bookId, enabled = true) {
  const [t, setT] = useState(null);
  useEffect(() => { let on = true; setT(null); if (!enabled) return; loadSide(kind, bookId).then(x => on && setT(x)); return () => { on = false; }; }, [kind, bookId, enabled]);
  return t;
}
let strongsPromise = null;
export function loadStrongs() { if (!strongsPromise) strongsPromise = getJson('/data/strongs.json').catch(() => ({})); return strongsPromise; }
let latinPromise = null;
export function loadLatin() { if (!latinPromise) latinPromise = getJson('/data/latin.json').catch(() => ({})); return latinPromise; }

/* ---------- tiny external store ---------- */
export function makeStore(key, initial) {
  let state = { ...initial, ...LS.get(key, {}) };
  const subs = new Set();
  return {
    get: () => state,
    set(patch) { state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }; LS.set(key, state); subs.forEach(f => f()); },
    replace(next) { state = next; LS.set(key, state); subs.forEach(f => f()); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
  };
}

export const settingsStore = makeStore('vv.settings', {
  mode: 'parallel',        // 'parallel' | 'la' | 'en'
  fontSize: 19,
  plan: 'canon',           // 'canon' | 'chrono'
  apiKey: '',
  model: 'claude-sonnet-4-5',
  enVersion: 'drc',        // English column: 'drc' | 'kjv' | 'web' | 'jps'
  markDiffs: true,         // show 'reads differently' markers
  showArtInline: true,
  theme: 'auto',           // 'day' | 'night' | 'auto'
  showSpeakers: true,      // who-is-speaking colouring
  showXrefs: true,         // cross-reference marks
  latinHelp: true,         // tap a Latin word for its meaning
  showGlosses: true,
  voiceRate: 1,
  goal: null,              // { scope: 'nt'|'ot'|'all', date: 'YYYY-MM-DD', startDate, startRead }
  syncId: '',              // cloud sync code
  dailyScope: 'nt',        // 'nt' | 'all'
  showOriginal: false,     // Greek / Hebrew line under the Latin
  fastRule: 'catholic',    // 'catholic' | 'traditional' | 'orthodox'
  saintsOnHome: true,
});
export const useSettings = () => useSyncExternalStore(settingsStore.subscribe, settingsStore.get);

// progress: { [bookId]: { [chapter]: number[] (verse numbers read) } }, plus last position and history
export const progressStore = makeStore('vv.progress', { read: {}, last: null, log: [] });
export const useProgress = () => useSyncExternalStore(progressStore.subscribe, progressStore.get);

// highlights and notes: { hl: { "BOOK:c:v": colour }, notes: { "BOOK:c:v": { t, d } } }
export const notesStore = makeStore('vv.notes', { hl: {}, notes: {} });
export const useNotes = () => useSyncExternalStore(notesStore.subscribe, notesStore.get);
export const vkey = (b, c, v) => `${b}:${c}:${v}`;
export function setHighlight(b, c, v, colour) { notesStore.set(s => { const hl = { ...s.hl }; if (colour) hl[vkey(b, c, v)] = colour; else delete hl[vkey(b, c, v)]; return { hl }; }); }
export function setNote(b, c, v, text) { notesStore.set(s => { const notes = { ...s.notes }; if (text && text.trim()) notes[vkey(b, c, v)] = { t: text.trim(), d: Date.now() }; else delete notes[vkey(b, c, v)]; return { notes }; }); }

// memory verses: { cards: [{ id, b, c, v1, v2, lang, added, due, ivl, ease, reps }] }
export const memoryStore = makeStore('vv.memory', { cards: [] });
export const useMemory = () => useSyncExternalStore(memoryStore.subscribe, memoryStore.get);
export function addCard(b, c, v1, v2 = v1, lang = 'en') {
  memoryStore.set(s => { const id = `${b}:${c}:${v1}-${v2}:${lang}`; if (s.cards.some(x => x.id === id)) return {}; return { cards: [...s.cards, { id, b, c, v1, v2, lang, added: Date.now(), due: Date.now(), ivl: 0, ease: 2.5, reps: 0 }] }; });
}
export function removeCard(id) { memoryStore.set(s => ({ cards: s.cards.filter(x => x.id !== id) })); }
// SM-2 style review: grade 0 (again) … 3 (easy)
export function reviewCard(id, grade) {
  memoryStore.set(s => ({ cards: s.cards.map(c => {
    if (c.id !== id) return c; let { ivl, ease, reps } = c;
    if (grade === 0) { reps = 0; ivl = 0; ease = Math.max(1.3, ease - 0.2); }
    else { reps += 1; if (reps === 1) ivl = grade === 3 ? 3 : 1; else if (reps === 2) ivl = grade === 3 ? 7 : 4; else ivl = Math.round(ivl * ease * (grade === 1 ? 0.8 : grade === 3 ? 1.3 : 1)); ease = Math.max(1.3, ease + (grade === 3 ? 0.15 : grade === 1 ? -0.15 : 0)); }
    const due = Date.now() + (grade === 0 ? 10 * 60 * 1000 : ivl * 86400000);
    return { ...c, ivl, ease, reps, due, last: Date.now() };
  }) }));
}

export function readSet(p, b, c) { return new Set((p.read[b] && p.read[b][c]) || []); }
export function toggleVerse(b, c, v) {
  progressStore.set(s => {
    const book = { ...(s.read[b] || {}) }; const set = new Set(book[c] || []);
    set.has(v) ? set.delete(v) : set.add(v);
    book[c] = [...set].sort((a, z) => a - z);
    return { read: { ...s.read, [b]: book }, log: bump(s.log) };
  });
}
export function setChapter(b, c, verseCount, on) {
  progressStore.set(s => {
    const book = { ...(s.read[b] || {}) };
    book[c] = on ? Array.from({ length: verseCount }, (_, i) => i + 1) : [];
    return { read: { ...s.read, [b]: book }, log: bump(s.log) };
  });
}
export function markRange(b, c, v1, v2) {
  progressStore.set(s => { const book = { ...(s.read[b] || {}) }; const set = new Set(book[c] || []); for (let v = v1; v <= v2; v++) set.add(v); book[c] = [...set].sort((a, z) => a - z); return { read: { ...s.read, [b]: book }, log: bump(s.log) }; });
}
export function setLast(b, c) { progressStore.set({ last: { b, c, t: Date.now() } }); }
function bump(log) {
  const day = new Date().toISOString().slice(0, 10);
  const l = [...(log || [])]; const i = l.findIndex(x => x.d === day);
  if (i >= 0) l[i] = { d: day, n: l[i].n + 1 }; else l.push({ d: day, n: 1 });
  return l.slice(-400);
}
export function bookProgress(p, book) {
  const r = p.read[book.id] || {}; let n = 0;
  for (const c in r) n += Math.min(r[c].length, book.chapters[c - 1] || 0);
  return { read: n, total: book.verses, pct: book.verses ? n / book.verses : 0 };
}
export function chapterDone(p, book, c) {
  const r = (p.read[book.id] || {})[c] || []; return r.length >= book.chapters[c - 1];
}
export function totalProgress(p, books) {
  let read = 0, total = 0; for (const b of books) { const x = bookProgress(p, b); read += x.read; total += x.total; }
  return { read, total, pct: total ? read / total : 0 };
}
export function chaptersRead(p, books) { let n = 0; for (const b of books) for (let c = 1; c <= b.chapters.length; c++) if (chapterDone(p, b, c)) n++; return n; }
export function exportProgress() { return JSON.stringify({ v: 2, progress: progressStore.get(), notes: notesStore.get(), memory: memoryStore.get(), settings: { ...settingsStore.get(), apiKey: undefined } }, null, 1); }
export function importProgress(json, merge = false) {
  const o = JSON.parse(json);
  if (o.progress && o.progress.read) {
    if (merge) { const cur = progressStore.get(); const read = { ...cur.read }; for (const b in o.progress.read) { read[b] = { ...(read[b] || {}) }; for (const c in o.progress.read[b]) read[b][c] = [...new Set([...(read[b][c] || []), ...o.progress.read[b][c]])].sort((a, z) => a - z); } progressStore.replace({ ...cur, read, last: o.progress.last?.t > (cur.last?.t || 0) ? o.progress.last : cur.last }); }
    else progressStore.replace({ read: {}, last: null, log: [], ...o.progress });
  }
  if (o.notes) notesStore.replace(merge ? { hl: { ...notesStore.get().hl, ...o.notes.hl }, notes: { ...notesStore.get().notes, ...o.notes.notes } } : { hl: {}, notes: {}, ...o.notes });
  if (o.memory) memoryStore.replace(merge ? { cards: [...memoryStore.get().cards, ...o.memory.cards.filter(c => !memoryStore.get().cards.some(x => x.id === c.id))] } : { cards: [], ...o.memory });
  if (o.settings) settingsStore.set({ ...o.settings, apiKey: settingsStore.get().apiKey, syncId: settingsStore.get().syncId });
}
// compact "sync text": gzip + base64 of the export, small enough to paste between devices
export async function syncText() {
  const bytes = new TextEncoder().encode(exportProgress());
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer()); let s = ''; for (const b of buf) s += String.fromCharCode(b);
  return 'VV2:' + btoa(s);
}
export async function importSyncText(t, merge = true) {
  t = t.trim(); if (!t.startsWith('VV2:')) throw new Error('not a sync text');
  const bin = atob(t.slice(4)); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  importProgress(await new Response(stream).text(), merge);
}
// cloud sync through a small public JSON store (best effort; the sync text and backups always work)
const SYNC_API = 'https://jsonblob.com/api/jsonBlob';
export async function cloudPush() {
  const s = settingsStore.get(); const body = exportProgress();
  if (s.syncId) { const r = await fetch(`${SYNC_API}/${s.syncId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body }); if (!r.ok) throw new Error('sync failed (' + r.status + ')'); return s.syncId; }
  const r = await fetch(SYNC_API, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body }); if (!r.ok) throw new Error('sync failed (' + r.status + ')');
  const loc = r.headers.get('Location') || r.headers.get('location') || ''; const id = loc.split('/').pop(); if (!id) throw new Error('no sync code returned');
  settingsStore.set({ syncId: id }); return id;
}
export async function cloudPull(id, merge = true) {
  const r = await fetch(`${SYNC_API}/${id}`, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error('nothing found for that code'); importProgress(await r.text(), merge); settingsStore.set({ syncId: id });
}

/* ---------- navigation helpers ---------- */
export function nextChapter(books, b, c) {
  const book = data.byId[b]; if (c < book.chapters.length) return { b, c: c + 1 };
  const nb = books[book.order + 1]; return nb ? { b: nb.id, c: 1 } : null;
}
export function prevChapter(books, b, c) {
  const book = data.byId[b]; if (c > 1) return { b, c: c - 1 };
  const pb = books[book.order - 1]; return pb ? { b: pb.id, c: pb.chapters.length } : null;
}
// chronological plan as a flat list of chapters
export function chronoChapters(plan) {
  const out = []; plan.forEach((step, si) => step.items.forEach(([b, c1, c2]) => { for (let c = c1; c <= c2; c++) out.push({ b, c, step: si }); }));
  return out;
}
// "The life of Christ": the four Gospels read as one story — every chapter placed in the part of the harmony where its scenes fall, each chapter once
let christPlanCache = null;
export function christPlan() {
  if (christPlanCache || !data.harmony) return christPlanCache;
  const seen = new Set(); const steps = [];
  for (const sec of data.harmony.sections) {
    const chs = [];
    for (const it of sec.items) for (const g of ['MAT', 'MRK', 'LUK', 'JHN']) { if (!it[g]) continue; const c = it[g][0]; const k = g + ':' + c; if (!seen.has(k)) { seen.add(k); chs.push([g, c]); } }
    const items = []; for (const [b, c] of chs) { const last = items[items.length - 1]; if (last && last[0] === b && last[2] === c - 1) last[2] = c; else items.push([b, c, c]); }
    if (items.length) steps.push({ era: 'The life of Christ', title: sec.t, items });
  }
  return (christPlanCache = steps);
}
export function activePlan(s) { return s.plan === 'chrono' ? data.plan : s.plan === 'christ' ? christPlan() : null; }
export const PLAN_NAMES = { canon: 'Canonical order', chrono: 'Story order', christ: 'The life of Christ' };
export function nextInPlan(plan, p) {
  const list = chronoChapters(plan);
  for (const x of list) { const book = data.byId[x.b]; if (!chapterDone(p, book, x.c)) return x; }
  return null;
}
export function nextCanon(books, p) {
  for (const book of books) for (let c = 1; c <= book.chapters.length; c++) if (!chapterDone(p, book, c)) return { b: book.id, c };
  return null;
}

// Other English versions are stored aligned to the Vulgate grid: { v: chapters, r: {"c:v": ref}, d: [...], m: [...], j: [...] }
export function versionHasBook(ver, bookId) { const v = data.versions.find(x => x.id === ver); return !v || v.id === 'drc' ? true : v.books.includes(bookId); }
export function useVersionText(ver, bookId) {
  const [t, setT] = useState(null);
  useEffect(() => { let on = true; setT(null); if (!ver || ver === 'drc' || !versionHasBook(ver, bookId)) { setT(null); return; } loadText(ver, bookId).then(x => on && setT(x)); return () => { on = false; }; }, [ver, bookId]);
  return t;
}

/* ---------- daily passages ---------- */
// Five passages for a given date, the same for everyone on that day.
export function saintFor(date = new Date()) { const k = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; return data.saints.find(s => s.d === k) || null; }
export function dailyNotes(date = new Date(), scope = 'nt') {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const pool = scope === 'all' ? data.notes : data.notes.filter(n => n.nt); if (!pool.length) return [];
  let x = (day * 2654435761) >>> 0; const out = [];
  while (out.length < Math.min(5, pool.length)) { x = (x * 1664525 + 1013904223) >>> 0; const n = pool[x % pool.length]; if (!out.includes(n)) out.push(n); }
  return out;
}

/* ---------- goal & pace ---------- */
export function goalStatus(p, s) {
  const g = s.goal; if (!g || !g.date) return null;
  const books = data.books.filter(b => g.scope === 'all' || (g.scope === 'nt' ? b.testament === 'NT' : b.testament === 'OT'));
  const total = books.reduce((a, b) => a + b.chapters.length, 0);
  const done = chaptersRead(p, books);
  const now = new Date(); const end = new Date(g.date + 'T23:59:59'); const start = new Date((g.startDate || now.toISOString().slice(0, 10)) + 'T00:00:00');
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000)); const daysTotal = Math.max(1, Math.ceil((end - start) / 86400000));
  const startDone = g.startDone || 0; const elapsed = Math.max(0, Math.min(daysTotal, Math.ceil((now - start) / 86400000)));
  const expected = startDone + (total - startDone) * (elapsed / daysTotal);
  const perDay = daysLeft ? (total - done) / daysLeft : total - done;
  return { total, done, left: total - done, daysLeft, perDay, ahead: done - expected, pct: total ? done / total : 0, label: g.scope === 'all' ? 'the whole Bible' : g.scope === 'nt' ? 'the New Testament' : 'the Old Testament' };
}
