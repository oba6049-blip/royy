import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtext?: boolean;
  showText?: boolean;
  lightMode?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 'md',
  showSubtext = true,
  showText = true,
  lightMode = true,
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Royal Crest Emblem */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0F172A] p-2 text-white shadow-md border border-[#F59E0B]/30 ${sizeClasses[size]}`}
      >
        {/* Crown & Shield SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full text-[#F59E0B]"
        >
          {/* Shield Outline */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(245, 158, 11, 0.15)" />
          {/* Crown on Shield */}
          <path d="M7 10l2.5 1.5L12 8l2.5 3.5L17 10v4H7v-4z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="0.5" />
          {/* Star beneath */}
          <polygon points="12,15 12.8,16.5 14.5,16.8 13.2,18 13.5,19.7 12,18.8 10.5,19.7 10.8,18 9.5,16.8 11.2,16.5" fill="#60A5FA" />
        </svg>

        {/* Decorative corner accent */}
        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] ${textSizes[size]} ${
              lightMode ? 'text-[#0F172A]' : 'text-white'
            }`}
          >
            ROYAL ACADEMY
          </span>
          {showSubtext && (
            <span
              className={`text-[11px] font-semibold tracking-wider uppercase ${
                lightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'
              }`}
            >
              Excellence & Integrity
            </span>
          )}
        </div>
      )}
    </div>
  );
};
