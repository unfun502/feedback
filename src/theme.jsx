import { useState, createContext, useContext } from "react";

export const THEMES = {
  light: {
    bg: "#f5f5f4",
    bgAlt: "#fafaf9",
    card: "#ffffff",
    cardHover: "#ffffff",
    text: "#1c1917",
    textSecondary: "#44403c",
    textMuted: "#78716c",
    textFaint: "#a8a29e",
    border: "#e7e5e4",
    borderLight: "#f5f5f4",
    btnPrimaryBg: "#1c1917",
    btnPrimaryText: "#ffffff",
    btnSecondaryBg: "#f5f5f4",
    btnSecondaryText: "#44403c",
    btnSecondaryBorder: "#e7e5e4",
    inputBg: "#ffffff",
    inputBorder: "#d6d3d1",
    inputFocus: "#1c1917",
    sidebarBg: "#1c1917",
    sidebarText: "#d6d3d1",
    sidebarTextActive: "#fafaf9",
    sidebarHover: "#292524",
    sidebarBorder: "#292524",
    shadow: "0 1px 3px rgba(0,0,0,0.04)",
    shadowMd: "0 4px 12px rgba(0,0,0,0.06)",
    shadowLg: "0 12px 40px rgba(0,0,0,0.1)",
    shadowCard: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
    shadowCardHover: "0 12px 40px rgba(0,0,0,0.1)",
    overlayBg: "rgba(0,0,0,0.4)",
    badgeBg: "#f5f5f4",
    badgeText: "#44403c",
    statsBg: "#ffffff",
    pollBarBg: "#e7e5e4",
    pollBarFill: "#1c1917",
    dropzoneBg: "#fafaf9",
    dropzoneBorder: "#d6d3d1",
    dropzoneActiveBg: "#f0fdf4",
    dropzoneActiveBorder: "#10b981",
    imgOverlayBg: "rgba(0,0,0,0.04)",
  },
  dark: {
    bg: "#0c0a09",
    bgAlt: "#1c1917",
    card: "#1c1917",
    cardHover: "#211f1d",
    text: "#fafaf9",
    textSecondary: "#d6d3d1",
    textMuted: "#a8a29e",
    textFaint: "#78716c",
    border: "#2e2a27",
    borderLight: "#292524",
    btnPrimaryBg: "#fafaf9",
    btnPrimaryText: "#0c0a09",
    btnSecondaryBg: "#292524",
    btnSecondaryText: "#d6d3d1",
    btnSecondaryBorder: "#3d3835",
    inputBg: "#292524",
    inputBorder: "#3d3835",
    inputFocus: "#fafaf9",
    sidebarBg: "#1c1917",
    sidebarText: "#a8a29e",
    sidebarTextActive: "#fafaf9",
    sidebarHover: "#292524",
    sidebarBorder: "#292524",
    shadow: "0 1px 3px rgba(0,0,0,0.2)",
    shadowMd: "0 4px 12px rgba(0,0,0,0.3)",
    shadowLg: "0 12px 40px rgba(0,0,0,0.4)",
    shadowCard: "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15)",
    shadowCardHover: "0 12px 40px rgba(0,0,0,0.4)",
    overlayBg: "rgba(0,0,0,0.6)",
    badgeBg: "#292524",
    badgeText: "#d6d3d1",
    statsBg: "#1c1917",
    pollBarBg: "#292524",
    pollBarFill: "#fafaf9",
    dropzoneBg: "#292524",
    dropzoneBorder: "#3d3835",
    dropzoneActiveBg: "#052e16",
    dropzoneActiveBorder: "#10b981",
    imgOverlayBg: "rgba(255,255,255,0.04)",
  },
};

export const ThemeContext = createContext();
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("dark");
  const toggle = () => setMode((m) => (m === "light" ? "dark" : "light"));
  const t = THEMES[mode];
  return (
    <ThemeContext.Provider value={{ mode, toggle, t }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  return useContext(ThemeContext);
}
