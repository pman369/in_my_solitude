"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Check, CheckCheck, Clock, X, StickyNote, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useReadingList } from "@/hooks/useReadingList";
import type { Database } from "@/types/database";

type Book            = Database["public"]["Tables"]["books"]["Row"];
type ReadingListEntry = Database["public"]["Tables"]["reading_list"]["Row"];
type BookNote        = Database["public"]["Tables"]["book_notes"]["Row"];

interface EntryWithBook extends ReadingListEntry {
  books: Pick<Book, "id" | "title" | "author" | "cover_url"> | null;
}

const STATUS_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  want_to_read: { label: "Want to read",  icon: Clock,     color: "#C9A84C"        },
  reading:      { label: "Reading now",   icon: BookOpen,  color: "#7C3AED"        },
  finished:     { label: "Finished",      icon: CheckCheck, color: "#065F46"       },
};

interface Props { userId: string }

export default function MyShelfTab({ userId }: Props) {
  const supabase = useRef(createClient()).current;
  const { entries, fetching, toggle, setStatus } = useReadingList();
  const [entriesWithBooks, setEntriesWithBooks] = useState<EntryWithBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [filter, setFilter] = useState<"all" | "want_to_read" | "reading" | "finished">("all");
  const [openNotes, setOpenNotes] = useState<string | null>(null); // book_id

  // Fetch the joined book data for all entries
  useEffect(() => {
    if (!entries.length) { setEntriesWithBooks([]); return; }
    setLoadingBooks(true);
    const bookIds = entries.map(e => e.book_id);
    supabase
      .from("books")
      .select("id, title, author, cover_url")
      .in("id", bookIds)
      .then(({ data: books }) => {
        const bookMap = Object.fromEntries((books ?? []).map(b => [b.id, b]));
        setEntriesWithBooks(
          entries.map(e => ({ ...e, books: bookMap[e.book_id] ?? null } as EntryWithBook))
        );
        setLoadingBooks(false);
      });
  }, [entries, supabase]);

  const filtered = filter === "all"
    ? entriesWithBooks
    : entriesWithBooks.filter(e => e.status === filter);

  if (fetching || loadingBooks) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#C9A84C" }} />
      </div>
    );
  }

  if (!entries.length) {
    return (
      <EmptyShelf />
    );
  }

  return (
    <div>
      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(["all", "want_to_read", "reading", "finished"] as const).map((s) => {
          const meta = s === "all" ? { label: "All", color: "#9A9088" } : STATUS_LABELS[s];
          const count = s === "all" ? entries.length : entries.filter(e => e.status === s).length;
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
              style={{
                background: active ? "rgba(201,168,76,0.12)" : "#141414",
                border: `1px solid ${active ? "rgba(201,168,76,0.4)" : "#2A2A2A"}`,
                color: active ? "#C9A84C" : "#9A9088",
              }}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Book list */}
      <div className="space-y-3">
        {filtered.map((entry) => (
          <ShelfEntry
            key={entry.id}
            entry={entry}
            userId={userId}
            onStatusChange={(status) => setStatus(status as "want_to_read" | "reading" | "finished")}
            onRemove={() => toggle()}
            onToggleNotes={() => setOpenNotes(openNotes === entry.book_id ? null : entry.book_id)}
            notesOpen={openNotes === entry.book_id}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm py-12" style={{ color: "#9A9088" }}>
          No books with this status yet.
        </p>
      )}
    </div>
  );
}

/* ── ShelfEntry ──────────────────────────────────────────────────────────── */

function ShelfEntry({
  entry, userId, onStatusChange, onRemove, onToggleNotes, notesOpen
}: {
  entry: EntryWithBook;
  userId: string;
  onStatusChange: (s: string) => void;
  onRemove: () => void;
  onToggleNotes: () => void;
  notesOpen: boolean;
}) {
  const supabase = useRef(createClient()).current;
  const book = entry.books;
  const meta = STATUS_LABELS[entry.status] ?? STATUS_LABELS.want_to_read;
  const StatusIcon = meta.icon;

  return (
    <div
      className="rounded border transition-all duration-200"
      style={{ background: "#141414", borderColor: "#2A2A2A" }}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Cover thumb */}
        <Link href={`/book/${entry.book_id}`} className="flex-shrink-0">
          <div
            className="rounded overflow-hidden"
            style={{ width: 40, aspectRatio: "2/3", background: "#0D0D0D", border: "1px solid #2A2A2A" }}
          >
            {book?.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs" style={{ color: "rgba(201,168,76,0.3)" }}>
                  {book?.title?.[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <Link href={`/book/${entry.book_id}`}>
            <h3 className="text-sm font-semibold leading-snug line-clamp-1 transition-colors duration-200 hover:text-[#C9A84C]" style={{ color: "#F0EDE6" }}>
              {book?.title ?? "Unknown title"}
            </h3>
          </Link>
          {book?.author && (
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#9A9088" }}>{book.author}</p>
          )}

          {/* Status picker */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {Object.entries(STATUS_LABELS).map(([s, m]) => {
              const Icon = m.icon;
              const active = entry.status === s;
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all duration-200"
                  style={{
                    background: active ? `${m.color}20` : "transparent",
                    border: `1px solid ${active ? `${m.color}60` : "#2A2A2A"}`,
                    color: active ? m.color : "#9A9088",
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleNotes}
            title="Book notes"
            className="p-1.5 rounded transition-all duration-200"
            style={{ color: notesOpen ? "#C9A84C" : "#9A9088", background: notesOpen ? "rgba(201,168,76,0.1)" : "transparent" }}
          >
            <StickyNote className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            title="Remove from shelf"
            className="p-1.5 rounded transition-all duration-200 hover:text-red-400"
            style={{ color: "#9A9088" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes drawer */}
      {notesOpen && (
        <NotesDrawer userId={userId} bookId={entry.book_id} bookTitle={book?.title ?? ""} />
      )}
    </div>
  );
}

/* ── NotesDrawer ─────────────────────────────────────────────────────────── */

function NotesDrawer({ userId, bookId, bookTitle }: { userId: string; bookId: string; bookTitle: string }) {
  const supabase = useRef(createClient()).current;
  const [notes,   setNotes]   = useState<BookNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [text,    setText]    = useState("");
  const [pageRef, setPageRef] = useState("");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    supabase
      .from("book_notes")
      .select("*")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setNotes((data as BookNote[]) ?? []); setLoading(false); });
  }, [supabase, userId, bookId]);

  async function addNote() {
    if (!text.trim()) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("book_notes") as any).insert({
      user_id: userId,
      book_id: bookId,
      note: text.trim(),
      page_ref: pageRef ? parseInt(pageRef, 10) : null,
      is_private: true,
    }).select("*").single();
    if (data) setNotes(prev => [data as BookNote, ...prev]);
    setText("");
    setPageRef("");
    setSaving(false);
  }

  async function deleteNote(id: string) {
    await supabase.from("book_notes").delete().eq("id", id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  return (
    <div
      className="px-4 pb-4 pt-0"
      style={{ borderTop: "1px solid #2A2A2A" }}
    >
      <p className="text-xs uppercase tracking-widest py-3 mb-3" style={{ color: "rgba(201,168,76,0.5)" }}>
        Notes for {bookTitle}
      </p>

      {/* Add note */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 flex gap-2">
          <input
            type="number"
            min={1}
            value={pageRef}
            onChange={(e) => setPageRef(e.target.value)}
            placeholder="p."
            className="w-14 px-2 py-1.5 rounded text-xs outline-none"
            style={{ background: "#0D0D0D", border: "1px solid #2A2A2A", color: "#F0EDE6" }}
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) addNote(); }}
            placeholder="Add a note…"
            className="flex-1 px-3 py-1.5 rounded text-xs outline-none"
            style={{ background: "#0D0D0D", border: "1px solid #2A2A2A", color: "#F0EDE6" }}
          />
        </div>
        <button
          onClick={addNote}
          disabled={!text.trim() || saving}
          className="p-1.5 rounded transition-all duration-200 disabled:opacity-40"
          style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Notes list */}
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#9A9088" }} />
      ) : notes.length === 0 ? (
        <p className="text-xs italic" style={{ color: "rgba(154,144,136,0.5)" }}>No notes yet. Add your first annotation above.</p>
      ) : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="flex items-start gap-2 group">
              {n.page_ref && (
                <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: "rgba(201,168,76,0.5)" }}>p.{n.page_ref}</span>
              )}
              <p className="flex-1 text-xs leading-relaxed" style={{ color: "#9A9088" }}>{n.note}</p>
              <button
                onClick={() => deleteNote(n.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                style={{ color: "rgba(154,144,136,0.5)" }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyShelf() {
  return (
    <div className="text-center py-20">
      <BookOpen className="w-10 h-10 mx-auto mb-4" style={{ color: "rgba(201,168,76,0.2)" }} />
      <h2 className="font-heading text-xl mb-2" style={{ color: "#F0EDE6" }}>Your shelf is empty</h2>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: "#9A9088" }}>
        Visit the library and save books to start building your personal shelf.
      </p>
      <Link
        href="/library"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold transition-all duration-200"
        style={{ background: "#C9A84C", color: "#0D0D0D" }}
      >
        <BookOpen className="w-4 h-4" /> Browse the Library
      </Link>
    </div>
  );
}
