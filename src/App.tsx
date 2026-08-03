import React, { useState, useEffect } from 'react';
import { Language, Product, ProductCategory } from './types';
import { TRANSLATIONS } from './data/translations';
import { PRODUCTS_DATA } from './data/productsData';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CropDoctorAI } from './components/CropDoctorAI';
import { CropSolutions } from './components/CropSolutions';
import { DiseaseLibrary } from './components/DiseaseLibrary';
import { FarmerPortal } from './components/FarmerPortal';
import { DealerPortal } from './components/DealerPortal';
import { MediaGallery } from './components/MediaGallery';
import { AboutUs } from './components/AboutUs';
import { ContactSection } from './components/ContactSection';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { fetchProducts, seedProducts, isApiConfigured } from './api';
import { 
  Search, 
  X, 
  FlaskConical, 
  Sparkles, 
  MessageCircle, 
  ChevronUp,
  Filter,
  CheckCircle2,
  Award
} from 'lucide-react';

export function App() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [activeSection, setActiveSection] = useState<string>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
      return 'admin';
    }
    const cleanHash = hash.replace('#', '').replace('/', '');
    if (cleanHash && ['home', 'products', 'crop-solutions', 'disease-library', 'crop-doctor', 'farmer-portal', 'dealer-portal', 'gallery', 'about', 'contact', 'admin'].includes(cleanHash)) {
      return cleanHash;
    }
    return 'home';
  });
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS_DATA);
  
  // Product filtering states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [prefilledDealerProduct, setPrefilledDealerProduct] = useState<string>('');
  
  // Scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const t = TRANSLATIONS[currentLang];

  useEffect(() => {
    if (!isApiConfigured) return;

    const loadProducts = async () => {
      try {
        let dbProducts = await fetchProducts();

        // Auto-seed database if MySQL products table is empty
        if (dbProducts.length === 0 && PRODUCTS_DATA.length > 0) {
          console.log('Seeding products database with initial catalogue data...');
          await seedProducts(PRODUCTS_DATA);
          dbProducts = await fetchProducts();
        }

        if (dbProducts && dbProducts.length > 0) {
          setProductsList(dbProducts);
        }
      } catch (err) {
        console.error('Failed to load products from database, falling back to static data:', err);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) setShowScrollTop(true);
      else setShowScrollTop(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
        setActiveSection('admin');
      } else {
        const cleanHash = hash.replace('#', '').replace('/', '');
        if (cleanHash && ['home', 'products', 'crop-solutions', 'disease-library', 'crop-doctor', 'farmer-portal', 'dealer-portal', 'gallery', 'about', 'contact', 'admin'].includes(cleanHash)) {
          setActiveSection(cleanHash);
        } else if (path === '/' || path === '/index.html') {
          setActiveSection('home');
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else if (sectionId === 'home') {
      window.history.pushState(null, '', '/');
    } else {
      window.history.pushState(null, '', `/#${sectionId}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setActiveSection('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setActiveSection('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestDealerQuote = (productName: string) => {
    setPrefilledDealerProduct(productName);
    setActiveSection('dealer-portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter 101 Products
  const filteredProducts = productsList.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.commonName.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q) ||
      product.targetCrops.some((c) => c.toLowerCase().includes(q)) ||
      (product.targetPest && product.targetPest.some((p) => p.toLowerCase().includes(q))) ||
      (product.targetDisease && product.targetDisease.some((d) => d.toLowerCase().includes(q)));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Header Navbar */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Content Area based on Active Navigation */}
      <main className="flex-1">
        
        {activeSection === 'home' && (
          <>
            <Hero
              currentLang={currentLang}
              onNavigate={handleNavigate}
              onSearchSubmit={handleSearchSubmit}
              onSelectCategory={handleSelectCategory}
            />

            {/* Featured Product Categories Section */}
            <section className="py-16 bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4">
                
                <div className="text-center max-w-3xl mx-auto mb-12">
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full border border-emerald-200 text-xs font-bold mb-3">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    <span>Official 101 Product Range • ISO 9001:2015</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-black font-display text-slate-900">
                    Explore Product Categories
                  </h2>
                  <p className="text-slate-600 text-sm mt-2">
                    High-efficiency agricultural formulations tested for maximum bio-efficacy and rainfastness.
                  </p>
                </div>

                {/* Category Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  
                  <div 
                    onClick={() => handleSelectCategory('Insecticide')}
                    className="group bg-gradient-to-br from-emerald-800 to-teal-950 text-white p-5 rounded-2xl cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    <span className="text-2xl mb-2 block">🌾</span>
                    <h3 className="font-bold text-base font-display">Insecticides</h3>
                    <p className="text-[11px] text-emerald-300 mt-1 font-semibold">35+ Formulations</p>
                    <p className="text-[10px] text-slate-300 mt-2 line-clamp-2">MALIKA, BABULI, LALA, STAR TARA, FASTER ++</p>
                  </div>

                  <div 
                    onClick={() => handleSelectCategory('Fungicide')}
                    className="group bg-gradient-to-br from-sky-800 to-blue-950 text-white p-5 rounded-2xl cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    <span className="text-2xl mb-2 block">🛡️</span>
                    <h3 className="font-bold text-base font-display">Fungicides</h3>
                    <p className="text-[11px] text-sky-300 mt-1 font-semibold">23+ Formulations</p>
                    <p className="text-[10px] text-slate-300 mt-2 line-clamp-2">KOMBI SHAFT, HEXON PLUS, MAXIL, TEBSAL</p>
                  </div>

                  <div 
                    onClick={() => handleSelectCategory('Herbicide')}
                    className="group bg-gradient-to-br from-amber-800 to-orange-950 text-white p-5 rounded-2xl cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    <span className="text-2xl mb-2 block">🌱</span>
                    <h3 className="font-bold text-base font-display">Herbicides</h3>
                    <p className="text-[11px] text-amber-300 mt-1 font-semibold">12+ Formulations</p>
                    <p className="text-[10px] text-slate-300 mt-2 line-clamp-2">GLYSTAR-41, TARA-71, PENIL EXTRA, STAR GOLD</p>
                  </div>

                  <div 
                    onClick={() => handleSelectCategory('PGR')}
                    className="group bg-gradient-to-br from-purple-800 to-indigo-950 text-white p-5 rounded-2xl cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    <span className="text-2xl mb-2 block">⚡</span>
                    <h3 className="font-bold text-base font-display">PGR & Bio</h3>
                    <p className="text-[11px] text-purple-300 mt-1 font-semibold">17+ Formulations</p>
                    <p className="text-[10px] text-slate-300 mt-2 line-clamp-2">CALL BREAK, GIBOLA, CYTO-6, ROBOT, STICK WELL</p>
                  </div>

                  <div 
                    onClick={() => handleSelectCategory('Fertilizer')}
                    className="group bg-gradient-to-br from-teal-800 to-emerald-950 text-white p-5 rounded-2xl cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 col-span-2 md:col-span-1"
                  >
                    <span className="text-2xl mb-2 block">💧</span>
                    <h3 className="font-bold text-base font-display">Fertilizers</h3>
                    <p className="text-[11px] text-teal-300 mt-1 font-semibold">14+ Formulations</p>
                    <p className="text-[10px] text-slate-300 mt-2 line-clamp-2">NPK 19:19:19, DIPPY L-DAP, ZIVAA +, NUTRIVA</p>
                  </div>

                </div>

              </div>
            </section>

            {/* Popular Featured Products Preview Grid */}
            <section className="py-16 bg-slate-50">
              <div className="max-w-7xl mx-auto px-4">
                
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                  <div>
                    <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider block">
                      Farmer Best-Sellers
                    </span>
                    <h2 className="text-3xl font-black font-display text-slate-900 mt-1">
                      Featured Formulations
                    </h2>
                  </div>

                  <button
                    onClick={() => handleNavigate('products')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>View All 101 Products</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {PRODUCTS_DATA.filter((p) => p.popular).slice(0, 8).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currentLang={currentLang}
                      onSelectProduct={setSelectedProduct}
                    />
                  ))}
                </div>

              </div>
            </section>

            {/* AI Crop Doctor Section Preview */}
            <CropDoctorAI
              currentLang={currentLang}
              onSelectProduct={setSelectedProduct}
            />

            {/* Crop Solutions Preview */}
            <CropSolutions
              currentLang={currentLang}
              onSelectProduct={setSelectedProduct}
            />

            {/* About Us Brief Section */}
            <AboutUs currentLang={currentLang} />

            {/* Contact Section */}
            <ContactSection currentLang={currentLang} />
          </>
        )}

        {/* PRODUCTS CATALOGUE VIEW (101 ITEMS) */}
        {activeSection === 'products' && (
          <section className="py-12 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4">
              
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900">
                  Complete Product Catalogue ({filteredProducts.length} of {productsList.length})
                </h1>
                <p className="text-slate-600 text-sm mt-1">
                  Official registered agrochemical formulations of Dr. CHEMISTAR Crop Care Pvt. Ltd.
                </p>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
                
                {/* Category Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5" /> Category:
                  </span>
                  {['All', 'Insecticide', 'Fungicide', 'Herbicide', 'PGR', 'Fertilizer'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 border ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat === 'All' ? 'All (101)' : cat === 'PGR' ? 'PGR & Bio' : `${cat}s`}
                    </button>
                  ))}
                </div>

                {/* Live Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 101 products by name, active ingredient, crop or target pest..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

              </div>

              {/* 101 Products Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currentLang={currentLang}
                      onSelectProduct={setSelectedProduct}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 max-w-md mx-auto my-8">
                  <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700">No products matching "{searchQuery}"</p>
                  <p className="text-xs text-slate-500 mt-1">Try searching for common names like Thiamethoxam, Fipronil, Glyphosate, or Mancozeb.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="mt-4 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Reset Search Filter
                  </button>
                </div>
              )}

            </div>
          </section>
        )}

        {activeSection === 'crop-solutions' && (
          <CropSolutions currentLang={currentLang} onSelectProduct={setSelectedProduct} />
        )}

        {activeSection === 'disease-library' && (
          <DiseaseLibrary currentLang={currentLang} onSelectProduct={setSelectedProduct} />
        )}

        {activeSection === 'crop-doctor' && (
          <CropDoctorAI currentLang={currentLang} onSelectProduct={setSelectedProduct} />
        )}

        {activeSection === 'farmer-portal' && (
          <FarmerPortal currentLang={currentLang} />
        )}

        {activeSection === 'dealer-portal' && (
          <DealerPortal currentLang={currentLang} prefilledProductName={prefilledDealerProduct} />
        )}

        {activeSection === 'gallery' && (
          <MediaGallery currentLang={currentLang} />
        )}

        {activeSection === 'about' && (
          <AboutUs currentLang={currentLang} />
        )}

        {activeSection === 'contact' && (
          <ContactSection currentLang={currentLang} />
        )}

        {activeSection === 'admin' && (
          <AdminPanel currentLang={currentLang} />
        )}

      </main>

      {/* Global Product Specification Modal */}
      <ProductModal
        product={selectedProduct}
        currentLang={currentLang}
        onClose={() => setSelectedProduct(null)}
        onRequestDealerQuote={handleRequestDealerQuote}
      />

      {/* Global Quick Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 relative border border-slate-200">
            <button
              onClick={() => setSearchModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 text-lg mb-4 font-display">
              Quick Search 101+ Dr. CHEMISTAR Formulations
            </h3>

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                autoFocus
                placeholder="Type product name, crop, active chemical..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {productsList.filter((p) => 
                !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.commonName.toLowerCase().includes(searchQuery.toLowerCase())
              ).slice(0, 6).map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    setSelectedProduct(prod);
                    setSearchModalOpen(false);
                  }}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl cursor-pointer border border-slate-200 transition-colors flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-sm font-display">{prod.name}</span>
                    <p className="text-xs text-slate-500">{prod.commonName}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    {prod.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Scroll To Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-full shadow-2xl transition-all"
          title="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Footer */}
      <Footer
        currentLang={currentLang}
        onNavigate={handleNavigate}
        onSelectCategory={handleSelectCategory}
      />

    </div>
  );
}

export default App;
