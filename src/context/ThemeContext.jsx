import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  getInitialTheme,
  THEME_STORAGE_KEY,
  THEMES,
  ThemeContext,
} from "./themeCore";

const THEME_TRANSITION_DURATION_MS = 450;
const THEME_TRANSITION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function applyDocumentTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [themeTransitioning, setThemeTransitioning] = useState(false);
  const transitionInProgressRef = useRef(false);

  useEffect(() => {
    applyDocumentTheme(theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme persistence is progressive enhancement; the UI still updates.
    }
  }, [theme]);

  const updateTheme = useCallback((nextTheme) => {
    if (!THEMES.has(nextTheme)) return;

    applyDocumentTheme(nextTheme);
    flushSync(() => {
      setTheme(nextTheme);
    });
  }, []);

  const toggleTheme = useCallback(async (origin) => {
    if (transitionInProgressRef.current) return;

    const nextTheme = theme === "dark" ? "light" : "dark";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canUseViewTransition = typeof document.startViewTransition === "function";

    if (reducedMotion) {
      updateTheme(nextTheme);
      return;
    }

    transitionInProgressRef.current = true;
    setThemeTransitioning(true);

    if (!canUseViewTransition) {
      updateTheme(nextTheme);
      window.setTimeout(() => {
        transitionInProgressRef.current = false;
        setThemeTransitioning(false);
      }, THEME_TRANSITION_DURATION_MS);
      return;
    }

    const x = Number.isFinite(origin?.x) ? origin.x : window.innerWidth / 2;
    const y = Number.isFinite(origin?.y) ? origin.y : window.innerHeight / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    try {
      const transition = document.startViewTransition(() => {
        updateTheme(nextTheme);
      });

      await transition.ready;
      const animation = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: THEME_TRANSITION_DURATION_MS,
          easing: THEME_TRANSITION_EASING,
          pseudoElement: "::view-transition-new(root)",
        },
      );

      await Promise.allSettled([animation.finished, transition.finished]);
    } catch {
      updateTheme(nextTheme);
    } finally {
      transitionInProgressRef.current = false;
      setThemeTransitioning(false);
    }
  }, [theme, updateTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: updateTheme,
      toggleTheme,
      themeTransitioning,
    }),
    [theme, themeTransitioning, toggleTheme, updateTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
