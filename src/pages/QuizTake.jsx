import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LogOut,
  RotateCcw,
  XCircle,
} from "lucide-react";
import AIContentRenderer from "../components/AIContentRenderer";
import { ProgressBar } from "../components/WarRoomLayout";
import { useAuth } from "../hooks/useAuth";
import {
  getQuizById,
  saveQuizAttempt,
} from "../services/quizService";

const shellVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

const MINIMUM_QUIZ_LOADING_MS = 1500;

const panelVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: "easeOut" } },
};

const questionVariants = {
  enter: { opacity: 0, x: 28, scale: 0.985 },
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.28, ease: "easeOut" } },
  exit: { opacity: 0, x: -24, scale: 0.985, transition: { duration: 0.18, ease: "easeIn" } },
};

const optionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.035, duration: 0.22, ease: "easeOut" },
  }),
};

const quizQuestionComponents = {
  p: ({ children }) => (
    <p className="my-3 wrap-break-word text-xl font-bold leading-snug text-primary first:mt-0 last:mb-0 sm:text-3xl">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 list-disc space-y-2 pl-6 text-lg font-semibold leading-snug text-primary sm:text-2xl">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 text-lg font-semibold leading-snug text-primary sm:text-2xl">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-snug">{children}</li>,
};

const quizChoiceComponents = {
  p: ({ children }) => (
    <p className="my-0 wrap-break-word leading-6 text-current">{children}</p>
  ),
};

const quizExplanationComponents = {
  p: ({ children }) => (
    <p className="my-2 wrap-break-word text-sm leading-6 text-secondary first:mt-0 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-secondary">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-secondary">{children}</ol>
  ),
};

function getChoices(question) {
  return Array.isArray(question?.choices)
    ? question.choices.filter((choice) => typeof choice === "string" && choice.trim())
    : [];
}

function getAnswerRows(quiz, answers) {
  return (quiz?.quiz_questions ?? []).map((question) => {
    const selectedAnswer = answers[question.id]?.selectedAnswer ?? "";
    return {
      questionId: question.id,
      question: question.question,
      selectedAnswer,
      correctAnswer: question.correct_answer,
      correct: selectedAnswer === question.correct_answer,
      topicName: question.topic_name,
      explanation: question.explanation,
    };
  });
}

function formatElapsed(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function FullscreenState({ title, detail, children }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-4 text-primary">
      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-xl rounded-3xl border border-border bg-card/80 p-6 text-center shadow-2xl shadow-black/30"
      >
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-secondary">{detail}</p>
        {children && <div className="mt-5">{children}</div>}
      </motion.div>
    </main>
  );
}

export default function QuizTake() {
  const { user } = useAuth();
  const { quizId } = useParams();
  const navigate = useNavigate();
  const savedRef = useRef(false);
  const [quiz, setQuiz] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savedAttempt, setSavedAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !quizId) return;

    let cancelled = false;

    async function loadQuiz() {
      const loadingStartedAt = Date.now();

      try {
        setLoading(true);
        setError("");
        const quizRow = await getQuizById(quizId, user.id);
        if (!cancelled) {
          setQuiz(quizRow);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        const elapsed = Date.now() - loadingStartedAt;
        const remainingDelay = Math.max(0, MINIMUM_QUIZ_LOADING_MS - elapsed);

        await new Promise((resolve) => {
          window.setTimeout(resolve, remainingDelay);
        });

        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuiz();

    return () => {
      cancelled = true;
    };
  }, [quizId, user]);

  useEffect(() => {
    if (loading || !quiz || savedAttempt) return undefined;

    const timerId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [loading, quiz, savedAttempt]);

  const questions = quiz?.quiz_questions ?? [];
  const currentQuestion = questions[questionIndex] ?? null;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const complete = totalQuestions > 0 && answeredCount >= totalQuestions;
  const answerRows = useMemo(() => getAnswerRows(quiz, answers), [answers, quiz]);
  const score = answerRows.filter((row) => row.correct).length;
  const accuracy = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
  const progress = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const currentAnswered = Boolean(currentAnswer);
  const currentCorrect = currentAnswer?.selectedAnswer === currentQuestion?.correct_answer;

  useEffect(() => {
    if (!complete || !quiz || savedRef.current) return;

    async function persistAttempt() {
      try {
        savedRef.current = true;
        setSavingAttempt(true);
        const saved = await saveQuizAttempt({
          userId: user.id,
          quizId: quiz.id,
          subjectId: quiz.subject_id,
          score,
          totalQuestions,
          answers: answerRows,
        });
        setSavedAttempt(saved);
      } catch (saveError) {
        savedRef.current = false;
        setError(saveError.message);
      } finally {
        setSavingAttempt(false);
      }
    }

    persistAttempt();
  }, [answerRows, complete, quiz, score, totalQuestions, user?.id]);

  function handleAnswer(choice) {
    if (!currentQuestion || answers[currentQuestion.id]) return;

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: {
        selectedAnswer: choice,
        answeredAt: new Date().toISOString(),
      },
    }));
  }

  function restartQuiz() {
    savedRef.current = false;
    setAnswers({});
    setQuestionIndex(0);
    setElapsedSeconds(0);
    setSavedAttempt(null);
    setError("");
  }

  function exitToArena() {
    navigate("/quiz");
  }

  if (loading) {
    return (
      <FullscreenState title="Loading quiz" detail="Preparing your quiz session.">
        <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-button-hover" />
      </FullscreenState>
    );
  }

  if (error || !quiz) {
    return (
      <FullscreenState
        title="Quiz unavailable"
        detail={error || "This quiz was not found or is not available for your account."}
      >
        <Link
          to="/quiz"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-strong-border bg-button px-5 py-2 text-sm font-semibold text-white"
        >
          Back to Quiz Arena
        </Link>
      </FullscreenState>
    );
  }

  if (totalQuestions === 0) {
    return (
      <FullscreenState
        title="Quiz has no questions"
        detail="This quiz cannot be started until it has saved questions."
      >
        <Link
          to="/quiz"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-strong-border bg-button px-5 py-2 text-sm font-semibold text-white"
        >
          Back to Quiz Arena
        </Link>
      </FullscreenState>
    );
  }

  if (complete) {
    return (
      <motion.main
        variants={shellVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen overflow-x-clip bg-background p-3 text-primary sm:p-5"
      >
        <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-5xl content-center gap-5 sm:min-h-[calc(100vh-2.5rem)]">
          <motion.section
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            className="rounded-3xl border border-strong-border/70 bg-card/85 p-5 shadow-2xl shadow-black/30 sm:p-8"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Quiz Complete</p>
                <h1 className="mt-3 text-3xl font-bold text-primary sm:text-5xl">
                  {accuracy}% accuracy
                </h1>
                <p className="mt-3 text-sm leading-6 text-secondary">
                  {savingAttempt
                    ? "Saving your attempt..."
                    : savedAttempt
                      ? "Attempt saved. Quiz Arena will show the updated score."
                      : "Your results are ready."}
                </p>
              </div>
              <div className="grid gap-2 rounded-2xl border border-border bg-background/70 p-4 text-sm text-secondary">
                <span>Score: {score}/{totalQuestions}</span>
                <span>Time: {formatElapsed(elapsedSeconds)}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {answerRows.map((row, index) => (
                <motion.div
                  key={row.questionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="rounded-2xl border border-border bg-background/60 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                        row.correct
                          ? "border-success/40 bg-success/15 text-success"
                          : "border-danger/40 bg-danger/15 text-danger"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <AIContentRenderer
                        className="text-sm font-semibold leading-6 text-primary [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:pb-2"
                        components={quizChoiceComponents}
                      >
                        {row.question}
                      </AIContentRenderer>
                      <p className="mt-2 text-xs leading-5 text-secondary">
                        Your answer:
                      </p>
                      <AIContentRenderer
                        className="mt-1 text-xs leading-5 text-secondary [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:pb-2"
                        components={quizChoiceComponents}
                      >
                        {row.selectedAnswer || "No answer"}
                      </AIContentRenderer>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <motion.button
                type="button"
                onClick={restartQuiz}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-5 py-2 text-sm font-semibold text-secondary transition hover:border-strong-border hover:text-primary"
              >
                <RotateCcw className="h-4 w-4" />
                Retake
              </motion.button>
              <motion.button
                type="button"
                onClick={exitToArena}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-5 py-2 text-sm font-semibold text-white transition hover:bg-button-hover"
              >
                Back to Quiz Arena
              </motion.button>
            </div>
          </motion.section>
        </div>
      </motion.main>
    );
  }

  const choices = getChoices(currentQuestion);

  return (
    <motion.main
      variants={shellVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen overflow-x-clip bg-background text-primary"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 18, 0], y: [0, 12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-24 -top-40 h-80 w-80 rounded-full bg-button/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -16, 0], y: [0, 18, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-32 top-24 h-96 w-96 rounded-full bg-button-hover/10 blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.025)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.025)_1px,transparent_1px)] bg-size-[44px_44px]" />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-rows-[auto_1fr_auto] gap-4 p-3 sm:p-5">
        <motion.header
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="rounded-3xl border border-border bg-card/85 p-4 shadow-xl shadow-black/25 backdrop-blur-xl"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                {quiz.subjects?.name ?? "Quiz Session"}
              </p>
              <h1 className="mt-2 truncate text-2xl font-bold text-primary sm:text-3xl">
                {quiz.title}
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm sm:min-w-96">
              <div className="rounded-2xl border border-border bg-background/70 p-3">
                <p className="font-bold text-primary">{questionIndex + 1}/{totalQuestions}</p>
                <p className="mt-1 text-xs text-muted">Question</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-3">
                <p className="font-bold text-primary">{score}/{answeredCount || 0}</p>
                <p className="mt-1 text-xs text-muted">Score</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-3">
                <p className="inline-flex items-center justify-center gap-1 font-bold text-primary">
                  <Clock3 className="h-3.5 w-3.5 text-button-hover" />
                  {formatElapsed(elapsedSeconds)}
                </p>
                <p className="mt-1 text-xs text-muted">Elapsed</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={progress} label="Answered" />
          </div>
        </motion.header>

        <section className="grid content-center gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              variants={questionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="rounded-3xl border border-strong-border/70 bg-card/85 p-4 shadow-2xl shadow-black/30 sm:p-7"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Question {questionIndex + 1}
                </p>
                <AnimatePresence>
                  {currentAnswered && (
                    <motion.span
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold ${
                        currentCorrect
                          ? "border-success/40 bg-success/15 text-success"
                          : "border-danger/40 bg-danger/15 text-danger"
                      }`}
                    >
                      {currentCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {currentCorrect ? "Correct" : "Wrong"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <AIContentRenderer
                className="mt-5 text-primary [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:pb-2"
                components={quizQuestionComponents}
              >
                {currentQuestion.question}
              </AIContentRenderer>

              <div className="mt-6 grid gap-3">
                {choices.map((choice, index) => {
                  const selected = currentAnswer?.selectedAnswer === choice;
                  const correctChoice = choice === currentQuestion.correct_answer;
                  const tone = currentAnswered && correctChoice
                    ? "border-success/60 bg-success/15 text-success"
                    : currentAnswered && selected && !correctChoice
                      ? "border-danger/60 bg-danger/15 text-danger"
                      : selected
                        ? "border-strong-border bg-button/20 text-primary"
                        : "border-border bg-background/65 text-secondary hover:border-strong-border hover:text-primary";

                  return (
                    <motion.button
                      key={choice}
                      type="button"
                      custom={index}
                      variants={optionVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={currentAnswered ? undefined : { y: -2, scale: 1.006 }}
                      whileTap={currentAnswered ? undefined : { scale: 0.985 }}
                      onClick={() => handleAnswer(choice)}
                      disabled={currentAnswered}
                      className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-sm font-semibold leading-6 transition disabled:cursor-default sm:text-base ${tone}`}
                    >
                      <AIContentRenderer
                        className="text-current [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:pb-2"
                        components={quizChoiceComponents}
                      >
                        {choice}
                      </AIContentRenderer>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {currentAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 14, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: 8, height: 0 }}
                    className={`mt-6 overflow-hidden rounded-2xl border p-4 ${
                      currentCorrect
                        ? "border-success/35 bg-success/10"
                        : "border-warning/35 bg-warning/10"
                    }`}
                  >
                    <p className="text-sm font-bold text-primary">
                      {currentCorrect ? "You got it right." : "Correct answer"}
                    </p>
                    {!currentCorrect && (
                      <p className="mt-2 text-sm font-semibold text-primary">
                        {currentQuestion.correct_answer}
                      </p>
                    )}
                    <AIContentRenderer
                      className="mt-3 text-sm leading-6 text-secondary [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:pb-2"
                      components={quizExplanationComponents}
                    >
                      {currentQuestion.explanation}
                    </AIContentRenderer>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </section>

        <motion.footer
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 rounded-3xl border border-border bg-card/85 p-3 shadow-xl shadow-black/25 backdrop-blur-xl sm:grid-cols-[auto_1fr_auto_auto] sm:items-center"
        >
          <motion.button
            type="button"
            onClick={exitToArena}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-danger/35 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:border-danger"
          >
            <LogOut className="h-4 w-4" />
            Exit
          </motion.button>
          <div className="hidden sm:block" />
          <motion.button
            type="button"
            onClick={() => setQuestionIndex((current) => Math.max(current - 1, 0))}
            disabled={questionIndex === 0}
            whileHover={questionIndex === 0 ? undefined : { y: -1 }}
            whileTap={questionIndex === 0 ? undefined : { scale: 0.98 }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-4 py-2 text-sm font-semibold text-secondary transition hover:border-strong-border hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setQuestionIndex((current) => Math.min(current + 1, totalQuestions - 1))}
            disabled={questionIndex >= totalQuestions - 1}
            whileHover={questionIndex >= totalQuestions - 1 ? undefined : { y: -1 }}
            whileTap={questionIndex >= totalQuestions - 1 ? undefined : { scale: 0.98 }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-4 py-2 text-sm font-semibold text-white transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.footer>
      </div>
    </motion.main>
  );
}
