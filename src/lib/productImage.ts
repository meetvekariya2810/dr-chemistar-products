import { Product } from '../types';

/**
 * Single source of truth for turning a stored image path into a browser URL.
 *
 * The API stores product images as origin-relative paths, e.g.
 *   image:     "star-tara.webp"
 *   imageUrl:  "/uploads/star-tara.webp"          (500x500 - use on cards & modal)
 *   thumbnail: "/uploads/thumbnails/star-tara.webp" (150x150 - admin previews only)
 *
 * The frontend is served from a different origin than the API in development
 * (Vite :5173 vs API :5001), so relative paths must be prefixed with the API
 * origin. In production, leave VITE_API_URL empty when both are served from the
 * same origin and these paths stay relative.
 */

// Trailing slashes would produce "//uploads/..." once joined.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/** Resolve any stored upload path (absolute, relative, or data URI) to a usable URL. */
export function resolveUploadUrl(storedPath?: string | null): string {
  if (!storedPath) return '';

  const trimmed = storedPath.trim();
  if (!trimmed) return '';

  // Already fully qualified - use as-is.
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Guarantee exactly one leading slash so we never emit "//uploads" or "uploads".
  const normalized = `/${trimmed.replace(/^\/+/, '')}`;
  return `${API_ORIGIN}${normalized}`;
}

export type ProductImageVariant = 'full' | 'thumb';

/**
 * Resolve a product's image URL.
 *
 * Returns '' when the product genuinely has no image on record, which is the
 * signal for callers to render the "No Image Available" placeholder. We do NOT
 * guess a URL from the product id: ~30 of the 101 products have no artwork, and
 * guessing would fire a 404 for every one of them on each render.
 */
export function getProductImageUrl(
  product: Pick<Product, 'image' | 'imageUrl' | 'thumbnail'> | null | undefined,
  variant: ProductImageVariant = 'full'
): string {
  if (!product) return '';

  if (variant === 'thumb' && product.thumbnail) {
    return resolveUploadUrl(product.thumbnail);
  }

  // `image` holds a bare filename; `imageUrl` already holds the full path.
  const storedPath = product.imageUrl || (product.image ? `/uploads/${product.image}` : '');
  return resolveUploadUrl(storedPath);
}
