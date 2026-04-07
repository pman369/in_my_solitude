"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface Preferences {
  theme_preference: "dark" | "dim" | "sepia";
  font_size:        "sm" | "base" | "lg" | "xl";
  font_family:      "inter" | "georgia" | "mono" | "playfair";
  line_spacing:     "tight" | "normal" | "relaxed" | "loose";
  reduce_motion:    boolean;
  high_contrast:    boolean;
}

const DEFAULT: Preferences = {
  theme_preference: "dark",
  font_size:        "base",
  font_family:      "inter",
  line_spacing:     "normal",
  reduce_motion:    false,
  high_contrast:    false,
};

/* ── Context ────────────────────────────────────────────────────────────── */

const PreferencesContext = createContext<{
  preferences:    Preferences;
  setPreferences: (p: Partial<Preferences>) => void;
}>({
  preferences:    DEFAULT,
  setPreferences: () => {},
});

export const usePreferences = () => useContext(PreferencesContext);

/* ── CSS mappings ───────────────────────────────────────────────────────── */

const FONT_FAMILY_MAP: Record<Preferences["font_family"], string> = {
  inter:    "'Inter', system-ui, sans-serif",
  georgia:  "Georgia, 'Times New Roman', serif",
  mono:     "'JetBrains Mono', 'Fira Code', monospace",
  playfair: "'Playfair Display', Georgia, serif",
};

const FONT_SIZE_MAP: Record<Preferences["font_size"], string> = {
  sm:   "13px",
  base: "15px",
  lg:   "17px",
  xl:   "20px",
};

const LINE_SPACING_MAP: Record<Preferences["line_spacing"], string> = {
  tight:   "1.4",
  normal:  "1.6",
  relaxed: "1.85",
  loose:   "2.1",
};

/* ── apply() ────────────────────────────────────────────────────────────── */

function applyToDOM(prefs: Preferences) {
  const html = document.documentElement;

  // Reading CSS vars
  html.style.setProperty("--reading-font-family", FONT_FAMILY_MAP[prefs.font_family]);
  html.style.setProperty("--reading-font-size",   FONT_SIZE_MAP[prefs.font_size]);
  html.style.setProperty("--reading-line-height", LINE_SPACING_MAP[prefs.line_spacing]);

  // Theme
  html.setAttribute("data-theme", prefs.theme_preference);

  // Accessibility
  html.classList.toggle("reduce-motion", prefs.reduce_motion);
  html.classList.toggle("high-contrast", prefs.high_contrast);

  // Data attrs (for components that read them)
  html.dataset.fontFamily  = prefs.font_family;
  html.dataset.fontSize    = prefs.font_size;
  html.dataset.lineSpacing = prefs.line_spacing;
}

/* ── Provider ───────────────────────────────────────────────────────────── */

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const supabase = useRef(createClient()).current;
  const [preferences, setPrefsState] = useState<Preferences>(DEFAULT);

  const setPreferences = useCallback((partial: Partial<Preferences>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...partial };
      applyToDOM(next);
      return next;
    });
  }, []);

  // Load preferences from DB when user authenticates
  useEffect(() => {
    async function loadPrefs(userId: string) {
      const { data: raw } = await supabase
        .from("user_profiles")
        .select("theme_preference, font_size, font_family, line_spacing, reduce_motion, high_contrast")
        .eq("id", userId)
        .single();

      if (!raw) return;

      // Cast to avoid Supabase TS inference issues on partial selects
      const data = raw as {
        theme_preference: string | null;
        font_size:        string | null;
        font_family:      string | null;
        line_spacing:     string | null;
        reduce_motion:    boolean | null;
        high_contrast:    boolean | null;
      };

      const loaded: Preferences = {
        theme_preference: (data.theme_preference as Preferences["theme_preference"]) ?? DEFAULT.theme_preference,
        font_size:        (data.font_size        as Preferences["font_size"])        ?? DEFAULT.font_size,
        font_family:      (data.font_family      as Preferences["font_family"])      ?? DEFAULT.font_family,
        line_spacing:     (data.line_spacing      as Preferences["line_spacing"])     ?? DEFAULT.line_spacing,
        reduce_motion:    data.reduce_motion  ?? DEFAULT.reduce_motion,
        high_contrast:    data.high_contrast  ?? DEFAULT.high_contrast,
      };

      setPrefsState(loaded);
      applyToDOM(loaded);
    }

    // Initial session check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadPrefs(user.id);
    });

    // Re-load on auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadPrefs(session.user.id);
      } else {
        // Reset to defaults on sign-out
        setPrefsState(DEFAULT);
        applyToDOM(DEFAULT);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Apply defaults on first mount
  useEffect(() => {
    applyToDOM(DEFAULT);
  }, []);

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}
