"use client";

import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  variant?: "card" | "inline";
}

export function ErrorAlert({ message, variant = "card" }: ErrorAlertProps) {
  if (variant === "inline") {
    return (
      <div
        className="px-4 py-3 rounded text-sm"
        style={{
          background: "rgba(153,27,27,0.1)",
          border: "1px solid rgba(153,27,27,0.3)",
          color: "#F87171",
        }}
        role="alert"
      >
        {message}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </div>
  );
}
