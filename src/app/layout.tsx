import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import "@/styles/librarian-chat.css";
import { PreferencesProvider } from "@/components/providers/PreferencesProvider";
import { LibrarianChatProvider } from "@/components/chat/LibrarianProvider";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

// next/font: self-hosted, inlined CSS, zero layout shift, no external network request
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-playfair",
  preload: true,
});

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
    <html lang="en" className={`dark ${inter.variable} ${playfair.variable}`} data-theme="dark">
      <body className="antialiased min-h-screen flex flex-col" style={{ background: "#0D0D0D" }}>
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <PreferencesProvider>
          <LibrarianChatProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </LibrarianChatProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}

