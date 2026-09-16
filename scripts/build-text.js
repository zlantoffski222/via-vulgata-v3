// Builds public/data/books.json and per-book verse files for the Clementine Vulgate (vul)
// and the Douay-Rheims Challoner (drc). Sources: scrollmapper/bible_databases (MIT; texts public domain).
// Downloads the two source files on first run and caches them in scripts/.cache.
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'public', 'data');
const CACHE = path.join(__dirname, '.cache');
const SRC = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/';

// [id, source name, Latin title, English title, abbr, testament, group]
const BOOKS = [
['GEN','Genesis','Genesis','Genesis','Gen','OT','Pentateuch'],
['EXO','Exodus','Exodus','Exodus','Ex','OT','Pentateuch'],
['LEV','Leviticus','Leviticus','Leviticus','Lev','OT','Pentateuch'],
['NUM','Numbers','Numeri','Numbers','Num','OT','Pentateuch'],
['DEU','Deuteronomy','Deuteronomium','Deuteronomy','Deut','OT','Pentateuch'],
['JOS','Joshua','Josue','Joshua','Josh','OT','Historical Books'],
['JDG','Judges','Judicum','Judges','Judg','OT','Historical Books'],
['RUT','Ruth','Ruth','Ruth','Ruth','OT','Historical Books'],
['1SA','I Samuel','Regum I','1 Samuel (1 Kings)','1 Sam','OT','Historical Books'],
['2SA','II Samuel','Regum II','2 Samuel (2 Kings)','2 Sam','OT','Historical Books'],
['1KI','I Kings','Regum III','1 Kings (3 Kings)','1 Kgs','OT','Historical Books'],
['2KI','II Kings','Regum IV','2 Kings (4 Kings)','2 Kgs','OT','Historical Books'],
['1CH','I Chronicles','Paralipomenon I','1 Chronicles','1 Chr','OT','Historical Books'],
['2CH','II Chronicles','Paralipomenon II','2 Chronicles','2 Chr','OT','Historical Books'],
['EZR','Ezra','Esdræ','Ezra (1 Esdras)','Ezra','OT','Historical Books'],
['NEH','Nehemiah','Nehemiæ','Nehemiah (2 Esdras)','Neh','OT','Historical Books'],
['TOB','Tobit','Tobiæ','Tobit','Tob','OT','Historical Books'],
['JDT','Judith','Judith','Judith','Jdt','OT','Historical Books'],
['EST','Esther','Esther','Esther','Esth','OT','Historical Books'],
['JOB','Job','Job','Job','Job','OT','Wisdom Books'],
['PSA','Psalms','Psalmi','Psalms','Ps','OT','Wisdom Books'],
['PRO','Proverbs','Proverbia','Proverbs','Prov','OT','Wisdom Books'],
['ECC','Ecclesiastes','Ecclesiastes','Ecclesiastes','Eccl','OT','Wisdom Books'],
['SNG','Song of Solomon','Canticum Canticorum','Song of Songs','Song','OT','Wisdom Books'],
['WIS','Wisdom','Sapientia','Wisdom','Wis','OT','Wisdom Books'],
['SIR','Sirach','Ecclesiasticus','Sirach (Ecclesiasticus)','Sir','OT','Wisdom Books'],
['ISA','Isaiah','Isaias','Isaiah','Isa','OT','Prophets'],
['JER','Jeremiah','Jeremias','Jeremiah','Jer','OT','Prophets'],
['LAM','Lamentations','Lamentationes','Lamentations','Lam','OT','Prophets'],
['BAR','Baruch','Baruch','Baruch','Bar','OT','Prophets'],
['EZK','Ezekiel','Ezechiel','Ezekiel','Ezek','OT','Prophets'],
['DAN','Daniel','Daniel','Daniel','Dan','OT','Prophets'],
['HOS','Hosea','Osee','Hosea','Hos','OT','Prophets'],
['JOL','Joel','Joël','Joel','Joel','OT','Prophets'],
['AMO','Amos','Amos','Amos','Amos','OT','Prophets'],
['OBA','Obadiah','Abdias','Obadiah','Obad','OT','Prophets'],
['JON','Jonah','Jonas','Jonah','Jon','OT','Prophets'],
['MIC','Micah','Michæa','Micah','Mic','OT','Prophets'],
['NAM','Nahum','Nahum','Nahum','Nah','OT','Prophets'],
['HAB','Habakkuk','Habacuc','Habakkuk','Hab','OT','Prophets'],
['ZEP','Zephaniah','Sophonias','Zephaniah','Zeph','OT','Prophets'],
['HAG','Haggai','Aggæus','Haggai','Hag','OT','Prophets'],
['ZEC','Zechariah','Zacharias','Zechariah','Zech','OT','Prophets'],
['MAL','Malachi','Malachias','Malachi','Mal','OT','Prophets'],
['1MA','I Maccabees','Machabæorum I','1 Maccabees','1 Macc','OT','Historical Books'],
['2MA','II Maccabees','Machabæorum II','2 Maccabees','2 Macc','OT','Historical Books'],
['MAT','Matthew','Matthæus','Matthew','Matt','NT','Gospels'],
['MRK','Mark','Marcus','Mark','Mark','NT','Gospels'],
['LUK','Luke','Lucas','Luke','Luke','NT','Gospels'],
['JHN','John','Joannes','John','John','NT','Gospels'],
['ACT','Acts','Actus Apostolorum','Acts of the Apostles','Acts','NT','Acts'],
['ROM','Romans','Ad Romanos','Romans','Rom','NT','Pauline Letters'],
['1CO','I Corinthians','Ad Corinthios I','1 Corinthians','1 Cor','NT','Pauline Letters'],
['2CO','II Corinthians','Ad Corinthios II','2 Corinthians','2 Cor','NT','Pauline Letters'],
['GAL','Galatians','Ad Galatas','Galatians','Gal','NT','Pauline Letters'],
['EPH','Ephesians','Ad Ephesios','Ephesians','Eph','NT','Pauline Letters'],
['PHP','Philippians','Ad Philippenses','Philippians','Phil','NT','Pauline Letters'],
['COL','Colossians','Ad Colossenses','Colossians','Col','NT','Pauline Letters'],
['1TH','I Thessalonians','Ad Thessalonicenses I','1 Thessalonians','1 Thess','NT','Pauline Letters'],
['2TH','II Thessalonians','Ad Thessalonicenses II','2 Thessalonians','2 Thess','NT','Pauline Letters'],
['1TI','I Timothy','Ad Timotheum I','1 Timothy','1 Tim','NT','Pauline Letters'],
['2TI','II Timothy','Ad Timotheum II','2 Timothy','2 Tim','NT','Pauline Letters'],
['TIT','Titus','Ad Titum','Titus','Titus','NT','Pauline Letters'],
['PHM','Philemon','Ad Philemonem','Philemon','Phlm','NT','Pauline Letters'],
['HEB','Hebrews','Ad Hebræos','Hebrews','Heb','NT','Pauline Letters'],
['JAS','James','Jacobi','James','Jas','NT','Catholic Letters'],
['1PE','I Peter','Petri I','1 Peter','1 Pet','NT','Catholic Letters'],
['2PE','II Peter','Petri II','2 Peter','2 Pet','NT','Catholic Letters'],
['1JN','I John','Joannis I','1 John','1 John','NT','Catholic Letters'],
['2JN','II John','Joannis II','2 John','2 John','NT','Catholic Letters'],
['3JN','III John','Joannis III','3 John','3 John','NT','Catholic Letters'],
['JUD','Jude','Judæ','Jude','Jude','NT','Catholic Letters'],
['REV','Revelation of John','Apocalypsis','Apocalypse (Revelation)','Rev','NT','Apocalypse'],
];

async function get(name) {
  fs.mkdirSync(CACHE, { recursive: true });
  const c = path.join(CACHE, name);
  if (!fs.existsSync(c)) {
    console.log('downloading', name);
    const r = await fetch(SRC + name);
    if (!r.ok) throw new Error('download failed: ' + name + ' ' + r.status);
    fs.writeFileSync(c, await r.text());
  }
  return JSON.parse(fs.readFileSync(c, 'utf8'));
}
function toArr(b) {
  return b.chapters.map(c => { const mx = Math.max(...c.verses.map(v => v.verse)); const a = new Array(mx).fill(''); for (const v of c.verses) a[v.verse - 1] = v.text.trim(); return a; });
}
async function main() {
  const done = path.join(OUT, 'books.json');
  if (fs.existsSync(done) && fs.existsSync(path.join(OUT, 'text', 'drc', 'REV.json'))) { console.log('bible text already built'); return; }
  const drc = await get('DRC.json'), vul = await get('VulgClementine.json');
  const dmap = Object.fromEntries(drc.books.map(b => [b.name, b])), vmap = Object.fromEntries(vul.books.map(b => [b.name, b]));
  fs.mkdirSync(path.join(OUT, 'text', 'drc'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'text', 'vul'), { recursive: true });
  const index = []; let totalV = 0;
  BOOKS.forEach((B, i) => {
    const [id, dn, lat, en, ab, test, grp] = B; const d = dmap[dn], v = vmap[dn];
    if (!d || !v) throw new Error('missing book ' + dn);
    const da = toArr(d), va = toArr(v);
    const counts = da.map((c, ci) => Math.max(c.length, va[ci] ? va[ci].length : 0));
    fs.writeFileSync(path.join(OUT, 'text', 'drc', id + '.json'), JSON.stringify(da));
    fs.writeFileSync(path.join(OUT, 'text', 'vul', id + '.json'), JSON.stringify(va));
    const nv = counts.reduce((a, b) => a + b, 0); totalV += nv;
    index.push({ id, order: i, latin: lat, name: en, abbr: ab, testament: test, group: grp, chapters: counts, verses: nv });
  });
  fs.writeFileSync(done, JSON.stringify(index));
  console.log('books', index.length, 'verses', totalV);
}
main().catch(e => { console.error(e); process.exit(1); });
