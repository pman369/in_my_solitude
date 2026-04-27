/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  MessageSquare,
  User,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/admin/activity-logger";
import Image from "next/image";
import type { Database } from "@/types/database";

type Request = Database["public"]["Tables"]["vault_access_requests"]["Row"] & {
  user?: { display_name: string; email: string };
  book?: { title: string; cover_url: string };
};

export default function VaultManagement() {
  const supabase = createClient();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    let query = (supabase
      .from("vault_access_requests") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .select(`
        *,
        book:books(title, cover_url)
      `)
      .order("requested_at", { ascending: false });

    if (activeTab === "pending") {
      query = query.eq("status", "pending");
    } else {
      query = query.neq("status", "pending");
    }

    const { data } = await query;
    if (data) {
      const { data: profiles } = await (supabase
        .from("user_profiles") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .select("id, display_name");

      const enriched = (data as any[]).map((req: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        ...req,
        user: (profiles as any[])?.find(p => p.id === req.user_id) || { display_name: "Unknown Seeker" } // eslint-disable-line @typescript-eslint/no-explicit-any
      })) as Request[];
      
      setRequests(enriched);
    }
    setLoading(false);
  }, [activeTab, supabase]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function updateStatus(id: string, status: "approved" | "declined") {
    setProcessingId(id);
    const { error } = await (supabase
      .from("vault_access_requests") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .update({ 
        status, 
        reviewed_at: new Date().toISOString(),
        admin_note: adminNote.trim() || null
      })
      .eq("id", id);

    if (!error) {
      const req = requests.find(r => r.id === id);
      setRequests(requests.filter(r => r.id !== id));
      setAdminNote("");
      await logActivity({
        action: status === "approved" ? "vault_approve" : "vault_decline",
        targetId: id,
        targetType: "vault_request",
        details: { bookTitle: req?.book?.title, user: req?.user?.display_name }
      });
    } else {
      alert("Error updating request: " + error.message);
    }
    setProcessingId(null);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-heading text-3xl text-[#F0EDE6]">Vault <span className="text-[#F87171]">Access</span></h2>
          <p className="text-[#9A9088] text-sm mt-1">Review petitions for restricted materials.</p>
        </div>
        <div className="flex rounded-lg border border-[#2A2A2A] bg-[#141414] p-1">
          <button 
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "pending" ? 'bg-[#F87171] text-[#0D0D0D]' : 'text-[#9A9088] hover:text-[#F0EDE6]'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setActiveTab("reviewed")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "reviewed" ? 'bg-[#2A2A2A] text-[#F0EDE6]' : 'text-[#9A9088] hover:text-[#F0EDE6]'}`}
          >
            Reviewed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#9A9088]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#F87171]" />
          Verifying petitions...
        </div>
      ) : requests.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-[#2A2A2A] bg-[#141414] text-[#9A9088]">
          No {activeTab} petitions found in the ledger.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {requests.map((req) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl border border-[#2A2A2A] bg-[#141414] overflow-hidden flex flex-col"
              >
                <div className="p-6 flex gap-6">
                  {/* Book Preview */}
                  <div className="relative w-24 h-32 rounded flex-shrink-0 overflow-hidden bg-[#0D0D0D] border border-[#2A2A2A]">
                    {req.book?.cover_url ? (
                      <Image 
                        src={req.book.cover_url} 
                        alt="Restricted Tome" 
                        fill 
                        className="object-cover blur-[2px] opacity-60"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-[#991B1B]/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-[#F87171] opacity-80" />
                    </div>
                  </div>

                  {/* Request Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading text-lg text-[#F0EDE6] line-clamp-1">{req.book?.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-[#9A9088]">
                          <User className="w-3 h-3 text-[#F87171]" />
                          {req.user?.display_name}
                        </div>
                      </div>
                      <div className="text-[10px] text-[#9A9088] font-mono">
                        {req.requested_at ? new Date(req.requested_at).toLocaleDateString() : "Date unknown"}
                      </div>
                    </div>

                    <div className="bg-[#0D0D0D] rounded-lg p-4 border border-[#2A2A2A]">
                      <div className="text-[10px] uppercase tracking-widest text-[#F87171] mb-2 flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> Seeker&apos;s Petition
                      </div>
                      <p className="text-sm text-[#F0EDE6] leading-relaxed italic line-clamp-3">
                        &quot;{req.reason}&quot;
                      </p>
                    </div>
                  </div>
                </div>

                {activeTab === "pending" ? (
                  <div className="mt-auto border-t border-[#2A2A2A] bg-[#1A1A1A]/30 p-6 space-y-4">
                    <textarea 
                      placeholder="Add a curator's note (optional)..."
                      className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm text-[#F0EDE6] outline-none focus:border-[#F87171]/40 transition-colors resize-none"
                      rows={2}
                      value={processingId === req.id ? adminNote : ""}
                      onChange={(e) => setAdminNote(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                         onClick={() => updateStatus(req.id, "declined")}
                         disabled={!!processingId}
                         className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                         <XCircle className="w-4 h-4" /> Decline
                      </button>
                      <button 
                         onClick={() => updateStatus(req.id, "approved")}
                         disabled={!!processingId}
                         className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-widest hover:bg-green-500/10 transition-colors disabled:opacity-50"
                      >
                         <CheckCircle className="w-4 h-4" /> Grant Access
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto border-t border-[#2A2A2A] bg-[#1A1A1A]/30 p-6">
                    <div className="flex items-center justify-between">
                       <div className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${req.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                          {req.status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {req.status}
                       </div>
                       {req.reviewed_at && (
                         <div className="text-[10px] text-[#9A9088]">
                           Reviewed on {new Date(req.reviewed_at).toLocaleDateString()}
                         </div>
                       )}
                    </div>
                    {req.admin_note && (
                      <p className="mt-3 text-xs text-[#9A9088] bg-[#0D0D0D] p-3 rounded-lg border border-[#2A2A2A]">
                        <span className="font-bold text-[#F0EDE6]">Note:</span> {req.admin_note}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
