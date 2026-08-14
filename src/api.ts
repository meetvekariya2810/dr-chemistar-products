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

/**
 * Kill switch for the website enquiry form.
 *
 * This is the ONLY thing that may make the form say "online submission is not
 * available". It used to be inferred from isApiConfigured, which meant every
 * production build without VITE_API_URL refused to submit without ever calling
 * the API - so a perfectly healthy backend looked switched off. The form now
 * always posts and reports whatever really happened.
 */
export const isEnquiryFormDisabled =
  String(import.meta.env.VITE_DISABLE_ENQUIRY_FORM || '').toLowerCase() === 'true';

/** Error carrying the HTTP status (0 = the request never reached a server). */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/* -------------------------------------------------------------------------- */
/* Admin session                                                               */
/* -------------------------------------------------------------------------- */

const ADMIN_TOKEN_KEY = 'drchemistar.admin.token';

/**
 * sessionStorage, not localStorage: the CMS token grants read access to every
 * customer's contact details, so it should not outlive the browser tab. Every
 * access is guarded because storage throws in private-mode Safari.
 */
export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    /* storage unavailable - the session simply won't survive a reload */
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* nothing to clean up */
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
async function apiRequest(path: string, init: RequestInit = {}, opts: { auth?: boolean } = {}): Promise<any> {
  const url = `${API_URL}${path}`;

  const headers = new Headers(init.headers || {});
  if (opts.auth) {
    const token = getAdminToken();
    if (!token) {
      throw new ApiError('Your admin session has ended. Please sign in again.', 401);
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
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
    // A rejected token is dead for every future call, so drop it here rather
    // than letting each screen discover the same 401 separately.
    if (res.status === 401 && opts.auth) clearAdminToken();

    const validation = formatValidationErrors(payload);
    if (validation) throw new ApiError(validation, res.status);
    if (payload?.error || payload?.message) {
      throw new ApiError(payload.error || payload.message, res.status);
    }
    if (res.status === 429) {
      throw new ApiError('Too many requests. Please wait a few minutes and try again.', 429);
    }

    /*
     * A non-JSON 404/405 means the request was answered by the static site host
     * instead of the API. On Vercel every unmatched path used to rewrite to
     * index.html, and because static hosting only serves GET/HEAD, a POST came
     * back "405 Method Not Allowed" - which told a farmer nothing and told us
     * nothing either. The visitor gets a plain-English message; the actual cause
     * goes to the console for whoever is deploying.
     */
    if (!isJson && (res.status === 404 || res.status === 405 || res.status === 501)) {
      console.error(
        `[api] ${path} returned HTTP ${res.status} from the static host, not the backend. ` +
          'The build has no VITE_API_URL, so it is calling its own origin. ' +
          'Set VITE_API_URL to the API origin and redeploy.'
      );
      throw new ApiError(
        'Online submission is temporarily unavailable, so nothing was saved. ' +
          'Please try again shortly, or send us your details on WhatsApp.',
        res.status
      );
    }

    if (res.status === 404) throw new ApiError(`API endpoint not found: ${path}`, 404);
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

/**
 * Create one product, optionally with its photo.
 *
 * Takes FormData rather than an object because the photo rides along in the
 * same request. Deliberately no Content-Type header - the browser has to set
 * it itself so the multipart boundary is included.
 */
export async function createProduct(form: FormData): Promise<any> {
  return apiRequest('/api/products', {
    method: 'POST',
    body: form,
  });
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

/* -------------------------------------------------------------------------- */
/* Enquiries                                                                   */
/* -------------------------------------------------------------------------- */

export const ENQUIRY_STATUSES = ['New', 'Contacted', 'In Progress', 'Resolved', 'Closed'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/** One enquiry exactly as the API returns it - same shape from Mongo or the JSON fallback. */
export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  user_type: string;
  message: string;
  status: EnquiryStatus;
  admin_notes: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface EnquiryStats {
  total: number;
  New: number;
  Contacted: number;
  'In Progress': number;
  Resolved: number;
  Closed: number;
}

/**
 * Submit the website contact form. Public - no token involved.
 * Resolves with the new record's id, which the form shows as a reference number.
 */
export async function createEnquiry(enquiry: {
  name: string;
  phone: string;
  email: string;
  userType: string;
  message: string;
  city: string;
}): Promise<{ success: boolean; message: string; id: string; enquiry: Enquiry }> {
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

/** Admin only. Returns every enquiry newest-first plus the dashboard counters. */
export async function fetchEnquiries(): Promise<{ data: Enquiry[]; stats: EnquiryStats; source: string }> {
  const payload = await apiRequest('/api/enquiries', { method: 'GET' }, { auth: true });
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    stats: payload?.stats || { total: 0, New: 0, Contacted: 0, 'In Progress': 0, Resolved: 0, Closed: 0 },
    source: payload?.source || 'unknown'
  };
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<{ enquiry: Enquiry }> {
  return apiRequest(`/api/enquiries/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }, { auth: true });
}

export async function updateEnquiry(
  id: string,
  changes: { status?: EnquiryStatus; admin_notes?: string }
): Promise<{ enquiry: Enquiry }> {
  return apiRequest(`/api/enquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  }, { auth: true });
}

export async function deleteEnquiry(id: string): Promise<{ success: boolean; id: string }> {
  return apiRequest(`/api/enquiries/${encodeURIComponent(id)}`, { method: 'DELETE' }, { auth: true });
}

/* -------------------------------------------------------------------------- */
/* Farmers                                                                     */
/* -------------------------------------------------------------------------- */

export const FARMER_STATUSES = ['New', 'Contacted', 'Active', 'Inactive'] as const;
export type FarmerStatus = (typeof FARMER_STATUSES)[number];

/** A farmer record as the admin API returns it. Never exposed to the public. */
export interface Farmer {
  id: string;
  farmer_id: string;
  farmer_name: string;
  mobile: string;
  alternate_mobile: string;
  email: string;
  gender: string;
  age: string;
  village: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  farm_area: string;
  land_unit: string;
  irrigation: string;
  soil_type: string;
  main_crop: string;
  other_crops: string[];
  current_season: string;
  crop_area: string;
  farming_experience: string;
  farming_type: string;
  interests: string[];
  message: string;
  consent: boolean;
  status: FarmerStatus;
  admin_notes: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface FarmerStats {
  total: number;
  newThisMonth: number;
  active: number;
  byStatus: Record<FarmerStatus, number>;
  byDistrict: { name: string; count: number }[];
  byState: { name: string; count: number }[];
  byCrop: { name: string; count: number }[];
}

export interface FarmerFilterOptions {
  districts: string[];
  states: string[];
  cities: string[];
  crops: string[];
  irrigation: string[];
}

/** Everything the public /farmer form can submit. All optional but the four. */
export interface FarmerSubmission {
  farmer_name: string;
  mobile: string;
  consent: boolean;
  [field: string]: string | string[] | boolean | undefined;
}

/**
 * Thrown when the API thinks this mobile just registered.
 *
 * Carries no detail about the existing record - the caller only needs to know
 * to ask "did you mean to send this twice?" and resend with confirmed: true.
 */
export class DuplicateFarmerError extends ApiError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'DuplicateFarmerError';
  }
}

/**
 * Register a farmer. Public - no token.
 *
 * Resolves with the registration number to show on screen. Pass confirmed=true
 * to go through after the caller acknowledged a duplicate warning.
 */
export async function createFarmer(
  submission: FarmerSubmission,
  confirmed = false
): Promise<{ farmer_id: string }> {
  const body = { ...submission, consent: true, ...(confirmed ? { confirm_duplicate: true } : {}) };

  try {
    return await apiRequest('/api/farmers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      throw new DuplicateFarmerError(err.message);
    }
    throw err;
  }
}

/** Admin only. `params` are the search/filter query values. */
export async function fetchFarmers(params: Record<string, string> = {}): Promise<{
  data: Farmer[];
  stats: FarmerStats;
  filterOptions: FarmerFilterOptions;
  total: number;
  source: string;
}> {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v && v !== 'All')
  ).toString();

  const payload = await apiRequest(`/api/farmers${qs ? `?${qs}` : ''}`, { method: 'GET' }, { auth: true });
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    stats: payload?.stats,
    filterOptions: payload?.filterOptions || { districts: [], states: [], cities: [], crops: [], irrigation: [] },
    total: payload?.total ?? 0,
    source: payload?.source || 'unknown'
  };
}

export async function fetchFarmer(id: string): Promise<Farmer> {
  const payload = await apiRequest(`/api/farmers/${encodeURIComponent(id)}`, { method: 'GET' }, { auth: true });
  return payload.data;
}

export async function updateFarmer(id: string, changes: Record<string, string>): Promise<Farmer> {
  const payload = await apiRequest(`/api/farmers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  }, { auth: true });
  return payload.data;
}

export async function deleteFarmer(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/farmers/${encodeURIComponent(id)}`, { method: 'DELETE' }, { auth: true });
}

/**
 * Download an export.
 *
 * Goes through fetch rather than a plain link because the endpoint needs the
 * Authorization header - a bare <a href> would arrive unauthenticated and 401.
 * The response is turned into a blob and saved via a temporary object URL.
 */
async function downloadAuthed(path: string, fallbackName: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new ApiError('Your admin session has ended. Please sign in again.', 401);

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) clearAdminToken();
    const payload = await res.json().catch(() => null);
    throw new ApiError(payload?.message || `Export failed with status ${res.status}`, res.status);
  }

  // Prefer the filename the server chose, so exports land on disk already dated.
  const disposition = res.headers.get('content-disposition') || '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = match ? match[1] : fallbackName;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke on the next tick - revoking synchronously can cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const filterQuery = (params: Record<string, string>) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v && v !== 'All')).toString();

export async function exportFarmersExcel(params: Record<string, string> = {}): Promise<void> {
  const qs = filterQuery(params);
  return downloadAuthed(`/api/farmers/export/excel${qs ? `?${qs}` : ''}`, 'dr-chemistar-farmers.xlsx');
}

export async function exportFarmersPdf(params: Record<string, string> = {}): Promise<void> {
  const qs = filterQuery(params);
  return downloadAuthed(`/api/farmers/export/pdf${qs ? `?${qs}` : ''}`, 'dr-chemistar-farmers.pdf');
}

export async function exportFarmerPdf(id: string): Promise<void> {
  return downloadAuthed(`/api/farmers/${encodeURIComponent(id)}/export/pdf`, `${id}.pdf`);
}

/* -------------------------------------------------------------------------- */
/* Admin authentication                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Sign in against the backend and keep the returned token for this tab.
 *
 * The credentials are checked server-side; nothing about the password lives in
 * this bundle any more.
 */
export interface AdminUser {
  username: string;
  role: string;
  /**
   * What this role may do with farmer records: view / edit / delete / export.
   * Used only to hide controls the role cannot use - the API enforces it for
   * real, so a tampered client gains nothing.
   */
  farmerPermissions: string[];
}

export async function adminLogin(username: string, password: string): Promise<AdminUser> {
  const payload = await apiRequest('/api/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!payload?.token) {
    throw new ApiError('The server did not return a session token.', 500);
  }

  setAdminToken(payload.token);
  return { username, role: 'admin', farmerPermissions: [], ...(payload.user || {}) };
}

/** Confirm a token kept from an earlier page load is still good. */
export async function adminMe(): Promise<AdminUser> {
  const payload = await apiRequest('/api/auth/admin/me', { method: 'GET' }, { auth: true });
  return { username: '', role: 'admin', farmerPermissions: [], ...(payload.user || {}) };
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
