"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  BookPlus,
  Heart,
  User,
  MessageSquare,
  FileDown,
  Info,
  Calendar
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/admin/activity-logger";
import Link from "next/link";
import type { Database } from "@/types/database";

type BookRequest = Database["public"]["Tables"]["book_requests"]["Row"] & { type: 'request' };
type Donation = Database["public"]["Tables"]["book_donations"]["Row"] & { type: 'donation' };
type DeskItem = (BookRequest | Donation) & { user?: { display_name: string } };

export default function RequestDeskManagement() {
  const supabase = createClient();
  const [items, setItems] = useState<DeskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "fulfilled">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    
    // Fetch Requests
    let reqQuery = supabase.from("book_requests").select("*");
    if (activeTab === "pending") reqQuery = reqQuery.eq("status", "open");
    else reqQuery = reqQuery.neq("status", "open");
    const { data: requests } = await reqQuery;

    // Fetch Donations
    let donQuery = supabase.from("book_donations").select("*");
    if (activeTab === "pending") donQuery = donQuery.eq("status", "under_review");
    else donQuery = donQuery.neq("status", "under_review");
    const { data: donations } = await donQuery;

    // Merge and Sort
    const allItems = [
      ...(requests || []).map((r) => ({ ...r, type: "request" as const } as BookRequest)),
      ...(donations || []).map((d) => ({ ...d, type: "donation" as const } as Donation))
    ].sort((a, b) => {
      const dateA = new Date((a.type === 'request' ? a.requested_at : a.submitted_at) || 0).getTime();
      const dateB = new Date((b.type === 'request' ? b.requested_at : b.submitted_at) || 0).getTime();
      return dateB - dateA;
    });

    // Enriched with user info
    const { data: profiles } = await supabase.from("user_profiles").select("id, display_name");
    const enriched = allItems.map(item => ({
      ...item,
      user: (profiles as Record<string, unknown>[])?.find(p => p.id === item.user_id) || { display_name: "Anonymous Seeker" }
    })) as DeskItem[];

    setItems(enriched);
    setLoading(false);
  }, [supabase, activeTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function updateStatus(type: 'request' | 'donation', id: string, status: string) {
    setProcessingId(id);
    const table = type === 'request' ? 'book_requests' : 'book_donations';
    
    const { error } = await supabase.from(table as never).update({ status } as never).eq("id", id);

    if (!error) {
      const item = items.find(i => i.id === id);
      setItems(items.filter(i => i.id !== id));
      
      let logAction: string;
      if (type === 'request') {
        logAction = status === 'fulfilled' ? 'request_fulfill' : 'request_decline';
      } else {
        logAction = status === 'accepted' ? 'donation_accept' : 'donation_decline';
      }

      await logActivity({
        action: logAction,
        targetId: id,
        targetType: type === 'request' ? 'book_request' : 'donation',
        details: { title: item?.book_title, user: item?.user?.display_name }
      });
    } else {
      alert("Error updating " + type + ": " + error.message);
    }
    setProcessingId(null);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-heading text-3xl text-[#F0EDE6]">The <span className="text-[#4F46E5]">Request Desk</span></h2>
          <p className="text-[#9A9088] text-sm mt-1">Manage community requests and suggested donations.</p>
        </div>
        <div className="flex rounded-lg border border-[#2A2A2A] bg-[#141414] p-1">
          <button 
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "pending" ? 'bg-[#4F46E5] text-white' : 'text-[#9A9088] hover:text-[#F0EDE6]'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setActiveTab("fulfilled")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "fulfilled" ? 'bg-[#2A2A2A] text-[#F0EDE6]' : 'text-[#9A9088] hover:text-[#F0EDE6]'}`}
          >
            History
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#9A9088]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#4F46E5]" />
          Reviewing applications...
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-[#2A2A2A] bg-[#141414] text-[#9A9088]">
          No {activeTab} items at the front desk.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl border border-[#2A2A2A] bg-[#141414] overflow-hidden flex flex-col"
              >
                {/* Type Ribbon */}
                <div className={`h-1.5 w-full ${item.type === 'request' ? 'bg-[#C9A84C]' : 'bg-[#065F46]'}`} />
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg ${item.type === 'request' ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'bg-[#065F46]/10 text-[#065F46]'}`}>
                      {item.type === 'request' ? <BookPlus className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                    </div>
                    <div className="text-[10px] text-[#9A9088] flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date((item.type === 'request' ? item.requested_at : item.submitted_at) || 0).toLocaleDateString()}
                    </div>
                  </div>

                  <h3 className="font-heading text-lg text-[#F0EDE6] mb-1 leading-tight">{item.book_title}</h3>
                  <p className="text-sm text-[#9A9088] mb-4">by {item.book_author || "Unknown"}</p>

                  <div className="space-y-4 mt-auto">
                    {/* Notes/Why */}
                    {(item.type === 'request' ? item.why_needed : item.notes) && (
                      <div className="bg-[#0D0D0D] p-3 rounded-lg border border-[#2A2A2A] relative">
                         <div className="text-[10px] uppercase tracking-widest text-[#9A9088] mb-1.5 flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3 opacity-50" /> 
                            {item.type === 'request' ? 'Why needed' : 'Donor note'}
                         </div>
                         <p className="text-xs text-[#F0EDE6] leading-relaxed italic line-clamp-3">
                           &quot;{item.type === 'request' ? item.why_needed : item.notes}&quot;
                         </p>
                      </div>
                    )}

                    {/* User */}
                    <div className="flex items-center gap-2 text-xs text-[#9A9088]">
                       <User className="w-3.5 h-3.5 opacity-50" />
                       {item.user?.display_name}
                    </div>

                    {/* Donation Category */}
                    {item.type === 'donation' && item.suggested_category && (
                      <div className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border border-[#065F46]/30 bg-[#065F46]/10 text-[#065F46] w-fit">
                        {item.suggested_category}
                      </div>
                    )}

                    {/* File Download (for donations) */}
                    {item.type === 'donation' && item.file_url && (
                      <Link 
                        href={`/api/storage/signed-url?bucket=donations-inbox&path=${item.file_url}`}
                        className="flex items-center gap-2 text-xs text-[#C9A84C] hover:underline"
                        target="_blank"
                      >
                        <FileDown className="w-4 h-4" /> Download Submitted File
                      </Link>
                    )}
                  </div>
                </div>

                {activeTab === 'pending' ? (
                  <div className="border-t border-[#2A2A2A] bg-[#1A1A1A]/30 p-4 grid grid-cols-2 gap-4">
                    <button 
                       onClick={() => updateStatus(item.type, item.id, item.type === 'request' ? 'declined' : 'declined')}
                       disabled={!!processingId}
                       className="flex items-center justify-center gap-2 py-2 rounded border border-red-500/20 text-red-500/80 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/5 transition-colors"
                    >
                       <XCircle className="w-3 h-3" /> Decline
                    </button>
                    <button 
                       onClick={() => updateStatus(item.type, item.id, item.type === 'request' ? 'fulfilled' : 'accepted')}
                       disabled={!!processingId}
                       className="flex items-center justify-center gap-2 py-2 rounded border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] font-bold uppercase tracking-widest hover:bg-[#C9A84C]/5 transition-colors"
                    >
                       <CheckCircle className="w-3 h-3" /> Mark {item.type === 'request' ? 'Found' : 'Accept'}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-[#2A2A2A] bg-[#1A1A1A]/30 p-4">
                    <div className="flex items-center justify-between">
                       <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-[#9A9088]">
                         <Info className="w-3.5 h-3.5" />
                         {(item.status || "under_review").replace('_', ' ')}
                       </div>
                       <div className="text-[10px] font-mono text-[#9A9088] opacity-50">#ID-{item.id.substring(0,6)}</div>
                    </div>
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
