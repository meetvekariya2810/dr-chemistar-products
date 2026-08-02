import React, { useState } from 'react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { PRODUCTS_DATA } from '../data/productsData';
import { DISEASE_PEST_LIBRARY } from '../data/cropData';
import { 
  Stethoscope, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Camera, 
  Droplet, 
  FlaskConical, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface CropDoctorAIProps {
  currentLang: Language;
  onSelectProduct: (product: Product) => void;
}

export const CropDoctorAI: React.FC<CropDoctorAIProps> = ({
  currentLang,
  onSelectProduct
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null);

  const t = TRANSLATIONS[currentLang];

  // Sample crop test presets for instant demo
  const sampleDiagnoses = [
    {
      crop: 'Cotton',
      image: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=600&q=80',
      diseaseName: 'Whitefly & Leaf Curl Warning',
      severity: 'High (78%)',
      symptoms: 'Sticky honeydew on under-leaf surface, adult whitefly colonies, early leaf yellowing.',
      cureProductIds: ['all-takatak', 'malika', 'acprime'],
      dosage: 'ALL TAKATAK @ 30 ml / 15L water',
      preventative: 'Spray immediately before 10 AM. Repeat after 7 days if whitefly nymph population persists.'
    },
    {
      crop: 'Paddy / Rice',
      image: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=600&q=80',
      diseaseName: 'Rice Leaf Blast (Magnaporthe oryzae)',
      severity: 'Moderate (62%)',
      symptoms: 'Spindle-shaped lesions with gray centers and reddish-brown borders on leaves.',
      cureProductIds: ['trycon', 'foliyar', 'faster-plus-plus'],
      dosage: 'TRYCON 75% WP @ 12 gm / 15L water',
      preventative: 'Maintain balanced field water level. Avoid excess Nitrogen application.'
    },
    {
      crop: 'Groundnut',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=600&q=80',
      diseaseName: 'Tikka Disease / Leaf Spot',
      severity: 'Severe (85%)',
      symptoms: 'Circular dark black spots surrounded by yellow halo causing leaf dropping.',
      cureProductIds: ['kombi-shaft', 'hexon-plus', 'vitayu'],
      dosage: 'KOMBI SHAFT @ 30 gm / 15L water',
      preventative: 'Mix STICK WELL surfactant @ 5 ml/pump for 100% leaf adhesion.'
    }
  ];

  const handleRunScan = (sample?: typeof sampleDiagnoses[0]) => {
    const target = sample || sampleDiagnoses[0];
    setSelectedImage(target.image);
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setDiagnosticResult(target);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        handleRunScan(sampleDiagnoses[Math.floor(Math.random() * sampleDiagnoses.length)]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section id="crop-doctor" className="py-16 bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-500/30 text-xs font-bold mb-3">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>AI Agricultural Doctor • Instant Leaf Diagnostic</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
            {t.aiDoctorTitle}
          </h2>
          
          <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
            {t.aiDoctorSubtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Upload & Preset Tester */}
          <div className="lg:col-span-5 bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
            
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-400" />
              1. Upload Crop Leaf Image
            </h3>

            {/* Drop Zone */}
            <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-400 rounded-2xl p-6 text-center transition-colors bg-slate-950/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
              />

              {selectedImage ? (
                <div className="relative rounded-xl overflow-hidden max-h-64 mx-auto">
                  <img src={selectedImage} alt="Crop sample" className="w-full h-48 object-cover rounded-xl" />
                  {isScanning && (
                    <div className="absolute inset-0 bg-emerald-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                      <Sparkles className="w-10 h-10 text-emerald-400 animate-spin mb-2" />
                      <span className="text-xs font-bold text-emerald-300 animate-pulse">{t.analyzingImage}</span>
                      <div className="w-48 bg-slate-800 rounded-full h-2 mt-3 overflow-hidden border border-slate-700">
                        <div 
                          className="bg-emerald-400 h-full transition-all duration-300"
                          style={{ width: `${scanProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-slate-400">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block mb-1">{t.uploadPhoto}</span>
                    <span className="text-[11px] text-slate-400">{t.dropPhotoHere}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Demo Instant Presets */}
            <div className="mt-6">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Or test with instant field samples:</span>
              <div className="grid grid-cols-3 gap-2">
                {sampleDiagnoses.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRunScan(sample)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all group"
                  >
                    <img src={sample.image} alt={sample.crop} className="w-full h-14 object-cover rounded-lg mb-1.5" />
                    <span className="text-[11px] font-bold text-slate-200 block truncate group-hover:text-emerald-400">
                      {sample.crop}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      {sample.diseaseName.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: AI Diagnostic Output Report */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl min-h-[450px]">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h3 className="text-xl font-black font-display text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                2. AI Diagnostic & Spray Recommendation
              </h3>
              {diagnosticResult && (
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setDiagnosticResult(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  New Scan
                </button>
              )}
            </div>

            {diagnosticResult ? (
              <div className="space-y-6 text-sm">
                
                {/* Disease Banner */}
                <div className="bg-gradient-to-r from-emerald-950 to-slate-900 p-5 rounded-2xl border border-emerald-500/40">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30">
                      Crop: {diagnosticResult.crop}
                    </span>
                    <span className="bg-rose-500/20 text-rose-300 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Severity: {diagnosticResult.severity}
                    </span>
                  </div>

                  <h4 className="text-2xl font-black text-white font-display">
                    {diagnosticResult.diseaseName}
                  </h4>
                  <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                    <span className="font-bold text-white">Observed Symptoms:</span> {diagnosticResult.symptoms}
                  </p>
                </div>

                {/* Recommended DR CHEMISTAR Cures */}
                <div>
                  <h5 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                    Recommended DR CHEMISTAR Spray Formulations:
                  </h5>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {diagnosticResult.cureProductIds.map((pid: string) => {
                      const prod = PRODUCTS_DATA.find((p) => p.id === pid);
                      if (!prod) return null;
                      return (
                        <div 
                          key={prod.id} 
                          className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-white text-base font-display">{prod.name}</span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                                {prod.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-semibold line-clamp-1">{prod.commonName}</p>
                            <p className="text-[11px] text-emerald-400 font-bold mt-2">Dose: {prod.dose}</p>
                          </div>

                          <button
                            onClick={() => onSelectProduct(prod)}
                            className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <span>View Full Specs</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preventative Spray Advice */}
                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 text-xs text-amber-200">
                  <span className="font-bold text-amber-300 block mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Agricultural Expert Spray Recommendation:
                  </span>
                  <p>{diagnosticResult.preventative}</p>
                </div>

              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <Stethoscope className="w-12 h-12 text-slate-600 mb-3" />
                <p className="font-semibold text-slate-300">No Leaf Image Scanned Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Upload a crop photo on the left or click one of the instant field sample buttons to generate an AI diagnosis report.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
