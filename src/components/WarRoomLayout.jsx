import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  BrainCircuit,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { signOutUser } from "../services/authService";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Subjects", to: "/subjects", icon: BookOpen },
  { label: "Notes", to: "/notes", icon: FileText },
];

export function WarRoomShell({ eyebrow, title, description, action, children }) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOutUser();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-background text-primary">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(130,0,0,0.28),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(86,45,14,0.18),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1500px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col justify-between rounded-[1.75rem] border border-border bg-card/80 p-4 shadow-2xl shadow-black/35 backdrop-blur xl:flex">
          <div>
            <div className="rounded-2xl border border-strong-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-button text-white shadow-lg shadow-button/25">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Xevaro</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">
                    War Room
                  </p>
                </div>
              </div>
            </div>

            <nav className="mt-5 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "group flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                      isActive
                        ? "border-strong-border bg-button/20 text-primary shadow-lg shadow-button/10"
                        : "border-transparent text-secondary hover:border-border hover:bg-card-hover hover:text-primary",
                    ].join(" ")
                  }
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="grid gap-3 rounded-2xl border border-border bg-background/70 p-4">
            <div>
              <div className="flex items-center gap-2 text-success">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Secure</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-secondary">
                Authenticated Supabase workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-secondary transition hover:border-strong-border hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-5 rounded-[1.75rem] border border-border bg-card/75 p-4 shadow-xl shadow-black/25 backdrop-blur sm:p-5 xl:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-button text-white">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Xevaro</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">
                    War Room
                  </p>
                </div>
              </div>
              <nav className="flex flex-1 justify-end gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "grid h-10 w-10 place-items-center rounded-xl border transition sm:w-auto sm:px-3",
                        isActive
                          ? "border-strong-border bg-button/25 text-primary"
                          : "border-border bg-background/70 text-secondary",
                      ].join(" ")
                    }
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-2 sm:text-sm">
                      {item.label}
                    </span>
                  </NavLink>
                ))}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/70 text-secondary transition hover:border-strong-border hover:text-primary"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign out</span>
                </button>
              </nav>
            </div>
          </header>

          <section className="mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-border bg-card/75 p-5 shadow-2xl shadow-black/25 backdrop-blur sm:p-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-secondary">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary sm:text-base">
                {description}
              </p>
            </div>
            {action}
          </section>

          {children}
        </div>
      </div>
    </main>
  );
}

export function CommandCard({ children, className = "" }) {
  return (
    <section
      className={`rounded-[1.5rem] border border-border bg-card/80 p-5 shadow-xl shadow-black/25 backdrop-blur transition hover:border-strong-border/70 ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({ eyebrow, title, icon: Icon = Sparkles }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-lg font-semibold text-primary">{title}</h2>
      </div>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-strong-border bg-button/20 text-primary">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

export function MetricCard({ label, value, detail, icon: Icon, tone = "primary" }) {
  const tones = {
    primary: "text-primary bg-button/20 border-strong-border/60",
    success: "text-success bg-success/15 border-success/30",
    warning: "text-warning bg-warning/15 border-warning/30",
    danger: "text-danger bg-danger/15 border-danger/30",
  };

  return (
    <div className="rounded-[1.25rem] border border-border bg-background/65 p-4 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
        {Icon && (
          <div className={`grid h-9 w-9 place-items-center rounded-xl border ${tones[tone]}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
      {detail && <p className="mt-2 text-sm text-secondary">{detail}</p>}
    </div>
  );
}

export function ProgressBar({ value, tone = "button", label }) {
  const color = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-button";

  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-secondary">{label}</span>
          <span className="font-medium text-primary">{value}%</span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-background">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function RingGauge({ value, label }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-28 w-28 shrink-0 place-items-center rounded-full p-2"
        style={{
          background: `conic-gradient(hsl(var(--buttonh)) ${value * 3.6}deg, hsl(var(--border)) 0deg)`,
        }}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-card">
          <span className="text-2xl font-bold">{value}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-muted">{label}</p>
        <p className="mt-2 text-sm leading-6 text-secondary">
          Readiness is calculated from study hours, quiz accuracy, flashcard
          mastery, weak topics, and exam proximity.
        </p>
      </div>
    </div>
  );
}

export function MiniBarChart({ data }) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className="mt-6 flex h-56 items-end gap-3">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
          <div className="flex h-44 w-full items-end rounded-t-2xl bg-background/70 px-2">
            <div
              className="w-full rounded-t-xl bg-gradient-to-t from-button to-button-hover shadow-lg shadow-button/20"
              style={{ height: `${Math.max((item.value / maxValue) * 100, 12)}%` }}
              title={`${item.value} hours`}
            />
          </div>
          <span className="text-xs uppercase tracking-widest text-muted">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AddButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-button/20 transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}
