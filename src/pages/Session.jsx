import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Flame,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import {
  CardHeader,
  CommandCard,
  ProgressBar,
  WarRoomShell,
} from "../components/WarRoomLayout";
import { useAuth } from "../hooks/useAuth";
import {
  createManualStudySession,
  createTimerStudySession,
  deleteStudySession,
  getStudySessions,
} from "../services/sessionsService";
import { getSubjects } from "../services/subjectsService";

const durations = [30, 45, 60];

const emptyManualForm = {
  subjectId: "",
  title: "",
  durationMinutes: 60,
  reflection: "",
  startedAt: "",
};

function SelectField({ value, onChange, children, disabled = false }) {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="min-h-11 w-full appearance-none truncate rounded-2xl border border-border bg-background/70 py-2.5 pl-4 pr-12 text-sm font-semibold text-primary outline-none transition focus:border-strong-border disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-button-hover" />
    </div>
  );
}

function FieldLabel({ label, children }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}

function formatClock(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatSessionDate(value) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function toDatetimeLocalValue(date = new Date()) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 16);
}

export default function Session() {
  const { user } = useAuth();
  const timerRef = useRef(null);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [timerDuration, setTimerDuration] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60);
  const [timerState, setTimerState] = useState("idle");
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerForm, setTimerForm] = useState({
    subjectId: "",
    title: "Focused study session",
    reflection: "",
  });
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [subjectRows, sessionRows] = await Promise.all([
          getSubjects(user.id),
          getStudySessions(user.id, 25),
        ]);

        setSubjects(subjectRows ?? []);
        setSessions(sessionRows ?? []);
        const firstSubjectId = subjectRows?.[0]?.id || "";
        setTimerForm((current) => ({ ...current, subjectId: current.subjectId || firstSubjectId }));
        setManualForm((current) => ({
          ...current,
          subjectId: current.subjectId || firstSubjectId,
          startedAt: current.startedAt || toDatetimeLocalValue(),
        }));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  useEffect(() => {
    if (timerState !== "running") return undefined;

    timerRef.current = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timerRef.current);
          setTimerState("completed");
          setNotice("Timer complete. Save the session when ready.");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerRef.current);
  }, [timerState]);

  const timerTotalSeconds = timerDuration * 60;
  const timerProgress = Math.round(((timerTotalSeconds - remainingSeconds) / timerTotalSeconds) * 100);

  const sessionSummary = useMemo(() => {
    const completedSessions = sessions.filter((session) => session.completed);
    const totalMinutes = completedSessions.reduce((sum, session) => sum + Number(session.duration_minutes || 0), 0);

    return {
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalSessions: completedSessions.length,
    };
  }, [sessions]);

  function chooseDuration(minutes) {
    if (timerState === "running") return;
    setTimerDuration(minutes);
    setRemainingSeconds(minutes * 60);
    setTimerState("idle");
    setTimerStartedAt(null);
    setNotice("");
  }

  function startTimer() {
    if (!timerForm.subjectId || !timerForm.title.trim()) return;
    setTimerStartedAt((current) => current || new Date().toISOString());
    setTimerState("running");
    setNotice("");
  }

  function pauseTimer() {
    setTimerState("paused");
  }

  function resetTimer() {
    window.clearInterval(timerRef.current);
    setRemainingSeconds(timerDuration * 60);
    setTimerState("idle");
    setTimerStartedAt(null);
    setNotice("");
  }

  async function saveTimerSession() {
    if (!timerForm.subjectId || !timerForm.title.trim()) return;

    const elapsedMinutes = timerState === "completed"
      ? timerDuration
      : Math.max(1, Math.round((timerTotalSeconds - remainingSeconds) / 60));

    try {
      setSaving(true);
      setError("");
      window.clearInterval(timerRef.current);
      const saved = await createTimerStudySession({
        userId: user.id,
        subjectId: timerForm.subjectId,
        title: timerForm.title,
        durationMinutes: elapsedMinutes,
        reflection: timerForm.reflection,
        startedAt: timerStartedAt,
        endedAt: new Date().toISOString(),
      });
      setSessions((current) => [saved, ...current]);
      resetTimer();
      setTimerForm((current) => ({ ...current, reflection: "" }));
      setNotice("Study session saved.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSubmit(event) {
    event.preventDefault();
    if (!manualForm.subjectId || !manualForm.title.trim() || !manualForm.durationMinutes) return;

    try {
      setSaving(true);
      setError("");
      const saved = await createManualStudySession({
        userId: user.id,
        ...manualForm,
      });
      setSessions((current) => [saved, ...current]);
      setManualForm((current) => ({
        ...emptyManualForm,
        subjectId: current.subjectId,
        durationMinutes: 60,
        startedAt: toDatetimeLocalValue(),
      }));
      setNotice("Manual study session logged.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSession(session) {
    const confirmed = window.confirm(`Delete "${session.title}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(session.id);
      setError("");
      await deleteStudySession(session.id, user.id);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      setNotice("Study session deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <WarRoomShell
      eyebrow="Deep Work"
      title="Study Sessions"
      description="Run focused Pomodoro blocks or log outside study time so your dashboard consistency stays accurate."
      hideHeader
    >
      <div className="grid gap-5">
        {error && (
          <div className="rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
            {error}
          </div>
        )}

        {notice && !error && (
          <div className="rounded-2xl border border-success/40 bg-success/15 p-4 text-sm text-primary">
            {notice}
          </div>
        )}

        {loading ? (
          <CommandCard>
            <p className="text-sm text-secondary">Loading study sessions...</p>
          </CommandCard>
        ) : subjects.length === 0 ? (
          <CommandCard>
            <div className="flex items-start gap-4">
              <BookOpen className="h-5 w-5 text-button-hover" />
              <div>
                <h2 className="text-xl font-bold text-primary">Create a subject first</h2>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  Study sessions need a subject so dashboard progress can connect to your work.
                </p>
              </div>
            </div>
          </CommandCard>
        ) : (
          <>
            <section className="flex min-w-0 flex-col gap-5">
              <CommandCard className="overflow-hidden p-0">
                <div className="relative overflow-hidden p-5 sm:p-7">
                  <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-button/20 blur-3xl" />
                  <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-button-hover/10 blur-3xl" />

                  <div className="relative">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted">Pomodoro Timer</p>
                        <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">
                          Focus block
                        </h2>
                      </div>
                      <span
                        className={`inline-flex min-h-9 items-center justify-center rounded-full border px-3 text-sm font-semibold ${
                          timerState === "completed"
                            ? "border-success/40 bg-success/15 text-success"
                            : timerState === "running"
                              ? "border-strong-border bg-button/20 text-primary"
                              : "border-border bg-background/70 text-secondary"
                        }`}
                      >
                        {timerState === "completed" ? "Complete" : timerState === "running" ? "Running" : timerState === "paused" ? "Paused" : "Ready"}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <FieldLabel label="Subject">
                        <SelectField
                          value={timerForm.subjectId}
                          onChange={(subjectId) => setTimerForm((current) => ({ ...current, subjectId }))}
                          disabled={timerState === "running"}
                        >
                          <option value="">Choose subject</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                          ))}
                        </SelectField>
                      </FieldLabel>
                      <FieldLabel label="Session Title">
                        <input
                          type="text"
                          value={timerForm.title}
                          onChange={(event) => setTimerForm((current) => ({ ...current, title: event.target.value }))}
                          disabled={timerState === "running"}
                          className="min-h-11 rounded-2xl border border-border bg-background/70 px-4 py-2.5 text-sm font-semibold text-primary outline-none placeholder:text-muted focus:border-strong-border disabled:cursor-not-allowed disabled:opacity-60"
                          placeholder="What are you studying?"
                        />
                      </FieldLabel>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {durations.map((minutes) => (
                        <button
                          key={minutes}
                          type="button"
                          onClick={() => chooseDuration(minutes)}
                          disabled={timerState === "running"}
                          className={`min-h-12 rounded-2xl border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            timerDuration === minutes
                              ? "border-strong-border bg-button text-white shadow-lg shadow-button/20"
                              : "border-border bg-background/70 text-secondary hover:border-strong-border hover:text-primary"
                          }`}
                        >
                          {minutes} min
                        </button>
                      ))}
                    </div>

                    <div className="mt-8 grid place-items-center">
                      <motion.div
                        animate={{
                          scale: timerState === "running" ? [1, 1.015, 1] : 1,
                          boxShadow: timerState === "running"
                            ? [
                              "0 0 40px hsl(var(--button) / 0.10)",
                              "0 0 70px hsl(var(--button-hover) / 0.20)",
                              "0 0 40px hsl(var(--button) / 0.10)",
                            ]
                            : "0 0 40px hsl(var(--button) / 0.10)",
                        }}
                        transition={{ duration: 2.4, repeat: timerState === "running" ? Infinity : 0, ease: "easeInOut" }}
                        className="grid aspect-square w-full max-w-80 place-items-center rounded-full border border-strong-border/70 bg-background/80 p-8 text-center shadow-2xl"
                        style={{
                          background: `conic-gradient(hsl(var(--button-hover)) ${timerProgress * 3.6}deg, hsl(var(--card)) 0deg)`,
                        }}
                      >
                        <div className="grid h-full w-full place-items-center rounded-full border border-border bg-card/95 p-6">
                          <div>
                            <p className="text-5xl font-bold tracking-normal text-primary sm:text-6xl">
                              {formatClock(remainingSeconds)}
                            </p>
                            <p className="mt-3 text-xs uppercase tracking-[0.24em] text-muted">
                              {timerDuration} minute session
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="mt-6">
                      <ProgressBar value={timerProgress} label="Timer progress" />
                    </div>

                    <FieldLabel label="Reflection">
                      <textarea
                        value={timerForm.reflection}
                        onChange={(event) => setTimerForm((current) => ({ ...current, reflection: event.target.value }))}
                        placeholder="Optional notes after the session..."
                        className="mt-5 min-h-24 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-primary outline-none placeholder:text-muted focus:border-strong-border"
                      />
                    </FieldLabel>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {timerState === "running" ? (
                        <button
                          type="button"
                          onClick={pauseTimer}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-2 text-sm font-semibold text-primary transition hover:border-warning"
                        >
                          <Pause className="h-4 w-4" />
                          Pause
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startTimer}
                          disabled={!timerForm.subjectId || !timerForm.title.trim() || timerState === "completed"}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-4 py-2 text-sm font-semibold text-white transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Play className="h-4 w-4" />
                          {timerState === "paused" ? "Resume" : "Start"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={resetTimer}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-4 py-2 text-sm font-semibold text-secondary transition hover:border-strong-border hover:text-primary"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={saveTimerSession}
                        disabled={saving || !timerForm.subjectId || !timerForm.title.trim() || timerState === "idle"}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-success/40 bg-success/15 px-4 py-2 text-sm font-semibold text-success transition hover:border-success disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Complete & Save
                      </button>
                    </div>
                  </div>
                </div>
              </CommandCard>

              <div className="grid min-w-0 gap-5">
                <CommandCard>
                  <CardHeader eyebrow="Manual Log" title="Add outside study" icon={Clock3} />
                  <form onSubmit={handleManualSubmit} className="grid gap-4">
                    <FieldLabel label="Subject">
                      <SelectField
                        value={manualForm.subjectId}
                        onChange={(subjectId) => setManualForm((current) => ({ ...current, subjectId }))}
                      >
                        <option value="">Choose subject</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                      </SelectField>
                    </FieldLabel>
                    <FieldLabel label="What You Studied">
                      <input
                        type="text"
                        value={manualForm.title}
                        onChange={(event) => setManualForm((current) => ({ ...current, title: event.target.value }))}
                        className="min-h-11 rounded-2xl border border-border bg-background/70 px-4 py-2.5 text-sm font-semibold text-primary outline-none placeholder:text-muted focus:border-strong-border"
                        placeholder="Chapter review, practice problems..."
                      />
                    </FieldLabel>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldLabel label="Minutes">
                        <input
                          type="number"
                          min="1"
                          value={manualForm.durationMinutes}
                          onChange={(event) => setManualForm((current) => ({ ...current, durationMinutes: event.target.value }))}
                          className="min-h-11 rounded-2xl border border-border bg-background/70 px-4 py-2.5 text-sm font-semibold text-primary outline-none focus:border-strong-border"
                        />
                      </FieldLabel>
                      <FieldLabel label="Started">
                        <input
                          type="datetime-local"
                          value={manualForm.startedAt}
                          onChange={(event) => setManualForm((current) => ({ ...current, startedAt: event.target.value }))}
                          className="session-datetime-input min-h-11 rounded-2xl border border-border bg-background/70 px-4 py-2.5 text-sm font-semibold text-primary outline-none focus:border-strong-border"
                        />
                      </FieldLabel>
                    </div>
                    <FieldLabel label="Reflection">
                      <textarea
                        value={manualForm.reflection}
                        onChange={(event) => setManualForm((current) => ({ ...current, reflection: event.target.value }))}
                        className="min-h-24 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-primary outline-none placeholder:text-muted focus:border-strong-border"
                        placeholder="Optional notes about the session..."
                      />
                    </FieldLabel>
                    <button
                      type="submit"
                      disabled={saving || !manualForm.subjectId || !manualForm.title.trim() || !manualForm.durationMinutes}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-5 py-3 text-sm font-semibold text-white transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Log session
                    </button>
                  </form>
                </CommandCard>

                <CommandCard>
                  <CardHeader eyebrow="Consistency" title="Session Totals" icon={Flame} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                      <p className="text-3xl font-bold text-primary">{sessionSummary.totalHours}</p>
                      <p className="mt-2 text-sm text-secondary">Hours logged</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                      <p className="text-3xl font-bold text-primary">{sessionSummary.totalSessions}</p>
                      <p className="mt-2 text-sm text-secondary">Completed sessions</p>
                    </div>
                  </div>
                </CommandCard>
              </div>
            </section>

            <section className="grid gap-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">History</p>
                  <h2 className="mt-2 text-2xl font-bold text-primary">Recent sessions</h2>
                </div>
                <p className="text-sm text-secondary">
                  {sessions.length} saved session{sessions.length === 1 ? "" : "s"}
                </p>
              </div>

              <AnimatePresence>
                {sessions.length === 0 ? (
                  <CommandCard className="grid min-h-48 place-items-center p-8 text-center">
                    <div>
                      <CalendarClock className="mx-auto h-8 w-8 text-muted" />
                      <h2 className="mt-4 text-2xl font-bold text-primary">No sessions yet</h2>
                      <p className="mt-2 text-sm leading-6 text-secondary">
                        Complete a timer or log outside study to build consistency.
                      </p>
                    </div>
                  </CommandCard>
                ) : (
                  <div className="grid gap-3">
                    {sessions.slice(0, 8).map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid gap-3 rounded-2xl border border-border bg-card/70 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-primary">{session.title}</p>
                          <p className="mt-1 text-sm text-secondary">
                            {session.subjects?.name ?? "Subject"} · {formatSessionDate(session.started_at)}
                          </p>
                        </div>
                        <span className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-success/35 bg-success/15 px-3 text-sm font-semibold text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          {session.duration_minutes} min
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(session)}
                          disabled={deletingId === session.id}
                          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-danger/35 bg-danger/10 px-3 text-danger transition hover:border-danger disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Delete ${session.title}`}
                        >
                          {deletingId === session.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </section>
          </>
        )}
      </div>
    </WarRoomShell>
  );
}
