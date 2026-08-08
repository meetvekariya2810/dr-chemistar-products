/**
 * Phase 1 of image recovery: OCR every source artwork file once and cache it.
 *
 * OCR is the slow part (seconds per image), so results are cached to disk and
 * the run is resumable - re-running only processes files not already cached.
 * Matching and importing happen in recover-missing-images.js, which reads this
 * cache, so match logic can be iterated on without paying for OCR again.
 *
 * Usage:
 *   node server/scripts/ocr-source-images.js [--source "<dir>"] [--force]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createWorker } = require('tesseract.js');

const ROOT = path.join(__dirname, '../..');
const DEFAULT_SOURCE = path.join(ROOT, 'DrChemistar product image.jpg');
const CACHE_PATH = path.join(__dirname, '../scratch/ocr-cache.json');
const TEMP_DIR = path.join(__dirname, '../scratch/ocr-prep');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function parseArgs() {
  const argv = process.argv.slice(2);
  const sourceIdx = argv.indexOf('--source');
  return {
    source: sourceIdx !== -1 ? argv[sourceIdx + 1] : DEFAULT_SOURCE,
    force: argv.includes('--force')
  };
}

/** Recursively collect candidate image files. */
function collectImages(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectImages(full, out);
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
}

// Bottle and sachet labels are frequently photographed with the product name
// running vertically or upside down, which Tesseract cannot read at 0deg. Each
// image is therefore OCR'd at all four right-angle rotations and the results
// concatenated, so text is recovered whichever way the label was oriented.
const ROTATIONS = [0, 90, 180, 270];

/**
 * Upscale and flatten onto white. Colour is deliberately preserved - these are
 * photographs of glossy packaging, and converting to grayscale measurably
 * degraded recognition of light text printed over coloured panels.
 */
async function preprocess(srcPath, destPath, rotation) {
  await sharp(srcPath)
    .flatten({ background: '#ffffff' })
    .rotate(rotation)
    .resize({ width: 1800, withoutEnlargement: false })
    .toFormat('png')
    .toFile(destPath);
}

(async () => {
  const { source, force } = parseArgs();
  console.log(`Source directory: ${source}`);

  const files = collectImages(source);
  if (files.length === 0) {
    console.error('No source images found.');
    process.exit(1);
  }

  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const cache = force ? {} : loadCache();

  const pending = files.filter(f => !cache[path.basename(f)]);
  console.log(`Found ${files.length} images | cached ${files.length - pending.length} | to process ${pending.length}`);

  if (pending.length === 0) {
    console.log('Nothing to do - OCR cache is complete.');
    process.exit(0);
  }

  const worker = await createWorker('eng');
  let done = 0;

  for (const file of pending) {
    const key = path.basename(file);
    const prepped = path.join(TEMP_DIR, `${key}.png`);

    try {
      const parts = [];
      let bestConfidence = 0;

      for (const rotation of ROTATIONS) {
        const rotated = `${prepped}.${rotation}.png`;
        try {
          await preprocess(file, rotated, rotation);
          const { data } = await worker.recognize(rotated);
          if (data.text && data.text.trim()) {
            parts.push(`[rot${rotation}] ${data.text.trim()}`);
            bestConfidence = Math.max(bestConfidence, data.confidence ?? 0);
          }
        } finally {
          try { fs.unlinkSync(rotated); } catch {}
        }
      }

      cache[key] = {
        file,
        text: parts.join('\n'),
        confidence: bestConfidence || null
      };
    } catch (err) {
      cache[key] = { file, text: '', confidence: null, error: err.message };
      console.warn(`  OCR failed for ${key}: ${err.message}`);
    }

    done++;
    // Persist as we go so an interrupted run resumes instead of restarting.
    if (done % 5 === 0 || done === pending.length) {
      saveCache(cache);
      console.log(`  ${done}/${pending.length} processed`);
    }

    try { fs.unlinkSync(prepped); } catch {}
  }

  await worker.terminate();
  saveCache(cache);

  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}

  console.log(`\nOCR complete. Cached ${Object.keys(cache).length} files -> ${CACHE_PATH}`);
  process.exit(0);
})().catch(err => {
  console.error('OCR pass failed:', err);
  process.exit(1);
});
