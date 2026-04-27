"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Type, Eye, Bell, Trash2,
  Loader2, Check, ChevronRight, AlertTriangle, Upload
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

type Section = "profile" | "reading" | "accessibility" | "notifications" | "danger";

const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "profile",       label: "Profile",          icon: User        },
  { key: "reading",       label: "Reading",           icon: Type        },
  { key: "accessibility", label: "Accessibility",     icon: Eye         },
  { key: "notifications", label: "Notifications",     icon: Bell        },
  { key: "danger",        label: "Account",           icon: Trash2      },
];

const FONT_FAMILIES = [
  { value: "inter",    label: "Inter (default)" },
  { value: "georgia",  label: "Georgia (serif)" },
  { value: "mono",     label: "JetBrains Mono"  },
  { value: "playfair", label: "Playfair Display" },
];

const FONT_SIZES = [
  { value: "sm",   label: "Small"   },
  { value: "base", label: "Medium"  },
  { value: "lg",   label: "Large"   },
  { value: "xl",   label: "X-Large" },
];

const LINE_SPACINGS = [
  { value: "tight",   label: "Tight"   },
  { value: "normal",  label: "Normal"  },
  { value: "relaxed", label: "Relaxed" },
  { value: "loose",   label: "Loose"   },
];

interface Props {
  userId: string;
  profile: UserProfile | null;
  userEmail: string;
}

export default function SettingsTab({ userId, profile, userEmail }: Props) {
  const [section, setSection] = useState<Section>("profile");

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Sidebar nav */}
      <nav className="sm:w-48 flex-shrink-0">
        <ul className="space-y-1">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const active = section === key;
            const isDanger = key === "danger";
            return (
              <li key={key}>
                <button
                  onClick={() => setSection(key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm transition-all duration-200 text-left"
                  style={{
                    background: active ? (isDanger ? "rgba(153,27,27,0.1)" : "rgba(201,168,76,0.08)") : "transparent",
                    color:      active ? (isDanger ? "#F87171" : "#C9A84C") : isDanger ? "rgba(248,113,113,0.6)" : "#9A9088",
                    borderLeft: active ? `2px solid ${isDanger ? "#991B1B" : "#C9A84C"}` : "2px solid transparent",
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Panel */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.25 }}
          >
            {section === "profile"       && <ProfileSection       userId={userId} profile={profile} userEmail={userEmail} />}
            {section === "reading"       && <ReadingSection        userId={userId} profile={profile} />}
            {section === "accessibility" && <AccessibilitySection  userId={userId} profile={profile} />}
            {section === "notifications" && <NotificationsSection  userId={userId} />}
            {section === "danger"        && <DangerSection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Shared helpers ────────────────────────────────────────────────────── */

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 pb-4" style={{ borderBottom: "1px solid #2A2A2A" }}>
      <h2 className="font-heading text-xl mb-1" style={{ color: "#F0EDE6" }}>{title}</h2>
      {description && <p className="text-xs leading-relaxed" style={{ color: "#9A9088" }}>{description}</p>}
    </div>
  );
}

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold transition-all duration-300 disabled:opacity-50"
      style={{ background: saved ? "rgba(6,95,70,0.8)" : "#C9A84C", color: "#0D0D0D" }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved</> : "Save changes"}
    </button>
  );
}

function inputCls(override?: object) {
  return {
    background: "#0D0D0D",
    border: "1px solid #2A2A2A",
    color: "#F0EDE6",
    ...override,
  };
}

function useSave(userId: string) {
  const supabase = useRef(createClient()).current;
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  const save = useCallback(async (updates: Partial<UserProfile>) => {
    setLoading(true);
    setError("");
    setSaved(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from("user_profiles")
      .update(updates)
      .eq("id", userId);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      // Apply reading/accessibility prefs to DOM
      applyPrefsToDOM(updates);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  }, [supabase, userId]);

  return { save, loading, saved, error };
}

/** Applies reading/accessibility preferences as data-attributes on <html> */
function applyPrefsToDOM(prefs: Partial<UserProfile>) {
  const html = document.documentElement;
  if (prefs.font_family  !== undefined) html.dataset.fontFamily  = prefs.font_family || "";
  if (prefs.font_size    !== undefined) html.dataset.fontSize    = prefs.font_size || "";
  if (prefs.line_spacing !== undefined) html.dataset.lineSpacing = prefs.line_spacing || "";
  if (prefs.reduce_motion !== undefined) html.dataset.reduceMotion = prefs.reduce_motion ? "1" : "0";
  if (prefs.high_contrast !== undefined) html.dataset.highContrast = prefs.high_contrast ? "1" : "0";
}

/* ─── ProfileSection ────────────────────────────────────────────────────── */

function ProfileSection({ userId, profile, userEmail }: { userId: string; profile: UserProfile | null; userEmail: string }) {
  const { save, loading, saved, error } = useSave(userId);
  const supabase = useRef(createClient()).current;
  const fileRef  = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio,          setBio]         = useState(profile?.bio ?? "");
  const [isPublic,     setIsPublic]    = useState(profile?.is_public ?? false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl,    setAvatarUrl]   = useState(profile?.avatar_url ?? "");

  async function handleAvatar(file: File) {
    setAvatarUploading(true);
    const ext      = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${ext}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: uploadErr } = await (supabase.storage as any)
      .from("avatars")
      .upload(fileName, file, { upsert: true, contentType: file.type });
    if (!uploadErr && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: urlData } = (supabase.storage.from("avatars") as any).getPublicUrl(data.path);
      setAvatarUrl(urlData.publicUrl);
      await save({ avatar_url: urlData.publicUrl });
    }
    setAvatarUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await save({ display_name: displayName.trim(), bio: bio.trim() || null, is_public: isPublic });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionTitle title="Profile" description="How you appear to the curator and (optionally) other readers." />

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-2">
        <div
          className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200"
          style={{ background: "rgba(201,168,76,0.1)", border: "2px solid rgba(201,168,76,0.25)" }}
          onClick={() => fileRef.current?.click()}
          title="Change avatar"
        >
          {avatarUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#C9A84C" }} />
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-5 h-5" style={{ color: "rgba(201,168,76,0.5)" }} />
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm transition-colors"
            style={{ color: "#C9A84C" }}
          >
            Change avatar
          </button>
          <p className="text-xs mt-0.5" style={{ color: "#9A9088" }}>JPEG, PNG, WebP · Max 2MB</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatar(f); }}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-2.5 rounded text-sm outline-none transition-all duration-200"
          style={inputCls()}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
          onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>Email</label>
        <input
          type="text"
          value={userEmail}
          disabled
          className="w-full px-4 py-2.5 rounded text-sm"
          style={{ ...inputCls(), opacity: 0.5, cursor: "not-allowed" }}
        />
        <p className="text-xs mt-1.5" style={{ color: "#9A9088" }}>Email cannot be changed here.</p>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>Bio <span style={{ color: "rgba(154,144,136,0.5)", textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="A sentence or two about your journey…"
          className="w-full px-4 py-2.5 rounded text-sm outline-none transition-all duration-200 resize-none"
          style={inputCls()}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
          onBlur={(e)  => (e.currentTarget.style.borderColor = "#2A2A2A")}
        />
      </div>

      <ToggleRow
        id="is-public"
        label="Public profile"
        description="Allow other readers to see your display name and reading list"
        value={isPublic}
        onChange={setIsPublic}
      />

      {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}
      <SaveButton loading={loading} saved={saved} />
    </form>
  );
}

/* ─── ReadingSection ─────────────────────────────────────────────────────── */

function ReadingSection({ userId, profile }: { userId: string; profile: UserProfile | null }) {
  const { save, loading, saved, error } = useSave(userId);

  const [fontFamily,  setFontFamily]  = useState(profile?.font_family  ?? "inter");
  const [fontSize,    setFontSize]    = useState(profile?.font_size     ?? "base");
  const [lineSpacing, setLineSpacing] = useState(profile?.line_spacing  ?? "normal");

  const previewFontMap: Record<string, string> = {
    inter: "'Inter', sans-serif",
    georgia: "Georgia, serif",
    mono: "'JetBrains Mono', monospace",
    playfair: "'Playfair Display', serif",
  };
  const previewSizeMap: Record<string, string> = { sm: "13px", base: "15px", lg: "17px", xl: "20px" };
  const previewSpacingMap: Record<string, string> = { tight: "1.4", normal: "1.6", relaxed: "1.8", loose: "2.1" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await save({ font_family: fontFamily, font_size: fontSize, line_spacing: lineSpacing });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionTitle title="Reading Preferences" description="Customize how text appears while reading." />

      {/* Live preview */}
      <div
        className="p-5 rounded border mb-2"
        style={{
          background: "#141414",
          borderColor: "rgba(201,168,76,0.2)",
          fontFamily: previewFontMap[fontFamily],
          fontSize: previewSizeMap[fontSize],
          lineHeight: previewSpacingMap[lineSpacing],
          color: "#9A9088",
        }}
      >
        <p className="italic">&ldquo;Knowledge kept in the dark finds its light in solitude. This is a preview of how reading will appear with your current settings. The quick brown fox jumps over the lazy dog.&rdquo;</p>
      </div>

      <SelectRow
        id="font-family"
        label="Font Family"
        value={fontFamily}
        options={FONT_FAMILIES}
        onChange={setFontFamily}
      />
      <SelectRow
        id="font-size"
        label="Font Size"
        value={fontSize}
        options={FONT_SIZES}
        onChange={setFontSize}
      />
      <SelectRow
        id="line-spacing"
        label="Line Spacing"
        value={lineSpacing}
        options={LINE_SPACINGS}
        onChange={setLineSpacing}
      />

      {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}
      <SaveButton loading={loading} saved={saved} />
    </form>
  );
}

/* ─── AccessibilitySection ──────────────────────────────────────────────── */

function AccessibilitySection({ userId, profile }: { userId: string; profile: UserProfile | null }) {
  const { save, loading, saved, error } = useSave(userId);

  const [reduceMotion,  setReduceMotion]  = useState(profile?.reduce_motion  ?? false);
  const [highContrast,  setHighContrast]  = useState(profile?.high_contrast  ?? false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await save({ reduce_motion: reduceMotion, high_contrast: highContrast });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionTitle title="Accessibility" description="Make the library more comfortable for your needs." />

      <ToggleRow
        id="reduce-motion"
        label="Reduce motion"
        description="Disables page transition animations and floating effects"
        value={reduceMotion}
        onChange={setReduceMotion}
      />
      <ToggleRow
        id="high-contrast"
        label="High contrast"
        description="Increases text contrast and sharpens border definition"
        value={highContrast}
        onChange={setHighContrast}
      />

      {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}
      <SaveButton loading={loading} saved={saved} />
    </form>
  );
}

/* ─── NotificationsSection ──────────────────────────────────────────────── */

function NotificationsSection({ userId }: { userId: string }) {
  const supabase = useRef(createClient()).current;
  const [prefs, setPrefs] = useState({
    vault_request_updates:   true,
    book_request_fulfilled:  true,
    new_books_in_category:   false,
    library_announcements:   true,
    donation_status_updates: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [fetching, setFetching] = useState(true);

  useState(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        if (data) setPrefs({
          vault_request_updates:   data.vault_request_updates,
          book_request_fulfilled:  data.book_request_fulfilled,
          new_books_in_category:   data.new_books_in_category,
          library_announcements:   data.library_announcements,
          donation_status_updates: data.donation_status_updates,
        });
        setFetching(false);
      });
  });

  const NOTIF_LABELS: { key: keyof typeof prefs; label: string; description: string }[] = [
    { key: "vault_request_updates",   label: "Vault request updates",   description: "When your access request is approved or declined" },
    { key: "book_request_fulfilled",  label: "Book request fulfilled",  description: "When a book you requested is added to the library" },
    { key: "donation_status_updates", label: "Donation status",         description: "When your donated books are reviewed" },
    { key: "library_announcements",   label: "Library announcements",   description: "Occasional notes from the curator" },
    { key: "new_books_in_category",   label: "New books in category",   description: "When new books are added to categories you've read" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("notification_preferences") as any).upsert({ user_id: userId, ...prefs }, { onConflict: "user_id" });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setLoading(false);
  }

  if (fetching) return <div className="flex justify-center py-12"><Loader2 className="w-4 h-4 animate-spin" style={{ color: "#C9A84C" }} /></div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionTitle title="Notifications" description="Choose which email notifications you receive." />
      {NOTIF_LABELS.map(({ key, label, description }) => (
        <ToggleRow
          key={key}
          id={`notif-${key}`}
          label={label}
          description={description}
          value={prefs[key]}
          onChange={(v) => setPrefs(p => ({ ...p, [key]: v }))}
        />
      ))}
      <SaveButton loading={loading} saved={saved} />
    </form>
  );
}

/* ─── DangerSection ─────────────────────────────────────────────────────── */

function DangerSection() {
  const supabase = useRef(createClient()).current;
  const router   = useRouter();
  const [confirmText,  setConfirmText]  = useState("");
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleDelete() {
    if (confirmText !== "delete my account") return;
    setDeleting(true);
    // deleteUser requires a server-side call with service role key — implement via API route
    const res = await fetch("/api/account/delete", { method: "DELETE" });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push("/");
    } else {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Account" description="Manage your account and session." />

      {/* Sign out */}
      <div
        className="rounded border p-5 flex items-center justify-between gap-4"
        style={{ background: "#141414", borderColor: "#2A2A2A" }}
      >
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: "#F0EDE6" }}>Sign out</p>
          <p className="text-xs" style={{ color: "#9A9088" }}>End your current session on this device.</p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded text-sm transition-all duration-200"
          style={{ border: "1px solid #2A2A2A", color: "#9A9088" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"; (e.currentTarget as HTMLElement).style.color = "#F0EDE6"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A"; (e.currentTarget as HTMLElement).style.color = "#9A9088"; }}
        >
          Sign out
        </button>
      </div>

      {/* Delete account */}
      <div
        className="rounded border p-5"
        style={{ background: "rgba(153,27,27,0.04)", borderColor: "rgba(153,27,27,0.2)" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#991B1B" }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#F0EDE6" }}>Delete account</p>
            <p className="text-xs leading-relaxed" style={{ color: "#9A9088" }}>
              Permanently deletes your account, reading list, notes, and all personal data.
              This cannot be undone. Vault requests and book requests are anonymised rather than deleted.
            </p>
          </div>
        </div>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-sm transition-all duration-200"
            style={{ color: "rgba(153,27,27,0.7)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(153,27,27,0.7)")}
          >
            Delete my account →
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: "#9A9088" }}>
              Type <strong style={{ color: "#F0EDE6" }}>delete my account</strong> to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ background: "#0D0D0D", border: "1px solid rgba(153,27,27,0.3)", color: "#F0EDE6" }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={confirmText !== "delete my account" || deleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-sm transition-all duration-200 disabled:opacity-40"
                style={{ background: "rgba(153,27,27,0.8)", color: "#F0EDE6" }}
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirm deletion
              </button>
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                className="px-4 py-2 rounded text-sm"
                style={{ border: "1px solid #2A2A2A", color: "#9A9088" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shared UI primitives ──────────────────────────────────────────────── */

function ToggleRow({ id, label, description, value, onChange }: {
  id: string; label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-4 cursor-pointer group">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: "#F0EDE6" }}>{label}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#9A9088" }}>{description}</p>
      </div>
      <div className="flex-shrink-0 mt-0.5">
        <input type="checkbox" id={id} checked={value} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div
          onClick={() => onChange(!value)}
          className="w-10 h-5 rounded-full transition-all duration-300 relative cursor-pointer"
          style={{ background: value ? "#C9A84C" : "#2A2A2A" }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
            style={{ background: "#F0EDE6", left: value ? "calc(100% - 18px)" : "2px" }}
          />
        </div>
      </div>
    </label>
  );
}

function SelectRow({ id, label, value, options, onChange }: {
  id: string; label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#9A9088" }}>{label}</label>
      <div className="flex gap-2 flex-wrap">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="px-3 py-1.5 rounded text-xs transition-all duration-200"
            style={{
              background: value === o.value ? "rgba(201,168,76,0.12)" : "#141414",
              border: `1px solid ${value === o.value ? "rgba(201,168,76,0.5)" : "#2A2A2A"}`,
              color: value === o.value ? "#C9A84C" : "#9A9088",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
