// Builds per-book cross-reference files from the OpenBible.info cross-reference set
// (CC-BY, via scrollmapper/bible_databases). References are given in KJV numbering, so they
// are re-mapped onto the Vulgate verse grid using the alignment labels in text/kjv/*.json.
// Output: public/data/xref/BOOK.json = { "c:v": [[book, chapter, v1, v2, votes], ...] } (top few per verse).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'); const DATA = path.join(ROOT, 'public', 'data');
const CACHE = path.join(ROOT, '.cache'); fs.mkdirSync(CACHE, { recursive: true });
const SRC = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/sources/extras/cross_references.txt';
const OUT = path.join(DATA, 'xref'); const PER_VERSE = 5;

const OSIS = { Gen: 'GEN', Exod: 'EXO', Lev: 'LEV', Num: 'NUM', Deut: 'DEU', Josh: 'JOS', Judg: 'JDG', Ruth: 'RUT', '1Sam': '1SA', '2Sam': '2SA', '1Kgs': '1KI', '2Kgs': '2KI', '1Chr': '1CH', '2Chr': '2CH', Ezra: 'EZR', Neh: 'NEH', Esth: 'EST', Job: 'JOB', Ps: 'PSA', Prov: 'PRO', Eccl: 'ECC', Song: 'SNG', Isa: 'ISA', Jer: 'JER', Lam: 'LAM', Ezek: 'EZK', Dan: 'DAN', Hos: 'HOS', Joel: 'JOL', Amos: 'AMO', Obad: 'OBA', Jonah: 'JON', Mic: 'MIC', Nah: 'NAM', Hab: 'HAB', Zeph: 'ZEP', Hag: 'HAG', Zech: 'ZEC', Mal: 'MAL', Matt: 'MAT', Mark: 'MRK', Luke: 'LUK', John: 'JHN', Acts: 'ACT', Rom: 'ROM', '1Cor': '1CO', '2Cor': '2CO', Gal: 'GAL', Eph: 'EPH', Phil: 'PHP', Col: 'COL', '1Thess': '1TH', '2Thess': '2TH', '1Tim': '1TI', '2Tim': '2TI', Titus: 'TIT', Phlm: 'PHM', Heb: 'HEB', Jas: 'JAS', '1Pet': '1PE', '2Pet': '2PE', '1John': '1JN', '2John': '2JN', '3John': '3JN', Jude: 'JUD', Rev: 'REV' };

async function main() {
  if (fs.existsSync(path.join(OUT, 'REV.json')) && fs.existsSync(path.join(OUT, 'GEN.json'))) { console.log('xrefs: up to date'); return; }
  const cache = path.join(CACHE, 'cross_references.txt');
  if (!fs.existsSync(cache)) { console.log('downloading cross references…'); fs.writeFileSync(cache, await (await fetch(SRC)).text()); }
  // inverse alignment maps: KJV "c:v" -> Vulgate "c:v", per book
  const inv = {};
  for (const id of Object.values(OSIS)) {
    const fp = path.join(DATA, 'text', 'kjv', id + '.json'); if (!fs.existsSync(fp)) continue;
    const k = JSON.parse(fs.readFileSync(fp, 'utf8')); const m = {};
    for (const [slot, label] of Object.entries(k.r || {})) {
      const mm = label.match(/(\d+):(\d+)(?:[-–](\d+))?/); if (!mm) continue;
      const c = +mm[1], a = +mm[2], z = mm[3] ? +mm[3] : a; for (let v = a; v <= z; v++) m[c + ':' + v] ||= slot;
    }
    inv[id] = m;
  }
  const chapters = {}; for (const id of Object.values(OSIS)) { const fp = path.join(DATA, 'text', 'vul', id + '.json'); if (fs.existsSync(fp)) chapters[id] = JSON.parse(fs.readFileSync(fp, 'utf8')).map(c => c.length); }
  const toSlot = (id, c, v) => { const s = (inv[id] && inv[id][c + ':' + v]) || (c + ':' + v); const [cc, vv] = s.split(':').map(Number); if (!chapters[id] || cc > chapters[id].length || vv > chapters[id][cc - 1]) return null; return [cc, vv]; };
  const parse = ref => { const m = ref.match(/^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/); if (!m || !OSIS[m[1]]) return null; return { b: OSIS[m[1]], c: +m[2], v: +m[3] }; };
  const out = {}; let n = 0;
  for (const line of fs.readFileSync(cache, 'utf8').split('\n').slice(1)) {
    const [from, to, votes] = line.trim().split('\t'); if (!from || !to || +votes < 1) continue;
    const f = parse(from); if (!f) continue;
    const [t1, t2] = to.split('-'); const a = parse(t1), z = t2 ? parse(t2) : a; if (!a || !z) continue;
    const fs_ = toSlot(f.b, f.c, f.v), as = toSlot(a.b, a.c, a.v), zs = toSlot(z.b, z.c, z.v); if (!fs_ || !as || !zs) continue;
    if (as[0] !== zs[0]) zs[1] = chapters[z.b][as[0] - 1]; // keep ranges within one chapter
    const key = fs_[0] + ':' + fs_[1]; ((out[f.b] ||= {})[key] ||= []).push([a.b, as[0], as[1], Math.max(as[1], zs[1]), +votes]); n++;
  }
  fs.mkdirSync(OUT, { recursive: true });
  for (const b in out) {
    for (const k in out[b]) {
      const seen = new Set();
      out[b][k] = out[b][k].sort((x, y) => y[4] - x[4]).filter(r => { const s = r[0] + r[1] + ':' + r[2]; if (seen.has(s) || (r[0] === b && r[1] === +k.split(':')[0] && Math.abs(r[2] - +k.split(':')[1]) <= 1)) return false; seen.add(s); return true; }).slice(0, PER_VERSE).map(r => r.slice(0, 4));
      if (!out[b][k].length) delete out[b][k];
    }
    fs.writeFileSync(path.join(OUT, b + '.json'), JSON.stringify(out[b]));
  }
  console.log('xrefs:', n, 'links across', Object.keys(out).length, 'books');
}
main().catch(e => { console.error(e); process.exit(1); });
