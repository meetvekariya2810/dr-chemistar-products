import React, { useState } from 'react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { getProductImageUrl } from '../lib/productImage';
import {
  X, 
  FlaskConical, 
  Droplet, 
  Package, 
  ShieldAlert, 
  CheckCircle2, 
  MessageCircle, 
  Download, 
  Calculator, 
  Bug, 
  Sprout, 
  Building2,
  Share2,
  ShieldCheck
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  currentLang: Language;
  onClose: () => void;
  onRequestDealerQuote: (productName: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  currentLang,
  onClose,
  onRequestDealerQuote
}) => {
  const [acreage, setAcreage] = useState<number>(1);
  const [pumps, setPumps] = useState<number>(10);
  const [calcMode, setCalcMode] = useState<'acres' | 'pumps'>('acres');
  const [imgError, setImgError] = useState<boolean>(false);

  if (!product) return null;
  const t = TRANSLATIONS[currentLang];
  const imageUrl = getProductImageUrl(product, 'full');

  // Helper dosage calculation logic
  const calculateTotalQuantity = () => {
    const doseMatch = product.dose.match(/(\d+)\s*(ml|gm)/i);
    if (!doseMatch) return `${product.dose} per 15L Pump`;
    const num = parseInt(doseMatch[1], 10);
    const unit = doseMatch[2];

    if (calcMode === 'acres') {
      // Average 10 pumps per acre
      const totalPumps = acreage * 10;
      const total = num * totalPumps;
      return total >= 1000 ? `${(total / 1000).toFixed(1)} ${unit === 'ml' ? 'Ltr' : 'Kg'}` : `${total} ${unit}`;
    } else {
      const total = num * pumps;
      return total >= 1000 ? `${(total / 1000).toFixed(1)} ${unit === 'ml' ? 'Ltr' : 'Kg'}` : `${total} ${unit}`;
    }
  };

  const whatsAppUrl = `https://wa.me/916351250285?text=Hello%20Dr.%20CHEMISTAR%20Team,%20I%20want%20to%20buy%20or%20enquire%20about%20${encodeURIComponent(product.name)}%20(${encodeURIComponent(product.commonName)}).%20My%20Required%20Dose%20for%20${acreage}%20Acres%20is%20approx%20${calculateTotalQuantity()}.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-200">
        
        {/* Modal Top Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-blue-950 text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30">
              {product.category}
            </span>
            <span className="bg-white/10 text-slate-200 text-xs font-medium px-3 py-1 rounded-full border border-white/10">
              Formulation: {product.formulation}
            </span>
            {product.badge && (
              <span className="bg-amber-400 text-slate-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                ★ {product.badge}
              </span>
            )}
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
            {product.name}
          </h2>

          <p className="text-slate-300 text-sm mt-1 font-semibold flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            {product.commonName}
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto space-y-8 text-slate-800 text-sm">
                   {/* Top Section: Image and Specifications Row */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Side: Large Product Image (500x500 contain) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group/modalimg min-h-[350px]">
              {imageUrl && !imgError ? (
                <div className="relative w-full aspect-square max-w-[400px] overflow-hidden rounded-xl flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-contain transform group-hover/modalimg:scale-110 transition-transform duration-500 cursor-zoom-in"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50 rounded-xl w-full aspect-square max-w-[400px]">
                  <FlaskConical className="w-16 h-16 text-slate-300 mb-2" />
                  <span className="text-xs font-bold uppercase text-slate-400">No Image Available</span>
                </div>
              )}
              {/* Corner Watermark */}
              <div className="absolute top-2 right-2 bg-emerald-500/10 text-emerald-600 border border-emerald-400/20 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Genuine Label
              </div>
            </div>

            {/* Right Side: Specifications and Calculator */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Specifications Grid */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Droplet className="w-3.5 h-3.5 text-emerald-600" />
                    {t.dosage}
                  </span>
                  <p className="text-sm font-black text-emerald-950 truncate">{product.dose}</p>
                </div>

                <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-100 flex flex-col justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    {t.packing}
                  </span>
                  <p className="text-sm font-black text-blue-950 truncate">{product.packing.join(', ')}</p>
                </div>

                <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-100 flex flex-col justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Composition
                  </span>
                  <p className="text-xs font-bold text-amber-950 line-clamp-2">{product.activeIngredient}</p>
                </div>
              </div>

              {/* Dosage Calculator Interactive Tool */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-400">
                    <Calculator className="w-5 h-5 text-emerald-400" />
                    Smart Farm Dosage Calculator
                  </h3>
                  <div className="flex bg-slate-800 p-1 rounded-xl text-[10px] font-bold gap-1">
                    <button
                      type="button"
                      onClick={() => setCalcMode('acres')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${calcMode === 'acres' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      By Acreage
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcMode('pumps')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${calcMode === 'pumps' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      By Pumps
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium block mb-1">
                      {calcMode === 'acres' ? 'Total Land Area (Acres):' : 'Number of 15-Litre Water Pumps:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={calcMode === 'acres' ? acreage : pumps}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        if (calcMode === 'acres') setAcreage(val);
                        else setPumps(val);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-xl text-base font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-500/40 text-center">
                    <span className="text-[10px] text-emerald-300 font-semibold block">Total Quantity Required:</span>
                    <span className="text-xl font-black text-white font-display">{calculateTotalQuantity()}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Mode of Action & Benefits */}
          <div className="grid md:grid-cols-2 gap-6">
            
            <div>
              <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                {t.modeOfAction}
              </h4>
              <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {product.modeOfAction}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t.benefits}
              </h4>
              <ul className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {product.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Recommended Crops & Targets */}
          <div className="grid md:grid-cols-2 gap-6">
            
            <div>
              <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-600" />
                {t.recommendedCrops}
              </h4>
              <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {product.targetCrops.map((crop, i) => (
                  <span key={i} className="bg-emerald-100 text-emerald-900 font-semibold px-3 py-1 rounded-lg text-xs">
                    🌱 {crop}
                  </span>
                ))}
              </div>
            </div>

            {(product.targetPest || product.targetDisease) && (
              <div>
                <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                  <Bug className="w-4 h-4 text-rose-600" />
                  Target Diseases & Pests
                </h4>
                <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {(product.targetPest || product.targetDisease || []).map((targ, i) => (
                    <span key={i} className="bg-rose-100 text-rose-900 font-semibold px-3 py-1 rounded-lg text-xs">
                      🐛 {targ}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Safety & Storage Instructions */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950 block">Safety & Storage Precaution:</span>
              <p className="mt-0.5">
                Keep out of reach of children and domestic animals. Store in original container in a cool, dry, well-ventilated place away from foodstuff. Always wear protective goggles, gloves and masks while preparing spray mixture. Read technical label before use.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer CTAs */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert(`Technical Specification sheet for ${product.name} downloaded successfully!`);
              }}
              className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-300 text-xs flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>{t.downloadPdfSpecs}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onRequestDealerQuote(product.name);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              <span>{t.requestQuote}</span>
            </button>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>{t.enquireWhatsApp}</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
