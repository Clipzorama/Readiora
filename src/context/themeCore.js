import { createContext } from "react";

export const THEME_STORAGE_KEY = "readiora-theme";
export const THEMES = new Set(["light", "dark"]);
export const ThemeContext = createContext(null);

export function getSystemTheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function getStoredTheme() {
  if (typeof window === "undefined") return "";

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.has(storedTheme) ? storedTheme : "";
  } catch {
    return "";
  }
}

export function getInitialTheme() {
  if (typeof document !== "undefined") {
    const rootTheme = document.documentElement.dataset.theme;
    if (THEMES.has(rootTheme)) return rootTheme;
  }

  return getStoredTheme() || getSystemTheme();
}
