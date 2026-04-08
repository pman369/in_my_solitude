"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Key, ArrowLeft, Loader2, Check, Lock } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Book     = Database["public"]["Tables"]["books"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface BookWithCategory extends Book {
  categories: Category | null;
}

interface Props {
  book: BookWithCategory;
}

export default function VaultRequestContent({ book }: Props) {
  const { user, isAuthenticated, loading: authLoading } = useUser();
  const supabase = createClient();

  const [reason,     setReason]     = useState("");
  const [background, setBackground] = useState("");
  const [agreed,     setAgreed]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [done,       setDone]       = useState(false);

  const MIN_REASON = 100;
  const reasonOk = reason.trim().length >= MIN_REASON;
  const canSubmit = reasonOk && agreed && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSubmitting(true);

    try {
      // Check for existing request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from("vault_access_requests")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .single() as { data: { id: string; status: string } | null };

      if (existing) {
        if (existing.status === "approved") {
          setError("You already have approved access to this book.");
        } else if (existing.status === "pending") {
          setError("You already have a pending request for this book.");
        } else {
          setError("A previous request for this book was declined. Contact the curator if you believe this was in error.");
        }
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from("vault_access_requests") as any).insert({
        user_id:    user.id,
        book_id:    book.id,
        reason:     reason.trim(),
        background: background.trim() || null,
        status:     "pending",
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: "#0D0D0D",
    border: "1px solid #2A2A2A",
    color: "#F0EDE6",
  };

  // Not logged in
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0D0D0D" }}>
        <div className="text-center max-w-sm">
          <Lock className="w-10 h-10 mx-auto mb-4" style={{ color: "rgba(153,27,27,0.5)" }} />
          <h1 className="font-heading text-2xl mb-3" style={{ color: "#F0EDE6" }}>Sign in to request access</h1>
          <p className="text-sm mb-6" style={{ color: "#9A9088" }}>
            You need a free account to submit a Vault access request.
          </p>
          <Link
            href={`/auth/login?next=/vault/request/${book.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-semibold transition-all duration-300"
            style={{ background: "#C9A84C", color: "#0D0D0D" }}
          >
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(153,27,27,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-20">
        <Link
          href="/vault"
          className="inline-flex items-center gap-2 text-sm mb-10 transition-colors duration-200"
          style={{ color: "#9A9088" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9A9088")}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to The Vault
        </Link>

        {done ? (
          /* ── Success state ────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}
            >
              <Check className="w-7 h-7" style={{ color: "#C9A84C" }} />
            </div>
            <h1 className="font-heading text-3xl mb-3" style={{ color: "#F0EDE6" }}>
              Request submitted
            </h1>
            <p className="text-sm leading-relaxed mb-8 max-w-md mx-auto" style={{ color: "#9A9088" }}>
              Your request is with the curator. Expect a response within a few days.
              The curator reads every request personally and considers each one carefully.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/vault"
                className="px-5 py-2.5 rounded text-sm transition-all duration-200"
                style={{ border: "1px solid #2A2A2A", color: "#9A9088" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
              >
                Return to Vault
              </Link>
              <Link
                href="/library"
                className="px-5 py-2.5 rounded text-sm transition-all duration-200"
                style={{ background: "#141414", border: "1px solid #2A2A2A", color: "#F0EDE6" }}
              >
                Browse Library
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── Request Form ─────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Book info card */}
            <div
              className="flex gap-5 p-5 rounded border mb-10"
              style={{ background: "#141414", borderColor: "rgba(153,27,27,0.2)" }}
            >
              {book.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.cover_url}
                  alt=""
                  className="w-14 rounded flex-shrink-0 object-cover"
                  style={{ aspectRatio: "2/3", filter: "blur(2px) brightness(0.6)" }}
                />
              ) : (
                <div
                  className="w-14 flex-shrink-0 rounded flex items-center justify-center"
                  style={{ aspectRatio: "2/3", background: "rgba(153,27,27,0.1)", border: "1px solid rgba(153,27,27,0.2)" }}
                >
                  <Key className="w-5 h-5" style={{ color: "rgba(153,27,27,0.5)" }} />
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(153,27,27,0.7)" }}>
                  Vault — Restricted
                </p>
                <h2 className="font-heading text-lg mb-1" style={{ color: "#F0EDE6" }}>
                  {book.title}
                </h2>
                {book.author && (
                  <p className="text-sm" style={{ color: "#9A9088" }}>{book.author}</p>
                )}
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="font-heading text-3xl mb-2" style={{ color: "#F0EDE6" }}>
                Request access
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#9A9088" }}>
                Access to this book is not a right — it is a privilege extended by the curator
                to those who approach with honesty and readiness. Requests are reviewed personally.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-7">
              {/* Why */}
              <div>
                <label
                  htmlFor="reason"
                  className="block text-xs uppercase tracking-widest mb-2"
                  style={{ color: "#9A9088" }}
                >
                  Why do you want to read this? <span style={{ color: "#991B1B" }}>*</span>
                </label>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: "rgba(154,144,136,0.7)" }}>
                  Be honest and specific. At least {MIN_REASON} characters. Generic answers will be declined.
                </p>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={6}
                  placeholder={`"I've been studying consciousness for three years and this book keeps appearing in references to..."`}
                  className="w-full px-4 py-3 rounded text-sm outline-none transition-all duration-200 resize-none"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(153,27,27,0.5)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                />
                <p
                  className="text-xs mt-1.5 text-right"
                  style={{ color: reasonOk ? "rgba(6,95,70,0.8)" : "rgba(154,144,136,0.5)" }}
                >
                  {reason.trim().length} / {MIN_REASON} min
                </p>
              </div>

              {/* Background */}
              <div>
                <label
                  htmlFor="background"
                  className="block text-xs uppercase tracking-widest mb-2"
                  style={{ color: "#9A9088" }}
                >
                  Tell us about your background or current journey{" "}
                  <span style={{ color: "rgba(154,144,136,0.5)" }}>(optional)</span>
                </label>
                <textarea
                  id="background"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  rows={4}
                  placeholder="Your path, practices, studies, or why you're here..."
                  className="w-full px-4 py-3 rounded text-sm outline-none transition-all duration-200 resize-none"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(153,27,27,0.5)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
                />
              </div>

              {/* Responsibility checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200"
                    style={{
                      background: agreed ? "rgba(153,27,27,0.8)" : "transparent",
                      border: `1px solid ${agreed ? "rgba(153,27,27,0.8)" : "#2A2A2A"}`,
                    }}
                  >
                    {agreed && <Check className="w-2.5 h-2.5" style={{ color: "#F0EDE6" }} />}
                  </div>
                </div>
                <span className="text-sm leading-relaxed" style={{ color: "#9A9088" }}>
                  I take full responsibility for how I engage with this content.
                  I understand it may challenge my existing framework and I approach it with discernment.
                </span>
              </label>

              {/* Error */}
              {error && (
                <div
                  className="px-4 py-3 rounded text-sm"
                  style={{ background: "rgba(153,27,27,0.1)", border: "1px solid rgba(153,27,27,0.3)", color: "#F87171" }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-40"
                style={{ background: "rgba(153,27,27,0.85)", color: "#F0EDE6", border: "1px solid rgba(153,27,27,0.4)" }}
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  : <><Key className="w-4 h-4" /> Submit Request</>
                }
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
