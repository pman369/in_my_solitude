/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Lock, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Loader2,
  ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/admin/activity-logger";
import { useUser } from "@/hooks/useUser";
import { motion } from "framer-motion";

type VaultRequest = {
  id: string;
  user_id: string;
  book_id: string;
  reason: string;
  background: string | null;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  user_profiles: {
    display_name: string;
    email_notifications: boolean;
    reason_joined: string;
  };
  books: {
    title: string;
    author: string;
    cover_url: string;
  };
};

export default function VaultQueuePage() {
  const supabase = createClient();
  const { user, isAdmin } = useUser();
  const [requests, setRequests] = useState<VaultRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("vault_access_requests")
        .select(`
          *,
          user_profiles(display_name, email_notifications, reason_joined),
          books(title, author, cover_url)
        `)
        .eq("status", filter)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      setRequests(data as VaultRequest[] || []);
    } catch (err) {
      console.error("Error fetching vault requests:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function reviewRequest(requestId: string, decision: 'approved' | 'denied', adminNote: string = "") {
    if (!user || !isAdmin) return;
    setProcessingId(requestId);
    
    try {
      const { error } = await (supabase as any)
        .from("vault_access_requests")
        .update({
          status: decision,
          admin_note: adminNote,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", requestId);

      if (error) throw error;

      // Log activity
      await logActivity({
        action: `vault_request_${decision}`,
        targetType: "vault_request",
        targetId: requestId,
        details: { decision, admin_note: adminNote }
      });

      // Remove from local state
      setRequests(requests.filter(r => r.id !== requestId));
      
    } catch (err) {
      console.error(`Error ${decision} request:`, err);
      alert(`Failed to ${decision} request. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-10">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#2A2A2A] pb-8">
        <div>
          <h1 className="font-heading text-4xl text-[#F0EDE6]">The Vault <span className="text-[#F87171]">Queue</span></h1>
          <p className="text-[#9A9088] text-sm mt-1 uppercase tracking-widest font-medium">Review petitions for restricted materials</p>
        </div>
        
        <div className="flex p-1 bg-[#141414] border border-[#2A2A2A] rounded-xl">
          {(['pending', 'approved', 'denied'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                filter === s 
                  ? 'bg-[#1A1A1A] text-[#F0EDE6] border border-[#2A2A2A]' 
                  : 'text-[#9A9088] hover:text-[#F0EDE6]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Requests List ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-20 text-center text-[#9A9088]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#F87171]" />
            Consulting the records...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-[#2A2A2A] bg-[#141414] text-[#9A9088]">
            <Lock className="w-12 h-12 opacity-10 mx-auto mb-4" />
            No {filter} requests in the queue.
          </div>
        ) : (
          requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden flex flex-col md:flex-row text-left"
            >
              {/* Book Info */}
              <div className="w-full md:w-64 bg-[#0D0D0D] p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-[#2A2A2A]">
                <div className="w-32 aspect-[2/3] bg-[#141414] border border-[#2A2A2A] rounded shadow-lg overflow-hidden mb-4 relative">
                  {req.books.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={req.books.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#2A2A2A]">
                      <Lock className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-bold text-[#F0EDE6] line-clamp-2">{req.books.title}</h3>
                <p className="text-[10px] uppercase tracking-widest text-[#9A9088] mt-1">{req.books.author}</p>
              </div>

              {/* Request Details */}
              <div className="flex-1 p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#C9A84C]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#F0EDE6]">{req.user_profiles.display_name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-[#9A9088]" />
                        <span className="text-[10px] uppercase tracking-widest text-[#9A9088]">
                          Requested {new Date(req.requested_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {filter === 'pending' && (
                    <div className="flex items-center gap-2">
                       <button 
                         disabled={processingId === req.id}
                         onClick={() => reviewRequest(req.id, 'approved')}
                         className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-[#0D0D0D] text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all disabled:opacity-50"
                       >
                         {processingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                         Approve
                       </button>
                       <button 
                         disabled={processingId === req.id}
                         onClick={() => reviewRequest(req.id, 'denied')}
                         className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-red-500 hover:border-red-500/30 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                       >
                         <XCircle className="w-3.5 h-3.5" />
                         Deny
                       </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#2A2A2A]">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" /> Reason for Request
                    </label>
                    <p className="text-sm text-[#F0EDE6] leading-relaxed italic">
                      &ldquo;{req.reason}&rdquo;
                    </p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Background / Context
                    </label>
                    <p className="text-sm text-[#9A9088] leading-relaxed">
                      {req.background || "No background provided."}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-[#2A2A2A] mt-auto">
                   <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-[#333] font-bold mb-1">Reader Since</span>
                        <span className="text-xs text-[#9A9088]">Oct 2025</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-[#333] font-bold mb-1">Joined Because</span>
                        <span className="text-xs text-[#9A9088] max-w-[200px] truncate">{req.user_profiles.reason_joined}</span>
                      </div>
                   </div>
                   
                   <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors">
                     Full Reader Profile <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
