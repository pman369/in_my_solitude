"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "dim" | "sepia";
type FontSize = "small" | "medium" | "large" | "xl";
type LineSpacing = "normal" | "relaxed" | "loose";
type FontFamily = "serif" | "sans" | "dyslexic";

export interface Preferences {
  theme_preference: Theme;
  font_size: FontSize;
  font_family: FontFamily;
  line_spacing: LineSpacing;
  reduce_motion: boolean;
  high_contrast: boolean;
}

const defaultPreferences: Preferences = {
  theme_preference: "dark",
  font_size: "medium",
  font_family: "serif",
  line_spacing: "normal",
  reduce_motion: false,
  high_contrast: false,
};

const PreferencesContext = createContext<{
  preferences: Preferences;
  setPreferences: (p: Preferences) => void;
}>({
  preferences: defaultPreferences,
  setPreferences: () => {},
});

export const usePreferences = () => useContext(PreferencesContext);

export function PreferencesProvider({ 
  children,
  initialPrefs 
}: { 
  children: React.ReactNode;
  initialPrefs?: Partial<Preferences>;
}) {
  const [preferences, setPreferences] = useState<Preferences>({
    ...defaultPreferences,
    ...initialPrefs,
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Theme
    root.setAttribute("data-theme", preferences.theme_preference);
    
    // A11y
    if (preferences.reduce_motion) root.classList.add("reduce-motion");
    else root.classList.remove("reduce-motion");
    
    if (preferences.high_contrast) root.classList.add("high-contrast");
    else root.classList.remove("high-contrast");

    // Reading specifics
    const sizeMap = { small: '14px', medium: '16px', large: '18px', xl: '20px' };
    const spacingMap = { normal: '1.5', relaxed: '1.75', loose: '2.0' };
    const fontMap = {
      serif: '"Playfair Display", Georgia, serif',
      sans: 'Inter, system-ui, sans-serif',
      dyslexic: 'OpenDyslexic, Arial, sans-serif',
    };

    root.style.setProperty('--reading-font-size', sizeMap[preferences.font_size]);
    root.style.setProperty('--reading-line-height', spacingMap[preferences.line_spacing]);
    root.style.setProperty('--reading-font-family', fontMap[preferences.font_family]);
    
  }, [preferences]);

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}
