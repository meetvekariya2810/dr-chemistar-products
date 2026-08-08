import { Product } from '../types';

/**
 * Single source of truth for turning a stored image path into a browser URL.
 *
 * Product artwork is a FRONTEND static asset. The files live in public/uploads/,
 * so Vite serves them at /uploads/... in development and copies them into dist/
 * for production, where Vercel serves them from the site's own origin.
 *
 *   image:     "star-tara.webp"
 *   imageUrl:  "/uploads/star-tara.webp"            (500x500 - cards & modal)
 *   thumbnail: "/uploads/thumbnails/star-tara.webp" (150x150 - admin previews)
 *
 * These paths are deliberately NOT prefixed with VITE_API_URL. Production is a
 * static deployment with no backend, so pointing image URLs at an API origin
 * would break every image there - and would put a localhost URL in the
 * production bundle whenever VITE_API_URL is set for local development.
 */

/** Resolve any stored upload path (absolute, relative, or data URI) to a usable URL. */
export function resolveUploadUrl(storedPath?: string | null): string {
  if (!storedPath) return '';

  const trimmed = storedPath.trim();
  if (!trimmed) return '';

  // Already fully qualified (e.g. object storage) - use as-is.
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Guarantee exactly one leading slash so we never emit "//uploads" or "uploads".
  return `/${trimmed.replace(/^\/+/, '')}`;
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
