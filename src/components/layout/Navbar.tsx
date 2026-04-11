"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { BookOpen, Key, Library, User, Moon, Menu, X, LogOut, ShieldAlert } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/library", label: "Library",      icon: BookOpen },
  { href: "/vault",   label: "The Vault",    icon: Key      },
  { href: "/desk",    label: "Request Desk", icon: Library  },
  { href: "/about",   label: "About",        icon: null     },
];

export function Navbar() {
  const pathname  = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen]  = useState(false);
  const { isAdmin } = useUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navLinks = [...NAV_LINKS];

  return (
    <>
      <header
        role="banner"
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(13,13,13,0.92)"
            : "rgba(13,13,13,0.6)",
          backdropFilter: "blur(12px)",
          borderBottom: scrolled
            ? "1px solid rgba(201,168,76,0.12)"
            : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* ── Brand ──────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="In My Solitude — Home"
          >
            <Moon
              className="w-5 h-5 transition-all duration-300 group-hover:rotate-12"
              style={{ color: "#C9A84C" }}
            />
            <span
              className="font-heading text-lg tracking-wide hidden sm:block"
              style={{ color: "#C9A84C" }}
            >
              In My Solitude
            </span>
          </Link>

          {/* ── Desktop Nav ────────────────────────────── */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-1"
          >
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative px-4 py-2 text-sm tracking-wide rounded transition-colors duration-200"
                style={{
                  color: isActive(href) ? "#C9A84C" : "#9A9088",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(href))
                    (e.currentTarget as HTMLElement).style.color = "#F0EDE6";
                }}
                onMouseLeave={(e) => {
                  if (!isActive(href))
                    (e.currentTarget as HTMLElement).style.color = "#9A9088";
                }}
              >
                {label}
                {isActive(href) && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "#C9A84C" }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* ── Right Side Actions ─────────────────────── */}
          <div className="flex items-center gap-2">
            <NavbarAuthArea isActive={isActive} />

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded transition-colors duration-200"
              style={{ color: "#9A9088" }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu Overlay ─────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col pt-16"
          style={{ background: "rgba(13,13,13,0.98)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <nav
            aria-label="Mobile navigation"
            className="flex flex-col gap-1 px-6 py-8"
          >
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 px-4 py-4 rounded border transition-all duration-200 text-base"
                style={{
                  borderColor: isActive(href) ? "rgba(201,168,76,0.3)" : "transparent",
                  color: isActive(href) ? "#C9A84C" : "#F0EDE6",
                  background: isActive(href) ? "rgba(201,168,76,0.05)" : "transparent",
                }}
              >
                {Icon && <Icon className="w-5 h-5" style={{ opacity: 0.7 }} />}
                {label}
              </Link>
            ))}
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #2A2A2A" }}>
              <MobileAuthArea isAdmin={isAdmin} />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────── Auth sub-components ─────────────────────────── */

function NavbarAuthArea({ isActive }: { isActive: (href: string) => boolean }) {
  const { user, profile, loading, isAuthenticated } = useUser();
  const supabase = createClient();

  const displayName = profile?.display_name ?? user?.email ?? null;
  const initial = displayName ? displayName[0].toUpperCase() : "?";

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // Skeleton while loading — prevents layout shift
  if (loading) {
    return (
      <div
        className="hidden md:block rounded border"
        style={{ border: "1px solid #2A2A2A", width: 110, height: 36, opacity: 0.25 }}
        aria-hidden="true"
      />
    );
  }

  if (isAuthenticated) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <Link
          href="/profile"
          className="flex items-center gap-2 px-3 py-2 rounded border text-sm transition-all duration-200"
          style={{
            border: isActive("/profile") ? "1px solid rgba(201,168,76,0.4)" : "1px solid #2A2A2A",
            color: isActive("/profile") ? "#C9A84C" : "#9A9088",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)";
            (e.currentTarget as HTMLElement).style.color = "#F0EDE6";
          }}
          onMouseLeave={(e) => {
            if (!isActive("/profile")) {
              (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
              (e.currentTarget as HTMLElement).style.color = "#9A9088";
            }
          }}
          aria-label="My Profile"
        >
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{
              background: "rgba(201,168,76,0.15)",
              color: "#C9A84C",
              border: "1px solid rgba(201,168,76,0.3)",
            }}
            aria-hidden="true"
          >
            {initial}
          </span>
          <span className="max-w-[100px] truncate">
            {profile?.display_name ?? "My Shelf"}
          </span>
        </Link>

        <button
          onClick={signOut}
          className="p-2 rounded border transition-all duration-200"
          style={{ border: "1px solid #2A2A2A", color: "#9A9088" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(153,27,27,0.5)";
            (e.currentTarget as HTMLElement).style.color = "#F87171";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
            (e.currentTarget as HTMLElement).style.color = "#9A9088";
          }}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth/login"
      className="hidden md:flex items-center gap-2 px-4 py-2 text-sm rounded border transition-all duration-200"
      style={{ border: "1px solid #2A2A2A", color: "#9A9088" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)";
        (e.currentTarget as HTMLElement).style.color = "#F0EDE6";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
        (e.currentTarget as HTMLElement).style.color = "#9A9088";
      }}
      aria-label="Sign in to the library"
    >
      <User className="w-4 h-4" />
      <span>Sign In</span>
    </Link>
  );
}

function MobileAuthArea({ isAdmin }: { isAdmin: boolean }) {
  const { profile, loading, isAuthenticated } = useUser();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) return null;

  if (isAuthenticated) {
    return (
      <div className="flex flex-col gap-1">
        <Link
          href="/profile"
          className="flex items-center gap-4 px-4 py-4 rounded text-base"
          style={{ color: "#9A9088" }}
        >
          <User className="w-5 h-5" />
          {profile?.display_name ?? "My Shelf"}
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-4 px-4 py-4 rounded text-base font-bold"
            style={{ color: "#C9A84C" }}
          >
            <ShieldAlert className="w-5 h-5" />
            Admin Panel
          </Link>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-4 px-4 py-4 rounded text-base w-full text-left transition-colors duration-200"
          style={{ color: "#9A9088" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9A9088")}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth/login"
      className="flex items-center gap-4 px-4 py-4 rounded text-base"
      style={{ color: "#9A9088" }}
    >
      <User className="w-5 h-5" />
      Sign In
    </Link>
  );
}
