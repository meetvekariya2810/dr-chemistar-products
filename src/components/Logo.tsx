import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
  showIsoBadge?: boolean;
  showTagline?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = 'h-12', 
  variant = 'light',
  showSubtitle = true,
  showIsoBadge = false,
  showTagline = true,
  layout = 'horizontal'
}) => {
  const isDark = variant === 'dark';
  
  return (
    <div className={`flex ${layout === 'vertical' ? 'flex-col items-center text-center' : 'items-center'} gap-3 select-none ${className}`}>
      
      {/* Official 3-Petal Tri-Color Flask Graphic Emblem */}
      <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
        {/* Interactive background glow backdrop */}
        <div className="absolute inset-[-4px] bg-gradient-to-tr from-emerald-500/30 via-purple-500/20 to-amber-500/30 rounded-full blur-md opacity-40 group-hover:opacity-90 group-hover:scale-115 transition-all duration-500"></div>
        {/* Outer 3-petaled tri-color orbit SVG matching exact PDF design */}
        <svg viewBox="0 0 100 100" className="relative w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="topPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
            <linearGradient id="leftPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="rightPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <radialGradient id="soilBgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>

          {/* Top Magenta/Purple Petal */}
          <path 
            d="M 50 8 C 65 8 78 20 74 38 C 65 48 50 46 50 46 C 50 46 35 48 26 38 C 22 20 35 8 50 8 Z" 
            fill="url(#topPetalGrad)" 
          />

          {/* Bottom Left Deep Blue Petal */}
          <path 
            d="M 12 70 C 5 55 18 38 36 44 C 44 54 42 68 42 68 C 42 68 30 76 18 84 C 10 88 12 70 12 70 Z" 
            fill="url(#leftPetalGrad)" 
          />

          {/* Bottom Right Orange Petal */}
          <path 
            d="M 88 70 C 95 55 82 38 64 44 C 56 54 58 68 58 68 C 58 68 70 76 82 84 C 90 88 88 70 88 70 Z" 
            fill="url(#rightPetalGrad)" 
          />

          {/* Central Circular Seal Container */}
          <circle cx="50" cy="50" r="23" fill="url(#soilBgGrad)" stroke="#ffffff" strokeWidth="2.5" />

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

      {/* Brand Text Block */}
      <div className={`flex flex-col ${layout === 'vertical' ? 'items-center' : 'items-start'}`}>
        
        {/* ISO Badge if requested */}
        {showIsoBadge && (
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700/50 mb-0.5">
            AN ISO 9001:2015 CERTIFIED COMPANY
          </span>
        )}

        {/* Company Main Brand Title */}
        <div className="flex items-baseline gap-1">
          <span className={`font-black text-xl md:text-2xl tracking-tight font-display italic ${isDark ? 'text-white' : 'text-blue-900 dark:text-white'}`}>
            Dr.<span className="text-blue-700 dark:text-sky-400">CHEMISTAR</span>
          </span>
          <span className="text-[11px] font-bold text-blue-800 dark:text-sky-300">
            ®
          </span>
        </div>
        
        {showSubtitle && (
          <div className={`flex flex-col -mt-0.5 ${layout === 'vertical' ? 'items-center' : 'items-start'}`}>
            <span className={`text-[11px] font-black tracking-widest uppercase ${isDark ? 'text-slate-200' : 'text-slate-900 dark:text-slate-100'}`}>
              CROP CARE PVT. LTD.
            </span>

            {/* Tri-color Underline Swoosh (Green - Red - Yellow) */}
            <div className="flex h-1 w-full max-w-[150px] rounded-full overflow-hidden my-0.5 shadow-sm">
              <div className="w-1/3 bg-emerald-500"></div>
              <div className="w-1/3 bg-rose-500"></div>
              <div className="w-1/3 bg-amber-400"></div>
            </div>

            {showTagline && (
              <span className="text-[9.5px] font-bold italic text-purple-700 dark:text-purple-300 tracking-tight">
                Happy Farmers...... Happy World.....
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
