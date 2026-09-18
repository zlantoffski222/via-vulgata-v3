// A Latin course from the Vulgate itself: the most frequent words, grouped by lemma, each with its forms,
// its gloss from Whitaker's WORDS, and a short verse that uses it (with the Douay beside it).
const fs = require('fs'), path = require('path');
const pub = path.join(__dirname, '..', 'public', 'data');
const dict = JSON.parse(fs.readFileSync(path.join(pub, 'latin.json'), 'utf8'));
const books = JSON.parse(fs.readFileSync(path.join(pub, 'books.json'), 'utf8'));
const norm = w => w.toLowerCase().replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/[^a-z]/g, '');
const freq = new Map(); const examples = new Map(); // form -> [b,c,v,la,en] shortest verse
const SKIP_POS = new Set(['name']);
// Whitaker's WORDS mis-parses a few very common short forms (as 'maxi'); these are set by hand
const FIX = { ut: ['ut', 'conj.', '', 'that, so that; in order that; as, when; how'], a: ['a', 'prep.', '', 'from, away from; by (agent)'], ab: ['a', 'prep.', '', 'from, away from; by (agent)'], es: ['sum', 'verb', '2 sg. pres. act. ind.', 'be; exist'], os: ['os', 'noun', 'nom. sg.', 'mouth; face; bone'], eis: ['is', 'pron.', 'dat./abl. pl.', 'he/she/it/they; that'], ei: ['is', 'pron.', 'dat. sg.', 'he/she/it/they; that'], o: ['o', 'interj.', '', 'O! (address)'], ne: ['ne', 'conj.', '', 'lest, that not; (with imperative) do not'], vos: ['tu', 'pron.', 'nom./acc. pl.', 'you (pl.)'], nos: ['ego', 'pron.', 'nom./acc. pl.', 'we, us'], te: ['tu', 'pron.', 'acc./abl. sg.', 'you (sing.)'], me: ['ego', 'pron.', 'acc./abl. sg.', 'I, me'], se: ['sui', 'pron.', 'acc./abl.', 'himself, herself, itself, themselves'], mihi: ['ego', 'pron.', 'dat. sg.', 'I, me'], tibi: ['tu', 'pron.', 'dat. sg.', 'you (sing.)'], sibi: ['sui', 'pron.', 'dat.', 'himself, herself, themselves'], nobis: ['ego', 'pron.', 'dat./abl. pl.', 'we, us'], vobis: ['tu', 'pron.', 'dat./abl. pl.', 'you (pl.)'] };
const BAD_LEMMA = new Set(['maxi', 'maxu']);
for (const bk of books) {
  const la = JSON.parse(fs.readFileSync(path.join(pub, 'text', 'vul', bk.id + '.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(pub, 'text', 'drc', bk.id + '.json'), 'utf8'));
  la.forEach((ch, ci) => ch.forEach((verse, vi) => {
    const words = verse.split(/\s+/).map(norm).filter(Boolean); const seen = new Set();
    for (const w of words) { freq.set(w, (freq.get(w) || 0) + 1); if (seen.has(w)) continue; seen.add(w); const ex = examples.get(w); const len = verse.length; if ((!ex || len < ex.len) && len >= 30 && len <= 140) examples.set(w, { b: bk.id, c: ci + 1, v: vi + 1, la: verse, en: en[ci]?.[vi] || '', len }); }
  }));
}
// group forms by lemma using the first (most likely) analysis
const byLemma = new Map();
for (const [form, n] of freq) {
  let es = dict[form]; if (FIX[form]) es = [FIX[form]]; if (!es || !es.length) continue; let [lemma, pos, morph, gloss] = es[0];
  if (BAD_LEMMA.has(lemma)) { const alt = es.find(e => !BAD_LEMMA.has(e[0])); if (!alt) continue; [lemma, pos, morph, gloss] = alt; }
  if (SKIP_POS.has(pos) || (/^[A-Z]/.test(lemma) && lemma !== 'Deus' && lemma !== 'Dominus')) continue;
  const g = byLemma.get(lemma) || { lemma, pos, gloss: gloss.replace(/;\s*$/, ''), n: 0, forms: [] }; g.n += n; g.forms.push([form, n, morph]); byLemma.set(lemma, g);
}
const top = [...byLemma.values()].sort((a, b) => b.n - a.n).slice(0, 240);
const words = top.map(g => { g.forms.sort((a, b) => b[1] - a[1]); const ex = g.forms.map(f => examples.get(f[0])).filter(Boolean).sort((a, b) => a.len - b.len)[0]; return { l: g.lemma, pos: g.pos, g: g.gloss.split(';').slice(0, 3).join(';'), n: g.n, forms: g.forms.slice(0, 5).map(f => [f[0], f[2]]), ex: ex ? [ex.b, ex.c, ex.v, ex.la, ex.en, g.forms.find(f => ex.la.toLowerCase().replace(/æ/g, 'ae').includes(f[0]))?.[0] || g.forms[0][0]] : null }; }).filter(w => w.ex);
const LESSON = 12; const lessons = [];
for (let i = 0; i < words.length && lessons.length < 20; i += LESSON) lessons.push({ n: lessons.length + 1, t: lessons.length === 0 ? 'The words you cannot read a verse without' : `Words ${i + 1}–${i + LESSON}`, words: words.slice(i, i + LESSON) });
const total = [...freq.values()].reduce((a, b) => a + b, 0); const covered = words.slice(0, lessons.length * LESSON).reduce((a, w) => a + w.n, 0);
fs.writeFileSync(path.join(pub, 'latin-course.json'), JSON.stringify({ intro: `The ${lessons.length * LESSON} most frequent words of the Vulgate cover ${Math.round(100 * covered / total)}% of every verse you will ever read in it.`, lessons }));
console.log('latin course:', lessons.length, 'lessons,', words.length, 'words,', Math.round(100 * covered / total) + '% coverage');
