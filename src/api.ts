import { Product, DealerRequest, ProductEnquiry } from './types';

const API_URL = import.meta.env.VITE_API_URL || '';

export const isApiConfigured = Boolean(API_URL);

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

  const res = await fetch(`${API_URL}/api/dealers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to create dealer request');
  return res.json();
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

  const res = await fetch(`${API_URL}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to create enquiry');
  return res.json();
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
