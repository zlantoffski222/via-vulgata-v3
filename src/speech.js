// Read-aloud through the browser's speech synthesis. One queue at a time; callers observe via subscribe().
const subs = new Set();
const st = { playing: false, idx: -1, items: [], title: '' };
const emit = () => subs.forEach(f => f({ ...st }));
export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
export function subscribeSpeech(f) { subs.add(f); f({ ...st }); return () => subs.delete(f); }

let voices = [];
function refreshVoices() { try { voices = speechSynthesis.getVoices() || []; } catch { voices = []; } }
if (speechSupported) { refreshVoices(); speechSynthesis.onvoiceschanged = refreshVoices; }
function pickVoice(lang) {
  if (!voices.length) refreshVoices();
  const want = lang === 'la' ? ['it-IT', 'it', 'la', 'es-ES', 'es'] : ['en-GB', 'en-IE', 'en-AU', 'en-US', 'en'];
  for (const w of want) { const v = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(w.toLowerCase()) && !/eloquence|compact/i.test(v.name)); if (v) return v; }
  return null;
}
let rate = 1;
export function setRate(r) { rate = r; }

// items: [{ text, lang: 'en'|'la', key }] — key is reported back so the UI can highlight the verse being read
export function speak(items, title = '') {
  if (!speechSupported) return;
  stop();
  st.items = items; st.title = title; st.idx = -1; st.playing = true; emit();
  next();
}
function next() {
  if (!st.playing) return;
  st.idx += 1; if (st.idx >= st.items.length) { st.playing = false; st.idx = -1; emit(); return; }
  const it = st.items[st.idx]; emit();
  const u = new SpeechSynthesisUtterance(it.text.replace(/æ/g, 'ae').replace(/œ/g, 'oe'));
  const v = pickVoice(it.lang); if (v) u.voice = v; u.lang = it.lang === 'la' ? (v ? v.lang : 'it-IT') : (v ? v.lang : 'en-GB');
  u.rate = it.lang === 'la' ? Math.min(rate, 0.95) : rate;
  u.onend = () => { if (st.playing) next(); };
  u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled' && st.playing) next(); };
  speechSynthesis.speak(u);
}
export function pause() { if (!speechSupported) return; if (speechSynthesis.speaking && !speechSynthesis.paused) { speechSynthesis.pause(); st.playing = false; emit(); } }
export function resume() { if (!speechSupported) return; if (speechSynthesis.paused) { st.playing = true; speechSynthesis.resume(); emit(); } }
export function stop() { if (!speechSupported) return; st.playing = false; st.idx = -1; st.items = []; emit(); try { speechSynthesis.cancel(); } catch {} }
export function skip(n = 1) { if (!speechSupported || !st.items.length) return; st.idx += n - 1; st.idx = Math.max(-1, Math.min(st.items.length - 1, st.idx)); st.playing = true; try { speechSynthesis.cancel(); } catch {} setTimeout(next, 60); }
export function speechState() { return { ...st }; }
