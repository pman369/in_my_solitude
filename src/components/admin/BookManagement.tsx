/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Lock,
  FileDown,
  BookOpen,
  Eye,
  EyeOff,
  ExternalLink
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/admin/activity-logger";
import Image from "next/image";
import Link from "next/link";
import type { Database } from "@/types/database";

type Book = Database["public"]["Tables"]["books"]["Row"] & {
  category?: { name: string };
};

export default function BookManagement() {
  const supabase = createClient();
  
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    const { data } = await (supabase.from("categories") as any).select("id, name").order("name"); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (data) setCategories(data);
  }, [supabase]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const query = (supabase
      .from("books") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .select(`
        *,
        category:categories(name)
      `)
      .order("added_date", { ascending: false });

    const { data, error } = await query;
    if (error) console.error("Error fetching books:", error);
    else setBooks(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, [fetchCategories, fetchBooks]);

  async function togglePublished(id: string, current: boolean) {
    const { error } = await (supabase
      .from("books") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .update({ is_published: !current })
      .eq("id", id);
    
    if (!error) {
      setBooks(books.map(b => b.id === id ? { ...b, is_published: !current } : b));
      await logActivity({
        action: !current ? "book_publish" : "book_hide",
        targetId: id,
        targetType: "book",
        details: { title: books.find(b => b.id === id)?.title }
      });
    }
  }

  async function deleteBook(id: string) {
    if (!confirm("Are you sure you want to delete this tome? This action is permanent and will remove the entry from the ledger.")) return;
    
    setDeletingId(id);
    const { error } = await (supabase
      .from("books") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .delete()
      .eq("id", id);

    if (!error) {
      const book = books.find(b => b.id === id);
      setBooks(books.filter(b => b.id !== id));
      await logActivity({
        action: "book_delete",
        targetId: id,
        targetType: "book",
        details: { title: book?.title }
      });
    } else {
      alert("Error deleting book: " + error.message);
    }
    setDeletingId(null);
  }

  function handleExport() {
    const headers = ["Title", "Author", "Category", "Status", "Restricted", "Added Date", "Views", "Downloads"];
    const csvContent = [
      headers.join(","),
      ...books.map(b => [
        `"${b.title.replace(/"/g, '""')}"`,
        `"${(b.author || "Unknown").replace(/"/g, '""')}"`,
        `"${(b.category?.name || "Uncategorized").replace(/"/g, '""')}"`,
        b.is_published ? "Published" : "Hidden",
        b.is_restricted ? "Yes" : "No",
        new Date(b.added_date || "").toLocaleDateString(),
        b.views,
        b.downloads
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `solitude_archive_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (book.author?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || book.category_id === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "published" && book.is_published) ||
                         (statusFilter === "draft" && !book.is_published) ||
                         (statusFilter === "restricted" && book.is_restricted);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-heading text-3xl text-[#F0EDE6]">Archive <span className="text-[#C9A84C]">Management</span></h2>
          <p className="text-[#9A9088] text-sm mt-1">Review, edit, and organize the digital stacks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="px-4 py-2.5 rounded-lg border border-[#2A2A2A] bg-[#141414] text-[#9A9088] hover:text-[#C9A84C] transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
          <Link 
            href="/curator/books/upload"
            className="px-6 py-2.5 rounded-lg bg-[#C9A84C] text-[#0D0D0D] font-bold text-xs uppercase tracking-widest hover:bg-[#D4B86A] transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> New Entry
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border border-[#2A2A2A] bg-[#141414]">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9088]" />
          <input 
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2 text-sm text-[#F0EDE6] focus:border-[#C9A84C]/40 outline-none transition-colors"
          />
        </div>
        <div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm text-[#F0EDE6] focus:border-[#C9A84C]/40 outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm text-[#F0EDE6] focus:border-[#C9A84C]/40 outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Hidden / Draft</option>
            <option value="restricted">Restricted (Vault)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-[#1A1A1A]">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Book</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Added</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Stats</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-[#9A9088]">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#C9A84C]" />
                      Searching the stacks...
                    </td>
                  </tr>
                ) : filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-[#9A9088]">
                      No results found matching your current parameters.
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map((book) => (
                    <motion.tr 
                      key={book.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-[#1A1A1A]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-[#0D0D0D] border border-[#2A2A2A]">
                            {book.cover_url ? (
                              <Image 
                                src={book.cover_url} 
                                alt={book.title} 
                                fill 
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-[#2A2A2A]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#F0EDE6] line-clamp-1">{book.title}</div>
                            <div className="text-xs text-[#9A9088]">{book.author || "Unknown Author"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#9A9088]">{book.category?.name || "Uncategorized"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${book.is_published ? 'text-green-500' : 'text-amber-500'}`}>
                            {book.is_published ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {book.is_published ? 'Published' : 'Hidden'}
                          </div>
                          {book.is_restricted && (
                            <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-[#F87171]">
                              <Lock className="w-3 h-3" /> Restricted
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-[#9A9088]">
                          {new Date(book.added_date || "").toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-[10px] uppercase tracking-wider text-[#9A9088]">
                          <span>{book.views} Views</span>
                          <span>{book.downloads} Downloads</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => togglePublished(book.id, book.is_published)}
                            className={`p-2 rounded hover:bg-[#2A2A2A] transition-colors ${book.is_published ? 'text-green-500' : 'text-amber-500'}`}
                            title={book.is_published ? "Hide from public" : "Publish to archival"}
                          >
                            {book.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <Link 
                            href={`/admin/books/edit/${book.id}`}
                            className="p-2 rounded hover:bg-[#2A2A2A] text-[#C9A84C] transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => deleteBook(book.id)}
                            disabled={deletingId === book.id}
                            className="p-2 rounded hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-50"
                            title="Delete permanently"
                          >
                            {deletingId === book.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                          <Link 
                            href={`/book/${book.id}`}
                            target="_blank"
                            className="p-2 rounded hover:bg-[#2A2A2A] text-[#9A9088] transition-colors"
                            title="View on site"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-[#2A2A2A] bg-[#1A1A1A]/30 flex items-center justify-between">
          <span className="text-xs text-[#9A9088]">Showing {filteredBooks.length} of {books.length} entries</span>
          <div className="flex gap-2">
             <button disabled className="px-3 py-1.5 rounded border border-[#2A2A2A] text-xs text-[#9A9088] disabled:opacity-30">Previous</button>
             <button disabled className="px-3 py-1.5 rounded border border-[#2A2A2A] text-xs text-[#9A9088] disabled:opacity-30">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
