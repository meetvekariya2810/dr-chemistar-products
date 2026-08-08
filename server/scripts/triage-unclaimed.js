/**
 * Triage which source files still need a human/visual identification.
 *
 * OCR resolves the plain-font composition line well but mangles stylised brand
 * lettering, so it confidently accounts for only part of the source set. This
 * script separates the files OCR has already tied to a product that HAS artwork
 * (nothing more to do) from the files that remain unaccounted for - those are
 * the ones worth looking at directly, and they are where the missing 30 live.
 *
 * Usage: node server/scripts/triage-unclaimed.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const CACHE_PATH = path.join(__dirname, '../scratch/ocr-cache.json');
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

const norm = s => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
const onDisk = new Set(
  fs.readdirSync(UPLOADS_DIR)
    .filter(f => f.toLowerCase().endsWith('.webp'))
    .map(f => path.basename(f, path.extname(f)))
);

const indexed = products.map(p => ({
  p,
  normName: norm(p.name),
  normCommon: norm(p.commonName)
}));

const claimed = [];
const unclaimed = [];

for (const [key, rec] of Object.entries(cache)) {
  const text = norm(rec.text);

  // Longest exact brand-name hit wins, so FIRING beats FIRE.
  let best = null;
  for (const e of indexed) {
    if (e.normName.length >= 4 && text.includes(e.normName)) {
      if (!best || e.normName.length > best.normName.length) best = e;
    }
  }
  // Fall back to an exact composition hit when the brand was unreadable.
  if (!best) {
    for (const e of indexed) {
      if (e.normCommon.length >= 10 && text.includes(e.normCommon)) {
        if (!best || e.normCommon.length > best.normCommon.length) best = e;
      }
    }
  }

  if (best && onDisk.has(best.p.id)) {
    claimed.push({ key, id: best.p.id, name: best.p.name });
  } else {
    unclaimed.push({ key, guess: best ? best.p.name : null });
  }
}

console.log(`Source files      : ${Object.keys(cache).length}`);
console.log(`Tied to a product that already has artwork: ${claimed.length}`);
console.log(`NEEDS VISUAL ID   : ${unclaimed.length}\n`);

unclaimed.forEach((u, i) => {
  const short = u.key.replace('WhatsApp Image 2026-08-06 at ', '');
  console.log(`${String(i + 1).padStart(2)}. ${short}${u.guess ? `   [ocr hint: ${u.guess}]` : ''}`);
});

fs.writeFileSync(
  path.join(__dirname, '../scratch/unclaimed-files.json'),
  JSON.stringify(unclaimed.map(u => path.join(ROOT, 'DrChemistar product image.jpg', u.key)), null, 2),
  'utf8'
);
console.log('\nPaths written to server/scratch/unclaimed-files.json');
