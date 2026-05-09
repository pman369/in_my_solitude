import React from "react";
import { 
  Eye, 
  History, 
  Sparkles, 
  Orbit, 
  Infinity as InfinityIcon, 
  Scale, 
  TreeDeciduous, 
  Landmark, 
  Cpu, 
  PenTool,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  title: string;
  author?: string | null;
  categorySlug?: string | null;
  isRestricted?: boolean | null;
  coverUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const CATEGORY_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  "consciousness-mind": { icon: Eye, color: "#4F46E5", label: "Consciousness & Mind" },
  "forbidden-history": { icon: History, color: "#B45309", label: "Forbidden History" },
  "spirituality-mysticism": { icon: Sparkles, color: "#7C3AED", label: "Spirituality" },
  "science-cosmology": { icon: Orbit, color: "#1D4ED8", label: "Science & Cosmology" },
  "esoteric-occult": { icon: InfinityIcon, color: "#991B1B", label: "Esoteric & Occult" },
  "law-systems": { icon: Scale, color: "#374151", label: "Law & Systems" },
  "psychology-healing": { icon: TreeDeciduous, color: "#065F46", label: "Psychology" },
  "ancient-civilizations": { icon: Landmark, color: "#92400E", label: "Ancient Civilizations" },
  "technology-science": { icon: Cpu, color: "#0E7490", label: "Technology" },
  "philosophy-creativity": { icon: PenTool, color: "#4B5563", label: "Philosophy" },
};

export const BookCover = ({
  title,
  author,
  categorySlug,
  isRestricted,
  coverUrl,
  className,
  size = "md",
}: BookCoverProps) => {
  // If coverUrl exists, render the image
  if (coverUrl) {
    return (
      <div className={cn("relative aspect-[2/3] overflow-hidden rounded-sm shadow-card group", className)}>
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isRestricted && (
          <div className="absolute top-2 right-2 p-1.5 bg-crimson/90 rounded-full shadow-lg">
            <Lock className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  }

  // Otherwise, render the dynamic cover
  const categoryData = CATEGORY_MAP[categorySlug || ""] || { 
    icon: Eye, 
    color: "#C9A84C", 
    label: categorySlug || "The Archive" 
  };
  
  const Icon = categoryData.icon;
  const accentColor = isRestricted ? "#991B1B" : "#C9A84C";
  const categoryAccent = categoryData.color;

  return (
    <div 
      className={cn(
        "relative aspect-[2/3] overflow-hidden rounded-sm shadow-card flex flex-col items-center justify-between p-4 sm:p-6 text-center select-none",
        isRestricted ? "bg-[#080808]" : "bg-[#0D0D0D]",
        className
      )}
      style={{
        border: `1.5px solid ${accentColor}`,
      }}
    >
      {/* Texture Overlay (SVG Noise) */}
      <div 
        className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Inner Border (Subtle) */}
      <div 
        className="absolute inset-[4px] border-[0.5px] opacity-40 pointer-events-none"
        style={{ borderColor: accentColor }}
      />

      {/* Header */}
      <div className="z-10 flex flex-col items-center gap-2">
        <span 
          className="text-[8px] tracking-[0.25em] font-body uppercase opacity-60"
          style={{ color: "#C9A84C" }}
        >
          In My Solitude
        </span>
        <div 
          className="w-20 h-[0.5px] opacity-50"
          style={{ backgroundColor: "#C9A84C" }}
        />
      </div>

      {/* Central Symbol */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="relative group">
          <Icon 
            className="w-16 h-16 sm:w-24 sm:h-24 opacity-80 transition-all duration-700 group-hover:scale-110"
            style={{ color: isRestricted ? "#991B1B" : "#C9A84C" }}
          />
          {isRestricted && (
            <div className="absolute -inset-4 bg-crimson/5 blur-xl rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {/* Title & Author Area */}
      <div className="z-10 w-full flex flex-col items-center gap-3">
        <div 
          className="w-20 h-[0.5px] opacity-50"
          style={{ backgroundColor: "#C9A84C" }}
        />
        
        <h3 
          className="font-heading text-lg sm:text-xl md:text-2xl leading-tight line-clamp-3 px-2"
          style={{ color: "#C9A84C" }}
        >
          {title}
        </h3>

        {author && (
          <p className="text-[10px] sm:text-[11px] tracking-[0.15em] font-body uppercase text-[#9A9088] line-clamp-1">
            {author}
          </p>
        )}

        <div className="mt-4 flex flex-col items-center gap-4">
          <div 
            className="w-20 h-[0.5px] opacity-50"
            style={{ backgroundColor: "#C9A84C" }}
          />
          <span 
            className="text-[7px] tracking-[0.2em] font-body uppercase"
            style={{ color: isRestricted ? "#991B1B" : categoryAccent }}
          >
            {isRestricted ? "The Vault" : categoryData.label}
          </span>
        </div>
      </div>

      {/* Vault Wax Seal (Simplified for CSS) */}
      {isRestricted && (
        <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-crimson shadow-lg flex items-center justify-center rotate-12 border border-black/20">
          <Lock className="w-3 h-3 text-[#0D0D0D]" />
        </div>
      )}
    </div>
  );
};
