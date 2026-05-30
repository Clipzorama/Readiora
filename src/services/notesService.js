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
      ),
      note_attachments (
        id,
        file_type,
        file_size
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

export async function getSummarizedNotes(userId) {
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
    .eq("ai_summary_status", "completed")
    .not("ai_summary", "is", null)
    .order("ai_summary_generated_at", { ascending: false, nullsFirst: false });

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
      ),
      note_attachments (
        id,
        file_type,
        file_size
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
    .select(`
      *,
      subjects (
        id,
        name,
        color
      ),
      note_attachments (
        id,
        file_type,
        file_size
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateNote(noteId, updates) {
  const payload = {
    title: updates.title,
    content: updates.content,
    updated_at: new Date().toISOString(),
  };

  if (updates.subjectId) {
    payload.subject_id = updates.subjectId;
  }

  let query = supabase
    .from("notes")
    .update(payload)
    .eq("id", noteId);

  if (updates.userId) {
    query = query.eq("user_id", updates.userId);
  }

  const { data, error } = await query
    .select(`
      *,
      subjects (
        id,
        name,
        color
      ),
      note_attachments (
        id,
        file_type,
        file_size
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNotesBySubject(subjectId, userId) {
  let query = supabase
    .from("notes")
    .delete()
    .eq("subject_id", subjectId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  if (error) throw error;
}

export async function deleteNote(noteId, userId) {
  let query = supabase
    .from("notes")
    .delete()
    .eq("id", noteId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  if (error) throw error;
}
