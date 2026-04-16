"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

// Lazy-load the chat widget — it's never critical path and adds ~60 KB to the initial bundle
const LibrarianChat = dynamic(
  () => import("@/components/chat/LibrarianChat").then((m) => ({ default: m.LibrarianChat })),
  { ssr: false }
);

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin") || pathname.startsWith("/curator");

  return (
    <>
      {!isAdminPage && <Navbar />}
      <main
        id="main-content"
        className={`flex-1 flex flex-col ${!isAdminPage ? "pt-16" : ""}`}
      >
        {children}
      </main>
      {!isAdminPage && <Footer />}
      <LibrarianChat />
    </>
  );
}

