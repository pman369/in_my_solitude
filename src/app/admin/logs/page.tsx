"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Clock, 
  User, 
  Hash, 
  Loader2, 
  Filter, 
  RotateCcw,
  ShieldCheck,
  BookOpen,
  Lock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface LogEntry {
  id: string;
  action: string;
  target_id: string;
  target_type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  performed_at: string;
  admin_id: string;
  user_profiles: { display_name: string };
}

export default function AdminLedgerPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("admin_activity_log")
        .select(`
          *,
          user_profiles!admin_id(display_name)
        `, { count: "exact" });

      if (filter !== "all") {
        query = query.ilike("action", `%${filter}%`);
      }

      const { data, count, error } = await query
        .order("performed_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      setLogs((data as unknown as LogEntry[]) || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, filter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function getActionInfo(action: string) {
    if (action.includes("book")) return { icon: BookOpen, color: "#C9A84C", label: action.replace("book_", "book ") };
    if (action.includes("vault")) return { icon: Lock, color: "#F87171", label: action.replace("vault_", "vault ") };
    if (action.includes("user")) return { icon: ShieldCheck, color: "#4F46E5", label: action.replace("user_", "user ") };
    return { icon: AlertTriangle, color: "#9A9088", label: action };
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#2A2A2A] pb-8">
        <div>
          <h2 className="font-heading text-4xl text-[#F0EDE6]">The Eternal <span className="text-[#C9A84C]">Ledger</span></h2>
          <p className="text-[#9A9088] text-sm mt-1 uppercase tracking-widest font-medium">Audit trail of all administrative actions in the library</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9A9088]" />
              <select 
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                className="bg-[#141414] border border-[#2A2A2A] rounded-lg pl-9 pr-8 py-2 text-xs text-[#F0EDE6] focus:border-[#C9A84C]/40 outline-none appearance-none cursor-pointer font-bold uppercase tracking-widest"
              >
                <option value="all">All Actions</option>
                <option value="book">Books</option>
                <option value="vault">Vault</option>
                <option value="user">Users</option>
              </select>
           </div>
           <button 
             onClick={() => { setPage(1); fetchLogs(); }}
             className="p-2 rounded-lg border border-[#2A2A2A] bg-[#141414] text-[#9A9088] hover:text-[#C9A84C] transition-colors"
             title="Refresh logs"
           >
             <RotateCcw className="w-4 h-4" />
           </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#9A9088]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#C9A84C]" />
          Unrolling the scrolls...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-[#2A2A2A] bg-[#141414] text-[#9A9088]">
          The ledger is empty. No actions have been recorded yet.
        </div>
      ) : (
        <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-[#1A1A1A]">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Curator</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Action</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Target</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                <AnimatePresence mode="popLayout">
                  {logs.map((log) => {
                    const info = getActionInfo(log.action);
                    return (
                      <motion.tr 
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-[#1A1A1A]/50 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0D0D0D] border border-[#2A2A2A] flex items-center justify-center">
                              <User className="w-4 h-4 text-[#C9A84C]" />
                            </div>
                            <span className="text-sm text-[#F0EDE6]">{log.user_profiles?.display_name || "System"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <info.icon className="w-4 h-4" style={{ color: info.color }} />
                            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: info.color }}>
                              {info.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="text-xs text-[#F0EDE6] font-medium">
                              {log.metadata?.title || log.metadata?.new_role || "N/A"}
                            </div>
                            <div className="text-[10px] text-[#9A9088] flex items-center gap-1.5 font-mono">
                              <Hash className="w-3 h-3 opacity-50" /> {log.target_id?.substring(0, 8)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-left">
                          <div className="flex items-center gap-2 text-xs text-[#9A9088]">
                            <Clock className="w-3.5 h-3.5 opacity-50" />
                            {new Date(log.performed_at).toLocaleString()}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#2A2A2A] flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-[#9A9088] font-bold">
              Entries: <span className="text-[#F0EDE6]">{totalCount}</span>
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] disabled:opacity-20 hover:text-[#C9A84C] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-[#C9A84C] px-2">{page}</span>
              <button 
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] disabled:opacity-20 hover:text-[#C9A84C] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
