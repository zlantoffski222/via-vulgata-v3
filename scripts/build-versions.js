// Aligns extra English versions (KJV with Apocrypha, World English Bible, JPS 1917 Tanakh) to the
// Vulgate's chapter-and-verse grid, so the reader can swap the English column without losing its place.
// For each Vulgate book, the version's verses are aligned by a monotonic dynamic-programming match on
// word overlap; slots record the version's own reference where it differs, and low-overlap verses are
// flagged so the reader can say "this reads differently here".
// Output: public/data/text/<ver>/<BOOK>.json = { v: [[slot,...],...], r: {"c:v":"KJV 23:1"}, d: ["c:v",...], m: ["c:v",...], j: ["c:v",...] }
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'); const OUT = path.join(ROOT, 'public', 'data'); const CACHE = path.join(__dirname, '.cache');
const SM = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/';
const books = JSON.parse(fs.readFileSync(path.join(OUT, 'books.json'), 'utf8'));

async function getJSON(name) { fs.mkdirSync(CACHE, { recursive: true }); const c = path.join(CACHE, name + '.json'); if (!fs.existsSync(c)) { console.log('downloading', name); const r = await fetch(SM + name + '.json'); if (!r.ok) throw new Error(name + ' ' + r.status); fs.writeFileSync(c, await r.text()); } return JSON.parse(fs.readFileSync(c, 'utf8')); }
async function getWEB() { const c = path.join(CACHE, 'eng-web.usfx.xml'); if (!fs.existsSync(c)) { console.log('downloading WEB'); const r = await fetch('https://raw.githubusercontent.com/seven1m/open-bibles/master/eng-web.usfx.xml'); fs.writeFileSync(c, await r.text()); } return fs.readFileSync(c, 'utf8'); }

// ---- sources → { bookKey: [ {c, v, t} ... ] } ----
function fromScrollmapper(j) { const out = {}; for (const b of j.books) { const seq = []; for (const ch of b.chapters) for (const v of ch.verses) { const t = clean(v.text); if (t) seq.push({ c: ch.chapter, v: v.verse, t }); } out[b.name] = seq; } return out; }
function fromUSFX(xml) {
  const out = {};
  for (const bm of xml.matchAll(/<book id="([A-Z0-9]+)">([\s\S]*?)<\/book>/g)) {
    const id = bm[1]; let body = bm[2];
    body = body.replace(/<f\b[^>]*>[\s\S]*?<\/f>/g, '').replace(/<x\b[^>]*>[\s\S]*?<\/x>/g, '');
    const seq = []; let c = 0; const re = /<c id="(\d+)"\s*\/>|<v id="([^"]+)"[^>]*\/>([\s\S]*?)(?=<ve\s*\/>|<c id=|<\/book>)/g; let m;
    while ((m = re.exec(body))) { if (m[1]) c = +m[1]; else { const v = parseInt(m[2]); if (!c || isNaN(v)) continue; seq.push({ c, v, t: clean(m[3].replace(/<[^>]+>/g, ' ')) }); } }
    out[id] = seq;
  }
  return out;
}
function clean(s) { s = s.replace(/\s+([.,;:!?»)\]])/g, '$1').replace(/([(«¿¡])\s+/g, '$1'); return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/\s+/g, ' ').trim(); }

// ---- similarity ----
const STOP = new Set('the and of to a in that for is he his was with as they i you your my me shall be not it him them will on this all have but from by which their there who said unto thou thy thee ye are were her she at so we us or an if into one out no up its had has been do did were what when then also upon over came come go went made make let saith say says like more very own than because how why yea even therefore now these those thus hath hast doth dost art wilt shalt cannot may might should would could each every any some such things thing man men lord god yahweh jehovah'.split(' '));
function bag(s) { const out = new Set(); for (let w of (s.toLowerCase().replace(/[’']s\b/g, '').match(/[a-z]+/g) || [])) { if (w.length < 3 || STOP.has(w)) continue; w = w.replace(/(eth|est|ing|ed|es|s)$/, ''); if (w.length >= 3) out.add(w); } return out; }
function sim(A, B) { if (!A.size || !B.size) return 0; let n = 0; for (const w of A) if (B.has(w)) n++; return n / Math.sqrt(A.size * B.size); }
function union(A, B) { const s = new Set(A); for (const w of B) s.add(w); return s; }

// ---- monotonic alignment: A = Vulgate/Douay verses, B = version verses ----
function align(A, B) {
  const n = A.length, m = B.length; if (!m) return A.map(() => null);
  const a = A.map(x => bag(x.t)), b = B.map(x => bag(x.t));
  const band = Math.max(60, Math.ceil(Math.max(n, m) * 0.12)); const GAP = -0.06;
  const NEG = -1e9; const S = new Float64Array((n + 1) * (m + 1)).fill(NEG); const P = new Int8Array((n + 1) * (m + 1));
  const ix = (i, j) => i * (m + 1) + j;
  S[0] = 0;
  for (let i = 0; i <= n; i++) {
    const jc = Math.round(i * m / n); const j0 = Math.max(0, jc - band), j1 = Math.min(m, jc + band);
    for (let j = j0; j <= j1; j++) {
      if (i === 0 && j === 0) continue;
      let best = NEG, op = 0;
      if (i > 0 && S[ix(i - 1, j)] > NEG) { const v = S[ix(i - 1, j)] + GAP; if (v > best) { best = v; op = 1; } }               // skip A verse (missing)
      if (j > 0 && S[ix(i, j - 1)] > NEG) { const v = S[ix(i, j - 1)] + GAP; if (v > best) { best = v; op = 2; } }               // skip B verse
      if (i > 0 && j > 0 && S[ix(i - 1, j - 1)] > NEG) { const v = S[ix(i - 1, j - 1)] + sim(a[i - 1], b[j - 1]); if (v > best) { best = v; op = 3; } } // 1:1
      if (i > 0 && j > 1 && S[ix(i - 1, j - 2)] > NEG) { const v = S[ix(i - 1, j - 2)] + sim(a[i - 1], union(b[j - 2], b[j - 1])) - 0.02; if (v > best) { best = v; op = 4; } } // 1:2
      if (i > 1 && j > 0 && S[ix(i - 2, j)] > NEG) { const v = S[ix(i - 2, j)] + sim(union(a[i - 2], a[i - 1]), b[j - 1]) - 0.02; if (v > best) { best = v; op = 5; } } // 2:1
      S[ix(i, j)] = best; P[ix(i, j)] = op;
    }
  }
  const res = A.map(() => null); let i = n, j = m;
  while (i > 0 || j > 0) {
    const op = P[ix(i, j)];
    if (op === 1 || (op === 0 && i > 0 && j === 0)) { i--; }
    else if (op === 2 || (op === 0 && j > 0 && i === 0)) { j--; }
    else if (op === 3) { res[i - 1] = { bs: [j - 1], s: sim(a[i - 1], b[j - 1]) }; i--; j--; }
    else if (op === 4) { res[i - 1] = { bs: [j - 2, j - 1], s: sim(a[i - 1], union(b[j - 2], b[j - 1])) }; i--; j -= 2; }
    else if (op === 5) { const s = sim(union(a[i - 2], a[i - 1]), b[j - 1]); res[i - 2] = { bs: [j - 1], s }; res[i - 1] = { joined: true, s }; i -= 2; j--; }
    else break;
  }
  return res;
}

// ---- which source books feed each Vulgate book, per version ----
function seqFor(ver, src, id) {
  const pick = (...names) => names.flatMap(nm => src[nm] || []);
  if (ver === 'kjv') {
    const N = { GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy', JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': 'I Samuel', '2SA': 'II Samuel', '1KI': 'I Kings', '2KI': 'II Kings', '1CH': 'I Chronicles', '2CH': 'II Chronicles', EZR: 'Ezra', NEH: 'Nehemiah', TOB: 'Tobit', JDT: 'Judith', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs', ECC: 'Ecclesiastes', SNG: 'Song of Solomon', WIS: 'Wisdom', SIR: 'Sirach', ISA: 'Isaiah', JER: 'Jeremiah', LAM: 'Lamentations', BAR: 'Baruch', EZK: 'Ezekiel', HOS: 'Hosea', JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi', '1MA': 'I Maccabees', '2MA': 'II Maccabees', MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts', ROM: 'Romans', '1CO': 'I Corinthians', '2CO': 'II Corinthians', GAL: 'Galatians', EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians', '1TH': 'I Thessalonians', '2TH': 'II Thessalonians', '1TI': 'I Timothy', '2TI': 'II Timothy', TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews', JAS: 'James', '1PE': 'I Peter', '2PE': 'II Peter', '1JN': 'I John', '2JN': 'II John', '3JN': 'III John', JUD: 'Jude', REV: 'Revelation of John' };
    if (id === 'EST') return pick('Esther', 'Additions to Esther');
    if (id === 'DAN') { const d = src['Daniel'] || []; const k = d.findIndex(x => x.c === 3 && x.v === 24); return [...d.slice(0, k), ...pick('Prayer of Azariah'), ...d.slice(k), ...pick('Susanna'), ...pick('Bel and the Dragon')]; }
    return pick(N[id]);
  }
  if (ver === 'web') {
    if (id === 'DAN') { const d = src['DAN'] || []; const k = d.findIndex(x => x.c === 3 && x.v === 24); return [...d.slice(0, k), ...pick('S3Y'), ...d.slice(k), ...pick('SUS'), ...pick('BEL')]; }
    if (id === 'BAR') return pick('BAR', 'LJE');
    if (id === 'EST') return pick('EST');
    return pick(id);
  }
  if (ver === 'jps') {
    const N = { GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy', JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': 'I Samuel', '2SA': 'II Samuel', '1KI': 'I Kings', '2KI': 'II Kings', '1CH': 'I Chronicles', '2CH': 'II Chronicles', EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs', ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah', JER: 'Jeremiah', LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea', JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi' };
    return N[id] ? pick(N[id]) : [];
  }
}
const LABEL = { kjv: 'KJV', web: 'WEB', jps: 'JPS' };
const DIFF = 0.22;

async function main() {
  if (fs.existsSync(path.join(OUT, 'versions.json')) && fs.existsSync(path.join(OUT, 'text', 'jps', 'MAL.json'))) { console.log('versions already built'); return; }
  const sources = { kjv: fromScrollmapper(await getJSON('KJVA')), jps: fromScrollmapper(await getJSON('JPS')), web: fromUSFX(await getWEB()) };
  const summary = {};
  for (const ver of ['kjv', 'web', 'jps']) {
    fs.mkdirSync(path.join(OUT, 'text', ver), { recursive: true });
    const have = []; let flagged = 0, missing = 0, total = 0;
    for (const bk of books) {
      const drc = JSON.parse(fs.readFileSync(path.join(OUT, 'text', 'drc', bk.id + '.json'), 'utf8'));
      const A = []; drc.forEach((ch, ci) => ch.forEach((t, vi) => A.push({ c: ci + 1, v: vi + 1, t })));
      const B = seqFor(ver, sources[ver], bk.id);
      if (!B.length) continue;
      have.push(bk.id);
      const res = align(A, B);
      const chapters = drc.map(ch => ch.map(() => '')); const refs = {}; const d = [], m = [], j = [];
      res.forEach((r, k) => {
        const { c, v } = A[k]; total++;
        if (!r || !r.bs || !r.bs.map(b => B[b].t).join('').trim()) { if (!r || !r.joined) { m.push(c + ':' + v); missing++; } else j.push(c + ':' + v); return; }
        if (r.joined) { j.push(c + ':' + v); return; }
        chapters[c - 1][v - 1] = r.bs.map(b => B[b].t).join(' ');
        const b0 = B[r.bs[0]]; if (b0.c !== c || b0.v !== v) refs[c + ':' + v] = LABEL[ver] + ' ' + b0.c + ':' + b0.v + (r.bs.length > 1 ? '–' + B[r.bs[r.bs.length - 1]].v : '');
        if (r.s < DIFF && A[k].t.length > 25) { d.push(c + ':' + v); flagged++; }
      });
      fs.writeFileSync(path.join(OUT, 'text', ver, bk.id + '.json'), JSON.stringify({ v: chapters, r: refs, d, m, j }));
    }
    summary[ver] = { books: have, flagged, missing, total };
    console.log(ver, 'books', have.length, 'verses', total, 'flagged', flagged, 'missing', missing);
  }
  fs.writeFileSync(path.join(OUT, 'versions.json'), JSON.stringify({
    versions: [
      { id: 'drc', label: 'Douay-Rheims', long: 'Douay-Rheims, Challoner revision (1749–52)', tradition: 'Catholic', blurb: 'The English of the Vulgate itself: translated from Jerome’s Latin, so it follows the Vulgate verse for verse.', books: books.map(b => b.id) },
      { id: 'kjv', label: 'King James', long: 'King James Version (1611; 1769 text) with Apocrypha', tradition: 'Protestant / Anglican', blurb: 'The Bible of the English-speaking Reformation, translated from Hebrew and Greek. Its 1611 edition included the deuterocanonical books as “Apocrypha”.', books: summary.kjv.books },
      { id: 'web', label: 'World English', long: 'World English Bible (2000–2020)', tradition: 'Modern ecumenical', blurb: 'A modern, plain-English translation from the Hebrew and Greek, in the public domain, with the deuterocanon.', books: summary.web.books },
      { id: 'jps', label: 'JPS Tanakh', long: 'Jewish Publication Society Tanakh (1917)', tradition: 'Jewish', blurb: 'The Hebrew Bible as Jewish scholars rendered it, from the Masoretic text — the reading Jesus’ own people give the Old Testament. Old Testament only; writes the divine name as “G-d”.', books: summary.jps.books },
    ],
  }));
}
module.exports = { fromScrollmapper, fromUSFX, align, DIFF, clean };
if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
