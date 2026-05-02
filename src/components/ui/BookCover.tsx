
import React from 'react';
import Image from 'next/image';
import { 
  Eye, 
  Skull, 
  Scale, 
  Heart, 
  BookOpen,
  ScrollText,
  Pyramid,
  Infinity,
  Flame,
  Star,
  Key,
  Database,
  LucideIcon
} from 'lucide-react';

export interface BookCoverProps {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  categorySlug?: string | null;
  className?: string;
  isRestricted?: boolean;
}

const CATEGORY_MAP: Record<string, { color: string; icon: LucideIcon }> = {
  'consciousness-mind': { color: '#4F46E5', icon: Eye },
  'forbidden-real-history': { color: '#B45309', icon: Pyramid },
  'spirituality-mysticism': { color: '#7C3AED', icon: Flame },
  'science-cosmology': { color: '#1D4ED8', icon: Star },
  'esoteric-occult': { color: '#991B1B', icon: Skull },
  'law-systems-of-control': { color: '#374151', icon: Scale },
  'psychology-inner-healing': { color: '#065F46', icon: Heart },
  'ancient-civilizations': { color: '#92400E', icon: ScrollText },
  'technology-science': { color: '#0E7490', icon: Database },
  'philosophy-creativity': { color: '#4B5563', icon: Infinity },
};

export function BookCover({ title, author, coverUrl, categorySlug, className = '', isRestricted }: BookCoverProps) {
  if (coverUrl) {
    return (
      <div className={`relative w-full h-full overflow-hidden rounded ${className}`}>
        <Image src={coverUrl} alt={title} fill className="object-cover" />
      </div>
    );
  }

  const category = categorySlug ? CATEGORY_MAP[categorySlug] : null;
  const accentColor = isRestricted ? '#991B1B' : (category?.color || '#C9A84C');
  const Icon = category?.icon || BookOpen;

  return (
    <div 
      className={`relative w-full h-full overflow-hidden rounded flex flex-col items-center justify-between p-6 text-center transition-all duration-500 group-hover:scale-[1.02] ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0D0D0D 0%, #1A1209 100%)',
        border: `1px solid ${accentColor}44`,
      }}
    >
      {/* Texture Overlay (Grain effect via SVG filter or CSS) */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      
      {/* Ornate Border */}
      <div className="absolute inset-2 border border-[#C9A84C] opacity-20 pointer-events-none" />
      <div className="absolute inset-3 border border-[#C9A84C] opacity-10 pointer-events-none" />

      {/* Header (Author) */}
      <div className="z-10 pt-4">
        {author && (
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9A9088]">
            {author}
          </p>
        )}
      </div>

      {/* Center (Title & Symbol) */}
      <div className="z-10 flex flex-col items-center gap-6 max-w-full px-2">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center border border-[#C9A84C22] bg-[#C9A84C05]"
          style={{ boxShadow: `0 0 20px ${accentColor}11` }}
        >
          <Icon className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h3 className="font-heading text-xl text-[#F0EDE6] leading-tight line-clamp-4 font-playfair">
          {title}
        </h3>
      </div>

      {/* Footer (Logo/Mark) */}
      <div className="z-10 pb-4">
        <div className="w-6 h-6 border border-[#C9A84C44] rotate-45 flex items-center justify-center opacity-40">
          <div className="w-3 h-3 bg-[#C9A84C] opacity-20" />
        </div>
      </div>

      {/* Restricted/Vault Indicator */}
      {isRestricted && (
        <div className="absolute top-0 right-0 p-2">
          <Key className="w-4 h-4 text-[#991B1B] opacity-40" />
        </div>
      )}
    </div>
  );
}
