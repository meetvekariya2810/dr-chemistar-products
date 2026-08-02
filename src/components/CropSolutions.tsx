import React, { useState } from 'react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { CROP_SOLUTIONS } from '../data/cropData';
import { PRODUCTS_DATA } from '../data/productsData';
import { Sprout, Calendar, Bug, ShieldCheck, ChevronRight, ArrowRight } from 'lucide-react';

interface CropSolutionsProps {
  currentLang: Language;
  onSelectProduct: (product: Product) => void;
}

export const CropSolutions: React.FC<CropSolutionsProps> = ({
  currentLang,
  onSelectProduct
}) => {
  const [activeCropId, setActiveCropId] = useState<string>(CROP_SOLUTIONS[0].id);
  const t = TRANSLATIONS[currentLang];

  const selectedCrop = CROP_SOLUTIONS.find((c) => c.id === activeCropId) || CROP_SOLUTIONS[0];

  return (
    <section id="crop-solutions" className="py-16 bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full border border-emerald-200 text-xs font-bold mb-3">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>Comprehensive Agricultural Crop Protection</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-display text-slate-900 tracking-tight">
            Tailored Crop Solutions & Spray Schedules
          </h2>

          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            Maximize yield quality and protect crops against severe pest infestations with stage-wise spray recommendations engineered for Indian agriculture.
          </p>
        </div>

        {/* Crop Selection Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {CROP_SOLUTIONS.map((crop) => {
            const isActive = crop.id === activeCropId;
            return (
              <button
                key={crop.id}
                onClick={() => setActiveCropId(crop.id)}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 border shadow-sm ${isActive
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-emerald-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                <span>🌱</span>
                <span>
                  {currentLang === 'hi' ? crop.nameHi : currentLang === 'gu' ? crop.nameGu : crop.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Crop Detail Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid lg:grid-cols-12 gap-0">

          {/* Left Crop Hero Card */}
          <div className="lg:col-span-4 relative bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between min-h-[350px]">
            <img
              src={selectedCrop.image}
              alt={selectedCrop.name}
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

            <div className="relative z-10">
              <span className="bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                {selectedCrop.category}
              </span>
              <h3 className="text-3xl font-black font-display text-white mt-3">
                {selectedCrop.name}
              </h3>
              <p className="text-emerald-300 text-xs font-semibold">
                {selectedCrop.nameHi} • {selectedCrop.nameGu}
              </p>
            </div>

            <div className="relative z-10 space-y-3 pt-6 border-t border-white/20">
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1">Major Pest Threats:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedCrop.majorPests.map((pest, i) => (
                    <span key={i} className="bg-rose-500/20 text-rose-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-rose-500/30">
                      🐛 {pest}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1">Major Fungal Diseases:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedCrop.majorDiseases.map((dis, i) => (
                    <span key={i} className="bg-sky-500/20 text-sky-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-sky-500/30">
                      🛡️ {dis}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Stage-wise Spray Calendar */}
          <div className="lg:col-span-8 p-6 sm:p-8 space-y-6">

            <h4 className="text-xl font-extrabold text-slate-900 font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Stage-wise Recommended Spray Schedule
            </h4>

            <div className="space-y-4">
              {selectedCrop.spraySchedule.map((stage, idx) => (
                <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {stage.stage}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      📅 {stage.days}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium mb-3">
                    <span className="font-bold text-slate-800">Primary Protection Focus:</span> {stage.focus}
                  </p>

                  {/* Products for this stage */}
                  <div className="flex flex-wrap gap-2">
                    {stage.products.map((pname, pidx) => {
                      const prod = PRODUCTS_DATA.find((p) => p.name.toLowerCase() === pname.toLowerCase() || p.name.includes(pname));
                      return (
                        <button
                          key={pidx}
                          onClick={() => prod && onSelectProduct(prod)}
                          className="bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-300 hover:border-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <span>🧪 {pname}</span>
                          <ChevronRight className="w-3 h-3 text-emerald-600" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
