import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { 
  UserCheck, 
  Sun, 
  CloudRain, 
  Calendar, 
  Calculator, 
  MessageSquare, 
  BellRing, 
  ShieldCheck, 
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

interface FarmerPortalProps {
  currentLang: Language;
}

export const FarmerPortal: React.FC<FarmerPortalProps> = ({ currentLang }) => {
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [cropType, setCropType] = useState('Cotton');
  const [sprayDate, setSprayDate] = useState('');
  const [reminderSaved, setReminderSaved] = useState(false);

  const t = TRANSLATIONS[currentLang];

  const handleReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (farmerPhone && sprayDate) {
      setReminderSaved(true);
      setTimeout(() => setReminderSaved(false), 5000);
    }
  };

  return (
    <section id="farmer-portal" className="py-16 bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-500/30 text-xs font-bold mb-3">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Dedicated Farmer Advisory & Smart Services</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            Dr. CHEMISTAR Farmer Smart Portal
          </h2>
          
          <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
            Empowering Indian farmers with weather updates, spray calendars, dosage guides, and direct agronomic support hotline.
          </p>
        </div>

        {/* Dashboard Widgets Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Live Weather & Spray Reminder */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Live Weather Widget Simulation */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 p-6 rounded-3xl border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <h3 className="font-bold text-white text-base">Rajkot & Saurashtra Agro Weather</h3>
                  <p className="text-xs text-slate-400">Live Forecast • Optimal Spraying Indicator</p>
                </div>
                <Sun className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-xs text-slate-400 font-medium block">Temperature</span>
                  <span className="text-xl font-black text-amber-300 font-display">32°C</span>
                </div>

                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-xs text-slate-400 font-medium block">Humidity</span>
                  <span className="text-xl font-black text-sky-300 font-display">68%</span>
                </div>

                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-xs text-slate-400 font-medium block">Wind Speed</span>
                  <span className="text-xl font-black text-emerald-300 font-display">12 km/h</span>
                </div>
              </div>

              <div className="mt-4 bg-emerald-500/20 text-emerald-300 text-xs p-3 rounded-xl border border-emerald-500/30 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Weather condition is optimal for foliar sprays today before 11:00 AM.</span>
              </div>
            </div>

            {/* Spray Schedule SMS/WhatsApp Reminder Creator */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-400" />
                Set Free WhatsApp Spray Reminder
              </h3>
              <p className="text-xs text-slate-300 mb-4">
                Get an automated WhatsApp alert 24 hours prior to your scheduled spray date.
              </p>

              <form onSubmit={handleReminderSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">Farmer Name:</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Name"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">Mobile / WhatsApp No:</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={farmerPhone}
                      onChange={(e) => setFarmerPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">Target Crop:</label>
                    <select
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="Cotton">Cotton (કપાસ)</option>
                      <option value="Groundnut">Groundnut (મગફળી)</option>
                      <option value="Cumin">Cumin (જીરું)</option>
                      <option value="Paddy">Paddy (ડાંગર)</option>
                      <option value="Chilli">Chilli (મરચાં)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">Spray Schedule Date:</label>
                    <input
                      type="date"
                      required
                      value={sprayDate}
                      onChange={(e) => setSprayDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <BellRing className="w-4 h-4" />
                  <span>Activate Free WhatsApp Spray Alert</span>
                </button>

                {reminderSaved && (
                  <div className="bg-emerald-500/20 text-emerald-300 p-3 rounded-xl text-xs font-bold text-center border border-emerald-400/30">
                    ✓ Spray alert scheduled! We will remind you via WhatsApp 1 day prior.
                  </div>
                )}
              </form>
            </div>

          </div>

          {/* Right Column: Expert Support Helpline & Scheme Guidance */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Toll-Free Agri Helpline Card */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-sky-950 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-2xl">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                Direct Agronomist Hotline
              </span>

              <h3 className="text-2xl font-black font-display text-white">
                Speak directly with Dr. CHEMISTAR Crop Doctors
              </h3>

              <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                Got questions regarding dose calculation, chemical mixing order, or severe pest outbreaks? Call our agronomist team directly.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <a
                  href="tel:+918780663808"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm transition-all flex items-center gap-2 shadow-glow-green"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>Call: +91 87806 63808</span>
                </a>

                <a
                  href="https://wa.me/918780663808?text=Hello%20Agri%20Doctor,%20I%20need%20crop%20advice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-2xl text-sm border border-white/20 transition-all flex items-center gap-2"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <span>WhatsApp Doctor</span>
                </a>
              </div>
            </div>

            {/* Quality Commitment Notice */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 space-y-4">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ISO 9001:2015 Certified Quality Assurance
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                All Dr. CHEMISTAR products undergo rigorous HPLC chromatography testing and laboratory purity checks in Rajkot to guarantee maximum efficacy, safety, and rainfastness for Indian agricultural soil conditions.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
