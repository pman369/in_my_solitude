import type { Metadata } from "next";
import { Suspense } from "react";
import LibraryContent from "./LibraryContent";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Browse the open stacks — hundreds of freely accessible books spanning consciousness, forbidden history, spirituality, esoteric knowledge, and more.",
};

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryContent />
    </Suspense>
  );
}
