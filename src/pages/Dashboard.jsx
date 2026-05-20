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
  Radar,
  Target,
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
      detail: "Saved in Supabase",
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
      description="Track real workspace totals from Supabase. Advanced study systems remain empty until implemented."
      action={
        <div className="grid min-w-[260px] gap-3 rounded-2xl border border-strong-border bg-background/70 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-[0.22em] text-muted">
              Readiness
            </span>
            <span className="text-3xl font-bold text-primary">0%</span>
          </div>
          <ProgressBar value={0} />
          <p className="text-sm text-secondary">
            No readiness data exists for this workspace.
          </p>
        </div>
      }
    >
      <div className="grid gap-6">
        {error && (
          <div className="rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
            {error}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <CommandCard className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-button/20 blur-2xl" />
            <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-secondary">
                  {loading ? "Loading workspace" : `Good evening, ${displayName}`}
                </p>
                <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
                  {subjects.length || notes.length
                    ? "Workspace data is live."
                    : "Your workspace is empty."}
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-secondary">
                  {subjects.length || notes.length
                    ? "Dashboard counts are reading from your authenticated Supabase rows."
                    : "Create a subject and add notes to begin. New accounts include no sample study data."}
                </p>
              </div>
              <RingGauge value={0} label="Exam Readiness" />
            </div>
          </CommandCard>

          <CommandCard>
            <CardHeader eyebrow="Live Status" title="Current Streak" icon={Flame} />
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-4xl font-bold">0</p>
                <p className="mt-2 text-sm text-secondary">days active</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-4xl font-bold">0</p>
                <p className="mt-2 text-sm text-secondary">missions due</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-strong-border/70 bg-button/15 p-4">
              <div className="flex items-center gap-2 text-primary">
                <BrainCircuit className="h-4 w-4" />
                <span className="text-sm font-semibold">AI Recommendation</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-secondary">
                No AI recommendation is available because generation is not enabled.
              </p>
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
