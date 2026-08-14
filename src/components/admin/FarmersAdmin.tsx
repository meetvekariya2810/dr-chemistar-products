import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchFarmers,
  fetchFarmer,
  updateFarmer as apiUpdateFarmer,
  deleteFarmer as apiDeleteFarmer,
  exportFarmersExcel,
  exportFarmersPdf,
  exportFarmerPdf,
  isApiConfigured,
  FARMER_STATUSES
} from '../../api';
import type { Farmer, FarmerStats, FarmerFilterOptions, FarmerStatus } from '../../api';
import {
  Users,
  Search,
  Filter,
  Download,
  FileText,
  Eye,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Sprout,
  MapPin,
  CalendarDays,
  ShieldAlert,
  Save
} from 'lucide-react';

/**
 * The Farmers section of the CMS - the ONLY place farmer records are ever shown.
 *
 * There is no public counterpart to this screen by design: /farmer submits and
 * nothing more. Every call made here goes to an endpoint that requires a bearer
 * token, so this component cannot render data to someone who is not signed in
 * even if it were somehow mounted elsewhere.
 */

interface FarmersAdminProps {
  /** Role of the signed-in admin, used only to hide controls it cannot use. */
  role: string;
}

/**
 * Mirrors FARMER_PERMISSIONS in server/config/adminAuthConfig.js.
 *
 * Purely cosmetic - hiding a button is not access control. The server rejects
 * anything this role is not entitled to with a 403 regardless of what the UI
 * shows, which is why this copy being briefly out of date is harmless.
 */
const PERMISSIONS: Record<string, string[]> = {
  director: ['view', 'edit', 'delete', 'export'],
  admin: ['view', 'edit'],
  staff: []
};

const can = (role: string, permission: string) =>
  (PERMISSIONS[role] || []).includes(permission);

const EMPTY_STATS: FarmerStats = {
  total: 0,
  newThisMonth: 0,
  active: 0,
  byStatus: { New: 0, Contacted: 0, Active: 0, Inactive: 0 },
  byDistrict: [],
  byState: [],
  byCrop: []
};

const EMPTY_OPTIONS: FarmerFilterOptions = {
  districts: [], states: [], cities: [], crops: [], irrigation: []
};

const EMPTY_FILTERS = {
  search: '',
  district: 'All',
  state: 'All',
  city: 'All',
  main_crop: 'All',
  status: 'All',
  irrigation: 'All',
  date_from: '',
  date_to: '',
  farm_size_min: '',
  farm_size_max: ''
};

const PAGE_SIZE = 25;

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '-'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const STATUS_STYLES: Record<FarmerStatus, string> = {
  New: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Contacted: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

export const FarmersAdmin: React.FC<FarmersAdminProps> = ({ role }) => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [stats, setStats] = useState<FarmerStats>(EMPTY_STATS);
  const [options, setOptions] = useState<FarmerFilterOptions>(EMPTY_OPTIONS);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState('');

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'' | 'excel' | 'pdf'>('');

  // Detail drawer
  const [selected, setSelected] = useState<Farmer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingDetail, setSavingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  /** Only the values the API should actually receive. */
  const queryParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') params[key] = value;
    });
    return params;
  }, [filters]);

  const load = useCallback(async (targetPage = page) => {
    if (!isApiConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFarmers({
        ...queryParams(),
        page: String(targetPage),
        limit: String(PAGE_SIZE)
      });
      setFarmers(res.data);
      setStats(res.stats || EMPTY_STATS);
      setOptions(res.filterOptions);
      setTotal(res.total);
      setSource(res.source);
    } catch (err: any) {
      setError(
        err?.status === 403
          ? 'Your account is not permitted to view farmer records. Ask a Director for access.'
          : err?.message || 'Could not load farmer records.'
      );
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  }, [queryParams, page]);

  /*
   * Typing in the search box must not fire a request per keystroke, so the
   * reload is debounced. Filter dropdowns go through the same path - a 350ms
   * delay is imperceptible when picking from a list.
   */
  const firstRun = useRef(true);
  useEffect(() => {
    const delay = firstRun.current ? 0 : 350;
    firstRun.current = false;
    const timer = setTimeout(() => {
      setPage(1);
      load(1);
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const setFilter = (key: keyof typeof EMPTY_FILTERS, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const activeFilterCount = Object.entries(filters)
    .filter(([key, value]) => key !== 'search' && value && value !== 'All').length;

  const goToPage = (next: number) => {
    setPage(next);
    load(next);
  };

  /* ----------------------------- Detail drawer ---------------------------- */

  const openDetail = async (farmer: Farmer) => {
    setSelected(farmer);
    setNotesDraft(farmer.admin_notes || '');
    setDetailError(null);
    setDetailLoading(true);
    try {
      // Re-fetch so the drawer shows the complete record (and so the view is
      // recorded in the audit log against this specific farmer).
      const full = await fetchFarmer(farmer.farmer_id || farmer.id);
      setSelected(full);
      setNotesDraft(full.admin_notes || '');
    } catch (err: any) {
      setDetailError(err?.message || 'Could not load the full record.');
    } finally {
      setDetailLoading(false);
    }
  };

  const applyChange = async (changes: Record<string, string>) => {
    if (!selected) return;
    setSavingDetail(true);
    setDetailError(null);
    try {
      const updated = await apiUpdateFarmer(selected.farmer_id || selected.id, changes);
      setSelected(updated);
      setFarmers((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      // Status drives the dashboard counters, so refresh them.
      if (changes.status) load(page);
    } catch (err: any) {
      setDetailError(
        err?.status === 403
          ? 'Your account is not permitted to edit farmer records.'
          : err?.message || 'Could not save the change.'
      );
    } finally {
      setSavingDetail(false);
    }
  };

  const handleDelete = async (farmer: Farmer) => {
    const label = `${farmer.farmer_name} (${farmer.farmer_id})`;
    if (!window.confirm(`Permanently delete ${label}? This cannot be undone.`)) return;
    try {
      await apiDeleteFarmer(farmer.farmer_id || farmer.id);
      setSelected(null);
      load(page);
    } catch (err: any) {
      setError(
        err?.status === 403
          ? 'Only a Director may delete farmer records.'
          : err?.message || 'Could not delete the record.'
      );
    }
  };

  const runExport = async (kind: 'excel' | 'pdf') => {
    setExporting(kind);
    setError(null);
    try {
      // Exports carry the CURRENT filters, so the file matches what is on screen.
      if (kind === 'excel') await exportFarmersExcel(queryParams());
      else await exportFarmersPdf(queryParams());
    } catch (err: any) {
      setError(
        err?.status === 403
          ? 'Only a Director may export the farmer database.'
          : err?.message || 'The export could not be generated.'
      );
    } finally {
      setExporting('');
    }
  };

  /* ------------------------------- Rendering ------------------------------ */

  if (!isApiConfigured) {
    return (
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center">
        <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-white font-bold text-base">Farmer records need the backend</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          Farmer data is only ever served by the API, never bundled into the site. Start the
          backend with <code className="text-emerald-400">npm run dev</code>, or point
          <code className="text-emerald-400"> VITE_API_URL</code> at your deployed API.
        </p>
      </div>
    );
  }

  if (!can(role, 'view')) {
    return (
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-white font-bold text-base">No access to farmer records</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          Your account is signed in as <span className="text-white font-bold">{role}</span>, which
          does not include farmer database access. A Director can grant this.
        </p>
      </div>
    );
  }

  const topCrops = stats.byCrop.slice(0, 2);
  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="space-y-6">

      {/* Dashboard counters - every number comes from the database */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Total Farmers</span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-display mt-2">
            {stats.total.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 font-bold">
            {activeFilterCount > 0 || filters.search ? 'Matching current filters' : 'All registrations'}
          </span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">New This Month</span>
            <CalendarDays className="w-5 h-5 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-sky-400 font-display mt-2">
            {stats.newThisMonth.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 font-bold">Since the 1st</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Active Farmers</span>
            <RefreshCw className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-display mt-2">
            {stats.active.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 font-bold">
            {stats.byStatus.New} new &middot; {stats.byStatus.Contacted} contacted
          </span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Top Crops</span>
            <Sprout className="w-5 h-5 text-teal-400" />
          </div>
          {topCrops.length > 0 ? (
            <div className="mt-2 space-y-1">
              {topCrops.map((crop) => (
                <div key={crop.name} className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-slate-300 font-bold truncate">{crop.name}</span>
                  <span className="text-lg font-black text-teal-400 font-display">{crop.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 font-bold mt-3">No crop data yet</div>
          )}
        </div>
      </div>

      {/* District breakdown */}
      {stats.byDistrict.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Farmers by District
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.byDistrict.slice(0, 12).map((d) => (
              <button
                key={d.name}
                onClick={() => setFilter('district', d.name)}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-300 transition-colors"
              >
                {d.name}
                <span className="ml-2 text-emerald-400">{d.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search farmer name, mobile, Farmer ID, village, city, district or crop..."
              aria-label="Search farmers"
              className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 pl-10 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>

          {can(role, 'export') && (
            <>
              <button
                onClick={() => runExport('excel')}
                disabled={exporting !== ''}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2"
              >
                {exporting === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export Excel
              </button>
              <button
                onClick={() => runExport('pdf')}
                disabled={exporting !== ''}
                className="bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2"
              >
                {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Export PDF
              </button>
            </>
          )}

          <button
            onClick={() => load(page)}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300"
            title="Reload"
            aria-label="Reload farmer list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-slate-800 pt-4">
            {([
              ['district', 'District', options.districts],
              ['state', 'State', options.states],
              ['city', 'City', options.cities],
              ['main_crop', 'Main Crop', options.crops],
              ['irrigation', 'Irrigation', options.irrigation],
              ['status', 'Status', [...FARMER_STATUSES]]
            ] as const).map(([key, label, list]) => (
              <div key={key}>
                <label htmlFor={`farmer-filter-${key}`} className="text-[11px] text-slate-400 font-bold block mb-1.5">
                  {label}
                </label>
                <select
                  id={`farmer-filter-${key}`}
                  value={filters[key]}
                  onChange={(e) => setFilter(key, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All</option>
                  {list.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}

            <div>
              <label htmlFor="farmer-filter-from" className="text-[11px] text-slate-400 font-bold block mb-1.5">Registered From</label>
              <input
                id="farmer-filter-from"
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilter('date_from', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="farmer-filter-to" className="text-[11px] text-slate-400 font-bold block mb-1.5">Registered To</label>
              <input
                id="farmer-filter-to"
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilter('date_to', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="farmer-filter-min" className="text-[11px] text-slate-400 font-bold block mb-1.5">Min Area</label>
                <input
                  id="farmer-filter-min"
                  type="number"
                  min="0"
                  value={filters.farm_size_min}
                  onChange={(e) => setFilter('farm_size_min', e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="farmer-filter-max" className="text-[11px] text-slate-400 font-bold block mb-1.5">Max Area</label>
                <input
                  id="farmer-filter-max"
                  type="number"
                  min="0"
                  value={filters.farm_size_max}
                  onChange={(e) => setFilter('farm_size_max', e.target.value)}
                  placeholder="Any"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-200 font-semibold">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">
            Farmer Records
            <span className="text-slate-500 font-medium text-xs ml-2">
              {total.toLocaleString('en-IN')} total{source ? ` · ${source}` : ''}
            </span>
          </h3>
        </div>

        {loading && farmers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-emerald-400" />
            Loading farmer records...
          </div>
        ) : farmers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 font-bold text-sm">
              {activeFilterCount > 0 || filters.search
                ? 'No farmers match these filters'
                : 'No farmers have registered yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeFilterCount > 0 || filters.search
                ? 'Try clearing the filters.'
                : 'Registrations from /farmer will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                    <th className="p-3">Farmer ID</th>
                    <th className="p-3">Registered</th>
                    <th className="p-3">Farmer Name</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Village / City</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Main Crop</th>
                    <th className="p-3">Area</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {farmers.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-950/50">
                      <td className="p-3 font-mono text-emerald-400 font-bold whitespace-nowrap">{f.farmer_id}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{formatDate(f.created_at)}</td>
                      <td className="p-3 font-bold text-white">{f.farmer_name}</td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">{f.mobile}</td>
                      <td className="p-3 text-slate-300">
                        {[f.village, f.city].filter(Boolean).join(', ') || '-'}
                      </td>
                      <td className="p-3 text-slate-400">{f.district || '-'}</td>
                      <td className="p-3 text-slate-300">{f.main_crop || '-'}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {f.farm_area ? `${f.farm_area} ${f.land_unit || ''}`.trim() : '-'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[f.status]}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => openDetail(f)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg"
                          title="View full record"
                          aria-label={`View ${f.farmer_name}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {can(role, 'export') && (
                          <button
                            onClick={() => exportFarmerPdf(f.farmer_id || f.id).catch((e) => setError(e.message))}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg"
                            title="Export this farmer's profile PDF"
                            aria-label={`Export ${f.farmer_name} as PDF`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {can(role, 'delete') && (
                          <button
                            onClick={() => handleDelete(f)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-400 rounded-lg"
                            title="Delete record"
                            aria-label={`Delete ${f.farmer_name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-500 font-semibold">
                  Page {page} of {pageCount}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || loading}
                    className="bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= pageCount || loading}
                    className="bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <FarmerDetail
          farmer={selected}
          role={role}
          loading={detailLoading}
          saving={savingDetail}
          error={detailError}
          notesDraft={notesDraft}
          onNotesChange={setNotesDraft}
          onClose={() => setSelected(null)}
          onChange={applyChange}
          onDelete={() => handleDelete(selected)}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Detail drawer                                                              */
/* -------------------------------------------------------------------------- */

const SECTIONS: { title: string; fields: [string, keyof Farmer][] }[] = [
  {
    title: 'Basic Information',
    fields: [
      ['Farmer Name', 'farmer_name'],
      ['Mobile Number', 'mobile'],
      ['Alternate Mobile', 'alternate_mobile'],
      ['Email Address', 'email'],
      ['Gender', 'gender'],
      ['Age', 'age']
    ]
  },
  {
    title: 'Location',
    fields: [
      ['Village', 'village'],
      ['City / Town', 'city'],
      ['District', 'district'],
      ['State', 'state'],
      ['PIN Code', 'pincode']
    ]
  },
  {
    title: 'Farm Details',
    fields: [
      ['Farm / Land Area', 'farm_area'],
      ['Land Unit', 'land_unit'],
      ['Irrigation', 'irrigation'],
      ['Soil Type', 'soil_type']
    ]
  },
  {
    title: 'Crops',
    fields: [
      ['Main Crop', 'main_crop'],
      ['Other Crops', 'other_crops'],
      ['Current Season', 'current_season'],
      ['Approximate Crop Area', 'crop_area'],
      ['Farming Experience', 'farming_experience'],
      ['Farming Type', 'farming_type']
    ]
  },
  {
    title: 'Requirements',
    fields: [
      ['Interested In', 'interests'],
      ['Farmer Message', 'message']
    ]
  }
];

interface FarmerDetailProps {
  farmer: Farmer;
  role: string;
  loading: boolean;
  saving: boolean;
  error: string | null;
  notesDraft: string;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onChange: (changes: Record<string, string>) => void;
  onDelete: () => void;
}

const FarmerDetail: React.FC<FarmerDetailProps> = ({
  farmer, role, loading, saving, error, notesDraft, onNotesChange, onClose, onChange, onDelete
}) => {
  // Escape closes the drawer, which is what anyone who has used one expects.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const value = (key: keyof Farmer) => {
    const raw = farmer[key];
    if (Array.isArray(raw)) return raw.length ? raw.join(', ') : '';
    return raw === null || raw === undefined ? '' : String(raw);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Farmer record ${farmer.farmer_id}`}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 h-full overflow-y-auto border-l border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-start justify-between gap-4 z-10">
          <div className="min-w-0">
            <span className="font-mono text-xs text-emerald-400 font-bold">{farmer.farmer_id}</span>
            <h3 className="text-xl font-black text-white font-display truncate">{farmer.farmer_name}</h3>
            <p className="text-xs text-slate-400 truncate">
              {[farmer.village, farmer.city, farmer.district, farmer.state].filter(Boolean).join(', ') || 'Location not provided'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              Loading the complete record...
            </div>
          )}

          {error && (
            <div role="alert" className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl">
              <p className="text-xs text-rose-200 font-semibold">{error}</p>
            </div>
          )}

          {/* Status + quick actions */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
            <label htmlFor="farmer-status" className="text-[11px] text-slate-400 font-bold block">Status</label>
            <div className="flex flex-wrap gap-2">
              {FARMER_STATUSES.map((s) => (
                <button
                  key={s}
                  id={s === farmer.status ? 'farmer-status' : undefined}
                  disabled={!can(role, 'edit') || saving}
                  onClick={() => onChange({ status: s })}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    farmer.status === s
                      ? STATUS_STYLES[s]
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">
              Registered {formatDate(farmer.created_at)}
              {farmer.updated_at && farmer.updated_at !== farmer.created_at
                ? ` · last updated ${formatDate(farmer.updated_at)}` : ''}
            </p>
          </div>

          {/* All submitted fields */}
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 pb-2 border-b border-slate-800">
                {section.title}
              </h4>
              <dl className="divide-y divide-slate-800/60">
                {section.fields.map(([label, key]) => (
                  <div key={String(key)} className="py-2 grid grid-cols-3 gap-3">
                    <dt className="text-[11px] text-slate-500 font-bold">{label}</dt>
                    <dd className={`col-span-2 text-xs ${value(key) ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                      {value(key) || 'Not provided'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          {/* Internal notes - never shown to the farmer */}
          <div>
            <label htmlFor="farmer-notes" className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 pb-2 border-b border-slate-800 block">
              Internal Notes
            </label>
            <textarea
              id="farmer-notes"
              rows={4}
              value={notesDraft}
              disabled={!can(role, 'edit')}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Visit notes, call outcome, products recommended..."
              className="w-full mt-2 bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            />
            {can(role, 'edit') && (
              <button
                onClick={() => onChange({ admin_notes: notesDraft })}
                disabled={saving || notesDraft === farmer.admin_notes}
                className="mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Notes
              </button>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
            {can(role, 'export') && (
              <button
                onClick={() => exportFarmerPdf(farmer.farmer_id || farmer.id)}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                Export Farmer PDF
              </button>
            )}
            {can(role, 'delete') && (
              <button
                onClick={onDelete}
                className="bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/20 text-rose-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Record
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmersAdmin;
