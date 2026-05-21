import { supabase } from "../lib/supabase";

export const NOTE_ATTACHMENTS_BUCKET = "note-attachments";
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_SIZE_LABEL = "10MB";

const SUPPORTED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isSupportedAttachment(file) {
  return SUPPORTED_ATTACHMENT_TYPES.has(file.type);
}

export function isWithinAttachmentSizeLimit(file) {
  return file.size <= MAX_ATTACHMENT_SIZE_BYTES;
}

export function validateNoteAttachment(file) {
  if (!isSupportedAttachment(file)) {
    throw new Error("Only PDF, JPG, PNG, and WEBP files are supported.");
  }

  if (!isWithinAttachmentSizeLimit(file)) {
    throw new Error(`Maximum upload size is ${MAX_ATTACHMENT_SIZE_LABEL}`);
  }
}

function safeFileName(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function getNoteAttachments(noteId, userId) {
  if (!noteId || !userId) return [];

  const { data, error } = await supabase
    .from("note_attachments")
    .select("*")
    .eq("note_id", noteId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createAttachmentSignedUrl(filePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(NOTE_ATTACHMENTS_BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error) throw error;
  return data?.signedUrl ?? "";
}

export async function uploadNoteAttachment({ file, noteId, userId }) {
  validateNoteAttachment(file);

  const cleanName = safeFileName(file.name) || "attachment";
  const filePath = `${userId}/${noteId}/${crypto.randomUUID()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from(NOTE_ATTACHMENTS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("note_attachments")
    .insert({
      note_id: noteId,
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      storage_bucket: NOTE_ATTACHMENTS_BUCKET,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(NOTE_ATTACHMENTS_BUCKET).remove([filePath]);
    throw error;
  }

  return data;
}

export async function deleteNoteAttachment(attachment, userId) {
  const { error: deleteRowError } = await supabase
    .from("note_attachments")
    .delete()
    .eq("id", attachment.id)
    .eq("user_id", userId);

  if (deleteRowError) throw deleteRowError;

  const { error: deleteFileError } = await supabase.storage
    .from(NOTE_ATTACHMENTS_BUCKET)
    .remove([attachment.file_path]);

  if (deleteFileError) throw deleteFileError;
}
