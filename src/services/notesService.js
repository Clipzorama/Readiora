import { supabase } from "../lib/supabase";

export async function getNotes(userId) {
  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      subjects (
        id,
        name,
        color
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getNotesBySubject(userId, subjectId) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getNoteById(noteId) {
  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      subjects (
        id,
        name,
        color
      )
    `)
    .eq("id", noteId)
    .single();

  if (error) throw error;
  return data;
}

export async function createNote({ userId, subjectId, title, content }) {
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      subject_id: subjectId,
      title,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNote(noteId, updates) {
  const { data, error } = await supabase
    .from("notes")
    .update({
      title: updates.title,
      content: updates.content,
      ai_summary: updates.aiSummary,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNote(noteId) {
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId);

  if (error) throw error;
}