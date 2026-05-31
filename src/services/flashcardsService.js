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

const setSelect = `
  *,
  subjects (
    id,
    name,
    color
  ),
  flashcards (
    id,
    status,
    created_at
  )
`;

function normalizeStatus(value) {
  return ["new", "learning", "reviewing", "mastered"].includes(value) ? value : "new";
}

function normalizeSource(value) {
  return ["manual", "generated", "mixed"].includes(value) ? value : "manual";
}

export async function getFlashcardSets(userId) {
  const { data, error } = await supabase
    .from("flashcard_sets")
    .select(setSelect)
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
    .select(setSelect)
    .single();

  if (error) throw error;
  return data;
}

export async function getFlashcards(userId) {
  const { data, error } = await supabase
    .from("flashcards")
    .select(flashcardSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getFlashcardsBySet(userId, setId) {
  const { data, error } = await supabase
    .from("flashcards")
    .select(flashcardSelect)
    .eq("user_id", userId)
    .eq("set_id", setId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createFlashcard({
  userId,
  setId,
  subjectId,
  noteId,
  question,
  answer,
  status,
}) {
  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      user_id: userId,
      set_id: setId,
      subject_id: subjectId,
      note_id: noteId || null,
      question: question.trim(),
      answer: answer.trim(),
      difficulty: "medium",
      status: normalizeStatus(status),
    })
    .select(flashcardSelect)
    .single();

  if (error) throw error;
  return data;
}

export async function updateFlashcard(flashcardId, updates) {
  const payload = {};

  if ("setId" in updates) payload.set_id = updates.setId || null;
  if (updates.subjectId) payload.subject_id = updates.subjectId;
  if ("noteId" in updates) payload.note_id = updates.noteId || null;
  if ("question" in updates) payload.question = updates.question.trim();
  if ("answer" in updates) payload.answer = updates.answer.trim();
  if ("status" in updates) payload.status = normalizeStatus(updates.status);
  if ("nextReviewAt" in updates) payload.next_review_at = updates.nextReviewAt || null;

  let query = supabase
    .from("flashcards")
    .update(payload)
    .eq("id", flashcardId);

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
