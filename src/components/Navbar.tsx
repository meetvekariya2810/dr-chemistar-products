import React, { useState } from 'react';
import { Logo } from './Logo';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { 
  Phone, 
  Mail, 
  Globe, 
  Search, 
  Stethoscope, 
  Award, 
  Menu, 
  X, 
  MessageCircle, 
  ShieldCheck,
  UserCheck,
  Building2,
  Lock,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  activeSection,
  onNavigate,
  onOpenSearch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[currentLang];

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-md transition-all">
      {/* Top Corporate Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-emerald-950 text-white text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Left: Certification & Slogan */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[11px] font-bold border border-amber-500/30">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              {t.isoCert}
            </span>
            <span className="hidden md:inline text-emerald-300 italic font-medium">
              "{t.tagline}"
            </span>
          </div>

          {/* Right: Contact details & Language Switcher */}
          <div className="flex items-center gap-4 text-[11px]">
            <a 
              href="tel:+916351250285" 
              className="flex items-center gap-1 text-slate-200 hover:text-emerald-400 transition-colors"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold">+91 6351 250 285</span>
            </a>
            
            <a 
              href="mailto:drchemistarcrop@gmail.com" 
              className="hidden lg:flex items-center gap-1 text-slate-300 hover:text-sky-400 transition-colors"
            >
              <Mail className="w-3 h-3 text-sky-400" />
              <span>drchemistarcrop@gmail.com</span>
            </a>

            {/* Multilingual Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <select
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-slate-900 text-white">English (EN)</option>
                <option value="hi" className="bg-slate-900 text-white">हिन्दी (HI)</option>
                <option value="gu" className="bg-slate-900 text-white">ગુજરાતી (GU)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <button 
            onClick={() => handleNavClick('home')} 
            className="text-left focus:outline-none group"
          >
            <Logo className="h-12 sm:h-14" />
          </button>

          {/* Mobile & Tablet Tagline (Centered Slogan) */}
          <div className="hidden min-[460px]:flex xl:hidden flex-1 justify-center px-2 text-center">
            <span className="text-[10px] sm:text-xs font-black italic bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent tracking-tight">
              "{t.tagline}"
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden xl:flex items-center gap-1 font-medium text-xs text-slate-700">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3 py-2 rounded-lg transition-all ${
                activeSection === 'home' 
                  ? 'bg-emerald-50 text-emerald-700 font-bold' 
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {t.navHome}
            </button>

            <button
              onClick={() => handleNavClick('products')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1 ${
                activeSection === 'products' 
                  ? 'bg-emerald-50 text-emerald-700 font-bold' 
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {t.navProducts}
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                101
              </span>
            </button>

            <button
              onClick={() => handleNavClick('crop-solutions')}
              className={`px-3 py-2 rounded-lg transition-all ${
                activeSection === 'crop-solutions' 
                  ? 'bg-emerald-50 text-emerald-700 font-bold' 
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {t.navCropSolutions}
            </button>

            <button
              onClick={() => handleNavClick('disease-library')}
              className={`px-3 py-2 rounded-lg transition-all ${
                activeSection === 'disease-library' 
                  ? 'bg-emerald-50 text-emerald-700 font-bold' 
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {t.navDiseaseLibrary}
            </button>

            <button
              onClick={() => handleNavClick('crop-doctor')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 font-bold ${
                activeSection === 'crop-doctor' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-gradient-to-r from-emerald-500 to-sky-600 text-white hover:opacity-90 shadow-sm'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              {t.navCropDoctor}
              <Sparkles className="w-3 h-3 text-amber-300" />
            </button>

            <button
              onClick={() => handleNavClick('farmer-portal')}
              className={`px-3 py-2 rounded-lg transition-all ${
                activeSection === 'farmer-portal' 
                  ? 'bg-emerald-50 text-emerald-700 font-bold' 
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {t.navFarmerPortal}
            </button>

            <button
              onClick={() => handleNavClick('dealer-portal')}
              className={`px-3 py-2 rounded-lg transition-all ${
                activeSection === 'dealer-portal' 
                  ? 'bg-emerald-50 text-emerald-700 font-bold' 
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {t.navDealerPortal}
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className={`px-3 py-2 rounded-lg transition-all ${
                activeSection === 'about' 
                  ? 'bg-emerald-50 text-emerald-700 font-bold' 
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {t.navAbout}
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Search */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
              title="Search Products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* WhatsApp Direct Enquiry */}
            <a
              href="https://wa.me/916351250285?text=Hello%20Dr.%20CHEMISTAR%20Team,%20I%20would%20like%20to%20enquire%20about%20your%20products."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp</span>
            </a>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden mt-3 pt-3 border-t border-slate-200 flex flex-col gap-1 font-medium text-sm text-slate-700">
            <button
              onClick={() => handleNavClick('home')}
              className="px-4 py-2.5 text-left hover:bg-emerald-50 rounded-lg font-semibold"
            >
              {t.navHome}
            </button>

            <button
              onClick={() => handleNavClick('products')}
              className="px-4 py-2.5 text-left hover:bg-emerald-50 rounded-lg font-semibold flex justify-between items-center"
            >
              <span>{t.navProducts}</span>
              <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">101</span>
            </button>

            <button
              onClick={() => handleNavClick('crop-solutions')}
              className="px-4 py-2.5 text-left hover:bg-emerald-50 rounded-lg"
            >
              {t.navCropSolutions}
            </button>

            <button
              onClick={() => handleNavClick('disease-library')}
              className="px-4 py-2.5 text-left hover:bg-emerald-50 rounded-lg"
            >
              {t.navDiseaseLibrary}
            </button>

            <button
              onClick={() => handleNavClick('crop-doctor')}
              className="px-4 py-2.5 text-left bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-lg font-bold flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              {t.navCropDoctor}
            </button>

            <button
              onClick={() => handleNavClick('farmer-portal')}
              className="px-4 py-2.5 text-left hover:bg-emerald-50 rounded-lg"
            >
              {t.navFarmerPortal}
            </button>

            <button
              onClick={() => handleNavClick('dealer-portal')}
              className="px-4 py-2.5 text-left hover:bg-emerald-50 rounded-lg"
            >
              {t.navDealerPortal}
            </button>

            <button
              onClick={() => handleNavClick('gallery')}
              className="px-4 py-2.5 text-left hover:bg-emerald-50 rounded-lg"
            >
              {t.navGallery}
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className="px-4 py-2.5 text-left hover:bg-emerald-50 rounded-lg"
            >
              {t.navAbout}
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className="px-4 py-2.5 text-left hover:bg-emerald-50 rounded-lg"
            >
              {t.navContact}
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};
