export function formatUpdated(note) {
  const value = note?.updated_at ?? note?.created_at;
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function fileKind(type) {
  if (type?.startsWith("image/")) return "Image";
  if (type === "application/pdf") return "PDF";
  return "File";
}

export function getNoteAttachmentStats(note) {
  const noteAttachments = note?.note_attachments ?? [];

  return {
    count: noteAttachments.length,
    pdfCount: noteAttachments.filter((item) => item.file_type === "application/pdf").length,
    imageCount: noteAttachments.filter((item) => item.file_type?.startsWith("image/")).length,
    hasMarkdown: Boolean(note?.content?.trim()),
  };
}
