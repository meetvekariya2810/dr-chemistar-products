import React from 'react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { 
  FlaskConical, 
  Package, 
  Droplet, 
  MessageCircle, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  Bug,
  Leaf
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  currentLang: Language;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currentLang,
  onSelectProduct
}) => {
  const t = TRANSLATIONS[currentLang];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Insecticide':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Fungicide':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Herbicide':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'PGR':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Fertilizer':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCategoryGradient = (cat: string) => {
    switch (cat) {
      case 'Insecticide':
        return 'from-emerald-700 via-teal-800 to-slate-900';
      case 'Fungicide':
        return 'from-sky-700 via-blue-800 to-slate-900';
      case 'Herbicide':
        return 'from-amber-700 via-orange-800 to-slate-900';
      case 'PGR':
        return 'from-purple-700 via-indigo-800 to-slate-900';
      case 'Fertilizer':
        return 'from-teal-700 via-emerald-800 to-slate-900';
      default:
        return 'from-slate-700 to-slate-900';
    }
  };

  const whatsAppUrl = `https://wa.me/918780663808?text=Hello%20Dr.%20CHEMISTAR,%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}%20(${encodeURIComponent(product.commonName)}).%20Please%20send%20details%20and%20dealer%20price.`;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1">
      
      {/* Product Image Header Container */}
      <div className={`relative h-44 bg-gradient-to-br ${getCategoryGradient(product.category)} p-4 flex flex-col justify-between overflow-hidden`}>
        
        {/* Abstract Background Bottle Silhouette */}
        <div className="absolute right-2 -bottom-4 opacity-15 pointer-events-none transform group-hover:scale-110 transition-transform">
          <FlaskConical className="w-40 h-40 text-white" />
        </div>

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${getCategoryColor(product.category)}`}>
              {product.category}
            </span>

            {product.pdfPage && (
              <span className="bg-slate-900/80 backdrop-blur-md text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30">
                PDF Page {product.pdfPage}
              </span>
            )}
          </div>

          {product.badge && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-current" />
              {product.badge}
            </span>
          )}
        </div>

        {/* Center Mockup Bottle Label Frame */}
        <div className="relative z-10 my-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 text-white shadow-inner group-hover:scale-105 transition-transform">
            <FlaskConical className="w-7 h-7 text-white" />
          </div>
          <p className="text-[10px] text-slate-200 font-medium tracking-wider uppercase mt-1">
            Formulation: <span className="font-bold text-white">{product.formulation}</span>
          </p>
        </div>

        {/* ISO Stamp */}
        <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-300 border-t border-white/10 pt-1.5">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            ISO 9001:2015
          </span>
          <span className="font-semibold text-white">Dr. CHEMISTAR</span>
        </div>

      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        
        <div>
          {/* Product Title */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xl font-extrabold text-slate-900 font-display group-hover:text-emerald-700 transition-colors">
              {product.name}
            </h3>
          </div>

          {/* Technical Name */}
          <div className="mt-1 bg-slate-100/80 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 border border-slate-200 flex items-start gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{product.commonName}</span>
          </div>

          {/* Recommended Dose */}
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100">
            <Droplet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{product.dose}</span>
          </div>

          {/* Target Pests / Diseases */}
          {(product.targetPest || product.targetDisease) && (
            <div className="mt-3 text-xs text-slate-600">
              <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <Bug className="w-3.5 h-3.5 text-rose-500" />
                Target:
              </span>
              <div className="flex flex-wrap gap-1">
                {(product.targetPest || product.targetDisease || []).slice(0, 3).map((target, idx) => (
                  <span 
                    key={idx} 
                    className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200"
                  >
                    {target}
                  </span>
                ))}
                {(product.targetPest || product.targetDisease || []).length > 3 && (
                  <span className="text-[10px] text-slate-500 self-center font-bold">
                    +{(product.targetPest || product.targetDisease || []).length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Packing Sizes & Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
          
          {/* Packing Sizes */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Packs:</span>
            <span className="font-bold text-slate-700 truncate">
              {product.packing.join(', ')}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectProduct(product)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
            >
              <span>View Specs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>Enquire</span>
            </a>
          </div>

        </div>

      </div>

    </div>
  );
};
