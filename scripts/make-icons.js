// Renders the PNG app icons from icon.svg at build time (skipped if already present or sharp is unavailable).
const fs = require('fs'), path = require('path');
const pub = path.join(__dirname, '..', 'public');
(async () => {
  try {
    const sharp = require('sharp');
    for (const sz of [192, 512]) {
      const out = path.join(pub, `icon-${sz}.png`); if (fs.existsSync(out)) continue;
      await sharp(path.join(pub, 'icon.svg')).resize(sz, sz).png().toFile(out); console.log('icon', sz);
    }
  } catch (e) { console.log('icons skipped:', e.message); }
})();
