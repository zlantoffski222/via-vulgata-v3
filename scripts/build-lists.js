// Merges scripts/lists/*.json into public/data/lists.json, checking every reference.
const fs = require('fs'), path = require('path');
const pub = path.join(__dirname, '..', 'public', 'data');
const books = JSON.parse(fs.readFileSync(path.join(pub, 'books.json'), 'utf8')); const byId = Object.fromEntries(books.map(b => [b.id, b]));
const check = (r, where) => { const [b, c, v1, v2] = r; const bk = byId[b]; if (!bk) throw new Error(where + ': unknown book ' + b); if (c < 1 || c > bk.chapters.length) throw new Error(where + ': ' + b + ' ' + c + ' out of range'); const n = bk.chapters[c - 1]; if (v1 > n) throw new Error(where + ': ' + b + ' ' + c + ':' + v1 + ' beyond ' + n); if ((v2 || v1) > n) { console.log('  clamped', where, b, c + ':' + v1 + '-' + v2, '->', n); r[3] = n; } };
const dir = path.join(__dirname, 'lists'); const out = [];
for (const f of ['parables.json', 'miracles.json', 'lists.json']) { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); for (const L of Array.isArray(j) ? j : [j]) { for (const r of L.refs || []) check(r, L.id); for (const it of L.items) { for (const r of it.refs || []) check(r, L.id + '/' + it.n); if (it.ref) check(it.ref, L.id + '/' + it.n); } out.push(L); } }
fs.writeFileSync(path.join(pub, 'lists.json'), JSON.stringify(out));
console.log('lists:', out.map(l => l.id + ' ' + l.items.length).join(', '));
