"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Inbox, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Loader2,
  Trash2,
  Filter,
  Download,
  Book,
  User,
  ExternalLink,
  LucideIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/admin/activity-logger";
import { useUser } from "@/hooks/useUser";
import { motion, AnimatePresence } from "framer-motion";

type BookRequest = {
  id: string;
  user_id: string | null;
  title: string;
  author: string | null;
  why_it_matters: string | null;
  status: 'open' | 'fulfilled' | 'noted' | 'declined';
  admin_note: string | null;
  created_at: string;
  display_name?: string | null;
};

type Donation = {
  id: string;
  user_id: string | null;
  title: string;
  author: string | null;
  category_id: string | null;
  file_url: string;
  notes: string | null;
  status: 'under_review' | 'accepted' | 'declined';
  admin_note: string | null;
  created_at: string;
  categories?: { name: string };
  display_name?: string | null;
};

export default function RequestDeskAdminPage() {
  const supabase = createClient();
  const { user, isAdmin } = useUser();
  const [activeTab, setActiveTab] = useState<'requests' | 'donations'>('requests');
  const [loading, setLoading] = useState(true);
  const [bookRequests, setBookRequests] = useState<BookRequest[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchBookRequests = useCallback(async () => {
    let query = supabase
      .from("book_requests")
      .select("*")
      .order("requested_at", { ascending: false });

    if (search) {
      query = query.ilike("book_title", `%${search}%`);
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (!error) setBookRequests((data as unknown as BookRequest[]));
  }, [supabase, search, statusFilter]);

  const fetchDonations = useCallback(async () => {
    let query = supabase
      .from("book_donations")
      .select(`
        *,
        categories(name)
      `)
      .order("submitted_at", { ascending: false });

    if (search) {
      query = query.ilike("book_title", `%${search}%`);
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (!error) setDonations((data as unknown as Donation[]));
  }, [supabase, search, statusFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (activeTab === 'requests') {
      await fetchBookRequests();
    } else {
      await fetchDonations();
    }
    setLoading(false);
  }, [activeTab, fetchBookRequests, fetchDonations]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function updateRequestStatus(id: string, table: 'book_requests' | 'book_donations', newStatus: string, adminNote: string = "") {
    if (!user || !isAdmin) return;
    setProcessingId(id);

    try {
      let error;
      const updateData = { 
        status: newStatus, 
        admin_note: adminNote,
        reviewed_at: new Date().toISOString()
      };

      if (table === 'book_requests') {
        const res = await (supabase.from('book_requests') as any).update(updateData).eq("id", id);
        error = res.error;
      } else {
        const res = await (supabase.from('book_donations') as any).update(updateData).eq("id", id);
        error = res.error;
      }

      if (error) throw error;

      // Log activity
      await logActivity({
        action: `${table === 'book_requests' ? 'request' : 'donation'}_${newStatus}`,
        targetType: table === 'book_requests' ? 'book_request' : 'book_donation',
        targetId: id,
        details: { status: newStatus, admin_note: adminNote }
      });

      // Update local state
      if (table === 'book_requests') {
        setBookRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as BookRequest['status'], admin_note: adminNote } : r));
      } else {
        setDonations(prev => prev.map(d => d.id === id ? { ...d, status: newStatus as Donation['status'], admin_note: adminNote } : d));
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setProcessingId(null);
    }
  }

  // --- Styles ---
  const statusStyles: Record<string, { icon: LucideIcon, color: string, bg: string, border: string }> = {
    open: { icon: Clock, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10', border: 'border-[#C9A84C]/20' },
    under_review: { icon: Clock, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10', border: 'border-[#C9A84C]/20' },
    fulfilled: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    accepted: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    noted: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    declined: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  };

  return (
    <div className="space-y-10">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#2A2A2A] pb-8">
        <div>
          <h1 className="font-heading text-4xl text-[#F0EDE6]">The Request <span className="text-[#C9A84C]">Desk</span></h1>
          <p className="text-[#9A9088] text-sm mt-1 uppercase tracking-widest font-medium">Hear the whispers of the community</p>
        </div>
        
        <div className="flex p-1 bg-[#141414] border border-[#2A2A2A] rounded-xl">
          <button
            onClick={() => { setActiveTab('requests'); setStatusFilter('all'); }}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'requests' 
                ? 'bg-[#1A1A1A] text-[#C9A84C] border border-[#2A2A2A]' 
                : 'text-[#9A9088] hover:text-[#F0EDE6]'
            }`}
          >
            Find Petitions
          </button>
          <button
            onClick={() => { setActiveTab('donations'); setStatusFilter('all'); }}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'donations' 
                ? 'bg-[#1A1A1A] text-[#C9A84C] border border-[#2A2A2A]' 
                : 'text-[#9A9088] hover:text-[#F0EDE6]'
            }`}
          >
            Donations Inbox
          </button>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9088]" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'requests' ? 'petitions' : 'donations'} by title...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-[#C9A84C]/40 outline-none transition-all placeholder:text-[#333]"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9A9088]" />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-9 pr-8 py-2.5 text-xs text-[#9A9088] focus:border-[#C9A84C]/40 outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              {activeTab === 'requests' ? (
                <>
                  <option value="open">Open</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="noted">Noted</option>
                  <option value="declined">Declined</option>
                </>
              ) : (
                <>
                  <option value="under_review">Under Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ── Requests List ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center text-[#9A9088]"
            >
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#C9A84C]" />
              Sifting through the papers...
            </motion.div>
          ) : (activeTab === 'requests' ? bookRequests : donations).length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center rounded-2xl border border-[#2A2A2A] bg-[#141414] text-[#9A9088]"
            >
              <Inbox className="w-12 h-12 opacity-10 mx-auto mb-4" />
              The {activeTab === 'requests' ? 'petition' : 'donation'} list is silent.
            </motion.div>
          ) : (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {(activeTab === 'requests' ? bookRequests : donations).map((item) => {
                const style = statusStyles[item.status] || statusStyles.open;
                return (
                  <div 
                    key={item.id}
                    className="group bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden flex flex-col md:flex-row"
                  >
                    {/* Visual/Icon Side */}
                    <div className="w-full md:w-16 bg-[#0D0D0D] border-b md:border-b-0 md:border-r border-[#2A2A2A] flex items-center justify-center p-6 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-40 transition-all">
                      {activeTab === 'requests' ? <Book className="w-8 h-8 text-[#C9A84C]" /> : <Download className="w-8 h-8 text-[#C9A84C]" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 space-y-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-heading text-[#F0EDE6] tracking-wide">{item.title}</h3>
                          <p className="text-xs text-[#9A9088] uppercase tracking-[0.2em]">{item.author || 'Unknown Author'}</p>
                        </div>
                        
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${style.bg} ${style.border} ${style.color}`}>
                          <style.icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{item.status.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#2A2A2A]">
                        <div className="space-y-4">
                           <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] flex items-center gap-2">
                               <User className="w-3 h-3" /> Submitted By
                             </label>
                             <p className="text-xs text-[#9A9088] italic">Anonymous Reader</p>
                           </div>
                           
                           {activeTab === 'requests' && (item as BookRequest).why_it_matters && (
                             <div className="space-y-2">
                               <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] flex items-center gap-2">
                                 <MessageSquare className="w-3 h-3" /> Sentiment
                               </label>
                               <p className="text-sm text-[#F0EDE6] leading-relaxed line-clamp-3">
                                 &ldquo;{(item as BookRequest).why_it_matters}&rdquo;
                               </p>
                             </div>
                           )}

                           {activeTab === 'donations' && (
                             <div className="space-y-2">
                               <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] flex items-center gap-2">
                                 <Inbox className="w-3 h-3" /> File Access
                               </label>
                               <a 
                                 href={(item as Donation).file_url} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-[#C9A84C] hover:text-white hover:border-[#C9A84C]/40 transition-all font-bold group/btn"
                               >
                                 Open Manuscript <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                               </a>
                             </div>
                           )}
                        </div>

                        <div className="space-y-4">
                           <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] flex items-center gap-2">
                               <Clock className="w-3 h-3" /> Archive Date
                             </label>
                             <p className="text-xs text-[#9A9088]">{new Date(item.created_at).toLocaleString()}</p>
                           </div>

                             <div className="space-y-2">
                               <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] flex items-center gap-2">
                                 Action Suite
                               </label>
                               <div className="flex flex-wrap gap-2">
                                 {activeTab === 'requests' ? (
                                   <>
                                     <button 
                                       disabled={processingId === item.id}
                                       onClick={() => updateRequestStatus(item.id, 'book_requests', 'fulfilled')}
                                       className="px-3 py-1.5 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-green-500 hover:border-green-500/20 text-[10px] font-bold uppercase tracking-widest transition-all"
                                     >
                                       Fulfil
                                     </button>
                                     <button 
                                       disabled={processingId === item.id}
                                       onClick={() => updateRequestStatus(item.id, 'book_requests', 'noted')}
                                       className="px-3 py-1.5 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-blue-400 hover:border-blue-400/20 text-[10px] font-bold uppercase tracking-widest transition-all"
                                     >
                                       Note
                                     </button>
                                   </>
                                 ) : (
                                   <>
                                     <button 
                                       disabled={processingId === item.id}
                                       onClick={() => updateRequestStatus(item.id, 'book_donations', 'accepted')}
                                       className="px-3 py-1.5 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-green-500 hover:border-green-500/20 text-[10px] font-bold uppercase tracking-widest transition-all"
                                     >
                                       Admit
                                     </button>
                                   </>
                                 )}
                                 <button 
                                   disabled={processingId === item.id}
                                   onClick={() => updateRequestStatus(item.id, activeTab === 'requests' ? 'book_requests' : 'book_donations', 'declined')}
                                   className="px-3 py-1.5 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-red-400 hover:border-red-400/20 text-[10px] font-bold uppercase tracking-widest transition-all"
                                 >
                                   Decline
                                 </button>
                                 <button 
                                   className="p-1.5 rounded-lg border border-[#2A2A2A] text-[#333] hover:text-red-500 hover:border-red-500/20 transition-all"
                                 >
                                   <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                               </div>
                             </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
