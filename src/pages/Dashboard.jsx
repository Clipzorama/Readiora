import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookMarked,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Flame,
  Layers3,
  LineChart,
  LoaderCircle,
  Radar,
  RadioTower,
  Target,
  Unplug,
  Zap,
} from "lucide-react";
import {
  CardHeader,
  CommandCard,
  MetricCard,
  MiniBarChart,
  ProgressBar,
  RingGauge,
  WarRoomShell,
} from "../components/WarRoomLayout";
import { useAuth } from "../hooks/useAuth";
import { getNotes } from "../services/notesService";
import { getSubjects } from "../services/subjectsService";

const zeroStudyHours = [
  { label: "Mon", value: 0 },
  { label: "Tue", value: 0 },
  { label: "Wed", value: 0 },
  { label: "Thu", value: 0 },
  { label: "Fri", value: 0 },
  { label: "Sat", value: 0 },
  { label: "Sun", value: 0 },
];

function EmptyPanel({ children }) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm leading-6 text-secondary">
      {children}
    </div>
  );
}

function BackendStatusPill({ status }) {
  const isConnected = status === "connected";
  const isChecking = status === "checking";
  const Icon = isConnected ? RadioTower : isChecking ? LoaderCircle : Unplug;
  const bars = isConnected ? [38, 58, 82, 100] : isChecking ? [48, 72, 44, 66] : [18, 14, 24, 12];
  const statusLabel = isConnected ? "Connected" : isChecking ? "Checking" : "Disconnected";
  const statusDetail = isConnected
    ? "Workspace sync is live"
    : isChecking
      ? "Scanning data channel"
      : "Data channel offline";
  const tone = isConnected
    ? {
        frame: "border-success/45 bg-[linear-gradient(135deg,hsl(var(--emerald)/0.24),hsl(var(--card)/0.84)_56%,hsl(var(--button)/0.16))] text-[#49f3bd] shadow-success/10",
        badge: "border-success/50 bg-success/20 text-[#6dffd0]",
        beam: "from-[#4cffc3] via-[#17e6ad] to-[#d8fff1]",
        dot: "bg-[#25f0b0]",
        ring: "border-success/25",
      }
    : isChecking
      ? {
          frame: "border-warning/45 bg-[linear-gradient(135deg,hsl(var(--warning)/0.24),hsl(var(--card)/0.84)_56%,hsl(var(--button)/0.14))] text-warning shadow-warning/10",
          badge: "border-warning/50 bg-warning/15 text-warning",
          beam: "from-warning via-[#38c7ff] to-[#dff8ff]",
          dot: "bg-warning",
          ring: "border-warning/25",
        }
      : {
          frame: "border-danger/45 bg-[linear-gradient(135deg,hsl(var(--danger)/0.24),hsl(var(--card)/0.84)_56%,hsl(var(--button)/0.12))] text-[#ff8585] shadow-danger/10",
          badge: "border-danger/50 bg-danger/20 text-[#ff9a9a]",
          beam: "from-danger via-[#ff6363] to-[#ffd1d1]",
          dot: "bg-[#ff5656]",
          ring: "border-danger/25",
        };

  return (
    <div
      className={[
        "group relative min-w-[17rem] overflow-hidden rounded-[1.35rem] border p-3 shadow-2xl backdrop-blur-xl",
        tone.frame,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)] opacity-0 transition duration-300 group-hover:translate-x-8 group-hover:opacity-100" />
      <div className="relative flex items-center gap-3">
        <div className="relative grid h-12 w-12 shrink-0 place-items-center">
          <span className={`absolute h-12 w-12 rounded-full border ${tone.ring}`} />
          <span className={`absolute h-8 w-8 rounded-full border ${tone.ring}`} />
          <span className={`grid h-10 w-10 place-items-center rounded-2xl border ${tone.badge}`}>
            <Icon className={`h-5 w-5 ${isChecking ? "animate-spin" : ""}`} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${tone.dot} shadow-[0_0_18px_currentColor]`} />
            <p className="truncate text-sm font-bold">{statusLabel}</p>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-secondary">
            {statusDetail}
          </p>
        </div>

        <div className="flex h-10 items-end gap-1.5 rounded-2xl border border-border/70 bg-background/55 px-2.5 py-2">
          {bars.map((height, index) => (
            <span
              key={`${status}-${height}-${index}`}
              className={`w-1.5 rounded-full bg-gradient-to-t ${tone.beam}`}
              style={{ height: `${height}%`, opacity: isConnected ? 1 : 0.72 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const [subjectRows, noteRows] = await Promise.all([
          getSubjects(user.id),
          getNotes(user.id),
        ]);
        setSubjects(subjectRows ?? []);
        setNotes(noteRows ?? []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user]);

  const displayName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Operator"
    );
  }, [user]);

  const backendStatus = loading ? "checking" : error ? "disconnected" : "connected";

  const metrics = [
    {
      label: "Subjects",
      value: subjects.length,
      detail: "Owned by your account",
      icon: Layers3,
      tone: "primary",
    },
    {
      label: "Notes",
      value: notes.length,
      detail: "Saved securely",
      icon: BookMarked,
      tone: "success",
    },
    {
      label: "Readiness",
      value: "0%",
      detail: "No readiness engine enabled",
      icon: Target,
      tone: "warning",
    },
    {
      label: "Flashcards",
      value: 0,
      detail: "No flashcard system enabled",
      icon: CheckCircle2,
      tone: "danger",
    },
    {
      label: "Quiz accuracy",
      value: "0%",
      detail: "No quiz attempts yet",
      icon: BarChart3,
      tone: "success",
    },
    {
      label: "Current streak",
      value: "0 days",
      detail: "No study sessions yet",
      icon: Flame,
      tone: "primary",
    },
  ];

  return (
    <WarRoomShell
      eyebrow="AI Study War Room"
      title="Command Center"
      description="Track real workspace totals from your account. Advanced study systems remain empty until implemented."
      action={<BackendStatusPill status={backendStatus} />}
    >
      <div className="grid gap-6">
        {error && (
          <div className="rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
            {error}
          </div>
        )}

        <section>
          <CommandCard className="relative min-h-[340px] overflow-hidden p-6 sm:p-8 xl:min-h-[440px] xl:p-10">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,hsl(var(--button)/0.18),transparent_48%)]" />
            <div className="relative flex min-h-[292px] flex-col justify-between gap-10 xl:min-h-[360px]">
              <div>
                <p className="text-sm uppercase tracking-[0.34em] text-secondary">
                  {loading ? "Loading workspace" : `Good evening, ${displayName}`}
                </p>
                <h2 className="mt-8 max-w-5xl text-4xl font-bold leading-none text-primary sm:text-6xl xl:text-7xl">
                  {subjects.length || notes.length
                    ? "Workspace data is live."
                    : "Your workspace is empty."}
                </h2>
                <p className="mt-8 max-w-4xl text-lg leading-8 text-secondary">
                  {subjects.length || notes.length
                    ? "Dashboard counts are reading from your secure workspace data."
                    : "Create a subject and add notes to begin. New accounts include no sample study data."}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
                <RingGauge value={0} label="Exam Readiness" />
                <div>
                  <p className="text-sm uppercase tracking-[0.34em] text-muted">
                    Exam Readiness
                  </p>
                  <p className="mt-4 max-w-4xl text-base leading-7 text-secondary sm:text-lg">
                    Readiness is calculated from study hours, quiz accuracy,
                    flashcard mastery, weak topics, and exam proximity.
                  </p>
                </div>
              </div>
            </div>
          </CommandCard>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <CommandCard>
                <CardHeader
                  eyebrow="Consistency"
                  title="Study Hours"
                  icon={LineChart}
                />
                <MiniBarChart data={zeroStudyHours} />
              </CommandCard>

              <CommandCard>
                <CardHeader
                  eyebrow="Readiness Map"
                  title="Subject Progress"
                  icon={Radar}
                />
                {subjects.length === 0 ? (
                  <EmptyPanel>No subjects yet.</EmptyPanel>
                ) : (
                  <div className="space-y-5">
                    {subjects.map((subject) => (
                      <ProgressBar key={subject.id} value={0} label={subject.name} />
                    ))}
                  </div>
                )}
              </CommandCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <CommandCard>
                <CardHeader
                  eyebrow="Threat Matrix"
                  title="Weak Topics"
                  icon={Target}
                />
                <EmptyPanel>No weak-topic data exists yet.</EmptyPanel>
              </CommandCard>

              <CommandCard>
                <CardHeader
                  eyebrow="After Action"
                  title="Recent Activity"
                  icon={Activity}
                />
                {notes.length === 0 ? (
                  <EmptyPanel>No recent note activity.</EmptyPanel>
                ) : (
                  <div className="space-y-4">
                    {notes.slice(0, 3).map((note) => (
                      <div
                        key={note.id}
                        className="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 sm:grid-cols-[1fr_auto]"
                      >
                        <div>
                          <p className="font-semibold">{note.title}</p>
                          <p className="mt-2 text-sm text-secondary">
                            {note.subjects?.name ?? "Linked subject"}
                          </p>
                        </div>
                        <span className="self-start rounded-full border border-success/30 bg-success/15 px-3 py-1 text-sm text-success">
                          Saved
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CommandCard>
            </div>
          </div>

          <aside className="grid gap-6">
            <CommandCard>
              <CardHeader
                eyebrow="AI Strategist"
                title="Priority Summary"
                icon={BrainCircuit}
              />
              <p className="leading-7 text-secondary">
                No AI summary exists for this workspace.
              </p>
              <div className="mt-5 grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3">
                  <Zap className="h-4 w-4 text-warning" />
                  <span className="text-sm">Critical weaknesses: 0</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3">
                  <Layers3 className="h-4 w-4 text-success" />
                  <span className="text-sm">Strongest subject: none</span>
                </div>
              </div>
            </CommandCard>

            <CommandCard>
              <CardHeader
                eyebrow="Today's Mission"
                title="No Mission Scheduled"
                icon={Target}
              />
              <div className="space-y-3 text-sm text-secondary">
                <EmptyPanel>No generated study missions.</EmptyPanel>
              </div>
            </CommandCard>

            <CommandCard>
              <CardHeader
                eyebrow="Upcoming Exam"
                title="Exam Countdown"
                icon={CalendarClock}
              />
              <div className="rounded-2xl border border-strong-border bg-background/70 p-5 text-center">
                <p className="text-5xl font-bold">0</p>
                <p className="mt-2 text-sm uppercase tracking-[0.22em] text-muted">
                  exams scheduled
                </p>
              </div>
            </CommandCard>
          </aside>
        </section>
      </div>
    </WarRoomShell>
  );
}
