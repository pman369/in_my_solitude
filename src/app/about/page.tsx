import type { Metadata } from "next";
import { Suspense } from "react";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About",
  description:
    "The full manifesto, curator's letter, and philosophy behind In My Solitude — a free archive of awakening knowledge built in solitude and offered freely.",
};

export default function AboutPage() {
  return (
    <Suspense>
      <AboutContent />
    </Suspense>
  );
}
