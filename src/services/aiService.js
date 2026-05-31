import { supabase } from "../lib/supabase";

export async function summarizeNote(noteId) {
  const { data, error } = await supabase.functions.invoke("summarize-note", {
    body: { noteId },
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

export async function generateFlashcards({ subjectId, noteId, setId, count }) {
  const { data, error } = await supabase.functions.invoke("generate-flashcards", {
    body: { subjectId, noteId, setId, count },
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
