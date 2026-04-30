
import React from 'react';
import { ExternalLink, Sparkles, Layout, HelpCircle } from 'lucide-react';

export function CoverGenerationHelper() {
  const tools = [
    { name: 'Canva Template', icon: Layout, url: '#', description: 'Official In My Solitude templates' },
    { name: 'Leonardo.ai', icon: Sparkles, url: 'https://leonardo.ai', description: 'AI Atmospheric illustrations' },
    { name: 'Squoosh', icon: HelpCircle, url: 'https://squoosh.app', description: 'Compress before upload' }
  ];

  return (
    <div className="p-6 rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/5 backdrop-blur-sm space-y-4 text-left">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-[#C9A84C]" />
        <h3 className="font-heading text-lg text-[#F0EDE6]">Cover Design <span className="text-[#C9A84C]">Guide</span></h3>
      </div>
      
      <p className="text-xs text-[#9A9088] leading-relaxed">
        Every volume in the archive deserves a brand-consistent cover: dark backgrounds, gold borders, and category-appropriate symbols.
      </p>

      <div className="space-y-3 pt-2">
        {tools.map((tool) => (
          <a 
            key={tool.name}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D] border border-[#2A2A2A] group hover:border-[#C9A84C]/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center group-hover:bg-[#C9A84C]/10 transition-colors">
                <tool.icon className="w-4 h-4 text-[#9A9088] group-hover:text-[#C9A84C]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F0EDE6] uppercase tracking-wider">{tool.name}</p>
                <p className="text-[10px] text-[#9A9088]">{tool.description}</p>
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-[#2A2A2A] group-hover:text-[#C9A84C]/60" />
          </a>
        ))}
      </div>

      <div className="pt-2 px-1">
        <p className="text-[10px] text-[#9A9088] font-medium uppercase tracking-[0.1em] border-l-2 border-[#C9A84C]/40 pl-3 italic">
          &quot;A book without a cover is a voice without a face. Give every voice its face.&quot;
        </p>
      </div>
    </div>
  );
}
