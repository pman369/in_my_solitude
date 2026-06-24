"use client";

import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="py-20 text-center rounded-2xl border border-[#2A2A2A] bg-[#141414] text-[#9A9088]">
      <Icon className="w-12 h-12 opacity-10 mx-auto mb-4" />
      {message}
    </div>
  );
}
