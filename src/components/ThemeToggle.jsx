import { useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle({
  className = "",
  compact = false,
  fullWidth = false,
  navigation = false,
  labelPrefix = "",
}) {
  const buttonRef = useRef(null);
  const { theme, toggleTheme, themeTransitioning } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const nextThemeLabel = isDark ? "light" : "dark";
  const label = `${labelPrefix}${labelPrefix ? " " : ""}Switch to ${nextThemeLabel} mode`;

  function handleToggle() {
    const bounds = buttonRef.current?.getBoundingClientRect();
    toggleTheme(bounds ? {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    } : undefined);
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleToggle}
      disabled={themeTransitioning}
      aria-label={label}
      aria-busy={themeTransitioning}
      title={label}
      className={[
        "group inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card/80 text-sm font-semibold text-secondary shadow-sm shadow-black/5 transition duration-200 hover:border-strong-border hover:bg-card-hover hover:text-primary focus:outline-none focus:ring-2 focus:ring-strong-border/70 cursor-pointer",
        compact ? "w-10 px-0" : "px-3 py-2.5",
        fullWidth ? "w-full justify-between" : "",
        navigation ? "min-h-0 py-2 font-medium" : "",
        className,
      ].join(" ")}
    >
      <span className={`grid place-items-center rounded-lg border border-border/70 bg-background/65 text-primary transition group-hover:border-strong-border/70 ${
        navigation ? "h-8 w-8 shrink-0" : "h-7 w-7"
      }`}>
        <Icon
          key={theme}
          className={`${themeTransitioning ? "theme-toggle-icon" : ""} h-3.5 w-3.5`}
        />
      </span>
      {!compact && (
        <>
          <span className={`truncate ${navigation ? "flex-1 text-left" : ""}`}>
            {isDark ? "Light mode" : "Dark mode"}
          </span>
          {navigation ? (
            <span className="grid h-3.5 w-3.5 shrink-0 place-items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-muted transition group-hover:bg-primary" />
            </span>
          ) : (
            <span className="rounded-full border border-border/70 bg-background/60 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              {theme}
            </span>
          )}
        </>
      )}
    </button>
  );
}
