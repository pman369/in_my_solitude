import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "./globals.css";
import "@/styles/librarian-chat.css";
import { PreferencesProvider } from "@/components/providers/PreferencesProvider";
import { LibrarianChatProvider } from "@/components/chat/LibrarianProvider";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

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
          <LibrarianChatProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </LibrarianChatProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
