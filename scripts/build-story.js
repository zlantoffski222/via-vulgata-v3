// Merges scripts/story/p*.json into public/data/story.json and checks every reference against the data.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'); const pub = path.join(root, 'public', 'data');
const books = JSON.parse(fs.readFileSync(path.join(pub, 'books.json'), 'utf8')); const byId = Object.fromEntries(books.map(b => [b.id, b]));
const tl = JSON.parse(fs.readFileSync(path.join(pub, 'timeline.json'), 'utf8'));
const PEOPLE = JSON.parse(fs.readFileSync(path.join(pub, 'people.json'), 'utf8')).people; const people = new Set(PEOPLE.map(p => p.id)); const peopleArt = new Set(PEOPLE.map(p => p.wp));
const diagrams = fs.readFileSync(path.join(root, 'src', 'diagrams.jsx'), 'utf8').match(/id: '([a-z]+)'/g).map(m => m.slice(5, -1));
const events = Object.fromEntries(tl.events.map(e => [e.id, e]));
const parts = fs.readdirSync(path.join(__dirname, 'story')).filter(f => /^p\d+\.json$/.test(f)).sort().map(f => JSON.parse(fs.readFileSync(path.join(__dirname, 'story', f), 'utf8')));
const errors = []; const ids = new Set(); const out = []; let n = 0;
parts.forEach((part, pi) => {
  for (const s of part.stops) {
    n++;
    if (ids.has(s.id)) errors.push(`${s.id}: duplicate id`); ids.add(s.id);
    for (const f of ['t', 'd', 'before', 'watch', 'after']) if (!s[f]) errors.push(`${s.id}: missing ${f}`);
    for (const k of s.loc || []) if (!tl.locs[k]) errors.push(`${s.id}: unknown place ${k}`);
    if (s.art && !tl.artFiles[s.art] && !peopleArt.has(s.art)) errors.push(`${s.id}: art not bundled: ${s.art}`);
    if (s.ev != null && !events[s.ev]) errors.push(`${s.id}: unknown event ${s.ev}`);
    if (s.dg && !diagrams.includes(s.dg)) errors.push(`${s.id}: unknown diagram ${s.dg}`);
    for (const p of s.who || []) if (!people.has(p)) errors.push(`${s.id}: unknown person ${p}`);
    for (const [b, c1, c2] of [...(s.r || []), ...(s.also || [])]) { const bk = byId[b]; if (!bk) { errors.push(`${s.id}: unknown book ${b}`); continue; } if (c1 < 1 || c2 > bk.chapters.length || c1 > c2) errors.push(`${s.id}: ${b} ${c1}-${c2} out of range (${bk.chapters.length} chapters)`); }
    if (!s.r || !s.r.length) errors.push(`${s.id}: no reading`);
    out.push({ n, part: pi, ...s });
  }
});
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const chapters = new Set(); for (const s of out) for (const [b, c1, c2] of s.r) for (let c = c1; c <= c2; c++) chapters.add(b + ':' + c);
const total = books.reduce((a, b) => a + b.chapters.length, 0);
fs.writeFileSync(path.join(pub, 'story.json'), JSON.stringify({ parts: parts.map(p => ({ t: p.part, sub: p.sub })), stops: out }));
console.log(`story: ${out.length} stops in ${parts.length} parts · ${chapters.size} chapters on the main path of ${total}`);
