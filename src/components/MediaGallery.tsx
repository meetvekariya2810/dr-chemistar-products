import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Image as ImageIcon, Video, Building2, FlaskConical, Users, Award, Play, X } from 'lucide-react';

interface MediaGalleryProps {
  currentLang: Language;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ currentLang }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'factory' | 'lab' | 'field' | 'events'>('all');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const t = TRANSLATIONS[currentLang];

  const galleryItems = [
    {
      id: '1',
      title: 'State-of-the-Art Analytical R&D Lab',
      category: 'lab',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      description: 'ISO 9001:2015 certified HPLC quality control testing lab in Rajkot.',
      videoUrl: '/videos/laboratory_manufacturing.mp4'
    },
    {
      id: '2',
      title: 'High Capacity Liquid Formulation Plant',
      category: 'factory',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
      description: 'Automated filling and micro-suspension processing unit.',
      videoUrl: '/videos/seed_growth.mp4'
    },
    {
      id: '3',
      title: 'Cotton Field Demonstration & Farmer Training',
      category: 'field',
      image: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=800&q=80',
      description: 'Live trial of MALIKA & ALL TAKATAK against whitefly in Gujarat.',
      videoUrl: '/videos/farmer_journey.mp4'
    },
    {
      id: '4',
      title: 'Annual Dealers & Distributors Summit',
      category: 'events',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
      description: 'Celebrating 28+ years of growth with 50,000+ pan-India partners.',
      videoUrl: '/videos/sunrise_landscape.mp4'
    },
    {
      id: '5',
      title: 'Quality Control & Purity Spectrometry',
      category: 'lab',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
      description: 'Rigorous sample verification for active ingredient concentration.',
      videoUrl: '/videos/ai_drone_scanning.mp4'
    },
    {
      id: '6',
      title: 'Granular WDG & Soluble Packaging Facility',
      category: 'factory',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      description: 'Automated moisture-proof pouch packing line.'
    }
  ];

  const filteredItems = activeTab === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeTab);

  return (
    <section id="gallery" className="py-16 bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-500/30 text-xs font-bold mb-3">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Corporate Infrastructure & Media Gallery</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            Manufacturing Excellence & Field Impact
          </h2>
          
          <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
            Take a visual tour inside Dr. CHEMISTAR’s modern manufacturing facility, analytical research labs, and farmer training conventions.
          </p>
        </div>

        {/* Gallery Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Media ({galleryItems.length})
          </button>
          <button
            onClick={() => setActiveTab('factory')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'factory' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🏭 Manufacturing Unit
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'lab' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🧪 R&D Laboratory
          </button>
          <button
            onClick={() => setActiveTab('field')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'field' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🌱 Field Demos
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'events' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🤝 Dealer Meets
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => item.videoUrl && setSelectedVideo(item.videoUrl)}
              className={`group relative rounded-3xl overflow-hidden border border-white/10 bg-slate-800 shadow-2xl ${
                item.videoUrl ? 'cursor-pointer hover:border-emerald-500/50' : ''
              } transition-all duration-300`}
            >
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-90 p-6 flex flex-col justify-end">
                {item.videoUrl && (
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-emerald-600 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                )}
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-400/40 w-max uppercase tracking-wider mb-2">
                  {item.category} {item.videoUrl && '• Video'}
                </span>
                <h3 className="text-lg font-bold text-white font-display">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Video Modal Overlay */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="relative bg-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/10 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Player */}
            <div className="aspect-video w-full bg-black">
              <video
                src={selectedVideo}
                autoPlay
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
