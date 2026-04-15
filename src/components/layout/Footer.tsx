"use client";

import Link from "next/link";
import { Moon } from "lucide-react";
import { useUser } from "@/hooks/useUser";

const FOOTER_LINKS = [
  {
    heading: "The Library",
    links: [
      { label: "Open Stacks",  href: "/library" },
      { label: "The Vault",    href: "/vault"   },
      { label: "Request Desk", href: "/desk"    },
      { label: "About",        href: "/about"   },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "My Shelf", href: "/profile"       },
      { label: "Sign In",  href: "/auth/login"    },
      { label: "Join",     href: "/auth/register" },
    ],
  },
];

export function Footer() {
  const { isAdmin } = useUser();
  return (
    <footer
      role="contentinfo"
      className="w-full mt-auto"
      style={{ borderTop: "1px solid #2A2A2A" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* ── Brand column ─────────────────────────── */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2" aria-label="In My Solitude — Home">
              <Moon className="w-5 h-5" style={{ color: "#C9A84C" }} />
              <span className="font-heading text-lg" style={{ color: "#C9A84C" }}>
                In My Solitude
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "#9A9088" }}>
              A free archive of awakening knowledge. Built in solitude.
              Offered in solidarity. No ads. No algorithms. No agenda.
            </p>
            <p className="text-xs font-heading italic" style={{ color: "rgba(201,168,76,0.5)" }}>
              &ldquo;Knowledge kept in the dark finds its light in solitude.&rdquo;
            </p>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <h3
                className="text-xs uppercase tracking-[0.2em] mb-2 font-heading"
                style={{ color: "#C9A84C" }}
              >
                {col.heading}
              </h3>
              {col.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="footer-nav-link text-sm w-fit"
                >
                  {link.label}
                </Link>
              ))}
              {col.heading === "Account" && isAdmin && (
                <Link href="/admin" className="footer-nav-link text-sm w-fit font-bold text-[#C9A84C]">
                  Admin Panel
                </Link>
              )}
            </div>
          ))}

          {/* ── Contact column ─────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h3
              className="text-xs uppercase tracking-[0.2em] mb-2 font-heading"
              style={{ color: "#C9A84C" }}
            >
              Contact
            </h3>
            <div className="text-sm space-y-2" style={{ color: "#9A9088" }}>
              <p>
                Email: <br className="hidden xl:block" />
                <a href="mailto:THESOLITARYCURATOR@PROTONMAIL.COM" className="hover:text-[#F0EDE6] transition-colors break-all">
                  THESOLITARYCURATOR<wbr/>@PROTONMAIL.COM
                </a>
              </p>
              <p>
                Phone: <br />
                <a href="tel:+2347088106549" className="hover:text-[#F0EDE6] transition-colors">
                  +2347088106549
                </a>
              </p>
              <p>
                Address: <br />
                LAGOS, NG
              </p>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────── */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs"
          style={{ borderTop: "1px solid #2A2A2A", color: "#9A9088" }}
        >
          <p>
            Built by one person. Free for all.
            No ads · No tracking · No social media.
          </p>
          <p style={{ color: "#2A2A2A" }}>
            — A.B. PEACE
          </p>
        </div>
      </div>
    </footer>
  );
}
