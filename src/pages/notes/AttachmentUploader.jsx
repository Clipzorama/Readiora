import { useRef, useState } from "react";
import {
  ExternalLink,
  File,
  FileText,
  Paperclip,
  Plus,
  UploadCloud,
  X,
} from "lucide-react";
import {
  CardHeader,
  CommandCard,
} from "../../components/WarRoomLayout";
import { MAX_ATTACHMENT_SIZE_LABEL } from "../../services/noteAttachmentsService";
import { fileKind, formatFileSize, formatUpdated } from "./noteUtils";

function AttachmentCard({ attachment, previewUrl, onOpen, onDelete, deleting }) {
  const isImage = attachment.file_type?.startsWith("image/");

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
          onClick={() => onDelete(attachment)}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/90 px-3 py-2 text-xs font-semibold text-secondary transition duration-200 hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>
    </div>
  );
}

export default function AttachmentUploader({
  attachments,
  previewUrls,
  uploading,
  deletingId,
  onUpload,
  onOpen,
  onDelete,
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
            Attach lecture PDFs, whiteboard photos, textbook screenshots, or diagrams. These records are ready for later OCR, summarization, flashcards, and quiz generation.
          </div>
        ) : (
          attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              previewUrl={previewUrls[attachment.id]}
              onOpen={onOpen}
              onDelete={onDelete}
              deleting={deletingId === attachment.id}
            />
          ))
        )}
      </div>
    </CommandCard>
  );
}
