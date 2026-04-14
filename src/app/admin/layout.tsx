"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Library, 
  Lock, 
  Inbox, 
  Clock, 
  Users, 
  BookPlus, 
  User,
  ShieldAlert,
  Menu,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const supabase = createClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    vaultRequests: 0,
    bookRequests: 0,
    donations: 0,
  });

  useEffect(() => {
    async function fetchCounts() {
      const [
        { count: vaultCount },
        { count: reqCount },
        { count: donCount }
      ] = await Promise.all([
        supabase.from("vault_access_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("book_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("book_donations").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setStats({
        vaultRequests: vaultCount || 0,
        bookRequests: reqCount || 0,
        donations: donCount || 0,
      });
    }

    fetchCounts();
    
    // Auto-close mobile menu on path change
    setIsMobileMenuOpen(false);
  }, [pathname, supabase]);

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin" },
    { id: "books",    label: "Archive",  icon: Library,         href: "/admin/books" },
    { id: "vault",    label: "Vault",    icon: Lock,            href: "/admin/vault",   badge: stats.vaultRequests },
    { id: "requests", label: "Desk",     icon: Inbox,           href: "/admin/requests", badge: stats.bookRequests + stats.donations },
    { id: "users",    label: "Users",    icon: Users,           href: "/admin/users" },
    { id: "logs",     label: "Ledger",   icon: Clock,           href: "/admin/logs" },
  ];

  const activeItem = navItems.find(item => 
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col md:flex-row text-[#F0EDE6] selection:bg-[#C9A84C]/30">
      {/* ── Mobile Header ────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#2A2A2A] bg-[#0D0D0D] sticky top-0 z-50">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#C9A84C] flex items-center justify-center text-[#0D0D0D] font-bold">S</div>
          <span className="font-heading text-lg">Solitude Admin</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[#9A9088]"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className={`
        fixed inset-0 z-40 md:relative md:z-auto
        w-full md:w-64 border-r border-[#2A2A2A] bg-[#0D0D0D] 
        flex flex-col h-screen transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          <Link href="/" className="hidden md:flex items-center gap-2 mb-10 group">
            <div className="w-8 h-8 rounded bg-[#C9A84C] flex items-center justify-center text-[#0D0D0D] font-bold">S</div>
            <span className="font-heading text-lg group-hover:text-[#C9A84C] transition-colors">
              Solitude Admin
            </span>
          </Link>

          <nav className="space-y-1.5">
            {navItems.map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 border ${
                  activeItem?.id === item.id 
                    ? 'bg-[#1A1A1A] text-[#C9A84C] border-[#2A2A2A]' 
                    : 'text-[#9A9088] hover:bg-[#141414] hover:text-[#F0EDE6] border-transparent'
                }`}
              >
                <item.icon className="w-4 h-4" /> 
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.id === 'vault' ? 'bg-[#991B1B]/20 text-[#F87171]' : 'bg-[#C9A84C]/20 text-[#C9A84C]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mt-10">
             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] px-4 block mb-2">Actions</label>
             <Link 
                href="/admin/books/new"
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-[#9A9088] hover:bg-[#141414] hover:text-[#C9A84C] transition-all group"
              >
                <div className="w-6 h-6 rounded bg-[#141414] border border-[#2A2A2A] flex items-center justify-center group-hover:border-[#C9A84C]/40">
                  <BookPlus className="w-3.5 h-3.5" />
                </div>
                New Archive Entry
              </Link>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-[#2A2A2A] space-y-4">
          <Link 
            href="/profile" 
            className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#9A9088] hover:text-[#C9A84C] transition-colors group"
          >
            <User className="w-3.5 h-3.5" /> Back to Profile
          </Link>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#2A2A2A] font-bold">
            <ShieldAlert className="w-3 h-3" /> Level 11 Access
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative h-[calc(100vh-64px)] md:h-screen">
        {/* Background Decor */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(201,168,76,0.03)_0%,transparent_70%)]" />
        </div>

        <div className="p-6 md:p-10 lg:p-12 relative z-10 max-w-7xl mx-auto w-full">
           {children}
        </div>
      </main>
    </div>
  );
}
