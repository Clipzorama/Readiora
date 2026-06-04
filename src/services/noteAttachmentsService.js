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

const EXTENSION_TO_ATTACHMENT_TYPE = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function getSupportedAttachmentType(file) {
  if (SUPPORTED_ATTACHMENT_TYPES.has(file.type)) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();
  const matchedExtension = Object.keys(EXTENSION_TO_ATTACHMENT_TYPE)
    .find((extension) => lowerName.endsWith(extension));

  return matchedExtension ? EXTENSION_TO_ATTACHMENT_TYPE[matchedExtension] : "";
}

export function isSupportedAttachment(file) {
  return Boolean(getSupportedAttachmentType(file));
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

export async function getAttachmentExtractions(noteId, userId) {
  if (!noteId || !userId) return [];

  const { data, error } = await supabase
    .from("attachment_extractions")
    .select("*")
    .eq("note_id", noteId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAttachmentExtraction(attachmentId, userId) {
  if (!attachmentId || !userId) return null;

  const { data, error } = await supabase
    .from("attachment_extractions")
    .select("*")
    .eq("attachment_id", attachmentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getDocumentChunks(attachmentId, userId, limit = 8) {
  if (!attachmentId || !userId) return [];

  const { data, error } = await supabase
    .from("document_chunks")
    .select("*")
    .eq("attachment_id", attachmentId)
    .eq("user_id", userId)
    .order("page_number", { ascending: true, nullsFirst: false })
    .order("chunk_index", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getCompletedExtractionAttachmentIds(noteIds, userId) {
  const ids = Array.isArray(noteIds)
    ? noteIds.filter((noteId) => typeof noteId === "string" && noteId.length > 0)
    : [];

  if (!ids.length || !userId) return [];

  const { data, error } = await supabase
    .from("attachment_extractions")
    .select("attachment_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("note_id", ids);

  if (error) throw error;

  return [...new Set(
    (data ?? [])
      .map((row) => row.attachment_id)
      .filter((attachmentId) => typeof attachmentId === "string" && attachmentId.length > 0),
  )];
}

export async function extractNoteAttachment(attachmentId) {
  const { data, error } = await supabase.functions.invoke("extract-attachment-text", {
    body: { attachmentId },
  });

  if (error) {
    const functionError = await readFunctionError(error);
    throw new Error(functionError || error.message || "Could not extract attachment text.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.extraction) {
    throw new Error("Extraction response was empty.");
  }

  return data;
}

async function readFunctionError(error) {
  const context = error?.context;

  if (!context || typeof context.json !== "function") {
    return "";
  }

  try {
    const response = typeof context.clone === "function" ? context.clone() : context;
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : "";
  } catch {
    return "";
  }
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

  const attachmentType = getSupportedAttachmentType(file);
  const cleanName = safeFileName(file.name) || "attachment";
  const filePath = `${userId}/${noteId}/${crypto.randomUUID()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from(NOTE_ATTACHMENTS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: attachmentType,
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
      file_type: attachmentType,
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
