"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  BookPlus, 
  Users, 
  FileText, 
  Lock, 
  Inbox,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Library,
  Bell
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Management Components
import BookManagement from "@/components/admin/BookManagement";
import VaultManagement from "@/components/admin/VaultManagement";
import RequestDeskManagement from "@/components/admin/RequestDeskManagement";
import ActivityLog from "@/components/admin/ActivityLog";

type AdminTab = "overview" | "books" | "vault" | "requests" | "logs";

export default function AdminDashboard() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState({
    books: 0,
    vaultRequests: 0,
    bookRequests: 0,
    donations: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: booksCount },
          { count: vaultCount },
          { count: reqCount },
          { count: donCount }
        ] = await Promise.all([
          supabase.from("books").select("*", { count: "exact", head: true }),
          supabase.from("vault_access_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("book_requests").select("*", { count: "exact", head: true }).eq("status", "open"),
          supabase.from("book_donations").select("*", { count: "exact", head: true }).eq("status", "under_review"),
        ]);

        setStats({
          books: booksCount || 0,
          vaultRequests: vaultCount || 0,
          bookRequests: reqCount || 0,
          donations: donCount || 0,
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      }
    }

    fetchStats();
  }, [supabase]);

  const cards = [
    {
      title: "Archive Stacks",
      desc: "Review and organize the digital ledger.",
      icon: Library,
      tab: "books" as const,
      color: "#C9A84C",
      badge: stats.books > 0 ? `${stats.books} active` : null
    },
    {
      title: "Vault Approvals",
      desc: "Review requests for restricted materials.",
      icon: Lock,
      tab: "vault" as const,
      color: "#F87171",
      badge: stats.vaultRequests > 0 ? `${stats.vaultRequests} pending` : null
    },
    {
      title: "Request Desk",
      desc: "Manage community book requests and leads.",
      icon: Inbox,
      tab: "requests" as const,
      color: "#4F46E5",
      badge: (stats.bookRequests + stats.donations) > 0 ? `${stats.bookRequests + stats.donations} new` : null
    },
    {
      title: "Public Stats",
      desc: "View analytics and reader engagement.",
      icon: TrendingUp,
      tab: "overview" as const,
      color: "#065F46",
      badge: "LIVE"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col md:flex-row shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* ── Admin Sidebar ────────────────────────────────── */}
      <aside className="w-full md:w-64 border-r border-[#2A2A2A] bg-[#0D0D0D] flex flex-col h-screen overflow-y-auto">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 mb-10 group">
            <div className="w-8 h-8 rounded bg-[#C9A84C] flex items-center justify-center text-[#0D0D0D] font-bold">S</div>
            <span className="font-heading text-lg group-hover:text-[#C9A84C] transition-colors" style={{ color: "#F0EDE6" }}>
              Solitude Admin
            </span>
          </Link>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'books',    label: 'Archive',  icon: Library },
              { id: 'vault',    label: 'Vault',    icon: Lock },
              { id: 'requests', label: 'Desk',     icon: Inbox },
              { id: 'logs',     label: 'Ledger',   icon: Clock },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-[#1A1A1A] text-[#C9A84C] border border-[#2A2A2A]' 
                    : 'text-[#9A9088] hover:bg-[#141414] hover:text-[#F0EDE6]'
                }`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
                {item.id === 'vault' && stats.vaultRequests > 0 && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-[#F87171] text-[10px] flex items-center justify-center text-white">
                    {stats.vaultRequests}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-10 mb-6">
             <label className="text-[10px] font-bold uppercase tracking-widest text-[#2A2A2A] px-4">Actions</label>
             <Link 
                href="/curator/books/upload"
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-[#9A9088] hover:bg-[#141414] hover:text-[#C9A84C] transition-all mt-2"
              >
                <BookPlus className="w-4 h-4" /> New Archive Entry
              </Link>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-[#2A2A2A] space-y-4">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-3 text-xs uppercase tracking-widest transition-colors ${
              activeTab === "overview" ? "text-[#C9A84C]" : "text-[#9A9088] hover:text-[#C9A84C]"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Admin Portal
          </button>
          <Link 
            href="/profile" 
            className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#9A9088] hover:text-[#C9A84C] transition-colors"
          >
            <Users className="w-3.5 h-3.5" /> Back to Profile
          </Link>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative h-screen">
        {/* Background Decor */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(201,168,76,0.03)_0%,transparent_70%)]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(201,168,76,0.03)_0%,transparent_70%)]" />
        </div>

        <div className="p-8 md:p-12 relative z-10">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && (
              <>
                {/* Overview Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#2A2A2A] pb-10">
                  <div>
                    <div className="flex items-center gap-3 mb-4 text-[#C9A84C]">
                      <ShieldAlert className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase tracking-[0.3em]">Curator Command</span>
                    </div>
                    <h1 className="font-heading text-4xl md:text-5xl text-[#F0EDE6] tracking-tight">
                      Admin <span className="text-[#C9A84C]">Dashboard</span>
                    </h1>
                    <p className="text-[#9A9088] mt-3 max-w-xl">
                      The library is a living organism. Here you guide its growth and protect its treasures.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-widest text-[#9A9088]">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A2A] bg-[#141414]">
                      <Library className="w-3.5 h-3.5 text-[#C9A84C]" />
                      <span>{stats.books} Volumes Total</span>
                    </div>
                    <button className="relative p-2 rounded-full border border-[#2A2A2A] bg-[#141414] text-[#9A9088] hover:text-[#C9A84C] transition-colors">
                       <Bell className="w-4 h-4" />
                       {(stats.vaultRequests + stats.bookRequests + stats.donations) > 0 && (
                         <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#F87171] border border-[#0D0D0D]" />
                       )}
                    </button>
                  </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                  {cards.map((card, idx) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative"
                    >
                      <button
                        onClick={() => setActiveTab(card.tab)}
                        className="w-full flex flex-col h-full p-8 rounded-2xl border transition-all duration-300 relative overflow-hidden text-left"
                        style={{
                          background: "#141414",
                          borderColor: "#2A2A2A",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = `${card.color}40`;
                          (e.currentTarget as HTMLElement).style.background = "#1A1A1A";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
                          (e.currentTarget as HTMLElement).style.background = "#141414";
                        }}
                      >
                        {/* Icon & Glow */}
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10"
                          style={{ background: `${card.color}15`, color: card.color }}
                        >
                          <card.icon className="w-6 h-6" />
                          <div className="absolute inset-0 blur-xl opacity-20" style={{ background: card.color }} />
                        </div>

                        <h3 className="font-heading text-xl text-[#F0EDE6] mb-2 group-hover:text-[#C9A84C] transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-xs text-[#9A9088] leading-relaxed mb-6">
                          {card.desc}
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
                          {card.badge ? (
                            <span 
                              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                card.tab === 'vault' ? 'bg-[#991B1B]/20 text-[#F87171] border-[#991B1B]/30' : 
                                card.tab === 'overview' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                                'bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30'
                              }`}
                            >
                              {card.badge}
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-widest text-[#9A9088] font-medium">Ready</span>
                          )}
                          <ArrowRight className="w-4 h-4 text-[#C9A84C] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Secondary Stats Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="p-8 rounded-2xl border border-[#2A2A2A] bg-[#141414]/50 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="font-heading text-2xl text-[#F0EDE6]">Curator Ledger</h3>
                        <FileText className="w-4 h-4 text-[#9A9088]" />
                      </div>
                      
                      <div className="space-y-6">
                        {[
                          { type: 'upload', text: 'New tome added to Esoteric section', time: '2 hours ago', icon: CheckCircle2, iconColor: '#065F46' },
                          { type: 'request', text: 'Pending vault request from Seeker #42', time: '5 hours ago', icon: Clock, iconColor: '#C9A84C' },
                          { type: 'donation', text: 'New donation received: "The Secret Teachings"', time: 'Yesterday', icon: AlertCircle, iconColor: '#4F46E5' },
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full border border-[#2A2A2A] flex items-center justify-center bg-[#0D0D0D]">
                                <item.icon className="w-4 h-4" style={{ color: item.iconColor }} />
                              </div>
                              {i < 2 && <div className="w-px h-full bg-[#2A2A2A] mt-2" />}
                            </div>
                            <div className="pb-6">
                              <p className="text-sm text-[#F0EDE6] group-hover:text-[#C9A84C] transition-colors">{item.text}</p>
                              <p className="text-[10px] uppercase tracking-widest text-[#9A9088] mt-1">{item.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="p-8 rounded-2xl border border-[#2A2A2A] bg-[linear-gradient(135deg,#141414,#0D0D0D)] relative overflow-hidden box-border">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldAlert className="w-20 h-20" />
                      </div>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C] mb-4">Identity Status</h4>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-heading text-[#F0EDE6]">Active</span>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mb-1" />
                      </div>
                      <p className="text-xs text-[#9A9088] leading-relaxed">
                        You are authenticated as a primary curator. Access level: 11.
                      </p>
                      <div className="mt-8 pt-8 border-t border-[#2A2A2A]">
                        <Link 
                          href="/profile"
                          className="text-[10px] uppercase tracking-widest text-[#F0EDE6] hover:text-[#C9A84C] transition-colors flex items-center gap-2"
                        >
                          Manage Profile <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "books" && <BookManagement />}
            {activeTab === "vault" && <VaultManagement />}
            {activeTab === "requests" && <RequestDeskManagement />}
            {activeTab === "logs" && <ActivityLog />}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
