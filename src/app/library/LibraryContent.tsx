"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, BookOpen, Loader2, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import Link from "next/link";

type Book     = Database["public"]["Tables"]["books"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

const SORT_OPTIONS = [
  { value: "newest",   label: "Newest First" },
  { value: "oldest",   label: "Oldest First" },
  { value: "az",       label: "A – Z" },
  { value: "za",       label: "Z – A" },
  { value: "popular",  label: "Most Viewed" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 24;

export default function LibraryContent() {
  const router       = useRouter();
  const params       = useSearchParams();

  const [books,       setBooks]       = useState<Book[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(0);

  const [query,       setQuery]       = useState(params.get("q") ?? "");
  const [category,    setCategory]    = useState(params.get("category") ?? "");
  const [sort,        setSort]        = useState<SortOption>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const supabase   = useRef(createClient()).current;
  const debounceId = useRef<ReturnType<typeof setTimeout>>();

  // Fetch categories once
  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => { if (data) setCategories(data); });
  }, [supabase]);

  const fetchBooks = useCallback(async (
    q: string,
    cat: string,
    s: SortOption,
    pageNum: number,
    append = false,
  ) => {
    if (pageNum === 0) setLoading(true);
    else               setLoadingMore(true);

    let qb = supabase
      .from("books")
      .select("*", { count: "exact" })
      .eq("is_published", true)
      .eq("is_restricted", false)
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    // Full-text search (Supabase native postgres FTS)
    if (q.trim()) {
      qb = qb.textSearch("fts", q.trim(), { type: "websearch", config: "english" });
    }

    if (cat) {
      // Match by category slug — join via categories table
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", cat)
        .single();
      if (catData) qb = qb.eq("category_id", catData.id);
    }

    switch (s) {
      case "newest":  qb = qb.order("added_date", { ascending: false }); break;
      case "oldest":  qb = qb.order("added_date", { ascending: true });  break;
      case "az":      qb = qb.order("title",       { ascending: true });  break;
      case "za":      qb = qb.order("title",       { ascending: false }); break;
      case "popular": qb = qb.order("views",       { ascending: false }); break;
    }

    const { data, count, error } = await qb;

    if (!error) {
      setBooks(prev => append ? [...prev, ...(data ?? [])] : (data ?? []));
      setTotal(count ?? 0);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [supabase]);

  // Re-fetch when filters change (debounced for query)
  useEffect(() => {
    clearTimeout(debounceId.current);
    debounceId.current = setTimeout(() => {
      setPage(0);
      fetchBooks(query, category, sort, 0, false);
      // Sync URL params
      const p = new URLSearchParams();
      if (query)    p.set("q",        query);
      if (category) p.set("category", category);
      router.replace(`/library${p.size ? `?${p}` : ""}`, { scroll: false });
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, sort]);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBooks(query, category, sort, nextPage, true);
  }

  const hasMore = books.length < total;

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* ── Header ────────────────────────────────────────── */}
      <div
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
                onFocus={(e)  => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                onBlur={(e)   => (e.currentTarget.style.borderColor = "#2A2A2A")}
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
                className="appearance-none pl-3 pr-8 py-2.5 rounded text-sm outline-none transition-all duration-200 cursor-pointer"
                style={{
                  background: "#141414",
                  border: "1px solid #2A2A2A",
                  color: "#9A9088",
                }}
                aria-label="Sort books"
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
              aria-label="Toggle category filters"
              aria-expanded={filtersOpen}
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
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pb-1">
                  <button
                    onClick={() => setCategory("")}
                    className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                    style={{
                      background: !category ? "rgba(201,168,76,0.15)" : "#141414",
                      border: `1px solid ${!category ? "rgba(201,168,76,0.5)" : "#2A2A2A"}`,
                      color: !category ? "#C9A84C" : "#9A9088",
                    }}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => setCategory(category === cat.slug ? "" : cat.slug)}
                      className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                      style={{
                        background: category === cat.slug ? "rgba(201,168,76,0.15)" : "#141414",
                        border: `1px solid ${category === cat.slug ? "rgba(201,168,76,0.5)" : "#2A2A2A"}`,
                        color: category === cat.slug ? "#C9A84C" : "#9A9088",
                      }}
                    >
                      {cat.icon && <span className="mr-1">{cat.icon}</span>}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          {!loading && (
            <p className="text-xs mt-2" style={{ color: "#9A9088" }}>
              {total === 0
                ? "No books found"
                : `${total.toLocaleString()} book${total === 1 ? "" : "s"}`}
              {query && ` for "${query}"`}
              {category && ` in ${categories.find(c => c.slug === category)?.name ?? category}`}
            </p>
          )}
        </div>
      </div>

      {/* ── Book Grid ─────────────────────────────────────── */}
      <main id="library-grid" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A84C" }} />
          </div>
        ) : books.length === 0 ? (
          <EmptyState query={query} category={category} onClear={() => { setQuery(""); setCategory(""); }} />
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
                  className="flex items-center gap-2 px-8 py-3 rounded border text-sm tracking-wide transition-all duration-300 disabled:opacity-50"
                  style={{ border: "1px solid #2A2A2A", color: "#9A9088" }}
                  onMouseEnter={(e) => {
                    if (!loadingMore) (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
                  }}
                >
                  {loadingMore
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
                    : `Load more (${total - books.length} remaining)`
                  }
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ─────────────────────────────── BookCard ───────────────────────────────── */

function BookCard({ book, index }: { book: Book; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.4 }}
    >
      <Link
        href={`/book/${book.id}`}
        className="group block"
        aria-label={`${book.title}${book.author ? ` by ${book.author}` : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Cover */}
        <div
          className="relative rounded overflow-hidden mb-3 transition-all duration-300"
          style={{
            aspectRatio: "2/3",
            background: "#141414",
            border: `1px solid ${hovered ? "rgba(201,168,76,0.3)" : "#2A2A2A"}`,
            boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.6)" : "none",
            transform: hovered ? "translateY(-4px)" : "translateY(0)",
          }}
        >
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500"
              style={{ transform: hovered ? "scale(1.03)" : "scale(1)" }}
            />
          ) : (
            <CoverPlaceholder title={book.title} />
          )}

          {/* Hover overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-300"
            style={{
              background: "rgba(13,13,13,0.85)",
              opacity: hovered ? 1 : 0,
            }}
            aria-hidden="true"
          >
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
              style={{ background: "#C9A84C", color: "#0D0D0D" }}
            >
              <BookOpen className="w-3 h-3" /> Read
            </span>
          </div>
        </div>

        {/* Meta */}
        <h3
          className="text-xs font-semibold leading-snug mb-1 line-clamp-2 transition-colors duration-200"
          style={{ color: hovered ? "#C9A84C" : "#F0EDE6" }}
        >
          {book.title}
        </h3>
        {book.author && (
          <p className="text-xs line-clamp-1" style={{ color: "#9A9088" }}>
            {book.author}
          </p>
        )}
      </Link>
    </motion.div>
  );
}

function CoverPlaceholder({ title }: { title: string }) {
  const initial = title[0]?.toUpperCase() ?? "?";
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <span
        className="font-heading text-4xl mb-3"
        style={{ color: "rgba(201,168,76,0.3)" }}
      >
        {initial}
      </span>
      <p
        className="text-xs text-center leading-tight line-clamp-3"
        style={{ color: "rgba(240,237,230,0.2)" }}
      >
        {title}
      </p>
    </div>
  );
}

/* ─────────────────────────────── EmptyState ─────────────────────────────── */

function EmptyState({
  query,
  category,
  onClear,
}: {
  query: string;
  category: string;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <BookOpen className="w-10 h-10 mb-4" style={{ color: "rgba(201,168,76,0.3)" }} />
      <h2 className="font-heading text-xl mb-2" style={{ color: "#F0EDE6" }}>
        Nothing found
      </h2>
      <p className="text-sm mb-6 max-w-xs" style={{ color: "#9A9088" }}>
        {query ? `No books matched "${query}".` : "No books in this category yet."}
        {" "}Try broadening your search.
      </p>
      <button
        onClick={onClear}
        className="flex items-center gap-1.5 text-sm transition-colors duration-200"
        style={{ color: "#C9A84C" }}
      >
        <X className="w-3.5 h-3.5" /> Clear filters
      </button>
    </div>
  );
}
