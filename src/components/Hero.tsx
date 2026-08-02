import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { 
  Search, 
  Stethoscope, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  Users, 
  Sprout, 
  Sparkles,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface HeroProps {
  currentLang: Language;
  onNavigate: (sectionId: string) => void;
  onSearchSubmit: (query: string) => void;
  onSelectCategory: (category: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  currentLang,
  onNavigate,
  onSearchSubmit,
  onSelectCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const t = TRANSLATIONS[currentLang];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <section className="relative overflow-hidden bg-slate-900 text-white min-h-[85vh] flex items-center">
      {/* Background Graphic & Ambient Light */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 opacity-90 z-0"></div>
      
      {/* Ambient glowing orbs themed after the logo colors */}
      {/* Top Left - Purple (Top Petal) */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none z-0"></div>
      {/* Bottom Right - Orange/Amber (Right Petal) */}
      <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse-glow"></div>
      {/* Left Center - Sky Blue (Left Petal) */}
      <div className="absolute top-[30%] -left-40 w-[450px] h-[450px] bg-sky-500/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      {/* Right Center - Emerald Green (Flask Liquid) */}
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* Giant Logo Watermark Background Effect */}
      <div className="absolute right-[-15%] md:right-[2%] bottom-[-10%] md:bottom-[5%] w-[450px] h-[450px] md:w-[700px] md:h-[700px] lg:w-[850px] lg:h-[850px] opacity-[0.06] pointer-events-none select-none z-0 animate-float-slow transform origin-center">
        <svg viewBox="0 0 100 100" className="w-full h-full text-white">
          <defs>
            <linearGradient id="heroTopPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
            <linearGradient id="heroLeftPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="heroRightPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <radialGradient id="heroSoilBgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>

          {/* Top Magenta/Purple Petal */}
          <path 
            d="M 50 8 C 65 8 78 20 74 38 C 65 48 50 46 50 46 C 50 46 35 48 26 38 C 22 20 35 8 50 8 Z" 
            fill="url(#heroTopPetalGrad)" 
          />

          {/* Bottom Left Deep Blue Petal */}
          <path 
            d="M 12 70 C 5 55 18 38 36 44 C 44 54 42 68 42 68 C 42 68 30 76 18 84 C 10 88 12 70 12 70 Z" 
            fill="url(#heroLeftPetalGrad)" 
          />

          {/* Bottom Right Orange Petal */}
          <path 
            d="M 88 70 C 95 55 82 38 64 44 C 56 54 58 68 58 68 C 58 68 70 76 82 84 C 90 88 88 70 88 70 Z" 
            fill="url(#heroRightPetalGrad)" 
          />

          {/* Central Circular Seal Container */}
          <circle cx="50" cy="50" r="23" fill="url(#heroSoilBgGrad)" stroke="#ffffff" strokeWidth="2.5" />

          {/* Rich Soil mound inside seal */}
          <ellipse cx="50" cy="62" rx="16" ry="6" fill="#854d0e" />

          {/* Central Chemical Flask */}
          <path 
            d="M 45 36 L 45 42 L 36 56 C 34 59 36 64 40 64 L 60 64 C 64 64 66 59 64 56 L 55 42 L 55 36 Z" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="2.2" 
            strokeLinejoin="round" 
          />
          {/* Flask Liquid */}
          <path 
            d="M 38 54 C 43 51 57 55 62 54 L 60 63 L 40 63 Z" 
            fill="#10b981" 
          />
          {/* Liquid Bubbles */}
          <circle cx="46" cy="57" r="1.5" fill="#ffffff" opacity="0.9" />
          <circle cx="52" cy="53" r="1.2" fill="#ffffff" opacity="0.9" />
          <circle cx="55" cy="58" r="1.8" fill="#ffffff" opacity="0.9" />
          {/* Flask Rim */}
          <line x1="43" y1="36" x2="57" y2="36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Decorative Grid Overlay */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 lg:py-24 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & Search */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            
            {/* ISO Badge & Slogan Tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wide backdrop-blur-md">
                <Award className="w-4 h-4 text-amber-400" />
                {t.isoCert}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-sky-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                {t.tagline}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-tight">
              {t.heroTitle.split(' ').slice(0, 3).join(' ')}{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300 bg-clip-text text-transparent">
                {t.heroTitle.split(' ').slice(3).join(' ')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              {t.heroSubtitle}
            </p>

            {/* Smart Search Bar */}
            <form 
              onSubmit={handleSearch}
              className="w-full max-w-xl bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-2 mt-2"
            >
              <div className="relative flex-1 flex items-center pl-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent text-white placeholder-slate-400 px-3 py-2 text-sm focus:outline-none font-medium"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
              >
                <span>Search</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
              <span className="text-slate-400 self-center mr-1">Quick Lookup:</span>
              <button 
                onClick={() => onSelectCategory('Insecticide')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/30 border border-white/10 hover:border-emerald-400/50 transition-all"
              >
                🌾 Insecticides (35+)
              </button>
              <button 
                onClick={() => onSelectCategory('Fungicide')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-sky-500/30 border border-white/10 hover:border-sky-400/50 transition-all"
              >
                🛡️ Fungicides (23+)
              </button>
              <button 
                onClick={() => onSelectCategory('Herbicide')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/30 border border-white/10 hover:border-amber-400/50 transition-all"
              >
                🌱 Herbicides (12+)
              </button>
              <button 
                onClick={() => onSelectCategory('PGR')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-purple-500/30 border border-white/10 hover:border-purple-400/50 transition-all"
              >
                ⚡ PGR & Bio (17+)
              </button>
              <button 
                onClick={() => onSelectCategory('Fertilizer')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-teal-500/30 border border-white/10 hover:border-teal-400/50 transition-all"
              >
                💧 Water Soluble NPK (14+)
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => onNavigate('products')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-glow-green transition-all flex items-center gap-2"
              >
                <span>{t.exploreProducts}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('crop-doctor')}
                className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-glow-blue transition-all flex items-center gap-2 border border-sky-400/30"
              >
                <Stethoscope className="w-4 h-4" />
                <span>{t.askCropDoctor}</span>
              </button>

              <button
                onClick={() => onNavigate('dealer-portal')}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-xl font-bold text-sm border border-white/20 transition-all"
              >
                {t.becomeDealer}
              </button>
            </div>

          </div>

          {/* Right Column: Hero Visual Card & Trust Badges */}
          <div className="lg:col-span-5 relative">
            
            {/* Glassmorphic Feature Card */}
            <div className="glass-card-dark p-6 rounded-3xl relative z-10 border border-white/15">
              
              {/* Card Header Badge */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Dr. CHEMISTAR Advantage</h3>
                    <p className="text-xs text-slate-400">Since 1998 • Rajkot, Gujarat</p>
                  </div>
                </div>
                <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
                  ISO 9001:2015
                </span>
              </div>

              {/* Highlights List */}
              <div className="space-y-4 text-xs text-slate-300 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">101+ High Efficacy Formulations</span>
                    <p className="text-slate-400">Insecticides, Fungicides, Herbicides, PGRs & NPK mixtures.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Modern R&D Laboratory & Factory</span>
                    <p className="text-slate-400">State-of-the-art analytical research unit in Rajkot Industrial Zone.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Nationwide Dealer Network</span>
                    <p className="text-slate-400">Trusted by over 50,000+ dealers & millions of happy farmers across India.</p>
                  </div>
                </div>
              </div>

              {/* Live AI Doctor Mini Promo Box */}
              <div 
                onClick={() => onNavigate('crop-doctor')}
                className="bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/30 p-4 rounded-2xl cursor-pointer hover:border-emerald-400/60 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Crop Disease Diagnostic Engine
                      </h4>
                      <p className="text-[11px] text-slate-400">Snap leaf photo to detect disease</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>

            {/* Back Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-sky-500 rounded-3xl blur-2xl opacity-20 -z-10 transform scale-95"></div>

          </div>

        </div>

        {/* Corporate Numbers & Stats Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-white/10">
          
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <div className="text-3xl font-black text-emerald-400 font-display">101+</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">Official Products</div>
            <div className="text-[10px] text-slate-400">In 5 Primary Agro Categories</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <div className="text-3xl font-black text-sky-400 font-display">28+</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">Years of Trust</div>
            <div className="text-[10px] text-slate-400">Established Since 1998</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <div className="text-3xl font-black text-amber-400 font-display">50,000+</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">Authorized Dealers</div>
            <div className="text-[10px] text-slate-400">Pan-India Network</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <div className="text-3xl font-black text-rose-400 font-display">5 Million+</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">Happy Farmers</div>
            <div className="text-[10px] text-slate-400">Happy Farmers… Happy World</div>
          </div>

        </div>

      </div>
    </section>
  );
};
