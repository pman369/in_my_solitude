"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Inbox, BookPlus, BookHeart, Clock, Check, X, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type BookRequest  = Database["public"]["Tables"]["book_requests"]["Row"];
type BookDonation = Database["public"]["Tables"]["book_donations"]["Row"];

const REQUEST_STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open:      { label: "Open",      color: "#C9A84C", icon: Clock       },
  fulfilled: { label: "Fulfilled", color: "#065F46", icon: Check       },
  noted:     { label: "Noted",     color: "#7C3AED", icon: AlertCircle },
  declined:  { label: "Declined",  color: "#991B1B", icon: X          },
};

const DONATION_STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  under_review: { label: "Under review", color: "#C9A84C", icon: Clock },
  accepted:     { label: "Accepted",     color: "#065F46", icon: Check },
  declined:     { label: "Declined",     color: "#991B1B", icon: X    },
};

interface Props { userId: string }

export default function MyRequestsTab({ userId }: Props) {
  const supabase    = useRef(createClient()).current;
  const [requests,  setRequests]  = useState<BookRequest[]>([]);
  const [donations, setDonations] = useState<BookDonation[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [section,   setSection]   = useState<"requests" | "donations">("requests");

  useEffect(() => {
    Promise.all([
      supabase.from("book_requests").select("*").eq("user_id", userId).order("requested_at", { ascending: false }),
      supabase.from("book_donations").select("*").eq("user_id", userId).order("submitted_at", { ascending: false }),
    ]).then(([{ data: reqs }, { data: doms }]) => {
      setRequests((reqs as BookRequest[]) ?? []);
      setDonations((doms as BookDonation[]) ?? []);
      setLoading(false);
    });
  }, [supabase, userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#C9A84C" }} />
      </div>
    );
  }

  const hasAnything = requests.length > 0 || donations.length > 0;

  if (!hasAnything) {
    return (
      <div className="text-center py-20">
        <Inbox className="w-10 h-10 mx-auto mb-4" style={{ color: "rgba(201,168,76,0.2)" }} />
        <h2 className="font-heading text-xl mb-2" style={{ color: "#F0EDE6" }}>No activity yet</h2>
        <p className="text-sm max-w-xs mx-auto" style={{ color: "#9A9088" }}>
          Visit the Request Desk to ask for missing books or donate titles to the archive.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-tab toggle */}
      <div
        className="flex rounded overflow-hidden mb-6 max-w-xs"
        style={{ border: "1px solid #2A2A2A" }}
      >
        {([
          { key: "requests",  label: "Book Requests",  icon: BookPlus  },
          { key: "donations", label: "Donations",       icon: BookHeart },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-all duration-200"
            style={{
              background: section === key ? "rgba(201,168,76,0.1)" : "transparent",
              color:      section === key ? "#C9A84C" : "#9A9088",
              borderRight: key === "requests" ? "1px solid #2A2A2A" : "none",
            }}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
            {key === "requests"  && requests.length  > 0 && <span className="ml-0.5 opacity-60">({requests.length})</span>}
            {key === "donations" && donations.length > 0 && <span className="ml-0.5 opacity-60">({donations.length})</span>}
          </button>
        ))}
      </div>

      {section === "requests" ? (
        requests.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: "#9A9088" }}>No book requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const sc = REQUEST_STATUS[req.status] ?? REQUEST_STATUS.open;
              const StatusIcon = sc.icon;
              return (
                <div key={req.id} className="rounded border p-4" style={{ background: "#141414", borderColor: "#2A2A2A" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1" style={{ color: "#F0EDE6" }}>
                        {req.book_title}
                      </p>
                      {req.book_author && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#9A9088" }}>{req.book_author}</p>
                      )}
                      {req.why_needed && (
                        <p className="text-xs mt-2 leading-relaxed line-clamp-2 italic" style={{ color: "rgba(154,144,136,0.6)" }}>
                          {req.why_needed}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1.5 text-xs" style={{ color: sc.color }}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {sc.label}
                    </div>
                  </div>
                  {req.admin_note && (
                    <div className="mt-3 p-2 rounded text-xs" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", color: "#9A9088" }}>
                      <span style={{ color: "rgba(201,168,76,0.5)" }}>Note: </span>{req.admin_note}
                    </div>
                  )}
                  <p className="text-xs mt-2" style={{ color: "rgba(154,144,136,0.4)" }}>
                    {new Date(req.requested_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        )
      ) : (
        donations.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: "#9A9088" }}>No donations yet.</p>
        ) : (
          <div className="space-y-3">
            {donations.map((don) => {
              const sc = DONATION_STATUS[don.status] ?? DONATION_STATUS.under_review;
              const StatusIcon = sc.icon;
              return (
                <div key={don.id} className="rounded border p-4" style={{ background: "#141414", borderColor: "#2A2A2A" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>{don.book_title}</p>
                      {don.book_author && <p className="text-xs mt-0.5" style={{ color: "#9A9088" }}>{don.book_author}</p>}
                      {don.suggested_category && (
                        <span
                          className="inline-block text-xs px-2 py-0.5 rounded-full mt-2"
                          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "rgba(201,168,76,0.7)" }}
                        >
                          {don.suggested_category}
                        </span>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1.5 text-xs" style={{ color: sc.color }}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {sc.label}
                    </div>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "rgba(154,144,136,0.4)" }}>
                    Submitted {new Date(don.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
