import React, { useState, useEffect } from 'react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { PRODUCTS_DATA } from '../data/productsData';
import { fetchProducts, fetchDealers, fetchEnquiries, approveDealer, deleteProduct, isApiConfigured } from '../api';
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
  ShieldCheck
} from 'lucide-react';

interface AdminPanelProps {
  currentLang: Language;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentLang }) => {
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS_DATA);
  const [activeTab, setActiveTab] = useState<'products' | 'dealers' | 'enquiries' | 'settings'>('products');
  const [searchTerm, setSearchTerm] = useState('');
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
      } catch (err) {
        console.error('Error fetching admin data:', err);
      }
    };

    fetchAdminData();
  }, []);

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
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 mb-8 max-w-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2.5 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Product Management ({productsList.length})
          </button>
          <button
            onClick={() => setActiveTab('dealers')}
            className={`flex-1 py-2.5 rounded-xl transition-colors ${activeTab === 'dealers' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Dealer Approvals ({dealersList.length})
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`flex-1 py-2.5 rounded-xl transition-colors ${activeTab === 'enquiries' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Lead Inquiries
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

      </div>
    </section>
  );
};
