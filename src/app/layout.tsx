import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "./globals.css";
import { PreferencesProvider } from "@/components/providers/PreferencesProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default:  "In My Solitude — The Library",
    template: "%s | In My Solitude",
  },
  description:
    "A free archive of awakening knowledge spanning consciousness, forbidden history, spirituality, science, and more. No paywalls. No algorithms. No agenda.",
  openGraph: {
    title:       "In My Solitude — The Library",
    description: "A free archive of awakening knowledge. Built in solitude, offered freely.",
    type:        "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <body className="antialiased min-h-screen flex flex-col" style={{ background: "#0D0D0D" }}>
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <PreferencesProvider>
          <Navbar />
          <main
            id="main-content"
            className="flex-1 flex flex-col pt-16"
          >
            {children}
          </main>
          <Footer />
          {/* LibrarianChat — wired in Phase 6 */}
        </PreferencesProvider>
      </body>
    </html>
  );
}
