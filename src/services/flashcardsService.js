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
  ),
  flashcard_sets (
    id,
    title
  )
`;

const flashcardSetSelect = `
  *,
  subjects (
    id,
    name,
    color
  ),
  flashcards (
    id,
    status
  )
`;

function normalizeDifficulty(value) {
  return ["easy", "medium", "hard"].includes(value) ? value : "medium";
}

function normalizeStatus(value) {
  return ["new", "learning", "reviewing", "mastered"].includes(value) ? value : "new";
}

function normalizeSource(value) {
  return ["manual", "generated", "mixed"].includes(value) ? value : "manual";
}

export async function getFlashcardSets(userId) {
  const { data, error } = await supabase
    .from("flashcard_sets")
    .select(flashcardSetSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createFlashcardSet({
  userId,
  subjectId,
  title,
  description,
  source = "manual",
}) {
  const { data, error } = await supabase
    .from("flashcard_sets")
    .insert({
      user_id: userId,
      subject_id: subjectId || null,
      title: title.trim(),
      description: description?.trim() || null,
      source: normalizeSource(source),
    })
    .select(flashcardSetSelect)
    .single();

  if (error) throw error;
  return data;
}

export async function updateFlashcardSet(setId, updates) {
  const payload = {};

  if ("subjectId" in updates) payload.subject_id = updates.subjectId || null;
  if ("title" in updates) payload.title = updates.title.trim();
  if ("description" in updates) payload.description = updates.description?.trim() || null;
  if ("source" in updates) payload.source = normalizeSource(updates.source);

  let query = supabase
    .from("flashcard_sets")
    .update(payload)
    .eq("id", setId);

  if (updates.userId) {
    query = query.eq("user_id", updates.userId);
  }

  const { data, error } = await query
    .select(flashcardSetSelect)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFlashcardSet(setId, userId) {
  let query = supabase
    .from("flashcard_sets")
    .delete()
    .eq("id", setId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  if (error) throw error;
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
  setId,
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
      set_id: setId || null,
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
  if ("setId" in updates) payload.set_id = updates.setId || null;
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
