import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { PRODUCTS_DATA } from '../data/productsData';
import {
  fetchProducts,
  fetchDealers,
  fetchEnquiries,
  updateEnquiry as apiUpdateEnquiry,
  updateEnquiryStatus as apiUpdateEnquiryStatus,
  deleteEnquiry as apiDeleteEnquiry,
  adminLogin,
  adminMe,
  clearAdminToken,
  getAdminToken,
  approveDealer,
  deleteProduct,
  createProduct,
  isApiConfigured,
  fetchImageStats,
  uploadZipFile,
  triggerRematch,
  ENQUIRY_STATUSES,
  FARMER_STATUSES,
  fetchFarmers,
  updateFarmer as apiUpdateFarmer,
  deleteFarmer as apiDeleteFarmer,
  exportFarmersExcel,
  exportFarmersPdf,
  exportFarmerPdf,
  ApiError
} from '../api';
import type {
  Enquiry,
  EnquiryStatus,
  EnquiryStats,
  AdminUser,
  Farmer,
  FarmerStatus,
  FarmerStats,
  FarmerFilterOptions
} from '../api';
import { resolveUploadUrl } from '../lib/productImage';
import { 
  Lock, 
  Layers, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Download,
  Building2,
  Settings,
  ShieldCheck,
  ImageIcon,
  AlertTriangle,
  FileText,
  Check,
  RefreshCw,
  Upload,
  X,
  Loader2,
  PackagePlus,
  Phone,
  Mail,
  MapPin,
  Eye,
  Inbox,
  Sprout,
  FileSpreadsheet,
  FileDown,
  Save
} from 'lucide-react';

interface AdminPanelProps {
  currentLang: Language;
}

/**
 * The five catalogue types, and how the "what does it act on" field should be
 * labelled and stored for each.
 *
 * The Product shape carries `targetPest` and `targetDisease` but no weed or
 * deficiency field, and the existing catalogue already overloads `targetPest`
 * for herbicide weeds, PGR growth issues and fertilizer purposes. Rather than
 * add a column, each type gets the wording an agronomist would expect while
 * writing into the field the rest of the catalogue already uses.
 */
interface ProductTypeConfig {
  value: ProductCategory;
  label: string;
  emoji: string;
  hint: string;
  targetsLabel: string;
  targetsField: 'targetPest' | 'targetDisease';
  targetsPlaceholder: string;
  formulationPlaceholder: string;
  dosePlaceholder: string;
}

const PRODUCT_TYPES: ProductTypeConfig[] = [
  {
    value: 'Insecticide',
    label: 'Insecticide',
    emoji: '🌾',
    hint: 'Pest control for sucking & chewing insects',
    targetsLabel: 'Target Pests',
    targetsField: 'targetPest',
    targetsPlaceholder: 'Aphids, Whitefly, Thrips, Pink Bollworm',
    formulationPlaceholder: 'e.g. 5% SC, 20% WG, 1.8% EC',
    dosePlaceholder: 'e.g. 15 ml / 15 Ltr. Water'
  },
  {
    value: 'Fungicide',
    label: 'Fungicide',
    emoji: '🛡️',
    hint: 'Preventive & curative disease control',
    targetsLabel: 'Target Diseases',
    targetsField: 'targetDisease',
    targetsPlaceholder: 'Powdery Mildew, Leaf Spot, Blight, Rust',
    formulationPlaceholder: 'e.g. 75% WP, 25% SC, 50% WG',
    dosePlaceholder: 'e.g. 30 gm / 15 Ltr. Water'
  },
  {
    value: 'Herbicide',
    label: 'Herbicide',
    emoji: '🌱',
    hint: 'Selective & non-selective weed control',
    targetsLabel: 'Target Weeds',
    targetsField: 'targetPest',
    targetsPlaceholder: 'Grassy weeds, Broadleaf weeds, Sedges',
    formulationPlaceholder: 'e.g. 10% SC, 41% SL',
    dosePlaceholder: 'e.g. 400 ml / Acre'
  },
  {
    value: 'PGR',
    label: 'PGR & Bio',
    emoji: '⚡',
    hint: 'Growth regulators & bio-stimulants',
    targetsLabel: 'Growth Issues Addressed',
    targetsField: 'targetPest',
    targetsPlaceholder: 'Flower drop, Poor root growth, Stress recovery',
    formulationPlaceholder: 'e.g. Liquid Bio-stimulant, 0.001% L',
    dosePlaceholder: 'e.g. 20 ml / 15 Ltr. Water'
  },
  {
    value: 'Fertilizer',
    label: 'Fertilizer',
    emoji: '💧',
    hint: 'Water soluble NPK & micronutrients',
    targetsLabel: 'Deficiency / Purpose',
    targetsField: 'targetPest',
    targetsPlaceholder: 'Nitrogen deficiency, Poor grain filling',
    formulationPlaceholder: 'e.g. Water Soluble Powder, Liquid Suspension',
    dosePlaceholder: 'e.g. 75 gm / 15 Ltr. Water'
  }
];

const EMPTY_ENQUIRY_STATS: EnquiryStats = {
  total: 0,
  New: 0,
  Contacted: 0,
  'In Progress': 0,
  Resolved: 0,
  Closed: 0
};

/** Status pill colours, shared by the table, the filter chips and the modal. */
const STATUS_STYLES: Record<EnquiryStatus, string> = {
  New: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Contacted: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'In Progress': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Closed: 'bg-slate-600/30 text-slate-300 border-slate-500/30'
};

/** The one-click transition offered on each row, i.e. "what happens next". */
const NEXT_STATUS: Partial<Record<EnquiryStatus, EnquiryStatus>> = {
  New: 'Contacted',
  Contacted: 'In Progress',
  'In Progress': 'Resolved',
  Resolved: 'Closed'
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

/** Short reference shown to the customer on submit, so both sides quote the same code. */
const shortRef = (id: string) => (id || '').slice(-8).toUpperCase();

const EMPTY_FARMER_STATS: FarmerStats = {
  total: 0,
  newThisMonth: 0,
  active: 0,
  byStatus: { New: 0, Contacted: 0, Active: 0, Inactive: 0 },
  byDistrict: [],
  byState: [],
  byCrop: []
};

const EMPTY_FARMER_FILTER_OPTIONS: FarmerFilterOptions = {
  districts: [], states: [], cities: [], crops: [], irrigation: []
};

const FARMER_STATUS_STYLES: Record<FarmerStatus, string> = {
  New: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Contacted: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Inactive: 'bg-slate-600/30 text-slate-300 border-slate-500/30'
};

const formatDateOnly = (value: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const EMPTY_PRODUCT_FORM = {
  name: '',
  commonName: '',
  activeIngredient: '',
  formulation: '',
  dose: '',
  packing: '',
  targets: '',
  targetCrops: '',
  modeOfAction: '',
  benefits: '',
  safetyInstructions: '',
  storageInstructions: '',
  badge: '',
  popular: false
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentLang }) => {
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS_DATA);
  const [activeTab, setActiveTab] = useState<'products' | 'add-product' | 'dealers' | 'enquiries' | 'farmers' | 'settings' | 'images'>('products');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Product form state
  const [newProductType, setNewProductType] = useState<ProductCategory | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState<string | null>(null);
  const [addProductSuccess, setAddProductSuccess] = useState<string | null>(null);

  const selectedType = PRODUCT_TYPES.find(t => t.value === newProductType) || null;

  const updateProductField = (field: keyof typeof EMPTY_PRODUCT_FORM, value: string | boolean) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };

  // Object URLs are only freed when the component unmounts or the file changes,
  // so revoke the previous one on every swap to avoid leaking blobs.
  const handlePhotoChange = (file: File | null) => {
    setPhotoPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : '';
    });
    setProductPhoto(file);
  };

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const resetProductForm = () => {
    setProductForm(EMPTY_PRODUCT_FORM);
    handlePhotoChange(null);
    setAddProductError(null);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProduct || !selectedType) return;

    setAddProductError(null);
    setAddProductSuccess(null);

    if (!isApiConfigured) {
      setAddProductError(
        'Products are stored by the backend API, which is not reachable from this build. ' +
          'Start the local server (npm run dev) or point VITE_API_URL at a deployed API.'
      );
      return;
    }

    const form = new FormData();
    form.append('name', productForm.name);
    form.append('category', selectedType.value);
    form.append('commonName', productForm.commonName);
    form.append('activeIngredient', productForm.activeIngredient);
    form.append('formulation', productForm.formulation);
    form.append('dose', productForm.dose);
    form.append('packing', productForm.packing);
    form.append('targetCrops', productForm.targetCrops);
    form.append('modeOfAction', productForm.modeOfAction);
    form.append('benefits', productForm.benefits);
    form.append('safetyInstructions', productForm.safetyInstructions);
    form.append('storageInstructions', productForm.storageInstructions);
    form.append('badge', productForm.badge);
    form.append('popular', String(productForm.popular));
    // The targets box writes into whichever field this product type uses.
    form.append(selectedType.targetsField, productForm.targets);
    if (productPhoto) form.append('image', productPhoto);

    setSavingProduct(true);
    try {
      const result = await createProduct(form);
      if (result?.product) {
        setProductsList(prev => [...prev, result.product as Product]);
      }
      setAddProductSuccess(
        `${productForm.name} added to the ${selectedType.label} catalogue` +
          `${productPhoto ? ' with its photo' : ' (no photo yet)'}.`
      );
      resetProductForm();
    } catch (err: any) {
      setAddProductError(err?.message || 'Could not save the product. Please try again.');
    } finally {
      setSavingProduct(false);
    }
  };

  // Image mapping stats state
  const [imageStats, setImageStats] = useState<{
    totalProducts: number;
    imagesUploaded: number;
    imagesMissing: number;
    matchedProducts: any[];
    missingProducts: any[];
    duplicateImages: any[];
    unusedImages: any[];
  }>({
    totalProducts: 101,
    imagesUploaded: 0,
    imagesMissing: 101,
    matchedProducts: [],
    missingProducts: [],
    duplicateImages: [],
    unusedImages: [],
  });

  const [zipFile, setZipFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [imageManagerSubTab, setImageManagerSubTab] = useState<'summary' | 'matched' | 'missing' | 'duplicates' | 'unused'>('summary');

  const [showAddModal, setShowAddModal] = useState(false);

  // authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  /**
   * A token kept in sessionStorage survives a page refresh, so check whether it
   * is still valid before showing the login form again.
   */
  useEffect(() => {
    if (!getAdminToken()) return;
    adminMe()
      .then((user) => {
        setAdminUser(user);
        setIsLoggedIn(true);
      })
      .catch(() => clearAdminToken());
  }, []);

  /**
   * Credentials are checked by the backend, which then issues a session token.
   * Nothing about the password lives in this bundle any more - the old
   * `loginId === 'admin' && password === 'admin123'` comparison shipped the
   * real password to every visitor who opened DevTools.
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loggingIn) return;

    setLoginError('');
    setLoggingIn(true);
    try {
      const user = await adminLogin(loginId.trim(), password);
      setAdminUser(user);
      setIsLoggedIn(true);
      setLoginId('');
      setPassword('');
    } catch (err: any) {
      if (err?.status === 401) {
        setLoginError('Invalid Login ID or Password.');
      } else {
        setLoginError('Unable to connect to the admin service. Please try again.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setAdminUser(null);
    setIsLoggedIn(false);
    setEnquiries([]);
    setEnquiryStats(EMPTY_ENQUIRY_STATS);
  };

  // Mock pending dealers
  const [dealersList, setDealersList] = useState([
    { id: 'd1', firm: 'Kisan Krushi Kendra', name: 'Bhavik Patel', city: 'Gondal', phone: '+91 98250 12345', gst: '24AAAAA0000A1Z5', status: 'Pending', date: '2026-07-24' },
    { id: 'd2', firm: 'Saurashtra Agro Agency', name: 'Jayeshbhai Shah', city: 'Amreli', phone: '+91 99040 56789', gst: '24BBBBB1111B2Z6', status: 'Approved', date: '2026-07-23' },
    { id: 'd3', firm: 'Shree Ram Farm Products', name: 'Sanjay Kumar', city: 'Rajkot', phone: '+91 97120 98765', gst: '24CCCCC2222C3Z7', status: 'Pending', date: '2026-07-22' }
  ]);

  /* ---------------------------------------------------------------------- */
  /* Enquiries (live, from the database)                                     */
  /* ---------------------------------------------------------------------- */

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiryStats, setEnquiryStats] = useState<EnquiryStats>(EMPTY_ENQUIRY_STATS);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [enquiriesError, setEnquiriesError] = useState<string | null>(null);
  const [enquirySource, setEnquirySource] = useState<string>('');
  const [enquiryLoadedAt, setEnquiryLoadedAt] = useState<Date | null>(null);

  const [enquirySearch, setEnquirySearch] = useState('');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<'All' | EnquiryStatus>('All');
  const [enquiryTypeFilter, setEnquiryTypeFilter] = useState<string>('All');

  const [detailEnquiry, setDetailEnquiry] = useState<Enquiry | null>(null);
  const [detailNotes, setDetailNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /**
   * Pull the enquiry list fresh from the API. Every mutation calls this again
   * rather than patching local state blindly, so the table always shows what is
   * actually stored - including anything another admin changed meanwhile.
   */
  const loadEnquiries = React.useCallback(async () => {
    setEnquiriesLoading(true);
    setEnquiriesError(null);
    try {
      const { data, stats, source } = await fetchEnquiries();
      setEnquiries(data);
      setEnquiryStats(stats);
      setEnquirySource(source);
      setEnquiryLoadedAt(new Date());
    } catch (err: any) {
      // A dead session must return the operator to the login screen, not leave
      // them staring at an empty table wondering where the leads went.
      if (err instanceof ApiError && err.status === 401) {
        setIsLoggedIn(false);
        setAdminUser(null);
        setLoginError(err.message);
      }
      setEnquiriesError(
        err?.status === 0
          ? 'Cannot reach the API server. Start the backend, or set VITE_API_URL to the deployed API.'
          : err?.message || 'Could not load enquiries.'
      );
    } finally {
      setEnquiriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isApiConfigured) return;

    const fetchAdminData = async () => {
      try {
        // 1. Fetch Products
        const dbProducts = await fetchProducts();
        if (dbProducts && dbProducts.length > 0) {
          setProductsList(dbProducts);
        }

        // 2. Fetch Dealer Requests
        const dbDealers = await fetchDealers();
        if (dbDealers && dbDealers.length > 0) {
          setDealersList(dbDealers.map((d: any) => ({
            id: d.id,
            firm: d.firm_name,
            name: d.contact_person,
            city: d.city,
            phone: d.phone,
            gst: d.gst_number,
            status: d.status,
            date: new Date(d.created_at).toLocaleDateString()
          })));
        }

        // 3. Fetch Image Stats
        try {
          const stats = await fetchImageStats();
          setImageStats(stats);
        } catch (statsErr) {
          console.error('Error fetching image stats:', statsErr);
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
      }
    };

    fetchAdminData();
  }, []);

  // Enquiries need a token, so they load on sign-in rather than on mount.
  useEffect(() => {
    if (isLoggedIn) loadEnquiries();
  }, [isLoggedIn, loadEnquiries]);

  /* ---------------------------------------------------------------------- */
  /* Farmers (live, from the database - admin only)                          */
  /* ---------------------------------------------------------------------- */

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmerStats, setFarmerStats] = useState<FarmerStats>(EMPTY_FARMER_STATS);
  const [farmerFilterOptions, setFarmerFilterOptions] = useState<FarmerFilterOptions>(EMPTY_FARMER_FILTER_OPTIONS);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [farmersError, setFarmersError] = useState<string | null>(null);
  const [farmerSource, setFarmerSource] = useState('');
  const [farmersLoadedAt, setFarmersLoadedAt] = useState<Date | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  // Filters are held as the exact query the API expects, so the same object
  // drives the table AND the "export what I'm looking at" buttons - they can
  // never disagree about which rows are in scope.
  const [farmerFilters, setFarmerFilters] = useState({
    search: '', district: 'All', state: 'All', main_crop: 'All', status: 'All', irrigation: 'All'
  });

  const [detailFarmer, setDetailFarmer] = useState<Farmer | null>(null);
  const [farmerNotes, setFarmerNotes] = useState('');
  const [savingFarmer, setSavingFarmer] = useState(false);
  const [farmerBusyId, setFarmerBusyId] = useState<string | null>(null);
  const [confirmDeleteFarmer, setConfirmDeleteFarmer] = useState<Farmer | null>(null);

  /** What this signed-in role may do. The API enforces it; this only hides controls. */
  const farmerPerms = adminUser?.farmerPermissions || [];
  const canViewFarmers = farmerPerms.includes('view');
  const canEditFarmers = farmerPerms.includes('edit');
  const canDeleteFarmers = farmerPerms.includes('delete');
  const canExportFarmers = farmerPerms.includes('export');

  const loadFarmers = React.useCallback(async (filters = farmerFilters) => {
    setFarmersLoading(true);
    setFarmersError(null);
    try {
      const res = await fetchFarmers(filters);
      setFarmers(res.data);
      setFarmerStats(res.stats || EMPTY_FARMER_STATS);
      setFarmerFilterOptions(res.filterOptions);
      setFarmerSource(res.source);
      setFarmersLoadedAt(new Date());
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setIsLoggedIn(false);
        setAdminUser(null);
        setLoginError(err.message);
      }
      setFarmersError(
        err?.status === 403
          ? err.message
          : err?.status === 0
            ? 'Cannot reach the API server. Start the backend, or set VITE_API_URL to the deployed API.'
            : err?.message || 'Could not load farmer records.'
      );
    } finally {
      setFarmersLoading(false);
    }
  }, [farmerFilters]);

  // Filtering happens server-side so the counters, the rows and the exports all
  // describe one set. Debounced so typing in the search box is not one request
  // per keystroke.
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'farmers' || !canViewFarmers) return;
    const t = setTimeout(() => loadFarmers(farmerFilters), 300);
    return () => clearTimeout(t);
  }, [isLoggedIn, activeTab, canViewFarmers, farmerFilters, loadFarmers]);

  const setFarmerFilter = (key: keyof typeof farmerFilters, value: string) => {
    setFarmerFilters((prev) => ({ ...prev, [key]: value }));
  };

  const farmerFiltersActive =
    farmerFilters.search.trim() !== '' ||
    Object.entries(farmerFilters).some(([k, v]) => k !== 'search' && v !== 'All');

  const handleFarmerStatusChange = async (farmer: Farmer, status: FarmerStatus) => {
    setFarmerBusyId(farmer.id);
    setFarmersError(null);
    try {
      const updated = await apiUpdateFarmer(farmer.farmer_id, { status });
      setFarmers((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setDetailFarmer((prev) => (prev && prev.id === updated.id ? updated : prev));
      loadFarmers(farmerFilters);
    } catch (err: any) {
      setFarmersError(err?.message || 'Could not update the status.');
    } finally {
      setFarmerBusyId(null);
    }
  };

  const handleSaveFarmerNotes = async () => {
    if (!detailFarmer) return;
    setSavingFarmer(true);
    setFarmersError(null);
    try {
      const updated = await apiUpdateFarmer(detailFarmer.farmer_id, { admin_notes: farmerNotes });
      setFarmers((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setDetailFarmer(updated);
    } catch (err: any) {
      setFarmersError(err?.message || 'Could not save the notes.');
    } finally {
      setSavingFarmer(false);
    }
  };

  const handleDeleteFarmer = async (farmer: Farmer) => {
    setFarmerBusyId(farmer.id);
    setFarmersError(null);
    try {
      await apiDeleteFarmer(farmer.farmer_id);
      setConfirmDeleteFarmer(null);
      setDetailFarmer((prev) => (prev && prev.id === farmer.id ? null : prev));
      loadFarmers(farmerFilters);
    } catch (err: any) {
      setFarmersError(err?.message || 'Could not delete the record.');
    } finally {
      setFarmerBusyId(null);
    }
  };

  /** Exports always carry the CURRENT filters, so they match what is on screen. */
  const runExport = async (kind: 'excel' | 'pdf' | 'single', farmer?: Farmer) => {
    setExporting(kind === 'single' ? `single-${farmer?.id}` : kind);
    setFarmersError(null);
    try {
      if (kind === 'excel') await exportFarmersExcel(farmerFilters);
      else if (kind === 'pdf') await exportFarmersPdf(farmerFilters);
      else if (farmer) await exportFarmerPdf(farmer.farmer_id);
    } catch (err: any) {
      setFarmersError(err?.message || 'The export could not be generated.');
    } finally {
      setExporting(null);
    }
  };

  const openFarmerDetail = (farmer: Farmer) => {
    setDetailFarmer(farmer);
    setFarmerNotes(farmer.admin_notes || '');
  };

  const handleEnquiryStatusChange = async (id: string, status: EnquiryStatus) => {
    setRowBusyId(id);
    setEnquiriesError(null);
    try {
      const res = await apiUpdateEnquiryStatus(id, status);
      // Update the row in place for an instant response, then reconcile the
      // counters with the server.
      setEnquiries((prev) => prev.map((e) => (e.id === id ? res.enquiry : e)));
      setDetailEnquiry((prev) => (prev && prev.id === id ? res.enquiry : prev));
      loadEnquiries();
    } catch (err: any) {
      setEnquiriesError(err?.message || 'Could not update the status.');
    } finally {
      setRowBusyId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!detailEnquiry) return;
    setSavingNotes(true);
    setEnquiriesError(null);
    try {
      const res = await apiUpdateEnquiry(detailEnquiry.id, { admin_notes: detailNotes });
      setEnquiries((prev) => prev.map((e) => (e.id === res.enquiry.id ? res.enquiry : e)));
      setDetailEnquiry(res.enquiry);
    } catch (err: any) {
      setEnquiriesError(err?.message || 'Could not save the notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    setRowBusyId(id);
    setEnquiriesError(null);
    try {
      await apiDeleteEnquiry(id);
      setConfirmDeleteId(null);
      setDetailEnquiry((prev) => (prev && prev.id === id ? null : prev));
      loadEnquiries();
    } catch (err: any) {
      setEnquiriesError(err?.message || 'Could not delete the enquiry.');
    } finally {
      setRowBusyId(null);
    }
  };

  const openEnquiryDetail = (enquiry: Enquiry) => {
    setDetailEnquiry(enquiry);
    setDetailNotes(enquiry.admin_notes || '');
  };

  // Types come from the data rather than a fixed list, so a value added to the
  // website form shows up here without a code change.
  const enquiryTypes = Array.from(new Set(enquiries.map((e) => e.user_type).filter(Boolean))).sort();

  const filteredEnquiries = enquiries.filter((e) => {
    if (enquiryStatusFilter !== 'All' && e.status !== enquiryStatusFilter) return false;
    if (enquiryTypeFilter !== 'All' && e.user_type !== enquiryTypeFilter) return false;
    const q = enquirySearch.trim().toLowerCase();
    if (!q) return true;
    return [e.name, e.phone, e.email, e.city, e.message, e.admin_notes]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q));
  });

  const handleZipUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) {
      alert('Please select a ZIP file first');
      return;
    }
    setIsUploading(true);
    setUploadResult(null);
    try {
      const result = await uploadZipFile(zipFile, replaceExisting);
      setUploadResult(result);
      // Fetch updated stats
      const stats = await fetchImageStats();
      setImageStats(stats);
      // Fetch updated products list
      const dbProducts = await fetchProducts();
      if (dbProducts && dbProducts.length > 0) {
        setProductsList(dbProducts);
      }
      setZipFile(null);
      alert('ZIP Uploaded and Processed Successfully');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRematch = async () => {
    try {
      const res = await triggerRematch();
      alert(res.message || 'Re-matching completed');
      // Fetch updated stats
      const stats = await fetchImageStats();
      setImageStats(stats);
      // Fetch updated products list
      const dbProducts = await fetchProducts();
      if (dbProducts && dbProducts.length > 0) {
        setProductsList(dbProducts);
      }
    } catch (err: any) {
      alert('Re-matching failed: ' + err.message);
    }
  };

  const downloadMissingCSV = () => {
    const missing = imageStats.missingProducts;
    if (missing.length === 0) {
      alert('No missing products found!');
      return;
    }
    let csvContent = 'Product Name\n';
    missing.forEach(p => {
      csvContent += `"${p.name}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'missing-products.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = productsList.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveDealer = async (id: string | number) => {
    if (isApiConfigured) {
      try {
        await approveDealer(id);
      } catch (err: any) {
        alert('Failed to approve dealer: ' + err.message);
        return;
      }
    }
    setDealersList(prev => prev.map(d => d.id === id ? { ...d, status: 'Approved' } : d));
  };

  if (!isLoggedIn) {
    return (
      <section id="admin" className="py-16 bg-slate-950 text-white min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black font-display text-white">Super Admin Login</h2>
            <p className="text-xs text-slate-400 mt-1">Dr. CHEMISTAR Corporate CMS Control Panel</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold p-3.5 rounded-xl text-center">
                {loginError}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Login ID</label>
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter admin username"
                className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/10 flex items-center justify-center gap-2"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to CMS Portal</span>
              )}
            </button>

            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              Credentials are verified by the API server. Configure them with
              ADMIN_USERNAME / ADMIN_PASSWORD_HASH in the backend .env file.
            </p>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section id="admin" className="py-16 bg-slate-950 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Admin Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black font-display text-white">
                Dr. CHEMISTAR Corporate CMS Admin Panel
              </h2>
              <p className="text-xs text-slate-400">
                Head Office Rajkot • Signed in as{' '}
                <span className="font-bold text-slate-300">{adminUser?.username || 'admin'}</span>
                {adminUser?.role ? ` (${adminUser.role})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('CMS Report CSV generated & downloaded!')}
              className="bg-slate-850 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV System Report</span>
            </button>

            <button
              onClick={handleLogout}
              className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-500/20"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Executive Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Total Active Products</span>
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-display mt-2">{productsList.length}</div>
            <span className="text-[10px] text-emerald-400 font-bold">100% Synced from PDF</span>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Dealer Requests</span>
              <Building2 className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-3xl font-black text-white font-display mt-2">{dealersList.length}</div>
            <span className="text-[10px] text-amber-400 font-bold">2 Pending Approval</span>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">AI Doctor Diagnoses</span>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white font-display mt-2">12,480+</div>
            <span className="text-[10px] text-purple-400 font-bold">+184 Today</span>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Customer Enquiries</span>
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-display mt-2">{enquiryStats.total}</div>
            <span className="text-[10px] text-emerald-400 font-bold">{enquiryStats.New} new &middot; unhandled</span>
          </div>

        </div>

        {/* CMS Navigation Tabs */}
        <div className="flex flex-wrap bg-slate-900 p-1.5 rounded-2xl border border-slate-800 mb-8 max-w-3xl text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Product Management ({productsList.length})
          </button>
          <button
            onClick={() => setActiveTab('add-product')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'add-product' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <PackagePlus className="w-4 h-4" />
            Add Product
          </button>
          <button
            onClick={() => setActiveTab('dealers')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl transition-colors ${activeTab === 'dealers' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Dealer Approvals ({dealersList.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('enquiries');
              loadEnquiries();
            }}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl transition-colors ${activeTab === 'enquiries' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Enquiries ({enquiryStats.total})
          </button>
          {/* Only shown to roles that may read farmer records at all. */}
          {canViewFarmers && (
            <button
              onClick={() => setActiveTab('farmers')}
              className={`flex-1 min-w-[120px] py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'farmers' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Sprout className="w-4 h-4" />
              Farmers ({farmerStats.total})
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab('images');
              if (isApiConfigured) {
                fetchImageStats().then(setImageStats).catch(console.error);
              }
            }}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl transition-colors ${activeTab === 'images' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Image Manager ({imageStats.imagesUploaded}/{imageStats.totalProducts})
          </button>
        </div>

        {/* TAB 1: PRODUCT MANAGEMENT CRUD */}
        {activeTab === 'products' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter 101 products by name, active ingredient or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 pl-10 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() => setActiveTab('add-product')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product to Catalogue</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Technical Composition</th>
                    <th className="p-3">Dose</th>
                    <th className="p-3">Packing</th>
                    <th className="p-3 text-right">CMS Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {filteredProducts.slice(0, 15).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-850">
                      <td className="p-3 font-bold text-white font-display">{p.name}</td>
                      <td className="p-3">
                        <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-bold">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate">{p.commonName}</td>
                      <td className="p-3 text-slate-300">{p.dose}</td>
                      <td className="p-3 text-slate-400">{p.packing.join(', ')}</td>
                      <td className="p-3 text-right space-x-2">
                        <button 
                          onClick={() => alert(`Edit ${p.name}`)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg"
                          title="Edit Product"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm(`Delete ${p.name}?`)) {
                              if (isApiConfigured) {
                                try {
                                  await deleteProduct(p.id);
                                } catch (err: any) {
                                  alert('Failed to delete product from database: ' + err.message);
                                  return;
                                }
                              }
                              setProductsList(prev => prev.filter(item => item.id !== p.id));
                            }
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-400 rounded-lg"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-slate-400 text-center">
              Showing {Math.min(15, filteredProducts.length)} of {filteredProducts.length} filtered entries.
            </div>

          </div>
        )}

        {/* TAB 2: ADD PRODUCT (type first, then a form worded for that type) */}
        {activeTab === 'add-product' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-6">

            <div>
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-400" />
                Add a New Product
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pick the product type first - the form below adjusts its wording to match. The photo is
                optional and can be uploaded later from the Image Manager.
              </p>
            </div>

            {addProductSuccess && (
              <div className="bg-emerald-500/15 border border-emerald-400/40 p-4 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-100">
                  <p className="font-bold text-white">Product saved</p>
                  <p className="mt-1">{addProductSuccess}</p>
                </div>
                <button
                  onClick={() => setAddProductSuccess(null)}
                  className="ml-auto text-emerald-300 hover:text-white"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {addProductError && (
              <div role="alert" className="bg-red-500/15 border border-red-400/40 p-4 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-100">
                  <p className="font-bold text-white">Product not saved</p>
                  <p className="mt-1">{addProductError}</p>
                </div>
              </div>
            )}

            {/* STEP 1 - product type */}
            <div>
              <label className="text-[11px] text-slate-300 font-bold block mb-2">
                Step 1 &middot; Product Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {PRODUCT_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setNewProductType(type.value)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      newProductType === type.value
                        ? 'bg-emerald-600/20 border-emerald-500 shadow-glow-green'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xl block mb-1.5">{type.emoji}</span>
                    <span className="text-xs font-black text-white block font-display">{type.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-1 leading-snug">{type.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2 - details, worded for the chosen type */}
            {selectedType && (
              <form onSubmit={handleAddProduct} className="space-y-5">

                <div className="border-t border-slate-800 pt-5">
                  <label className="text-[11px] text-slate-300 font-bold block mb-3">
                    Step 2 &middot; {selectedType.label} Details
                  </label>

                  <div className="grid lg:grid-cols-3 gap-5">

                    {/* Photo uploader */}
                    <div className="lg:col-span-1">
                      <span className="text-[11px] text-slate-300 font-bold block mb-1.5">Product Photo</span>

                      <div className="bg-slate-950 border border-dashed border-slate-700 rounded-2xl p-4 text-center">
                        {photoPreview ? (
                          <div className="space-y-3">
                            <img
                              src={photoPreview}
                              alt="Selected product"
                              className="w-full h-40 object-contain rounded-xl bg-white"
                            />
                            <p className="text-[10px] text-slate-400 truncate">{productPhoto?.name}</p>
                            <button
                              type="button"
                              onClick={() => handlePhotoChange(null)}
                              className="text-[11px] font-bold text-rose-400 hover:text-rose-300 inline-flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              Remove photo
                            </button>
                          </div>
                        ) : (
                          <div className="py-6 space-y-2">
                            <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                            <p className="text-[11px] text-slate-400">No photo selected</p>
                          </div>
                        )}

                        <label className="mt-3 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{photoPreview ? 'Choose a different photo' : 'Choose photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>

                      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                        JPG, PNG or WebP up to 10 MB. It is converted to WebP and resized to 500&times;500
                        with a 150&times;150 thumbnail, exactly like the bulk ZIP import.
                      </p>
                    </div>

                    {/* Core fields */}
                    <div className="lg:col-span-2 space-y-4">

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-slate-300 font-bold block mb-1.5">Product Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ROKET SUPER"
                            value={productForm.name}
                            onChange={(e) => updateProductField('name', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 font-bold block mb-1.5">Common / Trade Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Imidacloprid 17.8% SL"
                            value={productForm.commonName}
                            onChange={(e) => updateProductField('commonName', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-slate-300 font-bold block mb-1.5">Active Ingredient</label>
                          <input
                            type="text"
                            placeholder="Technical composition"
                            value={productForm.activeIngredient}
                            onChange={(e) => updateProductField('activeIngredient', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 font-bold block mb-1.5">Formulation</label>
                          <input
                            type="text"
                            placeholder={selectedType.formulationPlaceholder}
                            value={productForm.formulation}
                            onChange={(e) => updateProductField('formulation', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-slate-300 font-bold block mb-1.5">Dose</label>
                          <input
                            type="text"
                            placeholder={selectedType.dosePlaceholder}
                            value={productForm.dose}
                            onChange={(e) => updateProductField('dose', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 font-bold block mb-1.5">Packing Sizes</label>
                          <input
                            type="text"
                            placeholder="250 ml, 500 ml, 1 Ltr."
                            value={productForm.packing}
                            onChange={(e) => updateProductField('packing', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Type-specific: label and destination field both follow the chosen type */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-emerald-300 font-bold block mb-1.5">
                            {selectedType.targetsLabel}
                          </label>
                          <input
                            type="text"
                            placeholder={selectedType.targetsPlaceholder}
                            value={productForm.targets}
                            onChange={(e) => updateProductField('targets', e.target.value)}
                            className="w-full bg-slate-950 border border-emerald-800/60 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 font-bold block mb-1.5">Target Crops</label>
                          <input
                            type="text"
                            placeholder="Cotton, Paddy, Chilli, Vegetables"
                            value={productForm.targetCrops}
                            onChange={(e) => updateProductField('targetCrops', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 font-bold block mb-1.5">Mode of Action</label>
                        <textarea
                          rows={2}
                          placeholder="How the product works on the crop"
                          value={productForm.modeOfAction}
                          onChange={(e) => updateProductField('modeOfAction', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 font-bold block mb-1.5">
                          Key Benefits <span className="text-slate-500 font-medium">(one per line)</span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder={'Quick knockdown action\nLong residual protection\nSafe for beneficial insects'}
                          value={productForm.benefits}
                          onChange={(e) => updateProductField('benefits', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-slate-300 font-bold block mb-1.5">Safety Instructions</label>
                          <input
                            type="text"
                            placeholder="Protective gear, re-entry interval"
                            value={productForm.safetyInstructions}
                            onChange={(e) => updateProductField('safetyInstructions', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 font-bold block mb-1.5">Storage Instructions</label>
                          <input
                            type="text"
                            placeholder="Cool dry place, away from children"
                            value={productForm.storageInstructions}
                            onChange={(e) => updateProductField('storageInstructions', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className="text-[11px] text-slate-300 font-bold block mb-1.5">
                            Badge <span className="text-slate-500 font-medium">(optional ribbon)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Best Seller, New Launch"
                            value={productForm.badge}
                            onChange={(e) => updateProductField('badge', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <label className="flex items-center gap-2.5 text-xs text-slate-300 font-bold cursor-pointer pb-2.5">
                          <input
                            type="checkbox"
                            checked={productForm.popular}
                            onChange={(e) => updateProductField('popular', e.target.checked)}
                            className="w-4 h-4 rounded accent-emerald-500"
                          />
                          Mark as a popular product
                        </label>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2"
                  >
                    {savingProduct ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving product...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Save {selectedType.label} to Catalogue</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetProductForm}
                    disabled={savingProduct}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white font-bold text-xs px-5 py-3 rounded-xl"
                  >
                    Clear Form
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

        {/* TAB 3: DEALER APPROVAL QUEUE */}
        {activeTab === 'dealers' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Authorized Dealer Registration Queue
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase font-black border-b border-slate-800">
                    <th className="p-3">Firm Name</th>
                    <th className="p-3">Proprietor</th>
                    <th className="p-3">City</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {dealersList.map((d) => (
                    <tr key={d.id}>
                      <td className="p-3 font-bold text-white">{d.firm}</td>
                      <td className="p-3 text-slate-300">{d.name} ({d.phone})</td>
                      <td className="p-3 text-slate-300">{d.city}</td>
                      <td className="p-3 font-mono text-slate-400">{d.gst}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {d.status === 'Pending' && (
                          <button
                            onClick={() => handleApproveDealer(d.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Approve License
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER ENQUIRIES (live from the database) */}
        {activeTab === 'enquiries' && (
          <div className="space-y-6">

            {/* Enquiry counters - every number comes from the API response */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {([
                { label: 'Total', value: enquiryStats.total, tone: 'text-white' },
                { label: 'New', value: enquiryStats.New, tone: 'text-sky-400' },
                { label: 'Contacted', value: enquiryStats.Contacted, tone: 'text-amber-400' },
                { label: 'In Progress', value: enquiryStats['In Progress'], tone: 'text-purple-400' },
                { label: 'Resolved', value: enquiryStats.Resolved, tone: 'text-emerald-400' }
              ]).map((card) => (
                <div key={card.label} className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{card.label}</span>
                  <div className={`text-3xl font-black font-display mt-2 ${card.tone}`}>{card.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-5">

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-emerald-400" />
                    Customer Enquiries
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Every submission from the website contact form, newest first.
                    {enquiryLoadedAt && (
                      <> Last refreshed {enquiryLoadedAt.toLocaleTimeString()}.</>
                    )}
                    {enquirySource === 'local-json' && (
                      <span className="text-amber-400 font-bold">
                        {' '}Served from the local JSON fallback - MongoDB was unreachable at server start.
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={loadEnquiries}
                  disabled={enquiriesLoading}
                  className="bg-slate-850 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${enquiriesLoading ? 'animate-spin' : ''}`} />
                  <span>{enquiriesLoading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>

              {enquiriesError && (
                <div role="alert" className="bg-red-500/15 border border-red-400/40 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-100">
                    <p className="font-bold text-white">Enquiries could not be loaded</p>
                    <p className="mt-1">{enquiriesError}</p>
                  </div>
                </div>
              )}

              {/* Search + filters */}
              <div className="space-y-3">
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search name, phone, email, city or message..."
                    value={enquirySearch}
                    onChange={(e) => setEnquirySearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 pl-10 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mr-1">Status:</span>
                  {(['All', ...ENQUIRY_STATUSES] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setEnquiryStatusFilter(s as 'All' | EnquiryStatus)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                        enquiryStatusFilter === s
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {s}
                      {s !== 'All' && ` (${enquiryStats[s as EnquiryStatus] ?? 0})`}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mr-1">Type:</span>
                  <select
                    value={enquiryTypeFilter}
                    onChange={(e) => setEnquiryTypeFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="All">All types</option>
                    {enquiryTypes.map((tp) => (
                      <option key={tp} value={tp}>{tp}</option>
                    ))}
                  </select>

                  {(enquirySearch || enquiryStatusFilter !== 'All' || enquiryTypeFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setEnquirySearch('');
                        setEnquiryStatusFilter('All');
                        setEnquiryTypeFilter('All');
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:text-white underline"
                    >
                      Clear filters
                    </button>
                  )}

                  <span className="text-[11px] text-slate-500 font-semibold ml-auto">
                    Showing {filteredEnquiries.length} of {enquiries.length}
                  </span>
                </div>
              </div>

              {/* Enquiry table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                      <th className="p-3">Ref</th>
                      <th className="p-3">Date / Time</th>
                      <th className="p-3">Full Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Message</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {filteredEnquiries.map((e) => {
                      const next = NEXT_STATUS[e.status];
                      const busy = rowBusyId === e.id;
                      return (
                        <tr key={e.id} className="hover:bg-slate-850 align-top">
                          <td className="p-3 font-mono text-[10px] text-slate-500">#{shortRef(e.id)}</td>
                          <td className="p-3 text-slate-300 whitespace-nowrap">{formatDateTime(e.created_at)}</td>
                          <td className="p-3 font-bold text-white">{e.name}</td>
                          <td className="p-3 text-slate-300 whitespace-nowrap">
                            <a href={`tel:${e.phone}`} className="hover:text-emerald-400">{e.phone}</a>
                          </td>
                          <td className="p-3 text-slate-300">
                            {e.email ? (
                              <a href={`mailto:${e.email}`} className="hover:text-emerald-400 break-all">{e.email}</a>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300">{e.city}</td>
                          <td className="p-3">
                            <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-bold whitespace-nowrap">
                              {e.user_type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 max-w-[220px]">
                            <span className="line-clamp-2">{e.message}</span>
                            {e.message.length > 80 && (
                              <button
                                onClick={() => openEnquiryDetail(e)}
                                className="text-emerald-400 hover:text-emerald-300 font-bold mt-1 block"
                              >
                                View Details
                              </button>
                            )}
                          </td>
                          <td className="p-3">
                            <select
                              value={e.status}
                              disabled={busy}
                              onChange={(ev) => handleEnquiryStatusChange(e.id, ev.target.value as EnquiryStatus)}
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border bg-slate-950 focus:outline-none disabled:opacity-50 ${STATUS_STYLES[e.status]}`}
                            >
                              {ENQUIRY_STATUSES.map((s) => (
                                <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-slate-400 max-w-[160px]">
                            {e.admin_notes
                              ? <span className="line-clamp-2">{e.admin_notes}</span>
                              : <span className="text-slate-600">-</span>}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => openEnquiryDetail(e)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg"
                              title="View full enquiry"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {next && (
                              <button
                                onClick={() => handleEnquiryStatusChange(e.id, next)}
                                disabled={busy}
                                className="px-2 py-1.5 bg-emerald-700/40 hover:bg-emerald-600/50 disabled:opacity-50 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/20"
                                title={`Mark as ${next}`}
                              >
                                {busy ? '...' : `Mark ${next}`}
                              </button>
                            )}

                            <button
                              onClick={() => setConfirmDeleteId(e.id)}
                              disabled={busy}
                              className="p-1.5 bg-slate-800 hover:bg-rose-900/50 disabled:opacity-50 text-rose-400 rounded-lg"
                              title="Delete enquiry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredEnquiries.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-500 font-bold">
                          {enquiriesLoading
                            ? 'Loading enquiries...'
                            : enquiries.length === 0
                              ? 'No enquiries have been submitted yet.'
                              : 'No enquiries match the current search and filters.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Enquiry detail drawer - the full submission, nothing truncated */}
        {detailEnquiry && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setDetailEnquiry(null)}
          >
            <div
              className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl my-8"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-black text-white font-display">{detailEnquiry.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Reference #{shortRef(detailEnquiry.id)} &middot; {formatDateTime(detailEnquiry.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLES[detailEnquiry.status]}`}>
                    {detailEnquiry.status}
                  </span>
                  <button
                    onClick={() => setDetailEnquiry(null)}
                    className="text-slate-400 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 text-xs">

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </span>
                    <a href={`tel:${detailEnquiry.phone}`} className="block mt-1 font-bold text-white hover:text-emerald-400">
                      {detailEnquiry.phone}
                    </a>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </span>
                    {detailEnquiry.email ? (
                      <a href={`mailto:${detailEnquiry.email}`} className="block mt-1 font-bold text-white hover:text-emerald-400 break-all">
                        {detailEnquiry.email}
                      </a>
                    ) : (
                      <span className="block mt-1 text-slate-600 font-bold">Not provided</span>
                    )}
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> City / District
                    </span>
                    <span className="block mt-1 font-bold text-white">{detailEnquiry.city}</span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Inquiring as
                    </span>
                    <span className="block mt-1 font-bold text-emerald-400">{detailEnquiry.user_type}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Message / Product Inquiry</span>
                  <p className="mt-1.5 bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                    {detailEnquiry.message}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Internal Admin Notes</span>
                  <textarea
                    rows={3}
                    value={detailNotes}
                    onChange={(ev) => setDetailNotes(ev.target.value)}
                    placeholder="Record what was discussed, quotes sent, follow-up dates..."
                    className="mt-1.5 w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes || detailNotes === (detailEnquiry.admin_notes || '')}
                    className="mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[11px] px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{savingNotes ? 'Saving...' : 'Save notes'}</span>
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-2">Update status</span>
                  <div className="flex flex-wrap gap-2">
                    {ENQUIRY_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleEnquiryStatusChange(detailEnquiry.id, s)}
                        disabled={rowBusyId === detailEnquiry.id || detailEnquiry.status === s}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          detailEnquiry.status === s
                            ? STATUS_STYLES[s]
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {detailEnquiry.status === s ? `${s} (current)` : `Mark as ${s}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3">
                    Last updated {formatDateTime(detailEnquiry.updated_at)}.
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-4 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/${detailEnquiry.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Reply on WhatsApp
                  </a>
                  <button
                    onClick={() => setConfirmDeleteId(detailEnquiry.id)}
                    className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-bold text-[11px] px-4 py-2 rounded-xl border border-rose-500/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete enquiry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation - deliberately a second, explicit step. A lead is
            unrecoverable once removed, so it must never go on a single click. */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-rose-500/30 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-base font-black text-white font-display">Delete this enquiry?</h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Enquiry <span className="font-mono font-bold text-white">#{shortRef(confirmDeleteId)}</span> will
                be permanently removed from the database. This cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteEnquiry(confirmDeleteId)}
                  disabled={rowBusyId === confirmDeleteId}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
                >
                  {rowBusyId === confirmDeleteId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Yes, delete it
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: FARMER DATABASE (admin only, role-gated) */}
        {activeTab === 'farmers' && canViewFarmers && (
          <div className="space-y-6">

            {/* Counters - describe the FILTERED set, so they always match the rows below */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                { label: 'Total Farmers', value: farmerStats.total, tone: 'text-white', hint: farmerFiltersActive ? 'matching filters' : 'registered' },
                { label: 'New This Month', value: farmerStats.newThisMonth, tone: 'text-sky-400', hint: 'since the 1st' },
                { label: 'Active', value: farmerStats.byStatus.Active, tone: 'text-emerald-400', hint: 'engaged farmers' },
                { label: 'New / Uncontacted', value: farmerStats.byStatus.New, tone: 'text-amber-400', hint: 'need a first call' }
              ]).map((c) => (
                <div key={c.label} className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold">{c.label}</span>
                  <div className={`text-3xl font-black font-display mt-2 ${c.tone}`}>{c.value}</div>
                  <span className="text-[10px] text-slate-500 font-bold">{c.hint}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-5">

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-400" />
                    Farmer Database
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Registrations from the public /farmer page, newest first.
                    {farmersLoadedAt && <> Last refreshed {farmersLoadedAt.toLocaleTimeString()}.</>}
                    {farmerSource === 'local-json' && (
                      <span className="text-amber-400 font-bold">
                        {' '}Served from the local JSON fallback - MongoDB was unreachable at server start.
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Personal data. Every view, edit and export is written to the audit log.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => loadFarmers(farmerFilters)}
                    disabled={farmersLoading}
                    className="bg-slate-850 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${farmersLoading ? 'animate-spin' : ''}`} />
                    <span>{farmersLoading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>

                  {/* Export is director-only by default - hidden entirely otherwise. */}
                  {canExportFarmers && (
                    <>
                      <button
                        onClick={() => runExport('excel')}
                        disabled={exporting !== null || farmers.length === 0}
                        className="bg-emerald-700/40 hover:bg-emerald-600/50 disabled:opacity-50 text-emerald-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-500/20 flex items-center gap-2"
                        title="Download the farmers currently listed as an Excel workbook"
                      >
                        {exporting === 'excel'
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <FileSpreadsheet className="w-4 h-4" />}
                        <span>Excel</span>
                      </button>

                      <button
                        onClick={() => runExport('pdf')}
                        disabled={exporting !== null || farmers.length === 0}
                        className="bg-rose-900/30 hover:bg-rose-800/40 disabled:opacity-50 text-rose-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-500/20 flex items-center gap-2"
                        title="Download the farmers currently listed as a PDF report"
                      >
                        {exporting === 'pdf'
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <FileDown className="w-4 h-4" />}
                        <span>PDF</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {farmersError && (
                <div role="alert" className="bg-red-500/15 border border-red-400/40 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-100">
                    <p className="font-bold text-white">Farmer records</p>
                    <p className="mt-1">{farmersError}</p>
                  </div>
                </div>
              )}

              {/* Search + filters */}
              <div className="space-y-3">
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search ID, name, mobile, village, city, district or crop..."
                    value={farmerFilters.search}
                    onChange={(e) => setFarmerFilter('search', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 pl-10 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {([
                    { key: 'status' as const, label: 'Status', values: [...FARMER_STATUSES] },
                    { key: 'district' as const, label: 'District', values: farmerFilterOptions.districts },
                    { key: 'state' as const, label: 'State', values: farmerFilterOptions.states },
                    { key: 'main_crop' as const, label: 'Crop', values: farmerFilterOptions.crops },
                    { key: 'irrigation' as const, label: 'Irrigation', values: farmerFilterOptions.irrigation }
                  ]).map((f) => (
                    <select
                      key={f.key}
                      value={farmerFilters[f.key]}
                      onChange={(e) => setFarmerFilter(f.key, e.target.value)}
                      className={`bg-slate-950 border text-white px-3 py-2 rounded-lg text-[11px] font-bold focus:outline-none focus:border-emerald-500 ${
                        farmerFilters[f.key] !== 'All' ? 'border-emerald-500/50 text-emerald-300' : 'border-slate-800'
                      }`}
                    >
                      <option value="All">{f.label}: All</option>
                      {f.values.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ))}

                  {farmerFiltersActive && (
                    <button
                      onClick={() => setFarmerFilters({ search: '', district: 'All', state: 'All', main_crop: 'All', status: 'All', irrigation: 'All' })}
                      className="text-[11px] font-bold text-slate-400 hover:text-white underline"
                    >
                      Clear filters
                    </button>
                  )}

                  <span className="text-[11px] text-slate-500 font-semibold ml-auto">
                    {farmers.length} record{farmers.length === 1 ? '' : 's'}
                    {farmerFiltersActive && ' matching'}
                  </span>
                </div>
              </div>

              {/* Farmer table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                      <th className="p-3">Farmer ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Village</th>
                      <th className="p-3">City</th>
                      <th className="p-3">District</th>
                      <th className="p-3">State</th>
                      <th className="p-3">Crop</th>
                      <th className="p-3">Farm Area</th>
                      <th className="p-3">Registered</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {farmers.map((f) => {
                      const busy = farmerBusyId === f.id;
                      return (
                        <tr key={f.id} className="hover:bg-slate-850">
                          <td className="p-3 font-mono text-[10px] text-emerald-400 font-bold whitespace-nowrap">{f.farmer_id}</td>
                          <td className="p-3 font-bold text-white">{f.farmer_name}</td>
                          <td className="p-3 text-slate-300 whitespace-nowrap">
                            <a href={`tel:${f.mobile}`} className="hover:text-emerald-400">{f.mobile}</a>
                          </td>
                          <td className="p-3 text-slate-300">{f.village || <span className="text-slate-600">-</span>}</td>
                          <td className="p-3 text-slate-300">{f.city || <span className="text-slate-600">-</span>}</td>
                          <td className="p-3 text-slate-300">{f.district || <span className="text-slate-600">-</span>}</td>
                          <td className="p-3 text-slate-300">{f.state || <span className="text-slate-600">-</span>}</td>
                          <td className="p-3">
                            {f.main_crop
                              ? <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-bold whitespace-nowrap">{f.main_crop}</span>
                              : <span className="text-slate-600">-</span>}
                          </td>
                          <td className="p-3 text-slate-300 whitespace-nowrap">
                            {f.farm_area ? `${f.farm_area} ${f.land_unit || ''}`.trim() : <span className="text-slate-600">-</span>}
                          </td>
                          <td className="p-3 text-slate-300 whitespace-nowrap">{formatDateOnly(f.created_at)}</td>
                          <td className="p-3">
                            {canEditFarmers ? (
                              <select
                                value={f.status}
                                disabled={busy}
                                onChange={(e) => handleFarmerStatusChange(f, e.target.value as FarmerStatus)}
                                className={`px-2 py-1 rounded-full text-[10px] font-bold border bg-slate-950 focus:outline-none disabled:opacity-50 ${FARMER_STATUS_STYLES[f.status]}`}
                              >
                                {FARMER_STATUSES.map((s) => (
                                  <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${FARMER_STATUS_STYLES[f.status]}`}>
                                {f.status}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => openFarmerDetail(f)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg"
                              title="View full farmer record"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {canExportFarmers && (
                              <button
                                onClick={() => runExport('single', f)}
                                disabled={exporting !== null}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-rose-300 rounded-lg"
                                title="Download this farmer's profile as a PDF"
                              >
                                {exporting === `single-${f.id}`
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <FileDown className="w-3.5 h-3.5" />}
                              </button>
                            )}

                            {canDeleteFarmers && (
                              <button
                                onClick={() => setConfirmDeleteFarmer(f)}
                                disabled={busy}
                                className="p-1.5 bg-slate-800 hover:bg-rose-900/50 disabled:opacity-50 text-rose-400 rounded-lg"
                                title="Delete farmer record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {farmers.length === 0 && (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-slate-500 font-bold">
                          {farmersLoading
                            ? 'Loading farmer records...'
                            : farmerFiltersActive
                              ? 'No farmers match the current search and filters.'
                              : 'No farmers have registered yet. Share drchemistar.com/farmer to start collecting registrations.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Top districts / crops - what the sales team actually asks for */}
              {farmerStats.total > 0 && (
                <div className="grid sm:grid-cols-2 gap-4 border-t border-slate-800 pt-5">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-black mb-2">Top Districts</h4>
                    <div className="flex flex-wrap gap-2">
                      {farmerStats.byDistrict.slice(0, 8).map((d) => (
                        <button
                          key={d.name}
                          onClick={() => setFarmerFilter('district', d.name)}
                          className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                        >
                          {d.name} <span className="text-emerald-400">{d.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-black mb-2">Top Crops</h4>
                    <div className="flex flex-wrap gap-2">
                      {farmerStats.byCrop.slice(0, 8).map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setFarmerFilter('main_crop', c.name)}
                          className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                        >
                          {c.name} <span className="text-emerald-400">{c.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Farmer detail drawer - the complete registration */}
        {detailFarmer && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setDetailFarmer(null)}
          >
            <div
              className="bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-800 shadow-2xl my-8"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-black text-white font-display">{detailFarmer.farmer_name}</h3>
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono font-bold">
                    {detailFarmer.farmer_id}
                    <span className="text-slate-500 font-sans font-normal">
                      {' '}&middot; registered {formatDateTime(detailFarmer.created_at)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${FARMER_STATUS_STYLES[detailFarmer.status]}`}>
                    {detailFarmer.status}
                  </span>
                  <button onClick={() => setDetailFarmer(null)} className="text-slate-400 hover:text-white" aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 text-xs">
                {([
                  {
                    title: 'Contact',
                    rows: [
                      ['Mobile', detailFarmer.mobile],
                      ['Alternate Mobile', detailFarmer.alternate_mobile],
                      ['Email', detailFarmer.email],
                      ['Gender', detailFarmer.gender],
                      ['Age', detailFarmer.age]
                    ]
                  },
                  {
                    title: 'Location',
                    rows: [
                      ['Village', detailFarmer.village],
                      ['City / Taluka', detailFarmer.city],
                      ['District', detailFarmer.district],
                      ['State', detailFarmer.state],
                      ['PIN Code', detailFarmer.pincode]
                    ]
                  },
                  {
                    title: 'Farm',
                    rows: [
                      ['Farm Area', detailFarmer.farm_area ? `${detailFarmer.farm_area} ${detailFarmer.land_unit || ''}`.trim() : ''],
                      ['Irrigation', detailFarmer.irrigation],
                      ['Soil Type', detailFarmer.soil_type],
                      ['Farming Type', detailFarmer.farming_type],
                      ['Experience', detailFarmer.farming_experience]
                    ]
                  },
                  {
                    title: 'Crops',
                    rows: [
                      ['Main Crop', detailFarmer.main_crop],
                      ['Other Crops', detailFarmer.other_crops.join(', ')],
                      ['Current Season', detailFarmer.current_season],
                      ['Crop Area', detailFarmer.crop_area],
                      ['Interested In', detailFarmer.interests.join(', ')]
                    ]
                  }
                ]).map((group) => (
                  <div key={group.title}>
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-black mb-2">{group.title}</h4>
                    <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/70">
                      {group.rows.map(([label, value]) => (
                        <div key={label} className="flex gap-4 px-4 py-2.5">
                          <span className="text-slate-500 font-bold w-36 flex-shrink-0">{label}</span>
                          <span className={value ? 'text-white font-semibold break-words' : 'text-slate-600'}>
                            {value || 'Not provided'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {detailFarmer.message && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-black mb-2">Farmer's Message</h4>
                    <p className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                      {detailFarmer.message}
                    </p>
                  </div>
                )}

                {canEditFarmers && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-black mb-2">Internal Admin Notes</h4>
                    <textarea
                      rows={3}
                      value={farmerNotes}
                      onChange={(ev) => setFarmerNotes(ev.target.value)}
                      placeholder="Visit notes, products recommended, follow-up date..."
                      className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleSaveFarmerNotes}
                      disabled={savingFarmer || farmerNotes === (detailFarmer.admin_notes || '')}
                      className="mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[11px] px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      {savingFarmer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savingFarmer ? 'Saving...' : 'Save notes'}</span>
                    </button>
                  </div>
                )}

                {canEditFarmers && (
                  <div className="border-t border-slate-800 pt-4">
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-black mb-2">Update Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {FARMER_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleFarmerStatusChange(detailFarmer, s)}
                          disabled={farmerBusyId === detailFarmer.id || detailFarmer.status === s}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            detailFarmer.status === s
                              ? FARMER_STATUS_STYLES[s]
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          {detailFarmer.status === s ? `${s} (current)` : `Mark as ${s}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-4 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/${detailFarmer.mobile.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${detailFarmer.mobile}`}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>

                  {canExportFarmers && (
                    <button
                      onClick={() => runExport('single', detailFarmer)}
                      disabled={exporting !== null}
                      className="bg-rose-900/30 hover:bg-rose-800/40 disabled:opacity-50 text-rose-300 font-bold text-[11px] px-4 py-2 rounded-xl border border-rose-500/20 flex items-center gap-2"
                    >
                      {exporting === `single-${detailFarmer.id}`
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <FileDown className="w-3.5 h-3.5" />}
                      Download PDF
                    </button>
                  )}

                  {canDeleteFarmers && (
                    <button
                      onClick={() => setConfirmDeleteFarmer(detailFarmer)}
                      className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-bold text-[11px] px-4 py-2 rounded-xl border border-rose-500/20 flex items-center gap-2 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete record
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Farmer delete confirmation - a registration is unrecoverable once gone */}
        {confirmDeleteFarmer && (
          <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-rose-500/30 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-base font-black text-white font-display">Delete this farmer?</h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-white">{confirmDeleteFarmer.farmer_name}</span>{' '}
                (<span className="font-mono text-emerald-400">{confirmDeleteFarmer.farmer_id}</span>)
                will be permanently removed from the farmer database. This cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteFarmer(confirmDeleteFarmer)}
                  disabled={farmerBusyId === confirmDeleteFarmer.id}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
                >
                  {farmerBusyId === confirmDeleteFarmer.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Yes, delete it
                </button>
                <button
                  onClick={() => setConfirmDeleteFarmer(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: IMAGE MANAGER */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            
            {/* Image Manager Stats Header */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Total Products</span>
                  <Layers className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-3xl font-black text-white font-display mt-2">
                  {imageStats.totalProducts}
                </div>
                <span className="text-[10px] text-slate-500">In Catalogue</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Images Uploaded</span>
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-emerald-400 font-display mt-2">
                  {imageStats.imagesUploaded}
                </div>
                <span className="text-[10px] text-emerald-500 font-bold">
                  {Math.round((imageStats.imagesUploaded / (imageStats.totalProducts || 1)) * 100)}% Coverage
                </span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Images Missing</span>
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div className="text-3xl font-black text-rose-400 font-display mt-2">
                  {imageStats.imagesMissing}
                </div>
                <span className="text-[10px] text-rose-500 font-semibold">Needs Attention</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Duplicates / Unused</span>
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-amber-400 font-display mt-2">
                  {imageStats.duplicateImages.length + imageStats.unusedImages.length}
                </div>
                <span className="text-[10px] text-amber-500">In Last Upload</span>
              </div>
            </div>

            {/* Main ZIP Upload Control Box */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                Bulk Upload Product Images (ZIP)
              </h3>

              <form onSubmit={handleZipUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-8 text-center bg-slate-950/40 transition-colors relative">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setZipFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    {zipFile ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-400">{zipFile.name}</p>
                        <p className="text-[10px] text-slate-500">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-300">Click to browse or drag ZIP file here</p>
                        <p className="text-[10px] text-slate-500">Supports .zip containing JPG, JPEG, PNG, or WEBP images</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="replaceExistingCheck"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded bg-slate-950 border-slate-800 focus:ring-0"
                    />
                    <label htmlFor="replaceExistingCheck" className="text-xs font-bold text-slate-300 cursor-pointer">
                      Replace Existing Images
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={downloadMissingCSV}
                      className="bg-slate-850 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Missing List (.CSV)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRematch}
                      className="bg-slate-850 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Re-match Images</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isUploading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mapping Images via OCR...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Upload & Match ZIP</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Last Upload Result Box (Conditional Summary) */}
            {uploadResult && (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                  <h4 className="font-extrabold text-white text-base">ZIP Uploaded Successfully</h4>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/50 text-center">
                    <div className="text-2xl font-black text-white">{uploadResult.stats.totalProducts}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">Total Products</div>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/50 text-center">
                    <div className="text-2xl font-black text-emerald-400">{uploadResult.stats.imagesFound}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">Images Found</div>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/50 text-center">
                    <div className="text-2xl font-black text-teal-400">{uploadResult.stats.imagesMatched}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">Images Matched</div>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/50 text-center">
                    <div className="text-2xl font-black text-rose-400">{uploadResult.stats.missingImages}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">Products Missing Images</div>
                  </div>
                </div>

                <div className="flex bg-slate-950/60 p-1.5 rounded-xl border border-slate-850 text-[10px] font-bold max-w-max gap-1">
                  <button 
                    type="button"
                    onClick={() => setImageManagerSubTab('matched')}
                    className={`px-3 py-1.5 rounded-lg ${imageManagerSubTab === 'matched' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  >
                    Matched ({uploadResult.matchedProducts.length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setImageManagerSubTab('missing')}
                    className={`px-3 py-1.5 rounded-lg ${imageManagerSubTab === 'missing' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  >
                    Missing ({uploadResult.missingProducts.length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setImageManagerSubTab('duplicates')}
                    className={`px-3 py-1.5 rounded-lg ${imageManagerSubTab === 'duplicates' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  >
                    Duplicates ({uploadResult.duplicateImages.length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setImageManagerSubTab('unused')}
                    className={`px-3 py-1.5 rounded-lg ${imageManagerSubTab === 'unused' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  >
                    Unused ({uploadResult.unusedImages.length})
                  </button>
                </div>

                <div className="bg-slate-950/60 rounded-2xl border border-slate-850 p-4 max-h-[250px] overflow-y-auto text-xs">
                  {imageManagerSubTab === 'matched' && (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 font-bold border-b border-slate-900 pb-2">
                          <th className="pb-2">Product Name</th>
                          <th className="pb-2">Uploaded Image File</th>
                          <th className="pb-2">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40">
                        {uploadResult.matchedProducts.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/20">
                            <td className="py-2 text-white font-bold">{p.name}</td>
                            <td className="py-2 text-emerald-400 font-mono">{p.filename}</td>
                            <td className="py-2 text-slate-400 capitalize">{p.matchReason.replace('_', ' ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {imageManagerSubTab === 'missing' && (
                    <div className="space-y-1">
                      <p className="text-slate-400 font-semibold mb-2">The following products lack images:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {uploadResult.missingProducts.map((p: any, idx: number) => (
                          <div key={idx} className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 text-[11px] text-slate-300 font-bold">
                            {p.name} <span className="text-[9px] text-slate-500 font-medium">({p.category})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {imageManagerSubTab === 'duplicates' && (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 font-bold border-b border-slate-900 pb-2">
                          <th className="pb-2">Duplicate Image File</th>
                          <th className="pb-2">Target Product</th>
                          <th className="pb-2">Already Matched By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40">
                        {uploadResult.duplicateImages.map((p: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 text-amber-400 font-mono">{p.filename}</td>
                            <td className="py-2 text-white font-bold">{p.productName}</td>
                            <td className="py-2 text-slate-400 font-mono">{p.existingMatch}</td>
                          </tr>
                        ))}
                        {uploadResult.duplicateImages.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-slate-500 font-bold">No duplicate image conflicts found in this upload.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {imageManagerSubTab === 'unused' && (
                    <div className="space-y-2">
                      <p className="text-slate-400 font-semibold">The following image files were uploaded but could not be mapped to any product name:</p>
                      <div className="flex flex-wrap gap-2">
                        {uploadResult.unusedImages.map((fn: string, idx: number) => (
                          <span key={idx} className="bg-slate-900 text-slate-400 font-mono text-[10px] px-2.5 py-1 rounded-md border border-slate-800">
                            {fn}
                          </span>
                        ))}
                        {uploadResult.unusedImages.length === 0 && (
                          <p className="text-slate-500 font-bold">Every single file was mapped successfully!</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Static Image Inventory Lists (When no fresh upload result is displayed) */}
            {!uploadResult && (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h4 className="font-bold text-white text-base">Image Coverage Inventory</h4>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 text-[10px] font-bold gap-1">
                    <button 
                      type="button"
                      onClick={() => setImageManagerSubTab('matched')}
                      className={`px-3 py-1.5 rounded-lg ${imageManagerSubTab === 'matched' || imageManagerSubTab === 'summary' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      Matched ({imageStats.matchedProducts.length})
                    </button>
                    <button 
                      type="button"
                      onClick={() => setImageManagerSubTab('missing')}
                      className={`px-3 py-1.5 rounded-lg ${imageManagerSubTab === 'missing' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      Missing ({imageStats.missingProducts.length})
                    </button>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto text-xs">
                  {(imageManagerSubTab === 'matched' || imageManagerSubTab === 'summary') && (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 font-bold border-b border-slate-900 pb-2">
                          <th className="pb-2">Product Name</th>
                          <th className="pb-2">Thumbnail Path</th>
                          <th className="pb-2">Preview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40">
                        {imageStats.matchedProducts.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-950/20">
                            <td className="py-2 text-white font-bold">{p.name}</td>
                            <td className="py-2 text-slate-400 font-mono truncate max-w-xs">{p.thumbnail}</td>
                            <td className="py-2">
                              <div className="w-8 h-8 rounded bg-white flex items-center justify-center p-0.5 border border-slate-800">
                                <img 
                                  src={resolveUploadUrl(p.thumbnail)}
                                  alt={p.name} 
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {imageStats.matchedProducts.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-slate-500 font-bold">No product images matched yet. Upload a ZIP file above!</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {imageManagerSubTab === 'missing' && (
                    <div className="space-y-1">
                      <p className="text-slate-400 font-semibold mb-2">The following products require images:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {imageStats.missingProducts.map((p: any) => (
                          <div key={p.id} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-bold">
                            {p.name} <span className="text-[9px] text-slate-500 font-medium">({p.category})</span>
                          </div>
                        ))}
                        {imageStats.missingProducts.length === 0 && (
                          <p className="text-emerald-400 font-bold col-span-3 text-center py-4">100% Image Coverage! No missing images.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        )}

      </div>
    </section>
  );
};
