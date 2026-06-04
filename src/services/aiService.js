import { supabase } from "../lib/supabase";

export async function summarizeNote(noteId, { chunkIds = [], attachmentIds = [] } = {}) {
  const { data, error } = await supabase.functions.invoke("summarize-note", {
    body: { noteId, chunkIds, attachmentIds },
  });

  if (error) {
    throw new Error(error.message || "Could not generate note summary.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.summary) {
    throw new Error("Summary response was empty.");
  }

  return data.summary;
}

export async function generateFlashcards({ subjectId, noteId, setId, count, chunkIds = [], attachmentIds = [] }) {
  const { data, error } = await supabase.functions.invoke("generate-flashcards", {
    body: { subjectId, noteId, setId, count, chunkIds, attachmentIds },
  });

  if (error) {
    throw new Error(error.message || "Could not generate flashcards.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!Array.isArray(data?.flashcards)) {
    throw new Error("Flashcard response was empty.");
  }

  return data.flashcards;
}

export async function generateQuiz({ subjectId, noteId, count, chunkIds = [], attachmentIds = [] }) {
  const { data, error } = await supabase.functions.invoke("generate-quiz", {
    body: { subjectId, noteId, count, chunkIds, attachmentIds },
  });

  if (error) {
    throw new Error(error.message || "Could not generate quiz.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.quiz || !Array.isArray(data.quiz.quiz_questions)) {
    throw new Error("Quiz response was empty.");
  }

  return data.quiz;
}
