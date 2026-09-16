// Reassembles public/data/timeline.json from split parts (used when the repo ships the data in chunks).
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'public', 'data');
const parts = fs.readdirSync(dir).filter(f => /^timeline\.part\d+\.txt$/.test(f)).sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0]);
if (parts.length) { fs.writeFileSync(path.join(dir, 'timeline.json'), parts.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('')); parts.forEach(f => fs.unlinkSync(path.join(dir, f))); console.log('timeline assembled from', parts.length, 'parts'); }
