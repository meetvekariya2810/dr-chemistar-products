import React from 'react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { getProductImageUrl } from '../lib/productImage';
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

  const whatsAppUrl = `https://wa.me/916351250285?text=Hello%20Dr.%20CHEMISTAR,%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}%20(${encodeURIComponent(product.commonName)}).%20Please%20send%20details%20and%20dealer%20price.`;

  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  // Cards render at 220px, so use the 500x500 asset - the 150x150 thumbnail
  // would visibly upscale and blur.
  const imageUrl = getProductImageUrl(product, 'full');

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1 h-full">
      
      {/* Product Image Header Container (Exactly 220px, Contain, White Background, 15px Padding, 12px Radius) */}
      <div 
        className="relative w-full h-[220px] bg-white p-[15px] rounded-t-[12px] flex items-center justify-center overflow-hidden border-b border-slate-100"
      >
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${getCategoryColor(product.category)}`}>
              {product.category}
            </span>

            {product.pdfPage && (
              <span className="bg-slate-900/80 backdrop-blur-md text-amber-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30">
                Page {product.pdfPage}
              </span>
            )}
          </div>

          {product.badge && (
            <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 pointer-events-auto">
              <Sparkles className="w-2.5 h-2.5 fill-current" />
              {product.badge}
            </span>
          )}
        </div>

        {/* Real Image or Placeholder */}
        {imageUrl && !imgError ? (
          <>
            {/* Skeleton Loader */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-50 animate-pulse flex items-center justify-center rounded-t-[12px]">
                <FlaskConical className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            )}
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-contain rounded-[12px] transition-opacity duration-300 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          /* Placeholder Box */
          <div className="w-full h-full bg-slate-50 border border-slate-150 rounded-[12px] flex flex-col items-center justify-center text-slate-400 p-4 transition-colors group-hover:bg-slate-100/50">
            <FlaskConical className="w-12 h-12 text-slate-300 mb-2 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
              No Image Available
            </span>
          </div>
        )}

        {/* ISO Stamp */}
        <div className="absolute bottom-2 right-3 text-[9px] text-slate-400 font-semibold flex items-center gap-0.5 select-none pointer-events-none">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>ISO 9001:2015</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        
        <div>
          {/* Product Title - Aligned height */}
          <div className="flex items-start justify-between gap-2 min-h-[28px]">
            <h3 className="text-lg font-extrabold text-slate-900 font-display line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {product.name}
            </h3>
          </div>

          {/* Technical Composition Name - Aligned height */}
          <div className="mt-1 bg-slate-100/80 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 border border-slate-200 flex items-start gap-1.5 min-h-[44px]">
            <Leaf className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{product.commonName}</span>
          </div>

          {/* Recommended Dose - Aligned height */}
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100 min-h-[36px]">
            <Droplet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="truncate">{product.dose || 'Contact for dosage'}</span>
          </div>

          {/* Target Pests / Diseases - Aligned height */}
          <div className="mt-3 text-xs text-slate-600 min-h-[58px]">
            <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Bug className="w-3.5 h-3.5 text-rose-500" />
              Target:
            </span>
            <div className="flex flex-wrap gap-1">
              {(product.targetPest && product.targetPest.length > 0) || (product.targetDisease && product.targetDisease.length > 0) ? (
                [...(product.targetPest || []), ...(product.targetDisease || [])].slice(0, 2).map((target, idx) => (
                  <span 
                    key={idx} 
                    className="bg-slate-100 text-slate-700 text-[9px] font-medium px-2 py-0.5 rounded border border-slate-200 truncate max-w-[120px]"
                  >
                    {target}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-slate-400 italic">General crop protection</span>
              )}
              {((product.targetPest || []).length + (product.targetDisease || []).length) > 2 && (
                <span className="text-[9px] text-slate-500 self-center font-bold">
                  +{((product.targetPest || []).length + (product.targetDisease || []).length) - 2} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Packing Sizes & Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
          
          {/* Packing Sizes */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 min-h-[16px]">
            <Package className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
            <span className="font-medium">Packs:</span>
            <span className="font-bold text-slate-700 truncate">
              {product.packing && product.packing.length > 0 ? product.packing.join(', ') : 'Custom pack sizes'}
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
