// Builds public/data/latin.json: a gloss for every word form in the Clementine Vulgate, using
// William Whitaker's WORDS dictionary (DICTLINE.GEN + INFLECTS.LAT, released to the public domain).
// Output: { form: [[headword, pos, morph, gloss], ...] } (best 2 analyses per form).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'); const DATA = path.join(ROOT, 'public', 'data');
const CACHE = path.join(ROOT, '.cache'); fs.mkdirSync(CACHE, { recursive: true });
const OUT = path.join(DATA, 'latin.json');
const SRC = 'https://raw.githubusercontent.com/mk270/whitakers-words/master/';

async function get(name) { const fp = path.join(CACHE, name); if (!fs.existsSync(fp)) fs.writeFileSync(fp, await (await fetch(SRC + name)).text()); return fs.readFileSync(fp, 'latin1'); }

const FREQ = { A: 6, B: 5, C: 4, D: 3, E: 2, F: 1, X: 0, I: 0, M: 0, N: 0 };
const CASES = { NOM: 'nom.', GEN: 'gen.', DAT: 'dat.', ACC: 'acc.', ABL: 'abl.', VOC: 'voc.', LOC: 'loc.', X: '' };
const TENSE = { PRES: 'pres.', IMPF: 'impf.', FUT: 'fut.', PERF: 'perf.', PLUP: 'plup.', FUTP: 'fut. perf.', X: '' };
const MOOD = { IND: 'ind.', SUB: 'subj.', IMP: 'imper.', INF: 'inf.', PPL: 'part.', X: '' };
const VOICE = { ACTIVE: 'act.', PASSIVE: 'pass.', X: '' };
const NUMB = { S: 'sg.', P: 'pl.', X: '' };
const GEND = { M: 'm.', F: 'f.', N: 'n.', C: '', X: '' };
const POSN = { N: 'noun', V: 'verb', ADJ: 'adj.', ADV: 'adv.', PREP: 'prep.', CONJ: 'conj.', INTERJ: 'interj.', PRON: 'pron.', NUM: 'num.', VPAR: 'participle', SUPINE: 'supine', PACK: 'pron.' };

async function main() {
  if (fs.existsSync(OUT)) { console.log('latin: up to date'); return; }
  // ---- dictionary
  const dict = []; // {stems:[4], pos, decl, var, gen, comp, kind, freq, gloss}
  for (const line of (await get('DICTLINE.GEN')).split(/\r?\n/)) {
    if (line.length < 100) continue;
    const stems = [0, 1, 2, 3].map(i => line.slice(i * 19, i * 19 + 19).trim()).map(s => s === 'zzz' ? null : s);
    const pos = line.slice(76, 83).trim(); const f = line.slice(83, 100).trim().split(/\s+/); const flags = line.slice(100, 110).trim().split(/\s+/);
    const gloss = line.slice(110).trim().replace(/\s+/g, ' ');
    const e = { stems, pos, decl: 0, var: 0, gen: 'X', freq: FREQ[flags[3]] ?? 0, gloss };
    if (['N', 'ADJ', 'V', 'PRON', 'NUM', 'PACK', 'VPAR', 'SUPINE'].includes(pos)) { e.decl = +f[0] || 0; e.var = +f[1] || 0; }
    if (pos === 'N') e.gen = f[2] || 'X'; if (pos === 'V') e.kind = f[2] || 'X';
    if (pos === 'ADJ') e.comp = f[2] || 'X';
    dict.push(e);
  }
  dict.push({ stems: ['s', '', 'fu', 'fut'], pos: 'V', decl: 5, var: 1, gen: 'X', kind: 'TO_BE', freq: 6, gloss: 'be; exist; (also forms the perfect passive: factus est = was made);' });
  // index by (stem, pos-family)
  const byStem = new Map();
  const fam = p => (p === 'VPAR' || p === 'SUPINE') ? 'V' : p === 'PACK' ? 'PRON' : p;
  dict.forEach((e, i) => e.stems.forEach((s, k) => { if (s == null) return; const key = fam(e.pos) + '|' + (k + 1) + '|' + s.toLowerCase(); (byStem.get(key) || byStem.set(key, []).get(key)).push(i); }));
  // ---- inflections
  const infl = []; // {pos, decl, var, key, ending, morph, gen}
  for (const raw of (await get('INFLECTS.LAT')).split(/\r?\n/)) {
    const line = raw.replace(/--.*$/, '').trim(); if (!line) continue; const t = line.split(/\s+/); const pos = t[0]; if (!POSN[pos]) continue;
    t.pop(); t.pop(); // freq, age
    let ending = '', endlen = t.pop(); if (endlen !== '0') { ending = endlen; endlen = t.pop(); }
    const key = +t.pop(); const decl = +t[1] || 0, vr = +t[2] || 0; let morph = '', gen = 'X';
    if (pos === 'N' || pos === 'PRON' || pos === 'PACK') { morph = `${CASES[t[3]] || ''} ${NUMB[t[4]] || ''}`; gen = t[5] || 'X'; }
    else if (pos === 'ADJ') { morph = `${CASES[t[3]] || ''} ${NUMB[t[4]] || ''} ${GEND[t[5]] || ''} ${t[6] === 'COMP' ? 'comp.' : t[6] === 'SUPER' ? 'superl.' : ''}`; gen = t[5] || 'X'; }
    else if (pos === 'NUM') { morph = `${CASES[t[3]] || ''} ${NUMB[t[4]] || ''}`; gen = t[5] || 'X'; }
    else if (pos === 'V') { morph = `${t[6] || ''}${t[6] ? ' ' : ''}${NUMB[t[7]] || ''} ${TENSE[t[3]] || ''} ${VOICE[t[4]] || ''} ${MOOD[t[5]] || ''}`; }
    else if (pos === 'VPAR') { morph = `${TENSE[t[6]] || ''} ${VOICE[t[7]] || ''} part. ${CASES[t[3]] || ''} ${NUMB[t[4]] || ''}`; gen = t[5] || 'X'; }
    else if (pos === 'SUPINE') { morph = `supine ${CASES[t[3]] || ''}`; }
    infl.push({ pos, decl, var: vr, key, ending: ending.toLowerCase(), morph: morph.replace(/\s+/g, ' ').trim(), gen });
  }
  const byEnding = new Map(); for (const i of infl) (byEnding.get(i.ending) || byEnding.set(i.ending, []).get(i.ending)).push(i);
  const endings = [...byEnding.keys()].sort((a, b) => b.length - a.length);
  const headword = e => {
    const want = { N: i => i.pos === 'N' && i.morph.startsWith('nom. sg.'), ADJ: i => i.pos === 'ADJ' && /^nom\. sg\.( m\.)?$/.test(i.morph), V: i => i.pos === 'V' && i.morph === `1 sg. pres. ${e.kind === 'DEP' ? 'pass.' : 'act.'} ind.`, PRON: i => i.pos === 'PRON' && i.morph.startsWith('nom. sg.'), NUM: i => i.pos === 'NUM' && i.morph.startsWith('nom. sg.') }[e.pos];
    if (!want) return e.stems[0];
    const cand = infl.filter(i => want(i) && i.key === 1 && (i.decl === e.decl) && (i.var === 0 || i.var === e.var) && (i.gen === 'X' || i.gen === 'C' || e.gen === 'X' || e.gen === 'C' || i.gen === e.gen));
    if (!cand.length && (e.pos === 'PRON' || e.pos === 'PACK')) { const c2 = infl.filter(i => i.pos === 'PRON' && i.morph.startsWith('nom. pl.') && i.key === 1 && i.decl === e.decl && (i.var === 0 || i.var === e.var)); if (c2.length) return e.stems[0] + c2[0].ending; }
    if (!cand.length) return e.stems[0];
    cand.sort((a, b) => ((b.gen === e.gen) - (a.gen === e.gen)) || ((b.var === e.var) - (a.var === e.var)));
    return e.stems[0] + cand[0].ending;
  };
  const hw = new Map(); const head = e => { if (!hw.has(e)) hw.set(e, headword(e)); return hw.get(e); };
  const analyse = w => {
    const res = [];
    for (const end of endings) {
      if (!w.endsWith(end) || w.length - end.length < 0) continue; const stem = w.slice(0, w.length - end.length);
      for (const i of byEnding.get(end)) {
        const ids = byStem.get(fam(i.pos) + '|' + i.key + '|' + stem); if (!ids) continue;
        for (const id of ids) {
          const e = dict[id];
          if (e.pos === 'V' ? !['V', 'VPAR', 'SUPINE'].includes(i.pos) : e.pos === 'PACK' ? i.pos !== 'PRON' && i.pos !== 'PACK' : e.pos !== i.pos) continue;
          if (i.decl && e.decl && i.decl !== e.decl) continue; if (i.var && e.var && i.var !== e.var) continue;
          if (i.pos === 'N' && i.gen !== 'X' && i.gen !== 'C' && e.gen !== 'X' && e.gen !== 'C' && i.gen !== e.gen) continue;
          res.push({ e, i, score: e.freq * 10 + end.length });
        }
      }
    }
    res.sort((a, b) => b.score - a.score);
    const out = [], seen = new Set();
    for (const r of res) { const h = head(r.e); if (seen.has(h)) continue; seen.add(h); out.push([h, POSN[r.e.pos] || r.e.pos, r.i.morph, r.e.gloss.slice(0, 90)]); if (out.length === 2) break; }
    return out;
  };
  // ---- Vulgate vocabulary
  const vocab = new Map();
  for (const f of fs.readdirSync(path.join(DATA, 'text', 'vul'))) for (const ch of JSON.parse(fs.readFileSync(path.join(DATA, 'text', 'vul', f), 'utf8'))) for (const v of ch)
    for (const w of v.toLowerCase().replace(/æ/g, 'ae').replace(/œ/g, 'oe').match(/[a-z]+/g) || []) vocab.set(w, (vocab.get(w) || 0) + 1);
  const out = {}; let hit = 0, tokens = 0, hitTok = 0;
  const variants = w => { const s = new Set([w]); s.add(w.replace(/j/g, 'i')); s.add(w.replace(/v/g, 'u')); s.add(w.replace(/j/g, 'i').replace(/v/g, 'u')); s.add(w.replace(/^i(?=[aeiou])/, 'j')); s.add(w.replace(/^u(?=[aeiou])/, 'v')); return [...s]; };
  for (const [w, n] of vocab) {
    tokens += n; let r = [];
    for (const v of variants(w)) { r = analyse(v); if (r.length) break; }
    if (!r.length) for (const enc of ['que', 'ne', 've']) if (w.endsWith(enc) && w.length > enc.length + 2) { for (const v of variants(w.slice(0, -enc.length))) { r = analyse(v); if (r.length) break; } if (r.length) { r = r.map(x => [x[0], x[1], x[2] + ` + -${enc}`, x[3]]); break; } }
    if (r.length) { out[w] = r; hit++; hitTok += n; }
  }
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`latin: ${hit}/${vocab.size} forms (${(100 * hitTok / tokens).toFixed(1)}% of tokens), ${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB`);
}
main().catch(e => { console.error(e); process.exit(1); });
