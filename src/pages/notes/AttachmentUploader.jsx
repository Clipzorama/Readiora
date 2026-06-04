import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  File,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  ScanText,
  UploadCloud,
  X,
} from "lucide-react";
import {
  CardHeader,
  CommandCard,
} from "../../components/WarRoomLayout";
import { MAX_ATTACHMENT_SIZE_LABEL } from "../../services/noteAttachmentsService";
import { fileKind, formatFileSize, formatUpdated } from "./noteUtils";

function getExtractionStatus(extraction) {
  if (!extraction) {
    return {
      label: "Needs AI scan",
      detail: "Xevaro will prepare this source for summaries, flashcards, and quizzes.",
      tone: "text-muted",
      icon: ScanText,
    };
  }

  if (extraction.status === "completed") {
    return {
      label: "AI-ready",
      detail: `${extraction.chunk_count ?? 0} chunk${Number(extraction.chunk_count) === 1 ? "" : "s"} extracted`,
      tone: "text-success",
      icon: CheckCircle2,
    };
  }

  if (extraction.status === "processing" || extraction.status === "queued") {
    return {
      label: "Preparing for AI",
      detail: "Source text is being prepared.",
      tone: "text-warning",
      icon: Loader2,
    };
  }

  return {
    label: "AI scan failed",
    detail: extraction.error || "Try again or use a different source file.",
    tone: "text-danger",
    icon: AlertCircle,
  };
}

function buildChunkPreview(chunks) {
  return chunks
    .map((chunk) => {
      const page = chunk.page_number ? `Page ${chunk.page_number}` : "Source";
      return `${page}: ${chunk.text}`;
    })
    .join("\n\n")
    .slice(0, 900);
}

function AttachmentCard({
  attachment,
  previewUrl,
  extraction,
  chunks,
  extracting,
  previewOpen,
  onOpen,
  onDelete,
  onExtract,
  onTogglePreview,
  deleting,
}) {
  const isImage = attachment.file_type?.startsWith("image/");
  const status = getExtractionStatus(extraction);
  const StatusIcon = status.icon;
  const canPreview = extraction?.status === "completed" && chunks.length > 0;
  const canExtract = !extracting && !["queued", "processing"].includes(extraction?.status);

  return (
    <div className="rounded-2xl border border-border/80 bg-background/60 p-3 transition duration-200 hover:border-strong-border/70 hover:bg-card-hover/70">
      <div className="flex gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/80 bg-card/90">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : attachment.file_type === "application/pdf" ? (
            <FileText className="h-7 w-7 text-danger" />
          ) : (
            <File className="h-7 w-7 text-secondary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary">{attachment.file_name}</p>
          <p className="mt-1 text-xs text-muted">
            {fileKind(attachment.file_type)} | {formatFileSize(attachment.file_size)}
          </p>
          <p className="mt-1 text-xs text-muted">Uploaded {formatUpdated(attachment)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border/70 bg-card/60 p-3">
        <div className="flex items-start gap-2">
          <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${status.tone} ${extracting ? "animate-spin" : ""}`} />
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${status.tone}`}>{status.label}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{status.detail}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpen(attachment)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/90 px-3 py-2 text-xs font-semibold text-secondary transition duration-200 hover:border-strong-border hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </button>
        <button
          type="button"
          onClick={() => onExtract(attachment)}
          disabled={!canExtract}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/90 px-3 py-2 text-xs font-semibold text-secondary transition duration-200 hover:border-strong-border hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanText className="h-3.5 w-3.5" />}
          {extraction?.status === "failed" ? "Retry scan" : extraction?.status === "completed" ? "Re-scan" : "Prepare"}
        </button>
        <button
          type="button"
          onClick={() => onTogglePreview(attachment.id)}
          disabled={!canPreview}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/90 px-3 py-2 text-xs font-semibold text-secondary transition duration-200 hover:border-strong-border hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {previewOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          Preview
        </button>
        <button
          type="button"
          onClick={() => onDelete(attachment)}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/90 px-3 py-2 text-xs font-semibold text-secondary transition duration-200 hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>

      {previewOpen && canPreview && (
        <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-border/80 bg-background/80 p-3 text-xs leading-5 text-secondary">
          <pre className="whitespace-pre-wrap font-sans">{buildChunkPreview(chunks)}</pre>
        </div>
      )}
    </div>
  );
}

export default function AttachmentUploader({
  attachments,
  previewUrls,
  extractionByAttachmentId = {},
  chunksByAttachmentId = {},
  uploading,
  extractingId,
  previewExtractionId,
  deletingId,
  onUpload,
  onOpen,
  onDelete,
  onExtract,
  onTogglePreview,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList) {
    const files = Array.from(fileList ?? []);
    if (files.length) onUpload(files);
  }

  return (
    <CommandCard className="p-4 sm:p-5">
      <CardHeader eyebrow="Sources" title="Attachments" icon={Paperclip} />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-2xl border border-dashed p-5 text-center transition duration-200 sm:p-6 ${
          dragging ? "border-strong-border bg-button/15" : "border-border/90 bg-background/55 hover:border-strong-border/70 hover:bg-background/70"
        }`}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-secondary" />
        <p className="mt-3 text-sm font-semibold text-primary">Drop PDFs or images</p>
        <p className="mt-2 text-xs leading-5 text-muted">PDF, JPG, PNG, and WEBP up to {MAX_ATTACHMENT_SIZE_LABEL}.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-strong-border/90 bg-button px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-button/15 transition duration-200 hover:-translate-y-0.5 hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
          className="hidden"
        />
      </div>

      <div className="mt-4 grid gap-3">
        {attachments.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-background/55 p-4 text-sm leading-6 text-secondary">
            Attach lecture PDFs, whiteboard photos, textbook screenshots, or diagrams. Xevaro prepares uploaded sources for summaries, flashcards, and quiz generation automatically.
          </div>
        ) : (
          attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              previewUrl={previewUrls[attachment.id]}
              extraction={extractionByAttachmentId[attachment.id]}
              chunks={chunksByAttachmentId[attachment.id] ?? []}
              extracting={extractingId === attachment.id}
              previewOpen={previewExtractionId === attachment.id}
              onOpen={onOpen}
              onDelete={onDelete}
              onExtract={onExtract}
              onTogglePreview={onTogglePreview}
              deleting={deletingId === attachment.id}
            />
          ))
        )}
      </div>
    </CommandCard>
  );
}
