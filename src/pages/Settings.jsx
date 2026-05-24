import { motion } from "framer-motion";
import { Bell, Fingerprint, Settings as SettingsIcon, UserRound } from "lucide-react";
import { CardHeader, CommandCard, WarRoomShell } from "../components/WarRoomLayout";
import ProfileSettingsForm from "../components/ProfileSettingsForm";

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function SettingsStat({ icon: Icon, label, value }) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-[1.25rem] border border-border bg-card/70 p-4 shadow-lg shadow-black/20 backdrop-blur"
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

export default function Settings() {
  return (
    <WarRoomShell
      eyebrow="Account Control"
      title="Settings"
      description="Manage your public profile identity and authenticated contact details for the Xevaro workspace."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
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

        <CommandCard className="p-5 sm:p-7 xl:p-8">
          <CardHeader
            eyebrow="Profile"
            title="Personal Details"
            icon={SettingsIcon}
          />
          <ProfileSettingsForm />
        </CommandCard>
      </div>
    </WarRoomShell>
  );
}
