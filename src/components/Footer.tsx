import React from 'react';
import { Logo } from './Logo';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Phone, Mail, MapPin, Award, ShieldCheck, Heart, MessageCircle } from 'lucide-react';

interface FooterProps {
  currentLang: Language;
  onNavigate: (sectionId: string) => void;
  onSelectCategory: (category: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentLang,
  onNavigate,
  onSelectCategory
}) => {
  const t = TRANSLATIONS[currentLang];

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">

      {/* Top Footer Callout Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 py-8 px-4 border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black font-display text-white">
                AN ISO 9001:2015 CERTIFIED AGROCHEMICAL COMPANY
              </h3>
              <p className="text-xs text-emerald-300 italic font-semibold">
                "{t.tagline}" • Serving Indian Agriculture Since 1998
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:+916351250285"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-glow-green"
            >
              <Phone className="w-4 h-4" />
              <span>Helpline: +91 6351 250 285</span>
            </a>

            <a
              href="https://wa.me/916351250285?text=Hello%20Dr.%20CHEMISTAR,%20I%20want%20to%20enquire"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-white/20 transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-current text-emerald-400" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Link Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

        {/* Col 1: Brand Info */}
        <div className="lg:col-span-2 space-y-4">
          <Logo variant="dark" />
          <p className="text-slate-400 leading-relaxed max-w-sm">
            Dr. CHEMISTAR Crop Care Pvt. Ltd. is a premier agrochemical manufacturer specializing in high-potency insecticides, fungicides, herbicides, PGRs, and water-soluble fertilizers in India.
          </p>

          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ISO 9001:2015 Quality Management System Certified</span>
          </div>
        </div>

        {/* Col 2: Product Categories */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm font-display tracking-wider uppercase">
            Product Categories
          </h4>
          <ul className="space-y-2 font-medium">
            <li>
              <button onClick={() => onSelectCategory('Insecticide')} className="hover:text-emerald-400 transition-colors">
                🌾 Insecticides (35+ Products)
              </button>
            </li>
            <li>
              <button onClick={() => onSelectCategory('Fungicide')} className="hover:text-emerald-400 transition-colors">
                🛡️ Fungicides (23+ Products)
              </button>
            </li>
            <li>
              <button onClick={() => onSelectCategory('Herbicide')} className="hover:text-emerald-400 transition-colors">
                🌱 Herbicides (12+ Products)
              </button>
            </li>
            <li>
              <button onClick={() => onSelectCategory('PGR')} className="hover:text-emerald-400 transition-colors">
                ⚡ Plant Growth Regulators (PGR)
              </button>
            </li>
            <li>
              <button onClick={() => onSelectCategory('Fertilizer')} className="hover:text-emerald-400 transition-colors">
                💧 Water Soluble NPK Fertilizers
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Portals & Tools */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm font-display tracking-wider uppercase">
            Portals & Smart Tools
          </h4>
          <ul className="space-y-2 font-medium">
            <li>
              <button onClick={() => onNavigate('crop-doctor')} className="hover:text-emerald-400 transition-colors text-emerald-400 font-bold flex items-center gap-1">
                🩺 AI Crop Disease Doctor
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('farmer-portal')} className="hover:text-emerald-400 transition-colors">
                👨‍🌾 Farmer Advisory Portal
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('dealer-portal')} className="hover:text-emerald-400 transition-colors">
                🏬 Dealer & Distributor Portal
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('crop-solutions')} className="hover:text-emerald-400 transition-colors">
                📅 Crop Spray Schedules
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('disease-library')} className="hover:text-emerald-400 transition-colors">
                🐛 Pest & Disease Library
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('admin')} className="hover:text-emerald-400 transition-colors">
                🔒 Admin CMS Access
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Corporate Head Office */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm font-display tracking-wider uppercase">
            Head Office Contact
          </h4>
          <div className="space-y-2.5 text-slate-300">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Survey No. 664, Plot No. 17, Near Atul Auto, N.H.-8B, Sopan Industrial Zone, Rajkot (Guj.)</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <a href="tel:+916351250285" className="hover:text-white font-bold text-amber-300">
                +91 6351 250 285
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <a href="mailto:drchemistarcrop@gmail.com" className="hover:text-white text-sky-300">
                drchemistarcrop@gmail.com
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-slate-900 py-6 px-4 text-center text-slate-500 text-[11px]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Dr. CHEMISTAR Crop Care Pvt. Ltd. All rights reserved. Registered Trademark ®.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-current" /> for Happy Farmers across India.
          </p>
        </div>
      </div>

    </footer>
  );
};
