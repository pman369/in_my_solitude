"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  FileText, 
  Image as ImageIcon, 
  Check, 
  X, 
  Loader2, 
  Plus, 
  ShieldAlert, 
  ArrowLeft,
  Tag,
  Info
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import Link from "next/link";
import Image from "next/image";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function UploadContent() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useUser();
  const supabase = createClient();

  // Form State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [curatorNote, setCuratorNote] = useState("");
  const [isRestricted, setIsRestricted] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // File State
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // UI State
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch categories
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data as Category[]);
      });
  }, [supabase]);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/library");
    }
  }, [authLoading, isAdmin, router]);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
      <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
    </div>
  );

  if (!isAdmin) return null;

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBookFile(file);
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter(tag => tag !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !bookFile || !coverFile) {
      setError("Please fill all required fields and upload both a cover and the book file.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // 1. Upload Cover
      // Convention: Use 'book-files' for covers
      const coverExt = coverFile.name.split(".").pop();
      const coverFolder = "covers";
      const coverFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${coverExt}`;
      const { error: coverError } = await supabase.storage
        .from("book-files")
        .upload(`${coverFolder}/${coverFileName}`, coverFile);
      if (coverError) throw coverError;
      
      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from("book-files")
        .getPublicUrl(`${coverFolder}/${coverFileName}`);

      // 2. Upload Book File
      const bookExt = bookFile.name.split(".").pop();
      const bucketName = isRestricted ? "vault-files" : "book-files";
      const bookFolder = isRestricted ? "vault" : "books";
      const bookFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${bookExt}`;
      
      const { error: bookError } = await supabase.storage
        .from(bucketName)
        .upload(`${bookFolder}/${bookFileName}`, bookFile);
      if (bookError) throw bookError;

      // Convention: file_url stored as "bucket/path/to/file.pdf"
      const fileUrl = `${bucketName}/${bookFolder}/${bookFileName}`;

      // 3. Create DB Entry
      const { error: dbError } = await supabase
        .from("books")
        // @ts-expect-error - Ignore never type inference
        .insert({
          title,
          author: author || null,
          category_id: categoryId,
          description: description || null,
          curator_note: curatorNote || null,
          cover_url: coverUrl,
          file_url: fileUrl,
          is_restricted: isRestricted,
          is_published: true,
          tags: tags.length > 0 ? tags : null,
          added_date: new Date().toISOString(),
          views: 0,
          downloads: 0
        });

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => router.push("/library"), 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during upload.";
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 bg-[#0D0D0D]">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(201,168,76,0.03)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(201,168,76,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <Link 
                href="/library" 
                className="inline-flex items-center gap-2 text-sm text-[#9A9088] hover:text-[#C9A84C] transition-colors mb-4 group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Return to Library
              </Link>
              <h1 className="font-heading text-4xl text-[#F0EDE6] tracking-tight">
                Curator&apos;s <span className="text-[#C9A84C]">Desk</span>
              </h1>
              <p className="text-[#9A9088] mt-2">Forge a new entry in the digital archive.</p>
            </div>
            <div className="hidden sm:block">
              <div 
                className="px-4 py-2 rounded-full border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.05)] flex items-center gap-2"
                style={{ backdropFilter: "blur(8px)" }}
              >
                <ShieldAlert className="w-4 h-4 text-[#C9A84C]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">Curator Access</span>
              </div>
            </div>
          </div>

          {success ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-12 text-center rounded-2xl border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.05)]"
            >
              <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.1)] flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-heading text-[#F0EDE6] mb-2">Entry Recorded</h2>
              <p className="text-[#9A9088]">The tome has been successfully added to the archive.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Cover Upload */}
                <div className="space-y-6">
                  <div className="group relative aspect-[3/4] rounded-xl border-2 border-dashed border-[#2A2A2A] hover:border-[#C9A84C]/50 transition-all duration-300 overflow-hidden bg-[#141414]">
                    <input 
                      type="file" 
                      ref={coverInputRef}
                      onChange={handleCoverChange}
                      accept="image/*"
                      className="hidden"
                    />
                    {coverPreview ? (
                      <>
                        <Image 
                          src={coverPreview} 
                          alt="Preview" 
                          fill 
                          className="object-cover"
                        />
                        <button 
                          type="button"
                          onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center gap-4 text-[#9A9088] hover:text-[#C9A84C] transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium">Upload Cover</span>
                        <span className="text-[10px] uppercase tracking-widest opacity-50">JPG, PNG up to 5MB</span>
                      </button>
                    )}
                  </div>

                  <div className="p-5 rounded-xl border border-[#2A2A2A] bg-[#141414]">
                    <div className="flex items-center gap-3 mb-4 text-[#C9A84C]">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-widest">Book File</span>
                    </div>
                    {bookFile ? (
                      <div className="flex items-center justify-between p-3 rounded bg-[#0D0D0D] border border-[#2A2A2A]">
                        <span className="text-xs text-[#F0EDE6] truncate max-w-[150px]">{bookFile.name}</span>
                        <button onClick={() => setBookFile(null)} className="text-[#9A9088] hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => bookInputRef.current?.click()}
                        className="w-full py-3 rounded border border-[#2A2A2A] border-dashed hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/5 transition-all text-xs text-[#9A9088]"
                      >
                        Select PDF or EPUB
                      </button>
                    )}
                    <input 
                      type="file" 
                      ref={bookInputRef}
                      onChange={handleBookFileChange}
                      accept=".pdf,.epub"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Right Column: Details */}
                <div className="md:col-span-2 space-y-6">
                  {/* Basic Info */}
                  <div className="p-8 rounded-2xl border border-[#2A2A2A] bg-[#141414] space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-[#9A9088]">Title *</label>
                        <input 
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="The Hermetic Principle"
                          className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-[#F0EDE6] outline-none focus:border-[#C9A84C]/50 transition-colors"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-[#9A9088]">Author</label>
                        <input 
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="M. P. Hall"
                          className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-[#F0EDE6] outline-none focus:border-[#C9A84C]/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-[#9A9088]">Category *</label>
                      <select 
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-[#F0EDE6] outline-none focus:border-[#C9A84C]/50 transition-colors appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Select a category...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-[#9A9088]">Description</label>
                      <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Provide a brief summary of the text's contents and significance..."
                        className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-[#F0EDE6] outline-none focus:border-[#C9A84C]/50 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="p-8 rounded-2xl border border-[#2A2A2A] bg-[#141414] space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-[#C9A84C]" />
                            <span className="text-sm font-medium text-[#F0EDE6]">Restricted Access (Vault)</span>
                          </div>
                          <p className="text-xs text-[#9A9088]">Require curator approval for seekers to access this text.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setIsRestricted(!isRestricted)}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isRestricted ? 'bg-[#C9A84C]' : 'bg-[#2A2A2A]'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-[#0D0D0D] transition-transform duration-300 ${isRestricted ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-[#9A9088]">Curator&apos;s Note</label>
                      <textarea 
                        value={curatorNote}
                        onChange={(e) => setCuratorNote(e.target.value)}
                        rows={3}
                        placeholder="A personal observation or guidance for the seeker..."
                        className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-[#F0EDE6] outline-none focus:border-[#C9A84C]/50 transition-colors resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-widest text-[#9A9088]">Tags</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map(t => (
                          <span 
                            key={t} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[10px] text-[#9A9088]"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {t}
                            <button onClick={() => removeTag(t)} className="hover:text-red-400">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input 
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={addTag}
                        placeholder="Press Enter to add tags..."
                        className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-[#F0EDE6] outline-none focus:border-[#C9A84C]/50 transition-colors"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3"
                    >
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <button 
                    type="submit"
                    disabled={uploading}
                    className="w-full py-4 rounded-xl bg-[#C9A84C] hover:bg-[#D4B86A] text-[#0D0D0D] font-bold tracking-widest uppercase text-xs transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Recording entry...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                          Commit to Archive
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
