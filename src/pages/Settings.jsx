import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Fingerprint,
  Settings as SettingsIcon,
  UserRound,
  X,
} from "lucide-react";
import ProfileSettingsForm from "../components/ProfileSettingsForm";

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.975, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    y: 8,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

function SettingsStat({ icon: Icon, label, value }) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-[1.15rem] border border-border bg-background/62 p-4 shadow-lg shadow-black/20 backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-strong-border/60 bg-button/20 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-secondary">{value}</p>
    </motion.div>
  );
}

export default function Settings({ open = true, onClose, onSaved }) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.22, ease: "easeOut" } }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <motion.button
        type="button"
        className="absolute inset-0 cursor-default"
        initial={{
          backgroundColor: "hsla(var(--background), 0)",
          backdropFilter: "blur(0px)",
          WebkitBackdropFilter: "blur(0px)",
        }}
        animate={{
          backgroundColor: "hsla(var(--background), 0.74)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        exit={{
          backgroundColor: "hsla(var(--background), 0)",
          backdropFilter: "blur(0px)",
          WebkitBackdropFilter: "blur(0px)",
        }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClose}
        aria-label="Close settings"
      />

      <motion.section
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative flex max-h-[min(92dvh,58rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.65rem] border border-strong-border/65 bg-card/95 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:rounded-[2rem]"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-button-hover to-transparent" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-button/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-strong-border/20 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4 border-b border-border/80 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-secondary">
              Account Control
            </p>
            <h2
              id="settings-modal-title"
              className="mt-3 text-3xl font-bold leading-tight tracking-normal text-primary sm:text-4xl"
            >
              Settings
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary sm:text-base">
              Manage your public profile identity and authenticated contact
              details without leaving your workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border bg-background/70 text-secondary transition hover:border-strong-border hover:bg-card-hover hover:text-primary"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative min-h-0 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.06, delayChildren: 0.05 },
              },
            }}
            initial="hidden"
            animate="visible"
            className="grid gap-5"
          >
            <section className="grid gap-3 md:grid-cols-3">
              <SettingsStat
                icon={UserRound}
                label="Identity"
                value="First name, last name, and avatar are synced to your profile."
              />
              <SettingsStat
                icon={Fingerprint}
                label="Access"
                value="Profile writes are restricted by user-owned row policies."
              />
              <SettingsStat
                icon={Bell}
                label="Phone"
                value="Phone updates use Supabase Auth for secure verification."
              />
            </section>

            <motion.section
              variants={itemVariants}
              className="relative rounded-[1.35rem] border border-border bg-background/50 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5 lg:p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">
                    Profile
                  </p>
                  <h3 className="mt-3 text-xl font-semibold leading-tight text-primary">
                    Personal Details
                  </h3>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-strong-border bg-button/20 text-primary shadow-[0_0_20px_hsl(var(--button)/0.14)]">
                  <SettingsIcon className="h-4 w-4" />
                </div>
              </div>

              <ProfileSettingsForm onSaved={onSaved || onClose} />
            </motion.section>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
}
