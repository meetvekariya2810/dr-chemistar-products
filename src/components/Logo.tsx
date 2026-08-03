import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = 'h-12 sm:h-14', 
  variant = 'light',
  layout = 'horizontal'
}) => {
  const isDark = variant === 'dark';
  
  return (
    <div className={`flex ${layout === 'vertical' ? 'flex-col items-center text-center' : 'items-center'} select-none`}>
      {isDark ? (
        <div className="p-1.5 bg-white rounded-xl shadow-md border border-slate-800/10">
          <img 
            src="/logo.png" 
            alt="Dr. CHEMISTAR Logo" 
            className={`${className} object-contain`} 
          />
        </div>
      ) : (
        <img 
          src="/logo.png" 
          alt="Dr. CHEMISTAR Logo" 
          className={`${className} object-contain`} 
        />
      )}
    </div>
  );
};
