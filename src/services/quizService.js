import { supabase } from "../lib/supabase";

const quizSelect = `
  *,
  subjects (
    id,
    name,
    color
  ),
  quiz_questions (
    id,
    question,
    choices,
    correct_answer,
    explanation,
    topic_name,
    question_order,
    difficulty,
    source_note_id
  )
`;

const attemptSelect = `
  *,
  quizzes (
    id,
    title,
    subject_id,
    subjects (
      id,
      name,
      color
    )
  )
`;

function sortQuizQuestions(quiz) {
  return {
    ...quiz,
    quiz_questions: [...(quiz.quiz_questions ?? [])].sort((first, second) => {
      const firstOrder = first.question_order ?? 0;
      const secondOrder = second.question_order ?? 0;
      return firstOrder - secondOrder;
    }),
  };
}

export async function getQuizzes(userId) {
  const { data, error } = await supabase
    .from("quizzes")
    .select(quizSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(sortQuizQuestions);
}

export async function getQuizById(quizId, userId) {
  let query = supabase
    .from("quizzes")
    .select(quizSelect)
    .eq("id", quizId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.single();

  if (error) throw error;
  return sortQuizQuestions(data);
}

export async function saveQuizAttempt({
  userId,
  quizId,
  subjectId,
  score,
  totalQuestions,
  answers,
}) {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: userId,
      quiz_id: quizId,
      subject_id: subjectId || null,
      score,
      total_questions: totalQuestions,
      answers: answers ?? [],
      completed_at: new Date().toISOString(),
    })
    .select(attemptSelect)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteQuiz(quizId, userId) {
  let query = supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  if (error) throw error;
}

export async function getQuizAttempts(userId, limit = 10) {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(attemptSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getQuizAccuracySummary(userId) {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("score, total_questions, accuracy, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const attempts = data ?? [];
  const totalQuestions = attempts.reduce((sum, attempt) => sum + Number(attempt.total_questions || 0), 0);
  const totalCorrect = attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0);
  const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    attemptsCount: attempts.length,
    averageAccuracy,
    latestAccuracy: attempts[0]?.accuracy == null ? null : Math.round(Number(attempts[0].accuracy)),
  };
}
