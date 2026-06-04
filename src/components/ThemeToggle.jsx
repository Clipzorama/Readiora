import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle({
  className = "",
  compact = false,
  fullWidth = false,
  labelPrefix = "",
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const nextThemeLabel = isDark ? "light" : "dark";
  const label = `${labelPrefix}${labelPrefix ? " " : ""}Switch to ${nextThemeLabel} mode`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={[
        "group inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card/80 text-sm font-semibold text-secondary shadow-sm shadow-black/5 transition duration-200 hover:border-strong-border hover:bg-card-hover hover:text-primary focus:outline-none focus:ring-2 focus:ring-strong-border/70",
        compact ? "w-10 px-0" : "px-3 py-2.5",
        fullWidth ? "w-full justify-between" : "",
        className,
      ].join(" ")}
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg border border-border/70 bg-background/65 text-primary transition group-hover:border-strong-border/70">
        <Icon className="h-3.5 w-3.5" />
      </span>
      {!compact && (
        <>
          <span className="truncate">{isDark ? "Light mode" : "Dark mode"}</span>
          <span className="rounded-full border border-border/70 bg-background/60 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.16em] text-muted">
            {theme}
          </span>
        </>
      )}
    </button>
  );
}
