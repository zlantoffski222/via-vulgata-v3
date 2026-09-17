// Builds a single self-contained HTML file (all code, texts and art embedded) from dist/.
// Output: dist-single/via-vulgata.html — for previews and artifacts; the PWA build stays in dist/.
// Bible texts are embedded gzip-compressed (base64) and inflated in the browser on demand.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.join(__dirname, '..'); const dist = path.join(root, 'dist'); const pub = path.join(root, 'public');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const js = html.match(/<script type="module"[^>]*src="([^"]+)"/)[1]; const css = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/)[1];
const data = {}, zipped = {};
const add = (key, file) => { zipped[key] = zlib.gzipSync(fs.readFileSync(file), { level: 9 }).toString('base64'); };
for (const f of ['books.json', 'books_context.json', 'plan_chrono.json', 'notes_nt.json', 'notes_ot.json', 'versions.json', 'people.json', 'journeys.json', 'harmony.json', 'prophecy.json', 'lectionary.json', 'saints.json', 'prayers.json']) add('/data/' + f, path.join(pub, 'data', f));
const tl = JSON.parse(fs.readFileSync(path.join(pub, 'data', 'timeline.json'), 'utf8'));
const PREVIEW = !!process.env.PREVIEW; // a lighter build that fits the artifact size limit: fewer versions, smaller pictures
const artDir = PREVIEW && fs.existsSync(path.join(root, 'raw', 'art-small')) ? path.join(root, 'raw', 'art-small') : null;
for (const [wp, url] of Object.entries(tl.artFiles)) { let fp = path.join(pub, url); if (artDir && fs.existsSync(path.join(artDir, path.basename(url)))) fp = path.join(artDir, path.basename(url)); if (!fs.existsSync(fp)) continue; const ext = path.extname(fp).slice(1); tl.artFiles[wp] = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,` + fs.readFileSync(fp).toString('base64'); }
data['/data/timeline.json'] = tl;
const KEEP = PREVIEW ? ['vul', 'drc', 'cpdv', 'grc'] : null;
for (const tr of fs.readdirSync(path.join(pub, 'data', 'text'))) for (const f of fs.readdirSync(path.join(pub, 'data', 'text', tr))) {
  if (KEEP && !KEEP.includes(tr)) continue;
  zipped[`/data/text/${tr}/${f}`] = zlib.gzipSync(fs.readFileSync(path.join(pub, 'data', 'text', tr, f)), { level: 9 }).toString('base64');
}
{ // Strong's: the dictionary and the concordance index
  zipped['/data/strongs.json'] = zlib.gzipSync(fs.readFileSync(path.join(pub, 'data', 'strongs.json')), { level: 9 }).toString('base64');
  for (const f of fs.readdirSync(path.join(pub, 'data', 'strongs'))) zipped[`/data/strongs/${f}`] = zlib.gzipSync(fs.readFileSync(path.join(pub, 'data', 'strongs', f)), { level: 9 }).toString('base64'); }
if (PREVIEW) { const v = JSON.parse(fs.readFileSync(path.join(pub, 'data', 'versions.json'), 'utf8')); v.versions = v.versions.filter(x => KEEP.includes(x.id)); zipped['/data/versions.json'] = zlib.gzipSync(JSON.stringify(v), { level: 9 }).toString('base64'); }
for (const kind of ['xref', 'speakers']) for (const f of fs.readdirSync(path.join(pub, 'data', kind))) zipped[`/data/${kind}/${f}`] = zlib.gzipSync(fs.readFileSync(path.join(pub, 'data', kind, f)), { level: 9 }).toString('base64');
{ // the dictionary is slimmed for the single-file build (one analysis per form, short glosses) to stay under the artifact size limit
  const full = JSON.parse(fs.readFileSync(path.join(pub, 'data', 'latin.json'), 'utf8')); const slim = {};
  for (const [w, es] of Object.entries(full)) slim[w] = es.slice(0, process.env.SLIM ? 1 : 2).map(e => [e[0], e[1], e[2], e[3].split(';').slice(0, 3).join(';').slice(0, 70)]);
  zipped['/data/latin.json'] = zlib.gzipSync(JSON.stringify(slim), { level: 9 }).toString('base64'); }
const json = JSON.stringify(data).replace(/<\//g, '<\\/');
const out = `<title>Christ is King</title>
<style>${fs.readFileSync(path.join(dist, css), 'utf8')}</style>
<div id="root"></div>
<script>window.__VV__=${json};window.__VVZ__=${JSON.stringify(zipped)};</script>
<script type="module">${fs.readFileSync(path.join(dist, js), 'utf8')}</script>
`;
fs.mkdirSync(path.join(root, 'dist-single'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist-single', PREVIEW ? 'christ-is-king-preview.html' : 'christ-is-king.html'), out);
console.log('single file:', (out.length / 1e6).toFixed(1), 'MB');
