import { supabase } from "../lib/supabase";

const flashcardSelect = `
  *,
  subjects (
    id,
    name,
    color
  ),
  notes (
    id,
    title
  )
`;

function normalizeDifficulty(value) {
  return ["easy", "medium", "hard"].includes(value) ? value : "medium";
}

function normalizeStatus(value) {
  return ["new", "learning", "reviewing", "mastered"].includes(value) ? value : "new";
}

export async function getFlashcards(userId) {
  const { data, error } = await supabase
    .from("flashcards")
    .select(flashcardSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createFlashcard({
  userId,
  subjectId,
  noteId,
  question,
  answer,
  difficulty,
  status,
}) {
  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      user_id: userId,
      subject_id: subjectId,
      note_id: noteId || null,
      question: question.trim(),
      answer: answer.trim(),
      difficulty: normalizeDifficulty(difficulty),
      status: normalizeStatus(status),
    })
    .select(flashcardSelect)
    .single();

  if (error) throw error;
  return data;
}

export async function updateFlashcard(flashcardId, updates) {
  const payload = {};

  if (updates.subjectId) payload.subject_id = updates.subjectId;
  if ("noteId" in updates) payload.note_id = updates.noteId || null;
  if ("question" in updates) payload.question = updates.question.trim();
  if ("answer" in updates) payload.answer = updates.answer.trim();
  if ("difficulty" in updates) payload.difficulty = normalizeDifficulty(updates.difficulty);
  if ("status" in updates) payload.status = normalizeStatus(updates.status);
  if ("nextReviewAt" in updates) payload.next_review_at = updates.nextReviewAt || null;

  let query = supabase
    .from("flashcards")
    .update(payload)
    .eq("id", flashcardId);

  // adding extra protection for flashcards
  if (updates.userId) {
    query = query.eq("user_id", updates.userId);
  }

  const { data, error } = await query
    .select(flashcardSelect)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFlashcard(flashcardId, userId) {
  let query = supabase
    .from("flashcards")
    .delete()
    .eq("id", flashcardId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  if (error) throw error;
}
