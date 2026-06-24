"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "w-6 h-6", md: "w-8 h-8", lg: "w-10 h-10" };

export function LoadingSpinner({
  message,
  color = "text-[#C9A84C]",
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-[#9A9088] ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin mb-4 ${color}`} />
      {message && <span>{message}</span>}
    </div>
  );
}
