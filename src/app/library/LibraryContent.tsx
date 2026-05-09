"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, BookOpen, Loader2, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLibrary } from "@/hooks/useLibrary";
import type { Book, SortOption } from "@/services/libraryService";
import { BookCover } from "@/components/ui/BookCover";

const SORT_OPTIONS = [
  { value: "newest",   label: "Newest First" },
  { value: "oldest",   label: "Oldest First" },
  { value: "az",       label: "A – Z" },
  { value: "za",       label: "Z – A" },
  { value: "popular",  label: "Most Viewed" },
] as const;

export default function LibraryContent() {
  const {
    books, categories, total, loading, loadingMore,
    query, setQuery, category, setCategory,
    sort, setSort, filtersOpen, setFiltersOpen,
    loadMore, hasMore, clearFilters
  } = useLibrary();

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* ── Header ────────────────────────────────────────── */}
      <header
        className="sticky top-16 z-30 px-4 sm:px-6 py-4"
        style={{
          background: "rgba(13,13,13,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #2A2A2A",
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Search row */}
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "#9A9088" }}
              />
              <input
                id="library-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, subject, keyword…"
                className="w-full pl-10 pr-4 py-2.5 rounded text-sm outline-none transition-all duration-200"
                style={{
                  background: "#141414",
                  border: "1px solid #2A2A2A",
                  color: "#F0EDE6",
                }}
                aria-label="Search the library"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#9A9088" }}
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                id="library-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="appearance-none pl-3 pr-8 py-2.5 rounded text-sm outline-none cursor-pointer"
                style={{ background: "#141414", border: "1px solid #2A2A2A", color: "#9A9088" }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#9A9088" }} />
            </div>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-3 py-2.5 rounded text-sm transition-all duration-200"
              style={{
                background: filtersOpen ? "rgba(201,168,76,0.1)" : "#141414",
                border: `1px solid ${filtersOpen ? "rgba(201,168,76,0.4)" : "#2A2A2A"}`,
                color: filtersOpen ? "#C9A84C" : "#9A9088",
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Category pills */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pb-1">
                  <CategoryPill 
                    active={!category} 
                    onClick={() => setCategory("")} 
                    label="All" 
                  />
                  {categories.map((cat) => (
                    <CategoryPill
                      key={cat.slug}
                      active={category === cat.slug}
                      onClick={() => setCategory(category === cat.slug ? "" : cat.slug)}
                      label={cat.name}
                      icon={cat.icon}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          {!loading && (
            <p className="text-xs mt-2" style={{ color: "#9A9088" }}>
              {total === 0 ? "No books found" : `${total.toLocaleString()} books`}
              {query && ` for "${query}"`}
            </p>
          )}
        </div>
      </header>

      {/* ── Book Grid ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A84C" }} />
          </div>
        ) : books.length === 0 ? (
          <EmptyState onClear={clearFilters} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {books.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-14">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-3 rounded border text-sm transition-all duration-300 disabled:opacity-50"
                  style={{ border: "1px solid #2A2A2A", color: "#9A9088" }}
                >
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : `Load more (${total - books.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CategoryPill({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: string | null }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
      style={{
        background: active ? "rgba(201,168,76,0.15)" : "#141414",
        border: `1px solid ${active ? "rgba(201,168,76,0.5)" : "#2A2A2A"}`,
        color: active ? "#C9A84C" : "#9A9088",
      }}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </button>
  );
}

const BookCard = memo(function BookCard({ book, index }: { book: Book; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link href={`/book/${book.id}`} className="group block">
        {/* Cover */}
        <div
          className="relative rounded overflow-hidden mb-3 transition-all duration-300 border border-[#2A2A2A] group-hover:border-[rgba(201,168,76,0.3)] group-hover:-translate-y-1"
          style={{ aspectRatio: "2/3", background: "#141414" }}
        >
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              loading={index < 12 ? "eager" : "lazy"}
              priority={index < 6}
            />
          ) : (
            <BookCover
              title={book.title}
              author={book.author}
              categorySlug={book.categories?.slug}
              isRestricted={book.is_restricted ?? false}
            />
          )}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <BookOpen className="w-6 h-6 text-[#C9A84C]" />
          </div>
        </div>
        <h3 className="text-xs font-semibold mb-1 line-clamp-2 text-[#F0EDE6] group-hover:text-[#C9A84C] transition-colors duration-200">
          {book.title}
        </h3>
        {book.author && (
          <p className="text-[10px] uppercase tracking-wider opacity-50">{book.author}</p>
        )}
      </Link>
    </motion.div>
  );
});
BookCard.displayName = "BookCard";

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <BookOpen className="w-10 h-10 mb-4 opacity-20" />
      <h2 className="font-heading text-xl mb-2">Nothing found</h2>
      <p className="text-sm mb-6 opacity-50">No books matched your criteria.</p>
      <button onClick={onClear} className="text-sm text-[#C9A84C]">Clear filters</button>
    </div>
  );
}
