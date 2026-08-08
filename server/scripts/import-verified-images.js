/**
 * Import the source artwork for products that had none.
 *
 * Every mapping below was established by reading the packaging directly rather
 * than by trusting OCR: Tesseract mangles the stylised brand lettering on this
 * artwork (it reduced "Kalwar-40" to "utraz h"), so each file was inspected and
 * matched on brand AND printed composition together.
 *
 * Safety: a product that already has artwork is never overwritten - such a
 * mapping is reported as DUPLICATE_CANDIDATE and skipped.
 *
 * Usage:
 *   node server/scripts/import-verified-images.js            # dry run
 *   node server/scripts/import-verified-images.js --apply    # write files
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '../..');
const SOURCE_DIR = path.join(ROOT, 'DrChemistar product image.jpg');
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const THUMBS_DIR = path.join(UPLOADS_DIR, 'thumbnails');
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');

const APPLY = process.argv.includes('--apply');
const F = n => `WhatsApp Image 2026-08-06 at ${n}.jpeg`;

// productId -> [source file, evidence read off the packaging]
const VERIFIED = [
  ['kalwar-40',          F('4.53.08 PM (6)'),  'Kalwar-40 / Paclobutrazol 40% SC / Plant Growth Regulator'],
  ['hexon-plus',         F('4.53.08 PM'),      'Hexon Plus / Hexaconazole 5% SC / Systemic Fungicide'],
  ['nutriva-35050',      F('4.53.09 PM (12)'), 'NUTRIVA 3.50.50'],
  ['penil-extra',        F('4.53.09 PM (15)'), 'Penil Extra / Pendimethalin 38.7% CS / Herbicide'],
  ['primium',            F('4.53.09 PM (19)'), 'Primium / Azadirachtin 0.15% EC (1500 ppm) / Insecticide'],
  ['dr-rapido',          F('4.53.09 PM (22)'), 'RAPIDO / Protein Hydrolysates 25% (Plant Source) Liquid'],
  ['tagar-super',        F('4.53.09 PM (34)'), 'Tagar Super / Quizalofop Ethyl 5% EC / Herbicide'],
  ['dr-ujjas-32',        F('4.53.09 PM (41)'), 'Dr. Ujjas-32 / Urea Ammonium Nitrate 32% Nitrogen'],
  ['ujjvala',            F('4.53.09 PM (42)'), 'Ujjvala / Dinotefuran 20% SG / Insecticide'],
  ['nutri-power-005234', F('4.53.09 PM (49)'), 'NUTRI POWER / NPK 00:52:34'],
  ['nutri-power-130045', F('4.53.09 PM (51)'), 'NUTRI POWER / NPK 13:00:45'],
  ['acprime',            F('4.53.09 PM (55)'), 'ACPRIME / Acetamiprid 20% SP / Insecticide'],
  ['care-phos',          F('4.53.09 PM (64)'), 'Care Phos / Chlorpyriphos 20% EC / Insecticide'],
  ['nutri-power-cbz',    F('4.53.09 PM (65)'), 'NUTRI POWER CBZ / Fortified Calcium Suspension'],
  ['malika',             F('4.53.09 PM (7)'),  'MALIKA / Thiamethoxam 12.6% + Lambda Cyhalothrin 9.5% ZC'],
  ['tommy',              F('4.53.09 PM (76)'), 'Tommy / Potash Derived from Rhodophytes'],
  ['ematin-5',           F('4.53.09 PM (78)'), 'EMATIN / Emamectin Benzoate 5% SG / Insecticide'],
  ['fire',               F('4.53.09 PM (80)'), 'Fire / Fipronil 40% + Imidacloprid 40% WG'],
  ['galexa',             F('4.53.09 PM (83)'), 'Galexa / Picoxystrobin 22.52% SC / Systemic Fungicide']
];

(async () => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  const byId = new Map(products.map(p => [p.id, p]));

  console.log(APPLY ? '=== IMPORTING ===\n' : '=== DRY RUN (no files written) ===\n');

  const imported = [];
  const skipped = [];

  for (const [id, file, evidence] of VERIFIED) {
    const product = byId.get(id);
    const source = path.join(SOURCE_DIR, file);
    const mainPath = path.join(UPLOADS_DIR, `${id}.webp`);
    const thumbPath = path.join(THUMBS_DIR, `${id}.webp`);

    if (!product) {
      skipped.push({ id, reason: 'NO SUCH PRODUCT' });
      continue;
    }
    if (!fs.existsSync(source)) {
      skipped.push({ id, reason: `SOURCE MISSING: ${file}` });
      continue;
    }
    // Never clobber artwork that is already in place.
    if (fs.existsSync(mainPath)) {
      skipped.push({ id, reason: 'DUPLICATE_CANDIDATE - product already has artwork' });
      continue;
    }

    if (APPLY) {
      // 'contain' on white keeps the whole pack visible, matching the existing 71.
      await sharp(source)
        .flatten({ background: '#ffffff' })
        .resize(500, 500, { fit: 'contain', background: '#ffffff' })
        .toFormat('webp')
        .toFile(mainPath);

      await sharp(source)
        .flatten({ background: '#ffffff' })
        .resize(150, 150, { fit: 'contain', background: '#ffffff' })
        .toFormat('webp')
        .toFile(thumbPath);
    }

    const mainOk = APPLY ? fs.existsSync(mainPath) : null;
    const thumbOk = APPLY ? fs.existsSync(thumbPath) : null;

    imported.push({
      product: product.name,
      productId: id,
      sourceFile: file,
      evidence,
      mainImage: `/uploads/${id}.webp`,
      thumbnail: `/uploads/thumbnails/${id}.webp`,
      mainWritten: mainOk,
      thumbWritten: thumbOk
    });
    console.log(`  ${product.name.padEnd(22)} <- ${file}`);
    console.log(`     ${evidence}`);
  }

  const stillMissing = products
    .filter(p => !fs.existsSync(path.join(UPLOADS_DIR, `${p.id}.webp`)))
    .map(p => ({ product: p.name, productId: p.id, status: 'NO ARTWORK IN SOURCE SET' }));

  console.log(`\nImported : ${imported.length}`);
  console.log(`Skipped  : ${skipped.length}`);
  skipped.forEach(s => console.log(`   ${s.id}: ${s.reason}`));
  console.log(`Still missing artwork: ${stillMissing.length}`);
  stillMissing.forEach(s => console.log(`   ${s.product}`));

  if (APPLY) {
    fs.writeFileSync(
      path.join(ROOT, 'image-recovery-report.json'),
      JSON.stringify({
        totals: {
          totalProducts: products.length,
          previouslyWorking: 71,
          recovered: imported.length,
          stillMissing: stillMissing.length
        },
        recovered: imported,
        skipped,
        stillMissing
      }, null, 2),
      'utf8'
    );

    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = ['Product,Source File,OCR/Visual Evidence,Match Reason,Confidence,Status,Main Image,Thumbnail']
      .concat(imported.map(r => [
        r.product, r.sourceFile, r.evidence, 'Brand + printed composition verified visually',
        '100%', 'MATCHED', r.mainImage, r.thumbnail
      ].map(esc).join(',')))
      .concat(stillMissing.map(r => [
        r.product, '', '', 'No label found in source set', '0%', 'UNMATCHED', '', ''
      ].map(esc).join(',')))
      .join('\n');
    fs.writeFileSync(path.join(ROOT, 'image-recovery-report.csv'), csv, 'utf8');
    console.log('\nReports written: image-recovery-report.json / .csv');
  } else {
    console.log('\nDry run - re-run with --apply to write the images.');
  }
})().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
