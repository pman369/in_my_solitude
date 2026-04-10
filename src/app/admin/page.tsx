"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./AdminDashboard";

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
      </div>
    }>
      <AdminDashboard />
    </Suspense>
  );
}
