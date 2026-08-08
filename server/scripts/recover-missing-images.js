/**
 * Phase 2 of image recovery: match OCR'd source artwork to the products that
 * have no image yet, and import the confirmed ones.
 *
 * Safety principles baked into the scoring:
 *  - Every image is scored against ALL products, not just the missing ones, so
 *    a photo of an already-imported product can never be handed to a missing
 *    one just because nothing better was considered.
 *  - The longest brand match wins, which is what stops FIRE from stealing a
 *    FIRING label (and STAR from stealing STAR GOLD).
 *  - Products sharing a first word (ISRAEL KING / ISRAEL TECH) must have their
 *    distinguishing token present in the label before either can match.
 *  - Composition is scored on chemical WORDS, not percentages, so a label
 *    printing 9.5% still confirms a catalogue entry recorded as 9.6%.
 *
 * Usage:
 *   node server/scripts/recover-missing-images.js            # dry run + reports
 *   node server/scripts/recover-missing-images.js --apply    # also import files
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '../..');
const CACHE_PATH = path.join(__dirname, '../scratch/ocr-cache.json');
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const THUMBS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

const APPLY = process.argv.includes('--apply');

const AUTO_THRESHOLD = 90;
const REVIEW_THRESHOLD = 70;

// Words that carry no identifying power on an agrochemical label.
const STOPWORDS = new Set([
  'INSECTICIDE', 'FUNGICIDE', 'HERBICIDE', 'FERTILIZER', 'SYSTEMIC', 'CONTACT',
  'BROAD', 'SPECTRUM', 'PLANT', 'GROWTH', 'REGULATOR', 'CERTIFIED', 'COMPANY',
  'CHEMISTAR', 'LIQUID', 'BASED', 'WATER', 'SOLUBLE', 'MIXTURE', 'CONTAINING',
  'ORGANIC', 'NATURAL', 'TECHNICAL', 'CONTENT', 'CONTENTS', 'SUSPENSION',
  'GRANULES', 'POWDER', 'STIMULANT', 'BIOSTIMULANT', 'FORTIFIED', 'SPRAY'
]);

const norm = s => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const letters = s => (s || '').toUpperCase().replace(/[^A-Z]/g, '');
const digitsOf = s => (s || '').replace(/[^0-9]/g, '');

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

/** Best similarity of `needle` against any same-length window of `haystack`. */
function bestWindowSimilarity(haystack, needle) {
  if (needle.length < 4 || haystack.length < needle.length) return 0;
  let best = 0;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    const window = haystack.slice(i, i + needle.length);
    const sim = (needle.length - editDistance(window, needle)) / needle.length;
    if (sim > best) best = sim;
    if (best === 1) break;
  }
  return best;
}

/** Significant chemical/identifying words from a product's composition text. */
function compositionTokens(product) {
  const text = `${product.commonName || ''} ${product.activeIngredient || ''}`;
  return [...new Set(
    text.toUpperCase()
      .replace(/[^A-Z ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 5 && !STOPWORDS.has(w))
  )];
}

function buildProductIndex(products) {
  // Products sharing a first word need their discriminator token confirmed.
  const firstWordCounts = new Map();
  for (const p of products) {
    const first = (p.name || '').trim().split(/\s+/)[0].toUpperCase();
    firstWordCounts.set(first, (firstWordCounts.get(first) || 0) + 1);
  }

  // How many products share an identical composition string. A composition
  // carrying its percentages ("FIPRONIL292EC") is usually unique across the
  // catalogue, which makes it stronger evidence than a stylised brand name that
  // OCR frequently mangles.
  const compositionCounts = new Map();
  for (const p of products) {
    const key = norm(p.commonName);
    if (key.length >= 8) compositionCounts.set(key, (compositionCounts.get(key) || 0) + 1);
  }

  // Within a shared-first-word family, only tokens belonging to ONE member can
  // discriminate. "POWER" is useless for telling NUTRI POWER variants apart;
  // "123216" identifies exactly one.
  const familyTokenCounts = new Map();
  for (const p of products) {
    const first = (p.name || '').trim().split(/\s+/)[0].toUpperCase();
    if (firstWordCounts.get(first) <= 1) continue;
    const counts = familyTokenCounts.get(first) || new Map();
    for (const w of new Set((p.name || '').trim().split(/\s+/).slice(1).map(norm).filter(Boolean))) {
      counts.set(w, (counts.get(w) || 0) + 1);
    }
    familyTokenCounts.set(first, counts);
  }

  return products.map(p => {
    const words = (p.name || '').trim().split(/\s+/);
    const firstWord = words[0].toUpperCase();
    const normCommon = norm(p.commonName);
    const sharesFamily = firstWordCounts.get(firstWord) > 1;
    const counts = familyTokenCounts.get(firstWord);
    return {
      product: p,
      normName: norm(p.name),
      brand: letters(p.name),
      nameDigits: digitsOf(p.name),
      normCommon,
      compositionUnique: normCommon.length >= 8 && compositionCounts.get(normCommon) === 1,
      tokens: compositionTokens(p),
      sharesFamily,
      discriminators: words.slice(1)
        .map(norm)
        .filter(w => w && (!sharesFamily || !counts || counts.get(w) === 1))
    };
  });
}

function scoreProduct(entry, ocrNorm, ocrLetters) {
  const reasons = [];
  let brandScore = 0;
  let matchLen = 0;

  if (entry.normName.length >= 4 && ocrNorm.includes(entry.normName)) {
    brandScore = 70;
    matchLen = entry.normName.length;
    reasons.push('exact product name on label');
  } else if (entry.brand.length >= 4 && ocrLetters.includes(entry.brand)) {
    brandScore = 55;
    matchLen = entry.brand.length;
    reasons.push('brand name on label');
    if (entry.nameDigits && ocrNorm.includes(entry.nameDigits)) {
      brandScore += 15;
      matchLen += entry.nameDigits.length;
      reasons.push(`code ${entry.nameDigits} present`);
    }
  } else if (entry.brand.length >= 5) {
    const sim = bestWindowSimilarity(ocrLetters, entry.brand);
    if (sim >= 0.85) {
      brandScore = Math.round(35 * sim);
      matchLen = entry.brand.length;
      reasons.push(`fuzzy brand match ${Math.round(sim * 100)}%`);
    }
  }

  // Composition can carry a match on its own. OCR mangles stylised brand
  // lettering far more often than the plain-font composition line, and a
  // composition that includes its percentages ("FIPRONIL292EC") normally
  // identifies exactly one product - which is why uniqueness is weighted.
  let compositionScore = 0;
  if (entry.normCommon.length >= 8) {
    if (ocrNorm.includes(entry.normCommon)) {
      compositionScore = entry.compositionUnique ? 70 : 32;
      matchLen = Math.max(matchLen, entry.normCommon.length);
      reasons.push(entry.compositionUnique
        ? 'exact composition, unique in catalogue'
        : 'exact composition, shared by several products');
    } else {
      const sim = bestWindowSimilarity(ocrNorm, entry.normCommon);
      if (sim >= 0.85) {
        compositionScore = Math.round((entry.compositionUnique ? 62 : 26) * sim);
        matchLen = Math.max(matchLen, entry.normCommon.length);
        reasons.push(`composition ${Math.round(sim * 100)}% match${entry.compositionUnique ? ', unique' : ', shared'}`);
      }
    }
  }

  if (entry.tokens.length > 0) {
    const hit = entry.tokens.filter(t => ocrLetters.includes(t));
    if (hit.length > 0) {
      const tokenScore = Math.round(25 * (hit.length / entry.tokens.length));
      if (tokenScore > compositionScore) {
        compositionScore = tokenScore;
        reasons.push(`composition ${hit.length}/${entry.tokens.length} (${hit.slice(0, 3).join(', ')})`);
      }
    }
  }

  if (brandScore === 0 && compositionScore === 0) return null;

  let total = Math.min(100, brandScore + compositionScore);

  // A product whose siblings share its first word must prove which one it is.
  // This is what keeps ISRAEL KING from inheriting an ISRAEL TECH label.
  let ambiguousFamily = false;
  if (entry.sharesFamily && entry.discriminators.length > 0) {
    const confirmed = entry.discriminators.some(d => ocrNorm.includes(d));
    if (!confirmed) {
      total = Math.min(total, 60);
      ambiguousFamily = true;
      reasons.push('AMBIGUOUS: shares name family, discriminator absent');
    } else {
      reasons.push('family discriminator confirmed');
    }
  }

  return { score: total, matchLen, reasons, ambiguousFamily, brandScore, compositionScore };
}

/**
 * Drop a candidate whose brand is merely a fragment of a longer competing brand
 * (FIRE inside FIRING, STAR inside STAR GOLD). Candidates carrying real
 * composition evidence are exempt - their claim does not rest on the brand.
 */
function dropSubstringLosers(candidates) {
  return candidates.filter(c =>
    c.compositionScore >= 30 ||
    !candidates.some(other =>
      other !== c &&
      other.entry.brand.length > c.entry.brand.length &&
      other.entry.brand.includes(c.entry.brand)
    )
  );
}

async function importImage(sourceFile, productId) {
  const main = path.join(UPLOADS_DIR, `${productId}.webp`);
  const thumb = path.join(THUMBS_DIR, `${productId}.webp`);

  // 'contain' on white keeps the whole pack visible - matches the existing 71.
  await sharp(sourceFile)
    .flatten({ background: '#ffffff' })
    .resize(500, 500, { fit: 'contain', background: '#ffffff' })
    .toFormat('webp')
    .toFile(main);

  await sharp(sourceFile)
    .flatten({ background: '#ffffff' })
    .resize(150, 150, { fit: 'contain', background: '#ffffff' })
    .toFormat('webp')
    .toFile(thumb);

  return { main, thumb };
}

(async () => {
  if (!fs.existsSync(CACHE_PATH)) {
    console.error('OCR cache not found. Run: node server/scripts/ocr-source-images.js');
    process.exit(1);
  }

  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  const index = buildProductIndex(products);

  const onDisk = new Set(
    fs.readdirSync(UPLOADS_DIR)
      .filter(f => f.toLowerCase().endsWith('.webp'))
      .map(f => path.basename(f, path.extname(f)))
  );
  const missingIds = new Set(products.filter(p => !onDisk.has(p.id)).map(p => p.id));

  console.log(`Products: ${products.length} | with artwork: ${onDisk.size} | missing: ${missingIds.size}`);
  console.log(`OCR'd source files: ${Object.keys(cache).length}`);
  console.log(APPLY ? '\nMODE: APPLY (files will be written)\n' : '\nMODE: DRY RUN (no files written)\n');

  // Score every source file against the whole catalogue.
  const perImage = [];
  for (const [key, rec] of Object.entries(cache)) {
    const ocrNorm = norm(rec.text);
    const ocrLetters = letters(rec.text);
    if (!ocrNorm) {
      perImage.push({ key, file: rec.file, best: null, candidates: [] });
      continue;
    }

    let candidates = [];
    for (const entry of index) {
      const scored = scoreProduct(entry, ocrNorm, ocrLetters);
      if (scored) candidates.push({ entry, ...scored });
    }
    candidates = dropSubstringLosers(candidates);
    candidates.sort((a, b) => b.score - a.score || b.matchLen - a.matchLen);

    // An exact composition string that belongs to exactly one product in the
    // catalogue identifies that product on its own - percentages are what
    // separate otherwise identical actives (Fipronil 2.92 / 5 / 80). Brand
    // lettering is decorative and frequently unreadable, so refusing to act on
    // decisive composition evidence would strand most of the recoverable set.
    // The margin check ensures no runner-up has a comparable claim.
    const best = candidates[0] || null;
    const runnerUp = candidates[1] || null;
    if (best && !best.ambiguousFamily && best.compositionScore >= 70 &&
        (!runnerUp || best.score - runnerUp.score >= 20)) {
      best.decisiveComposition = true;
      best.score = Math.max(best.score, AUTO_THRESHOLD);
      best.reasons.push('decisive: composition unique and unrivalled');
    }

    perImage.push({ key, file: rec.file, best, candidates: candidates.slice(0, 3) });
  }

  // Choose the strongest source file per missing product.
  const bestPerProduct = new Map();
  for (const img of perImage) {
    if (!img.best) continue;
    const id = img.best.entry.product.id;
    if (!missingIds.has(id)) continue;

    const prev = bestPerProduct.get(id);
    if (!prev || img.best.score > prev.best.score || (img.best.score === prev.best.score && img.best.matchLen > prev.best.matchLen)) {
      bestPerProduct.set(id, img);
    }
  }

  const matched = [];
  const review = [];
  const rows = [];

  for (const [id, img] of bestPerProduct) {
    const product = img.best.entry.product;
    const record = {
      product: product.name,
      productId: id,
      ocrName: (cache[img.key].text || '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 4).join(' | ').slice(0, 120),
      sourceFile: path.relative(ROOT, img.file),
      confidence: img.best.score,
      reason: img.best.reasons.join('; ')
    };

    if (img.best.score >= AUTO_THRESHOLD && !img.best.ambiguousFamily) {
      matched.push(record);
    } else if (img.best.score >= REVIEW_THRESHOLD) {
      review.push({ ...record, action: 'REVIEW REQUIRED - not imported' });
    }
  }

  // Import the confirmed matches.
  const imported = [];
  for (const m of matched) {
    const absolute = path.join(ROOT, m.sourceFile);
    let mainStatus = 'NOT WRITTEN (dry run)';
    let thumbStatus = 'NOT WRITTEN (dry run)';

    if (APPLY) {
      try {
        await importImage(absolute, m.productId);
        mainStatus = fs.existsSync(path.join(UPLOADS_DIR, `${m.productId}.webp`)) ? 'OK' : 'FAILED';
        thumbStatus = fs.existsSync(path.join(THUMBS_DIR, `${m.productId}.webp`)) ? 'OK' : 'FAILED';
      } catch (err) {
        mainStatus = thumbStatus = `ERROR: ${err.message}`;
      }
    }

    imported.push({ ...m, mainImage: `/uploads/${m.productId}.webp`, thumbnail: `/uploads/thumbnails/${m.productId}.webp`, mainStatus, thumbStatus });
  }

  const stillMissing = [...missingIds]
    .filter(id => !matched.some(m => m.productId === id))
    .map(id => {
      const p = products.find(x => x.id === id);
      const r = review.find(x => x.productId === id);
      return { product: p.name, productId: id, status: r ? 'REVIEW REQUIRED' : 'NO CANDIDATE FOUND' };
    });

  for (const m of imported) rows.push({ ...m, matchStatus: 'MATCHED' });
  for (const r of review) rows.push({ ...r, mainImage: '', thumbnail: '', mainStatus: '', thumbStatus: '', matchStatus: 'REVIEW REQUIRED' });

  const reportJson = {
    generatedFor: 'DR CHEMISTAR product image recovery',
    totals: {
      totalProducts: products.length,
      alreadyWorking: onDisk.size,
      missingBefore: missingIds.size,
      autoMatched: matched.length,
      reviewRequired: review.length,
      stillMissing: stillMissing.length
    },
    matched: imported,
    reviewRequired: review,
    stillMissing
  };

  fs.writeFileSync(path.join(ROOT, 'image-recovery-report.json'), JSON.stringify(reportJson, null, 2), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'review-required.json'), JSON.stringify(review, null, 2), 'utf8');

  const csvEscape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['Product', 'OCR Name', 'Source File', 'Confidence', 'Match Status', 'Main Image', 'Thumbnail', 'Main Status', 'Thumb Status', 'Reason'];
  const csv = [header.join(',')]
    .concat(rows.map(r => [r.product, r.ocrName, r.sourceFile, `${r.confidence}%`, r.matchStatus, r.mainImage, r.thumbnail, r.mainStatus, r.thumbStatus, r.reason].map(csvEscape).join(',')))
    .join('\n');
  fs.writeFileSync(path.join(ROOT, 'image-recovery-report.csv'), csv, 'utf8');

  console.log(`AUTO MATCHED   : ${matched.length}`);
  matched.forEach(m => console.log(`  ${String(m.confidence).padStart(3)}%  ${m.product.padEnd(22)} <- ${path.basename(m.sourceFile)}`));
  console.log(`\nREVIEW REQUIRED: ${review.length}`);
  review.forEach(r => console.log(`  ${String(r.confidence).padStart(3)}%  ${r.product.padEnd(22)} <- ${path.basename(r.sourceFile)}  (${r.reason})`));
  console.log(`\nSTILL MISSING  : ${stillMissing.length}`);
  stillMissing.forEach(s => console.log(`  ${s.product.padEnd(22)} ${s.status}`));
  console.log('\nReports: image-recovery-report.json | image-recovery-report.csv | review-required.json');
  if (!APPLY) console.log('Dry run - re-run with --apply to import the matched images.');
})().catch(err => {
  console.error('Recovery failed:', err);
  process.exit(1);
});
