"use client";

import { type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  label?: ReactNode;
}

export function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  label,
}: PaginationProps) {
  return (
    <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#2A2A2A] flex items-center justify-between">
      <p className="text-[10px] uppercase tracking-widest text-[#9A9088] font-bold">
        {label ?? (
          <>
            Total: <span className="text-[#F0EDE6]">{totalCount}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] disabled:opacity-20 hover:text-[#C9A84C] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-bold text-[#C9A84C] px-2">{page}</span>
        <button
          disabled={page * pageSize >= totalCount}
          onClick={() => onPageChange(page + 1)}
          className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] disabled:opacity-20 hover:text-[#C9A84C] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
