"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, BookPlus, BookHeart, Loader2, Check, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";

type Tab = "request" | "donate";

export default function DeskContent() {
  const [tab, setTab] = useState<Tab>("request");

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.05)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-24">
        {/* ── Header ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <Library className="w-10 h-10 mx-auto mb-6" style={{ color: "rgba(201,168,76,0.5)" }} />
          <h1 className="font-heading text-5xl mb-4" style={{ color: "#C9A84C" }}>
            The Request Desk
          </h1>
          <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: "#9A9088" }}>
            This library grows with the community. Ask for what you need. Share what you have.
          </p>
        </motion.div>

        {/* ── Tab Toggle ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex rounded overflow-hidden mb-10 max-w-md mx-auto"
          style={{ border: "1px solid #2A2A2A" }}
        >
          {([
            { key: "request", label: "Find a Book",   icon: BookPlus  },
            { key: "donate",  label: "Donate a Book", icon: BookHeart },
          ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm tracking-wide transition-all duration-200"
              style={{
                background: tab === key ? "rgba(201,168,76,0.1)" : "transparent",
                color:      tab === key ? "#C9A84C" : "#9A9088",
                borderRight: key === "request" ? "1px solid #2A2A2A" : "none",
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </motion.div>

        {/* ── Forms ───────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {tab === "request" ? (
            <motion.div
              key="request"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3 }}
            >
              <BookRequestForm />
            </motion.div>
          ) : (
            <motion.div
              key="donate"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3 }}
            >
              <DonationForm />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Community note ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mt-20 text-center max-w-xl mx-auto"
          style={{ borderTop: "1px solid #2A2A2A", paddingTop: "3rem" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "#9A9088" }}>
            This is a free library maintained by one person.
            If a book matters to you, share the library — not just the files.
            Help keep this place alive by contributing, not only extracting.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────── BookRequestForm ───────────────────────────── */

function BookRequestForm() {
  const { user, isAuthenticated } = useUser();
  const supabase = useRef(createClient()).current;

  const [title,     setTitle]     = useState("");
  const [author,    setAuthor]    = useState("");
  const [why,       setWhy]       = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  const inputStyle = { background: "#0D0D0D", border: "1px solid #2A2A2A", color: "#F0EDE6" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase.from("book_requests") as any).insert({
        user_id:     user?.id ?? null,
        book_title:  title.trim(),
        book_author: author.trim() || null,
        why_needed:  why.trim() || null,
        status:      "open",
      });
      if (err) { setError(err.message); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) return <SuccessState message="Your request has been submitted. The curator will try to source it." onReset={() => { setDone(false); setTitle(""); setAuthor(""); setWhy(""); }} />;

  return (
    <div className="max-w-2xl mx-auto">
      <FormCard
        icon={<BookPlus className="w-5 h-5" style={{ color: "#C9A84C" }} />}
        title="Find a Book"
        description={`Looking for a title we don't have? Submit a request and the curator will try to source it.`}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormField label="Book Title" required>
            <input
              id="req-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="The title you're looking for"
              className="w-full px-4 py-3 rounded text-sm outline-none transition-all duration-200"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
            />
          </FormField>

          <FormField label="Author">
            <input
              id="req-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="If known"
              className="w-full px-4 py-3 rounded text-sm outline-none transition-all duration-200"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
            />
          </FormField>

          <FormField label="Why this book matters to you">
            <textarea
              id="req-why"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={4}
              placeholder="Optional — but context helps the curator prioritise"
              className="w-full px-4 py-3 rounded text-sm outline-none transition-all duration-200 resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
            />
          </FormField>

          {!isAuthenticated && (
            <p className="text-xs" style={{ color: "#9A9088" }}>
              You&apos;re submitting anonymously.{" "}
              <Link href="/auth/login" className="transition-colors" style={{ color: "#C9A84C" }}>
                Sign in
              </Link>{" "}
              to track your request.
            </p>
          )}

          {error && <ErrorMsg message={error} />}

          <SubmitButton loading={loading} disabled={!title.trim() || loading} label="Submit Request" />
        </form>
      </FormCard>
    </div>
  );
}

/* ─────────────────────────── DonationForm ──────────────────────────────── */

function DonationForm() {
  const { user, isAuthenticated } = useUser();
  const supabase = useRef(createClient()).current;

  const [title,     setTitle]     = useState("");
  const [author,    setAuthor]    = useState("");
  const [notes,     setNotes]     = useState("");
  const [category,  setCategory]  = useState("");
  const [file,      setFile]      = useState<File | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);

  const inputStyle = { background: "#0D0D0D", border: "1px solid #2A2A2A", color: "#F0EDE6" };

  const CATEGORIES = [
    "Consciousness & Mind", "Forbidden & Real History", "Spirituality & Mysticism",
    "Science & Cosmology", "Esoteric & Occult", "Law & Systems of Control",
    "Psychology & Inner Healing", "Ancient Civilizations",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    setLoading(true);

    try {
      let fileUrl: string | null = null;

      // Upload file if provided
      if (file) {
        if (!isAuthenticated) {
          setError("Please sign in to donate a book with a file.");
          return;
        }
        const ext      = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("donations-inbox")
          .upload(fileName, file, { contentType: "application/pdf" });

        if (uploadErr) { setError(uploadErr.message); return; }
        fileUrl = uploadData.path;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await (supabase.from("book_donations") as any).insert({
        user_id:            user?.id ?? null,
        book_title:         title.trim(),
        book_author:        author.trim() || null,
        file_url:           fileUrl,
        notes:              notes.trim() || null,
        suggested_category: category || null,
        status:             "under_review",
      });

      if (insertErr) { setError(insertErr.message); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) return <SuccessState message="Your donation has been submitted and is under review. Thank you for contributing." onReset={() => { setDone(false); setTitle(""); setAuthor(""); setNotes(""); setCategory(""); setFile(null); }} />;

  return (
    <div className="max-w-2xl mx-auto">
      <FormCard
        icon={<BookHeart className="w-5 h-5" style={{ color: "#C9A84C" }} />}
        title="Donate a Book"
        description="Have a PDF that belongs here? Share it. All donations are reviewed before being published."
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormField label="Book Title" required>
            <input
              id="don-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="The title of the book"
              className="w-full px-4 py-3 rounded text-sm outline-none transition-all duration-200"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
            />
          </FormField>

          <FormField label="Author">
            <input
              id="don-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="If known"
              className="w-full px-4 py-3 rounded text-sm outline-none transition-all duration-200"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
            />
          </FormField>

          <FormField label="Suggested Category">
            <select
              id="don-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded text-sm outline-none transition-all duration-200 appearance-none cursor-pointer"
              style={inputStyle}
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>

          {/* PDF Upload */}
          <FormField label="Upload PDF">
            <div
              className="rounded border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200"
              style={{ borderColor: file ? "rgba(201,168,76,0.4)" : "#2A2A2A" }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f?.type === "application/pdf") setFile(f);
              }}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm" style={{ color: "#C9A84C" }}>{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    style={{ color: "#9A9088" }}
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2" style={{ color: "#9A9088" }}>
                  <Upload className="w-6 h-6 opacity-50" />
                  <span className="text-sm">Drop PDF here or click to browse</span>
                  <span className="text-xs opacity-60">Max 100MB · PDF only</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: "rgba(154,144,136,0.6)" }}>
              All donated materials are reviewed for quality and relevance before being published.
            </p>
          </FormField>

          <FormField label="Notes for the curator">
            <textarea
              id="don-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Why you think this belongs here, quality notes, etc."
              className="w-full px-4 py-3 rounded text-sm outline-none transition-all duration-200 resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
            />
          </FormField>

          {!isAuthenticated && (
            <p className="text-xs" style={{ color: "#9A9088" }}>
              <Link href="/auth/login" style={{ color: "#C9A84C" }}>Sign in</Link>{" "}
              to attach a PDF and track your donation.
            </p>
          )}

          {error && <ErrorMsg message={error} />}

          <SubmitButton loading={loading} disabled={!title.trim() || loading} label="Donate to the Archive" />
        </form>
      </FormCard>
    </div>
  );
}

/* ─────────────────────────── Shared UI ─────────────────────────────────── */

function FormCard({ icon, title, description, children }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border p-8" style={{ background: "#141414", borderColor: "#2A2A2A" }}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h2 className="font-heading text-2xl" style={{ color: "#F0EDE6" }}>{title}</h2>
      </div>
      <p className="text-sm mb-8 leading-relaxed" style={{ color: "#9A9088" }}>{description}</p>
      {children}
    </div>
  );
}

function FormField({ label, required, children }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>
        {label}
        {required && <span className="ml-1" style={{ color: "#C9A84C" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SubmitButton({ loading, disabled, label }: { loading: boolean; disabled: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-40"
      style={{ background: "#C9A84C", color: "#0D0D0D" }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
    </button>
  );
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div
      className="px-4 py-3 rounded text-sm"
      style={{ background: "rgba(153,27,27,0.1)", border: "1px solid rgba(153,27,27,0.3)", color: "#F87171" }}
      role="alert"
    >
      {message}
    </div>
  );
}

function SuccessState({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-10">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}
      >
        <Check className="w-6 h-6" style={{ color: "#C9A84C" }} />
      </div>
      <p className="text-sm leading-relaxed mb-6 max-w-sm mx-auto" style={{ color: "#9A9088" }}>
        {message}
      </p>
      <button
        onClick={onReset}
        className="text-xs transition-colors duration-200"
        style={{ color: "#9A9088" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#9A9088")}
      >
        Submit another
      </button>
    </div>
  );
}
