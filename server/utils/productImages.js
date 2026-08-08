const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');
const thumbsDir = path.join(uploadsDir, 'thumbnails');

/**
 * Image assets are written by the ZIP importer as `<product id>.webp` in both
 * uploads/ and uploads/thumbnails/. This module is the single place that turns
 * "what is on disk" into "what the API reports", so the seeder, the re-match
 * endpoint and the backfill script cannot drift apart.
 */

/** Resolve the on-disk image paths for a product id, or null when absent. */
function resolveImagePaths(productId) {
  if (!productId) return null;

  const filename = `${productId}.webp`;
  if (!fs.existsSync(path.join(uploadsDir, filename))) {
    return null;
  }

  // Thumbnails are generated alongside the main image, but tolerate a missing
  // one rather than reporting the product as having no image at all.
  const hasThumb = fs.existsSync(path.join(thumbsDir, filename));

  return {
    image: filename,
    imageUrl: `/uploads/${filename}`,
    thumbnail: hasThumb ? `/uploads/thumbnails/${filename}` : ''
  };
}

/**
 * Return the image fields a product should carry.
 * Existing values win; disk is only consulted to fill genuine gaps, so a
 * manually curated path is never overwritten.
 */
function withImagePaths(product) {
  if (!product) return product;

  if (product.imageUrl && product.image) {
    return product;
  }

  const found = resolveImagePaths(product.id);
  if (!found) return product;

  return {
    ...product,
    image: product.image || found.image,
    imageUrl: product.imageUrl || found.imageUrl,
    thumbnail: product.thumbnail || found.thumbnail
  };
}

/**
 * Cached set of product ids that currently have artwork on disk.
 *
 * Every product carries a declarative image path following the `<id>.webp`
 * convention, including products whose artwork has not been supplied yet. This
 * listing is what decides whether that path is real, so a not-yet-uploaded
 * image is reported as absent instead of being sent to the browser as a URL
 * that would 404. Dropping the file into uploads/ is all that is needed for the
 * product to start displaying - no data edit required.
 */
const AVAILABILITY_TTL_MS = 30 * 1000;
let availableIds = null;
let availableCheckedAt = 0;

function getAvailableImageIds({ force = false } = {}) {
  const now = Date.now();
  if (!force && availableIds && now - availableCheckedAt < AVAILABILITY_TTL_MS) {
    return availableIds;
  }

  const ids = new Set();
  try {
    for (const file of fs.readdirSync(uploadsDir)) {
      if (file.toLowerCase().endsWith('.webp')) {
        ids.add(path.basename(file, path.extname(file)));
      }
    }
  } catch (err) {
    // Uploads directory unreadable: treat every image as absent rather than
    // advertising paths we cannot serve.
    console.warn(`Could not read uploads directory: ${err.message}`);
  }

  availableIds = ids;
  availableCheckedAt = now;
  return availableIds;
}

/** Call after writing new images so the next request sees them immediately. */
function invalidateImageAvailability() {
  availableIds = null;
  availableCheckedAt = 0;
}

/**
 * Return an API-safe copy of a product whose image fields are blanked when the
 * underlying file is not on disk. Blank fields are the frontend's signal to
 * render the "No Image Available" placeholder.
 */
function withVerifiedImagePaths(product, available = getAvailableImageIds()) {
  const plain = typeof product.toObject === 'function' ? product.toObject() : product;

  if (!plain.imageUrl && !plain.image) return plain;
  if (available.has(plain.id)) return plain;

  return { ...plain, image: '', imageUrl: '', thumbnail: '' };
}

module.exports = {
  resolveImagePaths,
  withImagePaths,
  withVerifiedImagePaths,
  getAvailableImageIds,
  invalidateImageAvailability,
  uploadsDir,
  thumbsDir
};
