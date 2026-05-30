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

export function renderInline(text) {
  const parts = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith("**")) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(
        <code key={key} className="rounded-md border border-border bg-background/80 px-1.5 py-0.5 text-sm text-primary">
          {token.slice(1, -1)}
        </code>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
