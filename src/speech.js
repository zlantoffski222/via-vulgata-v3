// Read-aloud. Two engines: the browser's own voices (ranked so the most natural one installed is chosen),
// and an optional "studio voice" — OpenAI's neural text-to-speech, with a key the reader enters in Settings.
// One queue at a time; callers observe via subscribe().
const subs = new Set();
const st = { playing: false, idx: -1, items: [], title: '', engine: 'browser', busy: false, error: '' };
const emit = () => subs.forEach(f => f({ ...st }));
export const speechSupported = typeof window !== 'undefined' && ('speechSynthesis' in window || 'Audio' in window);
export function subscribeSpeech(f) { subs.add(f); f({ ...st }); return () => subs.delete(f); }

// ---------- browser voices ----------
let voices = [];
function refreshVoices() { try { voices = (speechSynthesis.getVoices() || []).slice(); } catch { voices = []; } }
if (typeof window !== 'undefined' && 'speechSynthesis' in window) { refreshVoices(); speechSynthesis.onvoiceschanged = refreshVoices; }

// How natural a voice is likely to sound, from its name and URI. Higher is better.
export function voiceScore(v) {
  const n = (v.name + ' ' + (v.voiceURI || '')).toLowerCase();
  if (/eloquence|compact|novelty|whisper|bubbles|bells|cellos|organ|zarvox|trinoids|bad news|good news|hysterical|pipe organ|boing|jester|wobble|superstar|junior|kathy|ralph|fred|albert|bahh|deranged|rocko|shelley|grandma|grandpa|eddy|flo|reed|sandy/.test(n)) return -10;
  let s = 0;
  if (/premium/.test(n)) s += 50; if (/enhanced/.test(n)) s += 40; if (/neural|natural|online|multilingual/.test(n)) s += 45;
  if (/siri/.test(n)) s += 35; if (/google/.test(n)) s += 30; if (/microsoft/.test(n) && /natural|online/.test(n)) s += 45;
  if (/ava|zoe|samantha|allison|susan|karen|moira|daniel|serena|oliver|kate|tessa|fiona|jamie|stephanie|isha|lee|matilda|rishi|aria|jenny|guy|libby|ryan|sonia/.test(n)) s += 8;
  if (v.localService === false) s += 5; // network voices are usually the neural ones
  return s;
}
export function voicesFor(lang) {
  if (!voices.length) refreshVoices();
  const pref = lang === 'la' ? ['it', 'la', 'es', 'pt'] : ['en'];
  return voices.filter(v => v.lang && pref.some(p => v.lang.toLowerCase().startsWith(p))).map(v => ({ v, score: voiceScore(v) })).filter(x => x.score > -10)
    .sort((a, b) => b.score - a.score || (lang === 'la' ? 0 : (a.v.lang.startsWith('en-GB') ? -1 : 1))).map(x => x.v);
}
let chosen = { en: null, la: null }; // voiceURIs from settings
export function setVoices(c) { chosen = { ...chosen, ...c }; }
function pickVoice(lang) {
  const list = voicesFor(lang); const want = chosen[lang];
  if (want) { const v = list.find(v => v.voiceURI === want || v.name === want); if (v) return v; }
  return list[0] || null;
}
let rate = 1;
export function setRate(r) { rate = r; }

// ---------- studio voice (OpenAI) ----------
let studio = { key: '', voice: 'sage', on: false };
export function setStudio(cfg) { studio = { ...studio, ...cfg }; }
export const STUDIO_VOICES = [['sage', 'Sage — calm, clear'], ['ash', 'Ash — warm, steady'], ['coral', 'Coral — bright, warm'], ['nova', 'Nova — friendly'], ['shimmer', 'Shimmer — soft'], ['alloy', 'Alloy — even'], ['echo', 'Echo — deep'], ['onyx', 'Onyx — deep, resonant'], ['fable', 'Fable — expressive'], ['ballad', 'Ballad — gentle']];
const audioCache = new Map(); // text+lang+voice -> object URL
let audio = null; let pending = new Map();
async function fetchStudio(it) {
  const k = it.lang + '|' + studio.voice + '|' + it.text; if (audioCache.has(k)) return audioCache.get(k);
  if (pending.has(k)) return pending.get(k);
  const p = (async () => {
    const instructions = it.lang === 'la'
      ? 'Read this Ecclesiastical (Church) Latin aloud with Italianate pronunciation — soft c before e/i, v as v, ae as e — slowly, evenly and reverently, as in a sung Mass.'
      : 'Read this Scripture aloud slowly, warmly and reverently, like a lector at Mass: clear diction, natural pauses at the punctuation, no theatrics.';
    const r = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST', headers: { Authorization: 'Bearer ' + studio.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: studio.voice, input: it.text, instructions, response_format: 'mp3', speed: Math.max(0.7, Math.min(1.3, rate)) }) });
    if (!r.ok) { let msg = 'The studio voice could not be reached (' + r.status + ').'; try { const j = await r.json(); if (j.error?.message) msg = j.error.message; } catch {} throw new Error(msg); }
    const url = URL.createObjectURL(await r.blob()); audioCache.set(k, url); return url;
  })();
  pending.set(k, p); try { return await p; } finally { pending.delete(k); }
}

// items: [{ text, lang: 'en'|'la', key }] — key is reported back so the UI can highlight the verse being read
export function speak(items, title = '') {
  if (!speechSupported) return;
  stop();
  st.items = items; st.title = title; st.idx = -1; st.playing = true; st.error = '';
  st.engine = studio.on && studio.key ? 'studio' : 'browser'; emit();
  next();
}
function next() {
  if (!st.playing) return;
  st.idx += 1; if (st.idx >= st.items.length) { st.playing = false; st.idx = -1; emit(); return; }
  const it = st.items[st.idx]; emit();
  if (st.engine === 'studio') return playStudio(it);
  const u = new SpeechSynthesisUtterance(it.text.replace(/æ/g, 'ae').replace(/œ/g, 'oe'));
  const v = pickVoice(it.lang); if (v) u.voice = v; u.lang = it.lang === 'la' ? (v ? v.lang : 'it-IT') : (v ? v.lang : 'en-GB');
  u.rate = it.lang === 'la' ? Math.min(rate, 0.95) : rate;
  u.onend = () => { if (st.playing) next(); };
  u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled' && st.playing) next(); };
  speechSynthesis.speak(u);
}
async function playStudio(it) {
  const myIdx = st.idx; st.busy = true; emit();
  try {
    const url = await fetchStudio(it);
    if (!st.playing || st.idx !== myIdx) return;
    st.busy = false; emit();
    audio = new Audio(url); audio.playbackRate = 1;
    audio.onended = () => { if (st.playing && st.idx === myIdx) next(); };
    audio.onerror = () => { if (st.playing && st.idx === myIdx) next(); };
    await audio.play();
    // warm the next verse while this one plays
    const nx = st.items[myIdx + 1]; if (nx) fetchStudio(nx).catch(() => {});
  } catch (e) {
    st.busy = false; st.error = e.message || 'The studio voice failed.'; st.engine = 'browser'; emit();
    // fall back to the browser voice for the rest of the reading
    st.idx = myIdx - 1; next();
  }
}
export function pause() {
  if (!speechSupported) return;
  if (st.engine === 'studio') { if (audio && !audio.paused) { audio.pause(); st.playing = false; emit(); } return; }
  if (speechSynthesis.speaking && !speechSynthesis.paused) { speechSynthesis.pause(); st.playing = false; emit(); }
}
export function resume() {
  if (!speechSupported) return;
  if (st.engine === 'studio') { if (audio && audio.paused) { st.playing = true; audio.play(); emit(); } return; }
  if (speechSynthesis.paused) { st.playing = true; speechSynthesis.resume(); emit(); }
}
export function stop() {
  if (!speechSupported) return;
  st.playing = false; st.idx = -1; st.items = []; st.busy = false; emit();
  if (audio) { try { audio.pause(); } catch {} audio = null; }
  try { speechSynthesis.cancel(); } catch {}
}
export function skip(n = 1) {
  if (!speechSupported || !st.items.length) return;
  st.idx += n - 1; st.idx = Math.max(-1, Math.min(st.items.length - 1, st.idx)); st.playing = true;
  if (audio) { try { audio.pause(); } catch {} audio = null; }
  try { speechSynthesis.cancel(); } catch {}
  setTimeout(next, 60);
}
export function speechState() { return { ...st }; }

// A short sample so the reader can compare voices in Settings.
export function sample(lang, voiceURI) {
  const text = lang === 'la' ? 'In principio erat Verbum, et Verbum erat apud Deum, et Deus erat Verbum.' : 'In the beginning was the Word, and the Word was with God, and the Word was God.';
  if (studio.on && studio.key && !voiceURI) return speak([{ text, lang, key: 'sample' }], 'Sample');
  const before = chosen[lang]; if (voiceURI) chosen[lang] = voiceURI;
  const eng = studio.on; studio.on = false; speak([{ text, lang, key: 'sample' }], 'Sample'); studio.on = eng; chosen[lang] = before;
}
