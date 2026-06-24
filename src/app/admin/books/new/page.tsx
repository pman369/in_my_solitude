"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  BookOpen, 
  Info, 
  Image as ImageIcon, 
  Settings,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useCategories } from "@/hooks/useCategories";
import { FileDropZone } from "@/components/admin/FileDropZone";
import { CoverGenerationHelper } from "@/components/admin/CoverGenerationHelper";
import { TagInput } from "@/components/shared/TagInput";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { logActivity } from "@/lib/admin/activity-logger";

export default function NewBookPage() {
  const router = useRouter();
  const { user } = useUser();
  const supabase = createClient();
  const categories = useCategories();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Files state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Form state
  const [form, setForm] = useState({
    title:             "",
    author:            "",
    category_id:       "",
    tags:              [] as string[],
    language:          "English",
    publish_date:      "",
    description:       "",
    curator_note:      "",
    is_restricted:     false,
    download_enabled:  true,
    is_published:      true,
  });

  function handleCoverSelect(file: File) {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!coverFile || !pdfFile) {
      setError("Both a cover image and a PDF are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      // 1. Insert book record
      // Only include columns that are guaranteed to exist in the schema.
      // Optional/newer columns are spread in only if they're non-empty.
      const insertPayload: Record<string, unknown> = {
        title:         form.title,
        author:        form.author || null,
        category_id:   form.category_id || null,
        description:   form.description || null,
        curator_note:  form.curator_note || null,
        is_restricted: form.is_restricted,
        is_published:  form.is_published,
        tags:          form.tags.length > 0 ? form.tags : null,
        added_date:    new Date().toISOString(),
        views:         0,
        downloads:     0,
      };

      // Add optional columns only — if the DB doesn't have them Supabase will
      // simply ignore undefined values when keys are omitted.
      if (form.language)         insertPayload.language         = form.language;
      if (form.publish_date)     insertPayload.publish_date     = form.publish_date;
      if (user.id) {
        insertPayload.uploaded_by      = user.id;
        insertPayload.last_modified_by = user.id;
        insertPayload.last_modified_at = new Date().toISOString();
      }
      // download_enabled: only include if the column exists
      insertPayload.download_enabled = form.download_enabled;

      const { data: book, error: bookError } = await (supabase
        .from("books") as any)
        .insert(insertPayload)
        .select()
        .single();

      if (bookError) throw bookError;
      if (!book) throw new Error("Failed to create book record.");

      // 2. Upload Cover
      const coverExt = coverFile.name.split('.').pop();
      const coverPath = `covers/${book.id}.${coverExt}`;
      const { error: coverUploadError } = await supabase.storage
        .from("book-covers")
        .upload(coverPath, coverFile);
      
      if (coverUploadError) throw coverUploadError;

      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from("book-covers")
        .getPublicUrl(coverPath);

      // 3. Upload PDF
      const pdfBucket = form.is_restricted ? "vault-files" : "book-files";
      const pdfPath = `${book.id}.pdf`;
      const { error: pdfUploadError } = await supabase.storage
        .from(pdfBucket)
        .upload(pdfPath, pdfFile);

      if (pdfUploadError) throw pdfUploadError;

      // 4. Update book with URLs and file size
      const { error: updateError } = await (supabase
        .from("books") as any)
        .update({
          cover_url: coverUrl,
          file_url:  `${pdfBucket}/${pdfPath}`,
          file_size_bytes: pdfFile.size
        })
        .eq("id", book.id);

      if (updateError) throw updateError;

      // 5. Log activity (best-effort — don't let a log failure block the upload)
      try {
        await logActivity({
          action:      "book_uploaded",
          targetType:  "book",
          targetId:    book.id,
          details:     { title: form.title, author: form.author }
        });
      } catch {
        // Activity log failure is non-fatal
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */

      router.push(`/admin/books?uploaded=true`);
      
    } catch (err: unknown) {
      console.error("Upload error:", err);
      // Supabase returns PostgrestError (not a standard Error).
      // Extract message from whichever shape is present.
      const msg =
        (err as { message?: string })?.message ||
        (err as { error_description?: string })?.error_description ||
        (err as { details?: string })?.details ||
        JSON.stringify(err);
      setError(msg || "An unexpected error occurred. Check the console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-6 border-b border-[#2A2A2A] pb-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-[#2A2A2A] flex items-center justify-center text-[#9A9088] hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-4xl text-[#F0EDE6]">New Archive <span className="text-[#C9A84C]">Entry</span></h1>
            <p className="text-[#9A9088] text-sm mt-1 uppercase tracking-widest font-medium">Add a new volume to the digital stacks</p>
          </div>
        </div>
        
        <div className="hidden md:block">
           <div className="px-4 py-2 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
             <ShieldAlert className="w-4 h-4" /> Curator Mode
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* ── Main Column ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION A: Identity */}
          <div className="p-8 rounded-2xl border border-[#2A2A2A] bg-[#141414]/50 backdrop-blur-sm space-y-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-[#C9A84C]" />
              <h3 className="font-heading text-xl text-[#F0EDE6]">Identity</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Book Title *</label>
                <input
                  id="title"
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm focus:border-[#C9A84C]/40 outline-none transition-all"
                  placeholder="e.g. The Kybalion"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="author" className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Author *</label>
                <input
                  id="author"
                  type="text"
                  required
                  value={form.author}
                  onChange={e => setForm({ ...form, author: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm focus:border-[#C9A84C]/40 outline-none transition-all"
                  placeholder="e.g. Three Initiates"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Category *</label>
                <select
                  id="category"
                  required
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm focus:border-[#C9A84C]/40 outline-none transition-all cursor-pointer"
                >
                  <option value="">Select a Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="language" className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Language</label>
                <select
                  id="language"
                  value={form.language}
                  onChange={e => setForm({ ...form, language: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm focus:border-[#C9A84C]/40 outline-none transition-all cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Ancient Greek">Ancient Greek</option>
                  <option value="Latin">Latin</option>
                  <option value="German">German</option>
                  <option value="French">French</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Sanskrit">Sanskrit</option>
                  <option value="Arabic">Arabic</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="tags" className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Tags</label>
              <TagInput
                id="tags"
                tags={form.tags}
                onChange={tags => setForm({ ...form, tags })}
              />
            </div>
          </div>

          {/* SECTION B: Content */}
          <div className="p-8 rounded-2xl border border-[#2A2A2A] bg-[#141414]/50 backdrop-blur-sm space-y-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-[#C9A84C]" />
              <h3 className="font-heading text-xl text-[#F0EDE6]">Content</h3>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Description *</label>
              <textarea
                id="description"
                required
                rows={4}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm focus:border-[#C9A84C]/40 outline-none transition-all resize-none"
                placeholder="A brief overview of the book's themes and value..."
              />
              <p className="text-[10px] text-[#2A2A2A] font-medium uppercase tracking-widest">Shown on book cards and search results</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="curator_note" className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Curator&apos;s Note</label>
              <textarea
                id="curator_note"
                rows={3}
                value={form.curator_note}
                onChange={e => setForm({ ...form, curator_note: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm focus:border-[#C9A84C]/40 outline-none transition-all italic"
                placeholder="Your personal annotation or reflection on this volume..."
              />
            </div>
          </div>
        </div>

        {/* ── Sidebar Column ──────────────────────────────── */}
        <div className="space-y-8">
          
          {/* SECTION C: Files */}
          <div className="p-8 rounded-2xl border border-[#2A2A2A] bg-[#141414]/50 backdrop-blur-sm space-y-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-[#C9A84C]" />
              <h3 className="font-heading text-xl text-[#F0EDE6]">Files</h3>
            </div>
            
            <div className="space-y-4">
              <label htmlFor="file-Cover Image" className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Cover Image *</label>
              <FileDropZone
                accept="image/*"
                maxSizeMB={5}
                onFileSelect={handleCoverSelect}
                label="Cover Image"
                preview={coverPreview}
              />
            </div>

            <div className="space-y-4">
              <label htmlFor="file-Book PDF" className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Book PDF *</label>
              <FileDropZone
                accept="application/pdf"
                maxSizeMB={100}
                onFileSelect={setPdfFile}
                label="Book PDF"
                fileName={pdfFile?.name}
              />
            </div>
          </div>

          {/* SECTION D: Settings */}
          <div className="p-8 rounded-2xl border border-[#2A2A2A] bg-[#141414]/50 backdrop-blur-sm space-y-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-[#C9A84C]" />
              <h3 className="font-heading text-xl text-[#F0EDE6]">Settings</h3>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-[#F0EDE6] font-medium">Archive Section</p>
                   <p className="text-[10px] text-[#9A9088] uppercase tracking-widest">Where should it reside?</p>
                 </div>
                 <div className="flex p-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg">
                    <button 
                      type="button"
                      onClick={() => setForm({ ...form, is_restricted: false })}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${!form.is_restricted ? 'bg-[#C9A84C] text-[#0D0D0D]' : 'text-[#9A9088]'}`}
                    >
                      Stacks
                    </button>
                    <button 
                      type="button"
                      onClick={() => setForm({ ...form, is_restricted: true })}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${form.is_restricted ? 'bg-[#991B1B] text-white' : 'text-[#9A9088]'}`}
                    >
                      Vault
                    </button>
                 </div>
               </div>

               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-[#F0EDE6] font-medium">Allow Downloads</p>
                   <p className="text-[10px] text-[#9A9088] uppercase tracking-widest">Can readers keep it?</p>
                 </div>
                 <ToggleSwitch enabled={form.download_enabled} onChange={v => setForm({ ...form, download_enabled: v })} />
               </div>

               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-[#F0EDE6] font-medium">Visibility</p>
                   <p className="text-[10px] text-[#9A9088] uppercase tracking-widest">Is it ready for eyes?</p>
                 </div>
                 <ToggleSwitch enabled={form.is_published} onChange={v => setForm({ ...form, is_published: v })} />
               </div>
            </div>
          </div>

          <CoverGenerationHelper />

          {/* Form Error */}
          {error && <ErrorAlert message={error} />}

          <div className="pt-4 space-y-4">
             <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-sm transition-all bg-[#C9A84C] text-[#0D0D0D] hover:shadow-[0_0_40px_rgba(201,168,76,0.3)] disabled:opacity-50"
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {loading ? "Transmitting..." : "Publish to Library"}
             </button>
             <button
                type="button"
                onClick={() => router.back()}
                className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088] hover:text-[#F0EDE6] transition-colors"
             >
                Cancel and Return
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}
