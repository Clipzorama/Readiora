import { supabase } from "../lib/supabase";
import { getNotes } from "./notesService";
import { getQuizAccuracySummary } from "./quizService";
import { getStudySessionSummary } from "./sessionsService";
import { getSubjects } from "./subjectsService";

const EMPTY_FLASHCARD_SUMMARY = {
  total: 0,
  mastered: 0,
  learning: 0,
  reviewing: 0,
  new: 0,
  masteryPercent: 0,
};

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildExamDate(subject) {
  if (!subject?.exam_date) return null;

  const timeValue = subject.exam_time || "00:00";
  const candidate = new Date(`${subject.exam_date}T${timeValue}`);

  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function daysUntilExam(subject) {
  const examDate = buildExamDate(subject);
  if (!examDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);

  return Math.ceil((examDate.getTime() - today.getTime()) / 86400000);
}

function getSubjectBucket(map, subjectId) {
  if (!map.has(subjectId)) {
    map.set(subjectId, []);
  }

  return map.get(subjectId);
}

function summarizeFlashcards(flashcards) {
  const summary = flashcards.reduce((current, card) => {
    const status = card.status || "new";
    return {
      ...current,
      [status]: (current[status] ?? 0) + 1,
      total: current.total + 1,
    };
  }, { ...EMPTY_FLASHCARD_SUMMARY });

  return {
    ...summary,
    masteryPercent: summary.total ? clampPercent((summary.mastered / summary.total) * 100) : 0,
  };
}

function summarizeQuizAttempts(attempts) {
  const totalQuestions = attempts.reduce((sum, attempt) => sum + Number(attempt.total_questions || 0), 0);
  const totalCorrect = attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0);

  return {
    attemptsCount: attempts.length,
    averageAccuracy: totalQuestions ? clampPercent((totalCorrect / totalQuestions) * 100) : 0,
  };
}

function summarizeStudySessions(sessions) {
  const totalMinutes = sessions.reduce((sum, session) => sum + Number(session.duration_minutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return {
    totalSessions: sessions.length,
    totalHours,
    consistencyPercent: clampPercent((totalHours / 10) * 100),
  };
}

function buildWeakTopicRows({ subject, flashcards, attempts, readinessScore, notes }) {
  const rows = [];
  const learningCards = flashcards.filter((card) => ["learning", "reviewing", "new"].includes(card.status || "new"));
  const topicStats = new Map();

  attempts.forEach((attempt) => {
    const answers = Array.isArray(attempt.answers) ? attempt.answers : [];

    answers.forEach((answer) => {
      const topic = answer.topicName || answer.topic_name || "Quiz review";
      const current = topicStats.get(topic) ?? { topic, incorrect: 0, total: 0 };
      current.total += 1;
      if (!answer.correct) current.incorrect += 1;
      topicStats.set(topic, current);
    });
  });

  [...topicStats.values()]
    .filter((topic) => topic.total > 0 && topic.incorrect > 0)
    .sort((first, second) => (second.incorrect / second.total) - (first.incorrect / first.total))
    .slice(0, 2)
    .forEach((topic) => {
      rows.push({
        id: `${subject.id}-quiz-${topic.topic}`,
        subjectId: subject.id,
        subjectName: subject.name,
        title: topic.topic,
        detail: `${topic.incorrect}/${topic.total} quiz answer${topic.total === 1 ? "" : "s"} missed`,
        severity: clampPercent((topic.incorrect / topic.total) * 100),
        route: "/quiz",
      });
    });

  if (learningCards.length > 0) {
    rows.push({
      id: `${subject.id}-flashcards`,
      subjectId: subject.id,
      subjectName: subject.name,
      title: "Flashcard recall",
      detail: `${learningCards.length} card${learningCards.length === 1 ? "" : "s"} still need review`,
      severity: clampPercent((learningCards.length / Math.max(flashcards.length, 1)) * 100),
      route: "/flashcards",
    });
  }

  if (notes.length === 0) {
    rows.push({
      id: `${subject.id}-notes`,
      subjectId: subject.id,
      subjectName: subject.name,
      title: "Study material",
      detail: "No notes are linked to this subject yet",
      severity: 72,
      route: "/notes",
    });
  }

  if (readinessScore < 55) {
    rows.push({
      id: `${subject.id}-readiness`,
      subjectId: subject.id,
      subjectName: subject.name,
      title: "Overall readiness",
      detail: `${readinessScore}% readiness needs attention`,
      severity: 100 - readinessScore,
      route: "/sessions",
    });
  }

  return rows;
}

function getExamScore(subject) {
  const remainingDays = daysUntilExam(subject);

  if (remainingDays == null) return 50;
  if (remainingDays < 0) return 100;
  if (remainingDays <= 3) return 35;
  if (remainingDays <= 7) return 55;
  if (remainingDays <= 21) return 80;
  return 100;
}

function buildMissionRows({ subjects, readinessBySubject, weakTopics, flashcardSummary, notes }) {
  const missions = [];
  const weakestSubject = readinessBySubject
    .filter((subject) => subject.signalCount > 0)
    .sort((first, second) => first.readiness - second.readiness)[0];
  const urgentExamSubject = subjects
    .map((subject) => ({ subject, remainingDays: daysUntilExam(subject) }))
    .filter((item) => item.remainingDays != null && item.remainingDays >= 0 && item.remainingDays <= 14)
    .sort((first, second) => first.remainingDays - second.remainingDays)[0];
  const subjectWithoutNotes = subjects.find((subject) => !notes.some((note) => note.subject_id === subject.id));

  if (weakTopics[0]) {
    missions.push({
      id: "weak-topic",
      title: `Repair ${weakTopics[0].title}`,
      detail: `${weakTopics[0].subjectName}: ${weakTopics[0].detail}`,
      route: weakTopics[0].route,
    });
  }

  if (flashcardSummary.total > 0 && flashcardSummary.masteryPercent < 70) {
    missions.push({
      id: "flashcards",
      title: "Review active flashcards",
      detail: `${flashcardSummary.total - flashcardSummary.mastered} card${flashcardSummary.total - flashcardSummary.mastered === 1 ? "" : "s"} are not mastered yet`,
      route: "/flashcards",
    });
  }

  if (urgentExamSubject) {
    missions.push({
      id: "exam",
      title: `Prepare for ${urgentExamSubject.subject.name}`,
      detail: urgentExamSubject.remainingDays === 0
        ? "Exam is today. Run a focused review session."
        : `${urgentExamSubject.remainingDays} day${urgentExamSubject.remainingDays === 1 ? "" : "s"} until the exam`,
      route: "/sessions",
    });
  }

  if (weakestSubject) {
    missions.push({
      id: "readiness",
      title: `Raise ${weakestSubject.subjectName} readiness`,
      detail: `${weakestSubject.readiness}% ready based on flashcards, quizzes, sessions, notes, and exam timing`,
      route: "/sessions",
    });
  }

  if (subjectWithoutNotes) {
    missions.push({
      id: "notes",
      title: `Add notes for ${subjectWithoutNotes.name}`,
      detail: "Readiness improves when the subject has source material for quizzes and flashcards.",
      route: "/notes",
    });
  }

  return missions.slice(0, 4);
}

export async function getDashboardIntelligence(userId) {
  const [
    subjects,
    notes,
    studySessionSummary,
    quizAccuracy,
    { data: flashcards, error: flashcardError },
    { data: quizAttempts, error: quizAttemptError },
    { data: studySessions, error: studySessionError },
  ] = await Promise.all([
    getSubjects(userId),
    getNotes(userId),
    getStudySessionSummary(userId),
    getQuizAccuracySummary(userId),
    supabase
      .from("flashcards")
      .select("id, subject_id, set_id, status, difficulty")
      .eq("user_id", userId)
      .not("set_id", "is", null),
    supabase
      .from("quiz_attempts")
      .select("id, subject_id, score, total_questions, accuracy, answers, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("study_sessions")
      .select("id, subject_id, duration_minutes, completed, started_at, ended_at")
      .eq("user_id", userId)
      .eq("completed", true),
  ]);

  if (flashcardError) throw flashcardError;
  if (quizAttemptError) throw quizAttemptError;
  if (studySessionError) throw studySessionError;

  const flashcardRows = flashcards ?? [];
  const quizAttemptRows = quizAttempts ?? [];
  const studySessionRows = studySessions ?? [];
  const flashcardsBySubject = new Map();
  const attemptsBySubject = new Map();
  const sessionsBySubject = new Map();
  const notesBySubject = new Map();

  flashcardRows.forEach((card) => getSubjectBucket(flashcardsBySubject, card.subject_id).push(card));
  quizAttemptRows.forEach((attempt) => getSubjectBucket(attemptsBySubject, attempt.subject_id).push(attempt));
  studySessionRows.forEach((session) => getSubjectBucket(sessionsBySubject, session.subject_id).push(session));
  (notes ?? []).forEach((note) => getSubjectBucket(notesBySubject, note.subject_id).push(note));

  const readinessBySubject = (subjects ?? []).map((subject) => {
    const subjectFlashcards = flashcardsBySubject.get(subject.id) ?? [];
    const subjectAttempts = attemptsBySubject.get(subject.id) ?? [];
    const subjectSessions = sessionsBySubject.get(subject.id) ?? [];
    const subjectNotes = notesBySubject.get(subject.id) ?? [];
    const flashcardSummary = summarizeFlashcards(subjectFlashcards);
    const quizSummary = summarizeQuizAttempts(subjectAttempts);
    const studySummary = summarizeStudySessions(subjectSessions);
    const noteScore = subjectNotes.length > 0 ? 100 : 0;
    const examScore = getExamScore(subject);
    const weaknessPenalty = subjectAttempts.some((attempt) => {
      const answers = Array.isArray(attempt.answers) ? attempt.answers : [];
      return answers.some((answer) => answer && answer.correct === false);
    }) || subjectFlashcards.some((card) => ["learning", "reviewing"].includes(card.status || "new"))
      ? 10
      : 0;
    const signalCount = [
      subjectFlashcards.length > 0,
      subjectAttempts.length > 0,
      subjectSessions.length > 0,
      subjectNotes.length > 0,
      Boolean(subject.exam_date),
    ].filter(Boolean).length;
    const readiness = signalCount === 0
      ? 0
      : clampPercent(
        flashcardSummary.masteryPercent * 0.3
        + quizSummary.averageAccuracy * 0.3
        + studySummary.consistencyPercent * 0.2
        + noteScore * 0.1
        + examScore * 0.1
        - weaknessPenalty,
      );

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      readiness,
      signalCount,
      flashcardMastery: flashcardSummary.masteryPercent,
      quizAccuracy: quizSummary.averageAccuracy,
      studyHours: studySummary.totalHours,
      noteCount: subjectNotes.length,
      examDaysRemaining: daysUntilExam(subject),
      weakTopics: buildWeakTopicRows({
        subject,
        flashcards: subjectFlashcards,
        attempts: subjectAttempts,
        readinessScore: readiness,
        notes: subjectNotes,
      }),
    };
  });

  const weakTopics = readinessBySubject
    .flatMap((subject) => subject.weakTopics)
    .sort((first, second) => second.severity - first.severity)
    .slice(0, 8);
  const flashcardSummary = summarizeFlashcards(flashcardRows);
  const studyMissions = buildMissionRows({
    subjects: subjects ?? [],
    readinessBySubject,
    weakTopics,
    flashcardSummary,
    notes: notes ?? [],
  });

  return {
    subjects: subjects ?? [],
    notes: notes ?? [],
    quizAccuracy,
    studySessionSummary,
    flashcardSummary,
    readinessBySubject,
    weakTopics,
    studyMissions,
  };
}
