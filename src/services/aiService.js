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
