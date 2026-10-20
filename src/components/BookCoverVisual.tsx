import { useState } from 'react';
import { EbookItem } from '../types';
import { BookOpen, Shield, Cpu, Layers, Grid, Sparkles } from 'lucide-react';

interface BookCoverVisualProps {
  book: EbookItem;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export default function BookCoverVisual({
  book,
  className = '',
  size = 'md',
  interactive = true,
}: BookCoverVisualProps) {
  const [imageError, setImageError] = useState(false);

  const { coverDesign } = book;
  const useImage = coverDesign?.showCoverImage && book.coverImage && !imageError;

  // Patterns map for custom graphic cover
  const renderPatternIcon = () => {
    switch (coverDesign?.pattern) {
      case 'shield':
        return <Shield className="w-12 h-12 opacity-30" />;
      case 'circuit-matrix':
        return <Cpu className="w-12 h-12 opacity-30" />;
      case 'geometric-cubes':
        return <Layers className="w-12 h-12 opacity-30" />;
      case 'neural-network':
        return <Sparkles className="w-12 h-12 opacity-30" />;
      case 'blueprint-grid':
      default:
        return <Grid className="w-12 h-12 opacity-30" />;
    }
  };

  const getThemeBg = () => {
    if (coverDesign?.theme === 'custom' && coverDesign.bgColor) {
      return coverDesign.bgColor;
    }
    switch (coverDesign?.theme) {
      case 'charcoal':
        return '#18181b';
      case 'emerald':
        return '#064e3b';
      case 'crimson':
        return '#4c0519';
      case 'amethyst':
        return '#3b0764';
      case 'steel':
        return '#1e293b';
      case 'navy':
      default:
        return '#0A1628';
    }
  };

  const accentColor = coverDesign?.accentColor || '#38bdf8';
  const textColor = coverDesign?.textColor || '#ffffff';

  return (
    <div
      className={`relative group select-none ${className} ${
        interactive ? 'transition-transform duration-300 hover:-translate-y-1' : ''
      }`}
      style={{ perspective: '1000px' }}
    >
      {/* 3D Book wrapper with spine shadow */}
      <div 
        className="relative w-full aspect-[3/4] rounded-r-md rounded-l-xs overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300"
        style={{
          boxShadow: '0 10px 25px -5px rgba(10, 22, 40, 0.25), 0 8px 10px -6px rgba(10, 22, 40, 0.2)'
        }}
      >
        {/* Left Book Spine Edge Highlight (embossed look) */}
        <div 
          className="absolute top-0 bottom-0 left-0 w-3.5 z-20 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(255,255,255,0.18) 40%, rgba(0,0,0,0.2) 80%, transparent 100%)'
          }}
        />

        {/* Right Page Curl / Edge Sheen */}
        <div 
          className="absolute top-0 bottom-0 right-0 w-1.5 z-20 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.15) 100%)'
          }}
        />

        {/* Diagonal Light Glare sheen */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity"
          style={{
            background: 'linear-gradient(115deg, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(255,255,255,0.05) 60%, transparent 100%)'
          }}
        />

        {/* MAIN COVER CONTENT */}
        {useImage ? (
          <img
            src={book.coverImage}
            alt={`Cover art for ${book.title}`}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Custom Graphic Cover Design rendered via CSS/SVG */
          <div
            className="w-full h-full p-5 flex flex-col justify-between relative overflow-hidden"
            style={{
              backgroundColor: getThemeBg(),
              color: textColor,
            }}
          >
            {/* Background Pattern Grid */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                backgroundSize: '16px 16px'
              }}
            />

            {/* Pattern Accent Watermark */}
            <div className="absolute right-3 top-16 pointer-events-none text-white/10">
              {renderPatternIcon()}
            </div>

            {/* Top Header / Publisher imprint */}
            <div className="relative z-10">
              <div className="flex items-center justify-between text-[9px] font-mono tracking-widest uppercase opacity-75 pb-2 border-b border-white/15">
                <span>JNJ INNOVATIONS</span>
                <span style={{ color: accentColor }}>{book.edition || '2026 EDITION'}</span>
              </div>
              {book.badgeText && (
                <div 
                  className="mt-2 text-[10px] font-mono uppercase tracking-wider font-semibold inline-block px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${accentColor}25`,
                    color: accentColor,
                    border: `1px solid ${accentColor}40`
                  }}
                >
                  {book.badgeText}
                </div>
              )}
            </div>

            {/* Center: Title & Subtitle */}
            <div className="relative z-10 my-auto py-2">
              <h3 className="font-display font-bold leading-tight tracking-tight text-lg md:text-xl drop-shadow-sm">
                {book.title}
              </h3>
              {book.subtitle && (
                <p className="font-sans text-xs mt-2 opacity-80 leading-snug line-clamp-2">
                  {book.subtitle}
                </p>
              )}
            </div>

            {/* Bottom: Author byline & metadata */}
            <div className="relative z-10 pt-3 border-t border-white/15">
              <p className="font-sans text-xs font-semibold tracking-wide" style={{ color: accentColor }}>
                {book.author}
              </p>
              <div className="flex items-center justify-between text-[9px] font-mono opacity-70 mt-1">
                <span>{book.sku}</span>
                <span>{book.pages} PAGES</span>
              </div>
            </div>
          </div>
        )}

        {/* Small ribbon/tag if Low Stock */}
        {book.status === 'low_stock' && (
          <div className="absolute top-2 right-2 z-30 bg-amber-500 text-slate-950 font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wide">
            Low Stock ({book.inventoryCount} left)
          </div>
        )}

        {book.status === 'sold_out' && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
            <span className="bg-red-950/90 text-red-200 border border-red-500/50 font-mono text-xs font-bold px-3 py-1.5 rounded uppercase tracking-widest shadow-lg">
              Sold Out
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
