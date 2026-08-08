/**
 * Backfill product image paths from the files already present in uploads/.
 *
 * Safe by design: it only ever writes the image / imageUrl / thumbnail fields.
 * No product is created, deleted, renamed or re-priced, and existing image
 * paths are left untouched.
 *
 * Usage:
 *   node server/scripts/backfill-product-images.js           # apply changes
 *   node server/scripts/backfill-product-images.js --dry-run # report only
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Product = require('../models/product.model');
const { resolveImagePaths, uploadsDir, thumbsDir } = require('../utils/productImages');

const productsFilePath = path.join(__dirname, '../data/products.json');
const DRY_RUN = process.argv.includes('--dry-run');

function report(title, rows) {
  console.log(`\n${title} (${rows.length})`);
  if (rows.length === 0) {
    console.log('  - none');
    return;
  }
  rows.slice(0, 100).forEach(r => console.log(`  - ${r}`));
  if (rows.length > 100) console.log(`  ...and ${rows.length - 100} more`);
}

/** Decide the new image fields for one product. Returns null when nothing changes. */
function planUpdate(product) {
  const found = resolveImagePaths(product.id);
  if (!found) return null;

  const needsUpdate =
    product.image !== found.image ||
    product.imageUrl !== found.imageUrl ||
    (found.thumbnail && product.thumbnail !== found.thumbnail);

  return needsUpdate ? found : null;
}

async function backfillMongo() {
  const products = await Product.find({});
  const updated = [];
  const alreadyOk = [];
  const noArtwork = [];

  for (const product of products) {
    const update = planUpdate(product);
    if (!update) {
      (resolveImagePaths(product.id) ? alreadyOk : noArtwork).push(`${product.name} (${product.id})`);
      continue;
    }

    if (!DRY_RUN) {
      await Product.updateOne({ id: product.id }, { $set: update });
    }
    updated.push(`${product.name} -> ${update.imageUrl}`);
  }

  return { total: products.length, updated, alreadyOk, noArtwork };
}

function backfillJson() {
  if (!fs.existsSync(productsFilePath)) {
    console.log('No local products.json found - skipping JSON store.');
    return null;
  }

  const products = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
  const updated = [];
  const alreadyOk = [];
  const noArtwork = [];

  for (const product of products) {
    const update = planUpdate(product);
    if (!update) {
      (resolveImagePaths(product.id) ? alreadyOk : noArtwork).push(`${product.name} (${product.id})`);
      continue;
    }
    Object.assign(product, update);
    updated.push(`${product.name} -> ${update.imageUrl}`);
  }

  if (!DRY_RUN && updated.length > 0) {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf8');
  }

  return { total: products.length, updated, alreadyOk, noArtwork };
}

/** Files on disk that no product claims - usually a naming mismatch worth seeing. */
function findOrphanFiles(productIds) {
  if (!fs.existsSync(uploadsDir)) return [];
  return fs
    .readdirSync(uploadsDir)
    .filter(f => f.toLowerCase().endsWith('.webp'))
    .filter(f => !productIds.has(path.basename(f, '.webp')));
}

(async () => {
  console.log(DRY_RUN ? '=== DRY RUN - no writes ===' : '=== BACKFILLING PRODUCT IMAGES ===');
  console.log(`uploads:    ${uploadsDir}`);
  console.log(`thumbnails: ${thumbsDir}`);

  const mongoURI = process.env.MONGO_URI;
  let result = null;
  let store = '';

  if (mongoURI) {
    try {
      await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
      store = `MongoDB (${mongoose.connection.host})`;
      result = await backfillMongo();
    } catch (err) {
      console.warn(`MongoDB unavailable (${err.message}) - falling back to local JSON store.`);
    }
  }

  if (!result) {
    store = 'local products.json';
    result = backfillJson();
  }

  if (!result) {
    console.error('No product store could be read.');
    process.exit(1);
  }

  const allProducts = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
  const orphans = findOrphanFiles(new Set(allProducts.map(p => p.id)));

  console.log(`\nStore: ${store}`);
  console.log(`Products: ${result.total}`);
  report('UPDATED', result.updated);
  report('ALREADY CORRECT', result.alreadyOk);
  report('MISSING ARTWORK (placeholder is expected)', result.noArtwork);
  report('ORPHAN IMAGE FILES (no matching product id)', orphans);

  console.log(
    `\nSummary: ${result.updated.length} updated, ${result.alreadyOk.length} already correct, ` +
    `${result.noArtwork.length} without artwork, ${orphans.length} orphan files.`
  );
  if (DRY_RUN) console.log('Dry run - nothing was written.');

  await mongoose.connection.close().catch(() => {});
  process.exit(0);
})().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
