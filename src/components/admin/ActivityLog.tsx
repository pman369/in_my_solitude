/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Inbox,
  AlertTriangle
} from "lucide-react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/client";

interface LogEntry {
  id: string;
  action: string;
  target_id: string;
  target_type: string;
  details: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  created_at: string;
  user_id: string;
  user?: { display_name: string };
}

export default function ActivityLog() {
  const supabase = createClient();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase // eslint-disable-line prefer-const
      .from("activity_logs")
      .select(`*`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.like("action", `${filter}%`);
    }

    const { data } = await query;
    if (data) {
      // Get user profiles
      const { data: profiles } = await supabase.from("user_profiles").select("id, display_name");
      const enriched = (data as any[]).map((log: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        ...log,
        user: (profiles as any[])?.find(p => p.id === log.user_id) || { display_name: "Unknown Curator" } // eslint-disable-line @typescript-eslint/no-explicit-any
      }));
      setLogs(enriched);
    }
    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function getActionInfo(action: string) {
    if (action.includes("book")) return { icon: BookOpen, color: "#C9A84C", label: action.replace("book_", "book ") };
    if (action.includes("vault")) return { icon: Lock, color: "#F87171", label: action.replace("vault_", "vault ") };
    if (action.includes("request")) return { icon: Inbox, color: "#4F46E5", label: action.replace("request_", "request ") };
    if (action.includes("donation")) return { icon: ShieldCheck, color: "#065F46", label: action.replace("donation_", "donation ") };
    return { icon: AlertTriangle, color: "#9A9088", label: action };
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-heading text-3xl text-[#F0EDE6]">The Eternal <span className="text-[#C9A84C]">Ledger</span></h2>
          <p className="text-[#9A9088] text-sm mt-1">Audit trail of all administrative actions in the library.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9A9088]" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-[#141414] border border-[#2A2A2A] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F0EDE6] focus:border-[#C9A84C]/40 outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Actions</option>
                <option value="book">Books</option>
                <option value="vault">Vault</option>
                <option value="request">Requests</option>
                <option value="donation">Donations</option>
              </select>
           </div>
           <button 
             onClick={fetchLogs}
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
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Curator</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Action</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Target</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Time</th>
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
                            <span className="text-sm text-[#F0EDE6]">{log.user?.display_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <info.icon className="w-4 h-4" style={{ color: info.color }} />
                            <span className="text-xs uppercase tracking-widest font-bold" style={{ color: info.color }}>
                              {info.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="text-xs text-[#F0EDE6] font-medium">
                              {log.details?.title || log.details?.bookTitle || "N/A"}
                            </div>
                            <div className="text-[10px] text-[#9A9088] flex items-center gap-1.5 font-mono">
                              <Hash className="w-3 h-3 opacity-50" /> {log.target_id?.substring(0, 8)}
                              {log.details?.user && (
                                <span className="opacity-50 ml-2">({log.details.user})</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-xs text-[#9A9088]">
                            <Clock className="w-3.5 h-3.5 opacity-50" />
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
