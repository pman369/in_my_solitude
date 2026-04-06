import Link from "next/link";
import { Moon } from "lucide-react";

const FOOTER_LINKS = [
  {
    heading: "The Library",
    links: [
      { label: "Open Stacks",     href: "/library" },
      { label: "The Vault",       href: "/vault"   },
      { label: "Request Desk",    href: "/desk"    },
      { label: "About",           href: "/about"   },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "My Shelf",    href: "/profile"        },
      { label: "Sign In",     href: "/auth/login"     },
      { label: "Join",        href: "/auth/register"  },
    ],
  },
];

export function Footer() {
  return (
    <footer
      role="contentinfo"
      className="w-full mt-auto"
      style={{ borderTop: "1px solid #2A2A2A" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* ── Brand column ───────────────────────────── */}
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

          {/* ── Navigation columns ────────────────────── */}
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
                  className="text-sm transition-colors duration-200 w-fit"
                  style={{ color: "#9A9088" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#F0EDE6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#9A9088";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
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
            — The Curator
          </p>
        </div>
      </div>
    </footer>
  );
}
