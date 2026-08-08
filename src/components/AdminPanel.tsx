import React, { useState, useEffect } from 'react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { PRODUCTS_DATA } from '../data/productsData';
import { fetchProducts, fetchDealers, fetchEnquiries, approveDealer, deleteProduct, isApiConfigured, fetchImageStats, uploadZipFile, triggerRematch } from '../api';
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
  Upload
} from 'lucide-react';

interface AdminPanelProps {
  currentLang: Language;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentLang }) => {
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS_DATA);
  const [activeTab, setActiveTab] = useState<'products' | 'dealers' | 'enquiries' | 'settings' | 'images'>('products');
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginId.trim() === 'admin' && password === 'admin123') {
      setIsLoggedIn(true);
      setLoginError('');
      // Clear inputs
      setLoginId('');
      setPassword('');
    } else {
      setLoginError('Invalid Login ID or Password');
    }
  };

  // Mock pending dealers
  const [dealersList, setDealersList] = useState([
    { id: 'd1', firm: 'Kisan Krushi Kendra', name: 'Bhavik Patel', city: 'Gondal', phone: '+91 98250 12345', gst: '24AAAAA0000A1Z5', status: 'Pending', date: '2026-07-24' },
    { id: 'd2', firm: 'Saurashtra Agro Agency', name: 'Jayeshbhai Shah', city: 'Amreli', phone: '+91 99040 56789', gst: '24BBBBB1111B2Z6', status: 'Approved', date: '2026-07-23' },
    { id: 'd3', firm: 'Shree Ram Farm Products', name: 'Sanjay Kumar', city: 'Rajkot', phone: '+91 97120 98765', gst: '24CCCCC2222C3Z7', status: 'Pending', date: '2026-07-22' }
  ]);

  // Mock leads
  const [leadsList, setLeadsList] = useState([
    { id: 'l1', name: 'Rameshbhai K', phone: '+91 98765 11111', email: '', type: 'Farmer', query: 'Required MALIKA dose for 10 acres cotton', date: 'Today' },
    { id: 'l2', name: 'Gita Agro Traders', phone: '+91 98765 22222', email: '', type: 'Dealer', query: 'Price list for 100 boxes ALL TAKATAK', date: 'Yesterday' }
  ]);

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

        // 3. Fetch Enquiries
        const dbEnquiries = await fetchEnquiries();
        if (dbEnquiries && dbEnquiries.length > 0) {
          setLeadsList(dbEnquiries.map((e: any) => ({
            id: e.id,
            name: e.name,
            phone: e.phone,
            email: e.email || '',
            type: e.user_type,
            query: e.message,
            date: new Date(e.created_at).toLocaleDateString()
          })));
        }

        // 4. Fetch Image Stats
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
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/10"
            >
              Sign In to CMS Portal
            </button>
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
                System Administrator • Logged in as Head Office Rajkot (Super Admin)
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
              onClick={() => setIsLoggedIn(false)}
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
              <span className="text-xs text-slate-400 font-semibold">Customer Leads</span>
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-display mt-2">{leadsList.length}</div>
            <span className="text-[10px] text-emerald-400 font-bold">Active Enquiries</span>
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
            onClick={() => setActiveTab('dealers')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl transition-colors ${activeTab === 'dealers' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Dealer Approvals ({dealersList.length})
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl transition-colors ${activeTab === 'enquiries' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Lead Inquiries
          </button>
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
                onClick={() => alert('Add Product Modal Triggered. Enter product specs.')}
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

        {/* TAB 2: DEALER APPROVAL QUEUE */}
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

        {/* TAB 3: LEADS & ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Recent Customer Enquiries</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {leadsList.map((l) => (
                <div key={l.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white text-sm">{l.name}</span>
                    <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-bold">{l.type}</span>
                  </div>
                  <p className="text-slate-300 font-semibold mb-1">Phone: {l.phone}</p>
                  {l.email && <p className="text-slate-300 font-semibold mb-1">Email: {l.email}</p>}
                  <p className="text-slate-400 mt-1">"{l.query}"</p>
                </div>
              ))}
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
