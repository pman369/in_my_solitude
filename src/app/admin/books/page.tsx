"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Library, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/admin/activity-logger";
import { useUser } from "@/hooks/useUser";

type Book = {
  id: string;
  title: string;
  author: string | null;
  category_id: string | null;
  is_published: boolean | null;
  is_restricted: boolean | null;
  download_enabled: boolean | null;
  added_date: string | null;
  views: number | null;
  downloads: number | null;
  categories?: { name: string } | null;
};

export default function BookManagementPage() {
  const supabase = createClient();
  const { user, isAdmin } = useUser();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all"); // all, published, draft, vault, stacks
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("books")
        .select(`
          *,
          categories(name)
        `, { count: "exact" });

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      if (category !== "all") {
        query = query.eq("category_id", category);
      }

      if (status === "published") query = query.eq("is_published", true);
      if (status === "draft") query = query.eq("is_published", false);
      if (status === "vault") query = query.eq("is_restricted", true);
      if (status === "stacks") query = query.eq("is_restricted", false);

      const { data, count, error } = await query
        .order("added_date", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      setBooks((data as unknown as Book[]) || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, search, category, status, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      if (data) setCategories(data);
    }
    fetchCategories();
  }, [supabase]);

  async function togglePublish(bookId: string, currentState: boolean | null) {
    if (!user) return;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { error } = await (supabase
      .from("books") as any)
      .update({ is_published: !currentState, last_modified_by: user.id })
      .eq("id", bookId);

    if (!error) {
      setBooks(books.map(b => b.id === bookId ? { ...b, is_published: !currentState } : b));
      // Log activity
      await logActivity({
        action: currentState ? "book_unpublished" : "book_published",
        targetType: "book",
        targetId: bookId
      });
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  async function toggleDownload(bookId: string, currentState: boolean | null) {
    if (!user) return;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { error } = await (supabase
      .from("books") as any)
      .update({ download_enabled: !currentState, last_modified_by: user.id })
      .eq("id", bookId);

    if (!error) {
      setBooks(books.map(b => b.id === bookId ? { ...b, download_enabled: !currentState } : b));
      // Log activity
      await logActivity({
        action: currentState ? "download_disabled" : "download_enabled",
        targetType: "book",
        targetId: bookId
      });
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  async function deleteBook(bookId: string) {
    if (!user || !isAdmin) {
      alert("Only primary admins can delete volumes.");
      return;
    }

    if (confirm("Are you sure you want to permanently remove this volume from the archive? This cannot be undone.")) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const { error } = await (supabase.from("books") as any).delete().eq("id", bookId);
      if (!error) {
        setBooks(books.filter(b => b.id !== bookId));
        await logActivity({
          action: "book_deleted",
          targetType: "book",
          targetId: bookId
        });
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#2A2A2A] pb-8">
        <div>
          <h1 className="font-heading text-4xl text-[#F0EDE6]">Archive <span className="text-[#C9A84C]">Stacks</span></h1>
          <p className="text-[#9A9088] text-sm mt-1 uppercase tracking-widest font-medium">Manage the collective knowledge of the library</p>
        </div>
        <Link 
          href="/admin/books/new"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C9A84C] text-[#0D0D0D] font-bold text-sm uppercase tracking-widest hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-all"
        >
          <Plus className="w-4 h-4" /> New Archive Entry
        </Link>
      </div>

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9088]" />
          <input 
            type="text" 
            placeholder="Search by title, author, or keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-[#C9A84C]/40 outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9A9088]" />
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-9 pr-8 py-2.5 text-xs text-[#9A9088] focus:border-[#C9A84C]/40 outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 lg:flex-none lg:min-w-[140px]">
            <select 
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-xs text-[#9A9088] focus:border-[#C9A84C]/40 outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="stacks">Open Stacks</option>
              <option value="vault">The Vault</option>
            </select>
          </div>

          <button 
            onClick={() => { setSearch(""); setCategory("all"); setStatus("all"); setPage(1); }}
            className="px-4 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-[#C9A84C] transition-colors text-xs font-bold uppercase tracking-widest"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Volume</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Section</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Visibility</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Stats</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-[#9A9088]">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#C9A84C]" />
                    Searching the shelves...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-[#9A9088]">
                    <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mx-auto mb-4">
                      <Library className="w-6 h-6 opacity-20" />
                    </div>
                    No volumes found in this section of the archive.
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="hover:bg-[#1A1A1A]/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#F0EDE6] group-hover:text-[#C9A84C] transition-colors line-clamp-1">{book.title}</span>
                        <span className="text-[10px] text-[#9A9088] mt-0.5">{book.author || "Unknown Author"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088] px-2 py-1 rounded bg-[#0D0D0D] border border-[#2A2A2A]">
                        {book.categories?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {book.is_restricted ? (
                        <div className="flex items-center gap-1.5 text-red-400">
                          <Lock className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">The Vault</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[#C9A84C]">
                          <Library className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Stacks</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => togglePublish(book.id, book.is_published)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                          book.is_published 
                            ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                            : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#9A9088]'
                        }`}
                      >
                        {book.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {book.is_published ? 'Published' : 'Draft'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-[10px] font-medium text-[#9A9088]">
                         <div className="flex items-center gap-1">
                           <Eye className="w-3 h-3 opacity-50" /> {book.views}
                         </div>
                         <div className="flex items-center gap-1">
                           <Download className="w-3 h-3 opacity-50" /> {book.downloads}
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleDownload(book.id, book.download_enabled)}
                          className={`p-2 rounded-lg border transition-colors ${
                            book.download_enabled ? 'border-[#2A2A2A] text-[#9A9088] hover:text-[#C9A84C]' : 'border-red-500/20 text-red-500 bg-red-500/5'
                          }`}
                          title={book.download_enabled ? "Disable Downloads" : "Enable Downloads"}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <Link 
                          href={`/admin/books/${book.id}`}
                          className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-[#C9A84C] transition-colors"
                          title="Edit Volume"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        {isAdmin && (
                          <button 
                            onClick={() => deleteBook(book.id)}
                            className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-red-500 hover:border-red-500/40 transition-colors"
                            title="Delete Volume"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────── */}
        <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#2A2A2A] flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-[#9A9088] font-bold">
            Showing <span className="text-[#F0EDE6]">{books.length}</span> of <span className="text-[#F0EDE6]">{totalCount}</span> volumes
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] disabled:opacity-20 hover:text-[#C9A84C] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold text-[#C9A84C] px-2">{page}</span>
            <button 
              disabled={page * pageSize >= totalCount}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] disabled:opacity-20 hover:text-[#C9A84C] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
