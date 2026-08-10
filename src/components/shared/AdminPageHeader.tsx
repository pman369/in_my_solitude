"use client";

import { type ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  highlight: string;
  subtitle: string;
  highlightColor?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({
  title,
  highlight,
  subtitle,
  highlightColor = "text-[#C9A84C]",
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#2A2A2A] pb-8">
      <div>
        <h1 className="font-heading text-4xl text-[#F0EDE6]">
          {title} <span className={highlightColor}>{highlight}</span>
        </h1>
        <p className="text-[#9A9088] text-sm mt-1 uppercase tracking-widest font-medium">
          {subtitle}
        </p>
      </div>
      {actions}
    </div>
  );
}
