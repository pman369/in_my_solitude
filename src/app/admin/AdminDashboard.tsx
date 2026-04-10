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
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const supabase = createClient();
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
      title: "Add New Tome",
      desc: "Record a new entry in the digital archive.",
      icon: BookPlus,
      href: "/curator/books/upload",
      color: "#C9A84C",
      badge: null
    },
    {
      title: "Vault Approvals",
      desc: "Review requests for restricted materials.",
      icon: Lock,
      href: "#", // Placeholder for Phase 7
      color: "#991B1B",
      badge: stats.vaultRequests > 0 ? `${stats.vaultRequests} pending` : null
    },
    {
      title: "Request Desk",
      desc: "Manage community book requests and leads.",
      icon: Inbox,
      href: "#", // Placeholder for Phase 7
      color: "#4F46E5",
      badge: stats.bookRequests > 0 ? `${stats.bookRequests} open` : null
    },
    {
      title: "Donations inbox",
      desc: "Process suggested additions from seekers.",
      icon: TrendingUp,
      href: "#", // Placeholder for Phase 7
      color: "#065F46",
      badge: stats.donations > 0 ? `${stats.donations} new` : null
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col md:flex-row shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      {/* ── Admin Sidebar ────────────────────────────────── */}
      <aside className="w-full md:w-64 border-r border-[#2A2A2A] bg-[#0D0D0D] flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 mb-10 group">
            <div className="w-8 h-8 rounded bg-[#C9A84C] flex items-center justify-center text-[#0D0D0D] font-bold">S</div>
            <span className="font-heading text-lg group-hover:text-[#C9A84C] transition-colors" style={{ color: "#F0EDE6" }}>
              Solitude Admin
            </span>
          </Link>

          <nav className="space-y-2">
            <Link 
              href="/admin" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
              style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }}
            >
              <TrendingUp className="w-4 h-4" /> Dashboard
            </Link>
            <Link 
              href="/curator/books/upload" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 text-[#9A9088] hover:bg-[#141414] hover:text-[#F0EDE6]"
            >
              <BookPlus className="w-4 h-4" /> Book Upload
            </Link>
            <Link 
              href="#" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 text-[#9A9088] hover:bg-[#141414] hover:text-[#F0EDE6]"
            >
              <Lock className="w-4 h-4" /> Vault Requests
            </Link>
            <Link 
              href="#" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 text-[#9A9088] hover:bg-[#141414] hover:text-[#F0EDE6]"
            >
              <Inbox className="w-4 h-4" /> Book Requests
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[#2A2A2A]">
          <Link 
            href="/profile" 
            className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#9A9088] hover:text-[#C9A84C] transition-colors"
          >
            <Users className="w-3.5 h-3.5" /> Back to Profile
          </Link>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────── */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
        {/* Background Decor */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(201,168,76,0.03)_0%,transparent_70%)]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(201,168,76,0.03)_0%,transparent_70%)]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
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
                  <Users className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span>{stats.books} Volumes Total</span>
                </div>
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
                  <Link
                    href={card.href}
                    className="flex flex-col h-full p-8 rounded-2xl border transition-all duration-300 relative overflow-hidden"
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
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#991B1B]/20 text-[#F87171] border border-[#991B1B]/30">
                          {card.badge}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-widest text-[#9A9088] font-medium">Ready</span>
                      )}
                      <ArrowRight className="w-4 h-4 text-[#C9A84C] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>

                    {/* Hover Accent */}
                    <div 
                      className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity"
                      style={{ background: card.color }}
                    />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Secondary Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="p-8 rounded-2xl border border-[#2A2A2A] bg-[#141414]/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-heading text-2xl text-[#F0EDE6]">Recent Activity</h3>
                    <FileText className="w-4 h-4 text-[#9A9088]" />
                  </div>
                  
                  <div className="space-y-6">
                    {/* Timeline Items */}
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
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C] mb-4">Curator Status</h4>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-heading text-[#F0EDE6]">Active</span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mb-1" />
                  </div>
                  <p className="text-xs text-[#9A9088] leading-relaxed">
                    You are currently authenticated as a primary curator. All actions are logged to the eternal ledger.
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
          </motion.div>
        </div>
      </main>
    </div>
  );
}
