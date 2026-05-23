import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookMarked,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Clock3,
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

function buildExamDate(subject) {
  if (!subject?.exam_date) return null;

  const timeValue = subject.exam_time || "00:00";
  const candidate = new Date(`${subject.exam_date}T${timeValue}`);

  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function formatExamDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatExamTime(value) {
  if (!value) return "Time not set";

  const [hours = "00", minutes = "00"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getCountdownParts(targetDate, currentTime) {
  const milliseconds = Math.max(0, targetDate.getTime() - currentTime.getTime());
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function getGreeting(currentTime) {
  const hour = currentTime.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function CountdownUnit({ value, label }) {
  return (
    <div className="rounded-2xl border border-strong-border/50 bg-background/70 px-4 py-3 text-center shadow-inner shadow-black/20">
      <p className="text-3xl font-bold leading-none text-primary sm:text-4xl">
        {value}
      </p>
      <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
    </div>
  );
}

function NextExamCard({ exam, currentTime }) {
  if (!exam) {
    return (
      <div className="relative overflow-hidden rounded-[1.35rem] border border-strong-border/55 bg-card/80 p-5 shadow-2xl shadow-button/10 backdrop-blur-xl sm:p-6">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-button-hover to-transparent" />
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-button/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Next Exam
            </p>
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-strong-border/60 bg-button/20 text-primary shadow-[0_0_24px_hsl(var(--button)/0.16)]">
              <CalendarClock className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-8">
            <p className="text-2xl font-bold tracking-normal text-primary">
              No upcoming exam yet
            </p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-secondary">
              Add an exam date to a subject to activate your countdown.
            </p>
          </div>

          <Link
            to="/subjects"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-button/20 transition hover:bg-button-hover"
          >
            Add exam date
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const countdown = getCountdownParts(exam.date, currentTime);

  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-strong-border/60 bg-[linear-gradient(145deg,hsl(var(--card)/0.96),hsl(var(--button)/0.16))] p-5 shadow-2xl shadow-button/10 backdrop-blur-xl sm:p-6">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-button-hover to-transparent" />
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-button-hover/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-button/5 via-button-hover/50 to-button/5" />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Next Exam
          </p>
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-strong-border/60 bg-background/70 text-primary shadow-[0_0_24px_hsl(var(--button)/0.16)]">
            <CalendarClock className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border/80 bg-background/55 p-4">
          <p className="truncate text-2xl font-bold tracking-normal text-primary">
            {exam.subject.name}
          </p>
          <div className="mt-4 grid gap-3 text-sm text-secondary sm:grid-cols-2">
            <span className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-button-hover" />
              {formatExamDate(exam.date)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-button-hover" />
              {formatExamTime(exam.subject.exam_time)}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <CountdownUnit value={countdown.days} label="Days" />
          <CountdownUnit value={countdown.hours} label="Hours" />
          <CountdownUnit value={countdown.minutes} label="Mins" />
          <CountdownUnit value={countdown.seconds} label="Secs" />
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
  const [dashboardTime, setDashboardTime] = useState(() => new Date());

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

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setDashboardTime(new Date());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  const displayName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "Clipzorama"
    );
  }, [user]);

  const backendStatus = loading ? "checking" : error ? "disconnected" : "connected";

  const scheduledExamCount = useMemo(() => {
    return subjects.filter((subject) => subject.exam_date).length;
  }, [subjects]);

  const nextExam = useMemo(() => {
    const now = dashboardTime.getTime();

    return subjects
      .map((subject) => ({
        subject,
        date: buildExamDate(subject),
      }))
      .filter((exam) => exam.date && exam.date.getTime() >= now)
      .sort((first, second) => first.date.getTime() - second.date.getTime())[0] ?? null;
  }, [dashboardTime, subjects]);

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
          <CommandCard className="relative overflow-hidden p-5 sm:p-7 xl:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,hsl(var(--button)/0.18),transparent_32%),radial-gradient(circle_at_88%_18%,hsl(var(--button-hover)/0.14),transparent_34%)]" />
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-strong-border to-transparent" />
            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.65fr)] xl:items-stretch">
              <div className="flex min-h-[320px] flex-col justify-between rounded-[1.35rem] border border-border/80 bg-background/45 p-5 shadow-inner shadow-black/20 sm:p-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary sm:text-sm">
                    {loading
                      ? "Loading workspace"
                      : `${getGreeting(dashboardTime)}, ${displayName}`}
                  </p>
                  <h2 className="mt-6 max-w-4xl text-4xl font-bold leading-[0.98] text-primary sm:text-5xl lg:text-6xl">
                    Your study command center is ready.
                  </h2>
                  <p className="mt-6 max-w-3xl text-base leading-7 text-secondary sm:text-lg">
                    Track your subjects, notes, exams, and progress from one focused workspace.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-card/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                      Subjects
                    </p>
                    <p className="mt-3 text-3xl font-bold">{subjects.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                      Notes
                    </p>
                    <p className="mt-3 text-3xl font-bold">{notes.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">
                      Exams
                    </p>
                    <p className="mt-3 text-3xl font-bold">
                      {scheduledExamCount}
                    </p>
                  </div>
                </div>
              </div>

              <NextExamCard exam={nextExam} currentTime={dashboardTime} />
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
                <p className="text-5xl font-bold">{scheduledExamCount}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.22em] text-muted">
                  {scheduledExamCount === 1 ? "exam scheduled" : "exams scheduled"}
                </p>
              </div>
            </CommandCard>
          </aside>
        </section>
      </div>
    </WarRoomShell>
  );
}
