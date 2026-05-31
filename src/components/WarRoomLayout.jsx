import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { signOutUser } from "../services/authService";
import SettingsModal from "../pages/Settings";
import UserAvatar from "./UserAvatar";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Subjects", to: "/subjects", icon: BookOpen },
  { label: "Notes", to: "/notes", icon: FileText },
];

const studyNavItems = [
  { label: "Summaries", to: "/summaries", icon: Sparkles },
  { label: "Flashcards", to: "/flashcards", icon: Layers3 },
];

const utilityNavItems = [
  { label: "Settings", modal: "settings", icon: SettingsIcon },
];

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function SidebarNav({ onNavigate, onOpenSettings }) {
  const sections = [
    { label: "Workspace", items: navItems },
    { label: "Study", items: studyNavItems },
    { label: "Account", items: utilityNavItems },
  ];

  return (
    <nav className="grid gap-4">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="px-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted">
            {section.label}
          </p>
          <div className="mt-2 grid gap-1">
            {section.items.map((item) => {
              if (item.modal === "settings") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      onNavigate?.();
                      onOpenSettings?.();
                    }}
                    className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-transparent px-3 py-2 text-left text-sm font-medium text-secondary transition duration-200 hover:border-border hover:bg-card-hover/80 hover:text-primary"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border/70 bg-background/45 text-secondary transition group-hover:text-primary">
                        <item.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    [
                      "group relative flex items-center justify-between overflow-hidden rounded-xl border px-3 py-2 text-sm font-medium transition duration-200",
                      isActive
                        ? "border-strong-border bg-button/20 text-primary shadow-[0_0_20px_hsl(var(--button)/0.12)]"
                        : "border-transparent text-secondary hover:border-border hover:bg-card-hover/80 hover:text-primary",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${
                            isActive
                              ? "border-strong-border bg-background/70 text-primary"
                              : "border-border/70 bg-background/45 text-secondary group-hover:text-primary"
                          }`}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </span>
                      <ChevronRight className={`h-3.5 w-3.5 transition ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarIdentity({ className = "" }) {
  const { avatarUrl, displayName, initials, loading } = useProfile();

  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-3xl border border-border bg-background/55 p-3 ${className}`}
    >
      <UserAvatar
        avatarUrl={avatarUrl}
        initials={initials}
        label={displayName}
        size="sm"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-primary">
          {loading ? "Loading profile" : displayName}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
          Active operator
        </p>
      </div>
    </div>
  );
}

export function WarRoomShell({ eyebrow, title, description, action, children }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  async function handleSignOut() {
    await signOutUser();
    navigate("/login", { replace: true });
  }

  function openSettings() {
    setMobileOpen(false);
    setSettingsSaved(false);
    setSettingsOpen(true);
  }

  function closeSettings() {
    setSettingsOpen(false);
  }

  function handleSettingsSaved() {
    setSettingsOpen(false);
    setSettingsSaved(true);
    window.setTimeout(() => setSettingsSaved(false), 3200);
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-background text-primary">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-[-10rem] h-80 w-80 rounded-full bg-button/20 blur-3xl" />
        <div className="absolute right-[-8rem] top-24 h-96 w-96 rounded-full bg-button-hover/10 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-96 w-96 rounded-full bg-strong-border/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.025)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <div className="relative flex w-full gap-4 px-3 pb-32 pt-4 sm:pt-6 md:pb-10 lg:px-0 lg:py-0 xl:gap-5">
        <aside className="sticky top-0 z-20 hidden h-screen max-h-screen w-60 shrink-0 self-start overflow-y-auto border-r border-border bg-card/70 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-strong-border to-transparent" />
          <div>
            <div className="rounded-2xl border border-strong-border/70 bg-background/65 p-2.5 shadow-inner shadow-black/25">
              <SidebarIdentity />
            </div>

            <div className="mt-5">
              <SidebarNav onOpenSettings={openSettings} />
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-border bg-background/65 p-3">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-success/30 bg-success/15 text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Secure Workspace</p>
                <p className="mt-1 text-xs leading-5 text-secondary">
                  Account protection active.
                </p>
              </div>
            </div>
            <motion.button
              type="button"
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-secondary transition hover:border-strong-border hover:bg-card-hover hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </motion.button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:py-5 lg:pr-5">
          <header className="sticky top-2 z-30 mb-4 rounded-2xl border border-border bg-card/85 p-2.5 shadow-xl shadow-black/25 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <SidebarIdentity className="flex-1" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/70 text-secondary transition hover:border-strong-border hover:text-primary"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <motion.section
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-5"
          >
            <motion.header
              variants={cardVariants}
              className="relative overflow-hidden rounded-[1.35rem] border border-border bg-card/70 p-4 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6 lg:p-6"
            >
              <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-button/15 blur-2xl" />
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.28em] text-secondary">
                    {eyebrow}
                  </p>
                  <h1 className="mt-3 text-3xl font-bold leading-tight tracking-normal text-primary sm:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary sm:text-base">
                    {description}
                  </p>
                </div>
                {action && <div className="shrink-0">{action}</div>}
              </div>
            </motion.header>

            <motion.div variants={cardVariants} className="w-full">
              {children}
            </motion.div>
          </motion.section>
        </div>
      </div>

      <AnimatePresence>
        {settingsSaved && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="fixed bottom-24 left-1/2 z-[80] w-[min(calc(100vw-2rem),26rem)] -translate-x-1/2 rounded-2xl border border-success/40 bg-card/95 px-4 py-3 text-sm font-semibold text-primary shadow-2xl shadow-black/40 backdrop-blur-xl md:bottom-6"
          >
            Profile settings saved.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            open={settingsOpen}
            onClose={closeSettings}
            onSaved={handleSettingsSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col justify-between border-r border-border bg-card/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl lg:hidden"
            >
              <div>
                <div className="flex items-center justify-between gap-3 rounded-3xl border border-strong-border/70 bg-background/65 p-4">
                  <SidebarIdentity className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-secondary transition hover:border-strong-border hover:text-primary"
                    aria-label="Close navigation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6">
                  <p className="px-3 text-xs uppercase tracking-[0.22em] text-muted">
                    Navigation
                  </p>
                  <div className="mt-3">
                    <SidebarNav
                      onNavigate={() => setMobileOpen(false)}
                      onOpenSettings={openSettings}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-3 py-3 text-sm font-semibold text-secondary transition hover:border-strong-border hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

export function CommandCard({ children, className = "" }) {
  return (
    <motion.section
      variants={cardVariants}
      whileHover={{ y: -2 }}
      className={`group relative rounded-[1.5rem] border border-border bg-card/75 p-5 shadow-xl shadow-black/20 backdrop-blur transition duration-200 hover:border-strong-border/70 hover:shadow-[0_0_28px_hsl(var(--button)/0.12)] sm:p-6 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function CardHeader({ eyebrow, title, icon: Icon = Sparkles }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-3 text-lg font-semibold leading-tight text-primary">
          {title}
        </h2>
      </div>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-strong-border bg-button/20 text-primary shadow-[0_0_20px_hsl(var(--button)/0.14)]">
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
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2 }}
      className="rounded-[1.25rem] border border-border bg-card/70 p-4 shadow-lg shadow-black/20 backdrop-blur transition hover:border-strong-border/70"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
        {Icon && (
          <div
            className={`grid h-9 w-9 place-items-center rounded-xl border ${tones[tone]}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-normal">{value}</p>
      {detail && <p className="mt-2 text-sm leading-6 text-secondary">{detail}</p>}
    </motion.div>
  );
}

export function ProgressBar({ value, tone = "button", label }) {
  const color =
    tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-button";

  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-secondary">{label}</span>
          <span className="font-medium text-primary">{value}%</span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-background">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export function RingGauge({ value, label }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div
        className="grid h-28 w-28 shrink-0 place-items-center rounded-full p-2"
        style={{
          background: `conic-gradient(hsl(var(--button-hover)) ${
            value * 3.6
          }deg, hsl(var(--border)) 0deg)`,
        }}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-card">
          <span className="text-2xl font-bold">{value}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted">{label}</p>
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
    <div className="mt-6 flex h-56 items-end gap-2 sm:gap-3">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
          <div className="flex h-44 w-full items-end rounded-t-2xl bg-background/70 px-1.5 sm:px-2">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((item.value / maxValue) * 100, 12)}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="w-full rounded-t-xl bg-gradient-to-t from-button to-button-hover shadow-lg shadow-button/20"
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

export function AddButton({ children, className = "", ...props }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-button/20 transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${className}`}
      {...props}
    >
      <Plus className="h-4 w-4" />
      {children}
    </motion.button>
  );
}
