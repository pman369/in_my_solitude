"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, Key, Clock, CheckCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type VaultRequest = Database["public"]["Tables"]["vault_access_requests"]["Row"];
type Book = Database["public"]["Tables"]["books"]["Row"];

interface RequestWithBook extends VaultRequest {
  books: Pick<Book, "id" | "title" | "author" | "cover_url"> | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending review", color: "#C9A84C", icon: Clock },
  approved: { label: "Approved", color: "#065F46", icon: CheckCheck },
  denied: { label: "Declined", color: "#991B1B", icon: X },
};

interface Props { userId: string }

export default function MyVaultTab({ userId }: Props) {
  const supabase = useRef(createClient()).current;
  const [requests, setRequests] = useState<RequestWithBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("vault_access_requests")
      .select("*")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false })
      .then(async ({ data: rows, error }: { data: VaultRequest[] | null; error: { message: string } | null }) => {
        if (error) {
          console.error("Failed to fetch vault requests:", error.message);
          setLoading(false);
          return;
        }
        if (!rows?.length) { setLoading(false); return; }
        const bookIds = rows.map(r => r.book_id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: books, error: booksErr } = await (supabase as any)
          .from("books")
          .select("id, title, author, cover_url")
          .in("id", bookIds) as { data: Pick<Book, "id" | "title" | "author" | "cover_url">[] | null; error: { message: string } | null };
        if (booksErr) console.error("Failed to fetch books for vault requests:", booksErr.message);
        const bookMap = Object.fromEntries((books ?? []).map(b => [b.id, b]));
        setRequests(rows.map(r => ({ 
          ...r, 
          books: r.book_id && bookMap[r.book_id] ? bookMap[r.book_id] : null 
        } as RequestWithBook)));
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

  if (!requests.length) {
    return (
      <div className="text-center py-20">
        <Key className="w-10 h-10 mx-auto mb-4" style={{ color: "rgba(153,27,27,0.2)" }} />
        <h2 className="font-heading text-xl mb-2" style={{ color: "#F0EDE6" }}>No Vault requests yet</h2>
        <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: "#9A9088" }}>
          Visit the Vault and request access to restricted books that call to you.
        </p>
        <Link
          href="/vault"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm transition-all duration-200"
          style={{ border: "1px solid rgba(153,27,27,0.4)", color: "#9A9088" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(153,27,27,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(153,27,27,0.4)")}
        >
          <Key className="w-4 h-4" /> Visit the Vault
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs mb-6" style={{ color: "#9A9088" }}>
        {requests.length} request{requests.length !== 1 ? "s" : ""} — approved titles are immediately accessible.
      </p>

      {requests.map((req) => {
        const sc = STATUS_CONFIG[req.status || 'pending'] ?? STATUS_CONFIG.pending;
        const StatusIcon = sc.icon;
        return (
          <div
            key={req.id}
            className="rounded border p-4 transition-all duration-200"
            style={{ background: "#141414", borderColor: req.status === "approved" ? "rgba(6,95,70,0.2)" : req.status === "denied" ? "rgba(153,27,27,0.15)" : "#2A2A2A" }}
          >
            <div className="flex items-start gap-4">
              {/* Cover */}
              <div
                className="rounded overflow-hidden flex-shrink-0"
                style={{ width: 40, aspectRatio: "2/3", background: "#0D0D0D", border: "1px solid rgba(153,27,27,0.2)", filter: req.status !== "approved" ? "blur(1.5px) brightness(0.6)" : "none" }}
              >
                {req.books?.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={req.books.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Key className="w-3 h-3" style={{ color: "rgba(153,27,27,0.4)" }} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {req.status === "approved" ? (
                  <Link href={`/book/${req.book_id}`}>
                    <h3 className="text-sm font-semibold line-clamp-1 hover:text-[#C9A84C] transition-colors" style={{ color: "#F0EDE6" }}>
                      {req.books?.title ?? "Unknown book"}
                    </h3>
                  </Link>
                ) : (
                  <h3 className="text-sm font-semibold line-clamp-1" style={{ color: "#F0EDE6" }}>
                    {req.books?.title ?? "Unknown book"}
                  </h3>
                )}
                {req.books?.author && (
                  <p className="text-xs mt-0.5" style={{ color: "#9A9088" }}>{req.books.author}</p>
                )}

                {/* Status badge */}
                <div className="flex items-center gap-1.5 mt-2">
                  <StatusIcon className="w-3 h-3" style={{ color: sc.color }} />
                  <span className="text-xs" style={{ color: sc.color }}>{sc.label}</span>
                </div>

                {/* Dates */}
                <p className="text-xs mt-1" style={{ color: "rgba(154,144,136,0.5)" }}>
                  Requested {req.requested_at ? new Date(req.requested_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Date unknown"}
                  {req.reviewed_at && ` · Reviewed ${new Date(req.reviewed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                </p>
              </div>

              {/* Approved: read button */}
              {req.status === "approved" && (
                <Link
                  href={`/book/${req.book_id}`}
                  className="flex-shrink-0 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-200"
                  style={{ background: "rgba(6,95,70,0.15)", border: "1px solid rgba(6,95,70,0.3)", color: "#34D399" }}
                >
                  Read
                </Link>
              )}
            </div>swesar

            {/* Admin note (if declined) */}
            {req.admin_note && (
              <div
                className="mt-3 px-3 py-2 rounded text-xs leading-relaxed"
                style={{ background: "rgba(153,27,27,0.08)", border: "1px solid rgba(153,27,27,0.15)", color: "#9A9088" }}
              >
                <span style={{ color: "rgba(153,27,27,0.6)" }}>Curator note: </span>
                {req.admin_note}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
