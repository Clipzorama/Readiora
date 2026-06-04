import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  ChevronDown,
  CircleHelp,
  LoaderCircle,
  Play,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  CardHeader,
  CommandCard,
  ProgressBar,
  WarRoomShell,
} from "../components/WarRoomLayout";
import { useAuth } from "../hooks/useAuth";
import { generateQuiz } from "../services/aiService";
import { getCompletedExtractionAttachmentIds } from "../services/noteAttachmentsService";
import { getNotes } from "../services/notesService";
import {
  deleteQuiz,
  getQuizAttempts,
  getQuizzes,
} from "../services/quizService";
import { getSubjects } from "../services/subjectsService";

const emptyGenerator = {
  subjectId: "",
  noteId: "",
  count: 8,
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
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getQuestionCount(quiz) {
  return quiz.question_count || quiz.quiz_questions?.length || 0;
}

function getLatestAttempt(quizId, attempts) {
  return attempts.find((attempt) => attempt.quiz_id === quizId) ?? null;
}

function getAccuracy(attempt) {
  if (!attempt) return null;
  if (attempt.accuracy != null) return Math.round(Number(attempt.accuracy));
  return attempt.total_questions ? Math.round((attempt.score / attempt.total_questions) * 100) : 0;
}

function QuizLibraryCard({ quiz, latestAttempt, deleting, onDelete }) {
  const questionCount = getQuestionCount(quiz);
  const accuracy = getAccuracy(latestAttempt);

  return (
    <CommandCard className="overflow-hidden p-0">
      <div className="grid gap-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              {quiz.subjects?.name ?? "Quiz"}
            </p>
            <h2 className="mt-2 line-clamp-2 text-2xl font-bold leading-tight text-primary">
              {quiz.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-secondary">
              <span className="rounded-full border border-border bg-background/70 px-3 py-1">
                {questionCount} question{questionCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-3 py-1">
                <CalendarClock className="h-3.5 w-3.5 text-button-hover" />
                {formatDate(quiz.created_at)}
              </span>
            </div>
          </div>

          <div className="grid min-w-28 shrink-0 place-items-center rounded-2xl border border-strong-border/60 bg-button/15 p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {accuracy == null ? "--" : `${accuracy}%`}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
              Latest
            </p>
          </div>
        </div>

        {latestAttempt ? (
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-primary">
                Last score: {latestAttempt.score}/{latestAttempt.total_questions}
              </span>
              <span className="text-secondary">{formatDate(latestAttempt.created_at)}</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={accuracy ?? 0} label="Latest accuracy" />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-background/60 p-4 text-sm leading-6 text-secondary">
            No saved attempts yet.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Link
            to={`/quiz/${quiz.id}/start`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-button/20 transition hover:bg-button-hover"
          >
            <Play className="h-4 w-4" />
            Start quiz
          </Link>
          <button
            type="button"
            onClick={() => onDelete(quiz)}
            disabled={deleting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:border-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>
    </CommandCard>
  );
}

export default function Quiz() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [generator, setGenerator] = useState(emptyGenerator);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingQuizId, setDeletingQuizId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [subjectRows, noteRows, quizRows, attemptRows] = await Promise.all([
          getSubjects(user.id),
          getNotes(user.id),
          getQuizzes(user.id),
          getQuizAttempts(user.id, 100),
        ]);

        setSubjects(subjectRows ?? []);
        setNotes(noteRows ?? []);
        setQuizzes(quizRows ?? []);
        setAttempts(attemptRows ?? []);
        setGenerator((current) => ({
          ...current,
          subjectId: current.subjectId || quizRows?.[0]?.subject_id || subjectRows?.[0]?.id || "",
        }));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const subjectNotes = notes.filter((note) => note.subject_id === generator.subjectId);

  const summary = useMemo(() => {
    const totalAttempts = attempts.length;
    const totalQuestions = attempts.reduce((sum, attempt) => sum + Number(attempt.total_questions || 0), 0);
    const totalCorrect = attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0);

    return {
      totalAttempts,
      averageAccuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    };
  }, [attempts]);

  async function handleGenerate(event) {
    event.preventDefault();
    if (!generator.subjectId) return;

    try {
      setGenerating(true);
      setError("");
      setNotice("");
      const sourceNoteIds = generator.noteId
        ? [generator.noteId]
        : subjectNotes.map((note) => note.id);
      const attachmentIds = await getCompletedExtractionAttachmentIds(sourceNoteIds, user.id);
      const generatedQuiz = await generateQuiz({ ...generator, attachmentIds });
      const nextQuiz = {
        ...generatedQuiz,
        quiz_questions: generatedQuiz.quiz_questions ?? [],
      };
      setQuizzes((current) => [nextQuiz, ...current.filter((quiz) => quiz.id !== nextQuiz.id)]);
      setNotice(`${nextQuiz.quiz_questions.length} question quiz generated.`);
    } catch (generateError) {
      setError(generateError.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteQuiz(quiz) {
    const confirmed = window.confirm(`Delete "${quiz.title}"? This also removes its questions and saved attempts.`);
    if (!confirmed) return;

    try {
      setDeletingQuizId(quiz.id);
      setError("");
      setNotice("");
      await deleteQuiz(quiz.id, user.id);
      setQuizzes((current) => current.filter((currentQuiz) => currentQuiz.id !== quiz.id));
      setAttempts((current) => current.filter((attempt) => attempt.quiz_id !== quiz.id));
      setNotice("Quiz deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingQuizId("");
    }
  }

  return (
    <WarRoomShell
      eyebrow="Quiz Library"
      title="Quiz Arena"
      description="Generate note-based quizzes, review saved attempts, and launch focused quiz sessions."
    >
      <div className="grid min-w-0 gap-5">
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
            <p className="text-sm text-secondary">Loading quizzes...</p>
          </CommandCard>
        ) : subjects.length === 0 ? (
          <CommandCard>
            <div className="flex items-start gap-4">
              <BookOpen className="h-5 w-5 text-button-hover" />
              <div>
                <h2 className="text-xl font-bold text-primary">Create a subject first</h2>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  Quizzes need a subject with note content before generation.
                </p>
                <Link
                  to="/subjects"
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-strong-border bg-button px-4 py-2 text-sm font-semibold text-white"
                >
                  Go to Subjects
                </Link>
              </div>
            </div>
          </CommandCard>
        ) : (
          <>
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <CommandCard className="overflow-hidden p-0">
                <form
                  onSubmit={handleGenerate}
                  className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end"
                >
                  <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem]">
                    <FieldLabel label="Subject">
                      <SelectField
                        value={generator.subjectId}
                        onChange={(subjectId) => setGenerator((current) => ({ ...current, subjectId, noteId: "" }))}
                      >
                        <option value="">Choose subject</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                      </SelectField>
                    </FieldLabel>
                    <FieldLabel label="Source Notes">
                      <SelectField
                        value={generator.noteId}
                        onChange={(noteId) => setGenerator((current) => ({ ...current, noteId }))}
                        disabled={!generator.subjectId}
                      >
                        <option value="">All notes in subject</option>
                        {subjectNotes.map((note) => (
                          <option key={note.id} value={note.id}>{note.title}</option>
                        ))}
                      </SelectField>
                    </FieldLabel>
                    <FieldLabel label="Questions">
                      <SelectField
                        value={String(generator.count)}
                        onChange={(count) => setGenerator((current) => ({ ...current, count: Number(count) }))}
                      >
                        {[4, 6, 8, 10, 12].map((count) => (
                          <option key={count} value={count}>{count}</option>
                        ))}
                      </SelectField>
                    </FieldLabel>
                  </div>
                  <button
                    type="submit"
                    disabled={generating || !generator.subjectId}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-button/20 transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
                  >
                    {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generating ? "Generating..." : "Generate quiz"}
                  </button>
                </form>
              </CommandCard>

              <CommandCard>
                <CardHeader eyebrow="Performance" title="Quiz Accuracy" icon={BarChart3} />
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-strong-border/60 bg-button/15 p-5 text-center">
                    <p className="text-5xl font-bold text-primary">{summary.averageAccuracy}%</p>
                    <p className="mt-2 text-sm uppercase tracking-[0.22em] text-muted">
                      Average accuracy
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-secondary">
                    {summary.totalAttempts} saved attempt{summary.totalAttempts === 1 ? "" : "s"}
                  </div>
                </div>
              </CommandCard>
            </section>

            <section className="grid gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Library</p>
                  <h2 className="mt-2 text-2xl font-bold text-primary">Your quizzes</h2>
                </div>
                <p className="text-sm text-secondary">
                  {quizzes.length} quiz{quizzes.length === 1 ? "" : "zes"}
                </p>
              </div>

              {generating && (
                <CommandCard className="grid min-h-48 place-items-center p-8 text-center">
                  <div>
                    <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-button-hover" />
                    <h2 className="mt-4 text-2xl font-bold text-primary">Generating quiz</h2>
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      Building questions first, then generating three wrong answers for each one.
                    </p>
                  </div>
                </CommandCard>
              )}

              {quizzes.length === 0 && !generating ? (
                <CommandCard className="grid min-h-72 place-items-center p-8 text-center">
                  <div>
                    <CircleHelp className="mx-auto h-8 w-8 text-muted" />
                    <h2 className="mt-4 text-2xl font-bold text-primary">No quizzes yet</h2>
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      Generate a quiz from your notes to add it to this arena.
                    </p>
                  </div>
                </CommandCard>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {quizzes.map((quiz) => (
                    <QuizLibraryCard
                      key={quiz.id}
                      quiz={quiz}
                      latestAttempt={getLatestAttempt(quiz.id, attempts)}
                      deleting={deletingQuizId === quiz.id}
                      onDelete={handleDeleteQuiz}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </WarRoomShell>
  );
}
