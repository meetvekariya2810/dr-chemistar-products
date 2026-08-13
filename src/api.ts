import { Product, DealerRequest, ProductEnquiry } from './types';

/**
 * Base URL for the API.
 *
 * Empty means "same origin", which is what we want almost everywhere:
 *   - dev:  Vite proxies /api to the Express backend (see vite.config.ts)
 *   - prod: works as-is if the API is served from the site's own domain
 * VITE_API_URL is only needed when the API lives on a different origin than the
 * site (e.g. a separate Render service).
 */
const API_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

/**
 * Whether a backend is expected to be reachable at all.
 *
 * In development it always is (the proxy points at the local server). In a
 * production build it is only true when an API origin was baked in - the static
 * Vercel deployment ships without a backend, and calling /api there would just
 * hit the SPA rewrite and return index.html.
 */
export const isApiConfigured = Boolean(API_URL) || import.meta.env.DEV;

/** Error carrying the HTTP status (0 = the request never reached a server). */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Turn an express-validator error payload into one readable sentence. */
function formatValidationErrors(payload: any): string | null {
  if (!payload || !Array.isArray(payload.errors) || payload.errors.length === 0) return null;
  return payload.errors.map((e: any) => e.msg).filter(Boolean).join('. ');
}

/**
 * Single entry point for JSON API calls.
 *
 * Distinguishes the failure modes that all used to surface as the same useless
 * "Failed to fetch": server unreachable, endpoint missing, validation rejected,
 * server error, and "got HTML instead of JSON" (the API path fell through to the
 * SPA rewrite because no backend is deployed on this origin).
 */
async function apiRequest(path: string, init?: RequestInit): Promise<any> {
  const url = `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    // fetch() only rejects for network-level failures: server down, DNS, CORS
    // preflight rejected, or the request was blocked before a response existed.
    throw new ApiError(
      `Could not reach the server at ${API_URL || window.location.origin}. ` +
        'Please check your connection and try again.',
      0
    );
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const validation = formatValidationErrors(payload);
    if (validation) throw new ApiError(validation, res.status);
    if (payload?.error || payload?.message) {
      throw new ApiError(payload.error || payload.message, res.status);
    }
    if (res.status === 404) throw new ApiError(`API endpoint not found: ${path}`, 404);
    if (res.status === 429) {
      throw new ApiError('Too many requests. Please wait a few minutes and try again.', 429);
    }
    throw new ApiError(`Request failed with status ${res.status}`, res.status);
  }

  if (!isJson) {
    throw new ApiError(
      `The server returned ${contentType || 'an unknown content type'} instead of JSON ` +
        `for ${path}. The API does not appear to be running on this origin.`,
      res.status
    );
  }

  return payload;
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function seedProducts(products: Product[]): Promise<any> {
  const res = await fetch(`${API_URL}/api/products/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(products),
  });
  return res.json();
}

export async function deleteProduct(id: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

export async function createDealer(dealer: {
  firmName: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  gstNumber: string;
  licenseNumber: string;
}): Promise<any> {
  const body = {
    firm_name: dealer.firmName,
    contact_person: dealer.contactPerson,
    phone: dealer.phone,
    email: dealer.email,
    city: dealer.city,
    state: dealer.state,
    gst_number: dealer.gstNumber,
    license_number: dealer.licenseNumber
  };

  return apiRequest('/api/dealers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function fetchDealers(): Promise<any[]> {
  const res = await fetch(`${API_URL}/api/dealers`);
  if (!res.ok) throw new Error('Failed to fetch dealers');
  return res.json();
}

export async function approveDealer(id: string | number): Promise<any> {
  const res = await fetch(`${API_URL}/api/dealers/${id}/approve`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error('Failed to approve dealer');
  return res.json();
}

export async function createEnquiry(enquiry: {
  name: string;
  phone: string;
  email: string;
  userType: string;
  message: string;
  city: string;
}): Promise<any> {
  const body = {
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    user_type: enquiry.userType,
    message: enquiry.message,
    city: enquiry.city
  };

  return apiRequest('/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function fetchEnquiries(): Promise<any[]> {
  const res = await fetch(`${API_URL}/api/enquiries`);
  if (!res.ok) throw new Error('Failed to fetch enquiries');
  return res.json();
}

export async function uploadZipFile(file: File, replaceExisting: boolean): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('replaceExisting', String(replaceExisting));

  const res = await fetch(`${API_URL}/api/products/upload-zip`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload image ZIP');
  }
  return res.json();
}

export async function fetchImageStats(): Promise<any> {
  const res = await fetch(`${API_URL}/api/products/image-stats`);
  if (!res.ok) throw new Error('Failed to fetch image stats');
  return res.json();
}

export async function triggerRematch(): Promise<any> {
  const res = await fetch(`${API_URL}/api/products/rematch`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger image re-match');
  return res.json();
}
