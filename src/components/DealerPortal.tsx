import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { PRODUCTS_DATA } from '../data/productsData';
import { createDealer, isApiConfigured } from '../api';
import { 
  Building2, 
  FileText, 
  ShoppingBag, 
  CheckCircle2, 
  Download, 
  Search, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface DealerPortalProps {
  currentLang: Language;
  prefilledProductName?: string;
}

export const DealerPortal: React.FC<DealerPortalProps> = ({ 
  currentLang,
  prefilledProductName = ''
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'pricelist' | 'bulk'>('register');
  const [submitted, setSubmitted] = useState(false);

  // Form states
  const [firmName, setFirmName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Gujarat');
  const [selectedProduct, setSelectedProduct] = useState(prefilledProductName || PRODUCTS_DATA[0].name);
  const [quantity, setQuantity] = useState('50 Boxes');

  const t = TRANSLATIONS[currentLang];

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isApiConfigured) {
      try {
        await createDealer({
          firmName,
          contactPerson,
          phone,
          email,
          city,
          state,
          gstNumber,
          licenseNumber
        });
      } catch (err: any) {
        alert('Failed to submit application: ' + err.message);
        return;
      }
    } else {
      console.log('Database not configured. Saved registration locally (mock).');
    }

    setSubmitted(true);
  };

  return (
    <section id="dealer-portal" className="py-16 bg-slate-50 text-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full border border-blue-200 text-xs font-bold mb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Pan-India Distribution & Dealer Network</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900">
            Authorized Dealer & Distributor Portal
          </h2>
          
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            Partner with Dr. CHEMISTAR Crop Care Pvt. Ltd. Access commercial pricing, real-time stock tracker, bulk order requests, and download official marketing collateral.
          </p>
        </div>

        {/* Portal Tabs Bar */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200 p-1.5 rounded-2xl flex gap-2 font-bold text-xs">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-5 py-3 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'register' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Dealer Registration</span>
            </button>

            <button
              onClick={() => setActiveTab('pricelist')}
              className={`px-5 py-3 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'pricelist' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Wholesale Stock & Pricing</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-5 py-3 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'bulk' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Request Bulk Purchase Quote</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DEALER REGISTRATION */}
        {activeTab === 'register' && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10">
            
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h3 className="text-xl font-bold text-slate-900 font-display">
                Apply for Dr. CHEMISTAR Dealership / Distributorship
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the form below to receive dealership terms, margin charts, and regional exclusivity details.
              </p>
            </div>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-2xl font-black text-emerald-950 font-display">
                  Dealer Application Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you, <span className="font-bold text-slate-900">{contactPerson}</span> from <span className="font-bold text-slate-900">{firmName}</span>. Our Rajkot Sales Manager will review your GSTIN & Insecticide license and contact you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-slate-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Firm / Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kisan Agro Center"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Proprietor / Manager Name"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Mobile / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="dealer@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">GSTIN Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="24ABCDE1234F1Z5"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Insecticide License No. *</label>
                    <input
                      type="text"
                      required
                      placeholder="LIC/AGRO/2024/99"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">City / District *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajkot, Amreli, Junagadh"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">State *</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Gujarat">Gujarat (ગુજરાત)</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Karnataka">Karnataka</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Submit Authorized Dealer Application</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>
        )}

        {/* TAB 2: WHOLESALE STOCK & PRICING */}
        {activeTab === 'pricelist' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-display">
                  Live Stock Tracker & Wholesale Price List
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time factory warehouse dispatch readiness from Rajkot plant.
                </p>
              </div>

              <button
                onClick={() => alert('Official Product Catalogue PDF downloading...')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Full PDF Catalogue</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider border-b border-slate-200">
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Technical Formulation</th>
                    <th className="p-3">Standard Master Packing</th>
                    <th className="p-3">Stock Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {PRODUCTS_DATA.slice(0, 15).map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900 font-display">{product.name}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 line-clamp-1">{product.commonName}</td>
                      <td className="p-3">{product.packing.join(', ')}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready in Stock
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <a
                          href={`https://wa.me/918780663808?text=Dealer%20Stock%20Enquiry%20for%20${encodeURIComponent(product.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[11px]"
                        >
                          Enquire Rate
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-center text-xs text-slate-500 italic">
              Showing 15 of 101 products. For complete dealer price matrix, download the official catalogue PDF or submit your GST credentials.
            </div>
          </div>
        )}

        {/* TAB 3: BULK PURCHASE QUOTE */}
        {activeTab === 'bulk' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10">
            <h3 className="text-xl font-bold text-slate-900 font-display mb-1">
              Request Commercial Bulk Quantity Quote
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Get special volume discount pricing for commercial agricultural orders.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); alert('Bulk purchase quote generated! Our dispatch officer will contact you.'); }} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Product *</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {PRODUCTS_DATA.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.commonName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Required Volume / Quantity *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50 Cartons / 500 Ltr"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Mobile No *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Submit Volume Quote Request</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </section>
  );
};
