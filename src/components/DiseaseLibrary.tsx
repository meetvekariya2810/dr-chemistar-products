import React, { useState } from 'react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { DISEASE_PEST_LIBRARY } from '../data/cropData';
import { PRODUCTS_DATA } from '../data/productsData';
import { Bug, ShieldAlert, Search, FlaskConical, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DiseaseLibraryProps {
  currentLang: Language;
  onSelectProduct: (product: Product) => void;
}

export const DiseaseLibrary: React.FC<DiseaseLibraryProps> = ({
  currentLang,
  onSelectProduct
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pest' | 'disease'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const t = TRANSLATIONS[currentLang];

  const filteredItems = DISEASE_PEST_LIBRARY.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameHi.includes(searchQuery) ||
      item.nameGu.includes(searchQuery) ||
      item.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.crops.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <section id="disease-library" className="py-16 bg-white text-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 px-4 py-1.5 rounded-full border border-rose-200 text-xs font-bold mb-3">
            <Bug className="w-4 h-4 text-rose-600" />
            <span>Field Pathology & Entomology Guide</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900">
            Pest & Disease Knowledge Library
          </h2>

          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            Identify crop threats accurately. Learn symptoms, weather causes, preventative measures, and official DR CHEMISTAR chemical solutions.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-200">

          {/* Tabs */}
          <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${filterType === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}
            >
              All Threats ({DISEASE_PEST_LIBRARY.length})
            </button>
            <button
              onClick={() => setFilterType('pest')}
              className={`px-4 py-2 rounded-lg transition-colors ${filterType === 'pest' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}
            >
              🐛 Insects & Pests
            </button>
            <button
              onClick={() => setFilterType('disease')}
              className={`px-4 py-2 rounded-lg transition-colors ${filterType === 'disease' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}
            >
              🛡️ Fungal & Bacterial Diseases
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by pest, disease, crop or symptom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

        </div>

        {/* Item Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>

                {/* Card Title & Type Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${item.type === 'pest' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-sky-100 text-sky-800 border-sky-200'
                    }`}>
                    {item.type === 'pest' ? 'Pest Threat' : 'Disease Threat'}
                  </span>

                  <div className="flex gap-1 text-[11px] font-semibold text-slate-500">
                    <span>{item.crops.join(', ')}</span>
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 font-display">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">{item.nameHi} • {item.nameGu}</p>

                {/* Symptoms */}
                <div className="mt-4 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">Symptoms:</span>
                  <p className="text-slate-600 leading-relaxed">{item.symptoms}</p>
                </div>

                {/* Prevention */}
                <div className="mt-3 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 text-xs">
                  <span className="font-bold text-emerald-900 block mb-1">Preventative Action:</span>
                  <p className="text-emerald-800 leading-relaxed">{item.prevention}</p>
                </div>

              </div>

              {/* Recommended DR CHEMISTAR Formulations */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  Recommended DR CHEMISTAR Solutions:
                </span>

                <div className="flex flex-wrap gap-2">
                  {item.recommendedProductIds.map((pid) => {
                    const prod = PRODUCTS_DATA.find((p) => p.id === pid);
                    if (!prod) return null;
                    return (
                      <button
                        key={prod.id}
                        onClick={() => onSelectProduct(prod)}
                        className="bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                      >
                        <span>🧪 {prod.name}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
