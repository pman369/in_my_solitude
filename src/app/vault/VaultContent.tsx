"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Key, Lock, Eye, BookOpen } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import type { VaultBook } from "./page";

interface Props {
  books: VaultBook[];
}

export default function VaultContent({ books }: Props) {
  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* ── Ambient ─────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(153,27,27,0.06)_0%,transparent_70%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(153,27,27,0.08)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24">
        {/* ── Header ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{
              background: "rgba(153,27,27,0.1)",
              border: "1px solid rgba(153,27,27,0.3)",
            }}
          >
            <Key className="w-6 h-6" style={{ color: "#991B1B" }} />
          </div>

          <h1
            className="font-heading text-5xl md:text-6xl mb-6"
            style={{
              color: "#F0EDE6",
              textShadow: "0 0 40px rgba(153,27,27,0.3)",
            }}
          >
            The Vault
          </h1>

          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-base italic leading-relaxed" style={{ color: "#9A9088" }}>
              These books are not restricted because they are dangerous.
            </p>
            <p className="text-base italic leading-relaxed" style={{ color: "#9A9088" }}>
              They are here because they require context, discernment, and readiness.
            </p>
            <p className="text-sm mt-4" style={{ color: "#9A9088" }}>
              Request access with honesty. The curator reviews every request personally.
            </p>
          </div>

          <div
            className="w-24 h-px mx-auto mt-10"
            style={{ background: "linear-gradient(to right, transparent, rgba(153,27,27,0.5), transparent)" }}
          />
        </motion.div>

        {/* ── Book Grid ─────────────────────────────────── */}
        {books.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#9A9088" }}>
            <Lock className="w-8 h-8 mx-auto mb-4 opacity-30" />
            <p className="text-sm">The Vault is being prepared.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((book, i) => (
              <VaultCard key={book.id} book={book} index={i} />
            ))}
          </div>
        )}

        {/* ── Footer note ───────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-center text-xs mt-20 max-w-md mx-auto leading-relaxed"
          style={{ color: "rgba(154,144,136,0.5)" }}
        >
          Access to Vault books is granted on a book-by-book basis.
          Approval is not guaranteed. Requests that feel extractive or careless will be declined without explanation.
        </motion.p>
      </div>
    </div>
  );
}

/* ─────────────────────────── VaultCard ─────────────────────────────────── */

function VaultCard({ book, index }: { book: VaultBook; index: number }) {
  const { isAuthenticated } = useUser();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover — blurred and darkened */}
      <div
        className="relative rounded overflow-hidden mb-3 transition-all duration-500"
        style={{
          aspectRatio: "2/3",
          background: "#141414",
          border: `1px solid ${hovered ? "rgba(153,27,27,0.5)" : "rgba(153,27,27,0.2)"}`,
          boxShadow: hovered ? "0 8px 32px rgba(153,27,27,0.2)" : "none",
        }}
      >
        {/* Blurred cover image */}
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_url}
            alt=""
            className="w-full h-full object-cover transition-all duration-500"
            style={{
              filter: "blur(6px) brightness(0.35)",
              transform: hovered ? "scale(1.05)" : "scale(1)",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-heading text-4xl" style={{ color: "rgba(153,27,27,0.2)" }}>
              {book.title[0]?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Lock overlay always visible */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-all duration-300"
          style={{ background: "rgba(13,13,13,0.5)" }}
        >
          <Lock
            className="w-6 h-6 transition-all duration-300"
            style={{
              color: hovered ? "#991B1B" : "rgba(154,144,136,0.4)",
              transform: hovered ? "scale(1.1)" : "scale(1)",
            }}
          />

          {/* CTA appears on hover */}
          <div
            className="transition-all duration-300"
            style={{ opacity: hovered ? 1 : 0, transform: hovered ? "translateY(0)" : "translateY(4px)" }}
          >
            <Link
              href={isAuthenticated ? `/vault/request/${book.id}` : `/auth/login?next=/vault/request/${book.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-200"
              style={{
                background: "rgba(153,27,27,0.9)",
                color: "#F0EDE6",
                border: "1px solid rgba(153,27,27,0.5)",
              }}
            >
              <Key className="w-3 h-3" />
              Request Access
            </Link>
          </div>
        </div>
      </div>

      {/* Title + author always visible */}
      <h3
        className="text-xs font-semibold leading-snug mb-1 line-clamp-2 transition-colors duration-200"
        style={{ color: hovered ? "#F0EDE6" : "rgba(240,237,230,0.6)" }}
      >
        {book.title}
      </h3>
      {book.author && (
        <p className="text-xs line-clamp-1" style={{ color: "rgba(154,144,136,0.5)" }}>
          {book.author}
        </p>
      )}

      {/* Blurred description teaser */}
      {book.description && (
        <p
          className="text-xs mt-2 leading-relaxed line-clamp-2"
          style={{
            color: "#9A9088",
            filter: "blur(3px)",
            userSelect: "none",
          }}
          aria-hidden="true"
        >
          {book.description}
        </p>
      )}

      {/* Visible "peek" line */}
      {book.description && (
        <p className="text-xs mt-1 leading-tight" style={{ color: "rgba(154,144,136,0.4)" }}>
          <Eye className="inline w-2.5 h-2.5 mr-1" />
          Contents restricted
        </p>
      )}
    </motion.div>
  );
}
