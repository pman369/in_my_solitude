"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  BookOpen, 
  Info, 
  Image as ImageIcon, 
  Settings,
  Loader2,
  AlertCircle,
  ShieldAlert,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { FileDropZone } from "@/components/admin/FileDropZone";

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const { user } = useUser();
  const supabase = createClient();

  // State
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    cover_url:         "",
    file_url:          ""
  });

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      try {
        const { data: catData } = await supabase.from("categories").select("id, name").order("name");
        if (catData) setCategories(catData);

        const { data: bookData, error: bookError } = await supabase
          .from("books")
          .select("*")
          .eq("id", id)
          .single();

        if (bookError) throw bookError;
        if (bookData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const b = bookData as any;
          setForm({
            title:             b.title || "",
            author:            b.author || "",
            category_id:       b.category_id || "",
            tags:              b.tags || [],
            language:          b.language || "English",
            publish_date:      b.publish_date || "",
            description:       b.description || "",
            curator_note:      b.curator_note || "",
            is_restricted:     b.is_restricted ?? false,
            download_enabled:  b.download_enabled ?? true,
            is_published:      b.is_published ?? true,
            cover_url:         b.cover_url || "",
            file_url:          b.file_url || ""
          });
          if (b.cover_url) setCoverPreview(b.cover_url);
        }
      } catch (err) {
        console.error("Error fetching book:", err);
        setError("Failed to load volume details.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase, id]);

  function handleCoverSelect(file: File) {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      let coverUrl = form.cover_url;
      let pdfPath = form.file_url;
      let fileSizeBytes = 0;

      // 1. Upload new cover if selected
      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop();
        const coverPath = `covers/${id}.${coverExt}`;
        const { error: coverUploadError } = await supabase.storage
          .from("book-covers")
          .upload(coverPath, coverFile, { upsert: true });
        
        if (coverUploadError) throw coverUploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("book-covers")
          .getPublicUrl(coverPath);
        coverUrl = publicUrl;
      }

      // 2. Upload new PDF if selected
      if (pdfFile) {
        const pdfBucket = form.is_restricted ? "vault-files" : "book-files";
        pdfPath = `${id}.pdf`;
        const { error: pdfUploadError } = await supabase.storage
          .from(pdfBucket)
          .upload(pdfPath, pdfFile, { upsert: true });

        if (pdfUploadError) throw pdfUploadError;
        fileSizeBytes = pdfFile.size;
      }

      // 3. Update book record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        title:             form.title,
        author:            form.author,
        category_id:       form.category_id || null,
        description:       form.description,
        curator_note:      form.curator_note,
        is_restricted:     form.is_restricted,
        tags:              form.tags,
        is_published:      form.is_published,
        download_enabled:  form.download_enabled,
        language:          form.language,
        publish_date:      form.publish_date || null,
        last_modified_by:  user.id,
        last_modified_at:  new Date().toISOString(),
        cover_url:         coverUrl,
        file_url:          pdfPath
      };

      if (fileSizeBytes > 0) {
        updateData.file_size_bytes = fileSizeBytes;
      }

      const { error: updateError } = await supabase
        .from("books")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // 4. Log activity
      await supabase.from("admin_activity_log").insert({
        admin_id: user.id,
        action: "book_edited",
        target_type: "book",
        target_id: id as string,
        metadata: { title: form.title }
      });

      router.push(`/admin/books?updated=true`);
      
    } catch (err) {
      console.error("Update error:", err);
      setError((err as Error).message || "An unexpected error occurred during update.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-[#9A9088]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#C9A84C]" />
        Retrieving the scrolls...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-6 border-b border-[#2A2A2A] pb-8 text-left">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-[#2A2A2A] flex items-center justify-center text-[#9A9088] hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-4xl text-[#F0EDE6]">Edit Archive <span className="text-[#C9A84C]">Entry</span></h1>
            <p className="text-[#9A9088] text-sm mt-1 uppercase tracking-widest font-medium">Refining the records of the collective</p>
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
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm focus:border-[#C9A84C]/40 outline-none transition-all appearance-none cursor-pointer"
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
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm focus:border-[#C9A84C]/40 outline-none transition-all appearance-none cursor-pointer"
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
              <div className="flex flex-wrap gap-2 p-2 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg min-h-[50px]">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-[#C9A84C]">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={form.tags.length === 0 ? "Press enter to add tags..." : ""}
                  className="flex-1 min-w-[120px] bg-transparent outline-none text-sm px-2"
                />
              </div>
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
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="curator_note" className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Curator&apos;s Note</label>
              <textarea
                id="curator_note"
                rows={3}
                value={form.curator_note}
                onChange={e => setForm({ ...form, curator_note: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm focus:border-[#C9A84C]/40 outline-none transition-all italic"
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Change Cover Image</label>
              <FileDropZone
                accept="image/*"
                maxSizeMB={5}
                onFileSelect={handleCoverSelect}
                label="New Cover"
                preview={coverPreview}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9088]">Update Book PDF</label>
              <FileDropZone
                accept="application/pdf"
                maxSizeMB={100}
                onFileSelect={setPdfFile}
                label="New PDF"
                fileName={pdfFile?.name || (form.file_url ? "Existing PDF preserved" : undefined)}
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
                 <button 
                  type="button"
                  onClick={() => setForm({ ...form, download_enabled: !form.download_enabled })}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.download_enabled ? 'bg-[#C9A84C]' : 'bg-[#2A2A2A]'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-[#0D0D0D] transition-all ${form.download_enabled ? 'left-7' : 'left-1'}`} />
                 </button>
               </div>

               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-[#F0EDE6] font-medium">Visibility</p>
                   <p className="text-[10px] text-[#9A9088] uppercase tracking-widest">Is it ready for eyes?</p>
                 </div>
                 <button 
                  type="button"
                  onClick={() => setForm({ ...form, is_published: !form.is_published })}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.is_published ? 'bg-[#C9A84C]' : 'bg-[#2A2A2A]'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-[#0D0D0D] transition-all ${form.is_published ? 'left-7' : 'left-1'}`} />
                 </button>
               </div>
            </div>
          </div>

          {/* Form Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-left">
               <AlertCircle className="w-5 h-5 flex-shrink-0" />
               <p className="text-sm font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <div className="pt-4 space-y-4">
             <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-sm transition-all bg-[#C9A84C] text-[#0D0D0D] hover:shadow-[0_0_40px_rgba(201,168,76,0.3)] disabled:opacity-50"
             >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? "Updating..." : "Save Changes"}
             </button>
             <button
                type="button"
                onClick={() => router.back()}
                className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-[#9A9088] hover:text-[#F0EDE6] transition-colors"
             >
                Discard Changes
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}
