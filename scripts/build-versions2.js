// V3 versions: Berean Standard Bible (bsb), Catholic Public Domain Version (cpdv), Reina-Valera 1909 (rv1909),
// the Greek New Testament (grc — SBLGNT via MorphGNT) and the Hebrew Old Testament (heb — Westminster Leningrad
// Codex via OpenScriptures morphhb), all laid on the Vulgate grid. English versions are aligned by the same
// word-overlap DP as build-versions.js; Spanish, Greek and Hebrew are placed through the KJV / JPS grids already
// computed (they share the Protestant / Hebrew numbering). Greek and Hebrew verses are stored as tokens with
// Strong's numbers; a Strong's dictionary and a concordance index are written alongside.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'); const OUT = path.join(ROOT, 'public', 'data'); const CACHE = path.join(__dirname, '.cache');
const SM = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/';
const books = JSON.parse(fs.readFileSync(path.join(OUT, 'books.json'), 'utf8'));
const V1 = require('./build-versions-lib.js');

async function getText(name, url) { fs.mkdirSync(CACHE, { recursive: true }); const c = path.join(CACHE, name); if (!fs.existsSync(c)) { console.log('downloading', name); const r = await fetch(url); if (!r.ok) throw new Error(name + ' ' + r.status); fs.writeFileSync(c, await r.text()); } return fs.readFileSync(c, 'utf8'); }
const getJSON = async name => JSON.parse(await getText(name + '.json', SM + name + '.json'));

const KJVNAMES = { GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy', JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': 'I Samuel', '2SA': 'II Samuel', '1KI': 'I Kings', '2KI': 'II Kings', '1CH': 'I Chronicles', '2CH': 'II Chronicles', EZR: 'Ezra', NEH: 'Nehemiah', TOB: 'Tobit', JDT: 'Judith', EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs', ECC: 'Ecclesiastes', SNG: 'Song of Solomon', WIS: 'Wisdom', SIR: 'Sirach', ISA: 'Isaiah', JER: 'Jeremiah', LAM: 'Lamentations', BAR: 'Baruch', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea', JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi', '1MA': 'I Maccabees', '2MA': 'II Maccabees', MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts', ROM: 'Romans', '1CO': 'I Corinthians', '2CO': 'II Corinthians', GAL: 'Galatians', EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians', '1TH': 'I Thessalonians', '2TH': 'II Thessalonians', '1TI': 'I Timothy', '2TI': 'II Timothy', TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews', JAS: 'James', '1PE': 'I Peter', '2PE': 'II Peter', '1JN': 'I John', '2JN': 'II John', '3JN': 'III John', JUD: 'Jude', REV: 'Revelation of John' };
const NT = ['MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'];
const MORPHGNT = { MAT: '61-Mt', MRK: '62-Mk', LUK: '63-Lk', JHN: '64-Jn', ACT: '65-Ac', ROM: '66-Ro', '1CO': '67-1Co', '2CO': '68-2Co', GAL: '69-Ga', EPH: '70-Eph', PHP: '71-Php', COL: '72-Col', '1TH': '73-1Th', '2TH': '74-2Th', '1TI': '75-1Ti', '2TI': '76-2Ti', TIT: '77-Tit', PHM: '78-Phm', HEB: '79-Heb', JAS: '80-Jas', '1PE': '81-1Pe', '2PE': '82-2Pe', '1JN': '83-1Jn', '2JN': '84-2Jn', '3JN': '85-3Jn', JUD: '86-Jud', REV: '87-Re' };
const MORPHHB = { GEN: 'Gen', EXO: 'Exod', LEV: 'Lev', NUM: 'Num', DEU: 'Deut', JOS: 'Josh', JDG: 'Judg', RUT: 'Ruth', '1SA': '1Sam', '2SA': '2Sam', '1KI': '1Kgs', '2KI': '2Kgs', '1CH': '1Chr', '2CH': '2Chr', EZR: 'Ezra', NEH: 'Neh', EST: 'Esth', JOB: 'Job', PSA: 'Ps', PRO: 'Prov', ECC: 'Eccl', SNG: 'Song', ISA: 'Isa', JER: 'Jer', LAM: 'Lam', EZK: 'Ezek', DAN: 'Dan', HOS: 'Hos', JOL: 'Joel', AMO: 'Amos', OBA: 'Obad', JON: 'Jonah', MIC: 'Mic', NAM: 'Nah', HAB: 'Hab', ZEP: 'Zeph', HAG: 'Hag', ZEC: 'Zech', MAL: 'Mal' };

// place a { "c:v": text } map of a KJV/JPS-numbered source onto the Vulgate grid using an existing grid file's labels
function placeByGrid(bk, gridVer, label, src /* Map "c:v" -> value */, join /* (values)=>value */) {
  const grid = JSON.parse(fs.readFileSync(path.join(OUT, 'text', gridVer, bk.id + '.json'), 'utf8'));
  const chapters = grid.v.map(ch => ch.map(() => null)); const refs = {}; const m = [], j = [...grid.j];
  const jset = new Set(grid.j), mset = new Set(grid.m);
  grid.v.forEach((ch, ci) => ch.forEach((_, vi) => {
    const key = (ci + 1) + ':' + (vi + 1); if (jset.has(key)) return;
    let c = ci + 1, v1 = vi + 1, v2 = vi + 1; const lab = grid.r[key];
    if (lab) { const mm = lab.match(/(\d+):(\d+)(?:[-–](\d+))?/); if (mm) { c = +mm[1]; v1 = +mm[2]; v2 = mm[3] ? +mm[3] : v1; } }
    const vals = []; for (let v = v1; v <= v2; v++) { const x = src.get(c + ':' + v); if (x) vals.push(x); }
    if (!vals.length || mset.has(key)) { m.push(key); return; }
    chapters[ci][vi] = vals.length === 1 ? vals[0] : join(vals);
    if (c !== ci + 1 || v1 !== vi + 1) refs[key] = label + ' ' + c + ':' + v1 + (v2 !== v1 ? '–' + v2 : '');
  }));
  return { v: chapters, r: refs, d: [], m, j };
}
const strip = s => s.normalize('NFD').replace(/[̀-ͯ͂̓̈́ͅ]/g, '').toLowerCase();

async function main() {
  const done = ['bsb', 'cpdv', 'rv1909', 'grc', 'heb', 'lxx'].every(v => fs.existsSync(path.join(OUT, 'text', v))) && fs.existsSync(path.join(OUT, 'strongs.json'));
  if (done) { console.log('versions v3 already built'); return; }
  const versions = JSON.parse(fs.readFileSync(path.join(OUT, 'versions.json'), 'utf8')).versions.filter(v => !['bsb', 'cpdv', 'rv1909', 'grc', 'heb', 'lxx'].includes(v.id));
  // ---------- English: BSB, CPDV (DP alignment against the Douay) ----------
  for (const [ver, name, label] of [['bsb', 'BSB', 'BSB'], ['cpdv', 'CPDV', 'CPDV']]) {
    const src = V1.fromScrollmapper(await getJSON(name)); fs.mkdirSync(path.join(OUT, 'text', ver), { recursive: true });
    const have = []; let flagged = 0, missing = 0, total = 0;
    for (const bk of books) {
      const drc = JSON.parse(fs.readFileSync(path.join(OUT, 'text', 'drc', bk.id + '.json'), 'utf8'));
      const A = []; drc.forEach((ch, ci) => ch.forEach((t, vi) => A.push({ c: ci + 1, v: vi + 1, t })));
      let B = src[KJVNAMES[bk.id]] || [];
      if (ver === 'bsb' && bk.id === 'DAN') B = B; // BSB has no additions; alignment leaves them missing
      if (!B.length) continue; have.push(bk.id);
      const res = V1.align(A, B);
      const chapters = drc.map(ch => ch.map(() => '')); const refs = {}; const d = [], m = [], j = [];
      res.forEach((r, k) => {
        const { c, v } = A[k]; total++;
        if (!r || !r.bs || !r.bs.map(b => B[b].t).join('').trim()) { if (!r || !r.joined) { m.push(c + ':' + v); missing++; } else j.push(c + ':' + v); return; }
        if (r.joined) { j.push(c + ':' + v); return; }
        chapters[c - 1][v - 1] = r.bs.map(b => B[b].t).join(' ');
        const b0 = B[r.bs[0]]; if (b0.c !== c || b0.v !== v) refs[c + ':' + v] = label + ' ' + b0.c + ':' + b0.v + (r.bs.length > 1 ? '–' + B[r.bs[r.bs.length - 1]].v : '');
        if (r.s < V1.DIFF && A[k].t.length > 25) { d.push(c + ':' + v); flagged++; }
      });
      fs.writeFileSync(path.join(OUT, 'text', ver, bk.id + '.json'), JSON.stringify({ v: chapters, r: refs, d, m, j }));
    }
    console.log(ver, 'books', have.length, 'verses', total, 'flagged', flagged, 'missing', missing);
    versions.push(ver === 'bsb'
      ? { id: 'bsb', label: 'Berean', long: 'Berean Standard Bible (2023)', tradition: 'Modern evangelical', blurb: 'A fresh, readable modern-English translation from the Hebrew and Greek, released into the public domain in 2023 — the closest free equivalent to the ESV or NIV. Protestant canon (66 books).', books: have }
      : { id: 'cpdv', label: 'Catholic PDV', long: 'Catholic Public Domain Version (2009)', tradition: 'Catholic', blurb: 'A modern-English translation of the Latin Vulgate itself by Ronald Conte — the Douay-Rheims brought into today’s language, with all 73 books.', books: have });
  }
  // ---------- Brenton's Septuagint (eng-lxx2012, ebible.org) — DP alignment against the Douay; Jeremiah chapter-matched ----------
  {
    const zipPath = path.join(__dirname, '..', 'raw', 'lxx', 'eng-lxx2012_usfx.xml');
    const xml = fs.existsSync(zipPath) ? fs.readFileSync(zipPath, 'utf8') : await getText('eng-lxx2012_usfx.xml', 'https://ebible.org/Scriptures/eng-lxx2012_usfx.xml');
    const src = V1.fromUSFX(xml.replace(/⌃/g, '')); fs.mkdirSync(path.join(OUT, 'text', 'lxx'), { recursive: true });
    const renum = (seq, c, v0 = 0, labfn = null) => seq.map((x, i) => ({ c, v: v0 + i + 1, t: x.t, lab: labfn ? labfn(x, v0 + i + 1) : c + ':' + (v0 + i + 1) }));
    // Daniel: Song of the Three inside ch. 3, Susanna = 13, Bel = 14 (as the Vulgate); Baruch: the Letter of Jeremiah = ch. 6
    if (src.DAN && src.S3Y && src.SUS && src.BEL) { const D = src.DAN; const d3 = D.filter(x => x.c === 3); src.DAN = [...D.filter(x => x.c < 3), ...d3.slice(0, 23), ...renum(src.S3Y, 3, 23), ...renum(d3.slice(23), 3, 90, (x) => '3:' + x.v), ...D.filter(x => x.c > 3), ...renum(src.SUS, 13, 0, (x, v) => 'Sus ' + v), ...renum(src.BEL, 14, 0, (x, v) => 'Bel ' + v)]; }
    if (src.BAR && src.LJE) src.BAR = [...src.BAR, ...renum(src.LJE, 6, 0, (x, v) => 'EpJer ' + v)];
    const have = []; let flagged = 0, missing = 0, total = 0;
    const bagOf = t => new Set(t.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length > 3));
    const jac = (a, b) => { let n = 0; for (const w of a) if (b.has(w)) n++; return n / (a.size + b.size - n || 1); };
    for (const bk of books) {
      if (bk.testament !== 'OT') continue; const B0 = src[bk.id]; if (!B0 || !B0.length) continue;
      const drc = JSON.parse(fs.readFileSync(path.join(OUT, 'text', 'drc', bk.id + '.json'), 'utf8'));
      const chapters = drc.map(ch => ch.map(() => '')); const refs = {}; const d = [], m = [], j = [];
      const emit = (A, B, res) => res.forEach((r, k) => {
        const { c, v } = A[k]; total++;
        if (!r || !r.bs || !r.bs.map(b => B[b].t).join('').trim()) { if (!r || !r.joined) { m.push(c + ':' + v); missing++; } else j.push(c + ':' + v); return; }
        if (r.joined) { j.push(c + ':' + v); return; }
        chapters[c - 1][v - 1] = r.bs.map(b => B[b].t).join(' ');
        const b0 = B[r.bs[0]]; const lab0 = b0.lab || (b0.c + ':' + b0.v); if (lab0 !== c + ':' + v) refs[c + ':' + v] = 'LXX ' + lab0 + (r.bs.length > 1 ? '–' + (B[r.bs[r.bs.length - 1]].lab || B[r.bs[r.bs.length - 1]].v).toString().replace(/^.*:/, '') : '');
        if (r.s < V1.DIFF && A[k].t.length > 25) { d.push(c + ':' + v); flagged++; }
      });
      if (bk.id === 'JER') {
        // the Greek Jeremiah orders the oracles differently: match each Vulgate chapter to its nearest Greek chapter, then align the verses
        const bch = {}; for (const x of B0) (bch[x.c] ||= []).push(x); const bbag = Object.fromEntries(Object.entries(bch).map(([c, xs]) => [c, bagOf(xs.map(x => x.t).join(' '))]));
        drc.forEach((ch, ci) => {
          const A = ch.map((t, vi) => ({ c: ci + 1, v: vi + 1, t })); const abag = bagOf(ch.join(' '));
          const scored = Object.entries(bbag).map(([c, bag]) => [+c, jac(abag, bag)]).sort((x, y) => y[1] - x[1]);
          if (!scored.length || scored[0][1] < 0.08) { A.forEach(a => { m.push(a.c + ':' + a.v); missing++; total++; }); return; }
          const use = scored.filter((x, i) => i === 0 || (i === 1 && x[1] >= 0.35 * scored[0][1])).map(x => x[0]).sort((x, y) => x - y);
          const B = use.flatMap(c => bch[c]); emit(A, B, V1.align(A, B));
        });
      } else {
        const A = []; drc.forEach((ch, ci) => ch.forEach((t, vi) => A.push({ c: ci + 1, v: vi + 1, t })));
        emit(A, B0, V1.align(A, B0));
      }
      have.push(bk.id);
      fs.writeFileSync(path.join(OUT, 'text', 'lxx', bk.id + '.json'), JSON.stringify({ v: chapters, r: refs, d, m, j }));
    }
    console.log('lxx books', have.length, 'verses', total, 'flagged', flagged, 'missing', missing);
    versions.push({ id: 'lxx', label: 'Septuagint', long: "Brenton's Septuagint (1851, ebible.org 2012 edition)", tradition: 'Greek Old Testament in English', blurb: "The Old Testament as the apostles quoted it — Sir Lancelot Brenton's English of the Greek Septuagint, with the Psalms in their Greek numbering, the Song of the Three, Susanna and Bel in Daniel, and the Letter of Jeremiah in Baruch. Old Testament only.", books: have });
  }
  // ---------- Spanish: Reina-Valera 1909 via the KJV grid ----------
  {
    const xml = await getText('spa-rv1909.usfx.xml', 'https://raw.githubusercontent.com/seven1m/open-bibles/master/spa-rv1909.usfx.xml');
    const src = V1.fromUSFX(xml); fs.mkdirSync(path.join(OUT, 'text', 'rv1909'), { recursive: true }); const have = [];
    for (const bk of books) {
      const seq = src[bk.id]; if (!seq || !seq.length || !fs.existsSync(path.join(OUT, 'text', 'kjv', bk.id + '.json'))) continue;
      const map = new Map(seq.map(x => [x.c + ':' + x.v, x.t]));
      const out = placeByGrid(bk, 'kjv', 'RV', map, vals => vals.join(' '));
      if (bk.id === 'DAN' || bk.id === 'EST') { /* additions absent in RV1909: already marked missing by the grid */ }
      fs.writeFileSync(path.join(OUT, 'text', 'rv1909', bk.id + '.json'), JSON.stringify(out)); have.push(bk.id);
    }
    console.log('rv1909 books', have.length);
    versions.push({ id: 'rv1909', label: 'Reina-Valera', long: 'Reina-Valera 1909 (Spanish)', tradition: 'Español · Protestant', blurb: 'La Biblia en español — the classic Spanish Bible of Casiodoro de Reina and Cipriano de Valera in its 1909 revision, public domain. Protestant canon.', books: have, lang: 'es' });
  }
  // ---------- Strong's dictionary ----------
  const strongs = {};
  for (const [lang, url] of [['H', 'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js'], ['G', 'https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js']]) {
    const js = await getText('strongs-' + lang + '.js', url);
    const start = js.indexOf('{'); const body = js.slice(start, js.lastIndexOf('}') + 1);
    const dict = JSON.parse(body);
    for (const [k, e] of Object.entries(dict)) strongs[k] = [e.lemma || '', e.xlit || e.translit || '', (e.strongs_def || '').replace(/\s+/g, ' ').trim().slice(0, 260), (e.kjv_def || '').replace(/\s+/g, ' ').trim().slice(0, 160), (e.derivation || '').replace(/\s+/g, ' ').trim().slice(0, 120)];
  }
  const greekByLemma = new Map();
  for (const [k, e] of Object.entries(strongs)) if (k[0] === 'G' && e[0]) { const key = strip(e[0]); if (!greekByLemma.has(key)) greekByLemma.set(key, k); }
  const conc = {}; const addOcc = (num, b, c, v) => { (conc[num] ||= []).push([b, c, v]); };
  // ---------- Greek NT (MorphGNT / SBLGNT) via the KJV grid ----------
  {
    fs.mkdirSync(path.join(OUT, 'text', 'grc'), { recursive: true }); let unmapped = 0, tokens = 0;
    for (const id of NT) {
      const txt = await getText('morphgnt-' + id + '.txt', `https://raw.githubusercontent.com/morphgnt/sblgnt/master/${MORPHGNT[id]}-morphgnt.txt`);
      const verses = new Map();
      for (const line of txt.split('\n')) { const p = line.trim().split(' '); if (p.length < 7) continue; const c = +p[0].slice(2, 4), v = +p[0].slice(4, 6); const lemma = p[6]; const num = greekByLemma.get(strip(lemma)) || ''; if (!num) unmapped++; tokens++; const key = c + ':' + v; if (!verses.has(key)) verses.set(key, []); verses.get(key).push(num ? [p[3], num] : [p[3]]); }
      const out = placeByGrid({ id }, 'kjv', 'SBLGNT', verses, vals => vals.flat());
      out.v.forEach((ch, ci) => ch.forEach((toks, vi) => { if (toks) for (const t of toks) if (t[1]) addOcc(t[1], id, ci + 1, vi + 1); }));
      fs.writeFileSync(path.join(OUT, 'text', 'grc', id + '.json'), JSON.stringify(out));
    }
    console.log('grc: tokens', tokens, 'without Strong\'s', unmapped);
    versions.push({ id: 'grc', label: 'Greek NT', long: 'Greek New Testament (SBLGNT, 2010)', tradition: 'Original language', blurb: 'The New Testament in its own Greek — the SBL Greek New Testament edited by Michael Holmes — with Strong’s numbers on every word. Tap a word for its meaning and every other place it appears.', books: NT, lang: 'grc' });
  }
  // ---------- Hebrew OT (morphhb / WLC) via the JPS grid ----------
  {
    fs.mkdirSync(path.join(OUT, 'text', 'heb'), { recursive: true }); let tokens = 0; const have = [];
    for (const [id, file] of Object.entries(MORPHHB)) {
      if (!fs.existsSync(path.join(OUT, 'text', 'jps', id + '.json'))) continue;
      const xml = await getText('morphhb-' + file + '.xml', `https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc/${file}.xml`);
      const verses = new Map();
      for (const vm of xml.matchAll(/<verse osisID="[^"]*\.(\d+)\.(\d+)"[^>]*>([\s\S]*?)<\/verse>/g)) {
        const key = (+vm[1]) + ':' + (+vm[2]); const toks = [];
        for (const wm of vm[3].matchAll(/<w lemma="([^"]*)"[^>]*>([^<]*)<\/w>|<seg type="([^"]*)">([^<]*)<\/seg>/g)) {
          if (wm[3]) { if (/x-sof-pasuq|x-maqqef|x-paseq/.test(wm[3]) && toks.length) toks[toks.length - 1][0] += wm[4]; continue; }
          const word = wm[2].replace(/\//g, ''); const lem = wm[1].split('/').pop().match(/\d+/); const num = lem ? 'H' + lem[0] : '';
          tokens++; toks.push(num ? [word, num] : [word]);
        }
        verses.set(key, toks);
      }
      const out = placeByGrid({ id }, 'jps', 'WLC', verses, vals => vals.flat());
      out.v.forEach((ch, ci) => ch.forEach((toks, vi) => { if (toks) for (const t of toks) if (t[1]) addOcc(t[1], id, ci + 1, vi + 1); }));
      fs.writeFileSync(path.join(OUT, 'text', 'heb', id + '.json'), JSON.stringify(out)); have.push(id);
    }
    console.log('heb: books', have.length, 'tokens', tokens);
    versions.push({ id: 'heb', label: 'Hebrew OT', long: 'Hebrew Bible (Westminster Leningrad Codex)', tradition: 'Original language', blurb: 'The Old Testament in Hebrew, from the Leningrad Codex (AD 1008), the oldest complete manuscript of the Hebrew Bible, with Strong’s numbers on every word. Hebrew numbering, laid on the Vulgate grid.', books: have, lang: 'he' });
  }
  // ---------- dictionary + concordance index ----------
  for (const k in strongs) strongs[k].push((conc[k] || []).length);
  fs.writeFileSync(path.join(OUT, 'strongs.json'), JSON.stringify(strongs));
  const idxDir = path.join(OUT, 'strongs'); fs.mkdirSync(idxDir, { recursive: true }); const groups = {};
  for (const [k, list] of Object.entries(conc)) { const g = k[0] + Math.floor(+k.slice(1) / 100); (groups[g] ||= {})[k] = list; }
  for (const [g, obj] of Object.entries(groups)) fs.writeFileSync(path.join(idxDir, g + '.json'), JSON.stringify(obj));
  console.log('strongs entries', Object.keys(strongs).length, 'index groups', Object.keys(groups).length);
  fs.writeFileSync(path.join(OUT, 'versions.json'), JSON.stringify({ versions }));
}
main().catch(e => { console.error(e); process.exit(1); });
