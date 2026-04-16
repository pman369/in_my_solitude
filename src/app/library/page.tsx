import type { Metadata } from "next";
import { Suspense } from "react";
import LibraryContent from "./LibraryContent";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Browse the open stacks — hundreds of freely accessible books spanning consciousness, forbidden history, spirituality, esoteric knowledge, and more.",
};

function LibrarySkeleton() {
  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* Sticky header skeleton */}
      <div
        className="sticky top-16 z-30 px-4 sm:px-6 py-4"
        style={{ background: "rgba(13,13,13,0.96)", borderBottom: "1px solid #2A2A2A" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 h-10 rounded animate-pulse" style={{ background: "#141414" }} />
            <div className="w-32 h-10 rounded animate-pulse" style={{ background: "#141414" }} />
            <div className="w-24 h-10 rounded animate-pulse" style={{ background: "#141414" }} />
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i}>
              <div
                className="rounded mb-3 animate-pulse"
                style={{ aspectRatio: "2/3", background: "#141414" }}
              />
              <div className="h-3 w-3/4 rounded animate-pulse mb-1" style={{ background: "#141414" }} />
              <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: "#141414" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibrarySkeleton />}>
      <LibraryContent />
    </Suspense>
  );
}

