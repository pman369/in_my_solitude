"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, Download, ArrowLeft, Tag, Calendar,
  Eye, Loader2, Lock
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useReadingList } from "@/hooks/useReadingList";
import { useLibrarianChat } from "@/hooks/useLibrarianChat";

/* Types -------------------------------------------------------------------- */
interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  file_url: string | null;
  is_restricted: boolean;
  tags: string[] | null;
  added_date: string | null;
  curator_note: string | null;
  views: number;
  downloads: number;
  categories: Category | null;
}

interface RelatedBook {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
}

interface Props {
  book: Book;
  related: RelatedBook[];
}

/* Component ---------------------------------------------------------------- */
export default function BookDetailContent({ book, related }: Props) {
  const { isAuthenticated } = useUser();
  const { isSaved, toggle, loading: listLoading } = useReadingList(book.id);
  const [readLoading, setReadLoading]   = useState(false);
  const [downloadUrl, setDownloadUrl]   = useState<string | null>(null);
  const [loginPrompt, setLoginPrompt]   = useState(false);

  // Sync Librarian Chat context
  useLibrarianChat({
    contextBookId: book.id,
    contextBookTitle: book.title,
    contextBookAuthor: book.author ?? undefined,
  });

  async function handleRead() {
    if (!book.file_url) return;
    setReadLoading(true);
    try {
      const res = await fetch(`/api/storage/signed-url?file=${encodeURIComponent(book.file_url)}`);
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setReadLoading(false);
    }
  }

  async function handleDownload() {
    if (!isAuthenticated) { setLoginPrompt(true); return; }
    if (!book.file_url) return;
    const res = await fetch(`/api/storage/signed-url?file=${encodeURIComponent(book.file_url)}&download=1`);
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      setDownloadUrl(url);
      // Trigger browser download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.title}.pdf`;
      a.click();
    }
  }

  const category = book.categories;

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* Login prompt banner */}
      {loginPrompt && (
        <div
          className="fixed top-16 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 text-sm"
          style={{ background: "#141414", borderBottom: "1px solid rgba(201,168,76,0.3)" }}
        >
          <span style={{ color: "#F0EDE6" }}>
            <Lock className="inline w-3.5 h-3.5 mr-2" style={{ color: "#C9A84C" }} />
            Downloads require a free account.
          </span>
          <div className="flex gap-3">
            <Link href="/auth/register" className="text-xs font-semibold" style={{ color: "#C9A84C" }}>
              Join free
            </Link>
            <Link href="/auth/login" className="text-xs" style={{ color: "#9A9088" }}>
              Sign in
            </Link>
            <button onClick={() => setLoginPrompt(false)} style={{ color: "#9A9088" }}>✕</button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Back link */}
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-sm mb-10 transition-colors duration-200"
          style={{ color: "#9A9088" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9A9088")}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Library
        </Link>

        {/* ── Book Hero ─────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-10 mb-16">
          {/* Cover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-shrink-0"
          >
            <div
              className="rounded overflow-hidden"
              style={{
                width: 220,
                aspectRatio: "2/3",
                background: "#141414",
                border: "1px solid #2A2A2A",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
            >
              {book.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.cover_url}
                  alt={`Cover of ${book.title}`}
                  fetchPriority="high"
                  loading="eager"
                  decoding="sync"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-heading text-5xl" style={{ color: "rgba(201,168,76,0.2)" }}>
                    {book.title[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1"
          >
            {/* Category badge */}
            {category && (
              <Link
                href={`/library?category=${category.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mb-4 transition-opacity duration-200 hover:opacity-80"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#C9A84C",
                }}
              >
                {category.icon && <span>{category.icon}</span>}
                {category.name}
              </Link>
            )}

            <h1 className="font-heading text-4xl md:text-5xl mb-3" style={{ color: "#F0EDE6" }}>
              {book.title}
            </h1>

            {book.author && (
              <p className="text-lg mb-6" style={{ color: "#9A9088" }}>
                {book.author}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 mb-8 text-xs" style={{ color: "#9A9088" }}>
              {book.added_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(book.added_date).toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {book.views.toLocaleString()} views
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                {book.downloads.toLocaleString()} downloads
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-8">
              {book.file_url && (
                <button
                  onClick={handleRead}
                  disabled={readLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-60"
                  style={{ background: "#C9A84C", color: "#0D0D0D" }}
                >
                  {readLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <BookOpen className="w-4 h-4" />
                  }
                  Read Online
                </button>
              )}

              {book.file_url && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-3 rounded text-sm transition-all duration-300"
                  style={{ border: "1px solid #2A2A2A", color: "#9A9088" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)";
                    (e.currentTarget as HTMLElement).style.color = "#F0EDE6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
                    (e.currentTarget as HTMLElement).style.color = "#9A9088";
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                  {!isAuthenticated && <Lock className="w-3 h-3" />}
                </button>
              )}

              {isAuthenticated && (
                <button
                  onClick={toggle}
                  disabled={listLoading}
                  className="flex items-center gap-2 px-5 py-3 rounded text-sm transition-all duration-300"
                  style={{
                    border: `1px solid ${isSaved ? "rgba(201,168,76,0.5)" : "#2A2A2A"}`,
                    color: isSaved ? "#C9A84C" : "#9A9088",
                    background: isSaved ? "rgba(201,168,76,0.08)" : "transparent",
                  }}
                  aria-label={isSaved ? "Remove from reading list" : "Save to reading list"}
                >
                  {listLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : isSaved ? "★ Saved" : "☆ Save"
                  }
                </button>
              )}
            </div>

            {/* Tags */}
            {book.tags && book.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Tag className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#9A9088" }} />
                {book.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/library?q=${encodeURIComponent(tag)}`}
                    className="px-2.5 py-1 rounded text-xs transition-all duration-200"
                    style={{ background: "#141414", border: "1px solid #2A2A2A", color: "#9A9088" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)";
                      (e.currentTarget as HTMLElement).style.color = "#C9A84C";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
                      (e.currentTarget as HTMLElement).style.color = "#9A9088";
                    }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Description & Curator Note ──────────────────── */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {book.description && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="md:col-span-2"
            >
              <h2 className="font-heading text-xl mb-4" style={{ color: "#F0EDE6" }}>About this book</h2>
              <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#9A9088" }}>
                {book.description.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </motion.div>
          )}

          {book.curator_note && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div
                className="rounded p-6 h-full"
                style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.15)" }}
              >
                <p
                  className="text-xs uppercase tracking-widest mb-4"
                  style={{ color: "rgba(201,168,76,0.6)" }}
                >
                  Curator&apos;s Note
                </p>
                <p className="text-sm leading-relaxed font-heading italic" style={{ color: "#9A9088" }}>
                  &ldquo;{book.curator_note}&rdquo;
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Related Books ───────────────────────────────── */}
        {related.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div
              className="flex items-center justify-between mb-6 pb-4"
              style={{ borderBottom: "1px solid #2A2A2A" }}
            >
              <h2 className="font-heading text-xl" style={{ color: "#F0EDE6" }}>
                From the same shelf
              </h2>
              {category && (
                <Link
                  href={`/library?category=${category.slug}`}
                  className="text-xs transition-colors duration-200"
                  style={{ color: "#9A9088" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#9A9088")}
                >
                  View all in {category.name} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {related.map((rel) => (
                <Link key={rel.id} href={`/book/${rel.id}`} className="group block">
                  <div
                    className="rounded overflow-hidden mb-2 transition-all duration-300 group-hover:shadow-lg"
                    style={{
                      aspectRatio: "2/3",
                      background: "#141414",
                      border: "1px solid #2A2A2A",
                    }}
                  >
                    {rel.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rel.cover_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-heading text-2xl" style={{ color: "rgba(201,168,76,0.2)" }}>
                          {rel.title[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <p
                    className="text-xs font-medium leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-[#C9A84C]"
                    style={{ color: "#F0EDE6" }}
                  >
                    {rel.title}
                  </p>
                  {rel.author && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#9A9088" }}>
                      {rel.author}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* Suppress unused downloadUrl warning */}
      {downloadUrl && null}
    </div>
  );
}
