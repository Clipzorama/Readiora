import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpen,
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
  ProgressBar,
  WarRoomShell,
} from "../components/WarRoomLayout";
import { useAuth } from "../hooks/useAuth";
import { getDashboardIntelligence } from "../services/dashboardIntelligenceService";
import { getStudySessionSummary } from "../services/sessionsService";

const emptyStudySummary = {
  weeklyHours: [
    { label: "Sun", dateLabel: "", value: 0, isToday: false },
    { label: "Mon", dateLabel: "", value: 0, isToday: false },
    { label: "Tue", dateLabel: "", value: 0, isToday: false },
    { label: "Wed", dateLabel: "", value: 0, isToday: false },
    { label: "Thu", dateLabel: "", value: 0, isToday: false },
    { label: "Fri", dateLabel: "", value: 0, isToday: false },
    { label: "Sat", dateLabel: "", value: 0, isToday: false },
  ],
  weekRangeLabel: "",
  weekStart: "",
  weekEnd: "",
  weeklyTotalHours: 0,
  streakDays: 0,
  totalSessions: 0,
  totalHours: 0,
};

const emptyFlashcardSummary = {
  total: 0,
  mastered: 0,
  learning: 0,
  reviewing: 0,
  new: 0,
  masteryPercent: 0,
};

const dashboardSections = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "readiness", label: "Readiness", icon: Radar },
  { id: "exams", label: "Exams", icon: CalendarClock },
  { id: "strategy", label: "Strategy", icon: BrainCircuit },
];

function getSundayWeekKey(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
}

function formatHours(value) {
  const hours = Number(value || 0);
  return `${hours.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1,
  })}h`;
}

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
        frame: "border-success/45 bg-[linear-gradient(135deg,hsl(var(--emerald)/0.16),hsl(var(--card)/0.9)_56%,hsl(var(--button)/0.12))] text-success shadow-success/10",
        badge: "border-success/50 bg-success/15 text-success",
        beam: "from-success via-button to-success/45",
        detail: "text-success",
        dot: "bg-success",
        ring: "border-success/25",
      }
    : isChecking
      ? {
          frame: "border-warning/45 bg-[linear-gradient(135deg,hsl(var(--warning)/0.24),hsl(var(--card)/0.84)_56%,hsl(var(--button)/0.14))] text-warning shadow-warning/10",
          badge: "border-warning/50 bg-warning/15 text-warning",
          beam: "from-warning via-[#38c7ff] to-[#dff8ff]",
          detail: "text-secondary",
          dot: "bg-warning",
          ring: "border-warning/25",
        }
      : {
          frame: "border-danger/45 bg-[linear-gradient(135deg,hsl(var(--danger)/0.24),hsl(var(--card)/0.84)_56%,hsl(var(--button)/0.12))] text-[#ff8585] shadow-danger/10",
          badge: "border-danger/50 bg-danger/20 text-[#ff9a9a]",
          beam: "from-danger via-[#ff6363] to-[#ffd1d1]",
          detail: "text-secondary",
          dot: "bg-[#ff5656]",
          ring: "border-danger/25",
        };

  return (
    <div
      className={[
        "group relative min-w-68 overflow-hidden rounded-[1.35rem] border p-3 shadow-2xl backdrop-blur-xl",
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
          <p className={`mt-1 truncate text-xs font-semibold ${tone.detail}`}>
            {statusDetail}
          </p>
        </div>

        <div className="flex h-10 items-end gap-1.5 rounded-2xl border border-border/70 bg-background/55 px-2.5 py-2">
          {bars.map((height, index) => (
            <span
              key={`${status}-${height}-${index}`}
              className={`w-1.5 rounded-full bg-linear-to-t ${tone.beam}`}
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

function NextExamCard({ exam, currentTime, isNextExam = true }) {
  if (!exam) {
    return (
      <div className="relative overflow-hidden rounded-[1.35rem] border border-strong-border/55 bg-card/80 p-5 shadow-2xl shadow-button/10 backdrop-blur-xl sm:p-6">
        <div className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-button-hover to-transparent" />
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
      <div className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-button-hover to-transparent" />
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-button-hover/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-linear-to-r from-button/5 via-button-hover/50 to-button/5" />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            {isNextExam ? "Next Exam" : "Selected Exam"}
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
            <span className="inline-flex justify-end gap-2">
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

function StudyHoursWeeklyPanel({ summary }) {
  const days = summary.weeklyHours?.length ? summary.weeklyHours : emptyStudySummary.weeklyHours;
  const maxDayHours = Math.max(1, ...days.map((day) => Number(day.value || 0)));
  const weeklyTotal = Number(summary.weeklyTotalHours || 0);
  const activeDays = days.filter((day) => Number(day.value || 0) > 0).length;
  const averageHours = activeDays > 0 ? Math.round((weeklyTotal / activeDays) * 10) / 10 : 0;
  const hasStudyHours = weeklyTotal > 0;

  return (
    <CommandCard className="overflow-hidden">
      <div className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-button-hover/70 to-transparent" />
      <CardHeader
        eyebrow="Consistency"
        title="Study Hours"
        icon={LineChart}
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Current Week
          </p>
          <p className="mt-2 text-lg font-semibold text-primary">
            {summary.weekRangeLabel || "This week"}
          </p>
        </div>
        <div className="rounded-2xl border border-strong-border/70 bg-background/70 px-4 py-3 text-left sm:text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Weekly Total
          </p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {formatHours(weeklyTotal)}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.25rem] border border-border bg-background/55 p-3 sm:p-4">
        <div className="flex h-56 items-end gap-2 sm:gap-3">
          {days.map((day) => {
            const value = Number(day.value || 0);
            const height = value > 0 ? Math.max((value / maxDayHours) * 100, 10) : 4;

            return (
              <div key={`${day.label}-${day.isoDate || day.dateLabel}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className={`text-[0.68rem] font-semibold ${value > 0 ? "text-primary" : "text-muted"}`}>
                  {formatHours(value)}
                </span>
                <div
                  className={`flex h-36 w-full items-end overflow-hidden rounded-2xl border px-1.5 py-1.5 ${
                    day.isToday
                      ? "border-button-hover/70 bg-button/15 shadow-[0_0_22px_hsl(var(--button)/0.14)]"
                      : "border-border bg-card/65"
                  }`}
                  title={`${day.label}${day.dateLabel ? `, ${day.dateLabel}` : ""}: ${formatHours(value)}`}
                >
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ${
                      value > 0
                        ? "bg-linear-to-t from-button via-button-hover to-[#dff8ff] shadow-lg shadow-button/25"
                        : "bg-border/50"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${day.isToday ? "text-primary" : "text-muted"}`}>
                    {day.label}
                  </p>
                  {day.dateLabel && (
                    <p className="mt-1 text-[0.65rem] text-muted">
                      {day.dateLabel}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background/60 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Studied Days</p>
          <p className="mt-2 text-xl font-semibold text-primary">{activeDays}/7</p>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Avg Active Day</p>
          <p className="mt-2 text-xl font-semibold text-primary">{formatHours(averageHours)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">All Time</p>
          <p className="mt-2 text-xl font-semibold text-primary">{formatHours(summary.totalHours)}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-secondary">
        {hasStudyHours
          ? "The stats reset when the next week begins."
          : "No completed study sessions logged for this week yet. The weekly chart will reset when the next Sunday-Saturday week begins."}
      </p>
    </CommandCard>
  );
}

function DashboardSectionNav({ activeSection, onSectionChange }) {
  return (
    <div className="grid gap-2 rounded-[1.35rem] border border-border bg-card/70 p-2 shadow-xl shadow-black/20 backdrop-blur sm:grid-cols-4">
      {dashboardSections.map((section) => {
        const Icon = section.icon;
        const active = activeSection === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSectionChange(section.id)}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              active
                ? "border-strong-border bg-button text-white shadow-lg shadow-button/20"
                : "border-transparent bg-background/45 text-secondary hover:border-border hover:text-primary"
            }`}
          >
            <Icon className="h-4 w-4" />
            {section.label}
          </button>
        );
      })}
    </div>
  );
}

function FlashcardMasteryPanel({ summary }) {
  return (
    <CommandCard>
      <CardHeader eyebrow="Active Recall" title="Flashcard Mastery" icon={CheckCircle2} />
      <div className="grid gap-4">
        <div className="rounded-2xl border border-strong-border/60 bg-button/15 p-5 text-center">
          <p className="text-5xl font-bold text-primary">{summary.total}</p>
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-muted">
            Total flashcards
          </p>
        </div>
        <ProgressBar value={summary.masteryPercent} label="Mastery" />
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[
            ["Mastered", summary.mastered, "text-success"],
            ["Learning", summary.learning, "text-warning"],
            ["Reviewing", summary.reviewing, "text-button-hover"],
            ["New", summary.new, "text-secondary"],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-2xl border border-border bg-background/60 p-3">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </CommandCard>
  );
}

function ReadinessMapPanel({ readinessBySubject }) {
  return (
    <CommandCard>
      <CardHeader eyebrow="Readiness Map" title="Subject Progress" icon={Radar} />
      {readinessBySubject.length === 0 ? (
        <EmptyPanel>No subjects yet. Add subjects, notes, quizzes, flashcards, or sessions to calculate readiness.</EmptyPanel>
      ) : (
        <div className="space-y-5">
          {readinessBySubject.map((subject) => (
            <div key={subject.subjectId} className="rounded-2xl border border-border bg-background/60 p-4">
              <ProgressBar value={subject.readiness} label={subject.subjectName} />
              <div className="mt-4 grid gap-2 text-xs text-secondary sm:grid-cols-4">
                <span>Cards: {subject.flashcardMastery}%</span>
                <span>Quiz: {subject.quizAccuracy}%</span>
                <span>Study: {formatHours(subject.studyHours)}</span>
                <span>Notes: {subject.noteCount}</span>
              </div>
              {subject.signalCount === 0 && (
                <p className="mt-3 text-xs leading-5 text-muted">
                  No usable progress signals yet.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </CommandCard>
  );
}

function WeakTopicsPanel({ weakTopics }) {
  return (
    <CommandCard>
      <CardHeader eyebrow="Threat Matrix" title="Weak Topics" icon={Target} />
      {weakTopics.length === 0 ? (
        <EmptyPanel>
          No weak-topic data yet. Complete quizzes, mark flashcards, add notes, and log study sessions to build this list.
        </EmptyPanel>
      ) : (
        <div className="space-y-3">
          {weakTopics.map((topic) => (
            <Link
              key={topic.id}
              to={topic.route}
              className="block rounded-2xl border border-border bg-background/60 p-4 transition hover:border-strong-border hover:bg-card-hover/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary">{topic.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{topic.subjectName}</p>
                  <p className="mt-2 text-sm leading-6 text-secondary">{topic.detail}</p>
                </div>
                <span className="rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
                  {topic.severity}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </CommandCard>
  );
}

function StudyMissionsPanel({ missions }) {
  return (
    <CommandCard>
      <CardHeader eyebrow="Today's Mission" title="Study Missions" icon={Target} />
      {missions.length === 0 ? (
        <EmptyPanel>
          No missions yet. Add notes, generate quizzes or flashcards, and complete study sessions to create targeted actions.
        </EmptyPanel>
      ) : (
        <div className="space-y-3">
          {missions.map((mission, index) => (
            <Link
              key={mission.id}
              to={mission.route}
              className="flex items-start gap-3 rounded-2xl border border-border bg-background/60 p-4 transition hover:border-strong-border hover:bg-card-hover/70"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-strong-border/60 bg-button/20 text-sm font-bold text-primary">
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold text-primary">{mission.title}</span>
                <span className="mt-1 block text-sm leading-6 text-secondary">{mission.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </CommandCard>
  );
}

function RecentActivityPanel({ notes }) {
  return (
    <CommandCard>
      <CardHeader eyebrow="After Action" title="Recent Activity" icon={Activity} />
      {notes.length === 0 ? (
        <EmptyPanel>No recent note activity.</EmptyPanel>
      ) : (
        <div className="space-y-4">
          {notes.slice(0, 5).map((note) => (
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
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [quizAccuracy, setQuizAccuracy] = useState({
    attemptsCount: 0,
    averageAccuracy: 0,
    latestAccuracy: null,
  });
  const [studySummary, setStudySummary] = useState(emptyStudySummary);
  const [flashcardSummary, setFlashcardSummary] = useState(emptyFlashcardSummary);
  const [readinessBySubject, setReadinessBySubject] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [studyMissions, setStudyMissions] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardTime, setDashboardTime] = useState(() => new Date());

  useEffect(() => {
    if (!user) return;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const intelligence = await getDashboardIntelligence(user.id);
        setSubjects(intelligence.subjects);
        setNotes(intelligence.notes);
        setQuizAccuracy(intelligence.quizAccuracy);
        setStudySummary(intelligence.studySessionSummary);
        setFlashcardSummary(intelligence.flashcardSummary);
        setReadinessBySubject(intelligence.readinessBySubject);
        setWeakTopics(intelligence.weakTopics);
        setStudyMissions(intelligence.studyMissions);
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

  const backendStatus = loading ? "checking" : error ? "disconnected" : "connected";
  const activeWeekKey = useMemo(() => getSundayWeekKey(dashboardTime), [dashboardTime]);

  const upcomingExams = useMemo(() => {
    const now = dashboardTime.getTime();

    return subjects
      .map((subject) => ({
        subject,
        date: buildExamDate(subject),
      }))
      .filter((exam) => exam.date && exam.date.getTime() >= now)
      .sort((first, second) => first.date.getTime() - second.date.getTime());
  }, [dashboardTime, subjects]);

  const selectedExam = upcomingExams.find((exam) => exam.subject.id === selectedExamId)
    ?? upcomingExams[0]
    ?? null;
  const nextExam = upcomingExams[0] ?? null;
  const scheduledExamCount = upcomingExams.length;

  useEffect(() => {
    if (!user || loading) return;

    let cancelled = false;

    async function refreshWeeklyStudySummary() {
      try {
        const studySessionSummary = await getStudySessionSummary(user.id);
        if (!cancelled) {
          setStudySummary(studySessionSummary);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to refresh weekly study progress.");
        }
      }
    }

    refreshWeeklyStudySummary();

    return () => {
      cancelled = true;
    };
  }, [activeWeekKey, loading, user]);

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
      label: "Flashcards",
      value: flashcardSummary.total,
      detail: flashcardSummary.total > 0
        ? `${flashcardSummary.masteryPercent}% mastered`
        : "No flashcards yet",
      icon: CheckCircle2,
      tone: flashcardSummary.total > 0 ? "success" : "danger",
    },
    {
      label: "Quiz accuracy",
      value: quizAccuracy.attemptsCount > 0 ? `${quizAccuracy.averageAccuracy}%` : "0%",
      detail: quizAccuracy.attemptsCount > 0
        ? `${quizAccuracy.attemptsCount} saved attempt${quizAccuracy.attemptsCount === 1 ? "" : "s"}`
        : "No quiz attempts yet",
      icon: BarChart3,
      tone: "success",
    },
    {
      label: "Current streak",
      value: `${studySummary.streakDays} day${studySummary.streakDays === 1 ? "" : "s"}`,
      detail: studySummary.totalSessions > 0
        ? `${studySummary.totalSessions} completed session${studySummary.totalSessions === 1 ? "" : "s"}`
        : "No study sessions yet",
      icon: Flame,
      tone: "primary",
    },
  ];

  return (
    <WarRoomShell
      eyebrow="Dashboard"
      title="Command Center"
      description="Track your study signals, readiness, exams, and next actions from real workspace data."
      action={<BackendStatusPill status={backendStatus} />}
    >
      <div className="grid gap-6">
        {error && (
          <div className="rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
            {error}
          </div>
        )}

        <DashboardSectionNav activeSection={activeSection} onSectionChange={setActiveSection} />

        {activeSection === "overview" && (
          <section className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
              <StudyHoursWeeklyPanel summary={studySummary} />
              <FlashcardMasteryPanel summary={flashcardSummary} />
            </div>
          </section>
        )}

        {activeSection === "readiness" && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(21rem,0.75fr)]">
            <ReadinessMapPanel readinessBySubject={readinessBySubject} />
            <WeakTopicsPanel weakTopics={weakTopics} />
          </section>
        )}

        {activeSection === "exams" && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <NextExamCard
              exam={selectedExam}
              currentTime={dashboardTime}
              isNextExam={!selectedExam || selectedExam.subject.id === nextExam?.subject.id}
            />
            <CommandCard>
              <CardHeader
                eyebrow="Exam Schedule"
                title="Upcoming Exams"
                icon={CalendarClock}
              />
              <div className="rounded-2xl border border-strong-border bg-background/70 p-5 text-center">
                <p className="text-5xl font-bold">{scheduledExamCount}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.22em] text-muted">
                  {scheduledExamCount === 1 ? "exam scheduled" : "exams scheduled"}
                </p>
              </div>
              <div className="mt-4 grid max-h-[32rem] gap-3 overflow-y-auto pr-1">
                {upcomingExams.length === 0 ? (
                  <EmptyPanel>Add exam dates to your subjects to build your countdown schedule.</EmptyPanel>
                ) : (
                  upcomingExams.map((exam, index) => {
                    const countdown = getCountdownParts(exam.date, dashboardTime);
                    const selected = exam.subject.id === selectedExam?.subject.id;

                    return (
                      <button
                        key={exam.subject.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedExamId(exam.subject.id)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-strong-border bg-button/20 shadow-lg shadow-button/10"
                            : "border-border bg-background/60 hover:border-strong-border hover:bg-card-hover"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">{exam.subject.name}</p>
                            <p className="mt-1 text-sm text-secondary">{formatExamDate(exam.date)}</p>
                          </div>
                          {index === 0 && (
                            <span className="shrink-0 rounded-full border border-success/30 bg-success/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-success">
                              Next
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-button-hover">
                          {countdown.days}d {countdown.hours}h {countdown.minutes}m remaining
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </CommandCard>
          </section>
        )}

        {activeSection === "strategy" && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(21rem,0.75fr)]">
            <div className="grid gap-6">
              <StudyMissionsPanel missions={studyMissions} />
              <RecentActivityPanel notes={notes} />
            </div>
            <CommandCard>
              <CardHeader
                eyebrow="AI Strategist"
                title="Priority Summary"
                icon={BrainCircuit}
              />
              <div className="grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3">
                  <Zap className="h-4 w-4 text-warning" />
                  <span className="text-sm">
                    Critical weaknesses: {weakTopics.filter((topic) => topic.severity >= 70).length}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3">
                  <Layers3 className="h-4 w-4 text-success" />
                  <span className="text-sm">
                    Strongest subject: {
                      readinessBySubject.length > 0
                        ? [...readinessBySubject].sort((first, second) => second.readiness - first.readiness)[0]?.subjectName
                        : "none"
                    }
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3">
                  <BookOpen className="h-4 w-4 text-button-hover" />
                  <span className="text-sm">
                    Notes available: {notes.length}
                  </span>
                </div>
              </div>
            </CommandCard>
          </section>
        )}
      </div>
    </WarRoomShell>
  );
}
