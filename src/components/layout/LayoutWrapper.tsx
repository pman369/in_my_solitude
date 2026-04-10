"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { LibrarianChat } from "@/components/chat/LibrarianChat";

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
