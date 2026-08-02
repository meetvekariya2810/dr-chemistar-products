import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Award, ShieldCheck, Building2, FlaskConical, Target, Heart, CheckCircle2 } from 'lucide-react';

interface AboutUsProps {
  currentLang: Language;
}

export const AboutUs: React.FC<AboutUsProps> = ({ currentLang }) => {
  const t = TRANSLATIONS[currentLang];

  return (
    <section id="about" className="py-16 bg-white text-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full border border-emerald-200 text-xs font-bold mb-3">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Serving Agriculture Since 1998</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900">
            About Dr. CHEMISTAR Crop Care Pvt. Ltd.
          </h2>
          
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            "Happy Farmers... Happy World" • AN ISO 9001:2015 CERTIFIED COMPANY
          </p>
        </div>

        {/* Corporate Profile Card */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl mb-16 relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
            
            <div className="lg:col-span-8 space-y-4">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Company Profile
              </span>

              <h3 className="text-3xl sm:text-4xl font-black font-display text-white">
                Revolutionizing Crop Yield & Farmer Prosperity
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                We take immense pleasure to establish and inform that <span className="font-bold text-white">Dr. Chemistar Crop Care Pvt. Ltd.</span> has been serving Indian agriculture since 1998 with a steadfast goal of achieving a green revolution through superior product quality.
              </p>

              <p className="text-slate-300 text-sm leading-relaxed">
                Our manufacturing facilities produce high-potency Insecticides, Fungicides, Herbicides, Micro Nutrients, Plant Growth Promoters, and Organic Biological Products. Backed by a team of professionally qualified experts in manufacturing, formulation, and marketing, our topmost priority is uncompromising quality.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-center">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-2xl font-black text-emerald-400 font-display">1998</div>
                  <div className="text-xs text-slate-300">Established Year</div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-2xl font-black text-sky-400 font-display">101+</div>
                  <div className="text-xs text-slate-300">Registered Products</div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-2xl font-black text-amber-400 font-display">ISO 9001:2015</div>
                  <div className="text-xs text-slate-300">Certified Quality</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 space-y-3">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Quality Assurance Policy
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Regarding our quality assurance and policy, our uppermost priority is Quality. We have qualified technicians specialized in carrying out analysis and research work using modern equipment.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 space-y-3">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-400" />
                  Clear Vision
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  According to our clear vision, all farmers are benefited with higher quality production and more economical benefit through our agrochemical range.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Mission, Vision & Infrastructure */}
        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 hover:border-emerald-400 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 font-display mb-2">Our Mission</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              To serve our nation by setting benchmark standards of quality, innovation, customer service, and technical support to every Indian farmer.
            </p>
          </div>

          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 hover:border-sky-400 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mb-4">
              <FlaskConical className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 font-display mb-2">R&D & Lab Setup</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Equipped with HPLC chromatography, particle size analyzers, and spectro-photometry testing equipment to ensure 100% active ingredient accuracy.
            </p>
          </div>

          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 hover:border-amber-400 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 font-display mb-2">Manufacturing Plant</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Located at Sopan Industrial Zone, Rajkot (Gujarat) with automated liquid SC/EC lines, WDG granule granulators, and soluble powder packing units.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
