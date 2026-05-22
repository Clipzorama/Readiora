import { supabase } from "../lib/supabase";

export async function getSubjects(userId) {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSubjectById(subjectId) {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .single();

  if (error) throw error;
  return data;
}

export async function createSubject({ userId, name, description, examDate, color }) {
  const { data, error } = await supabase
    .from("subjects")
    .insert({
      user_id: userId,
      name,
      description,
      exam_date: examDate || null,
      color: color || "#0ea5c8",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSubject(subjectId, updates) {
  let query = supabase
    .from("subjects")
    .update({
      name: updates.name,
      description: updates.description,
      exam_date: updates.examDate || null,
      color: updates.color,
    })
    .eq("id", subjectId);

  if (updates.userId) {
    query = query.eq("user_id", updates.userId);
  }

  const { data, error } = await query
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSubject(subjectId, userId) {
  let query = supabase
    .from("subjects")
    .delete()
    .eq("id", subjectId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  if (error) throw error;
}
